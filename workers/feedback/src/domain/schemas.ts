import { containsSensitiveFeedbackText } from '../../../../src/services/feedbackContentSafety';

const KINDS = ['bug', 'feature', 'question', 'other'] as const;
const OS_FAMILIES = ['windows', 'macos', 'linux', 'unknown'] as const;
const ARCHITECTURES = ['x64', 'arm64', 'arm', 'ia32', 'unknown'] as const;
const HOST_KINDS = ['local', 'ssh', 'container', 'wsl', 'codespaces', 'other-remote'] as const;
const WORKSPACE_KINDS = ['none', 'single-folder', 'multi-root'] as const;
const LANGUAGES = ['arduino', 'micropython', 'unknown'] as const;
const TOOL_NAMES = ['platformio', 'python', 'mpremote'] as const;
const READINESS = ['ready', 'unavailable', 'degraded', 'unknown'] as const;
const OUTCOMES = ['started', 'succeeded', 'failed', 'cancelled'] as const;
const STABLE_VALUE = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const VERSION_VALUE = /^[0-9][0-9a-z.+_-]{0,31}$/i;
const LOCALE_VALUE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/i;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const CREDENTIAL_SHAPED = /^(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|pypi-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9_-]{20,}|[A-Za-z0-9_-]{43})$/i;
const IPV4_SHAPED = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const DEVICE_IDENTIFIER_SHAPED = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{12,64}|(?:[0-9a-f]{2}-){5}[0-9a-f]{2})$/i;

export interface ValidatedCreateFeedback {
	schemaVersion: 1;
	kind: typeof KINDS[number];
	title: string;
	description: string;
	steps?: string;
	expected?: string;
	diagnostics: Record<string, unknown>;
}

export type ValidationResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: { code: string; field?: string } };

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
	return Object.keys(value).every(key => allowed.includes(key));
}

function isEnum<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
	return typeof value === 'string' && allowed.includes(value);
}

function isBoundedString(value: unknown, min: number, max: number): value is string {
	if (typeof value !== 'string') {return false;}
	const length = Array.from(value.trim()).length;
	return length >= min && length <= max;
}

function optionalString(value: unknown, max: number): boolean {
	return value === undefined || (typeof value === 'string' && Array.from(value.trim()).length <= max);
}

function isStableValue(value: unknown): value is string {
	return typeof value === 'string'
		&& STABLE_VALUE.test(value)
		&& !CREDENTIAL_SHAPED.test(value)
		&& !IPV4_SHAPED.test(value)
		&& !DEVICE_IDENTIFIER_SHAPED.test(value);
}

function isVersionValue(value: unknown): value is string {
	return typeof value === 'string'
		&& VERSION_VALUE.test(value)
		&& !CREDENTIAL_SHAPED.test(value)
		&& !IPV4_SHAPED.test(value)
		&& !DEVICE_IDENTIFIER_SHAPED.test(value);
}

function validateTool(value: unknown): boolean {
	if (!isRecord(value) || !hasOnlyKeys(value, ['name', 'version', 'readiness'])) {
		return false;
	}
	return isEnum(value.name, TOOL_NAMES)
		&& (value.version === undefined || isVersionValue(value.version))
		&& isEnum(value.readiness, READINESS);
}

function validateRecentEvent(value: unknown): boolean {
	if (!isRecord(value) || !hasOnlyKeys(value, ['at', 'stage', 'code', 'outcome'])) {
		return false;
	}
	return typeof value.at === 'string'
		&& ISO_TIMESTAMP.test(value.at)
		&& Number.isFinite(Date.parse(value.at))
		&& isStableValue(value.stage)
		&& isStableValue(value.code)
		&& isEnum(value.outcome, OUTCOMES);
}

function validateDiagnostics(value: unknown): value is Record<string, unknown> {
	if (!isRecord(value) || !hasOnlyKeys(value, [
		'extensionVersion', 'vscodeVersion', 'osFamily', 'osMajor', 'architecture', 'locale',
		'hostKind', 'workspaceKind', 'workspaceTrusted', 'board', 'language', 'tools', 'lastError', 'recentEvents',
	])) {
		return false;
	}
	if ((value.extensionVersion !== undefined && !isVersionValue(value.extensionVersion))
		|| (value.vscodeVersion !== undefined && !isVersionValue(value.vscodeVersion))
		|| (value.osFamily !== undefined && !isEnum(value.osFamily, OS_FAMILIES))
		|| (value.osMajor !== undefined && (typeof value.osMajor !== 'string' || !/^\d{1,16}$/.test(value.osMajor)))
		|| (value.architecture !== undefined && !isEnum(value.architecture, ARCHITECTURES))
		|| (value.locale !== undefined && (typeof value.locale !== 'string' || !LOCALE_VALUE.test(value.locale)))
		|| (value.hostKind !== undefined && !isEnum(value.hostKind, HOST_KINDS))
		|| (value.workspaceKind !== undefined && !isEnum(value.workspaceKind, WORKSPACE_KINDS))
		|| (value.workspaceTrusted !== undefined && typeof value.workspaceTrusted !== 'boolean')
		|| (value.board !== undefined && (!isStableValue(value.board) || value.board.length > 40))
		|| (value.language !== undefined && !isEnum(value.language, LANGUAGES))) {
		return false;
	}
	if (value.tools !== undefined && (!Array.isArray(value.tools) || value.tools.length > 8 || !value.tools.every(validateTool))) {
		return false;
	}
	if (value.lastError !== undefined) {
		if (!isRecord(value.lastError)
			|| !hasOnlyKeys(value.lastError, ['stage', 'code'])
			|| !isStableValue(value.lastError.stage)
			|| !isStableValue(value.lastError.code)
			|| value.lastError.stage.length > 40) {
			return false;
		}
	}
	if (value.recentEvents !== undefined
		&& (!Array.isArray(value.recentEvents)
			|| value.recentEvents.length > 20
			|| !value.recentEvents.every(validateRecentEvent))) {
		return false;
	}
	return new TextEncoder().encode(JSON.stringify(value)).byteLength <= 8192;
}

export function validateCreateFeedbackInput(value: unknown): ValidationResult<ValidatedCreateFeedback> {
	if (!isRecord(value) || !hasOnlyKeys(value, [
		'schemaVersion', 'kind', 'title', 'description', 'steps', 'expected', 'diagnostics',
	])) {
		return { ok: false, error: { code: 'invalid_request' } };
	}
	if (value.schemaVersion !== 1) {
		return { ok: false, error: { code: 'unsupported_schema', field: 'schemaVersion' } };
	}
	if (!isEnum(value.kind, KINDS)) {
		return { ok: false, error: { code: 'invalid_field', field: 'kind' } };
	}
	if (!isBoundedString(value.title, 5, 120)) {
		return { ok: false, error: { code: 'invalid_field', field: 'title' } };
	}
	if (!isBoundedString(value.description, 10, 8000)) {
		return { ok: false, error: { code: 'invalid_field', field: 'description' } };
	}
	if (!optionalString(value.steps, 4000) || !optionalString(value.expected, 2000)) {
		return { ok: false, error: { code: 'invalid_field' } };
	}
	for (const field of ['title', 'description', 'steps', 'expected'] as const) {
		const text = value[field];
		if (typeof text === 'string' && containsSensitiveFeedbackText(text)) {
			return { ok: false, error: { code: 'sensitive_content', field } };
		}
	}
	if (!validateDiagnostics(value.diagnostics)) {
		return { ok: false, error: { code: 'invalid_diagnostics', field: 'diagnostics' } };
	}
	return {
		ok: true,
		value: {
			schemaVersion: 1,
			kind: value.kind,
			title: value.title.trim(),
			description: value.description.trim(),
			...(typeof value.steps === 'string' && value.steps.trim() ? { steps: value.steps.trim() } : {}),
			...(typeof value.expected === 'string' && value.expected.trim() ? { expected: value.expected.trim() } : {}),
			diagnostics: value.diagnostics,
		},
	};
}

export function validateReporterMessage(value: unknown): ValidationResult<{ body: string }> {
	if (!isRecord(value) || !hasOnlyKeys(value, ['body']) || !isBoundedString(value.body, 1, 4000)) {
		return { ok: false, error: { code: 'invalid_message', field: 'body' } };
	}
	if (containsSensitiveFeedbackText(value.body)) {
		return { ok: false, error: { code: 'sensitive_content', field: 'body' } };
	}
	return { ok: true, value: { body: value.body.trim() } };
}
