# 任務：ESP32 接收 CyberBrick RC 訊號

**輸入**：[spec.md](./spec.md)、[plan.md](./plan.md)、[research.md](./research.md)、[rc-packet.md](./contracts/rc-packet.md)

## Phase 1：基礎與契約

- [X] T001 將 `esp32_rc` 分類與板型範圍加入 `media/toolbox/index.json`、`media/toolbox/categories/esp32_rc.json`、`media/js/blocklyEdit.js`、`scripts/generate-skill-contract.js`
- [X] T002 [US1] 在 `src/test/suite/esp32Rc.contract.test.ts` 增加封包、產生器與板型契約測試

## Phase 2：使用情境一—接收資料（P1）

- [X] T003 [US1] 在 `media/blockly/blocks/esp32-rc.js` 定義六種積木並註冊現有實驗標記
- [X] T004 [US1] 在 `src/webview/webviewManager.ts` 的編輯與預覽路徑載入新積木定義
- [X] T005 [US1] 在 `media/blockly/generators/arduino/esp32-rc.js` 實作 21-byte 解碼、ESP-NOW 接收回呼與初始化積木
- [X] T006 [US1] 在 `media/blockly/generators/arduino/esp32-rc.js` 完成等待、連線狀態、搖桿與按鈕讀值產生器

## Phase 3：使用情境二—安全預設（P1）

- [X] T007 [US2] 在 `media/blockly/generators/arduino/esp32-rc.js` 實作初始化失敗、缺少初始化與 1500ms 逾時的安全讀值
- [X] T008 [US2] 擴充 `src/test/suite/esp32Rc.contract.test.ts`，驗證錯誤長度／配對 ID、資料快照、逾時與非 ESP32 產生碼

## Phase 4：使用情境三—實驗標示與說明（P2）

- [X] T009 [US3] 在 `media/js/blocklyEdit.js` 加入新積木板型切換警告、RC／Wi-Fi 並存警告與實驗標記刷新檢查；在 `media/html/blocklyEdit.html` 保持警示圖示於工具列展開／收合時可見
- [X] T010 [US3] 依 `i18n-maintenance` 流程補齊 `media/locales/*/messages.js` 的新字串並通過增量語意檢查
- [X] T011 [US3] 在 `src/test/suite/esp32Rc.contract.test.ts` 驗證六積木工作區 load/save/load、僅 ESP32 可用與實驗清單

## Phase 5：整合與驗證

- [X] T012 更新 `docs/specifications/03-hardware-support/cyberbrick-rc.md`，記錄 ESP32 接收範圍、封包及 Wi-Fi 頻道限制
- [X] T013 執行 `npm run generate:project-skills`，檢查生成差異並執行 `npm run check:project-skills`
- [X] T014 執行定向測試、`npm run lint`、`npm run validate:i18n`、`npm run test:i18n` 及產生的 ESP32 `src/main.cpp` PlatformIO 編譯
- [X] T015 依 [quickstart.md](./quickstart.md) 進行可用硬體實測；若環境無雙板，記錄未驗證範圍並執行規格收斂

## 依賴與執行順序

T001–T002 建立基礎與測試；T003–T008 完成主要功能與安全行為；T009–T011 完成使用者體驗；T012–T015 為整合閘門。
