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
	| 'official-platformio-custom-path'
	| 'official-platformio-settings'
	| 'common-dir'
	| 'resolved-pio-sibling'
	| 'derived-from-penv'
	| 'repair-history'
	| 'unresolved';

export type PlatformioOverallStatus = 'operational' | 'degraded' | 'unavailable';

export type DiagnosticRunState = 'idle' | 'loading' | 'ready' | 'error';

export type PanelActionId =
	| 'retest'
	| 'copySummary'
	| 'startAutoRepair'
	| 'confirmAutoRepair'
	| 'cancelAutoRepair'
	| 'clearRepairHistory'
	| 'copyAiRepairPacket'
	| 'createIssueDraft';

export type PlatformioDiagnosticSectionId = 'summary' | 'tools' | 'repair' | 'exports' | 'scope';

export type RepairRiskLevel = 'low' | 'medium';

export type RepairStepKind =
	| 'diagnostic-retry'
	| 'settings-aware-resolution'
	| 'user-space-python-package'
	| 'platformio-installer-check'
	| 'manual-instruction';

export type RepairStepResultStatus = 'skipped' | 'running' | 'succeeded' | 'failed' | 'blocked' | 'cancelled' | 'timed-out';

export type AutoRepairRunStatus =
	| 'pending-confirmation'
	| 'running'
	| 'succeeded'
	| 'partially-succeeded'
	| 'failed'
	| 'cancelled'
	| 'blocked'
	| 'interrupted';

export type FingerprintStatus = 'current' | 'stale' | 'unknown';

export type RepairStopPolicy = 'stop-on-success-or-blocking-failure';

export type RepairBlockingFailureCode =
	| 'missing-executable'
	| 'probe-timeout'
	| 'network-or-proxy'
	| 'permission-denied'
	| 'unsupported-platform'
	| 'cancelled'
	| 'unknown';

export type RepairExportActionId = 'copyAiPacket' | 'copyIssueDraft' | 'clearHistory';

export type IssueDraftCandidacy = 'recommended' | 'not-recommended' | 'needs-human-review';

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
	repairHints?: PlatformioRepairHint[];
}

export interface PlatformioRepairHint {
	flowId: string;
	reason: string;
	priority: number;
}

export interface OfficialPlatformioSettingsEvidence {
	customPath: string | null;
	useBuiltinPython?: boolean;
	useBuiltinPIOCore?: boolean;
	useDevelopmentPIOCore?: boolean;
	customPyPiIndexUrl: string | null;
	httpProxyConfigured: boolean;
	proxyStrictSsl?: boolean;
	candidatePathEntries: string[];
	summary: string;
}

export interface PlatformioDiagnosticEnvironment {
	platform: NodeJS.Platform;
	arch: string;
	pathSeparator: ';' | ':';
	homeDir?: string;
}

export interface PlatformioDiagnosticSession {
	sessionId?: string;
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
	settingsEvidence?: OfficialPlatformioSettingsEvidence;
	environment?: PlatformioDiagnosticEnvironment;
}

export interface PlatformioDiagnosticPanelState {
	runState: DiagnosticRunState;
	session: PlatformioDiagnosticSession | null;
	topLevelError: string | null;
	availableActions: PanelActionId[];
	sectionOrder: PlatformioDiagnosticSectionId[];
	repairState?: PanelRepairState | null;
}

export interface RepairStep {
	id: string;
	title: string;
	description: string;
	kind: RepairStepKind;
	commandPreview?: string;
	executable?: string;
	args?: string[];
	timeoutMs: number;
	mutatesUserSpace: boolean;
	blockingFailureCodes: RepairBlockingFailureCode[];
	manualInstruction?: string;
}

export interface RepairFlow {
	id: string;
	title: string;
	summary: string;
	triggerFindingIds: DiagnosticItemId[];
	riskLevel: RepairRiskLevel;
	requiresConfirmation: true;
	steps: RepairStep[];
	stopPolicy: RepairStopPolicy;
	estimatedDurationMs: number;
	primaryFix: string;
	fallbackFix: string;
	verification: string;
	notApplicableReason?: string;
	manualAlternative?: string;
	recommendationReason: string;
	stillManualSteps: string[];
}

export interface RepairStepResult {
	stepId: string;
	startedAt: string;
	finishedAt: string;
	status: RepairStepResultStatus;
	exitCode: number | null;
	durationMs: number;
	sanitizedOutput: string;
	outputRedacted: boolean;
	evidence: Record<string, string | number | boolean | null>;
	nextAction?: string;
}

export interface AutoRepairRun {
	runId: string;
	flowId: string;
	startedAt: string;
	finishedAt: string | null;
	status: AutoRepairRunStatus;
	environmentFingerprint: EnvironmentFingerprint;
	initialSessionId: string;
	finalSessionId: string | null;
	stepResults: RepairStepResult[];
	userFacingSummary: string;
}

export interface EnvironmentFingerprint {
	fingerprintVersion: 1;
	workspaceHash: string;
	platform: NodeJS.Platform;
	arch: string;
	settingsHash: string;
	pathHintsHash: string;
	toolVersions: Partial<Record<DiagnosticItemId, string>>;
	createdAt: string;
}

export interface RepairHistorySnapshot {
	schemaVersion: 1;
	workspaceHash: string;
	activeFingerprint: EnvironmentFingerprint;
	runs: AutoRepairRun[];
	lastClearedAt: string | null;
	staleReason: string | null;
}

export interface RepairHistorySummary {
	status: FingerprintStatus;
	runs: AutoRepairRun[];
	lastRun: AutoRepairRun | null;
	lastClearedAt: string | null;
	staleReason: string | null;
	maxRuns: number;
}

export interface RepairConfirmationModel {
	flowId: string;
	title: string;
	summary: string;
	primaryFix: string;
	fallbackFix: string;
	verification: string;
	steps: RepairStep[];
	riskLevel: RepairRiskLevel;
}

export interface PanelRepairState {
	availableRepairFlows: RepairFlow[];
	activeRun: AutoRepairRun | null;
	historySummary: RepairHistorySummary | null;
	fingerprintStatus: FingerprintStatus;
	exportActions: RepairExportActionId[];
	confirmation: RepairConfirmationModel | null;
	redactionNotice?: string;
}

export interface AiRepairPacket {
	generatedAt: string;
	featureVersion: string;
	problemStatement: string;
	environmentSummary: string;
	diagnosticSummary: string;
	attemptedRepairs: string;
	currentBlocker: string;
	knownConstraints: string[];
	requestedResponseContract: string;
	plainText: string;
	redacted: boolean;
	staleHistory: boolean;
}

export interface IssueDraftProposal {
	title: string;
	body: string;
	labels: string[];
	privacyChecklist: string[];
	duplicateSearchHints: string[];
	generatedAt: string;
	candidacy: IssueDraftCandidacy;
	noDraftReason?: string;
	source: 'ai-assisted' | 'human-confirmed';
	redactionWarning?: string;
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
	repairTitle?: string;
	exportsTitle?: string;
	repairRecommendationTitle?: string;
	repairHistoryTitle?: string;
	repairPrimaryFixLabel?: string;
	repairFallbackFixLabel?: string;
	repairVerificationLabel?: string;
	repairApplicabilityLabel?: string;
	repairNotApplicableLabel?: string;
	repairManualAlternativeLabel?: string;
	repairManualStepsLabel?: string;
	repairConfirmationTitle?: string;
	repairProgressTitle?: string;
	repairNoRecommendation?: string;
	fingerprintCurrent?: string;
	fingerprintStale?: string;
	fingerprintUnknown?: string;
	aiPacketRedactionNotice?: string;
	aiPacketStaleHistoryNotice?: string;
	issueDraftPrivacyNotice?: string;
	issueDraftDuplicateSearchNotice?: string;
	issueDraftNoDraftTitle?: string;
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

export interface PlatformioDiagnosticRepairProgressMessage {
	command: 'platformioDiagnostic:repairProgress';
	repairState: PanelRepairState;
	strings: PlatformioDiagnosticLocalizedStrings;
}

export type PlatformioDiagnosticExtensionToWebviewMessage =
	| PlatformioDiagnosticStateMessage
	| PlatformioDiagnosticCopyResultMessage
	| PlatformioDiagnosticRepairProgressMessage;

export interface PlatformioDiagnosticReadyMessage {
	command: 'platformioDiagnostic:ready';
}

export interface PlatformioDiagnosticRetestMessage {
	command: 'platformioDiagnostic:retest';
}

export interface PlatformioDiagnosticCopySummaryMessage {
	command: 'platformioDiagnostic:copySummary';
}

export interface PlatformioDiagnosticStartAutoRepairMessage {
	command: 'platformioDiagnostic:startAutoRepair';
	flowId: string;
}

export interface PlatformioDiagnosticConfirmAutoRepairMessage {
	command: 'platformioDiagnostic:confirmAutoRepair';
	flowId: string;
}

export interface PlatformioDiagnosticCancelAutoRepairMessage {
	command: 'platformioDiagnostic:cancelAutoRepair';
	runId?: string;
}

export interface PlatformioDiagnosticClearRepairHistoryMessage {
	command: 'platformioDiagnostic:clearRepairHistory';
}

export interface PlatformioDiagnosticCopyAiRepairPacketMessage {
	command: 'platformioDiagnostic:copyAiRepairPacket';
}

export interface PlatformioDiagnosticCreateIssueDraftMessage {
	command: 'platformioDiagnostic:createIssueDraft';
}

export type PlatformioDiagnosticWebviewToExtensionMessage =
	| PlatformioDiagnosticReadyMessage
	| PlatformioDiagnosticRetestMessage
	| PlatformioDiagnosticCopySummaryMessage
	| PlatformioDiagnosticStartAutoRepairMessage
	| PlatformioDiagnosticConfirmAutoRepairMessage
	| PlatformioDiagnosticCancelAutoRepairMessage
	| PlatformioDiagnosticClearRepairHistoryMessage
	| PlatformioDiagnosticCopyAiRepairPacketMessage
	| PlatformioDiagnosticCreateIssueDraftMessage;
