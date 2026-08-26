/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const FEEDBACK_KINDS = ['bug', 'feature', 'question', 'other'] as const;
export const FEEDBACK_PUBLIC_STATUSES = [
	'received',
	'triaging',
	'needs-info',
	'planned',
	'in-progress',
	'resolved',
	'closed',
] as const;
export const FEEDBACK_DECISIONS = ['unreviewed', 'actionable', 'not-actionable'] as const;
export const FEEDBACK_RESOLUTIONS = [
	'duplicate',
	'not-product',
	'unsupported',
	'out-of-scope',
	'cannot-reproduce',
	'insufficient-info',
	'spam',
] as const;
export const FEEDBACK_HOST_KINDS = ['local', 'ssh', 'container', 'wsl', 'codespaces', 'other-remote'] as const;
export const FEEDBACK_WORKSPACE_KINDS = ['none', 'single-folder', 'multi-root'] as const;
export const FEEDBACK_TOOL_NAMES = ['platformio', 'python', 'mpremote'] as const;
export const FEEDBACK_TOOL_READINESS = ['ready', 'unavailable', 'degraded', 'unknown'] as const;
export const FEEDBACK_EVENT_OUTCOMES = ['started', 'succeeded', 'failed', 'cancelled'] as const;

export type FeedbackKind = typeof FEEDBACK_KINDS[number];
export type FeedbackPublicStatus = typeof FEEDBACK_PUBLIC_STATUSES[number];
export type FeedbackDecision = typeof FEEDBACK_DECISIONS[number];
export type FeedbackResolution = typeof FEEDBACK_RESOLUTIONS[number];
export type FeedbackHostKind = typeof FEEDBACK_HOST_KINDS[number];
export type FeedbackWorkspaceKind = typeof FEEDBACK_WORKSPACE_KINDS[number];
export type FeedbackToolName = typeof FEEDBACK_TOOL_NAMES[number];
export type FeedbackToolReadiness = typeof FEEDBACK_TOOL_READINESS[number];
export type FeedbackEventOutcome = typeof FEEDBACK_EVENT_OUTCOMES[number];

export const FEEDBACK_LIMITS = Object.freeze({
	titleMin: 5,
	titleMax: 120,
	descriptionMin: 10,
	descriptionMax: 8000,
	stepsMax: 4000,
	expectedMax: 2000,
	messageMax: 4000,
	recentEventsMax: 20,
	diagnosticsBytesMax: 8192,
	screenshotBytesMax: 3 * 1024 * 1024,
	screenshotDimensionMax: 1920,
});

export interface FeedbackToolDiagnostic {
	name: FeedbackToolName;
	version?: string;
	readiness: FeedbackToolReadiness;
}

export interface FeedbackStableError {
	stage: string;
	code: string;
}

export interface FeedbackRecentEvent {
	at: string;
	stage: string;
	code: string;
	outcome: FeedbackEventOutcome;
}

export interface FeedbackDiagnostics {
	extensionVersion?: string;
	vscodeVersion?: string;
	osFamily?: 'windows' | 'macos' | 'linux' | 'unknown';
	osMajor?: string;
	architecture?: 'x64' | 'arm64' | 'arm' | 'ia32' | 'unknown';
	locale?: string;
	hostKind?: FeedbackHostKind;
	workspaceKind?: FeedbackWorkspaceKind;
	workspaceTrusted?: boolean;
	board?: string;
	language?: 'arduino' | 'micropython' | 'unknown';
	tools?: FeedbackToolDiagnostic[];
	lastError?: FeedbackStableError;
	recentEvents?: FeedbackRecentEvent[];
}

export interface FeedbackDraft {
	kind: FeedbackKind;
	title: string;
	description: string;
	steps?: string;
	expected?: string;
}

export interface CreateFeedbackInput extends FeedbackDraft {
	schemaVersion: 1;
	diagnostics: FeedbackDiagnostics;
}

export interface SanitizedFeedbackScreenshot {
	mediaType: 'image/png' | 'image/jpeg';
	bytesBase64: string;
	width: number;
	height: number;
}

export interface FeedbackMessage {
	id: string;
	author: 'reporter' | 'maintainer';
	body: string;
	createdAt: string;
}

export interface FeedbackSummary {
	id: string;
	reference: string;
	kind: FeedbackKind;
	title: string;
	status: FeedbackPublicStatus;
	decision: FeedbackDecision;
	resolution?: FeedbackResolution | null;
	publicReason?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface FeedbackDetail extends FeedbackSummary {
	description: string;
	steps?: string | null;
	expected?: string | null;
	diagnostics: FeedbackDiagnostics;
	hasAttachment: boolean;
	messages: FeedbackMessage[];
	nextMessageCursor: string | null;
}

export interface FeedbackListResponse {
	items: FeedbackSummary[];
	nextCursor: string | null;
}

export interface FeedbackMessageListResponse {
	items: FeedbackMessage[];
	nextCursor: string | null;
}

export interface FeedbackApiError {
	error: {
		code: string;
		message: string;
		field?: string;
	};
}

export interface FeedbackPreview {
	input: CreateFeedbackInput;
	includeDiagnostics: boolean;
	includeRecentEvents: boolean;
	screenshot?: SanitizedFeedbackScreenshot;
	confirmationId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
	const keys = new Set(allowed);
	return Object.keys(value).every(key => keys.has(key));
}

function textLength(value: string): number {
	return Array.from(value).length;
}

const FEEDBACK_SUMMARY_KEYS = [
	'id', 'reference', 'kind', 'title', 'status', 'decision', 'resolution', 'publicReason', 'createdAt', 'updatedAt',
] as const;

function hasFeedbackSummaryFields(value: Record<string, unknown>): boolean {
	return typeof value.id === 'string'
		&& /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.id)
		&& typeof value.reference === 'string'
		&& /^SB-[A-Z2-9]{6,10}$/.test(value.reference)
		&& isFeedbackKind(value.kind)
		&& typeof value.title === 'string'
		&& textLength(value.title) <= FEEDBACK_LIMITS.titleMax
		&& (FEEDBACK_PUBLIC_STATUSES as readonly unknown[]).includes(value.status)
		&& (FEEDBACK_DECISIONS as readonly unknown[]).includes(value.decision)
		&& (value.resolution === undefined || value.resolution === null
			|| (FEEDBACK_RESOLUTIONS as readonly unknown[]).includes(value.resolution))
		&& (value.publicReason === undefined || value.publicReason === null
			|| (typeof value.publicReason === 'string' && textLength(value.publicReason) <= FEEDBACK_LIMITS.messageMax))
		&& typeof value.createdAt === 'string'
		&& Number.isFinite(Date.parse(value.createdAt))
		&& typeof value.updatedAt === 'string'
		&& Number.isFinite(Date.parse(value.updatedAt));
}

export function isFeedbackKind(value: unknown): value is FeedbackKind {
	return typeof value === 'string' && (FEEDBACK_KINDS as readonly string[]).includes(value);
}

export function isFeedbackDraft(value: unknown): value is FeedbackDraft {
	if (!isRecord(value) || !isFeedbackKind(value.kind)) {
		return false;
	}
	return typeof value.title === 'string'
		&& typeof value.description === 'string'
		&& (value.steps === undefined || typeof value.steps === 'string')
		&& (value.expected === undefined || typeof value.expected === 'string');
}

export function isSanitizedFeedbackScreenshot(value: unknown): value is SanitizedFeedbackScreenshot {
	if (!isRecord(value)) {
		return false;
	}
	return (value.mediaType === 'image/png' || value.mediaType === 'image/jpeg')
		&& typeof value.bytesBase64 === 'string'
		&& typeof value.width === 'number'
		&& Number.isInteger(value.width)
		&& value.width > 0
		&& value.width <= FEEDBACK_LIMITS.screenshotDimensionMax
		&& typeof value.height === 'number'
		&& Number.isInteger(value.height)
		&& value.height > 0
		&& value.height <= FEEDBACK_LIMITS.screenshotDimensionMax;
}

function isFeedbackDiagnostics(value: unknown): value is FeedbackDiagnostics {
	if (!isRecord(value)) {return false;}
	const allowed = [
		'extensionVersion', 'vscodeVersion', 'osFamily', 'osMajor', 'architecture', 'locale', 'hostKind',
		'workspaceKind', 'workspaceTrusted', 'board', 'language', 'tools', 'lastError', 'recentEvents',
	];
	if (!hasOnlyKeys(value, allowed)) {return false;}
	const optionalString = (candidate: unknown, values?: readonly string[]): boolean => candidate === undefined
		|| (typeof candidate === 'string' && (!values || values.includes(candidate)));
	return optionalString(value.extensionVersion)
		&& optionalString(value.vscodeVersion)
		&& optionalString(value.osFamily, ['windows', 'macos', 'linux', 'unknown'])
		&& optionalString(value.osMajor)
		&& optionalString(value.architecture, ['x64', 'arm64', 'arm', 'ia32', 'unknown'])
		&& optionalString(value.locale)
		&& optionalString(value.hostKind, FEEDBACK_HOST_KINDS)
		&& optionalString(value.workspaceKind, FEEDBACK_WORKSPACE_KINDS)
		&& (value.workspaceTrusted === undefined || typeof value.workspaceTrusted === 'boolean')
		&& optionalString(value.board)
		&& optionalString(value.language, ['arduino', 'micropython', 'unknown'])
		&& (value.tools === undefined || (Array.isArray(value.tools) && value.tools.length <= 8 && value.tools.every(tool =>
			isRecord(tool)
			&& hasOnlyKeys(tool, ['name', 'version', 'readiness'])
			&& optionalString(tool.name, FEEDBACK_TOOL_NAMES) && tool.name !== undefined
			&& optionalString(tool.version)
			&& optionalString(tool.readiness, FEEDBACK_TOOL_READINESS) && tool.readiness !== undefined
		)))
		&& (value.lastError === undefined || (isRecord(value.lastError)
			&& hasOnlyKeys(value.lastError, ['stage', 'code'])
			&& typeof value.lastError.stage === 'string' && typeof value.lastError.code === 'string'))
		&& (value.recentEvents === undefined || (Array.isArray(value.recentEvents)
			&& value.recentEvents.length <= FEEDBACK_LIMITS.recentEventsMax
			&& value.recentEvents.every(event => isRecord(event)
				&& hasOnlyKeys(event, ['at', 'stage', 'code', 'outcome'])
				&& typeof event.at === 'string' && Number.isFinite(Date.parse(event.at))
				&& typeof event.stage === 'string' && typeof event.code === 'string'
				&& (FEEDBACK_EVENT_OUTCOMES as readonly unknown[]).includes(event.outcome))));
}

export function isFeedbackDetail(value: unknown): value is FeedbackDetail {
	if (!isRecord(value)
		|| !hasOnlyKeys(value, [
			...FEEDBACK_SUMMARY_KEYS, 'description', 'steps', 'expected', 'diagnostics', 'hasAttachment', 'messages',
			'nextMessageCursor',
		])
		|| !hasFeedbackSummaryFields(value)) {
		return false;
	}
	return typeof value.description === 'string'
		&& textLength(value.description) <= FEEDBACK_LIMITS.descriptionMax
		&& (value.steps === undefined || value.steps === null
			|| (typeof value.steps === 'string' && textLength(value.steps) <= FEEDBACK_LIMITS.stepsMax))
		&& (value.expected === undefined || value.expected === null
			|| (typeof value.expected === 'string' && textLength(value.expected) <= FEEDBACK_LIMITS.expectedMax))
		&& isFeedbackDiagnostics(value.diagnostics)
		&& typeof value.hasAttachment === 'boolean'
		&& Array.isArray(value.messages)
		&& value.messages.length <= 50
		&& value.messages.every(isFeedbackMessage)
		&& (value.nextMessageCursor === null
			|| (typeof value.nextMessageCursor === 'string' && value.nextMessageCursor.length <= 256));
}

export function isFeedbackSummary(value: unknown): value is FeedbackSummary {
	return isRecord(value)
		&& hasOnlyKeys(value, FEEDBACK_SUMMARY_KEYS)
		&& hasFeedbackSummaryFields(value);
}

export function isFeedbackListResponse(value: unknown): value is FeedbackListResponse {
	return isRecord(value)
		&& hasOnlyKeys(value, ['items', 'nextCursor'])
		&& Array.isArray(value.items)
		&& value.items.length <= 50
		&& value.items.every(isFeedbackSummary)
		&& (value.nextCursor === null || (typeof value.nextCursor === 'string' && value.nextCursor.length <= 256));
}

export function isFeedbackMessageListResponse(value: unknown): value is FeedbackMessageListResponse {
	return isRecord(value)
		&& hasOnlyKeys(value, ['items', 'nextCursor'])
		&& Array.isArray(value.items)
		&& value.items.length <= 50
		&& value.items.every(isFeedbackMessage)
		&& (value.nextCursor === null || (typeof value.nextCursor === 'string' && value.nextCursor.length <= 256));
}

export function isFeedbackMessage(value: unknown): value is FeedbackMessage {
	return isRecord(value)
		&& hasOnlyKeys(value, ['id', 'author', 'body', 'createdAt'])
		&& typeof value.id === 'string'
		&& /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.id)
		&& (value.author === 'reporter' || value.author === 'maintainer')
		&& typeof value.body === 'string'
		&& textLength(value.body) <= FEEDBACK_LIMITS.messageMax
		&& typeof value.createdAt === 'string'
		&& Number.isFinite(Date.parse(value.createdAt));
}
