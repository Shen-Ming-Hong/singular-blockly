import assert = require('assert');
import * as path from 'path';
import { describe, it } from 'mocha';

type CountedStep = 'detect-usb' | 'read-device-id' | 'install-agent' | 'configure-wifi' | 'verify-agent' | 'store-secrets';
interface ProvisioningState {
	status: 'idle' | 'running' | 'succeeded' | 'failed';
	activeRequestId: string | null;
	completedSteps: Set<CountedStep>;
	steps: Map<CountedStep, { status: string; messageKey: string }>;
	failedStep: CountedStep | null;
	summaryKey: string | null;
}
interface ProvisioningApi {
	COUNTED_STEPS: readonly CountedStep[];
	createInitialState(): ProvisioningState;
	reduceState(state: ProvisioningState, event: any): ProvisioningState;
	parseProgressMessage(message: unknown, activeRequestId: string | null): any | null;
	parseResultMessage(message: unknown, activeRequestId: string | null): any | null;
}

const FAILED_STEP_MESSAGE_KEYS: Record<CountedStep, string> = {
	'detect-usb': 'CYBERBRICK_PROVISION_STEP_DETECT_USB_FAILED',
	'read-device-id': 'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_FAILED',
	'install-agent': 'CYBERBRICK_PROVISION_STEP_INSTALL_AGENT_FAILED',
	'configure-wifi': 'CYBERBRICK_PROVISION_STEP_CONFIGURE_WIFI_FAILED',
	'verify-agent': 'CYBERBRICK_PROVISION_STEP_VERIFY_AGENT_FAILED',
	'store-secrets': 'CYBERBRICK_PROVISION_STEP_STORE_SECRETS_FAILED',
};

const helperPath = path.resolve(__dirname, '../../../media/js/cyberbrickOtaProvisioningState.js');
const api = require(helperPath) as ProvisioningApi;

function start(requestId = 'request-1'): ProvisioningState {
	return api.reduceState(api.createInitialState(), { type: 'start', requestId });
}

function progress(state: ProvisioningState, step: CountedStep, success = true, extra: Record<string, unknown> = {}): ProvisioningState {
	return api.reduceState(state, { type: 'progress', requestId: state.activeRequestId, payload: { step, success, ...extra } });
}

describe('CyberBrick OTA provisioning state helper', () => {
	it('starts running with an empty determinate state and fixed six-step order', () => {
		assert.deepStrictEqual(api.COUNTED_STEPS, ['detect-usb', 'read-device-id', 'install-agent', 'configure-wifi', 'verify-agent', 'store-secrets']);
		const state = start();
		assert.strictEqual(state.status, 'running');
		assert.strictEqual(state.activeRequestId, 'request-1');
		assert.strictEqual(state.completedSteps.size, 0);
		assert.strictEqual(state.steps.size, 0);
	});

	it('deduplicates completed steps and treats read-device-id creation as a text-only update', () => {
		let state = start();
		state = progress(state, 'detect-usb');
		state = progress(state, 'detect-usb');
		assert.strictEqual(state.completedSteps.size, 1);

		state = progress(state, 'read-device-id', false);
		assert.strictEqual(state.completedSteps.size, 1);
		assert.strictEqual(state.steps.get('read-device-id')?.status, 'running');
		assert.strictEqual(state.steps.get('read-device-id')?.messageKey, 'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_CREATING');

		state = progress(state, 'read-device-id', true, { deviceId: 'brick-1' });
		assert.strictEqual(state.completedSteps.size, 2);
		assert.strictEqual(state.steps.get('read-device-id')?.messageKey, 'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_CREATED');
	});

	it('never counts scan-wifi or stale progress', () => {
		const state = start('active');
		const scan = api.reduceState(state, { type: 'progress', requestId: 'active', payload: { step: 'scan-wifi', success: true } });
		const stale = api.reduceState(state, { type: 'progress', requestId: 'old', payload: { step: 'detect-usb', success: true } });
		assert.strictEqual(scan, state);
		assert.strictEqual(stale, state);
	});

	it('completes all six milestones on success and preserves progress on failure', () => {
		let succeeded = start();
		for (const step of api.COUNTED_STEPS.slice(0, 2)) {
			succeeded = progress(succeeded, step);
		}
		succeeded = api.reduceState(succeeded, { type: 'result', requestId: 'request-1', success: true, status: 'succeeded' });
		assert.strictEqual(succeeded.status, 'succeeded');
		assert.strictEqual(succeeded.activeRequestId, null);
		assert.strictEqual(succeeded.completedSteps.size, 6);
		assert.strictEqual(succeeded.summaryKey, 'CYBERBRICK_PROVISION_SUCCEEDED');

		let failed = start('request-2');
		failed = progress(failed, 'detect-usb');
		failed = progress(failed, 'read-device-id', false, { error: { code: 'device-id-read-failed' } });
		failed = api.reduceState(failed, { type: 'result', requestId: 'request-2', success: false, status: 'failed' });
		assert.strictEqual(failed.status, 'failed');
		assert.strictEqual(failed.activeRequestId, null);
		assert.strictEqual(failed.completedSteps.size, 1);
		assert.strictEqual(failed.failedStep, 'read-device-id');
		assert.strictEqual(failed.steps.get('read-device-id')?.messageKey, FAILED_STEP_MESSAGE_KEYS['read-device-id']);
		assert.strictEqual(failed.summaryKey, 'CYBERBRICK_PROVISION_FAILED');
	});

	it('infers each failed stage from the first incomplete milestone when result arrives', () => {
		api.COUNTED_STEPS.forEach((expectedFailedStep, failedIndex) => {
			let state = start(`failure-${failedIndex}`);
			for (const completedStep of api.COUNTED_STEPS.slice(0, failedIndex)) {
				state = progress(state, completedStep);
			}
			state = api.reduceState(state, {
				type: 'result',
				requestId: `failure-${failedIndex}`,
				success: false,
				status: 'failed',
			});
			assert.strictEqual(state.completedSteps.size, failedIndex);
			assert.strictEqual(state.failedStep, expectedFailedStep);
			assert.strictEqual(state.steps.get(expectedFailedStep)?.status, 'failed');
			assert.strictEqual(state.steps.get(expectedFailedStep)?.messageKey, FAILED_STEP_MESSAGE_KEYS[expectedFailedStep]);
		});
	});

	it('rejects duplicate terminal results after the active request has finished', () => {
		const result = {
			command: 'cyberbrickOtaProvisionResult',
			requestId: 'active',
			success: false,
			error: { code: 'wifi-auth-failed', message: 'Check Wi-Fi.', nextActions: ['Try again.'] },
		};
		let state = start('active');
		const parsed = api.parseResultMessage(result, state.activeRequestId);
		assert.ok(parsed);
		state = api.reduceState(state, parsed);
		assert.strictEqual(state.activeRequestId, null);
		assert.strictEqual(api.parseResultMessage(result, state.activeRequestId), null);
	});

	it('resets a finished state only when a new non-empty request starts', () => {
		let state = progress(start('first'), 'detect-usb');
		state = api.reduceState(state, { type: 'result', requestId: 'first', success: false, status: 'failed' });
		const reset = api.reduceState(state, { type: 'start', requestId: 'second' });
		assert.strictEqual(reset.status, 'running');
		assert.strictEqual(reset.activeRequestId, 'second');
		assert.strictEqual(reset.completedSteps.size, 0);
		assert.strictEqual(api.reduceState(reset, { type: 'start', requestId: '' }), reset);
	});

	it('allowlist-parses safe progress and rejects malformed or stale progress without mutation', () => {
		const valid = {
			command: 'cyberbrickOtaProvisionProgress',
			requestId: 'active',
			success: true,
			payload: { step: 'configure-wifi', success: true, deviceId: 'brick-1', ipAddress: '192.168.1.2' },
		};
		assert.deepStrictEqual(api.parseProgressMessage(valid, 'active'), {
			type: 'progress',
			requestId: 'active',
			payload: valid.payload,
		});
		for (const invalid of [
			null,
			[],
			{ ...valid, command: 'unknown' },
			{ ...valid, requestId: 'stale' },
			{ ...valid, success: 'true' },
			{ ...valid, payload: null },
			{ ...valid, payload: [] },
			{ ...valid, payload: { step: 'scan-wifi', success: true } },
			{ ...valid, payload: { step: 'unknown', success: true } },
			{ ...valid, payload: { step: 'detect-usb', success: 'true' } },
			{ ...valid, payload: { step: 'detect-usb', success: true, wifiPassword: 'secret' } },
		]) {
			assert.strictEqual(api.parseProgressMessage(invalid, 'active'), null, JSON.stringify(invalid));
		}
	});

	it('allowlist-parses safe results and rejects malformed status, error, or payload data', () => {
		const success = {
			command: 'cyberbrickOtaProvisionResult',
			requestId: 'active',
			success: true,
			payload: {
				status: 'succeeded',
				panelState: { settings: { schemaVersion: 2, pairedDevices: [] }, secretPresence: {} },
			},
		};
		assert.strictEqual(api.parseResultMessage(success, 'active')?.type, 'result');
		const failure = {
			command: 'cyberbrickOtaProvisionResult',
			requestId: 'active',
			success: false,
			error: { code: 'wifi-auth-failed', message: 'Check Wi-Fi.', nextActions: ['Try again.'] },
		};
		assert.strictEqual(api.parseResultMessage(failure, 'active')?.success, false);

		for (const invalid of [
			null,
			[],
			{ ...success, requestId: 'stale' },
			{ ...success, success: 'true' },
			{ ...success, payload: { status: 'succeeded' } },
			{ ...success, payload: { ...success.payload, status: 'unknown' } },
			{ ...success, payload: { ...success.payload, wifiPassword: 'secret' } },
			{ ...failure, error: null },
			{ ...failure, error: { code: 'unknown-new-code', message: 'x', nextActions: [] } },
			{ ...failure, error: { code: 'wifi-auth-failed', message: {}, nextActions: [] } },
			{ ...failure, error: { code: 'wifi-auth-failed', message: 'x', nextActions: [1] } },
		]) {
			assert.strictEqual(api.parseResultMessage(invalid, 'active'), null, JSON.stringify(invalid));
		}
	});
});
