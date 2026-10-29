# ESP32 積木包

> 整合自 specs/072-esp32-block-packs、specs/073-block-designer

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

## 積木設計器（073）

積木包視窗的主要入口是「設計新積木」，匯入改為分享用途。

1. **拼外觀**：用零件（文字、腳位、數字、文字欄位、選單、接積木的插槽、內層積木）由左到右拼出積木；積木形狀用圖形點選（執行動作、回傳數字、回傳真假、回傳文字），形狀取自 Blockly 實際渲染結果；顏色用色塊開啟完整調色盤，存成 `#rrggbb`。
2. **填函式**：設計器依形狀與零件產生函式開頭（回傳型別、名稱、參數），使用者只寫函式本體；改零件時只重產開頭，本體保留。插槽可設預設值，工具箱中的積木會帶著對應的預設積木。
3. **檢查**：回傳值基本檢查（缺 return、空 return、只做動作卻回傳值、型別明顯不符）、函式名稱重複、函式庫格式；有問題時不能儲存。本體引用已刪除的參數時提醒。
4. **函式庫**：在進階區搜尋 PlatformIO Registry（只連 `api.registry.platformio.org`，限 ESP32 Arduino，最多 10 筆），按「加入」寫入 `libDeps` 並自動填入標頭檔。
5. **儲存與分享**：存成專案內的積木包（含 `designer` 區段保存設計與本體），工具箱立即更新；「匯出積木包」先經同一驗證器檢查，再以存檔對話框寫成 `.sbpack.json`。
6. **既有積木**：刪除插槽後，專案中舊積木接在該插槽上的積木改放到工作區頂層，不會讓載入失敗；刪除整個積木時沿用移除確認與佔位積木。

沒有 `designer` 區段的手寫積木包不顯示編輯按鈕，只能整包更新或移除。

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
- `media/blockly/blockPacks.js`、`media/js/blocklyEdit.js`（`blockPackManager`）、`media/js/blockDesigner.js`（設計器）、`src/services/blockPackLibrarySearch.ts`
- `media/schemas/block-pack.schema.json`、`resources/block-pack-examples/`
- 產品 Skill：`resources/project-skills/singular-blockly/canonical/references/block-packs.md`
