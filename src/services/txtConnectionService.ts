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

export type TxtPasswordMode = 'stored' | 'default' | 'custom';

export interface TxtConnectionTestOptions extends Partial<TxtConnectionConfig> {
	password?: string;
	passwordMode?: TxtPasswordMode;
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
	async saveConfig(config: Partial<TxtConnectionConfig>): Promise<void> {
		const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
		const updates: Array<Thenable<void>> = [];
		if (config.host !== undefined) {
			updates.push(cfg.update('txt.host', config.host, vscode.ConfigurationTarget.Workspace));
		}
		if (config.username !== undefined) {
			updates.push(cfg.update('txt.username', config.username, vscode.ConfigurationTarget.Workspace));
		}
		if (config.remotePath !== undefined) {
			updates.push(cfg.update('txt.remotePath', config.remotePath, vscode.ConfigurationTarget.Workspace));
		}
		if (config.runtimePort !== undefined) {
			updates.push(cfg.update('txt.runtimePort', config.runtimePort, vscode.ConfigurationTarget.Workspace));
		}
		await Promise.all(updates);
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

	private resolveConfig(overrides?: Partial<TxtConnectionConfig>): TxtConnectionConfig {
		const baseConfig = this.loadConfig();
		return {
			host: overrides?.host?.trim() || baseConfig.host,
			username: overrides?.username?.trim() || baseConfig.username,
			remotePath: overrides?.remotePath?.trim() || baseConfig.remotePath,
			runtimePort: overrides?.runtimePort ?? baseConfig.runtimePort,
		};
	}

	private async resolvePassword(options?: TxtConnectionTestOptions): Promise<string> {
		switch (options?.passwordMode) {
			case 'custom':
				return options.password ?? '';
			case 'stored':
				return (await this.getPassword()) ?? DEFAULT_TXT_PASSWORD;
			case 'default':
				return DEFAULT_TXT_PASSWORD;
			default:
				if (typeof options?.password === 'string' && options.password.length > 0) {
					return options.password;
				}
				return this.getPasswordOrDefault();
		}
	}

	/**
	 * 測試 SSH 連線，並自動完成一次性的 SSH 免確認設定（若尚未設定）。
	 *
	 * ftCommunity 的 PAM 設定：當 ftc 使用者無密碼時，SSH 登入會觸發 TXT 螢幕確認畫面。
	 * 測試連線成功後，若偵測到 ftc 無密碼，會自動設定密碼以繞過該確認流程。
	 */
	async testConnection(options?: TxtConnectionTestOptions): Promise<{ success: boolean; message: string; sshSetupDone?: boolean }> {
		const config = this.resolveConfig(options);
		const password = await this.resolvePassword(options);

		const ssh = await this.sshClientFactory();
		try {
			await ssh.connect({
				host: config.host,
				username: config.username,
				password,
				readyTimeout: 30000,
			});
			const result = await ssh.execCommand('echo ok');
			if (result.stdout.trim() !== 'ok') {
				log('TXT connection test: unexpected response', 'warn');
				return { success: false, message: `Unexpected response from ${config.host}` };
			}

			// 檢查 ftc 是否已設定密碼；若無則自動設定，以繞過 TXT 觸控螢幕確認流程
			let sshSetupDone = false;
			const shadowResult = await ssh.execCommand('sudo cat /etc/shadow');
			const ftcLine = shadowResult.stdout.split('\n').find(line => line.startsWith('ftc:'));
			if (ftcLine && !ftcLine.split(':')[1]) {
				// 使用 printf 傳入密碼兩次（確認密碼），單引號內的單引號以 '\'' 跳脫
				const escaped = password.replace(/'/g, "'\\''");
				await ssh.execCommand(`printf '${escaped}\\n${escaped}\\n' | sudo passwd ftc`);
				sshSetupDone = true;
				log('TXT: SSH password set to bypass touchscreen confirmation', 'info');
			}

			log(`TXT connection test: success${sshSetupDone ? ' (SSH setup done)' : ''}`, 'info');
			return {
				success: true,
				message: `Connected to ${config.host} as ${config.username}`,
				sshSetupDone,
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
