/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
	ManagedRuntimeInstallRecord,
	ManagedRuntimeInstallStage,
	ManagedRuntimeStatus,
} from '../types/managedRuntime';
import type {
	ManagedRuntimeInitializationResult,
	ManagedRuntimeInitializationTrigger,
} from './managedRuntimeInitializationCoordinator';
import type { ManagedRuntimeInstallProgress } from './managedRuntimeInstaller';

interface ManagedRuntimeProgressTarget {
	getStatus(): Promise<ManagedRuntimeStatus>;
	repair(options?: {
		signal?: AbortSignal;
		onProgress?: (progress: ManagedRuntimeInstallProgress) => void;
	}): Promise<ManagedRuntimeInstallRecord>;
}

interface ManagedRuntimeInitializationTarget {
	initialize(
		trigger: ManagedRuntimeInitializationTrigger,
		onProgress?: (progress: ManagedRuntimeInstallProgress) => void,
		signal?: AbortSignal
	): Promise<ManagedRuntimeInitializationResult>;
}

interface ProgressReporter {
	report(value: { message?: string; increment?: number }): void;
}

interface CancellationTokenLike {
	isCancellationRequested: boolean;
	onCancellationRequested(listener: () => void): { dispose(): void };
}

export interface ManagedRuntimeProgressUi {
	withProgress<T>(
		options: { title: string; cancellable: true },
		task: (progress: ProgressReporter, token: CancellationTokenLike) => Promise<T>
	): Promise<T>;
	showErrorMessage(message: string, ...actions: string[]): Promise<string | undefined>;
	openDiagnostics(): Promise<void>;
	chooseShorterFolder(): Promise<void>;
	copyRepairPacket(): Promise<void>;
}

interface ManagedRuntimeProgressLocalizer {
	getLocalizedMessage(key: string, fallback?: string, ...args: unknown[]): Promise<string>;
}

const STAGE_COPY: Record<ManagedRuntimeInstallStage, { key: string; fallback: string }> = {
	'waiting-lock': {
		key: 'MANAGED_RUNTIME_PROGRESS_WAITING_LOCK',
		fallback: 'Waiting for another window that may be preparing Singular Core',
	},
	'downloading-python': {
		key: 'MANAGED_RUNTIME_PROGRESS_DOWNLOADING_PYTHON',
		fallback: 'Downloading the managed Python runtime',
	},
	'extracting-python': {
		key: 'MANAGED_RUNTIME_PROGRESS_EXTRACTING_PYTHON',
		fallback: 'Extracting the managed Python runtime',
	},
	'installing-platformio': {
		key: 'MANAGED_RUNTIME_PROGRESS_INSTALLING_PLATFORMIO',
		fallback: 'Installing PlatformIO Core',
	},
	'installing-mpremote': {
		key: 'MANAGED_RUNTIME_PROGRESS_INSTALLING_MPREMOTE',
		fallback: 'Installing the CyberBrick device helper',
	},
	verifying: {
		key: 'MANAGED_RUNTIME_PROGRESS_VERIFYING',
		fallback: 'Verifying the managed tools',
	},
	committing: {
		key: 'MANAGED_RUNTIME_PROGRESS_COMMITTING',
		fallback: 'Committing the verified Singular Core',
	},
};

export class ManagedRuntimeProgressPresenter {
	private initializationInFlight?: Promise<ManagedRuntimeInitializationResult>;
	private repairInFlight?: Promise<ManagedRuntimeInstallRecord>;

	constructor(
		private readonly runtime: ManagedRuntimeProgressTarget,
		private readonly coordinator: ManagedRuntimeInitializationTarget,
		private readonly localizer: ManagedRuntimeProgressLocalizer,
		private readonly ui: ManagedRuntimeProgressUi
	) {}

	initialize(trigger: ManagedRuntimeInitializationTrigger): Promise<ManagedRuntimeInitializationResult> {
		if (this.initializationInFlight) {return this.initializationInFlight;}
		this.initializationInFlight = this.initializeOnce(trigger).finally(() => {
			this.initializationInFlight = undefined;
		});
		return this.initializationInFlight;
	}

	repair(): Promise<ManagedRuntimeInstallRecord> {
		if (this.repairInFlight) {return this.repairInFlight;}
		this.repairInFlight = this.repairOnce().finally(() => {
			this.repairInFlight = undefined;
		});
		return this.repairInFlight;
	}

	private async repairOnce(): Promise<ManagedRuntimeInstallRecord> {
		if (this.initializationInFlight) {
			try {
				await this.initializationInFlight;
				const status = await this.runtime.getStatus();
				if (status.status === 'ready') {return status.record;}
			} catch {
				// Explicit repair may retry after background initialization failed.
			}
		}
		return this.runWithProgress(
			'MANAGED_RUNTIME_PROGRESS_REPAIR_TITLE',
			'Repairing Singular Core',
			(signal, onProgress) => this.runtime.repair({ signal, onProgress })
		);
	}

	private async initializeOnce(
		trigger: ManagedRuntimeInitializationTrigger
	): Promise<ManagedRuntimeInitializationResult> {
		if (this.repairInFlight) {
			await this.repairInFlight;
			return { trigger, status: 'installed' };
		}
		const status = await this.runtime.getStatus();
		if (status.status === 'ready') {return { trigger, status: 'already-ready' };}
		if (status.status === 'unsupported') {return { trigger, status: 'unsupported' };}
		return this.runWithProgress(
			'MANAGED_RUNTIME_PROGRESS_INITIALIZE_TITLE',
			'Preparing Singular Core',
			(signal, onProgress) => this.coordinator.initialize(trigger, onProgress, signal)
		);
	}

	private async runWithProgress<T>(
		titleKey: string,
		titleFallback: string,
		operation: (
			signal: AbortSignal,
			onProgress: (progress: ManagedRuntimeInstallProgress) => void
		) => Promise<T>
	): Promise<T> {
		const [title, stageCopy, stagePercentTemplate] = await Promise.all([
			this.localizer.getLocalizedMessage(titleKey, titleFallback),
			this.loadStageCopy(),
			this.localizer.getLocalizedMessage(
				'MANAGED_RUNTIME_PROGRESS_STAGE_PERCENT',
				'{0} ({1}%)'
			),
		]);

		let cancellationRequested = false;
		try {
			return await this.ui.withProgress({ title, cancellable: true }, async (progress, token) => {
				const controller = new AbortController();
				const cancel = (): void => {
					cancellationRequested = true;
					controller.abort();
				};
				if (token.isCancellationRequested) {cancel();}
				const cancellation = token.onCancellationRequested(cancel);
				let previousPercent = 0;
				try {
					return await operation(controller.signal, update => {
						const percent = Math.max(previousPercent, Math.min(100, update.percent));
						const increment = percent - previousPercent;
						previousPercent = percent;
						let message = stageCopy[update.stage];
						if (update.stage !== 'waiting-lock') {
							message = stagePercentTemplate
								.replace('{0}', stageCopy[update.stage])
								.replace('{1}', String(percent));
						}
						progress.report(increment > 0 ? { message, increment } : { message });
					});
				} finally {
					cancellation.dispose();
				}
			});
		} catch (error) {
			if (!cancellationRequested && this.errorCode(error) !== 'cancelled') {
				await this.presentFailure(error);
			}
			throw error;
		}
	}

	private async loadStageCopy(): Promise<Record<ManagedRuntimeInstallStage, string>> {
		const entries = await Promise.all(Object.entries(STAGE_COPY).map(async ([stage, copy]) => [
			stage,
			await this.localizer.getLocalizedMessage(copy.key, copy.fallback),
		] as const));
		return Object.fromEntries(entries) as Record<ManagedRuntimeInstallStage, string>;
	}

	private async presentFailure(error: unknown): Promise<void> {
		const pathTooLong = this.errorCode(error) === 'path-too-long';
		const [message, openDiagnostics, chooseShorterFolder, copyRepairPacket] = await Promise.all([
			this.localizer.getLocalizedMessage(
				pathTooLong ? 'MANAGED_RUNTIME_PROGRESS_PATH_TOO_LONG' : 'MANAGED_RUNTIME_PROGRESS_FAILED',
				pathTooLong
					? 'Singular Core needs a shorter local folder on this Windows system. The provider Core was not changed.'
					: 'Singular Core setup did not complete. The provider Core was not changed.'
			),
			this.localizer.getLocalizedMessage('MANAGED_RUNTIME_ACTION_OPEN_DIAGNOSTICS', 'Open diagnostics'),
			this.localizer.getLocalizedMessage('MANAGED_RUNTIME_ACTION_CHOOSE_SHORTER_FOLDER', 'Choose shorter folder'),
			this.localizer.getLocalizedMessage('PLATFORMIO_REPAIR_ACTION_COPY_AI_PACKET', 'Copy AI repair summary'),
		]);
		const selection = await this.ui.showErrorMessage(
			message,
			openDiagnostics,
			chooseShorterFolder,
			copyRepairPacket
		);
		if (selection === openDiagnostics) {await this.ui.openDiagnostics();}
		if (selection === chooseShorterFolder) {await this.ui.chooseShorterFolder();}
		if (selection === copyRepairPacket) {await this.ui.copyRepairPacket();}
	}

	private errorCode(error: unknown): string {
		return typeof error === 'object' && error !== null && 'code' in error
			? String((error as { code?: unknown }).code ?? 'unknown').toLowerCase()
			: 'unknown';
	}
}
