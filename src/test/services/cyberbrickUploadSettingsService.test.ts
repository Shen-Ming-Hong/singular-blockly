/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as crypto from 'crypto';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CyberBrickUploadSettingsService } from '../../services/cyberbrickUploadSettingsService';
import { CYBERBRICK_UPLOAD_SETTINGS_PROPERTY, CYBERBRICK_UPLOAD_SETTINGS_SECTION } from '../../types/cyberbrickUpload';
import { MockMemento, MockSecretStorage, MockWorkspaceConfiguration, createCyberBrickMockContext } from '../helpers/cyberbrickUploadMocks';
import {
	CYBERBRICK_TEST_DEVICE_ID,
	CYBERBRICK_TEST_DEVICE_ID_2,
	CYBERBRICK_TEST_TOKEN,
	CYBERBRICK_TEST_WIFI_PASSWORD,
	createCyberBrickDevice,
	createCyberBrickUploadSettings,
} from '../fixtures/cyberbrickUploadFixtures';

suite('CyberBrickUploadSettingsService Test Suite', () => {
	let sandbox: sinon.SinonSandbox;
	let configuration: MockWorkspaceConfiguration;
	let workspaceState: MockMemento;
	let secrets: MockSecretStorage;
	let service: CyberBrickUploadSettingsService;
	let getConfigurationStub: sinon.SinonStub;
	const workspaceUri = vscode.Uri.file('/mock/workspace');
	const fixedNow = new Date('2026-01-20T12:00:00.000Z');

	setup(() => {
		sandbox = sinon.createSandbox();
		configuration = new MockWorkspaceConfiguration();
		workspaceState = new MockMemento();
		secrets = new MockSecretStorage();
		getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration').returns(configuration as unknown as vscode.WorkspaceConfiguration);
		service = new CyberBrickUploadSettingsService(createCyberBrickMockContext(secrets, workspaceState), workspaceUri, { now: () => fixedNow });
	});

	teardown(() => {
		sandbox.restore();
	});

	test('loads USB defaults when no workspace setting exists', async () => {
		const settings = await service.loadSettings();

		assert.deepStrictEqual(settings, {
			schemaVersion: 2,
			pairedDevices: [],
		});
	});

	test('migrates legacy shapes and keeps duplicate friendly names by deviceId', async () => {
		configuration.values.set(CYBERBRICK_UPLOAD_SETTINGS_PROPERTY, {
			mode: 'ota',
			primaryDeviceId: CYBERBRICK_TEST_DEVICE_ID_2,
			devices: [
				createCyberBrickDevice({ deviceId: CYBERBRICK_TEST_DEVICE_ID, friendlyName: 'Robot' }),
				createCyberBrickDevice({ deviceId: CYBERBRICK_TEST_DEVICE_ID_2, friendlyName: 'Robot', lastKnownIp: '192.168.1.77' }),
			],
		});

		const settings = await service.loadSettings();

		assert.strictEqual(settings.schemaVersion, 2);
		assert.strictEqual(settings.primaryDeviceId, CYBERBRICK_TEST_DEVICE_ID_2);
		assert.strictEqual(settings.pairedDevices.length, 2);
		assert.deepStrictEqual(settings.pairedDevices.map(device => device.friendlyName), ['Robot', 'Robot']);
		assert.deepStrictEqual(settings.pairedDevices.map(device => device.deviceId), [CYBERBRICK_TEST_DEVICE_ID, CYBERBRICK_TEST_DEVICE_ID_2]);
	});

	test('saves normalized settings to workspace scope without secrets', async () => {
		const settings = createCyberBrickUploadSettings({
			primaryDeviceId: CYBERBRICK_TEST_DEVICE_ID,
			pairedDevices: [createCyberBrickDevice()],
		});

		await service.saveSettings(settings);

		assert.ok(configuration.update.calledOnce);
		const [key, value, target] = configuration.update.firstCall.args;
		assert.strictEqual(key, CYBERBRICK_UPLOAD_SETTINGS_PROPERTY);
		assert.strictEqual(target, vscode.ConfigurationTarget.Workspace);
		assert.ok(getConfigurationStub.calledWith(CYBERBRICK_UPLOAD_SETTINGS_SECTION, workspaceUri));
		assert.strictEqual(JSON.stringify(value).includes(CYBERBRICK_TEST_TOKEN), false);
		assert.strictEqual(JSON.stringify(value).includes(CYBERBRICK_TEST_WIFI_PASSWORD), false);
	});

	test('falls back to workspaceState when VS Code rejects the registered workspace setting write', async () => {
		configuration.update.rejects(new Error('因為 singular-blockly.cyberbrick.uploadSettings 非已註冊的組態，所以無法寫入至 工作區設定。'));
		const settings = createCyberBrickUploadSettings({
			primaryDeviceId: CYBERBRICK_TEST_DEVICE_ID,
			pairedDevices: [createCyberBrickDevice()],
		});

		const saved = await service.saveSettings(settings);
		const reloaded = await service.loadSettings();
		const fallbackValue = workspaceState.values.get(`singular-blockly.cyberbrick.uploadSettings.fallback.${service.getWorkspaceHash()}`);

		assert.strictEqual(saved.primaryDeviceId, CYBERBRICK_TEST_DEVICE_ID);
		assert.strictEqual(reloaded.primaryDeviceId, CYBERBRICK_TEST_DEVICE_ID);
		assert.strictEqual(JSON.stringify(fallbackValue).includes(CYBERBRICK_TEST_TOKEN), false);
		assert.strictEqual(JSON.stringify(fallbackValue).includes(CYBERBRICK_TEST_WIFI_PASSWORD), false);
		assert.ok(workspaceState.update.calledOnce);
	});

	test('prefers workspaceState fallback over stale workspace settings', async () => {
		const fallbackSettings = createCyberBrickUploadSettings({
			primaryDeviceId: CYBERBRICK_TEST_DEVICE_ID_2,
			pairedDevices: [createCyberBrickDevice({ deviceId: CYBERBRICK_TEST_DEVICE_ID_2, friendlyName: 'Fallback Brick' })],
		});
		configuration.values.set(
			CYBERBRICK_UPLOAD_SETTINGS_PROPERTY,
			createCyberBrickUploadSettings({
				primaryDeviceId: CYBERBRICK_TEST_DEVICE_ID,
				pairedDevices: [createCyberBrickDevice({ deviceId: CYBERBRICK_TEST_DEVICE_ID, friendlyName: 'Stale Brick' })],
			})
		);
		workspaceState.values.set(`singular-blockly.cyberbrick.uploadSettings.fallback.${service.getWorkspaceHash()}`, fallbackSettings);

		const loaded = await service.loadSettings();

		assert.strictEqual(loaded.primaryDeviceId, CYBERBRICK_TEST_DEVICE_ID_2);
		assert.deepStrictEqual(loaded.pairedDevices.map(device => device.friendlyName), ['Fallback Brick']);
	});

	test('generates workspace-scoped secret keys and stores secrets only in SecretStorage', async () => {
		const expectedHash = crypto.createHash('sha256').update(workspaceUri.toString()).digest('hex').slice(0, 16);
		const expectedKey = `singular-blockly.cyberbrick.${expectedHash}.${CYBERBRICK_TEST_DEVICE_ID}.otaToken`;

		await service.storeDeviceSecret(CYBERBRICK_TEST_DEVICE_ID, 'otaToken', CYBERBRICK_TEST_TOKEN);

		assert.strictEqual(service.getWorkspaceHash(), expectedHash);
		assert.strictEqual(service.getSecretKey(CYBERBRICK_TEST_DEVICE_ID, 'otaToken'), expectedKey);
		assert.ok(secrets.store.calledWith(expectedKey, CYBERBRICK_TEST_TOKEN));
		assert.strictEqual(configuration.update.called, false);
	});

	test('builds sanitized panel state with secret presence only', async () => {
		configuration.values.set(
			CYBERBRICK_UPLOAD_SETTINGS_PROPERTY,
			createCyberBrickUploadSettings({ pairedDevices: [createCyberBrickDevice()] })
		);
		await service.storeDeviceSecret(CYBERBRICK_TEST_DEVICE_ID, 'wifiPassword', CYBERBRICK_TEST_WIFI_PASSWORD);
		await service.storeDeviceSecret(CYBERBRICK_TEST_DEVICE_ID, 'otaToken', CYBERBRICK_TEST_TOKEN);

		const panelState = await service.buildPanelState();
		const serialized = JSON.stringify(panelState);

		assert.strictEqual(serialized.includes(CYBERBRICK_TEST_WIFI_PASSWORD), false);
		assert.strictEqual(serialized.includes(CYBERBRICK_TEST_TOKEN), false);
		assert.deepStrictEqual(panelState.secretPresence[CYBERBRICK_TEST_DEVICE_ID], {
			deviceId: CYBERBRICK_TEST_DEVICE_ID,
			wifiPasswordSet: true,
			otaTokenSet: true,
			pairingSecretSet: false,
		});
	});

	test('builds readiness failures without leaking token values', async () => {
		const device = createCyberBrickDevice({ lastKnownIp: undefined });
		configuration.values.set(
			CYBERBRICK_UPLOAD_SETTINGS_PROPERTY,
			createCyberBrickUploadSettings({ primaryDeviceId: device.deviceId, pairedDevices: [device] })
		);

		const readiness = await service.buildOtaReadinessStatus();

		assert.strictEqual(readiness.ready, false);
		assert.deepStrictEqual(readiness.blockingReasons, ['missing-ota-token', 'missing-address']);
		assert.strictEqual(JSON.stringify(readiness).includes(CYBERBRICK_TEST_TOKEN), false);
	});
});
