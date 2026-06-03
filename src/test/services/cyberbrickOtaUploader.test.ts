import assert = require('assert');
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { suite, test, beforeEach } from 'mocha';
import { CyberBrickOtaUploader, CyberBrickFetch, CYBERBRICK_OTA_AGENT_TARGET_VERSION } from '../../services/cyberbrickOtaUploader';
import { CyberBrickUploadSettingsService } from '../../services/cyberbrickUploadSettingsService';
import { MockSecretStorage, MockWorkspaceConfiguration, createCyberBrickMockContext } from '../helpers/cyberbrickUploadMocks';
import { CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START } from '../../services/cyberbrickOtaAgentSource';
import { CYBERBRICK_OTA_REMOTE_PATH } from '../../types/cyberbrickUpload';
import { CYBERBRICK_TEST_DEVICE_ID, CYBERBRICK_TEST_TOKEN, createCyberBrickDevice, createCyberBrickUploadSettings } from '../fixtures/cyberbrickUploadFixtures';

suite('CyberBrickOtaUploader', () => {
	let secrets: MockSecretStorage;
	let configuration: MockWorkspaceConfiguration;
	let settingsService: CyberBrickUploadSettingsService;
	let fetchStub: sinon.SinonStub;

	beforeEach(async () => {
		secrets = new MockSecretStorage();
		configuration = new MockWorkspaceConfiguration();
		settingsService = new CyberBrickUploadSettingsService(createCyberBrickMockContext(secrets), vscode.Uri.file('/workspace'), {
			configuration,
			now: () => new Date('2026-01-20T12:00:00.000Z'),
		});
		fetchStub = sinon.stub();
	});

	function jsonResponse(status: number, body: unknown) {
		return {
			ok: status >= 200 && status < 300,
			status,
			json: async () => body,
			text: async () => JSON.stringify(body),
		};
	}

	async function seedReadyDevice() {
		const device = createCyberBrickDevice({ lastKnownIp: '192.168.1.50', otaPort: 8266 });
		configuration.values.set(CYBERBRICK_TEST_DEVICE_ID, 'unused');
		configuration.values.set('singular-blockly.cyberbrick.uploadSettings', createCyberBrickUploadSettings({
			pairedDevices: [device],
			primaryDeviceId: device.deviceId,
		}));
		await settingsService.storeDeviceSecret(device.deviceId, 'otaToken', CYBERBRICK_TEST_TOKEN);
		return device;
	}

	test('fails readiness before network calls when OTA token is missing', async () => {
		const device = createCyberBrickDevice({ lastKnownIp: '192.168.1.50' });
		configuration.values.set('singular-blockly.cyberbrick.uploadSettings', createCyberBrickUploadSettings({
			pairedDevices: [device],
			primaryDeviceId: device.deviceId,
		}));
		const uploader = new CyberBrickOtaUploader(settingsService, { fetch: fetchStub as unknown as CyberBrickFetch });

		const readiness = await uploader.checkReadiness();

		assert.strictEqual(readiness.ready, false);
		assert(readiness.blockingReasons.includes('missing-ota-token'));
		assert.strictEqual(fetchStub.called, false);
	});

	test('detects identity mismatch during health validation', async () => {
		await seedReadyDevice();
		fetchStub.resolves(jsonResponse(200, {
			deviceId: 'different-device',
			agentVersion: '1.0.0',
			protocolVersion: 1,
			supportedProtocolVersions: [1],
			appPath: CYBERBRICK_OTA_REMOTE_PATH,
			status: 'ready',
		}));
		const uploader = new CyberBrickOtaUploader(settingsService, { fetch: fetchStub as unknown as CyberBrickFetch });

		const readiness = await uploader.checkReadiness();

		assert.strictEqual(readiness.ready, false);
		assert(readiness.blockingReasons.includes('identity-mismatch'));
	});

	test('uploads /app/rc_main.py with v2 raw binary upload protocol', async () => {
		const device = await seedReadyDevice();
		fetchStub.onFirstCall().resolves(jsonResponse(200, {
			deviceId: device.deviceId,
			agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
			protocolVersion: 2,
			supportedProtocolVersions: [2],
			appPath: CYBERBRICK_OTA_REMOTE_PATH,
			status: 'ready',
		}));
		fetchStub.onSecondCall().callsFake(async (_url: string, init: any) => {
			const sha256 = init.headers['X-Singular-Content-Sha256'];
			const opId = init.headers['X-Singular-Operation-Id'];
			return jsonResponse(200, {
				operationId: opId,
				deviceId: device.deviceId,
				remotePath: CYBERBRICK_OTA_REMOTE_PATH,
				bytesWritten: init.body.length,
				contentSha256: sha256,
				restarted: false,
				status: 'written',
			});
		});
		const uploader = new CyberBrickOtaUploader(settingsService, {
			fetch: fetchStub as unknown as CyberBrickFetch,
			operationIdFactory: () => 'op-test',
		});

		const result = await uploader.upload({ board: 'cyberbrick', code: 'print(1)' });

		assert.strictEqual(result.status, 'succeeded');
		assert.strictEqual(result.remotePath, CYBERBRICK_OTA_REMOTE_PATH);
		assert.strictEqual(fetchStub.callCount, 2, 'fast-path upload should reuse the successful readiness health check instead of resetting first');
		assert.strictEqual(fetchStub.secondCall.args[0], 'http://192.168.1.50:8266/api/v1/upload');
		assert.strictEqual(fetchStub.secondCall.args[1].headers.Authorization.includes(CYBERBRICK_TEST_TOKEN), true);
		assert.strictEqual(fetchStub.secondCall.args[1].headers['Content-Type'], 'application/octet-stream');
		const uploadedCode = Buffer.from(fetchStub.secondCall.args[1].body).toString('utf8');
		assert.ok(uploadedCode.startsWith(CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START));
		assert.ok(uploadedCode.includes('_singular_blockly_ota_agent.start_background(False)'));
		assert.ok(uploadedCode.includes('try:\n    print(1)\n'));
		assert.ok(uploadedCode.includes('_singular_blockly_ota_sys.print_exception(_singular_blockly_ota_exc)'));
	});

	test('does not fall back to USB on token rejection', async () => {
		await seedReadyDevice();
		fetchStub.resolves(jsonResponse(401, { error: 'token-rejected' }));
		const uploader = new CyberBrickOtaUploader(settingsService, { fetch: fetchStub as unknown as CyberBrickFetch });

		const result = await uploader.upload({ board: 'cyberbrick', code: 'print(1)' });

		assert.strictEqual(result.status, 'failed');
		assert.strictEqual(result.errorCode, 'token-rejected');
	});

	test('recovers preflight health probing when the device is briefly too busy to answer the first readiness check', async () => {
		const device = await seedReadyDevice();
		fetchStub.onFirstCall().rejects(new Error('socket hang up'));
		fetchStub.onSecondCall().resolves(jsonResponse(200, {
			deviceId: device.deviceId,
			agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
			protocolVersion: 2,
			supportedProtocolVersions: [2],
			appPath: CYBERBRICK_OTA_REMOTE_PATH,
			status: 'ready',
		}));
		fetchStub.onThirdCall().callsFake(async (_url: string, init: any) => {
			const sha256 = init.headers['X-Singular-Content-Sha256'];
			const opId = init.headers['X-Singular-Operation-Id'];
			return jsonResponse(200, {
				operationId: opId,
				deviceId: device.deviceId,
				remotePath: CYBERBRICK_OTA_REMOTE_PATH,
				bytesWritten: init.body.length,
				contentSha256: sha256,
				restarted: false,
				status: 'written',
			});
		});
		const uploader = new CyberBrickOtaUploader(settingsService, {
			fetch: fetchStub as unknown as CyberBrickFetch,
			operationIdFactory: () => 'op-recover',
			retryIntervalMs: 0,
		});

		const result = await uploader.upload({ board: 'cyberbrick', code: 'print(1)' });

		assert.strictEqual(result.status, 'succeeded');
		assert.strictEqual(fetchStub.callCount, 3, 'upload should retry readiness once before the final /upload call');
		assert.strictEqual(fetchStub.thirdCall.args[0], 'http://192.168.1.50:8266/api/v1/upload');
	});

	test('continues with the main upload when transient preflight health probing never catches the response window', async () => {
		const device = await seedReadyDevice();
		const requestedUrls: string[] = [];
		fetchStub.callsFake(async (url: string, init?: any) => {
			requestedUrls.push(url);
			if (url.endsWith('/health')) {
				throw Object.assign(new Error('socket hang up'), { code: 'network-error' });
			}
			const sha256 = init.headers['X-Singular-Content-Sha256'];
			const opId = init.headers['X-Singular-Operation-Id'];
			return jsonResponse(200, {
				operationId: opId,
				deviceId: device.deviceId,
				remotePath: CYBERBRICK_OTA_REMOTE_PATH,
				bytesWritten: init.body.length,
				contentSha256: sha256,
				restarted: false,
				status: 'written',
			});
		});
		const uploader = new CyberBrickOtaUploader(settingsService, {
			fetch: fetchStub as unknown as CyberBrickFetch,
			operationIdFactory: () => 'op-optimistic-window',
			healthTimeoutMs: 20,
			retryIntervalMs: 0,
		});

		const result = await uploader.upload({ board: 'cyberbrick', code: 'print(1)' });

		assert.strictEqual(result.status, 'succeeded');
		assert.ok(requestedUrls.filter(url => url.endsWith('/health')).length >= 2, 'preflight should still probe health briefly before falling back to the optimistic upload path');
		assert.ok(requestedUrls.some(url => url.endsWith('/upload')), 'uploader should continue into the main /upload call even if health keeps missing the response window');
		assert.ok(!requestedUrls.some(url => url.endsWith('/reset')), 'optimistic preflight fallback should not pay a reset cost before the first direct upload attempt');
	});

	test('reuses the successful readiness window instead of requiring a second immediate health fetch before upload', async () => {
		const device = await seedReadyDevice();
		fetchStub.onFirstCall().resolves(jsonResponse(200, {
			deviceId: device.deviceId,
			agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
			protocolVersion: 2,
			supportedProtocolVersions: [2],
			appPath: CYBERBRICK_OTA_REMOTE_PATH,
			status: 'ready',
		}));
		fetchStub.onSecondCall().callsFake(async (_url: string, init: any) => {
			const sha256 = init.headers['X-Singular-Content-Sha256'];
			const opId = init.headers['X-Singular-Operation-Id'];
			return jsonResponse(200, {
				operationId: opId,
				deviceId: device.deviceId,
				remotePath: CYBERBRICK_OTA_REMOTE_PATH,
				bytesWritten: init.body.length,
				contentSha256: sha256,
				restarted: false,
				status: 'written',
			});
		});
		const uploader = new CyberBrickOtaUploader(settingsService, {
			fetch: fetchStub as unknown as CyberBrickFetch,
			operationIdFactory: () => 'op-single-window',
		});

		const result = await uploader.upload({ board: 'cyberbrick', code: 'print(1)' });

		assert.strictEqual(result.status, 'succeeded');
		assert.strictEqual(fetchStub.callCount, 2, 'upload should proceed once the first readiness window succeeds');
	});

	test('retries after direct upload window times out by polling agent recovery', async () => {
		const device = await seedReadyDevice();
		fetchStub.onFirstCall().resolves(jsonResponse(200, {
			deviceId: device.deviceId,
			agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
			protocolVersion: 2,
			supportedProtocolVersions: [2],
			appPath: CYBERBRICK_OTA_REMOTE_PATH,
			status: 'ready',
		}));
		fetchStub.onSecondCall().returns(new Promise(() => undefined));
		fetchStub.onThirdCall().resolves(jsonResponse(200, { restarting: true }));
		fetchStub.onCall(3).resolves(jsonResponse(200, {
			deviceId: device.deviceId,
			agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
			protocolVersion: 2,
			supportedProtocolVersions: [2],
			appPath: CYBERBRICK_OTA_REMOTE_PATH,
			status: 'ready',
		}));
		fetchStub.onCall(4).callsFake(async (_url: string, init: any) => {
			const sha256 = init.headers['X-Singular-Content-Sha256'];
			const opId = init.headers['X-Singular-Operation-Id'];
			return jsonResponse(200, {
				operationId: opId,
				deviceId: device.deviceId,
				remotePath: CYBERBRICK_OTA_REMOTE_PATH,
				bytesWritten: init.body.length,
				contentSha256: sha256,
				restarted: false,
				status: 'written',
			});
		});
		const uploader = new CyberBrickOtaUploader(settingsService, {
			fetch: fetchStub as unknown as CyberBrickFetch,
			operationIdFactory: () => 'op-reset-retry',
			uploadTimeoutMs: 10,
		});

		const result = await uploader.upload({ board: 'cyberbrick', code: 'print(1)' });

		assert.strictEqual(result.status, 'succeeded');
		assert.strictEqual(fetchStub.callCount, 5, 'upload should retry once after agent recovery polling when the direct attempt times out');
		// Agent recovery uses /reset endpoint to trigger device reboot, then polls /health for readiness
		assert.strictEqual(fetchStub.getCall(2).args[0], 'http://192.168.1.50:8266/api/v1/reset', 'should call reset to trigger recovery');
		assert.strictEqual(fetchStub.getCall(4).args[0], 'http://192.168.1.50:8266/api/v1/upload');
	});
});
