# 研究：CyberBrick 中文與編輯穩定性修復

## 決策 1：以持久預期狀態取代一次性 watcher 抑制

**決策**：主檔監看器保存最後一次內部提交的 `present + SHA-256` 或 `absent` 狀態；符合狀態的事件可重複忽略，直到新的內部提交更新基準。

**理由**：目前實作在第一個相符事件後清除 hash，原子 rename 常見的後續 create／change 事件便會被當成外部候選。只增加計數或時間窗無法可靠涵蓋不同平台與 watcher 排程；精確磁碟狀態可直接判定事件是否代表新內容。

**替代方案**：延長 debounce 仍可能在下一批事件重現；固定忽略 N 次依賴平台事件數；暫停 watcher 會漏掉同時發生的真正外部修改，皆不採用。

## 決策 2：使用 Blockly 公開 field registry

**決策**：將 app-owned `ImeSafeFieldTextInput` 註冊為 `field_input`，並讓直接建立的自訂欄位使用同一 factory。

**理由**：[Blockly 官方 fieldRegistry 文件](https://developers.google.com/blockly/reference/js/blockly.fieldregistry_namespace)指出 `fromJson` 會透過 registry 找到欄位類別，且公開提供 `register`／`unregister`。本機 Blockly 13.2.1 來源也確認 `FieldTextInput.fromJson` 使用動態 `this` 建立實例，因此子類別可涵蓋 JSON 定義的內建字串欄位而不需修改 prototype。

**替代方案**：逐一替換所有內建 block JSON 不完整且容易漏掉未來欄位；修改核心 prototype 會污染第三方 runtime；只保留現有兩個 factory 呼叫無法修復 `text` 等欄位，皆不採用。

## 決策 3：使用 Node.js StringDecoder 維持 UTF-8 邊界

**決策**：stdout 與 stderr 各自使用 `StringDecoder('utf8')`，data event 呼叫 `write()`，程序結束呼叫 `end()`。

**理由**：[Node.js 官方 StringDecoder 文件](https://nodejs.org/api/string_decoder.html)定義其會保留片段尾端的不完整多位元字元，直到下一次 `write()` 或 `end()`，正好解決 `String(chunk)` 對跨 chunk 中文字元產生替代字元的問題。

**替代方案**：`Buffer.toString('utf8')` 逐片段仍會破壞多位元字元；自行保存尾端 bytes 容易處理錯誤；合併 stdout／stderr 會破壞兩條串流順序與解碼狀態，皆不採用。

## 決策 4：Python 子程序明確採 UTF-8 模式

**決策**：CyberBrick 的 pyserial 與 mpremote 子程序加入 `PYTHONUTF8=1` 與 `PYTHONIOENCODING=utf-8`，並保留原環境。

**理由**：內嵌 Python 已將裝置 bytes 以 UTF-8 解碼，但 Windows 的 Python stdout encoding 仍可能依系統地區設定選擇非 UTF-8。兩個官方 Python 環境變數可在 pipe 輸出階段固定 UTF-8；同時保留 `process.env` 可避免破壞 PATH 與受管理 runtime 設定。

**替代方案**：只在程式中 `reconfigure()` 無法涵蓋 mpremote；只設 Node decoder 無法修復 Python 已用 CP950 編碼的 bytes；Big5 自動偵測超出裝置 UTF-8 契約，皆不採用。

## 決策 5：預期 PTY 關閉回報成功，錯誤保留非零

**決策**：預期的手動、上傳與終端頁籤關閉讓 PTY `onDidClose` 回報 0；未預期結束保留非零 exit code，並由 service 發出一次停止原因。

**理由**：[VS Code 官方 Pseudoterminal API](https://code.visualstudio.com/api/references/vscode-api#Pseudoterminal)明確指出 0 表示成功，非零表示失敗且一般終端會顯示通知。現況把主動 kill 常見的 `null` 映射成 1，正會觸發使用者觀察到的通知。

**替代方案**：所有 close 都回報 0 會掩蓋真實錯誤；不提供 code 會失去明確狀態；只在 WebView 隱藏 toast 無法阻止 VS Code 的終端異常通知，皆不採用。

## 決策 6：service 是停止原因唯一來源

**決策**：Monitor service 每輪只 emit 一次 `MonitorStopReason`；MessageHandler 僅轉送 callback。

**理由**：目前手動 stop 由 MessageHandler 額外 post，終端 close handler 又可能 post `user_closed`；上傳 stop 也由旗標與額外 callback 分散控制。集中至 service 可將 process、PTY、terminal 與按鈕競態收斂為一個可測試狀態機。

**替代方案**：在 MessageHandler 做去重仍看不到 process／terminal 的完整生命週期；以短暫 boolean 排除上傳只涵蓋單一路徑，皆不採用。
