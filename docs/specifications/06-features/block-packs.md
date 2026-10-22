# ESP32 積木包

> 整合自 specs/072-esp32-block-packs

## 概述

**目標**：讓老師把一個感測器或模組包成「積木包」(`.sbpack.json`)，學生匯入後就能在工具箱直接拖用，不必寫 C++。

**狀態**：🧪 實驗功能（第一版僅支援 ESP32 DevKit，`esp32`）。硬體測試完成前以設定 `singular-blockly.experimental.blockPacks` 開啟，預設關閉；關閉時隱藏工具列按鈕與工具箱分類，Extension Host 拒絕 `importBlockPack`，但專案中已有的積木包仍會載入與產生程式碼。

已有的「函式」積木負責把內建積木組合成新積木，所以積木包只處理內建積木做不到的事：包裝 Arduino 函式庫與硬體呼叫。

---

## 使用流程

1. 在 ESP32 板子下按工具列的積木包按鈕，選「匯入積木包」並選擇 `.sbpack.json`。
2. Extension Host 讀檔（256 KB 上限）並驗證；含 `libDeps` 的積木包需要受信任的工作區，且會跳出確認框列出要下載的函式庫。
3. WebView 顯示預覽：積木外觀、產生的 C++、函式庫清單與版本變化，確認後才寫入專案。
4. 積木包分類出現在工具箱「函式」之前，分類名稱用積木包自己的名稱。

## 儲存格式

- 積木包定義完整存在 `blockly/main.json` 的 `workspace.customBlocks`（Blockly 自訂 serializer，priority 200），複製專案時不需要原始檔。
- 積木型別為 `pack_<packId>_<blockName>`。
- 缺少積木包時，積木會變成 `block_pack_placeholder_statement`／`block_pack_placeholder_value` 佔位積木，`extraState.original` 保留原狀態；積木包回來後自動還原。

## 程式碼產生

- 純文字模板替換，積木包內容不會在編輯器中執行。
- 值輸入加括號、文字輸入轉成 C++ 字串、數字輸入限制在範圍內、下拉與腳位必須是選項之一。
- `includes`、`globals`、`setup`、`libDeps` 每個程式只輸出一次。
- 非 ESP32 板子：積木保留，產生器只輸出註解並顯示板型警告。

## 安全與驗證

| 項目 | 規則 |
| --- | --- |
| 函式庫 | 只接受 PlatformIO `owner/name@version`，拒絕 URL；需要工作區信任與使用者確認 |
| 外部編輯 | 外部修改的 `main.json` 若 `customBlocks` 不合法，以 `INVALID_BLOCK_PACK` 拒絕 |
| 腳位 | 輸出腳位排除 34／35／36／39；獨占腳位被不同用途重複使用時顯示衝突警告 |

## 相關檔案

- `src/services/blockPackValidator.ts`、`src/services/blockPackService.ts`、`src/types/blockPack.ts`
- `media/blockly/blockPacks.js`、`media/js/blocklyEdit.js`（`blockPackManager`）
- `media/schemas/block-pack.schema.json`、`resources/block-pack-examples/`
- 產品 Skill：`resources/project-skills/singular-blockly/canonical/references/block-packs.md`
