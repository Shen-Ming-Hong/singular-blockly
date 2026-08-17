/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { ManagedRuntimeDownloader, ManagedRuntimeDownloadResult } from './managedRuntimeDownloader';
import { extractManagedRuntimeArchive } from './managedRuntimeArchive';
import { ManagedRuntimeStorage } from './managedRuntimeStorage';
import {
	PlatformioProcessError,
	PlatformioProcessOptions,
	PlatformioProcessResult,
	runPlatformioProcess,
} from './platformioProcess';
import { createPlatformioPrivacyRedactor, PlatformioPrivacyRedactor } from './platformioPrivacyRedactor';
import { sha256 } from './managedRuntimeManifest';
import {
	ManagedRuntimeInstallStage,
	ManagedRuntimeInstallRecord,
	RuntimeArtifact,
	RuntimeDownload,
	RuntimeManifest,
} from '../types/managedRuntime';

interface RuntimeDownloaderLike {
	download(
		download: RuntimeDownload,
		destinationRelativePath: string,
		options?: { signal?: AbortSignal; onProgress?: (received: number, total: number) => void }
	): Promise<ManagedRuntimeDownloadResult>;
}

export interface ManagedRuntimeInstallerOptions {
	storage: ManagedRuntimeStorage;
	manifest: RuntimeManifest;
	manifestSha256: string;
	downloader?: RuntimeDownloaderLike;
	extractArchive?: typeof extractManagedRuntimeArchive;
	runProcess?: (command: string, args: readonly string[], options: PlatformioProcessOptions) => Promise<PlatformioProcessResult>;
	now?: () => Date;
	createId?: () => string;
	lockWaitMs?: number;
}

export interface ManagedRuntimeInstallProgress {
	stage: ManagedRuntimeInstallStage;
	percent: number;
}

export class ManagedRuntimeInstallerError extends Error {
	readonly failureDomain = 'managed-provisioning' as const;
	readonly stage: ManagedRuntimeInstallStage;
	readonly started: boolean;
	readonly stdout: string;
	readonly stderr: string;

	constructor(
		public readonly code: string,
		message: string,
		evidence: {
			stage?: ManagedRuntimeInstallStage;
			started?: boolean;
			stdout?: string;
			stderr?: string;
		} = {}
	) {
		super(message);
		this.name = 'ManagedRuntimeInstallerError';
		this.stage = evidence.stage ?? 'waiting-lock';
		this.started = evidence.started ?? false;
		this.stdout = evidence.stdout ?? '';
		this.stderr = evidence.stderr ?? '';
	}
}

interface InstallLockRecord {
	schemaVersion: 1;
	ownerId: string;
	pid: number;
	createdAt: string;
	leaseUntil: string;
}

const LOCK_RELATIVE_PATH = path.join('locks', 'install.lock');
const LOCK_RECLAIM_RELATIVE_PATH = path.join('locks', 'install.reclaim.lock');
const LOCK_LEASE_MS = 120_000;
const LOCK_RENEW_MS = 30_000;
const LOCK_RECLAIM_LEASE_MS = 30_000;
const MAX_DIAGNOSTIC_OUTPUT_LENGTH = 4000;

function executableName(name: 'python' | 'pip' | 'pio' | 'mpremote', platform: NodeJS.Platform): string {
	return platform === 'win32' ? `${name}.exe` : name;
}

function executableRelativePath(name: 'python' | 'pip' | 'pio' | 'mpremote', platform: NodeJS.Platform): string {
	return path.join('core', 'penv', platform === 'win32' ? 'Scripts' : 'bin', executableName(name, platform));
}

function versionText(result: PlatformioProcessResult): string {
	return [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join(' | ').slice(0, 500);
}

function compareVersions(left: readonly number[], right: readonly number[]): number {
	for (let index = 0; index < 3; index++) {
		if (left[index] !== right[index]) {return left[index] - right[index];}
	}
	return 0;
}

function assertTestedPlatformioVersion(output: string, testedRange: string): void {
	const versionMatch = output.match(/\b(\d+)\.(\d+)\.(\d+)\b/);
	const rangeMatch = testedRange.match(/^>=(\d+)\.(\d+)\.(\d+) <(\d+)\.(\d+)\.(\d+)$/);
	if (!versionMatch || !rangeMatch) {
		throw new ManagedRuntimeInstallerError('platformio-version-invalid', 'PlatformIO did not report a verifiable supported version');
	}
	const version = versionMatch.slice(1, 4).map(Number);
	const minimum = rangeMatch.slice(1, 4).map(Number);
	const maximum = rangeMatch.slice(4, 7).map(Number);
	if (compareVersions(version, minimum) < 0 || compareVersions(version, maximum) >= 0) {
		throw new ManagedRuntimeInstallerError('platformio-version-unsupported', 'Installed PlatformIO is outside the packaged tested version range');
	}
}

function platformioConstraint(testedRange: string): string {
	const match = testedRange.match(/^>=(\d+\.\d+\.\d+) <(\d+\.\d+\.\d+)$/);
	if (!match) {
		throw new ManagedRuntimeInstallerError('platformio-range-invalid', 'Packaged PlatformIO version bounds are invalid');
	}
	return `platformio>=${match[1]},<${match[2]}`;
}

export class ManagedRuntimeInstaller {
	private readonly storage: ManagedRuntimeStorage;
	private readonly manifest: RuntimeManifest;
	private readonly manifestSha256: string;
	private readonly downloader: RuntimeDownloaderLike;
	private readonly extractArchive: typeof extractManagedRuntimeArchive;
	private readonly runProcess: NonNullable<ManagedRuntimeInstallerOptions['runProcess']>;
	private readonly now: () => Date;
	private readonly createId: () => string;
	private readonly lockWaitMs: number;
	private readonly privacyRedactor: PlatformioPrivacyRedactor;

	constructor(options: ManagedRuntimeInstallerOptions) {
		this.storage = options.storage;
		this.manifest = options.manifest;
		this.manifestSha256 = options.manifestSha256;
		this.downloader = options.downloader ?? new ManagedRuntimeDownloader(options.storage.files);
		this.extractArchive = options.extractArchive ?? extractManagedRuntimeArchive;
		this.runProcess = options.runProcess ?? runPlatformioProcess;
		this.now = options.now ?? (() => new Date());
		this.createId = options.createId ?? (() => crypto.randomUUID());
		this.lockWaitMs = options.lockWaitMs ?? 60_000;
		this.privacyRedactor = createPlatformioPrivacyRedactor({
			homeDir: os.homedir(),
			managedRuntimePath: options.storage.layout.root,
		});
	}

	async install(
		artifact: RuntimeArtifact,
		options: { signal?: AbortSignal; onProgress?: (progress: ManagedRuntimeInstallProgress) => void } = {}
	): Promise<ManagedRuntimeInstallRecord> {
		let currentStage: ManagedRuntimeInstallStage = 'waiting-lock';
		const reportProgress = (stage: ManagedRuntimeInstallStage, percent: number): void => {
			currentStage = stage;
			options.onProgress?.({ stage, percent });
		};
		reportProgress('waiting-lock', 0);
		const transactionId = this.createId();
		const transactionRelative = path.join('staging', transactionId);
		const versionDirectory = transactionId;
		const runtimeRelative = path.join('versions', versionDirectory);
		let candidateCreated = false;
		let currentCommitted = false;
		let releaseLock: (() => Promise<void>) | undefined;
		try {
			releaseLock = await this.acquireLock(options.signal);
			if (options.signal?.aborted) {
				throw new ManagedRuntimeInstallerError('cancelled', 'Managed runtime installation was cancelled');
			}
			await this.storage.files.createDirectory(transactionRelative);
			await this.storage.files.writeFileAtomic(path.join(transactionRelative, 'transaction.json'), JSON.stringify({
				schemaVersion: 1,
				versionDirectory,
				createdAt: this.now().toISOString(),
			}));

			reportProgress('downloading-python', 5);
			const archiveRelative = await this.ensureDownload(artifact, 'tar.gz', options.signal);
			const installerRelative = await this.ensureDownload(this.manifest.installer, 'py', options.signal);

			reportProgress('extracting-python', 25);
			const archivePath = this.storage.files.resolveSafePath(archiveRelative);
			const runtimePath = this.storage.files.resolveSafePath(runtimeRelative);
			await this.extractArchive(archivePath, runtimePath);
			candidateCreated = true;
			const bootstrapPython = path.join(runtimePath, ...artifact.pythonRelativePath.split('/'));
			if (!this.storage.files.fileExists(path.join(runtimeRelative, ...artifact.pythonRelativePath.split('/')))) {
				throw new ManagedRuntimeInstallerError('python-missing', 'Downloaded runtime did not contain the declared Python executable');
			}

			const coreRoot = path.join(runtimePath, 'core');
			const installerTempRelative = path.join(runtimeRelative, 'installer-tmp');
			const constraintRelative = path.join(runtimeRelative, 'platformio-constraints.txt');
			await this.storage.files.createDirectory(installerTempRelative);
			await this.storage.files.writeFileAtomic(
				constraintRelative,
				`${platformioConstraint(this.manifest.platformio.testedVersionRange)}\n`
			);
			const runtimeEnvironment: NodeJS.ProcessEnv = {
				...process.env,
				PYTHONUTF8: '1',
				PIP_DISABLE_PIP_VERSION_CHECK: '1',
				// pip splits repeatable environment options on whitespace. A percent-encoded
				// local file URL preserves spaces, Unicode, and Windows path separators.
				PIP_CONSTRAINT: pathToFileURL(this.storage.files.resolveSafePath(constraintRelative)).href,
				PLATFORMIO_CORE_DIR: coreRoot,
				PLATFORMIO_INSTALLER_TMPDIR: this.storage.files.resolveSafePath(installerTempRelative),
				PLATFORMIO_SETTING_ENABLE_TELEMETRY: 'No',
				PLATFORMIO_SETTING_ENABLE_PROMPTS: 'No',
				PLATFORMIO_NO_ANSI: 'true',
			};

			reportProgress('installing-platformio', 40);
			await this.runProcess(
				bootstrapPython,
				[this.storage.files.resolveSafePath(installerRelative)],
				{ env: runtimeEnvironment, cwd: runtimePath, timeout: 15 * 60_000, signal: options.signal }
			);

			const platform = artifact.platform as NodeJS.Platform;
			const penvPythonRelative = path.join(runtimeRelative, executableRelativePath('python', platform));
			const penvPython = this.storage.files.resolveSafePath(penvPythonRelative);
			if (!this.storage.files.fileExists(penvPythonRelative)) {
				throw new ManagedRuntimeInstallerError('platformio-python-missing', 'PlatformIO installer did not create its managed Python environment');
			}

			reportProgress('installing-mpremote', 65);
			await this.runProcess(
				penvPython,
				['-m', 'pip', 'install', '--disable-pip-version-check', '--no-input', `mpremote==${this.manifest.mpremoteVersion}`],
				{ env: runtimeEnvironment, cwd: runtimePath, timeout: 10 * 60_000, signal: options.signal }
			);

			reportProgress('verifying', 80);
			const probeOptions = { env: runtimeEnvironment, cwd: runtimePath, timeout: 30_000, signal: options.signal };
			const bootstrapProbe = await this.runProcess(bootstrapPython, ['--version'], probeOptions);
			const pythonProbe = await this.runProcess(penvPython, ['--version'], probeOptions);
			const pipProbe = await this.runProcess(penvPython, ['-m', 'pip', '--version'], probeOptions);
			const pioProbe = await this.runProcess(penvPython, ['-m', 'platformio', '--version'], probeOptions);
			assertTestedPlatformioVersion(versionText(pioProbe), this.manifest.platformio.testedVersionRange);
			await this.runProcess(penvPython, ['-m', 'platformio', 'system', 'info', '--json-output'], probeOptions);
			const mpremoteProbe = await this.runProcess(penvPython, ['-m', 'mpremote', 'version'], probeOptions);

			reportProgress('committing', 95);
			await this.storage.files.writeFileAtomic(path.join(runtimeRelative, '.singular-runtime-owned.json'), JSON.stringify({
				schemaVersion: 1,
				runtimeVersion: this.manifest.runtimeVersion,
				artifactId: artifact.id,
			}));
			const record: ManagedRuntimeInstallRecord = {
				schemaVersion: 1,
				runtimeVersion: this.manifest.runtimeVersion,
				artifactId: artifact.id,
				manifestSha256: this.manifestSha256,
				installedAt: this.now().toISOString(),
				versionDirectory,
				tools: {
					bootstrapPython: { relativePath: artifact.pythonRelativePath, version: versionText(bootstrapProbe) },
					python: { relativePath: executableRelativePath('python', platform), version: versionText(pythonProbe) },
					pip: { relativePath: executableRelativePath('pip', platform), version: versionText(pipProbe) },
					pio: { relativePath: executableRelativePath('pio', platform), version: versionText(pioProbe) },
					mpremote: { relativePath: executableRelativePath('mpremote', platform), version: versionText(mpremoteProbe) },
				},
				health: { status: 'healthy', checkedAt: this.now().toISOString() },
			};
			await this.storage.files.writeFileAtomic('current.json', `${JSON.stringify(record, null, 2)}\n`);
			currentCommitted = true;
			await this.storage.files.deleteDirectory(transactionRelative).catch(() => undefined);
			reportProgress('committing', 100);
			return record;
		} catch (error) {
			if (!currentCommitted && candidateCreated && this.storage.files.fileExists(runtimeRelative)) {
				await this.storage.files.deleteDirectory(runtimeRelative).catch(() => undefined);
			}
			if (this.storage.files.fileExists(transactionRelative)) {
				await this.storage.files.deleteDirectory(transactionRelative).catch(() => undefined);
			}
			throw this.toInstallerError(error, currentStage);
		} finally {
			await releaseLock?.().catch(() => undefined);
		}
	}

	private toInstallerError(error: unknown, stage: ManagedRuntimeInstallStage): ManagedRuntimeInstallerError {
		const processError = error instanceof PlatformioProcessError ? error : undefined;
		const installerError = error instanceof ManagedRuntimeInstallerError ? error : undefined;
		const candidate = error && typeof error === 'object' ? error as NodeJS.ErrnoException : undefined;
		const code = installerError?.code ?? processError?.code ?? candidate?.code ?? 'installation-failed';
		const message = error instanceof Error ? error.message : 'Managed runtime installation did not complete';
		return new ManagedRuntimeInstallerError(String(code).toLowerCase(), this.sanitizeDiagnosticOutput(message), {
			stage,
			started: processError?.started ?? installerError?.started ?? false,
			stdout: this.sanitizeDiagnosticOutput(processError?.stdout ?? installerError?.stdout ?? ''),
			stderr: this.sanitizeDiagnosticOutput(processError?.stderr ?? installerError?.stderr ?? ''),
		});
	}

	private sanitizeDiagnosticOutput(value: string): string {
		const withoutControlCharacters = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
		const redacted = this.privacyRedactor.redact(withoutControlCharacters).trim();
		if (redacted.length <= MAX_DIAGNOSTIC_OUTPUT_LENGTH) {return redacted;}
		return `[truncated]\n${redacted.slice(-MAX_DIAGNOSTIC_OUTPUT_LENGTH)}`;
	}

	private async ensureDownload(download: RuntimeDownload, extension: string, signal?: AbortSignal): Promise<string> {
		const relativePath = path.join('downloads', `${download.sha256}.${extension}`);
		if (this.storage.files.fileExists(relativePath)) {
			const bytes = await this.storage.files.readBuffer(relativePath);
			if (bytes.length === download.size && sha256(bytes) === download.sha256) {
				return relativePath;
			}
			await this.storage.files.deleteFile(relativePath);
		}
		await this.downloader.download(download, relativePath, { signal });
		return relativePath;
	}

	private async acquireLock(signal?: AbortSignal): Promise<() => Promise<void>> {
		const ownerId = this.createId();
		const startedAt = Date.now();
		while (true) {
			if (signal?.aborted) {
				throw new ManagedRuntimeInstallerError('cancelled', 'Managed runtime installation was cancelled');
			}
			const lock: InstallLockRecord = {
				schemaVersion: 1,
				ownerId,
				pid: process.pid,
				createdAt: this.now().toISOString(),
				leaseUntil: new Date(this.now().getTime() + LOCK_LEASE_MS).toISOString(),
			};
			if (
				!this.storage.files.fileExists(LOCK_RECLAIM_RELATIVE_PATH) &&
				await this.storage.files.createExclusiveFile(LOCK_RELATIVE_PATH, JSON.stringify(lock))
			) {
				let pendingRenewal = Promise.resolve();
				const renewal = setInterval(() => {
					pendingRenewal = pendingRenewal.then(() => this.renewLock(ownerId)).catch(() => undefined);
				}, LOCK_RENEW_MS);
				renewal.unref();
				return async () => {
					clearInterval(renewal);
					await pendingRenewal;
					const current = await this.readLock();
					if (current?.ownerId === ownerId) {
						await this.storage.files.deleteFile(LOCK_RELATIVE_PATH);
					}
				};
			}
			const current = await this.readLock();
			if (!current || (
				Date.parse(current.leaseUntil) <= this.now().getTime() &&
				!this.isProcessAlive(current.pid)
			)) {
				const releaseReclaim = await this.tryAcquireReclaimGuard(ownerId);
				if (releaseReclaim) {
					try {
						const latest = await this.readLock();
						if (
							(!latest || latest.ownerId === current?.ownerId) &&
							(!latest || (
								Date.parse(latest.leaseUntil) <= this.now().getTime() &&
								!this.isProcessAlive(latest.pid)
							))
						) {
							await this.storage.files.deleteFile(LOCK_RELATIVE_PATH);
						}
					} finally {
						await releaseReclaim();
					}
					continue;
				}
			}
			if (Date.now() - startedAt >= this.lockWaitMs) {
				throw new ManagedRuntimeInstallerError('install-locked', 'Another editor window is preparing the managed runtime');
			}
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}

	private async tryAcquireReclaimGuard(ownerId: string): Promise<(() => Promise<void>) | null> {
		const createGuard = (): Promise<boolean> => {
			const createdAt = this.now();
			const guard: InstallLockRecord = {
				schemaVersion: 1,
				ownerId,
				pid: process.pid,
				createdAt: createdAt.toISOString(),
				leaseUntil: new Date(createdAt.getTime() + LOCK_RECLAIM_LEASE_MS).toISOString(),
			};
			return this.storage.files.createExclusiveFile(LOCK_RECLAIM_RELATIVE_PATH, JSON.stringify(guard));
		};

		if (!await createGuard()) {
			const existing = await this.readReclaimGuard();
			if (
				!existing ||
				Date.parse(existing.leaseUntil) > this.now().getTime() ||
				this.isProcessAlive(existing.pid)
			) {return null;}
			const latest = await this.readReclaimGuard();
			if (latest?.ownerId !== existing.ownerId) {return null;}
			await this.storage.files.deleteFile(LOCK_RECLAIM_RELATIVE_PATH);
			if (!await createGuard()) {return null;}
		}
		return async () => {
			const current = await this.readReclaimGuard();
			if (current?.ownerId === ownerId) {
				await this.storage.files.deleteFile(LOCK_RECLAIM_RELATIVE_PATH);
			}
		};
	}

	private async readReclaimGuard(): Promise<InstallLockRecord | null> {
		const raw = await this.storage.files.readFile(LOCK_RECLAIM_RELATIVE_PATH);
		if (!raw) {return null;}
		try {
			const value = JSON.parse(raw) as Partial<InstallLockRecord>;
			return value.schemaVersion === 1 &&
				typeof value.ownerId === 'string' &&
				typeof value.pid === 'number' &&
				typeof value.createdAt === 'string' &&
				typeof value.leaseUntil === 'string'
				? value as InstallLockRecord
				: null;
		} catch {
			return null;
		}
	}

	private isProcessAlive(pid: number): boolean {
		if (!Number.isInteger(pid) || pid <= 0) {return false;}
		try {
			process.kill(pid, 0);
			return true;
		} catch (error) {
			return (error as NodeJS.ErrnoException).code !== 'ESRCH';
		}
	}

	private async readLock(): Promise<InstallLockRecord | null> {
		const raw = await this.storage.files.readFile(LOCK_RELATIVE_PATH);
		if (!raw) {return null;}
		try {
			const value = JSON.parse(raw) as Partial<InstallLockRecord>;
			return value.schemaVersion === 1 &&
				typeof value.ownerId === 'string' &&
				typeof value.pid === 'number' &&
				typeof value.createdAt === 'string' &&
				typeof value.leaseUntil === 'string'
				? {
					schemaVersion: 1,
					ownerId: value.ownerId,
					pid: value.pid,
					createdAt: value.createdAt,
					leaseUntil: value.leaseUntil,
				}
				: null;
		} catch {
			return null;
		}
	}

	private async renewLock(ownerId: string): Promise<void> {
		const current = await this.readLock();
		if (current?.ownerId !== ownerId) {return;}
		await this.storage.files.writeFileAtomic(LOCK_RELATIVE_PATH, JSON.stringify({
			...current,
			leaseUntil: new Date(this.now().getTime() + LOCK_LEASE_MS).toISOString(),
		} satisfies InstallLockRecord));
	}
}
