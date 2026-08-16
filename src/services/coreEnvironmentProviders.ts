/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CoreEnvironment } from '../types/coreEnvironment';
import { getDefaultPlatformioExecutablePath } from './executableResolver';
import { CoreEnvironmentProvider } from './coreEnvironmentManager';
import { ManagedRuntimeService } from './managedRuntimeService';
import { createExecFilePromise } from './platformioProcess';
import { parsePlatformioCustomPath, resolvePlatformioInvocation } from './platformioInvocationResolver';

export interface ProviderCoreOptions {
	getCustomPath?: () => unknown;
	existsSync?: (filePath: string) => boolean;
	probe?: typeof createExecFilePromise;
	platform?: NodeJS.Platform;
	homeDir?: string;
	environment?: NodeJS.ProcessEnv;
}

export class ProviderCoreEnvironmentProvider implements CoreEnvironmentProvider {
	readonly id = 'provider' as const;
	private readonly existsSync: (filePath: string) => boolean;
	private readonly probe: typeof createExecFilePromise;
	private readonly platform: NodeJS.Platform;
	private readonly homeDir: string;
	private readonly environment: NodeJS.ProcessEnv;

	constructor(private readonly options: ProviderCoreOptions = {}) {
		this.existsSync = options.existsSync ?? fs.existsSync;
		this.probe = options.probe ?? createExecFilePromise;
		this.platform = options.platform ?? process.platform;
		this.homeDir = options.homeDir ?? os.homedir();
		this.environment = { ...(options.environment ?? process.env) };
	}

	async resolve(_workspaceUri: string): Promise<CoreEnvironment | null> {
		const resolution = await resolvePlatformioInvocation({
			existsSync: this.existsSync,
			probe: this.probe,
			customPathEntries: parsePlatformioCustomPath(this.options.getCustomPath?.(), this.platform),
			platform: this.platform,
			homeDir: this.homeDir,
			env: this.environment,
		});
		if (!resolution.invocation) {
			const lastFailure = resolution.failures.at(-1)?.error;
			if (lastFailure) {throw lastFailure;}
			return null;
		}
		const scriptsDirectory = path.dirname(resolution.invocation.command);
		const python = this.findTool(scriptsDirectory, 'python');
		const mpremote = this.findTool(scriptsDirectory, 'mpremote');
		return {
			id: 'provider',
			displaySource: 'PlatformIO provider runtime',
			invocation: {
				command: resolution.invocation.command,
				prefixArgs: resolution.invocation.prefixArgs,
				env: this.environment,
				source: 'provider',
			},
			pythonPath: python,
			mpremotePath: mpremote,
			storageRoot: path.dirname(path.dirname(scriptsDirectory)),
			health: {
				status: 'healthy',
				checkedAt: new Date().toISOString(),
				version: resolution.probeResult?.stdout.trim() || resolution.probeResult?.stderr.trim(),
				packageStatus: 'unknown',
				failureClass: null,
			},
		};
	}

	private findTool(directory: string, tool: 'python' | 'mpremote'): string | null {
		const names = this.platform === 'win32'
			? (tool === 'python' ? ['python.exe'] : ['mpremote.exe'])
			: (tool === 'python' ? ['python3', 'python'] : ['mpremote']);
		for (const name of names) {
			const candidate = path.join(directory, name);
			if (this.existsSync(candidate)) {return candidate;}
		}
		const fallback = getDefaultPlatformioExecutablePath(tool, this.platform, this.homeDir);
		return this.existsSync(fallback) ? fallback : null;
	}
}

export class ManagedCoreEnvironmentProvider implements CoreEnvironmentProvider {
	readonly id = 'managed' as const;

	constructor(private readonly service?: ManagedRuntimeService) {}

	async resolve(
		workspaceUri: string,
		options: { onProgress?: (progress: { stage: string; percent: number }) => void } = {}
	): Promise<CoreEnvironment | null> {
		if (!this.service) {return null;}
		await this.service.ensureReady({ onProgress: options.onProgress });
		return this.service.getCoreEnvironment(workspaceUri);
	}
}
