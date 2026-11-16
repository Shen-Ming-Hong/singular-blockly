/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 編輯器內的互動式新手導覽：依序把要按的按鈕或區域圈起來，旁邊顯示說明卡片。
 * - 第一次打開編輯器時自動跑一次；看過（完成、略過或按 Esc）就記在這個 webview 的 localStorage。
 * - 工具列的「?」按鈕可隨時重看。
 * - 只在 WebView 內運作，不新增 Extension Host 訊息；樣式在 blocklyEdit.css 的 .guided-tour-*。
 */
(function () {
	'use strict';

	const SEEN_KEY = 'singularBlockly.guidedTour.seen.v1';
	const AUTO_START_DELAY_MS = 1200;
	const AUTO_START_MAX_TRIES = 20;

	function msg(key, fallback) {
		return window.languageManager?.getMessage(key, fallback) || fallback;
	}

	function hasSeenTour() {
		try {
			return window.localStorage.getItem(SEEN_KEY) === '1';
		} catch {
			// 無法讀取時當成看過，避免每次都自動跳出。
			return true;
		}
	}

	function markTourSeen() {
		try {
			window.localStorage.setItem(SEEN_KEY, '1');
		} catch {
			// 寫不進去也不影響使用。
		}
	}

	function isVisible(el) {
		if (!el) return false;
		const rect = el.getBoundingClientRect();
		return rect.width > 0 && rect.height > 0;
	}

	function mainWorkspaceTarget() {
		const workspace = window.Blockly?.getMainWorkspace?.();
		const block = workspace?.getTopBlocks(true).find((b) => !b.isInFlyout);
		const root = block?.getSvgRoot?.();
		// 空白工作區沒有主程式積木可圈，這一步就略過。
		return isVisible(root) ? root : null;
	}

	/** 導覽步驟；target 回傳要圈起來的元素，找不到或看不見的步驟會略過。 */
	function buildSteps() {
		return [
			{ key: 'LANGUAGE', fallbackTitle: 'Choose your language', target: () => document.getElementById('languageToggle'), secondary: true },
			{ key: 'BOARD', fallbackTitle: 'Choose your board', target: () => document.querySelector('.board-select') },
			{ key: 'TOOLBOX', fallbackTitle: 'Get blocks from the toolbox', target: () => document.querySelector('.blocklyToolbox, .blocklyToolboxDiv') },
			{ key: 'WORKSPACE', fallbackTitle: 'Snap blocks together', target: mainWorkspaceTarget, padding: 10 },
			{ key: 'UPLOAD', fallbackTitle: 'Upload to your board', target: () => document.getElementById('uploadButton') },
			{ key: 'THEME', fallbackTitle: 'Light or dark', target: () => document.getElementById('themeToggle'), secondary: true },
		];
	}

	const FALLBACK_BODIES = {
		LANGUAGE: 'Click the globe to pick a language you can read. Blocks and labels switch right away.',
		BOARD: 'Pick the board you have, such as Arduino Uno, ESP32, or CyberBrick. The toolbox then shows the blocks that board can use.',
		TOOLBOX: 'Click a category to open its blocks, then drag a block onto the workspace.',
		WORKSPACE: 'Attach blocks to this main block. The code is written to your project file as you work.',
		UPLOAD: 'Connect your board, then click here to build and upload your program.',
		THEME: 'Switch the editor between light and dark here. To see this tour again, click the ? button in the toolbar.',
	};

	let active = null;

	function placeCard(card, rect) {
		const margin = 12;
		const edge = 16;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const cw = card.offsetWidth;
		const ch = card.offsetHeight;
		let top;
		let left;
		if (!rect) {
			top = (vh - ch) / 2;
			left = (vw - cw) / 2;
		} else if (rect.bottom + margin + ch <= vh - edge) {
			top = rect.bottom + margin;
			left = rect.left + rect.width / 2 - cw / 2;
		} else if (rect.right + margin + cw <= vw - edge) {
			top = rect.top;
			left = rect.right + margin;
		} else if (rect.top - margin - ch >= edge) {
			top = rect.top - margin - ch;
			left = rect.left + rect.width / 2 - cw / 2;
		} else {
			top = vh - ch - edge;
			left = (vw - cw) / 2;
		}
		card.style.top = `${Math.max(edge, Math.min(top, vh - ch - edge))}px`;
		card.style.left = `${Math.max(edge, Math.min(left, vw - cw - edge))}px`;
	}

	function start(options = {}) {
		stop({ markSeen: false });

		// 語言與主題在可收合的工具列裡；導覽期間先展開，結束後還原。
		const secondary = document.getElementById('toolbarSecondaryActions');
		const wasCollapsed = !!secondary?.hidden;
		const setExpanded = (expanded) => {
			if (typeof window.setToolbarActionsExpanded === 'function') {
				window.setToolbarActionsExpanded(expanded);
			} else if (secondary) {
				secondary.hidden = !expanded;
			}
		};
		if (wasCollapsed) setExpanded(true);

		const steps = buildSteps().filter((step) => isVisible(step.target()));
		if (steps.length === 0) {
			if (wasCollapsed) setExpanded(false);
			return false;
		}

		const layer = document.createElement('div');
		layer.className = 'guided-tour-layer';
		layer.id = 'guidedTour';
		const spot = document.createElement('div');
		spot.className = 'guided-tour-spotlight';
		spot.setAttribute('aria-hidden', 'true');
		const card = document.createElement('div');
		card.className = 'guided-tour-card';
		card.setAttribute('role', 'dialog');
		card.setAttribute('aria-modal', 'true');
		card.setAttribute('aria-labelledby', 'guidedTourTitle');
		card.setAttribute('aria-describedby', 'guidedTourBody');
		card.innerHTML = `
			<div class="guided-tour-progress"></div>
			<h2 class="guided-tour-title" id="guidedTourTitle"></h2>
			<p class="guided-tour-body" id="guidedTourBody"></p>
			<div class="guided-tour-actions">
				<button type="button" class="guided-tour-skip"></button>
				<span class="guided-tour-spacer"></span>
				<button type="button" class="guided-tour-back"></button>
				<button type="button" class="guided-tour-next"></button>
			</div>`;
		layer.append(spot, card);
		document.body.appendChild(layer);

		const progress = card.querySelector('.guided-tour-progress');
		const title = card.querySelector('.guided-tour-title');
		const body = card.querySelector('.guided-tour-body');
		const skip = card.querySelector('.guided-tour-skip');
		const back = card.querySelector('.guided-tour-back');
		const next = card.querySelector('.guided-tour-next');
		let index = 0;

		function render(focusNext = true) {
			const step = steps[index];
			const target = step.target();
			const rect = isVisible(target) ? target.getBoundingClientRect() : null;
			if (rect) {
				const pad = step.padding ?? 6;
				spot.hidden = false;
				spot.style.top = `${rect.top - pad}px`;
				spot.style.left = `${rect.left - pad}px`;
				spot.style.width = `${rect.width + pad * 2}px`;
				spot.style.height = `${rect.height + pad * 2}px`;
			} else {
				spot.hidden = true;
			}
			const last = index === steps.length - 1;
			progress.textContent = `${index + 1} / ${steps.length}`;
			title.textContent = msg(`GUIDED_TOUR_${step.key}_TITLE`, step.fallbackTitle);
			body.textContent = msg(`GUIDED_TOUR_${step.key}_BODY`, FALLBACK_BODIES[step.key]);
			skip.textContent = msg('GUIDED_TOUR_SKIP', 'Skip tour');
			skip.hidden = last;
			back.textContent = msg('GUIDED_TOUR_BACK', 'Back');
			back.hidden = index === 0;
			next.textContent = last ? msg('GUIDED_TOUR_DONE', 'Start coding') : msg('GUIDED_TOUR_NEXT', 'Next');
			placeCard(card, rect);
			if (focusNext) next.focus();
		}

		function go(i) {
			index = Math.max(0, Math.min(i, steps.length - 1));
			render();
		}

		next.addEventListener('click', () => (index === steps.length - 1 ? stop() : go(index + 1)));
		back.addEventListener('click', () => go(index - 1));
		skip.addEventListener('click', () => stop());
		layer.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				stop();
				return;
			}
			if (event.key === 'Tab') {
				// 焦點留在卡片的按鈕之間。
				const buttons = [...card.querySelectorAll('button')].filter((b) => !b.hidden);
				const i = buttons.indexOf(document.activeElement);
				event.preventDefault();
				const nextIndex = event.shiftKey ? (i <= 0 ? buttons.length - 1 : i - 1) : (i + 1) % buttons.length;
				buttons[nextIndex].focus();
			}
		});
		const onResize = () => render(false);
		const onLanguageChanged = () => setTimeout(() => render(false), 0);
		window.addEventListener('resize', onResize);
		window.addEventListener('languageChanged', onLanguageChanged);

		active = {
			layer,
			go,
			returnFocus: options.returnFocus || null,
			cleanup() {
				window.removeEventListener('resize', onResize);
				window.removeEventListener('languageChanged', onLanguageChanged);
				if (wasCollapsed) setExpanded(false);
			},
		};
		render();
		return true;
	}

	function stop(options = {}) {
		if (!active) return;
		const { layer, cleanup, returnFocus } = active;
		active = null;
		cleanup();
		layer.remove();
		if (options.markSeen !== false) markTourSeen();
		if (returnFocus && isVisible(returnFocus)) {
			returnFocus.focus();
		} else if (returnFocus) {
			// 「?」按鈕在收合的工具列裡時，改把焦點放到展開按鈕。
			document.getElementById('toolbarActionsToggle')?.focus();
		}
	}

	function isBusy() {
		return !!document.querySelector('dialog[open], .modal.show, .modal[style*="block"], .blocklyWidgetDiv:not(:empty)');
	}

	function maybeAutoStart() {
		if (hasSeenTour()) return;
		let tries = 0;
		const attempt = () => {
			if (active || hasSeenTour()) return;
			const ready = document.querySelector('.blocklySvg') && window.Blockly?.getMainWorkspace?.();
			if (!ready || isBusy()) {
				if (++tries < AUTO_START_MAX_TRIES) setTimeout(attempt, AUTO_START_DELAY_MS);
				return;
			}
			start();
		};
		setTimeout(attempt, AUTO_START_DELAY_MS);
	}

	function updateButtonText() {
		const button = document.getElementById('guidedTourButton');
		if (!button) return;
		const label = msg('GUIDED_TOUR_BUTTON', 'Start guided tour');
		button.title = label;
		button.setAttribute('aria-label', label);
	}

	function init() {
		const button = document.getElementById('guidedTourButton');
		if (button) {
			button.addEventListener('click', () => start({ returnFocus: button }));
		}
		updateButtonText();
		window.addEventListener('languageChanged', updateButtonText);
		window.addEventListener('messageLoaded', updateButtonText);
		maybeAutoStart();
	}

	window.guidedTour = {
		start,
		stop,
		go: (i) => active?.go(i),
		isActive: () => !!active,
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
