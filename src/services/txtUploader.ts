/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { log } from './logging';
import { TxtConnectionService } from './txtConnectionService';
import { TxtUploadProgress, TxtUploadResult, TxtUploadStage } from '../types/txt';

const WATCHDOG_TIMEOUT_MS = 30000;
const REMOTE_DIR = '/tmp/singular_blockly';

/**
 * SSH 執行結果介面（供測試注入使用）
 */
export interface SshExecResult {
	stdout: string;
	stderr: string;
	code: number | null;
}

/**
 * SSH 上傳客戶端介面（供測試注入使用）
 */
export interface SshUploaderClient {
	connect(config: { host: string; username: string; password: string; readyTimeout: number }): Promise<unknown>;
	putFile(localPath: string, remotePath: string): Promise<void>;
	execCommand(
		command: string,
		options?: { onStdout?: (chunk: Buffer) => void; onStderr?: (chunk: Buffer) => void }
	): Promise<SshExecResult>;
	dispose(): void;
}

type ProgressCallback = (progress: TxtUploadProgress) => void;

/**
 * fischertechnik TXT Controller 程式上傳服務
 * 透過 SSH 將 Python 程式上傳並執行
 */
export class TxtUploader {
	private outputChannel: vscode.OutputChannel;
	private txtConnectionService: TxtConnectionService;
	private currentSsh: SshUploaderClient | null = null;
	private stopRequested = false;
	private readonly sshClientFactory: () => Promise<SshUploaderClient>;

	constructor(
		txtConnectionService: TxtConnectionService,
		outputChannel?: vscode.OutputChannel,
		sshClientFactory?: () => Promise<SshUploaderClient>
	) {
		this.txtConnectionService = txtConnectionService;
		this.outputChannel = outputChannel ?? vscode.window.createOutputChannel('TXT Controller');
		this.sshClientFactory = sshClientFactory ?? TxtUploader.defaultSshClientFactory;
	}

	private static async defaultSshClientFactory(): Promise<SshUploaderClient> {
		const { NodeSSH } = await import('node-ssh');
		const ssh = new NodeSSH();
		return {
			connect: config => ssh.connect(config),
			putFile: (local, remote) => ssh.putFile(local, remote),
			execCommand: (command, options) => ssh.execCommand(command, options as any),
			dispose: () => ssh.dispose(),
		};
	}

	/**
	 * 上傳 Python 程式到 TXT Controller 並執行
	 */
	async upload(code: string, onProgress?: ProgressCallback): Promise<TxtUploadResult> {
		this.stopRequested = false;
		const startTime = Date.now();

		const report = (stage: TxtUploadStage, progress: number, message: string): void => {
			log(`[TXT] ${stage} (${progress}%): ${message}`, 'info');
			this.outputChannel.appendLine(`[${stage}] ${message}`);
			onProgress?.({ stage, progress, message });
		};

		const fail = (message: string, error?: string): TxtUploadResult => {
			const duration = Date.now() - startTime;
			report('failed', 0, message);
			this.txtConnectionService.setState('Error');
			return { success: false, timestamp: new Date().toISOString(), duration, error };
		};

		const config = this.txtConnectionService.loadConfig();
		const password = await this.txtConnectionService.getPasswordOrDefault();

		// --- Stage: connecting ---
		report('connecting', 10, `Connecting to ${config.host} as ${config.username}...`);
		this.txtConnectionService.setState('Testing');

		let ssh: SshUploaderClient;
		try {
			ssh = await this.sshClientFactory();
			this.currentSsh = ssh;
			await ssh.connect({ host: config.host, username: config.username, password, readyTimeout: 30000 });
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			this.currentSsh = null;
			return fail(`SSH connection failed: ${msg}`, msg);
		}

		if (this.stopRequested) {
			ssh.dispose();
			this.currentSsh = null;
			this.txtConnectionService.setState('Idle');
			return fail('Upload cancelled by user', 'cancelled');
		}

		try {
			// --- Stage: uploading ---
			report('uploading', 40, `Uploading program to ${config.remotePath}...`);

			// 建立遠端目錄
			await ssh.execCommand(`mkdir -p ${REMOTE_DIR}`);

			// 寫入臨時本地檔案然後 SCP 到遠端
			const tmpLocalPath = path.join(
				process.env['TMPDIR'] ?? '/tmp',
				`singular_blockly_${Date.now()}.py`
			);
			const fs = await import('fs/promises');
			await fs.writeFile(tmpLocalPath, code, 'utf-8');
			try {
				await ssh.putFile(tmpLocalPath, config.remotePath);
			} finally {
				await fs.unlink(tmpLocalPath).catch(() => {});
			}

			report('uploading', 60, 'Program uploaded successfully.');

			if (this.stopRequested) {
				ssh.dispose();
				this.currentSsh = null;
				this.txtConnectionService.setState('Idle');
				return fail('Upload cancelled by user', 'cancelled');
			}

			// --- Stage: executing ---
			report('executing', 60, 'Starting program execution...');
			this.txtConnectionService.setState('Running');
			this.outputChannel.show(true);
			this.outputChannel.appendLine('--- Program Output ---');

			let watchdogTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
				log('[TXT] Watchdog timeout triggered', 'warn');
				this.stopExecution().catch(() => {});
			}, WATCHDOG_TIMEOUT_MS);

			const clearWatchdog = () => {
				if (watchdogTimer) {
					clearTimeout(watchdogTimer);
					watchdogTimer = null;
				}
			};

			try {
				const result = await ssh.execCommand(`python3 ${config.remotePath}`, {
					onStdout: (chunk: Buffer) => {
						this.outputChannel.append(chunk.toString());
					},
					onStderr: (chunk: Buffer) => {
						this.outputChannel.append(chunk.toString());
					},
				});

				clearWatchdog();

				const exitCode = result.code ?? 0;
				if (exitCode !== 0 && !this.stopRequested) {
					const errMsg = `Program exited with code ${exitCode}`;
					report('failed', 100, errMsg);
					this.txtConnectionService.setState('Error');
					return { success: false, timestamp: new Date().toISOString(), duration: Date.now() - startTime, exitCode, error: errMsg };
				}
			} catch (execErr) {
				clearWatchdog();
				if (!this.stopRequested) {
					const msg = execErr instanceof Error ? execErr.message : String(execErr);
					return fail(`Execution failed: ${msg}`, msg);
				}
			}

			report('completed', 100, 'Program execution completed.');
			this.txtConnectionService.setState('Idle');

			return {
				success: true,
				timestamp: new Date().toISOString(),
				duration: Date.now() - startTime,
			};
		} finally {
			ssh.dispose();
			this.currentSsh = null;
		}
	}

	/**
	 * 停止正在執行中的程式
	 */
	async stopExecution(): Promise<void> {
		this.stopRequested = true;
		log('[TXT] stopExecution requested', 'info');
		this.outputChannel.appendLine('[TXT] Stopping execution...');

		const config = this.txtConnectionService.loadConfig();
		const password = await this.txtConnectionService.getPassword();

		if (!password) {
			return;
		}

		try {
			const ssh = await this.sshClientFactory();
			await ssh.connect({ host: config.host, username: config.username, password, readyTimeout: 30000 });
			await ssh.execCommand('pkill -f main.py || true');
			ssh.dispose();
			this.outputChannel.appendLine('[TXT] Program stopped.');
		} catch (err) {
			log(`[TXT] stopExecution error: ${err}`, 'warn');
		} finally {
			this.txtConnectionService.setState('Idle');
		}
	}
}
