# Blockly 13 語系驗收

**日期**：2026-08-09  
**狀態**：15 語系檔案、A→B→A runtime 契約與 ARIA 驗證通過；人工 visible／VoiceOver 矩陣待 UI 控制授權。

## 自動證據

- `npm run validate:i18n`：14/14 非英文語系 0 errors；連同英文共 15 語系。
- 每個支援語系都存在 `node_modules/blockly/msg/<locale>.js`。
- runtime 依序載入官方 core locale，再覆寫專案 messages。
- A→B→A 測試驗證 request sequence、快取、stale request 防護、workspace JSON 保存／重建／還原及失敗 rollback。
- `BLOCKLY_ARIA_CONFIGURATION_ICON` 與 `BLOCKLY_ARIA_LOCKED_ICON` 在 15 語系皆存在。
- VSIX 內 15 個 core locale 檔案全數存在。

仍需在實際 editor／preview 逐語系觀察畫面文字與 VoiceOver 宣告，確認沒有前一語言殘留。T050 保持未勾選。
