/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import { TxtConnectionService } from './txtConnectionService';
import { log } from './logging';
import {
	buildTxtVirtualControlSessionControls,
	buildTxtVirtualControlSnapshotControls,
	TxtVirtualControlsDocument,
	VirtualControlRuntimeSession,
	VirtualControlRuntimeSnapshot,
} from '../types/txtVirtualControls';

export interface VirtualControlRuntimeSshClient {
	connect(config: { host: string; username: string; password: string; readyTimeout?: number }): Promise<unknown>;
	putFile(localPath: string, remotePath: string): Promise<void>;
	execCommand(command: string): Promise<{ stdout: string; stderr: string; code?: number | null }>;
	dispose(): void;
}

export type VirtualControlRuntimeFetch = typeof fetch;

interface RuntimeHealthResponse {
	ok?: boolean;
	sessionId?: string | null;
	updatedAt?: number;
	controlCount?: number;
	error?: string;
}

interface RuntimeMutationResponse {
	ok?: boolean;
	error?: string;
	updatedAt?: number;
}

export class TxtVirtualControlRuntimeService {
	private readonly runtimeScriptRemotePath = '/tmp/singular_blockly/virtual_controls_runtime.py';
	private readonly runtimeLogPath = '/tmp/singular_blockly/virtual_controls_runtime.log';
	private runtimeAuthToken: string | null = null;

	constructor(
		private readonly connectionService: TxtConnectionService,
		private readonly extensionUri: vscode.Uri,
		private readonly sshFactory: () => VirtualControlRuntimeSshClient,
		private readonly fetchImpl: VirtualControlRuntimeFetch = fetch
	) {}

	public static extractReferencedStableIds(code: string): string[] {
		const stableIds = new Set<string>();
		const matcher = /_txt_virtual_button_state\((['"])(.*?)\1\)/g;
		let match: RegExpExecArray | null = matcher.exec(code);
		while (match) {
			const stableId = match[2]?.trim();
			if (stableId) {
				stableIds.add(stableId);
			}
			match = matcher.exec(code);
		}

		return [...stableIds];
	}

	public getRuntimePort(): number {
		const config = this.connectionService.loadConfig();
		return (config.runtimePort || 8080) + 1;
	}

	public async installRuntime(): Promise<void> {
		const config = this.connectionService.loadConfig();
		const password = await this.connectionService.getPasswordOrDefault();
		const ssh = this.sshFactory();
		const localScriptPath = vscode.Uri.joinPath(this.extensionUri, 'txt-runtime', 'virtual_controls_runtime.py').fsPath;

		try {
			await ssh.connect({
				host: config.host,
				username: config.username,
				password,
				readyTimeout: 30000,
			});
			await ssh.execCommand('mkdir -p /tmp/singular_blockly');
			await ssh.putFile(localScriptPath, this.runtimeScriptRemotePath);
			await ssh.execCommand(`chmod +x ${this.runtimeScriptRemotePath}`);
		} finally {
			ssh.dispose();
		}
	}

	public async ensureRuntimeRunning(): Promise<void> {
		if (await this.isRuntimeHealthy()) {
			return;
		}

		await this.startRuntime();
		await this.waitForRuntimeHealth();
	}

	public async startRuntime(): Promise<void> {
		const config = this.connectionService.loadConfig();
		const password = await this.connectionService.getPasswordOrDefault();
		const ssh = this.sshFactory();
		const runtimePort = this.getRuntimePort();
		this.runtimeAuthToken = this.createRuntimeAuthToken();

		try {
			await this.installRuntime();
			await ssh.connect({
				host: config.host,
				username: config.username,
				password,
				readyTimeout: 30000,
			});
			// Stop any lingering old instance before starting a fresh one
			await ssh.execCommand("pkill -f 'virtual_controls_runtime.py' >/dev/null 2>&1 || true");
			// Run nohup as a standalone command (matching txtTestService pattern) so the
			// shell correctly detaches the background process and creates the log file.
			const startResult = await ssh.execCommand(
				`nohup python3 ${this.runtimeScriptRemotePath} ${runtimePort} ${this.runtimeAuthToken} > ${this.runtimeLogPath} 2>&1 & sleep 3`
			);
			log(
				`TXT virtual control runtime start: code=${startResult.code} stdout="${startResult.stdout}" stderr="${startResult.stderr}"`,
				'debug'
			);
		} finally {
			ssh.dispose();
		}
	}

	public async stopRuntime(): Promise<void> {
		const config = this.connectionService.loadConfig();
		const password = await this.connectionService.getPasswordOrDefault();
		const ssh = this.sshFactory();
		try {
			await ssh.connect({
				host: config.host,
				username: config.username,
				password,
				readyTimeout: 30000,
			});
			await ssh.execCommand("pkill -f 'virtual_controls_runtime.py' >/dev/null 2>&1 || true");
		} finally {
			ssh.dispose();
		}
	}

	public async createSession(document: TxtVirtualControlsDocument): Promise<VirtualControlRuntimeSession> {
		const sessionId = crypto.randomUUID();
		await this.ensureRuntimeRunning();
		let response: RuntimeMutationResponse;
		try {
			response = await this.requestJson<RuntimeMutationResponse>('/session', {
				method: 'PUT',
				body: JSON.stringify({
					sessionId,
					controls: buildTxtVirtualControlSessionControls(document),
				}),
			});
		} catch (error) {
			if (!this.isUnauthorizedRuntimeError(error)) {
				throw error;
			}

			log('TXT virtual control runtime auth mismatch detected; restarting runtime', 'warn');
			await this.startRuntime();
			await this.waitForRuntimeHealth();
			response = await this.requestJson<RuntimeMutationResponse>('/session', {
				method: 'PUT',
				body: JSON.stringify({
					sessionId,
					controls: buildTxtVirtualControlSessionControls(document),
				}),
			});
		}
		if (!response.ok) {
			throw new Error(response.error || 'TXT virtual control runtime rejected the session request.');
		}

		return {
			sessionId,
			mode: 'running',
			transport: 'txt-companion-runtime',
			startedAt: new Date().toISOString(),
			controlIds: document.controls.map(control => control.stableId),
		};
	}

	public async syncSnapshot(
		sessionId: string,
		document: TxtVirtualControlsDocument,
		pressedStates: Readonly<Record<string, boolean>>
	): Promise<VirtualControlRuntimeSnapshot> {
		const snapshot = {
			sessionId,
			controls: buildTxtVirtualControlSnapshotControls(document, pressedStates),
		};
		const response = await this.requestJson<RuntimeMutationResponse>('/snapshot', {
			method: 'POST',
			body: JSON.stringify(snapshot),
		});
		if (!response.ok) {
			throw new Error(response.error || 'TXT virtual control runtime rejected the snapshot update.');
		}

		return {
			sessionId,
			updatedAt: response.updatedAt || Date.now(),
			controls: Object.fromEntries(
				document.controls.map(control => [
					control.stableId,
					{
						pressed: Boolean(pressedStates[control.stableId]),
					},
				])
			),
		};
	}

	public async clearSession(): Promise<void> {
		try {
			const response = await this.requestJson<RuntimeMutationResponse>('/session', { method: 'DELETE' });
			if (!response.ok && response.error) {
				throw new Error(response.error);
			}
		} catch (error) {
			log(`TXT virtual control runtime session cleanup skipped: ${error instanceof Error ? error.message : String(error)}`, 'warn');
		}
	}

	private async isRuntimeHealthy(): Promise<boolean> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 2000);
		try {
			const response = await this.fetchImpl(this.getRuntimeUrl('/health'), {
				method: 'GET',
				headers: this.getRuntimeAuthHeaders(),
				signal: controller.signal,
			});
			if (!response.ok) {
				return false;
			}
			const payload = (await response.json()) as RuntimeHealthResponse;
			return Boolean(payload.ok);
		} catch (error) {
			log(
				`TXT virtual control runtime health check: ${error instanceof Error ? error.message : String(error)}`,
				'debug'
			);
			return false;
		} finally {
			clearTimeout(timer);
		}
	}

	private async waitForRuntimeHealth(): Promise<void> {
		// Give the Python server an initial moment to bind the port
		await new Promise<void>(resolve => setTimeout(resolve, 1000));
		const maxAttempts = 30;
		for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
			if (await this.isRuntimeHealthy()) {
				return;
			}
			await new Promise<void>(resolve => setTimeout(resolve, 500));
		}

		// Health checks exhausted — fetch the runtime log for diagnostics
		let logSnippet = '';
		try {
			logSnippet = await Promise.race([
				this.readRuntimeLog(),
				new Promise<string>(resolve => setTimeout(() => resolve(''), 5000)),
			]);
		} catch {
			// ignore — diagnostic step only
		}

		const baseMessage = 'TXT virtual control runtime did not become healthy in time.';
		throw new Error(logSnippet ? `${baseMessage}\n${logSnippet}` : baseMessage);
	}

	private async readRuntimeLog(): Promise<string> {
		const config = this.connectionService.loadConfig();
		const password = await this.connectionService.getPasswordOrDefault();
		const ssh = this.sshFactory();
		try {
			await ssh.connect({ host: config.host, username: config.username, password, readyTimeout: 30000 });
			const result = await ssh.execCommand(
				[
					`echo '--- dir ---'; ls /tmp/singular_blockly/ 2>&1 || echo '[dir not found]'`,
					`echo '--- python3 ---'; which python3 2>&1 || echo '[python3 not in PATH]'`,
					`echo '--- log ---'; tail -30 ${this.runtimeLogPath} 2>/dev/null || echo '[log not found]'`,
				].join('; ')
			);
			const stdout = result.stdout?.trim();
			return stdout ? `TXT diagnostics:\n${stdout}` : '';
		} finally {
			ssh.dispose();
		}
	}

	private async requestJson<T>(endpoint: string, init: RequestInit): Promise<T> {
		const response = await this.fetchImpl(this.getRuntimeUrl(endpoint), {
			...init,
			headers: {
				'Content-Type': 'application/json',
				...this.getRuntimeAuthHeaders(),
				...(init.headers || {}),
			},
		});
		const payload = (await response.json()) as T;
		if (!response.ok) {
			const errorMessage = (payload as RuntimeMutationResponse)?.error || `Runtime request failed with status ${response.status}`;
			throw new Error(errorMessage);
		}
		return payload;
	}

	private getRuntimeUrl(endpoint: string): string {
		const config = this.connectionService.loadConfig();
		const host = config.host || '127.0.0.1';
		const port = this.getRuntimePort();
		const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
		return `http://${host}:${port}${normalizedEndpoint}`;
	}

	private createRuntimeAuthToken(): string {
		return crypto.randomUUID().replace(/-/g, '');
	}

	private getRuntimeAuthHeaders(): Record<string, string> {
		if (!this.runtimeAuthToken) {
			return {};
		}

		return {
			'X-Singular-Blockly-Token': this.runtimeAuthToken,
		};
	}

	private isUnauthorizedRuntimeError(error: unknown): boolean {
		return error instanceof Error && /unauthorized/i.test(error.message);
	}
}

export function createTxtVirtualControlRuntimeService(
	connectionService: TxtConnectionService,
	extensionUri: vscode.Uri
): TxtVirtualControlRuntimeService {
	return new TxtVirtualControlRuntimeService(connectionService, extensionUri, () => {
		const { NodeSSH } = require('node-ssh') as typeof import('node-ssh');
		return new NodeSSH();
	});
}
