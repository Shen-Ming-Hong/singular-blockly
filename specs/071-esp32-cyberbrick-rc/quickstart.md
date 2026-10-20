# 驗收導覽

1. 選擇 ESP32 DevKit，確認出現「RC 連線」及六種黃色虛線積木；切換到其他板型後分類消失，舊積木有警告。
2. CyberBrick 端使用既有 `rc_master_init` 與 `rc_send`；兩端配對 ID 與頻道一致。
3. ESP32 端放接收初始化、限時等待，以及六軸和四按鈕讀取積木；生成並編譯 `src/main.cpp`。
4. 上傳兩塊板，操作搖桿與按鈕並觀察讀值；停止 CyberBrick 發射超過 1.5 秒，確認安全預設。
5. 改錯配對 ID 或頻道，再試無效封包與初始化失敗；確認不會把舊資料當作已連線。
6. 加入 Wi-Fi 連線積木，確認 RC 初始化與 Wi-Fi 連線兩處都有順序及同頻道警告；將 RC 初始化放在 Wi-Fi 連線之前，並使用固定在相同頻道的基地台。
7. 點選「RC連線」分類，確認沒有多餘的藍色焦點框且積木仍有實驗標示。儲存、關閉、重開工作區，確認設定與標示。執行 `npm run validate:i18n`、`npm run generate:project-skills`、`npm run check:project-skills` 及受影響測試。
