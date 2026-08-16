/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';
import * as path from 'path';
import {
	ManagedRuntimeArch,
	ManagedRuntimePlatform,
	RuntimeArtifact,
	RuntimeDownload,
	RuntimeManifest,
} from '../types/managedRuntime';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const TESTED_VERSION_RANGE_PATTERN = /^>=\d+\.\d+\.\d+ <\d+\.\d+\.\d+$/;
const SAFE_TOKEN_PATTERN = /^[A-Za-z0-9._+-]+$/;
const ALLOWED_DOWNLOAD_HOSTS = new Set([
	'github.com',
	'raw.githubusercontent.com',
	'objects.githubusercontent.com',
	'release-assets.githubusercontent.com',
]);

export class ManagedRuntimeManifestError extends Error {
	constructor(public readonly code: string, message: string) {
		super(message);
		this.name = 'ManagedRuntimeManifestError';
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	if (typeof value !== 'string' || value.length === 0) {
		throw new ManagedRuntimeManifestError('invalid-field', `${key} must be a non-empty string`);
	}
	return value;
}

function requirePositiveInteger(record: Record<string, unknown>, key: string): number {
	const value = record[key];
	if (!Number.isSafeInteger(value) || (value as number) <= 0) {
		throw new ManagedRuntimeManifestError('invalid-field', `${key} must be a positive integer`);
	}
	return value as number;
}

export function assertAllowedRuntimeUrl(value: string): URL {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new ManagedRuntimeManifestError('invalid-url', 'Runtime download URL is invalid');
	}
	if (url.protocol !== 'https:' || !ALLOWED_DOWNLOAD_HOSTS.has(url.hostname)) {
		throw new ManagedRuntimeManifestError('untrusted-url', `Runtime download host is not allowed: ${url.hostname}`);
	}
	if (url.username || url.password) {
		throw new ManagedRuntimeManifestError('credentialed-url', 'Runtime download URLs must not include credentials');
	}
	return url;
}

function parseDownload(value: unknown, label: string): RuntimeDownload {
	if (!isRecord(value)) {
		throw new ManagedRuntimeManifestError('invalid-download', `${label} must be an object`);
	}
	const url = requireString(value, 'url');
	assertAllowedRuntimeUrl(url);
	const sha256 = requireString(value, 'sha256');
	if (!SHA256_PATTERN.test(sha256)) {
		throw new ManagedRuntimeManifestError('invalid-checksum', `${label} has an invalid SHA-256`);
	}
	return {
		url,
		sha256,
		size: requirePositiveInteger(value, 'size'),
		license: requireString(value, 'license'),
		source: requireString(value, 'source'),
	};
}

function parseArtifact(value: unknown): RuntimeArtifact {
	if (!isRecord(value)) {
		throw new ManagedRuntimeManifestError('invalid-artifact', 'Runtime artifact must be an object');
	}
	const id = requireString(value, 'id');
	if (!SAFE_TOKEN_PATTERN.test(id)) {
		throw new ManagedRuntimeManifestError('unsafe-artifact-id', `Unsafe runtime artifact id: ${id}`);
	}
	const platform = requireString(value, 'platform');
	const arch = requireString(value, 'arch');
	const support = requireString(value, 'support');
	if (!['win32', 'darwin', 'linux'].includes(platform)) {
		throw new ManagedRuntimeManifestError('unsupported-platform', `Unsupported platform: ${platform}`);
	}
	if (!['x64', 'arm64'].includes(arch)) {
		throw new ManagedRuntimeManifestError('unsupported-arch', `Unsupported architecture: ${arch}`);
	}
	if (!['stable', 'release-candidate'].includes(support)) {
		throw new ManagedRuntimeManifestError('invalid-support', `Invalid support status: ${support}`);
	}
	const libc = value.libc;
	if ((platform === 'linux' && libc !== 'glibc') || (platform !== 'linux' && libc !== null)) {
		throw new ManagedRuntimeManifestError('invalid-libc', 'Runtime artifact libc does not match its platform');
	}
	if (value.archiveFormat !== 'tar.gz') {
		throw new ManagedRuntimeManifestError('unsupported-archive', 'Only tar.gz runtime artifacts are supported');
	}
	const pythonRelativePath = requireString(value, 'pythonRelativePath');
	if (
		path.posix.isAbsolute(pythonRelativePath) ||
		path.win32.isAbsolute(pythonRelativePath) ||
		pythonRelativePath.split(/[\\/]+/).some(segment => segment === '..' || segment === '')
	) {
		throw new ManagedRuntimeManifestError('unsafe-python-path', 'Python executable path must be a safe relative path');
	}

	return {
		...parseDownload(value, id),
		id,
		platform: platform as ManagedRuntimePlatform,
		arch: arch as ManagedRuntimeArch,
		libc: libc as 'glibc' | null,
		support: support as RuntimeArtifact['support'],
		archiveFormat: 'tar.gz',
		pythonRelativePath,
	};
}

export function parseRuntimeManifest(input: string | Buffer | unknown): RuntimeManifest {
	let value: unknown = input;
	if (typeof input === 'string' || Buffer.isBuffer(input)) {
		try {
			value = JSON.parse(input.toString());
		} catch {
			throw new ManagedRuntimeManifestError('invalid-json', 'Managed runtime manifest is not valid JSON');
		}
	}
	if (!isRecord(value) || value.schemaVersion !== 1) {
		throw new ManagedRuntimeManifestError('unsupported-schema', 'Unsupported managed runtime manifest schema');
	}
	const runtimeVersion = requireString(value, 'runtimeVersion');
	const pythonVersion = requireString(value, 'pythonVersion');
	const mpremoteVersion = requireString(value, 'mpremoteVersion');
	if (!SAFE_TOKEN_PATTERN.test(runtimeVersion) || !/^3\.11\.\d+$/.test(pythonVersion) || !VERSION_PATTERN.test(mpremoteVersion)) {
		throw new ManagedRuntimeManifestError('invalid-version', 'Runtime dependency versions must be exact and safe');
	}
	if (!isRecord(value.platformio) || value.platformio.channel !== 'stable') {
		throw new ManagedRuntimeManifestError('invalid-platformio', 'PlatformIO configuration must use the stable channel');
	}
	const testedVersionRange = requireString(value.platformio, 'testedVersionRange');
	if (!TESTED_VERSION_RANGE_PATTERN.test(testedVersionRange)) {
		throw new ManagedRuntimeManifestError('invalid-platformio-range', 'PlatformIO tested version range must use exact inclusive/exclusive bounds');
	}
	if (!isRecord(value.platformPackages)) {
		throw new ManagedRuntimeManifestError('invalid-platform-packages', 'Platform packages must be an object');
	}
	const platformPackages: Record<string, string> = {};
	for (const [name, spec] of Object.entries(value.platformPackages)) {
		if (!/^[a-z0-9_-]+$/.test(name) || typeof spec !== 'string' || !/^[a-z0-9_-]+\/[a-z0-9_-]+@\d+\.\d+\.\d+$/.test(spec)) {
			throw new ManagedRuntimeManifestError('unpinned-platform-package', `Platform package ${name} is not pinned`);
		}
		platformPackages[name] = spec;
	}
	if (!Array.isArray(value.artifacts) || value.artifacts.length === 0) {
		throw new ManagedRuntimeManifestError('missing-artifacts', 'Managed runtime manifest has no artifacts');
	}
	const artifacts = value.artifacts.map(parseArtifact);
	const targets = new Set<string>();
	for (const artifact of artifacts) {
		const target = `${artifact.platform}-${artifact.arch}`;
		if (targets.has(target)) {
			throw new ManagedRuntimeManifestError('duplicate-artifact', `Duplicate runtime target: ${target}`);
		}
		targets.add(target);
	}

	return {
		schemaVersion: 1,
		runtimeVersion,
		pythonVersion,
		installer: parseDownload(value.installer, 'installer'),
		platformio: {
			channel: 'stable',
			testedVersionRange,
		},
		mpremoteVersion,
		platformPackages,
		artifacts,
	};
}

export function selectRuntimeArtifact(
	manifest: RuntimeManifest,
	platform: NodeJS.Platform,
	arch: string,
	options: { allowReleaseCandidate?: boolean; libc?: string | null } = {}
): RuntimeArtifact | null {
	if (!['win32', 'darwin', 'linux'].includes(platform) || !['x64', 'arm64'].includes(arch)) {
		return null;
	}
	const artifact = manifest.artifacts.find(candidate => candidate.platform === platform && candidate.arch === arch);
	if (!artifact || (artifact.support !== 'stable' && !options.allowReleaseCandidate)) {
		return null;
	}
	if (platform === 'linux' && options.libc !== 'glibc') {
		return null;
	}
	return artifact;
}

export function sha256(content: string | Buffer | Uint8Array): string {
	return createHash('sha256').update(content).digest('hex');
}
