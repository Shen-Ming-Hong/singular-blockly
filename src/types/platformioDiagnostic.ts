/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type DiagnosticItemId = 'pio' | 'penvRoot' | 'python' | 'pip' | 'mpremote';

export type DiagnosticItemKind = 'executable' | 'derived-directory';

export type DiagnosticItemStatus = 'ok' | 'warning' | 'error';

export type DiagnosticSource =
	| 'default-platformio-path'
	| 'path-search'
	| 'resolved-pio-sibling'
	| 'derived-from-penv'
	| 'unresolved';

export type PlatformioOverallStatus = 'operational' | 'degraded' | 'unavailable';

export type DiagnosticRunState = 'idle' | 'loading' | 'ready' | 'error';

export type PanelActionId = 'retest' | 'copySummary';

export interface VersionProbeResult {
	command: string;
	succeeded: boolean;
	output?: string;
	errorMessage?: string;
	durationMs: number;
}

export interface PlatformioDiagnosticItem {
	id: DiagnosticItemId;
	kind: DiagnosticItemKind;
	status: DiagnosticItemStatus;
	resolvedPath: string | null;
	source: DiagnosticSource;
	exists: boolean;
	isFromDetectedPenv: boolean | null;
	reason: string;
	nextStep?: string;
	versionProbe?: VersionProbeResult;
}

export interface PlatformioDiagnosticSession {
	requestedAt: string;
	workspacePath: string | null;
	overallStatus: PlatformioOverallStatus;
	items: [
		PlatformioDiagnosticItem,
		PlatformioDiagnosticItem,
		PlatformioDiagnosticItem,
		PlatformioDiagnosticItem,
		PlatformioDiagnosticItem,
	];
	scopeNotice: string;
}

export interface PlatformioDiagnosticPanelState {
	runState: DiagnosticRunState;
	session: PlatformioDiagnosticSession | null;
	topLevelError: string | null;
	availableActions: PanelActionId[];
	sectionOrder: ['summary', 'tools', 'scope'];
}

export interface ClipboardSummary {
	plainText: string;
	generatedAt: string;
	overallStatus: PlatformioOverallStatus;
}

export interface PlatformioDiagnosticLocalizedStrings {
	panelTitle: string;
	panelSubtitle: string;
	loadingTitle: string;
	loadingDescription: string;
	errorTitle: string;
	summaryTitle: string;
	toolsTitle: string;
	scopeTitle: string;
	workspaceLabel: string;
	requestedAtLabel: string;
	overallStatusLabel: string;
	pathLabel: string;
	sourceLabel: string;
	reasonLabel: string;
	nextStepLabel: string;
	versionLabel: string;
	fromDetectedPenvLabel: string;
	fromDetectedPenvYes: string;
	fromDetectedPenvNo: string;
	unresolvedPathLabel: string;
	noDataTitle: string;
	noDataDescription: string;
	copyUnavailableMessage: string;
	copySuccessMessage: string;
	actions: Record<PanelActionId, string>;
	toolNames: Record<DiagnosticItemId, string>;
	itemStatuses: Record<DiagnosticItemStatus, string>;
	overallStatuses: Record<PlatformioOverallStatus, string>;
	sources: Record<DiagnosticSource, string>;
}

export interface PlatformioDiagnosticStateMessage {
	command: 'platformioDiagnostic:loading' | 'platformioDiagnostic:render' | 'platformioDiagnostic:error';
	panelState: PlatformioDiagnosticPanelState;
	strings: PlatformioDiagnosticLocalizedStrings;
}

export interface PlatformioDiagnosticCopyResultMessage {
	command: 'platformioDiagnostic:copyResult';
	status: 'success' | 'warning' | 'error';
	message: string;
}

export type PlatformioDiagnosticExtensionToWebviewMessage =
	| PlatformioDiagnosticStateMessage
	| PlatformioDiagnosticCopyResultMessage;

export interface PlatformioDiagnosticReadyMessage {
	command: 'platformioDiagnostic:ready';
}

export interface PlatformioDiagnosticRetestMessage {
	command: 'platformioDiagnostic:retest';
}

export interface PlatformioDiagnosticCopySummaryMessage {
	command: 'platformioDiagnostic:copySummary';
}

export type PlatformioDiagnosticWebviewToExtensionMessage =
	| PlatformioDiagnosticReadyMessage
	| PlatformioDiagnosticRetestMessage
	| PlatformioDiagnosticCopySummaryMessage;
