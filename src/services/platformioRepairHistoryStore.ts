/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'crypto';
import {
	AutoRepairRun,
	DiagnosticItemId,
	EnvironmentFingerprint,
	PlatformioDiagnosticSession,
	RepairHistorySnapshot,
} from '../types/platformioDiagnostic';

export interface WorkspaceStateLike {
	get<T>(key: string): T | undefined;
	update(key: string, value: unknown): PromiseLike<void> | Promise<void> | void;
}

export interface PlatformioRepairHistoryStoreOptions {
	now?: () => Date;
	platform?: NodeJS.Platform;
	arch?: string;
	maxRuns?: number;
	storageKey?: string;
}

export const PLATFORMIO_REPAIR_HISTORY_SCHEMA_VERSION = 1;
export const PLATFORMIO_REPAIR_HISTORY_STORAGE_KEY = 'platformioGuidedRepair.history.v1';

export class PlatformioRepairHistoryStore {
	private readonly now: () => Date;
	private readonly platform: NodeJS.Platform;
	private readonly arch: string;
	private readonly maxRuns: number;
	private readonly storageKey: string;

	constructor(
		private readonly workspaceState: WorkspaceStateLike,
		options: PlatformioRepairHistoryStoreOptions = {}
	) {
		this.now = options.now ?? (() => new Date());
		this.platform = options.platform ?? process.platform;
		this.arch = options.arch ?? process.arch;
		this.maxRuns = options.maxRuns ?? 20;
		this.storageKey = options.storageKey ?? PLATFORMIO_REPAIR_HISTORY_STORAGE_KEY;
	}

	createEnvironmentFingerprint(session: PlatformioDiagnosticSession): EnvironmentFingerprint {
		const settingsSummary = session.settingsEvidence?.summary ?? '';
		const pathHints = [
			session.settingsEvidence?.candidatePathEntries.join('|') ?? '',
			...session.items.map(item => `${item.id}:${item.source}:${item.resolvedPath ? this.pathSuffix(item.resolvedPath) : 'unresolved'}`),
		].join('|');
		const toolVersions = this.collectToolVersions(session);

		return {
			fingerprintVersion: PLATFORMIO_REPAIR_HISTORY_SCHEMA_VERSION,
			workspaceHash: this.hash(session.workspacePath ?? '<no-workspace>'),
			platform: this.platform,
			arch: this.arch,
			settingsHash: this.hash(settingsSummary),
			pathHintsHash: this.hash(pathHints),
			toolVersions,
			createdAt: this.now().toISOString(),
		};
	}

	createEmptySnapshot(fingerprint: EnvironmentFingerprint): RepairHistorySnapshot {
		return {
			schemaVersion: PLATFORMIO_REPAIR_HISTORY_SCHEMA_VERSION,
			workspaceHash: fingerprint.workspaceHash,
			activeFingerprint: fingerprint,
			runs: [],
			lastClearedAt: null,
			staleReason: null,
		};
	}

	async loadSnapshot(activeFingerprint?: EnvironmentFingerprint): Promise<RepairHistorySnapshot | null> {
		const rawSnapshot = this.workspaceState.get<unknown>(this.storageKey);
		if (!this.isValidSnapshot(rawSnapshot)) {
			return null;
		}

		const snapshot = this.normalizeSnapshot(rawSnapshot);
		if (activeFingerprint && !this.isSameFingerprint(snapshot.activeFingerprint, activeFingerprint)) {
			return {
				...snapshot,
				activeFingerprint,
				workspaceHash: activeFingerprint.workspaceHash,
				staleReason: 'environment-fingerprint-changed',
			};
		}

		return snapshot;
	}

	async saveSnapshot(snapshot: RepairHistorySnapshot): Promise<void> {
		await this.workspaceState.update(this.storageKey, this.normalizeSnapshot(snapshot));
	}

	async appendRun(fingerprint: EnvironmentFingerprint, run: AutoRepairRun): Promise<RepairHistorySnapshot> {
		const snapshot = (await this.loadSnapshot(fingerprint)) ?? this.createEmptySnapshot(fingerprint);
		const runs = [...snapshot.runs.filter(existingRun => existingRun.runId !== run.runId), run].slice(-this.maxRuns);
		const updatedSnapshot: RepairHistorySnapshot = {
			...snapshot,
			activeFingerprint: fingerprint,
			workspaceHash: fingerprint.workspaceHash,
			runs,
			staleReason: null,
		};
		await this.saveSnapshot(updatedSnapshot);
		return updatedSnapshot;
	}

	async clear(fingerprint: EnvironmentFingerprint): Promise<RepairHistorySnapshot> {
		const snapshot: RepairHistorySnapshot = {
			...this.createEmptySnapshot(fingerprint),
			lastClearedAt: this.now().toISOString(),
		};
		await this.saveSnapshot(snapshot);
		return snapshot;
	}

	private normalizeSnapshot(snapshot: RepairHistorySnapshot): RepairHistorySnapshot {
		return {
			...snapshot,
			runs: snapshot.runs.slice(-this.maxRuns).map(run => this.normalizeRun(run)),
			lastClearedAt: snapshot.lastClearedAt ?? null,
			staleReason: snapshot.staleReason ?? null,
		};
	}

	private normalizeRun(run: AutoRepairRun): AutoRepairRun {
		if (run.status !== 'running') {
			return run;
		}

		return {
			...run,
			finishedAt: run.finishedAt ?? this.now().toISOString(),
			status: 'interrupted',
			userFacingSummary: run.userFacingSummary.includes('interrupted')
				? run.userFacingSummary
				: `${run.userFacingSummary || 'Repair run'} (interrupted before completion)`,
		};
	}

	private isValidSnapshot(value: unknown): value is RepairHistorySnapshot {
		if (!value || typeof value !== 'object') {
			return false;
		}

		const candidate = value as Partial<RepairHistorySnapshot>;
		return (
			candidate.schemaVersion === PLATFORMIO_REPAIR_HISTORY_SCHEMA_VERSION &&
			typeof candidate.workspaceHash === 'string' &&
			!!candidate.activeFingerprint &&
			Array.isArray(candidate.runs)
		);
	}

	private isSameFingerprint(left: EnvironmentFingerprint, right: EnvironmentFingerprint): boolean {
		return (
			left.fingerprintVersion === right.fingerprintVersion &&
			left.workspaceHash === right.workspaceHash &&
			left.platform === right.platform &&
			left.arch === right.arch &&
			left.settingsHash === right.settingsHash &&
			left.pathHintsHash === right.pathHintsHash &&
			JSON.stringify(left.toolVersions) === JSON.stringify(right.toolVersions)
		);
	}

	private collectToolVersions(session: PlatformioDiagnosticSession): Partial<Record<DiagnosticItemId, string>> {
		return Object.fromEntries(
			session.items
				.filter(item => !!item.versionProbe?.output)
				.map(item => [item.id, item.versionProbe?.output ?? ''])
		) as Partial<Record<DiagnosticItemId, string>>;
	}

	private pathSuffix(filePath: string): string {
		const normalized = filePath.replace(/\\/g, '/');
		return normalized.split('/').slice(-4).join('/');
	}

	private hash(value: string): string {
		return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
	}
}
