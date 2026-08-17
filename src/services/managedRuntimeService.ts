/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os';
import * as path from 'path';
import { createHash, randomUUID } from 'crypto';
import { CoreEnvironment } from '../types/coreEnvironment';
import {
	ManagedRuntimeInstallRecord,
	ManagedRuntimeInstallStage,
	ManagedRuntimeProvisioningFailure,
	ManagedRuntimeProvisioningState,
	ManagedRuntimeProvisioningTrigger,
	ManagedRuntimeStatus,
	RuntimeArtifact,
	RuntimeManifest,
} from '../types/managedRuntime';
import {
	ManagedRuntimeInstaller,
	ManagedRuntimeInstallerError,
	ManagedRuntimeInstallProgress,
} from './managedRuntimeInstaller';
import { selectRuntimeArtifact } from './managedRuntimeManifest';
import { createWorkspaceStorageKey, ManagedRuntimeStorage } from './managedRuntimeStorage';
import { createPlatformioPrivacyRedactor, PlatformioPrivacyRedactor } from './platformioPrivacyRedactor';

interface RuntimeInstallerLike {
	install(
		artifact: RuntimeArtifact,
		options?: {
			signal?: AbortSignal;
			onProgress?: (progress: ManagedRuntimeInstallProgress) => void;
			adoptExisting?: () => Promise<ManagedRuntimeInstallRecord | null>;
		}
	): Promise<ManagedRuntimeInstallRecord>;
}

export interface ManagedRuntimeServiceOptions {
	storage: ManagedRuntimeStorage;
	manifest: RuntimeManifest;
	manifestSha256: string;
	installer?: RuntimeInstallerLike;
	platform?: NodeJS.Platform;
	arch?: string;
	libc?: string | null;
	allowReleaseCandidate?: boolean;
	now?: () => Date;
}

export class ManagedRuntimeServiceError extends Error {
	constructor(public readonly code: string, message: string) {
		super(message);
		this.name = 'ManagedRuntimeServiceError';
	}
}

function isSafeRelativePath(value: unknown): value is string {
	return typeof value === 'string' &&
		value.length > 0 &&
		!path.isAbsolute(value) &&
		!value.includes('\0') &&
		!value.split(/[\\/]+/).some(segment => segment === '..' || segment === '');
}

function parseInstallRecord(value: unknown): ManagedRuntimeInstallRecord | null {
	if (typeof value !== 'object' || value === null) {return null;}
	const record = value as Partial<ManagedRuntimeInstallRecord>;
	if (
		record.schemaVersion !== 1 ||
		typeof record.runtimeVersion !== 'string' ||
		typeof record.artifactId !== 'string' ||
		typeof record.manifestSha256 !== 'string' ||
		typeof record.installedAt !== 'string' ||
		!isSafeRelativePath(record.versionDirectory) ||
		record.versionDirectory.includes('/') ||
		record.versionDirectory.includes('\\') ||
		record.health?.status !== 'healthy' ||
		!record.tools
	) {
		return null;
	}
	for (const name of ['bootstrapPython', 'python', 'pip', 'pio', 'mpremote'] as const) {
		const tool = record.tools[name];
		if (!tool || !isSafeRelativePath(tool.relativePath) || typeof tool.version !== 'string') {return null;}
	}
	return record as ManagedRuntimeInstallRecord;
}

function detectLibc(platform: NodeJS.Platform): string | null {
	if (platform !== 'linux') {return null;}
	const report = process.report?.getReport();
	const header = report && typeof report !== 'string'
		? (report as { header?: { glibcVersionRuntime?: string } }).header
		: undefined;
	return header?.glibcVersionRuntime ? 'glibc' : 'musl';
}

export class ManagedRuntimeService {
	private readonly storage: ManagedRuntimeStorage;
	private readonly manifest: RuntimeManifest;
	private readonly manifestSha256: string;
	private readonly installer: RuntimeInstallerLike;
	private readonly platform: NodeJS.Platform;
	private readonly arch: string;
	private readonly libc: string | null;
	private readonly allowReleaseCandidate: boolean;
	private readonly now: () => Date;
	private readonly privacyRedactor: PlatformioPrivacyRedactor;
	private provisioningPromise?: Promise<ManagedRuntimeInstallRecord>;
	private provisioningState: ManagedRuntimeProvisioningState = { status: 'idle', attempt: 0 };

	constructor(options: ManagedRuntimeServiceOptions) {
		this.storage = options.storage;
		this.manifest = options.manifest;
		this.manifestSha256 = options.manifestSha256;
		this.installer = options.installer ?? new ManagedRuntimeInstaller({
			storage: options.storage,
			manifest: options.manifest,
			manifestSha256: options.manifestSha256,
		});
		this.platform = options.platform ?? process.platform;
		this.arch = options.arch ?? process.arch;
		this.libc = options.libc === undefined ? detectLibc(this.platform) : options.libc;
		this.allowReleaseCandidate = options.allowReleaseCandidate ?? false;
		this.now = options.now ?? (() => new Date());
		this.privacyRedactor = createPlatformioPrivacyRedactor({
			homeDir: os.homedir(),
			managedRuntimePath: options.storage.layout.root,
		});
	}

	async getStatus(): Promise<ManagedRuntimeStatus> {
		const artifact = this.getArtifact();
		if (!artifact) {
			return { status: 'unsupported', reason: 'No verified managed runtime is available for this platform and architecture' };
		}
		if (!this.storage.files.fileExists('current.json')) {return { status: 'missing' };}
		if (!await this.storage.isOwnedRoot()) {
			return { status: 'invalid', reason: 'The managed runtime storage ownership marker is missing or invalid' };
		}
		const raw = await this.storage.files.readFile('current.json');
		let record: ManagedRuntimeInstallRecord | null = null;
		try {
			record = parseInstallRecord(JSON.parse(raw));
		} catch {
			return { status: 'invalid', reason: 'The managed runtime install record is not valid JSON' };
		}
		if (!record) {return { status: 'invalid', reason: 'The managed runtime install record is invalid' };}
		if (
			record.runtimeVersion !== this.manifest.runtimeVersion ||
			record.artifactId !== artifact.id ||
			record.manifestSha256 !== this.manifestSha256
		) {
			return { status: 'invalid', reason: 'The installed runtime does not match the packaged manifest' };
		}
		for (const tool of Object.values(record.tools)) {
			const stats = await this.storage.files.getContainedFileStats(path.join('versions', record.versionDirectory, tool.relativePath));
			if (!stats?.isFile()) {
				return { status: 'invalid', reason: 'A managed runtime tool is missing' };
			}
		}
		return { status: 'ready', record };
	}

	async ensureReady(options: {
		signal?: AbortSignal;
		onProgress?: (progress: ManagedRuntimeInstallProgress) => void;
		trigger?: ManagedRuntimeProvisioningTrigger;
	} = {}): Promise<ManagedRuntimeInstallRecord> {
		return this.runSingleProvisioning(() => this.ensureReadyOnce(options));
	}

	async repair(options: {
		signal?: AbortSignal;
		onProgress?: (progress: ManagedRuntimeInstallProgress) => void;
	} = {}): Promise<ManagedRuntimeInstallRecord> {
		const activeProvisioning = this.provisioningPromise;
		if (activeProvisioning) {
			const attempt = this.provisioningState.attempt;
			if (this.provisioningState.status === 'running') {return activeProvisioning;}
			try {
				const record = await activeProvisioning;
				if (this.provisioningState.attempt > attempt) {return record;}
			} catch {
				// An explicit repair may retry after a background readiness check fails.
			}
		}
		return this.runSingleProvisioning(() => this.repairOnce(options));
	}

	getProvisioningState(): ManagedRuntimeProvisioningState {
		return this.provisioningState;
	}

	getStorageSummary(): string {
		const digest = createHash('sha256').update(this.storage.layout.root).digest('hex').slice(0, 12);
		return `<managed-storage:${digest}>`;
	}

	getStorageRoot(): string {
		return this.storage.layout.root;
	}

	async getStorageUsageBytes(): Promise<number | null> {
		if (!await this.storage.isOwnedRoot()) {return null;}
		return this.storage.files.calculateStorageUsage();
	}

	async cleanup(): Promise<{ downloads: number; staging: number; versions: number }> {
		await this.storage.initialize();
		const counts = { downloads: 0, staging: 0, versions: 0 };
		const releaseLock = await this.tryAcquireCleanupLock();
		if (!releaseLock) {
			throw new ManagedRuntimeServiceError('install-locked', 'Managed runtime installation is active');
		}
		try {
			const status = await this.getStatus();
			const activeVersion = status.status === 'ready' ? status.record.versionDirectory : null;

			const trustedHashes = new Set([
				this.manifest.installer.sha256,
				...this.manifest.artifacts.map(artifact => artifact.sha256),
			]);
			for (const name of await this.storage.files.listFiles('downloads')) {
				const match = name.match(/^([a-f0-9]{64})\.(?:tar\.gz|py)$/);
				if (!match || !trustedHashes.has(match[1])) {continue;}
				const stats = await this.storage.files.getFileStats(path.join('downloads', name));
				if (!stats?.isFile()) {continue;}
				await this.storage.files.deleteFile(path.join('downloads', name));
				counts.downloads++;
			}

			for (const name of await this.storage.files.listFiles('staging')) {
				if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(name)) {continue;}
				const relative = path.join('staging', name);
				const stats = await this.storage.files.getFileStats(relative);
				if (!stats?.isDirectory()) {continue;}
				const transaction = await this.storage.files.readJsonFile<{
					schemaVersion?: number;
					versionDirectory?: string;
					createdAt?: string;
				} | null>(path.join(relative, 'transaction.json'), null);
				if (
					transaction?.schemaVersion !== 1 ||
					typeof transaction.versionDirectory !== 'string' ||
					!/^[A-Za-z0-9._+-]+$/.test(transaction.versionDirectory) ||
					typeof transaction.createdAt !== 'string'
				) {continue;}
				if (transaction.versionDirectory !== activeVersion) {
					const candidateRelative = path.join('versions', transaction.versionDirectory);
					const candidateStats = await this.storage.files.getFileStats(candidateRelative);
					if (candidateStats?.isDirectory()) {
						await this.storage.files.deleteDirectory(candidateRelative);
						counts.versions++;
					}
				}
				await this.storage.files.deleteDirectory(relative);
				counts.staging++;
			}

			for (const name of await this.storage.files.listFiles('versions')) {
				if (name === activeVersion) {continue;}
				const relative = path.join('versions', name);
				const stats = await this.storage.files.getFileStats(relative);
				if (!stats?.isDirectory()) {continue;}
				const marker = await this.storage.files.readJsonFile<{
					schemaVersion?: number;
					runtimeVersion?: string;
					artifactId?: string;
				}>(path.join(relative, '.singular-runtime-owned.json'), {});
				if (
					marker.schemaVersion !== 1 ||
					typeof marker.runtimeVersion !== 'string' ||
					typeof marker.artifactId !== 'string'
				) {continue;}
				await this.storage.files.deleteDirectory(relative);
				counts.versions++;
			}
			return counts;
		} finally {
			await releaseLock();
		}
	}

	async getCoreEnvironment(workspaceUri: string): Promise<CoreEnvironment> {
		const record = await this.ensureReady();
		const versionRoot = this.storage.files.resolveSafePath(path.join('versions', record.versionDirectory));
		const pythonPath = await this.storage.files.resolveValidatedContainedPath(
			path.join('versions', record.versionDirectory, record.tools.python.relativePath)
		);
		const mpremotePath = await this.storage.files.resolveValidatedContainedPath(
			path.join('versions', record.versionDirectory, record.tools.mpremote.relativePath)
		);
		const workspaceRoot = path.join(this.storage.layout.workspaces, createWorkspaceStorageKey(workspaceUri));
		const environment: NodeJS.ProcessEnv = {
			...process.env,
			PYTHONUTF8: '1',
			PIP_DISABLE_PIP_VERSION_CHECK: '1',
			PLATFORMIO_CORE_DIR: path.join(versionRoot, 'core'),
			PLATFORMIO_CACHE_DIR: path.join(versionRoot, 'cache'),
			PLATFORMIO_WORKSPACE_DIR: workspaceRoot,
			PLATFORMIO_BUILD_DIR: path.join(workspaceRoot, 'build'),
			PLATFORMIO_LIBDEPS_DIR: path.join(workspaceRoot, 'libdeps'),
			PLATFORMIO_SETTING_ENABLE_TELEMETRY: 'No',
			PLATFORMIO_SETTING_ENABLE_PROMPTS: 'No',
			PLATFORMIO_NO_ANSI: 'true',
		};
		return {
			id: 'managed',
			displaySource: 'Singular managed runtime',
			invocation: { command: pythonPath, prefixArgs: ['-m', 'platformio'], env: environment, source: 'managed' },
			pythonPath,
			mpremotePath,
			storageRoot: this.storage.layout.root,
			health: {
				status: 'healthy',
				checkedAt: record.health.checkedAt,
				version: record.tools.pio.version,
				packageStatus: 'unknown',
				failureClass: null,
			},
		};
	}

	private async ensureReadyOnce(options: {
		signal?: AbortSignal;
		onProgress?: (progress: ManagedRuntimeInstallProgress) => void;
		trigger?: ManagedRuntimeProvisioningTrigger;
	}): Promise<ManagedRuntimeInstallRecord> {
		const status = await this.getStatus();
		if (status.status === 'ready') {
			this.provisioningState = { status: 'idle', attempt: this.provisioningState.attempt };
			return status.record;
		}
		const artifact = this.getArtifact();
		if (!artifact) {
			const reason = status.status === 'missing' ? 'Managed runtime is unsupported' : status.reason;
			throw new ManagedRuntimeServiceError('unsupported-runtime', reason);
		}
		return this.runProvisioning(artifact, options.trigger ?? 'workload', options);
	}

	private async repairOnce(options: {
		signal?: AbortSignal;
		onProgress?: (progress: ManagedRuntimeInstallProgress) => void;
	}): Promise<ManagedRuntimeInstallRecord> {
		const artifact = this.getArtifact();
		if (!artifact) {
			throw new ManagedRuntimeServiceError('unsupported-runtime', 'No verified managed runtime is available for this platform');
		}
		return this.runProvisioning(artifact, 'repair', options);
	}

	private runSingleProvisioning(
		operation: () => Promise<ManagedRuntimeInstallRecord>
	): Promise<ManagedRuntimeInstallRecord> {
		if (this.provisioningPromise) {return this.provisioningPromise;}
		this.provisioningPromise = operation().finally(() => {this.provisioningPromise = undefined;});
		return this.provisioningPromise;
	}

	private async runProvisioning(
		artifact: RuntimeArtifact,
		trigger: ManagedRuntimeProvisioningTrigger,
		options: { signal?: AbortSignal; onProgress?: (progress: ManagedRuntimeInstallProgress) => void }
	): Promise<ManagedRuntimeInstallRecord> {
		const attempt = this.provisioningState.attempt + 1;
		const startedAt = this.now().toISOString();
		let stage: ManagedRuntimeInstallStage = 'waiting-lock';
		let percent = 0;
		this.provisioningState = { status: 'running', attempt, trigger, stage, percent, startedAt, updatedAt: startedAt };
		try {
			await this.storage.initialize();
			const record = await this.installer.install(artifact, {
				signal: options.signal,
				adoptExisting: async () => {
					const current = await this.getStatus();
					return current.status === 'ready' ? current.record : null;
				},
				onProgress: progress => {
					stage = progress.stage;
					percent = progress.percent;
					this.provisioningState = {
						status: 'running', attempt, trigger, stage, percent, startedAt, updatedAt: this.now().toISOString(),
					};
					options.onProgress?.(progress);
				},
			});
			this.provisioningState = { status: 'idle', attempt };
			return record;
		} catch (error) {
			if (error instanceof ManagedRuntimeInstallerError && error.code === 'install-locked') {
				const current = await this.getStatus();
				if (current.status === 'ready') {
					this.provisioningState = { status: 'idle', attempt };
					return current.record;
				}
			}
			const failure = this.createProvisioningFailure(error, stage);
			this.provisioningState = {
				status: 'failed', attempt, trigger, stage: failure.stage, percent, startedAt,
				failedAt: this.now().toISOString(), failure,
			};
			if (error instanceof ManagedRuntimeInstallerError) {throw error;}
			throw new ManagedRuntimeInstallerError(failure.code, failure.message, failure);
		}
	}

	private createProvisioningFailure(
		error: unknown,
		stage: ManagedRuntimeInstallStage
	): ManagedRuntimeProvisioningFailure {
		const installerError = error instanceof ManagedRuntimeInstallerError ? error : undefined;
		const candidate = error && typeof error === 'object' ? error as NodeJS.ErrnoException : undefined;
		return {
			failureDomain: 'managed-provisioning',
			stage: installerError?.stage ?? stage,
			code: String(installerError?.code ?? candidate?.code ?? 'installation-failed').toLowerCase(),
			started: installerError?.started ?? false,
			message: this.sanitizeProvisioningEvidence(error instanceof Error ? error.message : String(error)),
			stdout: this.sanitizeProvisioningEvidence(installerError?.stdout ?? ''),
			stderr: this.sanitizeProvisioningEvidence(installerError?.stderr ?? ''),
		};
	}

	private sanitizeProvisioningEvidence(value: string): string {
		const redacted = this.privacyRedactor.redact(value)
			.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
			.trim();
		return redacted.length <= 4000 ? redacted : `[truncated]\n${redacted.slice(-4000)}`;
	}

	private getArtifact(): RuntimeArtifact | null {
		return selectRuntimeArtifact(this.manifest, this.platform, this.arch, {
			libc: this.libc,
			allowReleaseCandidate: this.allowReleaseCandidate,
		});
	}

	private async tryAcquireCleanupLock(): Promise<(() => Promise<void>) | null> {
		const ownerId = `cleanup-${randomUUID()}`;
		const relativePath = path.join('locks', 'install.lock');
		const leaseUntil = (): string => new Date(Date.now() + 120_000).toISOString();
		const createdAt = new Date().toISOString();
		const lockRecord = () => ({
			schemaVersion: 1,
			ownerId,
			pid: process.pid,
			createdAt,
			leaseUntil: leaseUntil(),
		});
		const created = await this.storage.files.createExclusiveFile(relativePath, JSON.stringify(lockRecord()));
		if (!created) {return null;}

		let pendingRenewal = Promise.resolve();
		const renewal = setInterval(() => {
			pendingRenewal = pendingRenewal
				.then(async () => {
					const current = await this.readCleanupLock(relativePath);
					if (current?.ownerId === ownerId) {
						await this.storage.files.writeFileAtomic(relativePath, JSON.stringify(lockRecord()));
					}
				})
				.catch(() => undefined);
		}, 30_000);
		renewal.unref();

		return async () => {
			clearInterval(renewal);
			await pendingRenewal;
			const current = await this.readCleanupLock(relativePath);
			if (current?.ownerId === ownerId) {
				await this.storage.files.deleteFile(relativePath);
			}
		};
	}

	private async readCleanupLock(relativePath: string): Promise<{ ownerId: string } | null> {
		const raw = await this.storage.files.readFile(relativePath);
		if (!raw) {return null;}
		try {
			const value = JSON.parse(raw) as { ownerId?: unknown };
			return typeof value.ownerId === 'string' ? { ownerId: value.ownerId } : null;
		} catch {
			return null;
		}
	}
}
