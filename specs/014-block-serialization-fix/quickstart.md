# Quickstart: Blockly 積木 JSON 序列化修復

**Feature Branch**: `014-block-serialization-fix`  
**Created**: 2025-12-11  
**目標讀者**: 實作此功能的開發者

---

## 快速開始

### 前置需求

-   Node.js 22.16.0+
-   VS Code 1.96.0+
-   已安裝專案依賴 (`npm install`)

### 開發環境設置

```powershell
# 1. 切換到功能分支
git checkout 014-block-serialization-fix

# 2. 啟動監看模式
npm run watch

# 3. 按 F5 啟動 Extension Development Host
```

---

## 實作步驟

### 步驟 1: 為 encoder 積木添加 JSON 序列化 hooks

**檔案**: `media/blockly/blocks/motors.js`

為每個 encoder 積木添加 `saveExtraState` 和 `loadExtraState` 方法。以下是 `encoder_read` 的範例：

```javascript
Blockly.Blocks['encoder_read'] = {
	init: function () {
		// 現有初始化程式碼不變
		this.restoredEncoderValue = 'myEncoder';
		// ...
	},

	// ========== 新增 JSON 序列化 hooks ==========

	/**
	 * 保存積木的額外狀態到 JSON
	 * @returns {Object} 可 JSON 序列化的狀態物件
	 */
	saveExtraState: function () {
		return {
			encoder: this.getFieldValue('VAR') || 'myEncoder',
		};
	},

	/**
	 * 從 JSON 還原積木的額外狀態
	 * @param {Object} state - 之前由 saveExtraState 返回的狀態物件
	 */
	loadExtraState: function (state) {
		if (state && state.encoder) {
			this.restoredEncoderValue = state.encoder;
			const field = this.getField('VAR');
			if (field) {
				field.setValue(state.encoder);
			}
		}
	},

	// ========== 保留現有 XML 序列化 hooks（向後相容）==========

	mutationToDom: function () {
		// 現有程式碼不變
	},

	domToMutation: function (xmlElement) {
		// 現有程式碼不變
	},
};
```

### 步驟 2: 實作 scrubNakedValue 防護機制

**檔案**: `media/blockly/generators/arduino/index.js`

在 `window.arduinoGenerator` 定義後添加：

```javascript
/**
 * 處理獨立的 value block（naked value）
 * 將裸露的表達式轉為註釋，避免 C++ 編譯錯誤
 * @param {string} line - 由 value block 生成的程式碼
 * @returns {string} 轉為註釋的程式碼
 */
window.arduinoGenerator.scrubNakedValue = function (line) {
	// 移除首尾空白
	const trimmed = line.trim();

	// 如果是空行，直接返回空字串
	if (!trimmed) {
		return '';
	}

	// 將裸露表達式轉為註釋
	return '// 未連接的表達式: ' + trimmed + '\n';
};
```

### 步驟 3: 需要修改的積木清單

確保以下 5 個積木都添加了 JSON hooks：

| 積木                  | saveExtraState              | loadExtraState                       |
| --------------------- | --------------------------- | ------------------------------------ |
| `encoder_setup`       | `{ useInterrupt: boolean }` | 還原 `useInterruptPins_` 並更新 UI   |
| `encoder_read`        | `{ encoder: string }`       | 還原 `restoredEncoderValue` 和欄位值 |
| `encoder_reset`       | `{ encoder: string }`       | 還原 `restoredEncoderValue` 和欄位值 |
| `encoder_pid_setup`   | `{ encoder: string }`       | 還原 `restoredEncoderValue` 和欄位值 |
| `encoder_pid_compute` | `{ pid: string }`           | 還原 `restoredPIDValue` 和欄位值     |

---

## 測試方法

### 手動測試（必要）

1. **測試序列化**

    - 在工作區建立 `encoder_setup` 積木
    - 將 `encoder_read` 連接到 `text_print` 積木
    - 保存專案（Ctrl+S 或自動保存）
    - 關閉並重新開啟專案
    - ✅ 驗證：`encoder_read` 仍連接在 `text_print` 內部

2. **測試程式碼生成**

    - 建立如上的積木組合
    - 檢查生成的程式碼
    - ✅ 驗證：`Serial.println(myEncoder.getCount());` 出現在正確位置

3. **測試 scrubNakedValue**

    - 故意將 `encoder_read` 獨立放置（不連接到任何積木）
    - 檢查生成的程式碼
    - ✅ 驗證：出現 `// 未連接的表達式: myEncoder.getCount()`

4. **測試向後相容**
    - 準備一個舊版 `main.json`（只有 XML mutation）
    - 載入該檔案
    - ✅ 驗證：積木狀態正確還原

### 自動測試（可選）

如需添加單元測試，建立 `src/test/serialization.test.ts`：

```typescript
import * as assert from 'assert';

suite('Encoder Block Serialization', () => {
	test('saveExtraState returns correct format', () => {
		// 模擬測試邏輯
		const state = { encoder: 'testEncoder' };
		assert.strictEqual(state.encoder, 'testEncoder');
	});
});
```

---

## 常見問題

### Q: 為什麼要同時保留 XML 和 JSON hooks？

向後相容性。舊版 `main.json` 可能包含 XML 格式的 mutation 資料，Blockly 會自動選擇正確的 hook 來處理。

### Q: saveExtraState 應該返回什麼？

返回一個可 JSON 序列化的 JavaScript 物件。通常包含積木的動態配置，如下拉選單的選擇值。

### Q: scrubNakedValue 會影響正常連接的積木嗎？

不會。只有「獨立放置的 value block」（沒有連接到任何積木的輸出塊）才會觸發這個方法。

---

## 相關文件

-   [功能規格](spec.md) - 完整需求說明
-   [研究報告](research.md) - 技術驗證和 API 研究
-   [資料模型](data-model.md) - ExtraState 結構定義
-   [Blockly 官方文件 - Mutators](https://developers.google.com/blockly/guides/create-custom-blocks/mutators)

---

## 檢查清單

完成實作前，確保以下項目都已完成：

-   [ ] `encoder_setup` 添加 `saveExtraState`/`loadExtraState`
-   [ ] `encoder_read` 添加 `saveExtraState`/`loadExtraState`
-   [ ] `encoder_reset` 添加 `saveExtraState`/`loadExtraState`
-   [ ] `encoder_pid_setup` 添加 `saveExtraState`/`loadExtraState`
-   [ ] `encoder_pid_compute` 添加 `saveExtraState`/`loadExtraState`
-   [ ] `arduinoGenerator.scrubNakedValue` 已實作
-   [ ] 手動測試通過（序列化、程式碼生成、向後相容）
-   [ ] 程式碼風格符合 ESLint 規範
