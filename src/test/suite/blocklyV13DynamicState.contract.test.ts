/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const FIXTURE_ROOT = path.join(PROJECT_ROOT, 'src', 'test', 'fixtures', 'blockly-v13');

suite('Blockly 13 dynamic state contract', () => {
	test('fixtures cover variables, functions, mutators, shadows, locks, and orphans', () => {
		const manifest = JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, 'manifest.json'), 'utf8'));
		for (const fixture of manifest.fixtures) {
			for (const feature of ['variables', 'functions', 'shadow', 'locked', 'orphan']) {
				assert.ok(fixture.features.includes(feature), `${fixture.id}: ${feature}`);
			}
		}
		assert.ok(manifest.fixtures.filter((fixture: any) => fixture.features.includes('mutator')).length >= 3);
	});

	test('custom functions persist JSON extra state while retaining legacy mutation hooks', () => {
		const source = fs.readFileSync(path.join(PROJECT_ROOT, 'media', 'blockly', 'blocks', 'functions.js'), 'utf8');
		assert.match(source, /saveExtraState:\s*function \(\)/);
		assert.match(source, /loadExtraState:\s*function \(state\)/);
		assert.match(source, /arguments:\s*Array\.isArray\(this\.arguments_\)/);
		assert.match(source, /argumentTypes:/);
		assert.match(source, /locked:\s*true/);
		assert.match(source, /mutationToDom:\s*function \(\)/);
		assert.match(source, /domToMutation:\s*function \(xmlElement\)/);
	});

	test('runtime flyout and dynamic blocks use JSON shadow state only', () => {
		const targets = [
			'media/blockly/blocks/arduino.js',
			'media/blockly/blocks/functions.js',
			'media/blockly/blocks/loops.js',
			'media/blockly/blocks/txt.js',
		];
		for (const target of targets) {
			const source = fs.readFileSync(path.join(PROJECT_ROOT, target), 'utf8');
			assert.doesNotMatch(source, /setShadowDom\(/, target);
			assert.match(source, /setShadowState\(/, target);
		}

		const editor = fs.readFileSync(path.join(PROJECT_ROOT, 'media', 'js', 'blocklyEdit.js'), 'utf8');
		const functionFlyout = editor.slice(
			editor.indexOf('const functionFlyoutCallback'),
			editor.indexOf('const attachWorkspaceBaseIntegrations')
		);
		assert.match(functionFlyout, /kind:\s*'block'/);
		assert.match(functionFlyout, /extraState:/);
		assert.doesNotMatch(functionFlyout, /textToDom|<block|<mutation|<shadow/);
	});
});
