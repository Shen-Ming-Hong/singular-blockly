# 071 本地 Code Review（2026-10-01）

## 結果與範圍

**CLEAR（軟體差異審查）**：四項具體 finding 均已修正，最後重審未發現新的可執行問題。此結果不代表雙板射頻互通、燒入或真實 Copilot 整合已通過。

- 分支：`codex/071-esp32-cyberbrick-rc`。
- 初審 Base：`origin/master` 與 HEAD 的 merge-base `0ac02cc587af5ba71763b3a3cb56886a3319481f`。初審時相對 base 無已提交差異、無暫存差異；審查包含全部未暫存及未追蹤內容。發布整合後的最終基準及證據見下節。
- 有效差異超過 50 個檔案，分成 RC／WebView／產生器、AI 生命週期、翻譯／Skill／文件三批，再做一次跨批次整合檢查；最後只重審新修正及其整合邊界。
- 本地檢視三次：初審發現三項 RC 問題；修正後重審發現一項舊工具列測試契約未同步；更新契約後重審收斂。
- 審查由本對話模型執行，本機工具負責讀取及驗證；未另啟動或另傳送程式碼至外部 reviewer，外部 reviewer 使用 **0 輪**。未因時間、輸出或差異大小預算中止。

## Finding 結案

| 穩定 ID | 等級／分類 | 證據與最小修正 | 結果 |
| --- | --- | --- | --- |
| `LCR:media/blockly/generators/arduino/esp32-rc.js:56:wifi-reconnect` | P2／ADOPT_WITH_ADJUSTMENT | RC 初始化關閉全域 Wi-Fi 自動重連；既有 Wi-Fi 連線不恢復。Arduino 2.0.17 的 setter 只改旗標，`begin` 不恢復。Wi-Fi 連線積木現在明確設定 `WiFi.setAutoReconnect(true)`，保留 RC 單獨使用時的固定頻道行為。 | 已修正；實際產生碼的 native 測試驗證重新連線與再次初始化 RC 的切換。 |
| `LCR:media/blockly/generators/arduino/esp32-rc.js:29:packet-values` | P2／ADOPT | 原本只檢查長度與 ID，`-32768` 可成為有效搖桿資料並映射到設定範圍外。接收回呼現在拒收六軸不在 0–4095、四按鈕不是 0／1 的整包資料，且不更新資料或時間戳。 | 已修正；逐軸／逐按鈕測試越界資料、端點及 1501ms 逾時。 |
| `LCR:media/blockly/blocks/esp32-rc.js:16:orphan-warning` | P2／ADOPT_WITH_ADJUSTMENT | 六積木缺少架構要求的第三層孤立積木 UI 警告；共用板型刷新原本以無 ID 的 `setWarningText(null)` 清除全部警告。沿用 `isInAllowedContext` 及現有翻譯，六積木共用 onchange，孤立與板型警告使用獨立 ID。 | 已修正；六積木接入／拔出、載入與板型刷新均有契約覆蓋。 |
| `LCR:src/test/suite/editorToolbarActionsContract.test.ts:44:experimental-indicator-contract` | P2／ADOPT_WITH_ADJUSTMENT | 共用工具列測試仍要求驚嘆號隨次要操作收合，與 071 spec 使用情境三第 4 項及 T009 衝突，造成測試失敗。更新預期，要求驚嘆號位於常駐操作群組且在最右側切換鈕之前。 | 已修正；工具列 7 項重測通過，保留已手測通過的 UI 行為。 |

沒有 REJECT 或 NEEDS_USER_DECISION finding。AI 停用／尚未 ready 時狀態列隱藏，命令面板仍可切換 AI 和開啟設定；此操作變化依現有 readiness 設計保留，未另改 UI。

## 本輪驗證

| 驗證 | 實際結果 |
| --- | --- |
| `compile-tests`，RC、Arduino／CyberBrick／TXT 代表工作區生成比較、CyberBrick RC／OTA、孤立積木 guard | 46 passing；既有代表工作區產生碼未變。 |
| Shadow 快捷鍵、Blockly 13 相容性／標記／無障礙／UI／動態狀態、工具列、備份預覽、產品 Skill runtime contract | 初次 47 passing、1 failing；失敗為上列舊工具列預期。修正後只重跑工具列，7 passing；未變的其他 41 項成功證據沿用，共 48 項通過。 |
| 既有 `AIModelManager`、`ShadowSuggestionService`、`MessageHandler AI lifecycle` 測試 | 91 passing；以 `/tmp/071-vscode-stub.cjs` 的最小 VS Code API 替身在 Node.js 執行，只驗證邏輯，沒有使用真實 Extension Host 或 Copilot。 |
| `npm run lint`、`npm run compile` | 通過；最後僅測試檔變更，另以 ESLint 定向檢查該檔通過。 |
| `npm run generate:project-skills` → `npm run check:project-skills` | 通過；172 個公開積木、20 個分片，runtime-derived contract 及 manifest 一致。 |
| `npm run validate:i18n` | PASS；15 語系、0 errors。 |
| `git diff --check` | 通過。 |

本輪共 185 項不同的背景測試通過。未變的 i18n 工具測試沿用前次 21 passing 證據，未重跑；未重複執行完整 `npm test`。`validation.md` 中 2026-09-24 的 1369 passing 及 PlatformIO 編譯屬歷史紀錄，不視為本輪執行結果。

## 尚待實機確認

- 兩板 ID／頻道相同及不相同時的配對、六軸與四按鈕實值、停止發射超過 1.5 秒後的狀態。
- RC 初始化放在 Wi-Fi 連線之前，基地台固定同頻道；基地台中斷及恢復時的 Wi-Fi 重連與 RC 收訊。軟體警告與自動重連修正不會自動協調頻道。
- 2048 是搖桿中點；映射後的值未必讓馬達停止。馬達程式應依「是否連線」明確停止，而非只依賴預設搖桿值。
- 真實 Copilot 發現／選取、Extension Host activation 及編輯器關閉整合；本輪已有邏輯與靜態證據，尚無真實主機重測。

初審輪未執行 commit、push、PR、部署、發布或燒入硬體；以下發布整合工作依後續使用者授權進行。

## 發布整合後的有界重審（2026-10-01）

- 最終 Base：`origin/master`／整合 HEAD 為 `f3fae46966f226eae30483b73130485d6b4c183a`。已 fast-forward 納入七筆上游提交，恢復原任務差異後審閱完整有效範圍；沿用前輪三批審查，只補一次整合邊界核對。
- 核對範圍為 v0.88.3 安全依賴整合、版本／lockfile／雙語 CHANGELOG、維護 Skill 衝突合併、audit-state，以及 RC／WebView／AI 生命週期的必要共用邊界。lockfile 對新基準只有兩個版本欄位改動，合併的維護規則保留雙方內容。
- 四項 finding 維持原分類及已修正結果，沒有新增可執行 finding。簡化檢查沒有需要額外改動的抽象或重複邏輯，保留必要驗證、取消與晚回隔離。結果為 **CLEAR（軟體差異）**。
- Node.js **24.20.0** 的整合後 `npm ci`、完整 `ci:static` 均 exit 0；定向契約 **97 passing**、AI 邏輯 **91 passing**，共 **188 個不同案例**。詳見 [validation.md](./validation.md)，不把前輪 185 或 2026-09-24 的 1369 項加總為本輪成果。
- 全量 i18n 審計實際完成 19,832 組／100 批：`PASS_WITH_ADVISORIES`，0 Blocker／2304 Major／2 Minor／0 Info；既有 Major 為待辦，本次增量沒有未決 Major。最終 15 語系 validator exit 0，audit helper 確認 current。
- 未重啟外部 reviewer 或 subagent，外部 reviewer 合計仍為 **0 輪**。較早的大型工具讀取曾截斷，已改成定向小段補讀；沒有未讀完的整合邊界。未改變的完整驗證沿用成功日誌，不重複執行。
- 使用者 Phase 1.5 核准包含以上本地整合、版本與提交；Phase 3.5 的遠端 push／PR／merge／tag／CD 尚待核准。完整 `test:unit:ci` 改由 PR CI 執行；硬體、PlatformIO 及真實 Copilot 的本輪限制仍保留，不能視為已通過。
