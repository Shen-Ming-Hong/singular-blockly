/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'crypto';
import { log } from './logging';
import { CyberBrickUploadSettingsService } from './cyberbrickUploadSettingsService';
import { createCyberBrickUploadError, classifyCyberBrickUploadError } from './cyberbrickUploadErrors';
import { withCyberBrickRcMainOtaBootstrap } from './cyberbrickOtaAgentSource';
import {
	CYBERBRICK_OTA_PROTOCOL_VERSION,
	CYBERBRICK_OTA_REMOTE_PATH,
	CyberBrickReadinessCode,
	CyberBrickUploadErrorCode,
	OtaReadinessCheck,
	OtaReadinessStatus,
	OtaUploadRequest,
	OtaUploadRun,
	PairedCyberBrickDevice,
} from '../types/cyberbrickUpload';

export interface CyberBrickHttpResponse {
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
	text(): Promise<string>;
}

export type CyberBrickFetch = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string | Buffer | Uint8Array }) => Promise<CyberBrickHttpResponse>;

export interface CyberBrickOtaUploaderOptions {
	now?: () => Date;
	fetch?: CyberBrickFetch;
	healthTimeoutMs?: number;
	uploadTimeoutMs?: number;
	operationIdFactory?: () => string;
}

interface HealthResponse {
	deviceId?: string;
	agentVersion?: string;
	protocolVersion?: number;
	supportedProtocolVersions?: number[];
	appPath?: string;
	ipAddress?: string;
	status?: string;
}

interface UploadResponse {
	operationId?: string;
	deviceId?: string;
	remotePath?: string;
	bytesWritten?: number;
	contentSha256?: string;
	restarted?: boolean;
	status?: string;
}

export class CyberBrickOtaUploader {
	private readonly now: () => Date;
	private readonly fetchImpl: CyberBrickFetch;
	private readonly healthTimeoutMs: number;
	private readonly uploadTimeoutMs: number;
	private readonly operationIdFactory: () => string;

	constructor(private readonly settingsService: CyberBrickUploadSettingsService, options: CyberBrickOtaUploaderOptions = {}) {
		this.now = options.now ?? (() => new Date());
		this.fetchImpl = options.fetch ?? this.getGlobalFetch();
		this.healthTimeoutMs = options.healthTimeoutMs ?? 5000;
		this.uploadTimeoutMs = options.uploadTimeoutMs ?? 30000;
		this.operationIdFactory = options.operationIdFactory ?? (() => `cyberbrick-ota-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`);
	}

	async checkReadiness(deviceId?: string): Promise<OtaReadinessStatus> {
		const baseline = await this.settingsService.buildOtaReadinessStatus(deviceId);
		if (!baseline.ready || !baseline.device) {
			return baseline;
		}

		const token = await this.settingsService.getDeviceSecret(baseline.device.deviceId, 'otaToken');
		if (!token) {
			return this.withAdditionalCheck(baseline, {
				code: 'missing-ota-token',
				ok: false,
				message: 'The selected CyberBrick is missing its OTA token.',
				nextActions: ['Run USB-first OTA setup again for this CyberBrick.'],
			});
		}

		try {
			const health = await this.fetchHealth(baseline.device, token);
			const checks = [...baseline.checks.filter(check => check.code !== 'ok')];
			if (health.deviceId !== baseline.device.deviceId) {
				checks.push({
					code: 'identity-mismatch',
					ok: false,
					message: 'The responding CyberBrick identity does not match the selected target.',
					nextActions: ['Choose the correct CyberBrick target or run USB-first setup again.'],
				});
			}
			if (health.protocolVersion !== CYBERBRICK_OTA_PROTOCOL_VERSION || health.appPath !== CYBERBRICK_OTA_REMOTE_PATH) {
				checks.push({
					code: 'agent-outdated',
					ok: false,
					message: 'The CyberBrick OTA agent does not support the required protocol.',
					nextActions: ['Run USB-first OTA setup again to update the agent.'],
				});
			}
			if (health.status && health.status !== 'ready') {
				checks.push({
					code: 'agent-health-failed',
					ok: false,
					message: `CyberBrick OTA agent status is ${health.status}.`,
					nextActions: ['Retry after the device is ready, or manually switch to USB.'],
				});
			}
			if (checks.length === 0) {
				checks.push({ code: 'ok', ok: true, message: 'CyberBrick is ready for OTA upload.', nextActions: [] });
				await this.settingsService.updateDeviceMetadata(baseline.device.deviceId, {
					lastSeenAt: this.nowIso(),
					...(health.ipAddress ? { lastKnownIp: health.ipAddress } : {}),
					...(health.agentVersion ? { agentVersion: health.agentVersion } : {}),
					statusSummary: 'ready',
				});
			}
			return this.toReadinessStatus(baseline.device, checks);
		} catch (error) {
			return this.withAdditionalCheck(baseline, {
				code: this.classifyNetworkCode(error),
				ok: false,
				message: 'CyberBrick OTA agent could not be reached.',
				nextActions: ['Check CyberBrick power and Wi-Fi, then retry. USB fallback is manual only.'],
			});
		}
	}

	async upload(request: OtaUploadRequest, onProgress?: (run: OtaUploadRun) => void): Promise<OtaUploadRun> {
		const operationId = this.operationIdFactory();
		const startedAt = this.nowIso();
		let run = this.createRun(operationId, startedAt, 'validating', 5, 'Checking OTA readiness...');
		onProgress?.(run);

		if (request.board !== 'cyberbrick') {
			return this.failRun(run, 'invalid-settings', 'OTA upload only supports CyberBrick.');
		}
		if (!request.code || !request.code.trim()) {
			return this.failRun(run, 'code-empty', 'Generated code is empty.');
		}

		const readiness = await this.checkReadiness();
		if (!readiness.ready || !readiness.device) {
			const code = readiness.blockingReasons[0] || 'invalid-settings';
			return this.failRun(run, code, readiness.checks.find(check => !check.ok)?.message || 'CyberBrick OTA readiness failed.');
		}

		const device = readiness.device;
		const token = await this.settingsService.getDeviceSecret(device.deviceId, 'otaToken');
		if (!token) {
			return this.failRun(run, 'missing-ota-token', 'The selected CyberBrick is missing its OTA token.', device);
		}

		run = this.createRun(operationId, startedAt, 'connecting', 20, 'Connecting to CyberBrick OTA agent...', device);
		onProgress?.(run);

		try {
			await this.fetchHealth(device, token);
			const codeToUpload = withCyberBrickRcMainOtaBootstrap(request.code);
			const codeBytes = Buffer.from(codeToUpload, 'utf8');
			const contentSha256 = crypto.createHash('sha256').update(codeBytes).digest('hex');

			run = this.createRun(operationId, startedAt, 'transferring', 55, 'Uploading /app/rc_main.py over Wi-Fi...', device, contentSha256);
			onProgress?.(run);

			const response = await this.withTimeout(
				this.fetchImpl(`${this.getBaseUrl(device)}/upload`, {
					method: 'POST',
					headers: this.buildHeaders(device.deviceId, token, {
						'Content-Type': 'application/octet-stream',
						'Content-Length': String(codeBytes.length),
						'X-Singular-Content-Sha256': contentSha256,
						'X-Singular-Operation-Id': operationId,
					}),
					body: codeBytes,
				}),
				this.uploadTimeoutMs,
				'upload-timeout'
			);

			if (response.status === 401 || response.status === 403) {
				return this.failRun(run, response.status === 401 ? 'token-rejected' : 'identity-mismatch', 'CyberBrick rejected the OTA upload request.', device);
			}
			if (!response.ok) {
				return this.failRun(run, 'write-failed', `CyberBrick OTA upload failed with HTTP ${response.status}.`, device);
			}

			run = this.createRun(operationId, startedAt, 'verifying', 85, 'Verifying uploaded program...', device, contentSha256);
			onProgress?.(run);

			const uploadResult = (await response.json()) as UploadResponse;
			this.validateUploadResponse(uploadResult, operationId, device.deviceId, contentSha256);

			const status = uploadResult.status === 'written-restart-failed' ? 'failed' : 'succeeded';
			const errorCode = uploadResult.status === 'written-restart-failed' ? 'restart-failed' : null;
			const finishedAt = this.nowIso();
			await this.settingsService.updateDeviceMetadata(device.deviceId, {
				lastSeenAt: finishedAt,
				lastSuccessfulUploadAt: status === 'succeeded' ? finishedAt : undefined,
				statusSummary: status === 'succeeded' ? 'ready' : 'restart failed',
			});

			return {
				...run,
				finishedAt,
				status,
				progress: 100,
				stageMessage: status === 'succeeded' ? 'OTA upload complete.' : 'Program written, but restart failed.',
				errorCode,
				userFacingSummary: status === 'succeeded' ? 'CyberBrick OTA upload complete.' : 'Program was written, but CyberBrick could not restart automatically.',
			};
		} catch (error) {
			const userError = classifyCyberBrickUploadError(error, 'ota-upload-failed');
			if (userError.code === 'upload-timeout') {
				const recovered = await this.tryRecoverFromUploadTimeout(run, device, token, startedAt, operationId, onProgress);
				if (recovered) { return recovered; }
			}
			return this.failRun(run, userError.code, userError.message, device, userError);
		}
	}

	private async fetchHealth(device: PairedCyberBrickDevice, token: string): Promise<HealthResponse> {
		const response = await this.withTimeout(
			this.fetchImpl(`${this.getBaseUrl(device)}/health`, {
				method: 'GET',
				headers: this.buildHeaders(device.deviceId, token),
			}),
			this.healthTimeoutMs,
			'timeout'
		);
		if (response.status === 401 || response.status === 403) {
			throw createCyberBrickUploadError('token-rejected', `CyberBrick OTA health check rejected the saved token with HTTP ${response.status}.`);
		}
		if (!response.ok) {
			throw createCyberBrickUploadError('agent-health-failed', `CyberBrick OTA health check failed with HTTP ${response.status}.`);
		}
		return (await response.json()) as HealthResponse;
	}

	private validateUploadResponse(response: UploadResponse, operationId: string, deviceId: string, contentSha256: string): void {
		if (response.operationId !== operationId || response.deviceId !== deviceId) {
			throw createCyberBrickUploadError('identity-mismatch');
		}
		if (response.remotePath !== CYBERBRICK_OTA_REMOTE_PATH || response.contentSha256 !== contentSha256) {
			throw createCyberBrickUploadError('write-failed');
		}
	}

	private getBaseUrl(device: PairedCyberBrickDevice): string {
		if (!device.lastKnownIp) {
			throw createCyberBrickUploadError('missing-address');
		}
		return `http://${device.lastKnownIp}:${device.otaPort || 8266}/api/v1`;
	}

	private buildHeaders(deviceId: string, token: string, extra?: Record<string, string>): Record<string, string> {
		return {
			Authorization: `Bearer ${token}`,
			'X-CyberBrick-Device-Id': deviceId,
			'X-CyberBrick-Protocol-Version': String(CYBERBRICK_OTA_PROTOCOL_VERSION),
			...(extra || {}),
		};
	}

	private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, code: CyberBrickUploadErrorCode): Promise<T> {
		let timeoutId: NodeJS.Timeout | undefined;
		const timeout = new Promise<T>((_resolve, reject) => {
			timeoutId = setTimeout(() => reject(createCyberBrickUploadError(code)), timeoutMs);
		});
		try {
			return await Promise.race([promise, timeout]);
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		}
	}

	private createRun(
		operationId: string,
		startedAt: string,
		status: OtaUploadRun['status'],
		progress: number,
		stageMessage: string,
		device?: PairedCyberBrickDevice,
		sha256?: string
	): OtaUploadRun {
		return {
			operationId,
			deviceId: device?.deviceId,
			friendlyName: device?.friendlyName,
			startedAt,
			finishedAt: null,
			status,
			progress,
			stageMessage,
			errorCode: null,
			userFacingSummary: stageMessage,
			remotePath: CYBERBRICK_OTA_REMOTE_PATH,
			...(sha256 ? { sha256 } : {}),
		};
	}

	private failRun(
		run: OtaUploadRun,
		code: CyberBrickUploadErrorCode,
		message: string,
		device?: PairedCyberBrickDevice,
		error = createCyberBrickUploadError(code, message)
	): OtaUploadRun {
		log('CyberBrick OTA upload failed', 'warn', { code, deviceId: device?.deviceId || run.deviceId });
		return {
			...run,
			...(device ? { deviceId: device.deviceId, friendlyName: device.friendlyName } : {}),
			finishedAt: this.nowIso(),
			status: code === 'timeout' || code === 'upload-timeout' ? 'timed-out' : 'failed',
			progress: Math.max(run.progress, 100),
			stageMessage: message,
			errorCode: code,
			userFacingSummary: message,
			error,
		};
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

	private withAdditionalCheck(status: OtaReadinessStatus, check: OtaReadinessCheck): OtaReadinessStatus {
		return this.toReadinessStatus(status.device, [...status.checks.filter(item => item.code !== 'ok'), check]);
	}

	private classifyNetworkCode(error: unknown): CyberBrickReadinessCode {
		if (error && typeof error === 'object' && 'code' in error) {
			const code = (error as { code?: unknown }).code;
			if (code === 'timeout' || code === 'token-rejected' || code === 'identity-mismatch' || code === 'agent-health-failed') {
				return code;
			}
		}
		return 'offline';
	}

	private getGlobalFetch(): CyberBrickFetch {
		const fetchImpl = (globalThis as unknown as { fetch?: CyberBrickFetch }).fetch;
		if (!fetchImpl) {
			throw createCyberBrickUploadError('network-error', 'This VS Code runtime does not provide fetch for OTA upload.');
		}
		return fetchImpl.bind(globalThis) as CyberBrickFetch;
	}

	private nowIso(): string {
		return this.now().toISOString();
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private async tryRecoverFromUploadTimeout(
		run: OtaUploadRun,
		device: PairedCyberBrickDevice,
		token: string,
		startedAt: string,
		operationId: string,
		onProgress?: (run: OtaUploadRun) => void
	): Promise<OtaUploadRun | null> {
		// The device may have written the file and called machine.reset() before the TCP
		// response was flushed. Wait for it to reboot, then verify it is back online.
		const waitingRun = this.createRun(operationId, startedAt, 'verifying', 95, 'Waiting for CyberBrick to restart...', device);
		onProgress?.(waitingRun);
		await this.delay(5000);
		try {
			const health = await this.withTimeout(this.fetchHealth(device, token), this.healthTimeoutMs, 'timeout');
			if (health.deviceId === device.deviceId) {
				const finishedAt = this.nowIso();
				await this.settingsService.updateDeviceMetadata(device.deviceId, {
					lastSeenAt: finishedAt,
					lastSuccessfulUploadAt: finishedAt,
					statusSummary: 'ready',
				});
				log('CyberBrick OTA upload recovered after device reset', 'info', { deviceId: device.deviceId });
				return {
					...waitingRun,
					finishedAt,
					status: 'succeeded',
					progress: 100,
					stageMessage: 'OTA upload complete.',
					errorCode: null,
					userFacingSummary: 'CyberBrick OTA upload complete.',
				};
			}
		} catch {
			// Device not responsive after reboot window — fall through to original error
		}
		return null;
	}
}
