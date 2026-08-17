# 規格品質檢查清單：受管理的 PlatformIO 雙 Core 環境

**目的**：在進入規劃階段前驗證規格的完整性與品質

**建立日期**：2026-08-15

**功能規格**：[spec.md](../spec.md)

## 內容品質

- [x] 沒有語言、框架、API 或程式結構等實作細節
- [x] 聚焦使用者價值與業務需求
- [x] 以非技術利害關係人可理解的方式撰寫
- [x] 所有必填章節均已完成

## 需求完整性

- [x] 沒有 `[NEEDS CLARIFICATION]` 標記
- [x] 需求可測試且沒有歧義
- [x] 成功指標可量測
- [x] 成功指標不依賴特定實作方式
- [x] 所有驗收情境均已定義
- [x] 已辨識邊界情境
- [x] 範圍與超出範圍清楚
- [x] 相依與假設已列出

## 功能就緒度

- [x] 所有功能需求具有明確驗收依據
- [x] 使用者情境涵蓋主要流程
- [x] 功能符合可量測成果
- [x] 規格未混入實作計畫

## F5 回饋需求覆蓋

- [x] 已定義一般資料夾在繼續、取消、Escape／關閉及「不再提醒」各選擇下的寫入邊界
- [x] 已區分既有 Blockly 專案的靜默維護與尚未成立專案的明確同意 gate
- [x] 已明定 OTA 設定與清除共用單一進度呈現，且兩種操作在 request 前都有可見回饋
- [x] 已區分 OTA 設定的真實 determinate 里程碑與 OTA 清除的 indeterminate 狀態，禁止虛構百分比
- [x] 已涵蓋亮色、暗色、高對比、reduced-motion、ARIA 與 15 語系需求

## issue #130 hotfix 需求覆蓋

- [x] 已定義固定長度內部版本目錄與 install record 身分分離，並保留既有 record 相容性
- [x] 已明定真實 E2E 必須使用 VS Code 預設 global storage 形狀，不得以短暫存根替代 Windows 路徑預算驗證
- [x] 已定義 provisioning attempt／trigger／stage／percent／recent failure 的生命週期、資料邊界與遮蔽上限
- [x] 已把 `managed-provisioning` fallback 限制在 probe／prepare，取消與 project-process 保持 fail closed
- [x] 已為預設路徑真實安裝、診斷證據一致性、隱私與 fallback 次數建立可量測成功指標

## issue #132 hotfix 需求覆蓋

- [x] 已區分 immutable runtime 與 PlatformIO installer scratch 的路徑預算，並要求兩者都在 artifact 執行前預檢
- [x] 已定義短 scratch 的交易隔離、所有權、成功／失敗／取消清理，以及不得觸碰 provider Core 的邊界
- [x] 已定義首次安裝、editor-open、ready／unsupported、明確 repair 與成功後 reload 的 Notification 顯示規則
- [x] 已明定絕對百分比轉增量、跨視窗等待不虛構百分比、取消橋接及非取消失敗的三個復原動作
- [x] 已定義跨視窗取得 lock 後重新採用健康 current record，避免第二套下載與重複安裝
- [x] 已為 `LongPathsEnabled=0`、15 語系、隱私化 repair packet 與 provider 不變建立可測成功指標

## 備註

- 既有 spec 063 的 provider 引導被視為相容性契約，不在本功能中移除。
- 路徑、權限、外部 PR 安全與發布閘門已在前期討論完成產品決策，無需額外澄清標記。
- 2026-08-16 依 F5 回饋新增 US7／US8、FR-032－FR-037 與 SC-012－SC-014；需求與既有 Project Skill、OTA、i18n 及安全契約一致。
- 2026-08-17 依 issue #130 新增 FR-038－FR-041 與 SC-015－SC-017；路徑預算、背景安裝可觀測性、隱私與 fail-closed fallback 契約一致。
- 2026-08-17 依 issue #132 新增 US9、FR-042－FR-047 與 SC-018－SC-019；短 scratch、Notification progress、取消及跨視窗採用契約一致。
