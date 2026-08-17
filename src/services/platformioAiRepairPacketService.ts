/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createPlatformioPrivacyRedactor, PlatformioPrivacyRedactor } from './platformioPrivacyRedactor';
import { formatPlatformioDiagnosticFinding } from './platformioDiagnosticFormatting';
import * as os from 'os';
import {
	AiRepairPacket,
	PlatformioDiagnosticSession,
	RepairHistorySummary,
} from '../types/platformioDiagnostic';
import type { WorkloadSelection } from '../types/coreEnvironment';
import type { ManagedRuntimeProvisioningState } from '../types/managedRuntime';

export interface PlatformioAiRepairPacketServiceOptions {
	now?: () => Date;
	homeDir?: string;
	workspacePath?: string | null;
	platform?: NodeJS.Platform;
	arch?: string;
	featureVersion?: string;
}

export interface BuildAiRepairPacketInput {
	session: PlatformioDiagnosticSession;
	historySummary?: RepairHistorySummary | null;
}

/** AI repair packet formatter. */
export class PlatformioAiRepairPacketService {
	private readonly now: () => Date;
	private readonly platform: NodeJS.Platform;
	private readonly arch: string;
	private readonly featureVersion: string;
	private readonly homeDir: string | undefined;
	private readonly workspacePath: string | null | undefined;

	constructor(options: PlatformioAiRepairPacketServiceOptions = {}) {
		this.now = options.now ?? (() => new Date());
		this.platform = options.platform ?? process.platform;
		this.arch = options.arch ?? process.arch;
		this.featureVersion = options.featureVersion ?? 'platformio-guided-repair-v1';
		this.homeDir = options.homeDir ?? os.homedir();
		this.workspacePath = options.workspacePath;
	}

	buildPacket(input: BuildAiRepairPacketInput): AiRepairPacket {
		const redactor = this.createRedactor(input.session.workspacePath);
		const generatedAt = this.now().toISOString();
		const staleHistory = input.historySummary?.status === 'stale';
		const problemStatement = this.buildProblemStatement(input.session);
		const environmentSummary = this.buildEnvironmentSummary(input.session);
		const diagnosticSummary = this.buildDiagnosticSummary(input.session);
		const attemptedRepairs = this.buildAttemptedRepairs(input.historySummary);
		const currentBlocker = this.buildCurrentBlocker(input.session);
		const knownConstraints = [
			'Do not recommend system-level changes unless explicitly asked.',
			'Prefer user-space, reversible steps.',
			'Account for Windows Unicode paths, the Singular managed Core, and VS Code/PlatformIO customPATH.',
			'Do not delete or mutate a provider-owned PlatformIO environment when repairing the Singular managed Core.',
		];
		const requestedResponseContract = [
			'Please reply with:',
			'1. Likely root cause',
			'2. What has already been ruled out',
			'3. Safest next steps',
			'4. Risks or data to check before changing anything',
		].join('\n');

		const rawPlainText = [
			'# Singular Blockly PlatformIO Repair Packet',
			`Generated At: ${generatedAt}`,
			`Feature Version: ${this.featureVersion}`,
			`Workspace Scope: ${input.session.workspacePath ?? 'No workspace'}`,
			`Overall Status: ${input.session.overallStatus}`,
			staleHistory ? 'Notice: Some repair history may be stale because the environment fingerprint changed.' : '',
			'',
			'## Problem',
			problemStatement,
			'',
			'## Environment',
			environmentSummary,
			'',
			'## Diagnostics',
			diagnosticSummary,
			'',
			'## Repair Attempts',
			attemptedRepairs,
			'',
			'## Current Blocker',
			currentBlocker,
			'',
			'## Constraints',
			knownConstraints.map(item => `- ${item}`).join('\n'),
			'',
			'## Requested Response',
			requestedResponseContract,
		].filter(line => line !== '').join('\n');

		const plainText = redactor.redact(rawPlainText);

		return {
			generatedAt,
			featureVersion: this.featureVersion,
			problemStatement: redactor.redact(problemStatement),
			environmentSummary: redactor.redact(environmentSummary),
			diagnosticSummary: redactor.redact(diagnosticSummary),
			attemptedRepairs: redactor.redact(attemptedRepairs),
			currentBlocker: redactor.redact(currentBlocker),
			knownConstraints,
			requestedResponseContract,
			plainText,
			redacted: plainText !== rawPlainText,
			staleHistory,
		};
	}

	private createRedactor(sessionWorkspacePath?: string | null): PlatformioPrivacyRedactor {
		return createPlatformioPrivacyRedactor({
			homeDir: this.homeDir,
			workspacePath: this.workspacePath,
		}, sessionWorkspacePath);
	}

	private buildProblemStatement(session: PlatformioDiagnosticSession): string {
		return `Singular Blockly dual-Core diagnostics currently report ${session.overallStatus}. The user needs a safe, user-space repair path that preserves provider ownership and does not depend on private PlatformIO extension internals.`;
	}

	private buildEnvironmentSummary(session: PlatformioDiagnosticSession): string {
		const settings = session.settingsEvidence;
		return [
			`- OS: ${session.environment?.platform ?? this.platform}/${session.environment?.arch ?? this.arch}`,
			'- VS Code: unknown',
			'- Singular Blockly: unknown',
			...this.formatCoreEnvironment(session),
			`- PlatformIO Settings Evidence: ${settings?.summary ?? 'No official PlatformIO settings evidence collected'}`,
			`- customPATH: ${settings?.customPath ?? 'not-configured'}`,
			`- useBuiltinPIOCore: ${this.formatUnknown(settings?.useBuiltinPIOCore)}`,
			`- useBuiltinPython: ${this.formatUnknown(settings?.useBuiltinPython)}`,
			`- http.proxy configured: ${settings?.httpProxyConfigured ?? false}`,
		].join('\n');
	}

	private formatCoreEnvironment(session: PlatformioDiagnosticSession): string[] {
		const diagnostics = session.coreDiagnostics;
		if (!diagnostics) {
			return ['- Provider Core: readiness unknown', '- Singular managed Core: readiness unknown'];
		}
		const { provider, managed } = diagnostics.environments;
		const lines = [
			`- Provider Core: ${provider.status}; version=${provider.version ?? 'unknown'}; ${provider.reason}`,
			`- Singular managed Core: ${managed.status}; version=${managed.version ?? 'unknown'}; storage=${managed.storageSummary ?? 'unknown'}; ${managed.reason}`,
			`- Arduino route: ${this.formatSelection(diagnostics.selection.arduino)}`,
			`- Python route: ${this.formatSelection(diagnostics.selection.python)}`,
		];
		lines.push(...this.formatProvisioning(managed.provisioning));
		return lines;
	}

	private formatProvisioning(state: ManagedRuntimeProvisioningState | undefined): string[] {
		if (!state || state.status === 'idle') {return [];}
		if (state.status === 'running') {
			return [`- Managed provisioning: running; attempt=${state.attempt}; trigger=${state.trigger}; stage=${state.stage}; percent=${state.percent}`];
		}
		const lines = [
			`- Managed provisioning: failed; attempt=${state.attempt}; trigger=${state.trigger}; stage=${state.failure.stage}; code=${state.failure.code}; started=${state.failure.started}`,
		];
		if (state.failure.stdout) {lines.push(`- Managed installer stdout: ${state.failure.stdout}`);}
		if (state.failure.stderr) {lines.push(`- Managed installer stderr: ${state.failure.stderr}`);}
		return lines;
	}

	private formatSelection(selection: WorkloadSelection): string {
		return `${selection.primary} -> ${selection.fallback}; selected=${selection.selected ?? 'none'}; fallbackUsed=${selection.fallbackUsed}`;
	}

	private buildDiagnosticSummary(session: PlatformioDiagnosticSession): string {
		return session.items.map(item => formatPlatformioDiagnosticFinding(item, { includeProbe: true })).join('\n');
	}

	private buildAttemptedRepairs(historySummary?: RepairHistorySummary | null): string {
		if (!historySummary || historySummary.runs.length === 0) {
			return 'No automatic repair has been run yet.';
		}

		const staleNotice = historySummary.status === 'stale' ? 'Some repair history may be stale.\n' : '';
		const runs = historySummary.runs.map(run => {
			const steps = run.stepResults.length === 0
				? '  - No step results recorded'
				: run.stepResults.map(step => `  - ${step.stepId}: ${step.status}; ${step.sanitizedOutput || 'no output summary'}`).join('\n');
			return `- ${run.flowId}: ${run.status} (${run.startedAt} -> ${run.finishedAt ?? 'not-finished'})\n${steps}`;
		}).join('\n');

		return `${staleNotice}${runs}`.trim();
	}

	private buildCurrentBlocker(session: PlatformioDiagnosticSession): string {
		const blocker = session.items.find(item => item.status === 'error') ?? session.items.find(item => item.status === 'warning');
		if (blocker) {return `${blocker.id}: ${blocker.reason}${blocker.nextStep ? ` Next step: ${blocker.nextStep}` : ''}`;}
		const managed = session.coreDiagnostics?.environments.managed;
		if (managed?.provisioning?.status === 'running') {
			return `managed-runtime: provisioning is active at ${managed.provisioning.stage} (${managed.provisioning.percent}%).`;
		}
		if (managed?.provisioning?.status === 'failed') {
			return `managed-runtime: ${managed.reason}`;
		}
		return 'No current blocker detected; diagnostics are operational.';
	}

	private formatUnknown(value: boolean | undefined): string {
		return typeof value === 'boolean' ? String(value) : 'unknown';
	}
}
