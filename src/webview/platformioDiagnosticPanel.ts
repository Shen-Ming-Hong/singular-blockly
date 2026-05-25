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
import { PlatformioAiRepairPacketService } from '../services/platformioAiRepairPacketService';
import { PlatformioDiagnosticService } from '../services/platformioDiagnosticService';
import { PlatformioIssueDraftService } from '../services/platformioIssueDraftService';
import { PlatformioRepairHistoryStore } from '../services/platformioRepairHistoryStore';
import { PlatformioRepairService } from '../services/platformioRepairService';
import {
	AiRepairPacket,
	AutoRepairRun,
	DiagnosticItemId,
	DiagnosticItemStatus,
	DiagnosticSource,
	EnvironmentFingerprint,
	IssueDraftProposal,
	PanelActionId,
	PanelRepairState,
	PlatformioDiagnosticExtensionToWebviewMessage,
	PlatformioDiagnosticLocalizedStrings,
	PlatformioDiagnosticPanelState,
	PlatformioDiagnosticSession,
	PlatformioDiagnosticWebviewToExtensionMessage,
	PlatformioOverallStatus,
	RepairConfirmationModel,
	RepairFlow,
	RepairHistorySnapshot,
	RepairHistorySummary,
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

interface RepairServiceLike {
	planRepairFlows(session: PlatformioDiagnosticSession, history?: RepairHistorySummary | null): RepairFlow[];
	executeRepairFlow(flow: RepairFlow, options: Parameters<PlatformioRepairService['executeRepairFlow']>[1]): Promise<AutoRepairRun>;
}

interface RepairHistoryStoreLike {
	createEnvironmentFingerprint(session: PlatformioDiagnosticSession): EnvironmentFingerprint;
	createEmptySnapshot(fingerprint: EnvironmentFingerprint): RepairHistorySnapshot;
	loadSnapshot(fingerprint?: EnvironmentFingerprint): Promise<RepairHistorySnapshot | null>;
	appendRun(fingerprint: EnvironmentFingerprint, run: AutoRepairRun): Promise<RepairHistorySnapshot>;
	clear(fingerprint: EnvironmentFingerprint): Promise<RepairHistorySnapshot>;
}

interface AiRepairPacketServiceLike {
	buildPacket(input: { session: PlatformioDiagnosticSession; historySummary?: RepairHistorySummary | null }): AiRepairPacket;
}

interface IssueDraftServiceLike {
	buildDraft(input: {
		session: PlatformioDiagnosticSession;
		historySummary?: RepairHistorySummary | null;
		source: 'ai-assisted' | 'human-confirmed';
	}): IssueDraftProposal;
}

interface PlatformioDiagnosticPanelRepairOptions {
	repairService?: RepairServiceLike;
	historyStore?: RepairHistoryStoreLike;
	aiPacketService?: AiRepairPacketServiceLike;
	issueDraftService?: IssueDraftServiceLike;
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
	private activeRepairPromise: Promise<void> | null = null;
	private cancellationRequested = false;
	private currentFingerprint: EnvironmentFingerprint | null = null;
	private readonly repairService: RepairServiceLike;
	private readonly historyStore: RepairHistoryStoreLike;
	private readonly aiPacketService: AiRepairPacketServiceLike;
	private readonly issueDraftService: IssueDraftServiceLike;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly localeService: LocaleService,
		private readonly diagnosticService: PlatformioDiagnosticService,
		private readonly fileSystem: FileSystemLike = fs,
		repairOptions: PlatformioDiagnosticPanelRepairOptions = {},
	) {
		this.currentState = this.diagnosticService.createLoadingState();
		this.repairService = repairOptions.repairService ?? new PlatformioRepairService();
		this.historyStore = repairOptions.historyStore ?? new PlatformioRepairHistoryStore(context.workspaceState);
		this.aiPacketService = repairOptions.aiPacketService ?? new PlatformioAiRepairPacketService();
		this.issueDraftService = repairOptions.issueDraftService ?? new PlatformioIssueDraftService();
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
			this.activeRepairPromise = null;
			this.cancellationRequested = false;
			this.currentFingerprint = null;
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
		this.webviewReady = true;

		switch (message.command) {
			case 'platformioDiagnostic:ready':
				if (!this.hasInitialized) {
					this.hasInitialized = true;
					void this.runDiagnostics();
					return;
				}
				await this.postCurrentState();
				return;
			case 'platformioDiagnostic:retest':
				if (this.activeRepairPromise) {
					await this.postCopyResult('warning', await this.localeService.getLocalizedMessage(
						'PLATFORMIO_REPAIR_RETEST_BLOCKED_ACTIVE_RUN',
						'Repair is currently running. Wait for it to finish before retesting.'
					));
					return;
				}
				void this.runDiagnostics();
				return;
			case 'platformioDiagnostic:copySummary':
				await this.copySummary();
				return;
			case 'platformioDiagnostic:startAutoRepair':
				await this.startAutoRepair(message.flowId);
				return;
			case 'platformioDiagnostic:confirmAutoRepair':
				void this.confirmAutoRepair(message.flowId);
				return;
			case 'platformioDiagnostic:cancelAutoRepair':
				await this.cancelAutoRepair();
				return;
			case 'platformioDiagnostic:clearRepairHistory':
				await this.clearRepairHistory();
				return;
			case 'platformioDiagnostic:copyAiRepairPacket':
				await this.copyAiRepairPacket();
				return;
			case 'platformioDiagnostic:createIssueDraft':
				await this.createIssueDraft();
				return;
			default:
				return;
		}
	}

	private async createIssueDraft(): Promise<void> {
		if (!this.currentState.session) {
			await this.postCopyResult('warning', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_ISSUE_DRAFT_UNAVAILABLE',
				'No diagnostic data is available for an issue draft yet.'
			));
			return;
		}

		try {
			const draft = this.issueDraftService.buildDraft({
				session: this.currentState.session,
				historySummary: this.currentState.repairState?.historySummary ?? null,
				source: 'human-confirmed',
			});

			if (draft.candidacy === 'not-recommended') {
				await this.postCopyResult('warning', draft.noDraftReason ?? await this.localeService.getLocalizedMessage(
					'PLATFORMIO_REPAIR_ISSUE_DRAFT_NOT_RECOMMENDED',
					'No issue draft is recommended for the current diagnostics.'
				));
				return;
			}

			await vscodeApi.env.clipboard.writeText(draft.body);
			await this.postCopyResult('success', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_ISSUE_DRAFT_COPY_SUCCESS',
				'Issue draft copied locally. Review privacy and duplicate-search checklist before posting.'
			));
		} catch (error) {
			log('[platformio-diagnostic] failed to create issue draft', 'error', error);
			await this.postCopyResult('error', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_ISSUE_DRAFT_COPY_FAILED',
				'Unable to create the issue draft: {0}',
				String(error)
			));
		}
	}

	private async copyAiRepairPacket(): Promise<void> {
		if (!this.currentState.session) {
			await this.postCopyResult('warning', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_AI_PACKET_UNAVAILABLE',
				'No diagnostic data is available for an AI repair packet yet.'
			));
			return;
		}

		try {
			const packet = this.aiPacketService.buildPacket({
				session: this.currentState.session,
				historySummary: this.currentState.repairState?.historySummary ?? null,
			});
			await vscodeApi.env.clipboard.writeText(packet.plainText);
			const messageKey = packet.staleHistory
				? 'PLATFORMIO_REPAIR_AI_PACKET_COPY_SUCCESS_STALE'
				: 'PLATFORMIO_REPAIR_AI_PACKET_COPY_SUCCESS';
			const fallback = packet.staleHistory
				? 'AI repair packet copied. Some included repair history may be stale; review before sharing.'
				: 'AI repair packet copied with sensitive details redacted.';
			await this.postCopyResult('success', await this.localeService.getLocalizedMessage(messageKey, fallback));
		} catch (error) {
			log('[platformio-diagnostic] failed to copy AI repair packet', 'error', error);
			await this.postCopyResult('error', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_AI_PACKET_COPY_FAILED',
				'Unable to copy the AI repair packet: {0}',
				String(error)
			));
		}
	}

	private async runDiagnostics(): Promise<void> {
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
				this.currentState.repairState = await this.composeRepairState(session);
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

	private async startAutoRepair(flowId: string): Promise<void> {
		if (this.activeRepairPromise) {
			await this.postCopyResult('warning', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_ALREADY_RUNNING',
				'A repair run is already in progress.'
			));
			return;
		}

		const flow = this.findRepairFlow(flowId);
		if (!flow) {
			await this.postCopyResult('warning', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_FLOW_NOT_AVAILABLE',
				'The selected repair flow is no longer available.'
			));
			return;
		}

		this.currentState = {
			...this.currentState,
			repairState: {
				...this.ensureRepairState(),
				confirmation: this.toConfirmationModel(flow),
			},
		};
		await this.postState('platformioDiagnostic:render');
	}

	private async confirmAutoRepair(flowId: string): Promise<void> {
		if (this.activeRepairPromise || !this.currentState.session) {
			return;
		}

		const flow = this.findRepairFlow(flowId);
		if (!flow) {
			await this.postCopyResult('warning', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_FLOW_NOT_AVAILABLE',
				'The selected repair flow is no longer available.'
			));
			return;
		}

		const session = this.currentState.session;
		const fingerprint = this.currentFingerprint ?? this.historyStore.createEnvironmentFingerprint(session);
		const activeRun = this.createActiveRun(flow, fingerprint, session);
		this.currentFingerprint = fingerprint;
		this.cancellationRequested = false;
		this.currentState = {
			...this.currentState,
			repairState: {
				...this.ensureRepairState(),
				activeRun,
				confirmation: null,
			},
		};
		await this.postState('platformioDiagnostic:render');

		this.activeRepairPromise = (async () => {
			try {
				const run = await this.repairService.executeRepairFlow(flow, {
					environmentFingerprint: fingerprint,
					initialSessionId: session.sessionId ?? session.requestedAt,
					workspacePath: session.workspacePath,
					isCancelled: () => this.cancellationRequested,
					retest: async () => {
						const workspacePath = vscodeApi.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
						return this.diagnosticService.collectDiagnostics(workspacePath);
					},
				});
				await this.historyStore.appendRun(fingerprint, run);
				await this.runDiagnostics();
			} catch (error) {
				log('[platformio-diagnostic] auto repair failed', 'error', error);
				await this.postCopyResult('error', await this.localeService.getLocalizedMessage(
					'PLATFORMIO_REPAIR_FAILED',
					'Automatic repair failed: {0}',
					String(error)
				));
			} finally {
				this.activeRepairPromise = null;
				this.cancellationRequested = false;
			}
		})();
	}

	private async cancelAutoRepair(): Promise<void> {
		if (this.activeRepairPromise) {
			this.cancellationRequested = true;
			await this.postCopyResult('warning', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_CANCEL_REQUESTED',
				'Cancellation requested. The current safe step will finish before stopping.'
			));
			return;
		}

		this.currentState = {
			...this.currentState,
			repairState: {
				...this.ensureRepairState(),
				confirmation: null,
			},
		};
		await this.postState('platformioDiagnostic:render');
	}

	private async clearRepairHistory(): Promise<void> {
		if (!this.currentState.session) {
			return;
		}

		const fingerprint = this.currentFingerprint ?? this.historyStore.createEnvironmentFingerprint(this.currentState.session);
		const snapshot = await this.historyStore.clear(fingerprint);
		this.currentState = {
			...this.currentState,
			repairState: await this.composeRepairState(this.currentState.session, snapshot),
		};
		await this.postState('platformioDiagnostic:render');
	}

	private async copySummary(): Promise<void> {
		if (!this.currentState.session) {
			await this.postCopyResult('warning', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_COPY_UNAVAILABLE',
				'No diagnostic summary is available yet.'
			));
			return;
		}

		try {
			const summary = await this.diagnosticService.buildClipboardSummary(this.currentState.session);
			await vscodeApi.env.clipboard.writeText(summary.plainText);
			await this.postCopyResult('success', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_COPY_SUCCESS',
				'Diagnostic summary copied to the clipboard.'
			));
		} catch (error) {
			log('[platformio-diagnostic] failed to copy summary', 'error', error);
			await this.postCopyResult('error', await this.localeService.getLocalizedMessage(
				'PLATFORMIO_DIAGNOSTIC_COPY_FAILED',
				'Unable to copy the diagnostic summary: {0}',
				String(error)
			));
		}
	}

	private async composeRepairState(
		session: PlatformioDiagnosticSession,
		snapshotOverride?: RepairHistorySnapshot | null
	): Promise<PanelRepairState> {
		const fingerprint = this.historyStore.createEnvironmentFingerprint(session);
		this.currentFingerprint = fingerprint;
		const snapshot = snapshotOverride ?? await this.historyStore.loadSnapshot(fingerprint);
		const effectiveSnapshot = snapshot ?? this.historyStore.createEmptySnapshot(fingerprint);
		const historySummary = this.toHistorySummary(effectiveSnapshot);
		const availableRepairFlows = this.repairService.planRepairFlows(session, historySummary);

		return {
			availableRepairFlows,
			activeRun: null,
			historySummary,
			fingerprintStatus: historySummary.status,
			exportActions: ['copyAiPacket', 'copyIssueDraft', 'clearHistory'],
			confirmation: null,
			redactionNotice: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_REDACTION_NOTICE',
				'Exports redact local paths, proxy credentials, and token-like strings by default.'
			),
		};
	}

	private toHistorySummary(snapshot: RepairHistorySnapshot): RepairHistorySummary {
		return {
			status: snapshot.staleReason ? 'stale' : 'current',
			runs: snapshot.runs,
			lastRun: snapshot.runs.at(-1) ?? null,
			lastClearedAt: snapshot.lastClearedAt,
			staleReason: snapshot.staleReason,
			maxRuns: 20,
		};
	}

	private ensureRepairState(): PanelRepairState {
		return this.currentState.repairState ?? {
			availableRepairFlows: [],
			activeRun: null,
			historySummary: null,
			fingerprintStatus: 'unknown',
			exportActions: [],
			confirmation: null,
		};
	}

	private findRepairFlow(flowId: string): RepairFlow | undefined {
		return this.currentState.repairState?.availableRepairFlows.find(flow => flow.id === flowId);
	}

	private toConfirmationModel(flow: RepairFlow): RepairConfirmationModel {
		return {
			flowId: flow.id,
			title: flow.title,
			summary: flow.summary,
			primaryFix: flow.primaryFix,
			fallbackFix: flow.fallbackFix,
			verification: flow.verification,
			steps: flow.steps,
			riskLevel: flow.riskLevel,
		};
	}

	private createActiveRun(
		flow: RepairFlow,
		fingerprint: EnvironmentFingerprint,
		session: PlatformioDiagnosticSession
	): AutoRepairRun {
		const startedAt = new Date().toISOString();
		return {
			runId: `active-${startedAt}`,
			flowId: flow.id,
			startedAt,
			finishedAt: null,
			status: 'running',
			environmentFingerprint: fingerprint,
			initialSessionId: session.sessionId ?? session.requestedAt,
			finalSessionId: null,
			stepResults: [],
			userFacingSummary: `${flow.title}: running`,
		};
	}

	private async postCopyResult(status: 'success' | 'warning' | 'error', message: string): Promise<void> {
		await this.postMessage({
			command: 'platformioDiagnostic:copyResult',
			status,
			message,
		});
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
			const keyByAction: Record<PanelActionId, string> = {
				retest: 'PLATFORMIO_DIAGNOSTIC_ACTION_RETEST',
				copySummary: 'PLATFORMIO_DIAGNOSTIC_ACTION_COPY_SUMMARY',
				startAutoRepair: 'PLATFORMIO_REPAIR_ACTION_START_AUTO_REPAIR',
				confirmAutoRepair: 'PLATFORMIO_REPAIR_ACTION_CONFIRM_AUTO_REPAIR',
				cancelAutoRepair: 'PLATFORMIO_REPAIR_ACTION_CANCEL_AUTO_REPAIR',
				clearRepairHistory: 'PLATFORMIO_REPAIR_ACTION_CLEAR_HISTORY',
				copyAiRepairPacket: 'PLATFORMIO_REPAIR_ACTION_COPY_AI_PACKET',
				createIssueDraft: 'PLATFORMIO_REPAIR_ACTION_CREATE_ISSUE_DRAFT',
			};
			const key = keyByAction[action];
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
			'official-platformio-custom-path': [
				'PLATFORMIO_DIAGNOSTIC_SOURCE_OFFICIAL_PLATFORMIO_CUSTOM_PATH',
				'PlatformIO customPATH setting',
			],
			'official-platformio-settings': [
				'PLATFORMIO_DIAGNOSTIC_SOURCE_OFFICIAL_PLATFORMIO_SETTINGS',
				'Official PlatformIO settings',
			],
			'common-dir': ['PLATFORMIO_DIAGNOSTIC_SOURCE_COMMON_DIR', 'Common tool directory'],
			'resolved-pio-sibling': ['PLATFORMIO_DIAGNOSTIC_SOURCE_RESOLVED_PIO_SIBLING', 'Derived from resolved pio sibling'],
			'derived-from-penv': ['PLATFORMIO_DIAGNOSTIC_SOURCE_DERIVED_FROM_PENV', 'Derived from detected penv'],
			'repair-history': ['PLATFORMIO_DIAGNOSTIC_SOURCE_REPAIR_HISTORY', 'Repair history'],
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
			repairTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_SECTION_TITLE', 'Guided repair'),
			exportsTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_EXPORTS_TITLE', 'Support exports'),
			repairRecommendationTitle: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_RECOMMENDATION_TITLE',
				'Recommended repair flow'
			),
			repairHistoryTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_HISTORY_TITLE', 'Repair history'),
			repairPrimaryFixLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_PRIMARY_FIX', 'Primary fix'),
			repairFallbackFixLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_FALLBACK_FIX', 'Fallback fix'),
			repairVerificationLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_VERIFICATION', 'Verification after repair'),
			repairApplicabilityLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_APPLICABILITY', 'Applicability'),
			repairNotApplicableLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_NOT_APPLICABLE', 'Not applicable'),
			repairManualAlternativeLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_MANUAL_ALTERNATIVE', 'Manual alternative'),
			repairManualStepsLabel: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_MANUAL_STEPS', 'Manual steps still required'),
			repairConfirmationTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_CONFIRMATION_TITLE', 'Confirm automatic repair'),
			repairProgressTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_PROGRESS_TITLE', 'Repair progress'),
			repairNoRecommendation: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_NO_RECOMMENDATION',
				'No automatic repair is recommended for the current status.'
			),
			fingerprintCurrent: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_FINGERPRINT_CURRENT', 'Environment matches stored history'),
			fingerprintStale: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_FINGERPRINT_STALE', 'Some repair history may be stale'),
			fingerprintUnknown: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_FINGERPRINT_UNKNOWN', 'Environment fingerprint unavailable'),
			aiPacketRedactionNotice: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_AI_PACKET_REDACTION_NOTICE',
				'The copied repair packet masks local paths, proxy credentials, and token-like strings.'
			),
			aiPacketStaleHistoryNotice: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_AI_PACKET_STALE_HISTORY_NOTICE',
				'Some included repair history may be stale because the environment changed.'
			),
			issueDraftPrivacyNotice: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_ISSUE_DRAFT_PRIVACY_NOTICE',
				'Review the privacy checklist before posting this draft publicly.'
			),
			issueDraftDuplicateSearchNotice: await this.localeService.getLocalizedMessage(
				'PLATFORMIO_REPAIR_ISSUE_DRAFT_DUPLICATE_NOTICE',
				'Search existing issues with the suggested keywords before opening a new issue.'
			),
			issueDraftNoDraftTitle: await this.localeService.getLocalizedMessage('PLATFORMIO_REPAIR_ISSUE_DRAFT_NO_DRAFT', 'No issue draft recommended'),
			actions: {
				retest: await actionLabel('retest', 'Retest'),
				copySummary: await actionLabel('copySummary', 'Copy summary'),
				startAutoRepair: await actionLabel('startAutoRepair', 'Auto repair'),
				confirmAutoRepair: await actionLabel('confirmAutoRepair', 'Confirm repair'),
				cancelAutoRepair: await actionLabel('cancelAutoRepair', 'Cancel'),
				clearRepairHistory: await actionLabel('clearRepairHistory', 'Clear history'),
				copyAiRepairPacket: await actionLabel('copyAiRepairPacket', 'Copy AI repair summary'),
				createIssueDraft: await actionLabel('createIssueDraft', 'Create issue draft'),
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
