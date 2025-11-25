# Tasks: ESP32 Pixetto 程式碼生成修正

**Input**: Design documents from `/specs/012-esp32-pixetto-fix/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: 此功能使用手動測試（WebView 互動，符合 Constitution VII UI Testing Exception）

**Organization**: 任務按 User Story 分組，每個 Story 可獨立實作與測試

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案，無相依性）
-   **[Story]**: 任務所屬的 User Story（如 US1, US2）
-   包含確切的檔案路徑

## Path Conventions

-   **修改目標**: `media/blockly/generators/arduino/pixetto.js`
-   **參考範本**: `media/blockly/generators/arduino/huskylens.js`

---

## Phase 1: Setup

**Purpose**: 確認開發環境和參考範本

-   [ ] T001 確認功能分支 `012-esp32-pixetto-fix` 已切換
-   [ ] T002 檢視 `media/blockly/generators/arduino/huskylens.js` 第 183-216 行作為參考範本

**Checkpoint**: 開發環境就緒，參考範本已理解

---

## Phase 2: User Story 1 & 2 - ESP32 與 AVR 開發板判斷 (Priority: P1) 🎯 MVP

**Goal**: 修正 `pixetto_init` generator，根據開發板類型條件性生成 SoftwareSerial 引用

**Independent Test**: 選擇 ESP32 → 使用 Pixetto 積木 → 確認無 SoftwareSerial；選擇 UNO → 確認有 SoftwareSerial

### 實作任務

-   [ ] T004 [US1/US2] 在 `pixetto_init` 函數開頭新增開發板類型檢測邏輯 in `media/blockly/generators/arduino/pixetto.js`

    ```javascript
    const currentBoard = window.currentBoard || 'uno';
    const isESP32 = currentBoard.includes('esp32');
    ```

-   [ ] T005 [US1/US2] 修改 SoftwareSerial include 邏輯為條件判斷 in `media/blockly/generators/arduino/pixetto.js`

    -   ESP32: 不添加 `#include <SoftwareSerial.h>`
    -   AVR: 維持添加 SoftwareSerial

-   [ ] T006 [US1/US2] 修改 build_flags 邏輯為條件判斷 in `media/blockly/generators/arduino/pixetto.js`

    -   ESP32: 不添加 AVR 專用 `-I"$PROJECT_PACKAGES_DIR/framework-arduino-avr/..."`
    -   AVR: 維持添加 build_flags

-   [ ] T007 [US1/US2] 更新變數宣告區塊的註解，標明開發板類型 in `media/blockly/generators/arduino/pixetto.js`
    ```javascript
    const boardComment = isESP32 ? '// ESP32 使用硬體 Serial2' : '// Arduino AVR 使用 SoftwareSerial';
    ```

**Checkpoint**: ESP32 和 AVR 的程式碼生成邏輯已分離

---

## Phase 3: User Story 3 - ESP32 變體支援 (Priority: P2)

**Goal**: 確認 ESP32 Super Mini 等變體能正確識別為 ESP32

**Independent Test**: 選擇 ESP32 Super Mini → 使用 Pixetto 積木 → 確認套用 ESP32 邏輯

### 驗證任務

-   [ ] T008 [US3] 驗證 `includes('esp32')` 能識別所有 ESP32 變體 in `media/blockly/generators/arduino/pixetto.js`
    -   檢查 `window.currentBoard` 對 `esp32_super_mini` 的值

**Checkpoint**: 所有 ESP32 變體正確識別

---

## Phase 4: Manual Testing

**Purpose**: 執行手動測試驗證所有 User Story

-   [ ] T009 [P] 手動測試：ESP32 + Pixetto（預期：無 SoftwareSerial）
-   [ ] T010 [P] 手動測試：Arduino UNO + Pixetto（預期：有 SoftwareSerial）
-   [ ] T011 [P] 手動測試：ESP32 Super Mini + Pixetto（預期：識別為 ESP32）
-   [ ] T012 手動測試：開發板切換（ESP32 ↔ UNO 程式碼正確更新）

**Checkpoint**: 所有測試案例通過

---

## Phase 5: Polish & Documentation

**Purpose**: 最終檢查與提交

-   [ ] T013 確認程式碼符合專案程式碼風格（ESLint）
-   [ ] T014 [P] 更新 `specs/012-esp32-pixetto-fix/` 中的測試結果記錄
-   [ ] T015 提交變更：`git commit -m "fix(pixetto): 修正 ESP32 開發板不必要的 SoftwareSerial 引用"`

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無相依性 - 可立即開始
-   **User Story 1 & 2 (Phase 2)**: 相依於 Setup - 核心修改
-   **User Story 3 (Phase 3)**: 相依於 Phase 2 - 驗證變體支援
-   **Manual Testing (Phase 4)**: 相依於所有實作完成
-   **Polish (Phase 5)**: 相依於測試通過

### 平行機會

-   T009, T010, T011 可平行執行（不同開發板測試）

---

## Implementation Summary

| Phase     | 任務數 | 關鍵輸出               |
| --------- | ------ | ---------------------- |
| Setup     | 2      | 環境就緒               |
| US1 & US2 | 4      | ESP32/AVR 條件判斷實作 |
| US3       | 1      | ESP32 變體驗證         |
| Testing   | 4      | 手動測試通過           |
| Polish    | 3      | 程式碼提交             |
| **總計**  | **14** |                        |

---

## Notes

-   此為單一檔案 bug fix，所有實作任務都在 `pixetto.js`
-   參照 `huskylens.js` 第 183-216 行作為正確實作範本
-   手動測試必須在 VSCode Extension Host 環境執行（F5）
-   提交訊息使用繁體中文，符合 Constitution IX
