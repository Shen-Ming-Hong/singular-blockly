/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import { log } from './logging';
import { TxtConnectionConfig, TxtDeviceState } from '../types/txt';

const CONFIG_SECTION = 'singular-blockly';
const SECRET_KEY = 'singular-blockly.txt.password';
/** ftCommunity 韌體預設 SSH 密碼，讓小朋友插上 USB 不需設定即可連線 */
const DEFAULT_TXT_PASSWORD = 'ftc';

/**
 * SSH 客戶端介面（用於依賴注入測試）
 */
export interface SshClientInterface {
	connect(config: { host: string; username: string; password: string; readyTimeout: number }): Promise<unknown>;
	execCommand(command: string): Promise<{ stdout: string; stderr: string; code: number | null }>;
	dispose(): void;
}

/**
 * fischertechnik TXT Controller 連線服務
 * 負責管理連線設定、密碼儲存、連線測試與裝置狀態
 */
export class TxtConnectionService {
	private currentState: TxtDeviceState = 'Disconnected';
	private readonly context: vscode.ExtensionContext;
	private readonly sshClientFactory: () => Promise<SshClientInterface>;

	constructor(context: vscode.ExtensionContext, sshClientFactory?: () => Promise<SshClientInterface>) {
		this.context = context;
		this.sshClientFactory = sshClientFactory ?? TxtConnectionService.defaultSshClientFactory;
	}

	private static async defaultSshClientFactory(): Promise<SshClientInterface> {
		const { NodeSSH } = await import('node-ssh');
		const ssh = new NodeSSH();
		return {
			connect: config => ssh.connect(config),
			execCommand: command => ssh.execCommand(command),
			dispose: () => ssh.dispose(),
		};
	}

	/**
	 * 儲存 TXT 連線設定（不含密碼）
	 */
	saveConfig(config: Partial<TxtConnectionConfig>): void {
		const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
		if (config.host !== undefined) {
			cfg.update('txt.host', config.host, vscode.ConfigurationTarget.Global);
		}
		if (config.username !== undefined) {
			cfg.update('txt.username', config.username, vscode.ConfigurationTarget.Global);
		}
		if (config.remotePath !== undefined) {
			cfg.update('txt.remotePath', config.remotePath, vscode.ConfigurationTarget.Global);
		}
		if (config.runtimePort !== undefined) {
			cfg.update('txt.runtimePort', config.runtimePort, vscode.ConfigurationTarget.Global);
		}
		log('TXT connection config saved', 'info');
	}

	/**
	 * 載入 TXT 連線設定（不含密碼）
	 */
	loadConfig(): TxtConnectionConfig {
		const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
		return {
			host: cfg.get<string>('txt.host', '192.168.7.2'),
			username: cfg.get<string>('txt.username', 'ftc'),
			remotePath: cfg.get<string>('txt.remotePath', '/tmp/singular_blockly/main.py'),
			runtimePort: cfg.get<number>('txt.runtimePort', 8080),
		};
	}

	/**
	 * 安全儲存密碼（使用 VS Code SecretStorage）
	 */
	async storePassword(password: string): Promise<void> {
		await this.context.secrets.store(SECRET_KEY, password);
		log('TXT password stored securely', 'info');
	}

	/**
	 * 取得密碼（使用 VS Code SecretStorage）
	 */
	async getPassword(): Promise<string | undefined> {
		return this.context.secrets.get(SECRET_KEY);
	}

	/**
	 * 取得密碼，若尚未設定則回傳 ftCommunity 預設密碼
	 * 小朋友插上 USB 後不需輸入任何設定即可直接使用
	 */
	async getPasswordOrDefault(): Promise<string> {
		return (await this.context.secrets.get(SECRET_KEY)) ?? DEFAULT_TXT_PASSWORD;
	}

	/**
	 * 刪除已儲存的密碼
	 */
	async deletePassword(): Promise<void> {
		await this.context.secrets.delete(SECRET_KEY);
		log('TXT password deleted', 'info');
	}

	/**
	 * 測試 SSH 連線（5 秒逾時）
	 */
	async testConnection(): Promise<{ success: boolean; message: string }> {
		const config = this.loadConfig();
		const password = await this.getPasswordOrDefault();

		const ssh = await this.sshClientFactory();
		try {
			await ssh.connect({
				host: config.host,
				username: config.username,
				password,
				readyTimeout: 30000,
			});
			const result = await ssh.execCommand('echo ok');
			const success = result.stdout.trim() === 'ok';
			log(`TXT connection test: ${success ? 'success' : 'failed'}`, 'info');
			return {
				success,
				message: success
					? `Connected to ${config.host} as ${config.username}`
					: `Unexpected response from ${config.host}`,
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			log(`TXT connection test failed: ${message}`, 'warn');
			return { success: false, message: `Connection failed: ${message}` };
		} finally {
			ssh.dispose();
		}
	}

	/**
	 * 設定裝置狀態
	 */
	setState(newState: TxtDeviceState): void {
		const prev = this.currentState;
		this.currentState = newState;
		log(`TXT device state changed: ${prev} → ${newState}`, 'info');
	}

	/**
	 * 取得當前裝置狀態
	 */
	getState(): TxtDeviceState {
		return this.currentState;
	}
}
