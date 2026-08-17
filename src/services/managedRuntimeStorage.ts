/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';
import * as path from 'path';
import { FileService } from './fileService';
import { ManagedRuntimeLayout } from '../types/managedRuntime';

const ROOT_OWNERSHIP_MARKER = '.singular-managed-runtime-root.json';
const ROOT_OWNER = 'singular-blockly-managed-runtime';

export class ManagedRuntimeStorageError extends Error {
	constructor(public readonly code: string, message: string) {
		super(message);
		this.name = 'ManagedRuntimeStorageError';
	}
}

function pathApi(platform: NodeJS.Platform): typeof path.posix | typeof path.win32 {
	return platform === 'win32' ? path.win32 : path.posix;
}

export function resolveManagedRuntimeRoot(
	globalStoragePath: string,
	customPath: string | undefined,
	platform: NodeJS.Platform = process.platform
): string {
	const api = pathApi(platform);
	const candidate = customPath?.trim() || api.join(globalStoragePath, 'runtime-v1');
	if (candidate.includes('\0') || !api.isAbsolute(candidate)) {
		throw new ManagedRuntimeStorageError('path-not-absolute', 'Managed runtime storage must be an absolute local path');
	}
	const normalized = api.resolve(candidate);
	if (normalized === api.parse(normalized).root) {
		throw new ManagedRuntimeStorageError('root-path-not-allowed', 'A file-system root cannot be used for managed runtime storage');
	}
	if (platform === 'win32' && (/^\\\\/.test(normalized) || /^\\\\\?\\UNC\\/i.test(normalized))) {
		throw new ManagedRuntimeStorageError('network-path-not-supported', 'UNC and network paths are not supported');
	}
	return normalized;
}

export function createManagedRuntimeLayout(root: string, platform: NodeJS.Platform = process.platform): ManagedRuntimeLayout {
	const api = pathApi(platform);
	return {
		root,
		downloads: api.join(root, 'downloads'),
		staging: api.join(root, 'staging'),
		versions: api.join(root, 'versions'),
		currentRecord: api.join(root, 'current.json'),
		installLock: api.join(root, 'locks', 'install.lock'),
		workspaces: api.join(root, 'workspaces'),
	};
}

export function createWorkspaceStorageKey(workspaceUri: string): string {
	return createHash('sha256').update(workspaceUri.normalize('NFC')).digest('hex');
}

export function assertManagedDescendant(root: string, target: string, platform: NodeJS.Platform = process.platform): string {
	const api = pathApi(platform);
	const normalizedRoot = api.resolve(root);
	const normalizedTarget = api.resolve(target);
	const relative = api.relative(normalizedRoot, normalizedTarget);
	if (!relative || relative.startsWith('..') || api.isAbsolute(relative)) {
		throw new ManagedRuntimeStorageError('path-outside-managed-root', 'Target is not a managed runtime descendant');
	}
	return normalizedTarget;
}

export class ManagedRuntimeStorage {
	readonly layout: ManagedRuntimeLayout;
	readonly files: FileService;

	constructor(root: string, platform: NodeJS.Platform = process.platform) {
		this.layout = createManagedRuntimeLayout(root, platform);
		this.files = new FileService(root);
	}

	async initialize(): Promise<void> {
		await this.files.validateRootPathSafety();
		await this.ensureOwnedRoot();
		await this.files.validateWritableRoot();
		for (const directory of ['downloads', 'staging', 'versions', 'locks', 'workspaces']) {
			await this.files.createDirectory(directory);
		}
	}

	workspaceRoot(workspaceUri: string): string {
		return this.files.resolveSafePath(path.join('workspaces', createWorkspaceStorageKey(workspaceUri)));
	}

	async isOwnedRoot(): Promise<boolean> {
		if (!this.files.fileExists(ROOT_OWNERSHIP_MARKER)) {return false;}
		const raw = await this.files.readFile(ROOT_OWNERSHIP_MARKER);
		try {
			const marker = JSON.parse(raw) as { schemaVersion?: unknown; owner?: unknown };
			return marker.schemaVersion === 1 && marker.owner === ROOT_OWNER;
		} catch {
			return false;
		}
	}

	private async ensureOwnedRoot(): Promise<void> {
		const expectedMarker = {
			schemaVersion: 1,
			owner: ROOT_OWNER,
		};
		if (!this.files.fileExists(ROOT_OWNERSHIP_MARKER)) {
			const entries = await this.files.listFiles('.');
			if (entries.length > 0) {
				throw new ManagedRuntimeStorageError(
					'unowned-root-not-empty',
					'Managed runtime storage must be empty before Singular can claim ownership'
				);
			}
			await this.files.createExclusiveFile(ROOT_OWNERSHIP_MARKER, `${JSON.stringify(expectedMarker, null, 2)}\n`);
		}

		if (!await this.isOwnedRoot()) {
			throw new ManagedRuntimeStorageError('invalid-root-owner', 'Managed runtime storage is not owned by Singular Blockly');
		}
	}
}
