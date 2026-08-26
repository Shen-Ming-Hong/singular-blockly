#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');

const DENIED_PATHS = [
	'extension/workers/', 'extension/specs/', 'extension/scripts/', 'extension/src/', 'extension/test/',
	'extension/tests/', 'extension/.github/', 'extension/.agents/', 'extension/.dev.vars', 'extension/.env',
];
const REQUIRED_PATHS = [
	'extension/package.json', 'extension/dist/extension.js', 'extension/readme.md', 'extension/PRIVACY.md',
	'extension/SUPPORT.md', 'extension/TERMS.md',
	'extension/node_modules/blockly/blockly_compressed.js',
	'extension/node_modules/blockly/blocks_compressed.js',
	'extension/node_modules/blockly/javascript_compressed.js',
	'extension/node_modules/@blockly/theme-modern/dist/index.js',
	'extension/node_modules/node-ssh/lib/cjs/index.js',
	'extension/node_modules/ssh2/lib/client.js',
];
const MAX_SCANNED_ENTRY_BYTES = 10 * 1024 * 1024;
const SECRET_PATTERNS = [
	{ id: 'private-key-block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n(?:[A-Za-z0-9+/=]{20,}\r?\n)+-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
	{ id: 'private-key-marker', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
	{ id: 'github-token', pattern: /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/ },
	{ id: 'feedback-secret', pattern: /\b(?:GITHUB_PRIVATE_KEY|GITHUB_WEBHOOK_SECRET|REPORTER_HMAC_PEPPER|IP_HMAC_PEPPER)\s*=\s*[^\s"']{12,}/ },
];
const ALLOWED_PATTERN_PATHS = new Map([
	['private-key-marker', new Set([
		'extension/node_modules/ssh2/lib/keygen.js',
		'extension/node_modules/ssh2/lib/protocol/constants.js',
		'extension/node_modules/ssh2/lib/protocol/keyParser.js',
	])],
]);

function validateEntryNames(names) {
	const errors = [];
	for (const required of REQUIRED_PATHS) {
		if (!names.includes(required)) errors.push(`missing:${required}`);
	}
	for (const name of names) {
		const lower = name.toLowerCase();
		if (DENIED_PATHS.some(denied => lower === denied || lower.startsWith(denied))) errors.push(`denied:${name}`);
		if (/(?:^|\/)(?:\.env(?:\.|$)|\.dev\.vars$|id_rsa$|.*\.pem$)/i.test(name)) errors.push(`secret-file:${name}`);
	}
	return errors;
}

function validateEntryContent(name, content) {
	if (content.length > MAX_SCANNED_ENTRY_BYTES) return [`oversized-entry:${name}`];
	const text = content.toString('utf8');
	return SECRET_PATTERNS
		.filter(({ id, pattern }) => pattern.test(text) && !ALLOWED_PATTERN_PATHS.get(id)?.has(name))
		.map(({ id }) => `secret-pattern-${id}:${name}`);
}

function openZip(filePath) {
	return new Promise((resolve, reject) => yauzl.open(filePath, { lazyEntries: true }, (error, zip) => error ? reject(error) : resolve(zip)));
}

async function verifyVsix(filePath) {
	const zip = await openZip(filePath);
	const names = [];
	const errors = [];
	await new Promise((resolve, reject) => {
		zip.on('entry', entry => {
			names.push(entry.fileName);
			if (/\/$/.test(entry.fileName)) {
				zip.readEntry();
				return;
			}
			if (entry.uncompressedSize > MAX_SCANNED_ENTRY_BYTES) {
				errors.push(`oversized-entry:${entry.fileName}`);
				zip.readEntry();
				return;
			}
			zip.openReadStream(entry, (streamError, stream) => {
				if (streamError) {reject(streamError); return;}
				const chunks = [];
				stream.on('data', chunk => chunks.push(chunk));
				stream.on('error', reject);
				stream.on('end', () => {
					errors.push(...validateEntryContent(entry.fileName, Buffer.concat(chunks)));
					zip.readEntry();
				});
			});
		});
		zip.on('end', resolve);
		zip.on('error', reject);
		zip.readEntry();
	});
	errors.push(...validateEntryNames(names));
	return { ok: errors.length === 0, errors: [...new Set(errors)].sort(), names };
}

function selectVsix(argument) {
	if (argument) return path.resolve(argument);
	const matches = fs.readdirSync(process.cwd()).filter(name => name.endsWith('.vsix')).sort();
	if (matches.length !== 1) throw new Error('Pass one VSIX path, or leave exactly one .vsix in the current directory.');
	return path.resolve(matches[0]);
}

if (require.main === module) {
	verifyVsix(selectVsix(process.argv[2])).then(result => {
		if (!result.ok) {
			for (const error of result.errors) process.stderr.write(`${error}\n`);
			process.exitCode = 1;
			return;
		}
		process.stdout.write(`VSIX privacy verification passed (${result.names.length} entries).\n`);
	}).catch(error => {
		process.stderr.write(`VSIX privacy verification failed: ${error.message}\n`);
		process.exitCode = 2;
	});
}

module.exports = { REQUIRED_PATHS, validateEntryNames, validateEntryContent, verifyVsix };
