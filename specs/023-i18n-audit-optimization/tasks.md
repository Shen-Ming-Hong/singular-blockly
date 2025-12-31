# Tasks: i18n 審計機制優化

**Input**: Design documents from `/specs/023-i18n-audit-optimization/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: 本功能透過現有 `npm run validate:i18n` 驗證，無需新增測試檔案。

**Organization**: 任務按 User Story 分組，每個故事可獨立實作與驗證。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案、無相依）
-   **[Story]**: 任務所屬的 User Story（如 US1、US2、US3、US4）
-   包含精確的檔案路徑

## Path Conventions

-   **腳本**: `scripts/i18n/` - 審計腳本與白名單
-   **翻譯**: `media/locales/` - 各語言翻譯檔案
-   **CI/CD**: `.github/workflows/` - GitHub Actions 工作流程

---

## Phase 1: Setup（共用基礎設施）

**Purpose**: 確認專案結構與現有檔案狀態

-   [x] T001 確認 `scripts/i18n/audit-whitelist.json` 存在且為有效 JSON 格式
-   [x] T002 [P] 確認 `scripts/i18n/lib/detectors/` 目錄下有 `direct-translation.js`、`length-overflow.js`、`cultural-mismatch.js`
-   [x] T003 [P] 執行 `npm run validate:i18n` 記錄修改前的基準問題數量

---

## Phase 2: Foundational（阻擋型前置作業）

**Purpose**: 無阻擋型前置作業 - 本功能各 User Story 可直接開始

**⚠️ 說明**: 本功能屬於設定調整與 bug 修復，無需共用基礎架構。各 User Story 修改的檔案互不重疊，可平行執行。

---

## Phase 3: User Story 1 - 消除技術專有名詞誤報 (Priority: P1) 🎯 MVP

**Goal**: 將 CyberBrick 品牌名稱、國際技術縮寫、HELPURL 加入白名單，消除相關誤報

**Independent Test**: 執行 `npm run validate:i18n` 確認 CyberBrick、LED、GPIO、HELPURL 相關 key 不再產生誤報

### Implementation for User Story 1

-   [x] T004 [US1] 更新白名單版本為 `1.2.0` 並更新 `lastUpdated` 時間戳記於 `scripts/i18n/audit-whitelist.json`
-   [x] T005 [US1] 新增 `cyberbrick-brand-terms` 規則至 `missingTranslation.rules` 於 `scripts/i18n/audit-whitelist.json`
-   [x] T006 [US1] 新增 `technical-acronyms-global` 規則至 `missingTranslation.rules` 於 `scripts/i18n/audit-whitelist.json`
-   [x] T007 [US1] 新增 `helpurl-exclusion` 規則至所有適用的問題類型（missingTranslation、directTranslation、lengthOverflow）於 `scripts/i18n/audit-whitelist.json`
-   [x] T008 [US1] 更新白名單 `statistics` 區塊的 `totalRules` 計數於 `scripts/i18n/audit-whitelist.json`

**Checkpoint**: 執行 `npm run validate:i18n`，確認：

-   BOARD*CYBERBRICK、CATEGORY_CYBERBRICK*\* 無誤報
-   _\_LED、_\_GPIO、_\_PWM、_\_HELPURL 相關 key 無誤報

---

## Phase 4: User Story 2 - 修復俄語變數名稱錯誤 (Priority: P1) 🎯 MVP

**Goal**: 修復俄語翻譯檔案中使用西里爾字母的 key 名稱，確保翻譯正確載入

**Independent Test**:

1. 使用 grep 確認俄語有 `CONTROLS_IF_ELSE_TITLE_ELSE` (拉丁字母)
2. 在俄語環境中開啟編輯器，確認 if-else 積木顯示「иначе」

### Implementation for User Story 2

-   [x] T009 [US2] 修改 `media/locales/ru/messages.js` 第 272 行，將 `CONTROLS_IF_ELSE_TITLE_ELСЕ`（末尾 СЕ 為西里爾字母 U+0421 U+0415）改為 `CONTROLS_IF_ELSE_TITLE_ELSE`（全部為拉丁字母）
-   [x] T010 [US2] 驗證修正：使用 grep 搜尋確認所有語言的 key 名稱一致

**Checkpoint**: 俄語 key 數量應與繁體中文一致（453 個）

---

## Phase 5: User Story 3 - 減少 CJK 語言誤報 (Priority: P2)

**Goal**: 為日文、韓文、繁體中文放寬檢測閾值，減少因字元效率差異造成的誤報

**Independent Test**: 對比修改前後的審計報告，確認 CJK 語言的 `directTranslation` 和 `lengthOverflow` 問題減少 50%+

### Implementation for User Story 3

-   [x] T011 [P] [US3] 修改 `scripts/i18n/lib/detectors/direct-translation.js` 第 68-69 行的 `hasDirectWordCount()` 函數，將 CJK 閾值從 `ratio > 0.8 && ratio < 1.2` 改為 `ratio > 0.6 && ratio < 1.4`（±40%）
-   [x] T012 [P] [US3] 修改 `scripts/i18n/lib/detectors/length-overflow.js` 第 28-34 行的 `checkLengthRatio()` 函數，新增 `language` 參數並為 CJK 語言將 `ratio < 0.5` 改為 `ratio < 0.3`（30% 下限）
-   [x] T013 [US3] 定義 CJK 語言常數陣列 `['ja', 'ko', 'zh-hant']` 供兩個檢測器共用（與 spec.md FR-004/FR-005 一致）

**Checkpoint**: 執行 `npm run validate:i18n`，確認：

-   日文 (ja) 的 directTranslation 問題減少
-   韓文 (ko) 的 lengthOverflow (too-short) 問題減少
-   繁體中文 (zh-hant) 的相關問題減少

---

## Phase 6: User Story 4 - 降級 culturalMismatch 檢測 (Priority: P2)

**Goal**: 將文化適切性檢測的嚴重性強制設為 `low`，避免阻擋 PR

**Independent Test**: 執行審計後確認所有 culturalMismatch 問題的 severity 都是 `low`，且 PR 不會因此失敗

### Implementation for User Story 4

-   [x] T014 [P] [US4] 修改 `scripts/i18n/lib/detectors/cultural-mismatch.js` 第 125-134 行的 `determineSeverity(key)` 函數，移除頻率判斷邏輯，強制返回 `'low'`
-   [x] T015 [P] [US4] 修改 `.github/workflows/i18n-validation.yml`，在 PR 失敗條件中排除 `culturalMismatch` 類型

**Checkpoint**: 執行 `npm run validate:i18n`，確認：

-   所有 culturalMismatch 問題的 severity 為 `low`
-   高嚴重度問題總數大幅降低

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 最終驗證與文件更新

-   [x] T016 執行完整審計驗證：`npm run validate:i18n`，確認高嚴重度問題從 31 降至 5 以下
-   [ ] T017 [P] 更新 `translation-stats.md` 反映新的審計結果
-   [x] T018 執行 quickstart.md 中的驗證步驟確認所有 Success Criteria 達成
-   [ ] T019 關閉 Issue #29 並附上修改摘要

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無相依 - 可立即開始
-   **Foundational (Phase 2)**: 無阻擋型作業
-   **User Stories (Phase 3-6)**: 各 Story 修改的檔案互不重疊，可平行執行
-   **Polish (Phase 7)**: 依賴所有 User Stories 完成

### User Story Dependencies

-   **User Story 1 (P1)**: 修改 `audit-whitelist.json` - 無相依
-   **User Story 2 (P1)**: 修改 `media/locales/ru/messages.js` - 無相依
-   **User Story 3 (P2)**: 修改 `direct-translation.js`, `length-overflow.js` - 無相依
-   **User Story 4 (P2)**: 修改 `cultural-mismatch.js`, `i18n-validation.yml` - 無相依

### Within Each User Story

-   T004-T008 (US1): 依序執行，因為修改同一檔案
-   T009-T010 (US2): 依序執行
-   T011-T013 (US3): T011, T012 可平行，T013 建議先執行
-   T014-T015 (US4): 可平行執行（不同檔案）

### Parallel Opportunities

```bash
# 所有 User Stories 可平行執行（修改不同檔案）:
# 開發者 A: User Story 1 (audit-whitelist.json)
# 開發者 B: User Story 2 (ru/messages.js)
# 開發者 C: User Story 3 (detectors/*.js)
# 開發者 D: User Story 4 (cultural-mismatch.js, yml)
```

---

## Parallel Example: All User Stories

```bash
# 四個 User Stories 可同時開始（不同檔案、無相依）：

# US1: 白名單更新
Task T004-T008: 修改 scripts/i18n/audit-whitelist.json

# US2: 俄語修復
Task T009-T010: 修改 media/locales/ru/messages.js

# US3: CJK 閾值調整（可平行）
Task T011: 修改 scripts/i18n/lib/detectors/direct-translation.js
Task T012: 修改 scripts/i18n/lib/detectors/length-overflow.js

# US4: culturalMismatch 降級（可平行）
Task T014: 修改 scripts/i18n/lib/detectors/cultural-mismatch.js
Task T015: 修改 .github/workflows/i18n-validation.yml
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup - 確認檔案存在
2. Complete User Story 1 - 白名單擴展（最大影響）
3. Complete User Story 2 - 俄語 bug 修復
4. **STOP and VALIDATE**: 執行 `npm run validate:i18n`
5. 確認 CyberBrick 誤報消除、俄語 key 正常

### Incremental Delivery

1. MVP (US1 + US2) → 解決 Issue #29 的核心問題
2. Add User Story 3 → CJK 誤報大幅減少
3. Add User Story 4 → culturalMismatch 不再阻擋 PR
4. Polish → 驗證所有 Success Criteria

### Success Criteria Checklist

-   [x] SC-001: 高嚴重度問題 < 5（原 31）
-   [x] SC-002: CyberBrick 相關 key 無誤報
-   [x] SC-003: \*\_HELPURL key 無誤報
-   [x] SC-004: CJK directTranslation 問題減少 50%+
-   [x] SC-005: CJK lengthOverflow (too-short) 減少 40%+
-   [x] SC-006: PR 不因 culturalMismatch 失敗
-   [x] SC-007: 俄語 key 數量 = 453
-   [x] SC-008: 俄語 if-else 顯示「иначе」

---

## Notes

-   [P] 任務 = 不同檔案、無相依
-   [Story] 標籤將任務對應到特定 User Story
-   每個 User Story 可獨立完成與測試
-   每個任務或邏輯群組後提交 commit
-   可在任何 Checkpoint 停下來獨立驗證 Story
-   避免：模糊任務、同檔案衝突、跨 Story 相依
