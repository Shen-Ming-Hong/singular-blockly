# 任務：圖形化積木設計器

**輸入**：[spec.md](./spec.md)、[plan.md](./plan.md)

## Phase 1：格式基礎

- [x] T001 在 `src/types/blockPack.ts` 加入 `BlockPackDesign` 與 `designer` 欄位
- [x] T002 在 `src/services/blockPackValidator.ts` 驗證 `designer` 區段與 `#rrggbb` 分類顏色，同步 `media/schemas/block-pack.schema.json`
- [x] T003 [P] 在 `src/test/suite/blockPackValidator.test.ts` 測試設計區段、顏色與 Schema 一致

## Phase 2：使用情境一—畫出積木並使用（P1）

- [x] T004 [US1] 在 `media/js/blockDesigner.js` 定義設計積木與零件，名稱欄位限 C++ 識別字
- [x] T005 [US1] 實作 `compileDesign`、`functionSource`、`returnProblems`，產生 072 格式積木與模板
- [x] T006 [US1] 在 `media/html/blocklyEdit.html`、`media/css/blocklyEdit.css` 加入設計器視窗：積木清單、形狀圖示選擇、畫布、預覽、程式框、問題列表，明暗主題與窄螢幕版面
- [x] T007 [US1] 形狀圖示取自 thrasos 實際渲染；顏色色塊；畫布滾輪縮放
- [x] T008 [US1] 插槽預設值隨型別切換；工具箱與預覽帶預設積木（`logic_boolean` 等）；清單以參數名稱標籤顯示輸入
- [x] T009 [US1] 儲存經 `blockPackManager.confirmThen`／`applyPacks` 套用，工具箱立即更新
- [x] T010 [US1] 在 `src/test/suite/blockDesigner.contract.test.ts` 驗證推導、預設值、驗證器相容與產生碼

## Phase 3：使用情境二—修改不丟程式（P1）

- [x] T011 [US2] 改零件只重產函式開頭，本體保留；本體引用已刪除參數時提醒
- [x] T012 [US2] `blockPacks.prepareState` 把接在已刪除輸入上的積木移到頂層；契約測試覆蓋

## Phase 4：使用情境三與四—分享與函式庫（P2）

- [x] T013 [US3] `blockPackService.exportBlockPack` 與 `exportBlockPack` 訊息：驗證、存檔對話框、`FileService` 寫檔、`blockPackExported` 回覆
- [x] T014 [US3] 只有含 `designer` 的積木包顯示編輯按鈕
- [x] T015 [US4] `blockPackLibrarySearch.ts` 與 `searchBlockPackLibraries`／`getBlockPackLibraryHeaders` 訊息；設定關閉時不連網
- [x] T016 [P] 測試：`blockPackService.test.ts` 匯出、`blockPackLibrarySearch.test.ts`、`messageHandler.test.ts` 匯出與搜尋

## Phase 5：使用情境五—內層語句（P3）

- [x] T017 [US5] 內層語句零件只允許在「執行動作」形狀、每個積木一個，函式回傳 bool

## Phase 6：語系、文件與驗證

- [x] T018 15 語系加入設計器文字，`npm run validate:i18n` 與 `npm run test:i18n` 通過
- [x] T019 更新 `docs/specifications/06-features/block-packs.md`、`CHANGELOG.md`、產品 Skill `references/block-packs.md`，執行 `generate:project-skills`／`check:project-skills`
- [x] T020 lint、`npm test`、雲端本地 WebView 截圖與設計器操作驗證
- [ ] T021 Ray 確認外觀並以實體 ESP32 測試設計出的積木；通過前維持預設關閉
- [ ] T022 依 Ray 對「核心程式寫在哪」的決定，必要時改為產生 .h 檔或嵌入程式碼編輯器
