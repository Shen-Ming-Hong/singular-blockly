# 實作計畫：ESP32 接收 CyberBrick RC 訊號

**分支**：`codex/071-esp32-cyberbrick-rc` | **日期**：2026-09-24 | **規格**：[spec.md](./spec.md)

## 摘要

在 Arduino 工具箱新增僅 `esp32` 可見的 RC 分類，以六種實驗積木接收既有 CyberBrick 發射端的 ESP-NOW 封包。ESP32 產生器建立共享接收狀態、短回呼與安全讀取函式；缺少初始化或斷線時回傳安全預設。

## 技術背景

**語言／版本**：WebView JavaScript、TypeScript 6.0.3、ESP32 Arduino 2.0.17。\
**相依**：Blockly 13.2.1、PlatformIO `espressif32@7.0.1` 內建 ESP-NOW，無新函式庫。\
**儲存**：現有 Blockly workspace JSON；新增積木類型，不變更檔案格式。\
**驗證**：Mocha 契約測試、i18n 驗證、project Skill 契約檢查、PlatformIO 編譯與雙板實測。\
**平台**：VS Code Extension WebView 與 ESP32 DevKit。\
**限制**：僅 `esp32`；固定頻道；無 Wi-Fi／MQTT 頻道協調；接收回呼不能長時間執行。

## 憲法檢查

研究前與設計後均符合 I–XI：沿用既有工具箱與產生器模組、實驗標記、翻譯及驗證流程；不新增依賴或 Extension Host 訊息。第三方 API 已對照固定版本官方資料；產生碼嚴格解析不受信任封包並提供斷線安全預設。沒有豁免。

## 設計

1. 新增 `media/toolbox/categories/esp32_rc.json`，由 Arduino `index.json` 載入。`updateToolboxForBoard()` 只在 `boardId === 'esp32'` 保留該分類；板型警告函式涵蓋所有新類型。積木定義獨立為 `media/blockly/blocks/esp32-rc.js`，編輯與預覽 WebView 都載入。契約產生器以 `esp32` 作此分類唯一板型，並載入新定義。
2. 六種積木命名 `esp32_rc_receiver_init`、`esp32_rc_wait_connection`、`esp32_rc_is_connected`、`esp32_rc_get_joystick`、`esp32_rc_get_joystick_mapped`、`esp32_rc_is_button_pressed`。初始化為語句，配對 ID 是 Number 輸入，頻道為 1–11 數字欄位。等待為 1–60 秒語句；其餘為 Boolean 或 Number 輸出。全數呼叫 `registerExperimentalBlock`。
3. 新增 Arduino generator 模組 `esp32-rc.js`。共用支援碼解析 21-byte `<B10h` 封包，逐 byte 組合小端序 `int16_t`，避免 C++ 結構 padding。只接受長度正好 21、配對 ID 相符、六軸值在 0–4095 且按鈕值為 0 或 1 的封包；拒收時不更新資料或時間戳。ESP-NOW 回呼以 Arduino 2.0.17 的 `const uint8_t *mac, const uint8_t *data, int len` 簽名，完成解碼後在短 critical section 更新資料與 `millis()` 時間戳；讀值先取快照。接收端不需要註冊廣播 peer。
4. 初始化積木在使用者放置處呼叫設定函式：設定 STA、固定頻道、初始化 ESP-NOW 並註冊回呼；每一步檢查結果，失敗即保持未連線。讀值積木會註冊共享定義，即使缺少初始化積木也能編譯。連線有效期 1500ms；逾期或失敗時軸值 2048、按鈕 false。等待以短延遲循環直到連線或逾時；映射值採 0–4095 線性映射。
5. 新使用者可見字串補齊 15 語系；沿用 `CATEGORY_RC` 作分類名稱，新增 ESP32 專用標籤／提示／警告。當 RC 初始化與 Wi-Fi 連線積木並存時，在兩者顯示 RC 應先初始化、基地台須固定同頻道的警告；新增、刪除、停用積木及載入工作區時重新計算。文件明示需要同頻道、配對 ID 不是認證、Wi-Fi／MQTT 頻道衝突與硬體實測狀態。

## 專案位置

- 規格與證據：`specs/071-esp32-cyberbrick-rc/`。
- 積木、工具箱及產生器：`media/blockly/`、`media/toolbox/`。
- 載入與板型 UI：`src/webview/webviewManager.ts`、`media/js/blocklyEdit.js`。
- 翻譯、契約及測試：`media/locales/`、`scripts/generate-skill-contract.js`、`src/test/`。

## 驗證策略

先做封包解析／產生器契約測試，再完成積木與產生器。測試 21-byte 正確封包、錯誤長度／ID、斷線逾時、沒有初始化、板型限制和工作區 round trip。執行定向測試、lint、i18n、Skill 產物生成及檢查，再以固定 ESP32 環境編譯產生的 `src/main.cpp`。最後以 CyberBrick 與 ESP32 實測；缺硬體時只回報軟體驗證，不宣稱射頻互通通過。
