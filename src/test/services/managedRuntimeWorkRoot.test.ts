/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ManagedRuntimeStorage } from '../../services/managedRuntimeStorage';
import {
	checkWorkRootBudget,
	WORK_ROOT_MAX_LENGTH,
	createIcaclsArguments,
	createProjectKey,
	createWorkRootLayout,
	isShortPathEligible,
	listWorkRootCandidates,
	parseWhoamiSid,
	PlatformioWorkRootService,
	WorkRootFileSystem,
} from '../../services/managedRuntimeWorkRoot';

const SID = 'S-1-5-21-1004336348-1177238915-682003330-1001';

/** In-memory Windows-style file system for work-root decisions. */
class FakeWindowsFileSystem implements WorkRootFileSystem {
	readonly directories = new Set<string>();
	readonly files = new Map<string, string>();
	failMkdir = new Set<string>();
	readonly inodes = new Map<string, number>();

	constructor(existing: readonly string[] = []) {
		for (const directory of existing) {this.directories.add(this.key(directory));}
	}

	key(target: string): string {
		return path.win32.normalize(target).toLowerCase();
	}

	existsSync(target: string): boolean {
		const key = this.key(target);
		return this.directories.has(key) || this.files.has(key);
	}

	readonly promises = {
		mkdir: async (target: string, options?: { recursive?: boolean }): Promise<void> => {
			const key = this.key(target);
			if (this.failMkdir.has(key)) {throw Object.assign(new Error('denied'), { code: 'EPERM' });}
			if (this.directories.has(key)) {
				if (options?.recursive) {return;}
				throw Object.assign(new Error('exists'), { code: 'EEXIST' });
			}
			const parent = this.key(path.win32.dirname(target));
			if (!options?.recursive && !this.directories.has(parent)) {
				throw Object.assign(new Error('missing parent'), { code: 'ENOENT' });
			}
			let current = target;
			while (options?.recursive && !this.directories.has(this.key(current))) {
				this.directories.add(this.key(current));
				const next = path.win32.dirname(current);
				if (next === current) {break;}
				current = next;
			}
			this.directories.add(key);
		},
		readFile: async (target: string): Promise<string> => {
			const value = this.files.get(this.key(target));
			if (value === undefined) {throw Object.assign(new Error('missing'), { code: 'ENOENT' });}
			return value;
		},
		writeFile: async (target: string, content: string, options?: { flag?: string }): Promise<void> => {
			const key = this.key(target);
			if (options?.flag === 'wx' && this.files.has(key)) {throw Object.assign(new Error('exists'), { code: 'EEXIST' });}
			this.files.set(key, content);
		},
		lstat: async (target: string): Promise<fs.Stats> => {
			if (!this.directories.has(this.key(target))) {throw Object.assign(new Error('missing'), { code: 'ENOENT' });}
			const ino = this.inodes.get(this.key(target)) ?? 1;
			return { isSymbolicLink: () => false, isDirectory: () => true, ino } as fs.Stats;
		},
		readdir: async (target: string): Promise<string[]> => {
			const prefix = `${this.key(target)}\\`;
			return [...this.directories, ...this.files.keys()]
				.filter(entry => entry.startsWith(prefix) && !entry.slice(prefix.length).includes('\\'))
				.map(entry => entry.slice(prefix.length));
		},
		rmdir: async (target: string): Promise<void> => {
			this.directories.delete(this.key(target));
		},
	};
}

suite('ManagedRuntime Windows work root', () => {
	let tempRoot: string;
	let storage: ManagedRuntimeStorage;

	setup(async () => {
		tempRoot = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'work-root-'));
		storage = new ManagedRuntimeStorage(path.join(tempRoot, 'runtime'));
		await storage.initialize();
	});

	teardown(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

	function env(userName = 'ray'): NodeJS.ProcessEnv {
		return {
			LOCALAPPDATA: `C:\\Users\\${userName}\\AppData\\Local`,
			SystemDrive: 'C:',
			SystemRoot: 'C:\\Windows',
		};
	}

	function createService(options: {
		fileSystem: FakeWindowsFileSystem;
		env?: NodeJS.ProcessEnv;
		custom?: boolean;
		commands?: Array<{ file: string; args: readonly string[] }>;
		failIcacls?: boolean;
		onIcacls?: (target: string) => void;
		random?: string[];
	}): PlatformioWorkRootService {
		const random = [...(options.random ?? [])];
		let counter = 0;
		return new PlatformioWorkRootService({
			storage,
			customManagedRoot: options.custom ?? false,
			env: options.env ?? env(),
			platform: 'win32',
			fileSystem: options.fileSystem,
			randomHex: bytes => random.shift() ?? (counter++).toString(16).padStart(bytes * 2, '0'),
			runCommand: async (file, args) => {
				options.commands?.push({ file, args });
				if (file.endsWith('whoami.exe')) {return { stdout: `"pc\\ray","${SID}"\r\n` };}
				if (options.failIcacls) {throw new Error('icacls failed');}
				options.onIcacls?.(String(args[0]));
				return { stdout: 'processed 1 files' };
			},
			sleep: async () => undefined,
		});
	}

	test('lists custom, local app data, and system drive candidates in order', () => {
		assert.deepStrictEqual(listWorkRootCandidates({
			platform: 'win32', managedRoot: 'D:\\SB', customManagedRoot: true, env: env(),
		}), [{ kind: 'custom', path: 'D:\\SB\\pio' }]);
		assert.deepStrictEqual(listWorkRootCandidates({
			platform: 'win32', managedRoot: 'C:\\x', customManagedRoot: false, env: env(),
		}).map(candidate => candidate.kind), ['local-app-data', 'system-drive']);
		assert.deepStrictEqual(listWorkRootCandidates({
			platform: 'linux', managedRoot: '/tmp/x', customManagedRoot: false, env: env(),
		}), []);
	});

	test('rejects non-ASCII, relative, UNC, and drive-root paths', () => {
		assert.strictEqual(isShortPathEligible('C:\\Users\\ray\\AppData\\Local\\SingularBlockly\\pio'), true);
		assert.strictEqual(isShortPathEligible('C:\\Users\\學生\\AppData\\Local\\SingularBlockly\\pio'), false);
		assert.strictEqual(isShortPathEligible('relative\\pio'), false);
		assert.strictEqual(isShortPathEligible('\\\\server\\share\\pio'), false);
		assert.strictEqual(isShortPathEligible('C:\\'), false);
	});

	test('local app data fits user names up to 13 characters so ESP32 command lines stay under the Windows limit', () => {
		const root = (name: string) => `C:\\Users\\${name}\\AppData\\Local\\SingularBlockly\\pio`;
		for (const length of [1, 9, 13]) {
			assert.strictEqual(checkWorkRootBudget(root('u'.repeat(length))).ok, true, `length ${length}`);
		}
		assert.strictEqual(root('u'.repeat(13)).length, WORK_ROOT_MAX_LENGTH);
		for (const length of [14, 20, 45]) {
			assert.strictEqual(checkWorkRootBudget(root('u'.repeat(length))).ok, false, `length ${length}`);
		}
		assert.strictEqual(checkWorkRootBudget(root('student.SCHOOL-DOMAIN')).ok, false);
		assert.strictEqual(checkWorkRootBudget('C:\\SingularBlockly-0a1b2c3d').ok, true);
	});

	test('project keys are 16 hex characters and stable across NFC forms', () => {
		const key = createProjectKey('file:///C:/Users/ray/Café');
		assert.match(key, /^[0-9a-f]{16}$/);
		assert.strictEqual(createProjectKey('file:///C:/Users/ray/Cafe\u0301'), key);
		const layout = createWorkRootLayout('C:\\SB', 'file:///p');
		assert.strictEqual(layout.packages, 'C:\\SB\\packages');
		assert.strictEqual(layout.build, `C:\\SB\\w\\${createProjectKey('file:///p')}\\build`);
	});

	test('parses whoami SID output and builds icacls arguments without a shell', () => {
		assert.strictEqual(parseWhoamiSid(`"pc\\ray","${SID}"\r\n`), SID);
		assert.strictEqual(parseWhoamiSid('"pc\\ray","not-a-sid"'), null);
		assert.deepStrictEqual(createIcaclsArguments('C:\\SingularBlockly-0a1b2c3d', SID), [
			'C:\\SingularBlockly-0a1b2c3d', '/inheritance:r', '/grant:r',
			`*${SID}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F',
		]);
		assert.throws(() => createIcaclsArguments('C:\\x', 'S-1-5-21 & calc'), /SID/);
	});

	test('creates the local app data work root first and reuses the verified record', async () => {
		const fileSystem = new FakeWindowsFileSystem(['C:\\', 'C:\\Users\\ray\\AppData\\Local']);
		const commands: Array<{ file: string; args: readonly string[] }> = [];
		const service = createService({ fileSystem, commands });
		const first = await service.resolve();
		assert.deepStrictEqual(first, { kind: 'local-app-data', root: 'C:\\Users\\ray\\AppData\\Local\\SingularBlockly\\pio' });
		assert.strictEqual(commands.length, 0, 'per-user app data does not need ACL changes');
		assert.deepStrictEqual(await createService({ fileSystem }).resolve(), first);
		assert.deepStrictEqual(await service.current(), first);
	});

	test('falls back to a hardened system drive folder for a non-ASCII profile', async () => {
		const fileSystem = new FakeWindowsFileSystem(['C:\\']);
		const commands: Array<{ file: string; args: readonly string[] }> = [];
		const service = createService({ fileSystem, env: env('學生'), commands, random: ['0a1b2c3d'] });
		const selected = await service.resolve();
		assert.deepStrictEqual(selected, { kind: 'system-drive', root: 'C:\\SingularBlockly-0a1b2c3d' });
		assert.deepStrictEqual(commands.map(command => path.win32.basename(command.file)), ['whoami.exe', 'icacls.exe']);
		assert.deepStrictEqual(commands[1].args, createIcaclsArguments(selected.root, SID));
	});

	test('never adopts an existing folder without a matching marker', async () => {
		const target = 'C:\\Users\\ray\\AppData\\Local\\SingularBlockly\\pio';
		const fileSystem = new FakeWindowsFileSystem(['C:\\', 'C:\\Users\\ray\\AppData\\Local', target]);
		fileSystem.files.set(fileSystem.key(`${target}\\.singular-pio-work-root.json`), JSON.stringify({
			schemaVersion: 1, owner: 'singular-blockly-pio-work-root', ownerId: 'f'.repeat(32),
		}));
		const selected = await createService({ fileSystem, random: ['0a1b2c3d'] }).resolve();
		assert.strictEqual(selected.kind, 'system-drive');
		assert.strictEqual(fileSystem.files.get(fileSystem.key(`${target}\\.singular-pio-work-root.json`))?.includes('f'.repeat(32)), true,
			'the foreign marker is left untouched');
	});

	test('drops a system drive candidate and its empty folder when icacls fails', async () => {
		const fileSystem = new FakeWindowsFileSystem(['C:\\']);
		const service = createService({ fileSystem, env: env('學生'), failIcacls: true, random: ['0a1b2c3d'] });
		await assert.rejects(service.resolve(), (error: Error & { code?: string }) => error.code === 'path-too-long');
		assert.strictEqual(fileSystem.existsSync('C:\\SingularBlockly-0a1b2c3d'), false);
		assert.strictEqual(storage.files.fileExists('work-root.json'), false);
	});

	test('rejects a system drive folder that another account changed before the ACL was replaced', async () => {
		const planted = new FakeWindowsFileSystem(['C:\\']);
		const plantedService = createService({
			fileSystem: planted,
			env: env('學生'),
			random: ['0a1b2c3d'],
			onIcacls: target => planted.directories.add(planted.key(`${target}\\packages`)),
		});
		await assert.rejects(plantedService.resolve(), (error: Error & { code?: string }) => error.code === 'path-too-long');
		assert.strictEqual(planted.existsSync('C:\\SingularBlockly-0a1b2c3d\\.singular-pio-work-root.json'), false);
		assert.strictEqual(planted.existsSync('C:\\SingularBlockly-0a1b2c3d\\packages'), true, 'foreign content is not touched');
		assert.strictEqual(storage.files.fileExists('work-root.json'), false);

		const replaced = new FakeWindowsFileSystem(['C:\\']);
		const replacedService = createService({
			fileSystem: replaced,
			env: env('學生'),
			random: ['0a1b2c3d'],
			onIcacls: target => replaced.inodes.set(replaced.key(target), 99),
		});
		await assert.rejects(replacedService.resolve(), (error: Error & { code?: string }) => error.code === 'path-too-long');
		assert.strictEqual(replaced.existsSync('C:\\SingularBlockly-0a1b2c3d'), true, 'a replaced folder is not deleted');
		assert.strictEqual(storage.files.fileExists('work-root.json'), false);
	});

	test('uses only the custom folder and reports path-too-long when it is too deep', async () => {
		const deepRoot = path.join(tempRoot, 'custom');
		const fileSystem = new FakeWindowsFileSystem(['C:\\', 'C:\\Users\\ray\\AppData\\Local']);
		const deepStorage = new ManagedRuntimeStorage(deepRoot);
		await deepStorage.initialize();
		Object.defineProperty(deepStorage, 'layout', {
			value: { ...deepStorage.layout, root: `D:\\${'very-long-folder-name\\'.repeat(6)}runtime` },
		});
		const service = new PlatformioWorkRootService({
			storage: deepStorage,
			customManagedRoot: true,
			env: env(),
			platform: 'win32',
			fileSystem,
			runCommand: async () => ({ stdout: '' }),
		});
		await assert.rejects(service.resolve(), (error: Error & { code?: string }) => error.code === 'path-too-long');
		assert.strictEqual(fileSystem.directories.has(fileSystem.key('C:\\Users\\ray\\AppData\\Local\\SingularBlockly')), false,
			'a custom managed folder never falls back to app data');
	});

	test('recreates the work root when the recorded folder disappears', async () => {
		const fileSystem = new FakeWindowsFileSystem(['C:\\', 'C:\\Users\\ray\\AppData\\Local']);
		const service = createService({ fileSystem });
		const first = await service.resolve();
		fileSystem.directories.delete(fileSystem.key(first.root));
		fileSystem.files.clear();
		assert.strictEqual(await service.current(), null);
		assert.deepStrictEqual(await service.resolve(), first);
	});

	test('does nothing outside Windows', async () => {
		const service = new PlatformioWorkRootService({ storage, customManagedRoot: false, platform: 'linux' });
		assert.strictEqual(await service.current(), null);
		await assert.rejects(service.resolve(), /only on Windows/);
	});
});
