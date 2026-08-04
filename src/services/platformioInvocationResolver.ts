/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os';
import * as path from 'path';
import { getExecutableSearchDirectories } from './executableResolver';

export type PlatformioInvocationMode = 'direct' | 'python-module';

export type PlatformioInvocationSource =
	| 'official-custom-path'
	| 'platformio-core-dir'
	| 'system-drive-core-dir'
	| 'default-core-dir'
	| 'path-search';

export interface PlatformioInvocation {
	command: string;
	prefixArgs: string[];
	mode: PlatformioInvocationMode;
	source: PlatformioInvocationSource;
}

export interface PlatformioInvocationFailure {
	invocation: PlatformioInvocation;
	error: unknown;
}

export interface PlatformioInvocationResolution {
	invocation: PlatformioInvocation | null;
	probeResult?: { stdout: string; stderr: string };
	foundCandidates: PlatformioInvocation[];
	failures: PlatformioInvocationFailure[];
}

export interface PlatformioInvocationResolverOptions {
	existsSync: (filePath: string) => boolean;
	probe: (
		filePath: string,
		args: string[],
		options: { timeout: number }
	) => Promise<{ stdout: string; stderr: string }>;
	customPathEntries?: string[];
	env?: NodeJS.ProcessEnv;
	platform?: NodeJS.Platform;
	homeDir?: string;
	probeTimeoutMs?: number;
}

function uniqueInvocations(invocations: PlatformioInvocation[]): PlatformioInvocation[] {
	const seen = new Set<string>();
	return invocations.filter(invocation => {
		const key = `${invocation.command}\0${invocation.prefixArgs.join('\0')}`;
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
}

function platformPath(platform: NodeJS.Platform): typeof path.posix | typeof path.win32 {
	return platform === 'win32' ? path.win32 : path.posix;
}

function createDirectoryCandidates(
	directory: string,
	source: PlatformioInvocationSource,
	platform: NodeJS.Platform,
	includePython = true
): PlatformioInvocation[] {
	const pathApi = platformPath(platform);
	const directNames = platform === 'win32' ? ['pio.exe', 'platformio.exe'] : ['pio', 'platformio'];
	const pythonNames = platform === 'win32' ? ['python.exe'] : ['python3', 'python'];

	return [
		...directNames.map(commandName => ({
			command: pathApi.join(directory, commandName),
			prefixArgs: [],
			mode: 'direct' as const,
			source,
		})),
		...(includePython
			? pythonNames.map(commandName => ({
				command: pathApi.join(directory, commandName),
				prefixArgs: ['-m', 'platformio'],
				mode: 'python-module' as const,
				source,
			}))
			: []),
	];
}

function isPenvScriptsDirectory(directory: string, platform: NodeJS.Platform): boolean {
	const pathApi = platformPath(platform);
	const directoryName = pathApi.basename(directory).toLowerCase();
	const parentName = pathApi.basename(pathApi.dirname(directory)).toLowerCase();
	const expectedDirectoryName = platform === 'win32' ? 'scripts' : 'bin';
	return directoryName === expectedDirectoryName && parentName === 'penv';
}

function createCustomPathCandidates(
	entry: string,
	platform: NodeJS.Platform
): PlatformioInvocation[] {
	const pathApi = platformPath(platform);
	const basename = pathApi.basename(entry).toLowerCase();
	const directNames = new Set(platform === 'win32' ? ['pio.exe', 'platformio.exe'] : ['pio', 'platformio']);
	const pythonNames = new Set(platform === 'win32' ? ['python.exe'] : ['python3', 'python']);

	if (directNames.has(basename)) {
		return [{
			command: entry,
			prefixArgs: [],
			mode: 'direct',
			source: 'official-custom-path',
		}];
	}
	if (pythonNames.has(basename)) {
		return [{
			command: entry,
			prefixArgs: ['-m', 'platformio'],
			mode: 'python-module',
			source: 'official-custom-path',
		}];
	}

	return createDirectoryCandidates(entry, 'official-custom-path', platform);
}

function getCoreScriptsDirectory(coreDir: string, platform: NodeJS.Platform): string {
	const pathApi = platformPath(platform);
	return platform === 'win32'
		? pathApi.join(coreDir, 'penv', 'Scripts')
		: pathApi.join(coreDir, 'penv', 'bin');
}

function getWindowsSystemDriveCoreDir(
	homeDir: string,
	env: NodeJS.ProcessEnv
): string | null {
	const systemDrive = env['SystemDrive']?.trim();
	const systemDriveRoot = systemDrive ? path.win32.parse(`${systemDrive}\\`).root : '';
	const driveRoot = systemDriveRoot || path.win32.parse(homeDir).root;
	return driveRoot ? path.win32.join(driveRoot, '.platformio') : null;
}

export function parsePlatformioCustomPath(
	value: unknown,
	platform: NodeJS.Platform = process.platform
): string[] {
	if (typeof value !== 'string' || value.trim().length === 0) {
		return [];
	}

	const separator = platform === 'win32' ? ';' : ':';
	return [...new Set(value.split(separator).map(entry => entry.trim()).filter(Boolean))];
}

export function createPlatformioInvocationCandidates({
	customPathEntries = [],
	env = process.env,
	platform = process.platform,
	homeDir = os.homedir(),
}: Omit<PlatformioInvocationResolverOptions, 'existsSync' | 'probe' | 'probeTimeoutMs'> = {}): PlatformioInvocation[] {
	const pathApi = platformPath(platform);
	const candidates: PlatformioInvocation[] = [];

	for (const entry of customPathEntries) {
		candidates.push(...createCustomPathCandidates(entry, platform));
	}

	const coreDirectories: Array<[string | null | undefined, PlatformioInvocationSource]> = [
		[env['PLATFORMIO_CORE_DIR'], 'platformio-core-dir'],
		[platform === 'win32' ? getWindowsSystemDriveCoreDir(homeDir, env) : null, 'system-drive-core-dir'],
		[pathApi.join(homeDir, '.platformio'), 'default-core-dir'],
	];

	for (const [coreDir, source] of coreDirectories) {
		if (coreDir?.trim()) {
			candidates.push(...createDirectoryCandidates(getCoreScriptsDirectory(coreDir, platform), source, platform));
		}
	}

	for (const directory of getExecutableSearchDirectories(env, platform)) {
		candidates.push(
			...createDirectoryCandidates(
				directory,
				'path-search',
				platform,
				isPenvScriptsDirectory(directory, platform)
			)
		);
	}

	return uniqueInvocations(candidates);
}

export async function resolvePlatformioInvocation(
	options: PlatformioInvocationResolverOptions
): Promise<PlatformioInvocationResolution> {
	const candidates = createPlatformioInvocationCandidates(options);
	const foundCandidates = candidates.filter(candidate => options.existsSync(candidate.command));
	const failures: PlatformioInvocationFailure[] = [];
	const probeTimeoutMs = options.probeTimeoutMs ?? 5000;

	for (const invocation of foundCandidates) {
		try {
			const probeResult = await options.probe(
				invocation.command,
				[...invocation.prefixArgs, '--version'],
				{ timeout: probeTimeoutMs }
			);
			return { invocation, probeResult, foundCandidates, failures };
		} catch (error) {
			failures.push({ invocation, error });
		}
	}

	return { invocation: null, foundCandidates, failures };
}

function quotePowerShellArgument(value: string): string {
	return `'${value.replace(/'/g, "''")}'`;
}

function quotePosixArgument(value: string): string {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function formatPlatformioTerminalCommand(
	invocation: PlatformioInvocation,
	args: string[],
	platform: NodeJS.Platform = process.platform
): string {
	const values = [invocation.command, ...invocation.prefixArgs, ...args];
	if (platform === 'win32') {
		return `& ${values.map(quotePowerShellArgument).join(' ')}`;
	}
	return values.map(quotePosixArgument).join(' ');
}
