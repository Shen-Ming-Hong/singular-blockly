/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as vscode from 'vscode';
import { MonitorStartResult } from '../types/arduino';
import type { CoreEnvironmentManager } from './coreEnvironmentManager';
import { log } from './logging';
import { MicropythonUploader } from './micropythonUploader';

const PROCESS_START_TIMEOUT_MS = 5000;
const PROCESS_STOP_TIMEOUT_MS = 5000;

type SpawnMonitorProcess = (
	command: string,
	args: readonly string[],
	options: { cwd: string; env: NodeJS.ProcessEnv; shell: false; windowsHide: true }
) => ChildProcessWithoutNullStreams;

class SerialMonitorPseudoterminal implements vscode.Pseudoterminal {
	private readonly writeEmitter = new vscode.EventEmitter<string>();
	private readonly closeEmitter = new vscode.EventEmitter<number>();
	private opened = false;
	private readonly bufferedOutput: string[] = [];
	readonly onDidWrite = this.writeEmitter.event;
	readonly onDidClose = this.closeEmitter.event;

	constructor(private readonly child: ChildProcessWithoutNullStreams) {
		child.stdout.on('data', chunk => this.write(String(chunk)));
		child.stderr.on('data', chunk => this.write(String(chunk)));
		child.once('close', code => this.closeEmitter.fire(code ?? 1));
		child.once('error', () => this.write('Unable to start the monitor process.\r\n'));
	}

	open(): void {
		this.opened = true;
		for (const output of this.bufferedOutput) {this.writeEmitter.fire(output);}
		this.bufferedOutput.length = 0;
	}

	close(): void {
		if (this.child.exitCode === null && !this.child.killed) {this.child.kill();}
	}

	handleInput(data: string): void {
		if (this.child.stdin.writable) {this.child.stdin.write(data);}
	}

	private write(value: string): void {
		const output = value.replace(/\r?\n/g, '\r\n');
		if (this.opened) {this.writeEmitter.fire(output);}
		else {this.bufferedOutput.push(output);}
	}
}

/**
 * CyberBrick MicroPython USB Serial Monitor.
 * Managed Core commands are always spawned with an argv array and never through a shell.
 */
export class SerialMonitorService {
	private terminal: vscode.Terminal | null = null;
	private currentPort: string | null = null;
	private readonly disposables: vscode.Disposable[] = [];
	private readonly uploader: MicropythonUploader;
	private isStoppingForUpload = false;
	private activeProcess: ChildProcessWithoutNullStreams | null = null;
	private onStoppedCallback?: (reason: 'user_closed' | 'upload_started' | 'device_disconnected') => void;

	constructor(
		private readonly workspacePath: string,
		coreEnvironmentManager?: CoreEnvironmentManager,
		private readonly workspaceTrusted: () => boolean = () => vscode.workspace.isTrusted,
		private readonly spawnProcess: SpawnMonitorProcess = (command, args, options) => spawn(command, args, options)
	) {
		this.uploader = new MicropythonUploader(workspacePath, undefined, undefined, coreEnvironmentManager);
		this.disposables.push(
			vscode.window.onDidCloseTerminal(closedTerminal => {
				if (closedTerminal === this.terminal) {this.handleTerminalClosed();}
			})
		);
	}

	async start(): Promise<MonitorStartResult> {
		if (!this.workspaceTrusted()) {
			return {
				success: false,
				port: '',
				error: { code: 'WORKSPACE_UNTRUSTED', message: '請先信任此工作區，再啟動裝置監控。' },
			};
		}
		if (this.terminal) {return { success: true, port: this.currentPort! };}

		const availability = await this.uploader.ensureMpremoteAvailable();
		if (!availability.success) {
			return {
				success: false,
				port: '',
				error: { code: 'PIO_NOT_FOUND', message: availability.message },
			};
		}

		let detectionBackend: 'python' | 'mpremote' = 'python';
		let { autoDetected } = await this.uploader.listSerialPorts('cyberbrick');
		if (!autoDetected) {
			const fallbackDetection = await this.uploader.listPorts('cyberbrick');
			autoDetected = fallbackDetection.autoDetected;
			if (autoDetected) {
				detectionBackend = 'mpremote';
				log('[blockly] pyserial 序列埠偵測無結果，改用 mpremote connect list 偵測 USB 裝置', 'info', { port: autoDetected });
			}
		}
		if (!autoDetected) {
			return {
				success: false,
				port: '',
				error: { code: 'DEVICE_NOT_FOUND', message: '找不到 CyberBrick 裝置' },
			};
		}

		this.currentPort = autoDetected;
		try {
			if (detectionBackend === 'mpremote') {
				await this.startMpremoteMonitor(autoDetected);
			} else {
				await this.resetAndStartMonitor(autoDetected);
			}
		} catch (error) {
			if (detectionBackend === 'mpremote') {
				this.currentPort = null;
				return this.monitorStartFailure();
			}
			log('[blockly] 無法使用 pyserial 啟動 Monitor，嘗試 mpremote repl 備援', 'warn', {
				code: this.commandErrorCode(error),
			});
			if (!await this.uploader.checkMpremoteInstalled()) {
				this.currentPort = null;
				return {
					success: false,
					port: '',
					error: {
						code: 'MPREMOTE_NOT_INSTALLED',
						message: 'mpremote 工具未安裝，無法啟動 CyberBrick USB Monitor。',
					},
				};
			}
			try {
				await this.startMpremoteMonitor(autoDetected);
			} catch {
				this.currentPort = null;
				return this.monitorStartFailure();
			}
		}

		log('[blockly] Monitor 已啟動', 'info', { port: autoDetected, backend: detectionBackend });
		return { success: true, port: autoDetected };
	}

	async stop(): Promise<void> {
		await this.terminateActiveProcess();
		this.terminal?.dispose();
		this.terminal = null;
		this.currentPort = null;
		log('[blockly] Monitor 已停止', 'info');
	}

	async stopForUpload(): Promise<void> {
		if (!this.terminal) {return;}
		this.isStoppingForUpload = true;
		await this.stop();
		this.onStoppedCallback?.('upload_started');
		await new Promise(resolve => setTimeout(resolve, 500));
		this.isStoppingForUpload = false;
	}

	isRunning(): boolean {
		return this.terminal !== null;
	}

	getCurrentPort(): string | null {
		return this.currentPort;
	}

	onStopped(callback: (reason: 'user_closed' | 'upload_started' | 'device_disconnected') => void): void {
		this.onStoppedCallback = callback;
	}

	private handleTerminalClosed(): void {
		const wasStoppingForUpload = this.isStoppingForUpload;
		if (this.activeProcess?.exitCode === null && !this.activeProcess.killed) {this.activeProcess.kill();}
		this.activeProcess = null;
		this.terminal = null;
		const port = this.currentPort;
		this.currentPort = null;
		log('[blockly] Monitor 終端機已關閉', 'info', { port });
		if (!wasStoppingForUpload) {this.onStoppedCallback?.('user_closed');}
	}

	private async resetAndStartMonitor(port: string): Promise<void> {
		const pythonPath = this.uploader.getPlatformioPythonPath();
		const monitorScript = `import serial
import sys
import time

port = ${JSON.stringify(port)}
try:
    s = serial.Serial(port, 115200, timeout=0.1)
    s.write(b'\\x03\\x03')
    time.sleep(0.1)
    s.write(b'\\x04')
    print(f"Connected to {port}")
    print("Ctrl+C sends interrupt to device, close terminal to stop monitor")
    print("-" * 40)
    sys.stdout.flush()
    while True:
        try:
            data = s.read(1024)
            if data:
                sys.stdout.write(data.decode('utf-8', errors='replace'))
                sys.stdout.flush()
        except KeyboardInterrupt:
            s.write(b'\\x03')
            time.sleep(0.1)
            print("\\n[Interrupt sent to device]")
            sys.stdout.flush()
        except Exception as e:
            print(f"\\nError: {e}")
            break
    s.close()
except serial.SerialException as e:
    print(f"Serial Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
`;
		await this.startMonitorProcess(pythonPath, ['-u', '-c', monitorScript]);
		log('[blockly] 使用 pyserial 啟動 Monitor', 'info', { port });
	}

	private async startMpremoteMonitor(port: string): Promise<void> {
		await this.startMonitorProcess(this.uploader.getMpremotePath(), ['connect', port, 'repl']);
	}

	private async startMonitorProcess(command: string, args: readonly string[]): Promise<void> {
		const child = this.spawnProcess(command, args, {
			cwd: this.workspacePath,
			env: { ...process.env },
			shell: false,
			windowsHide: true,
		});
		await this.waitForProcessStart(child);
		this.activeProcess = child;
		this.terminal = vscode.window.createTerminal({
			name: 'CyberBrick Monitor',
			pty: new SerialMonitorPseudoterminal(child),
		});
		this.terminal.show(false);
	}

	private async waitForProcessStart(child: ChildProcessWithoutNullStreams): Promise<void> {
		if (child.pid !== undefined) {return;}
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				cleanup();
				if (!child.killed) {child.kill();}
				reject(Object.assign(new Error('Monitor process did not start in time'), { code: 'ETIMEDOUT' }));
			}, PROCESS_START_TIMEOUT_MS);
			const onSpawn = () => {cleanup(); resolve();};
			const onError = (error: Error) => {cleanup(); reject(error);};
			const cleanup = () => {
				clearTimeout(timeout);
				child.off('spawn', onSpawn);
				child.off('error', onError);
			};
			child.once('spawn', onSpawn);
			child.once('error', onError);
		});
	}

	private async terminateActiveProcess(): Promise<void> {
		const child = this.activeProcess;
		this.activeProcess = null;
		if (!child || child.exitCode !== null) {return;}
		if (!child.killed) {child.kill();}
		await new Promise<void>(resolve => {
			let settled = false;
			const finish = () => {
				if (settled) {return;}
				settled = true;
				clearTimeout(timeout);
				child.off('close', finish);
				resolve();
			};
			const timeout = setTimeout(() => {
				if (child.exitCode === null) {child.kill('SIGKILL');}
				finish();
			}, PROCESS_STOP_TIMEOUT_MS);
			child.once('close', finish);
		});
	}

	private commandErrorCode(error: unknown): string {
		return typeof error === 'object' && error !== null && 'code' in error
			? String((error as { code?: unknown }).code ?? 'unknown')
			: 'unknown';
	}

	private monitorStartFailure(): MonitorStartResult {
		return {
			success: false,
			port: '',
			error: { code: 'CONNECTION_FAILED', message: '無法啟動 CyberBrick USB Monitor。' },
		};
	}

	dispose(): void {
		void this.stop();
		this.disposables.forEach(disposable => disposable.dispose());
		this.disposables.length = 0;
	}
}
