/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import { readWorkspaceFile } from './editorThemeSurfaceContractUtils';

// 2026-11-16 UI 檢查：工具列、下拉選單與舊式對話框的鍵盤、焦點與遮擋規則。
describe('Blockly editor keyboard and toolbar accessibility', () => {
	const source = readWorkspaceFile('media/js/blocklyEdit.js');
	const css = readWorkspaceFile('media/css/blocklyEdit.css');

	it('keeps the expanded toolbar to the right of the toolbox', () => {
		assert.match(css, /max-width: calc\(100% - 20px - var\(--blockly-toolbox-width, 0px\)/);
		assert.match(source, /setProperty\('--blockly-toolbox-width', `\$\{width\}px`\)/);
		assert.match(source, /updateTheme\(currentTheme\);\n\tupdateToolbarToolboxClearance\(\);/);
	});

	// Modern Web Guidance `customizable-select`：開發板與語言選單用原生 <select>，鍵盤與無障礙由瀏覽器處理。
	it('uses native customizable selects for the board and language menus', () => {
		const html = readWorkspaceFile('media/html/blocklyEdit.html');
		assert.match(html, /<label for="boardSelect" id="boardSelectLabel">/);
		assert.match(html, /<select id="boardSelect">/);
		assert.match(html, /<select id="languageSelect" class="language-select" title="" aria-label="">\s*<!--[\s\S]*?-->\s*<button type="button" class="language-select-button">/);
		assert.doesNotMatch(html, /boardSelectToggle|boardDropdown|languageToggle|languageDropdown/);
		assert.doesNotMatch(source, /function (open|close|toggle)(Board|Language)Dropdown/);
		assert.match(source, /languageSelect\.addEventListener\('change', \(\) => handleLanguageSelection\(languageSelect\.value\)\)/);
		assert.match(source, /languageSelect\.setAttribute\('aria-label', label\)/);
		for (const id of ['boardSelect', 'languageSelect']) {
			assert.match(css, new RegExp(`#${id}:not\\(#ui-none\\)::picker\\(select\\)[^{]*\\{[^}]*appearance: base-select;`));
			assert.match(css, new RegExp(`#${id}:not\\(#ui-none\\):focus-visible[^{]*\\{[^}]*outline: 2px solid var\\(--editor-focus-ring\\)`));
		}
	});

	it('closes legacy dialogs with Escape and returns focus to the opener', () => {
		for (const id of ['backupModal', 'functionSearchModal', 'sampleModal', 'txtConnectionModal', 'cyberbrickUploadSettingsModal']) {
			assert.match(source, new RegExp(`\\{ id: '${id}', close: `), id);
		}
		assert.match(source, /event\.key !== 'Escape'/);
		assert.match(source, /modal\.addEventListener\('cancel', event => \{/);
		assert.match(source, /modalOpeners\.set\(modal\.id, opener\)/);
		assert.match(source, /target\?\.focus\(\)/);
		assert.match(source, /initModalAccessibility\(\);/);
	});

	// Modern Web Guidance `dialog`：用原生 <dialog> + showModal()，背景不能操作、焦點留在對話框內。
	it('uses native modal dialogs with real close buttons', () => {
		const html = readWorkspaceFile('media/html/blocklyEdit.html');
		for (const id of ['backupModal', 'functionSearchModal', 'sampleModal', 'txtConnectionModal', 'cyberbrickUploadSettingsModal']) {
			assert.match(html, new RegExp(`<dialog id="${id}" class="modal"`), id);
			assert.doesNotMatch(source, new RegExp(`getElementById\\('${id}'\\)\\.style\\.display`), `${id} toggles display instead of showModal()`);
		}
		assert.doesNotMatch(html, /<span class="modal-close"/);
		assert.match(source, /modal\.showModal\(\);/);
		assert.match(css, /dialog\.modal::backdrop \{/);
	});

	it('names icon-only toolbar buttons and hides their icons', () => {
		assert.match(source, /button\.setAttribute\('aria-label', title\)/);
		assert.match(source, /svg\.setAttribute\('aria-hidden', 'true'\)/);
		assert.match(source, /initToolbarIconButtonLabels\(\);\n\tinitToolbarActions\(\);/);
	});

	it('labels dialog close buttons in every locale', () => {
		const locales = ['bg', 'cs', 'de', 'en', 'es', 'fr', 'hu', 'it', 'ja', 'ko', 'pl', 'pt-br', 'ru', 'tr', 'zh-hant'];
		for (const locale of locales) {
			assert.match(readWorkspaceFile(`media/locales/${locale}/messages.js`), /MODAL_CLOSE_LABEL: '[^']+'/, locale);
		}
	});
	it('shows experimental blocks as a labelled chip next to the board selector', () => {
		const html = readWorkspaceFile('media/html/blocklyEdit.html');
		const chipCss = readWorkspaceFile('media/css/experimentalBlocks.css');
		const marker = readWorkspaceFile('media/js/experimentalBlockMarker.js');
		const board = html.indexOf('class="board-select"');
		const chip = html.indexOf('<button id="experimentalBlocksIndicator"');
		const secondary = html.indexOf('id="toolbarSecondaryActions"');
		assert.ok(board > -1 && chip > board && chip < secondary, 'chip sits between the board selector and the collapsible actions');
		assert.match(html, /class="experimental-blocks-label"/);
		assert.match(chipCss, /\.experimental-blocks-indicator:not\(#ui-none\) \{[^}]*border-radius: 999px;/);
		assert.match(chipCss, /@media \(prefers-reduced-motion: reduce\)/);
		assert.match(marker, /EXPERIMENTAL_BLOCKS_LABEL/);
		for (const locale of ['bg', 'cs', 'de', 'en', 'es', 'fr', 'hu', 'it', 'ja', 'ko', 'pl', 'pt-br', 'ru', 'tr', 'zh-hant']) {
			assert.match(readWorkspaceFile(`media/locales/${locale}/messages.js`), /EXPERIMENTAL_BLOCKS_LABEL: '[^']+'/, locale);
		}
	});

	it('keeps toolbar buttons neutral and only Upload in the primary colour', () => {
		assert.match(css, /--ui-primary: #[0-9a-f]{6};/i);
		assert.match(css, /button#uploadButton:not\(#ui-none\) \{[^}]*background-color: var\(--ui-primary\)/);
	});

	it('names the CyberBrick refresh and backup delete icon buttons', () => {
		assert.match(source, /setIconButtonLabel\('cyberbrickRefreshUsbPorts'/);
		assert.match(source, /setIconButtonLabel\('cyberbrickWifiScanButton'/);
		assert.match(source, /deleteBtn\.setAttribute\('aria-label', deleteText\)/);
	});
});
