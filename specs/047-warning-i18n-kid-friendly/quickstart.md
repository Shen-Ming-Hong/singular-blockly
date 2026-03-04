# Quickstart: 非 Blockly 專案警告的 i18n 完善與孩子友善文案改進

**Feature Branch**: `047-warning-i18n-kid-friendly`  
**預計修改檔案**: 17 個（15 語系檔 + 2 TypeScript 檔）

---

## 快速上手

### 1. 環境準備

```bash
# 切換到功能分支
git checkout 047-warning-i18n-kid-friendly

# 安裝依賴
npm install

# 確認現有測試通過
npm test
```

### 2. 修改順序建議

依照依賴關係，建議以下修改順序：

```text
Step 1: 更新英文基準語系 (en/messages.js)
  ↓
Step 2: 更新 workspaceValidator.ts fallback 字串
  ↓
Step 3: 更新 webviewManager.ts fallback 字串
  ↓
Step 4: 更新其他 14 個語系檔
  ↓
Step 5: 新增/更新測試
  ↓
Step 6: 手動驗證
```

### 3. 關鍵檔案位置

| 用途 | 路徑 |
|------|------|
| 英文語系檔（基準） | `media/locales/en/messages.js` |
| 安全守衛邏輯 + fallback | `src/services/workspaceValidator.ts` |
| WebView 管理 + 回饋 fallback | `src/webview/webviewManager.ts` |
| 訊息鍵值常量 | `src/types/safetyGuard.ts` |
| 其他語系檔 | `media/locales/{locale}/messages.js` |

### 4. 修改範例

#### Step 1: 英文基準語系

```javascript
// media/locales/en/messages.js — 修改 7 個鍵值

// 修改前
SAFETY_WARNING_BODY_NO_TYPE: 'This project does not have Blockly blocks yet. If you continue, blockly folder and files will be created here. Do you want to continue?',

// 修改後
SAFETY_WARNING_BODY_NO_TYPE: "This place doesn't have building blocks yet. Want to set things up so you can start creating? We'll get everything ready for you!",
```

#### Step 2: workspaceValidator.ts

```typescript
// src/services/workspaceValidator.ts — 修改 catch block

// 修改前
const fallbackMessage = projectType
  ? `Detected ${projectType} project. Opening the editor in a non-Blockly project may cause file loss. Do you want to continue?`
  : 'This may not be a Blockly project. Opening the editor in a non-Blockly project may cause file loss. Do you want to continue?';

const selection = await vscode.window.showWarningMessage(fallbackMessage, { modal: true }, 'Continue', 'Do Not Remind');

if (selection === 'Continue') {
  return 'continue';
} else if (selection === 'Do Not Remind') {
  return 'suppress';
}

// 修改後 — 孩子友善 + 與 en/messages.js 一致
const fallbackMessage = projectType
  ? `This place already has ${projectType} stuff in it. Want to add building blocks here too? We'll set everything up for you!`
  : "This place doesn't have building blocks yet. Want to set things up so you can start creating? We'll get everything ready for you!";

const selection = await vscode.window.showWarningMessage(fallbackMessage, { modal: true }, "Yes, let's go!", "Don't ask again");

if (selection === "Yes, let's go!") {
  return 'continue';
} else if (selection === "Don't ask again") {
  return 'suppress';
}
```

#### Step 3: webviewManager.ts

```typescript
// src/webview/webviewManager.ts — 修改 fallback 參數

// 修改前
const cancelMsg = await this.localeService.getLocalizedMessage('SAFETY_GUARD_CANCELLED', '已取消開啟 Blockly 編輯器');
const suppressMsg = await this.localeService.getLocalizedMessage('SAFETY_GUARD_SUPPRESSED', '已儲存偏好設定,未來不再顯示此警告');

// 修改後
const cancelMsg = await this.localeService.getLocalizedMessage('SAFETY_GUARD_CANCELLED', "No worries! We didn't make any changes.");
const suppressMsg = await this.localeService.getLocalizedMessage('SAFETY_GUARD_SUPPRESSED', "Got it! We won't ask you about this again.");
```

### 5. 手動測試方法

```text
1. 在 VS Code 中按 F5 啟動擴充套件開發主機
2. 在開發主機中開啟一個空白資料夾
3. 執行「開啟積木編輯器」命令
4. 驗證：
   ✅ 對話框訊息使用孩子友善用語
   ✅ 按鈕文字清楚表達後果
   ✅ 點擊各按鈕後的回饋訊息正確顯示
5. 切換 VS Code 語系設定（Settings → Display Language）
6. 重複步驟 2-4，驗證各語系版本
```

### 6. 自動化測試

```bash
# 執行全部單元測試
npm test

# 執行整合測試
npm run test:integration

# 帶覆蓋率的測試
npm run test:coverage
```

---

## 設計決策摘要

| 決策 | 選擇 | 理由 |
|------|------|------|
| 文案風格 | 具體行為描述取代技術術語 | 8-14 歲兒童理解度最高 |
| Fallback 語言 | 英文 | 國際慣例後備語言 |
| 按鈕文字策略 | 描述結果而非動作 | 讓孩子知道點了會發生什麼 |
| 翻譯方法 | 語意原型 + 在地化，非逐字翻譯 | 各語系的「孩子友善」表達不同 |
| 字元限制 | 本文 200 / 按鈕 15 / 回饋 100 | VS Code 模態對話框排版限制 |
| 偏好相容性 | 不修改儲存鍵值與邏輯 | 尊重既有使用者設定 |

---

## 常見問題

### Q: 為什麼 BUTTON_CANCEL 也需要更新但不會顯示在對話框中？
A: `BUTTON_CANCEL` 存在於所有語系檔中供一致性使用（其他對話框可能引用）。VS Code 模態對話框透過內建的 ESC / 關閉按鈕處理取消操作，不額外渲染此按鈕。

### Q: catch block 的 fallback 為何不能用 MESSAGE_KEYS？
A: catch block 本身是 `LocaleService` 失敗時的後備路徑。如果在這裡再呼叫 `LocaleService`，同樣的錯誤會再次發生，形成無窮遞迴。

### Q: 如何確保 fallback 按鈕文字與比對邏輯一致？
A: catch block 中的 `showWarningMessage` 按鈕參數和後續的 `selection ===` 比對字串必須完全一致。建議抽取為 `const` 常量。
