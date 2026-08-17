/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CoreFailureClass, CoreOperationPhase } from '../types/coreEnvironment';
import { PlatformioProcessError } from './platformioProcess';

export interface CoreFailureEvidence {
	phase: CoreOperationPhase;
	started?: boolean;
	code?: unknown;
	message?: string;
	stdout?: string;
	stderr?: string;
	failureDomain?: unknown;
}

const LOCAL_FALLBACK_FAILURES = new Set<CoreFailureClass>([
	'spawn',
	'missing-executable',
	'python-import',
	'permission',
	'local-store-corruption',
]);

function extractErrorMessage(
	error: unknown,
	candidate: Record<string, unknown>,
	nested: Record<string, unknown>
): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	if (candidate.error instanceof Error) {
		return candidate.error.message;
	}
	return String(candidate.message ?? nested.message ?? '');
}

function evidenceFromError(error: unknown, phase: CoreOperationPhase): Required<CoreFailureEvidence> {
	const candidate = error && typeof error === 'object' ? error as Record<string, unknown> : {};
	const nested = candidate.error && typeof candidate.error === 'object'
		? candidate.error as Record<string, unknown>
		: {};
	return {
		phase,
		started: error instanceof PlatformioProcessError ? error.started : candidate.started === true || nested.started === true,
		code: error instanceof PlatformioProcessError ? error.code ?? '' : candidate.code ?? nested.code ?? '',
		message: extractErrorMessage(error, candidate, nested),
		stdout: error instanceof PlatformioProcessError ? error.stdout : String(candidate.stdout ?? ''),
		stderr: error instanceof PlatformioProcessError ? error.stderr : String(candidate.stderr ?? ''),
		failureDomain: candidate.failureDomain ?? nested.failureDomain ?? '',
	};
}

/** Classify only high-confidence evidence; unmatched errors fail closed. */
export function classifyCoreFailure(error: unknown, phase: CoreOperationPhase): CoreFailureClass {
	const evidence = evidenceFromError(error, phase);
	const code = String(evidence.code).toUpperCase();
	const text = `${evidence.message}\n${evidence.stdout}\n${evidence.stderr}`.toLowerCase();

	if (code === 'ABORT_ERR' || /\b(abort(?:ed)?|cancel(?:led|ed))\b/.test(text)) {return 'cancelled';}
	if (evidence.failureDomain === 'managed-provisioning') {return 'managed-provisioning';}
	if (/\b(cert(?:ificate)?|self[- ]signed|unable to verify|tls|ssl)\b/.test(text)) {return 'tls';}
	if (/\b(proxy|407 proxy authentication)\b/.test(text)) {return 'proxy';}
	if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || /\b(dns|name resolution|getaddrinfo)\b/.test(text)) {return 'dns';}
	if (/\b(registry|package manager|download|http status|network is unreachable|connection timed out)\b/.test(text)) {return 'registry';}
	if (/\b(serial|com\d+|tty(?:usb|acm)|upload port|avrdude|esptool|device not found|could not open port|port busy)\b/.test(text)) {return 'serial';}
	if (/\b(no device|device disconnected|board not found)\b/.test(text)) {return 'device';}
	if (/platformio\.ini|unknown board|invalid project|project configuration|could not find environment/.test(text)) {return 'project-config';}
	if (/(?:\berror:|\bfatal error:|\bcompilation failed\b|\bundefined reference\b|\blinker command failed\b)/.test(text)) {return 'compile';}
	if (code === 'ENOENT' || code === 'UNKNOWN' && /not found/.test(text) || /no such file or directory.*(?:python|pio|platformio)/.test(text)) {
		return 'missing-executable';
	}
	if (/no module named ['"]?platformio|modulenotfounderror.*platformio|cannot import name.*platformio/.test(text)) {return 'python-import';}
	if (code === 'EACCES' || code === 'EPERM' || /permission denied|operation not permitted|access is denied/.test(text)) {return 'permission';}
	if (/corrupt|invalid distribution|bad metadata|cannot read.*core|malformed.*json|checksum.*local/.test(text)) {return 'local-store-corruption';}
	if (!evidence.started && /spawn|failed to start|could not start/.test(text)) {return 'spawn';}
	return 'unknown-after-start';
}

export function isCoreFallbackAllowed(
	failureClass: CoreFailureClass,
	phase: CoreOperationPhase,
	started: boolean
): boolean {
	if (failureClass === 'cancelled' || phase === 'project-process' && started) {return false;}
	if (failureClass === 'managed-provisioning') {return phase === 'probe' || phase === 'prepare';}
	return (phase === 'probe' || phase === 'prepare' || phase === 'project-process') && LOCAL_FALLBACK_FAILURES.has(failureClass);
}

export function didCoreProcessStart(error: unknown): boolean {
	const candidate = error && typeof error === 'object' ? error as { started?: unknown; error?: unknown } : undefined;
	const nested = candidate?.error && typeof candidate.error === 'object'
		? candidate.error as { started?: unknown }
		: undefined;
	return error instanceof PlatformioProcessError
		? error.started
		: candidate?.started === true || nested?.started === true;
}
