/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface ResolveExecutableOptions {
	candidatePaths?: string[];
	searchDirectories?: string[];
	executableNames: string[];
	existsSync?: (filePath: string) => boolean;
	env?: NodeJS.ProcessEnv;
	platform?: NodeJS.Platform;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
	const seen = new Set<string>();
	for (const value of values) {
		if (!value) {
			continue;
		}
		seen.add(value);
	}
	return [...seen];
}

function getExecutableExtensions(platform: NodeJS.Platform, env: NodeJS.ProcessEnv): string[] {
	if (platform !== 'win32') {
		return [''];
	}

	const rawPathext = env['PATHEXT'] ?? '.EXE;.CMD;.BAT;.COM';
	const extensions = rawPathext
		.split(';')
		.map(ext => ext.trim().toLowerCase())
		.filter(Boolean);

	return uniqueStrings(['', ...extensions]);
}

function expandExecutableNames(name: string, platform: NodeJS.Platform, env: NodeJS.ProcessEnv): string[] {
	if (path.extname(name)) {
		return [name];
	}

	return getExecutableExtensions(platform, env).map(ext => `${name}${ext}`);
}

export function getExecutableSearchDirectories(
	env: NodeJS.ProcessEnv = process.env,
	platform: NodeJS.Platform = process.platform
): string[] {
	const searchDirectories: string[] = [];
	const envPath = env['PATH'] ?? '';

	if (envPath) {
		searchDirectories.push(...envPath.split(path.delimiter).filter(Boolean));
	}

	if (platform === 'darwin') {
		searchDirectories.push('/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', path.join(os.homedir(), '.local', 'bin'));
	} else if (platform === 'linux') {
		searchDirectories.push('/usr/local/bin', '/usr/bin', '/bin', path.join(os.homedir(), '.local', 'bin'));
	} else if (platform === 'win32') {
		const localAppData = env['LOCALAPPDATA'];
		const programFiles = env['ProgramFiles'];
		const userProfile = env['USERPROFILE'];

		if (localAppData) {
			searchDirectories.push(path.join(localAppData, 'Programs', 'PlatformIO', 'penv', 'Scripts'));
		}
		if (programFiles) {
			searchDirectories.push(path.join(programFiles, 'PlatformIO', 'penv', 'Scripts'));
		}
		if (userProfile) {
			searchDirectories.push(path.join(userProfile, '.platformio', 'penv', 'Scripts'));
		}
	}

	return uniqueStrings(searchDirectories);
}

export function getExecutableDirectory(filePath: string | null | undefined): string | null {
	if (!filePath) {
		return null;
	}

	try {
		return path.dirname(fs.realpathSync(filePath));
	} catch {
		return path.dirname(filePath);
	}
}

export function resolveExecutable({
	candidatePaths = [],
	searchDirectories = [],
	executableNames,
	existsSync = fs.existsSync,
	env = process.env,
	platform = process.platform,
}: ResolveExecutableOptions): string | null {
	const resolvedCandidates: string[] = [...candidatePaths];
	const expandedExecutableNames = executableNames.flatMap(name => expandExecutableNames(name, platform, env));

	for (const directory of searchDirectories) {
		for (const executableName of expandedExecutableNames) {
			resolvedCandidates.push(path.join(directory, executableName));
		}
	}

	for (const candidate of uniqueStrings(resolvedCandidates)) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}

	return null;
}

export function getDefaultPlatformioExecutablePath(
	tool: 'pio' | 'python' | 'pip' | 'mpremote',
	platform: NodeJS.Platform = process.platform,
	homeDir: string = os.homedir()
): string {
	const scriptsDir = platform === 'win32'
		? path.join(homeDir, '.platformio', 'penv', 'Scripts')
		: path.join(homeDir, '.platformio', 'penv', 'bin');

	if (platform === 'win32') {
		return path.join(scriptsDir, `${tool}.exe`);
	}

	return path.join(scriptsDir, tool);
}