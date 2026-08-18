/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const WORKSPACE_VALIDATION_TIMEOUT_MS = 10_000;

export type WorkspaceValidationIssueCode =
	| 'INVALID_JSON'
	| 'EMPTY_WORKSPACE'
	| 'MAIN_FILE_DELETED'
	| 'UNKNOWN_BLOCK_TYPE'
	| 'INVALID_FIELD'
	| 'INVALID_CONNECTION'
	| 'INVALID_EXTRA_STATE'
	| 'BOARD_MISMATCH'
	| 'ORPHAN_BLOCK'
	| 'ROUND_TRIP_FAILED'
	| 'CHANNEL_UNAVAILABLE'
	| 'VALIDATION_TIMEOUT'
	| 'LIVE_LOAD_FAILED'
	| 'DISK_COMMIT_FAILED';

const WORKSPACE_VALIDATION_ISSUE_CODES = new Set<WorkspaceValidationIssueCode>([
	'INVALID_JSON',
	'EMPTY_WORKSPACE',
	'MAIN_FILE_DELETED',
	'UNKNOWN_BLOCK_TYPE',
	'INVALID_FIELD',
	'INVALID_CONNECTION',
	'INVALID_EXTRA_STATE',
	'BOARD_MISMATCH',
	'ORPHAN_BLOCK',
	'ROUND_TRIP_FAILED',
	'CHANNEL_UNAVAILABLE',
	'VALIDATION_TIMEOUT',
	'LIVE_LOAD_FAILED',
	'DISK_COMMIT_FAILED',
]);
const WORKSPACE_VALIDATION_DETAIL_MAX_LENGTH = 128;

export interface WorkspaceValidationIssue {
	code: WorkspaceValidationIssueCode;
	blockType?: string;
	field?: string;
}

export function isWorkspaceValidationIssue(value: unknown): value is WorkspaceValidationIssue {
	if (!value || typeof value !== 'object') {return false;}
	const issue = value as WorkspaceValidationIssue;
	return (
		WORKSPACE_VALIDATION_ISSUE_CODES.has(issue.code) &&
		(issue.blockType === undefined || (
			typeof issue.blockType === 'string' && issue.blockType.length <= WORKSPACE_VALIDATION_DETAIL_MAX_LENGTH
		)) &&
		(issue.field === undefined || (
			typeof issue.field === 'string' && issue.field.length <= WORKSPACE_VALIDATION_DETAIL_MAX_LENGTH
		))
	);
}

export type WorkspaceRejectionOutcome = 'restored' | 'quarantined';

export interface WorkspaceDocument {
	workspace: Record<string, unknown>;
	board: string;
	txtVirtualControls?: unknown;
	[key: string]: unknown;
}

const LEGACY_WORKSPACE_BOARD_IDS: Readonly<Record<string, string>> = {
	arduino_uno: 'uno',
	arduino_nano: 'nano',
	arduino_mega: 'mega',
	esp32_super_mini: 'supermini',
};

/** Normalize board identifiers written by pre-v13 Singular Blockly projects. */
export function normalizeWorkspaceBoardId(board: string): string {
	return LEGACY_WORKSPACE_BOARD_IDS[board] || board;
}

/** Preserve the complete document while canonicalizing its board identifier. */
export function normalizeWorkspaceDocumentBoard(document: WorkspaceDocument): WorkspaceDocument {
	const board = normalizeWorkspaceBoardId(document.board);
	return board === document.board ? document : { ...document, board };
}

export function isWorkspaceDocument(value: unknown): value is WorkspaceDocument {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {return false;}
	const document = value as WorkspaceDocument;
	return typeof document.board === 'string' && Boolean(document.workspace) && typeof document.workspace === 'object';
}

export function hasWorkspaceDocumentContent(document: WorkspaceDocument): boolean {
	const blocks = (document.workspace as any)?.blocks?.blocks;
	if (Array.isArray(blocks) && blocks.length > 0) {return true;}
	const controls = (document.txtVirtualControls as any)?.controls;
	return document.board === 'txt' && Array.isArray(controls) && controls.length > 0;
}

export interface ValidateWorkspaceCandidateMessage {
	command: 'validateWorkspaceCandidate';
	requestId: string;
	generation: number;
	deadlineAt: number;
	document: WorkspaceDocument;
}

export interface WorkspaceCandidateValidMessage {
	command: 'workspaceCandidateValidationResult';
	requestId: string;
	generation: number;
	valid: true;
	normalizedDocument: WorkspaceDocument;
}

export interface WorkspaceCandidateInvalidMessage {
	command: 'workspaceCandidateValidationResult';
	requestId: string;
	generation: number;
	valid: false;
	issue: WorkspaceValidationIssue;
}

export type WorkspaceCandidateValidationResult = WorkspaceCandidateValidMessage | WorkspaceCandidateInvalidMessage;

export function isWorkspaceCandidateValidationResult(value: unknown): value is WorkspaceCandidateValidationResult {
	if (!value || typeof value !== 'object') {return false;}
	const result = value as WorkspaceCandidateValidationResult;
	if (
		result.command !== 'workspaceCandidateValidationResult' ||
		typeof result.requestId !== 'string' ||
		!Number.isInteger(result.generation)
	) {return false;}
	if (result.valid === true) {return isWorkspaceDocument(result.normalizedDocument);}
	return result.valid === false && isWorkspaceValidationIssue(result.issue);
}

export interface WorkspaceLiveLoadResultMessage {
	command: 'workspaceLiveLoadResult';
	requestId: string;
	generation: number;
	success: boolean;
	normalizedDocument?: WorkspaceDocument;
	issue?: WorkspaceValidationIssue;
}

export function isWorkspaceLiveLoadResultMessage(value: unknown): value is WorkspaceLiveLoadResultMessage {
	if (!value || typeof value !== 'object') {return false;}
	const result = value as WorkspaceLiveLoadResultMessage;
	return (
		result.command === 'workspaceLiveLoadResult' &&
		typeof result.requestId === 'string' &&
		Number.isInteger(result.generation) &&
		typeof result.success === 'boolean' &&
		(result.issue === undefined || isWorkspaceValidationIssue(result.issue)) &&
		(result.success === false || isWorkspaceDocument(result.normalizedDocument))
	);
}

export interface WorkspaceInitialLoadResultMessage {
	command: 'workspaceInitialLoadResult';
	requestId: string;
	success: boolean;
	normalizedDocument?: WorkspaceDocument;
	issue?: WorkspaceValidationIssue;
	mainBlockStateRepaired?: boolean;
}

export function isWorkspaceInitialLoadResultMessage(value: unknown): value is WorkspaceInitialLoadResultMessage {
	if (!value || typeof value !== 'object') {return false;}
	const result = value as WorkspaceInitialLoadResultMessage;
	return (
		result.command === 'workspaceInitialLoadResult' &&
		typeof result.requestId === 'string' &&
		typeof result.success === 'boolean' &&
		(result.issue === undefined || isWorkspaceValidationIssue(result.issue)) &&
		(result.mainBlockStateRepaired === undefined || typeof result.mainBlockStateRepaired === 'boolean') &&
		(result.success === true || result.mainBlockStateRepaired !== true) &&
		(result.success === false || isWorkspaceDocument(result.normalizedDocument))
	);
}

export type WorkspaceCandidateState =
	| 'observed'
	| 'validating'
	| 'valid'
	| 'invalid'
	| 'timed-out'
	| 'channel-unavailable'
	| 'superseded'
	| 'recovered';

export interface WorkspaceCandidate {
	generation: number;
	requestId: string;
	validationStartedAt?: number;
	deadlineAt?: number;
	rawBytes: Buffer;
	parsedDocument?: WorkspaceDocument;
	state: WorkspaceCandidateState;
	issue?: WorkspaceValidationIssue;
}
