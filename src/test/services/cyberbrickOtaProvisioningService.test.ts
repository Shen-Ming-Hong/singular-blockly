import assert = require('assert');
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { suite, test, beforeEach } from 'mocha';
import { CyberBrickOtaProvisioningService } from '../../services/cyberbrickOtaProvisioningService';
import { CyberBrickUploadSettingsService } from '../../services/cyberbrickUploadSettingsService';
import { MockSecretStorage, MockWorkspaceConfiguration, createCyberBrickMockContext } from '../helpers/cyberbrickUploadMocks';
import { CYBERBRICK_UPLOAD_SETTINGS_KEY } from '../../types/cyberbrickUpload';
import {
	CYBERBRICK_TEST_DEVICE_ID,
	CYBERBRICK_TEST_WIFI_PASSWORD,
	createCyberBrickDevice,
	createCyberBrickUploadSettings,
} from '../fixtures/cyberbrickUploadFixtures';

suite('CyberBrickOtaProvisioningService', () => {
	let secrets: MockSecretStorage;
	let configuration: MockWorkspaceConfiguration;
	let settingsService: CyberBrickUploadSettingsService;
	let uploader: any;

	beforeEach(() => {
		secrets = new MockSecretStorage();
		configuration = new MockWorkspaceConfiguration();
		settingsService = new CyberBrickUploadSettingsService(createCyberBrickMockContext(secrets), vscode.Uri.file('/workspace'), {
			configuration,
			now: () => new Date('2026-01-20T12:00:00.000Z'),
		});
		uploader = {
			listPorts: sinon.stub().resolves({ ports: [] }),
			readCyberBrickDeviceId: sinon.stub().resolves(CYBERBRICK_TEST_DEVICE_ID),
			writeCyberBrickDeviceId: sinon.stub().resolves(),
			scanCyberBrickWifi: sinon.stub().resolves([{ ssid: 'Classroom', rssi: -42 }]),
			deployCyberBrickOtaAgent: sinon.stub().resolves(),
			configureCyberBrickOtaAgent: sinon.stub().resolves({ ipAddress: '192.168.1.50', agentVersion: '1.0.0', agentStarted: true, rcMainPatched: true }),
			removeCyberBrickOtaArtifacts: sinon.stub().resolves({ removedAgent: true, removedConfig: true, rcMainPatched: true, rcMainHadBootstrap: true }),
		};
	});

	test('lists CyberBrick USB ports for explicit user selection', async () => {
		uploader.listPorts.resolves({
			ports: [
				{ path: '/dev/cu.usbmodem1', vendorId: '303A', productId: '1001', manufacturer: 'CyberBrick' },
				{ path: '/dev/cu.usbmodem2', vendorId: '303A', productId: '1001', manufacturer: 'CyberBrick' },
			],
		});
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);

		const ports = await service.listUsbPorts();

		assert.strictEqual(ports.ports.length, 2);
		assert.strictEqual(ports.ports[0].path, '/dev/cu.usbmodem1');
		assert.strictEqual(ports.autoDetected, undefined);
	});

	test('returns auto-detected CyberBrick USB port for settings dropdown preselection', async () => {
		uploader.listPorts.resolves({
			ports: [{ path: '/dev/cu.usbmodem1', vendorId: '303A', productId: '1001', manufacturer: 'CyberBrick' }],
			autoDetected: '/dev/cu.usbmodem1',
		});
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);

		const result = await service.listUsbPorts();

		assert.strictEqual(result.autoDetected, '/dev/cu.usbmodem1');
		assert.strictEqual(result.ports[0].displayName.includes('/dev/cu.usbmodem1'), true);
	});

	test('returns device-side Wi-Fi scan results and supports empty lists', async () => {
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);
		const scan = await service.scanWifi('/dev/cu.usbmodem1');

		assert.strictEqual(scan.networks[0].ssid, 'Classroom');
		uploader.scanCyberBrickWifi.resolves([]);
		const emptyScan = await service.scanWifi('/dev/cu.usbmodem1');
		assert.deepStrictEqual(emptyScan.networks, []);
	});

	test('keeps manual SSID fallback available when Wi-Fi scan fails', async () => {
		uploader.scanCyberBrickWifi.rejects(new Error('scan failed'));
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);

		const scan = await service.scanWifi('/dev/cu.usbmodem1');

		assert.strictEqual(scan.networks.length, 0);
		assert.strictEqual(scan.error?.code, 'wifi-scan-failed');
	});

	test('provisions deviceId, stores secrets only in SecretStorage, and leaves upload mode USB', async () => {
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader, { randomBytes: size => Buffer.alloc(size, 1) });

		const { result, panelState } = await service.provision({
			usbPort: '/dev/cu.usbmodem1',
			friendlyName: 'Classroom Brick',
			ssid: 'Classroom',
			wifiPassword: CYBERBRICK_TEST_WIFI_PASSWORD,
		});

		assert.strictEqual(result.success, true);
		assert.strictEqual(result.nextUploadMode, 'usb');
		assert.strictEqual(panelState.settings.pairedDevices[0].friendlyName, 'Classroom Brick');
		assert.strictEqual(JSON.stringify(configuration.values.get(CYBERBRICK_UPLOAD_SETTINGS_KEY)).includes(CYBERBRICK_TEST_WIFI_PASSWORD), false);
		assert.strictEqual(JSON.stringify(result).includes(CYBERBRICK_TEST_WIFI_PASSWORD), false);
		assert(secrets.values.size >= 3);
	});

	test('creates and writes a deviceId when the board has none', async () => {
		uploader.readCyberBrickDeviceId.resolves(undefined);
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader, { randomBytes: size => Buffer.alloc(size, 2) });

		const { result } = await service.provision({ usbPort: '/dev/cu.usbmodem1', friendlyName: 'New Brick', ssid: 'Classroom' });

		assert.strictEqual(result.success, true);
		assert.strictEqual(uploader.writeCyberBrickDeviceId.calledOnce, true);
		assert(result.device?.deviceId.startsWith('cyberbrick-'));
	});

	test('fails provisioning when the OTA agent cannot start after Wi-Fi setup', async () => {
		uploader.configureCyberBrickOtaAgent.resolves({ ipAddress: '192.168.1.50', agentVersion: '1.0.0', agentStarted: false, agentError: 'bind failed' });
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);
		const progress: Array<{ step: string; success: boolean }> = [];

		const { result } = await service.provision(
			{ usbPort: '/dev/cu.usbmodem1', friendlyName: 'Classroom Brick', ssid: 'Classroom' },
			step => progress.push({ step: step.step, success: step.success })
		);

		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error?.code, 'agent-unreachable');
		assert.deepStrictEqual(progress[progress.length - 1], { step: 'verify-agent', success: false });
		assert.strictEqual(secrets.values.size, 0, 'secrets should not be stored when the agent did not start');
	});

	test('fails provisioning when rc_main.py cannot be prepared for OTA startup', async () => {
		uploader.configureCyberBrickOtaAgent.resolves({
			ipAddress: '192.168.1.50',
			agentVersion: '1.0.0',
			agentStarted: true,
			rcMainPatched: false,
			rcMainError: 'write failed',
		});
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);
		const progress: Array<{ step: string; success: boolean }> = [];

		const { result } = await service.provision(
			{ usbPort: '/dev/cu.usbmodem1', friendlyName: 'Classroom Brick', ssid: 'Classroom' },
			step => progress.push({ step: step.step, success: step.success })
		);

		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error?.code, 'agent-install-failed');
		assert.strictEqual(result.error?.details, 'write failed');
		assert.deepStrictEqual(progress[progress.length - 1], { step: 'verify-agent', success: false });
		assert.strictEqual(secrets.values.size, 0, 'secrets should not be stored when rc_main.py was not prepared');
	});

	test('removes OTA artifacts over USB, deletes local pairing secrets, and returns to USB mode', async () => {
		const device = createCyberBrickDevice({ lastKnownIp: '192.168.1.50' });
		configuration.values.set(
			CYBERBRICK_UPLOAD_SETTINGS_KEY,
			createCyberBrickUploadSettings({ pairedDevices: [device], primaryDeviceId: device.deviceId })
		);
		await settingsService.storeDeviceSecret(device.deviceId, 'wifiPassword', CYBERBRICK_TEST_WIFI_PASSWORD);
		await settingsService.storeDeviceSecret(device.deviceId, 'otaToken', 'token-test');
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);

		const { result, panelState } = await service.removeOtaArtifacts({ usbPort: '/dev/cu.usbmodem1', deviceId: device.deviceId });

		assert.strictEqual(result.success, true);
		assert.strictEqual(result.removedAgent, true);
		assert.strictEqual(result.removedConfig, true);
		assert.strictEqual(result.rcMainPatched, true);
		assert.strictEqual(result.localPairingRemoved, true);
		assert.strictEqual(uploader.removeCyberBrickOtaArtifacts.calledOnceWith('/dev/cu.usbmodem1'), true);
		assert.deepStrictEqual(panelState.settings.pairedDevices, []);
		const presence = await settingsService.getSecretPresence(device.deviceId);
		assert.strictEqual(presence.wifiPasswordSet, false);
		assert.strictEqual(presence.otaTokenSet, false);
	});

	test('removes OTA artifacts from the USB-connected CyberBrick even when it is not paired locally', async () => {
		const pairedDevice = createCyberBrickDevice({ deviceId: 'cyberbrick-paired-local', lastKnownIp: '192.168.1.50' });
		configuration.values.set(
			CYBERBRICK_UPLOAD_SETTINGS_KEY,
			createCyberBrickUploadSettings({ pairedDevices: [pairedDevice], primaryDeviceId: pairedDevice.deviceId })
		);
		uploader.readCyberBrickDeviceId.resolves('cyberbrick-unpaired-usb');
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);

		const { result, panelState } = await service.removeOtaArtifacts({ usbPort: '/dev/cu.usbmodem1' });

		assert.strictEqual(result.success, true);
		assert.strictEqual(result.deviceId, 'cyberbrick-unpaired-usb');
		assert.strictEqual(result.localPairingRemoved, false);
		assert.strictEqual(uploader.removeCyberBrickOtaArtifacts.calledOnceWith('/dev/cu.usbmodem1'), true);
		assert.deepStrictEqual(panelState.settings.pairedDevices.map(device => device.deviceId), [pairedDevice.deviceId]);
	});

	test('continues USB-connected OTA cleanup without local pairing removal when identity cannot be read and no paired target was selected', async () => {
		uploader.readCyberBrickDeviceId.rejects(new Error('config missing'));
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);

		const { result } = await service.removeOtaArtifacts({ usbPort: '/dev/cu.usbmodem1' });

		assert.strictEqual(result.success, true);
		assert.strictEqual(result.deviceId, undefined);
		assert.strictEqual(result.localPairingRemoved, false);
		assert.strictEqual(uploader.removeCyberBrickOtaArtifacts.calledOnceWith('/dev/cu.usbmodem1'), true);
	});

	test('fails cleanup with remove-error details when device-side OTA files cannot be removed', async () => {
		uploader.removeCyberBrickOtaArtifacts.resolves({
			removedAgent: false,
			removedConfig: false,
			rcMainPatched: false,
			rcMainHadBootstrap: false,
			agentRemoveError: 'busy',
			configRemoveError: 'permission denied',
		});
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);

		const { result } = await service.removeOtaArtifacts({ usbPort: '/dev/cu.usbmodem1' });

		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error?.code, 'ota-cleanup-failed');
		assert.deepStrictEqual(result.error?.details, { agentRemoveError: 'busy', configRemoveError: 'permission denied' });
	});

	test('refuses OTA cleanup when the USB-connected device identity does not match', async () => {
		const device = createCyberBrickDevice({ lastKnownIp: '192.168.1.50' });
		configuration.values.set(
			CYBERBRICK_UPLOAD_SETTINGS_KEY,
			createCyberBrickUploadSettings({ pairedDevices: [device], primaryDeviceId: device.deviceId })
		);
		uploader.readCyberBrickDeviceId.resolves('cyberbrick-other');
		const service = new CyberBrickOtaProvisioningService(settingsService, uploader);

		const { result, panelState } = await service.removeOtaArtifacts({ usbPort: '/dev/cu.usbmodem1', deviceId: device.deviceId });

		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error?.code, 'identity-mismatch');
		assert.strictEqual(uploader.removeCyberBrickOtaArtifacts.called, false);
		assert.strictEqual(panelState.settings.pairedDevices.length, 1);
	});
});
