# 實作計畫：CyberBrick 中文與編輯穩定性修復

**分支**：`069-cyberbrick-editing-stability` | **日期**：2026-08-19 | **規格**：[spec.md](./spec.md)

**輸入**：`/specs/069-cyberbrick-editing-stability/spec.md` 的功能規格

## 摘要

本功能修正四個互相獨立但共同影響編輯可靠性的問題。工作區監看器改用持久、冪等的預期主檔狀態，避免同一次內部原子寫入的重複事件被誤判為外部候選；Blockly runtime 將既有 IME-safe 文字欄位套用到公開 `field_input` registry，並讓所有自訂文字欄位使用同一 factory；Monitor 子程序明確使用 UTF-8 環境並以獨立串流 decoder 處理 stdout／stderr；Monitor service 統一管理預期停止原因、PTY 成功結束碼及一次性停止 callback，WebView 對手動與上傳停止保持安靜並清理既有 toast。

## 技術背景

**語言／版本**：TypeScript 5.9.3、WebView JavaScript、Node.js 22.16.0+

**主要相依套件**：VS Code Extension API `^1.109.0`、Blockly 13.2.1、Node.js `node:string_decoder`、pyserial、mpremote、PlatformIO CLI

**儲存方式**：專案內 `blockly/main.json` 與 `blockly/main.json.bak`；不新增資料格式

**測試工具**：Mocha、Sinon、`@vscode/test-electron`、WebView 契約測試、整合測試、手動硬體與平台矩陣

**目標平台**：VS Code 1.109+；macOS、Windows、Linux；CyberBrick 與 Arduino Monitor

**專案類型**：單一 VS Code extension；Extension Host 與 Blockly WebView 以 `postMessage` 分離通訊

**效能目標**：符合預期內部狀態的重複 watcher 事件只做固定時間的存在／雜湊比較，不啟動 runtime 驗證或 live load；Monitor 與文字輸入不新增可感知延遲

**限制**：不得新增設定、命令、翻譯、workspace schema 或 Big5／CP950 偵測；不得經 shell 執行裝置程序；必須保留外部候選驗證、隔離、世代控制、拖曳保護與必要主程式停用保護

**規模／範圍**：一個工作區監看服務、兩個 Monitor service、兩個 WebView runtime 檔、五個自訂積木定義檔、四組主要測試套件與一份 IME 契約稽核

## 憲法檢查

*閘門：Phase 0 研究前必須通過，Phase 1 設計後再次檢查。*

| 原則 | 研究前 | 設計後 | 符合方式 |
|------|--------|--------|----------|
| I. 簡潔與可維護性 | 通過 | 通過 | 以小型 discriminated union、既有 field subclass、標準 `StringDecoder` 與單一停止狀態完成，不建立平行框架。 |
| II. 模組化與可擴充性 | 通過 | 通過 | Host 服務、WebView runtime 與訊息層各保留原責任；共享 `MonitorStopReason` 作為明確契約。 |
| III. 避免過度開發 | 通過 | 通過 | 不做通用編碼偵測、通知設定、跨平台 UI 自動化框架或額外工作區 schema。 |
| IV. 彈性與適應性 | 通過 | 通過 | 所有 `field_input` 與自訂 factory 共用輸入行為；預期主檔狀態涵蓋 present／absent。 |
| V. 研究驅動開發 | 通過 | 通過 | 以 Blockly、Node.js、VS Code 官方文件及目前 13.2.1 本機來源確認 registry、串流解碼與 PTY exit code。 |
| VI. 結構化日誌 | 通過 | 通過 | Extension Host 沿用 `log()`，不新增 `console.log`；正常停止只記錄資訊。 |
| VII. 完整測試覆蓋 | 通過 | 通過 | 監看狀態、交錯事件、UTF-8 分片、停止原因與錯誤路徑均有單元／契約測試；互動部分另有手動矩陣。 |
| VIII. 純函式與模組化架構 | 通過 | 通過 | 狀態比對與一次性停止回報保持可獨立測試；I/O 仍透過可注入服務及 spawn adapter。 |
| IX. 繁體中文文件標準 | 通過 | 通過 | 全部 SDD 文件使用繁體中文。 |
| X. 專業發布管理 | 通過 | 通過 | 本功能不建立 tag 或發布；完成前執行完整品質閘門。 |
| XI. Agent Skills 架構 | 通過 | 通過 | 不修改 Skill 契約；以 `check:project-skills` 確認既有產物未漂移。 |

設計前後均無憲法違規或需豁免項目。

## 專案結構

### 本功能文件

```text
specs/069-cyberbrick-editing-stability/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── internal-contracts.md
├── checklists/
│   ├── requirements.md
│   └── stability.md
└── tasks.md
```

### 預計產品程式與測試

```text
src/
├── services/
│   ├── workspaceCandidateService.ts
│   ├── serialMonitorService.ts
│   └── arduinoMonitorService.ts
├── types/
│   └── arduino.ts
├── webview/
│   └── messageHandler.ts
└── test/
    ├── services/
    │   └── workspaceCandidateService.test.ts
    └── suite/
        ├── serialMonitorService.test.ts
        ├── arduinoMonitorService.test.ts
        ├── blocklyImeCompatibility.contract.test.ts
        └── monitorUiLifecycle.contract.test.ts

media/
├── js/
│   ├── blocklyRuntime.js
│   └── blocklyEdit.js
└── blockly/blocks/
    ├── arduino.js
    ├── esp32-wifi-mqtt.js
    ├── functions.js
    ├── motors.js
    └── txt.js
```

**結構決策**：維持既有單一 extension 架構。檔案監看判斷留在 `WorkspaceCandidateService`；子程序與 PTY 狀態留在各 Monitor service；WebView 只處理按鈕與 toast；Blockly runtime 擁有 IME-safe 欄位類別及公開 registry 安裝。未新增共用基底類別，避免為兩個小型 Monitor service 引入不必要抽象。

## 設計決策

### 1. 冪等預期主檔狀態

- 以 `ExpectedMainState = { kind: 'present'; hash: string } | { kind: 'absent' }` 取代一次性的 `expectedInternalMainHash` 與 `suppressNextInternalDelete`。
- 每次內部主檔寫入前先登記 `present + SHA-256`；內部刪除前登記 `absent`。符合狀態的所有重複 watcher 事件持續忽略，不消耗狀態。
- `seedInitialValidDocument` 在確認目前磁碟 bytes 等於載入來源後，以實際主檔 bytes 建立基準；沒有主程式修復時仍只寫備份。
- 若事件觀察到的磁碟狀態與預期不同，保留預期狀態作為最後內部基準並走既有外部候選流程；新的內部提交會更新基準。
- rollback、候選提交、隔離復原及所有 `restoreBytes` 路徑都在變更主檔前登記精確狀態。備份檔事件不影響主檔狀態。
- 保留 500ms debounce、observation revision、generation 與拖曳延後載入；重複內部事件不再進到這些昂貴流程。

### 2. 全域與自訂文字欄位 IME 相容

- `ImeSafeFieldTextInput` 保留目前只在 composition／`Process`／229 期間略過 Blockly keydown 的最小行為。
- runtime 初始化時先 `unregister('field_input')`，再透過公開 `Blockly.fieldRegistry.register('field_input', ImeSafeFieldTextInput)` 註冊；由 JSON 建立的內建 `text` 與其他 `field_input` 自動使用安全類別。
- 保留 `createImeSafeFieldTextInput` factory，將 `arduino.js`、`esp32-wifi-mqtt.js`、`motors.js`、`txt.js` 的直接 constructor 全部換成 factory；`functions.js` 維持既有用法。
- registry 安裝必須可重複呼叫並只在 Blockly runtime 可用時執行，不修改 `Blockly.FieldTextInput.prototype`。
- WebView 全域快捷鍵與 shadow shortcut 保留既有 composition bypass；契約測試擴充為 registry、完整檔案稽核及三種 composition 訊號。

### 3. UTF-8 子程序與串流解碼

- CyberBrick pyserial 與 mpremote spawn 合併 `{ ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }`，不改 argv 邊界、cwd、`shell: false` 與 `windowsHide: true`。
- 每個 PTY 為 stdout、stderr 各建立一個 `StringDecoder('utf8')`。data event 使用 `decoder.write(Buffer)`，process close／exit 前各呼叫一次 `decoder.end()` 並輸出非空尾端。
- Arduino Monitor 採同一最小 decoder 模式，但不改 PlatformIO invocation environment policy。
- 換行正規化仍集中於 PTY `write()`；兩個 decoder 不共用狀態，避免 stdout 的半個字元污染 stderr。

### 4. Monitor 停止生命週期與安靜 UX

- 兩個 Monitor service 共用 `MonitorStopReason`。`stop(reason = 'manual_stop')` 明確帶入停止原因，`stopForUpload()` 使用 `upload_started`，終端 `close()` 使用 `user_closed`，未預期程序非零／error 使用 `device_disconnected`。
- service 保存目前生命週期的預期停止原因與 `stoppedReported` 旗標；所有終端關閉、process exit、主動 stop 路徑都透過同一 `reportStoppedOnce()`，每輪 start 重設。
- PTY 在預期停止時回報 0；未預期 process close 保留實際非零值，`null` 的非預期 close 視為失敗。使用者直接關閉終端會先經 PTY `close()` 標記正常使用者關閉。
- `WebViewMessageHandler.handleStopMonitor()` 只呼叫執行中的 service `stop('manual_stop')`，不再自行 post 第二個 `monitorStopped`。
- WebView 對 `manual_stop` 與 `upload_started` 都先更新狀態並清除目前 toast，不顯示新 toast；`device_disconnected` 保留 warning。
- 上傳流程原有進度訊息不變，因此 Monitor 停止訊息不再與上傳 toast 競爭。

## 複雜度追蹤

無需憲法豁免；所有變更都沿用現有服務、型別、公開 Blockly registry、Node.js 標準函式庫與 WebView 訊息格式。
