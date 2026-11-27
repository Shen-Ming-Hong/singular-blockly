/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Remembers what the last Arduino upload already prepared and built, so an unchanged
 * re-upload can skip `pio pkg install` and the SCons dependency scan (spec 077).
 *
 * Every key covers all inputs that can change the result: platformio.ini, every file
 * under src/, include/ and lib/, and the PlatformIO Core that ran. A record only counts
 * while the firmware files it saw still have the same size and modification time.
 */

/** Read/write file system used by the cache; injected in tests. */
export interface BuildCacheFileSystem {
	readFile(target: string): Promise<Buffer>;
	writeFile(target: string, data: string): Promise<void>;
	rm(target: string): Promise<void>;
	mkdir(target: string): Promise<void>;
	readdir(dir: string): Promise<string[]>;
	stat(target: string): Promise<{ size: number; mtimeMs: number; isDirectory(): boolean; isFile(): boolean }>;
}

export const nodeBuildCacheFileSystem: BuildCacheFileSystem = {
	readFile: target => fs.promises.readFile(target),
	writeFile: (target, data) => fs.promises.writeFile(target, data, 'utf8'),
	rm: target => fs.promises.rm(target, { force: true }),
	mkdir: async target => {
		await fs.promises.mkdir(target, { recursive: true });
	},
	readdir: dir => fs.promises.readdir(dir),
	stat: target => fs.promises.stat(target),
};

/** Bump when the record format or key inputs change; older records are then ignored. */
const CACHE_VERSION = 1;
export const BUILD_CACHE_FILE = 'singular-blockly-upload-cache.json';
/** Source folders PlatformIO builds from by default. */
const SOURCE_DIRS = ['src', 'include', 'lib'];
/** Above this many source files the project is not a generated Blockly project; skip the cache. */
const MAX_SOURCE_FILES = 500;
/** Files `pio run -t nobuild -t upload` reads from the build folder. */
const ARTIFACT_NAMES = ['firmware.bin', 'firmware.hex', 'firmware.elf', 'bootloader.bin', 'partitions.bin'];
const FIRMWARE_NAMES = new Set(['firmware.bin', 'firmware.hex']);

interface ArtifactStamp {
	name: string;
	size: number;
	mtimeMs: number;
}

/** The board the last full ESP32 upload flashed: its port and the chip MAC esptool printed. */
export interface FlashedDevice {
	port: string;
	mac: string;
}

/** The chip MAC esptool prints while connecting (`MAC: 24:6f:28:aa:bb:cc`). */
export function parseEsptoolMac(line: string): string | null {
	const match = line.match(/\bMAC:\s*((?:[0-9a-f]{2}:){5}[0-9a-f]{2})\b/i);
	return match ? match[1].toLowerCase() : null;
}

interface CacheRecord {
	version: number;
	prepareKey?: string;
	build?: { key: string; env: string; artifacts: ArtifactStamp[]; device?: FlashedDevice };
}

/** What identifies the PlatformIO Core that runs the build. */
export interface CoreIdentity {
	/** `managed`, `provider`, or the invocation source when no Core manager is used. */
	id: string;
	command: string;
	env?: NodeJS.ProcessEnv;
}

export interface BuildInputs {
	/** Same ini and Core: `pio pkg install` has nothing new to do. */
	prepareKey: string;
	/** Same ini, Core, and sources: the last firmware is still current. */
	buildKey: string;
	/** The single environment `pio run` builds, or null when the ini has several or none. */
	env: string | null;
	/** Platform names from the ini, or null when one cannot be read. */
	platforms: string[] | null;
}

/**
 * How `pio run -t nobuild -t upload` flashes this project.
 * - `whole`: the upload already writes the whole program (AVR .hex), same as a normal upload.
 * - `app-only`: ESP32 then writes only firmware.bin, not the bootloader, partition table, or
 *   boot_app0 that a normal upload writes, so it is safe only on the board flashed last time
 *   (checked by the chip MAC esptool prints; another board gets a full upload right after).
 * - `unsupported`: always build.
 */
export type ReuseMode = 'whole' | 'app-only' | 'unsupported';

export function reuseModeFor(platforms: string[] | null): ReuseMode {
	if (!platforms || platforms.length !== 1) {return 'unsupported';}
	if (platforms[0] === 'atmelavr') {return 'whole';}
	if (platforms[0] === 'espressif32') {return 'app-only';}
	return 'unsupported';
}

/** The environment `pio run` builds without `-e`: `default_envs` if set, else every `[env:*]`. */
export function resolveDefaultEnvironment(ini: string): string | null {
	const envs: string[] = [];
	let defaultEnvs: string[] | null = null;
	let section = '';
	for (const raw of ini.split(/\r?\n/)) {
		const line = raw.replace(/\s[;#].*$/, '').trim();
		if (!line || line.startsWith(';') || line.startsWith('#')) {continue;}
		const header = line.match(/^\[([^\]]+)\]$/);
		if (header) {
			section = header[1].trim();
			const env = section.match(/^env:(.+)$/);
			if (env) {envs.push(env[1].trim());}
			continue;
		}
		const defaults = line.match(/^default_envs\s*=\s*(.*)$/);
		if (section === 'platformio' && defaults) {
			defaultEnvs = defaults[1].split(/[,\s]+/).filter(Boolean);
		}
	}
	const targets = defaultEnvs ?? envs;
	return targets.length === 1 && /^[\w.-]+$/.test(targets[0]) ? targets[0] : null;
}

/** Platform names in the ini that PlatformIO installs under `platforms/<name>`. */
export function findPlatformNames(ini: string): string[] | null {
	const names = new Set<string>();
	for (const raw of ini.split(/\r?\n/)) {
		const match = raw.match(/^\s*platform\s*=\s*([^;#\s]+)/i);
		if (!match) {continue;}
		// `espressif32@7.0.1` and `platformio/espressif32@7.0.1` both install under platforms/espressif32.
		const spec = match[1].split('@')[0].trim();
		const registry = spec.match(/^(?:[a-z0-9_-]+\/)?([a-z0-9_-]+)$/i);
		// URLs and paths install under other folder names; do not guess.
		if (!registry) {return null;}
		names.add(registry[1].toLowerCase());
	}
	return [...names];
}

/** Where PlatformIO writes build output for this Core (managed Cores redirect it, spec 074). */
export function resolveBuildRoot(workspacePath: string, env: NodeJS.ProcessEnv = {}): string {
	if (env.PLATFORMIO_BUILD_DIR) {return env.PLATFORMIO_BUILD_DIR;}
	const workspaceDir = env.PLATFORMIO_WORKSPACE_DIR || path.join(workspacePath, '.pio');
	return path.join(workspaceDir, 'build');
}

export class ArduinoBuildCache {
	constructor(
		private readonly workspacePath: string,
		private readonly fileSystem: BuildCacheFileSystem = nodeBuildCacheFileSystem
	) {}

	/** Hash the ini, sources, and Core. Returns null when the project cannot be fingerprinted. */
	async computeInputs(core: CoreIdentity): Promise<BuildInputs | null> {
		let ini: Buffer;
		try {
			ini = await this.fileSystem.readFile(path.join(this.workspacePath, 'platformio.ini'));
		} catch {
			return null;
		}
		const coreHash = createHash('sha256');
		coreHash.update(`v${CACHE_VERSION}\0${core.id}\0${core.command}\0`);
		for (const name of ['PLATFORMIO_CORE_DIR', 'PLATFORMIO_PACKAGES_DIR', 'PLATFORMIO_PLATFORMS_DIR', 'PLATFORMIO_BUILD_DIR', 'PLATFORMIO_LIBDEPS_DIR']) {
			coreHash.update(`${name}=${core.env?.[name] ?? ''}\0`);
		}
		coreHash.update(ini);
		const prepareKey = coreHash.digest('hex');

		const sources = await this.listSourceFiles();
		if (!sources) {return null;}
		const buildHash = createHash('sha256');
		buildHash.update(prepareKey);
		for (const relative of sources) {
			const content = await this.fileSystem.readFile(path.join(this.workspacePath, relative));
			buildHash.update(`\0${relative.split(path.sep).join('/')}\0${content.length}\0`);
			buildHash.update(content);
		}
		const iniText = ini.toString('utf8');
		return { prepareKey, buildKey: buildHash.digest('hex'), env: resolveDefaultEnvironment(iniText), platforms: findPlatformNames(iniText) };
	}

	/** True when the last successful `pio pkg install` used the same ini and Core and its platforms are still installed. */
	async isPrepared(inputs: BuildInputs, core: CoreIdentity, platformsDir: string): Promise<boolean> {
		const record = await this.read(core);
		if (record?.prepareKey !== inputs.prepareKey) {return false;}
		let ini: string;
		try {
			ini = (await this.fileSystem.readFile(path.join(this.workspacePath, 'platformio.ini'))).toString('utf8');
		} catch {
			return false;
		}
		const platforms = findPlatformNames(ini);
		// Packages from URLs or paths are not checked here; let pkg install handle them.
		if (!platforms || platforms.length === 0) {return false;}
		for (const name of platforms) {
			if (!(await this.isDirectory(path.join(platformsDir, name)))) {return false;}
		}
		return true;
	}

	async markPrepared(inputs: BuildInputs, core: CoreIdentity): Promise<void> {
		const record = (await this.read(core)) ?? { version: CACHE_VERSION };
		if (record.prepareKey !== inputs.prepareKey) {delete record.build;}
		record.prepareKey = inputs.prepareKey;
		await this.write(core, record);
	}

	/** True when the firmware from the last build with the same inputs is still on disk unchanged. */
	async canReuseBuild(inputs: BuildInputs, core: CoreIdentity): Promise<boolean> {
		if (!inputs.env) {return false;}
		const record = await this.read(core);
		const build = record?.build;
		if (!build || build.key !== inputs.buildKey || build.env !== inputs.env) {return false;}
		const current = await this.stampArtifacts(core, inputs.env);
		if (!current || current.length !== build.artifacts.length) {return false;}
		return build.artifacts.every((saved, index) =>
			current[index].name === saved.name && current[index].size === saved.size && current[index].mtimeMs === saved.mtimeMs
		);
	}

	/** Record the firmware `pio run` just produced for these inputs. */
	async markBuilt(inputs: BuildInputs, core: CoreIdentity): Promise<boolean> {
		if (!inputs.env) {return false;}
		const artifacts = await this.stampArtifacts(core, inputs.env);
		if (!artifacts) {return false;}
		const record = (await this.read(core)) ?? { version: CACHE_VERSION };
		record.build = { key: inputs.buildKey, env: inputs.env, artifacts };
		await this.write(core, record);
		return true;
	}

	/** Remember which board the last full upload flashed (ESP32 only, spec 077). */
	async recordDevice(inputs: BuildInputs, core: CoreIdentity, device: FlashedDevice): Promise<void> {
		const record = await this.read(core);
		if (!record?.build || record.build.key !== inputs.buildKey) {return;}
		record.build.device = { port: device.port, mac: device.mac };
		await this.write(core, record);
	}

	/** The board the cached ESP32 build was last fully flashed to, if any. */
	async flashedDevice(core: CoreIdentity): Promise<FlashedDevice | null> {
		return (await this.read(core))?.build?.device ?? null;
	}

	/** Forget the last build, e.g. before a full build that might fail half-way. */
	async invalidateBuild(core: CoreIdentity): Promise<void> {
		const record = await this.read(core);
		if (!record?.build) {return;}
		delete record.build;
		await this.write(core, record);
	}

	private cacheFile(core: CoreIdentity): string {
		return path.join(resolveBuildRoot(this.workspacePath, core.env), BUILD_CACHE_FILE);
	}

	private async read(core: CoreIdentity): Promise<CacheRecord | null> {
		try {
			const parsed = JSON.parse((await this.fileSystem.readFile(this.cacheFile(core))).toString('utf8')) as CacheRecord;
			return parsed && parsed.version === CACHE_VERSION ? parsed : null;
		} catch {
			return null;
		}
	}

	private async write(core: CoreIdentity, record: CacheRecord): Promise<void> {
		const file = this.cacheFile(core);
		try {
			await this.fileSystem.mkdir(path.dirname(file));
			await this.fileSystem.writeFile(file, JSON.stringify(record));
		} catch {
			// A cache that cannot be written only costs speed; remove any stale copy.
			await this.fileSystem.rm(file).catch(() => undefined);
		}
	}

	private async stampArtifacts(core: CoreIdentity, env: string): Promise<ArtifactStamp[] | null> {
		const dir = path.join(resolveBuildRoot(this.workspacePath, core.env), env);
		const stamps: ArtifactStamp[] = [];
		for (const name of ARTIFACT_NAMES) {
			try {
				const stat = await this.fileSystem.stat(path.join(dir, name));
				if (stat.isFile()) {stamps.push({ name, size: stat.size, mtimeMs: stat.mtimeMs });}
			} catch {
				// Not every platform produces every file.
			}
		}
		return stamps.some(stamp => FIRMWARE_NAMES.has(stamp.name)) ? stamps : null;
	}

	private async isDirectory(target: string): Promise<boolean> {
		try {
			return (await this.fileSystem.stat(target)).isDirectory();
		} catch {
			return false;
		}
	}

	/** Relative paths of every file under the source folders, sorted; null if there are too many. */
	private async listSourceFiles(): Promise<string[] | null> {
		const files: string[] = [];
		const walk = async (relative: string): Promise<boolean> => {
			let entries: string[];
			try {
				entries = await this.fileSystem.readdir(path.join(this.workspacePath, relative));
			} catch {
				return true;
			}
			for (const entry of entries.sort()) {
				const child = path.join(relative, entry);
				const stat = await this.fileSystem.stat(path.join(this.workspacePath, child)).catch(() => null);
				if (!stat) {continue;}
				if (stat.isDirectory()) {
					if (!(await walk(child))) {return false;}
				} else if (stat.isFile()) {
					files.push(child);
					if (files.length > MAX_SOURCE_FILES) {return false;}
				}
			}
			return true;
		};
		for (const dir of SOURCE_DIRS) {
			if (!(await walk(dir))) {return null;}
		}
		return files;
	}
}
