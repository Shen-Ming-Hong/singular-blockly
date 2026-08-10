# Blockly 13 無障礙驗收

**日期**：2026-08-09  
**狀態**：鍵盤／ARIA／IME 自動契約通過；VoiceOver 人工矩陣待 UI 控制授權。

已自動驗證：

- AI shortcut 使用 Blockly `ShortcutRegistry`，不再使用 document capture listener。
- 中文 IME composition 期間不攔截 Enter／Escape。
- 自訂 icon 提供 configuration／locked 的本地化 ARIA 名稱。
- 搜尋與實驗標記不再操作 Blockly 私有 SVG 欄位。
- focus-visible、invalid 與 forced-colors 樣式契約存在。
- editor／preview workspace 重建後會重新綁定公開 listener。

鍵盤、IME、ARIA、marker 與相容性相關自動測試全數通過。下列人工項目尚未執行：toolbox／flyout 全程鍵盤建立、field／dropdown／mutator 操作、連接／移動／刪除、AI suggestion 開關，以及 VoiceOver 對焦點、名稱、狀態與結果的宣告。

T043 保持未勾選；沒有人工證據前不宣稱 SC-004／SC-005 完成。
