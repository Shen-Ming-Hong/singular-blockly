/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type CoreEnvironmentId = 'provider' | 'managed';
export type CoreWorkload = 'arduino' | 'python';
export type CoreHealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'unknown';
export type PackageHealthStatus = 'ready' | 'failed' | 'unknown';

export type CoreFailureClass =
	| 'spawn'
	| 'missing-executable'
	| 'python-import'
	| 'permission'
	| 'local-store-corruption'
	| 'managed-provisioning'
	| 'compile'
	| 'project-config'
	| 'dns'
	| 'proxy'
	| 'tls'
	| 'registry'
	| 'device'
	| 'serial'
	| 'cancelled'
	| 'unknown-after-start';

export interface CoreInvocation {
	command: string;
	prefixArgs: readonly string[];
	env: Readonly<NodeJS.ProcessEnv>;
	source: CoreEnvironmentId;
}

export interface CoreHealth {
	status: CoreHealthStatus;
	checkedAt: string | null;
	version?: string;
	packageStatus: PackageHealthStatus;
	failureClass: CoreFailureClass | null;
}

export interface CoreEnvironment {
	id: CoreEnvironmentId;
	displaySource: string;
	invocation: CoreInvocation;
	pythonPath: string | null;
	mpremotePath: string | null;
	storageRoot: string | null;
	health: CoreHealth;
}

export interface CoreAttempt {
	coreId: CoreEnvironmentId;
	phase: CoreOperationPhase;
	healthStatus: CoreHealthStatus;
	failureClass: CoreFailureClass | null;
	fallbackAllowed: boolean;
}

export type CoreOperationPhase = 'probe' | 'prepare' | 'project-process';

export interface WorkloadSelection {
	workload: CoreWorkload;
	primary: CoreEnvironmentId;
	fallback: CoreEnvironmentId;
	selected: CoreEnvironmentId | null;
	fallbackUsed: boolean;
	stickyReason: CoreFailureClass | null;
}

export interface CoreSelectionResult {
	selected: CoreEnvironment | null;
	attempts: readonly CoreAttempt[];
	fallbackUsed: boolean;
	failureClass?: CoreFailureClass;
}
