/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'crypto';
import { log } from './logging';
import { CyberBrickUploadSettingsService } from './cyberbrickUploadSettingsService';
import { createCyberBrickUploadError, classifyCyberBrickUploadError } from './cyberbrickUploadErrors';
import { withCyberBrickRcMainOtaBootstrap, buildCyberBrickOtaAgentSource, CyberBrickOtaAgentConfig } from './cyberbrickOtaAgentSource';
import {
	CYBERBRICK_OTA_PROTOCOL_VERSION,
	CYBERBRICK_OTA_REMOTE_PATH,
	CYBERBRICK_OTA_AGENT_TARGET_VERSION,
	CYBERBRICK_OTA_RESET_MIN_VERSION,
	CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION,
	CyberBrickReadinessCode,
	CyberBrickUploadErrorCode,
	OtaReadinessCheck,
	OtaReadinessStatus,
	OtaUploadRequest,
	OtaUploadRun,
	PairedCyberBrickDevice,
} from '../types/cyberbrickUpload';

export { CYBERBRICK_OTA_AGENT_TARGET_VERSION, CYBERBRICK_OTA_RESET_MIN_VERSION, CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION };

const PRE_UPLOAD_RESET_RECOVERY_TIMEOUT_MS = 8000;
const PRE_UPLOAD_RESET_INITIAL_DELAY_MS = 250;
const PRE_UPLOAD_RESET_RETRY_INTERVAL_MS = 100;
const PRE_UPLOAD_RESET_HEALTH_TIMEOUT_MS = 500;
const PREFLIGHT_RESPONSE_WINDOW_MIN_TIMEOUT_MS = 250;
const PREFLIGHT_RESPONSE_WINDOW_MAX_TIMEOUT_MS = 1500;
const PREFLIGHT_RESPONSE_WINDOW_MIN_RETRY_INTERVAL_MS = 50;
const PREFLIGHT_RESPONSE_WINDOW_MAX_RETRY_INTERVAL_MS = 100;
const PREFLIGHT_RESPONSE_WINDOW_MAX_REQUEST_TIMEOUT_MS = 400;
const DIRECT_UPLOAD_WINDOW_TIMEOUT_MS = 2000;

/**
 * Parses a semver string into a [major, minor, patch] tuple.
 * Returns [0, 0, 0] for undefined or invalid input.
 */
export function parseAgentVersion(version: string | undefined): [number, number, number] {
	if (!version) {
		return [0, 0, 0];
	}
	const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
	if (!match) {
		return [0, 0, 0];
	}
	return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

/**
 * Compares two agent version strings.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 * Undefined or invalid versions are treated as "0.0.0".
 */
export function compareAgentVersion(a: string | undefined, b: string): number {
	const [aMaj, aMin, aPatch] = parseAgentVersion(a);
	const [bMaj, bMin, bPatch] = parseAgentVersion(b);
	if (aMaj !== bMaj) { return aMaj - bMaj; }
	if (aMin !== bMin) { return aMin - bMin; }
	return aPatch - bPatch;
}

export interface CyberBrickHttpResponse {
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
	text(): Promise<string>;
}

export type CyberBrickFetch = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string | Buffer | Uint8Array; signal?: AbortSignal }) => Promise<CyberBrickHttpResponse>;

export interface CyberBrickOtaUploaderOptions {
	now?: () => Date;
	fetch?: CyberBrickFetch;
	healthTimeoutMs?: number;
	uploadTimeoutMs?: number;
	retryIntervalMs?: number;
	postUpgradeRecoveryTimeoutMs?: number;
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
	private readonly retryIntervalMs: number;
	private readonly postUpgradeRecoveryTimeoutMs: number;
	private readonly operationIdFactory: () => string;

	constructor(private readonly settingsService: CyberBrickUploadSettingsService, options: CyberBrickOtaUploaderOptions = {}) {
		this.now = options.now ?? (() => new Date());
		this.fetchImpl = options.fetch ?? this.getGlobalFetch();
		this.healthTimeoutMs = options.healthTimeoutMs ?? 5000;
		this.uploadTimeoutMs = options.uploadTimeoutMs ?? 30000;
		this.retryIntervalMs = options.retryIntervalMs ?? 1000;
		this.postUpgradeRecoveryTimeoutMs = options.postUpgradeRecoveryTimeoutMs ?? 15000;
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
			const checks = this.buildChecksFromHealth(baseline.device, baseline.checks, health);
			const liveDevice = checks.length === 0 ? this.withHealthMetadata(baseline.device, health, 'ready') : baseline.device;
			if (checks.length === 0) {
				checks.push({ code: 'ok', ok: true, message: 'CyberBrick is ready for OTA upload.', nextActions: [] });
				await this.settingsService.updateDeviceMetadata(baseline.device.deviceId, this.metadataFromLiveDevice(liveDevice));
			}
			return this.toReadinessStatus(liveDevice, checks);
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

		let readiness = await this.checkReadiness(request.deviceId);
		let recoveredHealth: HealthResponse | null = null;
		if (!readiness.ready && readiness.device) {
			const recoveryToken = await this.settingsService.getDeviceSecret(readiness.device.deviceId, 'otaToken');
			if (recoveryToken && this.shouldAttemptPreflightRecovery(readiness)) {
				const preflightRecoveryTimeoutMs = Math.min(Math.max(this.healthTimeoutMs, PREFLIGHT_RESPONSE_WINDOW_MIN_TIMEOUT_MS), PREFLIGHT_RESPONSE_WINDOW_MAX_TIMEOUT_MS);
				const preflightRecoveryIntervalMs = Math.min(Math.max(this.retryIntervalMs, PREFLIGHT_RESPONSE_WINDOW_MIN_RETRY_INTERVAL_MS), PREFLIGHT_RESPONSE_WINDOW_MAX_RETRY_INTERVAL_MS);
				const preflightRequestTimeoutMs = Math.min(this.healthTimeoutMs, PREFLIGHT_RESPONSE_WINDOW_MAX_REQUEST_TIMEOUT_MS);
				run = this.createRun(
					operationId,
					startedAt,
					'connecting',
					12,
					'CyberBrick OTA agent is busy; briefly checking for a response window...',
					readiness.device,
				);
				onProgress?.(run);
				recoveredHealth = await this.waitForAgentHealth(
					readiness.device,
					recoveryToken,
					preflightRecoveryTimeoutMs,
					preflightRecoveryIntervalMs,
					0,
					preflightRequestTimeoutMs,
				);
				if (recoveredHealth) {
					const recoveredChecks = this.buildChecksFromHealth(
						readiness.device,
						this.clearTransientPreflightChecks(readiness.checks),
						recoveredHealth,
					);
					const recoveredDevice = recoveredChecks.length === 0 ? this.withHealthMetadata(readiness.device, recoveredHealth, 'ready') : readiness.device;
					if (recoveredChecks.length === 0) {
						await this.settingsService.updateDeviceMetadata(recoveredDevice.deviceId, this.metadataFromLiveDevice(recoveredDevice));
					}
					readiness = this.toReadinessStatus(
						recoveredDevice,
						recoveredChecks.length > 0 ? recoveredChecks : [{ code: 'ok', ok: true, message: 'CyberBrick is ready for OTA upload.', nextActions: [] }],
					);
				} else if (this.shouldContinueWithOptimisticUpload(readiness)) {
					log('CyberBrick OTA preflight health probe missed the current response window; continuing with an optimistic upload attempt', 'info', {
						deviceId: readiness.device.deviceId,
						lastKnownIp: readiness.device.lastKnownIp,
						storedAgentVersion: readiness.device.agentVersion ?? 'unknown',
						timeoutMs: preflightRecoveryTimeoutMs,
					});
					readiness = this.toReadinessStatus(readiness.device, [{
						code: 'ok',
						ok: true,
						message: 'Proceeding with the last known CyberBrick OTA endpoint after a transient health timeout.',
						nextActions: [],
					}]);
				}
			}
		}
		if (!readiness.ready || !readiness.device) {
			const code = readiness.blockingReasons[0] || 'invalid-settings';
			return this.failRun(run, code, readiness.checks.find(check => !check.ok)?.message || 'CyberBrick OTA readiness failed.');
		}

		let device = readiness.device;
		const token = await this.settingsService.getDeviceSecret(device.deviceId, 'otaToken');
		if (!token) {
			return this.failRun(run, 'missing-ota-token', 'The selected CyberBrick is missing its OTA token.', device);
		}

		run = this.createRun(operationId, startedAt, 'connecting', 20, 'Connecting to CyberBrick OTA agent...', device);
		onProgress?.(run);

		let finalAgentVersion: string | undefined;
		try {
			const liveAgentVersion = device.agentVersion;
			finalAgentVersion = liveAgentVersion;
			const belowMinimum = compareAgentVersion(liveAgentVersion, CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION) < 0;
			const needsUpgrade = compareAgentVersion(liveAgentVersion, CYBERBRICK_OTA_AGENT_TARGET_VERSION) < 0;
			log('CyberBrick OTA agent version decision', 'info', {
				deviceId: device.deviceId,
				liveAgentVersion: liveAgentVersion ?? 'unknown',
				minVersion: CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION,
				targetVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
				belowMinimum,
				decision: needsUpgrade ? 'upgrade' : 'skip',
			});

			// 優先嘗試升級 OTA agent；不論目前版本是否低於 MIN，失敗都不阻擋主程式上傳。
			if (needsUpgrade) {
				const agentUpgradeRun = this.createRun(
					operationId,
					startedAt,
					'upgrading_agent',
					30,
					`Upgrading CyberBrick OTA agent ${liveAgentVersion ?? 'unknown'} → ${CYBERBRICK_OTA_AGENT_TARGET_VERSION}...`,
					device,
				);
				onProgress?.(agentUpgradeRun);
				const agentConfig: CyberBrickOtaAgentConfig = {
					deviceId: device.deviceId,
					otaToken: token,
					otaPort: device.otaPort ?? 8266,
				};
				const upgradeResult = await this.upgradeAgentOverWifi(device, token, agentConfig);
				if (upgradeResult === 'upgraded') {
					finalAgentVersion = CYBERBRICK_OTA_AGENT_TARGET_VERSION;
					const agentUpgradedRun = this.createRun(
						operationId,
						startedAt,
						'agent_upgraded',
						45,
						`CyberBrick OTA agent upgraded to ${CYBERBRICK_OTA_AGENT_TARGET_VERSION}.`,
						device,
					);
					onProgress?.(agentUpgradedRun);
				} else {
					// FR-007a: upgrade failure → warn and continue upload
					log('OTA agent upgrade failed, continuing with upload', 'warn', {
						deviceId: device.deviceId,
						liveAgentVersion: liveAgentVersion ?? 'unknown',
						belowMinimum,
					});
					const warningRun = this.createRun(
						operationId,
						startedAt,
						'agent_upgrade_needed',
						45,
						`CyberBrick OTA agent upgrade ${liveAgentVersion ?? 'unknown'} → ${CYBERBRICK_OTA_AGENT_TARGET_VERSION} failed; continuing with program upload.`,
						device,
					);
					warningRun.errorCode = 'agent-upgrade-failed';
					onProgress?.(warningRun);
				}
			}

			const codeToUpload = withCyberBrickRcMainOtaBootstrap(request.code);
			const codeBytes = Buffer.from(codeToUpload, 'utf8');
			const contentSha256 = crypto.createHash('sha256').update(codeBytes).digest('hex');

			run = this.createRun(operationId, startedAt, 'transferring', 55, 'Uploading /app/rc_main.py over Wi-Fi...', device, contentSha256);
			onProgress?.(run);

			const resetCapableForUpload = compareAgentVersion(finalAgentVersion ?? liveAgentVersion, CYBERBRICK_OTA_RESET_MIN_VERSION) >= 0;
			let response: CyberBrickHttpResponse;
			try {
				response = await this.uploadProgram(device, token, codeBytes, contentSha256, operationId, resetCapableForUpload ? Math.min(this.uploadTimeoutMs, DIRECT_UPLOAD_WINDOW_TIMEOUT_MS) : this.uploadTimeoutMs);
				if (!response.ok && resetCapableForUpload && this.shouldRetryUploadWithFreshWindow(undefined, response.status)) {
					throw createCyberBrickUploadError('upload-timeout', `CyberBrick OTA upload window was missed (HTTP ${response.status}).`);
				}
			} catch (error) {
				const errorCode = this.getErrorCode(error);
				if (!resetCapableForUpload || !this.shouldRetryUploadWithFreshWindow(errorCode)) {
					throw error;
				}

				run = this.createRun(
					operationId,
					startedAt,
					'connecting',
					50,
					'Waiting for CyberBrick OTA agent to be ready before retrying upload...',
					device,
				);
				onProgress?.(run);
				const postResetHealth = await this.reopenUploadWindow(device, token);
				if (postResetHealth) {
					device = this.withHealthMetadata(device, postResetHealth, 'ready');
					finalAgentVersion = postResetHealth.agentVersion ?? finalAgentVersion;
					await this.settingsService.updateDeviceMetadata(device.deviceId, this.metadataFromLiveDevice(device));
					log('CyberBrick OTA upload acquired a fresh upload window after the direct attempt missed the busy runtime', 'info', {
						deviceId: device.deviceId,
						liveAgentVersion: postResetHealth.agentVersion ?? 'unknown',
						errorCode,
					});
				} else {
					log('CyberBrick OTA upload could not confirm a fresh upload window after the direct attempt missed the current runtime', 'warn', {
						deviceId: device.deviceId,
						liveAgentVersion: finalAgentVersion ?? liveAgentVersion ?? 'unknown',
						errorCode,
					});
				}

				run = this.createRun(operationId, startedAt, 'transferring', 55, 'Uploading /app/rc_main.py over Wi-Fi...', device, contentSha256);
				onProgress?.(run);
				response = await this.uploadProgram(device, token, codeBytes, contentSha256, operationId, this.uploadTimeoutMs);
			}

			if (response.status === 401 || response.status === 403) {
				return this.failRun(run, response.status === 401 ? 'token-rejected' : 'identity-mismatch', 'CyberBrick rejected the OTA upload request.', device);
			}
			if (!response.ok) {
				let responseBody: string | undefined;
				try {
					responseBody = await response.text();
				} catch {
					responseBody = undefined;
				}
				log('CyberBrick OTA upload returned a non-OK response', 'warn', {
					deviceId: device.deviceId,
					status: response.status,
					body: responseBody,
				});
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
				...(finalAgentVersion ? { agentVersion: finalAgentVersion } : {}),
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
			// Log the full error chain so network-level causes (ECONNREFUSED, ETIMEDOUT, etc.)
			// are visible in the "Singular Blockly" output channel for remote debugging.
			log('CyberBrick OTA upload threw an exception', 'debug', {
				classifiedCode: userError.code,
				rawErrorMessage: error instanceof Error ? error.message : String(error),
				rawErrorName: error instanceof Error ? error.name : undefined,
				causeCode: this.getErrorCode(error),
				causeMessage: (error instanceof Error && error.cause instanceof Error) ? error.cause.message : undefined,
			});
			if (userError.code === 'upload-timeout') {
				const recovered = await this.tryRecoverFromUploadTimeout(run, device, token, startedAt, operationId, onProgress, finalAgentVersion);
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
		log('CyberBrick OTA upload failed', 'warn', { code, deviceId: device?.deviceId || run.deviceId, message });
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

	private buildChecksFromHealth(device: PairedCyberBrickDevice, baselineChecks: OtaReadinessCheck[], health: HealthResponse): OtaReadinessCheck[] {
		const checks = [...baselineChecks.filter(check => check.code !== 'ok')];
		if (health.deviceId !== device.deviceId) {
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
		return checks;
	}

	private withHealthMetadata(device: PairedCyberBrickDevice, health: HealthResponse, statusSummary?: string): PairedCyberBrickDevice {
		return {
			...device,
			...(health.ipAddress ? { lastKnownIp: health.ipAddress } : {}),
			...(health.agentVersion ? { agentVersion: health.agentVersion } : {}),
			lastSeenAt: this.nowIso(),
			...(statusSummary ? { statusSummary } : {}),
		};
	}

	private metadataFromLiveDevice(device: PairedCyberBrickDevice): Partial<Pick<PairedCyberBrickDevice, 'lastKnownIp' | 'lastSeenAt' | 'statusSummary' | 'agentVersion'>> {
		return {
			lastSeenAt: device.lastSeenAt,
			...(device.lastKnownIp ? { lastKnownIp: device.lastKnownIp } : {}),
			...(device.agentVersion ? { agentVersion: device.agentVersion } : {}),
			...(device.statusSummary ? { statusSummary: device.statusSummary } : {}),
		};
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private shouldAttemptPreflightRecovery(readiness: OtaReadinessStatus): boolean {
		return readiness.blockingReasons.length > 0
			&& readiness.blockingReasons.every(code => code === 'offline' || code === 'timeout' || code === 'agent-health-failed');
	}

	private shouldContinueWithOptimisticUpload(readiness: OtaReadinessStatus): boolean {
		return Boolean(readiness.device?.lastKnownIp) && this.shouldAttemptPreflightRecovery(readiness);
	}

	private clearTransientPreflightChecks(checks: OtaReadinessCheck[]): OtaReadinessCheck[] {
		return checks.filter(check => check.code !== 'offline' && check.code !== 'timeout' && check.code !== 'agent-health-failed');
	}

	private getErrorCode(error: unknown): string | undefined {
		if (!error || typeof error !== 'object') {
			return undefined;
		}
		// Check top-level .code first (CyberBrickUploadUserError and most Node.js errors)
		if ('code' in error) {
			const code = (error as { code?: unknown }).code;
			if (typeof code === 'string') {
				return code;
			}
		}
		// Node.js 18+ built-in fetch wraps network errors (ECONNREFUSED, ENETUNREACH, etc.)
		// inside a TypeError: the actual code lives on error.cause.code, not on the TypeError itself.
		const cause = (error as { cause?: unknown }).cause;
		if (cause && typeof cause === 'object' && 'code' in cause) {
			const causeCode = (cause as { code?: unknown }).code;
			if (typeof causeCode === 'string') {
				return causeCode;
			}
		}
		return undefined;
	}

	private async waitForAgentHealth(
		device: PairedCyberBrickDevice,
		token: string,
		timeoutMs = 30000,
		intervalMs = 1000,
		initialDelayMs = intervalMs,
		requestTimeoutMs = this.healthTimeoutMs,
	): Promise<HealthResponse | null> {
		if (initialDelayMs > 0) {
			await this.delay(initialDelayMs);
		}
		const deadline = Date.now() + timeoutMs;
		while (Date.now() < deadline) {
			try {
				const health = await this.withTimeout(this.fetchHealth(device, token), requestTimeoutMs, 'timeout');
				if (health.deviceId === device.deviceId) {
					return health;
				}
				log('waitForAgentHealth: identity mismatch', 'warn', {
					deviceId: device.deviceId,
					respondedDeviceId: health.deviceId,
				});
			} catch (error) {
				const code = this.getErrorCode(error);
				if (code !== 'ECONNREFUSED' && code !== 'timeout' && code !== 'upload-timeout' && code !== 'network-error') {
					log('waitForAgentHealth: unexpected error', 'warn', { deviceId: device.deviceId, code });
				}
			}
			await this.delay(intervalMs);
		}
		return null;
	}


	private async reopenUploadWindow(device: PairedCyberBrickDevice, token: string): Promise<HealthResponse | null> {
		// Trigger a device reboot via POST /api/v1/reset so the OTA agent re-opens
		// the upload window, then wait for the health endpoint to confirm readiness.
		try {
			await this.withTimeout(
				this.fetchImpl(`${this.getBaseUrl(device)}/reset`, {
					method: 'POST',
					headers: this.buildHeaders(device.deviceId, token),
				}),
				PRE_UPLOAD_RESET_HEALTH_TIMEOUT_MS,
				'timeout',
			);
		} catch {
			// Reset call can fail or hang (device drops off immediately on reboot);
			// continue to poll health regardless.
		}

		const recoveredHealth = await this.waitForAgentHealth(
			device,
			token,
			PRE_UPLOAD_RESET_RECOVERY_TIMEOUT_MS,
			PRE_UPLOAD_RESET_RETRY_INTERVAL_MS,
			PRE_UPLOAD_RESET_INITIAL_DELAY_MS,
			PRE_UPLOAD_RESET_HEALTH_TIMEOUT_MS,
		);
		if (!recoveredHealth) {
			log('CyberBrick OTA upload window did not recover in time for retry', 'warn', {
				deviceId: device.deviceId,
				timeoutMs: PRE_UPLOAD_RESET_RECOVERY_TIMEOUT_MS,
			});
		}
		return recoveredHealth;
	}

	private async uploadProgram(
		device: PairedCyberBrickDevice,
		token: string,
		codeBytes: Buffer,
		contentSha256: string,
		operationId: string,
		timeoutMs: number,
	): Promise<CyberBrickHttpResponse> {
		// Convert Buffer to Uint8Array for cross-platform fetch compatibility
		// (macOS VS Code Extension Host fetch doesn't support Node.js Buffer)
		const bodyBytes = new Uint8Array(codeBytes);
		return await this.withTimeout(
			this.fetchImpl(`${this.getBaseUrl(device)}/upload`, {
				method: 'POST',
				headers: this.buildHeaders(device.deviceId, token, {
					'Content-Type': 'application/octet-stream',
					// Content-Length is automatically set by fetch implementation
					'X-Singular-Content-Sha256': contentSha256,
					'X-Singular-Operation-Id': operationId,
				}),
				body: bodyBytes,
			}),
			timeoutMs,
			'upload-timeout',
		);
	}

	private shouldRetryUploadWithFreshWindow(errorCode?: string, responseStatus?: number): boolean {
		if (typeof responseStatus === 'number') {
			return responseStatus >= 500;
		}

		return errorCode === 'upload-timeout'
			|| errorCode === 'timeout'
			|| errorCode === 'network-error'
			|| errorCode === 'ECONNREFUSED'
			|| errorCode === 'ENETUNREACH'
			|| errorCode === 'ECONNRESET'
			|| errorCode === 'ETIMEDOUT';
	}

	/**
	 * Polls `GET /api/v1/health` until the agent responds or the timeout elapses.
	 * ECONNREFUSED is treated as an expected "still rebooting" condition.
	 */
	async waitForAgentReady(device: PairedCyberBrickDevice, token: string, timeoutMs = 30000, intervalMs = 1000): Promise<boolean> {
		return Boolean(await this.waitForAgentHealth(device, token, timeoutMs, intervalMs));
	}

	/**
	 * Uploads a new OTA agent over WiFi to the device.
	 * Never logs the body (contains device credentials).
	 */
	async upgradeAgentOverWifi(
		device: PairedCyberBrickDevice,
		token: string,
		agentConfig: CyberBrickOtaAgentConfig
	): Promise<'upgraded' | 'failed'> {
		const agentSource = buildCyberBrickOtaAgentSource(agentConfig);
		const agentBytes = Buffer.from(agentSource, 'utf8');
		const contentSha256 = crypto.createHash('sha256').update(agentBytes).digest('hex');
		log('upgradeAgentOverWifi: starting OTA agent upload', 'info', {
			deviceId: device.deviceId,
			bytes: agentBytes.length,
			targetVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
		});
		try {
			// Convert Buffer to Uint8Array for cross-platform fetch compatibility
			// (macOS VS Code Extension Host fetch doesn't support Node.js Buffer)
			const bodyBytes = new Uint8Array(agentBytes);
			const response = await this.withTimeout(
				this.fetchImpl(`${this.getBaseUrl(device)}/upload-agent`, {
					method: 'POST',
					headers: this.buildHeaders(device.deviceId, token, {
						'Content-Type': 'application/octet-stream',
						// Content-Length is automatically set by fetch implementation
						'X-Singular-Content-Sha256': contentSha256,
					}),
					body: bodyBytes,
				}),
				this.uploadTimeoutMs,
				'upload-timeout'
			);
			if (!response.ok) {
				let responseBody: string | undefined;
				try { responseBody = await response.text(); } catch { /* ignore */ }
				log('upgradeAgentOverWifi: upload-agent returned a non-OK response', 'warn', {
					status: response.status,
					deviceId: device.deviceId,
					body: responseBody,
				});
				const recoveredHealth = await this.waitForAgentHealth(device, token, this.postUpgradeRecoveryTimeoutMs, this.retryIntervalMs);
				if (recoveredHealth && compareAgentVersion(recoveredHealth.agentVersion, CYBERBRICK_OTA_AGENT_TARGET_VERSION) >= 0) {
					log('upgradeAgentOverWifi: recovered after non-OK response and observed upgraded agent', 'info', {
						deviceId: device.deviceId,
						liveAgentVersion: recoveredHealth.agentVersion ?? 'unknown',
					});
					return 'upgraded';
				}
				if (recoveredHealth) {
					log('upgradeAgentOverWifi: device recovered after non-OK response but target version was not observed', 'warn', {
						deviceId: device.deviceId,
						liveAgentVersion: recoveredHealth.agentVersion ?? 'unknown',
					});
				}
				return 'failed';
			}
			const readyHealth = await this.waitForAgentHealth(device, token, 30000, this.retryIntervalMs);
			if (readyHealth && compareAgentVersion(readyHealth.agentVersion, CYBERBRICK_OTA_AGENT_TARGET_VERSION) >= 0) {
				return 'upgraded';
			}
			if (readyHealth) {
				log('upgradeAgentOverWifi: device came back but target version was not observed', 'warn', {
					deviceId: device.deviceId,
					liveAgentVersion: readyHealth.agentVersion ?? 'unknown',
					targetVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
				});
			} else {
				log('upgradeAgentOverWifi: device did not report ready after agent upload attempt', 'warn', {
					deviceId: device.deviceId,
					targetVersion: CYBERBRICK_OTA_AGENT_TARGET_VERSION,
				});
			}
			return 'failed';
		} catch (error) {
			const recoveredHealth = await this.waitForAgentHealth(device, token, this.postUpgradeRecoveryTimeoutMs, this.retryIntervalMs);
			if (recoveredHealth && compareAgentVersion(recoveredHealth.agentVersion, CYBERBRICK_OTA_AGENT_TARGET_VERSION) >= 0) {
				log('upgradeAgentOverWifi: recovered after transport error and observed upgraded agent', 'info', {
					deviceId: device.deviceId,
					liveAgentVersion: recoveredHealth.agentVersion ?? 'unknown',
					errorCode: this.getErrorCode(error),
				});
				return 'upgraded';
			}
			log('upgradeAgentOverWifi: error', 'warn', {
				error: String(error),
				errorCode: this.getErrorCode(error),
				deviceId: device.deviceId,
				recoveredAgentVersion: recoveredHealth?.agentVersion ?? 'unknown',
			});
			return 'failed';
		}
	}

	private async tryRecoverFromUploadTimeout(
		run: OtaUploadRun,
		device: PairedCyberBrickDevice,
		token: string,
		startedAt: string,
		operationId: string,
		onProgress?: (run: OtaUploadRun) => void,
		agentVersion?: string
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
					...(agentVersion ? { agentVersion } : {}),
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
