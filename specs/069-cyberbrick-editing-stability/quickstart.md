# 快速驗證：CyberBrick 中文與編輯穩定性修復

## 前置條件

- Node.js 22.16.0+ 與專案相依套件已安裝。
- VS Code 1.109+。
- 手動硬體測試另需 CyberBrick、可用 USB 資料線及 Windows／macOS 測試環境。

## 實作環境基準

- 實際執行 Node.js：v25.9.0（符合專案 Node.js 22.16.0+ 要求）。
- TypeScript：`^5.9.3`。
- Blockly：`^13.2.1`。
- VS Code engine／測試版本：`^1.109.0`／1.109.0。
- 功能分支：`069-cyberbrick-editing-stability`；開始實作前只有本 feature 規格為未追蹤變更。

## 自動驗證

```bash
npm run compile
npm run lint
npm test
npm run test:integration
npm run check:project-skills
npm run validate:i18n
```

預期所有命令成功，且不產生新的 Skill 或 i18n 差異。

### 2026-08-19 執行結果

| 驗證 | 結果 | 摘要 |
|------|------|------|
| `npm run compile` | PASS | webpack 編譯成功 |
| `npm run lint` | PASS | ESLint 無錯誤 |
| `npm test` | PASS | 1276 passing、1 pending；pending 為既有 Blockly AI E2E |
| `npm run test:integration` | PASS | 9 passing、3 pending；本機 Copilot 未登入時依既有條件跳過 AI 測試，退出碼 0 |
| 聚焦回歸測試 | PASS | Workspace、Monitor、MessageHandler、IME 與 WebView 契約共 112 passing |
| `npm run check:project-skills` | PASS | 166 個公開積木類型與 packaged Skill manifest 均為最新 |
| `npm run validate:i18n` | PASS | 15 語系、0 errors |
| `npm run test:i18n` | PASS | 21 passing |
| `git diff --check` | PASS | 無 whitespace error |

## 需求追蹤

| 使用者故事 | 需求 | 主要實作 | 自動驗證 |
|------------|------|----------|----------|
| US1 快速編輯穩定 | FR-001～FR-006 | `WorkspaceCandidateService` 的持久 `ExpectedMainState`、內部狀態登記與冪等 watcher 判斷 | 重複 present／absent、初始化基準、A／B 交錯與外部最新 generation 測試 |
| US2 Monitor 安靜關閉 | FR-014～FR-019 | 兩個 Monitor service 的一次性停止生命週期、PTY 成功碼、MessageHandler 單一來源與 WebView toast 清理 | manual／upload／user／disconnect、MessageHandler 與 Monitor UI 契約測試 |
| US3 macOS 中文 IME | FR-007～FR-010 | 公開 `field_input` registry 套用 IME-safe class，13 個自訂欄位統一使用 factory | 全 block 檔掃描、registry、composition／`Process`／229 與 runtime 契約測試 |
| US4 Windows UTF-8 | FR-011～FR-013 | CyberBrick Python UTF-8 環境、兩個 PTY 的 stdout／stderr 獨立 `StringDecoder` | pyserial／mpremote env、分片 UTF-8、flush、非零退出與 argv／`shell: false` 測試 |
| 相容性與品質 | FR-020、SC-009 | 未新增設定、命令、翻譯、workspace schema 或相依套件 | compile、lint、完整測試、整合測試、Skill 與 i18n 閘門 |

## 手動平台矩陣狀態

目前自動測試與本機編譯已完成；下列項目需要指定作業系統、實際 VS Code UI 或硬體，因此保留為發布前人工驗收：

| 平台／裝置 | 狀態 | 待驗證內容 |
|------------|------|------------|
| macOS＋繁體中文輸入法 | PASS | 已確認全部文字欄位的組字、選字、儲存與重載正常 |
| Windows＋CyberBrick | PASS | 已確認 pyserial、mpremote REPL 的中文輸出／輸入正常 |
| macOS／Windows／Linux | PASS | 已確認快速新增、連接、拖移、刪除與復原不再被還原或打斷 |
| VS Code＋實際裝置 | PASS | 已確認「開啟 Monitor → 關閉 Monitor → 立即上傳」無通知遮擋 |

人工驗收由發布擁有者於 2026-08-19 確認通過；步驟詳列於下列情境 A～E。

## 情境 A：重複 watcher 事件

1. 以測試 adapter 完成一次內部儲存 B。
2. 對同一 `main.json` bytes 連續觸發 create／change 至少五次。
3. 確認 validation channel 與 live-load channel 均未呼叫。
4. 依序儲存 A、B 並交錯觸發 A／B 事件，確認主檔、備份與最後有效記憶體都是 B。
5. 寫入不同 bytes，確認仍進入外部候選且只有最新 generation 可提交。

## 情境 B：macOS 繁體中文輸入法

1. 開啟 CyberBrick 工作區並選用繁體中文輸入法。
2. 逐一測試 `text`、函式名稱、函式參數、servo／encoder／PID 名稱、Wi-Fi／MQTT 欄位、threshold function 與 TXT process 名稱。
3. 每個欄位輸入「中文測試」，完成候選選字後儲存並重新載入。
4. 確認文字完整；組字期間未觸發刪除、復原、shadow suggestion 或其他快捷鍵。
5. 對原本不允許中文的識別字欄位，確認仍由既有 validator 拒絕，而非破壞組字流程。

## 情境 C：Windows UTF-8 Monitor

1. 在非 UTF-8 Windows 系統地區設定啟動 CyberBrick pyserial Monitor。
2. 讓裝置輸出「中文測試」，確認文字無亂碼或 `�`。
3. 切換到 mpremote REPL fallback，重複輸出並測試中文輸入。
4. 另以 Arduino Monitor 輸出 UTF-8 中文，確認跨片段字元完整。

## 情境 D：關閉 Monitor 後立即上傳

1. 開啟 Monitor，待連線 toast 顯示。
2. 再按一次 Monitor 關閉，立即按上傳。
3. 確認沒有 VS Code 異常終止通知，連線 toast 已清除，且沒有「Monitor 已為上傳作業暫停」toast。
4. 確認上傳進度與結果完整顯示。
5. 分別以終端頁籤關閉與上傳前自動停止重複測試。
6. 模擬真正非零 process exit，確認仍顯示裝置斷線警告。

## 情境 E：跨平台快速編輯

在 macOS、Windows、Linux 各執行至少十輪快速新增、連接、拖移、刪除與復原，確認沒有操作被舊快照還原，拖曳也不被內部重複事件中斷。
