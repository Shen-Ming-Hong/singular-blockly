/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { log, showOutputChannel, disposeOutputChannel } from './services/logging';
import { LocaleService } from './services/localeService';
import { SettingsManager } from './services/settingsManager';
import { WebViewManager } from './webview/webviewManager';
import { AIModelManager } from './services/aiModelManager';
import { AIStatusBar } from './services/aiStatusBar';
import { PlatformioDiagnosticService } from './services/platformioDiagnosticService';
import { PlatformioDiagnosticPanel } from './webview/platformioDiagnosticPanel';
import { ProjectSkillService } from './services/projectSkillService';
import { WorkspaceCandidateService } from './services/workspaceCandidateService';
import { createManagedRuntimeService } from './services/managedRuntimeFactory';
import type { ManagedRuntimeService } from './services/managedRuntimeService';
import { ManagedRuntimeInitializationCoordinator } from './services/managedRuntimeInitializationCoordinator';
import { ManagedRuntimeProgressPresenter } from './services/managedRuntimeProgressPresenter';
import { CoreEnvironmentManager } from './services/coreEnvironmentManager';
import { ManagedCoreEnvironmentProvider, ProviderCoreEnvironmentProvider } from './services/coreEnvironmentProviders';
import { PlatformioAiRepairPacketService } from './services/platformioAiRepairPacketService';
import { FeedbackClient } from './services/feedbackClient';
import { FeedbackEventRecorder } from './services/feedbackDiagnostics';
import { FeedbackIdentityService } from './services/feedbackIdentity';
import { createManagedRuntimeFetch } from './services/managedRuntimeProxy';
import { FeedbackPanel } from './webview/feedbackPanel';

// AI model manager (initialized when Copilot is available)
let aiModelManager: AIModelManager | undefined;
let aiStatusBarInstance: AIStatusBar | undefined;

// VSCode API 引用（可在測試中注入）
let vscodeApi: typeof vscode = vscode;

/**
 * 設置 VSCode API 引用（僅用於測試）
 * @param api VSCode API 實例
 */
export function _setVSCodeApi(api: typeof vscode): void {
	vscodeApi = api;
}

/**
 * 重置為生產環境預設值（僅用於測試）
 */
export function _reset(): void {
	vscodeApi = vscode;
}

/**
 * 啟用擴充功能
 * @param context 擴充功能上下文
 */
export async function activate(context: vscode.ExtensionContext) {
	log('Starting Singular Blockly extension...', 'info');

	try {
		// 初始化服務
		const localeService = new LocaleService(context.extensionPath);
		let managedRuntimeService: ManagedRuntimeService | undefined;
		try {
			managedRuntimeService = await createManagedRuntimeService(context);
		} catch (error) {
			log('Managed runtime configuration is unavailable; provider compatibility remains enabled', 'warn', {
				code: error instanceof Error && 'code' in error ? String((error as Error & { code?: unknown }).code) : 'invalid-configuration',
			});
		}
		const coreEnvironmentManager = new CoreEnvironmentManager(
			new ProviderCoreEnvironmentProvider({
				getCustomPath: () => vscodeApi.workspace.getConfiguration('platformio-ide').get<unknown>('customPATH'),
			}),
			new ManagedCoreEnvironmentProvider(managedRuntimeService)
		);
		const managedRuntimeInitialization = managedRuntimeService
			? new ManagedRuntimeInitializationCoordinator(managedRuntimeService)
			: undefined;
		const platformioDiagnosticService = PlatformioDiagnosticService.fromLocaleService(localeService, {
			configuration: {
				get(section: string, key: string) {
					return vscodeApi.workspace.getConfiguration(section).get(key);
				},
			},
			managedRuntime: managedRuntimeService,
			coreEnvironmentManager,
		});
		const managedRuntimeProgress = managedRuntimeService && managedRuntimeInitialization
			? new ManagedRuntimeProgressPresenter(managedRuntimeService, managedRuntimeInitialization, localeService, {
				withProgress: async (options, task) => vscodeApi.window.withProgress(
					{ location: vscodeApi.ProgressLocation.Notification, ...options },
					task
				),
				showErrorMessage: async (message, ...actions) => vscodeApi.window.showErrorMessage(message, ...actions),
				openDiagnostics: async () => {
					await vscodeApi.commands.executeCommand('singular-blockly.checkPlatformioStatus');
				},
				chooseShorterFolder: async () => {
					await vscodeApi.commands.executeCommand(
						'workbench.action.openSettings',
						'singularBlockly.managedRuntime.path'
					);
				},
				copyRepairPacket: async () => {
					await vscodeApi.commands.executeCommand('singular-blockly.copyPlatformioRepairPacket');
				},
			})
			: undefined;
		const initializeManagedRuntime = (trigger: 'activation' | 'editor-open'): void => {
			if (!managedRuntimeInitialization) {return;}
			const initialization = managedRuntimeProgress
				? managedRuntimeProgress.initialize(trigger)
				: managedRuntimeInitialization.initialize(trigger);
			void initialization.then(result => {
				log('[managed-runtime] background initialization completed', 'info', result);
			}).catch(error => {
				const provisioning = managedRuntimeService?.getProvisioningState();
				log('[managed-runtime] background initialization deferred after failure', 'warn', {
					trigger,
					code: error instanceof Error && 'code' in error ? String((error as Error & { code?: unknown }).code) : 'initialization-failed',
					stage: provisioning?.status === 'failed' ? provisioning.failure.stage : 'unknown',
					attempt: provisioning?.attempt ?? 0,
				});
			});
		};
		initializeManagedRuntime('activation');

		// 【最優先】檢查是否為 CyberBrick/MicroPython 專案，若是則刪除 platformio.ini
		// 必須在 PlatformIO 擴充功能偵測到 ini 檔案之前執行
		const workspaceFolders = vscodeApi.workspace.workspaceFolders;
		let primaryWorkspaceCandidateService: { key: string; service: WorkspaceCandidateService } | undefined;
		const syncPrimaryWorkspaceCandidateService = (force = false): void => {
			const folder = vscodeApi.workspace.workspaceFolders?.[0];
			if (!folder) {
				primaryWorkspaceCandidateService?.service.dispose();
				primaryWorkspaceCandidateService = undefined;
				return;
			}
			const key = path.resolve(folder.uri.fsPath);
			if (!force && !ProjectSkillService.isBlocklyProject(folder.uri.fsPath)) {
				primaryWorkspaceCandidateService?.service.dispose();
				primaryWorkspaceCandidateService = undefined;
				return;
			}
			if (primaryWorkspaceCandidateService?.key === key) {return;}
			primaryWorkspaceCandidateService?.service.dispose();
			const service = createWorkspaceCandidateService(folder.uri.fsPath, localeService).start(vscodeApi.workspace);
			primaryWorkspaceCandidateService = { key, service };
			context.subscriptions.push(service);
		};
		syncPrimaryWorkspaceCandidateService();
		if (workspaceFolders) {
			const workspaceRoot = workspaceFolders[0].uri.fsPath;

			// 檢查 main.json 中的 board 設定
			const mainJsonPath = path.join(workspaceRoot, 'blockly', 'main.json');
			const platformioIniPath = path.join(workspaceRoot, 'platformio.ini');

			try {
				if (fs.existsSync(mainJsonPath)) {
					const mainJsonContent = fs.readFileSync(mainJsonPath, 'utf-8');
					const mainJson = JSON.parse(mainJsonContent);
					const board = mainJson.board || 'none';

					// 如果是 CyberBrick 專案，刪除 platformio.ini
					if (board === 'cyberbrick') {
						log('CyberBrick project detected at activation, checking platformio.ini', 'info');
						if (fs.existsSync(platformioIniPath)) {
							fs.unlinkSync(platformioIniPath);
							log('Deleted platformio.ini for CyberBrick project at activation', 'info');
						}
					}
				}
			} catch (err) {
				log('Error checking/deleting platformio.ini at activation', 'warn', err);
			}

			// Activation may inspect any folder. Only established Blockly projects may
			// receive workspace-local settings without a new-project confirmation.
			if (ProjectSkillService.isBlocklyProject(workspaceRoot)) {
				const settingsManager = new SettingsManager(workspaceRoot);
				await settingsManager.configurePlatformIOSettings();
				log('PlatformIO auto-open settings configured for Blockly project at activation', 'info');
			}
		}

		if (typeof vscodeApi.workspace.onDidChangeWorkspaceFolders === 'function') {
			context.subscriptions.push(
				vscodeApi.workspace.onDidChangeWorkspaceFolders(() => {
					syncPrimaryWorkspaceCandidateService();
				})
			);
		}

		// 清理過期的臨時工具箱檔案（非阻塞）
		WebViewManager.cleanupStaleTempFiles(context.extensionPath).catch(err => {
			log('Failed to cleanup stale temp files during activation', 'warn', err);
		});

		// 註冊活動欄視圖
		registerActivityBarView(context);

		// 初始化 AI 影子建議服務（在註冊命令前完成，確保 WebViewManager 可取得 AIModelManager）
		await initializeAIServices(context).catch(err => {
			log('AI services initialization failed (non-critical)', 'warn', err);
		});

		// 註冊命令
		registerCommands(
			context,
			localeService,
			platformioDiagnosticService,
			() => syncPrimaryWorkspaceCandidateService(true),
			coreEnvironmentManager,
			managedRuntimeService,
			managedRuntimeProgress,
			() => initializeManagedRuntime('editor-open')
		);

		setupConfigurationListener(context);

		log('Singular Blockly extension fully activated!', 'info');
	} catch (error) {
		log('Error starting Singular Blockly:', 'error', error);
		vscodeApi.window.showErrorMessage(`Failed to start Singular Blockly: ${error}`);
	}
}

/**
 * 註冊活動欄視圖
 * @param context 擴充功能上下文
 */
function registerActivityBarView(context: vscode.ExtensionContext) {
	log('Registering activity bar view...', 'info');

	const activityBarListener = vscodeApi.window.registerWebviewViewProvider('singular-blockly-view', {
		resolveWebviewView: async webviewView => {
			// 立即關閉側邊欄
			await vscodeApi.commands.executeCommand('workbench.action.closeSidebar');
			await vscodeApi.commands.executeCommand('singular-blockly.openBlocklyEdit');
			log('Initialization complete, closing sidebar', 'info');

			// 監聽後續的可見性變更
			webviewView.onDidChangeVisibility(async () => {
				if (webviewView.visible) {
					log('Activity bar button clicked!', 'info');
					await vscodeApi.commands.executeCommand('workbench.action.closeSidebar');
					await vscodeApi.commands.executeCommand('singular-blockly.openBlocklyEdit');
				}
			});
		},
	});

	context.subscriptions.push(activityBarListener);
}

/**
 * 註冊命令
 * @param context 擴充功能上下文
 * @param localeService 多語言服務
 * @param diagnosticService 診斷服務
 */
function registerCommands(
	context: vscode.ExtensionContext,
	localeService: LocaleService,
	platformioDiagnosticService: PlatformioDiagnosticService,
	ensurePrimaryWorkspaceCandidateService: () => void,
	coreEnvironmentManager?: CoreEnvironmentManager,
	managedRuntimeService?: ManagedRuntimeService,
	managedRuntimeProgress?: ManagedRuntimeProgressPresenter,
	initializeManagedRuntime?: () => void
) {
	log('Registering commands...', 'info');

	// WebView 管理器（單例）
	let webViewManager: WebViewManager | undefined;
	let editorOpenInFlight: Promise<void> | undefined;
	const diagnosticManagedRuntime = managedRuntimeService
		? {
			repair: () => managedRuntimeProgress?.repair() ?? managedRuntimeService.repair(),
			cleanup: () => managedRuntimeService.cleanup(),
			getStorageRoot: () => managedRuntimeService.getStorageRoot(),
		}
			: undefined;
	let feedbackPanel: FeedbackPanel;
	const feedbackEvents = new FeedbackEventRecorder();
	feedbackEvents.record({ stage: 'extension', code: 'activated', outcome: 'succeeded' });
	const platformioDiagnosticPanel = new PlatformioDiagnosticPanel(context, localeService, platformioDiagnosticService, fs, {
		managedRuntimeService: diagnosticManagedRuntime,
		coreEnvironmentManager,
		openFeedback: prefill => feedbackPanel.show(prefill),
		recordFeedbackEvent: event => feedbackEvents.record(event),
	});
	const feedbackIdentity = new FeedbackIdentityService(context.secrets);
	const feedbackFetch = createManagedRuntimeFetch(() => {
		const configuration = vscodeApi.workspace.getConfiguration('http');
		return {
			proxy: configuration.get<string>('proxy'),
			proxySupport: configuration.get<string>('proxySupport'),
			noProxy: configuration.get<string[]>('noProxy', []),
		};
	});
	feedbackPanel = new FeedbackPanel(
		context,
		localeService,
		feedbackIdentity,
		new FeedbackClient(feedbackFetch),
		() => ({
			extensionVersion: typeof context.extension?.packageJSON?.version === 'string'
				? context.extension.packageJSON.version
				: '',
			vscodeVersion: typeof vscodeApi.version === 'string' ? vscodeApi.version : '',
			platform: process.platform,
			release: os.release(),
			arch: os.arch(),
			locale: vscodeApi.env.language,
			remoteName: vscodeApi.env.remoteName,
			workspaceFoldersCount: vscodeApi.workspace.workspaceFolders?.length ?? 0,
			workspaceTrusted: vscodeApi.workspace.isTrusted === true,
			recentEvents: feedbackEvents.snapshot(),
		})
	);

	// 註冊開啟 Blockly 編輯器命令
	const openBlocklyEdit = vscodeApi.commands.registerCommand('singular-blockly.openBlocklyEdit', async () => {
		try {
			initializeManagedRuntime?.();
			// 懶初始化 WebView 管理器
			if (!webViewManager) {
				webViewManager = new WebViewManager(context, undefined, undefined, undefined, coreEnvironmentManager);
				// Inject AI model manager if available
				if (aiModelManager) {
					webViewManager.setAIModelManager(aiModelManager, aiStatusBarInstance);
				}
			}

			if (!editorOpenInFlight) {
				const manager = webViewManager;
				const requestedPrimaryPath = vscodeApi.workspace.workspaceFolders?.[0]?.uri.fsPath;
				editorOpenInFlight = (async () => {
					const openResult = await manager.createAndShowWebView();
					if (openResult === 'opened') {
						const acceptedPrimaryFolder = vscodeApi.workspace.workspaceFolders?.[0];
						const workspaceUnchanged = requestedPrimaryPath !== undefined &&
							acceptedPrimaryFolder !== undefined &&
							path.resolve(acceptedPrimaryFolder.uri.fsPath) === path.resolve(requestedPrimaryPath);
						// An existing Blockly workspace or an explicitly accepted new project may
						// receive workspace watchers and the project-local Skill. Cancellation
						// remains write-free. If the primary workspace changes while the prompt is
						// open, the accepted result belongs to the old workspace and must not write
						// into the replacement folder.
						if (workspaceUnchanged) {
							ensurePrimaryWorkspaceCandidateService();
							await installProjectSkillAfterEditorOpened(context, [acceptedPrimaryFolder]);
						}
					}
				})().finally(() => {
					editorOpenInFlight = undefined;
				});
			}
			await editorOpenInFlight;
		} catch (error) {
			log('Error opening Blockly editor:', 'error', error);
			const errorMsg = await localeService.getLocalizedMessage(
				'VSCODE_FAILED_OPEN_EDITOR',
				'Failed to open Blockly editor: {0}',
				String(error)
			);
			vscodeApi.window.showErrorMessage(errorMsg);
		}
	});

	// 註冊主題切換命令
	const toggleThemeCommand = vscodeApi.commands.registerCommand('singular-blockly.toggleTheme', async () => {
		try {
			const workspaceFolders = vscodeApi.workspace.workspaceFolders;
			if (!workspaceFolders) {
				return;
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const settingsManager = new SettingsManager(workspaceRoot);

			// 切換主題
			const newTheme = await settingsManager.toggleTheme();

			log(`Theme toggled to: ${newTheme}`, 'info');

			// 如果 WebView 已經開啟，通知更新主題
			if (webViewManager && webViewManager.isPanelCreated()) {
				const panel = webViewManager.getPanel();
				panel?.webview.postMessage({
					command: 'updateTheme',
					theme: newTheme,
				});
			}

			// 如果 Blockly 編輯器已開啟,通知它更新主題
			vscodeApi.window.visibleTextEditors.forEach(editor => {
				if (editor.document.fileName.endsWith('blocklyEdit.html')) {
					editor.document.save();
				}
			});
		} catch (error) {
			log('Error toggling theme:', 'error', error);
		}
	});
	// 註冊顯示輸出窗口命令
	const showOutputCommand = vscodeApi.commands.registerCommand('singular-blockly.showOutput', () => {
		showOutputChannel();
	});
	// 註冊預覽備份命令
	const previewBackupCommand = vscodeApi.commands.registerCommand('singular-blockly.previewBackup', async (backupPath?: string) => {
		try {
			log('Preview backup command triggered', 'info');

			// 若沒有提供備份路徑,可能需要讓用戶選擇
			if (!backupPath) {
				log('No backup path provided, need to select a backup file', 'info');

				// 獲取工作區路徑
				const workspaceFolders = vscodeApi.workspace.workspaceFolders;
				if (!workspaceFolders) {
					const errorMsg = await localeService.getLocalizedMessage(
						'ERROR_OPEN_PROJECT_FOLDER_FIRST',
						'Please open a project folder first'
					);
					vscodeApi.window.showErrorMessage(errorMsg);
					return;
				}

				// 獲取備份目錄
				const workspaceRoot = workspaceFolders[0].uri.fsPath;
				const backupsDir = path.join(workspaceRoot, 'backups');

				// 檢查備份目錄是否存在
				try {
					const stat = await vscodeApi.workspace.fs.stat(vscodeApi.Uri.file(backupsDir));
					if ((stat.type & vscodeApi.FileType.Directory) === 0) {
						const infoMsg = await localeService.getLocalizedMessage('INFO_NO_BACKUPS_TO_PREVIEW', 'No backup files to preview');
						vscodeApi.window.showInformationMessage(infoMsg);
						return;
					}
				} catch (error) {
					const infoMsg = await localeService.getLocalizedMessage('INFO_NO_BACKUPS_TO_PREVIEW', 'No backup files to preview');
					vscodeApi.window.showInformationMessage(infoMsg);
					return;
				}

				// 讓用戶選擇備份檔案
				const selectTitle = await localeService.getLocalizedMessage('DIALOG_SELECT_BACKUP_TITLE', 'Select backup file to preview');
				const backupFilesLabel = await localeService.getLocalizedMessage('DIALOG_BACKUP_FILES_LABEL', 'Backup Files');
				const fileUris = await vscodeApi.window.showOpenDialog({
					canSelectFiles: true,
					canSelectFolders: false,
					canSelectMany: false,
					defaultUri: vscodeApi.Uri.file(backupsDir),
					filters: {
						[backupFilesLabel]: ['json'],
					},
					title: selectTitle,
				});
				if (!fileUris || fileUris.length === 0) {
					return;
				}

				backupPath = fileUris[0].fsPath;
			}

			log(`Attempting to preview backup: ${backupPath}`, 'info');

			// 懶初始化 WebView 管理器
			if (!webViewManager) {
				webViewManager = new WebViewManager(context, undefined, undefined, undefined, coreEnvironmentManager);
			}

			// 調用預覽功能
			await webViewManager.previewBackup(backupPath);
		} catch (error) {
			log('Error previewing backup:', 'error', error);
			const errorMsg = await localeService.getLocalizedMessage(
				'VSCODE_FAILED_PREVIEW_BACKUP',
				'Failed to preview backup: {0}',
				String(error)
			);
			vscodeApi.window.showErrorMessage(errorMsg);
		}
	});

	const checkPlatformioStatusCommand = vscodeApi.commands.registerCommand('singular-blockly.checkPlatformioStatus', async () => {
		try {
			await platformioDiagnosticPanel.show();
		} catch (error) {
			log('Error opening PlatformIO diagnostic panel:', 'error', error);
			const errorMsg = await localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_TOP_LEVEL_ERROR',
				'Unable to complete PlatformIO diagnostics: {0}',
				String(error)
			);
			vscodeApi.window.showErrorMessage(errorMsg);
		}
	});
	const provideFeedbackCommand = vscodeApi.commands.registerCommand('singular-blockly.provideFeedback', async () => {
		try {
			await feedbackPanel.show();
		} catch (error) {
			log('[feedback] failed to open panel', 'error', {
				code: error instanceof Error && 'code' in error
					? String((error as Error & { code?: unknown }).code)
					: 'panel-open-failed',
			});
			vscodeApi.window.showErrorMessage(await localeService.getLocalizedMessage(
				'FEEDBACK_OPEN_FAILED',
				'Unable to open the feedback form. Please try again.'
			));
		}
	});
	const showMyFeedbackCommand = vscodeApi.commands.registerCommand('singular-blockly.showMyFeedback', async () => {
		try {
			await feedbackPanel.showMyFeedback();
		} catch (error) {
			log('[feedback] failed to open personal feedback', 'error', {
				code: error instanceof Error && 'code' in error
					? String((error as Error & { code?: unknown }).code)
					: 'panel-open-failed',
			});
			vscodeApi.window.showErrorMessage(await localeService.getLocalizedMessage(
				'FEEDBACK_OPEN_FAILED',
				'Unable to open the feedback form. Please try again.'
			));
		}
	});
	const copyPlatformioRepairPacketCommand = vscodeApi.commands.registerCommand(
		'singular-blockly.copyPlatformioRepairPacket',
		async () => {
			try {
				const workspacePath = vscodeApi.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
				const session = await platformioDiagnosticService.collectDiagnostics(workspacePath);
				const packet = new PlatformioAiRepairPacketService().buildPacket({ session });
				await vscodeApi.env.clipboard.writeText(packet.plainText);
				vscodeApi.window.showInformationMessage(await localeService.getLocalizedMessage(
					'PLATFORMIO_REPAIR_AI_PACKET_COPY_SUCCESS',
					'AI repair packet copied with sensitive details redacted.'
				));
			} catch (error) {
				log('[managed-runtime] failed to copy repair packet', 'error', {
					code: error instanceof Error && 'code' in error
						? String((error as Error & { code?: unknown }).code)
						: 'copy-failed',
				});
				vscodeApi.window.showErrorMessage(await localeService.getLocalizedMessage(
					'PLATFORMIO_REPAIR_AI_PACKET_COPY_FAILED',
					'Unable to copy the AI repair packet: {0}',
					'copy-failed'
				));
			}
		}
	);

	// 註冊手動觸發 AI 積木建議命令（透過 keybinding Ctrl+Shift+. 觸發）
	const triggerAISuggestionCommand = vscodeApi.commands.registerCommand('singular-blockly.triggerAISuggestion', () => {
		if (webViewManager && webViewManager.isPanelCreated()) {
			const panel = webViewManager.getPanel();
			panel?.webview.postMessage({ command: 'triggerAISuggestion' });
		}
	});

	const stopTxtExecutionCommand = vscodeApi.commands.registerCommand('singular-blockly.stopTxtExecution', async () => {
		if (!webViewManager || !webViewManager.isPanelCreated()) {
			return;
		}

		try {
			await webViewManager.stopTxtExecutionFromExtension();
		} catch (error) {
			log('Error stopping TXT execution:', 'error', error);
		}
	});

	// TXT Test Panel 命令
	const installTxtRuntimeCommand = vscodeApi.commands.registerCommand('singular-blockly.txt.installRuntime', async () => {
		if (!webViewManager || !webViewManager.isPanelCreated()) {
			return;
		}

		try {
			await webViewManager.installTxtRuntimeFromExtension();
		} catch (error) {
			log('Error installing TXT runtime:', 'error', error);
		}
	});


	// 添加到訂閱清單
	context.subscriptions.push(platformioDiagnosticPanel);
	context.subscriptions.push(feedbackPanel);
	context.subscriptions.push(openBlocklyEdit);
	context.subscriptions.push(toggleThemeCommand);
	context.subscriptions.push(showOutputCommand);
	context.subscriptions.push(previewBackupCommand);
	context.subscriptions.push(checkPlatformioStatusCommand);
	context.subscriptions.push(provideFeedbackCommand);
	context.subscriptions.push(showMyFeedbackCommand);
	context.subscriptions.push(copyPlatformioRepairPacketCommand);
	context.subscriptions.push(triggerAISuggestionCommand);
	context.subscriptions.push(stopTxtExecutionCommand);
	context.subscriptions.push(installTxtRuntimeCommand);
}

/**
 * 設定配置變更監聽器
 */
function setupConfigurationListener(context: vscode.ExtensionContext) {
	const disposable = vscodeApi.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('singular-blockly.cyberbrick.uploadSettings')) {
			log('CyberBrick upload settings configuration changed', 'debug');
		}
	});

	context.subscriptions.push(disposable);
	log('Configuration listener registered', 'info');
}

async function installProjectSkillAfterEditorOpened(
	context: vscode.ExtensionContext,
	folders: readonly vscode.WorkspaceFolder[]
): Promise<void> {
	await Promise.all(
		folders.map(async folder => {
			const workspaceRoot = folder.uri.fsPath;
			try {
				await new ProjectSkillService(workspaceRoot, context.extensionPath).ensureInstalled();
			} catch {
				// Skill setup must never block normal Blockly activation or editor use.
				log('Project Skill setup failed without interrupting the editor', 'warn');
			}
		})
	);
}

function createWorkspaceCandidateService(workspaceRoot: string, localeService: LocaleService): WorkspaceCandidateService {
	return new WorkspaceCandidateService(workspaceRoot, undefined, undefined, undefined, async (issue, outcome) => {
		const restored = outcome === 'restored';
		const message = await localeService.getLocalizedMessage(
			restored ? 'WORKSPACE_CANDIDATE_INVALID_WARNING' : 'WORKSPACE_CANDIDATE_QUARANTINED_WARNING',
			restored
				? 'An invalid external workspace change was quarantined and the last valid version was restored.'
				: 'An invalid external workspace change was quarantined, but no last valid version was available to restore.'
		);
		const details = await localeService.getLocalizedMessage('WORKSPACE_CANDIDATE_SHOW_DETAILS', 'Show Output Details');
		const selection = await vscodeApi.window.showWarningMessage(`${message} (${issue.code})`, details);
		if (selection === details) {showOutputChannel();}
	});
}

/**
 * 初始化 AI 影子建議服務
 */
async function initializeAIServices(context: vscode.ExtensionContext): Promise<void> {
	// Unit Extension Hosts can have a user's Copilot extension installed. Avoid triggering
	// authentication or network-backed model discovery in the isolated unit test process.
	if (process.env.NODE_ENV === 'test') {
		log('Skipping AI model discovery in the unit test environment', 'info');
		return;
	}
	const manager = new AIModelManager();
	await manager.initialize();

	if (manager.getTier() === 'none') {
		log('No Copilot available, AI suggestions inactive', 'info');
		manager.dispose();
		return;
	}

	// Store globally so WebViewManager can access it
	aiModelManager = manager;

	// Create status bar UI
	const aiStatusBar = new AIStatusBar(manager, context);
	aiStatusBarInstance = aiStatusBar;
	context.subscriptions.push(aiStatusBar);
	context.subscriptions.push(manager);

	log(`AI suggestions initialized (tier: ${manager.getTier()})`, 'info');
}

/**
 * 停用擴充功能
 */
export function deactivate() {
	// 清理資源
	disposeOutputChannel();
}
