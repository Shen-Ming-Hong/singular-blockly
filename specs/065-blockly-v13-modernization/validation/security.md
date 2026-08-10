# Blockly 13 安全檢查

**日期**：2026-08-09  
**狀態**：通過

## 檢查範圍與結論

| 範圍 | 結果 |
|---|---|
| Dialog request ID | 僅接受 1～128 字元的英數與 `._:-`；重複 request ID 會被拒絕，完成後從 active set 移除 |
| postMessage payload | prompt／confirm 使用 exact-key plain object 驗證；message、default value、board 均有型別、長度與格式上限 |
| Dialog result correlation | WebView 只接受 pending map 中相同 ID、相同 kind 且型別正確的結果；重複或未知結果無效 |
| Locale URI | runtime 只能從 Extension Host 注入的 15 語系 URI allowlist 取值；未知 locale 直接失敗 |
| Locale message merge | 只合併字串值並排除 `__proto__` |
| CSP | editor／preview 使用 `default-src 'none'`、本地 `cspSource` 與每次產生的 18-byte nonce；沒有外部 Blockly origin |
| Preview 檔名 | inline script 使用 JSON 與 `<>&` 安全編碼；HTML title 使用 entity escaping，阻止檔名型 XSS |
| Local resources | `localResourceRoots` 僅限 extension 的 `media` 與 `node_modules` |
| 錯誤日誌 | 不記錄 dialog value；只記錄固定錯誤字串及受格式限制的 request ID |

## 驗證

- WebView manager、preview、message handler 與 dialog adapter 安全測試：132 passing。
- 最終禁止 API 契約：9 passing。
- `npm audit --audit-level=low`：0 vulnerabilities。
- 新增程式碼未引入 `eval`、`new Function` 或以未編碼使用者資料建立 HTML。

Security checker 促成兩項額外修正：刪除未使用的 editor `DOMParser` fallback，以及新增 nonce CSP／preview 檔名雙脈絡編碼。未發現未修正的高、中、低風險問題。
