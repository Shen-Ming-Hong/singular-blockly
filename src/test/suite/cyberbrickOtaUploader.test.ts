/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import {
	CyberBrickOtaUploader,
	CyberBrickFetch,
	parseAgentVersion,
	compareAgentVersion,
	CYBERBRICK_OTA_AGENT_TARGET_VERSION,
	CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION,
} from '../../services/cyberbrickOtaUploader';
import { CyberBrickUploadSettingsService } from '../../services/cyberbrickUploadSettingsService';
import { PairedCyberBrickDevice, OtaReadinessStatus } from '../../types/cyberbrickUpload';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDevice(overrides: Partial<PairedCyberBrickDevice> = {}): PairedCyberBrickDevice {
	return {
		deviceId: 'test-device-01',
		friendlyName: 'Test CyberBrick',
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-01T00:00:00Z',
		otaPort: 8266,
		protocolVersion: 2,
		lastKnownIp: '192.168.1.100',
		agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
		...overrides,
	};
}

function makeReadiness(device: PairedCyberBrickDevice, ready = true): OtaReadinessStatus {
	return {
		ready,
		device,
		checks: ready ? [{ code: 'ok', ok: true, message: 'Ready', nextActions: [] }] : [{ code: 'missing-primary-device', ok: false, message: 'Not ready', nextActions: [] }],
		blockingReasons: ready ? [] : ['missing-primary-device'],
		nextActions: [],
	};
}

function makeFetch(responses: Array<{ ok: boolean; status?: number; json?: object } | 'error' | 'econnrefused'>): CyberBrickFetch {
	let idx = 0;
	return async (_url: string, _init?: object) => {
		const resp = responses[Math.min(idx++, responses.length - 1)];
		if (resp === 'error') {
			throw Object.assign(new Error('Network error'), { code: 'network-error' });
		}
		if (resp === 'econnrefused') {
			throw Object.assign(new Error('Connection refused'), { code: 'ECONNREFUSED' });
		}
		const body = resp.json ?? {};
		return {
			ok: resp.ok,
			status: resp.status ?? (resp.ok ? 200 : 500),
			json: async () => body,
			text: async () => JSON.stringify(body),
		};
	};
}

function makeSettingsService(sandbox: sinon.SinonSandbox, device: PairedCyberBrickDevice): sinon.SinonStubbedInstance<CyberBrickUploadSettingsService> {
	const svc = sandbox.createStubInstance(CyberBrickUploadSettingsService);
	svc.buildOtaReadinessStatus.resolves(makeReadiness(device));
	svc.getDeviceSecret.resolves('test-ota-token-abc123');
	svc.updateDeviceMetadata.resolves();
	return svc;
}


// ---------------------------------------------------------------------------
// Tests: parseAgentVersion()
// ---------------------------------------------------------------------------

suite('CyberBrick OTA Uploader - parseAgentVersion()', () => {
	test('undefined returns [0, 0, 0]', () => {
		assert.deepStrictEqual(parseAgentVersion(undefined), [0, 0, 0]);
	});

	test('empty string returns [0, 0, 0]', () => {
		assert.deepStrictEqual(parseAgentVersion(''), [0, 0, 0]);
	});

	test('invalid format returns [0, 0, 0]', () => {
		assert.deepStrictEqual(parseAgentVersion('abc'), [0, 0, 0]);
		assert.deepStrictEqual(parseAgentVersion('1.2'), [0, 0, 0]);
		assert.deepStrictEqual(parseAgentVersion('1.2.3.4'), [0, 0, 0]);
	});

	test('valid semver parsed correctly', () => {
		assert.deepStrictEqual(parseAgentVersion('1.0.0'), [1, 0, 0]);
		assert.deepStrictEqual(parseAgentVersion('1.3.0'), [1, 3, 0]);
		assert.deepStrictEqual(parseAgentVersion('2.10.5'), [2, 10, 5]);
	});
});

// ---------------------------------------------------------------------------
// Tests: compareAgentVersion()
// ---------------------------------------------------------------------------

suite('CyberBrick OTA Uploader - compareAgentVersion()', () => {
	test('undefined treated as 0.0.0 - less than any real version', () => {
		assert.ok(compareAgentVersion(undefined, CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION) < 0);
	});

	test('equal versions return 0', () => {
		assert.strictEqual(compareAgentVersion('1.4.0', '1.4.0'), 0);
		assert.strictEqual(compareAgentVersion(CYBERBRICK_OTA_AGENT_TARGET_VERSION, CYBERBRICK_OTA_AGENT_TARGET_VERSION), 0);
	});

	test('< MIN returns negative', () => {
		assert.ok(compareAgentVersion('1.3.0', CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION) < 0);
		assert.ok(compareAgentVersion('0.9.9', CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION) < 0);
	});

	test('= MIN returns 0', () => {
		assert.strictEqual(compareAgentVersion(CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION, CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION), 0);
	});

	test('> TARGET returns positive', () => {
		const [maj, min, patch] = parseAgentVersion(CYBERBRICK_OTA_AGENT_TARGET_VERSION);
		const higher = `${maj}.${min}.${patch + 1}`;
		assert.ok(compareAgentVersion(higher, CYBERBRICK_OTA_AGENT_TARGET_VERSION) > 0);
	});
});

// ---------------------------------------------------------------------------
// Tests: waitForAgentReady()
// ---------------------------------------------------------------------------

suite('CyberBrick OTA Uploader - waitForAgentReady()', () => {
	let sandbox: sinon.SinonSandbox;

	setup(() => {
		sandbox = sinon.createSandbox();
	});

	teardown(() => {
		sandbox.restore();
	});

	test('returns true when agent responds with matching deviceId', async () => {
		const device = makeDevice();
		const settingsSvc = makeSettingsService(sandbox, device);
		const fetch = makeFetch([{ ok: true, json: { deviceId: 'test-device-01', agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION } }]);
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, { fetch, healthTimeoutMs: 5000 });

		const result = await uploader.waitForAgentReady(device, 'token', 5000, 0);
		assert.strictEqual(result, true);
	});

	test('ECONNREFUSED is treated as expected rebooting state', async () => {
		const device = makeDevice();
		const settingsSvc = makeSettingsService(sandbox, device);
		// First call: ECONNREFUSED, second: success
		const fetch = makeFetch([
			'econnrefused',
			{ ok: true, json: { deviceId: 'test-device-01' } },
		]);
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, { fetch, healthTimeoutMs: 5000 });

		const result = await uploader.waitForAgentReady(device, 'token', 10000, 0);
		assert.strictEqual(result, true);
	});

	test('returns false on timeout', async () => {
		const device = makeDevice();
		const settingsSvc = makeSettingsService(sandbox, device);
		const fetch = makeFetch(['econnrefused']);
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, { fetch, healthTimeoutMs: 100 });

		// Very short timeout — always times out
		const result = await uploader.waitForAgentReady(device, 'token', 0, 0);
		assert.strictEqual(result, false);
	});
});

// ---------------------------------------------------------------------------
// Tests: upgradeAgentOverWifi()
// ---------------------------------------------------------------------------

suite('CyberBrick OTA Uploader - upgradeAgentOverWifi()', () => {
	let sandbox: sinon.SinonSandbox;

	setup(() => {
		sandbox = sinon.createSandbox();
	});

	teardown(() => {
		sandbox.restore();
	});

	test('success: sends POST with X-Singular-Content-Sha256 header, calls waitForAgentReady', async () => {
		const device = makeDevice();
		const settingsSvc = makeSettingsService(sandbox, device);
		const capturedRequests: Array<{ url: string; init?: object }> = [];
		const fetch: CyberBrickFetch = async (url, init) => {
			capturedRequests.push({ url, init });
			// upload-agent responds OK; health responds with matching deviceId
			if (url.includes('/upload-agent')) {
				return { ok: true, status: 200, json: async () => ({}), text: async () => '{}' };
			}
			return { ok: true, status: 200, json: async () => ({ deviceId: 'test-device-01', agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION }), text: async () => '' };
		};
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, { fetch, healthTimeoutMs: 5000, uploadTimeoutMs: 5000, retryIntervalMs: 0 });

		const result = await uploader.upgradeAgentOverWifi(device, 'test-ota-token-abc123', {
			deviceId: 'test-device-01',
			otaToken: 'test-ota-token-abc123',
			otaPort: 8266,
		});
		assert.strictEqual(result, 'upgraded');

		// Verify the upload request included the SHA-256 header
		const uploadReq = capturedRequests.find(r => r.url.includes('/upload-agent'));
		assert.ok(uploadReq, 'upload-agent request not found');
		const headers = (uploadReq!.init as { headers?: Record<string, string> })?.headers ?? {};
		assert.ok(headers['X-Singular-Content-Sha256'], 'SHA-256 header missing');
		assert.match(headers['X-Singular-Content-Sha256'], /^[0-9a-f]{64}$/, 'SHA-256 should be 64 hex chars');
	});

	test('failure: upload HTTP error returns "failed"', async () => {
		const device = makeDevice();
		const settingsSvc = makeSettingsService(sandbox, device);
		const fetch = makeFetch([{ ok: false, status: 500 }]);
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, { fetch, healthTimeoutMs: 5000, uploadTimeoutMs: 5000, postUpgradeRecoveryTimeoutMs: 0, retryIntervalMs: 0 });

		const result = await uploader.upgradeAgentOverWifi(device, 'test-ota-token-abc123', {
			deviceId: 'test-device-01',
			otaToken: 'test-ota-token-abc123',
			otaPort: 8266,
		});
		assert.strictEqual(result, 'failed');
	});

	test('failure: network error returns "failed"', async () => {
		const device = makeDevice();
		const settingsSvc = makeSettingsService(sandbox, device);
		const fetch = makeFetch(['error']);
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, { fetch, healthTimeoutMs: 5000, uploadTimeoutMs: 5000, postUpgradeRecoveryTimeoutMs: 0, retryIntervalMs: 0 });

		const result = await uploader.upgradeAgentOverWifi(device, 'test-ota-token-abc123', {
			deviceId: 'test-device-01',
			otaToken: 'test-ota-token-abc123',
			otaPort: 8266,
		});
		assert.strictEqual(result, 'failed');
	});

	test('upload timeout recovers when health later reports the target version', async () => {
		const device = makeDevice({ agentVersion: '1.5.2' });
		const settingsSvc = makeSettingsService(sandbox, device);
		const fetch: CyberBrickFetch = async url => {
			if (url.includes('/upload-agent')) {
				return await new Promise(() => undefined);
			}
			return {
				ok: true,
				status: 200,
				json: async () => ({ deviceId: 'test-device-01', agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION }),
				text: async () => '',
			};
		};
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, {
			fetch,
			healthTimeoutMs: 20,
			uploadTimeoutMs: 5,
			retryIntervalMs: 0,
			postUpgradeRecoveryTimeoutMs: 20,
		});

		const result = await uploader.upgradeAgentOverWifi(device, 'test-ota-token-abc123', {
			deviceId: 'test-device-01',
			otaToken: 'test-ota-token-abc123',
			otaPort: 8266,
		});
		assert.strictEqual(result, 'upgraded');
	});
});

// ---------------------------------------------------------------------------
// Tests: upload() pipeline agent upgrade branches
// ---------------------------------------------------------------------------

suite('CyberBrick OTA Uploader - upload() pipeline', () => {
	let sandbox: sinon.SinonSandbox;

	setup(() => {
		sandbox = sinon.createSandbox();
	});

	teardown(() => {
		sandbox.restore();
	});

	function makeUploadFetch(agentVersion: string): CyberBrickFetch {
		return async (url, init) => {
			if (url.includes('/health')) {
				return { ok: true, status: 200, json: async () => ({ deviceId: 'test-device-01', agentVersion, protocolVersion: 2, appPath: '/app/rc_main.py' }), text: async () => '' };
			}
			if (url.includes('/reset')) {
				return { ok: true, status: 200, json: async () => ({ restarting: true }), text: async () => '' };
			}
			if (url.includes('/upload-agent')) {
				// Return success for agent upgrade
				return { ok: true, status: 200, json: async () => ({}), text: async () => '{}' };
			}
			// /upload endpoint — echo back operationId and contentSha256 from request headers
			const headers = (init as { headers?: Record<string, string> })?.headers ?? {};
			const operationId = headers['X-Singular-Operation-Id'] ?? '';
			const contentSha256 = headers['X-Singular-Content-Sha256'] ?? '';
			return {
				ok: true, status: 200,
				json: async () => ({ operationId, deviceId: 'test-device-01', remotePath: '/app/rc_main.py', bytesWritten: 100, contentSha256, restarted: true }),
				text: async () => '',
			};
		};
	}

	test('agentVersion < MIN → still attempts agent upgrade first and succeeds when upgrade recovers', async () => {
		const device = makeDevice({ agentVersion: '1.0.0' });
		const settingsSvc = makeSettingsService(sandbox, device);
		let uploadAgentAttempted = false;
		const fetch: CyberBrickFetch = async (url, init) => {
			if (url.includes('/upload-agent')) {
				uploadAgentAttempted = true;
				return { ok: true, status: 200, json: async () => ({}), text: async () => '{}' };
			}
			if (url.includes('/health')) {
				return {
					ok: true,
					status: 200,
					json: async () => ({
						deviceId: 'test-device-01',
						agentVersion: uploadAgentAttempted ? CYBERBRICK_OTA_AGENT_TARGET_VERSION : '1.0.0',
						protocolVersion: 2,
						appPath: '/app/rc_main.py',
					}),
					text: async () => '',
				};
			}
			const headers = (init as { headers?: Record<string, string> })?.headers ?? {};
			const operationId = headers['X-Singular-Operation-Id'] ?? '';
			const contentSha256 = headers['X-Singular-Content-Sha256'] ?? '';
			return {
				ok: true,
				status: 200,
				json: async () => ({ operationId, deviceId: 'test-device-01', remotePath: '/app/rc_main.py', bytesWritten: 100, contentSha256, restarted: true }),
				text: async () => '',
			};
		};
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, { fetch, healthTimeoutMs: 5000, uploadTimeoutMs: 5000, retryIntervalMs: 0 });

		const stages: string[] = [];
		const run = await uploader.upload({ code: 'print("hi")', board: 'cyberbrick' }, progress => stages.push(progress.status));

		assert.strictEqual(run.status, 'succeeded');
		assert.strictEqual(uploadAgentAttempted, true, 'upload-agent should be attempted even when the live version is below MIN');
		assert.ok(stages.includes('upgrading_agent'), `Expected upgrading_agent stage, got: ${stages.join(', ')}`);
		assert.ok(stages.includes('agent_upgraded'), `Expected agent_upgraded stage, got: ${stages.join(', ')}`);
	});

	test('agentVersion < MIN → upgrade failure emits warning and upload still continues', async () => {
		const device = makeDevice({ agentVersion: '1.0.0' });
		const settingsSvc = makeSettingsService(sandbox, device);
		const fetch: CyberBrickFetch = async (url, init) => {
			if (url.includes('/upload-agent')) {
				throw Object.assign(new Error('Network failure'), { code: 'network-error' });
			}
			if (url.includes('/health')) {
				return { ok: true, status: 200, json: async () => ({ deviceId: 'test-device-01', agentVersion: '1.0.0', protocolVersion: 2, appPath: '/app/rc_main.py' }), text: async () => '' };
			}
			const headers = (init as { headers?: Record<string, string> })?.headers ?? {};
			const operationId = headers['X-Singular-Operation-Id'] ?? '';
			const contentSha256 = headers['X-Singular-Content-Sha256'] ?? '';
			return {
				ok: true,
				status: 200,
				json: async () => ({ operationId, deviceId: 'test-device-01', remotePath: '/app/rc_main.py', bytesWritten: 100, contentSha256, restarted: true }),
				text: async () => '',
			};
		};
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, {
			fetch,
			healthTimeoutMs: 5000,
			uploadTimeoutMs: 5000,
			retryIntervalMs: 0,
			postUpgradeRecoveryTimeoutMs: 0,
		});

		const stages: string[] = [];
		const errorCodes: (string | undefined)[] = [];
		const run = await uploader.upload({ code: 'print("hi")', board: 'cyberbrick' }, progress => {
			stages.push(progress.status);
			if (progress.errorCode) {
				errorCodes.push(progress.errorCode);
			}
		});

		assert.strictEqual(run.status, 'succeeded');
		assert.ok(stages.includes('upgrading_agent'), `Expected upgrading_agent stage, got: ${stages.join(', ')}`);
		assert.ok(stages.includes('agent_upgrade_needed'), `Expected agent_upgrade_needed stage, got: ${stages.join(', ')}`);
		assert.ok(errorCodes.includes('agent-upgrade-failed'), 'Expected the upgrade warning error code to be surfaced in progress');
	});

	test('agentVersion >= TARGET → upload proceeds without upgrading agent', async () => {
		const device = makeDevice({ agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION });
		const settingsSvc = makeSettingsService(sandbox, device);
		const capturedUrls: string[] = [];
		const fetch: CyberBrickFetch = async (url, init) => {
			capturedUrls.push(url);
			if (url.includes('/health')) {
				return { ok: true, status: 200, json: async () => ({ deviceId: 'test-device-01', agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION, protocolVersion: 2, appPath: '/app/rc_main.py' }), text: async () => '' };
			}
			const headers = (init as { headers?: Record<string, string> })?.headers ?? {};
			const operationId = headers['X-Singular-Operation-Id'] ?? '';
			const contentSha256 = headers['X-Singular-Content-Sha256'] ?? '';
			return {
				ok: true, status: 200,
				json: async () => ({ operationId, deviceId: 'test-device-01', remotePath: '/app/rc_main.py', bytesWritten: 100, contentSha256, restarted: true }),
				text: async () => '',
			};
		};
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, { fetch, healthTimeoutMs: 5000, uploadTimeoutMs: 5000, retryIntervalMs: 0 });

		const stages: string[] = [];
		const run = await uploader.upload({ code: 'print("hi")', board: 'cyberbrick' }, progress => stages.push(progress.status));
		assert.strictEqual(run.status, 'succeeded');
		// upload-agent should NOT have been called
		assert.ok(!capturedUrls.some(u => u.includes('/upload-agent')), 'upload-agent should not be called when version >= TARGET');
		assert.ok(!capturedUrls.some(u => u.includes('/reset')), 'fast-path uploads should not pay the reset cost when the current window is already usable');
	});

	test('direct upload timeout triggers agent recovery polling and retries the main upload', async () => {
			const device = makeDevice({ agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION });
			const settingsSvc = makeSettingsService(sandbox, device);
			const capturedUrls: string[] = [];
			let uploadAttempt = 0;
			const fetch: CyberBrickFetch = async (url, init) => {
				capturedUrls.push(url);
				if (url.includes('/health')) {
					return {
						ok: true,
						status: 200,
						json: async () => ({
							deviceId: 'test-device-01',
							agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
							protocolVersion: 2,
							appPath: '/app/rc_main.py',
						}),
						text: async () => '',
					};
				}
				if (url.includes('/reset')) {
					return { ok: true, status: 200, json: async () => ({ restarting: true }), text: async () => '{}' };
				}
				if (url.includes('/upload') && uploadAttempt++ === 0) {
					return await new Promise(() => undefined);
				}
				const headers = (init as { headers?: Record<string, string> })?.headers ?? {};
				const operationId = headers['X-Singular-Operation-Id'] ?? '';
				const contentSha256 = headers['X-Singular-Content-Sha256'] ?? '';
				return {
					ok: true,
					status: 200,
					json: async () => ({ operationId, deviceId: 'test-device-01', remotePath: '/app/rc_main.py', bytesWritten: 100, contentSha256, restarted: true }),
					text: async () => '',
				};
			};
			const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, { fetch, healthTimeoutMs: 5000, uploadTimeoutMs: 10, retryIntervalMs: 0 });

			const stages: string[] = [];
			const run = await uploader.upload({ code: 'print("hi")', board: 'cyberbrick' }, progress => stages.push(progress.status));

			assert.strictEqual(run.status, 'succeeded');
			assert.ok(capturedUrls.filter(u => u.includes('/health')).length >= 2, 'agent recovery health polling should occur after the direct upload window is missed');
			assert.ok(stages.includes('connecting'), 'fallback path should surface the reconnecting stage before retrying');
			assert.ok(capturedUrls.filter(u => u.includes('/upload')).length >= 2, 'main upload should be retried after reopening the upload window');
		});

	test('transient readiness health misses do not block the first direct upload attempt', async () => {
		const device = makeDevice({ agentVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION });
		const settingsSvc = makeSettingsService(sandbox, device);
		const capturedUrls: string[] = [];
		const fetch: CyberBrickFetch = async (url, init) => {
			capturedUrls.push(url);
			if (url.includes('/health')) {
				throw Object.assign(new Error('socket hang up'), { code: 'network-error' });
			}
			const headers = (init as { headers?: Record<string, string> })?.headers ?? {};
			const operationId = headers['X-Singular-Operation-Id'] ?? '';
			const contentSha256 = headers['X-Singular-Content-Sha256'] ?? '';
			return {
				ok: true,
				status: 200,
				json: async () => ({ operationId, deviceId: 'test-device-01', remotePath: '/app/rc_main.py', bytesWritten: 100, contentSha256, restarted: true }),
				text: async () => '',
			};
		};
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, {
			fetch,
			healthTimeoutMs: 20,
			retryIntervalMs: 0,
			uploadTimeoutMs: 5000,
		});

		const stages: string[] = [];
		const run = await uploader.upload({ code: 'print("hi")', board: 'cyberbrick' }, progress => stages.push(progress.status));

		assert.strictEqual(run.status, 'succeeded');
		assert.ok(capturedUrls.filter(u => u.includes('/health')).length >= 2, 'preflight should still probe health briefly before giving way to the direct upload attempt');
		assert.ok(capturedUrls.some(u => u.includes('/upload')), 'the main upload should still be attempted when transient health checks keep missing the window');
		assert.ok(!capturedUrls.some(u => u.includes('/reset')), 'transient preflight health misses alone should not force a pre-upload reset');
		assert.ok(stages.includes('transferring'), `Expected transferring stage, got: ${stages.join(', ')}`);
	});

	test('agentVersion between MIN and TARGET → emits upgrading_agent then agent_upgraded', async () => {
		// Simulate agentVersion exactly at MIN (so MIN <= v < TARGET)
		// This test works when MIN < TARGET; if they are equal, this branch is unreachable.
		const min = parseAgentVersion(CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION);
		const target = parseAgentVersion(CYBERBRICK_OTA_AGENT_TARGET_VERSION);
		const betweenExists = min[0] < target[0] || min[1] < target[1] || min[2] < target[2];

		if (!betweenExists) {
			// MIN === TARGET: the between-branch is unreachable by design; skip.
			return;
		}

		const upgradeVersion = CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION;
		const device = makeDevice({ agentVersion: upgradeVersion });
		const settingsSvc = makeSettingsService(sandbox, device);
		let callIdx = 0;
		const fetch: CyberBrickFetch = async (url, init) => {
			if (url.includes('/upload-agent')) {
				callIdx++;
				return { ok: true, status: 200, json: async () => ({}), text: async () => '{}' };
			}
			if (url.includes('/health')) {
				return {
					ok: true,
					status: 200,
					json: async () => ({
						deviceId: 'test-device-01',
						agentVersion: callIdx > 0 ? CYBERBRICK_OTA_AGENT_TARGET_VERSION : upgradeVersion,
						protocolVersion: 2,
						appPath: '/app/rc_main.py',
					}),
					text: async () => '',
				};
			}
			// /upload endpoint — echo back operationId and contentSha256 from request headers
			const headers = (init as { headers?: Record<string, string> })?.headers ?? {};
			const operationId = headers['X-Singular-Operation-Id'] ?? '';
			const contentSha256 = headers['X-Singular-Content-Sha256'] ?? '';
			return {
				ok: true, status: 200,
				json: async () => ({ operationId, deviceId: 'test-device-01', remotePath: '/app/rc_main.py', bytesWritten: 100, contentSha256, restarted: true }),
				text: async () => '',
			};
		};
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, { fetch, healthTimeoutMs: 5000, uploadTimeoutMs: 5000, retryIntervalMs: 0 });

		const stages: string[] = [];
		await uploader.upload({ code: 'print("hi")', board: 'cyberbrick' }, progress => stages.push(progress.status));
		assert.ok(stages.includes('upgrading_agent'), `Expected upgrading_agent stage, got: ${stages.join(', ')}`);
	});

	test('upgrade failure → agent_upgrade_needed warning emitted, upload continues (FR-007a)', async () => {
		const min = parseAgentVersion(CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION);
		const target = parseAgentVersion(CYBERBRICK_OTA_AGENT_TARGET_VERSION);
		const betweenExists = min[0] < target[0] || min[1] < target[1] || min[2] < target[2];
		if (!betweenExists) { return; }

		const upgradeVersion = CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION;
		const device = makeDevice({ agentVersion: upgradeVersion });
		const settingsSvc = makeSettingsService(sandbox, device);
		const fetch: CyberBrickFetch = async (url, init) => {
			if (url.includes('/upload-agent')) {
				throw Object.assign(new Error('Network failure'), { code: 'network-error' });
			}
			if (url.includes('/health')) {
				return { ok: true, status: 200, json: async () => ({ deviceId: 'test-device-01', agentVersion: upgradeVersion, protocolVersion: 2, appPath: '/app/rc_main.py' }), text: async () => '' };
			}
			// /upload endpoint — echo back operationId and contentSha256 from request headers
			const headers = (init as { headers?: Record<string, string> })?.headers ?? {};
			const operationId = headers['X-Singular-Operation-Id'] ?? '';
			const contentSha256 = headers['X-Singular-Content-Sha256'] ?? '';
			return {
				ok: true, status: 200,
				json: async () => ({ operationId, deviceId: 'test-device-01', remotePath: '/app/rc_main.py', bytesWritten: 100, contentSha256, restarted: true }),
				text: async () => '',
			};
		};
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, {
			fetch,
			healthTimeoutMs: 5000,
			uploadTimeoutMs: 5000,
			retryIntervalMs: 0,
			postUpgradeRecoveryTimeoutMs: 0,
		});

		const stages: string[] = [];
		const errorCodes: (string | undefined)[] = [];
		const run = await uploader.upload({ code: 'print("hi")', board: 'cyberbrick' }, progress => {
			stages.push(progress.status);
			if (progress.errorCode) { errorCodes.push(progress.errorCode); }
		});

		// FR-007a: upload should still succeed despite agent upgrade failure
		assert.strictEqual(run.status, 'succeeded');
		assert.ok(stages.includes('agent_upgrade_needed'), `Expected agent_upgrade_needed stage, got: ${stages.join(', ')}`);
		assert.ok(errorCodes.includes('agent-upgrade-failed'), `Expected agent-upgrade-failed error code in progress`);
	});

	test('ambiguous upload-agent timeout recovers and proceeds with upgraded stage before main upload', async () => {
		const min = parseAgentVersion(CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION);
		const target = parseAgentVersion(CYBERBRICK_OTA_AGENT_TARGET_VERSION);
		const betweenExists = min[0] < target[0] || min[1] < target[1] || min[2] < target[2];
		if (!betweenExists) { return; }

		const upgradeVersion = CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION;
		const device = makeDevice({ agentVersion: upgradeVersion });
		const settingsSvc = makeSettingsService(sandbox, device);
		let uploadAgentAttempted = false;
		const fetch: CyberBrickFetch = async (url, init) => {
			if (url.includes('/upload-agent')) {
				uploadAgentAttempted = true;
				return await new Promise(() => undefined);
			}
			if (url.includes('/health')) {
				return {
					ok: true,
					status: 200,
					json: async () => ({
						deviceId: 'test-device-01',
						agentVersion: uploadAgentAttempted ? CYBERBRICK_OTA_AGENT_TARGET_VERSION : upgradeVersion,
						protocolVersion: 2,
						appPath: '/app/rc_main.py',
					}),
					text: async () => '',
				};
			}
			const headers = (init as { headers?: Record<string, string> })?.headers ?? {};
			const operationId = headers['X-Singular-Operation-Id'] ?? '';
			const contentSha256 = headers['X-Singular-Content-Sha256'] ?? '';
			return {
				ok: true,
				status: 200,
				json: async () => ({ operationId, deviceId: 'test-device-01', remotePath: '/app/rc_main.py', bytesWritten: 100, contentSha256, restarted: true }),
				text: async () => '',
			};
		};
		const uploader = new CyberBrickOtaUploader(settingsSvc as unknown as CyberBrickUploadSettingsService, {
			fetch,
			healthTimeoutMs: 20,
			uploadTimeoutMs: 5,
			retryIntervalMs: 0,
			postUpgradeRecoveryTimeoutMs: 20,
		});

		const stages: string[] = [];
		const run = await uploader.upload({ code: 'print("hi")', board: 'cyberbrick' }, progress => stages.push(progress.status));
		assert.strictEqual(run.status, 'succeeded');
		assert.ok(stages.includes('agent_upgraded'), `Expected agent_upgraded stage, got: ${stages.join(', ')}`);
	});

});
