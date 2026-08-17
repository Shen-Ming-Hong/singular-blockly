/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ManagedRuntimeInstallRecord, ManagedRuntimeStatus } from '../types/managedRuntime';
import type { ManagedRuntimeInstallProgress } from './managedRuntimeInstaller';

interface ManagedRuntimeInitializationTarget {
	getStatus(): Promise<ManagedRuntimeStatus>;
	ensureReady(options?: {
		signal?: AbortSignal;
		onProgress?: (progress: ManagedRuntimeInstallProgress) => void;
		trigger?: ManagedRuntimeInitializationTrigger;
	}): Promise<ManagedRuntimeInstallRecord>;
}

export type ManagedRuntimeInitializationTrigger = 'activation' | 'editor-open';

export interface ManagedRuntimeInitializationResult {
	trigger: ManagedRuntimeInitializationTrigger;
	status: 'already-ready' | 'installed' | 'unsupported';
}

/**
 * Coordinates eager initialization across activation and repeated editor opens.
 * Cross-window serialization remains the installer's lock responsibility.
 */
export class ManagedRuntimeInitializationCoordinator {
	private inFlight?: Promise<ManagedRuntimeInitializationResult>;

	constructor(private readonly runtime: ManagedRuntimeInitializationTarget) {}

	initialize(
		trigger: ManagedRuntimeInitializationTrigger,
		onProgress?: (progress: ManagedRuntimeInstallProgress) => void,
		signal?: AbortSignal
	): Promise<ManagedRuntimeInitializationResult> {
		if (this.inFlight) {return this.inFlight;}
		this.inFlight = this.initializeOnce(trigger, onProgress, signal).finally(() => {this.inFlight = undefined;});
		return this.inFlight;
	}

	private async initializeOnce(
		trigger: ManagedRuntimeInitializationTrigger,
		onProgress?: (progress: ManagedRuntimeInstallProgress) => void,
		signal?: AbortSignal
	): Promise<ManagedRuntimeInitializationResult> {
		const status = await this.runtime.getStatus();
		if (status.status === 'ready') {return { trigger, status: 'already-ready' };}
		if (status.status === 'unsupported') {return { trigger, status: 'unsupported' };}
		await this.runtime.ensureReady({ signal, onProgress, trigger });
		return { trigger, status: 'installed' };
	}
}
