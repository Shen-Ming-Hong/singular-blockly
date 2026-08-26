# 回報功能文件與資料流一致性記錄

**日期**：2026-08-26
**狀態**：程式／文件、正式服務、發布身分與資料控制者授權一致；僅保留發布後平台掃描與 metadata 渲染確認

| 主題 | UI | 政策／README | Worker／封裝 | 結果 |
|---|---|---|---|---|
| 不需 GitHub 帳號 | intro 與入口明示 | README、SUPPORT | reporter secret 身分 | 一致 |
| 基本診斷 | 預設開啟、可關閉、精確預覽 | PRIVACY allowlist | strict schema | 一致 |
| 近期事件 | 預設關閉 | PRIVACY 列有限結構資料 | bounded stable-code schema | 一致 |
| 截圖 | 選用、隱私提醒、重編碼與限制 | PRIVACY 說明附件 | Worker magic/dimension/metadata 複驗、private R2 | 一致 |
| 處理者 | 確認頁明示 Cloudflare/GitHub | README、PRIVACY | D1/R2、private GitHub outbox | 一致 |
| 公開 issue | 只在 owner 核准匿名摘要後 | PRIVACY、TERMS | owner allowlist command | 一致 |
| 刪除與備份 | DELETE／DELETE ALL 與 backup caveat | PRIVACY、TERMS | 立即不可存取、tombstone、R2/GitHub scrub retry | 一致 |
| 資安通報 | 政策連結 | SUPPORT、SECURITY | 不公開敏感回報 | 一致 |

## 發布前外部 gate

- [x] 正式 `/privacy`、`/support`、`/terms` URL 可公開存取，並與本版文件逐字／語意一致。
- [x] Cloudflare、GitHub App 與私有 repository 的實際權限符合 `docs/feedback-deployment.md`；2026-08-21 已完成 create/list/detail/message replay/recovery/private sync/delete-all/tombstone smoke test，且 production cleanup 計數為 0。
- [x] Marketplace／Open VSX 發布者聯絡資訊與 namespace 狀態有效。
- [x] 資料控制者確認教育與未成年人資料情境、跨境處理、保留期間與備份限制。

平台工程檢查詳見 `docs/feedback-marketplace-compliance.md`；以上外部 gate 不以本地測試取代。
