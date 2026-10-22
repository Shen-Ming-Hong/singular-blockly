# 快速驗證：ESP32 積木包

## 前置

- `npm ci`、`npm run compile`；範例積木包在 `resources/block-pack-examples/`。
- 依 `cloud-local-verification` 啟動容器內的編輯器 WebView。

## 情境

1. ESP32 DevKit 專案 →「積木包」→ 匯入 `hc-sr04.sbpack.json` → 預覽顯示積木與 C++ → 確認。工具箱出現「Ultrasonic／超音波」分類。
2. 把「距離」積木放進 `loop` 的序列埠輸出 → 產生的 `src/main.cpp` 含 `hcsr04Distance` 定義一次與呼叫；`main.json` 出現 `workspace.customBlocks`。
3. 重新開啟編輯器：分類與積木還原。把專案複製到不含 `.sbpack.json` 的目錄開啟：結果相同。
4. 切到 Uno：分類消失、積木顯示板型警告、程式只有註解；切回 ESP32 恢復。
5. 移除積木包：先看到「1 個積木將成為佔位積木」確認 → 佔位積木出現；重新匯入 → 原積木與腳位設定還原。
6. 匯入 `resources/block-pack-examples/invalid/*.sbpack.json`：每個都被拒絕並顯示對應錯誤代碼訊息。
7. 未信任的工作區匯入含 `libDeps` 的範例：被拒絕；信任後出現依賴清單確認。

## 指令

```bash
npm run lint && npm test
npm run validate:i18n && npm run test:i18n
npm run generate:project-skills && npm run check:project-skills
```

範例積木包產生的 `src/main.cpp` 以 `espressif32@7.0.1`、`esp32dev` 編譯通過。
