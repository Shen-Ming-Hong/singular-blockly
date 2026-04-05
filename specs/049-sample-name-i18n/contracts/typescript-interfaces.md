# TypeScript 介面合約

**Feature**: 049-sample-name-i18n  
**Date**: 2026-04-06  
**Target file**: `src/services/sampleBrowserService.ts`

---

## 新增介面：`NameTranslationEntry`

```typescript
/**
 * 單一名稱（函式 / 變數）的多語系翻譯對照表。
 * key 為語言代碼，value 為目標語系的識別字。
 * zh-hant 為基準語言（即原始名稱），不納入此介面。
 *
 * 所有翻譯值必須符合 Python 3 識別字規則；
 * 翻譯值不合法時，applyNameTranslations 忽略並執行回退。
 */
export interface NameTranslationEntry {
    en?: string;
    ja?: string;
    ko?: string;
    de?: string;
    fr?: string;
    es?: string;
    it?: string;
    'pt-br'?: string;
    ru?: string;
    pl?: string;
    cs?: string;
    hu?: string;
    bg?: string;
    tr?: string;
    [key: string]: string | undefined;
}
```

---

## 新增介面：`NameTranslations`

```typescript
/**
 * 範本 JSON 頂層的名稱翻譯表。
 * variables 映射同時涵蓋工作區變數 name 與函式參數名稱（extraState <arg name>）。
 * functions 映射涵蓋函式定義名稱（fields.NAME 與 extraState mutation name 屬性）。
 */
export interface NameTranslations {
    /** 變數與函式參數名稱的翻譯映射（key：zh-hant 原始名稱）*/
    variables?: Record<string, NameTranslationEntry>;
    /** 函式定義名稱的翻譯映射（key：zh-hant 原始名稱）*/
    functions?: Record<string, NameTranslationEntry>;
}
```

---

## 更新介面：`SampleWorkspace`

```typescript
// 現有（不變）:
export interface SampleWorkspace {
    workspace: object;
    board: string;
    // 新增欄位：
    nameTranslations?: NameTranslations;
}
```

---

## 新增純函式：`applyNameTranslations`

```typescript
/**
 * 將 workspace 中的函式名稱和變數名稱翻譯為目標語系。
 * 純函式：不修改輸入物件，回傳深層複製的新物件。
 * 無法翻譯的名稱（無翻譯映射或翻譯值不合法）保留原始名稱。
 *
 * @param workspace   Blockly workspace state 物件（來自 SampleWorkspace.workspace）
 * @param nameTranslations  翻譯映射表（來自 SampleWorkspace.nameTranslations）
 * @param language    目標語系代碼（如 'en'、'ja'，由 resolveLanguage() 取得）
 * @returns           翻譯後的 workspace 物件（深層複製）
 */
export function applyNameTranslations(
    workspace: object,
    nameTranslations: NameTranslations,
    language: string
): object;
```

### 行為合約

1. **深層複製**：回傳值永遠是新物件；輸入 `workspace` 不被修改
2. **替換對象**：
   - `workspace.variables[i].name`（工作區變數名稱）
   - `workspace.blocks.blocks[*].fields.NAME`（`arduino_function` 積木的函式名稱）
   - `workspace.blocks.blocks[*].extraState` 中的 `<arg name="X">` 屬性值（`arduino_function` / `arduino_function_call`）
   - `workspace.blocks.blocks[*].extraState` 中的 `mutation name="X"` 屬性值（`arduino_function_call`）
   - 以上所有對象均遞迴套用至巢狀積木樹（inputs.*.block、next.block）
3. **三層回退**（每個名稱獨立）：目標語系翻譯 → `en` 翻譯 → 原始名稱
4. **合法性驗證**：翻譯值不符合 `/^[^\d\W]\w*$/u` 視為不合法，等同「無翻譯」執行回退並記錄警告
5. **`zh-hant` 行為**：當目標語系為 `zh-hant` 或無對應翻譯時，保留原始名稱（不翻譯）

---

## 新增輔助函式：`isValidIdentifier`（模組內部，不匯出）

```typescript
/**
 * 驗證字串是否為合法的 Python 3 / MicroPython 識別字。
 * 使用 Unicode-aware /^[^\d\W]\w*$/u 正規表達式。
 *
 * @param name  待驗證的識別字字串
 * @returns     true = 合法，false = 不合法（含空字串）
 */
function isValidIdentifier(name: string): boolean;
```
