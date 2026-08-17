/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
	createFetchPatch,
	createProxyResolver,
	LogLevel,
	type ProxyAgentParams,
	type ProxySupportSetting,
} from '@vscode/proxy-agent';
import { log } from './logging';

export interface ManagedRuntimeProxyConfiguration {
	proxy?: string;
	proxySupport?: string;
	noProxy?: readonly string[];
}

function normalizeProxySupport(value: string | undefined): ProxySupportSetting {
	return value === 'override' || value === 'fallback' || value === 'off' ? value : 'on';
}

/**
 * Create a fetch implementation that follows VS Code's HTTP proxy settings and
 * the standard HTTP(S)_PROXY / NO_PROXY environment variables. Proxy URLs and
 * authentication material are deliberately never written to the extension log.
 */
export function createManagedRuntimeFetch(
	configuration: () => ManagedRuntimeProxyConfiguration,
	originalFetch: typeof fetch = globalThis.fetch,
	environment: NodeJS.ProcessEnv = process.env
): typeof fetch {
	const proxyLog = {
		trace: () => undefined,
		debug: () => undefined,
		info: () => undefined,
		warn: () => log('[managed-runtime] Proxy transport warning', 'warn'),
		error: () => log('[managed-runtime] Proxy transport error', 'warn'),
	};
	const params: ProxyAgentParams = {
		resolveProxy: async () => undefined,
		getProxyURL: () => configuration().proxy?.trim() || undefined,
		getProxySupport: () => normalizeProxySupport(configuration().proxySupport),
		getNoProxyConfig: () => [...(configuration().noProxy ?? [])],
		isAdditionalFetchSupportEnabled: () => true,
		isWebSocketPatchEnabled: () => false,
		addCertificatesV1: () => false,
		addCertificatesV2: () => false,
		// VSIX is platform-neutral; avoid loading the optional native Windows CA
		// bridge from a bundle built on another OS. Node's regular trust store and
		// NODE_EXTRA_CA_CERTS remain available to the HTTPS stack.
		loadSystemCertificatesFromNode: () => false,
		loadAdditionalCertificates: async () => [],
		log: proxyLog,
		getLogLevel: () => LogLevel.Warning,
		proxyResolveTelemetry: () => undefined,
		isUseHostProxyEnabled: () => true,
		env: { ...environment },
	};
	const resolver = createProxyResolver(params);
	return createFetchPatch(params, originalFetch, resolver.resolveProxyURL) as typeof fetch;
}
