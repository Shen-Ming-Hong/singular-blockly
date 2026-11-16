/**
 * 編輯器內的互動式新手導覽（提案原型）：依序把畫面上的按鈕或區域圈起來，旁邊顯示說明卡片。
 * 樣式使用 blocklyEdit.css 的 --editor-* 色彩變數，亮色與暗色主題共用同一份規則。
 */
(function () {
	'use strict';

	const STYLE_ID = 'guidedTourStyle';
	const CSS = `
.guided-tour-layer { position: fixed; inset: 0; z-index: 10000; pointer-events: auto; }
.guided-tour-spotlight {
	position: fixed; border-radius: 8px; pointer-events: none;
	box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
	outline: 3px solid var(--editor-focus-ring, #007acc); outline-offset: 2px;
	transition: top .25s ease, left .25s ease, width .25s ease, height .25s ease;
}
.guided-tour-card {
	position: fixed; width: min(320px, calc(100vw - 32px)); box-sizing: border-box;
	padding: 16px 16px 12px; border-radius: 8px;
	background: var(--editor-surface-bg, #fff); color: var(--editor-surface-fg, #1e1e1e);
	border: 1px solid var(--editor-surface-border, rgba(0,0,0,.12));
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
	font: 13px/1.5 var(--vscode-font-family, system-ui, sans-serif);
}
.guided-tour-progress { font-size: 12px; color: var(--editor-description-fg, #666); margin-bottom: 4px; }
.guided-tour-title { font-size: 15px; font-weight: 600; margin: 0 0 6px; }
.guided-tour-body { margin: 0 0 14px; }
.guided-tour-actions { display: flex; align-items: center; gap: 8px; }
.guided-tour-actions .spacer { flex: 1; }
.guided-tour-actions button {
	font: inherit; border-radius: 4px; padding: 5px 12px; cursor: pointer;
	border: 1px solid var(--editor-field-border, rgba(0,0,0,.2));
	background: transparent; color: inherit;
}
.guided-tour-actions button.guided-tour-skip { border-color: transparent; color: var(--editor-description-fg, #666); padding-left: 0; }
.guided-tour-actions button.guided-tour-next {
	background: var(--editor-primary-action-bg, #0e639c); color: var(--editor-primary-action-fg, #fff); border-color: transparent;
}
.guided-tour-actions button:focus-visible { outline: 2px solid var(--editor-focus-ring, #007acc); outline-offset: 2px; }
`;

	function ensureStyle() {
		if (document.getElementById(STYLE_ID)) return;
		const style = document.createElement('style');
		style.id = STYLE_ID;
		style.textContent = CSS;
		document.head.appendChild(style);
	}

	function expandToolbar() {
		const toggle = document.getElementById('toolbarActionsToggle');
		if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
	}

	function rectOf(target) {
		const el = typeof target === 'function' ? target() : document.querySelector(target);
		if (!el) return null;
		const r = el.getBoundingClientRect();
		return r.width && r.height ? r : null;
	}

	function placeCard(card, rect) {
		const margin = 12;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const cw = card.offsetWidth;
		const ch = card.offsetHeight;
		let top;
		let left;
		if (!rect) {
			top = (vh - ch) / 2;
			left = (vw - cw) / 2;
		} else if (rect.bottom + margin + ch <= vh) {
			top = rect.bottom + margin;
			left = rect.left + rect.width / 2 - cw / 2;
		} else if (rect.right + margin + cw <= vw) {
			top = rect.top;
			left = rect.right + margin;
		} else {
			top = rect.top - margin - ch;
			left = rect.left + rect.width / 2 - cw / 2;
		}
		card.style.top = `${Math.max(16, Math.min(top, vh - ch - 16))}px`;
		card.style.left = `${Math.max(16, Math.min(left, vw - cw - 16))}px`;
	}

	function start(steps, options = {}) {
		ensureStyle();
		stop();
		const layer = document.createElement('div');
		layer.className = 'guided-tour-layer';
		layer.id = 'guidedTour';
		const spot = document.createElement('div');
		spot.className = 'guided-tour-spotlight';
		const card = document.createElement('div');
		card.className = 'guided-tour-card';
		card.setAttribute('role', 'dialog');
		card.setAttribute('aria-modal', 'true');
		card.setAttribute('aria-labelledby', 'guidedTourTitle');
		layer.append(spot, card);
		document.body.appendChild(layer);
		const label = options.labels || {};
		let index = options.startAt || 0;

		function render() {
			const step = steps[index];
			if (step.before) step.before();
			const rect = step.target ? rectOf(step.target) : null;
			if (rect) {
				const pad = step.padding ?? 6;
				spot.style.display = '';
				spot.style.top = `${rect.top - pad}px`;
				spot.style.left = `${rect.left - pad}px`;
				spot.style.width = `${rect.width + pad * 2}px`;
				spot.style.height = `${rect.height + pad * 2}px`;
			} else {
				spot.style.display = '';
				spot.style.top = '50%';
				spot.style.left = '50%';
				spot.style.width = '0px';
				spot.style.height = '0px';
			}
			const last = index === steps.length - 1;
			card.innerHTML = `
				<div class="guided-tour-progress">${index + 1} / ${steps.length}</div>
				<h2 class="guided-tour-title" id="guidedTourTitle"></h2>
				<p class="guided-tour-body"></p>
				<div class="guided-tour-actions">
					<button type="button" class="guided-tour-skip"></button>
					<span class="spacer"></span>
					${index > 0 ? '<button type="button" class="guided-tour-back"></button>' : ''}
					<button type="button" class="guided-tour-next"></button>
				</div>`;
			card.querySelector('.guided-tour-title').textContent = step.title;
			card.querySelector('.guided-tour-body').textContent = step.body;
			card.querySelector('.guided-tour-skip').textContent = last ? '' : label.skip || 'Skip tour';
			if (last) card.querySelector('.guided-tour-skip').style.visibility = 'hidden';
			const back = card.querySelector('.guided-tour-back');
			if (back) {
				back.textContent = label.back || 'Back';
				back.onclick = () => go(index - 1);
			}
			const next = card.querySelector('.guided-tour-next');
			next.textContent = last ? label.done || 'Done' : label.next || 'Next';
			next.onclick = () => (last ? stop() : go(index + 1));
			card.querySelector('.guided-tour-skip').onclick = stop;
			placeCard(card, rect);
			next.focus();
		}

		function go(i) {
			index = Math.max(0, Math.min(i, steps.length - 1));
			render();
		}

		layer.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') stop();
		});
		window.addEventListener('resize', render);
		layer._cleanup = () => window.removeEventListener('resize', render);
		render();
		return { go };
	}

	function stop() {
		const layer = document.getElementById('guidedTour');
		if (!layer) return;
		if (layer._cleanup) layer._cleanup();
		layer.remove();
	}

	window.guidedTour = { start, stop, expandToolbar };
})();
