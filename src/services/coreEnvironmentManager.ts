/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
	CoreAttempt,
	CoreEnvironment,
	CoreEnvironmentId,
	CoreFailureClass,
	CoreOperationPhase,
	CoreSelectionResult,
	CoreWorkload,
	WorkloadSelection,
} from '../types/coreEnvironment';
import { classifyCoreFailure, didCoreProcessStart, isCoreFallbackAllowed } from './coreFailureClassifier';

export interface CoreEnvironmentProvider {
	readonly id: CoreEnvironmentId;
	resolve(
		workspaceUri: string,
		options?: { onProgress?: (progress: { stage: string; percent: number }) => void }
	): Promise<CoreEnvironment | null>;
}

export class CoreEnvironmentManagerError extends Error {
	constructor(
		public readonly failureClass: CoreFailureClass,
		public readonly attempts: readonly CoreAttempt[],
		message = 'No safe Core environment is available'
	) {
		super(message);
		this.name = 'CoreEnvironmentManagerError';
	}
}

export class CoreEnvironmentManager {
	private readonly providers: ReadonlyMap<CoreEnvironmentId, CoreEnvironmentProvider>;
	private readonly sticky = new Map<string, { coreId: CoreEnvironmentId; reason: CoreFailureClass }>();
	private readonly lastSelection = new Map<string, WorkloadSelection>();
	private readonly environments = new Map<string, CoreEnvironment>();

	constructor(provider: CoreEnvironmentProvider, managed: CoreEnvironmentProvider) {
		this.providers = new Map([[provider.id, provider], [managed.id, managed]]);
	}

	async getEnvironment(
		workload: CoreWorkload,
		workspaceUri: string,
		options: { onProgress?: (progress: { stage: string; percent: number }) => void } = {}
	): Promise<CoreSelectionResult> {
		const key = this.key(workload, workspaceUri);
		const profile = this.profile(workload);
		const sticky = this.sticky.get(key);
		const order = sticky ? [sticky.coreId, ...profile.filter(id => id !== sticky.coreId)] : profile;
		const attempts: CoreAttempt[] = [];

		for (let index = 0; index < order.length; index++) {
			const coreId = order[index];
			try {
				const environmentKey = this.environmentKey(coreId, workspaceUri);
				const environment = this.environments.get(environmentKey) ??
					await this.providers.get(coreId)?.resolve(workspaceUri, options) ?? null;
				if (environment) {
					this.environments.set(environmentKey, environment);
					const fallbackUsed = index > 0 || Boolean(sticky && coreId !== profile[0]);
					if (fallbackUsed && !sticky) {
						const reason = attempts.at(-1)?.failureClass ?? 'missing-executable';
						this.sticky.set(key, { coreId, reason });
					}
					this.remember(workload, workspaceUri, coreId, fallbackUsed);
					return { selected: environment, attempts, fallbackUsed };
				}
				const failureClass: CoreFailureClass = 'missing-executable';
				const fallbackAllowed = isCoreFallbackAllowed(failureClass, 'probe', false);
				attempts.push({ coreId, phase: 'probe', healthStatus: 'unavailable', failureClass, fallbackAllowed });
				if (!fallbackAllowed) {break;}
			} catch (error) {
				const failureClass = classifyCoreFailure(error, 'probe');
				const started = didCoreProcessStart(error);
				const fallbackAllowed = isCoreFallbackAllowed(failureClass, 'probe', started);
				attempts.push({ coreId, phase: 'probe', healthStatus: 'unavailable', failureClass, fallbackAllowed });
				if (!fallbackAllowed) {break;}
			}
		}
		const failureClass = attempts.at(-1)?.failureClass ?? 'missing-executable';
		this.remember(workload, workspaceUri, null, attempts.length > 1);
		return { selected: null, attempts, fallbackUsed: attempts.length > 1, failureClass };
	}

	async run<T>(options: {
		workload: CoreWorkload;
		workspaceUri: string;
		phase: CoreOperationPhase;
		operation: (environment: CoreEnvironment) => Promise<T>;
		onProgress?: (progress: { stage: string; percent: number }) => void;
	}): Promise<T> {
		const selection = await this.getEnvironment(options.workload, options.workspaceUri, { onProgress: options.onProgress });
		if (!selection.selected) {
			throw new CoreEnvironmentManagerError(selection.failureClass ?? 'missing-executable', selection.attempts);
		}
		try {
			return await options.operation(selection.selected);
		} catch (error) {
			const failureClass = classifyCoreFailure(error, options.phase);
			const started = didCoreProcessStart(error);
			if (selection.fallbackUsed || !isCoreFallbackAllowed(failureClass, options.phase, started)) {throw error;}

			const fallbackId = this.profile(options.workload).find(id => id !== selection.selected?.id);
			const fallback = fallbackId
				? await this.providers.get(fallbackId)?.resolve(options.workspaceUri, { onProgress: options.onProgress })
				: null;
			if (!fallback) {throw error;}
			this.sticky.set(this.key(options.workload, options.workspaceUri), { coreId: fallback.id, reason: failureClass });
			this.remember(options.workload, options.workspaceUri, fallback.id, true);
			return options.operation(fallback);
		}
	}

	getSelection(workload: CoreWorkload, workspaceUri: string): WorkloadSelection {
		return this.lastSelection.get(this.key(workload, workspaceUri)) ?? this.createSelection(workload, null, false, null);
	}

	reset(workload?: CoreWorkload, workspaceUri?: string): void {
		if (!workload && !workspaceUri) {
			this.sticky.clear();
			this.lastSelection.clear();
			this.environments.clear();
			return;
		}
		for (const key of [...this.sticky.keys(), ...this.lastSelection.keys()]) {
			const [keyWorkload, keyWorkspace] = key.split('\0', 2);
			if ((!workload || workload === keyWorkload) && (!workspaceUri || workspaceUri === keyWorkspace)) {
				this.sticky.delete(key);
				this.lastSelection.delete(key);
			}
		}
		if (workspaceUri) {
			for (const id of ['provider', 'managed'] as const) {this.environments.delete(this.environmentKey(id, workspaceUri));}
		} else if (workload) {
			// Environment cache keys are shared by workloads. A workload-wide retest
			// therefore has to invalidate both providers for every workspace.
			this.environments.clear();
		}
	}

	private profile(workload: CoreWorkload): readonly [CoreEnvironmentId, CoreEnvironmentId] {
		return workload === 'arduino' ? ['provider', 'managed'] : ['managed', 'provider'];
	}

	private key(workload: CoreWorkload, workspaceUri: string): string {
		return `${workload}\0${workspaceUri}`;
	}

	private environmentKey(coreId: CoreEnvironmentId, workspaceUri: string): string {
		return `${coreId}\0${workspaceUri}`;
	}

	private remember(workload: CoreWorkload, workspaceUri: string, selected: CoreEnvironmentId | null, fallbackUsed: boolean): void {
		const sticky = this.sticky.get(this.key(workload, workspaceUri));
		this.lastSelection.set(
			this.key(workload, workspaceUri),
			this.createSelection(workload, selected, fallbackUsed, sticky?.reason ?? null)
		);
	}

	private createSelection(
		workload: CoreWorkload,
		selected: CoreEnvironmentId | null,
		fallbackUsed: boolean,
		stickyReason: CoreFailureClass | null
	): WorkloadSelection {
		const [primary, fallback] = this.profile(workload);
		return { workload, primary, fallback, selected, fallbackUsed, stickyReason };
	}
}
