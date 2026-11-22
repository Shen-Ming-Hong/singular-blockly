# 業界標準參考與回報

Ray 多次要求（最近一次 2026-11-22）：**任何提案**與**任何 UI/UX 修改**都要先查業界現代主流標準，回報時告訴 Ray 參考了什麼、現況差多少、接下來怎麼設計比較好。這是強制規則，不是建議；少了這段的回報視為沒完成，要補上再送。

## 什麼時候適用

- **提案：** 新功能、新畫面、互動流程、使用者可見文字的方向、開發流程或工具鏈的改變，只要是交給 Ray 做決定的內容都算。
- **UI/UX 修改：** WebView 面板、對話框、選單、工具箱、積木外觀、捲軸、按鈕、主題配色、通知、錯誤與空白畫面、導覽、鍵盤操作與無障礙。既有元件的小幅調整（配色、間距、捲軸）也適用，只是可以先做完再回報。
- **不適用：** 純文字錯字、翻譯、不改外觀與行為的重構、依賴版本更新、CI 修補。

## 查什麼

至少兩個參考，其中一個是同類工具；查官方文件或實際畫面，不憑印象。回報時寫出名稱與連結，指出用到的是哪一節或哪個畫面。

| 面向                   | 優先參考                                                                                                                                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VS Code 擴充與 WebView | [VS Code UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/overview)、[Webview 指引](https://code.visualstudio.com/api/ux-guidelines/webviews)、[Theme Color 參考](https://code.visualstudio.com/api/references/theme-color)、VS Code 本身的同類畫面 |
| 積木編輯器             | [Blockly 文件](https://developers.google.com/blockly/guides/overview) 與其範例、[Scratch](https://scratch.mit.edu/projects/editor/)、[MakeCode](https://makecode.microbit.org/)、[App Inventor](https://appinventor.mit.edu/) 的實際編輯器                        |
| 無障礙                 | [WCAG 2.2](https://www.w3.org/TR/WCAG22/)（對比 1.4.3／1.4.11、焦點 2.4.7／2.4.11、目標尺寸 2.5.8 等）、[WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) 的元件模式                                                                                               |
| 設計系統               | [Material Design 3](https://m3.material.io/)、[Fluent 2](https://fluent2.microsoft.design/)、[Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)、[GitHub Primer](https://primer.style/)                                                  |
| 非 UI 提案             | 該領域的官方文件或主流做法，例如 VS Code 擴充發布規範、Arduino／PlatformIO 與 MicroPython 慣例、[OWASP](https://owasp.org/) 與 GitHub 官方文件                                                                                                                    |

取捨順序：VS Code 主題變數與 Blockly 既有樣式優先；再看兒童與教學使用者需要的可讀性與點擊範圍；最後是不破壞既有使用者的習慣。參考之間做法不同時，說明選哪一個、為什麼。

## 回報模板

交給 Ray 的提案、UI/UX 修改的回報訊息與 PR 描述，都要有這三段。互動式 HTML 預覽也在頁面上放同樣三段。

```markdown
### 業界參考

- <標準或產品名稱>（<連結>，<哪一節或哪個畫面>）：<它怎麼做>
- <標準或產品名稱>（<連結>）：<它怎麼做>

### 現況與標準的差距

| 項目           | 標準做法                       | 本專案現況         | 差距     |
| -------------- | ------------------------------ | ------------------ | -------- |
| <例：焦點外框> | <WCAG 2.4.11 要求焦點清楚可見> | <深色主題下看不到> | <不符合> |

### 建議的下一步

- 建議：<怎麼設計>
- 理由：<為什麼這樣比較好，對應上面哪個參考>
- 取捨：<放棄了什麼、其他做法為何不選、對既有使用者的影響>
```

- 差距表沒有差距的項目可以只寫「符合」，但要列出檢查了哪些項目；完全沒有差距時直接說明，不要省略這一段。
- 「建議的下一步」只寫一個推薦方向；有多個做法時，其他做法寫在「取捨」並說明為何不選。
- 回報 Ray 的訊息可以精簡，但三段的標題與內容都要在；細節放 PR 描述或預覽頁再附連結。
