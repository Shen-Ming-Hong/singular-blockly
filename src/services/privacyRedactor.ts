/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PrivacyRedactorOptions {
	homeDir?: string;
	workspacePath?: string | null;
	managedRuntimePath?: string | null;
}

/** Removes known local paths and credential-shaped values from diagnostic text. */
export class PrivacyRedactor {
	constructor(private readonly options: PrivacyRedactorOptions = {}) {}

	redact(value: string): string {
		let redacted = value;
		redacted = this.redactPath(redacted, this.options.workspacePath, '<workspace>');
		redacted = this.redactPath(redacted, this.options.managedRuntimePath, '<managed-runtime>');
		redacted = this.redactPath(redacted, this.options.homeDir, '<home>');
		redacted = this.redactProxyCredentials(redacted);
		redacted = this.redactTokenLikeStrings(redacted);
		return redacted;
	}

	private redactPath(value: string, rawPath: string | null | undefined, replacement: string): string {
		if (!rawPath || rawPath.trim().length === 0) {
			return value;
		}
		return this.createPathVariants(rawPath.trim()).reduce((current, variant) => {
			return current.replace(new RegExp(this.escapeRegExp(variant), 'gi'), replacement);
		}, value);
	}

	private createPathVariants(rawPath: string): string[] {
		const slashVariant = rawPath.replace(/\\/g, '/');
		const backslashVariant = rawPath.replace(/\//g, '\\');
		return [...new Set([rawPath, slashVariant, backslashVariant, encodeURI(slashVariant)])]
			.filter(variant => variant.length > 0)
			.sort((left, right) => right.length - left.length);
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

export function createPrivacyRedactor(
	options: PrivacyRedactorOptions = {},
	sessionWorkspacePath?: string | null
): PrivacyRedactor {
	return new PrivacyRedactor({
		homeDir: options.homeDir,
		workspacePath: options.workspacePath ?? sessionWorkspacePath,
		managedRuntimePath: options.managedRuntimePath,
	});
}
