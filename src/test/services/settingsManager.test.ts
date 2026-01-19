/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as path from 'path';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { SettingsManager, VALID_LANGUAGES } from '../../services/settingsManager';
import { FSMock, VSCodeMock, createIsolatedFileService, createIsolatedSettingsManager } from '../helpers';

describe('SettingsManager Language Preferences', () => {
	let fsMock: FSMock;
	let vscodeMock: VSCodeMock;
	let settingsManager: SettingsManager;
	const workspacePath = '/mock/workspace';
	const settingsPath = path.join(workspacePath, '.vscode', 'settings.json').replace(/\\/g, '/');

	beforeEach(() => {
		fsMock = new FSMock();
		vscodeMock = new VSCodeMock();
		const fileService = createIsolatedFileService(fsMock, workspacePath);
		settingsManager = createIsolatedSettingsManager(vscodeMock, fileService, workspacePath);
	});

	afterEach(() => {
		fsMock.reset();
	});

	it('should return default language when no setting exists', async () => {
		fsMock.addFile(settingsPath, '{}');
		const language = await settingsManager.getLanguage();
		assert.strictEqual(language, 'auto');
	});

	it('should return stored language preference when valid', async () => {
		fsMock.addFile(settingsPath, JSON.stringify({ 'singular-blockly.language': 'ja' }));
		const language = await settingsManager.getLanguage();
		assert.strictEqual(language, 'ja');
	});

	it('should fallback to auto when stored language is invalid', async () => {
		fsMock.addFile(settingsPath, JSON.stringify({ 'singular-blockly.language': 'invalid-lang' }));
		const language = await settingsManager.getLanguage();
		assert.strictEqual(language, 'auto');
	});

	it('should update language preference when valid', async () => {
		fsMock.addFile(settingsPath, '{}');
		await settingsManager.updateLanguage('fr');
		const updatedContent = fsMock.files.get(settingsPath);
		assert.ok(updatedContent);
		const updatedSettings = JSON.parse(updatedContent);
		assert.strictEqual(updatedSettings['singular-blockly.language'], 'fr');
	});

	it('should reject invalid language preference update', async () => {
		await assert.rejects(async () => await settingsManager.updateLanguage('invalid-lang'), /Invalid language code/);
	});

	it('should resolve auto to a supported Blockly language', () => {
		const resolved = settingsManager.resolveLanguage('auto');
		assert.ok(VALID_LANGUAGES.includes(resolved));
		assert.notStrictEqual(resolved, 'auto');
	});

	it('should resolve explicit language without changes', () => {
		const resolved = settingsManager.resolveLanguage('de');
		assert.strictEqual(resolved, 'de');
	});

	it('should resolve invalid preference to a supported language', () => {
		const resolved = settingsManager.resolveLanguage('not-valid');
		assert.ok(VALID_LANGUAGES.includes(resolved));
		assert.notStrictEqual(resolved, 'auto');
	});
});
