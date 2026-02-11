# Specification Analysis Report: 防止孤立積木產生無效程式碼

**Feature**: `044-prevent-orphan-blocks`
**Analysis Date**: 2025-07-15
**Artifacts Analyzed**: spec.md, plan.md, tasks.md, data-model.md, research.md, contracts/generator-interfaces.md, contracts/block-warning-events.md
**Constitution Version**: 1.6.0

---

## Findings Table

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| F1 | Inconsistency | HIGH | data-model.md:L110, research.md:L185-199, contracts/generator-interfaces.md:L162-177, contracts/block-warning-events.md:L46-48 | i18n 鍵值不一致：spec FR-008 要求雙鍵 `ORPHAN_BLOCK_WARNING_ARDUINO` / `ORPHAN_BLOCK_WARNING_MICROPYTHON`，但四份設計文件均使用單一 `ORPHAN_BLOCK_WARNING` 鍵 | 更新四份設計文件統一使用 spec FR-008 的雙鍵設計 |
| F2 | Underspecification | HIGH | tasks.md:L108-114 (T031-T034), plan.md:L179-186 (RN-003) | Blockly 內建迴圈積木 onchange 策略缺失：T031-T034 指定在 blocks/loops.js 新增 onchange，但 `controls_repeat_ext`/`controls_whileUntil`/`controls_for`/`controls_forEach` 是 Blockly 內建積木，定義不在該檔案中。RN-003 僅針對 `controls_if` 說明此問題 | 在 T031-T034 補充說明需透過 Extension/Mixin 或 post-init onchange 覆寫方式掛載，與 T037 使用相同機制 |
| F3 | Inconsistency | HIGH | tasks.md:L88 (T027), micropython/loops.js:L114 | MicroPython flow statements forBlock 名稱不匹配：T027 指定 `singular_flow_statements` 但實際 micropython/loops.js 使用 `controls_flow_statements` | 實作時需先重命名 micropython/loops.js 中的 forBlock 鍵，或在 T027 記載前置修正步驟 |
| F4 | Inconsistency | HIGH | contracts/generator-interfaces.md:L139-177, contracts/block-warning-events.md:L30-50 | 合約 onchange 範例使用單鍵且 fallback 僅提及 setup/loop，與 spec FR-008 generator-specific 雙鍵需求衝突 | 更新合約範例使用 generator 模式判斷邏輯 |
| C1 | Inconsistency | MEDIUM | spec.md:L102 (FR-003) | spec 使用 `controls_flow_statements` 名稱，實際程式碼為 `singular_flow_statements`（Arduino）和 `controls_flow_statements`（MicroPython）| 在 spec FR-003 加入括號說明對應關係 |
| C2 | Underspecification | MEDIUM | tasks.md:L115 (T038), plan.md:L256-260 (RN-008) | Generator 模式偵測方案未定：T038 列出三個可行方案但未做決策 | 選定偵測方案（建議：全域變數 `window.currentGeneratorType`）|
| C3 | Coverage | MEDIUM | tasks.md:L46 (T006), micropython/index.js:L106-148 | T006 描述為驗證性任務「verify...add if missing」，但 MicroPython workspaceToCode 確實缺少跳過註解 | 將 T006 改為明確實作任務 |
| C4 | Ambiguity | MEDIUM | contracts/block-warning-events.md:L30-50 | onchange 範例不過濾事件類型，所有事件（含非結構性事件）都會觸發容器檢查 | 加入事件類型過濾（僅 BLOCK_MOVE、BLOCK_CREATE、FINISHED_LOADING）|
| C5 | Duplication | MEDIUM | data-model.md:L110-131, contracts/block-warning-events.md:L30-50, contracts/generator-interfaces.md:L139-149 | 單一 i18n 鍵設計重複出現在三份設計文件中（F1 根源）| 統一修正為雙鍵，消除重複的錯誤參考 |
| D1 | Underspecification | LOW | tasks.md:L77 (T019), plan.md:L196 (RN-004) | `controls_duration` 超出 spec FR-003 範圍，作為增強項目加入 | 可在 spec 加註或保持現狀 |
| D2 | Inconsistency | LOW | research.md:L185-199, quickstart.md | research.md 和 quickstart.md i18n 範例仍使用舊的單鍵設計 | 後續文件修訂時一併更新 |
| D3 | Ambiguity | LOW | spec.md:L132 (SC-003) | 「1 秒內」警告回應時間不具精確可測量性（onchange 為同步回呼，毫秒級）| 保持現有描述（使用者感知層面要求）|
| D4 | Consistency Check | LOW | src/test/suite/ | 新測試檔案命名（orphan-block-guard.test.ts）與現有風格一致 | 無需修改（確認性檢查）|

---

## Coverage Summary Table

| Requirement Key | Description | Has Task? | Task IDs | Notes |
|-----------------|-------------|-----------|----------|-------|
| FR-001 | 過濾不在合法頂層容器內的頂層積木 | ✅ | T001, T005, T006 | |
| FR-002 | 提供共用 isInAllowedContext 檢查機制 | ✅ | T002, T003, T004 | |
| FR-003 | 列舉控制/流程積木 forBlock guard | ✅ | T015-T027 | T019 為 spec 增強項目 |
| FR-004 | 雙 generator 同時實施過濾與防護 | ✅ | T003-T006, T015-T027 | |
| FR-005 | 孤立積木顯示視覺化警告 | ✅ | T031-T038 | 需注意內建積木掛載策略 (F2) |
| FR-006 | 移入合法容器後自動清除警告 | ✅ | T031-T038 | |
| FR-007 | 保留始終生成積木機制 | ✅ | T005, T029 | |
| FR-008 | i18n 多語系警告（雙鍵） | ✅ | T038-T053 | 設計文件使用單鍵待修正 (F1) |
| FR-009 | 正確嵌套積木不受影響 | ✅ | T028-T030 | |
| FR-010 | 工作區變更事件後重新評估 | ✅ | T031-T038 | 建議增加事件類型過濾 (C4) |

---

## Constitution Alignment Issues

**No constitution violations detected.** 所有設計決策均符合憲法 11 項核心原則：

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. 簡潔性與可維護性 | ✅ | `isInAllowedContext()` 為 ~10 行純函式 |
| II. 模組化與擴展性 | ✅ | 使用可設定的允許清單陣列 |
| III. 避免過度開發 | ✅ | `controls_duration` 增強已記錄為 RN-004 |
| VII. 全面測試覆蓋 | ✅ | T007-T014, T028-T030, T054-T058 涵蓋核心邏輯 |
| VIII. 純函式架構 | ✅ | `isInAllowedContext` 為純函式 |
| IX. 繁體中文文件 | ✅ | 所有 spec artifacts 以繁體中文撰寫 |

---

## Unmapped Tasks

所有任務均已映射到至少一個 Functional Requirement。無孤立任務。

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Requirements (FR) | 10 |
| Total Tasks | 59 (T001-T059) |
| Coverage % (requirements with ≥1 task) | **100%** |
| Ambiguity Count | 2 (C4, D3) |
| Duplication Count | 1 cluster across 4 files (F1/C5) |
| Critical Issues | **0** |
| High Issues | **4** (F1, F2, F3, F4) |
| Medium Issues | **5** (C1, C2, C3, C4, C5) |
| Low Issues | **4** (D1, D2, D3, D4) |
| Total Issues | **13** |

---

## Next Actions

### 建議在 `/speckit.implement` 前解決的問題：

1. **F1/F4/C5 — i18n 雙鍵統一**：修正 data-model.md §5、contracts/generator-interfaces.md 合約4-5、contracts/block-warning-events.md 合約1 中的 i18n 鍵值，統一使用 `ORPHAN_BLOCK_WARNING_ARDUINO` / `ORPHAN_BLOCK_WARNING_MICROPYTHON`
2. **F2 — 內建積木 onchange 策略**：在 tasks.md T031-T034 補充說明需透過 Blockly Extension 機制掛載 onchange，與 T037 統一策略
3. **F3 — MicroPython forBlock 名稱**：在 tasks.md T027 中新增前置步驟「重命名 micropython/loops.js 中 `controls_flow_statements` 為 `singular_flow_statements`」
4. **C1 — spec 積木名稱**：在 spec.md FR-003 加入 `controls_flow_statements（程式碼中為 singular_flow_statements）` 說明
5. **C2 — Generator 偵測決策**：在 T038 中選定 `window.currentGeneratorType` 方案
6. **C3 — T006 描述強化**：改為明確實作任務
7. **C4 — onchange 事件過濾**：更新 block-warning-events.md 合約1 範例

### 可在實作階段處理的問題：

- D1 (`controls_duration` scope) — 已由 RN-004 記錄
- D2 (research.md/quickstart.md 範例) — 不影響實作
- D3 (SC-003 可測量性) — 使用者感知層面要求
- D4 (命名確認) — 已確認一致

### 建議命令：

```bash
# 修正設計文件中的 i18n 鍵值 (F1/F4/C5)
# → 手動編輯 data-model.md, contracts/*.md

# 補充 tasks.md 中的內建積木策略說明 (F2)
# → 手動編輯 tasks.md T031-T034, T037

# 修正 spec.md 積木名稱 (C1)
# → 手動編輯 spec.md FR-003

# 或重新執行 speckit 流程：
/speckit.specify  # 修正 FR-003 積木名稱
/speckit.plan     # 更新設計文件 i18n 鍵值
/speckit.tasks    # 補充 T031-T034 策略說明
```

---

## Remediation Summary

### Applied Fixes (9 issues resolved across 5 files)

All HIGH and MEDIUM severity issues have been fixed with minimal, git-friendly edits.

#### File: `specs/044-prevent-orphan-blocks/data-model.md`

| Issue | Edit Description |
|-------|-----------------|
| F1/C5 | §5 OrphanBlockWarning entity: Changed single `key` field (`ORPHAN_BLOCK_WARNING`) to dual fields `key_arduino` (`ORPHAN_BLOCK_WARNING_ARDUINO`) and `key_micropython` (`ORPHAN_BLOCK_WARNING_MICROPYTHON`) |
| F1/C5 | Renamed section header from「語系範例」to「語系範例（Arduino — 提及 setup()/loop()/函式）」|
| F1/C5 | Added complete「語系範例（MicroPython — 提及 main()/函式）」table with 15 locale translations |

#### File: `specs/044-prevent-orphan-blocks/contracts/generator-interfaces.md`

| Issue | Edit Description |
|-------|-----------------|
| F1/F4 | 合約4: Changed single `getMessage('ORPHAN_BLOCK_WARNING')` to generator-mode-aware selection using `ORPHAN_BLOCK_WARNING_ARDUINO` / `ORPHAN_BLOCK_WARNING_MICROPYTHON` |
| F1/F4 | 合約5: Changed `ORPHAN_BLOCK_WARNING: string` to dual properties `ORPHAN_BLOCK_WARNING_ARDUINO: string` and `ORPHAN_BLOCK_WARNING_MICROPYTHON: string` with generator-specific JSDoc |
| F1/F4 | 合約5 行為規範: Updated MUST rules to reference dual keys and generator-specific message content |

#### File: `specs/044-prevent-orphan-blocks/contracts/block-warning-events.md`

| Issue | Edit Description |
|-------|-----------------|
| F1/F4 | 合約1 onchange 範例: Changed `getMessage('ORPHAN_BLOCK_WARNING')` to generator-mode-aware `getMessage(warningKey)` using `window.currentGeneratorType` |
| C4 | 合約1 onchange 範例: Added event type filtering — only processes `BLOCK_MOVE`, `BLOCK_CREATE`, `FINISHED_LOADING` events |
| F1/F4 | singular_flow_statements onchange 範例: Same dual-key and event filtering updates |

#### File: `specs/044-prevent-orphan-blocks/spec.md`

| Issue | Edit Description |
|-------|-----------------|
| C1 | FR-003: Added `（程式碼中為 singular_flow_statements）` after `controls_flow_statements` to clarify actual codebase name |

#### File: `specs/044-prevent-orphan-blocks/tasks.md`

| Issue | Edit Description |
|-------|-----------------|
| F2 | T031-T034: Appended `NOTE: Blockly 內建積木，需透過 Extension/Mixin 或 post-init onchange 覆寫方式掛載（同 T037 策略）` |
| F3 | T027: Appended `NOTE: 目前 micropython/loops.js 使用 controls_flow_statements 鍵名，需先重命名為 singular_flow_statements 以匹配 blocks/loops.js 積木定義` |
| C2 | T038: Changed vague `determine current generator mode via window.currentGeneratorType or similar mechanism` to specific `使用 window.currentGeneratorType 全域變數判斷當前 generator 模式（需在 generator 切換時由 blocklyEdit.js 設定）` |
| C3 | T006: Changed from `Verify...confirm...add if missing` to `Enhance...confirm existing...then add...for orphan blocks that are filtered out (currently silently skipped)` |

### Remaining Issues (LOW severity — no action taken)

| ID | Summary | Rationale for Deferral |
|----|---------|----------------------|
| D1 | `controls_duration` outside spec FR-003 scope | Already documented in RN-004; tasks correctly handle as enhancement |
| D2 | research.md/quickstart.md stale i18n examples | Non-blocking; tasks.md already uses correct dual keys |
| D3 | SC-003 "1 second" precision | User-perception-level requirement; not a functional defect |
| D4 | Test file naming convention | Confirmed consistent; no change needed |

### Post-Fix Metrics

| Metric | Before | After |
|--------|--------|-------|
| Critical Issues | 0 | 0 |
| High Issues | 4 | **0** ✅ |
| Medium Issues | 5 | **0** ✅ |
| Low Issues | 4 | 4 (deferred) |
| Files Modified | — | 5 |
| Total Edits | — | 13 |

---

*Report generated by `/speckit.analyze` with remediation applied.*
*Analysis date: 2025-07-15 | Remediation applied: 2025-07-15*
