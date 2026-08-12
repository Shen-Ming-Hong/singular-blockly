/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import { FileService } from '../../services/fileService';
import { ProjectSkillService } from '../../services/projectSkillService';
import { PROJECT_SKILL_MANIFEST_PATH, PROJECT_SKILL_STATUS_PATH } from '../../types/projectSkill';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');

suite('ProjectSkillService Tests', () => {
	let workspace: string;
	const fixedNow = () => new Date('2026-08-12T08:15:30.123Z');

	setup(() => {
		workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-project-skill-'));
		fs.mkdirSync(path.join(workspace, 'blockly'), { recursive: true });
	});

	teardown(() => fs.rmSync(workspace, { recursive: true, force: true }));
	teardown(() => sinon.restore());

	function absolute(relative: string): string {
		return path.join(workspace, ...relative.split('/'));
	}

	function createMutatedBundle(
		mutate: (manifest: any) => void
	): string {
		const extensionRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-skill-bundle-'));
		const source = path.join(PROJECT_ROOT, 'resources', 'project-skills', 'singular-blockly');
		const target = path.join(extensionRoot, 'resources', 'project-skills', 'singular-blockly');
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.cpSync(source, target, { recursive: true });
		const manifestPath = path.join(target, 'managed-manifest.json');
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		mutate(manifest);
		fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
		return extensionRoot;
	}

	test('silently installs the canonical Skill, Claude entry, notes, manifest, and ready status', async () => {
		const result = await new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled();
		assert.strictEqual(result, 'ready');
		assert.ok(fs.existsSync(absolute('.agents/skills/singular-blockly/SKILL.md')));
		assert.ok(fs.existsSync(absolute('.agents/skills/singular-blockly/references/block-contract.json')));
		assert.ok(fs.existsSync(absolute('.agents/skills/singular-blockly/references/block-contract/arduino.json')));
		assert.ok(fs.existsSync(absolute('.agents/skills/singular-blockly/project-notes.md')));
		assert.ok(fs.existsSync(absolute('.claude/skills/singular-blockly/SKILL.md')));
		const manifest = JSON.parse(fs.readFileSync(absolute(PROJECT_SKILL_MANIFEST_PATH), 'utf8'));
		assert.strictEqual(manifest.manager, 'singular-blockly');
		assert.ok(!manifest.managedFiles.some((file: any) => file.path === PROJECT_SKILL_MANIFEST_PATH));
		const status = JSON.parse(fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH), 'utf8'));
		assert.strictEqual(status.status, 'ready');
		assert.deepStrictEqual(status.issues, []);
	});

	test('falls back to packaged Skill shards when development resources are absent', async () => {
		const extensionRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-packaged-skill-'));
		try {
			const source = path.join(PROJECT_ROOT, 'resources', 'project-skills', 'singular-blockly');
			const target = path.join(extensionRoot, 'dist', 'project-skills', 'singular-blockly');
			fs.mkdirSync(path.dirname(target), { recursive: true });
			fs.cpSync(source, target, { recursive: true });
			assert.strictEqual(
				await new ProjectSkillService(workspace, extensionRoot, undefined, fixedNow).ensureInstalled(),
				'ready'
			);
			assert.ok(fs.existsSync(absolute('.agents/skills/singular-blockly/references/block-contract/logic.json')));
		} finally {
			fs.rmSync(extensionRoot, { recursive: true, force: true });
		}
	});

	test('detects Blockly projects and supports the production timestamp provider', async () => {
		assert.strictEqual(ProjectSkillService.isBlocklyProject(workspace), true);
		assert.strictEqual(ProjectSkillService.isBlocklyProject(path.join(workspace, 'missing')), false);
		assert.strictEqual(await new ProjectSkillService(workspace, PROJECT_ROOT).ensureInstalled(), 'ready');
		assert.match(
			JSON.parse(fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH), 'utf8')).lastAttemptAt,
			/^\d{4}-\d{2}-\d{2}T/
		);
	});

	test('no-change activation does not rewrite status or managed files', async () => {
		const service = new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow);
		assert.strictEqual(await service.ensureInstalled(), 'ready');
		const statusBefore = fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH));
		const skillBefore = fs.readFileSync(absolute('.agents/skills/singular-blockly/SKILL.md'));
		assert.strictEqual(await service.ensureInstalled(), 'no-change');
		assert.deepStrictEqual(fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH)), statusBefore);
		assert.deepStrictEqual(fs.readFileSync(absolute('.agents/skills/singular-blockly/SKILL.md')), skillBefore);
	});

	test('updates a modified managed file after a byte-exact backup and preserves project notes', async () => {
		const service = new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow);
		await service.ensureInstalled();
		const skillPath = absolute('.agents/skills/singular-blockly/SKILL.md');
		const notesPath = absolute('.agents/skills/singular-blockly/project-notes.md');
		const userSkill = Buffer.from('user modified managed bytes\n');
		fs.writeFileSync(skillPath, userSkill);
		fs.writeFileSync(notesPath, 'Keep this wiring note.\n');

		assert.strictEqual(await service.ensureInstalled(), 'ready');
		const backup = absolute('blockly/.singular-blockly/skill-backups/20260812T081530123Z/.agents/skills/singular-blockly/SKILL.md');
		assert.deepStrictEqual(fs.readFileSync(backup), userSkill);
		assert.strictEqual(fs.readFileSync(notesPath, 'utf8'), 'Keep this wiring note.\n');
		assert.notDeepStrictEqual(fs.readFileSync(skillPath), userSkill);
	});

	test('preserves custom files that are not in either trusted manifest allowlist', async () => {
		const service = new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow);
		await service.ensureInstalled();
		const custom = absolute('.agents/skills/singular-blockly/my-notes.txt');
		fs.writeFileSync(custom, 'private project content');
		await service.ensureInstalled();
		assert.strictEqual(fs.readFileSync(custom, 'utf8'), 'private project content');
	});

	test('reports a conflict for an unmanaged same-name Skill and does not overwrite it', async () => {
		const unmanaged = absolute('.agents/skills/singular-blockly/SKILL.md');
		fs.mkdirSync(path.dirname(unmanaged), { recursive: true });
		fs.writeFileSync(unmanaged, 'user-owned skill');
		const result = await new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled();
		assert.strictEqual(result, 'conflict');
		assert.strictEqual(fs.readFileSync(unmanaged, 'utf8'), 'user-owned skill');
		const status = JSON.parse(fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH), 'utf8'));
		assert.strictEqual(status.status, 'conflict');
		assert.strictEqual(status.issues[0].code, 'UNMANAGED_CONFLICT');
	});

	test('missing packaged source degrades to a stable failed status', async () => {
		const missingExtension = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-missing-extension-'));
		try {
			const result = await new ProjectSkillService(workspace, missingExtension, undefined, fixedNow).ensureInstalled();
			assert.strictEqual(result, 'failed');
			const status = JSON.parse(fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH), 'utf8'));
			assert.strictEqual(status.issues[0].code, 'INVALID_BUNDLE');
		} finally {
			fs.rmSync(missingExtension, { recursive: true, force: true });
		}
	});

	test('repairs a missing ready status without rewriting managed files', async () => {
		const service = new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow);
		await service.ensureInstalled();
		const skillPath = absolute('.agents/skills/singular-blockly/SKILL.md');
		const skillBefore = fs.readFileSync(skillPath);
		fs.unlinkSync(absolute(PROJECT_SKILL_STATUS_PATH));

		assert.strictEqual(await service.ensureInstalled(), 'ready');
		assert.deepStrictEqual(fs.readFileSync(skillPath), skillBefore);
		assert.strictEqual(JSON.parse(fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH), 'utf8')).status, 'ready');
	});

	test('reports failure when a current installation cannot repair its ready status', async () => {
		await new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled();
		fs.unlinkSync(absolute(PROJECT_SKILL_STATUS_PATH));
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === PROJECT_SKILL_STATUS_PATH) {throw new Error('read-only status');}
			await original(relative, content);
		});

		assert.strictEqual(
			await new ProjectSkillService(workspace, PROJECT_ROOT, fileService, fixedNow).ensureInstalled(),
			'failed'
		);
	});

	test('repairs an unreadable ready status from the trusted manifest', async () => {
		const service = new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow);
		await service.ensureInstalled();
		fs.writeFileSync(absolute(PROJECT_SKILL_STATUS_PATH), '{');

		assert.strictEqual(await service.ensureInstalled(), 'ready');
		assert.strictEqual(JSON.parse(fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH), 'utf8')).status, 'ready');
	});

	test('replaces an older trusted manifest without backing up unmodified managed bytes', async () => {
		const service = new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow);
		await service.ensureInstalled();
		const manifestPath = absolute(PROJECT_SKILL_MANIFEST_PATH);
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		manifest.skillVersion = '0.9.0';
		manifest.managedFiles.push({ path: '.agents/skills/singular-blockly/user-owned.txt', sha256: '0'.repeat(64), kind: 'reference' });
		fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
		fs.writeFileSync(absolute('.agents/skills/singular-blockly/user-owned.txt'), 'preserve me');

		assert.strictEqual(await service.ensureInstalled(), 'ready');
		assert.strictEqual(fs.readFileSync(absolute('.agents/skills/singular-blockly/user-owned.txt'), 'utf8'), 'preserve me');
		assert.strictEqual(fs.existsSync(absolute('blockly/.singular-blockly/skill-backups/20260812T081530123Z')), false);
	});

	test('updates a version-control-reverted Skill and backs up later user edits byte-for-byte', async () => {
		const service = new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow);
		await service.ensureInstalled();
		const skillRelative = '.agents/skills/singular-blockly/SKILL.md';
		const manifestPath = absolute(PROJECT_SKILL_MANIFEST_PATH);
		const revertedBytes = Buffer.from('---\nname: singular-blockly\ndescription: Older tracked Skill.\n---\n');
		const userBytes = Buffer.concat([revertedBytes, Buffer.from('\nUser adjustment after the version-control revert.\n')]);
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		manifest.skillVersion = '0.8.0';
		manifest.managedFiles.find((file: any) => file.path === skillRelative).sha256 = createHash('sha256')
			.update(revertedBytes)
			.digest('hex');
		fs.writeFileSync(absolute(skillRelative), userBytes);
		fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

		assert.strictEqual(await service.ensureInstalled(), 'ready');
		const backup = absolute(
			'blockly/.singular-blockly/skill-backups/20260812T081530123Z/.agents/skills/singular-blockly/SKILL.md'
		);
		assert.deepStrictEqual(fs.readFileSync(backup), userBytes);
		assert.notDeepStrictEqual(fs.readFileSync(absolute(skillRelative)), userBytes);
	});

	test('does not let a newer packaged manifest claim an existing target absent from the old allowlist', async () => {
		const service = new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow);
		await service.ensureInstalled();
		const manifestPath = absolute(PROJECT_SKILL_MANIFEST_PATH);
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		const claude = manifest.managedFiles.find((file: any) => file.path === '.claude/skills/singular-blockly/SKILL.md');
		manifest.managedFiles = manifest.managedFiles.filter((file: any) => file !== claude);
		fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
		const userEntry = Buffer.from('user-owned compatibility entry\n');
		fs.writeFileSync(absolute('.claude/skills/singular-blockly/SKILL.md'), userEntry);

		assert.strictEqual(await service.ensureInstalled(), 'conflict');
		assert.deepStrictEqual(fs.readFileSync(absolute('.claude/skills/singular-blockly/SKILL.md')), userEntry);
		const status = JSON.parse(fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH), 'utf8'));
		assert.strictEqual(status.issues[0].path, '.claude/skills/singular-blockly/SKILL.md');
	});

	test('cancels an update when the byte-exact backup cannot be written', async () => {
		await new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled();
		const skillRelative = '.agents/skills/singular-blockly/SKILL.md';
		const userBytes = Buffer.from('user managed bytes\n');
		fs.writeFileSync(absolute(skillRelative), userBytes);
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative.startsWith('blockly/.singular-blockly/skill-backups/')) {throw new Error('read only backup');}
			await original(relative, content);
		});

		assert.strictEqual(await new ProjectSkillService(workspace, PROJECT_ROOT, fileService, fixedNow).ensureInstalled(), 'failed');
		assert.deepStrictEqual(fs.readFileSync(absolute(skillRelative)), userBytes);
		assert.strictEqual(JSON.parse(fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH), 'utf8')).issues[0].code, 'WRITE_FAILED');
	});

	test('rolls back canonical files and manifest when the Claude entry update fails', async () => {
		await new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled();
		const skillRelative = '.agents/skills/singular-blockly/SKILL.md';
		const claudeRelative = '.claude/skills/singular-blockly/SKILL.md';
		const userBytes = Buffer.from('user managed bytes before rollback\n');
		fs.writeFileSync(absolute(skillRelative), userBytes);
		const manifestBefore = fs.readFileSync(absolute(PROJECT_SKILL_MANIFEST_PATH));
		const claudeBefore = fs.readFileSync(absolute(claudeRelative));
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		let injected = false;
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === claudeRelative && !injected) {
				injected = true;
				throw new Error('injected compatibility failure');
			}
			await original(relative, content);
		});

		assert.strictEqual(await new ProjectSkillService(workspace, PROJECT_ROOT, fileService, fixedNow).ensureInstalled(), 'failed');
		assert.deepStrictEqual(fs.readFileSync(absolute(skillRelative)), userBytes);
		assert.deepStrictEqual(fs.readFileSync(absolute(claudeRelative)), claudeBefore);
		assert.deepStrictEqual(fs.readFileSync(absolute(PROJECT_SKILL_MANIFEST_PATH)), manifestBefore);
	});

	test('removes newly created managed files when a fresh installation rolls back', async () => {
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === '.claude/skills/singular-blockly/SKILL.md') {throw new Error('compatibility write failed');}
			await original(relative, content);
		});

		assert.strictEqual(
			await new ProjectSkillService(workspace, PROJECT_ROOT, fileService, fixedNow).ensureInstalled(),
			'failed'
		);
		assert.strictEqual(fs.existsSync(absolute('.agents/skills/singular-blockly/SKILL.md')), false);
		assert.strictEqual(fs.existsSync(absolute(PROJECT_SKILL_MANIFEST_PATH)), false);
	});

	test('rejects a structurally invalid packaged manifest', async () => {
		const extensionRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-invalid-skill-bundle-'));
		try {
			const bundleRoot = path.join(extensionRoot, 'resources', 'project-skills', 'singular-blockly');
			fs.mkdirSync(bundleRoot, { recursive: true });
			fs.writeFileSync(path.join(bundleRoot, 'managed-manifest.json'), '{}');
			assert.strictEqual(
				await new ProjectSkillService(workspace, extensionRoot, undefined, fixedNow).ensureInstalled(),
				'failed'
			);
		} finally {
			fs.rmSync(extensionRoot, { recursive: true, force: true });
		}
	});

	test('rejects duplicate, untrusted, mismatched, and escaping packaged manifest entries', async () => {
		const mutations: Array<(manifest: any) => void> = [
			manifest => {manifest.managedFiles[1].target = manifest.managedFiles[0].target;},
			manifest => {manifest.managedFiles[0].sha256 = 'invalid';},
			manifest => {manifest.managedFiles[0].sha256 = '0'.repeat(64);},
			manifest => {manifest.preservedFiles[0].policy = 'replace';},
			manifest => {manifest.preservedFiles[0].target = manifest.managedFiles[0].target;},
			manifest => {manifest.managedFiles[0].source = '/outside/SKILL.md';},
			manifest => {manifest.managedFiles[0].source = '../outside/SKILL.md';},
			manifest => {manifest.managedFiles[0].source = 'canonical/\0SKILL.md';},
		];
		for (const mutate of mutations) {
			const extensionRoot = createMutatedBundle(mutate);
			const caseWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-invalid-bundle-case-'));
			try {
				fs.mkdirSync(path.join(caseWorkspace, 'blockly'), { recursive: true });
				assert.strictEqual(
					await new ProjectSkillService(caseWorkspace, extensionRoot, undefined, fixedNow).ensureInstalled(),
					'failed'
				);
			} finally {
				fs.rmSync(extensionRoot, { recursive: true, force: true });
				fs.rmSync(caseWorkspace, { recursive: true, force: true });
			}
		}
	});

	test('treats an unreadable installed manifest as unmanaged content', async () => {
		fs.mkdirSync(path.dirname(absolute(PROJECT_SKILL_MANIFEST_PATH)), { recursive: true });
		fs.writeFileSync(absolute(PROJECT_SKILL_MANIFEST_PATH), '{');

		assert.strictEqual(
			await new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled(),
			'conflict'
		);
	});

	test('treats a structurally invalid installed manifest as unmanaged content', async () => {
		fs.mkdirSync(path.dirname(absolute(PROJECT_SKILL_MANIFEST_PATH)), { recursive: true });
		fs.writeFileSync(absolute(PROJECT_SKILL_MANIFEST_PATH), JSON.stringify({ schemaVersion: 99 }));

		assert.strictEqual(
			await new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled(),
			'conflict'
		);
	});

	test('repairs trusted manifests with missing entries, wrong hashes, or missing files', async () => {
		for (const mode of ['length', 'hash', 'missing'] as const) {
			const caseWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), `sb-current-${mode}-`));
			try {
				fs.mkdirSync(path.join(caseWorkspace, 'blockly'), { recursive: true });
				const service = new ProjectSkillService(caseWorkspace, PROJECT_ROOT, undefined, fixedNow);
				await service.ensureInstalled();
				const manifestPath = path.join(caseWorkspace, ...PROJECT_SKILL_MANIFEST_PATH.split('/'));
				const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
				const managed = manifest.managedFiles[0];
				const managedPath = path.join(caseWorkspace, ...managed.path.split('/'));
				if (mode === 'length') {
					manifest.managedFiles.shift();
					fs.unlinkSync(managedPath);
				} else if (mode === 'hash') {
					managed.sha256 = '0'.repeat(64);
				} else {
					fs.unlinkSync(managedPath);
				}
				fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

				assert.strictEqual(await service.ensureInstalled(), 'ready');
				assert.strictEqual(fs.existsSync(managedPath), true);
			} finally {
				fs.rmSync(caseWorkspace, { recursive: true, force: true });
			}
		}
	});

	test('reports rollback failure with stable English and project-relative status data', async () => {
		await new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled();
		const skillRelative = '.agents/skills/singular-blockly/SKILL.md';
		const claudeRelative = '.claude/skills/singular-blockly/SKILL.md';
		fs.writeFileSync(absolute(skillRelative), 'modified');
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		let primaryFailed = false;
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === claudeRelative && !primaryFailed) {
				primaryFailed = true;
				throw new Error('primary failure');
			}
			if (primaryFailed && relative === skillRelative) {throw new Error('rollback failure');}
			await original(relative, content);
		});

		assert.strictEqual(await new ProjectSkillService(workspace, PROJECT_ROOT, fileService, fixedNow).ensureInstalled(), 'failed');
		const rawStatus = fs.readFileSync(absolute(PROJECT_SKILL_STATUS_PATH), 'utf8');
		const status = JSON.parse(rawStatus);
		assert.strictEqual(status.issues[0].code, 'ROLLBACK_FAILED');
		assert.strictEqual(status.issues[0].action, 'RESTORE_BACKUP');
		assert.ok(status.backupPaths.every((item: string) => !path.isAbsolute(item)));
		assert.ok(!rawStatus.includes(workspace));
		assert.doesNotMatch(rawStatus, /[\u3400-\u9fff\u3040-\u30ff\u0400-\u04ff]/u);
	});

	test('serializes concurrent updates so a user-modified backup cannot be overwritten by packaged bytes', async () => {
		await new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled();
		const skillRelative = '.agents/skills/singular-blockly/SKILL.md';
		const userBytes = Buffer.from('concurrent user modification\n');
		fs.writeFileSync(absolute(skillRelative), userBytes);

		const first = new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled();
		const second = new ProjectSkillService(workspace, PROJECT_ROOT, undefined, fixedNow).ensureInstalled();
		assert.deepStrictEqual(await Promise.all([first, second]), ['ready', 'no-change']);
		const backup = absolute(
			'blockly/.singular-blockly/skill-backups/20260812T081530123Z/.agents/skills/singular-blockly/SKILL.md'
		);
		assert.deepStrictEqual(fs.readFileSync(backup), userBytes);
	});
});
