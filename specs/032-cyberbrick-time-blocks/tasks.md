# Feature Tasks: CyberBrick 時間回傳值積木

**Feature**: CyberBrick 時間回傳值積木  
**Spec**: E:/singular-blockly/specs/032-cyberbrick-time-blocks/spec.md  
**Plan**: E:/singular-blockly/specs/032-cyberbrick-time-blocks/plan.md  
**Docs Available**: research.md, data-model.md, contracts/, quickstart.md

## Phase 1: Setup

- [x] T001 盤點既有 CyberBrick 積木命名與時間類別位置（media/blockly/blocks/cyberbrick.js, media/toolbox/categories/cyberbrick_core.json）
- [x] T002 確認 MCP 字典生成流程與分類限制（scripts/generate-block-dictionary.js, src/mcp/block-dictionary.json）

## Phase 2: Foundational

- [x] T003 建立時間回傳值積木的 i18n 文字鍵清單與語系對照（media/locales/*/messages.js）
- [x] T004 定義 MCP 字典條目欄位與搜尋標籤規則（specs/032-cyberbrick-time-blocks/contracts/mcp-block-dictionary.md）

## Phase 3: User Story 1 (P1) - 非阻塞計時流程

- [x] T005 [US1] 新增「取得目前毫秒數」積木定義（media/blockly/blocks/cyberbrick.js）
- [x] T006 [US1] 新增「計算時間差」積木定義（media/blockly/blocks/cyberbrick.js）
- [x] T007 [US1] 更新時間類別工具箱與預設輸入（media/toolbox/categories/cyberbrick_core.json）
- [x] T008 [US1] 新增 MicroPython 產碼規則（media/blockly/generators/micropython/cyberbrick.js）
- [x] T009 [US1] 補齊文件中的時間積木說明與範例（docs/specifications/03-hardware-support/cyberbrick-micropython.md）

## Phase 4: User Story 2 (P2) - 在地化教學與介面理解

- [x] T010 [P] [US2] 更新所有語系積木名稱與欄位文字（media/locales/*/messages.js）
- [x] T011 [US2] 執行語系檢核（npm run validate:i18n，package.json）

## Phase 5: User Story 3 (P3) - AI/MCP 積木查詢支援

- [x] T012 [US3] 更新 MCP block dictionary 定義（scripts/generate-block-dictionary.js）
- [x] T013 [US3] 重新產生 MCP 字典（npm run generate:dictionary，scripts/generate-block-dictionary.js）
- [x] T014 [US3] 驗證新積木可被查詢（src/mcp/block-dictionary.json, src/test/mcp/blockDictionary.test.ts）

## Phase 6: User Story 4 (P4) - 文件與教學參考更新

- [x] T015 [US4] 補齊快速上手教學與驗證清單（specs/032-cyberbrick-time-blocks/quickstart.md）

## Phase 7: Polish & Cross-Cutting

- [x] T016 [P] 執行 ESLint 與基本測試（npm run lint, npm test，package.json）
- [x] T017 [P] 手動驗證 Blockly 介面拖曳與產碼，並確認時間差使用官方可處理 wrap-around 的方式（media/blockly/generators/micropython/cyberbrick.js）

## Dependencies

- US1 需先完成 Phase 1-2 的盤點與字典欄位定義。
- US2 可與 US1 並行，但需在 US1 完成後進行語系校對。
- US3 依賴 US1 的積木型別與名稱定案。
- US4 可在 US1 完成後執行。

## Parallel Execution Examples

- T005/T006/T008 可並行（不同檔案區域）。
- T010 可與 T012 並行（i18n 與字典更新互不干擾）。
- T016 可與 T017 並行（自動與手動驗證）。

## Implementation Strategy

- MVP 以 US1 為主：先完成時間積木、產碼與工具箱，確保核心流程可用。
- US2/US3/US4 依序補齊在地化、MCP 查詢與教學文件。
- 最後進行 lint/test 與 UI 手動驗證確保品質。
