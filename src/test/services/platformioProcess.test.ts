/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { PlatformioProcessError, runPlatformioProcess } from '../../services/platformioProcess';

function nodeProcessOptions(options: Parameters<typeof runPlatformioProcess>[2] = {}) {
	return { ...options, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } };
}

suite('ManagedRuntime PlatformioProcess', () => {
	test('preserves Unicode and shell metacharacters as literal argument boundaries', async () => {
		const values = ['學生 專案', '$(touch should-not-run)', 'semi;colon', "quote'and\"double", '🚀'];
		const result = await runPlatformioProcess(
			process.execPath,
			['-e', 'process.stdout.write(JSON.stringify(process.argv.slice(1)))', '--', ...values],
			nodeProcessOptions({ timeout: 5000 })
		);

		assert.deepStrictEqual(JSON.parse(result.stdout), values);
		assert.strictEqual(result.started, true);
	});

	test('reports a missing executable as a pre-start failure', async () => {
		await assert.rejects(
			() => runPlatformioProcess('/definitely/missing/singular-pio', [], nodeProcessOptions({ timeout: 1000 })),
			(error: unknown) => error instanceof PlatformioProcessError && error.started === false
		);
	});

	test('does not spawn when already cancelled', async () => {
		const controller = new AbortController();
		controller.abort();
		await assert.rejects(
			() => runPlatformioProcess(process.execPath, ['--version'], nodeProcessOptions({ signal: controller.signal })),
			(error: unknown) => error instanceof PlatformioProcessError && error.code === 'ABORT_ERR' && !error.started
		);
	});

	test('marks cancellation after spawn and retains bounded output', async () => {
		const controller = new AbortController();
		const promise = runPlatformioProcess(
			process.execPath,
			['-e', 'process.stdout.write("ready"); setInterval(() => {}, 1000)'],
			nodeProcessOptions({ signal: controller.signal, timeout: 5000 })
		);
		setTimeout(() => controller.abort(), 100);

		await assert.rejects(
			() => promise,
			(error: unknown) => error instanceof PlatformioProcessError && error.code === 'ABORT_ERR' && error.started
		);
	});

	test('does not settle cancellation until the child process closes', async function () {
		if (process.platform === 'win32') {this.skip();}
		const controller = new AbortController();
		let abortedAt = 0;
		const promise = runPlatformioProcess(
			process.execPath,
			['-e', 'process.on("SIGTERM", () => setTimeout(() => process.exit(0), 200)); process.stdout.write("ready"); setInterval(() => {}, 1000)'],
			nodeProcessOptions({
				signal: controller.signal,
				timeout: 5000,
				onStdout: () => {
					abortedAt = Date.now();
					controller.abort();
				},
			})
		);

		await assert.rejects(() => promise, (error: unknown) =>
			error instanceof PlatformioProcessError && error.code === 'ABORT_ERR');
		assert.ok(abortedAt > 0);
		assert.ok(Date.now() - abortedAt >= 180, 'cancellation should wait for the child close event');
	});

	test('bounds captured stdout and stderr while preserving streamed callbacks', async () => {
		let streamed = '';
		const result = await runPlatformioProcess(
			process.execPath,
			['-e', 'process.stdout.write("a".repeat(100)); process.stderr.write("b".repeat(100))'],
			nodeProcessOptions({ timeout: 5000, maxCapturedOutputChars: 20, onStdout: chunk => {streamed += chunk;} })
		);
		assert.strictEqual(result.stdout, 'a'.repeat(20));
		assert.strictEqual(result.stderr, 'b'.repeat(20));
		assert.strictEqual(streamed, 'a'.repeat(100));
	});
});
