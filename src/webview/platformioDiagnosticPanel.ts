/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { LocaleService } from '../services/localeService';
import { log } from '../services/logging';
import { PlatformioDiagnosticService } from '../services/platformioDiagnosticService';
import {
	DiagnosticItemId,
	DiagnosticItemStatus,
	DiagnosticSource,
	PanelActionId,
	PlatformioDiagnosticExtensionToWebviewMessage,
	PlatformioDiagnosticLocalizedStrings,
	PlatformioDiagnosticPanelState,
	PlatformioDiagnosticWebviewToExtensionMessage,
	PlatformioOverallStatus,
} from '../types/platformioDiagnostic';

const PANEL_COMMAND_BY_STATE: Record<
	PlatformioDiagnosticPanelState['runState'],
	'platformioDiagnostic:loading' | 'platformioDiagnostic:render' | 'platformioDiagnostic:error'
> = {
	idle: 'platformioDiagnostic:loading',
	loading: 'platformioDiagnostic:loading',
	ready: 'platformioDiagnostic:render',
	error: 'platformioDiagnostic:error',
};

interface FileSystemLike {
	promises: {
		readFile(path: string, encoding?: BufferEncoding): Promise<string | Buffer>;
	};
}

// VSCode API 引用（可在測試中注入）
let vscodeApi: typeof vscode = vscode;

/**
 * 設置 VSCode API 引用（僅用於測試）
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

export class PlatformioDiagnosticPanel implements vscode.Disposable {
	private panel: vscode.WebviewPanel | undefined;
	private webviewReady = false;
	private hasInitialized = false;
	private currentState: PlatformioDiagnosticPanelState;
	private localizedStringsPromise: Promise<PlatformioDiagnosticLocalizedStrings> | null = null;
	private runningDiagnostics: Promise<void> | null = null;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly localeService: LocaleService,
		private readonly diagnosticService: PlatformioDiagnosticService,
		private readonly fileSystem: FileSystemLike = fs,
	) {
		this.currentState = this.diagnosticService.createLoadingState();
	}

	async show(): Promise<void> {
		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.One, true);
			return;
		}

		const title = await this.localeService.getLocalizedMessage(
			'PLATFORMIO_DIAGNOSTIC_PANEL_TITLE',
			'PlatformIO Diagnostic'
		);

		this.panel = vscodeApi.window.createWebviewPanel(
			'platformioDiagnostic',
			title,
			{
				viewColumn: vscode.ViewColumn.One,
				preserveFocus: true,
			},
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'media'))],
			}
		);

		this.panel.webview.html = await this.getWebviewContent();
		this.panel.webview.onDidReceiveMessage(async message => {
			await this.handleMessage(message as PlatformioDiagnosticWebviewToExtensionMessage);
		});
		this.panel.onDidDispose(() => {
			this.panel = undefined;
			this.webviewReady = false;
			this.hasInitialized = false;
			this.runningDiagnostics = null;
			this.currentState = this.diagnosticService.createLoadingState();
			this.localizedStringsPromise = null;
			log('[platformio-diagnostic] panel disposed', 'info');
		});

		log('[platformio-diagnostic] panel created', 'info');
	}

	getPanel(): vscode.WebviewPanel | undefined {
		return this.panel;
	}

	dispose(): void {
		this.panel?.dispose();
		this.panel = undefined;
	}

	private async handleMessage(message: PlatformioDiagnosticWebviewToExtensionMessage): Promise<void> {
		switch (message.command) {
			case 'platformioDiagnostic:ready':
				this.webviewReady = true;
				if (!this.hasInitialized) {
					this.hasInitialized = true;
					void this.runDiagnostics();
					return;
				}
				await this.postCurrentState();
				return;
			case 'platformioDiagnostic:retest':
				void this.runDiagnostics(true);
				return;
			case 'platformioDiagnostic:copySummary':
				await this.copySummary();
				return;
			default:
				return;
		}
	}

	private async runDiagnostics(force = false): Promise<void> {
		if (this.runningDiagnostics) {
			return this.runningDiagnostics;
		}

		this.currentState = this.diagnosticService.createLoadingState();
		await this.postState('platformioDiagnostic:loading');

		this.runningDiagnostics = (async () => {
			try {
				const workspacePath = vscodeApi.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
				const session = await this.diagnosticService.collectDiagnostics(workspacePath);
				this.currentState = this.diagnosticService.createReadyState(session);
				await this.postState('platformioDiagnostic:render');
			} catch (error) {
				log('[platformio-diagnostic] failed to collect diagnostics', 'error', error);
				const errorMessage = await this.localeService.getLocalizedMessage(
					'PLATFORMIO_DIAGNOSTIC_TOP_LEVEL_ERROR',
					'Unable to complete PlatformIO diagnostics: {0}',
					String(error)
				);
				this.currentState = this.diagnosticService.createErrorState(errorMessage);
				await this.postState('platformioDiagnostic:error');
			}
		})();

		try {
			await this.runningDiagnostics;
		} finally {
			this.runningDiagnostics = null;
		}
	}

	private async copySummary(): Promise<void> {
		if (!this.currentState.session) {
			await this.postMessage({
				command: 'platformioDiagnostic:copyResult',
				status: 'warning',
				message: await this.localeService.getLocalizedMessage(
					'PLATFORMIO_DIAGNOSTIC_COPY_UNAVAILABLE',
					'No diagnostic summary is available yet.'
				),
			});
			return;
		}

		try {
			const summary = await this.diagnosticService.buildClipboardSummary(this.currentState.session);
			await vscodeApi.env.clipboard.writeText(summary.plainText);
			await this.postMessage({
				command: 'platformioDiagnostic:copyResult',
				status: 'success',
				message: await this.localeService.getLocalizedMessage(
					'PLATFORMIO_DIAGNOSTIC_COPY_SUCCESS',
					'Diagnostic summary copied to the clipboard.'
				),
			});
		} catch (error) {
			log('[platformio-diagnostic] failed to copy summary', 'error', error);
			await this.postMessage({
				command: 'platformioDiagnostic:copyResult',
				status: 'error',
				message: await this.localeService.getLocalizedMessage(
					'PLATFORMIO_DIAGNOSTIC_COPY_FAILED',
					'Unable to copy the diagnostic summary: {0}',
					String(error)
				),
			});
		}
	}

	private async postCurrentState(): Promise<void> {
		await this.postState(PANEL_COMMAND_BY_STATE[this.currentState.runState]);
	}

	private async postState(
		command: 'platformioDiagnostic:loading' | 'platformioDiagnostic:render' | 'platformioDiagnostic:error'
	): Promise<void> {
		await this.postMessage({
			command,
			panelState: this.currentState,
			strings: await this.getLocalizedStrings(),
		});
	}

	private async postMessage(message: PlatformioDiagnosticExtensionToWebviewMessage): Promise<void> {
		if (!this.panel || !this.webviewReady) {
			return;
		}

		await this.panel.webview.postMessage(message);
	}

	private async getWebviewContent(): Promise<string> {
		const templatePath = path.join(this.context.extensionPath, 'media', 'html', 'platformioDiagnostic.html');
		const htmlContent = (await this.fileSystem.promises.readFile(templatePath, 'utf8')) as string;
		const cssUri = this.panel!.webview.asWebviewUri(
			vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'css', 'platformioDiagnostic.css'))
		);
		const jsUri = this.panel!.webview.asWebviewUri(
			vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'js', 'platformioDiagnostic.js'))
		);
		const panelTitle = await this.localeService.getLocalizedMessage(
			'PLATFORMIO_DIAGNOSTIC_PANEL_TITLE',
			'PlatformIO Diagnostic'
		);

		return htmlContent
			.replace(/\{cssUri\}/g, cssUri.toString())
			.replace(/\{jsUri\}/g, jsUri.toString())
			.replace(/\{panelTitle\}/g, panelTitle);
	}

	private async getLocalizedStrings(): Promise<PlatformioDiagnosticLocalizedStrings> {
		if (!this.localizedStringsPromise) {
			this.localizedStringsPromise = this.buildLocalizedStrings();
		}

		return this.localizedStringsPromise;
	}

	private async buildLocalizedStrings(): Promise<PlatformioDiagnosticLocalizedStrings> {
		const actionLabel = async (action: PanelActionId, fallback: string) => {
			const key = action === 'retest' ? 'PLATFORMIO_DIAGNOSTIC_ACTION_RETEST' : 'PLATFORMIO_DIAGNOSTIC_ACTION_COPY_SUMMARY';
			return this.localeService.getLocalizedMessage(key, fallback);
		};

		const itemStatuses = await this.createRecord<DiagnosticItemStatus>({
			ok: ['PLATFORMIO_DIAGNOSTIC_STATUS_OK', 'OK'],
			warning: ['PLATFORMIO_DIAGNOSTIC_STATUS_WARNING', 'Warning'],
			error: ['PLATFORMIO_DIAGNOSTIC_STATUS_ERROR', 'Error'],
		});

		const overallStatuses = await this.createRecord<PlatformioOverallStatus>({
			operational: ['PLATFORMIO_DIAGNOSTIC_OVERALL_OPERATIONAL', 'Operational'],
			degraded: ['PLATFORMIO_DIAGNOSTIC_OVERALL_DEGRADED', 'Degraded'],
			unavailable: ['PLATFORMIO_DIAGNOSTIC_OVERALL_UNAVAILABLE', 'Unavailable'],
		});

		const sources = await this.createRecord<DiagnosticSource>({
			'default-platformio-path': ['PLATFORMIO_DIAGNOSTIC_SOURCE_DEFAULT_PLATFORMIO_PATH', 'Default PlatformIO path'],
			'path-search': ['PLATFORMIO_DIAGNOSTIC_SOURCE_PATH_SEARCH', 'PATH search'],
			'resolved-pio-sibling': ['PLATFORMIO_DIAGNOSTIC_SOURCE_RESOLVED_PIO_SIBLING', 'Derived from resolved pio sibling'],
			'derived-from-penv': ['PLATFORMIO_DIAGNOSTIC_SOURCE_DERIVED_FROM_PENV', 'Derived from detected penv'],
			unresolved: ['PLATFORMIO_DIAGNOSTIC_SOURCE_UNRESOLVED', 'Unresolved'],
		});

		const toolNames = await this.createRecord<DiagnosticItemId>({
			pio: ['PLATFORMIO_DIAGNOSTIC_TOOL_PIO', 'PlatformIO CLI (pio)'],
			penvRoot: ['PLATFORMIO_DIAGNOSTIC_TOOL_PENV_ROOT', 'PlatformIO penv root'],
			python: ['PLATFORMIO_DIAGNOSTIC_TOOL_PYTHON', 'PlatformIO Python'],
			pip: ['PLATFORMIO_DIAGNOSTIC_TOOL_PIP', 'PlatformIO pip'],
			mpremote: ['PLATFORMIO_DIAGNOSTIC_TOOL_MPREMOTE', 'mpremote'],
		});

		return {
			panelTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_PANEL_TITLE', 'PlatformIO Diagnostic'),
			panelSubtitle: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_PANEL_SUBTITLE',
				'Check whether the extension can resolve PlatformIO CLI, penv, and the CyberBrick helper tools.'
			),
			loadingTitle: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_LOADING_TITLE',
				'Checking PlatformIO environment...'
			),
			loadingDescription: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_LOADING_DESCRIPTION',
				'This usually finishes in a few seconds. If a tool is slow, the panel will fall back to a partial result instead of hanging forever.'
			),
			errorTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_ERROR_TITLE', 'Diagnostic error'),
			summaryTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_SUMMARY_TITLE', 'Summary'),
			toolsTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_TOOLS_TITLE', 'Resolved tools'),
			scopeTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_SCOPE_TITLE', 'Scope'),
			workspaceLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_WORKSPACE', 'Workspace'),
			requestedAtLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_REQUESTED_AT', 'Generated at'),
			overallStatusLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_OVERALL_STATUS', 'Overall status'),
			pathLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_PATH', 'Path'),
			sourceLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_SOURCE', 'Source'),
			reasonLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_REASON', 'Reason'),
			nextStepLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_NEXT_STEP', 'Next step'),
			versionLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_VERSION', 'Version probe'),
			fromDetectedPenvLabel: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_FROM_DETECTED_PENV',
				'From detected penv'
			),
			fromDetectedPenvYes: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_BOOLEAN_YES', 'Yes'),
			fromDetectedPenvNo: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_BOOLEAN_NO', 'No'),
			unresolvedPathLabel: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_PATH_UNRESOLVED',
				'Not resolved'
			),
			noDataTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_DIAGNOSTIC_NO_DATA_TITLE', 'No data yet'),
			noDataDescription: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_NO_DATA_DESCRIPTION',
				'Run the diagnostic once to see resolved paths and tool details.'
			),
			copyUnavailableMessage: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_COPY_UNAVAILABLE',
				'No diagnostic summary is available yet.'
			),
			copySuccessMessage: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_COPY_SUCCESS',
				'Diagnostic summary copied to the clipboard.'
			),
			actions: {
				retest: await actionLabel('retest', 'Retest'),
				copySummary: await actionLabel('copySummary', 'Copy summary'),
			},
			toolNames,
			itemStatuses,
			overallStatuses,
			sources,
		};
	}

	private async createRecord<TKey extends string>(
		definitions: Record<TKey, [messageKey: string, fallback: string]>
	): Promise<Record<TKey, string>> {
		const definitionEntries = Object.entries(definitions) as Array<[TKey, [string, string]]>;
		const entries = await Promise.all(
			definitionEntries.map(async ([key, [messageKey, fallback]]) => {
				return [key, await this.localeService.getLocalizedMessage(messageKey, fallback)] as const;
			})
		);

		return Object.fromEntries(entries) as Record<TKey, string>;
	}
}
