/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { log } from './logging';
import { SettingsManager } from './settingsManager';
import { ArduinoUploadStage, ArduinoUploadResult, ArduinoUploadRequest, ArduinoPortInfo, ArduinoProgressCallback } from '../types/arduino';

/**
 * 預設的編譯逾時時間（毫秒）
 */
const DEFAULT_COMPILE_TIMEOUT = 120000;

/**
 * 預設的上傳逾時時間（毫秒）
 */
const DEFAULT_UPLOAD_TIMEOUT = 60000;

/**
 * 指令執行介面（用於依賴注入）
 */
export interface CommandExecutor {
	exec(command: string, options?: { timeout?: number; cwd?: string }): Promise<{ stdout: string; stderr: string }>;
}

/**
 * 支援即時輸出的指令執行介面
 */
export interface StreamingCommandExecutor {
	spawn(
		command: string,
		args: string[],
		options: { cwd?: string; timeout?: number },
		onStdout?: (data: string) => void,
		onStderr?: (data: string) => void
	): Promise<{ code: number; stdout: string; stderr: string }>;
}

/**
 * 檔案系統介面（用於依賴注入）
 */
export interface FileSystemInterface {
	existsSync(path: string): boolean;
	writeFileSync(path: string, data: string): void;
	mkdirSync(path: string, options?: { recursive: boolean }): void;
}

/**
 * Arduino 上傳服務
 * 負責 Arduino C++ 程式碼的編譯與上傳
 */
export class ArduinoUploader {
	private pioPath: string;
	private executor: CommandExecutor;
	private streamingExecutor: StreamingCommandExecutor;
	private fileSystem: FileSystemInterface;
	private compileTimeout: number;
	private uploadTimeout: number;
	private settingsManager: SettingsManager;
	private startTime: number = 0;

	/**
	 * 建立 ArduinoUploader 實例
	 * @param workspacePath 工作區路徑
	 * @param executor 指令執行器（可選，用於測試）
	 * @param fileSystem 檔案系統（可選，用於測試）
	 * @param settingsManager 設定管理器（可選，用於測試）
	 * @param streamingExecutor 串流執行器（可選，用於測試）
	 */
	constructor(
		private workspacePath: string,
		executor?: CommandExecutor,
		fileSystem?: FileSystemInterface,
		settingsManager?: SettingsManager,
		streamingExecutor?: StreamingCommandExecutor
	) {
		this.pioPath = this.getPioPath();
		this.compileTimeout = DEFAULT_COMPILE_TIMEOUT;
		this.uploadTimeout = DEFAULT_UPLOAD_TIMEOUT;
		this.settingsManager = settingsManager || new SettingsManager(workspacePath);
		this.fileSystem = fileSystem || fs;

		// 使用預設的 child_process 執行器或注入的執行器
		this.executor = executor || {
			exec: (command: string, options?: { timeout?: number; cwd?: string }) => {
				const { exec } = require('child_process');
				return new Promise((resolve, reject) => {
					exec(
						command,
						{
							encoding: 'utf8',
							timeout: options?.timeout || 0,
							cwd: options?.cwd || this.workspacePath,
							maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large compile outputs
						},
						(error: Error | null, stdout: string, stderr: string) => {
							if (error) {
								reject({ error, stdout, stderr });
							} else {
								resolve({ stdout, stderr });
							}
						}
					);
				});
			},
		};

		// 預設串流執行器使用 spawn
		this.streamingExecutor = streamingExecutor || {
			spawn: (
				command: string,
				args: string[],
				options: { cwd?: string; timeout?: number },
				onStdout?: (data: string) => void,
				onStderr?: (data: string) => void
			): Promise<{ code: number; stdout: string; stderr: string }> => {
				return new Promise((resolve, reject) => {
					let stdout = '';
					let stderr = '';
					let timeoutId: NodeJS.Timeout | undefined;

					const child = spawn(command, args, {
						cwd: options.cwd || this.workspacePath,
						shell: true,
						stdio: ['ignore', 'pipe', 'pipe'],
					});

					if (options.timeout) {
						timeoutId = setTimeout(() => {
							child.kill('SIGTERM');
							reject(new Error('Command timed out'));
						}, options.timeout);
					}

					child.stdout?.on('data', (data: Buffer) => {
						const text = data.toString();
						stdout += text;
						onStdout?.(text);
					});

					child.stderr?.on('data', (data: Buffer) => {
						const text = data.toString();
						stderr += text;
						onStderr?.(text);
					});

					child.on('close', (code: number | null) => {
						if (timeoutId) {
							clearTimeout(timeoutId);
						}
						if (code === 0) {
							resolve({ code: code || 0, stdout, stderr });
						} else {
							reject({ code, stdout, stderr });
						}
					});

					child.on('error', (error: Error) => {
						if (timeoutId) {
							clearTimeout(timeoutId);
						}
						reject({ error, stdout, stderr });
					});
				});
			},
		};
	}

	/**
	 * 取得 PlatformIO CLI 路徑
	 * @returns PlatformIO CLI 執行檔路徑
	 */
	getPioPath(): string {
		const homeDir = os.homedir();
		const isWindows = process.platform === 'win32';

		if (isWindows) {
			return path.join(homeDir, '.platformio', 'penv', 'Scripts', 'pio.exe');
		} else {
			return path.join(homeDir, '.platformio', 'penv', 'bin', 'pio');
		}
	}

	/**
	 * 檢查 PlatformIO CLI 是否已安裝
	 * @returns 是否已安裝
	 */
	async checkPioInstalled(): Promise<boolean> {
		if (!this.fileSystem.existsSync(this.pioPath)) {
			log('[arduino] PlatformIO CLI 未安裝', 'warn', { path: this.pioPath });
			return false;
		}

		try {
			const result = await this.executor.exec(`"${this.pioPath}" --version`);
			log('[arduino] PlatformIO CLI 檢查成功', 'info', { version: result.stdout.trim() });
			return true;
		} catch (error) {
			log('[arduino] PlatformIO CLI 檢查失敗', 'error', error);
			return false;
		}
	}

	/**
	 * 偵測連接的 Arduino 裝置
	 * @returns 偵測結果，包含是否有裝置、連接埠資訊及指令是否失敗
	 */
	async detectDevices(): Promise<{ hasDevice: boolean; port?: string; devices: ArduinoPortInfo[]; commandFailed: boolean }> {
		try {
			const result = await this.executor.exec(`"${this.pioPath}" device list --json-output`);
			const deviceList = JSON.parse(result.stdout);

			// 過濾有效的 Arduino 裝置（排除藍牙裝置）
			const validDevices: ArduinoPortInfo[] = [];
			for (const device of deviceList) {
				// 跳過藍牙裝置
				if (device.description && device.description.toLowerCase().includes('bluetooth')) {
					continue;
				}
				// 跳過沒有描述的虛擬裝置
				if (!device.description || device.description === 'n/a') {
					continue;
				}
				validDevices.push({
					port: device.port,
					description: device.description,
					hwid: device.hwid,
				});
			}

			log('[arduino] 偵測到裝置', 'info', { count: validDevices.length, devices: validDevices });

			if (validDevices.length > 0) {
				return {
					hasDevice: true,
					port: validDevices[0].port, // 預設使用第一個裝置
					devices: validDevices,
					commandFailed: false,
				};
			}

			return { hasDevice: false, devices: [], commandFailed: false };
		} catch (error) {
			log('[arduino] 裝置偵測失敗', 'error', error);
			return { hasDevice: false, devices: [], commandFailed: true };
		}
	}

	/**
	 * 同步 PlatformIO 設定
	 * @param request 上傳請求
	 */
	private async syncSettings(request: ArduinoUploadRequest): Promise<void> {
		const libDeps = request.lib_deps || [];
		const buildFlags = request.build_flags || [];
		const libLdfMode = request.lib_ldf_mode || null;

		log('[arduino] 同步 PlatformIO 設定', 'info', {
			libDeps: libDeps.length,
			buildFlags: buildFlags.length,
			libLdfMode,
		});

		await this.settingsManager.syncPlatformIOSettings(libDeps, buildFlags, libLdfMode);
	}

	/**
	 * 儲存程式碼到 src/main.cpp
	 * @param code 程式碼內容
	 */
	private async saveCode(code: string): Promise<void> {
		const srcDir = path.join(this.workspacePath, 'src');
		const mainCppPath = path.join(srcDir, 'main.cpp');

		// 確保 src 目錄存在
		if (!this.fileSystem.existsSync(srcDir)) {
			this.fileSystem.mkdirSync(srcDir, { recursive: true });
		}

		this.fileSystem.writeFileSync(mainCppPath, code);
		log('[arduino] 程式碼已儲存', 'info', { path: mainCppPath });
	}

	/**
	 * 取得已耗時（毫秒）
	 */
	private getElapsed(): number {
		return this.startTime > 0 ? Date.now() - this.startTime : 0;
	}

	/**
	 * 解析 PlatformIO 編譯輸出以取得進度
	 * @param output 輸出文字
	 * @returns 解析的進度百分比 (0-100) 或 undefined
	 */
	private parseCompileProgress(output: string): number | undefined {
		// PlatformIO 輸出格式範例：
		// Compiling .pio/build/esp32dev/src/main.cpp.o
		// Linking .pio/build/esp32dev/firmware.elf
		// Building .pio/build/esp32dev/firmware.bin

		// 根據編譯階段估算進度
		if (output.includes('Installing') || output.includes('Resolving')) {
			return 5; // 安裝依賴
		}
		if (output.includes('Compiling') && output.includes('FrameworkArduino')) {
			return 15; // 編譯框架（首次編譯較慢）
		}
		if (output.includes('Compiling') && output.includes('.cpp.o')) {
			return 40; // 編譯使用者程式碼
		}
		if (output.includes('Compiling') && output.includes('.c.o')) {
			return 50; // 編譯 C 檔案
		}
		if (output.includes('Archiving')) {
			return 60; // 打包
		}
		if (output.includes('Indexing')) {
			return 65; // 索引
		}
		if (output.includes('Linking')) {
			return 75; // 連結
		}
		if (output.includes('Building') && output.includes('.bin')) {
			return 90; // 產生 binary
		}
		if (output.includes('Checking size') || output.includes('RAM:') || output.includes('Flash:')) {
			return 95; // 檢查大小
		}
		if (output.includes('SUCCESS') || output.includes('successfully')) {
			return 100;
		}

		return undefined;
	}

	/**
	 * 從編譯輸出中提取有意義的訊息
	 * @param line 輸出行
	 * @returns 格式化的訊息
	 */
	private extractCompileMessage(line: string): string {
		// 提取正在編譯的檔案名稱
		if (line.includes('Compiling')) {
			// 匹配路徑中的檔案名稱
			const match = line.match(/Compiling\s+(?:\.pio\/build\/[^/]+\/)?(?:src\/)?(.+?\.(?:cpp|c|S))/i);
			if (match) {
				const fileName = match[1].replace(/\.o$/, '');
				// 截斷過長的檔案名
				return fileName.length > 30 ? `Compiling ...${fileName.slice(-27)}` : `Compiling ${fileName}`;
			}
			return 'Compiling...';
		}
		if (line.includes('Linking')) {
			return 'Linking firmware...';
		}
		if (line.includes('Building') && line.includes('.bin')) {
			return 'Building firmware.bin...';
		}
		if (line.includes('Checking size')) {
			return 'Checking memory usage...';
		}
		// 提取記憶體使用資訊 - 格式: RAM:   [=         ]  13.8% (used 45380 bytes from 327680 bytes)
		const ramMatch = line.match(/RAM:\s*\[[=\s]*\]\s*(\d+\.?\d*)%\s*\(used\s+(\d+)\s*bytes\s+from\s+(\d+)/i);
		if (ramMatch) {
			return `RAM: ${ramMatch[1]}% (${this.formatBytes(parseInt(ramMatch[2]))}/${this.formatBytes(parseInt(ramMatch[3]))})`;
		}
		const flashMatch = line.match(/Flash:\s*\[[=\s]*\]\s*(\d+\.?\d*)%\s*\(used\s+(\d+)\s*bytes\s+from\s+(\d+)/i);
		if (flashMatch) {
			return `Flash: ${flashMatch[1]}% (${this.formatBytes(parseInt(flashMatch[2]))}/${this.formatBytes(parseInt(flashMatch[3]))})`;
		}
		if (line.includes('SUCCESS')) {
			return 'Compilation successful!';
		}
		if (line.includes('Archiving')) {
			return 'Archiving libraries...';
		}
		if (line.includes('Installing') || line.includes('Resolving')) {
			return 'Installing dependencies...';
		}
		return '';
	}

	/**
	 * 格式化位元組數為可讀格式
	 * @param bytes 位元組數
	 * @returns 格式化字串 (如 "745KB")
	 */
	private formatBytes(bytes: number): string {
		if (bytes < 1024) {
			return `${bytes}B`;
		}
		if (bytes < 1024 * 1024) {
			return `${(bytes / 1024).toFixed(0)}KB`;
		}
		return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
	}

	/**
	 * 從上傳輸出中提取有意義的訊息
	 * @param line 輸出行
	 * @param progress 當前進度
	 * @returns 格式化的訊息
	 */
	private extractUploadMessage(line: string, progress: number): string {
		// 上傳協議配置
		if (line.includes('Configuring upload protocol')) {
			return 'Configuring upload...';
		}
		if (line.includes('Looking for upload port')) {
			return 'Detecting port...';
		}
		// 自動偵測埠 - 格式: Auto-detected: COM9
		const portMatch = line.match(/Auto-detected:\s*(\S+)/i);
		if (portMatch) {
			return `Port: ${portMatch[1]}`;
		}
		if (line.includes('Uploading') && line.includes('.bin')) {
			return 'Uploading firmware...';
		}
		if (line.includes('Connecting')) {
			return 'Connecting to device...';
		}
		// 晶片偵測 - 格式: Chip is ESP32-D0WD-V3 (revision v3.1)
		const chipMatch = line.match(/Chip is ([^(]+)/i);
		if (chipMatch) {
			return `Chip: ${chipMatch[1].trim()}`;
		}
		// 功能列表
		if (line.includes('Features:')) {
			const featMatch = line.match(/Features:\s*(.+)/i);
			if (featMatch) {
				// 截取前幾個功能
				const features = featMatch[1].split(',').slice(0, 3).join(', ');
				return `Features: ${features}`;
			}
		}
		if (line.includes('Uploading stub')) {
			return 'Uploading stub...';
		}
		if (line.includes('Running stub')) {
			return 'Running stub...';
		}
		if (line.includes('Changing baud rate')) {
			const baudMatch = line.match(/to\s+(\d+)/i);
			if (baudMatch) {
				return `Baud: ${parseInt(baudMatch[1]) / 1000}k`;
			}
		}
		if (line.includes('Flash will be erased')) {
			return 'Erasing flash...';
		}
		// 壓縮資訊 - 格式: Compressed 769728 bytes to 497592...
		const compressMatch = line.match(/Compressed\s+(\d+)\s*bytes to\s+(\d+)/i);
		if (compressMatch) {
			const original = parseInt(compressMatch[1]);
			const compressed = parseInt(compressMatch[2]);
			const ratio = ((1 - compressed / original) * 100).toFixed(0);
			return `Compressed: ${this.formatBytes(original)} → ${this.formatBytes(compressed)} (${ratio}% saved)`;
		}
		// 寫入進度 - 格式: Writing at 0x00010000... (3 %)
		if (line.includes('Writing at')) {
			return `Writing flash: ${progress}%`;
		}
		// 寫入完成 - 格式: Wrote 769728 bytes (497592 compressed) at 0x00010000 in 11.6 seconds
		const wroteMatch = line.match(/Wrote\s+(\d+)\s*bytes.*in\s+([\d.]+)\s*seconds.*\((\d+\.?\d*)\s*kbit/i);
		if (wroteMatch) {
			return `Wrote ${this.formatBytes(parseInt(wroteMatch[1]))} @ ${wroteMatch[3]} kbit/s`;
		}
		if (line.includes('Hash of data verified')) {
			return 'Verified ✓';
		}
		if (line.includes('Hard resetting')) {
			return 'Resetting device...';
		}
		if (line.includes('Leaving')) {
			return 'Finishing...';
		}
		// SUCCESS 訊息 - 格式: [SUCCESS] Took 24.81 seconds
		const successMatch = line.match(/\[SUCCESS\]\s*Took\s+([\d.]+)\s*seconds/i);
		if (successMatch) {
			return `Done in ${successMatch[1]}s ✓`;
		}
		// 預設訊息（只在有進度時顯示）
		if (progress > 0) {
			return `Uploading: ${progress}%`;
		}
		return '';
	}

	/**
	 * 解析 PlatformIO 上傳輸出以取得進度
	 * @param output 輸出文字
	 * @returns 解析的進度百分比 (0-100) 或 undefined
	 */
	private parseUploadProgress(output: string): number | undefined {
		// ESP32 esptool 輸出格式：
		// Writing at 0x00010000... (3 %)
		// Writing at 0x00020000... (50 %)
		const espMatch = output.match(/Writing at 0x[0-9a-f]+\.\.\.\s*\((\d+)\s*%\)/i);
		if (espMatch) {
			return parseInt(espMatch[1], 10);
		}

		// AVR avrdude 輸出格式：
		// Writing | ################################################## | 100% 2.44s
		// Reading | ################################################## | 100% 1.12s
		const avrMatch = output.match(/(?:Writing|Reading)\s*\|\s*#+\s*\|\s*(\d+)%/i);
		if (avrMatch) {
			return parseInt(avrMatch[1], 10);
		}

		// 另一種 avrdude 格式：
		// avrdude: writing flash (5678 bytes)
		// avrdude: 5678 bytes of flash written
		if (output.includes('bytes of flash written') || output.includes('bytes of flash verified')) {
			return 100;
		}

		// 連接階段
		if (output.includes('Connecting') || output.includes('Serial port')) {
			return 5;
		}
		if (output.includes('Chip is') || output.includes('Detected')) {
			return 10;
		}
		if (output.includes('Erasing flash') || output.includes('erasing')) {
			return 15;
		}
		if (output.includes('Compressed') || output.includes('compressed')) {
			return 20;
		}
		if (output.includes('Leaving') || output.includes('Hard resetting')) {
			return 100;
		}

		return undefined;
	}

	/**
	 * 執行編譯（含即時進度）
	 * @param onProgress 進度回調
	 * @returns 編譯結果
	 */
	private async compileWithProgress(
		onProgress?: (subProgress: number, message: string) => void
	): Promise<{ success: boolean; error?: string; details?: string }> {
		try {
			log('[arduino] 開始編譯（串流模式）', 'info');

			let lastProgress = 0;
			let lastMessage = 'Starting compilation...';
			let stderrOutput = '';

			const result = await this.streamingExecutor.spawn(
				`"${this.pioPath}"`,
				['run', '--project-dir', `"${this.workspacePath}"`],
				{
					timeout: this.compileTimeout,
					cwd: this.workspacePath,
				},
				// stdout 回調
				(data: string) => {
					const lines = data.split('\n').filter(l => l.trim());
					for (const line of lines) {
						const progress = this.parseCompileProgress(line);
						if (progress !== undefined && progress > lastProgress) {
							lastProgress = progress;
							const message = this.extractCompileMessage(line);
							if (message) {
								lastMessage = message;
							}
							onProgress?.(lastProgress, lastMessage);
						} else {
							// 即使沒有進度變化，也更新訊息（如記憶體使用資訊）
							const message = this.extractCompileMessage(line);
							if (message && message !== lastMessage) {
								lastMessage = message;
								onProgress?.(lastProgress, lastMessage);
							}
						}
					}
				},
				// stderr 回調（PlatformIO 把部分資訊寫到 stderr）
				(data: string) => {
					stderrOutput += data;
					const lines = data.split('\n').filter(l => l.trim());
					for (const line of lines) {
						const progress = this.parseCompileProgress(line);
						if (progress !== undefined && progress > lastProgress) {
							lastProgress = progress;
							const message = this.extractCompileMessage(line);
							if (message) {
								lastMessage = message;
							}
							onProgress?.(lastProgress, lastMessage);
						} else {
							const message = this.extractCompileMessage(line);
							if (message && message !== lastMessage) {
								lastMessage = message;
								onProgress?.(lastProgress, lastMessage);
							}
						}
					}
				}
			);

			// 檢查返回碼
			if (result.code !== 0) {
				const errorMessage = this.parseCompileError(stderrOutput || result.stderr || 'Compilation failed');
				log('[arduino] 編譯失敗 (code=' + result.code + ')', 'error', { error: errorMessage });
				return {
					success: false,
					error: 'Compilation failed',
					details: errorMessage,
				};
			}

			log('[arduino] 編譯成功', 'info');
			return { success: true };
		} catch (error: any) {
			const errorMessage = this.parseCompileError(error.stderr || error.message || String(error));
			log('[arduino] 編譯失敗', 'error', { error: errorMessage });
			return {
				success: false,
				error: 'Compilation failed',
				details: errorMessage,
			};
		}
	}

	/**
	 * 執行編譯並上傳到裝置（含即時進度）
	 * PlatformIO 的 --target upload 會自動檢查是否需要重新編譯
	 * @param port 連接埠，使用 'auto' 讓 PlatformIO 自動偵測
	 * @param onCompileProgress 編譯進度回調
	 * @param onUploadProgress 上傳進度回調
	 * @returns 上傳結果
	 */
	private async compileAndUploadWithProgress(
		port: string,
		onCompileProgress?: (subProgress: number, message: string) => void,
		onUploadProgress?: (subProgress: number, message: string) => void
	): Promise<{ success: boolean; error?: string; details?: string; stage?: 'compiling' | 'uploading' }> {
		try {
			log('[arduino] 開始編譯並上傳（串流模式）', 'info', { port });

			let lastCompileProgress = 0;
			let lastUploadProgress = 0;
			let stderrOutput = '';
			let isInUploadPhase = false;

			// 合併的逾時（編譯 + 上傳）
			const combinedTimeout = this.compileTimeout + this.uploadTimeout;

			// 建構命令參數
			// 如果 port 是 'auto'，不指定 --upload-port，讓 PlatformIO 自動偵測
			const args = ['run', '--target', 'upload', '--project-dir', `"${this.workspacePath}"`];
			if (port !== 'auto') {
				args.splice(3, 0, '--upload-port', `"${port}"`);
			}

			const result = await this.streamingExecutor.spawn(
				`"${this.pioPath}"`,
				args,
				{
					timeout: combinedTimeout,
					cwd: this.workspacePath,
				},
				// stdout 回調
				(data: string) => {
					const lines = data.split('\n').filter(l => l.trim());
					for (const line of lines) {
						// 檢測是否進入上傳階段
						if (line.includes('Uploading') || line.includes('upload protocol') || line.includes('Looking for upload port')) {
							isInUploadPhase = true;
						}

						if (!isInUploadPhase) {
							// 編譯階段
							const progress = this.parseCompileProgress(line);
							if (progress !== undefined && progress > lastCompileProgress) {
								lastCompileProgress = progress;
								const message = this.extractCompileMessage(line);
								if (message) {
									onCompileProgress?.(lastCompileProgress, message);
								}
							} else {
								const message = this.extractCompileMessage(line);
								if (message) {
									onCompileProgress?.(lastCompileProgress, message);
								}
							}
						} else {
							// 上傳階段
							const progress = this.parseUploadProgress(line);
							if (progress !== undefined && progress > lastUploadProgress) {
								lastUploadProgress = progress;
								const message = this.extractUploadMessage(line, progress);
								onUploadProgress?.(lastUploadProgress, message);
							} else {
								const message = this.extractUploadMessage(line, lastUploadProgress);
								if (message && !message.includes('%')) {
									onUploadProgress?.(lastUploadProgress, message);
								}
							}
						}
					}
				},
				// stderr 回調
				(data: string) => {
					stderrOutput += data;
					const lines = data.split('\n').filter(l => l.trim());
					for (const line of lines) {
						// 檢測是否進入上傳階段
						if (line.includes('Uploading') || line.includes('upload protocol') || line.includes('Looking for upload port')) {
							isInUploadPhase = true;
						}

						if (!isInUploadPhase) {
							// 編譯階段
							const progress = this.parseCompileProgress(line);
							if (progress !== undefined && progress > lastCompileProgress) {
								lastCompileProgress = progress;
								const message = this.extractCompileMessage(line);
								if (message) {
									onCompileProgress?.(lastCompileProgress, message);
								}
							} else {
								const message = this.extractCompileMessage(line);
								if (message) {
									onCompileProgress?.(lastCompileProgress, message);
								}
							}
						} else {
							// 上傳階段
							const progress = this.parseUploadProgress(line);
							if (progress !== undefined && progress > lastUploadProgress) {
								lastUploadProgress = progress;
								const message = this.extractUploadMessage(line, progress);
								onUploadProgress?.(lastUploadProgress, message);
							} else {
								const message = this.extractUploadMessage(line, lastUploadProgress);
								if (message && !message.includes('%')) {
									onUploadProgress?.(lastUploadProgress, message);
								}
							}
						}
					}
				}
			);

			// 檢查返回碼
			if (result.code !== 0) {
				// 判斷是編譯錯誤還是上傳錯誤
				// 檢查 stdout 內容來補充判斷（在測試環境中 streaming 回調可能不會觸發）
				const stdoutContent = result.stdout || '';
				const reachedUploadPhase =
					isInUploadPhase ||
					stdoutContent.includes('Uploading') ||
					stdoutContent.includes('upload protocol') ||
					stdoutContent.includes('Looking for upload port');
				const isCompileError = !reachedUploadPhase || stderrOutput.includes('error:') || stderrOutput.includes('Error:');
				const stage = isCompileError ? 'compiling' : 'uploading';
				const stderrForParsing = stderrOutput || result.stderr || '';
				const errorMessage = isCompileError
					? this.parseCompileError(stderrForParsing || 'Compilation failed')
					: this.parseUploadError(stderrForParsing || 'Upload failed');
				const classifiedError = isCompileError ? 'Compilation failed' : this.classifyUploadError(stderrForParsing);
				log(`[arduino] ${stage === 'compiling' ? '編譯' : '上傳'}失敗 (code=${result.code})`, 'error', { error: errorMessage });
				return {
					success: false,
					error: classifiedError,
					details: errorMessage.slice(0, 200),
					stage,
				};
			}

			log('[arduino] 編譯並上傳成功', 'info');
			return { success: true };
		} catch (error: any) {
			const stdoutContent = error.stdout || '';
			const stderrContent = error.stderr || error.message || String(error);
			const reachedUploadPhase =
				stdoutContent.includes('Uploading') ||
				stdoutContent.includes('upload protocol') ||
				stdoutContent.includes('Looking for upload port');
			const isCompileError = !reachedUploadPhase;
			const stage = isCompileError ? 'compiling' : 'uploading';
			const errorMessage = isCompileError
				? this.parseCompileError(stderrContent || 'Compilation failed')
				: this.parseUploadError(stderrContent);
			const classifiedError = isCompileError ? 'Compilation failed' : this.classifyUploadError(stderrContent);
			log(`[arduino] ${stage === 'compiling' ? '編譯' : '上傳'}失敗`, 'error', { error: errorMessage });
			return {
				success: false,
				error: classifiedError,
				details: errorMessage.slice(0, 200),
				stage,
			};
		}
	}

	/**
	 * 執行編譯（舊版，無即時進度，保留供測試用）
	 * @returns 編譯結果
	 */
	private async compile(): Promise<{ success: boolean; error?: string; details?: string }> {
		try {
			log('[arduino] 開始編譯', 'info');

			await this.executor.exec(`"${this.pioPath}" run --project-dir "${this.workspacePath}"`, {
				timeout: this.compileTimeout,
				cwd: this.workspacePath,
			});

			log('[arduino] 編譯成功', 'info');
			return { success: true };
		} catch (error: any) {
			const errorMessage = this.parseCompileError(error.stderr || error.message || String(error));
			log('[arduino] 編譯失敗', 'error', { error: errorMessage });
			return {
				success: false,
				error: 'Compilation failed',
				details: errorMessage,
			};
		}
	}

	/**
	 * 執行上傳到裝置
	 * @param port 連接埠
	 * @returns 上傳結果
	 */
	private async uploadToDevice(port: string): Promise<{ success: boolean; error?: string; details?: string }> {
		try {
			log('[arduino] 開始上傳到裝置', 'info', { port });

			const command = `"${this.pioPath}" run --target upload --upload-port "${port}" --project-dir "${this.workspacePath}"`;

			await this.executor.exec(command, {
				timeout: this.uploadTimeout,
				cwd: this.workspacePath,
			});

			log('[arduino] 上傳成功', 'info');
			return { success: true };
		} catch (error: any) {
			const errorMessage = this.parseUploadError(error.stderr || error.message || String(error));
			log('[arduino] 上傳失敗', 'error', { error: errorMessage });
			return {
				success: false,
				error: 'Upload failed',
				details: errorMessage,
			};
		}
	}

	/**
	 * 解析編譯錯誤訊息
	 * @param stderr 錯誤輸出
	 * @returns 簡化的錯誤訊息
	 */
	parseCompileError(stderr: string): string {
		if (!stderr) {
			return 'Unknown compilation error';
		}

		// 嘗試提取 PlatformIO 錯誤摘要
		const errorPatterns = [
			// GCC 錯誤格式: file.cpp:line:col: error: message
			/\.cpp:\d+:\d+: error: (.+)/i,
			// PlatformIO 錯誤格式
			/Error: (.+)/i,
			// 一般錯誤
			/error: (.+)/i,
			// 找不到標頭檔
			/fatal error: (.+): No such file or directory/i,
		];

		for (const pattern of errorPatterns) {
			const match = stderr.match(pattern);
			if (match) {
				// 截取前 200 字元避免訊息過長
				return match[1].slice(0, 200);
			}
		}

		// 如果找不到特定錯誤，回傳截斷的 stderr
		const lines = stderr.split('\n').filter(line => line.trim().length > 0);
		const errorLines = lines.filter(line => line.toLowerCase().includes('error'));
		if (errorLines.length > 0) {
			return errorLines[0].slice(0, 200);
		}

		return stderr.slice(0, 200);
	}

	/**
	 * 根據 stderr 內容分類上傳錯誤
	 * @param stderr PlatformIO 的錯誤輸出
	 * @returns 語義化的錯誤分類字串（用於 WebView i18n 映射）
	 */
	classifyUploadError(stderr: string): string {
		if (!stderr) {
			return 'Upload failed';
		}
		const lower = stderr.toLowerCase();
		if (lower.includes('could not open port') || lower.includes('access denied') || lower.includes('device or resource busy')) {
			return 'Port is busy';
		}
		if (lower.includes('device disconnected')) {
			return 'Device disconnected';
		}
		if (lower.includes('timed out')) {
			return 'Upload timed out';
		}
		if (lower.includes('failed to connect') || lower.includes('chip sync')) {
			return 'Connection failed';
		}
		if (
			lower.includes('upload_port') ||
			lower.includes('no serial port') ||
			lower.includes('no boards found') ||
			lower.includes('looking for upload port')
		) {
			return 'No device detected';
		}
		return 'Upload failed';
	}

	/**
	 * 解析上傳錯誤訊息
	 * @param stderr 錯誤輸出
	 * @returns 簡化的錯誤訊息
	 */
	private parseUploadError(stderr: string): string {
		if (!stderr) {
			return 'Unknown upload error';
		}

		// 常見的上傳錯誤
		const errorPatterns = [
			// 連接埠錯誤
			/could not open port/i,
			/access denied/i,
			/device or resource busy/i,
			// 裝置斷線
			/device disconnected/i,
			/timed out/i,
			// ESP32 特有錯誤
			/failed to connect/i,
			/chip sync/i,
		];

		for (const pattern of errorPatterns) {
			if (pattern.test(stderr)) {
				const match = stderr.match(pattern);
				return match ? match[0] : 'Connection error';
			}
		}

		return stderr.slice(0, 200);
	}

	/**
	 * 建立失敗結果
	 */
	private createFailureResult(
		startTime: number,
		port: string,
		stage: ArduinoUploadStage,
		message: string,
		details?: string
	): ArduinoUploadResult {
		return {
			success: false,
			timestamp: new Date().toISOString(),
			port,
			duration: Date.now() - startTime,
			error: { stage, message, details },
		};
	}

	/**
	 * 執行編譯/上傳
	 * @param request 上傳請求
	 * @param onProgress 進度回調
	 * @returns 上傳結果
	 */
	async upload(request: ArduinoUploadRequest, onProgress?: ArduinoProgressCallback): Promise<ArduinoUploadResult> {
		this.startTime = Date.now();

		// 輔助函式：發送帶耗時的進度
		const sendProgress = (stage: ArduinoUploadStage, progress: number, message: string, subProgress?: number, error?: string) => {
			onProgress?.({
				stage,
				progress,
				message,
				subProgress,
				elapsed: this.getElapsed(),
				error,
			});
		};

		try {
			// 階段 1: 同步設定 (5%)
			sendProgress('syncing', 5, 'Syncing settings...');
			await this.syncSettings(request);

			// 階段 2: 儲存工作區 (10%)
			sendProgress('saving', 10, 'Saving workspace...');
			await this.saveCode(request.code);

			// 階段 3: 檢查 PlatformIO (15%)
			sendProgress('checking_pio', 15, 'Checking compiler...');
			const hasPio = await this.checkPioInstalled();
			if (!hasPio) {
				sendProgress('failed', 15, 'PlatformIO not found', undefined, 'PIO_NOT_FOUND');
				return this.createFailureResult(this.startTime, 'none', 'checking_pio', 'PlatformIO CLI not found');
			}

			// 階段 4: 編譯並上傳 (20-95%)
			// 使用 --target upload，PlatformIO 會自動：
			// 1. 檢查是否需要重新編譯
			// 2. 編譯（如有需要）
			// 3. 嘗試上傳到連接的裝置
			// 若無板子，至少能確認編譯是否有語法錯誤
			sendProgress('compiling', 20, 'Building & uploading...', 0);

			const result = await this.compileAndUploadWithProgress(
				'auto', // 讓 PlatformIO 自動偵測連接埠
				// 編譯進度回調（映射到 20-55%）
				(subProgress, subMessage) => {
					const mappedProgress = 20 + Math.round(subProgress * 0.35);
					sendProgress('compiling', mappedProgress, subMessage, subProgress);
				},
				// 上傳進度回調（映射到 60-95%）
				(subProgress, subMessage) => {
					const mappedProgress = 60 + Math.round(subProgress * 0.35);
					sendProgress('uploading', mappedProgress, subMessage, subProgress);
				}
			);

			if (!result.success) {
				const failStage = result.stage || 'uploading';
				const isCompileError = failStage === 'compiling';
				const failProgress = isCompileError ? 45 : 80;

				// 清楚區分錯誤類型，幫助用戶判斷問題
				const errorMessage = isCompileError
					? 'Compilation failed - check your code' // 程式碼問題
					: 'Upload failed - check device connection'; // 硬體連接問題

				sendProgress('failed', failProgress, errorMessage, undefined, result.details);
				return this.createFailureResult(this.startTime, 'auto', failStage, result.error || errorMessage, result.details);
			}

			// 完成
			sendProgress('completed', 100, 'Upload successful!');
			return {
				success: true,
				timestamp: new Date().toISOString(),
				port: 'auto',
				duration: Date.now() - this.startTime,
				mode: 'upload',
			};
		} catch (error: any) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			log('[arduino] 上傳過程發生未預期錯誤', 'error', error);
			sendProgress('failed', 0, errorMessage, undefined, errorMessage);
			return this.createFailureResult(this.startTime, 'auto', 'failed', errorMessage);
		}
	}
}
