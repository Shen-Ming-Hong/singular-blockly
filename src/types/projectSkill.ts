/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PROJECT_SKILL_SCHEMA_VERSION = 1;
export const PROJECT_SKILL_MANAGER = 'singular-blockly';
export const PROJECT_SKILL_MANIFEST_PATH = '.agents/skills/singular-blockly/managed-manifest.json';
export const PROJECT_SKILL_STATUS_PATH = 'blockly/.singular-blockly/skill-status.json';

export type ManagedSkillFileKind = 'canonical' | 'reference' | 'compatibility';

export interface PackagedManagedFile {
	source: string;
	target: string;
	sha256: string;
	kind: ManagedSkillFileKind;
}

export interface PackagedPreservedFile {
	source: string;
	target: string;
	policy: 'create-if-missing';
}

export interface PackagedSkillManifest {
	schemaVersion: number;
	manager: typeof PROJECT_SKILL_MANAGER;
	skillVersion: string;
	manifestTarget: typeof PROJECT_SKILL_MANIFEST_PATH;
	managedFiles: PackagedManagedFile[];
	preservedFiles: PackagedPreservedFile[];
}

export interface InstalledManagedFile {
	path: string;
	sha256: string;
	kind: ManagedSkillFileKind;
}

export interface InstalledSkillManifest {
	schemaVersion: number;
	manager: typeof PROJECT_SKILL_MANAGER;
	skillVersion: string;
	managedFiles: InstalledManagedFile[];
	preservedFiles: string[];
}

export type SkillInstallationResult = 'no-change' | 'install' | 'update' | 'conflict';

export type SkillIssueCode =
	| 'INVALID_BUNDLE'
	| 'UNMANAGED_CONFLICT'
	| 'UNSAFE_PATH'
	| 'BACKUP_FAILED'
	| 'WRITE_FAILED'
	| 'ROLLBACK_REQUIRED'
	| 'ROLLBACK_FAILED';

export type SkillRecoveryAction = 'INSPECT_CONFLICT' | 'RESTORE_BACKUP' | 'RETRY_ON_WRITABLE_WORKSPACE';

export interface SkillIssue {
	code: SkillIssueCode;
	path: string | null;
	action: SkillRecoveryAction;
}

export interface SkillInstallationPlan {
	result: SkillInstallationResult;
	create: string[];
	replace: string[];
	backupThenReplace: string[];
	preserve: string[];
	conflicts: SkillIssue[];
}

export interface SkillStatus {
	schemaVersion: number;
	status: 'ready' | 'conflict' | 'failed';
	skillVersion: string | null;
	manifestPath: typeof PROJECT_SKILL_MANIFEST_PATH;
	backupPaths: string[];
	issues: SkillIssue[];
	lastAttemptAt: string;
}
