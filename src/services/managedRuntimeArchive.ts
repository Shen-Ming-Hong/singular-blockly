/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import * as tar from 'tar';
import { FileService } from './fileService';

const ALLOWED_ENTRY_TYPES = new Set(['File', 'OldFile', 'Directory', 'SymbolicLink']);

export class ManagedRuntimeArchiveError extends Error {
	constructor(public readonly code: string, message: string) {
		super(message);
		this.name = 'ManagedRuntimeArchiveError';
	}
}

export function validateRuntimeArchiveEntry(entryPath: string, type: string, size: number, linkPath?: string): string {
	if (/[\0-\x1f\x7f]/.test(entryPath) || path.posix.isAbsolute(entryPath) || path.win32.isAbsolute(entryPath)) {
		throw new ManagedRuntimeArchiveError('unsafe-entry-path', 'Runtime archive contains an unsafe absolute path');
	}
	const normalized = entryPath.replace(/\\/g, '/');
	const segments = normalized.split('/').filter(Boolean);
	if (segments.length === 0 || segments.some(segment => segment === '..' || segment === '.')) {
		throw new ManagedRuntimeArchiveError('unsafe-entry-path', 'Runtime archive contains a traversal path');
	}
	if (!ALLOWED_ENTRY_TYPES.has(type)) {
		throw new ManagedRuntimeArchiveError('unsupported-entry-type', `Runtime archive entry type is not supported: ${type}`);
	}
	if (!Number.isSafeInteger(size) || size < 0) {
		throw new ManagedRuntimeArchiveError('invalid-entry-size', 'Runtime archive entry has an invalid size');
	}
	const normalizedPath = segments.join('/');
	if (type === 'SymbolicLink') {
		resolveArchiveLinkTarget(normalizedPath, linkPath);
	}
	return normalizedPath;
}

function resolveArchiveLinkTarget(entryPath: string, linkPath: string | undefined): string {
	if (
		!linkPath ||
		/[\0-\x1f\x7f]/.test(linkPath) ||
		path.posix.isAbsolute(linkPath) ||
		path.win32.isAbsolute(linkPath)
	) {
		throw new ManagedRuntimeArchiveError('unsafe-link-target', 'Runtime archive contains an unsafe symbolic-link target');
	}
	const target = path.posix.normalize(path.posix.join(path.posix.dirname(entryPath), linkPath.replace(/\\/g, '/')));
	if (target === '..' || target.startsWith('../') || path.posix.isAbsolute(target)) {
		throw new ManagedRuntimeArchiveError('unsafe-link-target', 'Runtime archive symbolic link escapes the runtime root');
	}
	return target;
}

export async function extractManagedRuntimeArchive(
	archivePath: string,
	destinationPath: string,
	options: { maxEntries?: number; maxExpandedBytes?: number } = {}
): Promise<{ entryCount: number; expandedBytes: number }> {
	const destinationFiles = new FileService(path.dirname(destinationPath));
	const destinationName = path.basename(destinationPath);
	if (destinationFiles.fileExists(destinationName)) {
		throw new ManagedRuntimeArchiveError('destination-exists', 'Runtime staging destination must not already exist');
	}
	const maxEntries = options.maxEntries ?? 50_000;
	const maxExpandedBytes = options.maxExpandedBytes ?? 512 * 1024 * 1024;
	let entryCount = 0;
	let expandedBytes = 0;
	let preflightError: ManagedRuntimeArchiveError | undefined;
	const entryTypes = new Map<string, string>();
	const symbolicLinks: Array<{ entryPath: string; targetPath: string }> = [];

	try {
		await tar.list({
			file: archivePath,
			strict: true,
			onReadEntry: entry => {
				if (preflightError) {return;}
				try {
					const normalizedPath = validateRuntimeArchiveEntry(entry.path, entry.type, entry.size, entry.linkpath);
					entryTypes.set(normalizedPath, entry.type);
					if (entry.type === 'SymbolicLink') {
						symbolicLinks.push({ entryPath: normalizedPath, targetPath: resolveArchiveLinkTarget(normalizedPath, entry.linkpath) });
					}
					entryCount += 1;
					expandedBytes += entry.size;
					if (entryCount > maxEntries) {
						preflightError = new ManagedRuntimeArchiveError('too-many-entries', 'Runtime archive contains too many entries');
					}
					if (expandedBytes > maxExpandedBytes) {
						preflightError = new ManagedRuntimeArchiveError('archive-too-large', 'Runtime archive expands beyond the configured limit');
					}
				} catch (error) {
					preflightError = error instanceof ManagedRuntimeArchiveError
						? error
						: new ManagedRuntimeArchiveError('invalid-archive', 'Runtime archive preflight failed');
				}
			},
		});
		if (preflightError) {throw preflightError;}
		for (const link of symbolicLinks) {
			if (!['File', 'OldFile'].includes(entryTypes.get(link.targetPath) ?? '')) {
				throw new ManagedRuntimeArchiveError(
					'unsafe-link-target',
					`Runtime archive symbolic link does not target a regular archive file: ${link.entryPath}`
				);
			}
		}
		await destinationFiles.createDirectory(destinationName);
		await tar.extract({
			file: archivePath,
			cwd: destinationPath,
			strict: true,
			preservePaths: false,
			filter: (entryPath, entry) => {
				if (!('type' in entry)) {
					throw new ManagedRuntimeArchiveError('unsupported-entry-type', 'Runtime archive entry metadata is incomplete');
				}
				validateRuntimeArchiveEntry(entryPath, entry.type, entry.size, entry.linkpath);
				return entry.type !== 'SymbolicLink';
			},
		});
		return { entryCount, expandedBytes };
	} catch (error) {
		if (destinationFiles.fileExists(destinationName)) {
			await destinationFiles.deleteDirectory(destinationName);
		}
		if (error instanceof ManagedRuntimeArchiveError) {throw error;}
		throw new ManagedRuntimeArchiveError('invalid-archive', error instanceof Error ? error.message : 'Runtime archive extraction failed');
	}
}
