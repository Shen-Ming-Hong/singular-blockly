# CyberBrick 範例瀏覽器

> 來源：specs/048-cyberbrick-sample-browser（2026-04）；交付紀錄：[PR #68](https://github.com/Shen-Ming-Hong/singular-blockly/pull/68)

## 概述

CyberBrick 主板模式在工具列提供範例按鈕與 modal，讓使用者依目前介面語言瀏覽並載入 Blockly 範例。Arduino 與其他主板不顯示這個入口。

範例目錄採雲端優先、套件內建副本後援：Extension Host 先從 GitHub Raw 取得 `media/samples/index.json` 與選定的 workspace JSON，請求逾時為 10 秒；網路失敗、逾時或回應無效時改讀已封裝的本地檔案，並在 modal 顯示離線提示。線上 index 更新可讓已安裝版本看到新範例，本地後援內容則隨擴充套件版本更新。

## 資料格式與在地化

`index.json` 的根物件包含：

- `version`：index 格式版本，用於記錄與相容性判斷。
- `categories`：選用的分類資料。
- `samples`：範例陣列；每筆至少包含穩定 `id`、安全的 `.json` `filename`、`board`、多語系 `title` 與 `description`。

標題與描述依「目前語系 → 英文 → 可用原文」順序回退。後續規格加入的 `nameTranslations` 與 `stringTranslations` 可在載入時同步轉換變數、函式名稱及字串內容，詳見[使用者介面與範例名稱在地化](../02-internationalization/user-facing-localization.md)。未提供新欄位的舊範例維持相容。

## 載入流程

1. WebView 要求 Extension Host 取得範例 index，modal 呈現 loading、清單、空清單、錯誤或離線狀態。
2. 使用者選取範例後，Host 取得並解析 workspace JSON。
3. 驗證資料為 Blockly workspace 物件，且主板為 `cyberbrick`。
4. 只有目前 workspace 已含積木時才顯示覆蓋確認；空白 workspace 直接載入。
5. 驗證或載入失敗時顯示可理解的錯誤，並保持目前 workspace 不變。

## 安全與邊界

- 範例檔名必須是單一安全 basename 且以 `.json` 結尾，拒絕路徑穿越與任意檔案讀取。
- WebView 不直接存取檔案或網路；所有資料都經由 `postMessage` 與 Extension Host 交換。
- 動態標題、描述與狀態文字以文字內容呈現，不把遠端內容當成 HTML 注入。
- 選定資料通過 schema、主板與 Blockly 載入驗證前，不覆蓋使用者工作區。

## 相關實作

- `src/services/sampleBrowserService.ts`：雲端／本地取得、資料驗證與在地化。
- `media/samples/index.json`：套件內建範例目錄。
- `media/samples/*.json`：套件內建離線 workspace。
- `media/blockly/main.js`：modal 狀態、確認與 workspace 載入協調。
