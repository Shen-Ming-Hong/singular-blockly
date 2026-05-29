/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { log } from './logging';
import { createCyberBrickUploadError } from './cyberbrickUploadErrors';
import {
	CYBERBRICK_OTA_DEFAULT_PORT,
	CYBERBRICK_OTA_PROTOCOL_VERSION,
	CYBERBRICK_UPLOAD_SETTINGS_KEY,
	CYBERBRICK_UPLOAD_SETTINGS_SCHEMA_VERSION,
	CyberBrickSecretKind,
	CyberBrickSecretPresence,
	CyberBrickUploadPanelState,
	CyberBrickUploadSettings,
	OtaReadinessCheck,
	OtaReadinessStatus,
	PairedCyberBrickDevice,
} from '../types/cyberbrickUpload';

export interface CyberBrickUploadSettingsServiceOptions {
	now?: () => Date;
	configuration?: Pick<vscode.WorkspaceConfiguration, 'get' | 'update'>;
}

type WorkspaceIdentity = vscode.WorkspaceFolder | vscode.Uri | string | { uri?: { fsPath?: string; toString?: () => string }; fsPath?: string };

interface LegacySettingsShape {
	schemaVersion?: unknown;
	primaryDeviceId?: unknown;
	pairedDevices?: unknown;
	devices?: unknown;
}

export class CyberBrickUploadSettingsService {
	private readonly now: () => Date;
	private readonly configuration?: Pick<vscode.WorkspaceConfiguration, 'get' | 'update'>;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly workspaceIdentity: WorkspaceIdentity,
		options: CyberBrickUploadSettingsServiceOptions = {}
	) {
		this.now = options.now ?? (() => new Date());
		this.configuration = options.configuration;
	}

	getWorkspaceHash(): string {
		return crypto.createHash('sha256').update(this.getWorkspaceUriText()).digest('hex').slice(0, 16);
	}

	getSecretKey(deviceId: string, kind: CyberBrickSecretKind): string {
		return `singular-blockly.cyberbrick.${this.getWorkspaceHash()}.${this.normalizeDeviceId(deviceId)}.${kind}`;
	}

	getDefaultSettings(): CyberBrickUploadSettings {
		return {
			schemaVersion: CYBERBRICK_UPLOAD_SETTINGS_SCHEMA_VERSION,
			pairedDevices: [],
		};
	}

	async loadSettings(): Promise<CyberBrickUploadSettings> {
		const raw = this.getConfiguration().get<unknown>(CYBERBRICK_UPLOAD_SETTINGS_KEY, undefined);
		return this.normalizeSettings(raw);
	}

	async saveSettings(update: Partial<CyberBrickUploadSettings>): Promise<CyberBrickUploadSettings> {
		const current = await this.loadSettings();
		const next = this.normalizeSettings({ ...current, ...update });
		await this.getConfiguration().update(CYBERBRICK_UPLOAD_SETTINGS_KEY, next, vscode.ConfigurationTarget.Workspace);
		log('CyberBrick upload settings saved', 'info', {
			pairedDeviceCount: next.pairedDevices.length,
			primaryDeviceId: next.primaryDeviceId,
		});
		return next;
	}

	async upsertPairedDevice(device: Partial<PairedCyberBrickDevice> & { deviceId: string }, options?: { makePrimary?: boolean }): Promise<CyberBrickUploadSettings> {
		const current = await this.loadSettings();
		const normalizedDevice = this.normalizeDevice(device);
		const pairedDevices = current.pairedDevices.filter(existing => existing.deviceId !== normalizedDevice.deviceId);
		pairedDevices.push(normalizedDevice);
		return this.saveSettings({
			pairedDevices,
			primaryDeviceId: options?.makePrimary || !current.primaryDeviceId ? normalizedDevice.deviceId : current.primaryDeviceId,
		});
	}

	async deletePairedDevice(deviceId: string): Promise<CyberBrickUploadSettings> {
		const normalizedDeviceId = this.normalizeDeviceId(deviceId);
		const current = await this.loadSettings();
		const pairedDevices = current.pairedDevices.filter(device => device.deviceId !== normalizedDeviceId);
		await this.deleteDeviceSecrets(normalizedDeviceId);
		return this.saveSettings({
			pairedDevices,
			primaryDeviceId: current.primaryDeviceId === normalizedDeviceId ? pairedDevices[0]?.deviceId : current.primaryDeviceId,
		});
	}

	async updateDeviceMetadata(
		deviceId: string,
		metadata: Partial<Pick<PairedCyberBrickDevice, 'lastKnownIp' | 'lastSeenAt' | 'lastSuccessfulUploadAt' | 'statusSummary' | 'agentVersion'>>
	): Promise<CyberBrickUploadSettings> {
		const normalizedDeviceId = this.normalizeDeviceId(deviceId);
		const current = await this.loadSettings();
		const pairedDevices = current.pairedDevices.map(device => {
			if (device.deviceId !== normalizedDeviceId) {
				return device;
			}
			return this.normalizeDevice({
				...device,
				...metadata,
				updatedAt: this.nowIso(),
			});
		});
		return this.saveSettings({ pairedDevices });
	}

	async storeDeviceSecret(deviceId: string, kind: CyberBrickSecretKind, value: string): Promise<void> {
		const trimmedValue = value.trim();
		if (!trimmedValue) {
			await this.deleteDeviceSecret(deviceId, kind);
			return;
		}
		await this.context.secrets.store(this.getSecretKey(deviceId, kind), trimmedValue);
		log('CyberBrick secret stored', 'info', { deviceId: this.normalizeDeviceId(deviceId), kind });
	}

	async getDeviceSecret(deviceId: string, kind: CyberBrickSecretKind): Promise<string | undefined> {
		return this.context.secrets.get(this.getSecretKey(deviceId, kind));
	}

	async deleteDeviceSecret(deviceId: string, kind: CyberBrickSecretKind): Promise<void> {
		await this.context.secrets.delete(this.getSecretKey(deviceId, kind));
		log('CyberBrick secret deleted', 'info', { deviceId: this.normalizeDeviceId(deviceId), kind });
	}

	async deleteDeviceSecrets(deviceId: string): Promise<void> {
		await Promise.all([
			this.deleteDeviceSecret(deviceId, 'wifiPassword'),
			this.deleteDeviceSecret(deviceId, 'otaToken'),
			this.deleteDeviceSecret(deviceId, 'pairingSecret'),
		]);
	}

	async buildPanelState(): Promise<CyberBrickUploadPanelState> {
		const settings = await this.loadSettings();
		const secretPresenceEntries = await Promise.all(
			settings.pairedDevices.map(async device => {
				const presence = await this.getSecretPresence(device.deviceId);
				return [device.deviceId, presence] as const;
			})
		);
		return {
			settings,
			secretPresence: Object.fromEntries(secretPresenceEntries),
		};
	}

	async getSecretPresence(deviceId: string): Promise<CyberBrickSecretPresence> {
		const normalizedDeviceId = this.normalizeDeviceId(deviceId);
		const [wifiPassword, otaToken, pairingSecret] = await Promise.all([
			this.getDeviceSecret(normalizedDeviceId, 'wifiPassword'),
			this.getDeviceSecret(normalizedDeviceId, 'otaToken'),
			this.getDeviceSecret(normalizedDeviceId, 'pairingSecret'),
		]);
		return {
			deviceId: normalizedDeviceId,
			wifiPasswordSet: Boolean(wifiPassword),
			otaTokenSet: Boolean(otaToken),
			pairingSecretSet: Boolean(pairingSecret),
		};
	}

	async buildOtaReadinessStatus(deviceId?: string): Promise<OtaReadinessStatus> {
		const settings = await this.loadSettings();
		const checks: OtaReadinessCheck[] = [];
		const addCheck = (check: OtaReadinessCheck) => checks.push(check);

		const selectedDeviceId = this.normalizeDeviceId(deviceId || settings.primaryDeviceId || '');
		if (!selectedDeviceId) {
			addCheck({
				code: 'missing-primary-device',
				ok: false,
				message: 'No primary CyberBrick OTA target is selected.',
				nextActions: ['Pair a CyberBrick over USB, then select it as the primary OTA target.'],
			});
			return this.toReadinessStatus(undefined, checks);
		}

		const device = settings.pairedDevices.find(item => item.deviceId === selectedDeviceId);
		if (!device) {
			addCheck({
				code: 'missing-primary-device',
				ok: false,
				message: 'The selected CyberBrick is no longer paired.',
				nextActions: ['Select another paired device or run USB-first OTA setup again.'],
			});
			return this.toReadinessStatus(undefined, checks);
		}

		const otaToken = await this.getDeviceSecret(device.deviceId, 'otaToken');
		if (!otaToken) {
			addCheck({
				code: 'missing-ota-token',
				ok: false,
				message: 'The selected CyberBrick is missing its OTA token.',
				nextActions: ['Run USB-first OTA setup again for this CyberBrick.'],
			});
		}

		if (!device.lastKnownIp) {
			addCheck({
				code: 'missing-address',
				ok: false,
				message: 'The selected CyberBrick does not have a last-known IP address.',
				nextActions: ['Complete OTA setup while the CyberBrick is connected to Wi-Fi.'],
			});
		}

		if (checks.length === 0) {
			addCheck({ code: 'ok', ok: true, message: 'CyberBrick is ready for OTA upload.', nextActions: [] });
		}

		return this.toReadinessStatus(device, checks);
	}

	async getSelectedOtaDevice(deviceId?: string): Promise<PairedCyberBrickDevice | undefined> {
		const settings = await this.loadSettings();
		const selectedDeviceId = this.normalizeDeviceId(deviceId || settings.primaryDeviceId || '');
		return settings.pairedDevices.find(device => device.deviceId === selectedDeviceId);
	}

	normalizeSettings(raw: unknown): CyberBrickUploadSettings {
		if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
			return this.getDefaultSettings();
		}

		const shape = raw as LegacySettingsShape;
		const rawDevices = Array.isArray(shape.pairedDevices) ? shape.pairedDevices : Array.isArray(shape.devices) ? shape.devices : [];
		const pairedDevices = this.normalizeDevices(rawDevices);
		const primaryDeviceId = this.normalizeDeviceId(typeof shape.primaryDeviceId === 'string' ? shape.primaryDeviceId : '');
		const primaryExists = pairedDevices.some(device => device.deviceId === primaryDeviceId);

		// Schema v2 only; older data is reset but devices & primaryDeviceId are preserved when valid
		if (shape.schemaVersion !== CYBERBRICK_UPLOAD_SETTINGS_SCHEMA_VERSION) {
			return {
				...this.getDefaultSettings(),
				pairedDevices,
				...(primaryExists ? { primaryDeviceId } : {}),
			};
		}

		return {
			schemaVersion: CYBERBRICK_UPLOAD_SETTINGS_SCHEMA_VERSION,
			pairedDevices,
			...(primaryExists ? { primaryDeviceId } : {}),
		};
	}

	private getConfiguration(): Pick<vscode.WorkspaceConfiguration, 'get' | 'update'> {
		return this.configuration ?? vscode.workspace.getConfiguration();
	}

	private normalizeDevices(rawDevices: unknown[]): PairedCyberBrickDevice[] {
		const devices = new Map<string, PairedCyberBrickDevice>();
		for (const rawDevice of rawDevices) {
			if (!rawDevice || typeof rawDevice !== 'object' || Array.isArray(rawDevice)) {
				continue;
			}
			const device = this.normalizeDevice(rawDevice as Partial<PairedCyberBrickDevice>);
			if (device.deviceId) {
				devices.set(device.deviceId, device);
			}
		}
		return [...devices.values()];
	}

	private normalizeDevice(rawDevice: Partial<PairedCyberBrickDevice>): PairedCyberBrickDevice {
		const deviceId = this.normalizeDeviceId(rawDevice.deviceId || '');
		const now = this.nowIso();
		const friendlyName = typeof rawDevice.friendlyName === 'string' && rawDevice.friendlyName.trim()
			? rawDevice.friendlyName.trim()
			: `CyberBrick ${deviceId.slice(-4) || 'device'}`;
		const otaPort = this.normalizePort(rawDevice.otaPort);
		return {
			deviceId,
			friendlyName,
			createdAt: this.normalizeIsoDate(rawDevice.createdAt) || now,
			updatedAt: this.normalizeIsoDate(rawDevice.updatedAt) || now,
			otaPort,
			protocolVersion: CYBERBRICK_OTA_PROTOCOL_VERSION,
			...(this.normalizeOptionalString(rawDevice.lastKnownIp) ? { lastKnownIp: this.normalizeOptionalString(rawDevice.lastKnownIp) } : {}),
			...(this.normalizeIsoDate(rawDevice.lastSeenAt) ? { lastSeenAt: this.normalizeIsoDate(rawDevice.lastSeenAt) } : {}),
			...(this.normalizeIsoDate(rawDevice.lastSuccessfulUploadAt)
				? { lastSuccessfulUploadAt: this.normalizeIsoDate(rawDevice.lastSuccessfulUploadAt) }
				: {}),
			...(this.normalizeOptionalString(rawDevice.statusSummary)
				? { statusSummary: this.normalizeOptionalString(rawDevice.statusSummary) }
				: {}),
			...(this.normalizeOptionalString(rawDevice.agentVersion) ? { agentVersion: this.normalizeOptionalString(rawDevice.agentVersion) } : {}),
		};
	}

	private normalizePort(value: unknown): number {
		if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 65535) {
			return CYBERBRICK_OTA_DEFAULT_PORT;
		}
		return value;
	}

	private normalizeIsoDate(value: unknown): string | undefined {
		if (typeof value !== 'string' || !value.trim()) {
			return undefined;
		}
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
	}

	private normalizeOptionalString(value: unknown): string | undefined {
		return typeof value === 'string' && value.trim() ? value.trim() : undefined;
	}

	private normalizeDeviceId(deviceId: string): string {
		return deviceId.trim();
	}

	private nowIso(): string {
		return this.now().toISOString();
	}

	private getWorkspaceUriText(): string {
		if (typeof this.workspaceIdentity === 'string') {
			return this.workspaceIdentity;
		}

		const candidate = 'uri' in this.workspaceIdentity && this.workspaceIdentity.uri ? this.workspaceIdentity.uri : this.workspaceIdentity;
		const candidateToString = candidate.toString;
		if (typeof candidateToString === 'function' && candidateToString !== Object.prototype.toString) {
			return candidateToString.call(candidate);
		}
		if ('fsPath' in candidate && typeof candidate.fsPath === 'string') {
			return `file://${candidate.fsPath}`;
		}
		return String(candidate);
	}

	private toReadinessStatus(device: PairedCyberBrickDevice | undefined, checks: OtaReadinessCheck[]): OtaReadinessStatus {
		const blockingChecks = checks.filter(check => !check.ok);
		return {
			ready: blockingChecks.length === 0,
			...(device ? { device } : {}),
			checks,
			blockingReasons: blockingChecks.map(check => check.code),
			nextActions: [...new Set(blockingChecks.flatMap(check => check.nextActions))],
		};
	}

	createUserError(code: Parameters<typeof createCyberBrickUploadError>[0], details?: string) {
		return createCyberBrickUploadError(code, undefined, { details });
	}
}
