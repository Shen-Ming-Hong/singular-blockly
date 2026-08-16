/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
	ManagedRuntimeManifestError,
	assertAllowedRuntimeUrl,
	parseRuntimeManifest,
	selectRuntimeArtifact,
	sha256,
} from '../../services/managedRuntimeManifest';

suite('ManagedRuntime Manifest', () => {
	const manifestPath = path.join(process.env.SINGULAR_BLOCKLY_TEST_ROOT || process.cwd(), 'resources', 'managed-runtime', 'runtime-manifest.json');
	const manifestText = fs.readFileSync(manifestPath, 'utf8');

	test('parses the committed manifest and selects only stable targets by default', () => {
		const manifest = parseRuntimeManifest(manifestText);

		assert.strictEqual(manifest.pythonVersion, '3.11.16');
		assert.strictEqual(selectRuntimeArtifact(manifest, 'linux', 'x64', { libc: 'glibc' })?.support, 'stable');
		assert.strictEqual(selectRuntimeArtifact(manifest, 'linux', 'arm64', { libc: 'glibc' }), null);
		assert.strictEqual(
			selectRuntimeArtifact(manifest, 'linux', 'arm64', { libc: 'glibc', allowReleaseCandidate: true })?.support,
			'release-candidate'
		);
	});

	test('rejects Linux targets when the runtime is not glibc', () => {
		const manifest = parseRuntimeManifest(manifestText);
		assert.strictEqual(selectRuntimeArtifact(manifest, 'linux', 'x64', { libc: 'musl' }), null);
		assert.strictEqual(selectRuntimeArtifact(manifest, 'linux', 'x64'), null);
	});

	test('rejects untrusted or credentialed download URLs', () => {
		assert.throws(() => assertAllowedRuntimeUrl('http://github.com/runtime.tgz'), ManagedRuntimeManifestError);
		assert.throws(() => assertAllowedRuntimeUrl('https://attacker.invalid/runtime.tgz'), ManagedRuntimeManifestError);
		assert.throws(() => assertAllowedRuntimeUrl('https://token@github.com/runtime.tgz'), ManagedRuntimeManifestError);
	});

	test('rejects duplicate targets and unsafe executable paths', () => {
		const raw = JSON.parse(manifestText);
		raw.artifacts.push({ ...raw.artifacts[0], id: 'duplicate' });
		assert.throws(() => parseRuntimeManifest(raw), (error: unknown) =>
			error instanceof ManagedRuntimeManifestError && error.code === 'duplicate-artifact');

		const unsafe = JSON.parse(manifestText);
		unsafe.artifacts[0].pythonRelativePath = '../python';
		assert.throws(() => parseRuntimeManifest(unsafe), (error: unknown) =>
			error instanceof ManagedRuntimeManifestError && error.code === 'unsafe-python-path');
	});

	test('rejects an ambiguous PlatformIO tested version range', () => {
		const unsafe = JSON.parse(manifestText);
		unsafe.platformio.testedVersionRange = '^6.1.0';
		assert.throws(() => parseRuntimeManifest(unsafe), (error: unknown) =>
			error instanceof ManagedRuntimeManifestError && error.code === 'invalid-platformio-range');
	});

	test('computes a deterministic SHA-256 without exposing input', () => {
		assert.strictEqual(sha256('managed-runtime'), 'aa00448c42dae53c1b51bdb80dc80302fac413e57864a69e83e73c15ec79c644');
	});
});
