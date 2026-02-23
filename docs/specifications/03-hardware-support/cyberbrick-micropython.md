# CyberBrick MicroPython 支援

> 整合自 specs/021-cyberbrick-micropython 與 specs/022-micropython-custom-function

## 概述

**目標**：為 SingularBlockly 新增 CyberBrick (ESP32-C3) 主板支援，使用 MicroPython 語言與 mpremote 工具實現一鍵上傳

**狀態**：✅ 完成

---

## 主板規格

| 屬性     | 值                |
| -------- | ----------------- |
| 晶片     | ESP32-C3          |
| 語言     | MicroPython       |
| 上傳工具 | mpremote          |
| 程式入口 | `/app/rc_main.py` |
| 板載 LED | NeoPixel (GPIO 8) |

---

## 核心功能

### 1. 主板選擇與工具箱切換

選擇 CyberBrick 時，工具箱自動切換為 MicroPython 積木（隱藏 Arduino/C++ 積木）。

**相關檔案**：

- `media/toolbox/cyberbrick.json` - CyberBrick 專用工具箱
- `src/types/arduino.ts` - `getBoardLanguage()` 函數

### 2. 一鍵上傳流程

```
使用者點擊上傳 → mpremote reset → soft-reset → 上傳 rc_main.py → 重啟執行
```

**實作**：`src/services/micropythonUploader.ts`

### 3. 主板切換保護

從 Arduino 切換到 CyberBrick（或反向）時：

1. 使用 Ctrl+S 備份機制自動儲存當前工作區
2. 顯示確認對話框
3. 清空工作區並更新工具箱

---

## 積木類別

### Core 積木 (cyberbrick_core)

| 積木                       | 用途           | 生成程式碼                                        |
| -------------------------- | -------------- | ------------------------------------------------- |
| `cyberbrick_main`          | 主程式進入點   | `async def main(): ...`                           |
| `cyberbrick_led_set_color` | 設定板載 LED   | `onboard_led[0] = (r, g, b); onboard_led.write()` |
| `cyberbrick_led_off`       | 關閉板載 LED   | `onboard_led[0] = (0, 0, 0); onboard_led.write()` |
| `cyberbrick_delay_ms`      | 毫秒延遲       | `await asyncio.sleep_ms(ms)`                      |
| `cyberbrick_delay_s`       | 秒延遲         | `await asyncio.sleep(s)`                          |
| `cyberbrick_ticks_ms`      | 取得目前毫秒數 | `time.ticks_ms()`                                 |
| `cyberbrick_ticks_diff`    | 計算時間差     | `time.ticks_diff(now, start)`                     |
| `cyberbrick_print`         | 序列埠輸出     | `print(msg)`                                      |

### WiFi 積木 (cyberbrick_wifi)

| 積木                      | 用途         |
| ------------------------- | ------------ |
| `cyberbrick_wifi_connect` | 連接 WiFi    |
| `cyberbrick_wifi_status`  | 查詢連線狀態 |
| `cyberbrick_wifi_ip`      | 取得 IP 位址 |

---

## MicroPython 自訂函數

### 問題背景

`arduino_function` 積木在 MicroPython 模式下無法生成程式碼。

### 解決方案

新增 `micropythonGenerator.forBlock['arduino_function']` 生成器：

```javascript
micropythonGenerator.forBlock['arduino_function'] = function (block) {
	const funcName = block.getFieldValue('FUNC_NAME');
	const params = getParams(block);
	const statements = generator.statementToCode(block, 'STACK');

	// 生成 async def 函數
	generator.definitions_[`func_${funcName}`] = `async def ${funcName}(${params}):\n${statements || '  pass\n'}`;
	return '';
};
```

**相關檔案**：`media/blockly/generators/micropython/functions.js`

---

## 計時積木穩定版（032、033）

> 來源：spec/032-cyberbrick-time-blocks（2025-12）、spec/033-remove-timer-experimental（2026-01）

### 新增積木

| 積木類型                | 生成碼                  | 說明                                       |
| ----------------------- | ----------------------- | ------------------------------------------ |
| `cyberbrick_ticks_ms`   | `time.ticks_ms()`       | 回傳毫秒級時間戳（由啟動時計起的累計毫秒） |
| `cyberbrick_ticks_diff` | `time.ticks_diff(a, b)` | 計算兩時間戳的差量（處理溢位回繞）         |

兩個積木均需 `import time`，已透過 `generator.addImport()` 自動注入。

### Experimental 標記移除

`cyberbrick_ticks_ms` 和 `cyberbrick_ticks_diff` 從實驗標記（黃色高亮）增为穩定特性：

- `media/css/experimentalBlocks.css` 不再對這兩積木進行樣式覆寫
- `experimentalBlockMarker.js` 不再將其標記為實驗
- 工具箱中顯示檣式渣設計（移除標記樣式）

---

## MicroPython 全域變數提升（034）

> 來源：spec/034-micropython-global-vars（2026-01）

### 問題背景

MicroPython 在函式內無法直接變更全域變數，必須加入 `global var_name` 宣告。Blockly 自動生成器從未微處理此區別。

### 設計導則

| 情境                                         | 處理                                  |
| -------------------------------------------- | ------------------------------------- |
| 在自訂函式內**賭値**全域變數                 | 加入 `global var_name`                |
| 在自訂函式內**只讀取**全域變數               | 不加 `global`（Python 對只讀不需要）  |
| `controls_for` / `controls_forEach` 迴圈變數 | 不加 `global`（迴圈變數不是全域變數） |
| 函式參數與全域變數同名                       | 參數陰藏全域，不加 `global`           |
| 反覆呼叫的函式（async def）                  | 同樣容對全域變數                      |

### 實現方式

```python
# 生成範例：在 my_func() 中賭値 counter
x = 0
counter = 0

async def my_func():
  global counter  # 自動注入，x 未賭値則不加
  counter = counter + 1
```

**源碼位置**：`media/blockly/generators/micropython/micropython.js` 中 `workspaceToCode` 後處理階段，掌變數使用图分析函式中的賭値操作。

---

## 相關文件

- [擴展板積木](cyberbrick-expansion-boards.md) - X11/X12 擴展板
- [統一上傳 UI](../06-features/unified-upload-ui.md) - Arduino/MicroPython 統一介面
