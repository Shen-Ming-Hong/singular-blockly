# 編輯器主題表面

> 來源：`specs/057-editor-theme-surface-consistency`（2026-05）

Blockly 編輯器內的 UI 表面必須跟隨 `body.theme-light`／`body.theme-dark`，而不是直接以 VS Code host 主題決定底色。核心範圍包含 TXT 連線 modal、Sample Browser 與 TXT 虛擬控制器的 chrome。

## 主題契約

- 編輯器色彩集中使用 editor CSS tokens，避免散落 inline style。
- `updateTheme` 經 `postMessage` 套用主題，不重新載入 WebView。
- 切換主題後於下一次 repaint 生效，保留輸入內容、捲動位置與使用者自訂控制項色彩。
- VS Code token 可繼續用於字型、高對比、焦點等輔助屬性，但不得控制上述編輯器表面的基礎配色。
- 獨立且本來就由 host 主題管理的頁面須明確列入 allowlist，例如 PlatformIO Diagnostic，不要被全域規則誤改。

成功、警告、錯誤等回饋在所有主題都要保留原語意，不能只靠 hover 或單一顏色辨識，且訊息仍走既有 i18n。亮色、深色、高對比亮色與高對比深色都應納入 source-contract 測試與人工 smoke test。
