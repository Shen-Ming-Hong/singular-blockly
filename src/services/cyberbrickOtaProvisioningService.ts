/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'crypto';
import { log } from './logging';
import { CyberBrickUploadSettingsService } from './cyberbrickUploadSettingsService';
import { MicropythonUploader, ComPortInfo } from './micropythonUploader';
import { buildCyberBrickOtaAgentSource } from './cyberbrickOtaAgentSource';
import { createCyberBrickUploadError, classifyCyberBrickUploadError } from './cyberbrickUploadErrors';
import {
	CYBERBRICK_OTA_DEFAULT_PORT,
	CYBERBRICK_OTA_PROTOCOL_VERSION,
	CyberBrickOtaCleanupRequest,
	CyberBrickOtaCleanupResult,
	CyberBrickUploadPanelState,
	OtaProvisioningRequest,
	OtaProvisioningResult,
	OtaProvisioningStepResult,
	PairedCyberBrickDevice,
	WifiScanSession,
} from '../types/cyberbrickUpload';

export type CyberBrickProvisioningProgressCallback = (step: OtaProvisioningStepResult) => void;

export interface CyberBrickUsbPortSummary {
	path: string;
	displayName: string;
	manufacturer?: string;
	serialNumber?: string;
}

export interface CyberBrickUsbPortList {
	ports: CyberBrickUsbPortSummary[];
	autoDetected?: string;
}

export interface CyberBrickOtaProvisioningServiceOptions {
	now?: () => Date;
	randomBytes?: (size: number) => Buffer;
}

export class CyberBrickOtaProvisioningService {
	private readonly now: () => Date;
	private readonly randomBytes: (size: number) => Buffer;

	constructor(
		private readonly settingsService: CyberBrickUploadSettingsService,
		private readonly uploader: Pick<
			MicropythonUploader,
			| 'listPorts'
			| 'readCyberBrickDeviceId'
			| 'writeCyberBrickDeviceId'
			| 'scanCyberBrickWifi'
			| 'deployCyberBrickOtaAgent'
			| 'configureCyberBrickOtaAgent'
			| 'removeCyberBrickOtaArtifacts'
		>,
		options: CyberBrickOtaProvisioningServiceOptions = {}
	) {
		this.now = options.now ?? (() => new Date());
		this.randomBytes = options.randomBytes ?? crypto.randomBytes;
	}

	async listUsbPorts(): Promise<CyberBrickUsbPortList> {
		const result = await this.uploader.listPorts('cyberbrick');
		return {
			ports: result.ports.map(port => this.toPortSummary(port)),
			autoDetected: result.autoDetected,
		};
	}

	async scanWifi(port: string): Promise<WifiScanSession> {
		const startedAt = this.nowIso();
		try {
			const networks = await this.uploader.scanCyberBrickWifi(port);
			return { port, startedAt, completedAt: this.nowIso(), networks };
		} catch (error) {
			return {
				port,
				startedAt,
				completedAt: this.nowIso(),
				networks: [],
				error: classifyCyberBrickUploadError(error, 'wifi-scan-failed'),
			};
		}
	}

	async provision(
		request: OtaProvisioningRequest,
		onProgress?: CyberBrickProvisioningProgressCallback
	): Promise<{ result: OtaProvisioningResult; panelState: CyberBrickUploadPanelState }> {
		const steps: OtaProvisioningStepResult[] = [];
		const emit = (step: OtaProvisioningStepResult) => {
			steps.push(step);
			onProgress?.(step);
		};

		const port = (request.usbPort || request.port || '').trim();
		if (!port) {
			const error = createCyberBrickUploadError('usb-port-missing');
			const result: OtaProvisioningResult = {
				success: false,
				status: 'failed',
				nextUploadMode: 'usb',
				steps,
				userFacingSummary: error.message,
				error,
			};
			return { result, panelState: await this.settingsService.buildPanelState() };
		}

		try {
			emit({ step: 'detect-usb', success: true, message: 'CyberBrick USB port selected.' });

			let deviceId = request.targetDeviceId?.trim() || (await this.uploader.readCyberBrickDeviceId(port));
			emit({ step: 'read-device-id', success: Boolean(deviceId), message: deviceId ? 'Device identity found.' : 'Creating device identity.' });
			if (!deviceId) {
				deviceId = `cyberbrick-${this.randomToken(8)}`;
				await this.uploader.writeCyberBrickDeviceId(port, deviceId);
				emit({ step: 'read-device-id', success: true, message: 'Device identity created.', deviceId });
			}

			const otaToken = this.randomToken(24);
			const pairingSecret = this.randomToken(24);
			const agentSource = buildCyberBrickOtaAgentSource({ deviceId, otaToken, otaPort: CYBERBRICK_OTA_DEFAULT_PORT });
			await this.uploader.deployCyberBrickOtaAgent(port, agentSource);
			emit({ step: 'install-agent', success: true, message: 'OTA agent installed.', deviceId });

			const configureResult = await this.uploader.configureCyberBrickOtaAgent(port, {
				deviceId,
				ssid: request.ssid,
				wifiPassword: request.wifiPassword,
				otaToken,
				pairingSecret,
				otaPort: CYBERBRICK_OTA_DEFAULT_PORT,
			});
			emit({
				step: 'configure-wifi',
				success: true,
				message: configureResult.ipAddress ? 'Wi-Fi configured.' : 'Wi-Fi configuration saved; IP not reported yet.',
				deviceId,
				ipAddress: configureResult.ipAddress,
			});
			if (configureResult.agentStarted === false) {
				const error = createCyberBrickUploadError('agent-unreachable', 'CyberBrick OTA agent did not start.');
				emit({ step: 'verify-agent', success: false, message: error.message, deviceId, ipAddress: configureResult.ipAddress, error });
				throw error;
			}
			if (configureResult.rcMainPatched === false) {
				const error = createCyberBrickUploadError('agent-install-failed', 'CyberBrick rc_main.py could not be prepared for OTA startup.', {
					details: configureResult.rcMainError || undefined,
				});
				emit({ step: 'verify-agent', success: false, message: error.message, deviceId, ipAddress: configureResult.ipAddress, error });
				throw error;
			}
			emit({ step: 'verify-agent', success: true, message: 'OTA agent is running.', deviceId, ipAddress: configureResult.ipAddress });

			const secretWrites: Array<Promise<void>> = [
				this.settingsService.storeDeviceSecret(deviceId, 'otaToken', otaToken),
				this.settingsService.storeDeviceSecret(deviceId, 'pairingSecret', pairingSecret),
			];
			if (request.wifiPassword) {
				secretWrites.push(this.settingsService.storeDeviceSecret(deviceId, 'wifiPassword', request.wifiPassword));
			}
			await Promise.all(secretWrites);
			emit({ step: 'store-secrets', success: true, message: 'Secrets stored securely.', deviceId });

			const now = this.nowIso();
			const existingSettings = await this.settingsService.loadSettings();
			const device: PairedCyberBrickDevice = {
				deviceId,
				friendlyName: request.friendlyName?.trim() || `CyberBrick ${deviceId.slice(-4)}`,
				createdAt: existingSettings.pairedDevices.find(item => item.deviceId === deviceId)?.createdAt || now,
				updatedAt: now,
				otaPort: CYBERBRICK_OTA_DEFAULT_PORT,
				protocolVersion: CYBERBRICK_OTA_PROTOCOL_VERSION,
				...(configureResult.ipAddress ? { lastKnownIp: configureResult.ipAddress, lastSeenAt: now } : {}),
				statusSummary: configureResult.ipAddress ? 'ready' : 'needs setup',
				...(configureResult.agentVersion ? { agentVersion: configureResult.agentVersion } : {}),
			};

			await this.settingsService.upsertPairedDevice(device, { makePrimary: !existingSettings.primaryDeviceId });

			const panelState = await this.settingsService.buildPanelState();
			const result: OtaProvisioningResult = {
				success: true,
				status: 'succeeded',
				device,
				nextUploadMode: 'usb',
				steps,
				secretsStored: [
					{ deviceId, kind: 'otaToken', hasValue: true },
					{ deviceId, kind: 'pairingSecret', hasValue: true },
					{ deviceId, kind: 'wifiPassword', hasValue: Boolean(request.wifiPassword) },
				],
				userFacingSummary: 'CyberBrick OTA setup completed. Upload mode remains USB until you choose OTA.',
			};
			log('CyberBrick OTA provisioning completed', 'info', { deviceId, hasIp: Boolean(device.lastKnownIp) });
			return { result, panelState };
		} catch (error) {
			const userError = classifyCyberBrickUploadError(error, 'provisioning-failed');
			const result: OtaProvisioningResult = {
				success: false,
				status: 'failed',
				nextUploadMode: 'usb',
				steps,
				userFacingSummary: userError.message,
				error: userError,
			};
			log('CyberBrick OTA provisioning failed', 'warn', { code: userError.code });
			return { result, panelState: await this.settingsService.buildPanelState() };
		}
	}

	async removeOtaArtifacts(
		request: CyberBrickOtaCleanupRequest
	): Promise<{ result: CyberBrickOtaCleanupResult; panelState: CyberBrickUploadPanelState }> {
		const port = (request.usbPort || request.port || '').trim();
		if (!port) {
			const error = createCyberBrickUploadError('usb-port-missing');
			return { result: this.createCleanupFailure(error), panelState: await this.settingsService.buildPanelState() };
		}

		const expectedDeviceId = request.deviceId?.trim() || '';
		try {
			let actualDeviceId = '';
			try {
				actualDeviceId = (await this.uploader.readCyberBrickDeviceId(port))?.trim() || '';
			} catch (error) {
				if (!expectedDeviceId) {
					log('CyberBrick OTA cleanup could not read device identity; continuing USB-connected cleanup without local pairing removal', 'warn', {
						details: error instanceof Error ? error.message : String(error),
					});
				} else {
					throw createCyberBrickUploadError('device-id-read-failed', 'Could not verify the CyberBrick device identity before OTA cleanup.', {
						details: error instanceof Error ? error.message : String(error),
					});
				}
			}

			if (expectedDeviceId && !actualDeviceId) {
				throw createCyberBrickUploadError('device-id-read-failed', 'Could not verify the selected CyberBrick over USB before OTA cleanup.');
			}
			if (expectedDeviceId && actualDeviceId && expectedDeviceId !== actualDeviceId) {
				throw createCyberBrickUploadError('identity-mismatch', 'The USB-connected CyberBrick does not match the selected OTA device.', {
					details: { expectedDeviceId, actualDeviceId },
				});
			}

			const cleanup = await this.uploader.removeCyberBrickOtaArtifacts(port);
			if (cleanup.rcMainError) {
				throw createCyberBrickUploadError('rc-main-patch-failed', 'CyberBrick OTA removal could not patch rc_main.py.', {
					details: cleanup.rcMainError,
				});
			}
			if (cleanup.agentRemoveError || cleanup.configRemoveError) {
				throw createCyberBrickUploadError('ota-cleanup-failed', 'CyberBrick OTA files could not be removed from the USB-connected device.', {
					details: {
						agentRemoveError: cleanup.agentRemoveError || null,
						configRemoveError: cleanup.configRemoveError || null,
					},
				});
			}
			const cleanupDeviceId = actualDeviceId || expectedDeviceId || undefined;
			let localPairingRemoved = false;
			if (cleanupDeviceId) {
				const settingsBeforeLocalCleanup = await this.settingsService.loadSettings();
				const hadPairedDevice = settingsBeforeLocalCleanup.pairedDevices.some(device => device.deviceId === cleanupDeviceId);
				const secretPresence = await this.settingsService.getSecretPresence(cleanupDeviceId);
				await this.settingsService.deletePairedDevice(cleanupDeviceId);
				localPairingRemoved = hadPairedDevice || secretPresence.wifiPasswordSet || secretPresence.otaTokenSet || secretPresence.pairingSecretSet;
			}

			const result: CyberBrickOtaCleanupResult = {
				success: true,
				...(cleanupDeviceId ? { deviceId: cleanupDeviceId } : {}),
				removedAgent: cleanup.removedAgent,
				removedConfig: cleanup.removedConfig,
				rcMainPatched: cleanup.rcMainPatched,
				rcMainHadBootstrap: cleanup.rcMainHadBootstrap,
				localPairingRemoved,
				userFacingSummary: 'CyberBrick OTA files were removed. Matching local pairing was cleared if found.',
			};
			log('CyberBrick OTA artifacts removed', 'info', {
				deviceId: cleanupDeviceId,
				removedAgent: cleanup.removedAgent,
				removedConfig: cleanup.removedConfig,
				rcMainPatched: cleanup.rcMainPatched,
			});
			return { result, panelState: await this.settingsService.buildPanelState() };
		} catch (error) {
			const userError = classifyCyberBrickUploadError(error, 'ota-cleanup-failed');
			log('CyberBrick OTA cleanup failed', 'warn', { code: userError.code });
			return { result: this.createCleanupFailure(userError), panelState: await this.settingsService.buildPanelState() };
		}
	}

	private toPortSummary(port: ComPortInfo): CyberBrickUsbPortSummary {
		return {
			path: port.path,
			displayName: [port.path, port.manufacturer, port.description].filter(Boolean).join(' · '),
			manufacturer: port.manufacturer,
			serialNumber: undefined,
		};
	}

	private randomToken(bytes: number): string {
		return this.randomBytes(bytes).toString('hex');
	}

	private nowIso(): string {
		return this.now().toISOString();
	}

	private createCleanupFailure(error: ReturnType<typeof createCyberBrickUploadError>): CyberBrickOtaCleanupResult {
		return {
			success: false,
			removedAgent: false,
			removedConfig: false,
			rcMainPatched: false,
			rcMainHadBootstrap: false,
			localPairingRemoved: false,
			userFacingSummary: error.message,
			error,
		};
	}
}
