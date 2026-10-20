# 驗證紀錄（2026-09-24）

## 已通過

- `npm run compile`、`npm run lint`。
- `npm test`：1369 passing、1 pending。
- `npm run compile-tests && npx mocha --ui tdd --timeout 30000 out/test/suite/esp32Rc.contract.test.js`：7 passing。涵蓋六種積木序列化與實驗註冊、展開 RC 分類時立即標記飛出選單積木、工作區載入與語言重建的標記刷新、ESP32 板型與 RC／Wi-Fi 並存警告、封包長度與配對 ID、六軸四按鈕、初始化失敗、缺少初始化與 1500ms 逾時安全預設。
- VS Code Insiders 擴充功能開發主機目視驗證：含 RC 接收積木的工作區關閉後重新開啟，黃色發光虛線直接恢復；展開「RC連線」分類時，六種積木在飛出選單中直接顯示虛線。重現時確認初始載入後的語言套用會重建工作區，修正已在重建完成後刷新標記。
- 同一開發主機目視驗證：黃色驚嘆號在右上角工具列展開及收合時均顯示；收合狀態點擊圖示仍可開啟完整實驗積木提醒。
- 使用 `extension_test/CAR/blockly/main.json` 的 ESP32 工作區重新載入 WebView，確認 RC 與 Wi-Fi 連線積木同時出現警告圖示，警告內容具體指出初始化順序與同頻道要求；滑鼠點選「RC連線」分類後未再出現多餘的藍色分類焦點框，實驗積木黃色虛線仍在。
- `npm run validate:i18n`、`npm run test:i18n`（21 passing）及 `node scripts/i18n/validate-translations.js --all --format=json`：15 語系無缺漏。
- `npm run generate:project-skills` 後 `npm run check:project-skills`：172 個公開積木、20 個分片，產物與 manifest 一致。
- 從 Blockly 工作區產生 `src/main.cpp`，以 `platformio/espressif32@7.0.1`、`esp32dev`、Arduino framework 編譯成功。設定與程式碼位於測試用暫存目錄 `/tmp/esp32-rc-verify/`。
- `extension_test/CAR/src/main.cpp` 以同一 PlatformIO 設定編譯成功；其目前順序為 Wi-Fi 連線在 RC 初始化之前，執行時 RC 初始化會斷開 Wi-Fi。
- `git diff --check` 無空白格式錯誤。

## 未實測範圍

執行環境沒有 CyberBrick 發射端與 ESP32 DevKit 的 USB 裝置（`/dev/cu.*` 僅見系統虛擬埠）。因此尚未實際驗證兩板 ESP-NOW 配對、射頻頻道切換、搖桿與按鈕實際讀值，以及停止發射後的硬體逾時行為。

## 本地 review 增量驗證（2026-10-01）

- 本輪修正 Wi-Fi 自動重連、越界封包拒收、RC 孤立警告及未同步的工具列測試契約，結果為軟體差異審查 `CLEAR`。完整範圍、finding ID、驗證與限制見 [local-review.md](./local-review.md)。
- RC／代表產生碼／CyberBrick RC OTA／孤立 guard：46 passing；共用 UI 與 Skill 合約：48 項通過（工具列修正後定向重測 7 passing，沿用其他 41 項成功證據）。
- AI manager／suggestion／message lifecycle：91 passing，使用最小 VS Code API 替身在 Node.js 執行，不等同真實 Extension Host／Copilot。
- `compile-tests`、lint、webpack compile、15 語系驗證、產品 Skill 生成及檢查、`git diff --check` 通過；i18n 工具測試沿用前次 21 passing，未重跑。
- 未重跑完整 `npm test` 或 PlatformIO 編譯；未燒入或執行雙板硬體實測。上方 2026-09-24 結果保留為歷史紀錄。

## 發布整合後驗證（2026-10-01）

- 已整合 origin/master 至 `f3fae46966f226eae30483b73130485d6b4c183a`，保留 v0.88.3 安全依賴修正；正式套用 v0.89.0 版本與雙語 CHANGELOG。
- 以 Node.js **24.20.0** 執行 `npm ci --cache /tmp/071-npm-cache --no-audit`，exit 0；完整 `npm run ci:static` exit 0，日誌為 `/tmp/071-release-static-integrated.log`。涵蓋 Skill/runtime 合約、compile-tests、webpack、lint、15 語系、i18n 21、release 25、回饋契約/typecheck、VSIX 隱私 6、triage Skill 4，以及 Worker 20 files／152 tests。
- 整合後 RC／代表工作區產生碼／CyberBrick RC OTA／孤立 guard／共用 UI／產品 Skill contract 共 **97 passing**，日誌為 `/tmp/071-release-contracts-integrated.log`。
- AI manager／suggestion／message lifecycle 共 **91 passing**，日誌為 `/tmp/071-release-ai-integrated.log`；使用 `/tmp/071-vscode-stub.cjs` 的最小 VS Code API 替身，沒有啟動真實 Extension Host／Copilot。整合後共 188 個不同定向案例，不與前輪 185 重複加總。
- 全量語意審計逐批完成 **19,832 組／100 批**，`PASS_WITH_ADVISORIES`：0 Blocker、2304 Major、2 Minor、0 Info。27 項新確認的既有 Major 已加入翻譯待辦，未修改其譯文；本次 RC 新字串未發現 Blocker。
- `audit-state.json` 完成時間為 `2026-10-01T08:44:00.807Z`，`inProgress=null`；manifest `04381dba46643354fa7b825455db887b8baf2289a0881e22ba7697fda162e401` 經 helper 確認 current、required=false、nextBatch=null。最終 `npm run validate:i18n` exit 0，15 語系／0 errors，日誌為 `/tmp/071-release-i18n-final.log`。
- `npm run release:prepare` 與 `git diff --check` 通過；整合及簡化核對未新增可執行 finding，本地軟體重審維持 CLEAR。未改動功能差異時沿用此輪完整驗證，不重跑相同 suite。
- 本輪未執行 `test:unit:ci`、真實 Extension Host／Copilot、PlatformIO 編譯或硬體燒入。完整主機單元測試交由 PR CI；required CI Gate 與目前 PR head 的 CodeQL 通過前不得合併。2026-09-24 的完整測試與 PlatformIO 成功只屬歷史。
