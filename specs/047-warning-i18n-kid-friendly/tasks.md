# Tasks: 非 Blockly 專案警告的 i18n 完善與孩子友善文案改進

**Input**: Design documents from `/specs/047-warning-i18n-kid-friendly/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-dialog-contract.md ✅, quickstart.md ✅

**Tests**: Included — research.md R5 規劃了訊息鍵值一致性、占位符驗證、字元長度驗證等自動化測試。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Scope Summary

| 項目 | 數量 |
|------|------|
| 語系檔更新 | 15 個（`media/locales/{lang}/messages.js`） |
| TypeScript fallback 更新 | 2 個（`workspaceValidator.ts` 三處：`getFallbackMessage()`、行內 fallback、catch block；`webviewManager.ts`） |
| 訊息鍵值 | 7 個 × 15 語系 = 105 筆翻譯文案 |
| 新增測試 | 1 個測試檔（4 個測試套件，依序建立） |
| i18n 驗證 | `npm run validate:i18n`（全語系自動化品質檢查） |
| 預計總修改檔案 | 18 個（15 語系檔 + 2 TS 檔 + 1 測試檔） |

---

## Phase 1: Setup

**Purpose**: 確認開發環境正常運作，建立修改基準

- [ ] T001 執行 `npm run compile && npm test` 驗證現有程式碼編譯通過且所有測試成功
- [ ] T002 檢視 `media/locales/en/messages.js` 中現有 7 個安全守衛訊息鍵值（`SAFETY_WARNING_BODY_NO_TYPE`、`SAFETY_WARNING_BODY_WITH_TYPE`、`BUTTON_CONTINUE`、`BUTTON_CANCEL`、`BUTTON_SUPPRESS`、`SAFETY_GUARD_CANCELLED`、`SAFETY_GUARD_SUPPRESSED`），記錄目前文案作為修改前基準

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 更新英文基準語系與 TypeScript fallback 字串。此階段產出為所有 User Story 的依賴基礎。

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 更新 `media/locales/en/messages.js` 中 7 個安全守衛訊息鍵值為孩子友善英文版本。依 research.md 英文基準版本草稿：`SAFETY_WARNING_BODY_NO_TYPE` → "This place doesn't have building blocks yet. Want to set things up so you can start creating? We'll get everything ready for you!"；`SAFETY_WARNING_BODY_WITH_TYPE` → "This place already has {0} stuff in it. Want to add building blocks here too? We'll set everything up for you!"；`BUTTON_CONTINUE` → "Yes, let's go!"；`BUTTON_SUPPRESS` → "Don't ask again"；`BUTTON_CANCEL` → "Cancel"；`SAFETY_GUARD_CANCELLED` → "No worries! We didn't make any changes."；`SAFETY_GUARD_SUPPRESSED` → "Got it! We won't ask you about this again."
- [ ] T004 [P] 更新 `src/services/workspaceValidator.ts` 中所有 fallback 訊息（三處），使措辭與 `en/messages.js` 孩子友善版本一致：(1) `getFallbackMessage()` 方法（約 L279-291）：將 `SAFETY_WARNING_BODY_NO_TYPE` fallback 從 "This project does not have Blockly blocks yet. If you continue, blockly folder and files will be created here..." 改為與 en/messages.js 一致的孩子友善英文；將 `SAFETY_WARNING_BODY_WITH_TYPE` fallback 同步更新；將 `BUTTON_CONTINUE` 從 `'Continue'` 改為 `"Yes, let's go!"`；將 `BUTTON_SUPPRESS` 從 `'Do Not Remind'` 改為 `"Don't ask again"`；(2) 行內 fallback 參數（約 L188-189）：`getLocalizedMessage(MESSAGE_KEYS.BUTTON_CONTINUE, 'Continue')` 的第二參數改為 `"Yes, let's go!"`，`getLocalizedMessage(MESSAGE_KEYS.BUTTON_SUPPRESS, 'Do Not Remind')` 的第二參數改為 `"Don't ask again"`；(3) catch block（約 L206-227）：`fallbackMessage` no-type/with-type 改為孩子友善英文（移除 "may cause file loss" 等警示性用語），按鈕參數從 `'Continue'`, `'Do Not Remind'` 改為 `"Yes, let's go!"`, `"Don't ask again"`，同步更新 selection 比對字串
- [ ] T005 [P] 更新 `src/webview/webviewManager.ts` 中 2 個回饋訊息的 fallback 參數（約 L187 和 L194-196）：(1) `SAFETY_GUARD_CANCELLED` 的 fallback 從中文 `'已取消開啟 Blockly 編輯器'` 改為 `"No worries! We didn't make any changes."`，(2) `SAFETY_GUARD_SUPPRESSED` 的 fallback 從中文 `'已儲存偏好設定,未來不再顯示此警告'` 改為 `"Got it! We won't ask you about this again."`

**Checkpoint**: 英文基準語系與 TypeScript fallback 已更新。後續 User Story 可開始進行。

---

## Phase 3: User Story 1 — 孩子在空白資料夾看到友善提示 (Priority: P1) 🎯 MVP

**Goal**: 10 歲孩子在空白資料夾開啟積木編輯器時，看到用語簡單、語氣親切的提示訊息，能理解狀況並知道如何繼續。

**Independent Test**: 在任意空白資料夾開啟積木編輯器，驗證繁中與英文訊息皆使用孩子友善用語，按鈕文字讓孩子能理解每個選擇的結果。

### Implementation for User Story 1

- [ ] T006 [US1] 更新 `media/locales/zh-hant/messages.js` 中 7 個安全守衛訊息鍵值為孩子友善繁體中文版本。文案須遵循 research.md R1 文案轉換指引（用「這個地方」取代「專案」、用「積木內容」取代「Blockly blocks」、按鈕描述按下後的結果）與 R2 翻譯品質清單。字元長度須符合 data-model.md 驗證規則：本文 ≤ 200 字元、按鈕 ≤ 15 字元、回饋 ≤ 100 字元
- [ ] T007 [US1] 驗證空白資料夾情境：(1) 語系設為英文（en）時觸發安全守衛，確認訊息使用孩子友善英文，(2) 語系設為繁體中文（zh-hant）時觸發安全守衛，確認訊息使用孩子友善繁中，(3) 確認兩個按鈕文字皆清楚表達按下後的結果，(4) 確認點擊各按鈕後的回饋訊息正確顯示

**Checkpoint**: User Story 1 完成。空白資料夾情境在英文與繁中語系中已可獨立測試。

---

## Phase 4: User Story 2 — 所有支援語系顯示一致的友善文案 (Priority: P1)

**Goal**: 全部 15 個語系的安全守衛訊息皆使用孩子友善用語，語意一致、語氣親切，不出現未翻譯的英文殘留（專案類型技術名稱除外）。

**Independent Test**: 逐一切換 VS Code 語系設定，在空白資料夾觸發安全守衛，驗證每個語系的訊息內容是否符合孩子友善標準。

### Implementation for User Story 2

> **NOTE**: 以下 13 個語系檔更新任務互相獨立（不同檔案），皆標記 [P] 可平行執行。每個語系須遵循 research.md R2 翻譯品質清單：不使用專業開發術語、使用適合 8-14 歲語彙、語氣親切不具威脅性、按鈕文字描述結果而非動作、保留技術專有名詞不翻譯、`{0}` 占位符位置正確、符合字元長度限制。

- [ ] T008 [P] [US2] 更新 `media/locales/bg/messages.js` 中 7 個安全守衛鍵值為孩子友善保加利亞文版本
- [ ] T009 [P] [US2] 更新 `media/locales/cs/messages.js` 中 7 個安全守衛鍵值為孩子友善捷克文版本
- [ ] T010 [P] [US2] 更新 `media/locales/de/messages.js` 中 7 個安全守衛鍵值為孩子友善德文版本（注意：現有 BUTTON_SUPPRESS "Nicht mehr erinnern" 已 20 字元超過 15 字元上限，須縮短）
- [ ] T011 [P] [US2] 更新 `media/locales/es/messages.js` 中 7 個安全守衛鍵值為孩子友善西班牙文版本
- [ ] T012 [P] [US2] 更新 `media/locales/fr/messages.js` 中 7 個安全守衛鍵值為孩子友善法文版本
- [ ] T013 [P] [US2] 更新 `media/locales/hu/messages.js` 中 7 個安全守衛鍵值為孩子友善匈牙利文版本
- [ ] T014 [P] [US2] 更新 `media/locales/it/messages.js` 中 7 個安全守衛鍵值為孩子友善義大利文版本
- [ ] T015 [P] [US2] 更新 `media/locales/ja/messages.js` 中 7 個安全守衛鍵值為孩子友善日文版本（使用「です・ます」敬語體，適合兒童閱讀）
- [ ] T016 [P] [US2] 更新 `media/locales/ko/messages.js` 中 7 個安全守衛鍵值為孩子友善韓文版本（使用「해요」體，適合兒童閱讀）
- [ ] T017 [P] [US2] 更新 `media/locales/pl/messages.js` 中 7 個安全守衛鍵值為孩子友善波蘭文版本
- [ ] T018 [P] [US2] 更新 `media/locales/pt-br/messages.js` 中 7 個安全守衛鍵值為孩子友善巴西葡萄牙文版本
- [ ] T019 [P] [US2] 更新 `media/locales/ru/messages.js` 中 7 個安全守衛鍵值為孩子友善俄文版本
- [ ] T020 [P] [US2] 更新 `media/locales/tr/messages.js` 中 7 個安全守衛鍵值為孩子友善土耳其文版本

**Checkpoint**: 全部 15 個語系的安全守衛訊息已更新為孩子友善版本。可透過切換語系驗證一致性。

---

## Phase 5: User Story 3 — 僅含 .vscode 資料夾情境的友善處理 (Priority: P2)

**Goal**: 在僅含 `.vscode` 設定資料夾的目錄開啟積木編輯器時，系統以親切語氣告知孩子這個地方還沒有積木內容，並引導做出選擇。

**Independent Test**: 在僅含 `.vscode` 子目錄的資料夾開啟積木編輯器，驗證訊息與空白資料夾情境同樣友善，不出現「.vscode」等技術用語。

### Implementation for User Story 3

- [ ] T021 [US3] 驗證 `.vscode`-only 資料夾情境：(1) 確認安全守衛觸發時使用 `SAFETY_WARNING_BODY_NO_TYPE`（與空白資料夾相同的訊息鍵值），(2) 確認訊息中不出現「.vscode」等技術用語，(3) 在英文與繁中語系各驗證一次，(4) 確認按鈕行為（繼續建立積木專案、不再提醒、取消）與空白資料夾情境完全一致

**Checkpoint**: User Story 3 驗證通過。`.vscode`-only 資料夾情境與空白資料夾情境使用相同的友善文案。

---

## Phase 6: User Story 4 — 偵測到其他專案類型的友善提示 (Priority: P2)

**Goal**: 孩子誤開 Python 或 Node.js 專案資料夾時，系統以容易理解的方式告知孩子「這個地方已經有其他程式內容了」，並引導決定是否加入積木功能。

**Independent Test**: 在含有 `package.json`（Node.js）或 `requirements.txt`（Python）的資料夾觸發安全守衛。

### Implementation for User Story 4

- [ ] T022 [US4] 驗證偵測到專案類型情境：(1) 在含 `package.json` 的資料夾觸發安全守衛，確認使用 `SAFETY_WARNING_BODY_WITH_TYPE` 且 `{0}` 替換為 "Node.js"，(2) 在含 `requirements.txt` 的資料夾觸發安全守衛，確認 `{0}` 替換為 "Python"，(3) 確認訊息使用孩子友善用語，專案類型名稱保持原文，(4) 在非英文語系（如韓文）驗證專案類型 "Python" 保持原文但周圍說明為韓文，(5) 確認 `workspaceValidator.ts` catch block fallback 的 with-type 變體也正確替換 `${projectType}`

**Checkpoint**: User Story 4 驗證通過。偵測到專案類型時的訊息在所有語系中使用孩子友善用語且正確顯示技術名稱。

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 自動化測試驗證、跨語系品質檢查、最終驗收

### Automated Tests

> **NOTE**: T023–T026 皆寫入同一測試檔 `src/test/safetyGuardI18n.test.ts`，因此 **不可平行執行**。須依序完成：T023 建立檔案 → T024 追加 → T025 追加 → T026 追加。

- [ ] T023 新增訊息鍵值一致性測試於 `src/test/safetyGuardI18n.test.ts`：建立測試檔並加入第一個 `describe` 區塊。讀取全部 15 個語系的 `media/locales/{lang}/messages.js`，驗證每個語系都包含完整的 7 個安全守衛訊息鍵值（`SAFETY_WARNING_BODY_NO_TYPE`、`SAFETY_WARNING_BODY_WITH_TYPE`、`BUTTON_CONTINUE`、`BUTTON_CANCEL`、`BUTTON_SUPPRESS`、`SAFETY_GUARD_CANCELLED`、`SAFETY_GUARD_SUPPRESSED`），且無未翻譯的英文殘留（與 en 版本不同）
- [ ] T024 新增占位符驗證測試於 `src/test/safetyGuardI18n.test.ts`：在既有測試檔追加 `describe` 區塊。驗證 (1) 所有語系的 `SAFETY_WARNING_BODY_WITH_TYPE` 包含恰好一個 `{0}` 占位符，(2) 所有語系的 `SAFETY_WARNING_BODY_NO_TYPE` 不包含 `{0}` 占位符
- [ ] T025 新增字元長度限制測試於 `src/test/safetyGuardI18n.test.ts`：在既有測試檔追加 `describe` 區塊。驗證所有 15 語系的文案長度符合上限（警告本文 ≤ 200 字元、按鈕文字 ≤ 15 字元、回饋訊息 ≤ 100 字元）
- [ ] T026 新增 fallback 一致性測試於 `src/test/safetyGuardI18n.test.ts`：在既有測試檔追加 `describe` 區塊。驗證 `src/services/workspaceValidator.ts` 三處 fallback 皆與 `media/locales/en/messages.js` 一致——(a) `getFallbackMessage()` 方法中的 5 個鍵值、(b) 行內 fallback 參數（L188-189 的 BUTTON_CONTINUE、BUTTON_SUPPRESS）、(c) catch block 中的 fallbackMessage 和按鈕字串；另驗證 `src/webview/webviewManager.ts` 中 `SAFETY_GUARD_CANCELLED` 和 `SAFETY_GUARD_SUPPRESSED` 的 fallback 參數與 en 版本一致

### Final Validation

- [ ] T027 執行 `npm run validate:i18n` 驗證全部 15 語系翻譯品質：確認占位符保留正確、無空白翻譯、UTF-8 編碼正常、翻譯長度比例合理（英文 50%-150% 範圍）。若有錯誤須回頭修正對應語系檔後重新執行直到通過
- [ ] T028 執行完整測試套件 `npm run compile && npm test`，確認所有既有測試與新增測試皆通過
- [ ] T029 執行 quickstart.md 驗證場景：依 `specs/047-warning-i18n-kid-friendly/quickstart.md` 第 5 節手動測試方法，在 VS Code 開發主機中驗證空白資料夾、.vscode-only 資料夾、Node.js 專案資料夾各一次，確認對話框訊息、按鈕文字、回饋訊息皆符合孩子友善標準
- [ ] T030 邊界情境驗證：(1) 確認先前已選擇「不再提醒」的使用者偏好不受文案更新影響（FR-008），(2) 確認 VS Code 語系不在 15 種支援語言中時以英文孩子友善版本顯示

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
  - T003（en/messages.js）為所有後續語系更新的基準
  - T004、T005 與 T003 完成後可平行執行（不同檔案）
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1（Phase 3）與 US2（Phase 4）可平行進行
  - US3（Phase 5）與 US4（Phase 6）可平行進行
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after T003 — requires en baseline to write zh-hant translation
- **User Story 2 (P1)**: Can start after T003 — requires en baseline to write other locale translations; can run in parallel with US1
- **User Story 3 (P2)**: Can start after US1 complete — verification task only, no code changes
- **User Story 4 (P2)**: Can start after US2 complete — verification task requiring all locales updated

### Within Each User Story

- Locale file updates marked [P] can run in parallel (different files)
- Verification tasks depend on corresponding implementation tasks

### Parallel Opportunities

Within Phase 2 (after T003 completes):
- T004 and T005 can run in parallel (different TS files)

Within Phase 3 + Phase 4 (after Phase 2 completes):
- T006 (zh-hant) and T008-T020 (other 13 locales) can ALL run in parallel

Within Phase 7:
- T023 → T024 → T025 → T026 必須依序執行（同一測試檔 `src/test/safetyGuardI18n.test.ts`，T023 建立檔案，後續追加）
- T027（validate:i18n）可在 T026 完成後、與 T028 平行執行

---

## Parallel Example: User Story 2

```bash
# Launch all 13 locale file updates together (all [P], all different files):
Task T008: "Update bg/messages.js"
Task T009: "Update cs/messages.js"
Task T010: "Update de/messages.js"
Task T011: "Update es/messages.js"
Task T012: "Update fr/messages.js"
Task T013: "Update hu/messages.js"
Task T014: "Update it/messages.js"
Task T015: "Update ja/messages.js"
Task T016: "Update ko/messages.js"
Task T017: "Update pl/messages.js"
Task T018: "Update pt-br/messages.js"
Task T019: "Update ru/messages.js"
Task T020: "Update tr/messages.js"

# Plus US1's zh-hant can also run in parallel:
Task T006: "Update zh-hant/messages.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T005) — en baseline + TS fallbacks
3. Complete Phase 3: User Story 1 (T006-T007) — zh-hant + verification
4. **STOP and VALIDATE**: 在空白資料夾以英文與繁中觸發安全守衛，確認孩子友善訊息
5. MVP ready — 英文與繁中使用者已可看到友善訊息

### Incremental Delivery

1. Setup + Foundational → en baseline and TS fallbacks ready
2. Add US1 (zh-hant) → Test in en + zh-hant → **MVP!**
3. Add US2 (all 13 locales) → Test all 15 locales → Full i18n coverage
4. Add US3 + US4 (verification) → Confirm all scenarios covered
5. Polish (tests + validation) → Production quality assured

### Key Design Decisions Reference

| 決策 | 來源 | 影響範圍 |
|------|------|----------|
| 具體行為描述取代技術術語 | research.md R1 | 所有語系文案 |
| 語意原型 + 在地化（非逐字翻譯） | research.md R2 | T006-T020 |
| 字元長度上限（本文 200 / 按鈕 15 / 回饋 100） | research.md R3 | T006-T020, T025 |
| Fallback 統一為英文 | research.md R4 | T004, T005 |
| catch block + getFallbackMessage + 行內 fallback 按鈕比對字串需同步更新 | research.md R6 | T004 |
| 德文 BUTTON_SUPPRESS 需縮短（現 20 字元 > 15 上限） | research.md R3 | T010 |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- 翻譯品質清單（research.md R2）為所有語系更新的統一標準
- 專案類型名稱（Node.js、Python、Java Maven 等）在所有語系中保持原文不翻譯
- `{0}` 占位符僅出現在 `SAFETY_WARNING_BODY_WITH_TYPE` 中
