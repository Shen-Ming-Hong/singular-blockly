# Blockly 13 最終成功標準核對

**日期**：2026-08-09  
**狀態**：實作與本機自動驗證完成；人工 UI／VoiceOver／斷網操作及真實 Copilot 整合測試待授權。

| 成功標準 | 狀態 | 證據／待辦 |
|---|---|---|
| SC-001 JSON/XML round-trip | 通過 | 4/4 fixtures，變數、shadow、locked、extra state 均保持 |
| SC-002 三種 generator | 通過 | Arduino、MicroPython、TXT golden／代表性測試全數通過 |
| SC-003 15 語系 A→B→A | 部分 | runtime 與 ARIA 契約通過；人工 visible／VoiceOver 待執行 |
| SC-004 純鍵盤主要流程 | 部分 | shortcut／IME／focus 契約通過；完整 GUI 鍵盤矩陣待執行 |
| SC-005 VoiceOver | 待驗收 | 需 macOS VoiceOver 人工矩陣 |
| SC-006 明暗／高對比 | 部分 | CSS 契約通過；editor／preview 人工視覺矩陣待執行 |
| SC-007 斷網 editor／preview | 部分 | VSIX 內容與隔離安裝通過；實際斷網 GUI smoke 待執行 |
| SC-008 禁止 API 為零 | 通過 | 6 類禁止 API 全為 0；allowlist 僅 preview XML import 與 legacy mutation hooks |
| SC-009 500-block 效能 | 通過 | Load -7.8%，Save -15.9%，均未退化 |
| SC-010 全部驗證命令 | 部分 | compile、lint、1032 tests、i18n、package、audit 通過；Copilot integration 待明確外傳授權 |

T057 保持未勾選，直到上述人工與整合驗收完成。沒有建立 release tag、沒有發布 Marketplace／Open VSX，也沒有在實作後再次 push。
