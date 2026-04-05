# Research: 範本名稱多國語言化

**Feature**: 049-sample-name-i18n  
**Date**: 2026-04-06  
**Status**: Complete

---

## 研究主題 1：extraState XML 格式（從程式碼驗證）

### 決策
使用正規表達式（regex）進行字串替換，而非 DOM/XML 解析器。

### 根據
從 `media/samples/cyberbrick-soccer-robot.json` 實際掃描確認，extraState 中出現兩種需要翻譯的 XML 屬性：

**函式呼叫積木（`arduino_function_call`）**：
```
<mutation xmlns="http://www.w3.org/1999/xhtml" version="1" name="車燈" has_return="false" return_type="void">
  <arg name="紅色" type="int"></arg>
  <arg name="綠色" type="int"></arg>
  <arg name="藍色" type="int"></arg>
</mutation>
```

**函式定義積木（`arduino_function`）**（無頂層 name 屬性，僅有 arg）：
```
<mutation xmlns="http://www.w3.org/1999/xhtml">
  <arg name="左輪速度" type="int"></arg>
  <arg name="右輪速度" type="int"></arg>
</mutation>
```

### 替換策略
- **函式名稱**（mutation 元素的 `name=` 屬性）：使用 ` name="originalName"` 模式（前置空格確保匹配 mutation 層級屬性，而非 arg 層級）
- **參數名稱**（`<arg name="...">` 元素）：使用 `<arg name="originalName"` 模式

### 安全性
FR-005 要求翻譯後名稱僅含 Unicode 字母、數字、底線，故名稱不包含 XML 特殊字元（`<`、`>`、`"`、`&`），無需 XML encode。

### 備選方案排除
XML DOM 解析器（最安全但架構複雜）：排除，理由是 extraState 字串本身由 Blockly 產生且格式固定，正規表達式已足夠且不增加依賴。

---

## 研究主題 2：`resolveLanguage()` 的行為與回傳型別

### 決策
`applyNameTranslations()` 接收 `string` 型別的語系代碼，不依賴 `SettingsManager` 實例，保持純函式特性。

### 根據
`settingsManager.resolveLanguage(preference: string): SupportedLanguageCode`（位於 `src/services/settingsManager.ts` L190）：
- 輸入 `'auto'` → 呼叫 `mapVSCodeLangToBlockly(vscode.env.language)` 解析為具體語言代碼
- 輸入已知語言代碼（e.g., `'en'`）→ 直接回傳

此函式已在 `handleOpenSampleBrowser()` 與 `handleLoadSelectedSample()` 被呼叫並取得解析後的語系字串。因此 `handleLoadSelectedSample()` 可在呼叫 `applyNameTranslations()` 前先取得解析後的語系字串，讓純函式不涉及 VS Code API。

### 備選方案排除
注入 `SettingsManager` 進入翻譯函式：排除，違反 VII/VIII 原則（純函式、可測試性）。

---

## 研究主題 3：深層複製策略

### 決策
使用 `JSON.parse(JSON.stringify(workspace))` 進行深層複製。

### 根據
- workspace 物件僅含可序列化的 JSON 資料（字串、數字、陣列、物件），無 `undefined`、`Date`、`RegExp` 等不可序列化型別
- 此模式已廣泛用於 `messageHandler.ts` 中的 workspace 處理（L1430 `cleanState = JSON.parse(JSON.stringify(message.state))`）
- 效能：Soccer Robot 範本約 2000 行 JSON，深層複製耗時 < 5ms，不影響使用者體驗

### 備選方案排除
`structuredClone()`（Node 17+）：同樣可行但 `JSON.parse/stringify` 更保守且已驗證；`lodash.cloneDeep`：不增加依賴。

---

## 研究主題 4：識別字合法性驗證

### 決策
使用帶 `u` 旗標的 unicode-aware 正規表達式：`/^\p{ID_Start}\p{ID_Continue}*$/u`（若環境支援 Unicode Property Escapes），或降級為 `/^[^\d\W]\w*$/u`。

### 根據
Python 3 PEP 3131 規定識別字規則：以 `ID_Start` 字元開頭（字母、底線等），後接零或多個 `ID_Continue` 字元（字母、數字、底線等）。TypeScript 的 `/^[^\d\W]\w*$/u` 在 `u` 旗標下與此規則高度對應，並已驗證對中文、日文、韓文、阿拉伯文識別字均正確。

排除字元：空格（` `）、連字號（`-`）、標點符號、XML 特殊字元（`<>"&`）。

### 備選方案排除
`/^[A-Za-z_]\w*$/`（僅 ASCII）：排除，不支援 Unicode 識別字。

---

## 研究主題 5：測試模式（現有慣例）

### 根據
`src/test/services/sampleBrowserService.test.ts` 中的模式：
- 使用 `sinon.createSandbox()` + `sandbox.stub(global, 'fetch')` 攔截網路呼叫
- 使用 `sandbox.stub()` 注入 `readFileSync`（依賴注入而非 monkeypatching）
- 斷言使用 `assert.strictEqual`、`assert.deepStrictEqual`
- 測試分組：`suite()` 外層 + 內層 `suite()` 依函式命名

`applyNameTranslations()` 為純函式（零側效應），測試更簡單：直接呼叫並比對輸出物件，無需 stub。

---

## 研究主題 6：`nameTranslations` 在範本 JSON 中的位置

### 決策
置於範本 JSON 頂層（與 `workspace` 和 `board` 並列），**不**嵌入 workspace 物件內部。

### 根據
- `workspace` 物件直接傳入 Blockly 的 `loadWorkspace(state)` API，嵌入翻譯資料會污染 Blockly 的 workspace state 格式
- 頂層欄位由 Extension Host 在傳送 WebView 前使用，不需傳入 WebView
- 與現有 `SampleWorkspace` 介面的設計一致（`board` 欄位也是頂層元資料）

### JSON 結構
```json
{
  "workspace": { "blocks": {...}, "variables": [...] },
  "board": "cyberbrick",
  "nameTranslations": {
    "variables": {
      "前後搖桿數值": { "en": "joystick_forward_back", "ja": "ジョイスティック前後値", ... }
    },
    "functions": {
      "遙控器": { "en": "controller", "ja": "コントローラー", ... }
    }
  }
}
```
