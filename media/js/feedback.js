/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

(() => {
    'use strict';

    const vscode = acquireVsCodeApi();
	const textLength = value => Array.from(value).length;
	const limits = {
		titleMin: 5, titleMax: 120, descriptionMin: 10, descriptionMax: 8000,
		stepsMax: 4000, expectedMax: 2000, messageMax: 4000,
	};
    const elements = Object.fromEntries([
        'formStep', 'reviewStep', 'resultStep', 'feedbackForm', 'kind', 'feedbackTitle', 'description', 'steps',
        'expected', 'includeDiagnostics', 'includeRecentEvents', 'payloadPreview', 'backButton', 'confirmButton',
		'formError', 'submitError', 'referenceValue', 'resultStatusValue', 'copyRecoveryButton', 'recoveryStatus', 'screenshotFile',
        'screenshotPreview', 'screenshotImage', 'removeScreenshotButton', 'screenshotError', 'reviewScreenshot',
        'reviewScreenshotImage', 'provideFeedbackTab', 'myFeedbackTab', 'myFeedbackStep', 'myFeedbackTitle',
		'myFeedbackStatus', 'feedbackList', 'loadMoreButton', 'feedbackDetail', 'detailTitle', 'detailMetadata',
		'detailDescription', 'detailStepsSection', 'detailSteps', 'detailExpectedSection', 'detailExpected',
		'detailDiagnostics', 'detailAttachmentStatus', 'messageTimeline', 'messageLoadMoreButton', 'additionalMessage', 'addMessageButton', 'deleteOneConfirmation',
		'deleteOneButton', 'deleteAllZone', 'deleteAllConfirmation', 'deleteAllButton',
		'modeNavigation', 'diagnosticsOffWarning',
    ].map(id => [id, document.getElementById(id)]));
    let confirmationId = null;
    let reviewedDraft = null;
    let selectedScreenshot = null;
    let reviewedScreenshot = null;
    let screenshotObjectUrl = null;
		let listCursor = null;
		let messageCursor = null;
		let selectedFeedbackId = null;
		let listRequest = null;
		let messageRequest = null;
		let latestDetailRequestId = null;
		let screenshotGeneration = 0;
		const mutationKeys = new Map();
		const messageDrafts = new Map();
		const deletedFeedbackIds = new Set();
		let listRefreshPending = false;
    let strings = {
        sending: 'Sending feedback…',
        recoveryCopied: 'Backup access link copied. Keep it private.',
        error: 'Feedback could not be sent. Review the form and try again.',
    };

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element && typeof value === 'string') element.textContent = value;
    }

    function showStep(step) {
		elements.myFeedbackStep.classList.add('hidden');
        elements.formStep.classList.toggle('hidden', step !== 'form');
        elements.reviewStep.classList.toggle('hidden', step !== 'review');
        elements.resultStep.classList.toggle('hidden', step !== 'result');
        const heading = step === 'form' ? document.getElementById('panelTitle')
            : step === 'review' ? document.getElementById('reviewTitle') : document.getElementById('successTitle');
        heading?.focus();
    }

	function showMode(mode) {
		const listMode = mode === 'list';
		elements.provideFeedbackTab.setAttribute('aria-pressed', String(!listMode));
		elements.myFeedbackTab.setAttribute('aria-pressed', String(listMode));
		if (listMode) {
			listCursor = null;
			elements.formStep.classList.add('hidden');
			elements.reviewStep.classList.add('hidden');
			elements.resultStep.classList.add('hidden');
			elements.myFeedbackStep.classList.remove('hidden');
			elements.myFeedbackTitle.focus();
				requestFeedbackList();
		} else {
			showStep('form');
		}
	}

    function draft() {
        return {
            kind: elements.kind.value,
            title: elements.feedbackTitle.value,
            description: elements.description.value,
            ...(elements.steps.value.trim() ? { steps: elements.steps.value } : {}),
            ...(elements.expected.value.trim() ? { expected: elements.expected.value } : {}),
        };
    }

	function validateDraftLengths() {
		const fields = [
			[elements.feedbackTitle, limits.titleMin, limits.titleMax],
			[elements.description, limits.descriptionMin, limits.descriptionMax],
			[elements.steps, 0, limits.stepsMax],
			[elements.expected, 0, limits.expectedMax],
		];
		for (const [element, minimum, maximum] of fields) {
			const length = textLength(element.value.trim());
			element.setCustomValidity(length >= minimum && length <= maximum
				? '' : (strings.errorValidation || strings.error));
		}
	}

    function applyStrings(strings) {
        const text = {
            panelTitle: strings.title, intro: strings.intro, personalDataWarning: strings.personalDataWarning, kindLabel: strings.kind,
            feedbackTitleLabel: strings.feedbackTitle, descriptionLabel: strings.description,
            stepsLabel: strings.steps, expectedLabel: strings.expected,
			basicDiagnosticsLabel: strings.basicDiagnostics, basicDiagnosticsHelp: strings.basicDiagnosticsHelp,
			diagnosticsOffWarning: strings.diagnosticsOffWarning,
            recentEventsLabel: strings.recentEvents, recentEventsHelp: strings.recentEventsHelp,
            dataLegend: strings.dataLegend,
            reviewButton: strings.review, reviewTitle: strings.reviewTitle, reviewHelp: strings.reviewHelp,
			serviceDisclosure: strings.serviceDisclosure,
            backButton: strings.back, confirmButton: strings.confirm, successTitle: strings.success,
			referenceLabel: strings.reference, resultStatusLabel: strings.statusLabel, copyRecoveryButton: strings.copyRecovery,
            screenshotLegend: strings.screenshot, screenshotLabel: strings.screenshotChoose,
            screenshotHelp: strings.screenshotHelp, screenshotPrivacyWarning: strings.screenshotPrivacy,
            removeScreenshotButton: strings.screenshotRemove,
			provideFeedbackTab: strings.provideFeedback, myFeedbackTab: strings.myFeedback,
			myFeedbackTitle: strings.myFeedbackTitle, myFeedbackHelp: strings.myFeedbackHelp,
			detailDescriptionLabel: strings.detailDescriptionLabel, detailStepsLabel: strings.detailStepsLabel,
			detailExpectedLabel: strings.detailExpectedLabel, detailDiagnosticsLabel: strings.detailDiagnosticsLabel,
			loadMoreButton: strings.loadMore, messageLoadMoreButton: strings.loadMore, messageLabel: strings.messageLabel,
			addMessageButton: strings.addMessage, deleteOneLabel: strings.deleteOne,
			deleteOneButton: strings.deleteOne, deleteOneHelp: strings.deleteOneHelp,
			deleteAllLabel: strings.deleteAll, deleteAllButton: strings.deleteAll,
			deleteAllHelp: strings.deleteAllHelp, deleteOneBackup: strings.deletionBackup,
			deleteAllBackup: strings.deletionBackup,
			privacyButton: strings.privacy, supportButton: strings.support, termsButton: strings.terms,
        };
        Object.entries(text).forEach(([id, value]) => setText(id, value));
        const options = elements.kind.options;
        if (options.length === 4) {
            options[0].textContent = strings.bug;
            options[1].textContent = strings.feature;
            options[2].textContent = strings.question;
            options[3].textContent = strings.other;
        }
        elements.screenshotImage.alt = strings.screenshotPreviewAlt;
        elements.reviewScreenshotImage.alt = strings.reviewScreenshotAlt;
		elements.modeNavigation.setAttribute('aria-label', strings.navigation);
	}

	function errorMessage(code) {
		if (code === 'timeout' || code === 'network_error') return strings.errorTimeout || strings.error;
		if (code === 'rate_limited') return strings.errorRateLimited || strings.error;
		if (code === 'sensitive_content') return strings.errorSensitiveContent || strings.errorValidation || strings.error;
		if (code === 'service_unavailable' || code === 'feedback_unavailable' || code === 'feedback_delete_pending'
			|| code === 'request_failed' || code === 'internal_error' || code === 'recovery_unavailable') {
			return strings.errorServiceUnavailable || strings.error;
		}
		if (typeof code === 'string' && code.includes('attachment')) return strings.errorAttachment || strings.error;
		if ((typeof code === 'string' && code.startsWith('invalid_')) || code === 'feedback_not_found'
			|| code === 'idempotency_conflict' || code === 'csrf_denied' || code === 'preview_changed'
			|| code === 'confirmation_required' || code === 'request_too_large') {
			return strings.errorValidation || strings.error;
		}
		return strings.error;
	}

	function statusLabel(status) {
		const keys = {
			received: 'statusReceived', triaging: 'statusTriaging', 'needs-info': 'statusNeedsInfo',
			planned: 'statusPlanned', 'in-progress': 'statusInProgress', resolved: 'statusResolved', closed: 'statusClosed',
		};
		return strings[keys[status]] || status;
	}

    function canvasBlob(canvas, type, quality) {
        return new Promise(resolve => canvas.toBlob(resolve, type, quality));
    }

	const SCREENSHOT_SOURCE_BYTES_MAX = 16 * 1024 * 1024;
	const SCREENSHOT_HEADER_BYTES_MAX = 512 * 1024;
	const SCREENSHOT_SOURCE_DIMENSION_MAX = 16384;
	const SCREENSHOT_SOURCE_PIXELS_MAX = 40 * 1024 * 1024;
	const JPEG_START_OF_FRAME = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

	function validateSourceDimensions(width, height) {
		if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1
			|| width > SCREENSHOT_SOURCE_DIMENSION_MAX || height > SCREENSHOT_SOURCE_DIMENSION_MAX
			|| width * height > SCREENSHOT_SOURCE_PIXELS_MAX) {
			throw new Error('source-dimensions-too-large');
		}
		return { width, height };
	}

	async function sourceImageDimensions(file) {
		if (!Number.isInteger(file.size) || file.size < 1 || file.size > SCREENSHOT_SOURCE_BYTES_MAX) {
			throw new Error('source-file-too-large');
		}
		const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, SCREENSHOT_HEADER_BYTES_MAX)).arrayBuffer());
		if (file.type === 'image/png') {
			const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
			if (bytes.length < 24 || !signature.every((value, index) => bytes[index] === value)) {
				throw new Error('invalid-png-header');
			}
			const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			return validateSourceDimensions(view.getUint32(16), view.getUint32(20));
		}
		if (file.type !== 'image/jpeg' || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
			throw new Error('invalid-jpeg-header');
		}
		let offset = 2;
		while (offset + 1 < bytes.length) {
			if (bytes[offset] !== 0xff) {offset += 1; continue;}
			while (offset < bytes.length && bytes[offset] === 0xff) {offset += 1;}
			if (offset >= bytes.length) {break;}
			const marker = bytes[offset++];
			if (marker === 0xd9 || marker === 0xda) {break;}
			if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {continue;}
			if (offset + 2 > bytes.length) {break;}
			const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
			if (segmentLength < 2 || offset + segmentLength > bytes.length) {break;}
			if (JPEG_START_OF_FRAME.has(marker)) {
				if (segmentLength < 7) {throw new Error('invalid-jpeg-frame');}
				return validateSourceDimensions(
					(bytes[offset + 5] << 8) | bytes[offset + 6],
					(bytes[offset + 3] << 8) | bytes[offset + 4],
				);
			}
			offset += segmentLength;
		}
		throw new Error('jpeg-dimensions-unavailable');
	}

    function bytesToBase64(bytes) {
        let binary = '';
        const chunkSize = 0x8000;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
        }
        return btoa(binary);
    }

    async function sanitizeScreenshot(file) {
        if (!file || !['image/png', 'image/jpeg'].includes(file.type)) throw new Error('invalid-type');
		await sourceImageDimensions(file);
        const bitmap = await createImageBitmap(file);
        try {
			validateSourceDimensions(bitmap.width, bitmap.height);
            const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
            const width = Math.max(1, Math.round(bitmap.width * scale));
            const height = Math.max(1, Math.round(bitmap.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d', { alpha: false });
            if (!context) throw new Error('canvas-unavailable');
            context.drawImage(bitmap, 0, 0, width, height);

            let blob = await canvasBlob(canvas, 'image/png');
            if (!blob || blob.size > 3 * 1024 * 1024) {
                for (const quality of [0.9, 0.8, 0.7]) {
                    blob = await canvasBlob(canvas, 'image/jpeg', quality);
                    if (blob && blob.size <= 3 * 1024 * 1024) break;
                }
            }
            if (!blob || blob.size > 3 * 1024 * 1024 || !['image/png', 'image/jpeg'].includes(blob.type)) {
                throw new Error('too-large');
            }
            const bytes = new Uint8Array(await blob.arrayBuffer());
            return {
                screenshot: { mediaType: blob.type, bytesBase64: bytesToBase64(bytes), width, height },
                blob,
            };
        } finally {
            bitmap.close();
        }
    }

    function clearScreenshotState(clearFile = true) {
        if (screenshotObjectUrl) URL.revokeObjectURL(screenshotObjectUrl);
        screenshotObjectUrl = null;
        selectedScreenshot = null;
		if (clearFile) elements.screenshotFile.value = '';
        elements.screenshotImage.removeAttribute('src');
        elements.screenshotPreview.classList.add('hidden');
        elements.screenshotError.classList.add('hidden');
    }

	function removeScreenshot() {
		screenshotGeneration += 1;
		clearScreenshotState();
	}

	function clearSubmittedDraft() {
		elements.feedbackForm.reset();
		removeScreenshot();
		confirmationId = null;
		reviewedDraft = null;
		reviewedScreenshot = null;
		elements.payloadPreview.textContent = '';
		elements.reviewScreenshotImage.removeAttribute('src');
		elements.reviewScreenshot.classList.add('hidden');
		elements.formError.classList.add('hidden');
		elements.submitError.classList.add('hidden');
		elements.diagnosticsOffWarning.classList.toggle('hidden', elements.includeDiagnostics.checked);
	}

    function applyPrefill(prefill) {
        if (!prefill || typeof prefill !== 'object') return;
        if (['bug', 'feature', 'question', 'other'].includes(prefill.kind)) elements.kind.value = prefill.kind;
        for (const key of ['title', 'description', 'steps', 'expected']) {
            if (typeof prefill[key] === 'string') elements[key === 'title' ? 'feedbackTitle' : key].value = prefill[key];
        }
    }

    elements.feedbackForm.addEventListener('submit', event => {
        event.preventDefault();
		validateDraftLengths();
        if (!elements.feedbackForm.reportValidity()) return;
        elements.formError.classList.add('hidden');
        vscode.postMessage({
            command: 'feedback:preview',
            draft: draft(),
            includeDiagnostics: elements.includeDiagnostics.checked,
            includeRecentEvents: elements.includeRecentEvents.checked,
            ...(selectedScreenshot ? { screenshot: selectedScreenshot } : {}),
        });
    });

    elements.backButton.addEventListener('click', () => {
        confirmationId = null;
        reviewedDraft = null;
        reviewedScreenshot = null;
        showStep('form');
    });

    elements.confirmButton.addEventListener('click', () => {
        if (!confirmationId || !reviewedDraft) return;
        elements.confirmButton.disabled = true;
		elements.submitError.classList.add('hidden');
        setText('confirmButton', strings.sending);
        vscode.postMessage({
            command: 'feedback:submit',
            confirmationId,
            draft: reviewedDraft,
            includeDiagnostics: elements.includeDiagnostics.checked,
            includeRecentEvents: elements.includeRecentEvents.checked,
            ...(reviewedScreenshot ? { screenshot: reviewedScreenshot } : {}),
        });
    });

    elements.screenshotFile.addEventListener('change', async () => {
		const generation = ++screenshotGeneration;
        const file = elements.screenshotFile.files?.[0];
		if (!file) {clearScreenshotState(); return;}
		clearScreenshotState(false);
        elements.screenshotError.classList.add('hidden');
        try {
            const result = await sanitizeScreenshot(file);
			if (generation !== screenshotGeneration) return;
            selectedScreenshot = result.screenshot;
            screenshotObjectUrl = URL.createObjectURL(result.blob);
            elements.screenshotImage.src = screenshotObjectUrl;
            elements.screenshotPreview.classList.remove('hidden');
        } catch {
			if (generation !== screenshotGeneration) return;
			clearScreenshotState();
            elements.screenshotError.textContent = strings.screenshotError || strings.error;
            elements.screenshotError.classList.remove('hidden');
        }
    });

	elements.removeScreenshotButton.addEventListener('click', removeScreenshot);
	elements.includeDiagnostics.addEventListener('change', () => {
		elements.diagnosticsOffWarning.classList.toggle('hidden', elements.includeDiagnostics.checked);
	});

    elements.copyRecoveryButton.addEventListener('click', () => {
		elements.recoveryStatus.textContent = '';
		elements.recoveryStatus.classList.remove('error');
		vscode.postMessage({ command: 'feedback:copyRecovery' });
	});
	elements.provideFeedbackTab.addEventListener('click', () => showMode('form'));
	elements.myFeedbackTab.addEventListener('click', () => showMode('list'));
	function requestFeedbackList(cursor) {
		if (listRequest) return;
		const requestCursor = typeof cursor === 'string' ? cursor : null;
		listRequest = { cursor: requestCursor };
		elements.loadMoreButton.disabled = requestCursor !== null;
		vscode.postMessage({ command: 'feedback:list', ...(requestCursor ? { cursor: requestCursor } : {}) });
	}
	function requestFeedbackMessages() {
		if (!selectedFeedbackId || !messageCursor || messageRequest) return;
		messageRequest = { feedbackId: selectedFeedbackId, cursor: messageCursor };
		elements.messageLoadMoreButton.disabled = true;
		vscode.postMessage({ command: 'feedback:messages', feedbackId: selectedFeedbackId, cursor: messageCursor });
	}
	function persistCurrentMessageDraft() {
		if (!selectedFeedbackId) return;
		if (elements.additionalMessage.value) {
			messageDrafts.set(selectedFeedbackId, elements.additionalMessage.value);
		} else {
			messageDrafts.delete(selectedFeedbackId);
		}
	}
	function requestFeedbackDetail(feedbackId) {
		persistCurrentMessageDraft();
		selectedFeedbackId = null;
		messageCursor = null;
		messageRequest = null;
		elements.feedbackDetail.classList.add('hidden');
		elements.addMessageButton.disabled = true;
		elements.deleteOneButton.disabled = true;
		elements.messageLoadMoreButton.disabled = true;
		latestDetailRequestId = feedbackId;
		vscode.postMessage({ command: 'feedback:detail', feedbackId });
	}
	elements.loadMoreButton.addEventListener('click', () => {
		if (listCursor) requestFeedbackList(listCursor);
	});
	elements.messageLoadMoreButton.addEventListener('click', requestFeedbackMessages);
	elements.additionalMessage.addEventListener('input', persistCurrentMessageDraft);
	function mutationSlot(operation, fingerprint) {
		return `${operation}:${fingerprint}`;
	}
	function mutationKey(operation, fingerprint) {
		const slot = mutationSlot(operation, fingerprint);
		const pending = mutationKeys.get(slot);
		if (pending) return pending.key;
		const key = crypto.randomUUID();
		mutationKeys.set(slot, { operation, fingerprint, key });
		return key;
	}
	function mutationByKey(operation, key) {
		for (const [slot, pending] of mutationKeys) {
			if (pending.operation === operation && pending.key === key) return { slot, ...pending };
		}
		return null;
	}
	function clearMutationOperation(operation) {
		for (const [slot, pending] of mutationKeys) {
			if (pending.operation === operation) mutationKeys.delete(slot);
		}
	}
	function mutationButton(operation) {
		return operation === 'addMessage' ? elements.addMessageButton
			: operation === 'deleteOne' ? elements.deleteOneButton
				: operation === 'deleteAll' ? elements.deleteAllButton : null;
	}
	elements.addMessageButton.addEventListener('click', () => {
		const body = elements.additionalMessage.value.trim();
		if (!selectedFeedbackId || !body) return;
		if (textLength(body) > limits.messageMax) {
			elements.myFeedbackStatus.textContent = strings.errorValidation || strings.error;
			return;
		}
		messageDrafts.set(selectedFeedbackId, elements.additionalMessage.value);
		elements.addMessageButton.disabled = true;
		vscode.postMessage({
			command: 'feedback:addMessage', feedbackId: selectedFeedbackId, body,
			idempotencyKey: mutationKey('addMessage', `${selectedFeedbackId}:${body}`),
		});
	});
	elements.deleteOneButton.addEventListener('click', () => {
		if (!selectedFeedbackId) return;
		elements.deleteOneButton.disabled = true;
		const confirmationText = elements.deleteOneConfirmation.value;
		vscode.postMessage({
			command: 'feedback:deleteOne', feedbackId: selectedFeedbackId,
			confirmationText,
			idempotencyKey: mutationKey('deleteOne', `${selectedFeedbackId}:${confirmationText}`),
		});
	});
	elements.deleteAllButton.addEventListener('click', () => {
		elements.deleteAllButton.disabled = true;
		const confirmationText = elements.deleteAllConfirmation.value;
		vscode.postMessage({
			command: 'feedback:deleteAll', confirmationText,
			idempotencyKey: mutationKey('deleteAll', confirmationText),
		});
	});
	for (const [id, policy] of [['privacyButton', 'privacy'], ['supportButton', 'support'], ['termsButton', 'terms']]) {
		document.getElementById(id).addEventListener('click', () => vscode.postMessage({ command: 'feedback:openPolicy', policy }));
	}

	function renderList(message, append) {
		elements.deleteAllZone.classList.toggle('hidden', message.hasCredential !== true);
		if (message.hasCredential !== true) elements.deleteAllConfirmation.value = '';
		const nodes = message.items.filter(item => !deletedFeedbackIds.has(item.id)).map(item => {
			const li = document.createElement('li');
			li.dataset.feedbackId = item.id;
			const button = document.createElement('button');
			button.type = 'button';
			button.textContent = `${item.reference} — ${item.title} (${statusLabel(item.status)})`;
			button.addEventListener('click', () => requestFeedbackDetail(item.id));
			li.append(button);
			return li;
		});
		if (append) elements.feedbackList.append(...nodes); else elements.feedbackList.replaceChildren(...nodes);
		listCursor = message.nextCursor;
		elements.loadMoreButton.classList.toggle('hidden', !listCursor);
		elements.myFeedbackStatus.textContent = elements.feedbackList.children.length ? '' : strings.emptyFeedback;
	}

	function removeFeedbackListItem(feedbackId) {
		for (const item of Array.from(elements.feedbackList.children)) {
			if (item.dataset.feedbackId === feedbackId) item.remove();
		}
	}

	function appendDefinition(list, term, value) {
		const dt = document.createElement('dt');
		dt.textContent = term;
		const dd = document.createElement('dd');
		dd.textContent = value;
		list.append(dt, dd);
	}

	function messageNodes(messages) {
		return messages.map(message => {
			const item = document.createElement('li');
			const author = message.author === 'reporter' ? strings.authorReporter : strings.authorMaintainer;
			item.textContent = `${author}: ${message.body}`;
			return item;
		});
	}

	function renderDetail(feedback) {
		const existingMessageDraft = messageDrafts.get(feedback.id) || '';
		selectedFeedbackId = feedback.id;
		messageCursor = feedback.nextMessageCursor;
		elements.addMessageButton.disabled = false;
		elements.deleteOneButton.disabled = false;
		elements.messageLoadMoreButton.disabled = false;
		elements.detailTitle.textContent = `${feedback.reference} — ${feedback.title}`;
		elements.detailMetadata.replaceChildren();
		appendDefinition(elements.detailMetadata, strings.statusLabel, statusLabel(feedback.status));
		appendDefinition(elements.detailMetadata, strings.createdLabel, new Date(feedback.createdAt).toLocaleString());
		elements.detailDescription.textContent = feedback.description;
		elements.detailSteps.textContent = feedback.steps || '';
		elements.detailStepsSection.classList.toggle('hidden', !feedback.steps);
		elements.detailExpected.textContent = feedback.expected || '';
		elements.detailExpectedSection.classList.toggle('hidden', !feedback.expected);
		elements.detailDiagnostics.textContent = JSON.stringify(feedback.diagnostics || {}, null, 2);
		elements.detailAttachmentStatus.textContent = feedback.hasAttachment
			? strings.detailAttachmentIncluded : strings.detailAttachmentNotIncluded;
		elements.messageTimeline.replaceChildren(...messageNodes(feedback.messages));
		elements.messageLoadMoreButton.classList.toggle('hidden', !messageCursor);
		elements.additionalMessage.value = existingMessageDraft;
		elements.deleteOneConfirmation.value = '';
		elements.feedbackDetail.classList.remove('hidden');
		elements.detailTitle.focus();
	}

    window.addEventListener('message', event => {
        const message = event.data;
        if (!message || typeof message !== 'object' || typeof message.command !== 'string') return;
        if (message.command === 'feedback:initialState') {
            if (message.strings && typeof message.strings === 'object') {
                strings = { ...strings, ...message.strings };
                applyStrings(strings);
            }
            applyPrefill(message.prefill);
			showMode(message.mode === 'list' ? 'list' : 'form');
            return;
        }
		if (message.command === 'feedback:listResult' && Array.isArray(message.items)) {
			const responseCursor = typeof message.cursor === 'string' ? message.cursor : null;
			if (!listRequest || listRequest.cursor !== responseCursor) return;
			listRequest = null;
			elements.loadMoreButton.disabled = false;
			renderList(message, responseCursor !== null);
			if (listRefreshPending) {
				listRefreshPending = false;
				requestFeedbackList();
			}
			return;
		}
		if (message.command === 'feedback:detailResult' && message.feedback) {
			if (message.feedback.id !== latestDetailRequestId) return;
			renderDetail(message.feedback);
			return;
		}
		if (message.command === 'feedback:messagesResult' && messageRequest
			&& message.feedbackId === messageRequest.feedbackId
			&& message.cursor === messageRequest.cursor
			&& message.feedbackId === selectedFeedbackId && Array.isArray(message.items)) {
			messageRequest = null;
			elements.messageLoadMoreButton.disabled = false;
			elements.messageTimeline.append(...messageNodes(message.items));
			messageCursor = message.nextCursor;
			elements.messageLoadMoreButton.classList.toggle('hidden', !messageCursor);
			return;
		}
		if (message.command === 'feedback:mutationResult') {
			let addMessageMutation = null;
			let deleteOneMutation = null;
			if (message.operation === 'addMessage') {
				addMessageMutation = mutationByKey('addMessage', message.idempotencyKey);
				if (!addMessageMutation) return;
				if (message.success) {
					mutationKeys.delete(addMessageMutation.slot);
					const prefix = `${message.feedbackId}:`;
					const submittedBody = addMessageMutation.fingerprint.startsWith(prefix)
						? addMessageMutation.fingerprint.slice(prefix.length) : null;
					if (submittedBody !== null && messageDrafts.get(message.feedbackId)?.trim() === submittedBody) {
						messageDrafts.delete(message.feedbackId);
					}
				}
				if (message.feedbackId !== selectedFeedbackId) return;
			}
			if (message.operation === 'deleteOne') {
				deleteOneMutation = mutationByKey('deleteOne', message.idempotencyKey);
				if (!deleteOneMutation) return;
				if (message.success && deleteOneMutation) {
					mutationKeys.delete(deleteOneMutation.slot);
					messageDrafts.delete(message.feedbackId);
					deletedFeedbackIds.add(message.feedbackId);
					removeFeedbackListItem(message.feedbackId);
					listCursor = null;
					if (listRequest) {
						listRefreshPending = true;
					} else {
						requestFeedbackList();
					}
					elements.myFeedbackStatus.textContent = strings.operationSuccess;
					if (message.feedbackId === selectedFeedbackId) {
						elements.feedbackDetail.classList.add('hidden');
						selectedFeedbackId = null;
						messageCursor = null;
						messageRequest = null;
						latestDetailRequestId = null;
					}
					return;
				}
				if (message.feedbackId !== selectedFeedbackId) return;
			}
			const button = mutationButton(message.operation);
			if (button) button.disabled = false;
			if (!message.success && message.operation === 'detail') {
				if (message.feedbackId !== latestDetailRequestId) return;
				latestDetailRequestId = null;
			}
			if (!message.success && message.operation === 'list') {
				const responseCursor = typeof message.cursor === 'string' ? message.cursor : null;
				if (!listRequest || listRequest.cursor !== responseCursor) return;
				listRequest = null;
				elements.loadMoreButton.disabled = false;
				if (listRefreshPending) {
					listRefreshPending = false;
					requestFeedbackList();
				}
			}
			if (!message.success && message.operation === 'messages') {
				if (!messageRequest
					|| message.feedbackId !== messageRequest.feedbackId
					|| message.cursor !== messageRequest.cursor
					|| message.feedbackId !== selectedFeedbackId) return;
				messageRequest = null;
				elements.messageLoadMoreButton.disabled = false;
			}
			if (message.success && message.operation !== 'addMessage' && message.operation !== 'deleteOne') {
				clearMutationOperation(message.operation);
			}
			elements.myFeedbackStatus.textContent = message.success ? strings.operationSuccess : errorMessage(message.code);
			if (message.success && addMessageMutation
				&& addMessageMutation.fingerprint === `${selectedFeedbackId}:${elements.additionalMessage.value.trim()}`) {
				elements.additionalMessage.value = '';
			}
			if (message.success && message.operation === 'deleteAll') {
				messageDrafts.clear();
				deletedFeedbackIds.clear();
				listRefreshPending = false;
				listCursor = null;
				listRequest = { cursor: null };
				elements.feedbackList.replaceChildren();
				elements.loadMoreButton.disabled = true;
				messageRequest = null;
				latestDetailRequestId = null;
				elements.feedbackDetail.classList.add('hidden');
				selectedFeedbackId = null;
				messageCursor = null;
				elements.deleteAllConfirmation.value = '';
			}
			return;
		}
        if (message.command === 'feedback:previewReady' && message.preview && typeof message.preview.confirmationId === 'string') {
            confirmationId = message.preview.confirmationId;
            reviewedDraft = draft();
            reviewedScreenshot = selectedScreenshot;
            const summary = {
                ...message.preview.input,
                ...(reviewedScreenshot ? { screenshot: {
                    mediaType: reviewedScreenshot.mediaType,
                    width: reviewedScreenshot.width,
                    height: reviewedScreenshot.height,
                    sizeBytes: Math.floor(reviewedScreenshot.bytesBase64.length * 3 / 4),
                } } : {}),
            };
            elements.payloadPreview.textContent = JSON.stringify(summary, null, 2);
			elements.submitError.classList.add('hidden');
			elements.confirmButton.disabled = false;
			setText('confirmButton', strings.confirm);
            if (screenshotObjectUrl && reviewedScreenshot) {
                elements.reviewScreenshotImage.src = screenshotObjectUrl;
                elements.reviewScreenshot.classList.remove('hidden');
            } else {
                elements.reviewScreenshot.classList.add('hidden');
            }
            showStep('review');
            return;
        }
		if (message.command === 'feedback:submitted' && message.confirmationId === confirmationId
			&& message.feedback && typeof message.feedback.reference === 'string') {
            elements.referenceValue.textContent = message.feedback.reference;
			elements.resultStatusValue.textContent = statusLabel(message.feedback.status);
            elements.confirmButton.disabled = false;
			setText('confirmButton', strings.confirm);
			clearSubmittedDraft();
            showStep('result');
            return;
        }
        if (message.command === 'feedback:recoveryCopied') {
			elements.recoveryStatus.classList.remove('error');
            setText('recoveryStatus', strings.recoveryCopied);
            return;
        }
		if (message.command === 'feedback:error') {
			if (typeof message.confirmationId === 'string' && message.confirmationId !== confirmationId) return;
            elements.confirmButton.disabled = false;
			setText('confirmButton', strings.confirm);
			if (!elements.resultStep.classList.contains('hidden')) {
				elements.recoveryStatus.textContent = errorMessage(message.code);
				elements.recoveryStatus.classList.add('error');
				return;
			}
            const target = elements.reviewStep.classList.contains('hidden') ? elements.formError : elements.submitError;
			target.textContent = errorMessage(message.code);
            target.classList.remove('hidden');
        }
    });

    vscode.postMessage({ command: 'feedback:ready' });
})();
