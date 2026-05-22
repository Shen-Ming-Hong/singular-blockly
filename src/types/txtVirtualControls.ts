/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const TXT_VIRTUAL_CONTROLS_SCHEMA_VERSION = 1 as const;
export const TXT_VIRTUAL_CONTROL_RUNTIME_REMOTE_DIR = '/tmp/singular_blockly';
export const TXT_VIRTUAL_CONTROL_RUNTIME_STATE_FILE =
	`${TXT_VIRTUAL_CONTROL_RUNTIME_REMOTE_DIR}/virtual_controls_state.json`;

export type TxtVirtualControlMode = 'editing' | 'running';
export type TxtVirtualControlKind = 'button';

export interface TxtVirtualControlViewport {
	scrollX: number;
	scrollY: number;
	zoom: number;
}

export interface TxtVirtualControlCanvas {
	mode: TxtVirtualControlMode;
	lastViewport?: TxtVirtualControlViewport;
}

export interface TxtVirtualControlPosition {
	x: number;
	y: number;
}

export interface TxtVirtualControlSize {
	width: number;
	height: number;
}

export interface TxtVirtualButtonStyle {
	textColor: string;
	backgroundColor: string;
}

export interface TxtVirtualButton {
	stableId: string;
	displayName: string;
	identifier: string;
	kind: TxtVirtualControlKind;
	position: TxtVirtualControlPosition;
	size: TxtVirtualControlSize;
	style: TxtVirtualButtonStyle;
}

export interface TxtVirtualControlsDocument {
	schemaVersion: typeof TXT_VIRTUAL_CONTROLS_SCHEMA_VERSION;
	canvas: TxtVirtualControlCanvas;
	controls: TxtVirtualButton[];
}

export interface VirtualControlIdentity {
	stableId: string;
	displayName: string;
	identifier: string;
}

export interface TxtVirtualControlReference {
	stableId: string;
	displayNameSnapshot: string;
	identifierSnapshot: string;
	status: 'valid' | 'invalid';
}

export interface InvalidVirtualControlReference {
	blockId: string;
	stableId: string;
	lastKnownDisplayName?: string;
	reason: 'missing-control';
}

export interface VirtualControlRuntimeSession {
	sessionId: string;
	mode: 'running';
	transport: 'txt-companion-runtime';
	startedAt: string;
	controlIds: string[];
}

export interface VirtualControlRuntimeSnapshotControlState {
	pressed: boolean;
}

export interface VirtualControlRuntimeSnapshot {
	sessionId: string;
	updatedAt: number;
	controls: Record<string, VirtualControlRuntimeSnapshotControlState>;
}

export interface TxtVirtualControlsRuntimeFileControlState {
	identifier: string;
	pressed: boolean;
}

export interface TxtVirtualControlsRuntimeFile {
	sessionId: string | null;
	updatedAt: number;
	controls: Record<string, TxtVirtualControlsRuntimeFileControlState>;
}

export interface TxtVirtualControlSessionControl {
	stableId: string;
	identifier: string;
}

export interface TxtVirtualControlSnapshotControl {
	stableId: string;
	pressed: boolean;
}

export interface TxtVirtualControlPreflight {
	valid: boolean;
	invalidReferences: InvalidVirtualControlReference[];
}

export const DEFAULT_TXT_VIRTUAL_BUTTON_STYLE: TxtVirtualButtonStyle = {
	textColor: '#ffffff',
	backgroundColor: '#0288d1',
};

function sanitizeNumber(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sanitizeString(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

function sanitizeMode(value: unknown, fallback: TxtVirtualControlMode = 'editing'): TxtVirtualControlMode {
	return value === 'running' || value === 'editing' ? value : fallback;
}

function normalizeViewport(value: unknown): TxtVirtualControlViewport | undefined {
	if (!value || typeof value !== 'object') {
		return undefined;
	}

	const viewport = value as Partial<TxtVirtualControlViewport>;
	return {
		scrollX: sanitizeNumber(viewport.scrollX, 0),
		scrollY: sanitizeNumber(viewport.scrollY, 0),
		zoom: sanitizeNumber(viewport.zoom, 1),
	};
}

function normalizeButton(control: unknown): TxtVirtualButton | null {
	if (!control || typeof control !== 'object') {
		return null;
	}

	const candidate = control as Partial<TxtVirtualButton>;
	const stableId = sanitizeString(candidate.stableId).trim();
	if (!stableId) {
		return null;
	}

	const displayName = sanitizeString(candidate.displayName, stableId).trim() || stableId;
	const identifier = sanitizeString(candidate.identifier, stableId).trim() || stableId;
	const position = candidate.position ?? {};
	const size = candidate.size ?? {};
	const style = candidate.style ?? {};

	return {
		stableId,
		displayName,
		identifier,
		kind: 'button',
		position: {
			x: sanitizeNumber((position as Partial<TxtVirtualControlPosition>).x, 24),
			y: sanitizeNumber((position as Partial<TxtVirtualControlPosition>).y, 24),
		},
		size: {
			width: Math.max(72, sanitizeNumber((size as Partial<TxtVirtualControlSize>).width, 120)),
			height: Math.max(40, sanitizeNumber((size as Partial<TxtVirtualControlSize>).height, 48)),
		},
		style: {
			textColor: sanitizeString((style as Partial<TxtVirtualButtonStyle>).textColor, DEFAULT_TXT_VIRTUAL_BUTTON_STYLE.textColor),
			backgroundColor: sanitizeString(
				(style as Partial<TxtVirtualButtonStyle>).backgroundColor,
				DEFAULT_TXT_VIRTUAL_BUTTON_STYLE.backgroundColor
			),
		},
	};
}

export function createEmptyTxtVirtualControlsDocument(): TxtVirtualControlsDocument {
	return {
		schemaVersion: TXT_VIRTUAL_CONTROLS_SCHEMA_VERSION,
		canvas: {
			mode: 'editing',
		},
		controls: [],
	};
}

export function cloneTxtVirtualControlsDocument(document?: TxtVirtualControlsDocument | null): TxtVirtualControlsDocument {
	return normalizeTxtVirtualControlsDocument(document);
}

export function normalizeTxtVirtualControlsDocument(
	value: unknown,
	options?: { forceEditingMode?: boolean }
): TxtVirtualControlsDocument {
	if (!value || typeof value !== 'object') {
		return createEmptyTxtVirtualControlsDocument();
	}

	const candidate = value as Partial<TxtVirtualControlsDocument>;
	const controlsInput = Array.isArray(candidate.controls) ? candidate.controls : [];
	const controls = controlsInput.map(normalizeButton).filter((control): control is TxtVirtualButton => control !== null);
	const canvasInput = candidate.canvas ?? {};
	const lastViewport = normalizeViewport((canvasInput as Partial<TxtVirtualControlCanvas>).lastViewport);

	return {
		schemaVersion: TXT_VIRTUAL_CONTROLS_SCHEMA_VERSION,
		canvas: {
			mode: options?.forceEditingMode ? 'editing' : sanitizeMode((canvasInput as Partial<TxtVirtualControlCanvas>).mode),
			...(lastViewport ? { lastViewport } : {}),
		},
		controls,
	};
}

export function normalizeTxtVirtualControlsForSave(value: unknown): TxtVirtualControlsDocument {
	return normalizeTxtVirtualControlsDocument(value, { forceEditingMode: true });
}

export function hasTxtVirtualControls(value: unknown): value is TxtVirtualControlsDocument {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const document = value as Partial<TxtVirtualControlsDocument>;
	return Array.isArray(document.controls) && typeof document.canvas === 'object';
}

export function buildTxtVirtualControlsRuntimeSnapshot(
	sessionId: string,
	controls: TxtVirtualButton[],
	pressedStates: Readonly<Record<string, boolean>>
): VirtualControlRuntimeSnapshot {
	const snapshotControls: Record<string, VirtualControlRuntimeSnapshotControlState> = {};
	for (const control of controls) {
		snapshotControls[control.stableId] = {
			pressed: Boolean(pressedStates[control.stableId]),
		};
	}

	return {
		sessionId,
		updatedAt: Date.now(),
		controls: snapshotControls,
	};
}

export function buildTxtVirtualControlsRuntimeFile(
	sessionId: string | null,
	controls: TxtVirtualButton[],
	pressedStates: Readonly<Record<string, boolean>>
): TxtVirtualControlsRuntimeFile {
	const runtimeControls: Record<string, TxtVirtualControlsRuntimeFileControlState> = {};
	for (const control of controls) {
		runtimeControls[control.stableId] = {
			identifier: control.identifier,
			pressed: Boolean(pressedStates[control.stableId]),
		};
	}

	return {
		sessionId,
		updatedAt: Date.now(),
		controls: runtimeControls,
	};
}

export function buildTxtVirtualControlSessionControls(document: TxtVirtualControlsDocument): TxtVirtualControlSessionControl[] {
	return document.controls.map(control => ({
		stableId: control.stableId,
		identifier: control.identifier,
	}));
}

export function buildTxtVirtualControlSnapshotControls(
	document: TxtVirtualControlsDocument,
	pressedStates: Readonly<Record<string, boolean>>
): TxtVirtualControlSnapshotControl[] {
	return document.controls.map(control => ({
		stableId: control.stableId,
		pressed: Boolean(pressedStates[control.stableId]),
	}));
}
