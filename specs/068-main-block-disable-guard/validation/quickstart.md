# Quickstart 驗收結果

日期：2026-08-18
結果：全部通過

| 驗收項目 | 結果與證據 |
|---|---|
| 七種板型 | Uno、Nano、Mega、ESP32、SuperMini 對應 `arduino_setup_loop`，CyberBrick 對應 `micropython_main`，TXT 對應 `txt_setup`；mapping／`maxInstances` 契約通過。 |
| 主程式右鍵 | 三種必要主程式的 Blockly 核心 `blockDisable` precondition 均為 `hidden`；registry 重設後可重新安裝且不重複包裝。 |
| 普通停用 | `text_print`、`arduino_function`、Blockly procedure、`txt_process` 仍使用核心 callback 停用／啟用，未知原因保持。 |
| 自動修復 | `MANUALLY_DISABLED`、複數與未知原因全部清除；第二次修復回傳 false；序列化後必要主程式沒有 `disabledReasons`。 |
| 事件與 undo | 修復產生 0 個額外 change event，undo stack 不增加；原本已停用的 events 仍維持停用，例外後精確恢復。 |
| 結構保護 | 單一／重複主程式 deletable、數量簽章、既有警告、`maxInstances: 1` 與 TXT setup/process 驗證契約通過。 |
| Generator | 真實 runtime 修復 fixture 後，Arduino 保留 `setup()`／`loop()` 與內容、CyberBrick 保留 `main()` 內容、TXT 保留初始化及啟用 process thread；停用 process 未產生。 |
| 正常初載 | 原始 `main.json` bytes 不變，只建立 normalized `.bak`。 |
| CyberBrick 卡住案例 | 含兩個停用原因的 `micropython_main` 不需手動編輯 JSON；修復後主檔與備份相同，原有 IF／ELSE 子積木保持。 |
| 寫入失敗 | 主檔失敗、備份失敗、寫後中斷、原備份不存在等情境均回復 main、backup、memory。 |
| 外部候選 | preflight 保留候選，formal live load 回傳修復後文件，Host 以 generation／revision／deadline／source bytes guard 成對提交。 |
| 重建入口 | create、delete、disabled change、正式 load、FileWatcher／validated candidate、板型切換、語言 rebuild 與 fallback load 均有共同保護契約。 |

精準測試合計：主程式契約 10、workspace validation 9、初載 gate 6、candidate service 45、code generation 18、TXT generation 10、TXT toolbox 2、TXT fixture 4，全部通過。

## 手動驗收

使用者已於 2026-08-18 確認手動測試通過，包含 CyberBrick 主程式恢復啟用與必要主程式右鍵選單保護。
