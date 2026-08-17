/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { FileService } from './fileService';
import { ManagedRuntimeDownloader } from './managedRuntimeDownloader';
import { ManagedRuntimeInstaller } from './managedRuntimeInstaller';
import { parseRuntimeManifest, sha256 } from './managedRuntimeManifest';
import { createManagedRuntimeFetch } from './managedRuntimeProxy';
import { ManagedRuntimeService } from './managedRuntimeService';
import { ManagedRuntimeStorage, resolveManagedRuntimeRoot } from './managedRuntimeStorage';

const MANIFEST_RELATIVE_PATH = path.join('dist', 'managed-runtime', 'runtime-manifest.json');

export interface ManagedRuntimeContext {
	extensionPath: string;
	globalStorageUri: { fsPath: string };
}

export async function createManagedRuntimeService(
	context: ManagedRuntimeContext,
	options: {
		configuration?: typeof vscode.workspace.getConfiguration;
		fetcher?: typeof fetch;
		platform?: NodeJS.Platform;
		arch?: string;
		libc?: string | null;
		allowReleaseCandidate?: boolean;
	} = {}
): Promise<ManagedRuntimeService> {
	const extensionFiles = new FileService(context.extensionPath);
	const manifestSource = await extensionFiles.readFile(MANIFEST_RELATIVE_PATH);
	const manifest = parseRuntimeManifest(manifestSource);
	const getConfiguration = options.configuration ?? vscode.workspace.getConfiguration.bind(vscode.workspace);
	const runtimeConfiguration = getConfiguration('singularBlockly.managedRuntime');
	const customPath = runtimeConfiguration.get<string>('path');
	const root = resolveManagedRuntimeRoot(context.globalStorageUri.fsPath, customPath, options.platform);
	const storage = new ManagedRuntimeStorage(root, options.platform);
	const httpConfiguration = (): ReturnType<typeof createHttpProxyConfiguration> =>
		createHttpProxyConfiguration(getConfiguration('http'));
	const fetcher = options.fetcher ?? createManagedRuntimeFetch(httpConfiguration);
	const downloader = new ManagedRuntimeDownloader(storage.files, { fetcher });
	const installer = new ManagedRuntimeInstaller({
		storage,
		manifest,
		manifestSha256: sha256(manifestSource),
		downloader,
	});
	return new ManagedRuntimeService({
		storage,
		manifest,
		manifestSha256: sha256(manifestSource),
		installer,
		platform: options.platform,
		arch: options.arch,
		libc: options.libc,
		// ARM artifacts are published only after the mandatory release-candidate
		// matrix succeeds. The low-level service remains fail-closed by default.
		allowReleaseCandidate: options.allowReleaseCandidate ?? true,
	});
}

function createHttpProxyConfiguration(configuration: vscode.WorkspaceConfiguration): {
	proxy?: string;
	proxySupport?: string;
	noProxy?: readonly string[];
} {
	const noProxy = configuration.get<unknown>('noProxy');
	return {
		proxy: configuration.get<string>('proxy'),
		proxySupport: configuration.get<string>('proxySupport'),
		noProxy: Array.isArray(noProxy) ? noProxy.filter((value): value is string => typeof value === 'string') : undefined,
	};
}
