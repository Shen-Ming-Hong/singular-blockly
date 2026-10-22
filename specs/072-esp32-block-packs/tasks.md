# 任務：ESP32 積木包

**輸入**：[spec.md](./spec.md)、[plan.md](./plan.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[block-pack-format.md](./contracts/block-pack-format.md)、[messages.md](./contracts/messages.md)

## Phase 1：格式與驗證基礎

- [x] T001 在 `src/types/blockPack.ts` 定義 BlockPack、PackBlock、PackInput、PackTarget、快照與驗證錯誤型別
- [x] T002 在 `src/test/suite/blockPackValidator.test.ts` 先寫合法範例與每個錯誤代碼的失敗測試
- [x] T003 在 `src/services/blockPackValidator.ts` 實作純函式驗證器，使 T002 通過
- [x] T004 [P] 新增 `media/schemas/block-pack.schema.json`、`package.json` 的 `jsonValidation`，並在測試中以同組 fixture 比對 Schema 與驗證器結論
- [x] T005 [P] 新增 `resources/block-pack-examples/hc-sr04.sbpack.json`、含 `libDeps` 與 `statement` 輸入的範例，以及 `invalid/` 錯誤範例

## Phase 2：使用情境一—匯入與使用（P1）

- [x] T006 [US1] 在 `media/blockly/blockPacks.js` 實作快照 serializer（priority 200、每個 workspace 獨立狀態、無積木包時不輸出）與積木註冊
- [x] T007 [US1] 在 `media/blockly/blockPacks.js` 實作模板替換產生器：值輸入加括號、C++ 字串跳脫、語句輸入、`includes_`／`definitions_`／`setups_`／`lib_deps_` 去重、孤立守衛
- [x] T008 [US1] 在 `src/test/suite/blockPacks.contract.test.ts` 以 Node 版 Blockly 驗證註冊、產生碼、去重與 load/save/load
- [x] T009 [US1] 在 `src/webview/webviewManager.ts` 的編輯與預覽路徑載入 `blockPacks.js`
- [x] T010 [US1] 在 `src/services/blockPackService.ts` 與 `src/webview/messageHandler.ts` 實作 `importBlockPack`：檔案選擇、`FileService` 讀檔、驗證、版本比對、工作區信任與依賴確認；加上 `src/test/suite/blockPackService.test.ts`
- [x] T011 [US1] 在 `media/js/blocklyEdit.js`、`media/html/blocklyEdit.html`、`media/css/blocklyEdit.css` 加入積木包管理對話框（列表、匯入、預覽 mini workspace 與 C++、確認），支援明暗主題
- [x] T012 [US1] 在 `updateToolboxForBoard()` 於 `esp32` 插入積木包分類，套用多語系標籤退回規則

## Phase 3：使用情境二—分享與外部編輯（P1）

- [x] T013 [US2] 在外部候選驗證路徑由 Host 驗證 `customBlocks` ，不合法時以 `INVALID_BLOCK_PACK` 拒絕，WebView 合併積木包 contract 條目並於結束時還原動態註冊
- [x] T014 [US2] 測試：複製專案（無原始檔）載入、外部候選含合法與不合法積木包的接受／拒絕

## Phase 4：使用情境三—板型與佔位保護（P1）

- [x] T015 [US3] 擴充 `updateEsp32BlockWarnings()`：積木包積木板型警告、非 esp32 只產生註解、獨占腳位衝突警告
- [x] T016 [US3] 在 `media/js/blocklyRuntime.js` 的 `loadWorkspaceState` 前置轉換：缺定義的 `pack_` 型別換成佔位積木並保存 `extraState.original`；積木包回來時還原
- [x] T017 [US3] 測試：切換板子後非積木包積木 0 變動、佔位與還原保留輸入值與連接

## Phase 5：使用情境四與五—作者與管理（P2）

- [x] T018 [US4] 匯入錯誤以 `BLOCK_PACK_ERROR_<CODE>` 顯示積木與欄位位置
- [x] T019 [US5] 更新與移除流程：差異摘要、會產生佔位積木時經 `confirmBlockPackChange` 確認
- [x] T020 [US4] 產品 Skill：更新 `workspace-format.md`、`workspace.schema.json` 描述，新增 `references/block-packs.md`（英文），執行 `npm run generate:project-skills` 與 `npm run check:project-skills`

## Phase 6：語系與整合

- [x] T021 依 `i18n-maintenance` 補齊 15 語系 `media/locales/*/messages.js` 新字串並通過 `validate:i18n`、`test:i18n`
- [x] T022 更新 `docs/specifications/` 相關說明與 `CHANGELOG.md` 未發布段落
- [x] T023 執行 `npm run lint`、`npm test`，並以範例積木包產生的 `src/main.cpp` 跑 `espressif32@7.0.1` 編譯
- [x] T024 依 [quickstart.md](./quickstart.md) 以 `cloud-local-verification` 做截圖與拖曳互動驗證（匯入、拖用、換板子、佔位還原、明暗主題）

## 依賴與執行順序

T001–T005 為基礎；T006–T012 完成最小可用版本（MVP）；T013–T017 完成 P1 保護；T018–T020 為 P2；T021–T024 為整合閘門。標 [P] 者可並行。
