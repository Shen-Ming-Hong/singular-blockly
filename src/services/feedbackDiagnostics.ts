/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
	FeedbackDiagnostics,
	FeedbackEventOutcome,
	FeedbackHostKind,
	FeedbackRecentEvent,
	FeedbackStableError,
	FeedbackToolDiagnostic,
} from '../types/feedback';
import { FEEDBACK_EVENT_OUTCOMES, FEEDBACK_LIMITS } from '../types/feedback';

const STABLE_VALUE = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const VERSION_VALUE = /^[0-9][0-9a-z.+_-]{0,31}$/i;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const CREDENTIAL_SHAPED = /^(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|pypi-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9_-]{20,}|[A-Za-z0-9_-]{43})$/i;
const IPV4_SHAPED = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const DEVICE_IDENTIFIER_SHAPED = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{12,64}|(?:[0-9a-f]{2}-){5}[0-9a-f]{2})$/i;

function isSensitiveShape(value: string): boolean {
	return CREDENTIAL_SHAPED.test(value)
		|| IPV4_SHAPED.test(value)
		|| DEVICE_IDENTIFIER_SHAPED.test(value);
}

export interface FeedbackDiagnosticsSource {
	extensionVersion: string;
	vscodeVersion: string;
	platform: NodeJS.Platform | string;
	release: string;
	arch: string;
	locale: string;
	remoteName: string | undefined;
	workspaceFoldersCount: number;
	workspaceTrusted: boolean;
	board?: string;
	language?: FeedbackDiagnostics['language'];
	tools?: FeedbackToolDiagnostic[];
	lastError?: FeedbackStableError;
	recentEvents?: FeedbackRecentEvent[];
}

export interface FeedbackDiagnosticsOptions {
	includeDiagnostics: boolean;
	includeRecentEvents: boolean;
}

export const DEFAULT_FEEDBACK_DIAGNOSTICS_OPTIONS: Readonly<FeedbackDiagnosticsOptions> = Object.freeze({
	includeDiagnostics: true,
	includeRecentEvents: false,
});

function stableValue(value: string | undefined): string | undefined {
	return value && STABLE_VALUE.test(value) && !isSensitiveShape(value) ? value : undefined;
}

function stableVersion(value: string | undefined): string | undefined {
	return value && VERSION_VALUE.test(value) && !isSensitiveShape(value) ? value : undefined;
}

function osFamily(platform: string): FeedbackDiagnostics['osFamily'] {
	if (platform === 'win32') {return 'windows';}
	if (platform === 'darwin') {return 'macos';}
	if (platform === 'linux') {return 'linux';}
	return 'unknown';
}

function architecture(arch: string): FeedbackDiagnostics['architecture'] {
	return arch === 'x64' || arch === 'arm64' || arch === 'arm' || arch === 'ia32' ? arch : 'unknown';
}

function hostKind(remoteName: string | undefined): FeedbackHostKind {
	if (!remoteName) {return 'local';}
	const normalized = remoteName.toLowerCase();
	if (normalized.includes('ssh')) {return 'ssh';}
	if (normalized.includes('container')) {return 'container';}
	if (normalized.includes('wsl')) {return 'wsl';}
	if (normalized.includes('codespaces')) {return 'codespaces';}
	return 'other-remote';
}

function validEvent(event: FeedbackRecentEvent): boolean {
	return ISO_TIMESTAMP.test(event.at)
		&& Number.isFinite(Date.parse(event.at))
		&& stableValue(event.stage) !== undefined
		&& stableValue(event.code) !== undefined
		&& (FEEDBACK_EVENT_OUTCOMES as readonly string[]).includes(event.outcome);
}

export class FeedbackEventRecorder {
	private readonly events: FeedbackRecentEvent[] = [];

	constructor(private readonly capacity: number = FEEDBACK_LIMITS.recentEventsMax) {}

	record(event: { at?: string; stage: string; code: string; outcome: FeedbackEventOutcome }): void {
		const candidate = { ...event, at: event.at ?? new Date().toISOString() };
		if (!validEvent(candidate)) {return;}
		this.events.push(candidate);
		while (this.events.length > Math.max(1, Math.min(this.capacity, FEEDBACK_LIMITS.recentEventsMax))) {
			this.events.shift();
		}
	}

	snapshot(): FeedbackRecentEvent[] {
		return this.events.map(event => ({ ...event }));
	}
}

export function buildFeedbackDiagnostics(
	source: FeedbackDiagnosticsSource,
	options: FeedbackDiagnosticsOptions = DEFAULT_FEEDBACK_DIAGNOSTICS_OPTIONS
): FeedbackDiagnostics {
	const recentEvents = options.includeRecentEvents
		? source.recentEvents?.filter(validEvent).slice(-FEEDBACK_LIMITS.recentEventsMax).map(event => ({ ...event }))
		: undefined;
	const diagnostics: FeedbackDiagnostics = options.includeDiagnostics
		? (() => {
			const tools = source.tools
				?.filter(tool => stableValue(tool.name) && stableValue(tool.readiness))
				.map(tool => ({ ...tool, version: stableVersion(tool.version) }))
				.map(tool => tool.version ? tool : { name: tool.name, readiness: tool.readiness });
			const lastError = source.lastError
				&& stableValue(source.lastError.stage)
				&& stableValue(source.lastError.code)
				? { ...source.lastError }
				: undefined;
			return {
				extensionVersion: stableVersion(source.extensionVersion),
				vscodeVersion: stableVersion(source.vscodeVersion),
				osFamily: osFamily(source.platform),
					osMajor: /^\d{1,16}$/.test(source.release.split('.')[0]) ? source.release.split('.')[0] : undefined,
				architecture: architecture(source.arch),
				locale: /^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/i.test(source.locale) ? source.locale.toLowerCase() : undefined,
				hostKind: hostKind(source.remoteName),
				workspaceKind: source.workspaceFoldersCount === 0
					? 'none'
					: source.workspaceFoldersCount === 1 ? 'single-folder' : 'multi-root',
				workspaceTrusted: source.workspaceTrusted,
				board: stableValue(source.board),
				language: source.language,
				tools: tools?.length ? tools : undefined,
				lastError,
			};
		})()
		: {};
	if (recentEvents?.length) {diagnostics.recentEvents = recentEvents;}
	for (const key of Object.keys(diagnostics) as Array<keyof FeedbackDiagnostics>) {
		if (diagnostics[key] === undefined) {delete diagnostics[key];}
	}
	return diagnostics;
}
