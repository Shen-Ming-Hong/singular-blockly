/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reporter-authored feedback text is handled in two tiers:
 *
 * 1. Credentials (tokens, API keys, bearer values, private keys, credential URLs)
 *    are never stored. Text containing them is rejected as a whole.
 * 2. Private but common troubleshooting details (local paths, serial ports,
 *    IP addresses, UUID-shaped identifiers) are replaced with fixed placeholders
 *    so reporters can paste upload or build errors without exposing them.
 *
 * The same definitions back the Extension Host, the Worker schema boundary, the
 * public-issue renderer, and the static browser portal script.
 */

interface PatternDefinition {
	source: string;
	flags: string;
}

interface RedactionDefinition extends PatternDefinition {
	placeholder: string;
}

export const FEEDBACK_REDACTION_PLACEHOLDERS = {
	path: '[path]',
	serialPort: '[serial port]',
	ipAddress: '[IP]',
	identifier: '[ID]',
} as const;

const BLOCKED_PATTERN_DEFINITIONS: readonly PatternDefinition[] = [
	{ source: String.raw`\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|pypi-[A-Za-z0-9_-]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{20,})\b`, flags: 'i' },
	{ source: String.raw`(?:^|[^A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?=$|[^A-Za-z0-9_-])`, flags: '' },
	{ source: String.raw`\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b`, flags: 'i' },
	{ source: String.raw`\b[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|ACCESS_KEY)\s*=\s*[^\s]+`, flags: 'i' },
	{ source: String.raw`-----BEGIN\s+(?:(?:RSA|EC|OPENSSH)\s+)?PRIVATE KEY-----`, flags: 'i' },
	{ source: String.raw`\bhttps?:\/\/[^\s/@:]+:[^\s/@]+@[^\s/]+`, flags: 'i' },
];

// Web URLs are kept as written; local path and serial-port shapes are only
// replaced in the text between them.
const WEB_URL_PATTERN_DEFINITION: PatternDefinition = { source: String.raw`https?:\/\/[^\s"'<>)]+`, flags: 'gi' };

const SEGMENT = String.raw`[\p{L}\p{N}._-]+`;
const LOCAL_REDACTION_DEFINITIONS: readonly RedactionDefinition[] = [
	// Serial ports first so /dev/ttyUSB0 reads as a port rather than a path.
	{ source: String.raw`\/dev\/(?:tty|cu\.)[\p{L}\p{N}._-]*`, flags: 'giu', placeholder: FEEDBACK_REDACTION_PLACEHOLDERS.serialPort },
	{ source: String.raw`\bCOM[1-9]\d{0,4}\b`, flags: 'gi', placeholder: FEEDBACK_REDACTION_PLACEHOLDERS.serialPort },
	// Windows drive and UNC paths. Folder names may contain spaces as long as
	// another backslash follows, so "C:\Users\Ada Lovelace\x.ino" is one path.
	{ source: String.raw`(?<=^|[\s"'(=:\[{])(?:[A-Za-z]:\\|\\\\[A-Za-z0-9._-]+\\)(?:[^\s"'<>|:\\]+(?:\x20[^\s"'<>|:\\]+)*\\)*[^\s"'<>|:\\)\]},;]*`, flags: 'gu', placeholder: FEEDBACK_REDACTION_PLACEHOLDERS.path },
	// ./, ../, and ~/ relative paths.
	{ source: String.raw`(?<=^|[\s"'(=:\[{])(?:\.{1,2}|~)\/(?:${SEGMENT}\/)*${SEGMENT}(?=$|[\s"'),;:\]}])`, flags: 'gu', placeholder: FEEDBACK_REDACTION_PLACEHOLDERS.path },
	// Absolute Unix paths with two or more segments (inner segments may contain spaces).
	{ source: String.raw`(?<=^|[^\p{L}\p{N}._-])(?:\/${SEGMENT}(?:\x20${SEGMENT})*(?=\/))+\/${SEGMENT}(?=$|[^\p{L}\p{N}._-])`, flags: 'gu', placeholder: FEEDBACK_REDACTION_PLACEHOLDERS.path },
	// Single-segment absolute paths such as /tmp after a separator.
	{ source: String.raw`(?<=^|[\s"'(=:\[{])\/${SEGMENT}(?=$|[\s"'),;:\]}])`, flags: 'gu', placeholder: FEEDBACK_REDACTION_PLACEHOLDERS.path },
	// Relative paths that end in a file name with an extension, such as src/main.cpp.
	{ source: String.raw`(?<=^|[\s"'(=:\[{])${SEGMENT}\/(?:${SEGMENT}\/)*[\p{L}\p{N}_-]+\.${SEGMENT}(?=$|[\s"'),;:\]}])`, flags: 'gu', placeholder: FEEDBACK_REDACTION_PLACEHOLDERS.path },
];

const GLOBAL_REDACTION_DEFINITIONS: readonly RedactionDefinition[] = [
	{ source: String.raw`\b(?:\d{1,3}\.){3}\d{1,3}\b`, flags: 'g', placeholder: FEEDBACK_REDACTION_PLACEHOLDERS.ipAddress },
	{ source: String.raw`\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b`, flags: 'gi', placeholder: FEEDBACK_REDACTION_PLACEHOLDERS.identifier },
];

const IPV6_PATTERN_DEFINITION: PatternDefinition = {
	source: String.raw`(^|[^0-9a-f:])([0-9a-f]*:[0-9a-f:]+)(?=$|[^0-9a-f:])`,
	flags: 'giu',
};

const blockedPatterns = BLOCKED_PATTERN_DEFINITIONS.map(({ source, flags }) => new RegExp(source, flags));
const webUrlPattern = new RegExp(WEB_URL_PATTERN_DEFINITION.source, WEB_URL_PATTERN_DEFINITION.flags);
const localRedactions = LOCAL_REDACTION_DEFINITIONS.map(({ source, flags, placeholder }) => ({ pattern: new RegExp(source, flags), placeholder }));
const globalRedactions = GLOBAL_REDACTION_DEFINITIONS.map(({ source, flags, placeholder }) => ({ pattern: new RegExp(source, flags), placeholder }));
const ipv6Candidate = new RegExp(IPV6_PATTERN_DEFINITION.source, IPV6_PATTERN_DEFINITION.flags);

function isIpv6(candidate: string): boolean {
	try {
		new URL(`http://[${candidate}]/`);
		return true;
	} catch {
		return false;
	}
}

/** True when the text contains a credential that must never be stored. */
export function containsBlockedFeedbackText(value: string): boolean {
	return blockedPatterns.some(pattern => pattern.test(value));
}

/**
 * Replaces local paths, serial ports, IP addresses, and UUID-shaped identifiers
 * with fixed placeholders. The result is stable when redacted again.
 */
export function redactFeedbackText(value: string): string {
	let output = '';
	let cursor = 0;
	const redactLocal = (text: string) => localRedactions.reduce(
		(current, { pattern, placeholder }) => current.replace(pattern, placeholder), text);
	for (const match of value.matchAll(webUrlPattern)) {
		const start = match.index ?? 0;
		output += redactLocal(value.slice(cursor, start)) + match[0];
		cursor = start + match[0].length;
	}
	output += redactLocal(value.slice(cursor));
	output = globalRedactions.reduce((current, { pattern, placeholder }) => current.replace(pattern, placeholder), output);
	return output.replace(ipv6Candidate, (whole: string, prefix: string, candidate: string) =>
		isIpv6(candidate) ? `${prefix}${FEEDBACK_REDACTION_PLACEHOLDERS.ipAddress}` : whole);
}

function inlineJson(value: unknown): string {
	return JSON.stringify(value).replace(/[<>&]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

/** Static browser implementation generated from the same pattern definitions. */
export function feedbackContentSafetyBrowserSource(): string {
	const compile = (definitions: readonly RedactionDefinition[]) =>
		`${inlineJson(definitions)}.map(({ source, flags, placeholder }) => ({ pattern: new RegExp(source, flags), placeholder }))`;
	return `
		const blockedFeedbackPatterns = ${inlineJson(BLOCKED_PATTERN_DEFINITIONS)}.map(({ source, flags }) => new RegExp(source, flags));
		const feedbackWebUrlPattern = new RegExp(${inlineJson(WEB_URL_PATTERN_DEFINITION.source)}, ${inlineJson(WEB_URL_PATTERN_DEFINITION.flags)});
		const feedbackLocalRedactions = ${compile(LOCAL_REDACTION_DEFINITIONS)};
		const feedbackGlobalRedactions = ${compile(GLOBAL_REDACTION_DEFINITIONS)};
		const feedbackIpv6Candidate = new RegExp(${inlineJson(IPV6_PATTERN_DEFINITION.source)}, ${inlineJson(IPV6_PATTERN_DEFINITION.flags)});
		const feedbackIpPlaceholder = ${inlineJson(FEEDBACK_REDACTION_PLACEHOLDERS.ipAddress)};
		const containsBlockedFeedbackText = value => blockedFeedbackPatterns.some(pattern => pattern.test(value));
		const redactFeedbackText = value => {
			const redactLocal = text => feedbackLocalRedactions.reduce((current, { pattern, placeholder }) => current.replace(pattern, placeholder), text);
			let output = '';
			let cursor = 0;
			for (const match of value.matchAll(feedbackWebUrlPattern)) {
				output += redactLocal(value.slice(cursor, match.index)) + match[0];
				cursor = match.index + match[0].length;
			}
			output += redactLocal(value.slice(cursor));
			output = feedbackGlobalRedactions.reduce((current, { pattern, placeholder }) => current.replace(pattern, placeholder), output);
			return output.replace(feedbackIpv6Candidate, (whole, prefix, candidate) => {
				try { new URL('http://[' + candidate + ']/'); return prefix + feedbackIpPlaceholder; } catch { return whole; }
			});
		};`;
}
