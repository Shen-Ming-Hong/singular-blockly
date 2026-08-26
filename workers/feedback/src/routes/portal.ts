import { feedbackContentSafetyBrowserSource } from '../../../../src/services/feedbackContentSafety';
import { withSecurityHeaders } from '../domain/http';
import { detailedPolicy, type PolicyKind } from '../policyContent';
import { PORTAL_LOCALES } from '../portalLocales';

type PortalLocale = keyof typeof PORTAL_LOCALES;
type PortalStrings = (typeof PORTAL_LOCALES)[PortalLocale];

const SUPPORTED = new Set<PortalLocale>(Object.keys(PORTAL_LOCALES) as PortalLocale[]);

function normalizeLocale(value: string | null): PortalLocale | undefined {
	if (!value) {return undefined;}
	const normalized = value.trim().toLowerCase().replace(/_/g, '-');
	if (SUPPORTED.has(normalized as PortalLocale)) {return normalized as PortalLocale;}
	if (normalized === 'zh' || normalized.startsWith('zh-')) {return 'zh-hant';}
	if (normalized === 'pt' || normalized.startsWith('pt-')) {return 'pt-br';}
	const primary = normalized.split('-', 1)[0] as PortalLocale;
	return SUPPORTED.has(primary) ? primary : undefined;
}

function requestLocale(request: Request): PortalLocale {
	const explicit = normalizeLocale(new URL(request.url).searchParams.get('lang'));
	if (explicit) {return explicit;}
	for (const entry of (request.headers.get('accept-language') ?? '').split(',')) {
		const locale = normalizeLocale(entry.split(';', 1)[0]);
		if (locale) {return locale;}
	}
	return 'en';
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, character => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
	}[character] ?? character));
}

function scriptLiteral(value: unknown): string {
	return JSON.stringify(value).replace(/[<>&]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function navigation(locale: PortalLocale, strings: PortalStrings): string {
	const query = `?lang=${encodeURIComponent(locale)}`;
	return `<nav aria-label="${escapeHtml(strings.navigation)}"><a href="/privacy${query}">${escapeHtml(strings.privacy)}</a> · <a href="/support${query}">${escapeHtml(strings.support)}</a> · <a href="/terms${query}">${escapeHtml(strings.terms)}</a></nav>`;
}

function documentResponse(locale: PortalLocale, title: string, body: string): Response {
	const strings = PORTAL_LOCALES[locale];
	const headers = withSecurityHeaders({ 'Content-Type': 'text/html; charset=utf-8' });
	return new Response(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head><body><main>${navigation(locale, strings)}<h1>${escapeHtml(title)}</h1>${body}</main></body></html>`, {
		status: 200,
		headers,
	});
}

function renderPolicyDocument(locale: PortalLocale, kind: PolicyKind): string {
	const { language, document } = detailedPolicy(locale, kind);
	const sections = document.sections.map(section => `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs
		.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}</section>`).join('');
	return `<article lang="${language}"><p><small>${escapeHtml(document.updated)}</small></p><p>${escapeHtml(document.intro)}</p>${sections}</article>`;
}

function localizedPolicySummary(strings: PortalStrings, kind: PolicyKind): string {
	const paragraphs = kind === 'privacy'
		? [strings.serviceDisclosure, strings.diagnosticsHelp, strings.deletionNotice, strings.personalWarning]
		: kind === 'support'
			? [strings.intro, strings.recoveryCopied, strings.personalWarning]
			: [strings.termsBody];
	return `<section>${paragraphs.map(value => `<p>${escapeHtml(value)}</p>`).join('')}</section>`;
}

function policyPage(pathname: string, locale: PortalLocale): Response | undefined {
	const strings = PORTAL_LOCALES[locale];
	if (pathname === '/privacy') {
		return documentResponse(locale, `Singular Blockly — ${strings.privacy}`, localizedPolicySummary(strings, 'privacy') + renderPolicyDocument(locale, 'privacy'));
	}
	if (pathname === '/support') {
		return documentResponse(locale, `Singular Blockly — ${strings.support}`, localizedPolicySummary(strings, 'support') + renderPolicyDocument(locale, 'support'));
	}
	if (pathname === '/terms') {
		return documentResponse(locale, `Singular Blockly — ${strings.terms}`, localizedPolicySummary(strings, 'terms') + renderPolicyDocument(locale, 'terms'));
	}
	return undefined;
}

export function portalPage(request: Request): Response | undefined {
	const pathname = new URL(request.url).pathname;
	const locale = requestLocale(request);
	if (pathname === '/recover') {return recoveryPage(locale);}
	if (pathname === '/r') {return reporterPortalPage(locale);}
	return policyPage(pathname, locale);
}

function scriptPage(locale: PortalLocale, title: string, body: string, script: string): Response {
	const strings = PORTAL_LOCALES[locale];
	const nonceBytes = crypto.getRandomValues(new Uint8Array(18));
	let binary = '';
	for (const byte of nonceBytes) {binary += String.fromCharCode(byte);}
	const nonce = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
	const headers = withSecurityHeaders({ 'Content-Type': 'text/html; charset=utf-8' });
	headers.set('Content-Security-Policy', `default-src 'none'; connect-src 'self'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`);
	return new Response(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head><body><main>${navigation(locale, strings)}${body}</main><script nonce="${nonce}">${script}</script></body></html>`, {
		status: 200,
		headers,
	});
}

function recoveryPage(locale: PortalLocale): Response {
	const strings = PORTAL_LOCALES[locale];
	return scriptPage(locale, strings.copyRecovery, `
		<h1>${escapeHtml(strings.copyRecovery)}</h1>
		<p id="status" role="status">${escapeHtml(strings.loading)}</p>
	`, `(() => {
		'use strict';
		${feedbackContentSafetyBrowserSource()}
		const strings = ${scriptLiteral(strings)};
		const locale = ${scriptLiteral(locale)};
		const status = document.getElementById('status');
		const secret = new URLSearchParams(location.hash.slice(1)).get('secret');
		history.replaceState(null, '', '/recover?lang=' + encodeURIComponent(locale));
		if (!secret || !/^[A-Za-z0-9_-]{43}$/.test(secret)) {
			status.textContent = strings.invalidRecovery;
			return;
		}
		fetch('/api/v1/session/exchange', {
			method: 'POST', credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret }),
		}).then(response => {
			if (!response.ok) throw new Error('exchange-failed');
			const csrf = response.headers.get('x-csrf-token');
			if (csrf) sessionStorage.setItem('sb_feedback_csrf', csrf);
			location.replace('/r?lang=' + encodeURIComponent(locale));
		}).catch(() => { status.textContent = strings.failedRecovery; });
	})();`);
}

function reporterPortalPage(locale: PortalLocale): Response {
	const strings = PORTAL_LOCALES[locale];
	return scriptPage(locale, strings.myFeedbackTitle, `
		<h1>${escapeHtml(strings.myFeedbackTitle)}</h1>
		<p>${escapeHtml(strings.myFeedbackHelp)}</p>
		<p id="status" role="status">${escapeHtml(strings.loading)}</p>
		<ul id="items"></ul>
		<button id="loadMore" type="button" hidden>${escapeHtml(strings.loadMore)}</button>
		<section id="detail" hidden><h2 id="detailTitle"></h2>
			<h3>${escapeHtml(strings.detailDescriptionLabel)}</h3><p id="detailBody"></p>
			<section id="detailStepsSection" hidden><h3>${escapeHtml(strings.detailStepsLabel)}</h3><p id="detailSteps"></p></section>
			<section id="detailExpectedSection" hidden><h3>${escapeHtml(strings.detailExpectedLabel)}</h3><p id="detailExpected"></p></section>
			<h3>${escapeHtml(strings.detailDiagnosticsLabel)}</h3><pre id="detailDiagnostics"></pre>
			<p id="detailAttachmentStatus"></p><ol id="messages"></ol>
			<button id="messageLoadMore" type="button" hidden>${escapeHtml(strings.loadMore)}</button>
			<button id="addMessage" type="button">${escapeHtml(strings.addMessage)}</button>
			<p>${escapeHtml(strings.deletionNotice)}</p>
			<button id="deleteOne" type="button">${escapeHtml(strings.deleteOne)}</button>
		</section>
		<p>${escapeHtml(strings.deletionNotice)}</p>
		<button id="deleteAll" type="button">${escapeHtml(strings.deleteAll)}</button>
		`, `(() => {
			'use strict';
			${feedbackContentSafetyBrowserSource()}
			const strings = ${scriptLiteral(strings)};
			const textLength = value => Array.from(value).length;
		const status = document.getElementById('status');
		const items = document.getElementById('items');
		const detail = document.getElementById('detail');
		const loadMore = document.getElementById('loadMore');
		const messageLoadMore = document.getElementById('messageLoadMore');
			let selectedId = null;
			let nextCursor = null;
			let messageCursor = null;
				let listRequest = null;
				let messageRequest = null;
				let detailRequestId = null;
				let messageMutation = null;
				let deleteOneMutation = null;
				let deleteAllMutation = null;
				const messageDrafts = new Map();
				const addMessageButton = document.getElementById('addMessage');
				const deleteOneButton = document.getElementById('deleteOne');
				const deleteAllButton = document.getElementById('deleteAll');
		const headers = () => {
			const csrf = sessionStorage.getItem('sb_feedback_csrf');
			return csrf ? { 'X-CSRF-Token': csrf } : {};
		};
		const request = (path, options = {}) => fetch(path, { credentials: 'same-origin', ...options });
		const mutationKeys = new Map();
		const mutationStorageKey = (operation, digest) => 'sb_feedback_mutation_' + operation + '_' + digest;
		const fingerprintDigest = async fingerprint => {
			const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
			return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
		};
		const storedMutation = (operation, digest) => {
			try {
				const value = JSON.parse(sessionStorage.getItem(mutationStorageKey(operation, digest)) || 'null');
				return value && value.digest === digest
					&& /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.key)
					? value : null;
			} catch { return null; }
		};
		const mutationKey = async (operation, fingerprint) => {
			const digest = await fingerprintDigest(fingerprint);
			const slot = operation + ':' + digest;
			const pending = mutationKeys.get(slot);
			if (pending?.digest === digest) return pending.key;
			const stored = storedMutation(operation, digest);
			if (stored?.digest === digest) {
				mutationKeys.set(slot, stored);
				return stored.key;
			}
			const key = crypto.randomUUID();
			const value = { digest, key };
			mutationKeys.set(slot, value);
			try { sessionStorage.setItem(mutationStorageKey(operation, digest), JSON.stringify(value)); } catch { /* in-memory retry remains */ }
			return key;
		};
		const clearMutationKey = async (operation, fingerprint) => {
			const digest = await fingerprintDigest(fingerprint);
			mutationKeys.delete(operation + ':' + digest);
			try { sessionStorage.removeItem(mutationStorageKey(operation, digest)); } catch { /* no persisted state was available */ }
		};
		const statusLabel = value => ({
			received: strings.statusReceived, triaging: strings.statusTriaging, 'needs-info': strings.statusNeedsInfo,
			planned: strings.statusPlanned, 'in-progress': strings.statusInProgress,
			resolved: strings.statusResolved, closed: strings.statusClosed,
		}[value] || value);
		const messageNodes = values => values.map(message => {
			const li = document.createElement('li');
			li.textContent = (message.author === 'reporter' ? strings.authorReporter : strings.authorMaintainer) + ': ' + message.body;
			return li;
		});
		async function showDetail(id) {
			selectedId = null;
			messageCursor = null;
			messageRequest = null;
			detail.hidden = true;
			addMessageButton.disabled = true;
				deleteOneButton.disabled = true;
			messageLoadMore.disabled = true;
			detailRequestId = id;
			try {
				const response = await request('/api/v1/feedback/' + encodeURIComponent(id));
				if (!response.ok) throw new Error('detail-failed');
				const value = await response.json();
				if (detailRequestId !== id) return;
				selectedId = value.id;
				addMessageButton.disabled = false;
				deleteOneButton.disabled = deleteOneMutation !== null || deleteAllMutation !== null;
				messageLoadMore.disabled = false;
				document.getElementById('detailTitle').textContent = value.reference + ' — ' + value.title + ' (' + statusLabel(value.status) + ')';
				document.getElementById('detailBody').textContent = value.description;
				const detailStepsSection = document.getElementById('detailStepsSection');
				document.getElementById('detailSteps').textContent = value.steps || '';
				detailStepsSection.hidden = !value.steps;
				const detailExpectedSection = document.getElementById('detailExpectedSection');
				document.getElementById('detailExpected').textContent = value.expected || '';
				detailExpectedSection.hidden = !value.expected;
				document.getElementById('detailDiagnostics').textContent = JSON.stringify(value.diagnostics || {}, null, 2);
				document.getElementById('detailAttachmentStatus').textContent = value.hasAttachment
					? strings.detailAttachmentIncluded : strings.detailAttachmentNotIncluded;
				const messages = document.getElementById('messages');
				messages.replaceChildren(...messageNodes(value.messages));
				messageCursor = value.nextMessageCursor;
				messageLoadMore.hidden = !messageCursor;
				detail.hidden = false;
			} catch {
				if (detailRequestId === id) {
					detailRequestId = null;
					status.textContent = strings.error;
				}
			}
		}
			async function loadMessages() {
				if (!selectedId || !messageCursor || messageRequest) return;
				const pending = { feedbackId: selectedId, cursor: messageCursor };
				messageRequest = pending;
				messageLoadMore.disabled = true;
				try {
					const response = await request('/api/v1/feedback/' + encodeURIComponent(pending.feedbackId) + '/messages?cursor=' + encodeURIComponent(pending.cursor));
					if (!response.ok) throw new Error('messages-failed');
					const value = await response.json();
					if (messageRequest !== pending || selectedId !== pending.feedbackId) return;
					document.getElementById('messages').append(...messageNodes(value.items));
					messageCursor = value.nextCursor;
					messageLoadMore.hidden = !messageCursor;
				} catch {
					status.textContent = strings.error;
				} finally {
					if (messageRequest === pending) {
						messageRequest = null;
						messageLoadMore.disabled = false;
					}
				}
			}
			async function load(append = false) {
				if (listRequest) return;
				const pending = { cursor: append ? nextCursor : null };
				if (append && !pending.cursor) return;
				listRequest = pending;
				loadMore.disabled = true;
				try {
					const path = '/api/v1/feedback' + (pending.cursor ? '?cursor=' + encodeURIComponent(pending.cursor) : '');
					const response = await request(path);
					if (!response.ok) {status.textContent = strings.expiredSession; return;}
					const value = await response.json();
					if (listRequest !== pending) return;
					const nodes = value.items.map(item => {
						const li = document.createElement('li');
						const button = document.createElement('button');
						button.type = 'button';
						button.textContent = item.reference + ' — ' + item.title + ' (' + statusLabel(item.status) + ')';
						button.addEventListener('click', () => { void showDetail(item.id); });
						li.append(button);
						return li;
					});
					if (pending.cursor) items.append(...nodes); else items.replaceChildren(...nodes);
					nextCursor = value.nextCursor;
					loadMore.hidden = !nextCursor;
					status.textContent = items.children.length ? strings.operationSuccess : strings.empty;
				} finally {
					if (listRequest === pending) {
						listRequest = null;
						loadMore.disabled = false;
					}
				}
			}
		loadMore.addEventListener('click', () => load(true).catch(() => { status.textContent = strings.error; }));
		messageLoadMore.addEventListener('click', () => loadMessages().catch(() => { status.textContent = strings.error; }));
		addMessageButton.addEventListener('click', async () => {
			if (!selectedId || messageMutation) return;
			const body = prompt(strings.messageLabel, messageDrafts.get(selectedId) || '')?.trim();
			if (!body) return;
			const pending = { feedbackId: selectedId, body };
			messageDrafts.set(pending.feedbackId, pending.body);
			if (textLength(pending.body) > 4000) { status.textContent = strings.error; return; }
			if (containsSensitiveFeedbackText(pending.body)) { status.textContent = strings.personalWarning; return; }
			messageMutation = pending;
			addMessageButton.disabled = true;
			try {
				const fingerprint = pending.feedbackId + ':' + pending.body;
				const response = await request('/api/v1/feedback/' + pending.feedbackId + '/messages', {
					method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json', 'Idempotency-Key': await mutationKey('message', fingerprint) }, body: JSON.stringify({ body: pending.body }),
				});
				if (!response.ok) {status.textContent = strings.error; return;}
				let value;
				try { value = await response.json(); } catch { status.textContent = strings.error; return; }
				const valid = value && typeof value === 'object'
					&& /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.id)
					&& value.author === 'reporter' && value.body === pending.body
					&& typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt));
				if (!valid) {status.textContent = strings.error; return;}
				await clearMutationKey('message', fingerprint);
				if (messageDrafts.get(pending.feedbackId) === pending.body) messageDrafts.delete(pending.feedbackId);
				if (selectedId === pending.feedbackId) await showDetail(pending.feedbackId);
			} catch {
				status.textContent = strings.error;
			} finally {
				if (messageMutation === pending) {
					messageMutation = null;
					addMessageButton.disabled = false;
				}
			}
		});
		deleteOneButton.addEventListener('click', async () => {
			if (!selectedId || deleteOneMutation || deleteAllMutation) return;
			if (prompt(strings.deleteOneHelp) !== 'DELETE') return;
			const pending = { feedbackId: selectedId, fingerprint: selectedId };
			deleteOneMutation = pending;
			deleteOneButton.disabled = true;
			try {
				const response = await request('/api/v1/feedback/' + encodeURIComponent(pending.feedbackId), {
					method: 'DELETE', headers: { ...headers(), 'Idempotency-Key': await mutationKey('deleteOne', pending.fingerprint) },
				});
				if (!response.ok) {status.textContent = strings.error; return;}
				await clearMutationKey('deleteOne', pending.fingerprint);
				messageDrafts.delete(pending.feedbackId);
				status.textContent = strings.operationSuccess;
				nextCursor = null;
				if (selectedId === pending.feedbackId) {
					detail.hidden = true; selectedId = null; messageCursor = null;
					detailRequestId = null; messageRequest = null;
				}
				if (!listRequest) await load();
			} catch { status.textContent = strings.error; }
			finally {
				if (deleteOneMutation === pending) {
					deleteOneMutation = null;
					deleteOneButton.disabled = selectedId === null || deleteAllMutation !== null;
				}
			}
		});
		deleteAllButton.addEventListener('click', async () => {
			if (deleteAllMutation || deleteOneMutation) return;
			if (prompt(strings.deleteAllHelp) !== 'DELETE ALL') return;
			const pending = { fingerprint: 'all' };
			deleteAllMutation = pending;
			deleteAllButton.disabled = true;
			deleteOneButton.disabled = true;
			try {
				const response = await request('/api/v1/reporter', {
					method: 'DELETE', headers: { ...headers(), 'Idempotency-Key': await mutationKey('deleteAll', pending.fingerprint) },
				});
				if (!response.ok) {status.textContent = strings.error; return;}
				await clearMutationKey('deleteAll', pending.fingerprint);
				messageDrafts.clear();
				sessionStorage.removeItem('sb_feedback_csrf'); items.replaceChildren(); detail.hidden = true;
				detailRequestId = null; messageRequest = null; listRequest = null; selectedId = null;
				status.textContent = strings.deleteAll + ' — ' + strings.operationSuccess;
			} catch { status.textContent = strings.error; }
			finally {
				if (deleteAllMutation === pending) {
					deleteAllMutation = null;
					deleteAllButton.disabled = false;
					deleteOneButton.disabled = selectedId === null;
				}
			}
		});
		load().catch(() => { status.textContent = strings.error; });
	})();`);
}
