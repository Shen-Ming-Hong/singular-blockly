/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// 實驗積木清單
window.experimentalBlocks = [];
// 潛在實驗積木清單 - 存儲所有被定義為實驗性的積木類型
window.potentialExperimentalBlocks = [];

// 紀錄上次輸出的實驗積木清單字串，用於比較是否有變化
let lastExperimentalBlocksJson = '';

// 實驗積木提示管理
window.experimentalBlocksNotice = {
	// 提示元素
	noticeElement: null,
	// 標題元素
	titleElement: null,
	// 說明元素
	descriptionElement: null,
	// 持久性指示器元素
	indicatorElement: null,
	// 是否已顯示
	isShown: false,
	// 是否已經顯示過通知
	hasShownNotice: false,
	// 自動隱藏計時器
	autoHideTimer: null,
	// 自動隱藏延遲（毫秒）
	autoHideDelay: 10000,
	// 初始化提示元素
	init: function () {
		// 檢查是否在預覽模式，預覽模式下不需要通知系統
		if (window.isPreviewMode) {
			log.info('[實驗積木] 預覽模式下跳過通知系統初始化');
			return;
		}

		log.info('[實驗積木] 初始化通知系統');

		this.noticeElement = document.getElementById('experimentalBlocksNotice');
		this.titleElement = document.getElementById('experimentalNoticeTitle');
		this.descriptionElement = document.getElementById('experimentalNoticeDesc');
		this.indicatorElement = document.getElementById('experimentalBlocksIndicator');

		// 記錄元素初始化狀態
		log.info('[實驗積木] 通知系統元素初始化狀態', {
			noticeElement: this.noticeElement ? 'exists' : 'missing',
			titleElement: this.titleElement ? 'exists' : 'missing',
			descElement: this.descriptionElement ? 'exists' : 'missing',
			indicatorElement: this.indicatorElement ? 'exists' : 'missing',
		});

		// 添加監聽器，點擊時隱藏提示
		if (this.noticeElement) {
			this.noticeElement.addEventListener('click', () => {
				this.hide();
			});
		}

		// 為指示器添加工具提示文字
		if (this.indicatorElement) {
			// 設定提示文字
			const tooltipText = window.languageManager
				? window.languageManager.getMessage(
						'EXPERIMENTAL_BLOCKS_DESC',
						'您的作品中含有黃色虛線標示的實驗性積木，這些功能在未來可能會變更或移除，請謹慎使用。'
				  )
				: '您的作品中含有黃色虛線標示的實驗性積木，這些功能在未來可能會變更或移除，請謹慎使用。';

			this.indicatorElement.setAttribute('title', tooltipText);

			// 添加點擊事件，點擊指示器時顯示完整通知
			this.indicatorElement.addEventListener('click', () => {
				this.showFullNotice();
			});
		}
		// 更新多語言文字
		this.updateTexts();
	}, // 更新提示文字
	updateTexts: function () {
		// 檢查是否在預覽模式，預覽模式下不需要更新文字
		if (window.isPreviewMode) {
			return;
		}

		// 如果元素不存在，記錄錯誤並返回（不要再次調用 init 避免無限遞迴）
		if (!this.titleElement || !this.descriptionElement) {
			log.error('[實驗積木] 實驗積木提示元素未找到');
			return;
		}

		// 使用語言管理器獲取多語言文字
		this.titleElement.textContent = window.languageManager
			? window.languageManager.getMessage('EXPERIMENTAL_BLOCKS_TITLE', '發現實驗性積木')
			: '發現實驗性積木';

		this.descriptionElement.textContent = window.languageManager
			? window.languageManager.getMessage(
					'EXPERIMENTAL_BLOCKS_DESC',
					'您的作品中含有黃色虛線標示的實驗性積木，這些功能在未來可能會變更或移除，請謹慎使用。'
			  )
			: '您的作品中含有黃色虛線標示的實驗性積木，這些功能在未來可能會變更或移除，請謹慎使用。';
	}, // 檢查是否需要顯示提示
	checkAndShow: function () {
		// 檢查是否在預覽模式，預覽模式下不需要顯示通知
		if (window.isPreviewMode) {
			return false;
		}

		// 檢查是否有實驗積木
		if (window.experimentalBlocks && window.experimentalBlocks.length > 0) {
			// 檢查工作區中是否實際使用了實驗積木
			const workspace = Blockly.getMainWorkspace();
			if (workspace) {
				const blocks = workspace.getAllBlocks();
				const hasExperimentalBlock = blocks.some(block => window.experimentalBlocks.includes(block.type));

				if (hasExperimentalBlock) {
					// 如果已經顯示過通知，只顯示指示器
					if (this.hasShownNotice) {
						this.showIndicator();
					} else {
						// 第一次發現實驗積木，顯示完整通知
						this.showFullNotice();
					}
					return true;
				}
			}
		}

		// 如果沒有實驗積木，隱藏所有提示元素
		this.hideAll();
		return false;
	},
	// 顯示提示
	show: function () {
		// 檢查是否在預覽模式，預覽模式下不需要顯示通知
		if (window.isPreviewMode) {
			return;
		}

		if (this.isShown) {
			return;
		}

		// 清除可能的自動隱藏計時器
		if (this.autoHideTimer) {
			clearTimeout(this.autoHideTimer);
		}

		// 更新文字以確保最新
		this.updateTexts();

		// 顯示提示
		this.noticeElement.classList.remove('hidden');
		this.noticeElement.classList.add('visible', 'fade-in');
		this.isShown = true;

		// 設置自動隱藏
		this.autoHideTimer = setTimeout(() => {
			this.hide();
		}, this.autoHideDelay);

		log.info('顯示實驗積木提示');
	},
	// 隱藏提示
	hide: function () {
		try {
			if (!this.noticeElement) {
				return;
			}

			if (!this.isShown) {
				return;
			}

			this.noticeElement.classList.remove('visible', 'fade-in');
			this.noticeElement.classList.add('fade-out');

			// 動畫結束後完全隱藏
			setTimeout(() => {
				if (this.noticeElement) {
					this.noticeElement.classList.add('hidden');
					this.noticeElement.classList.remove('fade-out');
				}
			}, 500);

			this.isShown = false;

			// 清除自動隱藏計時器
			if (this.autoHideTimer) {
				clearTimeout(this.autoHideTimer);
				this.autoHideTimer = null;
			}
		} catch (e) {
			console.error('隱藏實驗積木提示時發生錯誤:', e);
		}
	}, // 顯示完整通知
	showFullNotice: function () {
		// 檢查是否在預覽模式，預覽模式下不需要顯示通知
		if (window.isPreviewMode) {
			return;
		}

		try {
			if (!this.noticeElement) {
				log.warn('找不到實驗積木提示元素，無法顯示提示');
				return;
			}

			if (this.isShown) {
				return;
			}

			// 清除可能的自動隱藏計時器
			if (this.autoHideTimer) {
				clearTimeout(this.autoHideTimer);
			}

			// 更新文字以確保最新
			this.updateTexts();

			// 顯示提示
			this.noticeElement.classList.remove('hidden');
			this.noticeElement.classList.add('visible', 'fade-in');
			this.isShown = true;
			this.hasShownNotice = true; // 標記已顯示過通知

			// 設置自動隱藏
			this.autoHideTimer = setTimeout(() => {
				this.hide();
				// 隱藏完整通知後顯示持久性指示器
				this.showIndicator();
			}, this.autoHideDelay);

			if (typeof log !== 'undefined' && log.info) {
				log.info('顯示實驗積木完整提示');
			} else {
				log.info('顯示實驗積木完整提示');
			}
		} catch (e) {
			log.error('顯示實驗積木提示時發生錯誤:', e);
		}
	}, // 顯示持久性指示器
	showIndicator: function () {
		// 檢查是否在預覽模式，預覽模式下不需要顯示指示器
		if (window.isPreviewMode) {
			return;
		}

		try {
			if (!this.indicatorElement) {
				log.warn('[實驗積木] 找不到實驗積木指示器元素，無法顯示指示器');
				return;
			}

			// 更新tooltip文字
			const tooltipText = window.languageManager
				? window.languageManager.getMessage(
						'EXPERIMENTAL_BLOCKS_DESC',
						'您的作品中含有黃色虛線標示的實驗性積木，這些功能在未來可能會變更或移除，請謹慎使用。'
				  )
				: '您的作品中含有黃色虛線標示的實驗性積木，這些功能在未來可能會變更或移除，請謹慎使用。';

			this.indicatorElement.setAttribute('title', tooltipText);

			// 確保元素可見 - 直接移除hidden類
			this.indicatorElement.classList.remove('hidden');

			// 將寬度設置回來，因為在hidden狀態下寬度可能被設為0
			setTimeout(() => {
				if (this.indicatorElement) {
					this.indicatorElement.style.width = '32px';
					this.indicatorElement.style.margin = '0 10px 0 0';
				}
			}, 0);

			log.info('[實驗積木] 顯示實驗積木持久性指示器', {
				element: this.indicatorElement ? 'exists' : 'missing',
				hasClass: this.indicatorElement ? this.indicatorElement.classList.contains('hidden') : 'N/A',
				style: this.indicatorElement ? this.indicatorElement.getAttribute('style') : 'N/A',
			});
		} catch (e) {
			console.error('顯示實驗積木指示器時發生錯誤:', e);
		}
	},
	// 隱藏所有提示元素（完整通知和指示器）
	hideAll: function () {
		try {
			this.hide();

			if (this.indicatorElement) {
				// 添加hidden類以隱藏元素
				this.indicatorElement.classList.add('hidden');

				// 在次幀調整寬度和邊距確保不佔空間
				setTimeout(() => {
					if (this.indicatorElement) {
						this.indicatorElement.style.width = '0';
						this.indicatorElement.style.margin = '0';
					}
				}, 0);
			}
		} catch (e) {
			log.error('隱藏所有實驗積木提示時發生錯誤:', e);
		}
	},
};

/**
 * 註冊一個積木為實驗性質
 * @param {string} blockType - 積木類型名稱
 */
window.registerExperimentalBlock = function (blockType) {
	if (blockType && !window.potentialExperimentalBlocks.includes(blockType)) {
		// 將積木類型添加到潛在實驗積木清單
		window.potentialExperimentalBlocks.push(blockType);
		log.info(`[實驗積木] ✅ 已註冊新的潛在實驗性積木: ${blockType}`);
	} else if (blockType && window.potentialExperimentalBlocks.includes(blockType)) {
		// 已經註冊過的積木
		log.info(`[實驗積木] ⚠️ 積木 ${blockType} 已經是潛在實驗性積木，跳過重複註冊`);
	} else {
		// 無效的積木類型
		log.warn(`[實驗積木] ❌ 嘗試註冊無效的實驗性積木: ${blockType}`);
	}
};

/**
 * 從實驗積木清單中移除積木
 * @param {string} blockType - 積木類型名稱
 */
window.unregisterExperimentalBlock = function (blockType) {
	if (blockType && window.experimentalBlocks.includes(blockType)) {
		// 從清單中移除指定積木類型
		const index = window.experimentalBlocks.indexOf(blockType);
		window.experimentalBlocks.splice(index, 1);
		log.info(`[實驗積木] 🗑️ 已從實驗性積木清單移除: ${blockType}`);

		// 移除後立即輸出更新的清單
		log.info('[實驗積木] 實驗積木移除後清單更新 >>>>>>');
		logExperimentalBlocks();
		log.info('[實驗積木] 實驗積木移除後清單更新 <<<<<<');
		return true;
	} else if (blockType) {
		// 清單中沒有這個積木
		log.info(`[實驗積木] ⚠️ 積木 ${blockType} 不在實驗性積木清單中，無需移除`);
	} else {
		// 無效的積木類型
		log.warn(`[實驗積木] ❌ 嘗試移除無效的實驗性積木: ${blockType}`);
	}
	return false;
};

// 輸出實驗積木清單供檢查
function logExperimentalBlocks() {
	if (window.experimentalBlocks && window.experimentalBlocks.length > 0) {
		// 產生目前實驗積木清單的JSON字串
		const currentJson = JSON.stringify(window.experimentalBlocks);

		// 每次都輸出實驗積木清單，加上時間戳以便追蹤
		const now = new Date();
		const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
		log.info(`[實驗積木] [${timestamp}] 當前的實驗性積木清單: ${currentJson}`);

		// 檢查實驗積木清單是否有變化
		if (currentJson !== lastExperimentalBlocksJson) {
			log.info(`[實驗積木] 實驗積木清單已更新! 之前: ${lastExperimentalBlocksJson || '(無)'}`);
			lastExperimentalBlocksJson = currentJson;
		} else {
			// 即使沒有變化也輸出一條訊息
			log.info(`[實驗積木] 實驗積木清單沒有變化，保持 ${currentJson.length} 個積木`);
		}
	} else {
		log.info('[實驗積木] 當前無實驗性積木註冊');
	}
}

/**
 * 更新實驗積木清單，確保所有潛在實驗積木都被加入到清單中
 * 檢查工作區和工具箱中的積木，將潛在實驗積木添加到實際的實驗積木清單中
 * 不移除已經存在的實驗積木，即使它們不在當前工作區中
 * @param {Blockly.Workspace} workspace - 當前工作區
 */
window.updateExperimentalBlocksList = function (workspace) {
	if (!workspace) {
		return;
	}

	// 獲取當前工作區中所有積木類型的清單
	const currentBlockTypes = new Set();
	const allBlocks = workspace.getAllBlocks(false);
	allBlocks.forEach(block => {
		if (block && block.type) {
			currentBlockTypes.add(block.type);
		}
	});

	// 檢查所有潛在實驗積木，包括工具箱和工作區中的積木
	// 不再移除不在工作區中的實驗積木，以保留完整的實驗積木記錄
	const blocksToAdd = [];

	// 1. 檢查工作區中的積木，將潛在實驗積木添加到實際的實驗積木清單中
	currentBlockTypes.forEach(blockType => {
		// 檢查是否是潛在實驗積木
		if (window.potentialExperimentalBlocks.includes(blockType)) {
			// 檢查是否已經在實驗積木清單中
			if (!window.experimentalBlocks.includes(blockType)) {
				blocksToAdd.push(blockType);
			}
		}
	});

	// 2. 添加新發現的實驗積木
	if (blocksToAdd.length > 0) {
		log.info(`[實驗積木] 檢測到工作區中有 ${blocksToAdd.length} 個新的實驗積木需要添加到清單`);

		blocksToAdd.forEach(blockType => {
			// 直接添加到實驗積木清單，不調用 registerExperimentalBlock 避免循環
			if (!window.experimentalBlocks.includes(blockType)) {
				window.experimentalBlocks.push(blockType);
				log.info(`[實驗積木] ✅ 從工作區添加實驗性積木到清單: ${blockType}`);
			}
		});

		// 添加後輸出更新的清單
		log.info('[實驗積木] 從工作區添加實驗積木後清單更新 >>>>>>');
		logExperimentalBlocks();
		log.info('[實驗積木] 從工作區添加實驗積木後清單更新 <<<<<<');
	}
};

// 收集工具箱中的實驗積木，添加到實驗積木清單，並立即標記這些積木
window.collectExperimentalBlocksFromFlyout = function () {
	if (!Blockly || !Blockly.getMainWorkspace() || !Blockly.getMainWorkspace().getFlyout) {
		return;
	}

	try {
		// 嘗試獲取工作區的飛出面板（工具箱）
		const flyout = Blockly.getMainWorkspace().getFlyout();
		if (!flyout) {
			return;
		}

		// 獲取飛出面板中的所有積木
		const flyoutBlocks = flyout.getWorkspace().getAllBlocks(false);
		if (!flyoutBlocks || flyoutBlocks.length === 0) {
			return;
		}

		log.info(`[實驗積木] 檢測到工具箱中有 ${flyoutBlocks.length} 個積木，開始檢查實驗積木`);

		// 收集工具箱中的積木類型
		const flyoutBlockTypes = new Set();
		const experimentalFlyoutBlocks = []; // 用於收集工具箱中的實驗積木實例

		flyoutBlocks.forEach(block => {
			if (block && block.type) {
				flyoutBlockTypes.add(block.type);

				// 檢查是否是潛在實驗積木
				if (window.potentialExperimentalBlocks.includes(block.type)) {
					experimentalFlyoutBlocks.push(block);
				}
			}
		});

		// 檢查工具箱中是否有潛在實驗積木
		const blocksToAdd = [];
		flyoutBlockTypes.forEach(blockType => {
			// 檢查是否是潛在實驗積木
			if (window.potentialExperimentalBlocks.includes(blockType)) {
				// 檢查是否已經在實驗積木清單中
				if (!window.experimentalBlocks.includes(blockType)) {
					blocksToAdd.push(blockType);
				}
			}
		});

		// 添加工具箱中的實驗積木
		if (blocksToAdd.length > 0) {
			log.info(`[實驗積木] 檢測到工具箱中有 ${blocksToAdd.length} 個新的實驗積木需要添加到清單`);

			blocksToAdd.forEach(blockType => {
				if (!window.experimentalBlocks.includes(blockType)) {
					window.experimentalBlocks.push(blockType);
					log.info(`[實驗積木] ✅ 從工具箱添加實驗性積木到清單: ${blockType}`);
				}
			});

			// 添加後輸出更新的清單
			log.info('[實驗積木] 從工具箱添加實驗積木後清單更新 >>>>>>');
			logExperimentalBlocks();
			log.info('[實驗積木] 從工具箱添加實驗積木後清單更新 <<<<<<');
		} else {
			log.info(`[實驗積木] 工具箱中沒有新的實驗積木需要添加`);
		}

		// 立即標記工具箱中的實驗積木
		if (experimentalFlyoutBlocks.length > 0 && window.experimentalBlockMarker) {
			log.info(`[實驗積木] 開始標記工具箱中的 ${experimentalFlyoutBlocks.length} 個實驗性積木`);

			experimentalFlyoutBlocks.forEach(block => {
				const blockSvg = block.getSvgRoot();
				if (blockSvg) {
					window.experimentalBlockMarker.markExperimentalBlock(blockSvg, block);
					log.info(`[實驗積木] 已標記工具箱中的實驗性積木: ${block.type}, id: ${block.id}`);
				}
			});
		}
	} catch (err) {
		log.warn(`[實驗積木] 收集工具箱實驗積木時發生錯誤: ${err}`);
	}
};

/**
 * 實驗性積木標記管理器
 * 為實驗性積木添加視覺標記，並管理其顯示和交互
 */
class ExperimentalBlockMarker {
	/**
	 * 初始化實驗性積木標記管理器
	 */
	constructor() {
		this.markedBlocks = new Set(); // 追蹤已標記的積木ID
		log.info('[實驗積木] 實驗性積木標記管理器已初始化');
	}
	/**
	 * 為實驗性積木添加標記
	 * @param {Element} blockSvg - 積木的SVG元素
	 * @param {Object} block - Blockly積木實例
	 */
	markExperimentalBlock(blockSvg, block) {
		if (!blockSvg || !block || !block.id || this.markedBlocks.has(block.id)) {
			log.info(`[實驗積木] 跳過標記 - 無效參數或已標記: ${block ? block.type : 'unknown'}, id: ${block ? block.id : 'unknown'}`);
			return; // 如果已經標記過或參數無效，直接返回
		}

		// 添加特殊樣式到積木本身，使用流動的黃色虛線邊框
		try {
			const pathElement = blockSvg.querySelector('.blocklyPath');
			if (pathElement) {
				pathElement.classList.add('blockly-experimental-block');
				log.info(`[實驗積木] 成功添加虛線動畫效果到積木: ${block.type}, id: ${block.id}`);
			} else {
				log.info(`[實驗積木] 找不到積木路徑元素: ${block.type}, id: ${block.id}`);
			}
		} catch (e) {
			log.info(`[實驗積木] 無法修改積木路徑樣式: ${e}`);
		}

		// 記錄此積木已被標記
		this.markedBlocks.add(block.id);

		log.info(`[實驗積木] 已標記實驗性積木: ${block.type}, id: ${block.id}`);
	}
	/**
	 * 檢查並標記實驗性積木
	 * 此方法會在工作區和工具箱中查找所有積木，並為實驗性積木添加標記
	 */
	markAllExperimentalBlocks() {
		if (!window.experimentalBlocks || !Array.isArray(window.experimentalBlocks)) {
			log.info('[實驗積木] 實驗積木清單不存在或不是陣列', window.experimentalBlocks);
			return;
		}

		const workspace = Blockly.getMainWorkspace();
		if (!workspace) {
			log.info('[實驗積木] 工作區不存在');
			return;
		}

		// 日誌記錄實驗積木清單
		log.info('[實驗積木] 實驗積木清單', window.experimentalBlocks);

		// 獲取工作區中的所有積木
		const allBlocks = workspace.getAllBlocks(false);
		log.info(`[實驗積木] 工作區內積木總數: ${allBlocks.length}`);
		// 為工作區中的每個實驗性積木添加標記
		let experimentalCount = 0;
		allBlocks.forEach(block => {
			if (window.experimentalBlocks.includes(block.type)) {
				experimentalCount++;
				const blockSvg = block.getSvgRoot();
				if (blockSvg) {
					this.markExperimentalBlock(blockSvg, block);
				} else {
					log.info(`[實驗積木] 無法獲取積木SVG: ${block.type}, id: ${block.id}`);
				}
			}
		});
		// 如果發現實驗積木，顯示適當的通知
		if (experimentalCount > 0 && window.experimentalBlocksNotice && !window.isPreviewMode) {
			log.info(`[實驗積木] 檢測到 ${experimentalCount} 個實驗性積木，顯示通知`);
			// 根據是否已經顯示過通知來決定顯示方式
			if (window.experimentalBlocksNotice.hasShownNotice) {
				window.experimentalBlocksNotice.showIndicator();
			} else {
				window.experimentalBlocksNotice.showFullNotice();
			}
		}

		// 獲取工具箱中的實驗性積木
		try {
			// 嘗試獲取工作區的飛出面板（工具箱）
			const flyout = workspace.getFlyout();
			if (flyout) {
				const flyoutBlocks = flyout.getWorkspace().getAllBlocks(false);
				log.info(`[實驗積木] 工具箱內積木總數: ${flyoutBlocks.length}`);

				// 為工具箱中的每個實驗性積木添加標記
				let flyoutExperimentalCount = 0;
				flyoutBlocks.forEach(block => {
					if (window.experimentalBlocks.includes(block.type)) {
						flyoutExperimentalCount++;
						const blockSvg = block.getSvgRoot();
						if (blockSvg) {
							this.markExperimentalBlock(blockSvg, block);
						} else {
							log.info(`[實驗積木] 無法獲取工具箱積木SVG: ${block.type}, id: ${block.id}`);
						}
					}
				});

				log.info(`[實驗積木] 檢測到 ${flyoutExperimentalCount} 個工具箱中的實驗性積木`);
				experimentalCount += flyoutExperimentalCount;
			}
		} catch (err) {
			log.warn(`[實驗積木] 處理工具箱積木時發生錯誤: ${err}`);
		}

		log.info(`[實驗積木] 總共檢測到 ${experimentalCount} 個實驗性積木`);
	}
	/**
	 * 清除積木標記
	 * 當不再需要標記或需要刷新標記時調用
	 */
	clearMarks() {
		// 移除積木路徑上的標記樣式
		const paths = document.querySelectorAll('.blockly-experimental-block');
		paths.forEach(path => {
			path.classList.remove('blockly-experimental-block');
		});

		this.markedBlocks.clear();
	}
	/**
	 * 刷新所有積木標記
	 * 當積木狀態變更時調用，先清除所有標記，然後重新添加
	 */
	refreshMarks() {
		log.info('[實驗積木] 刷新所有積木標記');
		this.clearMarks();

		// 獲取工作區中所有積木
		const workspace = Blockly.getMainWorkspace();
		const hasExperimentalBlocks = this.markAllExperimentalBlocks();

		// 如果工作區中沒有實驗積木，檢查是否需要隱藏通知
		if (!hasExperimentalBlocks && window.experimentalBlocksNotice) {
			// 檢查工作區中是否還有實驗積木
			if (workspace) {
				const blocks = workspace.getAllBlocks();
				const hasWorkspaceExperimentalBlock = blocks.some(block => window.experimentalBlocks.includes(block.type));
				if (!hasWorkspaceExperimentalBlock) {
					log.info('[實驗積木] 工作區中沒有實驗積木，隱藏所有提示');
					if (!window.isPreviewMode) {
						window.experimentalBlocksNotice.hideAll();
					}
				}
			}
		} else {
			// 確保通知狀態與工作區實驗積木狀態一致
			if (window.experimentalBlocksNotice && !window.isPreviewMode) {
				window.experimentalBlocksNotice.checkAndShow();
			}
		}

		// 特殊處理工具箱中的實驗積木
		try {
			// 嘗試重新收集並標記工具箱中的實驗積木
			if (typeof window.collectExperimentalBlocksFromFlyout === 'function') {
				setTimeout(() => {
					window.collectExperimentalBlocksFromFlyout();
				}, 100);
			}
		} catch (err) {
			log.warn(`[實驗積木] 刷新工具箱中的積木標記時發生錯誤: ${err}`);
		}
	}
}

// 確保只有一個通知系統初始化
let noticeSystemInitialized = false;

// 當文檔載入完成後初始化 - 統一的初始化入口
document.addEventListener('DOMContentLoaded', () => {
	console.log('[實驗積木] DOMContentLoaded 事件觸發，開始初始化');

	// 輸出當前環境信息
	console.log('[實驗積木] 初始化時環境檢查:', {
		experimentalBlocksExists: typeof window.experimentalBlocks !== 'undefined',
		experimentalBlocksIsArray: Array.isArray(window.experimentalBlocks),
		experimentalBlocksLength: window.experimentalBlocks ? window.experimentalBlocks.length : 0,
		blocklyExists: typeof Blockly !== 'undefined',
		workspaceExists: typeof Blockly !== 'undefined' && Blockly.getMainWorkspace() !== null,
		cssLoaded: document.styleSheets.length,
	});
	// 確保實驗積木通知系統只初始化一次
	if (!noticeSystemInitialized && window.experimentalBlocksNotice) {
		// 檢查是否在預覽模式，預覽模式下不需要通知系統
		if (window.isPreviewMode) {
			log.info('[實驗積木] 預覽模式下跳過通知系統初始化');
			noticeSystemInitialized = true; // 標記為已初始化，避免重複檢查
		} else {
			window.experimentalBlocksNotice.init();
			noticeSystemInitialized = true;
			log.info('[實驗積木] 通知系統已初始化成功');

			// 檢查DOM中是否存在指示器元素
			const indicatorElement = document.getElementById('experimentalBlocksIndicator');
			log.info('[實驗積木] 指示器元素檢查', {
				exists: indicatorElement ? true : false,
				id: indicatorElement ? indicatorElement.id : 'missing',
				classes: indicatorElement ? indicatorElement.className : 'N/A',
			});
		}
	}

	// 創建實驗性積木標記管理器實例
	if (!window.experimentalBlockMarker) {
		window.experimentalBlockMarker = new ExperimentalBlockMarker();
	}

	// 如果Blockly已經載入，初始化標記
	if (typeof Blockly !== 'undefined') {
		// 初始延遲標記
		setTimeout(() => {
			log.info('[實驗積木] 延遲初始化標記開始');
			window.experimentalBlockMarker.markAllExperimentalBlocks();

			// 監聽Blockly工具箱打開事件
			try {
				if (Blockly.getMainWorkspace() && Blockly.getMainWorkspace().toolbox_) {
					const toolbox = Blockly.getMainWorkspace().toolbox_;

					// 監聽工具箱飛出窗口展開事件
					if (typeof Blockly.Events.listen === 'function') {
						log.info('[實驗積木] 開始監聽工具箱飛出窗口事件');

						// 覆寫Blockly.Flyout.prototype.show方法
						const originalFlyoutShow = Blockly.Flyout.prototype.show;
						if (originalFlyoutShow) {
							Blockly.Flyout.prototype.show = function (flyoutContents) {
								// 呼叫原來的方法
								const result = originalFlyoutShow.call(this, flyoutContents);

								// 在飛出窗口顯示後，延遲執行收集和標記操作
								setTimeout(() => {
									log.info('[實驗積木] 檢測到工具箱飛出窗口打開，嘗試收集和標記實驗積木');
									if (typeof window.collectExperimentalBlocksFromFlyout === 'function') {
										window.collectExperimentalBlocksFromFlyout();
									}
								}, 200);

								return result;
							};
							log.info('[實驗積木] 已覆寫工具箱飛出窗口顯示方法');
						}
					}
				}
			} catch (err) {
				log.warn('[實驗積木] 設置工具箱事件監聽失敗:', err);
			}
		}, 800);
	} else {
		log.info('[實驗積木] Blockly 尚未載入，等待載入後再初始化');

		// 如果Blockly尚未載入，設置定時器每500毫秒檢查一次
		const checkInterval = setInterval(() => {
			if (typeof Blockly !== 'undefined' && Blockly.getMainWorkspace()) {
				clearInterval(checkInterval);
				log.info('[實驗積木] Blockly 現在已載入，開始初始化標記');
				window.experimentalBlockMarker.markAllExperimentalBlocks();
				// 檢查工作區實驗積木狀態
				window.checkWorkspaceExperimentalBlocksStatus();
			}
		}, 500);
	}

	// 添加監聽Blockly工具箱創建和打開事件
	// 使用 MutationObserver 監聽工具箱相關DOM變化
	if (typeof MutationObserver !== 'undefined') {
		setTimeout(() => {
			const observer = new MutationObserver(mutations => {
				// 檢查是否有新添加的工具箱相關DOM元素
				mutations.forEach(mutation => {
					if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
						// 檢查新添加的節點中是否有工具箱元素
						Array.from(mutation.addedNodes).forEach(node => {
							if (node.nodeType === Node.ELEMENT_NODE) {
								// 檢查工具箱飛出元素 (blocklyFlyout)
								const flyoutElement = node.querySelector('.blocklyFlyout');
								if (flyoutElement) {
									log.info(`[實驗積木] 檢測到工具箱飛出元素創建，嘗試收集和標記實驗積木`);

									// 延遲執行以確保飛出窗口已完全渲染
									setTimeout(() => {
										// 收集工具箱中的實驗積木
										if (typeof window.collectExperimentalBlocksFromFlyout === 'function') {
											window.collectExperimentalBlocksFromFlyout();
										}

										// 刷新所有實驗積木標記
										if (window.experimentalBlockMarker) {
											window.experimentalBlockMarker.refreshMarks();
										}
									}, 300);
								}
							}
						});
					}
				});
			});

			// 開始觀察整個document，包括子樹變化
			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});

			log.info(`[實驗積木] 已設置DOM變化觀察器，用於監控工具箱創建`);
		}, 500);
	}

	// 在統一初始化中設置其他所需的監聽器和方法覆寫
	setupAdditionalListeners();
});

// 當語言變更時更新工具提示
window.addEventListener('languageChanged', () => {
	if (window.experimentalBlockMarker) {
		window.experimentalBlockMarker.refreshMarks();
	}
});

// 設置額外的監聽器和方法覆寫
function setupAdditionalListeners() {
	// 監聽工作區變化事件，更新實驗性積木標記
	if (typeof Blockly !== 'undefined') {
		const originalBlockSvgInit = Blockly.BlockSvg.prototype.initSvg;
		Blockly.BlockSvg.prototype.initSvg = function () {
			// 調用原始方法
			originalBlockSvgInit.call(this);

			// 如果是實驗性積木，添加標記
			if (window.experimentalBlocks && window.experimentalBlocks.includes(this.type) && window.experimentalBlockMarker) {
				setTimeout(() => {
					window.experimentalBlockMarker.markExperimentalBlock(this.getSvgRoot(), this);
				}, 50);
			}
		};
	}

	// 監聽工具箱類別變更，確保收集並標記所有可能的實驗積木
	if (typeof Blockly !== 'undefined') {
		// 保存原始的 ToolboxCategory.prototype.setSelected 方法
		const originalSetSelected = Blockly.ToolboxCategory.prototype.setSelected;

		// 覆寫 setSelected 方法，在類別選擇變更時收集實驗積木
		Blockly.ToolboxCategory.prototype.setSelected = function (selected) {
			// 調用原始方法
			originalSetSelected.call(this, selected);

			// 如果類別被選中，嘗試收集該類別中的實驗積木並立即標記
			if (selected && typeof window.collectExperimentalBlocksFromFlyout === 'function') {
				// 延遲執行，確保飛出窗口已完全渲染
				setTimeout(() => {
					log.info(`[實驗積木] 工具箱類別 "${this.name_}" 被選中，檢查實驗積木`);
					window.collectExperimentalBlocksFromFlyout();

					// 刷新所有實驗積木的標記，確保新打開的類別中的實驗積木被正確標記
					if (window.experimentalBlockMarker) {
						log.info(`[實驗積木] 刷新所有實驗積木標記`);
						window.experimentalBlockMarker.refreshMarks();
					}
				}, 300);
			}
		};
	}

	// 在 Blockly 工作區載入後設置事件監聽
	setupBlocklyChangeListener();
}

// 當工作區變化時更新標記
function setupBlocklyChangeListener() {
	if (typeof Blockly === 'undefined' || !Blockly.getMainWorkspace()) {
		// 如果 Blockly 還沒載入，等待一段時間後再嘗試
		setTimeout(setupBlocklyChangeListener, 200);
		return;
	}

	Blockly.getMainWorkspace().addChangeListener(event => {
		// 當積木類型變更或積木創建/刪除時，更新標記
		if (
			(event.type === Blockly.Events.BLOCK_CHANGE ||
				event.type === Blockly.Events.BLOCK_CREATE ||
				event.type === Blockly.Events.BLOCK_DELETE) &&
			window.experimentalBlockMarker
		) {
			// 使用防抖動技術避免過多刷新
			if (window.experimentalMarkerTimeout) {
				clearTimeout(window.experimentalMarkerTimeout);
			}

			window.experimentalMarkerTimeout = setTimeout(() => {
				// 刷新所有實驗積木標記
				window.experimentalBlockMarker.refreshMarks();

				// 特別處理 BLOCK_DELETE 事件，檢查是否還有實驗積木
				if (event.type === Blockly.Events.BLOCK_DELETE) {
					// 檢查工作區中是否還有實驗積木
					const workspace = Blockly.getMainWorkspace();
					if (workspace) {
						const blocks = workspace.getAllBlocks();
						const hasExperimentalBlock = blocks.some(block => window.experimentalBlocks.includes(block.type));
						if (!hasExperimentalBlock && window.experimentalBlocksNotice && !window.isPreviewMode) {
							log.info('[實驗積木] BLOCK_DELETE 事件後檢查：工作區中沒有實驗積木，隱藏所有提示');
							window.experimentalBlocksNotice.hideAll();
						}
					}
				}
			}, 200);
		}
	});
}
