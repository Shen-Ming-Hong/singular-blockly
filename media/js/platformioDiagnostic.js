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
	elements.feedbackBanner = document.getElementById('feedbackBanner');
	elements.stateSurface = document.getElementById('stateSurface');
	elements.loadingSpinner = document.getElementById('loadingSpinner');
	elements.stateTitle = document.getElementById('stateTitle');
	elements.stateDescription = document.getElementById('stateDescription');
	elements.contentRoot = document.getElementById('contentRoot');
	elements.summaryTitle = document.getElementById('summaryTitle');
	elements.toolsTitle = document.getElementById('toolsTitle');
	elements.scopeTitle = document.getElementById('scopeTitle');
	elements.overallStatusBadge = document.getElementById('overallStatusBadge');
	elements.overallStatusLabel = document.getElementById('overallStatusLabel');
	elements.overallStatusValue = document.getElementById('overallStatusValue');
	elements.workspaceLabel = document.getElementById('workspaceLabel');
	elements.workspaceValue = document.getElementById('workspaceValue');
	elements.requestedAtLabel = document.getElementById('requestedAtLabel');
	elements.requestedAtValue = document.getElementById('requestedAtValue');
	elements.toolList = document.getElementById('toolList');
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
	elements.summaryTitle.textContent = state.strings.summaryTitle;
	elements.toolsTitle.textContent = state.strings.toolsTitle;
	elements.scopeTitle.textContent = state.strings.scopeTitle;
	elements.overallStatusLabel.textContent = state.strings.overallStatusLabel;
	elements.workspaceLabel.textContent = state.strings.workspaceLabel;
	elements.requestedAtLabel.textContent = state.strings.requestedAtLabel;
}

function setButtonsDisabled(retestDisabled, copyDisabled) {
	elements.retestButton.disabled = !!retestDisabled;
	elements.copySummaryButton.disabled = !!copyDisabled;
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
		actions: {
			retest: 'Retest',
			copySummary: 'Copy summary',
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
			'resolved-pio-sibling': 'Derived from resolved pio sibling',
			'derived-from-penv': 'Derived from detected penv',
			unresolved: 'Unresolved',
		},
	};
}
