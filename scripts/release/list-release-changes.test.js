const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { escapeTableCell, isVsixPath, parsePullNumber, listReleaseChanges } = require('./list-release-changes');

function git(root, args) {
	return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function commit(root, file, subject) {
	fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
	fs.writeFileSync(path.join(root, file), subject);
	git(root, ['add', file]);
	git(root, ['commit', '-q', '-m', subject]);
}

describe('release change list', () => {
	it('classifies files that ship in the VSIX', () => {
		assert.strictEqual(isVsixPath('src/services/fileService.ts'), true);
		assert.strictEqual(isVsixPath('media/locales/ja/messages.js'), true);
		assert.strictEqual(isVsixPath('package.nls.zh-hant.json'), true);
		assert.strictEqual(isVsixPath('src/test/suite/foo.test.ts'), false);
		assert.strictEqual(isVsixPath('.github/skills/git-workflow/SKILL.md'), false);
		assert.strictEqual(isVsixPath('docs/README.md'), false);
		assert.strictEqual(isVsixPath('CHANGELOG.md'), false);
	});

	it('reads the pull request number from a squash subject', () => {
		assert.strictEqual(parsePullNumber('fix(webview): 修正捲軸 (#258)'), 258);
		assert.strictEqual(parsePullNumber('docs: 沒有編號'), null);
	});

	it('escapes backslashes and pipes for a Markdown table cell', () => {
		assert.strictEqual(escapeTableCell('a|b\\c'), 'a\\|b\\\\c');
	});

	it('lists commits after the latest release tag', () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'singular-blockly-changes-'));
		try {
			git(root, ['init', '-q', '-b', 'master']);
			git(root, ['config', 'user.email', 'test@example.com']);
			git(root, ['config', 'user.name', 'Test']);
			commit(root, 'README.md', 'chore: 初始');
			git(root, ['tag', '-a', 'v1.0.0', '-m', 'v1.0.0']);
			commit(root, 'media/js/a.js', 'fix(webview): 修正 (#2)');
			commit(root, 'docs/a.md', 'docs: 文件 (#3)');

			const result = listReleaseChanges(root, { to: 'master' });
			assert.strictEqual(result.base, 'v1.0.0');
			assert.deepStrictEqual(
				result.changes.map(change => [change.pullNumber, change.inVsix]),
				[
					[3, false],
					[2, true],
				]
			);
		} finally {
			fs.rmSync(root, { recursive: true, force: true });
		}
	});
});
