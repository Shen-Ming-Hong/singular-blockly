# Code Simplifier 使用範例 Usage Examples

## 範例 1: 長時間 Coding Session 後的清理

### 場景 Scenario

使用者：「我剛完成了一個很長的 coding session，請幫我清理程式碼」

### 執行步驟 Steps

1. **識別最近修改的檔案**

    ```bash
    git diff --name-only HEAD~3
    ```

    輸出：

    ```
    src/webview/messageHandler.ts
    src/services/fileService.ts
    media/blockly/generators/arduino/motors.js
    ```

2. **審查每個檔案，套用簡化原則**

    - 檢查巢狀程度
    - 確認命名清晰度
    - 移除冗餘程式碼
    - 統一 coding style

3. **驗證變更不影響功能**

    ```bash
    npm run ci:static
    npm run test:unit:ci
    ```

4. **提交**
    ```bash
    git commit -m "refactor: simplify recently modified code for better readability"
    ```

---

## 範例 2: PR 前的程式碼品質檢查

### 場景 Scenario

使用者：「在建立 PR 之前，請使用 code simplifier 審查這些變更」

### 執行步驟 Steps

1. **查看待提交的變更**

    ```bash
    git diff --cached --name-only
    ```

2. **對每個檔案進行簡化分析**

    重點檢查：

    - 是否有過度工程化 (over-engineering)
    - 是否遵循專案的 `AGENTS.md` 規範
    - 是否有可合併的重複邏輯

3. **產生簡化建議** (範例)

    ```
    📋 Code Simplifier 審查報告

    ✅ src/services/fileService.ts
       - 無需修改

    ⚠️ src/webview/messageHandler.ts
       - Line 45-67: 可使用 early return 減少巢狀
       - Line 120: 建議使用 handler map 取代 switch

    ⚠️ media/blockly/generators/arduino/motors.js
       - Line 23: 變數命名 'd' 應改為 'direction'
       - Line 45-50: 可提取為獨立函式
    ```

4. **套用修改並驗證**

5. **更新 PR 描述**，說明已完成程式碼簡化

---

## 範例 3: 複雜重構後的一致性檢查

### 場景 Scenario

使用者：「我剛完成跨多個檔案的重構，請用 code simplifier 確保一致性」

### 執行步驟 Steps

1. **列出所有重構涉及的檔案**

    ```bash
    git log --oneline --name-only -1
    ```

2. **建立一致性檢查清單**

    | 項目        | 檢查點                             |
    | ----------- | ---------------------------------- |
    | Import 順序 | 是否按規範排序                     |
    | 函式宣告    | 是否使用正確的 function/arrow 選擇 |
    | 錯誤處理    | 是否避免不必要的 try/catch         |
    | 命名慣例    | 是否一致 (camelCase, PascalCase)   |

3. **逐一檢查並修正**

4. **執行完整測試套件**
    ```bash
    npm run test
    ```

---

## 範例 4: AI 生成程式碼的審查

### 場景 Scenario

使用者：「這段程式碼是 AI 生成的，請幫我簡化和優化」

### 常見問題 Common Issues

AI 生成的程式碼常見問題：

1. **過於冗長的變數名稱**

    ```typescript
    // AI 生成
    const numberOfItemsInTheShoppingCart = items.length;
    // 簡化後
    const cartItemCount = items.length;
    ```

2. **不必要的中間變數**

    ```typescript
    // AI 生成
    const filteredItems = items.filter(item => item.active);
    const mappedItems = filteredItems.map(item => item.value);
    const result = mappedItems;
    return result;

    // 簡化後
    return items.filter(item => item.active).map(item => item.value);
    ```

3. **過度防禦性的程式碼**

    ```typescript
    // AI 生成
    if (data !== null && data !== undefined && typeof data === 'object') {
    	// ...
    }

    // 簡化後
    if (data && typeof data === 'object') {
    	// ...
    }
    ```

4. **冗餘的註解**
    ```typescript
    // AI 生成
    // This function adds two numbers together
    // @param a The first number to add
    // @param b The second number to add
    // @returns The sum of a and b
    function add(a: number, b: number): number {
    	return a + b;
    }
    // 簡化後 - 函式名稱和類型已足夠說明
    function add(a: number, b: number): number {
    	return a + b;
    }
    ```

### 審查重點

-   ✅ 功能正確性 (永遠優先)
-   ✅ 程式碼清晰度
-   ✅ 專案風格一致性
-   ✅ 適當的錯誤處理
-   ✅ 合理的抽象層級

---

## 常用指令參考 Quick Command Reference

| 情境             | 指令                                     |
| ---------------- | ---------------------------------------- |
| 清理最近修改     | 「請用 code simplifier 清理最近的變更」  |
| PR 前審查        | 「在建立 PR 前，請 simplify 這些程式碼」 |
| 特定檔案簡化     | 「請簡化 src/services/fileService.ts」   |
| 複雜函式重構     | 「這個函式太複雜了，請幫我 refactor」    |
| AI 程式碼審查    | 「這是 AI 生成的程式碼，請幫我優化」     |
| 全專案一致性檢查 | 「請檢查整個專案的程式碼風格一致性」     |
