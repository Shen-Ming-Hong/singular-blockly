/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFile } from 'child_process';
import { createHash, randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { log } from './logging';
import type { ManagedRuntimeStorage } from './managedRuntimeStorage';
import type { PlatformioWorkRootKind, PlatformioWorkRootRecord } from '../types/managedRuntime';

/**
 * Windows short PlatformIO work root for Singular Core (spec 074).
 *
 * PlatformIO packages such as framework-arduinoespressif32 contain files
 * whose relative paths exceed 140 characters. Under the default VS Code
 * global storage those files cross the classic Win32 260-character limit,
 * so on Windows the Arduino workload keeps packages, platforms, cache, and
 * project build folders in a short, ASCII-only, user-owned location.
 */

export const WINDOWS_MAX_PATH = 260;
/** Measured deepest package descendant (144) plus headroom; see research R1. */
export const WORK_ROOT_PACKAGE_DESCENDANT_RESERVE = 160;
/** Deepest expected build/libdeps descendant; see research R2. */
export const WORK_ROOT_PROJECT_DESCENDANT_RESERVE = 120;
export const WORK_ROOT_PROJECT_KEY_LENGTH = 16;

const RECORD_RELATIVE_PATH = 'work-root.json';
const LOCK_RELATIVE_PATH = path.join('locks', 'work-root.lock');
const LOCK_STALE_MS = 60_000;
const LOCK_WAIT_MS = 15_000;
const LOCK_POLL_MS = 200;
const MARKER_FILE = '.singular-pio-work-root.json';
const MARKER_OWNER = 'singular-blockly-pio-work-root';
const SYSTEM_DRIVE_PREFIX = 'SingularBlockly-';
const SYSTEM_DRIVE_SUFFIX_PLACEHOLDER = 'xxxxxxxx';
const OWNER_ID_PATTERN = /^[0-9a-f]{32}$/;
const SID_PATTERN = /^S-1-\d+(?:-\d+){1,14}$/;

export class PlatformioWorkRootError extends Error {
	constructor(public readonly code: string, message: string) {
		super(message);
		this.name = 'PlatformioWorkRootError';
	}
}

export interface WorkRootCandidate {
	kind: PlatformioWorkRootKind;
	/** For `system-drive`, ends with a placeholder suffix replaced on creation. */
	path: string;
}

export interface WorkRootLayout {
	root: string;
	packages: string;
	platforms: string;
	cache: string;
	workspace: string;
	build: string;
	libdeps: string;
}

const win = path.win32;

/** True for an absolute, local, printable-ASCII Windows path that is not a drive root. */
export function isShortPathEligible(candidate: string): boolean {
	if (!candidate || !/^[\x20-\x7E]+$/.test(candidate)) {return false;}
	if (!/^[A-Za-z]:\\/.test(candidate)) {return false;}
	const normalized = win.normalize(candidate);
	return normalized !== win.parse(normalized).root;
}

/** List work-root candidates in the fixed order defined by FR-003. Pure; Windows only. */
export function listWorkRootCandidates(options: {
	platform: NodeJS.Platform;
	managedRoot: string;
	customManagedRoot: boolean;
	env: NodeJS.ProcessEnv;
}): WorkRootCandidate[] {
	if (options.platform !== 'win32') {return [];}
	if (options.customManagedRoot) {
		return [{ kind: 'custom', path: win.join(options.managedRoot, 'pio') }];
	}
	const candidates: WorkRootCandidate[] = [];
	const localAppData = options.env.LOCALAPPDATA?.trim();
	if (localAppData && win.isAbsolute(localAppData)) {
		candidates.push({ kind: 'local-app-data', path: win.join(localAppData, 'SingularBlockly', 'pio') });
	}
	const systemDrive = (options.env.SystemDrive || options.env.SYSTEMDRIVE || 'C:').trim();
	if (/^[A-Za-z]:$/.test(systemDrive)) {
		candidates.push({
			kind: 'system-drive',
			path: `${systemDrive}\\${SYSTEM_DRIVE_PREFIX}${SYSTEM_DRIVE_SUFFIX_PLACEHOLDER}`,
		});
	}
	return candidates;
}

/** Stable short key for one project folder (64 bits of SHA-256 over the NFC URI). */
export function createProjectKey(workspaceUri: string): string {
	return createHash('sha256').update(workspaceUri.normalize('NFC')).digest('hex').slice(0, WORK_ROOT_PROJECT_KEY_LENGTH);
}

export function createWorkRootLayout(root: string, workspaceUri: string): WorkRootLayout {
	const workspace = win.join(root, 'w', createProjectKey(workspaceUri));
	return {
		root,
		packages: win.join(root, 'packages'),
		platforms: win.join(root, 'platforms'),
		cache: win.join(root, 'cache'),
		workspace,
		build: win.join(workspace, 'build'),
		libdeps: win.join(workspace, 'libdeps'),
	};
}

/** Check the three projected path budgets from data-model.md. */
export function checkWorkRootBudget(root: string): { ok: boolean; longestProjectedLength: number } {
	const sample = createWorkRootLayout(root, 'budget-probe');
	const projected = [
		sample.packages.length + 1 + WORK_ROOT_PACKAGE_DESCENDANT_RESERVE,
		sample.platforms.length + 1 + WORK_ROOT_PACKAGE_DESCENDANT_RESERVE,
		sample.build.length + 1 + WORK_ROOT_PROJECT_DESCENDANT_RESERVE,
	];
	const longestProjectedLength = Math.max(...projected);
	return { ok: longestProjectedLength < WINDOWS_MAX_PATH, longestProjectedLength };
}

export type CommandRunner = (file: string, args: readonly string[]) => Promise<{ stdout: string }>;

export interface WorkRootFileSystem {
	existsSync(target: string): boolean;
	promises: {
		mkdir(target: string, options?: { recursive?: boolean }): Promise<string | void>;
		readFile(target: string, encoding: BufferEncoding): Promise<string | Buffer>;
		writeFile(target: string, content: string, options?: { flag?: string }): Promise<void>;
		lstat(target: string): Promise<fs.Stats>;
		readdir(target: string): Promise<string[]>;
		rmdir(target: string): Promise<void>;
	};
}

const defaultCommandRunner: CommandRunner = (file, args) => new Promise((resolve, reject) => {
	execFile(file, [...args], { windowsHide: true, timeout: 15_000, encoding: 'utf8' }, (error, stdout) => {
		if (error) {reject(error);} else {resolve({ stdout: String(stdout) });}
	});
});

/** Parse the SID from `whoami /user /fo csv /nh` output. */
export function parseWhoamiSid(stdout: string): string | null {
	const fields = stdout.trim().split(/\r?\n/)[0]?.match(/"([^"]*)"/g)?.map(field => field.slice(1, -1)) ?? [];
	const sid = fields.at(-1) ?? '';
	return SID_PATTERN.test(sid) ? sid : null;
}

/** Build icacls arguments that drop inheritance and grant only the user, SYSTEM, and Administrators. */
export function createIcaclsArguments(target: string, sid: string): string[] {
	if (!SID_PATTERN.test(sid)) {
		throw new PlatformioWorkRootError('invalid-sid', 'Current user SID is not valid');
	}
	return [
		target,
		'/inheritance:r',
		'/grant:r',
		`*${sid}:(OI)(CI)F`,
		'*S-1-5-18:(OI)(CI)F',
		'*S-1-5-32-544:(OI)(CI)F',
	];
}

export interface PlatformioWorkRootResolver {
	resolve(): Promise<{ kind: PlatformioWorkRootKind; root: string }>;
	/** Last verified work root without creating anything, or null. */
	current(): Promise<{ kind: PlatformioWorkRootKind; root: string } | null>;
}

export interface PlatformioWorkRootServiceOptions {
	storage: ManagedRuntimeStorage;
	customManagedRoot: boolean;
	env?: NodeJS.ProcessEnv;
	platform?: NodeJS.Platform;
	fileSystem?: WorkRootFileSystem;
	runCommand?: CommandRunner;
	randomHex?: (bytes: number) => string;
	now?: () => Date;
	sleep?: (ms: number) => Promise<void>;
}

/**
 * Select, create, and verify the Windows PlatformIO work root.
 *
 * Only locations created by this user's Singular Blockly, carrying a marker
 * whose random owner id matches the record in managed storage, are adopted.
 */
export class PlatformioWorkRootService implements PlatformioWorkRootResolver {
	private readonly storage: ManagedRuntimeStorage;
	private readonly customManagedRoot: boolean;
	private readonly env: NodeJS.ProcessEnv;
	private readonly platform: NodeJS.Platform;
	private readonly fs: WorkRootFileSystem;
	private readonly runCommand: CommandRunner;
	private readonly randomHex: (bytes: number) => string;
	private readonly now: () => Date;
	private readonly sleep: (ms: number) => Promise<void>;
	private pending?: Promise<{ kind: PlatformioWorkRootKind; root: string }>;

	constructor(options: PlatformioWorkRootServiceOptions) {
		this.storage = options.storage;
		this.customManagedRoot = options.customManagedRoot;
		this.env = options.env ?? process.env;
		this.platform = options.platform ?? process.platform;
		this.fs = options.fileSystem ?? (fs as unknown as WorkRootFileSystem);
		this.runCommand = options.runCommand ?? defaultCommandRunner;
		this.randomHex = options.randomHex ?? (bytes => randomBytes(bytes).toString('hex'));
		this.now = options.now ?? (() => new Date());
		this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
	}

	async current(): Promise<{ kind: PlatformioWorkRootKind; root: string } | null> {
		if (this.platform !== 'win32') {return null;}
		const record = await this.readRecord();
		return record && await this.isVerified(record) ? { kind: record.kind, root: record.path } : null;
	}

	resolve(): Promise<{ kind: PlatformioWorkRootKind; root: string }> {
		if (!this.pending) {
			this.pending = this.resolveOnce().finally(() => {this.pending = undefined;});
		}
		return this.pending;
	}

	private async resolveOnce(): Promise<{ kind: PlatformioWorkRootKind; root: string }> {
		if (this.platform !== 'win32') {
			throw new PlatformioWorkRootError('unsupported-platform', 'PlatformIO work roots are used only on Windows');
		}
		const existing = await this.current();
		if (existing) {return existing;}

		const release = await this.acquireLock();
		if (!release) {
			const adopted = await this.current();
			if (adopted) {return adopted;}
			throw new PlatformioWorkRootError('work-root-locked', 'Another window is preparing the PlatformIO work root');
		}
		try {
			const adopted = await this.current();
			if (adopted) {return adopted;}
			return await this.createFromCandidates();
		} finally {
			await release();
		}
	}

	private async createFromCandidates(): Promise<{ kind: PlatformioWorkRootKind; root: string }> {
		const candidates = listWorkRootCandidates({
			platform: this.platform,
			managedRoot: this.storage.layout.root,
			customManagedRoot: this.customManagedRoot,
			env: this.env,
		});
		for (const candidate of candidates) {
			if (!isShortPathEligible(candidate.path) || !checkWorkRootBudget(candidate.path).ok) {
				log('[managed-runtime] PlatformIO work root candidate skipped', 'info', { kind: candidate.kind, reason: 'budget-or-ascii' });
				continue;
			}
			const created = await this.tryCreate(candidate);
			if (created) {return created;}
		}
		throw new PlatformioWorkRootError(
			'path-too-long',
			'No short local folder is available for PlatformIO packages on this Windows system; choose a shorter managed-runtime folder'
		);
	}

	private async tryCreate(candidate: WorkRootCandidate): Promise<{ kind: PlatformioWorkRootKind; root: string } | null> {
		const root = candidate.kind === 'system-drive'
			? candidate.path.slice(0, -SYSTEM_DRIVE_SUFFIX_PLACEHOLDER.length) + this.randomHex(4)
			: candidate.path;
		const parent = win.dirname(root);
		let createdRoot = false;
		try {
			if (candidate.kind !== 'system-drive') {
				await this.fs.promises.mkdir(parent, { recursive: true });
				await this.assertNotSymlink(parent);
			}
			try {
				await this.fs.promises.mkdir(root);
				createdRoot = true;
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
					log('[managed-runtime] PlatformIO work root candidate already exists without a matching record', 'warn', {
						kind: candidate.kind,
					});
					return null;
				}
				throw error;
			}
			if (candidate.kind === 'system-drive') {
				// The drive root lets other accounts modify new sub-folders until the ACL is
				// replaced, so confirm afterwards that the folder is still ours and empty.
				const before = await this.fs.promises.lstat(root);
				await this.hardenAcl(root);
				const after = await this.fs.promises.lstat(root);
				if (after.isSymbolicLink() || !after.isDirectory() || (before.ino !== 0 && after.ino !== before.ino)) {
					createdRoot = false;
					throw new PlatformioWorkRootError('unsafe-work-root', 'PlatformIO work root changed while it was being secured');
				}
				if ((await this.fs.promises.readdir(root)).length > 0) {
					createdRoot = false;
					throw new PlatformioWorkRootError('unsafe-work-root', 'PlatformIO work root was not empty after it was secured');
				}
			}
			const ownerId = this.randomHex(16);
			await this.fs.promises.writeFile(
				win.join(root, MARKER_FILE),
				`${JSON.stringify({ schemaVersion: 1, owner: MARKER_OWNER, ownerId }, null, 2)}\n`,
				{ flag: 'wx' }
			);
			const record: PlatformioWorkRootRecord = {
				schemaVersion: 1,
				kind: candidate.kind,
				path: root,
				ownerId,
				createdAt: this.now().toISOString(),
			};
			await this.storage.files.writeFileAtomic(RECORD_RELATIVE_PATH, `${JSON.stringify(record, null, 2)}\n`);
			log('[managed-runtime] PlatformIO work root ready', 'info', { kind: candidate.kind });
			return { kind: candidate.kind, root };
		} catch (error) {
			log('[managed-runtime] PlatformIO work root candidate failed', 'warn', {
				kind: candidate.kind,
				code: (error as NodeJS.ErrnoException)?.code ?? (error as PlatformioWorkRootError)?.code ?? 'unknown',
			});
			if (createdRoot) {await this.removeCreatedRoot(root);}
			return null;
		}
	}

	private async hardenAcl(root: string): Promise<void> {
		const system32 = win.join(this.env.SystemRoot || this.env.SYSTEMROOT || 'C:\\Windows', 'System32');
		const whoami = await this.runCommand(win.join(system32, 'whoami.exe'), ['/user', '/fo', 'csv', '/nh']);
		const sid = parseWhoamiSid(whoami.stdout);
		if (!sid) {throw new PlatformioWorkRootError('invalid-sid', 'Unable to read the current user SID');}
		await this.runCommand(win.join(system32, 'icacls.exe'), createIcaclsArguments(root, sid));
	}

	private async removeCreatedRoot(root: string): Promise<void> {
		try {
			const marker = win.join(root, MARKER_FILE);
			if (this.fs.existsSync(marker)) {return;}
			await this.fs.promises.rmdir(root);
		} catch {
			// Leave the empty folder; it is never adopted without a matching record.
		}
	}

	private async assertNotSymlink(target: string): Promise<void> {
		const stats = await this.fs.promises.lstat(target);
		if (stats.isSymbolicLink() || !stats.isDirectory()) {
			throw new PlatformioWorkRootError('unsafe-work-root', 'PlatformIO work root must be a real directory');
		}
	}

	private async readRecord(): Promise<PlatformioWorkRootRecord | null> {
		if (!this.storage.files.fileExists(RECORD_RELATIVE_PATH)) {return null;}
		const record = await this.storage.files.readJsonFile<Partial<PlatformioWorkRootRecord> | null>(RECORD_RELATIVE_PATH, null);
		if (
			record?.schemaVersion !== 1 ||
			(record.kind !== 'custom' && record.kind !== 'local-app-data' && record.kind !== 'system-drive') ||
			typeof record.path !== 'string' ||
			!isShortPathEligible(record.path) ||
			typeof record.ownerId !== 'string' ||
			!OWNER_ID_PATTERN.test(record.ownerId) ||
			typeof record.createdAt !== 'string'
		) {
			return null;
		}
		if (record.kind === 'custom' !== this.customManagedRoot) {return null;}
		if (!checkWorkRootBudget(record.path).ok) {return null;}
		return record as PlatformioWorkRootRecord;
	}

	private async isVerified(record: PlatformioWorkRootRecord): Promise<boolean> {
		try {
			if (!this.fs.existsSync(record.path)) {return false;}
			await this.assertNotSymlink(record.path);
			const raw = await this.fs.promises.readFile(win.join(record.path, MARKER_FILE), 'utf8');
			const marker = JSON.parse(String(raw)) as { schemaVersion?: unknown; owner?: unknown; ownerId?: unknown };
			return marker.schemaVersion === 1 && marker.owner === MARKER_OWNER && marker.ownerId === record.ownerId;
		} catch {
			return false;
		}
	}

	private async acquireLock(): Promise<(() => Promise<void>) | null> {
		const deadline = Date.now() + LOCK_WAIT_MS;
		while (true) {
			const created = await this.storage.files.createExclusiveFile(
				LOCK_RELATIVE_PATH,
				JSON.stringify({ pid: process.pid, createdAt: this.now().toISOString() })
			);
			if (created) {
				return async () => {await this.storage.files.deleteFile(LOCK_RELATIVE_PATH).catch(() => undefined);};
			}
			const stats = await this.storage.files.getFileStats(LOCK_RELATIVE_PATH);
			if (stats && Date.now() - stats.mtimeMs > LOCK_STALE_MS) {
				await this.storage.files.deleteFile(LOCK_RELATIVE_PATH).catch(() => undefined);
				continue;
			}
			if (await this.current()) {return null;}
			if (Date.now() >= deadline) {return null;}
			await this.sleep(LOCK_POLL_MS);
		}
	}
}
