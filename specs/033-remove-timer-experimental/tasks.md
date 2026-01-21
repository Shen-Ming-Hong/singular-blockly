---

description: "移除 CyberBrick Timer 實驗標記的任務清單"
---

# 任務清單：移除 CyberBrick Timer 實驗標記

**輸入**：`/specs/033-remove-timer-experimental/` 的設計文件  
**前置條件**：plan.md（必要）、spec.md（必要，含使用者故事）、research.md、data-model.md、contracts/、quickstart.md

**測試**：本規格未要求自動化測試；採手動 WebView 驗證。

**分組方式**：任務依使用者故事分組，確保每個故事可獨立完成與驗證。

## 格式：`[ID] [P?] [故事] 描述`

- **[P]**：可平行執行（不同檔案、無依賴）
- **[故事]**：任務所屬使用者故事（US1、US2）
- 每個任務描述需包含明確檔案路徑

---

## 階段 1：準備（共用基礎）

**目的**：盤點現況與確認最小變更範圍

- [x] T001 盤點實驗標記來源與影響範圍，對照 `media/blockly/blocks/cyberbrick.js`、`media/js/experimentalBlockMarker.js`
- [x] T002 [P] 檢查字典與生成來源是否含 Timer 實驗標記，對照 `scripts/generate-block-dictionary.js`、`src/mcp/block-dictionary.json`
- [x] T003 [P] 確認手動驗證步驟與案例，對照 `specs/033-remove-timer-experimental/quickstart.md`

---

## 階段 2：基礎前置（阻塞性條件）

**目的**：核心前置條件（完成後才能進入使用者故事）

- [x] T004 確認不需改動實驗提示邏輯，決策對照 `specs/033-remove-timer-experimental/research.md`

**檢核點**：基礎就緒 — 可開始使用者故事實作

---

## 階段 3：使用者故事 1 - Timer 積木不顯示實驗提示（優先級：P1，MVP）

**目標**：Timer 積木在工具箱與工作區不再顯示實驗性視覺標記或提示

**獨立驗證**：依 `specs/033-remove-timer-experimental/quickstart.md` 驗證

### 使用者故事 1 實作

- [x] T005 [US1] 移除 `cyberbrick_ticks_ms` 的實驗註冊 `window.potentialExperimentalBlocks.push`，更新 `media/blockly/blocks/cyberbrick.js`
- [x] T006 [US1] 移除 `cyberbrick_ticks_diff` 的實驗註冊 `window.potentialExperimentalBlocks.push`，更新 `media/blockly/blocks/cyberbrick.js`
- [x] T007 [P] [US1] 若字典仍標示「實驗」，僅調整 `scripts/generate-block-dictionary.js` 並重生，`src/mcp/block-dictionary.json` 僅做結果驗證
- [x] T008 [US1] 依 `specs/033-remove-timer-experimental/quickstart.md` 完成 Timer 無提示驗證
- [x] T009 [US1] 驗證空白工作區不顯示提示，對照 `specs/033-remove-timer-experimental/quickstart.md`
- [x] T010 [US1] 驗證同時多個 Timer 積木不觸發提示，對照 `specs/033-remove-timer-experimental/quickstart.md`

**檢核點**：使用者故事 1 可獨立驗證完成

---

## 階段 4：使用者故事 2 - 舊專案相容且其他實驗積木不受影響（優先級：P2）

**目標**：既有專案載入後 Timer 不觸發提示，其他實驗積木提示維持

**獨立驗證**：依 `specs/033-remove-timer-experimental/quickstart.md` 驗證

### 使用者故事 2 實作

- [x] T011 [US2] 驗證包含其他實驗積木的工作區仍顯示提示，依 `specs/033-remove-timer-experimental/quickstart.md`
- [x] T012 [US2] 驗證既有含 Timer 積木的專案不顯示提示，依 `specs/033-remove-timer-experimental/quickstart.md`

**檢核點**：使用者故事 2 可獨立驗證完成

---

## 階段 5：收尾與交叉關注

**目的**：交叉確認與一致性檢查

- [x] T013 [P] 若執行字典重生，確認 Timer 未標示「實驗」，對照 `src/mcp/block-dictionary.json`
- [x] T014 [P] 最終自查：確認不需修改 `media/js/experimentalBlockMarker.js`

---

## 相依與執行順序

### 階段相依

- **準備（階段 1）**：可立即開始
- **基礎前置（階段 2）**：依賴準備完成，阻塞所有使用者故事
- **使用者故事 1（階段 3）**：依賴基礎前置完成
- **使用者故事 2（階段 4）**：依賴基礎前置完成，可在 US1 後或平行驗證
- **收尾（階段 5）**：建議在 US1/US2 完成後執行

### 使用者故事相依

- **US1**：無其他故事依賴，完成後即可作為 MVP
- **US2**：可在 US1 後進行，確保相容性與提示行為

### 可平行項

- T002、T003 可與 T001 平行
- T007（若需要）可與 T005/T006 平行（不同檔案）
- 階段 5 兩項可平行執行

---

## 平行示例：使用者故事 1

```bash
# 可同時處理（不同檔案）
任務： "移除 cyberbrick_ticks_ms 實驗註冊（media/blockly/blocks/cyberbrick.js）"
任務： "若需，調整字典生成來源（scripts/generate-block-dictionary.js）"
```

---

## 實作策略

### MVP 優先（僅使用者故事 1）

1. 完成階段 1 + 階段 2
2. 完成 US1（T005–T010）
3. 依 quickstart.md 手動驗證

### 漸進式交付

1. 完成 US1 後，執行 US2 相容性驗證
2. 完成階段 5 交叉檢查

---

## 備註

- [P] 表示可平行執行的任務
- 每個任務皆包含檔案路徑，便於直接執行
- 本次不新增自動化測試；以 quickstart 手動驗證為準


