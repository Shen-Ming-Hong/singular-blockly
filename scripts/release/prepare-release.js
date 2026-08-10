#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const TAG_PATTERN = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const CHINESE_TEXT_PATTERN = /[\u3400-\u9fff]/u;
const ENGLISH_TEXT_PATTERN = /[A-Za-z]{3}/;

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseTag(tag) {
	const match = TAG_PATTERN.exec(tag || '');
	if (!match) {
		throw new Error(`Release tag must match vX.Y.Z exactly: ${tag || '(missing)'}`);
	}
	return match.slice(1).join('.');
}

function extractChangelogSection(changelog, version) {
	const heading = `## [${version}]`;
	const start = changelog.indexOf(heading);
	if (start === -1) {
		throw new Error(`CHANGELOG.md is missing a ${heading} section`);
	}

	const next = changelog.indexOf('\n## [', start + heading.length);
	return changelog.slice(start, next === -1 ? changelog.length : next).trim();
}

function hasBilingualReleaseNotes(changelogSection) {
	const releaseNoteLines = changelogSection
		.split(/\r?\n/u)
		.map(line => line.trim())
		.filter(line => line.length > 0 && !line.startsWith('#'))
		.map(line => line.replace(/\[[^\]]*\]\([^)]*\)/gu, '').replace(/`[^`]*`/gu, ''));

	const hasChineseReleaseNote = releaseNoteLines.some(line => CHINESE_TEXT_PATTERN.test(line));
	const hasEnglishReleaseNote = releaseNoteLines.some(
		line => !CHINESE_TEXT_PATTERN.test(line) && ENGLISH_TEXT_PATTERN.test(line)
	);
	return hasChineseReleaseNote && hasEnglishReleaseNote;
}

function getAnnotatedTagType(root, tag) {
	try {
		return execFileSync('git', ['cat-file', '-t', `refs/tags/${tag}`], {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		}).trim();
	} catch (error) {
		const detail = error.stderr ? error.stderr.toString().trim() : error.message;
		throw new Error(`Unable to inspect ${tag}: ${detail}`);
	}
}

function getGitRevision(root, args, description) {
	try {
		return execFileSync('git', args, {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		}).trim();
	} catch (error) {
		const detail = error.stderr ? error.stderr.toString().trim() : error.message;
		throw new Error(`Unable to inspect ${description}: ${detail}`);
	}
}

function normalizeRepositoryUrl(repository) {
	const raw = typeof repository === 'string' ? repository : repository?.url;
	if (!raw) {
		throw new Error('package.json repository URL is missing');
	}
	return raw.replace(/^git\+/, '').replace(/\.git$/, '');
}

function verifyRelease(root, tag, options = {}) {
	const version = parseTag(tag);
	const packageJson = readJson(path.join(root, 'package.json'));
	const packageLock = readJson(path.join(root, 'package-lock.json'));
	const lockRootVersion = packageLock.packages?.['']?.version;

	if (packageJson.version !== version) {
		throw new Error(`Tag ${tag} does not match package.json version ${packageJson.version}`);
	}
	if (packageLock.version !== version || lockRootVersion !== version) {
		throw new Error(
			`Tag ${tag} does not match package-lock.json versions ${packageLock.version || '(missing)'} / ${
				lockRootVersion || '(missing)'
			}`
		);
	}

	const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
	const changelogSection = extractChangelogSection(changelog, version);
	if (!hasBilingualReleaseNotes(changelogSection)) {
		throw new Error(`CHANGELOG.md ${version} section must contain both Chinese and English release notes`);
	}

	if (options.requireAnnotatedTag) {
		const tagType = options.tagType || getAnnotatedTagType(root, tag);
		if (tagType !== 'tag') {
			throw new Error(`${tag} must be an annotated tag; found Git object type ${tagType || '(missing)'}`);
		}
		const tagCommit = options.tagCommit || getGitRevision(root, ['rev-list', '-n', '1', `refs/tags/${tag}`], tag);
		const headCommit = options.headCommit || getGitRevision(root, ['rev-parse', 'HEAD'], 'HEAD');
		if (tagCommit !== headCommit) {
			throw new Error(`${tag} points to ${tagCommit}, but the release checkout is ${headCommit}`);
		}
	}

	return {
		tag,
		version,
		vsixName: `singular-blockly-${version}.vsix`,
		checksumName: `singular-blockly-${version}.vsix.sha256`,
		artifactName: `singular-blockly-vsix-${version}`,
		changelogSection,
		repositoryUrl: normalizeRepositoryUrl(packageJson.repository),
	};
}

function resolveArtifactDirectory(root, artifactDirectory) {
	const resolved = path.resolve(root, artifactDirectory);
	const relative = path.relative(root, resolved);
	if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
		throw new Error('Artifact directory must be a child of the repository root');
	}
	return resolved;
}

function finalizeArtifact(root, metadata, artifactDirectory) {
	const outputDirectory = resolveArtifactDirectory(root, artifactDirectory);
	const vsixPath = path.join(outputDirectory, metadata.vsixName);
	if (!fs.statSync(vsixPath, { throwIfNoEntry: false })?.isFile()) {
		throw new Error(`VSIX artifact is missing: ${vsixPath}`);
	}

	const checksum = crypto.createHash('sha256').update(fs.readFileSync(vsixPath)).digest('hex');
	const checksumPath = path.join(outputDirectory, metadata.checksumName);
	const notesPath = path.join(outputDirectory, 'release-notes.md');
	const manifestPath = path.join(outputDirectory, 'release-metadata.json');
	const notes = [
		`# Singular Blockly ${metadata.tag}`,
		'',
		metadata.changelogSection,
		'',
		'## 下載 / Downloads',
		'',
		`- VSIX: \`${metadata.vsixName}\``,
		`- SHA-256: \`${checksum}\``,
		`- [完整變更紀錄 / Full changelog](${metadata.repositoryUrl}/blob/${metadata.tag}/CHANGELOG.md)`,
		'',
	].join('\n');

	fs.writeFileSync(checksumPath, `${checksum}  ${metadata.vsixName}\n`, 'utf8');
	fs.writeFileSync(notesPath, notes, 'utf8');
	fs.writeFileSync(
		manifestPath,
		`${JSON.stringify(
			{
				tag: metadata.tag,
				version: metadata.version,
				vsix: metadata.vsixName,
				checksumFile: metadata.checksumName,
				sha256: checksum,
			},
			null,
			2
		)}\n`,
		'utf8'
	);

	return { ...metadata, checksum, checksumPath, notesPath, manifestPath, vsixPath };
}

function writeGithubOutput(metadata) {
	if (!process.env.GITHUB_OUTPUT) {
		return;
	}
	const outputs = {
		version: metadata.version,
		'vsix-name': metadata.vsixName,
		'checksum-name': metadata.checksumName,
		'artifact-name': metadata.artifactName,
	};
	fs.appendFileSync(
		process.env.GITHUB_OUTPUT,
		Object.entries(outputs)
			.map(([key, value]) => `${key}=${value}`)
			.join('\n') + '\n',
		'utf8'
	);
}

function main() {
	const args = process.argv.slice(2);
	const root = path.resolve(__dirname, '..', '..');
	const packageVersion = readJson(path.join(root, 'package.json')).version;
	const tag = process.env.RELEASE_TAG || `v${packageVersion}`;
	const requireAnnotatedTag = args.includes('--verify-tag');
	const metadata = verifyRelease(root, tag, { requireAnnotatedTag });
	const finalizeIndex = args.indexOf('--finalize');

	const result =
		finalizeIndex === -1
			? metadata
			: finalizeArtifact(root, metadata, args[finalizeIndex + 1] || 'release-artifacts');
	writeGithubOutput(result);
	console.log(`Release contract verified for ${result.tag}`);
	if (result.checksum) {
		console.log(`${result.checksum}  ${result.vsixName}`);
	}
}

if (require.main === module) {
	try {
		main();
	} catch (error) {
		console.error(`Release preparation failed: ${error.message}`);
		process.exit(1);
	}
}

module.exports = {
	extractChangelogSection,
	finalizeArtifact,
	hasBilingualReleaseNotes,
	parseTag,
	resolveArtifactDirectory,
	verifyRelease,
};
