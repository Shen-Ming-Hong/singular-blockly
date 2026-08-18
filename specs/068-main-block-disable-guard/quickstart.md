# Phase 1 Quickstart：驗收主程式積木停用保護

本文件供實作者與審查者在完成 `tasks.md` 後重現主要驗收。

## 1. 開發環境基線

```bash
npm install
npm run compile
npm run lint
npm run validate:i18n
npm run test:i18n
npm test
npm run package
```

預期：Node.js 22.16.0+；無新增 i18n key；所有既有測試與封裝通過。

## 2. 精準自動化測試

實作時先執行新增或擴充的精準測試：

```bash
npm run compile-tests
npx mocha --ui tdd --timeout 15000 out/test/suite/mainBlockDisableGuard.contract.test.js
npx mocha --ui tdd --timeout 15000 out/test/suite/workspaceValidation.contract.test.js
npx mocha --ui tdd --timeout 15000 out/test/suite/code-generation.test.js
npx mocha --ui tdd --timeout 15000 out/test/suite/txt-multi-flow-generation.test.js
npx vscode-test --label unit --forbid-only --fail-zero --skip-extension-dependencies --run out/test/initialWorkspaceGate.test.js
npx vscode-test --label unit --forbid-only --fail-zero --skip-extension-dependencies --run out/test/services/workspaceCandidateService.test.js
```

若實際 test runner 路徑由專案 webpack／VS Code harness 管理，使用 `npm test` 的既有 suite 選取方式執行相同測試，不為本功能新增另一套 runner。

## 3. 七種板型右鍵與即時修復

對 Uno、Nano、Mega、ESP32、SuperMini、CyberBrick、TXT Controller 各建立一個工作區：

1. 確認 Arduino 五板顯示 `arduino_setup_loop`、CyberBrick 顯示 `micropython_main`、TXT 顯示 `txt_setup`。
2. 開啟必要主程式右鍵選單，確認沒有「停用區塊」。
3. 對普通積木、函式積木及 TXT `txt_process` 開啟選單，確認仍可停用；停用後同位置能重新啟用。
4. 以測試 harness 或開發工具對必要主程式設定 `MANUALLY_DISABLED`、第二個原因及未知原因，確認 listener 處理後全部清空。
5. 確認 undo stack 沒有多出的自動修復項目，事件計數沒有遞迴增長，且原始 disabled change 只造成一次正規化保存。

## 4. 主程式結構回歸

1. 每種板型只保留一個必要主程式，確認不可刪除。
2. 以外部 JSON fixture 載入兩個同類主程式，確認兩者都啟用、可刪除，且沿用既有重複警告。
3. 確認 toolbox 的 `maxInstances: 1` 未改變。
4. 刪除重複項目至剩一個，確認最後一個立即恢復不可刪除。
5. TXT 分別缺 setup、缺 process、重複 setup，確認既有完整性警告仍正確，且 `txt_process` 停用原因不被清除。

## 5. 程式碼產生回歸

使用含停用必要主程式的 fixture 正式載入並修復後：

- Arduino 五板輸出仍包含 `setup()`、`loop()` 及原本接在主程式內的敘述。
- CyberBrick 輸出保留 `micropython_main` 內原有內容，不退化成空程式或只含 `pass`。
- TXT 輸出保留 setup 初始化與已啟用 process 的啟動流程。
- 停用的普通積木、函式與 `txt_process` 仍依 generator 既有規則被跳過，且其停用原因保存不變。

## 6. 初次載入持久化

準備三份獨立 workspace：

1. 正常主程式：記錄 `main.json` bytes，初載成功後確認 bytes 不變，只建立有效 `.bak`。
2. 停用主程式：初載成功且 `mainBlockStateRepaired: true` 後，確認 `main.json` 與 `.bak` 內容相同，必要主程式沒有 `disabledReasons`，子積木／欄位／連線未改。
3. CyberBrick 卡住案例：不手動編輯 JSON，直接開啟專案，確認主程式恢復、可產生原本程式並在重開後仍有效。

接著注入：

- WebView 修復期間外部改寫 `main.json`：舊結果不得覆寫新 bytes。
- `.bak` 原子寫入失敗：主檔、備份與 memory 全部回到交易前。
- 主檔寫入或交易中斷：不得留下部分 normalized 狀態或把它設為 last-valid。

## 7. 外部候選與重建入口

1. 在編輯器開啟後，以外部工具寫入含停用必要主程式的有效候選。
2. 確認 preflight 通過、正式 live workspace 立即啟用主程式，Host 提交的主檔與備份是修復後文件。
3. 在 live load 等候期間再寫入較新候選，確認舊結果失效且不覆寫較新資料。
4. 分別執行 FileWatcher reload、備份復原、板型切換與語言切換重建，確認每次正式 workspace 都套用同一狀態保護。
5. 正常工作區重複切換語言與板型，確認沒有無原因的主檔重寫、重複選單或事件迴圈。

## 8. 最終檢查

```bash
git diff --check
rg -n "mainBlockStateRepaired|REQUIRED_MAIN_BLOCK_TYPES" media src specs/068-main-block-disable-guard
npm run validate:i18n
npm run test:i18n
npm run lint
npm run compile
npm test
npm run package
```

最後人工確認沒有新增設定、Toast、翻譯字串或 `console.log`，`CHANGELOG.md` 同時具繁體中文與英文對應項目。
