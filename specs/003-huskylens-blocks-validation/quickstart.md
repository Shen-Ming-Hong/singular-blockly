# Quickstart Guide - HuskyLens Blocks Validation

## Overview

本指南協助開發者快速上手 HuskyLens 積木驗證工作,包含環境設定、測試流程、除錯技巧。

**預估完成時間**: 30-45 分鐘

---

## Prerequisites

### Required Software

1. **Node.js** ≥ 18.x

    ```powershell
    node --version  # 應顯示 v18.x 或更高
    ```

2. **VSCode** ≥ 1.85.0

    ```powershell
    code --version
    ```

3. **PlatformIO Core** (用於 Arduino 程式碼驗證)

    ```powershell
    pio --version
    ```

4. **Git** (版本控制)
    ```powershell
    git --version
    ```

### Required Hardware (可選,用於實體測試)

-   Arduino Uno/Nano/Mega **或** ESP32/ESP32 Super Mini
-   HuskyLens AI 視覺感測器
-   I2C 或 UART 連接線
-   USB 傳輸線

---

## Quick Setup (5 分鐘)

### Step 1: Clone & Checkout Branch

```powershell
# 如果尚未 clone 專案
git clone https://github.com/Shen-Ming-Hong/singular-blockly.git
cd singular-blockly

# 切換到功能分支
git checkout 003-huskylens-blocks-validation
```

### Step 2: Install Dependencies

```powershell
npm install
```

### Step 3: Build Extension

```powershell
# 開發模式 (自動重新編譯)
npm run watch

# 或一次性編譯
npm run compile
```

### Step 4: Open in VSCode

```powershell
# 在 VSCode 中開啟專案
code .
```

按 `F5` 啟動 Extension Development Host。

---

## Validation Workflow

### Phase 1: Block Definition Validation (積木定義驗證)

#### 1.1 檢查積木檔案

```powershell
# 開啟積木定義檔案
code media/blockly/blocks/huskylens.js
```

**檢查清單** (參照 `data-model.md` Entity 1):

-   [ ] 所有 11 個積木都有 `init()` 方法
-   [ ] 所有標籤使用 `Blockly.Msg['KEY']` 而非硬編碼文字
-   [ ] ValueInput 有 `setCheck()` 類型檢查
-   [ ] 有輸出的積木使用 `setOutput(true, 'Type')`
-   [ ] 語句積木有 `setPreviousStatement()` 和 `setNextStatement()`
-   [ ] 顏色一致性 (初始化=330, 查詢=160, 操作=290, 設定=230)
-   [ ] 所有積木有 `setTooltip()`
-   [ ] 欄位類型正確 (FieldDropdown/FieldNumber)

#### 1.2 手動測試積木 UI

1. 在 Extension Development Host 中建立新的 `.blocks` 檔案
2. 從工具箱拖曳每個 HuskyLens 積木
3. 檢查:
    - 積木顯示是否正常
    - 下拉選單是否包含所有選項
    - 欄位輸入是否正確限制 (例如: 引腳號碼)
    - 積木連接是否正確 (輸入/輸出類型)

#### 1.3 檢查工具箱配置

```powershell
# 開啟工具箱設定
code media/toolbox/categories/sensors.json
# 或
code media/toolbox/index.json
```

確認所有 11 個積木都在工具箱中。

---

### Phase 2: Code Generator Validation (程式碼生成器驗證)

#### 2.1 檢查生成器檔案

```powershell
# 開啟程式碼生成器
code media/blockly/generators/arduino/huskylens.js
```

**關鍵檢查點**:

-   [ ] ✅ **修正 `.id` → `.ID` 錯誤** (huskylens_get_block_info, huskylens_get_arrow_info)
-   [ ] ✅ **新增 ESP32 開發板檢測** (huskylens_init_uart)
-   [ ] 所有 API 呼叫正確 (參照 `research.md` Task 1)
-   [ ] 回傳類型符合 Arduino 函式簽章
-   [ ] lib_deps 包含 HUSKYLENSArduino GitHub URL

#### 2.2 自動生成測試程式碼

1. 在 Blockly 編輯器中建立測試工作區:

    ```
    [huskylens_init_i2c]
    ↓
    [huskylens_set_algorithm] (人臉辨識)
    ↓
    [huskylens_request]
    ↓
    [huskylens_count_blocks]
    ```

2. 點擊 "產生程式碼" 按鈕

3. 檢查生成的 `main.cpp`:

    ```cpp
    #include <Arduino.h>
    #include <Wire.h>
    #include <HUSKYLENS.h>

    HUSKYLENS huskylens;

    void setup() {
      Serial.begin(9600);
      Wire.begin();

      while (!huskylens.begin(Wire)) {
        Serial.println(F("HUSKYLENS 初始化失敗..."));
        delay(100);
      }

      huskylens.writeAlgorithm(ALGORITHM_FACE_RECOGNITION);
    }

    void loop() {
      if (huskylens.request()) {
        int16_t blockCount = huskylens.countBlocks();
        Serial.println(blockCount);
      }
      delay(100);
    }
    ```

#### 2.3 Arduino AVR 測試

**測試開發板**: Arduino Uno/Nano/Mega

**測試場景 1: I2C 初始化**

```blocks
[huskylens_init_i2c]
```

**預期生成程式碼**:

```cpp
#include <Wire.h>
#include <HUSKYLENS.h>

HUSKYLENS huskylens;

void setup() {
  Serial.begin(9600);
  Wire.begin();
  while (!huskylens.begin(Wire)) {
    Serial.println(F("HUSKYLENS 初始化失敗..."));
    delay(100);
  }
}
```

**驗證步驟**:

```powershell
# 建立 PlatformIO 測試專案
cd test-projects/arduino-uno-i2c
pio init --board uno

# 複製生成的程式碼到 src/main.cpp

# 編譯
pio run

# 預期結果: 編譯成功 ✅
```

**測試場景 2: UART 初始化** (SoftwareSerial)

```blocks
[huskylens_init_uart]
  RX Pin: 10
  TX Pin: 11
```

**預期生成程式碼**:

```cpp
#include <SoftwareSerial.h>
#include <HUSKYLENS.h>

SoftwareSerial huskySerial(10, 11);
HUSKYLENS huskylens;

void setup() {
  Serial.begin(9600);
  huskySerial.begin(9600);
  while (!huskylens.begin(huskySerial)) {
    Serial.println(F("HUSKYLENS 初始化失敗..."));
    delay(100);
  }
}
```

**驗證步驟**:

```powershell
cd test-projects/arduino-uno-uart
pio init --board uno
# 複製程式碼
pio run

# 預期結果: 編譯成功 ✅
```

#### 2.4 ESP32 測試

**測試開發板**: ESP32/ESP32 Super Mini

**測試場景 3: UART 初始化** (HardwareSerial)

```blocks
[huskylens_init_uart]
  RX Pin: 16
  TX Pin: 17
```

**預期生成程式碼** (修正後):

```cpp
#include <HUSKYLENS.h>

HardwareSerial huskySerial(1);
HUSKYLENS huskylens;

void setup() {
  Serial.begin(9600);
  huskySerial.begin(9600, SERIAL_8N1, 16, 17);
  while (!huskylens.begin(huskySerial)) {
    Serial.println(F("HUSKYLENS 初始化失敗..."));
    delay(100);
  }
}
```

**驗證步驟**:

```powershell
cd test-projects/esp32-uart
pio init --board esp32dev

# 確認 platformio.ini 包含:
# lib_deps = https://github.com/HuskyLens/HUSKYLENSArduino/archive/refs/heads/master.zip

# 複製程式碼
pio run

# 預期結果: 編譯成功 ✅
```

**ESP32 引腳推薦**:

-   ESP32: RX=16, TX=17 (UART2)
-   ESP32-S2: RX=18, TX=17
-   ESP32-C3: RX=18, TX=19

---

### Phase 3: I18n Message Validation (國際化訊息驗證)

#### 3.1 執行翻譯驗證腳本

```powershell
# 檢查所有語言的訊息完整性
node scripts/i18n/validate-translations.js

# 產生翻譯統計報告
node scripts/i18n/translation-stats.js
```

**預期輸出**:

```
Validating translations...
✓ zh-hant: 44/44 messages (100%)
✓ en: 44/44 messages (100%)
✓ ja: 44/44 messages (100%)
...
✓ All 12 languages complete!
```

#### 3.2 手動檢查訊息鍵

```powershell
# 開啟繁體中文訊息檔案
code media/locales/zh-hant/messages.js
```

**檢查清單** (44 個必要鍵):

**Tooltips (11 個)**:

-   [ ] `HUSKYLENS_INIT_I2C_TOOLTIP`
-   [ ] `HUSKYLENS_INIT_UART_TOOLTIP`
-   [ ] `HUSKYLENS_SET_ALGORITHM_TOOLTIP`
-   [ ] `HUSKYLENS_REQUEST_TOOLTIP`
-   [ ] `HUSKYLENS_IS_LEARNED_TOOLTIP`
-   [ ] `HUSKYLENS_COUNT_BLOCKS_TOOLTIP`
-   [ ] `HUSKYLENS_GET_BLOCK_INFO_TOOLTIP`
-   [ ] `HUSKYLENS_COUNT_ARROWS_TOOLTIP`
-   [ ] `HUSKYLENS_GET_ARROW_INFO_TOOLTIP`
-   [ ] `HUSKYLENS_LEARN_TOOLTIP`
-   [ ] `HUSKYLENS_FORGET_TOOLTIP`

**Field Labels (22 個)**:

-   [ ] 演算法名稱 (7 個): `HUSKYLENS_ALGORITHM_*`
-   [ ] 區塊資訊類型 (5 個): `HUSKYLENS_BLOCK_INFO_*`
-   [ ] 箭頭資訊類型 (5 個): `HUSKYLENS_ARROW_INFO_*`
-   [ ] 其他標籤 (5 個): RX/TX Pin, Index, ID 等

**Block Names (11 個)**:

-   [ ] `HUSKYLENS_INIT_I2C`
-   [ ] `HUSKYLENS_INIT_UART`
-   [ ] ... (其餘 9 個)

#### 3.3 多語言 UI 測試

1. 在 VSCode 中切換顯示語言:

    ```
    Ctrl+Shift+P → "Configure Display Language"
    選擇: English / 日本語 / 한국어 等
    ```

2. 重啟 Extension Development Host

3. 開啟 Blockly 編輯器,檢查積木標籤是否正確翻譯

---

## Unit Testing (單元測試)

### Run All Tests

```powershell
npm test
```

### Run Specific Test Suites

```powershell
# 測試 MessageHandler
npm test -- --grep "MessageHandler"

# 測試 FileService
npm test -- --grep "FileService"

# 測試 SettingsManager
npm test -- --grep "SettingsManager"
```

### Add New Tests (for HuskyLens validation)

建立測試檔案: `src/test/huskylens.test.ts`

```typescript
import * as assert from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';

suite('HuskyLens Blocks Validation', () => {
	test('All 11 blocks should have init() method', () => {
		const blocksFile = readFileSync(join(__dirname, '../../media/blockly/blocks/huskylens.js'), 'utf-8');

		const blockTypes = ['huskylens_init_i2c', 'huskylens_init_uart', 'huskylens_set_algorithm', 'huskylens_request', 'huskylens_is_learned', 'huskylens_count_blocks', 'huskylens_get_block_info', 'huskylens_count_arrows', 'huskylens_get_arrow_info', 'huskylens_learn', 'huskylens_forget'];

		for (const blockType of blockTypes) {
			assert.ok(blocksFile.includes(`Blockly.Blocks['${blockType}']`), `Block ${blockType} should be defined`);
		}
	});

	test('Code generators should use .ID not .id', () => {
		const generatorFile = readFileSync(join(__dirname, '../../media/blockly/generators/arduino/huskylens.js'), 'utf-8');

		// 應該使用 .ID (大寫)
		assert.ok(generatorFile.includes('.ID'), 'Generator should use .ID property');

		// 不應該有 .id (小寫) 錯誤
		const blockInfoGen = generatorFile.match(/huskylens_get_block_info[\s\S]*?return/)?.[0];
		const arrowInfoGen = generatorFile.match(/huskylens_get_arrow_info[\s\S]*?return/)?.[0];

		assert.ok(!blockInfoGen?.includes('.id'), 'huskylens_get_block_info should not use .id');
		assert.ok(!arrowInfoGen?.includes('.id'), 'huskylens_get_arrow_info should not use .id');
	});

	test('UART init should detect ESP32 board', () => {
		const generatorFile = readFileSync(join(__dirname, '../../media/blockly/generators/arduino/huskylens.js'), 'utf-8');

		const uartInitGen = generatorFile.match(/huskylens_init_uart[\s\S]*?return/)?.[0];

		assert.ok(uartInitGen?.includes('window.currentBoard'), 'UART init should check window.currentBoard');
		assert.ok(uartInitGen?.includes('esp32'), 'UART init should handle ESP32 case');
	});
});
```

執行測試:

```powershell
npm test -- --grep "HuskyLens"
```

---

## Debugging Tips (除錯技巧)

### WebView Debugging

1. 在 Extension Development Host 中開啟 Blockly 編輯器
2. 右鍵點擊編輯器區域 → **"Open Developer Tools"**
3. 在 Console 中檢查:

    ```javascript
    // 檢查積木定義
    Blockly.Blocks['huskylens_init_i2c'];

    // 檢查程式碼生成器
    window.arduinoGenerator.forBlock['huskylens_init_i2c'];

    // 檢查當前開發板
    window.currentBoard;

    // 檢查訊息載入
    Blockly.Msg['HUSKYLENS_INIT_I2C_TOOLTIP'];
    ```

### Extension Host Debugging

1. 在 `src/extension.ts` 或其他 TypeScript 檔案中設定中斷點
2. 按 `F5` 啟動除錯模式
3. 在 Debug Console 中檢查變數

### Log Output

使用統一的 logging 服務:

```typescript
import { log } from './services/logging';

log.info('HuskyLens block loaded', { blockType: 'huskylens_init_i2c' });
log.error('Failed to generate code', { error: err.message });
log.debug('Current board', { board: window.currentBoard });
```

查看 log:

-   VSCode Output 面板 → 選擇 "Singular Blockly"

### Common Issues

**問題 1: 積木不顯示在工具箱**

-   檢查 `media/toolbox/index.json` 是否包含 HuskyLens 分類
-   確認積木類型名稱與定義一致

**問題 2: 程式碼生成失敗**

-   開啟 WebView Developer Tools 查看 console 錯誤
-   確認 `window.arduinoGenerator.forBlock['block_type']` 存在

**問題 3: ESP32 編譯失敗**

-   檢查是否使用 `HardwareSerial` 而非 `SoftwareSerial`
-   確認 `platformio.ini` 包含 HUSKYLENSArduino 依賴

**問題 4: i18n 訊息未翻譯**

-   執行 `node scripts/i18n/validate-translations.js` 檢查缺失
-   確認所有 `messages.js` 檔案使用相同的鍵

---

## Hardware Testing (實體測試)

### Setup 1: Arduino Uno + I2C

**接線圖**:

```
Arduino Uno          HuskyLens
-----------          ---------
    5V      ------   VCC
   GND      ------   GND
   SDA (A4) ------   SDA
   SCL (A5) ------   SCL
```

**測試程式**:

1. 使用 `huskylens_init_i2c` 積木
2. 新增 `huskylens_request` 和 `huskylens_count_blocks`
3. 產生並上傳程式碼
4. 開啟 Serial Monitor (9600 baud)
5. 預期: 顯示偵測到的物體數量

### Setup 2: Arduino Nano + UART

**接線圖**:

```
Arduino Nano         HuskyLens
------------         ---------
    5V      ------   VCC
   GND      ------   GND
   D10 (RX) ------   TX
   D11 (TX) ------   RX
```

**測試程式**:

1. 使用 `huskylens_init_uart` (RX=10, TX=11)
2. 其餘同 Setup 1

### Setup 3: ESP32 + UART

**接線圖**:

```
ESP32                HuskyLens
-----                ---------
   3.3V     ------   VCC
   GND      ------   GND
   GPIO16   ------   TX
   GPIO17   ------   RX
```

**測試程式**:

1. 使用 `huskylens_init_uart` (RX=16, TX=17)
2. 其餘同 Setup 1
3. **確認使用修正後的 HardwareSerial 版本**

---

## Checklist - Definition of Done

完成驗證前,確認以下所有項目:

### Block Definitions

-   [ ] 所有 11 個積木都有完整的 `init()` 方法
-   [ ] 所有標籤使用 i18n 鍵,無硬編碼文字
-   [ ] 類型檢查正確設定
-   [ ] 顏色一致性符合分類
-   [ ] 所有積木有 tooltip

### Code Generators

-   [ ] ✅ **修正 `.id` → `.ID` 錯誤** (2 處)
-   [ ] ✅ **實作 ESP32 開發板檢測** (UART 初始化)
-   [ ] 所有 API 呼叫正確
-   [ ] lib_deps 包含 HUSKYLENSArduino
-   [ ] Arduino AVR 編譯通過
-   [ ] ESP32 編譯通過

### I18n Messages

-   [ ] 所有 44 個鍵存在於所有 12 種語言
-   [ ] 翻譯驗證腳本通過
-   [ ] 多語言 UI 測試通過

### Toolbox

-   [ ] 所有 11 個積木在工具箱中
-   [ ] 積木順序合理
-   [ ] 分類名稱正確

### Testing

-   [ ] 單元測試通過 (npm test)
-   [ ] 手動 UI 測試通過
-   [ ] Arduino 編譯測試通過
-   [ ] ESP32 編譯測試通過
-   [ ] (可選) 實體硬體測試通過

### Documentation

-   [ ] plan.md 完整
-   [ ] research.md 完整
-   [ ] data-model.md 完整
-   [ ] quickstart.md 完整
-   [ ] CHANGELOG.md 更新

---

## Next Steps

完成驗證後:

1. **Commit Changes**

    ```powershell
    git add .
    git commit -m "feat: validate and fix HuskyLens blocks"
    ```

2. **Push to Remote**

    ```powershell
    git push origin 003-huskylens-blocks-validation
    ```

3. **Create Pull Request**

    - 在 GitHub 上建立 PR
    - 填寫 PR description (參考 `specs/003-.../PR-DESCRIPTION.md`)
    - 請求 code review

4. **Manual Testing Report**
    - 填寫 `MANUAL-TEST-RESULTS.md`
    - 記錄所有測試場景結果
    - 附上截圖或影片證明

---

## Getting Help

-   **文件**: `specs/003-huskylens-blocks-validation/`
-   **Issues**: GitHub Issues 追蹤問題
-   **Research**: `research.md` 包含所有技術查證結果

---

**最後更新**: 2025-10-18  
**作者**: GitHub Copilot
