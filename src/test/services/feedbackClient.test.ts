/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { FeedbackClient, FeedbackClientError } from '../../services/feedbackClient';
import type { CreateFeedbackInput } from '../../types/feedback';

const input: CreateFeedbackInput = {
	schemaVersion: 1,
	kind: 'bug',
	title: 'Upload fails after build',
	description: 'The upload stops after compilation completes.',
	diagnostics: { extensionVersion: '0.87.5' },
};

const detail = {
	id: '11111111-1111-4111-8111-111111111111',
	reference: 'SB-ABCDEFGH',
	kind: 'bug',
	title: input.title,
	status: 'received',
	decision: 'unreviewed',
	createdAt: '2026-08-20T01:00:00.000Z',
	updatedAt: '2026-08-20T01:00:00.000Z',
	description: input.description,
	diagnostics: input.diagnostics,
	hasAttachment: false,
	messages: [],
	nextMessageCursor: null,
};

suite('FeedbackClient Tests', () => {
	test('submits multipart data to the fixed endpoint without exposing the reporter secret in the URL', async () => {
		const fetchStub = sinon.stub().resolves(new Response(JSON.stringify(detail), {
			status: 201,
			headers: { 'content-type': 'application/json' },
		}));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test');

		const result = await client.createFeedback('reporter-secret', input, undefined, 'idem-1');

		assert.strictEqual(result.reference, detail.reference);
		assert.strictEqual(fetchStub.callCount, 1);
		const [url, options] = fetchStub.firstCall.args;
		assert.strictEqual(url, 'https://support.example.test/api/v1/feedback');
		assert.strictEqual(options.method, 'POST');
		assert.strictEqual((options.headers as Record<string, string>).Authorization, 'Bearer reporter-secret');
		assert.strictEqual((options.headers as Record<string, string>)['Idempotency-Key'], 'idem-1');
		assert.ok(options.body instanceof FormData);
		assert.ok(!String(url).includes('reporter-secret'));
	});

	test('maps server errors to stable client errors without echoing response details', async () => {
		const fetchStub = sinon.stub().resolves(new Response(JSON.stringify({
			error: { code: 'rate_limited', message: 'private server detail' },
		}), { status: 429 }));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test');

		await assert.rejects(
			() => client.createFeedback('reporter-secret', input, undefined, 'idem-2'),
			(error: unknown) => error instanceof FeedbackClientError
				&& error.code === 'rate_limited'
				&& error.status === 429
				&& error.retryable
				&& !error.message.includes('private server detail')
		);
	});

	test('rejects an untrusted response shape', async () => {
		const fetchStub = sinon.stub().resolves(new Response(JSON.stringify({ token: 'unexpected' }), { status: 201 }));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test');

		await assert.rejects(
			() => client.createFeedback('reporter-secret', input, undefined, 'idem-3'),
			(error: unknown) => error instanceof FeedbackClientError
				&& error.code === 'invalid_response'
				&& error.retryable
		);
	});

	test('keeps a successful create idempotency key retryable when the response JSON is truncated', async () => {
		const fetchStub = sinon.stub().resolves(new Response('{"id":', { status: 201 }));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test', 1000, 0);

		await assert.rejects(
			() => client.createFeedback('reporter-secret', input, undefined, 'idem-truncated-success'),
			(error: unknown) => error instanceof FeedbackClientError
				&& error.code === 'invalid_response'
				&& error.status === 201
				&& error.retryable,
		);
		assert.strictEqual(fetchStub.callCount, 2);
		assert.strictEqual(fetchStub.firstCall.args[1].headers['Idempotency-Key'], 'idem-truncated-success');
		assert.strictEqual(fetchStub.secondCall.args[1].headers['Idempotency-Key'], 'idem-truncated-success');
	});

	test('rejects malformed messages in an otherwise valid detail response', async () => {
		const malformed = { ...detail, messages: [{ author: 'maintainer', body: null }] };
		const fetchStub = sinon.stub().resolves(new Response(JSON.stringify(malformed), { status: 201 }));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test');

		await assert.rejects(
			() => client.createFeedback('reporter-secret', input, undefined, 'idem-malformed-message'),
			(error: unknown) => error instanceof FeedbackClientError && error.code === 'invalid_response'
		);
	});

	test('rejects unexpected response fields instead of forwarding them to the webview', async () => {
		const fetchStub = sinon.stub().resolves(new Response(JSON.stringify({ ...detail, internalNote: 'private' }), { status: 201 }));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test');

		await assert.rejects(
			() => client.createFeedback('reporter-secret', input, undefined, 'idem-extra-field'),
			(error: unknown) => error instanceof FeedbackClientError && error.code === 'invalid_response'
		);
	});

	test('stops reading oversized streamed responses at the client boundary', async () => {
		const chunk = new Uint8Array(600 * 1024);
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(chunk);
				controller.enqueue(chunk);
				controller.close();
			},
		});
		const fetchStub = sinon.stub().resolves(new Response(body, { status: 201 }));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test');

		await assert.rejects(
			() => client.createFeedback('reporter-secret', input, undefined, 'idem-large-response'),
			(error: unknown) => error instanceof FeedbackClientError && error.code === 'invalid_response'
		);
	});

	test('accepts a legal feedback list larger than the former 64 KiB boundary', async () => {
		const summary = {
			id: detail.id,
			reference: detail.reference,
			kind: detail.kind,
			title: detail.title,
			status: detail.status,
			decision: 'not-actionable',
			resolution: 'duplicate',
			publicReason: '說'.repeat(2000),
			createdAt: detail.createdAt,
			updatedAt: detail.updatedAt,
		};
		const response = JSON.stringify({ items: Array.from({ length: 20 }, (_, index) => ({
			...summary,
			id: `${String(index).padStart(8, '0')}-1111-4111-8111-111111111111`,
		})), nextCursor: null });
		assert.ok(Buffer.byteLength(response) > 64 * 1024);
		const client = new FeedbackClient(
			sinon.stub().resolves(new Response(response)) as typeof fetch,
			'https://support.example.test',
		);

		assert.strictEqual((await client.listFeedback('reporter-secret')).items.length, 20);
	});

	test('retries one transient failure with the same idempotency key', async () => {
		const fetchStub = sinon.stub();
		fetchStub.onFirstCall().rejects(new Error('temporary network failure'));
		fetchStub.onSecondCall().resolves(new Response(JSON.stringify(detail), { status: 201 }));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test', 1000, 0);

		await client.createFeedback('reporter-secret', input, undefined, 'stable-idempotency-key');

		assert.strictEqual(fetchStub.callCount, 2);
		assert.strictEqual(fetchStub.firstCall.args[1].headers['Idempotency-Key'], 'stable-idempotency-key');
		assert.strictEqual(fetchStub.secondCall.args[1].headers['Idempotency-Key'], 'stable-idempotency-key');
	});

	test('times out bounded attempts without exposing transport errors', async () => {
		const fetchStub = sinon.stub().callsFake((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
			options.signal?.addEventListener('abort', () => reject(new DOMException('private transport detail', 'AbortError')));
		}));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test', 5, 0);

		await assert.rejects(
			() => client.createFeedback('reporter-secret', input, undefined, 'timeout-key'),
			(error: unknown) => error instanceof FeedbackClientError
				&& error.code === 'timeout'
				&& !error.message.includes('private transport detail')
		);
		assert.strictEqual(fetchStub.callCount, 2);
	});

	test('keeps the timeout active while reading response content', async () => {
		const fetchStub = sinon.stub().callsFake(() => Promise.resolve(new Response(new ReadableStream<Uint8Array>({
			start() { /* headers arrive, but the body never produces data */ },
		}))));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test', 5, 0);

		await assert.rejects(
			() => client.createFeedback('reporter-secret', input, undefined, 'body-timeout-key'),
			(error: unknown) => error instanceof FeedbackClientError && error.code === 'timeout' && error.retryable,
		);
		assert.strictEqual(fetchStub.callCount, 2);
	});

	test('rejects non-HTTPS service origins', () => {
		assert.throws(
			() => new FeedbackClient(fetch, 'http://support.example.test'),
			/HTTPS/
		);
	});

	test('lists, reads, paginates, and adds messages without putting the secret in a URL', async () => {
		const summary = {
			id: detail.id,
			reference: detail.reference,
			kind: detail.kind,
			title: detail.title,
			status: detail.status,
			decision: detail.decision,
			createdAt: detail.createdAt,
			updatedAt: detail.updatedAt,
		};
		const message = {
			id: '22222222-2222-4222-8222-222222222222',
			author: 'reporter',
			body: 'Additional information',
			createdAt: detail.createdAt,
		};
		const fetchStub = sinon.stub();
		fetchStub.onCall(0).resolves(new Response(JSON.stringify({ items: [summary], nextCursor: null })));
		fetchStub.onCall(1).resolves(new Response(JSON.stringify(detail)));
		fetchStub.onCall(2).resolves(new Response(JSON.stringify({ items: [message], nextCursor: null })));
		fetchStub.onCall(3).resolves(new Response(JSON.stringify(message), { status: 201 }));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test');

		assert.strictEqual((await client.listFeedback('private-reporter-secret')).items[0].id, detail.id);
		assert.strictEqual((await client.getFeedback('private-reporter-secret', detail.id)).id, detail.id);
		assert.strictEqual((await client.listFeedbackMessages('private-reporter-secret', detail.id, 'signed-cursor')).items[0].body, message.body);
		assert.strictEqual((await client.addMessage('private-reporter-secret', detail.id, message.body, 'message-key')).body, message.body);

		for (const call of fetchStub.getCalls()) {
			assert.ok(!String(call.args[0]).includes('private-reporter-secret'));
			assert.strictEqual(new Headers(call.args[1].headers).get('authorization'), 'Bearer private-reporter-secret');
		}
		assert.strictEqual(fetchStub.thirdCall.args[0], `https://support.example.test/api/v1/feedback/${detail.id}/messages?cursor=signed-cursor`);
		assert.strictEqual(new Headers(fetchStub.getCall(3).args[1].headers).get('idempotency-key'), 'message-key');
	});

	test('keeps an add-message key retryable when a successful response is truncated', async () => {
		const fetchStub = sinon.stub().resolves(new Response('{"id":', { status: 201 }));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test', 1000, 0);
		const key = '88888888-8888-4888-8888-888888888888';

		await assert.rejects(
			() => client.addMessage('private-reporter-secret', detail.id, 'Additional information', key),
			(error: unknown) => error instanceof FeedbackClientError
				&& error.code === 'invalid_response'
				&& error.status === 201
				&& error.retryable,
		);
		assert.strictEqual(fetchStub.callCount, 2);
		for (const call of fetchStub.getCalls()) {
			assert.strictEqual(new Headers(call.args[1].headers).get('idempotency-key'), key);
		}
	});

	test('keeps an add-message key retryable when a 5xx response is not JSON', async () => {
		const fetchStub = sinon.stub().callsFake(() => Promise.resolve(
			new Response('upstream response was truncated', { status: 502 }),
		));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test', 1000, 0);
		const key = '99999999-9999-4999-8999-999999999999';

		await assert.rejects(
			() => client.addMessage('private-reporter-secret', detail.id, 'Additional information', key),
			(error: unknown) => error instanceof FeedbackClientError
				&& error.code === 'invalid_response'
				&& error.status === 502
				&& error.retryable,
		);
		assert.strictEqual(fetchStub.callCount, 2);
		for (const call of fetchStub.getCalls()) {
			assert.strictEqual(new Headers(call.args[1].headers).get('idempotency-key'), key);
		}
	});

	test('deletes one or all feedback with stable idempotency keys', async () => {
		const fetchStub = sinon.stub().resolves(new Response(null, { status: 204 }));
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test');

		await client.deleteFeedback('reporter-secret', detail.id, 'delete-one-key');
		await client.deleteAllFeedback('reporter-secret', 'delete-all-key');

		assert.strictEqual(fetchStub.firstCall.args[0], `https://support.example.test/api/v1/feedback/${detail.id}`);
		assert.strictEqual(fetchStub.secondCall.args[0], 'https://support.example.test/api/v1/reporter');
		assert.strictEqual(new Headers(fetchStub.firstCall.args[1].headers).get('idempotency-key'), 'delete-one-key');
		assert.strictEqual(new Headers(fetchStub.secondCall.args[1].headers).get('idempotency-key'), 'delete-all-key');
	});

	test('rejects malformed IDs before making a request', async () => {
		const fetchStub = sinon.stub();
		const client = new FeedbackClient(fetchStub as typeof fetch, 'https://support.example.test');
		await assert.rejects(
			() => client.getFeedback('reporter-secret', '../foreign'),
			(error: unknown) => error instanceof FeedbackClientError && error.code === 'invalid_feedback_id'
		);
		assert.strictEqual(fetchStub.callCount, 0);
	});
});
