# Phase 0 Research: 非 Blockly 專案警告的 i18n 完善與孩子友善文案改進

**Feature Branch**: `047-warning-i18n-kid-friendly`  
**Date**: 2025-07-15  
**Status**: Complete

---

## 研究課題一覽

| # | 課題 | 來源 | 狀態 |
|---|------|------|------|
| R1 | 孩子友善文案撰寫策略 | Technical Context / Spec FR-001~FR-004 | ✅ 已解決 |
| R2 | 多語系孩子友善翻譯品質標準 | Spec FR-002 / SC-002 | ✅ 已解決 |
| R3 | VS Code 模態對話框字元限制 | Spec SC-004 / Constraints | ✅ 已解決 |
| R4 | 硬編碼 Fallback 訊息統一策略 | Spec FR-009 / FR-010 | ✅ 已解決 |
| R5 | 訊息鍵值一致性測試策略 | Constitution VII / Testing | ✅ 已解決 |
| R6 | 「不再提醒」偏好相容性 | Spec FR-008 | ✅ 已解決 |

---

## R1: 孩子友善文案撰寫策略

### Decision
採用「具體行為描述」取代「技術術語」的文案策略。文案以第二人稱「你」對孩子直接說話，語氣親切，使用具體的行為描述取代抽象的技術概念。

### Rationale
- 目標使用者為 8-14 歲兒童，閱讀能力約為國小三年級至國中二年級程度
- 研究顯示，兒童對「做什麼會發生什麼」的因果描述理解度最高
- 避免使用 project（專案）、folder（資料夾）、workspace（工作區）等開發者用語
- 按鈕文字應描述按下後的「結果」而非「動作」，例如：「好，幫我準備好！」而非「繼續」

### 文案轉換指引

| 現有術語 | 孩子友善替代 | 語氣說明 |
|----------|-------------|---------|
| project | 這個地方 / 這裡 | 用「地方」取代抽象的「專案」 |
| Blockly blocks | 積木內容 / 積木程式 | 保留「積木」一詞（孩子熟悉） |
| blockly folder and files will be created | 幫你準備好積木需要的東西 | 聚焦於結果而非技術細節 |
| workspace | 這個地方 / 這裡 | 同上 |
| Detected {type} project | 這裡已經有 {type} 的程式內容 | 以「有東西」描述而非「偵測到」 |
| may cause file loss | （移除） | 不對兒童使用威脅性措辭 |
| Continue | 好，幫我準備好！ | 表達具體結果 |
| Do Not Remind | 我知道了，以後不用再問 | 表達對話不再出現的後果 |
| Cancel | （模態內建，無需翻譯） | VS Code 模態自帶取消按鈕 |

### Alternatives Considered
1. **保留技術術語加註解**：「project (專案)」— 拒絕，因為加了更多文字讓孩子更難閱讀
2. **使用純圖示**：VS Code showWarningMessage 不支援自訂圖示，無法實現
3. **分級語氣（簡易/進階模式）**：過度工程化，違反 Constitution III（避免過度開發）

---

## R2: 多語系孩子友善翻譯品質標準

### Decision
建立統一的孩子友善翻譯品質清單，供 15 個語系共用。以英文版（en）作為基準語系的「語意原型」，各語系翻譯者依據本清單自行在地化，而非逐字翻譯。

### Rationale
- 各語系的「孩子友善」表達方式不同（如日文使用「です・ます」敬語體、韓文使用「해요」體）
- 逐字翻譯會產生不自然的文案，尤其在東亞語系中更明顯
- 統一的品質清單確保各語系在語意和語氣上保持一致，同時允許在地化調整

### 翻譯品質清單

- [ ] 不使用專業開發術語（project、folder、workspace、block 等需替換為日常用語）
- [ ] 使用適合 8-14 歲的語彙等級
- [ ] 語氣親切、不具威脅性（避免「可能導致檔案遺失」等警告性用語）
- [ ] 按鈕文字描述按下後的結果，而非抽象動作
- [ ] 保留技術專有名詞（Node.js、Python、Java 等）不翻譯
- [ ] `{0}` 占位符位置正確
- [ ] 符合字元長度限制（見 R3）

### Alternatives Considered
1. **僱用專業翻譯公司**：成本過高，不符合開源專案規模
2. **機器翻譯後人工審閱**：可作為初始版本，但最終仍需母語者依品質清單審閱
3. **僅更新英文與繁體中文**：違反 FR-002（全部 15 語系），拒絕

---

## R3: VS Code 模態對話框字元限制

### Decision
設定以下字元長度上限，作為各語系文案的撰寫指引：
- 警告本文（SAFETY_WARNING_BODY_*）：≤ 200 字元
- 按鈕文字（BUTTON_*）：≤ 15 字元
- 回饋訊息（SAFETY_GUARD_*）：≤ 100 字元

### Rationale
- VS Code `showWarningMessage({ modal: true })` 使用系統原生模態對話框
- 模態對話框寬度固定，過長文字會導致折行排版問題
- 按鈕文字過長會造成按鈕溢出或截斷
- 實測現有最長語系（德文 SAFETY_WARNING_BODY_WITH_TYPE）約 170 字元，200 字元上限提供合理餘裕
- 東亞語系（中日韓）每字佔寬約為拉丁字母的 2 倍，但字元數自然較少

### 現有文案字元數分析

| 鍵值 | 英文 | 德文 | 繁中 | 日文 | 上限 |
|------|------|------|------|------|------|
| BODY_NO_TYPE | 139 | 163 | 48 | 58 | 200 |
| BODY_WITH_TYPE | 172 | 170 | 60 | 74 | 200 |
| BUTTON_CONTINUE | 8 | 10 | 2 | 3 | 15 |
| BUTTON_SUPPRESS | 14 | 20* | 4 | 7 | 15 |
| GUARD_CANCELLED | 34 | 42 | 13 | 23 | 100 |
| GUARD_SUPPRESSED | 56 | 67 | 17 | 23 | 100 |

> *德文 BUTTON_SUPPRESS "Nicht mehr erinnern" (20 字元) 已超過建議上限，需在孩子友善版中縮短。

### Alternatives Considered
1. **不設上限，依賴 VS Code 自動折行**：風險是按鈕區域可能截斷，拒絕
2. **更嚴格的上限（本文 150、按鈕 10）**：部分語系（德文、俄文）可能無法表達完整語意

---

## R4: 硬編碼 Fallback 訊息統一策略

### Decision
1. `workspaceValidator.ts` catch block 中的 fallback 訊息更新為孩子友善的英文版本，與 `media/locales/en/messages.js` 中的英文版本完全一致
2. `webviewManager.ts` 中的 fallback 參數從中文硬編碼改為英文，與 `media/locales/en/messages.js` 中的英文版本完全一致

### Rationale
- Fallback 應使用英文（國際慣例的後備語言），而非中文
- Fallback 文案與語系檔英文版本保持一致，避免使用者看到不同版本的訊息
- `workspaceValidator.ts` 現有 fallback 使用「may cause file loss」等威脅性用語，不適合兒童

### 具體修改

**workspaceValidator.ts (catch block):**
```typescript
// 修改前
const fallbackMessage = projectType
  ? `Detected ${projectType} project. Opening the editor in a non-Blockly project may cause file loss. Do you want to continue?`
  : 'This may not be a Blockly project. Opening the editor in a non-Blockly project may cause file loss. Do you want to continue?';

// 修改後 — 與 en/messages.js 的孩子友善版本一致
const fallbackMessage = projectType
  ? `This place already has ${projectType} stuff in it. Want to add building blocks here too? We'll set everything up for you!`
  : `This place doesn't have building blocks yet. Want to set things up so you can start creating? We'll get everything ready for you!`;
```

**webviewManager.ts (fallback 參數):**
```typescript
// 修改前 — 中文硬編碼
'已取消開啟 Blockly 編輯器'
'已儲存偏好設定,未來不再顯示此警告'

// 修改後 — 英文，與 en/messages.js 孩子友善版本一致
'No worries! We didn\'t make any changes.'
'Got it! We won\'t ask you about this again.'
```

### Alternatives Considered
1. **保留中文 fallback**：違反 i18n 最佳實踐，且英文使用者遇到 fallback 時會看到中文
2. **使用 MESSAGE_KEYS 常量取代硬編碼字串**：catch block 本身就是 LocaleService 失敗時的後備，不能依賴 LocaleService

---

## R5: 訊息鍵值一致性測試策略

### Decision
新增單元測試驗證以下項目：
1. 所有 15 個語系檔都包含完整的 7 個安全守衛訊息鍵值
2. 包含 `{0}` 占位符的鍵值在所有語系中都有正確的占位符
3. 各語系的文案字元長度符合上限指引
4. `workspaceValidator.ts` 和 `webviewManager.ts` 的 fallback 字串與 `en/messages.js` 一致

### Rationale
- 自動化測試可防止未來翻譯遺漏或占位符錯誤
- 字元長度驗證確保新翻譯不會破壞 VS Code 對話框排版
- 符合 Constitution VII（全面測試覆蓋）

### Alternatives Considered
1. **人工審閱取代自動化測試**：容易遺漏，不可重複，拒絕
2. **CI 管線中的語系完整性檢查**：未來可做，但目前先以單元測試實現

---

## R6: 「不再提醒」偏好相容性

### Decision
不修改偏好儲存鍵值（`singularBlockly.safetyGuard.suppressWarning`）和儲存邏輯。文案更新僅影響顯示文字，不影響偏好值（boolean）的讀寫。

### Rationale
- 偏好值以 boolean 型態儲存在 VS Code workspace settings 中
- 安全守衛的判斷邏輯是檢查偏好值（true/false），與文字內容無關
- 比對使用者選擇時使用的是 localized button text（從語系檔讀取），不是硬編碼字串
  - 例外：catch block 中的 fallback 比對使用硬編碼字串 `'Continue'` 和 `'Do Not Remind'`，需同步更新

### 具體注意事項
- catch block 中的 `selection === 'Continue'` 和 `selection === 'Do Not Remind'` 比對字串，必須與同一 catch block 中 `showWarningMessage` 傳入的按鈕文字完全一致
- 若修改 fallback 按鈕文字，比對邏輯也必須同步修改

### Alternatives Considered
1. **重設所有使用者偏好**：違反 FR-008，嚴重影響使用者體驗，拒絕
2. **引入偏好版本機制**：過度工程化，偏好值已與文字無關，不需要

---

## 英文基準版本文案草稿

以下為英文（en）語系的孩子友善版本草稿，供其他語系參照翻譯：

### SAFETY_WARNING_BODY_NO_TYPE
> This place doesn't have building blocks yet. Want to set things up so you can start creating? We'll get everything ready for you!

### SAFETY_WARNING_BODY_WITH_TYPE
> This place already has {0} stuff in it. Want to add building blocks here too? We'll set everything up for you!

### BUTTON_CONTINUE
> Yes, let's go!

### BUTTON_SUPPRESS
> Don't ask again

### BUTTON_CANCEL
> Cancel

### SAFETY_GUARD_CANCELLED
> No worries! We didn't make any changes.

### SAFETY_GUARD_SUPPRESSED
> Got it! We won't ask you about this again.

---

**字元數驗證（英文基準）**:

| 鍵值 | 字元數 | 上限 | 狀態 |
|------|--------|------|------|
| BODY_NO_TYPE | 118 | 200 | ✅ |
| BODY_WITH_TYPE | 99 | 200 | ✅ |
| BUTTON_CONTINUE | 14 | 15 | ✅ |
| BUTTON_SUPPRESS | 14 | 15 | ✅ |
| BUTTON_CANCEL | 6 | 15 | ✅ |
| GUARD_CANCELLED | 43 | 100 | ✅ |
| GUARD_SUPPRESSED | 47 | 100 | ✅ |
