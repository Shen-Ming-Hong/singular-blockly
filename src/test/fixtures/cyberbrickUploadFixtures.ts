/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
	CYBERBRICK_OTA_DEFAULT_PORT,
	CYBERBRICK_UPLOAD_SETTINGS_SCHEMA_VERSION,
	CyberBrickUploadSettings,
	OtaReadinessStatus,
	PairedCyberBrickDevice,
	WifiNetworkSuggestion,
} from '../../types/cyberbrickUpload';

export const CYBERBRICK_TEST_WORKSPACE_URI = 'file:///mock/workspace';
export const CYBERBRICK_TEST_WORKSPACE_HASH = 'd3d4f8f64d410adb';
export const CYBERBRICK_TEST_DEVICE_ID = 'cyberbrick-001122334455';
export const CYBERBRICK_TEST_DEVICE_ID_2 = 'cyberbrick-66778899aabb';
export const CYBERBRICK_TEST_TOKEN = 'test-token-not-for-snapshots';
export const CYBERBRICK_TEST_WIFI_PASSWORD = 'test-wifi-password-not-for-snapshots';

export function createCyberBrickDevice(overrides: Partial<PairedCyberBrickDevice> = {}): PairedCyberBrickDevice {
	const now = '2026-01-20T12:00:00.000Z';
	return {
		deviceId: CYBERBRICK_TEST_DEVICE_ID,
		friendlyName: 'Classroom CyberBrick',
		createdAt: now,
		updatedAt: now,
		otaPort: CYBERBRICK_OTA_DEFAULT_PORT,
		protocolVersion: 1,
		lastKnownIp: '192.168.1.42',
		lastSeenAt: now,
		statusSummary: 'ready',
		...overrides,
	};
}

export function createCyberBrickUploadSettings(overrides: Partial<CyberBrickUploadSettings> = {}): CyberBrickUploadSettings {
	return {
		schemaVersion: CYBERBRICK_UPLOAD_SETTINGS_SCHEMA_VERSION,
		pairedDevices: [],
		...overrides,
	};
}

export function createDuplicateNameSettings(): CyberBrickUploadSettings {
	const deviceA = createCyberBrickDevice({ deviceId: CYBERBRICK_TEST_DEVICE_ID, friendlyName: 'Robot A' });
	const deviceB = createCyberBrickDevice({
		deviceId: CYBERBRICK_TEST_DEVICE_ID_2,
		friendlyName: 'Robot A',
		lastKnownIp: '192.168.1.43',
	});
	return createCyberBrickUploadSettings({
		primaryDeviceId: deviceA.deviceId,
		pairedDevices: [deviceA, deviceB],
	});
}

export const CYBERBRICK_WIFI_SCAN_FIXTURE: WifiNetworkSuggestion[] = [
	{ ssid: 'Classroom WiFi', rssi: -42, security: 'WPA2', channel: 6 },
	{ ssid: 'Hidden Lab', rssi: -67, security: 'WPA2', hidden: true },
];

export function createReadyOtaStatus(device = createCyberBrickDevice()): OtaReadinessStatus {
	return {
		ready: true,
		device,
		checks: [{ code: 'ok', ok: true, message: 'Ready for OTA upload', nextActions: [] }],
		blockingReasons: [],
		nextActions: [],
	};
}
