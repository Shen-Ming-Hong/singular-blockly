# 任務：CyberBrick 中文與編輯穩定性修復

**輸入**：`/specs/069-cyberbrick-editing-stability/` 的設計文件

**前置文件**：plan.md、spec.md、research.md、data-model.md、contracts/internal-contracts.md、quickstart.md

**測試策略**：本功能明確要求自動測試與平台手動矩陣；各使用者故事先補失敗測試，再實作並執行獨立驗證。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可與同階段其他不同檔案、無前置依賴的任務平行執行
- **[Story]**：對應 `spec.md` 的使用者故事

## Phase 1：設定與基準確認

**目的**：確認 feature 與既有安全邊界，不新增相依套件或資料格式。

- [X] T001 確認工作樹、Node.js／Blockly／VS Code 版本及相關測試基準，結果記錄於 specs/069-cyberbrick-editing-stability/quickstart.md
- [X] T002 [P] 確認 Monitor 共用停止原因契約與既有 WebView 訊息格式，必要時更新 src/types/arduino.ts

---

## Phase 2：共用基礎

**目的**：建立跨故事共用的契約保護與安全檢查範圍。

- [X] T003 [P] 擴充自訂文字欄位完整稽核與 registry 契約測試於 src/test/suite/blocklyImeCompatibility.contract.test.ts
- [X] T004 [P] 建立 Monitor WebView 停止提示契約測試於 src/test/suite/monitorUiLifecycle.contract.test.ts
- [X] T005 檢查本功能所有 spawn、WebView postMessage、文字欄位與主檔 I/O 變更符合 .agents/skills/security-checker/SKILL.md

**Checkpoint**：共用契約測試已建立，使用者故事可依序實作。

---

## Phase 3：使用者故事 1－快速編輯不再被還原或中斷（優先級：P1）🎯 MVP

**目標**：重複內部 watcher 事件保持冪等，真正外部候選仍正常驗證且只有最新世代可提交。

**獨立測試**：單次儲存後送入至少五個相符事件，validation/live-load 都為零；A/B 交錯事件最後收斂到 B；不同 hash 仍進候選。

### 測試

- [X] T006 [US1] 在 src/test/services/workspaceCandidateService.test.ts 新增重複 create/change、present/absent 與初始化基準的失敗測試
- [X] T007 [US1] 在 src/test/services/workspaceCandidateService.test.ts 新增快速 A/B 提交交錯事件及真正外部最新 generation 的失敗測試

### 實作

- [X] T008 [US1] 在 src/services/workspaceCandidateService.ts 以持久 ExpectedMainState 取代一次性 hash／delete 抑制旗標
- [X] T009 [US1] 在 src/services/workspaceCandidateService.ts 將儲存、初始化、候選提交、復原與刪除路徑統一登記精確預期狀態
- [X] T010 [US1] 執行 WorkspaceCandidateService 相關單元與整合測試並確認外部驗證、隔離、拖曳延後及必要主程式保護無回歸

**Checkpoint**：US1 可獨立驗收，不再由內部重複事件載回舊工作區。

---

## Phase 4：使用者故事 2－Monitor 正常關閉不遮擋上傳資訊（優先級：P1）

**目標**：正常停止回報成功且每輪只有一個原因，手動與上傳停止不產生或殘留提示。

**獨立測試**：手動、上傳與頁籤關閉各只回報一個原因及 PTY code 0；非預期非零退出仍警告；WebView 清除 toast 且不新增上傳暫停 toast。

### 測試

- [X] T011 [P] [US2] 在 src/test/suite/serialMonitorService.test.ts 新增 manual_stop、upload_started、user_closed 去重及預期／非預期 PTY code 測試
- [X] T012 [P] [US2] 在 src/test/suite/arduinoMonitorService.test.ts 新增 manual_stop、upload_started、user_closed 去重及預期／非預期 PTY code 測試
- [X] T013 [US2] 在 src/test/suite/messageHandler.test.ts 新增手動停止只由 service callback 發送 monitorStopped 的測試

### 實作

- [X] T014 [US2] 在 src/services/serialMonitorService.ts 實作共用 MonitorStopReason、預期關閉標記、PTY 成功碼及一次性停止回報
- [X] T015 [US2] 在 src/services/arduinoMonitorService.ts 實作相同停止生命週期並保留上傳後重啟行為
- [X] T016 [US2] 在 src/webview/messageHandler.ts 移除手動停止的重複 monitorStopped post，明確傳入 manual_stop
- [X] T017 [US2] 在 media/js/blocklyEdit.js 讓 manual_stop、upload_started、user_closed 清除現有 toast 且保持安靜，device_disconnected 保留警告
- [X] T018 [US2] 執行兩個 Monitor service、MessageHandler 與 WebView 契約測試，驗證開啟→關閉→立即上傳的訊息順序

**Checkpoint**：US2 可獨立驗收，正常停止不再觸發 VS Code 異常通知或遮擋上傳。

---

## Phase 5：使用者故事 3－macOS 所有文字欄位可正確使用中文輸入法（優先級：P2）

**目標**：內建 `field_input` 與所有自訂文字欄位共用 IME-safe 行為，validator 與序列化不變。

**獨立測試**：registry 解析成安全子類別；自訂 block 檔無直接 `new Blockly.FieldTextInput`；composition、Process、229 不進基底 keydown 或全域快捷鍵。

### 實作與測試

- [X] T019 [US3] 在 media/js/blocklyRuntime.js 透過公開 fieldRegistry 安裝可重複初始化的 ImeSafeFieldTextInput
- [X] T020 [US3] 在 media/blockly/blocks/arduino.js、media/blockly/blocks/esp32-wifi-mqtt.js、media/blockly/blocks/motors.js、media/blockly/blocks/txt.js 將直接 FieldTextInput 建立改用既有 factory
- [X] T021 [US3] 執行 src/test/suite/blocklyImeCompatibility.contract.test.ts 與相關 WebView runtime 契約測試，確認函式 validator 及快捷鍵保護無回歸

**Checkpoint**：US3 可獨立驗收，規格列出的文字欄位均納入同一 IME 契約。

---

## Phase 6：使用者故事 4－Windows CyberBrick 終端完整顯示 UTF-8 中文（優先級：P2）

**目標**：CyberBrick pyserial／mpremote 及 Arduino Monitor 正確處理 Windows UTF-8 與跨 chunk 多位元字元。

**獨立測試**：將「中文測試」bytes 切在所有字元內邊界，stdout/stderr 輸出完全相同且無 `�`；CyberBrick spawn env 含 UTF-8 變數並保留 argv 安全。

### 測試

- [X] T022 [P] [US4] 在 src/test/suite/serialMonitorService.test.ts 新增 stdout/stderr UTF-8 分片、close flush 與 pyserial/mpremote 環境測試
- [X] T023 [P] [US4] 在 src/test/suite/arduinoMonitorService.test.ts 新增 stdout/stderr UTF-8 分片及 close flush 測試

### 實作

- [X] T024 [US4] 在 src/services/serialMonitorService.ts 加入 CyberBrick UTF-8 Python 環境與 stdout/stderr 獨立 StringDecoder
- [X] T025 [US4] 在 src/services/arduinoMonitorService.ts 加入 stdout/stderr 獨立 StringDecoder 並保留 PlatformIO invocation 環境
- [X] T026 [US4] 執行兩個 Monitor service 測試並確認 shell=false、特殊字元 port/path 與錯誤 exit code 無回歸

**Checkpoint**：US4 可獨立驗收，UTF-8 中文不受 Windows 系統編碼或 chunk 邊界影響。

---

## Phase 7：收斂與跨故事驗證

**目的**：完成規格追蹤、品質閘門、安全檢查及可執行的手動交接。

- [X] T027 執行 npm run compile、npm run lint、npm test、npm run test:integration、npm run check:project-skills、npm run validate:i18n 並在 specs/069-cyberbrick-editing-stability/quickstart.md 記錄結果
- [X] T028 檢查 git diff 不含敏感資料、shell 注入、不安全 HTML、未驗證 postMessage 或繞過 FileService 的新檔案操作
- [X] T029 對照 specs/069-cyberbrick-editing-stability/spec.md、plan.md 與 tasks.md 完成四個故事的需求追蹤並標記所有已完成任務
- [X] T030 在 specs/069-cyberbrick-editing-stability/quickstart.md 記錄 macOS IME、Windows 硬體 Monitor 與 macOS／Windows／Linux 快速編輯矩陣的待執行條件或實際結果

---

## 相依與執行順序

### Phase 相依

- **Phase 1**：立即開始。
- **Phase 2**：依賴 Phase 1，提供共用契約測試。
- **US1、US2**：依賴 Phase 2，可因檔案互異而平行，但本次依任務編號順序執行。
- **US3**：依賴 T003；不依賴 US1／US2。
- **US4**：依賴 US2 的 Monitor 生命週期實作，避免在同一檔案產生衝突；功能驗收仍可獨立執行。
- **Phase 7**：依賴四個故事全部完成。

### 平行機會

- T003 與 T004 可平行。
- T011 與 T012 可平行。
- T022 與 T023 可平行。
- US1 與 US3 涉及不同檔案，可在多人情境平行。

## 實作策略

### MVP 優先

1. 完成設定與契約測試。
2. 完成 US1，先消除使用者操作被還原的資料可靠性風險。
3. 獨立執行 WorkspaceCandidateService 測試後再進入 Monitor 與 IME。

### 增量交付

1. US1：工作區編輯穩定。
2. US2：Monitor 關閉與上傳資訊穩定。
3. US3：macOS 中文輸入完整覆蓋。
4. US4：Windows 終端 UTF-8 完整顯示。
5. 完整品質閘門與平台手動交接。
