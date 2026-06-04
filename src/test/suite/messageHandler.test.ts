/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * T021 – messageHandler OTA upload routing tests
 *
 * Tests generic requestUpload OTA fallback panel refresh.
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { WebViewMessageHandler, _setVSCodeApi, _reset } from '../../webview/messageHandler';
import { LocaleService } from '../../services/localeService';
import { FileService } from '../../services/fileService';
import { SettingsManager } from '../../services/settingsManager';
import { CyberBrickUploadSettingsService } from '../../services/cyberbrickUploadSettingsService';
import { CyberBrickOtaUploader } from '../../services/cyberbrickOtaUploader';
import { MicropythonUploader } from '../../services/micropythonUploader';
import {
	PairedCyberBrickDevice,
	CyberBrickUploadSettings,
	CyberBrickUploadPanelState,
} from '../../types/cyberbrickUpload';
import { CYBERBRICK_OTA_AGENT_TARGET_VERSION, CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION } from '../../services/cyberbrickOtaUploader';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDevice(overrides: Partial<PairedCyberBrickDevice> = {}): PairedCyberBrickDevice {
	return {
		deviceId: 'dev-01',
		friendlyName: 'Test CyberBrick',
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-01T00:00:00Z',
		otaPort: 8266,
		protocolVersion: 2,
		lastKnownIp: '192.168.1.55',
		agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
		...overrides,
	};
}

function makeSettings(overrides: Partial<CyberBrickUploadSettings> = {}): CyberBrickUploadSettings {
	return {
		schemaVersion: 2,
		primaryDeviceId: undefined,
		pairedDevices: [],
		...overrides,
	};
}

function makeSerialMonitor(
	sandbox: sinon.SinonSandbox,
	startResult: { success: boolean; port: string; error?: { code: string; message: string } }
) {
	return {
		start: sandbox.stub().resolves(startResult),
		stop: sandbox.stub().resolves(),
		stopForUpload: sandbox.stub().resolves(),
		isRunning: sandbox.stub().returns(false),
		onStopped: sandbox.stub(),
	};
}

// ---------------------------------------------------------------------------
// Suite helpers
// ---------------------------------------------------------------------------

function makeHandlerHarness(
	sandbox: sinon.SinonSandbox,
	vscodeMock: {
		window: { showWarningMessage: sinon.SinonStub; showErrorMessage?: sinon.SinonStub };
		workspace: { workspaceFolders: unknown[] };
		[key: string]: unknown;
	}
) {
	const webviewPostMessage = sandbox.stub().resolves();
	const panelMock = {
		webview: { postMessage: webviewPostMessage },
		reveal: sandbox.stub(),
	};

	const localeServiceStub = sandbox.createStubInstance(LocaleService);
	localeServiceStub.getLocalizedMessage.resolves('Mocked locale message');

	const fileServiceStub = sandbox.createStubInstance(FileService);
	const settingsManagerStub = sandbox.createStubInstance(SettingsManager);
	settingsManagerStub.getTheme.resolves('dark');
	settingsManagerStub.getLanguage.resolves('auto');
	settingsManagerStub.resolveLanguage.returns('en');
	settingsManagerStub.readSetting.resolves('__unset__');
	settingsManagerStub.getAutoBackupInterval.resolves(5);

	const settingsSvcStub = sandbox.createStubInstance(CyberBrickUploadSettingsService);

	const handler = new WebViewMessageHandler(
		{ extensionPath: '/mock/extension', secrets: {} } as any,
		panelMock as any,
		localeServiceStub as any,
		fileServiceStub as any,
		settingsManagerStub as any,
		settingsSvcStub as any,
		undefined,
		undefined
	);

	return { handler, webviewPostMessage, settingsSvcStub, vscodeMock };
}

// ---------------------------------------------------------------------------
// Suite: generic requestUpload OTA fallback
// ---------------------------------------------------------------------------

suite('MessageHandler – generic requestUpload OTA fallback', () => {
	let sandbox: sinon.SinonSandbox;
	let vscodeMock: { window: { showWarningMessage: sinon.SinonStub; showErrorMessage: sinon.SinonStub }; workspace: { workspaceFolders: unknown[] }; [key: string]: unknown };

	setup(() => {
		sandbox = sinon.createSandbox();
		vscodeMock = {
			window: {
				showWarningMessage: sandbox.stub().resolves(),
				showErrorMessage: sandbox.stub().resolves(),
			},
			workspace: {
				workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
			},
		} as any;
		_setVSCodeApi(vscodeMock as any);
	});

	teardown(() => {
		_reset();
		sandbox.restore();
	});

	test('requestUpload OTA fallback refreshes CyberBrick panel state after upload completes', async () => {
		const { handler, webviewPostMessage, settingsSvcStub } = makeHandlerHarness(sandbox, vscodeMock);
		const previousAgentVersion = '1.5.2';
		const device = makeDevice({ agentVersion: previousAgentVersion });
		const refreshedDevice = makeDevice({ agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION });
		const refreshedPanelState: CyberBrickUploadPanelState = {
			settings: makeSettings({ primaryDeviceId: refreshedDevice.deviceId, pairedDevices: [refreshedDevice] }),
			secretPresence: {},
			readiness: undefined,
		};

		settingsSvcStub.loadSettings.resolves(makeSettings({ primaryDeviceId: device.deviceId, pairedDevices: [device] }));
		settingsSvcStub.buildPanelState.resolves(refreshedPanelState);
		settingsSvcStub.buildOtaReadinessStatus.resolves({
			ready: true,
			device: refreshedDevice,
			checks: [{ code: 'ok', ok: true, message: 'Ready', nextActions: [] }],
			blockingReasons: [],
			nextActions: [],
		});

		sandbox.stub(MicropythonUploader.prototype, 'ensureMpremoteAvailable').resolves({ success: true });
		sandbox.stub(MicropythonUploader.prototype, 'listPorts').resolves({ ports: [], autoDetected: undefined });

		(handler as any).cyberBrickOtaUploader = {
				checkReadiness: sandbox.stub().resolves({
					ready: true,
					device: refreshedDevice,
					checks: [{ code: 'ok', ok: true, message: 'Ready', nextActions: [] }],
					blockingReasons: [],
					nextActions: [],
				}),
			upload: sandbox.stub().callsFake(async (_payload: unknown, onProgress: (progress: { status: string; progress: number; stageMessage: string }) => void) => {
				onProgress({ status: 'upgrading_agent', progress: 30, stageMessage: `Upgrading CyberBrick OTA agent ${previousAgentVersion} \u2192 ${CYBERBRICK_OTA_AGENT_TARGET_VERSION}...` });
				onProgress({ status: 'agent_upgraded', progress: 45, stageMessage: `CyberBrick OTA agent upgraded to ${CYBERBRICK_OTA_AGENT_TARGET_VERSION}.` });
				return {
					status: 'succeeded',
					errorCode: null,
					stageMessage: 'Done',
					progress: 100,
					stage: 'done',
					startedAt: '2025-01-01T00:00:00Z',
					finishedAt: '2025-01-01T00:00:01Z',
					userFacingSummary: 'Upload complete',
				};
			}),
		};

		await handler.handleMessage({
			command: 'requestUpload',
			board: 'cyberbrick',
			code: 'print(1)',
		});

		const progressMessages = webviewPostMessage.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]).filter((message: { command?: string }) => message.command === 'uploadProgress');
		assert.ok(progressMessages.some((message: { stage?: string; message?: string }) => message.stage === 'preparing' && (message.message ?? '').includes(`${previousAgentVersion} \u2192 ${CYBERBRICK_OTA_AGENT_TARGET_VERSION}`)),
			'generic OTA fallback should surface the version upgrade message as preparing progress');

		const panelRefresh = webviewPostMessage.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]).find((message: { command?: string }) => message.command === 'cyberbrickUploadSettingsLoaded');
		assert.ok(panelRefresh, 'generic OTA fallback should refresh CyberBrick panel state after upload');
		assert.strictEqual(panelRefresh.payload.settings.pairedDevices[0].agentVersion, CYBERBRICK_OTA_AGENT_TARGET_VERSION);
			assert.ok((handler as any).cyberBrickOtaUploader.checkReadiness.calledOnce, 'generic OTA fallback should refresh panel state from live readiness');
	});

	test('requestUpload prepares mpremote before CyberBrick USB pre-detect', async () => {
		const { handler, webviewPostMessage } = makeHandlerHarness(sandbox, vscodeMock);
		const ensureMpremote = sandbox.stub(MicropythonUploader.prototype, 'ensureMpremoteAvailable').callsFake(async onProgress => {
			onProgress?.({ stage: 'installing_tool', progress: 20, message: 'Installing mpremote...' });
			return { success: true };
		});
		const listPorts = sandbox.stub(MicropythonUploader.prototype, 'listPorts').resolves({
			ports: [{ path: 'COM7', vendorId: '303A', productId: '1001' }],
			autoDetected: 'COM7',
		});
		const upload = sandbox.stub(MicropythonUploader.prototype, 'upload').resolves({
			success: true,
			timestamp: '2026-06-04T00:00:00.000Z',
			port: 'COM7',
			duration: 1,
		});

		await handler.handleMessage({
			command: 'requestUpload',
			board: 'cyberbrick',
			code: 'print(1)',
		});

		sinon.assert.callOrder(ensureMpremote, listPorts, upload);
		assert.deepStrictEqual(upload.firstCall.args[0], { code: 'print(1)', board: 'cyberbrick', port: 'COM7' });
		const messages = webviewPostMessage.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]);
		assert.ok(messages.some((message: { command?: string; stage?: string }) => message.command === 'uploadProgress' && message.stage === 'installing_tool'));
		assert.ok(messages.some((message: { command?: string; success?: boolean; port?: string }) => message.command === 'uploadResult' && message.success === true && message.port === 'COM7'));
	});

	test('requestUpload reports mpremote setup failure before falling back to OTA', async () => {
		const { handler, webviewPostMessage } = makeHandlerHarness(sandbox, vscodeMock);
		sandbox.stub(MicropythonUploader.prototype, 'ensureMpremoteAvailable').resolves({
			success: false,
			stage: 'installing_tool',
			message: 'mpremote installation failed',
			details: 'Please run manually: pip install mpremote',
		});
		const listPorts = sandbox.stub(MicropythonUploader.prototype, 'listPorts').resolves({ ports: [], autoDetected: undefined });
		const otaUpload = sandbox.stub().resolves({ status: 'succeeded' });
		(handler as any).cyberBrickOtaUploader = { upload: otaUpload };

		await handler.handleMessage({
			command: 'requestUpload',
			board: 'cyberbrick',
			code: 'print(1)',
		});

		assert.strictEqual(listPorts.called, false);
		assert.strictEqual(otaUpload.called, false);
		const result = webviewPostMessage.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]).find((message: { command?: string }) => message.command === 'uploadResult');
		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error.stage, 'installing_tool');
		assert.strictEqual(result.error.message, 'mpremote installation failed');
		assert.strictEqual(result.error.details, 'Please run manually: pip install mpremote');
	});
});
