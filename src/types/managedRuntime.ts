/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type ManagedRuntimePlatform = 'win32' | 'darwin' | 'linux';
export type ManagedRuntimeArch = 'x64' | 'arm64';
export type RuntimeSupportStatus = 'stable' | 'release-candidate';

export type ManagedRuntimeInstallStage =
	| 'waiting-lock'
	| 'downloading-python'
	| 'extracting-python'
	| 'installing-platformio'
	| 'installing-mpremote'
	| 'verifying'
	| 'committing';

export type ManagedRuntimeProvisioningTrigger = 'activation' | 'editor-open' | 'workload' | 'repair';

export interface ManagedRuntimeProvisioningFailure {
	failureDomain: 'managed-provisioning';
	stage: ManagedRuntimeInstallStage;
	code: string;
	started: boolean;
	message: string;
	stdout: string;
	stderr: string;
}

export type ManagedRuntimeProvisioningState =
	| { status: 'idle'; attempt: number }
	| {
		status: 'running';
		attempt: number;
		trigger: ManagedRuntimeProvisioningTrigger;
		stage: ManagedRuntimeInstallStage;
		percent: number;
		startedAt: string;
		updatedAt: string;
	}
	| {
		status: 'failed';
		attempt: number;
		trigger: ManagedRuntimeProvisioningTrigger;
		stage: ManagedRuntimeInstallStage;
		percent: number;
		startedAt: string;
		failedAt: string;
		failure: ManagedRuntimeProvisioningFailure;
	};

export interface RuntimeDownload {
	url: string;
	sha256: string;
	size: number;
	license: string;
	source: string;
}

export interface RuntimeArtifact extends RuntimeDownload {
	id: string;
	platform: ManagedRuntimePlatform;
	arch: ManagedRuntimeArch;
	libc: 'glibc' | null;
	support: RuntimeSupportStatus;
	archiveFormat: 'tar.gz';
	pythonRelativePath: string;
}

export interface RuntimeManifest {
	schemaVersion: 1;
	runtimeVersion: string;
	pythonVersion: string;
	installer: RuntimeDownload;
	platformio: {
		channel: 'stable';
		testedVersionRange: string;
	};
	mpremoteVersion: string;
	platformPackages: Readonly<Record<string, string>>;
	artifacts: readonly RuntimeArtifact[];
}

export interface ManagedToolRecord {
	relativePath: string;
	version: string;
}

export interface ManagedRuntimeInstallRecord {
	schemaVersion: 1;
	runtimeVersion: string;
	artifactId: string;
	manifestSha256: string;
	installedAt: string;
	versionDirectory: string;
	tools: {
		bootstrapPython: ManagedToolRecord;
		python: ManagedToolRecord;
		pip: ManagedToolRecord;
		pio: ManagedToolRecord;
		mpremote: ManagedToolRecord;
	};
	health: {
		status: 'healthy';
		checkedAt: string;
	};
}

export type ManagedRuntimeStatus =
	| { status: 'missing' }
	| { status: 'unsupported'; reason: string }
	| { status: 'invalid'; reason: string }
	| { status: 'ready'; record: ManagedRuntimeInstallRecord };

export interface ManagedRuntimeLayout {
	root: string;
	downloads: string;
	staging: string;
	versions: string;
	currentRecord: string;
	installLock: string;
	workspaces: string;
}
