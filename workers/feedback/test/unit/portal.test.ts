import { describe, expect, it } from 'vitest';
import { portalPage } from '../../src/routes/portal';

describe('public policy portal', () => {
	for (const [path, phrase] of [
	['/privacy', 'Cloudflare D1/R2'],
	['/support', '無需 GitHub 帳號'],
		['/terms', '不保證回覆'],
		] as const) {
		it(`serves ${path} without authentication`, async () => {
			const response = portalPage(new Request(`https://blockly-support.singular-ai.org${path}?lang=zh-Hant`));
			expect(response?.status).toBe(200);
			expect(response?.headers.get('content-type')).toContain('text/html');
			expect(response?.headers.get('cache-control')).toBe('no-store');
			expect(await response?.text()).toContain(phrase);
		});
	}

	it('localizes recovery and policy pages from query or Accept-Language', async () => {
		const japanese = portalPage(new Request('https://blockly-support.singular-ai.org/recover?lang=ja'));
		const japaneseHtml = await japanese?.text();
		expect(japaneseHtml).toContain('フィードバックを読み込んでいます');
		expect(japaneseHtml).not.toContain('正在驗證備援連結');
		const german = portalPage(new Request('https://blockly-support.singular-ai.org/support', {
			headers: { 'accept-language': 'de-DE,de;q=0.9' },
		}));
		expect(await german?.text()).toContain('Du brauchst kein GitHub-Konto');
	});

	it('publishes the complete privacy lifecycle instead of only a submission summary', async () => {
		const privacy = portalPage(new Request('https://blockly-support.singular-ai.org/privacy?lang=zh-Hant'));
		const html = await privacy?.text();
		for (const required of ['256-bit', '原始 IP', '資料位置與跨境', '7 天', '90 天', '兒童與學生', '權利與聯絡方式']) {
			expect(html).toContain(required);
		}
	});

	it.each([
		['ja', '国境を越えて', '90日'], ['ko', '국경을 넘어', '90일'], ['de', 'grenzüberschreitende', '90 Tage'],
		['fr', 'transfrontalier', '90 jours'], ['es', 'transfronterizo', '90 días'], ['it', 'transfrontaliero', '90 giorni'],
		['pt-br', 'internacional', '90 dias'], ['ru', 'трансграничная', '90 дней'], ['pl', 'transgraniczne', '90 dni'],
		['cs', 'přeshraničnímu', '90 dní'], ['hu', 'határokon átnyúló', '90 napig'], ['bg', 'трансгранично', '90 дни'],
		['tr', 'sınır ötesi', '90 gün'],
	])('serves complete localized policy content for %s', async (locale, crossBorder, retention) => {
		const privacy = portalPage(new Request(`https://blockly-support.singular-ai.org/privacy?lang=${locale}`));
		const html = await privacy?.text();
		expect(html).toContain(`<article lang="${locale}">`);
		expect(html).toContain(crossBorder);
		expect(html).toContain(retention);
		expect(html).not.toContain('<article lang="en">');
	});

	it('does not claim unrelated routes', () => {
		expect(portalPage(new Request('https://blockly-support.singular-ai.org/api/v1/feedback'))).toBeUndefined();
	});

	it('persists mutation keys without storing message text and paginates the message timeline', async () => {
		const portal = portalPage(new Request('https://blockly-support.singular-ai.org/r?lang=en'));
		const html = await portal?.text();
		expect(html).toContain("sessionStorage.setItem(mutationStorageKey(operation, digest), JSON.stringify(value))");
		expect(html).toContain("const slot = operation + ':' + digest");
			expect(html).toContain("'/messages?cursor=' + encodeURIComponent(pending.cursor)");
		expect(html).toContain('messageLoadMore.hidden = !messageCursor');
		for (const field of ['detailSteps', 'detailExpected', 'detailDiagnostics', 'detailAttachmentStatus']) {
			expect(html).toContain(`id="${field}"`);
			expect(html).toContain(`getElementById('${field}').textContent`);
		}
			expect(html).not.toContain("sessionStorage.setItem(mutationStorageKey(operation, digest), fingerprint)");
			expect(html).toContain("await clearMutationKey('message', fingerprint)");
			expect(html).toContain('if (listRequest) return');
		expect(html).toContain('detailRequestId !== id');
		expect(html).toContain('if (detailRequestId === id)');
		expect(html).toContain('detailRequestId = null');
		expect(html).not.toContain("showDetail(item.id).catch(() => { status.textContent = strings.error; })");
		expect(html).toContain('selectedId = null');
		expect(html).toContain('detail.hidden = true');
		expect(html).toContain('deleteOneButton.disabled = true');
		expect(html).toContain('messageRequest !== pending');
		expect(html).toContain('if (!selectedId || messageMutation) return');
		expect(html).toContain('addMessageButton.disabled = true');
		expect(html).toContain('const messageDrafts = new Map()');
		expect(html).toContain("const body = prompt(strings.messageLabel, messageDrafts.get(selectedId) || '')?.trim()");
		expect(html).toContain('messageDrafts.set(pending.feedbackId, pending.body)');
		expect(html).toContain('messageDrafts.delete(pending.feedbackId)');
		expect(html).toContain('containsSensitiveFeedbackText(pending.body)');
		const guardDefinition = html?.indexOf('const sensitiveFeedbackDirectPatterns') ?? -1;
		expect(guardDefinition).toBeGreaterThanOrEqual(0);
		expect(guardDefinition).toBeLessThan(html?.indexOf('containsSensitiveFeedbackText(pending.body)') ?? -1);
		expect(html?.indexOf('containsSensitiveFeedbackText(pending.body)')).toBeLessThan(
			html?.indexOf("request('/api/v1/feedback/' + pending.feedbackId + '/messages'") ?? -1
		);
		expect(html).toContain("value.author === 'reporter' && value.body === pending.body");
		expect(html).toContain("try { value = await response.json(); } catch { status.textContent = strings.error; return; }");
		expect(html).toContain('let deleteOneMutation = null');
		expect(html).toContain('const pending = { feedbackId: selectedId, fingerprint: selectedId }');
		expect(html).toContain('if (selectedId === pending.feedbackId)');
		expect(html).toContain('catch { status.textContent = strings.error; }');
		expect(html).toContain('if (!selectedId || deleteOneMutation || deleteAllMutation) return');
			const deletionNotice = 'Primary content is removed immediately';
		expect(html?.match(new RegExp(`<p>${deletionNotice}[^<]*</p>`, 'g'))).toHaveLength(2);
		expect(html?.lastIndexOf(`<p>${deletionNotice}`)).toBeLessThan(html?.indexOf('<button id="deleteAll"') ?? -1);
	});
});
