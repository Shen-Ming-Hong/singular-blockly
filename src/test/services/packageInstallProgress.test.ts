/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as path from 'path';
import {
	PACKAGE_PROGRESS_CAP,
	PackageInstallProgressTracker,
	ProgressFileSystem,
	computePackagePercent,
	resolvePlatformioDirectories,
} from '../../services/packageInstallProgress';

/** In-memory tree: file path → size. Directories are implied by file paths. */
function fakeFileSystem(files: Record<string, number>, failing = new Set<string>()): ProgressFileSystem {
	return {
		readdir: async dir => {
			if (failing.has(dir)) {throw new Error('EACCES');}
			const prefix = dir + path.sep;
			const names = Object.keys(files).filter(file => file.startsWith(prefix)).map(file => file.slice(prefix.length).split(path.sep)[0]);
			if (names.length === 0) {throw new Error('ENOENT');}
			return [...new Set(names)];
		},
		lstat: async target => ({ size: files[target] ?? 0, isDirectory: () => !(target in files), isSymbolicLink: () => false }),
	};
}

suite('packageInstallProgress (spec 076)', () => {
	const root = path.join(path.sep, 'pio');
	const dirs = resolvePlatformioDirectories({ PLATFORMIO_CORE_DIR: root }, '/home/x');

	test('resolves PlatformIO directories from environment overrides', () => {
		assert.deepStrictEqual(dirs, {
			downloads: path.join(root, '.cache', 'downloads'),
			tmp: path.join(root, '.cache', 'tmp'),
			packages: path.join(root, 'packages'),
			platforms: path.join(root, 'platforms'),
		});
		const work = resolvePlatformioDirectories({
			PLATFORMIO_CORE_DIR: root,
			PLATFORMIO_CACHE_DIR: path.join(path.sep, 'w', 'cache'),
			PLATFORMIO_PACKAGES_DIR: path.join(path.sep, 'w', 'packages'),
			PLATFORMIO_PLATFORMS_DIR: path.join(path.sep, 'w', 'platforms'),
		});
		assert.strictEqual(work.downloads, path.join(path.sep, 'w', 'cache', 'downloads'));
		assert.strictEqual(work.packages, path.join(path.sep, 'w', 'packages'));
		assert.strictEqual(resolvePlatformioDirectories({}, '/home/x').packages, path.join('/home/x', '.platformio', 'packages'));
	});

	test('computes a capped percent and stays indeterminate without an estimate', () => {
		assert.strictEqual(computePackagePercent(50, 100), 50);
		assert.strictEqual(computePackagePercent(500, 100), PACKAGE_PROGRESS_CAP);
		assert.strictEqual(computePackagePercent(50, undefined), null);
		assert.strictEqual(computePackagePercent(0, 100), null);
	});

	test('reports nothing until PlatformIO starts installing, then follows download and unpack lines', () => {
		const tracker = new PackageInstallProgressTracker(dirs, 100, fakeFileSystem({}));
		assert.strictEqual(tracker.snapshot(), null);
		assert.strictEqual(tracker.observeOutput('Resolving esp32 dependencies...\n'), false);
		assert.strictEqual(tracker.observeOutput('Tool Manager: Installing platformio/tool @ 1.0\nDownloading 0% 10%'), true);
		assert.strictEqual(tracker.snapshot()?.phase, 'download');
		assert.strictEqual(tracker.observeOutput('Unpacking 0% 10%\n'), true);
		assert.strictEqual(tracker.snapshot()?.phase, 'install');
		assert.strictEqual(tracker.observeOutput('  Downloading six-1.17.0.whl (pip, indented)\n'), false, 'Indented pip lines do not switch phase');
	});

	test('counts only new entries, keeps temp peaks after cleanup, and never goes backwards', async () => {
		const files: Record<string, number> = {
			[path.join(dirs.packages, 'old-toolchain', 'bin')]: 5_000,
			[path.join(dirs.downloads, 'old.tar.gz')]: 7_000,
		};
		const tracker = new PackageInstallProgressTracker(dirs, 1_000, fakeFileSystem(files));
		await tracker.start();
		tracker.observeOutput('Tool Manager: Installing platformio/framework @ 1.0\n');

		files[path.join(dirs.downloads, 'new.tar.gz')] = 200;
		assert.strictEqual(await tracker.sample(), 200);
		files[path.join(dirs.tmp, 'pkg-installing-x', 'a', 'b.c')] = 300;
		assert.strictEqual(await tracker.sample(), 500);
		delete files[path.join(dirs.tmp, 'pkg-installing-x', 'a', 'b.c')];
		files[path.join(dirs.packages, 'framework', 'b.c')] = 300;
		assert.strictEqual(await tracker.sample(), 800, 'Temp peak stays counted after the copy');
		delete files[path.join(dirs.downloads, 'new.tar.gz')];
		assert.strictEqual(await tracker.sample(), 800, 'Measured bytes never decrease');
		assert.deepStrictEqual(tracker.snapshot(), { phase: 'download', percent: 80 });
	});

	test('ignores unreadable folders instead of failing the upload', async () => {
		const tracker = new PackageInstallProgressTracker(dirs, 1_000, fakeFileSystem({}, new Set([dirs.packages, dirs.tmp])));
		await tracker.start();
		tracker.observeOutput('Platform Manager: Installing platformio/espressif32 @ 7.0.1\n');
		assert.strictEqual(await tracker.sample(), 0);
		assert.deepStrictEqual(tracker.snapshot(), { phase: 'download', percent: null });
	});
});
