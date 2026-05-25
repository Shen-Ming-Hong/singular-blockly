/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PlatformioPrivacyRedactorOptions {
	homeDir?: string;
	workspacePath?: string | null;
}

export class PlatformioPrivacyRedactor {
	constructor(private readonly options: PlatformioPrivacyRedactorOptions = {}) {}

	redact(value: string): string {
		let redacted = value;
		redacted = this.redactPath(redacted, this.options.workspacePath, '<workspace>');
		redacted = this.redactPath(redacted, this.options.homeDir, '<home>');
		redacted = this.redactProxyCredentials(redacted);
		redacted = this.redactTokenLikeStrings(redacted);
		return redacted;
	}

	private redactPath(value: string, rawPath: string | null | undefined, replacement: string): string {
		if (!rawPath || rawPath.trim().length === 0) {
			return value;
		}

		const variants = this.createPathVariants(rawPath.trim());
		return variants.reduce((current, variant) => {
			return current.replace(new RegExp(this.escapeRegExp(variant), 'g'), replacement);
		}, value);
	}

	private createPathVariants(rawPath: string): string[] {
		const slashVariant = rawPath.replace(/\\/g, '/');
		const backslashVariant = rawPath.replace(/\//g, '\\');
		return [...new Set([rawPath, slashVariant, backslashVariant])].filter(variant => variant.length > 0);
	}

	private redactProxyCredentials(value: string): string {
		return value.replace(/\b(https?:\/\/)([^\s/]+@)([^\s/]+)/gi, (_match, protocol: string, _userinfo: string, host: string) => {
			return `${protocol}<redacted>@${host}`;
		});
	}

	private redactTokenLikeStrings(value: string): string {
		return value
			.replace(/\b(gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|pypi-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,})\b/g, '<token>')
			.replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{20,}\b/gi, '$1<token>')
			.replace(/\b([A-Z0-9_]*(?:TOKEN|SECRET|API_KEY|ACCESS_KEY)\s*=\s*)[^\s]+/gi, '$1<token>');
	}

	private escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}

export function createPlatformioPrivacyRedactor(
	options: PlatformioPrivacyRedactorOptions = {},
	sessionWorkspacePath?: string | null
): PlatformioPrivacyRedactor {
	return new PlatformioPrivacyRedactor({
		homeDir: options.homeDir,
		workspacePath: options.workspacePath ?? sessionWorkspacePath,
	});
}
