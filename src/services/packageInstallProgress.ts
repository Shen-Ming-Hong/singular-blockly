/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/** Package preparation phase shown to the user (spec 076). */
export type PackageProgressPhase = 'download' | 'install';

/** Progress of `pio pkg install`; `percent: null` means indeterminate. */
export interface PackageProgress {
	phase: PackageProgressPhase;
	percent: number | null;
}

/**
 * Bytes written by a first-time `pio pkg install` per board: downloaded archives
 * + largest unpack temp folder + new package folders (spec 076 research R2,
 * measured with PlatformIO 6.1.18). ESP32 uses the Windows measurement (2.75 GB,
 * Linux 2.51 GB); the other boards scale their Linux numbers by the same 1.1.
 * The 95% cap absorbs the rest.
 */
export const PACKAGE_INSTALL_ESTIMATED_BYTES: Readonly<Record<string, number>> = {
	uno: 600_000_000,
	nano: 600_000_000,
	mega: 600_000_000,
	esp32: 2_800_000_000,
	supermini: 4_300_000_000,
};

/** Highest percent shown before PlatformIO reports completion. */
export const PACKAGE_PROGRESS_CAP = 95;

export interface PlatformioDirectories {
	downloads: string;
	tmp: string;
	packages: string;
	platforms: string;
}

/** Mirror PlatformIO's own directory defaults (core dir, cache/downloads, cache/tmp). */
export function resolvePlatformioDirectories(env: NodeJS.ProcessEnv = process.env, homeDir = os.homedir()): PlatformioDirectories {
	const core = env.PLATFORMIO_CORE_DIR || path.join(homeDir, '.platformio');
	const cache = env.PLATFORMIO_CACHE_DIR || path.join(core, '.cache');
	return {
		downloads: path.join(cache, 'downloads'),
		tmp: path.join(cache, 'tmp'),
		packages: env.PLATFORMIO_PACKAGES_DIR || path.join(core, 'packages'),
		platforms: env.PLATFORMIO_PLATFORMS_DIR || path.join(core, 'platforms'),
	};
}

/** Read-only file system used for measuring; injected in tests. */
export interface ProgressFileSystem {
	readdir(dir: string): Promise<string[]>;
	lstat(target: string): Promise<{ size: number; isDirectory(): boolean; isSymbolicLink(): boolean }>;
	/**
	 * Size of a file that may still be open for writing. On Windows, path-based stat can
	 * return the directory entry's size, which lags until the writer closes the file
	 * (seen on Ray's PC: download stayed at 0%), so measure through an open handle.
	 */
	openFileSize?(target: string): Promise<number>;
}

export const nodeProgressFileSystem: ProgressFileSystem = {
	readdir: dir => fs.promises.readdir(dir),
	lstat: target => fs.promises.lstat(target),
	openFileSize: async target => {
		const handle = await fs.promises.open(target, 'r');
		try {
			return (await handle.stat()).size;
		} finally {
			await handle.close();
		}
	},
};

/** A new phase must last this long before the label switches, so small packages do not make it flicker. */
export const PACKAGE_PHASE_SETTLE_MS = 3000;

const PHASE_PATTERN = /^(?:[\w ]+Manager:\s*)?(Installing|Downloading|Unpacking)\b/gm;

/**
 * Measures how much a running `pio pkg install` has written, counting only
 * entries that did not exist when it started, and turns it into a phase and percent.
 */
export class PackageInstallProgressTracker {
	private readonly baseline = { downloads: new Set<string>(), packages: new Set<string>(), platforms: new Set<string>() };
	private readonly tmpPeaks = new Map<string, number>();
	private phase: PackageProgressPhase | null = null;
	private rawPhase: PackageProgressPhase | null = null;
	private rawSince = 0;
	private measured = 0;
	private sampling = false;

	constructor(
		private readonly dirs: PlatformioDirectories,
		private readonly expectedBytes: number | undefined,
		private readonly fileSystem: ProgressFileSystem = nodeProgressFileSystem,
		private readonly now: () => number = Date.now
	) {}

	async start(): Promise<void> {
		for (const key of ['downloads', 'packages', 'platforms'] as const) {
			for (const name of await this.list(this.dirs[key])) {
				this.baseline[key].add(name);
			}
		}
	}

	/** Update the phase from PlatformIO output. Returns true when the shown phase changed. */
	observeOutput(text: string): boolean {
		let next = this.rawPhase;
		for (const match of text.matchAll(PHASE_PATTERN)) {
			next = match[1] === 'Unpacking' ? 'install' : 'download';
		}
		if (next !== this.rawPhase) {
			this.rawPhase = next;
			this.rawSince = this.now();
		}
		return this.settlePhase();
	}

	/**
	 * PlatformIO alternates download/unpack for every package; show a new phase only after
	 * it has lasted PACKAGE_PHASE_SETTLE_MS, except for the very first one.
	 */
	private settlePhase(): boolean {
		if (this.rawPhase === this.phase) {
			return false;
		}
		if (this.phase === null || this.now() - this.rawSince >= PACKAGE_PHASE_SETTLE_MS) {
			this.phase = this.rawPhase;
			return true;
		}
		return false;
	}

	/** Measure new bytes; never decreases. Skips when a previous sample is still running. */
	async sample(): Promise<number> {
		if (this.sampling) {
			return this.measured;
		}
		this.sampling = true;
		try {
			let total = 0;
			for (const name of await this.list(this.dirs.downloads)) {
				if (!this.baseline.downloads.has(name)) {
					total += await this.downloadSize(path.join(this.dirs.downloads, name));
				}
			}
			for (const key of ['packages', 'platforms'] as const) {
				for (const name of await this.list(this.dirs[key])) {
					if (!this.baseline[key].has(name)) {
						total += await this.sizeOf(path.join(this.dirs[key], name));
					}
				}
			}
			for (const name of await this.list(this.dirs.tmp)) {
				if (name.startsWith('pkg-installing-')) {
					const size = await this.sizeOf(path.join(this.dirs.tmp, name));
					this.tmpPeaks.set(name, Math.max(this.tmpPeaks.get(name) ?? 0, size));
				}
			}
			for (const peak of this.tmpPeaks.values()) {
				total += peak;
			}
			this.measured = Math.max(this.measured, total);
			return this.measured;
		} finally {
			this.sampling = false;
		}
	}

	get measuredBytes(): number {
		return this.measured;
	}

	/** Null until PlatformIO starts installing something. */
	snapshot(): PackageProgress | null {
		this.settlePhase();
		if (!this.phase) {
			return null;
		}
		return { phase: this.phase, percent: computePackagePercent(this.measured, this.expectedBytes) };
	}

	private async list(dir: string): Promise<string[]> {
		try {
			return await this.fileSystem.readdir(dir);
		} catch {
			return [];
		}
	}

	/** Downloads may still be open for writing; prefer the handle-based size. */
	private async downloadSize(target: string): Promise<number> {
		if (this.fileSystem.openFileSize) {
			try {
				return await this.fileSystem.openFileSize(target);
			} catch {
				// Directory, vanished, or locked: fall back to the path-based size.
			}
		}
		return this.sizeOf(target);
	}

	private async sizeOf(target: string): Promise<number> {
		let stats;
		try {
			stats = await this.fileSystem.lstat(target);
		} catch {
			return 0;
		}
		if (stats.isSymbolicLink()) {
			return 0;
		}
		if (!stats.isDirectory()) {
			return stats.size;
		}
		let total = 0;
		for (const name of await this.list(target)) {
			total += await this.sizeOf(path.join(target, name));
		}
		return total;
	}
}

/** Percent of the estimate, capped below 100; null when unknown or nothing measured yet. */
export function computePackagePercent(measuredBytes: number, expectedBytes: number | undefined): number | null {
	if (!expectedBytes || expectedBytes <= 0 || measuredBytes <= 0) {
		return null;
	}
	return Math.min(PACKAGE_PROGRESS_CAP, Math.floor((measuredBytes / expectedBytes) * 100));
}
