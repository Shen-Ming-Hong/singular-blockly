/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { FileService } from './fileService';
import { log } from './logging';
import {
	InstalledSkillManifest,
	PackagedSkillManifest,
	PROJECT_SKILL_MANAGER,
	PROJECT_SKILL_MANIFEST_PATH,
	PROJECT_SKILL_SCHEMA_VERSION,
	PROJECT_SKILL_STATUS_PATH,
	SkillIssue,
	SkillStatus,
} from '../types/projectSkill';

const PACKAGED_MANIFEST = 'managed-manifest.json';
const BACKUP_ROOT = 'blockly/.singular-blockly/skill-backups';

interface OriginalFile {
	path: string;
	bytes?: Buffer;
}

export type EnsureProjectSkillResult = 'no-change' | 'ready' | 'conflict' | 'failed';

/** Installs and updates the hidden project-local Agent Skill without prompting or notifying users. */
export class ProjectSkillService {
	private static readonly operations = new Map<string, Promise<EnsureProjectSkillResult>>();
	private readonly fileService: FileService;
	private readonly sourceRoot: string;
	private readonly workspaceKey: string;

	constructor(
		workspaceRoot: string,
		extensionPath: string,
		fileService?: FileService,
		private readonly now: () => Date = () => new Date()
	) {
		this.workspaceKey = path.resolve(workspaceRoot);
		this.fileService = fileService || new FileService(workspaceRoot);
		const packaged = path.join(extensionPath, 'dist', 'project-skills', 'singular-blockly');
		const development = path.join(extensionPath, 'resources', 'project-skills', 'singular-blockly');
		this.sourceRoot = fs.existsSync(path.join(development, PACKAGED_MANIFEST)) ? development : packaged;
	}

	static isBlocklyProject(workspaceRoot: string): boolean {
		return new FileService(workspaceRoot).fileExists('blockly');
	}

	ensureInstalled(): Promise<EnsureProjectSkillResult> {
		const previous = ProjectSkillService.operations.get(this.workspaceKey) || Promise.resolve('no-change' as const);
		const operation = previous.then(
			() => this.ensureInstalledOnce(),
			() => this.ensureInstalledOnce()
		);
		ProjectSkillService.operations.set(this.workspaceKey, operation);
		const cleanup = () => {
			if (ProjectSkillService.operations.get(this.workspaceKey) === operation) {
				ProjectSkillService.operations.delete(this.workspaceKey);
			}
		};
		void operation.then(cleanup, cleanup);
		return operation;
	}

	private async ensureInstalledOnce(): Promise<EnsureProjectSkillResult> {
		let packaged: PackagedSkillManifest;
		try {
			packaged = this.loadPackagedManifest();
		} catch {
			await this.writeFailureStatus('INVALID_BUNDLE', null, 'RETRY_ON_WRITABLE_WORKSPACE');
			log('Project Skill installation failed: INVALID_BUNDLE', 'warn');
			return 'failed';
		}

		const installed = await this.readInstalledManifest();
		if (!installed && this.hasUnmanagedConflict(packaged)) {
			await this.writeStatus({
				status: 'conflict',
				skillVersion: null,
				backupPaths: [],
				issues: [{ code: 'UNMANAGED_CONFLICT', path: null, action: 'INSPECT_CONFLICT' }],
			});
			log('Project Skill installation stopped: UNMANAGED_CONFLICT', 'warn');
			return 'conflict';
		}
		if (installed) {
			const oldTargets = new Set(installed.managedFiles.map(file => file.path));
			const unmanagedTarget = packaged.managedFiles.find(
				file => this.fileService.fileExists(file.target) && !oldTargets.has(file.target)
			);
			if (unmanagedTarget) {
				await this.writeStatus({
					status: 'conflict',
					skillVersion: installed.skillVersion,
					backupPaths: [],
					issues: [{ code: 'UNMANAGED_CONFLICT', path: unmanagedTarget.target, action: 'INSPECT_CONFLICT' }],
				});
				log('Project Skill update stopped: UNMANAGED_CONFLICT', 'warn');
				return 'conflict';
			}
		}

		if (installed && (await this.isCurrent(packaged, installed))) {
			if (await this.hasCurrentReadyStatus(packaged.skillVersion)) {return 'no-change';}
			try {
				await this.writeStatus({
					status: 'ready',
					skillVersion: packaged.skillVersion,
					backupPaths: [],
					issues: [],
				}, true);
				return 'ready';
			} catch {
				log('Project Skill status repair failed: STATUS_WRITE_FAILED', 'warn');
				return 'failed';
			}
		}

		const timestamp = ProjectSkillService.timestamp(this.now());
		const backupDirectory = `${BACKUP_ROOT}/${timestamp}`;
		const originals: OriginalFile[] = [];
		const backupPaths: string[] = [];
		let writeStarted = false;
		try {
			const oldHashes = new Map((installed?.managedFiles || []).map(file => [file.path, file.sha256]));
			for (const managed of packaged.managedFiles) {
				if (!this.fileService.fileExists(managed.target)) {continue;}
				const existing = await this.fileService.readBuffer(managed.target);
				const oldHash = oldHashes.get(managed.target);
				if (!oldHash || ProjectSkillService.sha256(existing) !== oldHash) {
					const backupPath = `${backupDirectory}/${managed.target}`;
					await this.fileService.writeFileAtomic(backupPath, existing);
					backupPaths.push(backupPath);
				}
			}

			const writes: Array<{ target: string; bytes: Buffer }> = packaged.managedFiles.map(managed => ({
				target: managed.target,
				bytes: fs.readFileSync(this.resolveSource(managed.source)),
			}));
			for (const preserved of packaged.preservedFiles) {
				if (!this.fileService.fileExists(preserved.target)) {
					writes.push({ target: preserved.target, bytes: fs.readFileSync(this.resolveSource(preserved.source)) });
				}
			}

			for (const write of writes) {
				originals.push({
					path: write.target,
					bytes: this.fileService.fileExists(write.target) ? await this.fileService.readBuffer(write.target) : undefined,
				});
				writeStarted = true;
				await this.fileService.writeFileAtomic(write.target, write.bytes);
			}

			const installedManifest: InstalledSkillManifest = {
				schemaVersion: PROJECT_SKILL_SCHEMA_VERSION,
				manager: PROJECT_SKILL_MANAGER,
				skillVersion: packaged.skillVersion,
				managedFiles: packaged.managedFiles.map(file => ({ path: file.target, sha256: file.sha256, kind: file.kind })),
				preservedFiles: packaged.preservedFiles.map(file => file.target),
			};
			originals.push({
				path: PROJECT_SKILL_MANIFEST_PATH,
				bytes: this.fileService.fileExists(PROJECT_SKILL_MANIFEST_PATH)
					? await this.fileService.readBuffer(PROJECT_SKILL_MANIFEST_PATH)
					: undefined,
			});
			await this.fileService.writeFileAtomic(
				PROJECT_SKILL_MANIFEST_PATH,
				`${JSON.stringify(installedManifest, null, 2)}\n`
			);
			await this.writeStatus({
				status: 'ready',
				skillVersion: packaged.skillVersion,
				backupPaths: backupPaths.length ? [backupDirectory] : [],
				issues: [],
			}, true);
			log(`Project Skill ${installed ? 'updated' : 'installed'} successfully`, 'info');
			return 'ready';
		} catch {
			let rollbackFailed = false;
			if (writeStarted) {
				for (const original of originals.reverse()) {
					try {
						if (original.bytes !== undefined) {await this.fileService.writeFileAtomic(original.path, original.bytes);}
						else {await this.fileService.deleteFile(original.path);}
					} catch {
						rollbackFailed = true;
					}
				}
			}
			await this.writeStatus({
				status: 'failed',
				skillVersion: null,
				backupPaths: backupPaths.length ? [backupDirectory] : [],
				issues: [{
					code: rollbackFailed ? 'ROLLBACK_FAILED' : 'WRITE_FAILED',
					path: null,
					action: rollbackFailed ? 'RESTORE_BACKUP' : 'RETRY_ON_WRITABLE_WORKSPACE',
				}],
			});
			log(`Project Skill installation failed: ${rollbackFailed ? 'ROLLBACK_FAILED' : 'WRITE_FAILED'}`, 'warn');
			return 'failed';
		}
	}

	private loadPackagedManifest(): PackagedSkillManifest {
		const manifestPath = this.resolveSource(PACKAGED_MANIFEST);
		const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PackagedSkillManifest;
		if (
			parsed.schemaVersion !== PROJECT_SKILL_SCHEMA_VERSION ||
			parsed.manager !== PROJECT_SKILL_MANAGER ||
			parsed.manifestTarget !== PROJECT_SKILL_MANIFEST_PATH ||
			!Array.isArray(parsed.managedFiles) ||
			!Array.isArray(parsed.preservedFiles) ||
			parsed.managedFiles.some(file => file.target === PROJECT_SKILL_MANIFEST_PATH)
		) {
			throw new Error('INVALID_BUNDLE');
		}
		const targets = new Set<string>();
		for (const file of parsed.managedFiles) {
			this.fileService.resolveSafePath(file.target);
			if (targets.has(file.target) || !/^[a-f0-9]{64}$/.test(file.sha256)) {throw new Error('INVALID_BUNDLE');}
			const bytes = fs.readFileSync(this.resolveSource(file.source));
			if (ProjectSkillService.sha256(bytes) !== file.sha256) {throw new Error('INVALID_BUNDLE');}
			targets.add(file.target);
		}
		for (const file of parsed.preservedFiles) {
			this.fileService.resolveSafePath(file.target);
			this.resolveSource(file.source);
			if (file.policy !== 'create-if-missing' || targets.has(file.target)) {throw new Error('INVALID_BUNDLE');}
			targets.add(file.target);
		}
		return parsed;
	}

	private resolveSource(relativePath: string): string {
		if (path.isAbsolute(relativePath) || relativePath.includes('\0')) {throw new Error('INVALID_BUNDLE');}
		const resolved = path.resolve(this.sourceRoot, relativePath);
		if (!resolved.startsWith(`${path.resolve(this.sourceRoot)}${path.sep}`)) {throw new Error('INVALID_BUNDLE');}
		return resolved;
	}

	private async readInstalledManifest(): Promise<InstalledSkillManifest | undefined> {
		if (!this.fileService.fileExists(PROJECT_SKILL_MANIFEST_PATH)) {return undefined;}
		try {
			const parsed = JSON.parse((await this.fileService.readBuffer(PROJECT_SKILL_MANIFEST_PATH)).toString('utf8')) as InstalledSkillManifest;
			if (
				parsed.schemaVersion !== PROJECT_SKILL_SCHEMA_VERSION ||
				parsed.manager !== PROJECT_SKILL_MANAGER ||
				!Array.isArray(parsed.managedFiles) ||
				!Array.isArray(parsed.preservedFiles) ||
				parsed.managedFiles.some(file => file.path === PROJECT_SKILL_MANIFEST_PATH)
			) {return undefined;}
			return parsed;
		} catch {
			return undefined;
		}
	}

	private hasUnmanagedConflict(packaged: PackagedSkillManifest): boolean {
		return (
			this.fileService.fileExists('.agents/skills/singular-blockly') ||
			this.fileService.fileExists('.claude/skills/singular-blockly') ||
			packaged.managedFiles.some(file => this.fileService.fileExists(file.target))
		);
	}

	private async isCurrent(packaged: PackagedSkillManifest, installed: InstalledSkillManifest): Promise<boolean> {
		if (installed.skillVersion !== packaged.skillVersion) {return false;}
		if (installed.managedFiles.length !== packaged.managedFiles.length) {return false;}
		const installedFiles = new Map(installed.managedFiles.map(file => [file.path, file.sha256]));
		for (const file of packaged.managedFiles) {
			if (installedFiles.get(file.target) !== file.sha256 || !this.fileService.fileExists(file.target)) {return false;}
			if (ProjectSkillService.sha256(await this.fileService.readBuffer(file.target)) !== file.sha256) {return false;}
		}
		return true;
	}

	private async hasCurrentReadyStatus(skillVersion: string): Promise<boolean> {
		if (!this.fileService.fileExists(PROJECT_SKILL_STATUS_PATH)) {return false;}
		try {
			const status = JSON.parse((await this.fileService.readBuffer(PROJECT_SKILL_STATUS_PATH)).toString('utf8')) as SkillStatus;
			return (
				status.schemaVersion === PROJECT_SKILL_SCHEMA_VERSION &&
				status.status === 'ready' &&
				status.skillVersion === skillVersion &&
				status.manifestPath === PROJECT_SKILL_MANIFEST_PATH &&
				Array.isArray(status.issues) &&
				status.issues.length === 0
			);
		} catch {
			return false;
		}
	}

	private async writeFailureStatus(code: SkillIssue['code'], issuePath: string | null, action: SkillIssue['action']): Promise<void> {
		await this.writeStatus({
			status: 'failed',
			skillVersion: null,
			backupPaths: [],
			issues: [{ code, path: issuePath, action }],
		});
	}

	private async writeStatus(
		input: Pick<SkillStatus, 'status' | 'skillVersion' | 'backupPaths' | 'issues'>,
		strict = false
	): Promise<void> {
		const status: SkillStatus = {
			schemaVersion: PROJECT_SKILL_SCHEMA_VERSION,
			...input,
			manifestPath: PROJECT_SKILL_MANIFEST_PATH,
			lastAttemptAt: this.now().toISOString(),
		};
		try {
			await this.fileService.writeFileAtomic(PROJECT_SKILL_STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`);
		} catch {
			log(`Project Skill status could not be written: ${input.status}`, 'warn');
			if (strict) {throw new Error('STATUS_WRITE_FAILED');}
		}
	}

	private static sha256(bytes: Uint8Array): string {
		return createHash('sha256').update(bytes).digest('hex');
	}

	private static timestamp(date: Date): string {
		return date.toISOString().replace(/[-:.]/g, '');
	}
}
