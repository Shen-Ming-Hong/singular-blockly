/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import { log } from './logging';
import { TxtConnectionService } from './txtConnectionService';
import { TxtIoSnapshot } from '../types/txt';

const RUNTIME_REMOTE_DIR = '/tmp/singular_blockly';
const RUNTIME_REMOTE_FILENAME = 'io_server.py';
const RUNTIME_REMOTE_PATH = `${RUNTIME_REMOTE_DIR}/${RUNTIME_REMOTE_FILENAME}`;

/**
 * SSH 客戶端介面（供 TxtTestService 注入測試使用）
 */
export interface SshTestClient {
	connect(config: { host: string; username: string; password: string; readyTimeout: number }): Promise<unknown>;
	putFile(localPath: string, remotePath: string): Promise<void>;
	execCommand(command: string): Promise<{ stdout: string; stderr: string; code: number | null }>;
	dispose(): void;
}

/**
 * HTTP fetch 介面（供測試注入使用）
 */
export interface JsonResponse {
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
}

export type FetchFunction = (
	url: string,
	init?: { method?: string; body?: string; headers?: Record<string, string> }
) => Promise<JsonResponse>;

/**
 * fischertechnik TXT Controller I/O 測試服務
 * 透過 SSH 安裝並管理 io_server.py，透過 HTTP 控制 I/O
 */
export class TxtTestService {
	private readonly connectionService: TxtConnectionService;
	private readonly extensionUri: vscode.Uri;
	private readonly sshClientFactory: () => Promise<SshTestClient>;
	private readonly fetchFn: FetchFunction;

	constructor(
		connectionService: TxtConnectionService,
		extensionUri: vscode.Uri,
		sshClientFactory?: () => Promise<SshTestClient>,
		fetchFn?: FetchFunction
	) {
		this.connectionService = connectionService;
		this.extensionUri = extensionUri;
		this.sshClientFactory = sshClientFactory ?? TxtTestService.defaultSshClientFactory;
		this.fetchFn = fetchFn ?? TxtTestService.defaultFetch;
	}

	private static async defaultSshClientFactory(): Promise<SshTestClient> {
		const { NodeSSH } = await import('node-ssh');
		const ssh = new NodeSSH();
		return {
			connect: config => ssh.connect(config),
			putFile: (local, remote) => ssh.putFile(local, remote),
			execCommand: command => ssh.execCommand(command),
			dispose: () => ssh.dispose(),
		};
	}

	private static async defaultFetch(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<JsonResponse> {
		// Node.js 18+ 內建 fetch
		const response = await (globalThis as { fetch?: typeof fetch }).fetch!(url, init);
		return {
			ok: response.ok,
			status: response.status,
			json: () => response.json() as Promise<unknown>,
		};
	}

	private baseUrl(): string {
		const config = this.connectionService.loadConfig();
		return `http://${config.host}:${config.runtimePort}`;
	}

	/**
	 * 透過 SSH 上傳 io_server.py 到 TXT，並設定執行權限
	 */
	async installRuntime(): Promise<void> {
		const config = this.connectionService.loadConfig();
		const password = await this.connectionService.getPasswordOrDefault();
		const localPath = vscode.Uri.joinPath(this.extensionUri, 'txt-runtime', RUNTIME_REMOTE_FILENAME).fsPath;

		log(`[TxtTestService] installRuntime: connecting to ${config.host}`, 'info');
		const ssh = await this.sshClientFactory();
		try {
			await ssh.connect({ host: config.host, username: config.username, password, readyTimeout: 30000 });
			await ssh.execCommand(`mkdir -p ${RUNTIME_REMOTE_DIR}`);
			await ssh.putFile(localPath, RUNTIME_REMOTE_PATH);
			await ssh.execCommand(`chmod +x ${RUNTIME_REMOTE_PATH}`);
			log('[TxtTestService] installRuntime: completed', 'info');
		} finally {
			ssh.dispose();
		}
	}

	/**
	 * 透過 SSH 在背景啟動 io_server.py
	 */
	async startServer(): Promise<void> {
		const config = this.connectionService.loadConfig();
		const password = await this.connectionService.getPasswordOrDefault();

		log('[TxtTestService] startServer: starting io_server.py', 'info');
		const ssh = await this.sshClientFactory();
		try {
			await ssh.connect({ host: config.host, username: config.username, password, readyTimeout: 30000 });
			await ssh.execCommand(`python3 ${RUNTIME_REMOTE_PATH} ${config.runtimePort} &`);
			log('[TxtTestService] startServer: io_server.py started', 'info');
		} finally {
			ssh.dispose();
		}
	}

	/**
	 * 透過 SSH 停止 io_server.py
	 */
	async stopServer(): Promise<void> {
		const config = this.connectionService.loadConfig();
		const password = await this.connectionService.getPasswordOrDefault();

		log('[TxtTestService] stopServer: stopping io_server.py', 'info');
		const ssh = await this.sshClientFactory();
		try {
			await ssh.connect({ host: config.host, username: config.username, password, readyTimeout: 30000 });
			await ssh.execCommand('pkill -f io_server.py');
			log('[TxtTestService] stopServer: stopped', 'info');
		} finally {
			ssh.dispose();
		}
	}

	/**
	 * 取得 TXT 目前的完整 I/O 狀態快照（HTTP GET /io）
	 */
	async pollIo(): Promise<TxtIoSnapshot> {
		const url = `${this.baseUrl()}/io`;
		const response = await this.fetchFn(url);
		if (!response.ok) {
			throw new Error(`pollIo failed: HTTP ${response.status}`);
		}
		return response.json() as Promise<TxtIoSnapshot>;
	}

	/**
	 * 設定指定馬達速度（HTTP POST /motor）
	 * @param motor 馬達編號 1-4
	 * @param speed 速度 -512~512
	 */
	async setMotor(motor: number, speed: number): Promise<void> {
		await this.fetchFn(`${this.baseUrl()}/motor`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ motor, speed }),
		});
	}

	/**
	 * 設定指定輸出狀態（HTTP POST /output）
	 * @param output 輸出編號 1-8
	 * @param level 0=關閉, 512=最大輸出
	 */
	async setOutput(output: number, level: number): Promise<void> {
		await this.fetchFn(`${this.baseUrl()}/output`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ output, level }),
		});
	}

	/**
	 * 停止所有馬達與輸出（HTTP POST /stop_all）
	 */
	async stopAll(): Promise<void> {
		await this.fetchFn(`${this.baseUrl()}/stop_all`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});
	}
}
