/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as sinon from 'sinon';
import * as vm from 'vm';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { readWorkspaceFile } from './editorThemeSurfaceContractUtils';

/** 只實作 toast 物件用到的 DOM 介面 */
class FakeElement {
	className = '';
	textContent = '';
	parentNode: FakeElement | null = null;
	children: FakeElement[] = [];
	attributes: Record<string, string> = {};
	id = '';
	style: Record<string, string> = {};
	classList = {
		add: (...names: string[]) => this.setClasses([...this.classes(), ...names]),
		remove: (...names: string[]) => this.setClasses(this.classes().filter(name => !names.includes(name))),
		contains: (name: string) => this.classes().includes(name),
	};

	private classes(): string[] {
		return this.className.split(/\s+/).filter(Boolean);
	}

	private setClasses(names: string[]): void {
		this.className = Array.from(new Set(names)).join(' ');
	}

	setAttribute(name: string, value: string): void {
		this.attributes[name] = value;
	}

	removeAttribute(name: string): void {
		delete this.attributes[name];
	}

	append(...nodes: FakeElement[]): void {
		nodes.forEach(node => this.appendChild(node));
	}

	appendChild(node: FakeElement): void {
		node.parentNode = this;
		this.children.push(node);
	}

	remove(): void {
		if (this.parentNode) {
			this.parentNode.children = this.parentNode.children.filter(child => child !== this);
			this.parentNode = null;
		}
	}

	querySelector(selector: string): FakeElement | null {
		const name = selector.replace(/^\./, '');
		for (const child of this.children) {
			if (child.classList.contains(name)) {
				return child;
			}
			const nested = child.querySelector(selector);
			if (nested) {
				return nested;
			}
		}
		return null;
	}

	querySelectorAll(selector: string): FakeElement[] {
		const name = selector.replace(/^\./, '');
		const found: FakeElement[] = [];
		for (const child of this.children) {
			if (child.classList.contains(name)) {
				found.push(child);
			}
			found.push(...child.querySelectorAll(selector));
		}
		return found;
	}
}

function extractBetween(source: string, startMarker: string, endMarker: string): string {
	const start = source.indexOf(startMarker);
	assert.ok(start >= 0, `${startMarker} should exist`);
	const end = source.indexOf(endMarker, start);
	assert.ok(end > start, `${endMarker} should follow ${startMarker}`);
	return source.slice(start, end);
}

function loadToast() {
	const source = readWorkspaceFile('media/js/blocklyEdit.js');
	const toastSource = extractBetween(source, 'const toast = {', '\n/**\n * 當前程式語言');
	const body = new FakeElement();
	const context = vm.createContext({
		document: {
			createElement: () => new FakeElement(),
			body,
			querySelectorAll: (selector: string) => body.querySelectorAll(selector),
		},
		requestAnimationFrame: (callback: () => void) => callback(),
		setTimeout,
		clearTimeout,
		setInterval,
		clearInterval,
		Date,
	});
	vm.runInContext(`${toastSource}\nthis.toast = toast;`, context);
	return { toast: context.toast, body };
}

function loadFormatter() {
	const source = readWorkspaceFile('media/js/blocklyEdit.js');
	const fn = extractBetween(source, 'function formatUploadProgress(', '\n}\n') + '\n}\n';
	const context = vm.createContext({});
	vm.runInContext(`${fn}\nthis.formatUploadProgress = formatUploadProgress;`, context);
	// vm 物件的原型屬於另一個 realm，轉成普通物件再比對
	return (...args: unknown[]): { text: string; value: number | null } =>
		JSON.parse(JSON.stringify(context.formatUploadProgress(...args)));
}

describe('Upload progress toast contract', () => {
	let clock: sinon.SinonFakeTimers;

	beforeEach(() => {
		clock = sinon.useFakeTimers({ now: 1_000_000 });
	});

	afterEach(() => {
		clock.restore();
	});

	it('keeps the progress toast visible through long silent stages until the result arrives', () => {
		const { toast, body } = loadToast();
		toast.showProgress('Compiling (40%)', Date.now());

		clock.tick(5 * 60 * 1000);
		const progress = body.querySelector('.progress');
		assert.ok(progress, 'Progress toast must stay after five silent minutes');
		assert.strictEqual(progress.querySelector('.toast-message')?.textContent, 'Compiling (40%)');
		assert.strictEqual(progress.querySelector('.toast-elapsed')?.textContent, '5:00');

		toast.endProgress();
		toast.show('Upload successful', 'success');
		assert.strictEqual(body.querySelectorAll('.progress').length, 0, 'Result replaces the progress toast');
		assert.strictEqual(body.querySelectorAll('.success').length, 1);
		clock.tick(60 * 1000);
		assert.strictEqual(body.children.length, 0, 'No progress toast comes back after the result');
	});

	it('updates the same element in place instead of re-creating it', () => {
		const { toast, body } = loadToast();
		toast.showProgress('Preparing (5%)', Date.now());
		const first = body.querySelector('.progress');
		clock.tick(8000);
		toast.showProgress('Compiling (40%)');
		assert.strictEqual(body.querySelector('.progress'), first, 'Progress updates must not flash a new toast');
		assert.strictEqual(first?.querySelector('.toast-message')?.textContent, 'Compiling (40%)');
		assert.strictEqual(first?.querySelector('.toast-elapsed')?.textContent, '8s');
	});

	it('announces the stage text politely but hides the per-second elapsed counter from screen readers', () => {
		const { toast, body } = loadToast();
		toast.showProgress('Uploading (80%)', Date.now());
		const progress = body.querySelector('.progress');
		assert.strictEqual(progress?.querySelector('.toast-message')?.attributes.role, 'status');
		assert.strictEqual(progress?.querySelector('.toast-message')?.attributes['aria-live'], 'polite');
		assert.strictEqual(progress?.querySelector('.toast-elapsed')?.attributes['aria-hidden'], 'true');
	});

	it('returns to the progress toast after an unrelated short notification during upload', () => {
		const { toast, body } = loadToast();
		toast.showProgress('Compiling (40%)', Date.now());
		toast.show('Backup saved', 'success', 2500);
		assert.strictEqual(body.querySelectorAll('.progress').length, 0);

		toast.showProgress('Compiling (45%)');
		assert.strictEqual(body.querySelectorAll('.progress').length, 0, 'Short notification is not cut off');

		clock.tick(2500 + 300);
		const progress = body.querySelector('.progress');
		assert.ok(progress, 'Progress toast returns after the short notification');
		assert.strictEqual(progress.querySelector('.toast-message')?.textContent, 'Compiling (45%)');
	});

	it('wires upload handlers to the persistent progress toast', () => {
		const source = readWorkspaceFile('media/js/blocklyEdit.js');
		const progressHandler = extractBetween(source, 'function handleUploadProgress(', '\n}\n');
		assert.ok(progressHandler.includes('toast.showProgress('), 'Upload progress uses the persistent toast');
		assert.ok(!/toast\.show\(progressText/.test(progressHandler), 'Upload progress must not use auto-hiding toasts');

		const resultHandler = extractBetween(source, 'function handleUploadResult(', '\n}\n');
		assert.ok(resultHandler.includes('toast.endProgress()'), 'Upload result ends the progress toast');

		const otaProgress = extractBetween(source, 'function handleCyberBrickOtaUploadProgress(', '\n}\n');
		assert.ok(otaProgress.includes('toast.showProgress('), 'OTA progress uses the persistent toast');
		const otaResult = extractBetween(source, 'function handleCyberBrickOtaUploadResult(', '\n}\n');
		assert.ok(otaResult.includes('toast.endProgress()'), 'OTA result ends the progress toast');
	});

	it('shows a determinate progress bar with ARIA values, and an indeterminate one without a value (spec 076)', () => {
		const { toast, body } = loadToast();
		toast.showProgress('Compiling 40%', Date.now(), 40);
		const bar = body.querySelector('.toast-progress-bar');
		assert.ok(bar, 'Progress toast has a bar');
		assert.strictEqual(bar.attributes.role, 'progressbar');
		assert.strictEqual(bar.attributes['aria-valuemin'], '0');
		assert.strictEqual(bar.attributes['aria-valuemax'], '100');
		assert.strictEqual(bar.attributes['aria-valuenow'], '40');
		assert.strictEqual(bar.attributes['aria-labelledby'], body.querySelector('.toast-message')?.id);
		assert.strictEqual(body.querySelector('.toast-progress-fill')?.style.width, '40%');

		toast.showProgress('Uploading', undefined, null);
		assert.strictEqual(body.querySelector('.toast-progress-bar'), bar, 'Bar updates in place');
		assert.ok(bar.classList.contains('indeterminate'));
		assert.strictEqual(bar.attributes['aria-valuenow'], undefined, 'Indeterminate bars do not announce a value');
	});

	it('keeps the bar value when the toast comes back after a short notification', () => {
		const { toast, body } = loadToast();
		toast.showProgress('Downloading ESP32 tools 30%', Date.now(), 30);
		toast.show('Backup saved', 'success', 2500);
		clock.tick(2500 + 300);
		assert.strictEqual(body.querySelector('.toast-progress-bar')?.attributes['aria-valuenow'], '30');
	});

	it('formats one short label without raw tool output', () => {
		const format = loadFormatter();
		const get = (_key: string, fallback: string) => fallback;
		const stages = { compiling: 'Compiling', checking_pio: 'Checking build tools' };
		assert.deepStrictEqual(
			format({ stage: 'compiling', progress: 35, message: 'Compiling .pio/build/esp32/src/main.cpp.o' }, stages, 'ESP32', get),
			{ text: 'Compiling 35%', value: 35 }
		);
		assert.deepStrictEqual(
			format({ stage: 'checking_pio', progress: 18, message: 'Preparing project packages...', packages: { phase: 'download', percent: 12 } }, stages, 'ESP32', get),
			{ text: 'Downloading ESP32 tools 12%', value: 12 }
		);
		assert.deepStrictEqual(
			format({ stage: 'checking_pio', progress: 18, message: 'x', packages: { phase: 'install', percent: null } }, stages, 'ESP32', get),
			{ text: 'Installing ESP32 tools', value: null }
		);
	});
});
