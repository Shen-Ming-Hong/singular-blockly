/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick OTA provisioning state helper.
 *
 * This UMD boundary keeps message parsing and reducer behavior reusable by the
 * WebView and Node tests. The public API is populated by the OTA story tasks.
 */

(function (root, factory) {
	'use strict';

	const api = factory();
	if (typeof module === 'object' && module.exports) {
		module.exports = api;
	}
	if (root) {
		root.cyberbrickOtaProvisioningState = api;
	}
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
	'use strict';

	const COUNTED_STEPS = Object.freeze([
		'detect-usb',
		'read-device-id',
		'install-agent',
		'configure-wifi',
		'verify-agent',
		'store-secrets',
	]);
	const COUNTED_STEP_SET = new Set(COUNTED_STEPS);
	const KNOWN_ERROR_CODES = new Set([
		'ok', 'missing-primary-device', 'device-not-paired', 'missing-ota-token', 'missing-address', 'offline', 'identity-mismatch',
		'unsupported-agent', 'agent-outdated', 'agent-health-failed', 'timeout', 'token-rejected', 'invalid-settings', 'workspace-missing',
		'code-empty', 'device-not-found', 'multiple-devices', 'usb-port-missing', 'usb-device-not-cyberbrick', 'mpremote-unavailable',
		'device-id-read-failed', 'device-id-write-failed', 'wifi-scan-timeout', 'wifi-scan-failed', 'agent-install-failed',
		'agent-version-unsupported', 'wifi-connect-failed', 'wifi-auth-failed', 'wifi-timeout', 'agent-unreachable', 'secret-store-failed',
		'provisioning-in-progress', 'provisioning-failed', 'ota-upload-failed', 'ota-cleanup-failed', 'rc-main-patch-failed',
		'upload-timeout', 'write-failed', 'restart-failed', 'network-error', 'unknown', 'agent-upgrade-failed',
	]);
	const STEP_MESSAGE_KEYS = Object.freeze({
		'detect-usb': 'CYBERBRICK_PROVISION_STEP_DETECT_USB',
		'install-agent': 'CYBERBRICK_PROVISION_STEP_INSTALL_AGENT',
		'configure-wifi': 'CYBERBRICK_PROVISION_STEP_CONFIGURE_WIFI',
		'verify-agent': 'CYBERBRICK_PROVISION_STEP_VERIFY_AGENT',
		'store-secrets': 'CYBERBRICK_PROVISION_STEP_STORE_SECRETS',
	});
	const FAILED_STEP_MESSAGE_KEYS = Object.freeze({
		'detect-usb': 'CYBERBRICK_PROVISION_STEP_DETECT_USB_FAILED',
		'read-device-id': 'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_FAILED',
		'install-agent': 'CYBERBRICK_PROVISION_STEP_INSTALL_AGENT_FAILED',
		'configure-wifi': 'CYBERBRICK_PROVISION_STEP_CONFIGURE_WIFI_FAILED',
		'verify-agent': 'CYBERBRICK_PROVISION_STEP_VERIFY_AGENT_FAILED',
		'store-secrets': 'CYBERBRICK_PROVISION_STEP_STORE_SECRETS_FAILED',
	});

	function isPlainObject(value) {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			return false;
		}
		const prototype = Object.getPrototypeOf(value);
		return prototype === Object.prototype || prototype === null;
	}

	function hasOnlyKeys(value, allowedKeys) {
		return Object.keys(value).every(key => allowedKeys.includes(key));
	}

	function sanitizeError(value) {
		if (
			!isPlainObject(value) ||
			!hasOnlyKeys(value, ['code', 'message', 'nextActions']) ||
			!KNOWN_ERROR_CODES.has(value.code) ||
			typeof value.message !== 'string' ||
			!Array.isArray(value.nextActions) ||
			!value.nextActions.every(item => typeof item === 'string')
		) {
			return null;
		}
		return Object.freeze({ code: value.code, message: value.message, nextActions: Object.freeze([...value.nextActions]) });
	}

	function sanitizePairedDevice(value) {
		const allowed = [
			'deviceId', 'friendlyName', 'createdAt', 'updatedAt', 'otaPort', 'protocolVersion', 'lastKnownIp', 'lastSeenAt',
			'lastSuccessfulUploadAt', 'statusSummary', 'agentVersion',
		];
		if (!isPlainObject(value) || !hasOnlyKeys(value, allowed)) {
			return null;
		}
		for (const required of ['deviceId', 'friendlyName', 'createdAt', 'updatedAt']) {
			if (typeof value[required] !== 'string') {
				return null;
			}
		}
		if (!Number.isInteger(value.otaPort) || ![1, 2].includes(value.protocolVersion)) {
			return null;
		}
		for (const optional of ['lastKnownIp', 'lastSeenAt', 'lastSuccessfulUploadAt', 'statusSummary', 'agentVersion']) {
			if (value[optional] !== undefined && typeof value[optional] !== 'string') {
				return null;
			}
		}
		return Object.freeze({ ...value });
	}

	function sanitizePanelState(value) {
		if (!isPlainObject(value) || !hasOnlyKeys(value, ['settings', 'secretPresence']) || !isPlainObject(value.settings)) {
			return null;
		}
		const settings = value.settings;
		if (
			!hasOnlyKeys(settings, ['schemaVersion', 'primaryDeviceId', 'pairedDevices']) ||
			settings.schemaVersion !== 2 ||
			(settings.primaryDeviceId !== undefined && typeof settings.primaryDeviceId !== 'string') ||
			!Array.isArray(settings.pairedDevices)
		) {
			return null;
		}
		const pairedDevices = settings.pairedDevices.map(sanitizePairedDevice);
		if (pairedDevices.some(device => device === null) || !isPlainObject(value.secretPresence)) {
			return null;
		}
		const secretPresence = {};
		for (const [deviceId, presence] of Object.entries(value.secretPresence)) {
			if (
				!isPlainObject(presence) ||
				!hasOnlyKeys(presence, ['deviceId', 'wifiPasswordSet', 'otaTokenSet', 'pairingSecretSet']) ||
				typeof presence.deviceId !== 'string' ||
				typeof presence.wifiPasswordSet !== 'boolean' ||
				typeof presence.otaTokenSet !== 'boolean' ||
				typeof presence.pairingSecretSet !== 'boolean'
			) {
				return null;
			}
			secretPresence[deviceId] = Object.freeze({ ...presence });
		}
		return Object.freeze({
			settings: Object.freeze({
				schemaVersion: 2,
				...(settings.primaryDeviceId !== undefined ? { primaryDeviceId: settings.primaryDeviceId } : {}),
				pairedDevices: Object.freeze(pairedDevices),
			}),
			secretPresence: Object.freeze(secretPresence),
		});
	}

	function sanitizeStep(value) {
		if (!isPlainObject(value) || !hasOnlyKeys(value, ['step', 'success', 'deviceId', 'ipAddress', 'error'])) {
			return null;
		}
		if (!COUNTED_STEP_SET.has(value.step) || typeof value.success !== 'boolean') {
			return null;
		}
		if (value.deviceId !== undefined && typeof value.deviceId !== 'string') {
			return null;
		}
		if (value.ipAddress !== undefined && typeof value.ipAddress !== 'string') {
			return null;
		}
		const error = value.error === undefined ? undefined : sanitizeError(value.error);
		if (value.error !== undefined && !error) {
			return null;
		}
		return Object.freeze({
			step: value.step,
			success: value.success,
			...(value.deviceId !== undefined ? { deviceId: value.deviceId } : {}),
			...(value.ipAddress !== undefined ? { ipAddress: value.ipAddress } : {}),
			...(error ? { error } : {}),
		});
	}

	function parseProgressMessage(message, activeRequestId) {
		if (
			!isPlainObject(message) ||
			!hasOnlyKeys(message, ['command', 'requestId', 'success', 'payload']) ||
			message.command !== 'cyberbrickOtaProvisionProgress' ||
			typeof activeRequestId !== 'string' ||
			!activeRequestId ||
			message.requestId !== activeRequestId ||
			message.success !== true
		) {
			return null;
		}
		const payload = sanitizeStep(message.payload);
		return payload ? Object.freeze({ type: 'progress', requestId: activeRequestId, payload }) : null;
	}

	function sanitizeResultPayload(value, success) {
		if (!isPlainObject(value)) {
			return null;
		}
		const allowedKeys = ['status', 'panelState', 'steps', 'device', 'nextUploadMode'];
		if (!hasOnlyKeys(value, allowedKeys) || value.status !== (success ? 'succeeded' : 'failed')) {
			return null;
		}
		const panelState = value.panelState === undefined ? undefined : sanitizePanelState(value.panelState);
		if ((success || value.panelState !== undefined) && !panelState) {
			return null;
		}
		const steps = value.steps === undefined ? undefined : Array.isArray(value.steps) ? value.steps.map(sanitizeStep) : null;
		if (steps === null || steps?.some(step => step === null)) {
			return null;
		}
		const device = value.device === undefined ? undefined : sanitizePairedDevice(value.device);
		if (value.device !== undefined && !device) {
			return null;
		}
		if (value.nextUploadMode !== undefined && value.nextUploadMode !== 'usb') {
			return null;
		}
		return Object.freeze({
			status: value.status,
			...(panelState ? { panelState } : {}),
			...(steps ? { steps: Object.freeze(steps) } : {}),
			...(device ? { device } : {}),
			...(value.nextUploadMode ? { nextUploadMode: 'usb' } : {}),
		});
	}

	function parseResultMessage(message, activeRequestId) {
		if (
			!isPlainObject(message) ||
			!hasOnlyKeys(message, ['command', 'requestId', 'success', 'payload', 'error']) ||
			message.command !== 'cyberbrickOtaProvisionResult' ||
			typeof activeRequestId !== 'string' ||
			!activeRequestId ||
			message.requestId !== activeRequestId ||
			typeof message.success !== 'boolean'
		) {
			return null;
		}
		if (message.success) {
			const payload = sanitizeResultPayload(message.payload, true);
			return payload ? Object.freeze({ type: 'result', requestId: activeRequestId, success: true, status: 'succeeded', payload }) : null;
		}
		const error = sanitizeError(message.error);
		if (!error) {
			return null;
		}
		const payload = message.payload === undefined ? undefined : sanitizeResultPayload(message.payload, false);
		if (message.payload !== undefined && !payload) {
			return null;
		}
		return Object.freeze({ type: 'result', requestId: activeRequestId, success: false, status: 'failed', error, ...(payload ? { payload } : {}) });
	}

	function createInitialState() {
		return {
			status: 'idle',
			activeRequestId: null,
			completedSteps: new Set(),
			steps: new Map(),
			failedStep: null,
			summaryKey: null,
		};
	}

	function getStepMessageKey(payload) {
		if (payload.step === 'read-device-id') {
			if (!payload.success && !payload.error) {
				return 'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_CREATING';
			}
			return payload.deviceId
				? 'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_CREATED'
				: 'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_FOUND';
		}
		if (payload.step === 'configure-wifi' && payload.success && !payload.ipAddress) {
			return 'CYBERBRICK_PROVISION_STEP_CONFIGURE_WIFI_NO_IP';
		}
		return STEP_MESSAGE_KEYS[payload.step] || 'CYBERBRICK_PROVISION_STEP_UNKNOWN';
	}

	function getFailedStepMessageKey(step) {
		return FAILED_STEP_MESSAGE_KEYS[step] || 'CYBERBRICK_PROVISION_STEP_UNKNOWN';
	}

	function reduceState(state, event) {
		if (!state || !event || typeof event !== 'object') {
			return state;
		}
		if (event.type === 'start') {
			if (state.status === 'running' || typeof event.requestId !== 'string' || !event.requestId.trim()) {
				return state;
			}
			return { ...createInitialState(), status: 'running', activeRequestId: event.requestId };
		}
		if (state.status !== 'running' || event.requestId !== state.activeRequestId) {
			return state;
		}
		if (event.type === 'progress') {
			const payload = event.payload;
			if (!payload || !COUNTED_STEP_SET.has(payload.step) || typeof payload.success !== 'boolean') {
				return state;
			}
			const completedSteps = new Set(state.completedSteps);
			if (payload.success) {
				completedSteps.add(payload.step);
			}
			const isFailed = !payload.success && Boolean(payload.error);
			const steps = new Map(state.steps);
			steps.set(payload.step, {
				step: payload.step,
				status: payload.success ? 'succeeded' : isFailed ? 'failed' : 'running',
				messageKey: isFailed ? getFailedStepMessageKey(payload.step) : getStepMessageKey(payload),
				...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
				...(payload.ipAddress ? { ipAddress: payload.ipAddress } : {}),
				...(payload.error?.code ? { errorCode: payload.error.code } : {}),
			});
			return { ...state, completedSteps, steps, failedStep: isFailed ? payload.step : state.failedStep };
		}
		if (event.type === 'result' && typeof event.success === 'boolean') {
			if (event.success && event.status === 'succeeded') {
				const completedSteps = new Set(COUNTED_STEPS);
				const steps = new Map(state.steps);
				COUNTED_STEPS.forEach(step => {
					if (!steps.has(step)) {
						steps.set(step, { step, status: 'succeeded', messageKey: getStepMessageKey({ step, success: true }) });
					}
				});
				return { ...state, status: 'succeeded', activeRequestId: null, completedSteps, steps, failedStep: null, summaryKey: 'CYBERBRICK_PROVISION_SUCCEEDED' };
			}
			if (!event.success && event.status === 'failed') {
				const failedStep = state.failedStep || COUNTED_STEPS.find(step => !state.completedSteps.has(step)) || 'store-secrets';
				const steps = new Map(state.steps);
				if (!steps.has(failedStep) || steps.get(failedStep).status !== 'failed') {
					steps.set(failedStep, {
						step: failedStep,
						status: 'failed',
						messageKey: getFailedStepMessageKey(failedStep),
					});
				}
				return { ...state, status: 'failed', activeRequestId: null, steps, failedStep, summaryKey: 'CYBERBRICK_PROVISION_FAILED' };
			}
		}
		return state;
	}

	return Object.freeze({
		COUNTED_STEPS,
		createInitialState,
		parseProgressMessage,
		parseResultMessage,
		reduceState,
	});
});
