/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const vscode = acquireVsCodeApi();

const state = {
	panelState: null,
	strings: createFallbackStrings(),
	feedbackTimer: null,
};

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
	cacheElements();
	bindEvents();
	renderLoading();
	vscode.postMessage({ command: 'platformioDiagnostic:ready' });
});

window.addEventListener('message', event => {
	const message = event.data || {};
	if (message.strings) {
		state.strings = message.strings;
	}

	switch (message.command) {
		case 'platformioDiagnostic:loading':
			state.panelState = message.panelState;
			renderLoading();
			break;
		case 'platformioDiagnostic:render':
			state.panelState = message.panelState;
			renderReady();
			break;
		case 'platformioDiagnostic:error':
			state.panelState = message.panelState;
			renderError();
			break;
		case 'platformioDiagnostic:copyResult':
			showFeedback(message.status || 'success', message.message || '');
			break;
		default:
			break;
	}
});

function cacheElements() {
	elements.panelTitle = document.getElementById('panelTitle');
	elements.panelSubtitle = document.getElementById('panelSubtitle');
	elements.retestButton = document.getElementById('retestButton');
	elements.copySummaryButton = document.getElementById('copySummaryButton');
	elements.autoRepairButton = document.getElementById('autoRepairButton');
	elements.copyAiRepairPacketButton = document.getElementById('copyAiRepairPacketButton');
	elements.createIssueDraftButton = document.getElementById('createIssueDraftButton');
	elements.clearRepairHistoryButton = document.getElementById('clearRepairHistoryButton');
	elements.feedbackBanner = document.getElementById('feedbackBanner');
	elements.stateSurface = document.getElementById('stateSurface');
	elements.loadingSpinner = document.getElementById('loadingSpinner');
	elements.stateTitle = document.getElementById('stateTitle');
	elements.stateDescription = document.getElementById('stateDescription');
	elements.contentRoot = document.getElementById('contentRoot');
	elements.summaryTitle = document.getElementById('summaryTitle');
	elements.toolsTitle = document.getElementById('toolsTitle');
	elements.repairTitle = document.getElementById('repairTitle');
	elements.exportsTitle = document.getElementById('exportsTitle');
	elements.exportNotice = document.getElementById('exportNotice');
	elements.scopeTitle = document.getElementById('scopeTitle');
	elements.overallStatusBadge = document.getElementById('overallStatusBadge');
	elements.overallStatusLabel = document.getElementById('overallStatusLabel');
	elements.overallStatusValue = document.getElementById('overallStatusValue');
	elements.workspaceLabel = document.getElementById('workspaceLabel');
	elements.workspaceValue = document.getElementById('workspaceValue');
	elements.requestedAtLabel = document.getElementById('requestedAtLabel');
	elements.requestedAtValue = document.getElementById('requestedAtValue');
	elements.toolList = document.getElementById('toolList');
	elements.repairContent = document.getElementById('repairContent');
	elements.scopeNotice = document.getElementById('scopeNotice');
}

function bindEvents() {
	elements.retestButton.addEventListener('click', () => {
		if (elements.retestButton.disabled) {
			return;
		}
		vscode.postMessage({ command: 'platformioDiagnostic:retest' });
	});

	elements.copySummaryButton.addEventListener('click', () => {
		if (elements.copySummaryButton.disabled) {
			return;
		}
		vscode.postMessage({ command: 'platformioDiagnostic:copySummary' });
	});

	elements.autoRepairButton.addEventListener('click', () => {
		if (elements.autoRepairButton.disabled) {
			return;
		}
		const flow = getPrimaryRepairFlow();
		if (!flow) {
			return;
		}
		vscode.postMessage({ command: 'platformioDiagnostic:startAutoRepair', flowId: flow.id });
	});

	elements.copyAiRepairPacketButton.addEventListener('click', () => {
		if (elements.copyAiRepairPacketButton.disabled) {
			return;
		}
		vscode.postMessage({ command: 'platformioDiagnostic:copyAiRepairPacket' });
	});

	elements.createIssueDraftButton.addEventListener('click', () => {
		if (elements.createIssueDraftButton.disabled) {
			return;
		}
		vscode.postMessage({ command: 'platformioDiagnostic:createIssueDraft' });
	});

	elements.clearRepairHistoryButton.addEventListener('click', () => {
		if (elements.clearRepairHistoryButton.disabled) {
			return;
		}
		vscode.postMessage({ command: 'platformioDiagnostic:clearRepairHistory' });
	});

	elements.repairContent.addEventListener('click', event => {
		const target = event.target.closest('[data-action]');
		if (!target) {
			return;
		}

		const flowId = target.getAttribute('data-flow-id') || getPrimaryRepairFlow()?.id;
		if (!flowId) {
			return;
		}

		if (target.dataset.action === 'confirm-repair') {
			vscode.postMessage({ command: 'platformioDiagnostic:confirmAutoRepair', flowId });
		} else if (target.dataset.action === 'cancel-repair') {
			vscode.postMessage({ command: 'platformioDiagnostic:cancelAutoRepair' });
		}
	});
}

function renderLoading() {
	applySharedLabels();
	setButtonsDisabled(true, true);
	elements.stateSurface.classList.remove('hidden');
	elements.loadingSpinner.classList.remove('hidden');
	elements.contentRoot.classList.add('hidden');
	elements.stateTitle.textContent = state.strings.loadingTitle;
	elements.stateDescription.textContent = state.strings.loadingDescription;
}

function renderError() {
	applySharedLabels();
	setButtonsDisabled(false, true);
	elements.stateSurface.classList.remove('hidden');
	elements.loadingSpinner.classList.add('hidden');
	elements.contentRoot.classList.add('hidden');
	elements.stateTitle.textContent = state.strings.errorTitle;
	elements.stateDescription.textContent = state.panelState?.topLevelError || state.strings.copyUnavailableMessage;
}

function renderReady() {
	applySharedLabels();
	const session = state.panelState?.session;
	setButtonsDisabled(false, !session);

	if (!session) {
		elements.stateSurface.classList.remove('hidden');
		elements.loadingSpinner.classList.add('hidden');
		elements.contentRoot.classList.add('hidden');
		elements.stateTitle.textContent = state.strings.noDataTitle;
		elements.stateDescription.textContent = state.strings.noDataDescription;
		return;
	}

	elements.stateSurface.classList.add('hidden');
	elements.contentRoot.classList.remove('hidden');

	const overallStatusText = state.strings.overallStatuses[session.overallStatus] || session.overallStatus;
	elements.overallStatusBadge.textContent = overallStatusText;
	elements.overallStatusBadge.className = `status-pill status-pill-${escapeClass(session.overallStatus)}`;
	elements.overallStatusValue.textContent = overallStatusText;
	elements.workspaceValue.textContent = session.workspacePath || '—';
	elements.requestedAtValue.textContent = formatTimestamp(session.requestedAt);
	elements.scopeNotice.textContent = session.scopeNotice;
	renderToolList(session.items);
	renderRepairSection(state.panelState?.repairState);
	renderExportSection(state.panelState?.repairState);
}

function renderToolList(items) {
	if (!Array.isArray(items) || items.length === 0) {
		elements.toolList.innerHTML = `<div class="empty-state">${escapeHtml(state.strings.noDataDescription)}</div>`;
		return;
	}

	elements.toolList.innerHTML = items.map(renderToolCard).join('');
}

function renderToolCard(item) {
	const toolName = state.strings.toolNames[item.id] || item.id;
	const itemStatus = state.strings.itemStatuses[item.status] || item.status;
	const sourceLabel = state.strings.sources[item.source] || item.source;
	const resolvedPath = item.resolvedPath || state.strings.unresolvedPathLabel;
	const versionText = item.versionProbe?.output || item.versionProbe?.errorMessage || '—';
	const fromDetectedPenv = item.isFromDetectedPenv === null
		? '—'
		: item.isFromDetectedPenv
			? state.strings.fromDetectedPenvYes
			: state.strings.fromDetectedPenvNo;
	const nextStepBlock = item.nextStep ? renderDetailBlock(state.strings.nextStepLabel, item.nextStep) : '';
	const reasonBlock = renderDetailBlock(state.strings.reasonLabel, item.reason);

	return `
		<article class="tool-card">
			<div class="tool-card-header">
				<div class="tool-title-group">
					<h3>${escapeHtml(toolName)}</h3>
					<span class="status-pill status-pill-${escapeClass(statusToClass(item.status))}">${escapeHtml(itemStatus)}</span>
				</div>
				<span class="source-pill">${escapeHtml(sourceLabel)}</span>
			</div>
			<dl class="detail-grid">
				<div>
					<dt>${escapeHtml(state.strings.pathLabel)}</dt>
					<dd>${escapeHtml(resolvedPath)}</dd>
				</div>
				<div>
					<dt>${escapeHtml(state.strings.sourceLabel)}</dt>
					<dd>${escapeHtml(sourceLabel)}</dd>
				</div>
				<div>
					<dt>${escapeHtml(state.strings.versionLabel)}</dt>
					<dd>${escapeHtml(versionText)}</dd>
				</div>
				<div>
					<dt>${escapeHtml(state.strings.fromDetectedPenvLabel)}</dt>
					<dd>${escapeHtml(fromDetectedPenv)}</dd>
				</div>
			</dl>
			${reasonBlock}
			${nextStepBlock}
		</article>
	`;
}

function renderDetailBlock(label, value) {
	return `
		<div class="detail-block">
			<p class="detail-label">${escapeHtml(label)}</p>
			<p class="detail-value">${escapeHtml(value)}</p>
		</div>
	`;
}

function applySharedLabels() {
	document.title = state.strings.panelTitle;
	elements.panelTitle.textContent = state.strings.panelTitle;
	elements.panelSubtitle.textContent = state.strings.panelSubtitle;
	elements.retestButton.textContent = state.strings.actions.retest;
	elements.copySummaryButton.textContent = state.strings.actions.copySummary;
	elements.autoRepairButton.textContent = state.strings.actions.startAutoRepair;
	elements.copyAiRepairPacketButton.textContent = state.strings.actions.copyAiRepairPacket;
	elements.createIssueDraftButton.textContent = state.strings.actions.createIssueDraft;
	elements.clearRepairHistoryButton.textContent = state.strings.actions.clearRepairHistory;
	elements.summaryTitle.textContent = state.strings.summaryTitle;
	elements.toolsTitle.textContent = state.strings.toolsTitle;
	elements.repairTitle.textContent = state.strings.repairTitle;
	elements.exportsTitle.textContent = state.strings.exportsTitle || 'Support exports';
	elements.exportNotice.textContent = state.strings.aiPacketRedactionNotice || state.strings.copySuccessMessage;
	elements.scopeTitle.textContent = state.strings.scopeTitle;
	elements.overallStatusLabel.textContent = state.strings.overallStatusLabel;
	elements.workspaceLabel.textContent = state.strings.workspaceLabel;
	elements.requestedAtLabel.textContent = state.strings.requestedAtLabel;
}

function setButtonsDisabled(retestDisabled, copyDisabled) {
	const repairState = state.panelState?.repairState;
	const primaryFlow = getPrimaryRepairFlow();
	const activeRun = !!repairState?.activeRun;
	elements.retestButton.disabled = !!retestDisabled;
	elements.copySummaryButton.disabled = !!copyDisabled;
	elements.autoRepairButton.disabled = !!retestDisabled || !primaryFlow || activeRun;
	elements.copyAiRepairPacketButton.disabled = !!copyDisabled;
	elements.createIssueDraftButton.disabled = !!copyDisabled;
	elements.clearRepairHistoryButton.disabled = !repairState?.historySummary?.runs?.length;
}

function renderRepairSection(repairState) {
	if (!repairState) {
		elements.repairContent.innerHTML = `<div class="empty-state">${escapeHtml(state.strings.repairNoRecommendation)}</div>`;
		return;
	}

	if (repairState.confirmation) {
		elements.repairContent.innerHTML = renderConfirmation(repairState.confirmation);
		return;
	}

	const parts = [];
	if (repairState.activeRun) {
		parts.push(renderActiveRun(repairState.activeRun));
	}

	const flows = Array.isArray(repairState.availableRepairFlows) ? repairState.availableRepairFlows : [];
	if (flows.length === 0) {
		parts.push(`<div class="empty-state">${escapeHtml(state.strings.repairNoRecommendation)}</div>`);
	} else {
		parts.push(...flows.map(renderRepairFlow));
	}

	parts.push(renderHistory(repairState.historySummary, repairState.fingerprintStatus));
	elements.repairContent.innerHTML = parts.join('');
}

function renderActiveRun(run) {
	return `
		<section class="repair-progress-card">
			<h3>${escapeHtml(state.strings.repairProgressTitle)}</h3>
			<p><strong>${escapeHtml(run.flowId)}</strong> — ${escapeHtml(run.status)}</p>
			<p class="scope-text">${escapeHtml(run.userFacingSummary || '')}</p>
		</section>
	`;
}

function renderRepairFlow(flow) {
	const notApplicable = flow.notApplicableReason
		? renderDetailBlock(state.strings.repairNotApplicableLabel, flow.notApplicableReason)
		: '';
	const manualAlternative = flow.manualAlternative
		? renderDetailBlock(state.strings.repairManualAlternativeLabel, flow.manualAlternative)
		: '';
	const manualSteps = Array.isArray(flow.stillManualSteps) && flow.stillManualSteps.length > 0
		? renderDetailBlock(state.strings.repairManualStepsLabel, flow.stillManualSteps.join('\n'))
		: '';
	const steps = Array.isArray(flow.steps) ? flow.steps : [];

	return `
		<article class="repair-flow-card">
			<div class="tool-card-header">
				<div class="tool-title-group">
					<h3>${escapeHtml(flow.title)}</h3>
					<span class="status-pill status-pill-${escapeClass(flow.riskLevel || 'low')}">${escapeHtml(flow.riskLevel || 'low')}</span>
				</div>
				<button class="primary-btn compact-btn" type="button" data-action="confirm-repair" data-flow-id="${escapeHtml(flow.id)}">${escapeHtml(state.strings.actions.confirmAutoRepair)}</button>
			</div>
			<p class="repair-summary">${escapeHtml(flow.summary)}</p>
			<div class="repair-grid">
				${renderDetailBlock(state.strings.repairPrimaryFixLabel, flow.primaryFix)}
				${renderDetailBlock(state.strings.repairFallbackFixLabel, flow.fallbackFix)}
				${renderDetailBlock(state.strings.repairVerificationLabel, flow.verification)}
				${renderDetailBlock(state.strings.repairApplicabilityLabel, flow.recommendationReason)}
			</div>
			${notApplicable}
			${manualAlternative}
			${manualSteps}
			${renderStepList(steps)}
		</article>
	`;
}

function renderConfirmation(confirmation) {
	return `
		<article class="repair-confirmation">
			<h3>${escapeHtml(state.strings.repairConfirmationTitle)}</h3>
			<p>${escapeHtml(confirmation.summary)}</p>
			<div class="repair-grid">
				${renderDetailBlock(state.strings.repairPrimaryFixLabel, confirmation.primaryFix)}
				${renderDetailBlock(state.strings.repairFallbackFixLabel, confirmation.fallbackFix)}
				${renderDetailBlock(state.strings.repairVerificationLabel, confirmation.verification)}
			</div>
			${renderStepList(confirmation.steps || [])}
			<div class="repair-confirmation-actions">
				<button class="primary-btn" type="button" data-action="confirm-repair" data-flow-id="${escapeHtml(confirmation.flowId)}">${escapeHtml(state.strings.actions.confirmAutoRepair)}</button>
				<button class="secondary-btn" type="button" data-action="cancel-repair" data-flow-id="${escapeHtml(confirmation.flowId)}">${escapeHtml(state.strings.actions.cancelAutoRepair)}</button>
			</div>
		</article>
	`;
}

function renderStepList(steps) {
	if (!Array.isArray(steps) || steps.length === 0) {
		return '';
	}

	return `
		<ol class="repair-step-list">
			${steps.map(step => `
				<li>
					<strong>${escapeHtml(step.title)}</strong>
					<p>${escapeHtml(step.description)}</p>
					${step.commandPreview ? `<code>${escapeHtml(step.commandPreview)}</code>` : ''}
				</li>
			`).join('')}
		</ol>
	`;
}

function renderHistory(historySummary, fingerprintStatus) {
	const statusText = getFingerprintText(fingerprintStatus);
	const runs = Array.isArray(historySummary?.runs) ? historySummary.runs : [];
	const runList = runs.length === 0
		? `<p class="scope-text">${escapeHtml(state.strings.noDataDescription)}</p>`
		: `<ul class="repair-history-list">${runs.slice().reverse().map(run => `<li><strong>${escapeHtml(run.flowId)}</strong> — ${escapeHtml(run.status)} <span>${escapeHtml(formatTimestamp(run.finishedAt || run.startedAt))}</span></li>`).join('')}</ul>`;

	return `
		<section class="repair-history">
			<h3>${escapeHtml(state.strings.repairHistoryTitle)}</h3>
			<p class="scope-text">${escapeHtml(statusText)}</p>
			${runList}
		</section>
	`;
}

function renderExportSection(repairState) {
	const notice = repairState?.redactionNotice || state.strings.aiPacketRedactionNotice || '';
	elements.exportNotice.textContent = notice;
}

function getFingerprintText(fingerprintStatus) {
	if (fingerprintStatus === 'current') {
		return state.strings.fingerprintCurrent;
	}
	if (fingerprintStatus === 'stale') {
		return state.strings.fingerprintStale;
	}
	return state.strings.fingerprintUnknown;
}

function getPrimaryRepairFlow() {
	const flows = state.panelState?.repairState?.availableRepairFlows;
	return Array.isArray(flows) && flows.length > 0 ? flows[0] : null;
}

function showFeedback(kind, message) {
	if (!message) {
		return;
	}

	clearTimeout(state.feedbackTimer);
	elements.feedbackBanner.textContent = message;
	elements.feedbackBanner.className = `feedback-banner ${escapeClass(kind || 'success')}`;
	state.feedbackTimer = setTimeout(() => {
		elements.feedbackBanner.className = 'feedback-banner hidden';
		elements.feedbackBanner.textContent = '';
	}, 2600);
}

function statusToClass(status) {
	if (status === 'ok') {
		return 'ok';
	}
	if (status === 'warning') {
		return 'warning';
	}
	return 'error';
}

function formatTimestamp(value) {
	if (!value) {
		return '—';
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleString();
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function escapeClass(value) {
	return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-');
}

function createFallbackStrings() {
	return {
		panelTitle: 'PlatformIO Diagnostic',
		panelSubtitle: 'Check whether the extension can resolve PlatformIO CLI, penv, and the CyberBrick helper tools.',
		loadingTitle: 'Checking PlatformIO environment...',
		loadingDescription: 'The panel will show resolved PlatformIO paths and tool details as soon as the scan completes.',
		errorTitle: 'Diagnostic error',
		summaryTitle: 'Summary',
		toolsTitle: 'Resolved tools',
		repairTitle: 'Guided repair',
		exportsTitle: 'Support exports',
		scopeTitle: 'Scope',
		workspaceLabel: 'Workspace',
		requestedAtLabel: 'Generated at',
		overallStatusLabel: 'Overall status',
		pathLabel: 'Path',
		sourceLabel: 'Source',
		reasonLabel: 'Reason',
		nextStepLabel: 'Next step',
		versionLabel: 'Version probe',
		fromDetectedPenvLabel: 'From detected penv',
		fromDetectedPenvYes: 'Yes',
		fromDetectedPenvNo: 'No',
		unresolvedPathLabel: 'Not resolved',
		noDataTitle: 'No data yet',
		noDataDescription: 'Run the diagnostic once to see resolved paths and tool details.',
		copyUnavailableMessage: 'No diagnostic summary is available yet.',
		copySuccessMessage: 'Diagnostic summary copied to the clipboard.',
		repairRecommendationTitle: 'Recommended repair flow',
		repairHistoryTitle: 'Repair history',
		repairPrimaryFixLabel: 'Primary fix',
		repairFallbackFixLabel: 'Fallback fix',
		repairVerificationLabel: 'Verification after repair',
		repairApplicabilityLabel: 'Applicability',
		repairNotApplicableLabel: 'Not applicable',
		repairManualAlternativeLabel: 'Manual alternative',
		repairManualStepsLabel: 'Manual steps still required',
		repairConfirmationTitle: 'Confirm automatic repair',
		repairProgressTitle: 'Repair progress',
		repairNoRecommendation: 'No automatic repair is recommended for the current status.',
		fingerprintCurrent: 'Environment matches stored history',
		fingerprintStale: 'Some repair history may be stale',
		fingerprintUnknown: 'Environment fingerprint unavailable',
		aiPacketRedactionNotice: 'The copied repair packet masks local paths, proxy credentials, and token-like strings.',
		aiPacketStaleHistoryNotice: 'Some included repair history may be stale because the environment changed.',
		issueDraftPrivacyNotice: 'Review the privacy checklist before posting this draft publicly.',
		issueDraftDuplicateSearchNotice: 'Search existing issues with the suggested keywords before opening a new issue.',
		issueDraftNoDraftTitle: 'No issue draft recommended',
		actions: {
			retest: 'Retest',
			copySummary: 'Copy summary',
			startAutoRepair: 'Auto repair',
			confirmAutoRepair: 'Confirm repair',
			cancelAutoRepair: 'Cancel',
			clearRepairHistory: 'Clear history',
			copyAiRepairPacket: 'Copy AI repair summary',
			createIssueDraft: 'Create issue draft',
		},
		toolNames: {
			pio: 'PlatformIO CLI (pio)',
			penvRoot: 'PlatformIO penv root',
			python: 'PlatformIO Python',
			pip: 'PlatformIO pip',
			mpremote: 'mpremote',
		},
		itemStatuses: {
			ok: 'OK',
			warning: 'Warning',
			error: 'Error',
		},
		overallStatuses: {
			operational: 'Operational',
			degraded: 'Degraded',
			unavailable: 'Unavailable',
		},
		sources: {
			'default-platformio-path': 'Default PlatformIO path',
			'path-search': 'PATH search',
			'official-platformio-custom-path': 'PlatformIO customPATH setting',
			'official-platformio-settings': 'Official PlatformIO settings',
			'common-dir': 'Common tool directory',
			'resolved-pio-sibling': 'Derived from resolved pio sibling',
			'derived-from-penv': 'Derived from detected penv',
			'repair-history': 'Repair history',
			unresolved: 'Unresolved',
		},
	};
}
