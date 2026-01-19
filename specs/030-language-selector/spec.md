# Feature Specification: Blockly Language Selector

**Feature Branch**: `030-language-selector`  
**Created**: 2026-01-19  
**Status**: Draft  
**Input**: User description: "Add language dropdown in Blockly control bar for instant language switching, store language preference in settings.json, and clean up redundant theme field from main.json"

## Summary

為 Blockly 編輯器新增語言選擇下拉選單，讓使用者可以獨立設定 Blockly 介面語言（與 VS Code 語言分開）。同時清理 `main.json` 中冗餘的 `theme` 欄位，統一設定儲存位置。

Add a language selector dropdown to the Blockly editor, allowing users to set the Blockly interface language independently from VS Code. Also clean up redundant `theme` field from `main.json` to unify settings storage.

## User Scenarios & Testing

### User Story 1 - 為孩子選擇不同語言 (Priority: P1)

家長使用英文版 VS Code，但希望讓孩子使用繁體中文版的 Blockly 編輯器。

A parent uses VS Code in English but wants their child to use Blockly in Traditional Chinese.

**Why this priority**: 這是功能的核心需求，來自論壇使用者的實際請求。This is the core requirement, originating from actual user feedback on the forum.

**Independent Test**: 可以透過開啟 Blockly、選擇語言、確認 UI 即時切換來測試。Can be fully tested by opening Blockly, selecting a language, and confirming the UI updates immediately.

**Acceptance Scenarios**:

1. **Given** Blockly 編輯器已開啟且語言設為 "Auto", **When** 使用者從下拉選單選擇 "繁體中文", **Then** Blockly UI 立即切換為繁體中文
2. **Given** 使用者已選擇 "日本語", **When** 關閉並重新開啟 Blockly, **Then** 語言仍為日本語（設定已保存）
3. **Given** 使用者已選擇特定語言, **When** 使用者選擇 "Auto (跟隨 VS Code)", **Then** Blockly 語言切換回 VS Code 的語言

---

### User Story 2 - 設定儲存位置統一 (Priority: P2)

開發者或進階使用者希望設定檔結構清晰，避免同一設定存在多處造成混淆。

Developers or advanced users want a clear settings structure, avoiding the same setting being stored in multiple places.

**Why this priority**: 減少技術債，避免未來維護時的混淆。Reduces technical debt and prevents confusion during future maintenance.

**Independent Test**: 可以透過檢查 `main.json` 和 `settings.json` 的內容來驗證。Can be tested by inspecting the contents of `main.json` and `settings.json`.

**Acceptance Scenarios**:

1. **Given** 使用者切換主題, **When** 檢查 `blockly/main.json`, **Then** 檔案中不包含 `theme` 欄位
2. **Given** 使用者切換語言, **When** 檢查 `.vscode/settings.json`, **Then** 檔案包含 `singular-blockly.language` 設定
3. **Given** 舊專案有 `main.json` 包含 `theme` 欄位, **When** 開啟並儲存工作區, **Then** `theme` 欄位被移除，主題從 `settings.json` 讀取

---

### User Story 3 - 語言選單 UI 體驗 (Priority: P3)

使用者希望語言選單直觀易用，與現有控制列風格一致。

Users expect the language selector to be intuitive and consistent with the existing control bar style.

**Why this priority**: 提升整體使用者體驗，但不是核心功能。Enhances overall UX but is not a core feature.

**Independent Test**: 可以透過視覺檢查和互動測試來驗證。Can be tested through visual inspection and interaction testing.

**Acceptance Scenarios**:

1. **Given** Blockly 編輯器已開啟, **When** 使用者查看控制列, **Then** 語言選單顯示在主題切換按鈕附近
2. **Given** 使用者使用深色主題, **When** 查看語言選單, **Then** 選單樣式與深色主題一致

---

### Edge Cases

- 使用者選擇的語言代碼無效時：回退到 "auto"（跟隨 VS Code）
- `settings.json` 檔案損壞或不存在時：使用預設值（language: "auto", theme: "light"）
- 舊版 `main.json` 包含 `theme` 欄位時：讀取時忽略，儲存時移除

## UI/UX Design

### 語言按鈕設計

語言選擇採用「圖示按鈕 + 下拉選單」模式，與現有控制列按鈕風格一致。

**控制列佈局**（語言按鈕位於開發板選單之後、主題按鈕之前）：

```
[📋 開發板 ▼] (🌐) (🌙) (🔍) (📁) (🔄)
              ↑    ↑
          語言  主題
```

**按鈕外觀**：

- 圓形按鈕（32x32px），與主題/搜尋/備份按鈕一致
- 使用地球/翻譯圖示（Material Design translate icon）
- 滑鼠懸停時顯示 tooltip："選擇語言" / "Select Language"

**點擊行為**：

1. 點擊按鈕 → 展開下拉選單
2. 再次點擊或點擊選單外 → 收合選單

### 下拉選單設計

**選單位置**：按鈕正下方，向左對齊

**選單內容**：

```
┌──────────────────────────┐
│ ✓ Auto (跟隨 VS Code)   │
│   English               │
│   繁體中文              │
│   日本語                │
│   한국어                │
│   Español               │
│   Français              │
│   Deutsch               │
│   Italiano              │
│   Português (Brasil)    │
│   Русский               │
│   Polski                │
│   Magyar                │
│   Čeština               │
│   Български             │
│   Türkçe                │
└──────────────────────────┘
```

**選單行為**：

- 當前選擇的語言前顯示 ✓ 標記
- 滑鼠懸停時高亮該選項
- 點擊選項後立即切換語言並收合選單
- 支援深色/淺色主題樣式

### 與現有按鈕的一致性

| 按鈕     | 圖示  | 點擊行為         |
| -------- | ----- | ---------------- |
| 主題     | 🌙/☀️ | 直接切換         |
| 搜尋     | 🔍    | 展開搜尋面板     |
| 備份     | 📁    | 展開備份面板     |
| **語言** | 🌐    | **展開下拉選單** |
| 重整     | 🔄    | 直接執行         |

## Requirements

### Functional Requirements

- **FR-001**: 系統必須在 Blockly 控制列提供語言選擇圖示按鈕
- **FR-002**: 點擊語言按鈕必須展開下拉選單，包含 "Auto" 選項和 15 種支援的語言
- **FR-003**: 選擇語言後，Blockly UI 必須即時切換（不需重開編輯器）
- **FR-004**: 語言偏好必須保存在 `.vscode/settings.json` 的 `singular-blockly.language` 鍵
- **FR-005**: "Auto" 選項必須跟隨 VS Code 的顯示語言
- **FR-006**: 當前選擇的語言必須在下拉選單中以 ✓ 標記顯示
- **FR-007**: 點擊選單外任意處必須收合下拉選單
- **FR-008**: 系統必須移除 `blockly/main.json` 中的 `theme` 欄位
- **FR-009**: 主題設定必須只從 `.vscode/settings.json` 讀取
- **FR-010**: 系統必須向後相容舊版 `main.json`（包含 `theme` 欄位時不報錯）

### Key Entities

- **Language Preference**: 使用者選擇的語言代碼（"auto" 或 15 種語言代碼之一），儲存於 settings.json
- **Settings Storage**: `.vscode/settings.json` — 儲存 theme 和 language 設定
- **Workspace State**: `blockly/main.json` — 只儲存 workspace（積木狀態）和 board（開發板）

## Success Criteria

### Measurable Outcomes

- **SC-001**: 使用者可以在 3 秒內完成語言切換（點擊按鈕 → 選擇 → UI 更新）
- **SC-002**: 語言設定在重新開啟 Blockly 後仍然保持
- **SC-003**: 舊專案升級後不會出現錯誤或資料遺失
- **SC-004**: 支援全部 15 種語言 + Auto 選項
- **SC-005**: 語言按鈕與現有控制列按鈕視覺風格一致

## Assumptions

- 現有的 `languageManager.setLanguage()` 機制可正常運作
- 使用者接受透過下拉選單選擇語言（而非 VS Code 設定頁面）
- 語言按鈕放在開發板選單之後、主題按鈕之前是合適的位置（形成「介面設定」視覺群組）

## Clarifications

### Session 2026-01-19

- Q: 語言按鈕的確切位置？ → A: 放在開發板選單之後、主題按鈕之前（語言和主題都是「介面設定」類型，放在一起形成視覺群組）
