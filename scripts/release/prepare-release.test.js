const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { finalizeArtifact, verifyRelease } = require('./prepare-release');

function createFixture(options = {}) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'singular-blockly-release-'));
	const version = options.packageVersion || '1.2.3';
	const lockVersion = options.lockVersion || version;
	fs.writeFileSync(
		path.join(root, 'package.json'),
		JSON.stringify({ version, repository: { url: 'https://github.com/example/singular-blockly.git' } })
	);
	fs.writeFileSync(
		path.join(root, 'package-lock.json'),
		JSON.stringify({ version: lockVersion, packages: { '': { version: options.lockRootVersion || lockVersion } } })
	);
	fs.writeFileSync(
		path.join(root, 'CHANGELOG.md'),
		options.changelog || '## [1.2.3] - 2026-08-10\n\n- 中文更新\n  English update\n\n## [1.2.2] - 2026-08-01\n'
	);
	return root;
}

describe('release preparation', () => {
	const roots = [];

	afterEach(() => {
		for (const root of roots.splice(0)) {
			fs.rmSync(root, { recursive: true, force: true });
		}
	});

	it('accepts matching package, lockfile, changelog, and annotated tag', () => {
		const root = createFixture();
		roots.push(root);
		const result = verifyRelease(root, 'v1.2.3', {
			requireAnnotatedTag: true,
			tagType: 'tag',
			tagCommit: 'abc123',
			headCommit: 'abc123',
		});

		assert.strictEqual(result.vsixName, 'singular-blockly-1.2.3.vsix');
		assert.match(result.changelogSection, /中文更新/);
		assert.match(result.changelogSection, /English update/);
	});

	it('rejects a tag that disagrees with package.json', () => {
		const root = createFixture({ packageVersion: '1.2.4', lockVersion: '1.2.4' });
		roots.push(root);
		assert.throws(() => verifyRelease(root, 'v1.2.3'), /package\.json version 1\.2\.4/);
	});

	it('rejects lockfile version disagreement', () => {
		const root = createFixture({ lockVersion: '1.2.2' });
		roots.push(root);
		assert.throws(() => verifyRelease(root, 'v1.2.3'), /package-lock\.json versions/);
	});

	it('rejects a lightweight tag', () => {
		const root = createFixture();
		roots.push(root);
		assert.throws(
			() => verifyRelease(root, 'v1.2.3', { requireAnnotatedTag: true, tagType: 'commit' }),
			/must be an annotated tag/
		);
	});

	it('rejects a tag that does not point to the release checkout', () => {
		const root = createFixture();
		roots.push(root);
		assert.throws(
			() =>
				verifyRelease(root, 'v1.2.3', {
					requireAnnotatedTag: true,
					tagType: 'tag',
					tagCommit: 'abc123',
					headCommit: 'def456',
				}),
			/does not point|points to/
		);
	});

	it('rejects a missing changelog section', () => {
		const root = createFixture({ changelog: '## [1.2.2] - 2026-08-01\n' });
		roots.push(root);
		assert.throws(() => verifyRelease(root, 'v1.2.3'), /CHANGELOG\.md is missing/);
	});

	it('rejects release notes that are not bilingual', () => {
		const root = createFixture({ changelog: '## [1.2.3] - 2026-08-10\n\n- English only\n' });
		roots.push(root);
		assert.throws(() => verifyRelease(root, 'v1.2.3'), /both Chinese and English/);
	});

	it('rejects Chinese-only notes containing an English product name', () => {
		const root = createFixture({ changelog: '## [1.2.3] - 2026-08-10\n\n- 修正 GitHub 發布流程\n' });
		roots.push(root);
		assert.throws(() => verifyRelease(root, 'v1.2.3'), /both Chinese and English/);
	});

	it('writes bilingual notes and a deterministic SHA-256 file', () => {
		const root = createFixture();
		roots.push(root);
		const artifactDirectory = path.join(root, 'release-artifacts');
		fs.mkdirSync(artifactDirectory);
		const contents = Buffer.from('fake-vsix');
		fs.writeFileSync(path.join(artifactDirectory, 'singular-blockly-1.2.3.vsix'), contents);

		const result = finalizeArtifact(root, verifyRelease(root, 'v1.2.3'), artifactDirectory);
		const expected = crypto.createHash('sha256').update(contents).digest('hex');
		const notes = fs.readFileSync(result.notesPath, 'utf8');

		assert.strictEqual(result.checksum, expected);
		assert.strictEqual(fs.readFileSync(result.checksumPath, 'utf8'), `${expected}  singular-blockly-1.2.3.vsix\n`);
		assert.match(notes, /中文更新/);
		assert.match(notes, /English update/);
		assert.match(notes, new RegExp(expected));
	});
});

describe('publish workflow retry contract', () => {
	const workflow = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'publish.yml'), 'utf8');

	it('keeps first marketplace attempts strict', () => {
		const strictSteps = workflow.match(/if: github\.run_attempt == 1[\s\S]*?run: [^\n]+/gu) || [];
		assert.strictEqual(strictSteps.length, 2);
		assert.ok(strictSteps.every(step => !step.includes('--skip-duplicate')));
	});

	it('allows duplicate versions only when retrying failed marketplace jobs', () => {
		const retrySteps = workflow.match(/if: github\.run_attempt > 1[\s\S]*?run: [^\n]+/gu) || [];
		assert.strictEqual(retrySteps.length, 2);
		assert.ok(retrySteps.every(step => step.includes('--skip-duplicate')));
	});
});

describe('GitHub workflow context contract', () => {
	for (const workflowName of ['ci.yml', 'i18n-audit.yml', 'publish.yml']) {
		it(`${workflowName} does not evaluate runner.temp before a runner exists`, () => {
			const workflow = fs.readFileSync(
				path.join(__dirname, '..', '..', '.github', 'workflows', workflowName),
				'utf8'
			);
			assert.ok(!workflow.includes('${{ runner.temp }}'));
		});
	}
});
