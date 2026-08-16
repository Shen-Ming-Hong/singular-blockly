/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFile as nodeExecFile, spawn as nodeSpawn } from 'child_process';

export interface PlatformioExecResult {
	stdout: string;
	stderr: string;
}

export interface PlatformioProcessResult extends PlatformioExecResult {
	started: true;
	exitCode: number | null;
	signal: NodeJS.Signals | null;
}

export interface PlatformioProcessOptions {
	cwd?: string;
	env?: NodeJS.ProcessEnv;
	timeout?: number;
	signal?: AbortSignal;
	onStdout?: (chunk: string) => void;
	onStderr?: (chunk: string) => void;
	maxCapturedOutputChars?: number;
}

const DEFAULT_MAX_CAPTURED_OUTPUT_CHARS = 1024 * 1024;

function appendBounded(current: string, chunk: string, limit: number): string {
	const combined = current + chunk;
	return combined.length <= limit ? combined : combined.slice(-limit);
}

export class PlatformioProcessError extends Error {
	constructor(
		message: string,
		public readonly started: boolean,
		public readonly code?: string | number,
		public readonly stdout = '',
		public readonly stderr = ''
	) {
		super(message);
		this.name = 'PlatformioProcessError';
	}
}

export function createExecFilePromise(
	filePath: string,
	args: string[],
	options: { timeout: number; cwd?: string; env?: NodeJS.ProcessEnv }
): Promise<PlatformioExecResult> {
	return new Promise((resolve, reject) => {
		nodeExecFile(filePath, args, { encoding: 'utf8', timeout: options.timeout, cwd: options.cwd, env: options.env, shell: false }, (error, stdout, stderr) => {
			if (error) {
				reject({ error, stdout, stderr });
				return;
			}

			resolve({ stdout, stderr });
		});
	});
}

export function runPlatformioProcess(
	command: string,
	args: readonly string[],
	options: PlatformioProcessOptions = {}
): Promise<PlatformioProcessResult> {
	return new Promise((resolve, reject) => {
		if (options.signal?.aborted) {
			reject(new PlatformioProcessError('Process was cancelled before start', false, 'ABORT_ERR'));
			return;
		}
		let child;
		try {
			child = nodeSpawn(command, [...args], {
				cwd: options.cwd,
				env: options.env,
				shell: false,
				windowsHide: true,
				stdio: ['ignore', 'pipe', 'pipe'],
				detached: process.platform !== 'win32',
			});
		} catch (error) {
			reject(new PlatformioProcessError(error instanceof Error ? error.message : String(error), false));
			return;
		}

		let stdout = '';
		let stderr = '';
		let started = false;
		let settled = false;
		let timeout: NodeJS.Timeout | undefined;
		let forceKillTimeout: NodeJS.Timeout | undefined;
		let terminationError: PlatformioProcessError | undefined;
		const outputLimit = Math.max(1, options.maxCapturedOutputChars ?? DEFAULT_MAX_CAPTURED_OUTPUT_CHARS);
		const cleanup = (): void => {
			if (timeout) {clearTimeout(timeout);}
			if (forceKillTimeout) {clearTimeout(forceKillTimeout);}
			options.signal?.removeEventListener('abort', abort);
		};
		const fail = (error: PlatformioProcessError): void => {
			if (settled) {return;}
			settled = true;
			cleanup();
			reject(error);
		};
		const terminate = (error: PlatformioProcessError): void => {
			if (settled || terminationError) {return;}
			terminationError = error;
			killProcessTree(child.pid, child, 'SIGTERM');
			forceKillTimeout = setTimeout(() => {
				if (!settled) {killProcessTree(child.pid, child, 'SIGKILL');}
			}, 5000);
			forceKillTimeout.unref();
		};
		const abort = (): void => {
			terminate(new PlatformioProcessError('Process was cancelled', started, 'ABORT_ERR', stdout, stderr));
		};

		child.once('spawn', () => {started = true;});
		child.stdout?.on('data', chunk => {
			const text = String(chunk);
			stdout = appendBounded(stdout, text, outputLimit);
			options.onStdout?.(text);
		});
		child.stderr?.on('data', chunk => {
			const text = String(chunk);
			stderr = appendBounded(stderr, text, outputLimit);
			options.onStderr?.(text);
		});
		child.once('error', error => {
			const code = 'code' in error ? String(error.code) : undefined;
			fail(terminationError ?? new PlatformioProcessError(error.message, started, code, stdout, stderr));
		});
		child.once('close', (exitCode, signal) => {
			if (settled) {return;}
			settled = true;
			cleanup();
			if (terminationError) {
				reject(new PlatformioProcessError(
					terminationError.message,
					terminationError.started,
					terminationError.code,
					stdout,
					stderr
				));
				return;
			}
			if (exitCode !== 0) {
				reject(new PlatformioProcessError(`Process exited with code ${String(exitCode)}`, started, exitCode ?? undefined, stdout, stderr));
				return;
			}
			resolve({ started: true, exitCode, signal, stdout, stderr });
		});

		options.signal?.addEventListener('abort', abort, { once: true });
		if (options.timeout && options.timeout > 0) {
			timeout = setTimeout(() => {
				terminate(new PlatformioProcessError('Process timed out', started, 'ETIMEDOUT', stdout, stderr));
			}, options.timeout);
		}
	});
}

function killProcessTree(
	pid: number | undefined,
	child: { kill(signal?: NodeJS.Signals): boolean },
	signal: NodeJS.Signals
): void {
	if (pid !== undefined && process.platform === 'win32') {
		try {
			const args = ['/pid', String(pid), '/t'];
			if (signal === 'SIGKILL') {args.push('/f');}
			const killer = nodeSpawn('taskkill.exe', args, { shell: false, windowsHide: true, stdio: 'ignore' });
			killer.unref();
			return;
		} catch {
			// Fall back to the direct child below.
		}
	}
	if (pid !== undefined && process.platform !== 'win32') {
		try {
			process.kill(-pid, signal);
			return;
		} catch {
			// The process may not have reached its own group yet.
		}
	}
	child.kill(signal);
}
