---
name: modern-web-guidance
description: 修改 WebView 前端（media/ 的 HTML、CSS、WebView JavaScript，以及 src/webview 產生的頁面與 CSP）之前，先用 Chrome 的 Modern Web Guidance 查現代網頁平台做法（對話框、Popover、捲軸、表單、無障礙、CSP／Trusted Types 等），再依本專案的 VS Code webview 環境套用；也用於前端過時寫法健檢（legacy-scan）。Use before changing Singular Blockly webview HTML/CSS/JS to look up modern web platform guidance, and for legacy-pattern audits.
metadata:
  author: singular-blockly
  version: "1.0.0"
  category: frontend
  upstream: GoogleChrome/modern-web-guidance-src (npm modern-web-guidance 1.0.2, Apache-2.0)
license: Apache-2.0
---

# Modern Web Guidance（WebView 前端）

[Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance) 是 Chrome 與 Mozilla、Microsoft 一起維護的網頁開發指南集，以 npm 套件 `modern-web-guidance` 提供搜尋、取回指南與 `legacy-scan` 掃描。本技能只包一層本專案的使用規則，指南本身每次從固定版本的套件取得，不複製進 repo。

## 什麼時候用

- **要用：** 新增或修改 `media/html`、`media/css`、`media/js`、`media/blockly` 中屬於 WebView 介面的程式（對話框、選單、下拉、提示、捲軸、表單、通知、進度、焦點與鍵盤、主題配色），以及 `src/webview/*` 產生的 HTML 與 CSP。
- **搭配：** 這是 `maintain-singular-blockly`「動手前」第 5 步業界參考的一部分，回答「網頁平台現在怎麼做」；VS Code UX、Blockly／Scratch／MakeCode 與 WCAG 2.2 的比對仍照 [業界標準參考與回報](../maintain-singular-blockly/references/industry-standards.md)。涉及 CSP、innerHTML、外部輸入時同時用 `security-checker`。
- **不用：** Extension Host 的 TypeScript、產生器輸出的 Arduino C++／MicroPython、建置與測試工具、翻譯文字。

## 本專案的平台條件

照這些條件判斷指南裡的相容性與備援要求：

- **執行環境只有一個：** WebView 跑在 VS Code（`engines.vscode` `^1.126.0`）內建的 Electron Chromium。不需要 Safari／Firefox 備援。Baseline（含 Newly available）的功能直接用；只有 Chromium 支援、還不是 Baseline 的功能，先確認最低支援的 VS Code 版本內建的 Chromium 已支援（WebView 開發者工具的 `navigator.userAgent`），並保留 `@supports` 或功能偵測的退路。
- **沙箱不允許 modal：** VS Code 的 webview iframe 沒有 `allow-modals`，`alert()`、`confirm()`、`prompt()`、`print()` 會被直接忽略。錯誤與確認改用頁面內的訊息或原生 `<dialog>`（`showModal()` 在 webview 可用，TXT 測試面板就是這樣做）。
- **CSP：** 頁面用 `default-src 'none'` 與 `script-src` nonce，不能載入外部資源，也不能用 inline `on*` 屬性。指南建議的 CDN polyfill 一律不用。
- **顏色與主題：** 指南裡的配色只是示範；顏色、焦點框、捲軸一律用 `--vscode-*` 主題變數與 `blocklyEdit.css` 既有 token，亮色與深色主題都要驗。
- **文字：** 使用者看得到的字都經過 `languageManager`，15 個語系都要補。

## 怎麼查

命令固定版本，避免指南內容在 PR 之間悄悄變動；升級版本時一併更新本檔的 `upstream` 與下列命令。需要網路連到 npm registry；雲端容器的 `~/.npm` 不可寫時加 `NPM_CONFIG_CACHE=/tmp/npm-cache`。

```sh
# 1. 搜尋：2–5 個英文字，描述單一 UI 或平台能力，不放框架或本專案名詞
npx -y modern-web-guidance@1.0.2 search "light dismiss dialog" --skill-version 2026_11_16-268fb9ea

# 2. 取回：可一次給多個 id，連同對應的大類指南（html、css、accessibility、security 等）
npx -y modern-web-guidance@1.0.2 retrieve "dialog,accessibility"
```

- 搜尋結果看 `description` 判斷；不相關就換成具體的元件名詞（`dialog`、`popover`、`listbox`、`progress`）再搜一次，還是沒有就照一般做法，不硬套。
- 輸出超過約 9.5 KB 時會存成暫存檔，用讀檔工具完整讀完。
- 改完對照指南檢查一次，確認現代做法與必要的退路都有套用，沒有加入需求以外的功能。

### 本專案優先參考的分類

| 分類                                                                                                                                | 用在哪裡                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `ui-components`、`ui-behaviors`、`ui-atoms`                                                                                         | 對話框、選單、下拉、提示、Toast、拖放、捲動行為                       |
| `html`、`css`、`visual-design`                                                                                                      | 原生 `<dialog>`／Popover、`:has()`、container queries、捲軸、深色主題 |
| `accessibility`、`forms`、`user-experience`                                                                                         | 焦點管理、錯誤公告、表單驗證、文字縮放                                |
| `security` 中的 `trusted-types`、`sanitize-untrusted-html`、`validate-origins`、`security`                                          | innerHTML、postMessage 來源、CSP                                      |
| `performance` 中的 `break-up-long-tasks`、`identify-inp-causes`、`interactions-in-complex-layouts`、`defer-rendering-heavy-content` | 大型 Blockly 工作區的互動延遲                                         |
| `js`                                                                                                                                | 陣列複製、`structuredClone`、日期時間                                 |

不適用、不必查：首次載入與 Core Web Vitals 中的 LCP、圖片與資源優先序、分析與 A/B 測試、passkey 與登入、PWA、SEO、WebMCP、Built-in AI、WebAssembly。

## 前端健檢（legacy-scan）

只在 Ray 要求整體健檢或現代化時跑；修改單一元件時用上面的搜尋流程，不跑掃描。

```sh
npx -y modern-web-guidance@1.0.2 legacy-scan media --json
```

1. 掃描只涵蓋約兩成指南有固定規則的部分，結果不等於完整健檢；同時用上面的分類人工檢查對話框、選單、捲軸、焦點與 CSP。
2. 每個發現依它附的 `keepWhen`／`dropWhen` 逐項確認，剔除誤判（刻意的 JSON 正規化、退路、第三方程式、不同接收者）。
3. 回報時依 `industry-standards.md` 的模板寫出參考、差距與建議，並標優先度；Ray 選定後才改。改完再對修改的檔案跑一次掃描，留下的退路不需要為了歸零而改。

## 交付時寫明

PR 描述加「Modern Web Guidance」一段：每個實際影響實作的指南 id 一行，說明採用了什麼、避開了什麼問題，附指南中的一句原文；查過但沒有採用時，寫一句查了哪些、為什麼不適用。
