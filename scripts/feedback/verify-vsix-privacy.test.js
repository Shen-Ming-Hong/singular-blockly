/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert');
const { REQUIRED_PATHS, validateEntryContent, validateEntryNames } = require('./verify-vsix-privacy');

describe('VSIX privacy verifier', () => {
	const required = [...REQUIRED_PATHS];

	it('accepts the required client-only archive surface', () => {
		assert.deepStrictEqual(validateEntryNames([...required, 'extension/media/html/feedback.html']), []);
	});

	it('rejects archives missing Blockly or SSH runtime dependencies', () => {
		const withoutBlockly = required.filter(name => name !== 'extension/node_modules/blockly/blockly_compressed.js');
		const withoutSsh = required.filter(name => name !== 'extension/node_modules/node-ssh/lib/cjs/index.js');
		assert.ok(validateEntryNames(withoutBlockly).includes('missing:extension/node_modules/blockly/blockly_compressed.js'));
		assert.ok(validateEntryNames(withoutSsh).includes('missing:extension/node_modules/node-ssh/lib/cjs/index.js'));
	});

	it('rejects Worker, deployment secret, and private-key files', () => {
		const errors = validateEntryNames([...required, 'extension/workers/feedback/wrangler.jsonc', 'extension/.dev.vars']);
		assert.ok(errors.some(error => error.startsWith('denied:')));
		assert.ok(errors.some(error => error.startsWith('secret-file:')));
	});

	it('detects credential material in otherwise allowed files', () => {
		assert.ok(validateEntryContent('extension/dist/extension.js', Buffer.from('-----BEGIN PRIVATE KEY-----')).length > 0);
		const classicPat = 'ghp_' + 'C'.repeat(36);
		const fineGrainedPat = 'github_pat_' + 'A'.repeat(24) + '_' + 'B'.repeat(24);
		assert.ok(validateEntryContent('extension/dist/extension.js', Buffer.from(classicPat))
			.some(error => error.includes('github-token')));
		assert.ok(validateEntryContent('extension/dist/extension.js', Buffer.from(fineGrainedPat))
			.some(error => error.includes('github-token')));
		assert.ok(validateEntryContent('extension/readme.md', Buffer.from('ordinary documentation')).length === 0);
	});

	it('allows only reviewed ssh2 parser markers, never complete private keys', () => {
		const parserPath = 'extension/node_modules/ssh2/lib/protocol/keyParser.js';
		assert.deepStrictEqual(validateEntryContent(parserPath, Buffer.from('const marker = "-----BEGIN PRIVATE KEY-----";')), []);
		assert.ok(validateEntryContent(parserPath, Buffer.from([
			'-----BEGIN PRIVATE KEY-----',
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
			'-----END PRIVATE KEY-----',
		].join('\n'))).some(error => error.includes('private-key-block')));
		assert.ok(validateEntryContent('extension/dist/extension.js', Buffer.from('-----BEGIN PRIVATE KEY-----')).length > 0);
	});

	it('rejects entries too large to inspect instead of silently skipping them', () => {
		const errors = validateEntryContent('extension/dist/oversized.js', Buffer.alloc(10 * 1024 * 1024 + 1));
		assert.deepStrictEqual(errors, ['oversized-entry:extension/dist/oversized.js']);
	});
});
