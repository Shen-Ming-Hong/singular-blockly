# 契約：Release Installation Gate Evidence v1

完整 runtime 測試聚合為單一 JSON，記錄 repository、PR、head SHA、tree SHA、VSIX SHA-256、manifest SHA-256、時間與 OS／arch／runner／artifact／path case／offline restart 結果。

## Gate 規則

- Runtime-sensitive PR 需要 Windows、macOS、Linux x64 success。
- Release candidate 另需要 manifest 宣告支援的 ARM64 success。
- identity SHA 必須與候選完全相同；新 commit 必須重新測試。
- squash merge 後可接受 commit SHA 改變，但 master tree SHA 必須等於 evidence tree SHA，否則禁止 tag。
- tag workflow 從 tag 重建 VSIX，並在 publish jobs 前通過封裝資源與 fake-runtime smoke。
- 外部 PR 不得使用 secrets、permanent self-hosted runner 或 `pull_request_target` 執行 PR code。

Evidence 不得包含 home、workspace 絕對路徑、proxy URL、環境變數或 token。CI artifact 預設保存 14 天；正式發布記錄摘要與 manifest SHA。
