# 錯誤修復規格

> 整合自 specs/014-block-serialization-fix 與 specs/016-esp32-wifi-mqtt（Bug 修復部分）

## 概述

本文件記錄專案開發過程中發現並修復的重大錯誤。

---

## 1. Blockly 積木序列化修復（014）

### 問題描述

**症狀**：

- 連接的 value block（如 `encoder_read`）保存後變成獨立積木
- 程式碼生成到 `loop()` 函數外面
- Arduino 編譯失敗

**根本原因**：
Blockly 12.x 使用 **JSON 序列化系統**，但專案中多個積木只實作了**舊式 XML 序列化 hooks**。

### 技術背景

Blockly 序列化優先級：

1. **JSON 系統**（優先）：`saveExtraState` / `loadExtraState`
2. **XML 系統**（fallback）：`mutationToDom` / `domToMutation`

當積木只有 XML hooks 時，JSON 序列化無法正確處理 mutation 資料。

### 修復範圍

**本次修復**（5 個積木）：
| 積木 | 檔案 |
|------|------|
| `encoder_setup` | motors.js |
| `encoder_read` | motors.js |
| `encoder_reset` | motors.js |
| `encoder_pid_setup` | motors.js |
| `encoder_pid_compute` | motors.js |

**未來修復**（下一階段）：

- `servo_move`, `servo_stop`
- `arduino_function`, `arduino_function_call`
- `threshold_function_read`

### 修復策略

#### 1. 新增 JSON 序列化 hooks

```javascript
Blockly.Blocks['encoder_read'] = {
	init: function () {
		/* ... */
	},

	// 新增：JSON 序列化（Blockly 12 優先使用）
	saveExtraState: function () {
		return {
			encoder: this.getFieldValue('ENCODER'),
		};
	},

	loadExtraState: function (state) {
		this.setFieldValue(state.encoder || 'myEncoder', 'ENCODER');
		this.updateShape_();
	},

	// 保留：XML 序列化（向後相容）
	mutationToDom: function () {
		const container = Blockly.utils.xml.createElement('mutation');
		container.setAttribute('encoder', this.getFieldValue('ENCODER'));
		return container;
	},

	domToMutation: function (xmlElement) {
		const encoder = xmlElement.getAttribute('encoder') || 'myEncoder';
		this.setFieldValue(encoder, 'ENCODER');
		this.updateShape_();
	},
};
```

#### 2. 裸露表達式防護

實作 `scrubNakedValue` 方法，將獨立 value block 轉為註解：

```javascript
// generators/arduino/arduino.js
arduinoGenerator.scrubNakedValue = function (line) {
	// 將裸露表達式轉為註解
	return '// 未連接的表達式: ' + line + '\n';
};
```

**效果**：

```cpp
// Before（編譯失敗）
void loop() {
}
myEncoder.getCount()  // 裸露表達式

// After（安全）
void loop() {
}
// 未連接的表達式: myEncoder.getCount()
```

### 驗收標準

1. ✅ `encoder_read` 連接保存後 100% 正確保持
2. ✅ 5 個 encoder 積木全部實作 JSON hooks
3. ✅ 舊版 main.json 100% 向後相容
4. ✅ 獨立 value block 不產生裸露表達式
5. ✅ Undo/Redo 正常運作

---

## 2. 視角重置修復（016）

### 問題描述

**症狀**：刪除積木時，工作區視角自動跳轉或重新置中

**影響**：嚴重影響使用體驗，每次刪除都需重新導航

### 修復策略

使用 debounce 機制保存並恢復視角：

```javascript
// blocklyEdit.js
let deleteViewportSave = null;
let deleteViewportTimer = null;

workspace.addChangeListener(function (event) {
	if (event.type === Blockly.Events.BLOCK_DELETE) {
		// 第一次刪除時保存視角
		if (!deleteViewportSave) {
			deleteViewportSave = {
				scrollX: workspace.scrollX,
				scrollY: workspace.scrollY,
				scale: workspace.scale,
			};
		}

		// 重置 debounce 計時器
		clearTimeout(deleteViewportTimer);
		deleteViewportTimer = setTimeout(() => {
			// 50ms 後恢復視角
			workspace.scroll(deleteViewportSave.scrollX, deleteViewportSave.scrollY);
			workspace.setScale(deleteViewportSave.scale);
			deleteViewportSave = null;
		}, 50);
	}
});
```

### 驗收標準

1. ✅ 刪除積木後視角座標變化量為 0
2. ✅ 批次刪除時只恢復一次（debounce 生效）

---

## 3. text_join 型態轉換修復（016）

### 問題描述

**症狀**：`text_join` 串接字串與數字時產生 C++ 指標運算錯誤

**原因**：直接使用 `+` 運算子，C++ 將字串字面值視為 `char*` 指標

```cpp
// 錯誤輸出
"Count: " + 42  // 指標運算，非字串串接！

// 正確輸出
String("Count: ") + String(42)
```

### 修復策略

```javascript
// generators/arduino/text.js
arduinoGenerator.forBlock['text_join'] = function (block) {
	const items = [];

	for (let i = 0; i < block.itemCount_; i++) {
		const item = arduinoGenerator.valueToCode(block, 'ADD' + i, arduinoGenerator.ORDER_NONE) || '""';
		// 每項包裝為 String()
		items.push('String(' + item + ')');
	}

	if (items.length === 0) {
		return ['String("")', arduinoGenerator.ORDER_ATOMIC];
	}

	return [items.join(' + '), arduinoGenerator.ORDER_ADDITIVE];
};
```

**生成結果**：

```cpp
String result = String("Count: ") + String(42) + String(" items");
```

### 驗收標準

1. ✅ 串接字串與數字時 Arduino 編譯通過
2. ✅ 執行結果正確
3. ✅ 空輸入生成 `String("")`

---

---

## 4. January 2026 Bugfix 批次修復（031）

> 來源：spec/031-bugfix-batch-jan（2026-01）

### 4.1 多個主程式積木可刪除

**問題**：使用者意外複製或從舊專案載入多個 `micropython_main` / `arduino_setup_loop` 積木後，無法刪除多餘積木，導致整個工作區卡住。

**修復**：移除對主程式積木的硬性刪除防護，改為「工作區至少保留一個」的軟性限制：

- 工作區只剩 1 個主程式積木時，刪除選項變灰 / 不可操作
- 工具箱中的主程式積木：已有 1 個時不允許再拖曳（工具箱條目變灰）

### 4.2 備份預覽 URI 修復

**問題**：點擊備份預覽按鈕時，因 URI 格式錯誤，`blocklyPreview.html` 無法正確開啟或載入備份內容。

**修復**：對備份檔案路徑使用 `webview.asWebviewUri()` 轉換，確保路徑包含特殊字元或空格時仍能正確載入。

### 4.3 還原前自動備份

**問題**：還原備份時未自動備份當前進度，若還原錯誤則當前工作永久遺失。

**修復**：執行還原操作前，先建立 `blockly/backup/auto_restore_YYYYMMDD_HHMMSS.json` 自動備份。若當前 `main.json` 不存在則跳過此步驟。

### 4.4 迴圈積木翻譯鍵修復

**問題**：切換語言至英文後，while/repeat 積木中的 "do" 仍顯示中文「執行」，原因是缺少 `CONTROLS_REPEAT_INPUT_DO` 翻譯鍵。

**修復**：在所有 15 種語言的 `messages.js` 中補齊 `CONTROLS_REPEAT_INPUT_DO` 鍵值。

---

## 5. MicroPython Print 換行修復（039）

> 來源：spec/039-fix-print-newline（2026-02）

### 問題描述

**症狀**：CyberBrick `cyberbrick_print` 積木無論是否勾選「換行」checkbox，生成的 MicroPython 程式碼均為 `print(msg)`，換行控制功能完全失效。

**根本原因**：MicroPython 生成器未讀取 `NEW_LINE` checkbox 欄位值。

### 修復策略

```javascript
// generators/micropython/text.js
micropythonGenerator.forBlock['text_print'] = function (block) {
	const msg = micropythonGenerator.valueToCode(block, 'TEXT', micropythonGenerator.ORDER_NONE) || '""';
	const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

	if (newLine) {
		return `print(${msg})\n`; // 換行（Python 預設行為）
	} else {
		return `print(${msg}, end='')\n`; // 不換行
	}
};
```

**與 Arduino 版本對照**：

| 狀態       | Arduino               | MicroPython          |
| ---------- | --------------------- | -------------------- |
| 勾選換行   | `Serial.println(msg)` | `print(msg)`         |
| 未勾選換行 | `Serial.print(msg)`   | `print(msg, end='')` |

### 驗收標準

1. ✅ 勾選換行：生成 `print(msg)`
2. ✅ 未勾選換行：生成 `print(msg, end='')`
3. ✅ 預設值：從工具箱拖曳積木時，換行 checkbox 預設為勾選
4. ✅ 單元測試涵蓋兩種狀態，整體覆蓋率維持 90%+

---

## 修復歷史總結

| 規格 | 問題                 | 影響             | 狀態    |
| ---- | -------------------- | ---------------- | ------- |
| 014  | JSON 序列化          | 積木連接丟失     | ✅ 完成 |
| 014  | 裸露表達式           | 編譯失敗         | ✅ 完成 |
| 016  | 視角重置             | 使用體驗差       | ✅ 完成 |
| 016  | text_join 型態       | 執行結果錯誤     | ✅ 完成 |
| 031  | 多主程式積木         | 工作區卡住       | ✅ 完成 |
| 031  | 備份預覽 URI         | 預覽失效         | ✅ 完成 |
| 031  | 還原無自動備份       | 資料可能遺失     | ✅ 完成 |
| 031  | 缺少翻譯鍵           | 介面顯示錯誤     | ✅ 完成 |
| 039  | MicroPython 換行控制 | 輸出格式無法控制 | ✅ 完成 |

---

## 相關文件

- 積木定義：`media/blockly/blocks/motors.js`
- 程式碼生成：`media/blockly/generators/arduino/`
- MicroPython 生成器：`media/blockly/generators/micropython/text.js`
