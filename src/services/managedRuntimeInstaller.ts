/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import { pathToFileURL } from 'url';
import { ManagedRuntimeDownloader, ManagedRuntimeDownloadResult } from './managedRuntimeDownloader';
import { extractManagedRuntimeArchive } from './managedRuntimeArchive';
import { ManagedRuntimeStorage } from './managedRuntimeStorage';
import { PlatformioProcessOptions, PlatformioProcessResult, runPlatformioProcess } from './platformioProcess';
import { sha256 } from './managedRuntimeManifest';
import {
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
	stage: 'waiting-lock' | 'downloading-python' | 'extracting-python' | 'installing-platformio' | 'installing-mpremote' | 'verifying' | 'committing';
	percent: number;
}

export class ManagedRuntimeInstallerError extends Error {
	constructor(public readonly code: string, message: string) {
		super(message);
		this.name = 'ManagedRuntimeInstallerError';
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
	}

	async install(
		artifact: RuntimeArtifact,
		options: { signal?: AbortSignal; onProgress?: (progress: ManagedRuntimeInstallProgress) => void } = {}
	): Promise<ManagedRuntimeInstallRecord> {
		options.onProgress?.({ stage: 'waiting-lock', percent: 0 });
		const releaseLock = await this.acquireLock(options.signal);
		const transactionId = this.createId();
		const transactionRelative = path.join('staging', transactionId);
		const versionDirectory = `${this.manifest.runtimeVersion}-${artifact.id}-${transactionId}`;
		const runtimeRelative = path.join('versions', versionDirectory);
		let candidateCreated = false;
		let currentCommitted = false;
		try {
			if (options.signal?.aborted) {
				throw new ManagedRuntimeInstallerError('cancelled', 'Managed runtime installation was cancelled');
			}
			await this.storage.files.createDirectory(transactionRelative);
			await this.storage.files.writeFileAtomic(path.join(transactionRelative, 'transaction.json'), JSON.stringify({
				schemaVersion: 1,
				versionDirectory,
				createdAt: this.now().toISOString(),
			}));

			options.onProgress?.({ stage: 'downloading-python', percent: 5 });
			const archiveRelative = await this.ensureDownload(artifact, 'tar.gz', options.signal);
			const installerRelative = await this.ensureDownload(this.manifest.installer, 'py', options.signal);

			options.onProgress?.({ stage: 'extracting-python', percent: 25 });
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

			options.onProgress?.({ stage: 'installing-platformio', percent: 40 });
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

			options.onProgress?.({ stage: 'installing-mpremote', percent: 65 });
			await this.runProcess(
				penvPython,
				['-m', 'pip', 'install', '--disable-pip-version-check', '--no-input', `mpremote==${this.manifest.mpremoteVersion}`],
				{ env: runtimeEnvironment, cwd: runtimePath, timeout: 10 * 60_000, signal: options.signal }
			);

			options.onProgress?.({ stage: 'verifying', percent: 80 });
			const probeOptions = { env: runtimeEnvironment, cwd: runtimePath, timeout: 30_000, signal: options.signal };
			const bootstrapProbe = await this.runProcess(bootstrapPython, ['--version'], probeOptions);
			const pythonProbe = await this.runProcess(penvPython, ['--version'], probeOptions);
			const pipProbe = await this.runProcess(penvPython, ['-m', 'pip', '--version'], probeOptions);
			const pioProbe = await this.runProcess(penvPython, ['-m', 'platformio', '--version'], probeOptions);
			assertTestedPlatformioVersion(versionText(pioProbe), this.manifest.platformio.testedVersionRange);
			await this.runProcess(penvPython, ['-m', 'platformio', 'system', 'info', '--json-output'], probeOptions);
			const mpremoteProbe = await this.runProcess(penvPython, ['-m', 'mpremote', 'version'], probeOptions);

			options.onProgress?.({ stage: 'committing', percent: 95 });
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
			options.onProgress?.({ stage: 'committing', percent: 100 });
			return record;
		} catch (error) {
			if (!currentCommitted && candidateCreated && this.storage.files.fileExists(runtimeRelative)) {
				await this.storage.files.deleteDirectory(runtimeRelative).catch(() => undefined);
			}
			if (this.storage.files.fileExists(transactionRelative)) {
				await this.storage.files.deleteDirectory(transactionRelative).catch(() => undefined);
			}
			if (error instanceof ManagedRuntimeInstallerError) {throw error;}
			const code = (error as NodeJS.ErrnoException).code || 'installation-failed';
			throw new ManagedRuntimeInstallerError(String(code).toLowerCase(), 'Managed runtime installation did not complete');
		} finally {
			await releaseLock().catch(() => undefined);
		}
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
