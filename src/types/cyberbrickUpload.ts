 /**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const CYBERBRICK_UPLOAD_SETTINGS_SCHEMA_VERSION = 2;
export const CYBERBRICK_UPLOAD_SETTINGS_SECTION = 'singular-blockly';
export const CYBERBRICK_UPLOAD_SETTINGS_PROPERTY = 'cyberbrick.uploadSettings';
export const CYBERBRICK_UPLOAD_SETTINGS_KEY = `${CYBERBRICK_UPLOAD_SETTINGS_SECTION}.${CYBERBRICK_UPLOAD_SETTINGS_PROPERTY}`;
export const CYBERBRICK_OTA_REMOTE_PATH = '/app/rc_main.py';
export const CYBERBRICK_OTA_PROTOCOL_VERSION = 2;
export const CYBERBRICK_OTA_DEFAULT_PORT = 8266;
export const CYBERBRICK_OTA_AGENT_TARGET_VERSION = '1.5.9';
export const CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION = '1.4.0';
export const CYBERBRICK_OTA_RESET_MIN_VERSION = '1.5.0';

export type CyberBrickSecretKind = 'wifiPassword' | 'otaToken' | 'pairingSecret';
export type CyberBrickProvisioningStep =
	| 'detect-usb'
	| 'read-device-id'
	| 'scan-wifi'
	| 'install-agent'
	| 'configure-wifi'
	| 'verify-agent'
	| 'store-secrets';
export type CyberBrickReadinessCode =
	| 'ok'
	| 'missing-primary-device'
	| 'device-not-paired'
	| 'missing-ota-token'
	| 'missing-address'
	| 'offline'
	| 'identity-mismatch'
	| 'unsupported-agent'
	| 'agent-outdated'
	| 'agent-health-failed'
	| 'timeout'
	| 'token-rejected'
	| 'invalid-settings';
export type CyberBrickUploadErrorCode =
	| CyberBrickReadinessCode
	| 'workspace-missing'
	| 'code-empty'
	| 'device-not-found'
	| 'multiple-devices'
	| 'usb-port-missing'
	| 'usb-device-not-cyberbrick'
	| 'mpremote-unavailable'
	| 'device-id-read-failed'
	| 'device-id-write-failed'
	| 'wifi-scan-timeout'
	| 'wifi-scan-failed'
	| 'agent-install-failed'
	| 'agent-version-unsupported'
	| 'wifi-connect-failed'
	| 'wifi-auth-failed'
	| 'wifi-timeout'
	| 'agent-unreachable'
	| 'secret-store-failed'
	| 'provisioning-failed'
	| 'ota-upload-failed'
	| 'ota-cleanup-failed'
	| 'rc-main-patch-failed'
	| 'upload-timeout'
	| 'write-failed'
	| 'restart-failed'
	| 'network-error'
	| 'unknown'
	| 'agent-upgrade-failed';
export type CyberBrickUploadProgressStage =
	| 'preparing'
	| 'checking_settings'
	| 'checking_readiness'
	| 'connecting'
	| 'uploading'
	| 'verifying'
	| 'completed'
	| 'failed'
	| 'upgrading_agent'
	| 'agent_upgraded'
	| 'agent_upgrade_needed';

export interface PairedCyberBrickDevice {
	deviceId: string;
	friendlyName: string;
	createdAt: string;
	updatedAt: string;
	otaPort: number;
	protocolVersion: 1 | 2;
	lastKnownIp?: string;
	lastSeenAt?: string;
	lastSuccessfulUploadAt?: string;
	statusSummary?: string;
	agentVersion?: string;
}

export interface CyberBrickUploadSettings {
	schemaVersion: 2;
	primaryDeviceId?: string;
	pairedDevices: PairedCyberBrickDevice[];
}

export interface CyberBrickSecretPresence {
	deviceId: string;
	wifiPasswordSet: boolean;
	otaTokenSet: boolean;
	pairingSecretSet: boolean;
}

export interface CyberBrickUploadPanelState {
	settings: CyberBrickUploadSettings;
	secretPresence: Record<string, CyberBrickSecretPresence>;
	readiness?: OtaReadinessStatus;
}

export interface WifiNetworkSuggestion {
	ssid: string;
	rssi?: number;
	security?: string;
	channel?: number;
	hidden?: boolean;
}

export interface WifiScanSession {
	port?: string;
	startedAt: string;
	completedAt?: string;
	networks: WifiNetworkSuggestion[];
	error?: CyberBrickUploadUserError;
}

export interface OtaProvisioningRequest {
	usbPort?: string;
	port?: string;
	friendlyName?: string;
	ssid: string;
	wifiPassword?: string;
	reuseExistingWifiSecret?: boolean;
	targetDeviceId?: string;
}

export interface OtaProvisioningStepResult {
	step: CyberBrickProvisioningStep;
	success: boolean;
	message?: string;
	deviceId?: string;
	ipAddress?: string;
	networks?: WifiNetworkSuggestion[];
	error?: CyberBrickUploadUserError;
}

export interface OtaProvisioningResult {
	requestId?: string;
	success: boolean;
	status?: 'succeeded' | 'failed' | 'partial' | 'cancelled';
	device?: PairedCyberBrickDevice;
	nextUploadMode: 'usb';
	steps: OtaProvisioningStepResult[];
	secretsStored?: Array<{ deviceId: string; kind: CyberBrickSecretKind; hasValue: boolean }>;
	userFacingSummary?: string;
	error?: CyberBrickUploadUserError;
}

export interface CyberBrickOtaCleanupRequest {
	usbPort?: string;
	port?: string;
	deviceId?: string;
}

export interface CyberBrickOtaCleanupResult {
	success: boolean;
	deviceId?: string;
	removedAgent: boolean;
	removedConfig: boolean;
	rcMainPatched: boolean;
	rcMainHadBootstrap: boolean;
	localPairingRemoved: boolean;
	userFacingSummary?: string;
	error?: CyberBrickUploadUserError;
}

export interface OtaReadinessCheck {
	code: CyberBrickReadinessCode;
	ok: boolean;
	message: string;
	nextActions: string[];
}

export interface OtaReadinessStatus {
	ready: boolean;
	device?: PairedCyberBrickDevice;
	checks: OtaReadinessCheck[];
	blockingReasons: CyberBrickReadinessCode[];
	nextActions: string[];
}

export interface OtaUploadRequest {
	code: string;
	board: 'cyberbrick';
	deviceId?: string;
}

export interface OtaUploadRun {
	operationId: string;
	deviceId?: string;
	friendlyName?: string;
	startedAt: string;
	finishedAt: string | null;
	status:
		| 'pending'
		| 'validating'
		| 'connecting'
		| 'upgrading_agent'
		| 'agent_upgraded'
		| 'agent_upgrade_needed'
		| 'transferring'
		| 'verifying'
		| 'restarting'
		| 'succeeded'
		| 'failed'
		| 'cancelled'
		| 'timed-out';
	progress: number;
	stageMessage: string;
	errorCode: CyberBrickUploadErrorCode | null;
	userFacingSummary: string;
	remotePath: typeof CYBERBRICK_OTA_REMOTE_PATH;
	duration?: number;
	sha256?: string;
	error?: CyberBrickUploadUserError;
}

export interface CyberBrickUploadProgress {
	stage: CyberBrickUploadProgressStage;
	progress: number;
	message: string;
	deviceId?: string;
}

export interface CyberBrickUploadUserError {
	code: CyberBrickUploadErrorCode;
	message: string;
	nextActions: string[];
	details?: string | Record<string, string | number | boolean | null>;
}

export interface CyberBrickUploadSettingsLoadRequestMessage {
	command: 'cyberbrickUploadSettingsLoad';
}

export interface CyberBrickUploadSettingsSaveRequestMessage {
	command: 'cyberbrickUploadSettingsSave';
	settings: Partial<CyberBrickUploadSettings>;
}

export interface CyberBrickUsbPortsRequestMessage {
	command: 'cyberbrickUsbPortsRequest';
}

export interface CyberBrickWifiScanRequestMessage {
	command: 'cyberbrickWifiScanRequest';
	port?: string;
}

export interface CyberBrickOtaProvisionRequestMessage extends OtaProvisioningRequest {
	command: 'cyberbrickOtaProvisionRequest';
}

export interface CyberBrickOtaReadinessRequestMessage {
	command: 'cyberbrickOtaReadinessRequest';
	deviceId?: string;
}

export interface CyberBrickOtaUploadRequestMessage extends OtaUploadRequest {
	command: 'cyberbrickOtaUploadRequest';
}

export interface CyberBrickOtaCleanupRequestMessage extends CyberBrickOtaCleanupRequest {
	command: 'cyberbrickOtaCleanupRequest';
}
