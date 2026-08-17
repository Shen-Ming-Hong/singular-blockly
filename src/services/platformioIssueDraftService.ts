/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createPlatformioPrivacyRedactor, PlatformioPrivacyRedactor } from './platformioPrivacyRedactor';
import { formatPlatformioDiagnosticFinding } from './platformioDiagnosticFormatting';
import * as os from 'os';
import {
	IssueDraftProposal,
	PlatformioDiagnosticSession,
	RepairHistorySummary,
} from '../types/platformioDiagnostic';

export interface PlatformioIssueDraftServiceOptions {
	now?: () => Date;
	homeDir?: string;
	workspacePath?: string | null;
	platform?: NodeJS.Platform;
	arch?: string;
}

export interface BuildIssueDraftInput {
	session: PlatformioDiagnosticSession;
	historySummary?: RepairHistorySummary | null;
	source: 'ai-assisted' | 'human-confirmed';
}

/** Human-approved local issue draft formatter. */
export class PlatformioIssueDraftService {
	private readonly now: () => Date;
	private readonly platform: NodeJS.Platform;
	private readonly arch: string;
	private readonly homeDir: string | undefined;
	private readonly workspacePath: string | null | undefined;

	constructor(options: PlatformioIssueDraftServiceOptions = {}) {
		this.now = options.now ?? (() => new Date());
		this.platform = options.platform ?? process.platform;
		this.arch = options.arch ?? process.arch;
		this.homeDir = options.homeDir ?? os.homedir();
		this.workspacePath = options.workspacePath;
	}

	buildDraft(input: BuildIssueDraftInput): IssueDraftProposal {
		const redactor = this.createRedactor(input.session.workspacePath);
		const generatedAt = this.now().toISOString();
		const privacyChecklist = [
			'I checked that local usernames and workspace paths are masked.',
			'I checked that proxy credentials, tokens, and private hostnames are not included.',
			'I searched existing issues using the suggested keywords below.',
		];
		const duplicateSearchHints = this.buildDuplicateSearchHints(input.session);

		if (input.session.overallStatus === 'operational' && !this.hasManagedProvisioningBlocker(input.session)) {
			return {
				title: 'No PlatformIO issue draft recommended',
				body: 'No issue draft recommended: diagnostics are operational.',
				labels: [],
				privacyChecklist,
				duplicateSearchHints,
				generatedAt,
				candidacy: 'not-recommended',
				noDraftReason: 'Diagnostics are operational; this looks like one-off local noise rather than a product issue.',
				source: input.source,
			};
		}

		const blocker = this.findBlocker(input.session);
		const title = `PlatformIO guided repair still reports ${input.session.overallStatus} when ${blocker?.id ?? 'toolchain'} is checked`;
		const body = redactor.redact([
			'# Title',
			title,
			'',
			'## Summary',
			`Singular Blockly PlatformIO diagnostics report ${input.session.overallStatus}. Source: ${input.source}.`,
			'',
			'## Environment',
			`- OS: ${input.session.environment?.platform ?? this.platform}/${input.session.environment?.arch ?? this.arch}`,
			'- Singular Blockly version: unknown',
			'- VS Code version: unknown',
			...this.formatCoreEnvironment(input.session),
			`- Relevant PlatformIO settings: ${input.session.settingsEvidence?.summary ?? 'No settings evidence collected'}`,
			`- Workspace: ${input.session.workspacePath ?? 'No workspace'}`,
			'',
			'## Diagnostics',
			input.session.items.map(item => formatPlatformioDiagnosticFinding(item)).join('\n'),
			'',
			'## Repair attempts',
			this.formatRepairAttempts(input.historySummary),
			'',
			'## Expected behavior',
			'Singular Blockly should use the healthy primary Core or one safe pre-start fallback, while keeping provider and managed environments independently repairable.',
			'',
			'## Actual behavior',
			blocker ? `${blocker.id}: ${blocker.reason}` : `Overall status is ${input.session.overallStatus}.`,
			'',
			'## Privacy checklist before posting',
			privacyChecklist.map(item => `- [ ] ${item}`).join('\n'),
			'',
			'## Suggested duplicate-search keywords',
			duplicateSearchHints.map(item => `- ${item}`).join('\n'),
		].join('\n'));

		return {
			title: redactor.redact(title),
			body,
			labels: ['bug', 'platformio', 'needs-triage'],
			privacyChecklist,
			duplicateSearchHints,
			generatedAt,
			candidacy: 'recommended',
			source: input.source,
			redactionWarning: 'Review the privacy checklist before posting publicly.',
		};
	}

	private formatCoreEnvironment(session: PlatformioDiagnosticSession): string[] {
		const diagnostics = session.coreDiagnostics;
		if (!diagnostics) {
			return ['- Provider Core: readiness unknown', '- Singular managed Core: readiness unknown'];
		}
		const { provider, managed } = diagnostics.environments;
		const route = (workload: 'arduino' | 'python') => {
			const selection = diagnostics.selection[workload];
			return `${selection.primary} -> ${selection.fallback}; selected=${selection.selected ?? 'none'}; fallbackUsed=${selection.fallbackUsed}`;
		};
		const lines = [
			`- Provider Core: ${provider.status}; version=${provider.version ?? 'unknown'}; ${provider.reason}`,
			`- Singular managed Core: ${managed.status}; version=${managed.version ?? 'unknown'}; storage=${managed.storageSummary ?? 'unknown'}; ${managed.reason}`,
			`- Arduino route: ${route('arduino')}`,
			`- Python route: ${route('python')}`,
		];
		const provisioning = managed.provisioning;
		if (provisioning?.status === 'running') {
			lines.push(`- Managed provisioning: running; attempt=${provisioning.attempt}; trigger=${provisioning.trigger}; stage=${provisioning.stage}; percent=${provisioning.percent}`);
		}
		if (provisioning?.status === 'failed') {
			const failure = provisioning.failure;
			lines.push(`- Managed provisioning: failed; attempt=${provisioning.attempt}; trigger=${provisioning.trigger}; stage=${failure.stage}; code=${failure.code}; started=${failure.started}`);
			if (failure.stdout) {lines.push(`- Managed installer stdout: ${failure.stdout}`);}
			if (failure.stderr) {lines.push(`- Managed installer stderr: ${failure.stderr}`);}
		}
		return lines;
	}

	private hasManagedProvisioningBlocker(session: PlatformioDiagnosticSession): boolean {
		return this.findManagedProvisioningBlocker(session) !== undefined;
	}

	private createRedactor(sessionWorkspacePath?: string | null): PlatformioPrivacyRedactor {
		return createPlatformioPrivacyRedactor({
			homeDir: this.homeDir,
			workspacePath: this.workspacePath,
		}, sessionWorkspacePath);
	}

	private findBlocker(session: PlatformioDiagnosticSession): { id: string; reason: string } | undefined {
		return this.findManagedProvisioningBlocker(session)
			?? session.items.find(item => item.status === 'error')
			?? session.items.find(item => item.status === 'warning');
	}

	private findManagedProvisioningBlocker(
		session: PlatformioDiagnosticSession
	): { id: string; reason: string } | undefined {
		const provisioning = session.coreDiagnostics?.environments.managed.provisioning;
		if (provisioning?.status === 'running') {
			return {
				id: 'managed-provisioning',
				reason: `attempt ${provisioning.attempt} is running at ${provisioning.stage} (${provisioning.percent}%)`,
			};
		}
		if (provisioning?.status === 'failed') {
			return {
				id: 'managed-provisioning',
				reason: `attempt ${provisioning.attempt} failed at ${provisioning.failure.stage}: ${provisioning.failure.message}`,
			};
		}
		return undefined;
	}

	private buildDuplicateSearchHints(session: PlatformioDiagnosticSession): string[] {
		const hints = new Set<string>([
			'PlatformIO customPATH Singular Blockly',
			'VS Code PlatformIO useBuiltinPIOCore false negative',
		]);

		if (session.items.some(item => item.id === 'mpremote' && item.status !== 'ok')) {
			hints.add('mpremote not found CyberBrick');
		}

		if (session.environment?.platform === 'win32' || this.platform === 'win32') {
			hints.add('Windows Unicode path PlatformIO mpremote');
		}

		return [...hints];
	}

	private formatRepairAttempts(historySummary?: RepairHistorySummary | null): string {
		if (!historySummary || historySummary.runs.length === 0) {
			return 'No automatic repair attempts recorded.';
		}

		return historySummary.runs.map(run => {
			return `- ${run.flowId}: ${run.status} (${run.startedAt} -> ${run.finishedAt ?? 'not-finished'})`;
		}).join('\n');
	}
}
