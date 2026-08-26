/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Blockly editor toolbar actions contract', () => {
	const root = path.resolve(__dirname, '../../..');
	const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

	test('keeps only backup, upload, and monitor in the primary action group', () => {
		const html = read('media/html/blocklyEdit.html');
		const primaryStart = html.indexOf('id="toolbarPrimaryActions"');
		const primaryEnd = html.indexOf('id="toolbarActionsToggle"', primaryStart);
		const primary = html.slice(primaryStart, primaryEnd);

		assert.ok(primaryStart >= 0, 'primary toolbar action group is missing');
		for (const id of ['backupButton', 'uploadButton', 'monitorBtn']) {
			assert.ok(primary.includes(`id="${id}"`), `${id} must remain visible when the toolbar is collapsed`);
		}
		for (const id of ['provideFeedbackButton', 'languageToggle', 'themeToggle', 'functionSearchToggle', 'refreshButton']) {
			assert.ok(!primary.includes(`id="${id}"`), `${id} must be a secondary toolbar action`);
		}
	});

	test('places secondary actions before an accessible rightmost toggle', () => {
		const html = read('media/html/blocklyEdit.html');
		const secondary = html.indexOf('id="toolbarSecondaryActions"');
		const primary = html.indexOf('id="toolbarPrimaryActions"');
		const toggle = html.indexOf('id="toolbarActionsToggle"');
		const controlsEnd = html.indexOf('</div>\n\n        <!-- 實驗積木提示容器 -->');

		assert.ok(secondary >= 0 && primary > secondary && toggle > primary);
		assert.ok(toggle < controlsEnd, 'toolbar toggle must be the final control inside the product toolbar');
		assert.match(
			html,
			/id="toolbarActionsToggle"[^>]*aria-controls="toolbarSecondaryActions"[^>]*aria-expanded="false"/
		);
		assert.match(html, /id="toolbarSecondaryActions"[^>]*hidden/);
		const indicator = html.indexOf('id="experimentalBlocksIndicator"');
		assert.ok(indicator > secondary && indicator < primary, 'experimental indicator must collapse with secondary actions');
		assert.match(html, /id="provideFeedbackButton"[^>]*class="feedback-entry-button"[\s\S]*class="feedback-entry-icon"/);
		assert.doesNotMatch(html, /id="provideFeedbackButtonLabel"/);
	});

	test('defaults to collapsed and persists the project-scoped user choice', () => {
		const script = read('media/js/blocklyEdit.js');
		const markerScript = read('media/js/experimentalBlockMarker.js');
		assert.match(script, /const TOOLBAR_EXPANDED_STATE_KEY = 'toolbarActionsExpanded'/);
		assert.match(script, /typeof savedState\?\.\[TOOLBAR_EXPANDED_STATE_KEY\] === 'boolean'[\s\S]*:\s*false/);
		assert.match(script, /secondaryActions\.hidden = !isExpanded/);
		assert.match(markerScript, /indicatorElement\.style\.margin = '0'/);
		assert.match(script, /toggleButton\.setAttribute\('aria-expanded', isExpanded \? 'true' : 'false'\)/);
		assert.match(script, /vscode\.setState\(\{[\s\S]*\[TOOLBAR_EXPANDED_STATE_KEY\]: isExpanded/);
		assert.match(script, /command:\s*'toolbarActionsStateChanged'[\s\S]*expanded:\s*isExpanded/);
		assert.match(script, /typeof message\.toolbarActionsExpanded === 'boolean'[\s\S]*setToolbarActionsExpanded\(message\.toolbarActionsExpanded\)/);
		assert.match(script, /TOOLBAR_ACTIONS_EXPAND/);
		assert.match(script, /TOOLBAR_ACTIONS_COLLAPSE/);
	});

	test('initializes the persistent monitor action with an accessible name', () => {
		const script = read('media/js/blocklyEdit.js');
		assert.match(script, /newMonitorBtn\.addEventListener\('click', toggleMonitor\);\s*updateMonitorButtonVisibility\(\);\s*updateMonitorButtonState\(\);/);
		assert.match(script, /monitorBtn\.setAttribute\('aria-label', label\)/);
		assert.match(script, /getMessage\('MONITOR_STARTING'/);
		assert.match(script, /getMessage\('MONITOR_BUTTON_STOP_TITLE'/);
		assert.match(script, /getMessage\('MONITOR_BUTTON_TITLE'/);
	});

	test('uses round theme-aware controls and forced-colors focus treatment', () => {
		const styles = read('media/css/blocklyEdit.css');
		assert.match(styles, /\.feedback-entry-button\s*\{[\s\S]*width:\s*32px;[\s\S]*height:\s*32px;[\s\S]*border-radius:\s*50%/);
		assert.match(styles, /#toolbarActionsToggle\s*\{[\s\S]*width:\s*32px;[\s\S]*height:\s*32px;[\s\S]*border-radius:\s*50%/);
		assert.match(styles, /@media \(forced-colors: active\)[\s\S]*#toolbarActionsToggle/);
	});

	test('uses one shared horizontal spacing rule across expanded action groups', () => {
		const styles = read('media/css/blocklyEdit.css');
		assert.match(styles, /\.controls-container\s*\{[\s\S]*column-gap:\s*10px;/);
		assert.match(styles, /\.toolbar-action-group\s*\{[\s\S]*gap:\s*10px;/);
		assert.match(
			styles,
			/\.controls-container\s+\.toolbar-action-group\s*>\s*\*\s*\{\s*margin:\s*0;/,
			'the reset must outrank later legacy one-class margin rules instead of combining them with gap'
		);
		assert.match(styles, /#toolbarActionsToggle\s*\{[\s\S]*margin:\s*0;/);
		assert.match(styles, /\.board-select\s*\{[\s\S]*margin:\s*0;/);
	});

	test('localizes both toolbar states in every supported locale', () => {
		const localesRoot = path.join(root, 'media/locales');
		const localeFiles = fs
			.readdirSync(localesRoot, { withFileTypes: true })
			.filter(entry => entry.isDirectory())
			.map(entry => path.join(localesRoot, entry.name, 'messages.js'))
			.filter(file => fs.existsSync(file));

		assert.strictEqual(localeFiles.length, 15);
		for (const file of localeFiles) {
			const source = fs.readFileSync(file, 'utf8');
			assert.match(source, /TOOLBAR_ACTIONS_EXPAND:\s*['"][^'"]+['"]/);
			assert.match(source, /TOOLBAR_ACTIONS_COLLAPSE:\s*['"][^'"]+['"]/);
		}
	});
});
