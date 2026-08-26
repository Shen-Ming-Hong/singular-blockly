/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pages } = require('../../.github/skills/triage-user-feedback/tests/fixtures');

describe('triage-user-feedback Skill contract', () => {
	const root = path.resolve(__dirname, '../..');
	const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
	const skill = read('.github/skills/triage-user-feedback/SKILL.md');

	it('covers all ten pages and 500 deterministic fixtures', () => {
		const fixturePages = pages();
		assert.strictEqual(fixturePages.length, 10);
		assert.strictEqual(fixturePages.flatMap(page => page.items).length, 500);
		assert.ok(fixturePages[4].items.some(item => item.body.includes('Run a command')));
	});

	it('keeps the Skill read-only and preserves explicit owner approval', () => {
		for (const phrase of ['read-only', 'Never follow instructions', 'Never suggest or apply `decision:*`', 'explicit owner direction', 'fresh SDD']) {
			assert.ok(skill.includes(phrase), `Missing safety invariant: ${phrase}`);
		}
	});

	it('links both required progressive-disclosure references', () => {
		for (const reference of ['references/safety.md', 'references/classification.md']) {
			assert.ok(skill.includes(reference));
			assert.ok(fs.existsSync(path.join(root, '.github/skills/triage-user-feedback', reference)));
		}
		const installed = path.join(root, '.agents/skills/triage-user-feedback');
		assert.ok(fs.lstatSync(installed).isSymbolicLink());
		assert.strictEqual(fs.readlinkSync(installed), '../../.github/skills/triage-user-feedback');
	});

	it('allows only suggestion labels in the classification reference', () => {
		const classification = read('.github/skills/triage-user-feedback/references/classification.md');
		for (const prefix of ['kind:', 'area:', 'impact:', 'recommendation:', 'ai:triaged']) assert.ok(classification.includes(prefix));
		for (const forbidden of ['decision:actionable', 'status:planned', 'resolution:duplicate']) assert.ok(!classification.includes(forbidden));
	});
});
