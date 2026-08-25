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
	const identityWorkflow = fs.readFileSync(
		path.join(__dirname, '..', '..', '.github', 'workflows', 'verify-marketplace-identity.yml'),
		'utf8'
	);
	const runtimeWorkflow = fs.readFileSync(
		path.join(__dirname, '..', '..', '.github', 'workflows', 'runtime-installation.yml'),
		'utf8'
	);

	it('supports recovery from an existing immutable annotated tag', () => {
		assert.match(workflow, /workflow_dispatch:[\s\S]*?release_tag:/);
		assert.match(workflow, /release_tag: \$\{\{ inputs\.release_tag \|\| github\.ref_name \}\}/);
	});

	it('binds the runtime matrix to the same immutable release tag', () => {
		assert.match(workflow, /candidate_ref: \$\{\{ inputs\.release_tag \|\| github\.ref_name \}\}/);
		assert.match(runtimeWorkflow, /inputs\.release_candidate == true/);
		assert.ok(!runtimeWorkflow.includes("github.event_name == 'workflow_call'"));
		assert.ok(!runtimeWorkflow.includes('cache: npm'));
		const candidateRefs =
			runtimeWorkflow.match(
				/ref: \$\{\{ inputs\.candidate_ref \|\| github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/gu
			) || [];
		assert.strictEqual(candidateRefs.length, 4);
	});

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

	it('uses Entra workload identity for Marketplace publishing without a VSCE PAT', () => {
		const marketplaceJob = workflow.match(/  publish-marketplace:[\s\S]*?(?=\n  publish-open-vsx:)/u)?.[0];
		assert.ok(marketplaceJob);
		assert.match(marketplaceJob, /id-token: write/);
		assert.match(marketplaceJob, /azure\/login@[0-9a-f]{40} # v3\.0\.1/);
		assert.match(marketplaceJob, /client-id: \$\{\{ vars\.AZURE_CLIENT_ID \}\}/);
		assert.match(marketplaceJob, /allow-no-subscriptions: true/);
		assert.ok(!marketplaceJob.includes('subscription-id:'));
		assert.match(marketplaceJob, /vsce verify-pat Singular-Ray --azure-credential/);
		assert.strictEqual((marketplaceJob.match(/vsce publish --azure-credential/gu) || []).length, 2);
		assert.ok(!marketplaceJob.includes('VSCE_PAT'));
	});

	it('keeps the Marketplace identity resolver non-publishing', () => {
		assert.match(identityWorkflow, /workflow_dispatch:/);
		assert.match(identityWorkflow, /verify_membership:/);
		assert.match(identityWorkflow, /id-token: write/);
		assert.match(identityWorkflow, /_apis\/profile\/profiles\/me/);
		assert.match(identityWorkflow, /vsce verify-pat Singular-Ray --azure-credential/);
		assert.ok(!identityWorkflow.includes('vsce publish'));
		assert.ok(!identityWorkflow.includes('ovsx publish'));
	});

	it('provides explicit repository context to GitHub CLI jobs', () => {
		const repositoryContexts = workflow.match(/GH_REPO: \$\{\{ github\.repository \}\}/gu) || [];
		assert.strictEqual(repositoryContexts.length, 2);
	});
});

describe('GitHub Release recovery workflow contract', () => {
	const workflow = fs.readFileSync(
		path.join(__dirname, '..', '..', '.github', 'workflows', 'recover-github-release.yml'),
		'utf8'
	);

	it('reuses a failed publish run artifact without republishing marketplaces', () => {
		assert.match(workflow, /source_run_id:/);
		assert.match(workflow, /actions: read/);
		assert.match(workflow, /github-token: \$\{\{ github\.token \}\}/);
		assert.match(workflow, /run-id: \$\{\{ inputs\.source_run_id \}\}/);
		assert.match(workflow, /\.name == "Publish VS Code Extension" and \.conclusion == "failure"/);
		assert.ok(!workflow.includes('vsce publish'));
		assert.ok(!workflow.includes('ovsx publish'));
	});

	it('revalidates the tag, metadata, archive, and checksum before publishing', () => {
		assert.match(workflow, /npm run release:prepare -- --verify-tag/);
		assert.match(workflow, /unzip -tqq "\$VSIX_NAME"/);
		assert.match(workflow, /sha256sum --check "\$CHECKSUM_NAME"/);
		assert.match(workflow, /GH_REPO: \$\{\{ github\.repository \}\}/);
	});
});

describe('GitHub workflow context contract', () => {
	for (const workflowName of ['ci.yml', 'publish.yml', 'recover-github-release.yml']) {
		it(`${workflowName} does not evaluate runner.temp before a runner exists`, () => {
			const workflow = fs.readFileSync(
				path.join(__dirname, '..', '..', '.github', 'workflows', workflowName),
				'utf8'
			);
			assert.ok(!workflow.includes('${{ runner.temp }}'));
		});
	}

	it('archives coverage before upload so generated filenames remain portable', () => {
		const workflow = fs.readFileSync(
			path.join(__dirname, '..', '..', '.github', 'workflows', 'ci.yml'),
			'utf8'
		);
		assert.match(workflow, /tar -czf coverage-linux\.tar\.gz coverage/);
		assert.match(workflow, /path: coverage-linux\.tar\.gz/);
	});

	it('checks out release jobs at the requested tag and restores its annotated object', () => {
		const workflow = fs.readFileSync(
			path.join(__dirname, '..', '..', '.github', 'workflows', 'ci.yml'),
			'utf8'
		);
		const releaseRefs = workflow.match(/ref: \$\{\{ inputs\.release_tag \|\| github\.sha \}\}/gu) || [];
		assert.strictEqual(releaseRefs.length, 3);
		assert.match(workflow, /git fetch --force --no-tags origin "refs\/tags\/\$\{RELEASE_TAG\}:refs\/tags\/\$\{RELEASE_TAG\}"/);
	});
});

describe('VS Code test isolation contract', () => {
	const config = fs.readFileSync(path.join(__dirname, '..', '..', '.vscode-test.mjs'), 'utf8');

	it('keeps unit tests isolated from user-installed extensions', () => {
		assert.match(config, /const unitExtensionsDir =/);
		assert.match(config, /label: 'unit'[\s\S]*?--extensions-dir=\$\{unitExtensionsDir\}/);
	});

	it('reserves the user extension directory for integration tests', () => {
		assert.match(config, /const integrationExtensionsDir =/);
		assert.match(config, /label: 'integration'[\s\S]*?--extensions-dir=\$\{integrationExtensionsDir\}/);
	});
});
