# Tasks: TXT 虛擬控制畫布

**輸入**: `/specs/053-txt-virtual-controls/` 內的設計文件  
**前置文件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`quickstart.md`、`contracts/`

**測試要求**: 本功能規格與計劃明確要求 save/load、一致性、runtime、invalid reference 與 WebView 手動驗證，因此任務清單同時包含必要的自動化測試與需記錄結果的手動驗證任務。  
**組織方式**: 任務依使用者故事分組，確保每個故事都能獨立實作、獨立驗證與逐步交付。

## 階段 1：共用基礎設置

**目的**: 建立本功能共用型別、TXT companion runtime 骨架與 Host service 骨架

- [ ] T001 在 `src/types/txtVirtualControls.ts` 建立 TXT 虛擬控制共享型別
- [ ] T002 [P] 在 `txt-runtime/virtual_controls_runtime.py` 建立 companion runtime 骨架與 session/state-file helper
- [ ] T003 [P] 在 `src/services/txtVirtualControlRuntimeService.ts` 建立 Host runtime service 骨架、埠號推導與 HTTP helper

---

## 階段 2：核心前置基礎（阻擋所有故事）

**目的**: 建立所有使用者故事都依賴的共享 state、身分 helper、訊息通道與積木骨架

**⚠️ 關鍵要求**: 完成這一階段前，不應開始任何使用者故事實作

- [ ] T004 在 `media/js/blocklyEdit.js` 建立單一 `txtVirtualControls` in-memory store 與畫布模式控制器
- [ ] T005 [P] 在 `media/js/blocklyEdit.js` 建立 `stableId` 產生器、`identifier` 正規化與重名解決 helper
- [ ] T006 [P] 在 `src/webview/messageHandler.ts` 擴充 TXT 虛擬控制 message payload handling
- [ ] T007 [P] 在 `media/locales/{bg,cs,de,en,es,fr,hu,it,ja,ko,pl,pt-br,ru,tr,zh-hant}/messages.js` 新增共享文案 key
- [ ] T008 [P] 在 `media/blockly/blocks/txt.js` 與 `media/toolbox/categories/txt.json` 註冊 `txt_virtual_button_state` 積木骨架與 toolbox placeholder

**檢查點**: 共享 state、身分模型、訊息通道與積木骨架已就緒，使用者故事可以開始實作

---

## 階段 3：使用者故事 1 - 建立與排版虛擬控制（優先級：P1）🎯 MVP

**目標**: 在同一個 Blockly WebView 中提供可新增、編輯、拖曳與即時調整大小的 TXT 虛擬按鈕畫布。  
**獨立驗證**: 在 TXT 專案中建立 4 顆按鈕，依序改名並拖曳到不同位置；若畫布能即時更新位置、名稱與尺寸，且未執行時點擊不進入按下狀態，即視為通過。

### 實作任務

- [ ] T009 [P] [US1] 在 `media/html/blocklyEdit.html` 新增 TXT 虛擬控制工具列入口、畫布容器與空狀態結構
- [ ] T010 [P] [US1] 在 `media/css/blocklyEdit.css` 新增畫布、拖曳按鈕、選取狀態與編輯模式樣式
- [ ] T011 [US1] 在 `media/js/blocklyEdit.js` 實作新增按鈕、空畫布渲染與基本編輯選取流程
- [ ] T012 [US1] 在 `media/js/blocklyEdit.js` 實作拖曳即時更新位置與連續移動回饋
- [ ] T013 [US1] 在 `media/js/blocklyEdit.js` 實作依顯示名稱重新計算尺寸，並禁止編輯模式點擊送出按下狀態
- [ ] T014 [US1] 在 `specs/053-txt-virtual-controls/quickstart.md` 記錄建立 4 顆按鈕、拖曳、動態尺寸與未執行點擊抑制的手動驗證結果

**檢查點**: 使用者故事 1 應可在不執行 TXT 程式的情況下獨立完成畫布編輯與排版

---

## 階段 4：使用者故事 2 - 執行中使用虛擬控制作為輸入（優先級：P1）

**目標**: 讓執行中的 TXT 程式可讀取虛擬按鈕的瞬時按下狀態，並在執行期間鎖定位置編輯。  
**獨立驗證**: 啟動一個會根據虛擬按鈕狀態切換行為的 TXT 程式；若按下/放開按鈕都能被程式觀察，執行期間無法拖曳位置，且不會干擾既有 Test Panel 流程，即視為通過。

### 測試任務

- [ ] T015 [P] [US2] 在 `src/test/services/txtVirtualControlRuntimeService.test.ts` 新增 companion runtime lifecycle 與 session/snapshot 測試
- [ ] T016 [P] [US2] 在 `src/test/suite/txtVirtualControlsRuntime.test.ts` 新增 TXT runtime helper、執行模式切換與狀態同步 regression 測試

### 實作任務

- [ ] T017 [US2] 在 `txt-runtime/virtual_controls_runtime.py` 實作 `GET /health`、`PUT /session`、`POST /snapshot` 與 `DELETE /session`
- [ ] T018 [US2] 在 `src/services/txtVirtualControlRuntimeService.ts` 實作 runtime start/stop/session/snapshot orchestration
- [ ] T019 [US2] 在 `src/services/txtUploader.ts` 與 `src/webview/messageHandler.ts` 整合 companion runtime 的啟停、session reset 與錯誤回退流程
- [ ] T020 [US2] 在 `media/js/blocklyEdit.js` 實作 `running` 模式鎖位、press/release dispatch 與 `editing`/`running` reconciliation
- [ ] T021 [US2] 在 `media/js/blocklyEdit.js` 與 `media/css/blocklyEdit.css` 實作按下/放開狀態的視覺回饋與目前狀態顯示
- [ ] T022 [US2] 在 `media/blockly/blocks/txt.js`、`media/blockly/generators/txt/txt.js` 與 `media/blockly/generators/txt/index.js` 實作 `txt_virtual_button_state` 的基本按鈕選取、`stableId` 綁定與 `_txt_virtual_button_state(stableId)` code output
- [ ] T023 [US2] 在 `specs/053-txt-virtual-controls/quickstart.md` 記錄 press/release、0.5 秒輸入延遲驗證與不干擾 Test Panel 的手動驗證結果

**檢查點**: 使用者故事 2 應可在使用者故事 1 的畫布基礎上獨立驗證執行中輸入、狀態顯示、位置鎖定與 runtime 分離行為

---

## 階段 5：使用者故事 3 - 用學生能理解的名稱建立安全參照（優先級：P2）

**目標**: 用 `stableId + displayName + identifier` 模型吸收學生命名差異，並在 rename/delete 後維持穩定綁定與明確警告。  
**獨立驗證**: 建立中文、空格、符號、重名按鈕並用 block 綁定後再 rename/delete；若系統能提供名稱轉換提示、刪除前警告，且 block 仍能穩定綁定或轉為清楚的 invalid reference，即視為通過。

### 測試任務

- [ ] T024 [P] [US3] 在 `src/test/suite/txtVirtualControlsIdentity.test.ts` 新增 identifier 正規化、rename 綁定穩定性與 invalid reference 測試

### 實作任務

- [ ] T025 [US3] 在 `media/js/blocklyEdit.js` 實作 rename collision handling、名稱轉換結果顯示與修正提示
- [ ] T026 [US3] 在 `media/js/blocklyEdit.js` 實作已被引用按鈕的刪除前警告、確認流程與刪除後引用保留策略
- [ ] T027 [US3] 在 `media/blockly/blocks/txt.js` 實作 `txt_virtual_button_state` 的 rename 後標籤刷新、失效引用標示與 invalid-reference warning
- [ ] T028 [US3] 在 `media/js/blocklyEdit.js` 與 `src/webview/messageHandler.ts` 實作 `stableId` 綁定解析、失效引用診斷與執行前 preflight 阻擋
- [ ] T029 [US3] 在 `specs/053-txt-virtual-controls/quickstart.md` 記錄名稱轉換提示、重名處理、刪除前警告與 invalid reference 阻擋的手動驗證結果

**檢查點**: 使用者故事 3 應可獨立驗證命名安全性、rename 穩定性、刪除保護與失效引用保留策略

---

## 階段 6：使用者故事 4 - 自訂按鈕顏色並即時預覽（優先級：P2）

**目標**: 提供文字色與背景色調整，並在編輯過程中即時預覽按鈕外觀。  
**獨立驗證**: 對任一既有虛擬按鈕調整文字色與背景色；若畫布上外觀即時更新，且能保留足夠辨識度，即視為通過。

### 實作任務

- [ ] T030 [P] [US4] 在 `media/html/blocklyEdit.html` 新增顏色設定 UI 與調色盤控制項
- [ ] T031 [P] [US4] 在 `media/css/blocklyEdit.css` 新增 palette、即時預覽與對比度樣式
- [ ] T032 [US4] 在 `media/js/blocklyEdit.js` 實作文字色/背景色更新與即時預覽渲染
- [ ] T033 [US4] 在 `specs/053-txt-virtual-controls/quickstart.md` 記錄調色盤與即時預覽手動驗證結果

**檢查點**: 使用者故事 4 應可在不依賴 persistence 的情況下獨立完成顏色調整與即時預覽

---

## 階段 7：使用者故事 5 - 重新開啟專案時完整還原控制版面（優先級：P2）

**目標**: 將虛擬控制版面完整保存到專案，並在重新開啟時還原名稱、位置、尺寸、顏色與綁定。  
**獨立驗證**: 建立多顆按鈕並完成排版、顏色與 block 綁定後儲存專案，再重新開啟；若整個版面與綁定可完整恢復，遇到不完整資料時也能提示並盡量保留內容，即視為通過。

### 測試任務

- [ ] T034 [P] [US5] 在 `src/test/messageHandler.test.ts` 新增 `txtVirtualControls` save/load 測試
- [ ] T035 [P] [US5] 在 `src/test/suite/txtVirtualControlsPersistence.test.ts` 新增 malformed-data、schema fallback 與 reload recovery 測試

### 實作任務

- [ ] T036 [US5] 在 `src/webview/messageHandler.ts` 實作 `saveWorkspace`、`init`、`loadWorkspace` 與 backup 流程的 `txtVirtualControls` 持久化與還原
- [ ] T037 [US5] 在 `media/js/blocklyEdit.js` 實作 WebView hydration、schema fallback 與重新開啟後回到 `editing` 模式的 recovery
- [ ] T038 [US5] 在 `src/types/txtVirtualControls.ts` 與 `media/js/blocklyEdit.js` 保留名稱、顏色、尺寸、版面與綁定欄位的序列化行為
- [ ] T039 [US5] 在 `specs/053-txt-virtual-controls/quickstart.md` 記錄重開專案還原與資料缺漏修復提示的手動驗證結果

**檢查點**: 使用者故事 5 應可獨立驗證專案重開後的完整還原與資料修復能力

---

## 階段 8：收尾與跨故事收斂

**目的**: 收斂跨故事字典、回歸驗證、文件與整體整合品質

- [ ] T040 [P] 在 `scripts/generate-block-dictionary.js` 與 `src/mcp/block-dictionary.json` 更新 TXT 虛擬控制相關 dictionary entries
- [ ] T041 [P] 在 `src/test/suite/code-generation.test.ts` 與 `src/test/suite/txtWorkspaceFixtures.test.ts` 補上跨故事 TXT regression coverage
- [ ] T042 [P] 更新 `specs/053-txt-virtual-controls/quickstart.md` 與 `README.md` 的使用者驗證步驟、限制與注意事項
- [ ] T043 執行 `npm run compile`、`npm run lint`、`npm run validate:i18n` 與目標測試，並將結果記錄到 `specs/053-txt-virtual-controls/quickstart.md`

---

## 依賴與執行順序

### 階段依賴

- **階段 1：共用基礎設置** → 可立即開始
- **階段 2：核心前置基礎** → 依賴階段 1，且會阻擋所有使用者故事
- **階段 3：US1** → 依賴核心前置基礎完成
- **階段 4：US2** → 依賴核心前置基礎，且建議在 US1 的畫布互動模型可用後進行
- **階段 5：US3** → 依賴核心前置基礎，並使用階段 2 已建立的身分 helper 與 block shell
- **階段 6：US4** → 依賴核心前置基礎，且建議在 US1 的按鈕渲染完成後進行
- **階段 7：US5** → 依賴核心前置基礎，並需要 US1/US3/US4 的資料模型穩定後完成完整還原驗證
- **階段 8：收尾** → 依賴所有目標故事完成

### 使用者故事依賴圖

```text
共用基礎設置 → 核心前置基礎 → US1 → {US2, US3, US4} → US5 → 收尾
```

### 各故事內部順序

- 有自動化測試的故事，應先補測試並確認目前會失敗
- 身分 helper 與共享 state 先於 WebView / runtime 整合
- Host / runtime service 先於 `txtUploader` 流程整合
- 每個故事完成後都應先做獨立驗證，再進入下一個故事
- 每個需要手動驗證的故事，都必須把結果記錄到 `quickstart.md`

---

## 可平行執行項目

- **共用基礎設置**: `T002` 與 `T003` 可平行（runtime script 與 Host service 骨架不同檔案）
- **核心前置基礎**: `T005`、`T006`、`T007`、`T008` 可平行（helper、Host message、locale、block shell 分屬不同檔案群）
- **US1**: `T009` 與 `T010` 可平行（HTML / CSS）
- **US2**: `T015` 與 `T016` 可平行（不同測試檔）；`T017` 與 `T018` 在 API shape 固定後可分頭進行
- **US3**: `T024` 可與 `T027` 平行（測試檔與 block UI 不同檔案）
- **US4**: `T030` 與 `T031` 可平行（HTML / CSS）
- **US5**: `T034` 與 `T035` 可平行（不同測試檔）
- **收尾**: `T040`、`T041`、`T042` 可平行（dictionary / tests / docs）

---

## 平行範例：使用者故事 1

```text
Task: T009 [US1] 在 media/html/blocklyEdit.html 新增 TXT 虛擬控制工具列入口、畫布容器與空狀態結構
Task: T010 [US1] 在 media/css/blocklyEdit.css 新增畫布、拖曳按鈕、選取狀態與編輯模式樣式
```

## 平行範例：使用者故事 2

```text
Task: T015 [US2] 在 src/test/services/txtVirtualControlRuntimeService.test.ts 新增 companion runtime lifecycle 與 session/snapshot 測試
Task: T016 [US2] 在 src/test/suite/txtVirtualControlsRuntime.test.ts 新增 TXT runtime helper、執行模式切換與狀態同步 regression 測試
```

## 平行範例：使用者故事 3

```text
Task: T024 [US3] 在 src/test/suite/txtVirtualControlsIdentity.test.ts 新增 identifier 正規化、rename 綁定穩定性與 invalid reference 測試
Task: T027 [US3] 在 media/blockly/blocks/txt.js 實作 txt_virtual_button_state 下拉資料源、rename 後標籤刷新與 invalid-reference warning
```

## 平行範例：使用者故事 4

```text
Task: T030 [US4] 在 media/html/blocklyEdit.html 新增顏色設定 UI 與調色盤控制項
Task: T031 [US4] 在 media/css/blocklyEdit.css 新增 palette、即時預覽與對比度樣式
```

## 平行範例：使用者故事 5

```text
Task: T034 [US5] 在 src/test/messageHandler.test.ts 新增 txtVirtualControls save/load 測試
Task: T035 [US5] 在 src/test/suite/txtVirtualControlsPersistence.test.ts 新增 malformed-data、schema fallback 與 reload recovery 測試
```

---

## 實作策略

### 先做 MVP（編輯模式）

1. 完成階段 1：共用基礎設置
2. 完成階段 2：核心前置基礎
3. 完成階段 3：使用者故事 1
4. **STOP and VALIDATE**：先驗證畫布建立、拖曳、動態尺寸與編輯模式點擊抑制
5. 若需要最小演示，可先展示編輯模式 MVP

### 第一個可課堂使用的里程碑

1. 在 MVP 之後完成使用者故事 2
2. 驗證執行中按鈕輸入、狀態顯示、0.5 秒內可觀察與位置鎖定
3. 這時候功能才具備課堂操作價值

### 漸進交付

1. 共用基礎設置 + 核心前置基礎 → 建立共用骨架與身分模型
2. US1 → 交付可編輯畫布
3. US2 → 交付執行期互動與 companion runtime
4. US3 → 補穩定命名、刪除保護與失效引用保護
5. US4 → 補顏色與即時預覽
6. US5 → 補完整 persistence
7. 收尾 → 收斂回歸、文件與驗證

---

## 備註

- `[P]` 任務代表不同檔案、可平行處理
- `[USx]` 標籤將任務直接追溯到對應使用者故事
- `txtVirtualControls` 是本 feature 的唯一保存真相；避免再建立第二份持久化來源
- `stableId` 與 `identifier` 基礎 helper 已前移到核心前置基礎，避免執行期任務先依賴、後建立
- `io_server.py` 與 companion runtime 必須維持責任分離
- 所有手動驗證結果都應寫回 `specs/053-txt-virtual-controls/quickstart.md`
