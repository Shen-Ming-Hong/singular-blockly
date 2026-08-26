# 使用者回報功能：VS Code Marketplace 與 Open VSX 合規檢查

> 檢查日期：2026-08-26。此文件是工程合規檢查，不是法律意見；平台條款與適用法律仍應在每次發布前重新確認。

## 結論

目前設計**沒有已知的 VS Code Marketplace 或 Open VSX 禁止項目**，而且採用 VS Code 官方 Issue Reporter 整合、最小化診斷資料、送出前逐項預覽、明確確認、公開隱私政策與私有服務端資產等措施。

Cloudflare、GitHub App、公開政策頁、正式 smoke test、資料控制者確認，以及 VS Code Marketplace／Open VSX 的發布身分設定已完成。下列平台發布後閘門仍未完成，因此目前候選 VSIX 不應發布：

1. 正式發布後確認 Marketplace／Open VSX metadata、支援與政策連結正確顯示。
2. 第一次以新 Open VSX `release` environment token 成功發布後，立即撤銷暫時保留的舊 Open VSX server-side token。
3. 兩個平台的 server-side malware／secret／blocklist／namespace 掃描通過，不壓制真實 credential finding。

## 平台規範對照

| 項目 | 判定 | 設計／證據 |
|---|---|---|
| VS Code Issue Reporter | 符合 | 透過 `issue/reporter` 與自訂 command 整合，同時保留 Blockly 編輯器產品內具本地化 tooltip 與 ARIA 名稱的入口。 |
| 產品內回饋入口 | 符合 | 不使用會與其他擴充套件混淆的通用編輯器標題圖示；主要入口位於 Blockly 自有控制區，以獨立藍色圓形圖示開啟相同受限表單。最右側按鈕可收合次要操作，收合時只保留備份、上傳與 Monitor；200% zoom 時控制區仍可自動換列。 |
| Webview 使用 | 符合 | 回報預覽、附件處理與歷程管理超出原生輸入元件能力；使用 VS Code 色彩 token、HTML/ARIA 語意與完整鍵盤流程。不要求實際語音朗讀驗收。 |
| 遙測／自動傳輸 | 符合 | 開啟表單不連網；基本環境資訊只在本機形成預覽，使用者可關閉，且必須再次確認才送出。這是使用者主動提交的支援資料，不是背景使用遙測。若未來加入背景或使用行為遙測，必須另行遵守 `vscode.env.isTelemetryEnabled`。 |
| 個人資料與隱私政策 | 符合 | VSIX 含 `PRIVACY.md`，UI 明示處理者、用途、保留與刪除限制；禁止收集路徑、名稱、原始記錄、來源碼、工作區內容、裝置識別碼、網路位址與憑證。正式 `/privacy` 已為全部 15 個既有支援語系公開完整政策，英文只作未知語系 fallback。 |
| 安全措施 | 符合 | HTTPS 固定來源、Webview CSP/nonce、嚴格訊息驗證、SecretStorage 256-bit 隨機密鑰、HMAC、限流、冪等、附件重編碼與服務端複驗。 |
| 支援責任 | 符合 | `SUPPORT.md` 與 `/support` 已定義管道；2026-08-26 已把 Marketplace publisher profile 與 Open VSX namespace 的 Support 設為正式公開 `/support`，並補上 description、homepage/source 與 GitHub profile。正式發布後仍須檢查商店頁渲染。 |
| 發布身分與 token | 部分完成 | VS Code Marketplace 已使用 Azure user-assigned managed identity，以及只允許 `Shen-Ming-Hong/singular-blockly` 的 `release` environment 的 GitHub OIDC subject；workflow 已合併、Marketplace User ID 已加入 `Singular-Ray` Contributor、不發布的 `verify-pat` 已成功，舊 `VSCE_PAT` 已移除。2026-08-26 後台確認 `Singular Blockly` 仍由 `Singular-Ray` 擁有、維護者為 Owner、managed identity 為 Contributor。Open VSX Agreement／namespace ownership 已確認；新專用 token 已移到 GitHub `release` environment，舊 repository secret 已刪除。舊 Open VSX server-side token 只作第一次新 token 驗證前的暫時 rollback credential，成功發布後必須立即撤銷。 |
| 外部服務揭露 | 符合 | README、隱私政策與確認畫面揭露 Cloudflare D1/R2、私有 GitHub 與公開 issue 的擁有者核准條件。 |
| Open VSX 套件掃描 | 符合 | 實際 production VSIX 已經本地檢查：保留 Blockly 與 SSH 必要 runtime，不含 Worker、migration、`ssh2/test` 憑證 fixtures、私鑰或部署 secrets；內含政策文件。Open VSX 發布時仍會執行其伺服器端 secret、blocklist 與 namespace-similarity 掃描。 |
| 授權與中繼資料 | 符合 | 套件維持有效 manifest、授權、homepage、bugs/support URL 與既有 publisher namespace；正式上傳後仍應人工檢查商店頁中繼資料。 |

Marketplace Verified Publisher 是額外信任標章，不是一般更新的必要條件。Microsoft 目前要求可管理 DNS 的非子網域、HTTPS HEAD 200，以及 publisher/extension 與網域各至少六個月的資格；`singular-ai.org` 根網域在 2026-08-26 尚未解析，因此本次不得宣稱或送出 verified domain，待根網域正式上線並符合年齡條件後再另案申請。

## 資料與同意邊界

2026-08-26，專案負責人明確確認具本回饋服務的資料控制者授權，並接受 Cloudflare／GitHub 跨境處理、內容保存至回報者刪除、7 天冪等資料、最長 90 天安全稽核、供應商備份無法保證即時逐筆抹除、教育／未成年人告知與必要同意責任、使用者主動輸入／截圖風險，以及匿名憑證遺失時可能無法安全辨識特定回饋的邊界。此確認不取代適用法域的專業法律意見。

- 「自動採集」只表示表單開啟後在本機建立允許清單資料；不代表自動上傳。
- 基本環境資訊預設勾選，但送出前會顯示精確 JSON 預覽，且需要使用者確認。
- 近期事件與截圖預設關閉；原始日誌、原始錯誤、檔案／工作區內容永遠不會被自動附加。
- 選擇的截圖會在 Webview 重新編碼，Worker 仍會驗證完整 PNG 結構或在受限資源內實際解碼 JPEG；D1 交易未提交的 R2 upload 由持久 marker 與排程補償刪除。
- 回報內文一律視為不受信任輸入；維護者 triage Skill 只能產生建議，不能自行公開、建立 issue、回覆或改變處理決定。
- 公開 GitHub issue 必須由擁有者核准獨立撰寫的匿名摘要，不能直接轉貼私人回報。

## 官方依據

- [VS Code：Issue Reporting](https://code.visualstudio.com/api/get-started/wrapping-up)
- [VS Code UX：Webviews](https://code.visualstudio.com/api/ux-guidelines/webviews)
- [VS Code：Telemetry extension authors guide](https://code.visualstudio.com/api/extension-guides/telemetry)
- [VS Code：Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [VS Code：Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Microsoft Publisher Agreement](https://learn.microsoft.com/en-us/legal/marketplace/msft-publisher-agreement)
- [Open VSX：Publishing Extensions](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions)
- [Open VSX：Extension Scanning](https://github.com/eclipse-openvsx/openvsx/wiki/Extension-Scanning)

## 每次發布前重新檢查

平台規範會更新。發布 PR 應重新開啟以上官方頁面、記錄檢查日期，並以實際 VSIX 執行套件內容與 secret 掃描；通過本地檢查不等同平台最終認證或法律合規保證。
