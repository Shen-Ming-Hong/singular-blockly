/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 編輯器內的互動式新手導覽：依序把要按的按鈕或區域圈起來，旁邊顯示說明卡片。
 * - 每一步都停下來讓使用者自己操作被圈起來的地方；做完會自動進到下一步，也可以按「下一步」。
 * - 遮罩只是視覺提示，不擋點擊；拖曳積木時暫時收起遮罩，下拉選單或積木清單打開時一起圈進來。
 * - 第一次打開編輯器時自動跑一次；看過（完成、略過或按 Esc）就記在這個 webview 的 localStorage。
 * - 工具列的「?」按鈕可隨時重看。
 * - 只在 WebView 內運作，不新增 Extension Host 訊息；樣式在 blocklyEdit.css 的 .guided-tour-*。
 */
(function () {
	'use strict';

	const SEEN_KEY = 'singularBlockly.guidedTour.seen.v1';
	const AUTO_START_DELAY_MS = 1200;
	const AUTO_START_MAX_TRIES = 20;
	const TRACK_INTERVAL_MS = 250;
	const ADVANCE_DELAY_MS = 700;

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
		if (rect.width <= 0 || rect.height <= 0) return false;
		const style = window.getComputedStyle(el);
		return style.visibility !== 'hidden' && style.display !== 'none';
	}

	function getWorkspace() {
		return window.Blockly?.getMainWorkspace?.() || null;
	}

	// 各平台的主程式積木（Arduino 的 setup/loop、MicroPython 的 main）。
	const MAIN_BLOCK_TYPES = ['arduino_setup_loop', 'micropython_main'];

	function mainBlock() {
		const workspace = getWorkspace();
		return (
			workspace?.getTopBlocks(false).find((b) => MAIN_BLOCK_TYPES.includes(b.type) && isVisible(b.getSvgRoot?.())) || null
		);
	}

	function mainWorkspaceTarget() {
		// 空白工作區沒有主程式積木可圈，這一步就略過。
		return mainBlock()?.getSvgRoot() || null;
	}

	function visibleFlyout() {
		return [...document.querySelectorAll('.blocklyFlyout')].find(isVisible) || null;
	}

	function currentBoardText() {
		return document.getElementById('boardSelectText')?.textContent || '';
	}

	function blockCount() {
		return getWorkspace()?.getAllBlocks(false).length || 0;
	}

	function mainBlockChildCount() {
		return mainBlock()?.getDescendants(false).length || 0;
	}

	/**
	 * 導覽步驟。
	 * target：要圈起來的元素；找不到或看不見的步驟會略過。
	 * extra：使用者操作時要一起圈進來的元素（下拉選單、積木清單）。
	 * snapshot／done：記下開始時的狀態，之後狀態改變就代表使用者做完了。
	 */
	function buildSteps() {
		return [
			{
				key: 'LANGUAGE',
				fallbackTitle: 'Choose your language',
				target: () => document.getElementById('languageToggle'),
				extra: () => [document.getElementById('languageDropdown')],
				events: ['languageChanged'],
			},
			{
				key: 'BOARD',
				fallbackTitle: 'Choose your board',
				target: () => document.querySelector('.board-select'),
				extra: () => [document.getElementById('boardDropdown')],
				snapshot: currentBoardText,
				done: (before) => currentBoardText() !== before,
			},
			{
				key: 'TOOLBOX',
				fallbackTitle: 'Get blocks from the toolbox',
				target: () => document.querySelector('.blocklyToolbox, .blocklyToolboxDiv'),
				extra: () => [visibleFlyout()],
				snapshot: blockCount,
				done: (before) => blockCount() > before,
			},
			{
				key: 'WORKSPACE',
				fallbackTitle: 'Snap blocks together',
				target: mainWorkspaceTarget,
				padding: 10,
				snapshot: mainBlockChildCount,
				done: (before) => mainBlockChildCount() > before,
			},
			{
				// 上傳前先提醒接上硬體；沒有可圈的元素，卡片放在畫面中間。
				key: 'CONNECT',
				fallbackTitle: 'Connect your board',
				target: null,
				when: () => isVisible(document.getElementById('uploadButton')),
				manual: true,
			},
			{
				key: 'UPLOAD',
				fallbackTitle: 'Upload to your board',
				target: () => document.getElementById('uploadButton'),
			},
			{
				key: 'THEME',
				fallbackTitle: 'Light or dark',
				target: () => document.getElementById('themeToggle'),
				snapshot: () => document.body.className,
				done: (before) => document.body.className !== before,
			},
		];
	}

	const FALLBACK_BODIES = {
		LANGUAGE: 'Click the globe to pick a language you can read. Blocks and labels switch right away.',
		BOARD: 'Pick the board you have, such as Arduino Uno, ESP32, or CyberBrick. The toolbox then shows the blocks that board can use.',
		TOOLBOX: 'Click a category to open its blocks, then drag a block onto the workspace.',
		WORKSPACE: 'Attach blocks to this main block. The code is written to your project file as you work.',
		CONNECT: 'Plug your board into this computer with a USB cable before you upload. A paired CyberBrick can also upload over Wi-Fi. Click Next when it is connected.',
		UPLOAD: 'Click here to build and upload your program. The first upload may take a few minutes while tools are prepared.',
		THEME: 'Switch the editor between light and dark here. To see this tour again, click the ? button in the toolbar.',
	};

	let active = null;

	function unionRect(elements, pad) {
		let top = Infinity;
		let left = Infinity;
		let right = -Infinity;
		let bottom = -Infinity;
		for (const el of elements) {
			if (!isVisible(el)) continue;
			const r = el.getBoundingClientRect();
			top = Math.min(top, r.top);
			left = Math.min(left, r.left);
			right = Math.max(right, r.right);
			bottom = Math.max(bottom, r.bottom);
		}
		if (top === Infinity) return null;
		return { top: top - pad, left: left - pad, right: right + pad, bottom: bottom + pad, width: right - left + pad * 2, height: bottom - top + pad * 2 };
	}

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
		} else if (rect.left - margin - cw >= edge) {
			top = rect.top;
			left = rect.left - margin - cw;
		} else if (rect.top - margin - ch >= edge) {
			top = rect.top - margin - ch;
			left = rect.left + rect.width / 2 - cw / 2;
		} else {
			top = vh - ch - edge;
			left = vw - cw - edge;
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

		// 每一步是否可用要在走到那一步時才判斷：例如先選好開發板，主程式積木和上傳按鈕才會出現。
		const steps = buildSteps();
		const isAvailable = (step) => (step.target ? isVisible(step.target()) : step.when ? step.when() : true);
		const availableIndexes = () => steps.map((step, i) => (isAvailable(step) ? i : -1)).filter((i) => i >= 0);

		const layer = document.createElement('div');
		layer.className = 'guided-tour-layer';
		layer.id = 'guidedTour';
		const spot = document.createElement('div');
		spot.className = 'guided-tour-spotlight';
		spot.setAttribute('aria-hidden', 'true');
		const card = document.createElement('div');
		card.className = 'guided-tour-card';
		card.setAttribute('role', 'dialog');
		card.setAttribute('aria-modal', 'false');
		card.setAttribute('aria-labelledby', 'guidedTourTitle');
		card.setAttribute('aria-describedby', 'guidedTourBody');
		card.innerHTML = `
			<div class="guided-tour-progress"></div>
			<h2 class="guided-tour-title" id="guidedTourTitle"></h2>
			<p class="guided-tour-body" id="guidedTourBody"></p>
			<p class="guided-tour-hint" aria-live="polite"></p>
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
		const hint = card.querySelector('.guided-tour-hint');
		const skip = card.querySelector('.guided-tour-skip');
		const back = card.querySelector('.guided-tour-back');
		const next = card.querySelector('.guided-tour-next');
		let index = 0;
		let baseline;
		let doneStep = false;
		let advanceTimer = null;

		function position() {
			const step = steps[index];
			const pad = step.padding ?? 6;
			const elements = [step.target ? step.target() : null, ...(step.extra ? step.extra() : [])];
			const rect = unionRect(elements, pad);
			if (rect) {
				spot.hidden = false;
				spot.style.top = `${rect.top}px`;
				spot.style.left = `${rect.left}px`;
				spot.style.width = `${rect.width}px`;
				spot.style.height = `${rect.height}px`;
			} else {
				// 沒有要圈的元素：遮罩縮成畫面中央的一點，整個畫面一起變暗。
				spot.hidden = true;
				spot.style.top = '50%';
				spot.style.left = '50%';
				spot.style.width = '0px';
				spot.style.height = '0px';
			}
			placeCard(card, rect);
		}

		function renderText() {
			const step = steps[index];
			const available = availableIndexes();
			const last = isLast();
			const position = available.indexOf(index);
			progress.textContent = `${(position >= 0 ? position : available.filter((i) => i < index).length) + 1} / ${Math.max(available.length, 1)}`;
			title.textContent = msg(`GUIDED_TOUR_${step.key}_TITLE`, step.fallbackTitle);
			body.textContent = msg(`GUIDED_TOUR_${step.key}_BODY`, FALLBACK_BODIES[step.key]);
			hint.hidden = !!step.manual;
			hint.textContent = doneStep
				? msg('GUIDED_TOUR_STEP_DONE', 'Nice work!')
				: msg('GUIDED_TOUR_TRY_IT', 'Try it now. You can also click Next.');
			hint.classList.toggle('is-done', doneStep);
			skip.textContent = msg('GUIDED_TOUR_SKIP', 'Skip tour');
			skip.hidden = last;
			back.textContent = msg('GUIDED_TOUR_BACK', 'Back');
			back.hidden = !steps.slice(0, index).some(isAvailable);
			next.textContent = last ? msg('GUIDED_TOUR_DONE', 'Start coding') : msg('GUIDED_TOUR_NEXT', 'Next');
		}

		function render(focusNext) {
			renderText();
			position();
			if (focusNext) next.focus({ preventScroll: true });
		}

		function isLast() {
			return !steps.slice(index + 1).some(isAvailable);
		}

		function go(i, direction = 1) {
			clearTimeout(advanceTimer);
			let target = i;
			while (target >= 0 && target < steps.length && !isAvailable(steps[target])) target += direction;
			if (target >= steps.length) {
				stop();
				return;
			}
			if (target < 0) target = index;
			index = target;
			const step = steps[index];
			baseline = step.snapshot ? step.snapshot() : undefined;
			doneStep = false;
			render(true);
		}

		function completeStep() {
			if (doneStep) return;
			doneStep = true;
			renderText();
			if (!isLast()) {
				advanceTimer = setTimeout(() => go(index + 1), ADVANCE_DELAY_MS);
			}
		}

		function track() {
			const step = steps[index];
			// 事件可能晚到，另外直接看工作區是否正在拖曳。
			layer.classList.toggle('is-dragging', !!(workspace?.isDragging?.() || document.querySelector('.blocklyDragging')));
			if (!doneStep && step.done && !layer.classList.contains('is-dragging') && step.done(baseline)) completeStep();
			position();
		}

		next.addEventListener('click', () => (isLast() ? stop() : go(index + 1)));
		back.addEventListener('click', () => go(index - 1, -1));
		skip.addEventListener('click', () => stop());

		// 遮罩不擋點擊，所以 Esc 要在整個文件上監聽；正在操作下拉選單或對話框時讓它們先處理。
		const onKeydown = (event) => {
			if (event.key !== 'Escape' || event.defaultPrevented) return;
			if (document.querySelector('dialog[open], .blocklyWidgetDiv:not(:empty), .blocklyDropDownDiv[style*="display: block"]')) return;
			const menuOpen = ['languageToggle', 'boardSelectToggle'].some(
				(id) => document.getElementById(id)?.getAttribute('aria-expanded') === 'true'
			);
			if (menuOpen) return;
			stop();
		};
		const onLanguageChanged = () => {
			setTimeout(() => {
				if (steps[index].events?.includes('languageChanged')) completeStep();
				else renderText();
				position();
			}, 0);
		};
		const onResize = () => position();

		// 拖曳積木時先收起遮罩，讓整個工作區都看得到。
		const workspace = getWorkspace();
		const onBlocklyEvent = (event) => {
			if (event.type === window.Blockly?.Events?.BLOCK_DRAG) {
				layer.classList.toggle('is-dragging', !!event.isStart);
			}
		};
		workspace?.addChangeListener(onBlocklyEvent);
		document.addEventListener('keydown', onKeydown);
		window.addEventListener('resize', onResize);
		window.addEventListener('languageChanged', onLanguageChanged);
		const tracker = setInterval(track, TRACK_INTERVAL_MS);

		active = {
			layer,
			go,
			returnFocus: options.returnFocus || null,
			cleanup() {
				clearInterval(tracker);
				clearTimeout(advanceTimer);
				workspace?.removeChangeListener(onBlocklyEvent);
				document.removeEventListener('keydown', onKeydown);
				window.removeEventListener('resize', onResize);
				window.removeEventListener('languageChanged', onLanguageChanged);
				if (wasCollapsed) setExpanded(false);
			},
		};
		if (availableIndexes().length === 0) {
			stop({ markSeen: false });
			return false;
		}
		go(0);
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
			const ready = document.querySelector('.blocklySvg') && getWorkspace();
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
