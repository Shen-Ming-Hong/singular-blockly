---

description: "Task list for removing CyberBrick Timer experimental markers"
---

# Tasks: 移除 CyberBrick Timer 實驗標記

**Input**: Design documents from `/specs/033-remove-timer-experimental/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: 本規格未要求自動化測試；採手動 WebView 驗證。

**Organization**: Tasks 依 User Story 分組，確保每個故事可獨立完成與驗證。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無依賴）
- **[Story]**: 任務所屬 User Story（US1、US2）
- 每個任務描述需包含明確檔案路徑

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 盤點現況與確認最小變更範圍

- [ ] T001 盤點實驗標記來源與影響範圍，對照 `media/blockly/blocks/cyberbrick.js`、`media/js/experimentalBlockMarker.js`
- [ ] T002 [P] 檢查字典與生成來源是否含 Timer experimental 標記，對照 `scripts/generate-block-dictionary.js`、`src/mcp/block-dictionary.json`
- [ ] T003 [P] 確認手動驗證步驟與案例，對照 `specs/033-remove-timer-experimental/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心前置條件（完成後才能進入 User Story）

- [ ] T004 確認不需改動實驗提示邏輯，決策對照 `specs/033-remove-timer-experimental/research.md`

**Checkpoint**: Foundation ready — 可開始 User Story 實作

---

## Phase 3: User Story 1 - Timer 積木不顯示實驗提示 (Priority: P1) ⭐ MVP

**Goal**: Timer 積木在工具箱與工作區不再顯示實驗性視覺標記或提示

**Independent Test**: 依 `specs/033-remove-timer-experimental/quickstart.md` 步驟 2–4 驗證

### Implementation for User Story 1

- [ ] T005 [US1] 移除 `cyberbrick_ticks_ms` 的實驗註冊 `window.potentialExperimentalBlocks.push`，更新 `media/blockly/blocks/cyberbrick.js`
- [ ] T006 [US1] 移除 `cyberbrick_ticks_diff` 的實驗註冊 `window.potentialExperimentalBlocks.push`，更新 `media/blockly/blocks/cyberbrick.js`
- [ ] T007 [P] [US1] 若字典仍標示 experimental，調整生成來源並重生，涉及 `scripts/generate-block-dictionary.js`、`src/mcp/block-dictionary.json`
- [ ] T008 [US1] 依 `specs/033-remove-timer-experimental/quickstart.md` 完成 Timer 無提示驗證（步驟 2–4）

**Checkpoint**: User Story 1 可獨立驗證完成

---

## Phase 4: User Story 2 - 舊專案相容且其他實驗積木不受影響 (Priority: P2)

**Goal**: 既有專案載入後 Timer 不觸發提示，其他實驗積木提示維持

**Independent Test**: 依 `specs/033-remove-timer-experimental/quickstart.md` 步驟 5–6 驗證

### Implementation for User Story 2

- [ ] T009 [US2] 驗證包含其他實驗積木的工作區仍顯示提示，依 `specs/033-remove-timer-experimental/quickstart.md`
- [ ] T010 [US2] 驗證既有含 Timer 積木的專案不顯示提示，依 `specs/033-remove-timer-experimental/quickstart.md`

**Checkpoint**: User Story 2 可獨立驗證完成

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 交叉確認與一致性檢查

- [ ] T011 [P] 若執行字典重生，確認 Timer 未標示 experimental，對照 `src/mcp/block-dictionary.json`
- [ ] T012 [P] 最終自查：確認不需修改 `media/js/experimentalBlockMarker.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成，阻塞所有 User Story
- **User Story 1 (Phase 3)**: 依賴 Foundational 完成
- **User Story 2 (Phase 4)**: 依賴 Foundational 完成，可在 US1 後或平行驗證
- **Polish (Phase 5)**: 建議在 US1/US2 完成後執行

### User Story Dependencies

- **US1**：無其他故事依賴，完成後即可作為 MVP
- **US2**：可在 US1 後進行，確保相容性與提示行為

### Parallel Opportunities

- T002、T003 可與 T001 平行
- T007（若需要）可與 T005/T006 平行（不同檔案）
- Phase 5 兩項可平行執行

---

## Parallel Example: User Story 1

```bash
# 可同時處理（不同檔案）
Task: "移除 cyberbrick_ticks_ms 實驗註冊（media/blockly/blocks/cyberbrick.js）"
Task: "若需，調整字典生成來源（scripts/generate-block-dictionary.js）"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1 + Phase 2
2. 完成 US1（T005–T008）
3. 依 quickstart 手動驗證

### Incremental Delivery

1. 完成 US1 後，執行 US2 相容性驗證
2. 完成 Phase 5 交叉檢查

---

## Notes

- [P] 表示可平行執行的任務
- 每個任務皆包含檔案路徑，便於直接執行
- 本次不新增自動化測試；以 quickstart 手動驗證為準
