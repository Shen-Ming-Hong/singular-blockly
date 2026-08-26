/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

interface PatternDefinition {
	source: string;
	flags: string;
}

const DIRECT_PATTERN_DEFINITIONS: readonly PatternDefinition[] = [
	{ source: String.raw`\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|pypi-[A-Za-z0-9_-]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{20,})\b`, flags: 'i' },
	{ source: String.raw`(?:^|[^A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?=$|[^A-Za-z0-9_-])`, flags: '' },
	{ source: String.raw`\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b`, flags: 'i' },
	{ source: String.raw`\b[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|ACCESS_KEY)\s*=\s*[^\s]+`, flags: 'i' },
	{ source: String.raw`-----BEGIN\s+(?:(?:RSA|EC|OPENSSH)\s+)?PRIVATE KEY-----`, flags: 'i' },
	{ source: String.raw`\bhttps?:\/\/[^\s/@:]+:[^\s/@]+@[^\s/]+`, flags: 'i' },
	{ source: String.raw`\b(?:\d{1,3}\.){3}\d{1,3}\b`, flags: '' },
	{ source: String.raw`(?:^|[\s"'(])(?:[A-Za-z]:\\|\\\\[A-Za-z0-9._-]+\\)[^\s"')]+`, flags: 'm' },
	{ source: String.raw`\b(?:PS\s+[A-Za-z]:\\[^>\r\n]*>|npm\s+ERR!\b|Traceback \(most recent call last\):)`, flags: 'i' },
	{ source: '```[\\s\\S]*```', flags: '' },
	{ source: String.raw`\bCOM[1-9]\d{0,4}\b`, flags: 'i' },
	{ source: String.raw`\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b`, flags: 'i' },
	{ source: String.raw`\b(?:digitalWrite|digitalRead|analogWrite|analogRead|pinMode|tone|noTone)\s*\([^\r\n)]{0,240}\)\s*;?`, flags: '' },
	{ source: String.raw`\b(?:machine\.)?(?:Pin|PWM|ADC|I2C|SPI|UART)\s*\([^\r\n)]{0,240}\)`, flags: '' },
	{ source: String.raw`\b(?:Serial|Wire|SPI)\s*\.\s*[A-Za-z_]\w*\s*\(`, flags: '' },
	{ source: String.raw`^\s*(?:#include\s*[<"]|(?:from\s+machine\s+import|import\s+machine)\b|void\s+(?:setup|loop)\s*\(\s*\)|def\s+[A-Za-z_]\w*\s*\([^\r\n)]*\)\s*:)`, flags: 'im' },
];

const PATH_PATTERN_DEFINITIONS: readonly PatternDefinition[] = [
	{ source: String.raw`(?:^|[^\p{L}\p{N}._-])(?:\/[\p{L}\p{N}._-]+){2,}(?=$|[^\p{L}\p{N}._-])`, flags: 'u' },
	{ source: String.raw`(?:^|[\s"'(=:[{])\/[\p{L}\p{N}._-]+(?=$|[\s"'),;:\]}])`, flags: 'u' },
	{ source: String.raw`(?:^|[\s"'(=:[{])(?:\.{1,2}|~)\/(?:[\p{L}\p{N}._-]+\/)*[\p{L}\p{N}._-]+(?=$|[\s"'),;:\]}])`, flags: 'u' },
	{ source: String.raw`(?:^|[\s"'(=:[{])[\p{L}\p{N}._-]+\/(?:[\p{L}\p{N}._-]+\/)*[\p{L}\p{N}_-]+\.[\p{L}\p{N}._-]+(?=$|[\s"'),;:\]}])`, flags: 'u' },
];

const IPV6_PATTERN_DEFINITION: PatternDefinition = {
	source: String.raw`(?:^|[^0-9a-f:])([0-9a-f]*:[0-9a-f:]+)(?=$|[^0-9a-f:])`,
	flags: 'giu',
};

const directPatterns = DIRECT_PATTERN_DEFINITIONS.map(({ source, flags }) => new RegExp(source, flags));
const pathPatterns = PATH_PATTERN_DEFINITIONS.map(({ source, flags }) => new RegExp(source, flags));
const ipv6Candidate = new RegExp(IPV6_PATTERN_DEFINITION.source, IPV6_PATTERN_DEFINITION.flags);

function containsIpv6(value: string, pattern: RegExp): boolean {
	for (const match of value.matchAll(pattern)) {
		try {
			new URL(`http://[${match[1]}]/`);
			return true;
		} catch { /* non-address colon-delimited text */ }
	}
	return false;
}

/** Shared Extension Host and Worker guard for reporter-authored text. */
export function containsSensitiveFeedbackText(value: string): boolean {
	if (directPatterns.some(pattern => pattern.test(value)) || containsIpv6(value, ipv6Candidate)) {return true;}
	// Credential-bearing URLs were rejected above. Mask other web URLs before
	// looking for local absolute or relative path shapes in reporter text.
	const withoutWebUrls = value.replace(/https?:\/\/[^\s"')]+/gi, ' ');
	return pathPatterns.some(pattern => pattern.test(withoutWebUrls));
}

function inlineJson(value: unknown): string {
	return JSON.stringify(value).replace(/[<>&]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

/** Static browser implementation generated from the same pattern definitions. */
export function feedbackContentSafetyBrowserSource(): string {
	return `
		const sensitiveFeedbackDirectPatterns = ${inlineJson(DIRECT_PATTERN_DEFINITIONS)}.map(({ source, flags }) => new RegExp(source, flags));
		const sensitiveFeedbackPathPatterns = ${inlineJson(PATH_PATTERN_DEFINITIONS)}.map(({ source, flags }) => new RegExp(source, flags));
		const sensitiveFeedbackIpv6Candidate = new RegExp(${inlineJson(IPV6_PATTERN_DEFINITION.source)}, ${inlineJson(IPV6_PATTERN_DEFINITION.flags)});
		const containsSensitiveFeedbackText = value => {
			if (sensitiveFeedbackDirectPatterns.some(pattern => pattern.test(value))) return true;
			for (const match of value.matchAll(sensitiveFeedbackIpv6Candidate)) {
				try { new URL('http://[' + match[1] + ']/'); return true; } catch { /* non-address colon-delimited text */ }
			}
			const withoutWebUrls = value.replace(/https?:\\/\\/[^\\s"')]+/gi, ' ');
			return sensitiveFeedbackPathPatterns.some(pattern => pattern.test(withoutWebUrls));
		};`;
}
