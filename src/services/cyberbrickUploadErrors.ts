/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CyberBrickUploadErrorCode, CyberBrickUploadUserError } from '../types/cyberbrickUpload';

const DEFAULT_MESSAGES: Partial<Record<CyberBrickUploadErrorCode, string>> & { unknown: string } = {
	'ok': 'CyberBrick is ready for OTA upload.',
	'missing-primary-device': 'No primary CyberBrick OTA target is selected.',
	'device-not-paired': 'The selected CyberBrick is not paired in this project.',
	'missing-ota-token': 'The selected CyberBrick is missing its OTA token.',
	'missing-address': 'The selected CyberBrick does not have a last-known IP address.',
	offline: 'The selected CyberBrick cannot be reached on the network.',
	'identity-mismatch': 'The device that responded is not the selected CyberBrick.',
	'unsupported-agent': 'The CyberBrick OTA agent version is not supported.',
	'agent-outdated': 'The CyberBrick OTA agent needs to be updated.',
	'agent-health-failed': 'CyberBrick did not pass the OTA health check.',
	timeout: 'The CyberBrick OTA request timed out.',
	'token-rejected': 'The CyberBrick rejected the OTA token.',
	'invalid-settings': 'CyberBrick upload settings are incomplete or invalid.',
	'workspace-missing': 'Please open a project folder before uploading.',
	'code-empty': 'Generated code is empty.',
	'device-not-found': 'No CyberBrick USB device was found.',
	'multiple-devices': 'Multiple CyberBrick USB devices were found. Please choose one.',
	'usb-port-missing': 'Please choose a CyberBrick USB port.',
	'usb-device-not-cyberbrick': 'The selected USB port is not a CyberBrick.',
	'mpremote-unavailable': 'mpremote is not available for CyberBrick setup.',
	'device-id-read-failed': 'Could not read the CyberBrick device identity.',
	'device-id-write-failed': 'Could not write a CyberBrick device identity.',
	'wifi-scan-timeout': 'CyberBrick Wi-Fi scan timed out.',
	'wifi-scan-failed': 'CyberBrick could not scan nearby Wi-Fi networks.',
	'agent-install-failed': 'Could not install the CyberBrick OTA agent.',
	'agent-version-unsupported': 'The CyberBrick OTA agent version is unsupported.',
	'wifi-connect-failed': 'CyberBrick could not connect to Wi-Fi.',
	'wifi-auth-failed': 'CyberBrick Wi-Fi password was rejected.',
	'wifi-timeout': 'CyberBrick Wi-Fi connection timed out.',
	'agent-unreachable': 'CyberBrick OTA agent is not reachable on the network.',
	'secret-store-failed': 'Could not store CyberBrick secrets securely.',
	'provisioning-failed': 'CyberBrick OTA setup did not complete.',
	'ota-upload-failed': 'CyberBrick OTA upload failed.',
	'ota-cleanup-failed': 'CyberBrick OTA cleanup did not complete.',
	'rc-main-patch-failed': 'CyberBrick OTA removal could not patch rc_main.py.',
	'upload-timeout': 'CyberBrick OTA upload timed out.',
	'write-failed': 'CyberBrick could not write the uploaded program.',
	'restart-failed': 'CyberBrick wrote the program but could not restart it.',
	'network-error': 'A network error occurred while contacting CyberBrick.',
	unknown: 'An unknown CyberBrick upload error occurred.',
};

const DEFAULT_NEXT_ACTIONS: Partial<Record<CyberBrickUploadErrorCode, string[]>> & { unknown: string[] } = {
	'ok': [],
	'missing-primary-device': ['Open CyberBrick upload settings and choose a paired device.'],
	'device-not-paired': ['Run USB-first OTA setup for this CyberBrick.'],
	'missing-ota-token': ['Run USB-first OTA setup again for this CyberBrick.'],
	'missing-address': ['Connect the CyberBrick to Wi-Fi with USB-first OTA setup, then try again.'],
	offline: ['Check that the CyberBrick is powered on and connected to the same Wi-Fi network.'],
	'identity-mismatch': ['Verify the selected device in CyberBrick upload settings.'],
	'unsupported-agent': ['Run OTA setup again to update the CyberBrick OTA agent.'],
	'agent-outdated': ['Run USB-first OTA setup again to update the agent.'],
	'agent-health-failed': ['Retry after checking that CyberBrick is powered on and connected to Wi-Fi.'],
	timeout: ['Move closer to the Wi-Fi router or try again after checking the device power.'],
	'token-rejected': ['Run USB-first OTA setup again to refresh the OTA token.'],
	'invalid-settings': ['Open CyberBrick upload settings and review the OTA target.'],
	'workspace-missing': ['Open a Blockly project folder and try again.'],
	'code-empty': ['Add blocks to the workspace and generate code before uploading.'],
	'device-not-found': ['Connect one CyberBrick by USB and try again.'],
	'multiple-devices': ['Select the correct USB port in CyberBrick upload settings.'],
	'usb-port-missing': ['Select a CyberBrick USB port in upload settings.'],
	'usb-device-not-cyberbrick': ['Choose a CyberBrick USB port, then try again.'],
	'mpremote-unavailable': ['Install or repair PlatformIO/mpremote, then try again.'],
	'device-id-read-failed': ['Reconnect CyberBrick by USB and retry setup.'],
	'device-id-write-failed': ['Reconnect CyberBrick by USB and retry setup.'],
	'wifi-scan-timeout': ['Try rescanning, or type the SSID manually.'],
	'wifi-scan-failed': ['Try rescanning, or type the SSID manually if the network is hidden.'],
	'agent-install-failed': ['Keep USB connected and run setup again.'],
	'agent-version-unsupported': ['Run USB-first OTA setup again to update the agent.'],
	'wifi-connect-failed': ['Check the SSID and password, then run setup again.'],
	'wifi-auth-failed': ['Enter the Wi-Fi password again.'],
	'wifi-timeout': ['Move closer to the Wi-Fi router and retry setup.'],
	'agent-unreachable': ['Check Wi-Fi, then retry. You can manually switch to USB if needed.'],
	'secret-store-failed': ['Retry setup. If it keeps failing, check VS Code SecretStorage availability.'],
	'provisioning-failed': ['Keep USB connected and run OTA setup again.'],
	'ota-upload-failed': ['Check the OTA readiness message. USB fallback is not automatic.'],
	'ota-cleanup-failed': ['Keep USB connected and retry OTA cleanup from CyberBrick settings.'],
	'rc-main-patch-failed': ['Keep USB connected and retry OTA cleanup from CyberBrick settings.'],
	'upload-timeout': ['Retry the OTA upload or check the Wi-Fi connection.'],
	'write-failed': ['Check device storage and run USB-first setup again if needed.'],
	'restart-failed': ['The program may be written; restart CyberBrick manually if needed.'],
	'network-error': ['Check that the computer and CyberBrick are on the same Wi-Fi network.'],
	unknown: ['Try again, or switch back to USB mode manually if needed.'],
};

export function getCyberBrickUploadNextActions(code: CyberBrickUploadErrorCode): string[] {
	return [...(DEFAULT_NEXT_ACTIONS[code] ?? DEFAULT_NEXT_ACTIONS.unknown)];
}

export function createCyberBrickUploadError(
	code: CyberBrickUploadErrorCode,
	message?: string,
	options?: { details?: CyberBrickUploadUserError['details']; nextActions?: string[] }
): CyberBrickUploadUserError {
	return {
		code,
		message: message || DEFAULT_MESSAGES[code] || DEFAULT_MESSAGES.unknown,
		nextActions: options?.nextActions ? [...options.nextActions] : getCyberBrickUploadNextActions(code),
		...(options?.details ? { details: options.details } : {}),
	};
}

export function classifyCyberBrickUploadError(error: unknown, fallbackCode: CyberBrickUploadErrorCode = 'unknown'): CyberBrickUploadUserError {
	if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
		const candidate = error as Partial<CyberBrickUploadUserError>;
		if (typeof candidate.code === 'string' && typeof candidate.message === 'string') {
			const details =
				typeof candidate.details === 'string' || (candidate.details && typeof candidate.details === 'object') ? candidate.details : undefined;
			return createCyberBrickUploadError(candidate.code as CyberBrickUploadErrorCode, candidate.message, {
				details,
				nextActions: Array.isArray(candidate.nextActions) ? candidate.nextActions.filter(item => typeof item === 'string') : undefined,
			});
		}
	}

	const message = error instanceof Error ? error.message : String(error);
	return createCyberBrickUploadError(fallbackCode, DEFAULT_MESSAGES[fallbackCode] || DEFAULT_MESSAGES.unknown, { details: message });
}
