# Feature Specification: 修復 CyberBrick Print 積木換行控制

**Feature Branch**: `039-fix-print-newline`  
**Created**: 2026年2月4日  
**Status**: Draft  
**Input**: User description: "在使用cyber brick裡面的 print指令的時候，不管有沒有勾後面的換行都會在終端機裡面自動換行，所以後面的那一個換行的勾勾是沒有用的。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 控制連續輸出是否換行 (Priority: P1)

當使用者想在 CyberBrick 終端機上連續輸出多個訊息時，需要能夠控制每次輸出後是否換行。例如，製作進度條顯示、倒數計時器、或在同一行更新感測器數值時，必須能夠關閉自動換行功能。

**Why this priority**: 這是核心功能缺陷，直接影響使用者對輸出格式的控制能力。目前 checkbox 欄位存在但完全不起作用，造成功能誤導。

**Independent Test**: 建立兩個 print 積木，第一個輸入 "Progress: "，取消勾選換行；第二個輸入 "100%"，勾選換行。產生程式碼並上傳到 CyberBrick，觀察終端機是否顯示 "Progress: 100%"（在同一行）。

**Acceptance Scenarios**:

1. **Given** 使用者建立一個 print 積木並勾選「換行」checkbox, **When** 產生 MicroPython 程式碼, **Then** 產生的程式碼為 `print(訊息內容)`，上傳到 CyberBrick 後每次輸出自動換行
2. **Given** 使用者建立一個 print 積木並取消勾選「換行」checkbox, **When** 產生 MicroPython 程式碼, **Then** 產生的程式碼為 `print(訊息內容, end='')`，上傳到 CyberBrick 後輸出不換行，下一個輸出接續在同一行
3. **Given** 使用者建立三個 print 積木：第一個輸入 "A" 取消勾選換行，第二個輸入 "B" 取消勾選換行，第三個輸入 "C" 勾選換行, **When** 上傳到 CyberBrick 執行, **Then** 終端機顯示 "ABC"（前兩個在同一行，第三個輸出後換行）
4. **Given** 使用者建立 print 積木使用預設值（從 toolbox 拖曳新積木）, **When** 檢查 checkbox 狀態, **Then** 「換行」checkbox 預設為勾選狀態

---

### User Story 2 - 與 Arduino 版本行為一致 (Priority: P2)

使用者在開發過程中可能需要在 Arduino 和 CyberBrick 之間切換測試，期望 print 積木的換行控制行為保持一致，避免產生不同的輸出結果。

**Why this priority**: 確保跨平台一致性，降低使用者的學習成本和認知負擔。目前 Arduino 版本功能正常，MicroPython 版本有缺陷。

**Independent Test**: 建立包含 print 積木的 Blockly 工作區，分別切換到 Arduino Uno 和 CyberBrick 板子，檢查產生的程式碼邏輯是否對等（Arduino 使用 `Serial.print()` vs `Serial.println()`，MicroPython 使用 `print(msg, end='')` vs `print(msg)`）。

**Acceptance Scenarios**:

1. **Given** 使用者建立一個勾選換行的 print 積木, **When** 切換不同板子型號產生程式碼, **Then** Arduino 板子產生 `Serial.println(msg)`，CyberBrick 板子產生 `print(msg)`，兩者行為一致（都換行）
2. **Given** 使用者建立一個取消勾選換行的 print 積木, **When** 切換不同板子型號產生程式碼, **Then** Arduino 板子產生 `Serial.print(msg)`，CyberBrick 板子產生 `print(msg, end='')`，兩者行為一致（都不換行）

---

### User Story 3 - 單元測試與程式碼品質 (Priority: P3)

開發團隊需要確保修復後的程式碼有完整的測試覆蓋，避免未來迴歸問題。

**Why this priority**: 雖然不直接影響使用者功能，但確保長期程式碼品質和維護性。

**Independent Test**: 執行 `npm run test` 和 `npm run test:coverage`，檢查 MicroPython text generator 的測試覆蓋率是否達標，並驗證新增的測試案例能正確捕捉 checkbox 欄位的兩種狀態。

**Acceptance Scenarios**:

1. **Given** 開發團隊執行測試套件, **When** 測試 `text_print` 積木的 MicroPython 產生器, **Then** 測試涵蓋勾選換行和取消勾選換行兩種情境
2. **Given** 開發團隊執行測試覆蓋率報告, **When** 檢查整體覆蓋率, **Then** 維持在 90% 以上（專案標準）

---

### Edge Cases

- **包含換行字元的文字內容**：當 print 的內容本身包含 `\n` 換行字元時（例如 `"Hello\nWorld"`），取消勾選換行 checkbox 的行為應為 `print("Hello\nWorld", end='')`，保持使用者的選擇（文字中間會換行，但輸出結尾不換行）
- **連續大量不換行輸出**：當連續 10 個以上 print 積木都取消勾選換行時，終端機應正常顯示在同一行，直到超過終端機寬度才自動換行（由終端機控制）
- **空白內容輸出**：當 print 積木的 TEXT 輸入為空時，不論是否勾選換行，都應該只輸出空字串（勾選則換行，不勾選則無任何輸出）
- **特殊字元處理**：當 print 內容包含特殊字元（如引號、反斜線）時，`end=''` 參數不應影響字元的正常跳脫處理

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: MicroPython 程式碼產生器 MUST 讀取 `text_print` 積木的 `NEW_LINE` checkbox 欄位值
- **FR-002**: 當 `NEW_LINE` 欄位值為 `'TRUE'` 時，產生器 MUST 產生 `print(訊息內容)` 程式碼（使用 Python 預設換行行為）
- **FR-003**: 當 `NEW_LINE` 欄位值為 `'FALSE'` 時，產生器 MUST 產生 `print(訊息內容, end='')` 程式碼（明確指定不換行）
- **FR-004**: 產生的程式碼行為 MUST 與 Arduino 版本的邏輯對等（Arduino: `Serial.print()` vs `Serial.println()` = MicroPython: `print(msg, end='')` vs `print(msg)`）
- **FR-005**: Toolbox 中的預設值 MUST 維持 `"NEW_LINE": "TRUE"`（新建積木時預設勾選換行）
- **FR-006**: 積木定義（blocks/arduino.js）、i18n 翻譯檔案（15 種語言）、toolbox 配置 MUST 保持不變（這些部分已經正確）
- **FR-007**: 修改後的產生器 MUST 包含完整的單元測試，涵蓋勾選和取消勾選兩種情境

### Key Entities

- **text_print Block**: Blockly 積木物件，包含一個 VALUE 輸入（TEXT 欄位）和一個 FIELD（NEW_LINE checkbox），定義於 `media/blockly/blocks/arduino.js`
- **MicroPython Generator Function**: 負責將 `text_print` 積木轉換為 MicroPython 程式碼的產生器函數，位於 `media/blockly/generators/micropython/text.js`，目前版本缺少對 `NEW_LINE` 欄位的處理邏輯

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者建立取消勾選換行的 print 積木後，產生的 MicroPython 程式碼包含 `, end=''` 參數（可透過程式碼檢查驗證）
- **SC-002**: 使用者建立勾選換行的 print 積木後，產生的 MicroPython 程式碼不包含 `end` 參數（使用 Python 預設行為）
- **SC-003**: 上傳到 CyberBrick 實機並執行後，終端機行為完全符合 checkbox 的設定（100% 匹配率）
- **SC-004**: 單元測試覆蓋率維持在 90% 以上，且 `text_print` MicroPython 產生器有專屬測試案例
- **SC-005**: Arduino 和 MicroPython 版本的 print 積木在相同 checkbox 設定下，終端機輸出行為保持一致（視覺效果對等）
