# Tasks: 範本名稱多國語言化

**Input**: Design documents from `/specs/049-sample-name-i18n/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 可與其他 [P] 任務平行執行（不同檔案，無未完成的相依）
- **[Story]**: 對應 spec.md 中的 User Story（US1 / US2 / US3）
- 每個任務包含精確的檔案路徑

---

## Phase 1: Setup（共用基礎結構）

**目的**：在 `sampleBrowserService.ts` 建立 TypeScript 型別——所有後續階段的前提

- [ ] T001 在 `src/services/sampleBrowserService.ts` 新增 `NameTranslationEntry` 介面（14 個語系選填欄位 + 索引簽章）、`NameTranslations` 介面（`variables?` / `functions?`），並更新 `SampleWorkspace` 加入 `nameTranslations?: NameTranslations` 選填欄位，依據 [contracts/typescript-interfaces.md](contracts/typescript-interfaces.md)

**Checkpoint**：型別定義就位——Phase 2 兩條平行路徑可以同時開始

---

## Phase 2: Foundational（核心邏輯，阻塞所有 User Story）

**目的**：純函式實作與測試——在任何 User Story 可驗證前必須全部完成

**⚠️ 重要**：T002 / T003 可平行執行（不同檔案）；T004 需等 T002 + T003 都完成

- [ ] T002 [P] 在 `src/services/sampleBrowserService.ts` 實作 `isValidIdentifier(name: string): boolean`（不匯出），使用 `/^[^\d\W]\w*$/u` 正規表達式，符合 Python 3 PEP 3131 識別字規則（FR-005）
- [ ] T003 [P] 在 `src/test/services/sampleBrowserService.test.ts` 新增 `applyNameTranslations` 測試 suite，寫入 SC-004 全部 6 個情境的**失敗測試**（依 TDD）：SC1 變數名稱替換、SC2 函式定義替換、SC3 函式呼叫 extraState XML 替換（**需同時斷言**：翻譯後所有 `arduino_function_call` extraState 的 `name=` 值，必須與同 workspace 中對應 `arduino_function` `fields.NAME` 完全一致，無懸空參照——對應 SC-002）、SC4 深層巢狀積木遞迴、SC5 無效翻譯識別字回退、SC6 語系三層回退策略
- [ ] T004 在 `src/services/sampleBrowserService.ts` 實作並匯出 `applyNameTranslations(workspace, nameTranslations, language): object` 純函式，覆蓋 FR-003 全部四個替換目標：(a) `variables[].name`、(b) `arduino_function.fields.NAME`、(c) `arduino_function_call` extraState `mutation name="..."` 屬性、(d) `<arg name="...">` 屬性；使用 `JSON.parse(JSON.stringify())` 深層複製，實作三層回退（目標語系 → en → 原始名稱），確認 T003 全部測試通過

**Checkpoint**：執行 `npm test`——`applyNameTranslations` 6 個情境全數通過；Phase 3 / 4 / 5 現在可同時開工（有需要時）

---

## Phase 3: User Story 1 — 英文使用者載入範本（Priority: P1）🎯 MVP

**目標**：英文使用者載入 Soccer Robot 範本後，Blockly 積木與生成的 MicroPython 程式碼均使用英文識別字

**Independent Test**：將 VS Code UI 語言設為 `en`，從範例瀏覽器載入 Soccer Robot 範本，Blockly 工作區中所有積木顯示英文名稱（例如 `controller`、`joystick_forward_back`），MicroPython 程式碼輸出 `def controller():` 而非 `def 遙控器():`

- [ ] T005 [US1] 在 `src/webview/messageHandler.ts` 的 `handleLoadSelectedSample()` 中整合翻譯呼叫：在 `fetchSampleWorkspace()` 成功後、`postMessage` 前，呼叫 `applyNameTranslations(result.workspace, result.nameTranslations, resolvedLanguage)`；若 `nameTranslations` 未定義則略過（FR-006 向後相容）
- [ ] T006 [US1] 在 `media/samples/cyberbrick-soccer-robot.json` 頂層新增 `nameTranslations` 區塊，填入 **en 翻譯**——`variables` 映射：全部 15 個工作區變數名稱及 5 個函式參數名稱（共 20 個 key）；`functions` 映射：全部 12 個函式名稱，依 [data-model.md](data-model.md) 完整清單與 [quickstart.md](quickstart.md) 命名規則

**Checkpoint**：User Story 1 獨立可驗證——英文 UI 載入 Soccer Robot 後積木與程式碼均顯示英文識別字

---

## Phase 4: User Story 2 — 日文及多語使用者（Priority: P2）

**目標**：日文/其他語系使用者載入 Soccer Robot 範本後，看到母語識別字，驗證 Unicode MicroPython 識別字管線正確運作

**Independent Test**：將 VS Code UI 語言設為 `ja`，載入 Soccer Robot 範本後確認積木顯示日文識別字（例如 `コントローラー`）且 MicroPython 程式碼使用相同日文識別字（`def コントローラー():`)

- [ ] T007 [US2] 在 `media/samples/cyberbrick-soccer-robot.json` 的 `nameTranslations` 中，為所有 20 個名稱新增 `ja`、`ko` 翻譯，確保翻譯值皆為合法 Unicode 識別字（無空格、連字號、標點）
- [ ] T008 [US2] 在 `media/samples/cyberbrick-soccer-robot.json` 的 `nameTranslations` 中，為所有 20 個名稱補全剩餘 11 個語系翻譯：`de`、`fr`、`es`、`it`、`pt-br`、`ru`、`pl`、`cs`、`hu`、`bg`、`tr`，完成 FR-008 全部 14 個非 `zh-hant` 語系

**Checkpoint**：User Story 2 獨立可驗證——Soccer Robot 範本已具備全部 14 個語系的翻譯映射

---

## Phase 5: User Story 3 — 範本作者 Agent 工作流程（Priority: P3）

**目標**：更新 `add-cyberbrick-sample` SKILL.md，讓 Agent 在新增範本時自動生成 `nameTranslations` 區塊，不需作者手動逐一填寫

**Independent Test**：跟隨更新後的 SKILL.md 新增一個測試範本，Copilot Agent 在 Phase 2.5 步驟中輸出符合格式的 `nameTranslations` 區塊，最終 JSON 通過格式驗證

- [ ] T009 [US3] 更新 `.github/skills/add-cyberbrick-sample/SKILL.md`，在現有 Phase 2（積木截圖）與 Phase 3（建立 JSON 檔）之間插入 **Phase 2.5: Generate Name Translations**，內容包含：(a) 掃描策略——全量 `workspace.variables[].name` 與 `arduino_function.fields.NAME` 不設排除規則；(b) 14 個非 `zh-hant` 語系清單與翻譯對應表格式；(c) 識別字合法性規則（無空格、無連字號、不以數字開頭）；(d) 驗證 checklist

**Checkpoint**：User Story 3 獨立可驗證——新增範本流程包含 nameTranslations 自動生成步驟

---

## Final Phase: Polish & 跨情境驗證

**目的**：確認整體品質，排除回歸

- [ ] T010 [P] 執行 `npm run compile` 確認 TypeScript 無編譯錯誤；執行 `npm test` 確認 SC-003（舊版不含 `nameTranslations` 的範本載入成功率 100%，零回歸）與 SC-004（6 個情境全數通過）；確認 `package.json` 的 `dependencies` 與 `devDependencies` 與實作前相比**無新增項目**（NFR-A 零依賴約束）

---

## Dependencies & 執行順序

### Phase 依賴

```text
Phase 1 (T001)  ──→  Phase 2 (T002 ∥ T003 → T004)
                               ↓
              Phase 3 (T005 → T006)   ← MVP 完成點
                               ↓
              Phase 4 (T007 → T008)
              Phase 5 (T009)          ← 與 Phase 4 可平行（不同檔案）
                               ↓
              Final Phase (T010)
```

### User Story 相依關係

- **US1 (P1)**：T001 + T004 完成後即可開始（T005 → T006）
- **US2 (P2)**：T006 完成後可開始（T007 → T008）；在 Phase 3 就緒後可立即接續
- **US3 (P3)**：T004 完成後即可開始（T009）；與 Phase 4 完全平行（操作不同檔案）

### Phase 2 內部平行機會

```text
T002 [sampleBrowserService.ts]  ─┐
                                  ├─→ T004 [applyNameTranslations 實作]
T003 [sampleBrowserService.test.ts] ─┘
```

---

## 平行執行範例

### Phase 2 平行執行

```text
開發者 A：T002 — 在 sampleBrowserService.ts 實作 isValidIdentifier()
開發者 B：T003 — 在 sampleBrowserService.test.ts 撰寫 6 個失敗測試情境
→ 完成後合併，由開發者 A 繼續執行 T004
```

### Phase 4 + Phase 5 平行執行

```text
開發者 A：T007 → T008 — 補全 Soccer Robot JSON 多語系翻譯
開發者 B：T009 — 更新 SKILL.md Phase 2.5
→ 兩者操作不同檔案，無衝突
```

---

## Implementation Strategy

### MVP First（僅 User Story 1）

1. 完成 Phase 1（T001）：建立型別
2. 完成 Phase 2（T002 → T003 → T004）：核心邏輯 + 測試
3. 完成 Phase 3（T005 → T006）：整合 + 英文翻譯
4. **STOP & VALIDATE**：英文 UI 載入 Soccer Robot，確認端到端運作
5. 若通過，進入 Phase 4 + Phase 5

### Incremental Delivery

1. Phase 1 + Phase 2 完成 → 核心函式就緒
2. Phase 3 完成 → **MVP！** 英文使用者受益
3. Phase 4 完成 → 日文 + 13 個語系使用者受益
4. Phase 5 完成 → 範本作者工作流程完整
5. 每個階段均可獨立部署與展示

---

## Notes

- `applyNameTranslations()` 為純函式，測試無需 sinon stub，直接呼叫並比對輸出物件即可
- Soccer Robot 範本的所有 20 個需翻譯名稱已列於 [data-model.md](data-model.md) 完整清單
- 翻譯值填寫規則與 quickstart 範例見 [quickstart.md](quickstart.md)
- `zh-hant` 使用者無需翻譯條目——系統直接保留原始中文名稱
- `[P]` 標記的任務操作不同檔案，不會產生合併衝突
