/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 列出上一個 release tag 之後合併到 master 的 commit，並標出哪些改到會進 VSIX 的檔案。
 *
 * 發布 PR 用這份清單逐項對照雙語 CHANGELOG：每個「進 VSIX」的 PR 都要有對應條目，
 * 或在發布 PR 描述寫明不寫入的理由，避免漏記。
 *
 * 用法：node scripts/release/list-release-changes.js [--from <tag>] [--to <ref>] [--json]
 */

const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const TAG_PATTERN = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

// 會進 VSIX 或改變打包結果的路徑；以 .vscodeignore 與 vscode:prepublish 為準。
const VSIX_PATTERNS = [
	/^src\/(?!test\/)/,
	/^media\//,
	/^resources\//,
	/^images\//,
	/^package\.json$/,
	/^package-lock\.json$/,
	/^package\.nls(\.[^.]+)?\.json$/,
	/^README\.md$/,
	/^(LICENSE|NOTICE|PRIVACY\.md|SUPPORT\.md|TERMS\.md)$/,
	/^\.vscodeignore$/,
	/^webpack\.config\.js$/,
	/^tsconfig\.json$/,
	/^scripts\/(generate-third-party-notices|cleanup-temp-toolbox)\.js$/,
];

function isVsixPath(file) {
	return VSIX_PATTERNS.some(pattern => pattern.test(file));
}

function git(root, args) {
	return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function findLatestTag(root, ref) {
	const tags = git(root, ['tag', '--merged', ref, '--sort=-v:refname'])
		.split('\n')
		.map(tag => tag.trim())
		.filter(tag => TAG_PATTERN.test(tag));
	if (tags.length === 0) {
		throw new Error(`找不到 ${ref} 之前的 vX.Y.Z tag`);
	}
	return tags[0];
}

function parsePullNumber(subject) {
	const match = /\(#(\d+)\)\s*$/.exec(subject);
	return match ? Number(match[1]) : null;
}

function listReleaseChanges(root, { from, to = 'origin/master' } = {}) {
	const base = from || findLatestTag(root, to);
	const log = git(root, ['log', '--first-parent', '--format=%x1e%H%x1f%s', '--name-only', `${base}..${to}`]);
	const changes = [];
	for (const record of log.split('\x1e').slice(1)) {
		const [header, ...rest] = record.split('\n');
		const [sha, subject] = header.split('\x1f');
		const files = rest.map(line => line.trim()).filter(Boolean);
		const vsixFiles = files.filter(isVsixPath);
		changes.push({
			sha: sha.slice(0, 7),
			pullNumber: parsePullNumber(subject),
			subject,
			inVsix: vsixFiles.length > 0,
			vsixFiles,
		});
	}
	return { base, to, changes };
}

function main() {
	const args = process.argv.slice(2);
	const valueOf = flag => {
		const index = args.indexOf(flag);
		return index >= 0 ? args[index + 1] : undefined;
	};
	const result = listReleaseChanges(ROOT, { from: valueOf('--from'), to: valueOf('--to') });
	if (args.includes('--json')) {
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		return;
	}
	const inVsix = result.changes.filter(change => change.inVsix);
	process.stdout.write(`${result.base}..${result.to}：${result.changes.length} 個 commit，${inVsix.length} 個進 VSIX\n\n`);
	process.stdout.write('| 進 VSIX | PR | commit | 標題 |\n| --- | --- | --- | --- |\n');
	for (const change of result.changes) {
		const pr = change.pullNumber ? `#${change.pullNumber}` : '—';
		process.stdout.write(`| ${change.inVsix ? '是' : '否'} | ${pr} | ${change.sha} | ${change.subject.replace(/\|/g, '\\|')} |\n`);
	}
}

if (require.main === module) {
	try {
		main();
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

module.exports = { isVsixPath, parsePullNumber, listReleaseChanges };
