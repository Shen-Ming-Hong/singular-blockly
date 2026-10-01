import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { WebViewMessageHandler } from '../../webview/messageHandler';

suite('MessageHandler AI lifecycle', () => {
	let sandbox: sinon.SinonSandbox;
	let configListener: (event: { affectsConfiguration: (section: string) => boolean }) => void;
	let configDispose: sinon.SinonStub;

	setup(() => {
		sandbox = sinon.createSandbox();
		configDispose = sandbox.stub();
		sandbox.stub(vscode.workspace, 'onDidChangeConfiguration').callsFake((listener: any) => {
			configListener = listener;
			return { dispose: configDispose };
		});
	});
	teardown(() => sandbox.restore());

	function harness() {
		const handler = Object.create(WebViewMessageHandler.prototype) as WebViewMessageHandler;
		const postMessage = sandbox.stub().resolves();
		Object.assign(handler, {
			context: { extensionPath: '/mock/extension', subscriptions: [] },
			panel: { webview: { postMessage } },
			aiDisposables: [],
			_shadowRequestSeq: 0,
		});
		let ready = false;
		let enabled = true;
		let readyListener!: () => void;
		const tierDispose = sandbox.stub();
		const readyDispose = sandbox.stub();
		const manager = {
			isReady: () => ready,
			getEffectiveConfig: () => ({ enabled }),
			getTier: () => 'pro',
			onTierChanged: sandbox.stub().returns({ dispose: tierDispose }),
			onDidChangeReadiness: sandbox.stub().callsFake(listener => {
				readyListener = listener;
				return { dispose: readyDispose };
			}),
		};
		const status = { showLoading: sandbox.stub(), hideLoading: sandbox.stub() };
		handler.initAIServices(manager as any, status as any);
		return { handler, postMessage, manager, status, tierDispose, readyDispose,
			setReady: (value: boolean) => { ready = value; readyListener(); },
			setEnabled: (value: boolean) => { enabled = value; configListener({ affectsConfiguration: () => true }); },
		};
	}

	test('publishes disabled config until ready and owns listeners without duplicate initialization', () => {
		const h = harness();
		assert.strictEqual(h.postMessage.lastCall.args[0].config.enabled, false);
		h.handler.initAIServices(h.manager as any, h.status as any);
		assert.strictEqual(h.manager.onTierChanged.callCount, 1);
		assert.strictEqual(h.manager.onDidChangeReadiness.callCount, 1);
		h.setReady(true);
		assert.strictEqual(h.postMessage.lastCall.args[0].config.enabled, true);
		h.handler.disposeAIServices();
		assert.strictEqual(h.tierDispose.callCount, 1);
		assert.strictEqual(h.readyDispose.callCount, 1);
		assert.strictEqual(configDispose.callCount, 1);
		h.handler.disposeAIServices();
		assert.strictEqual(configDispose.callCount, 1);
	});

	test('ignores unready requests and disabling discards a late result', async () => {
		const h = harness();
		const service = (h.handler as any).shadowSuggestionService;
		let resolveResult!: (result: unknown) => void;
		const request = sandbox.stub(service, 'requestSuggestion').returns(new Promise(resolve => { resolveResult = resolve; }));
		const cancel = sandbox.spy(service, 'cancelCurrentRequest');
		await h.handler.handleMessage({ command: 'requestShadowSuggestion', context: { board: 'uno', depth: 'minimal' } });
		assert.strictEqual(request.called, false);
		h.setReady(true);
		const pending = h.handler.handleMessage({ command: 'requestShadowSuggestion', context: { board: 'uno', depth: 'minimal' } });
		assert.strictEqual(request.callCount, 1);
		h.setEnabled(false);
		assert.strictEqual(cancel.called, true);
		resolveResult({ suggestions: [{ blockType: 'math_number' }], modelUsed: 'pro' });
		await pending;
		assert.strictEqual(h.postMessage.args.some(args => args[0].command === 'showShadowSuggestion'), false);
		assert.strictEqual(h.postMessage.lastCall.args[0].config.enabled, false);
		h.handler.disposeAIServices();
	});

	test('panel cleanup cancels and rejects a late result', async () => {
		const h = harness();
		h.setReady(true);
		const service = (h.handler as any).shadowSuggestionService;
		let resolveResult!: (result: unknown) => void;
		sandbox.stub(service, 'requestSuggestion').returns(new Promise(resolve => { resolveResult = resolve; }));
		const dispose = sandbox.spy(service, 'dispose');
		const pending = h.handler.handleMessage({ command: 'requestShadowSuggestion', context: { board: 'uno', depth: 'minimal' } });
		h.handler.disposeAIServices();
		assert.strictEqual(dispose.callCount, 1);
		resolveResult({ suggestions: [{ blockType: 'math_number' }], modelUsed: 'pro' });
		await pending;
		assert.strictEqual(h.postMessage.args.some(args => args[0].command === 'showShadowSuggestion'), false);
	});
});
