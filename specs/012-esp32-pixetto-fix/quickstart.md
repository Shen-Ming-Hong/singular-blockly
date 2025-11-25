# Quickstart: ESP32 Pixetto 程式碼生成修正

**功能分支**: `012-esp32-pixetto-fix`  
**預計時間**: 30 分鐘  
**複雜度**: 低

## 概述

修正 Pixetto 智慧鏡頭積木在 ESP32 開發板上生成不必要 SoftwareSerial 引用的問題。

## 快速開始

### 1. 切換到功能分支

```powershell
git checkout 012-esp32-pixetto-fix
```

### 2. 開啟目標檔案

```powershell
code media/blockly/generators/arduino/pixetto.js
```

### 3. 修改 `pixetto_init` generator（第 48-98 行）

參照 `huskylens.js` 第 183-216 行的實作模式：

**修改前**（第 55-57 行）：

```javascript
// 添加 Pixetto 相關函式庫
window.arduinoGenerator.includes_['pixetto'] = '#include <Pixetto.h>';
window.arduinoGenerator.includes_['softwareserial'] = '#include <SoftwareSerial.h>';
```

**修改後**：

```javascript
// 添加 Pixetto 函式庫
window.arduinoGenerator.includes_['pixetto'] = '#include <Pixetto.h>';

// 檢測開發板類型
const currentBoard = window.currentBoard || 'uno';
const isESP32 = currentBoard.includes('esp32');

if (!isESP32) {
	// Arduino AVR 使用 SoftwareSerial
	window.arduinoGenerator.includes_['softwareserial'] = '#include <SoftwareSerial.h>';
}
```

**修改 build_flags 邏輯**（約第 68-72 行）：

**修改前**：

```javascript
const pixettoBuildFlag = '-I"$PROJECT_PACKAGES_DIR/framework-arduino-avr/libraries/SoftwareSerial/src"';
if (!window.arduinoGenerator.build_flags_.includes(pixettoBuildFlag)) {
	window.arduinoGenerator.build_flags_.push(pixettoBuildFlag);
}
```

**修改後**：

```javascript
if (!isESP32) {
	// AVR 專用 build_flags
	const pixettoBuildFlag = '-I"$PROJECT_PACKAGES_DIR/framework-arduino-avr/libraries/SoftwareSerial/src"';
	if (!window.arduinoGenerator.build_flags_.includes(pixettoBuildFlag)) {
		window.arduinoGenerator.build_flags_.push(pixettoBuildFlag);
	}
}
```

**更新註解**（約第 79-82 行）：

```javascript
// 定義全域變數
const boardComment = isESP32 ? '// ESP32 使用硬體 Serial2' : '// Arduino AVR 使用 SoftwareSerial';
window.arduinoGenerator.variables_['pixetto_vars'] = `
${boardComment}
Pixetto pixetto(${rxPin}, ${txPin});  // RX=${rxPin}, TX=${txPin}
`;
```

### 4. 測試

按 F5 啟動擴充功能開發環境，執行手動測試：

| 測試        | 步驟                                                     |
| ----------- | -------------------------------------------------------- |
| ESP32       | 選擇 ESP32 → 拖曳 Pixetto 初始化 → 確認無 SoftwareSerial |
| Arduino UNO | 選擇 UNO → 拖曳 Pixetto 初始化 → 確認有 SoftwareSerial   |

### 5. 提交

```powershell
git add media/blockly/generators/arduino/pixetto.js
git commit -m "fix(pixetto): 修正 ESP32 開發板不必要的 SoftwareSerial 引用"
```

## 參考檔案

-   **範本**: `media/blockly/generators/arduino/huskylens.js`（第 183-216 行）
-   **規格**: `specs/012-esp32-pixetto-fix/spec.md`
-   **研究**: `specs/012-esp32-pixetto-fix/research.md`

## 注意事項

1. **向後相容**: AVR 分支必須維持現有行為
2. **變數作用域**: `isESP32` 應在函數開頭宣告，整個函數可用
3. **開發板識別**: 使用 `includes('esp32')` 而非精確匹配，支援 ESP32 變體
