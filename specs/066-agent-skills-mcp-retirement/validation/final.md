# SC-001～SC-013 最終驗收總表

驗證日期：2026-08-12

| 成功標準 | 狀態 | 證據摘要 |
| --- | --- | --- |
| SC-001 | 通過 | VS Code 1.109、無 shell Node PATH、無 MCP 設定的隔離 workspace 約 3.55 秒自動 `ready`；新／既有／多根專案測試通過，零確認 |
| SC-002 | 部分通過 | Codex 真實讀取正式 Skill 並完成契約／fixture 驗收；Claude wrapper 等價與同 hash 契約測試通過；真實 Claude Code session 尚未執行 |
| SC-003 | 通過 | runtime/toolbox/dynamic flyout 產生 166 個唯一公開積木；小型索引路由至 19 個 category 分片，check mode 無 drift |
| SC-004 | 通過 | Arduino、CyberBrick、TXT 真實 Blockly load/save/load 與三種 generator golden output 全通過 |
| SC-005 | 通過 | 截斷、未知 type、非法 connection／field、extra state、空白、逾時、刪除與競態皆不取代最後有效版本 |
| SC-006 | 通過 | 最新隔離檔與最近 5 份完整 pattern 歷史輪替通過，其他使用者檔案不刪除 |
| SC-007 | 通過 | 受管理內容更新、逐位元備份、notes／自訂檔保留、manifest-last 與 rollback 測試通過 |
| SC-008 | 通過 | 產品 source、package、VSIX、語系與現行文件無舊 server／Node 安裝流程 |
| SC-009 | 通過 | 既有 v12/v13 fixtures 可開啟、round-trip、儲存及產生三種程式 |
| SC-010 | 待外部驗收 | 需要至少 10 位首次使用者；產品前置條件完成，但尚未執行受試者研究 |
| SC-011 | 通過 | 10 秒共同 deadline、channel unavailable、late reply、drag defer 與 timeout recovery 測試通過 |
| SC-012 | 通過 | 正常與失敗安裝／更新零一般通知；每個失敗有診斷及可寫入時的英文 AI 狀態 |
| SC-013 | 通過 | 英文內容、相對路徑、secret／workspace payload 清理與四核心服務 100% coverage 通過 |

## SDD／封裝狀態

- `specify integration status`：OK；modified managed files 0、missing 0、invalid manifest paths 0、unchecked manifests 0。
- Production package：webpack 已把 manifest、小型索引與 19 個 category 分片複製至唯一的 `dist/project-skills/` 來源；正式 versioned VSIX 由核准後的 GitHub Actions 發布流程產生。
- 自動測試：1082 passing、1 pending；coverage 1080 passing、3 pending；integration 9 passing、3 pending；pending 均為明確的測試環境或未提供外部 AI provider skip。

## 停止條件

產品實作、自動測試、安全檢查、移除掃描、語系、文件、coverage 與封裝均完成。T062 因 SC-002 尚缺真實 Claude Code session 而保持未完成；T063 因 SC-010 尚缺 10 位首次使用者而保持未完成。除此之外沒有已知的 066 實作缺口。
