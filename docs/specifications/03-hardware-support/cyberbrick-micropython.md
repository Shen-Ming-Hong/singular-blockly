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

| 積木                       | 用途         | 生成程式碼                                        |
| -------------------------- | ------------ | ------------------------------------------------- |
| `cyberbrick_main`          | 主程式進入點 | `async def main(): ...`                           |
| `cyberbrick_led_set_color` | 設定板載 LED | `onboard_led[0] = (r, g, b); onboard_led.write()` |
| `cyberbrick_led_off`       | 關閉板載 LED | `onboard_led[0] = (0, 0, 0); onboard_led.write()` |
| `cyberbrick_delay_ms`      | 毫秒延遲     | `await asyncio.sleep_ms(ms)`                      |
| `cyberbrick_delay_s`       | 秒延遲       | `await asyncio.sleep(s)`                          |
| `cyberbrick_print`         | 序列埠輸出   | `print(msg)`                                      |

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

## 相關文件

- [擴展板積木](cyberbrick-expansion-boards.md) - X11/X12 擴展板
- [統一上傳 UI](../06-features/unified-upload-ui.md) - Arduino/MicroPython 統一介面
