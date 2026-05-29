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
import { CYBERBRICK_UPLOAD_SETTINGS_KEY } from '../../types/cyberbrickUpload';
import { MockSecretStorage, MockWorkspaceConfiguration, createCyberBrickMockContext } from '../helpers/cyberbrickUploadMocks';
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
	let secrets: MockSecretStorage;
	let service: CyberBrickUploadSettingsService;
	const workspaceUri = vscode.Uri.file('/mock/workspace');
	const fixedNow = new Date('2026-01-20T12:00:00.000Z');

	setup(() => {
		sandbox = sinon.createSandbox();
		configuration = new MockWorkspaceConfiguration();
		secrets = new MockSecretStorage();
		sandbox.stub(vscode.workspace, 'getConfiguration').returns(configuration as unknown as vscode.WorkspaceConfiguration);
		service = new CyberBrickUploadSettingsService(createCyberBrickMockContext(secrets), workspaceUri, { now: () => fixedNow });
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
		configuration.values.set(CYBERBRICK_UPLOAD_SETTINGS_KEY, {
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
		assert.strictEqual(key, CYBERBRICK_UPLOAD_SETTINGS_KEY);
		assert.strictEqual(target, vscode.ConfigurationTarget.Workspace);
		assert.strictEqual(JSON.stringify(value).includes(CYBERBRICK_TEST_TOKEN), false);
		assert.strictEqual(JSON.stringify(value).includes(CYBERBRICK_TEST_WIFI_PASSWORD), false);
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
			CYBERBRICK_UPLOAD_SETTINGS_KEY,
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
			CYBERBRICK_UPLOAD_SETTINGS_KEY,
			createCyberBrickUploadSettings({ primaryDeviceId: device.deviceId, pairedDevices: [device] })
		);

		const readiness = await service.buildOtaReadinessStatus();

		assert.strictEqual(readiness.ready, false);
		assert.deepStrictEqual(readiness.blockingReasons, ['missing-ota-token', 'missing-address']);
		assert.strictEqual(JSON.stringify(readiness).includes(CYBERBRICK_TEST_TOKEN), false);
	});
});
