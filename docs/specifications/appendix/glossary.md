# Singular Blockly 術語對照表

## 專案相關

| 英文             | 繁體中文         | 說明                     |
| ---------------- | ---------------- | ------------------------ |
| Singular Blockly | Singular Blockly | 專案名稱，不翻譯         |
| Extension        | 擴展 / 擴充功能  | VSCode 擴展              |
| WebView          | WebView          | VSCode 內嵌瀏覽器視窗    |
| Extension Host   | 擴展主機         | Node.js 執行環境         |
| Workspace        | 工作區           | Blockly 或 VSCode 工作區 |

## Blockly 相關

| 英文          | 繁體中文 | 說明               |
| ------------- | -------- | ------------------ |
| Block         | 積木     | Blockly 程式積木   |
| Toolbox       | 工具箱   | 積木選擇面板       |
| Field         | 欄位     | 積木上的輸入欄位   |
| Dropdown      | 下拉選單 |                    |
| Input         | 輸入     | 積木連接點         |
| Output        | 輸出     | 積木輸出值         |
| Statement     | 陳述     | 不返回值的積木     |
| Value Block   | 值積木   | 返回值的積木       |
| Shadow Block  | 影子積木 | 預設值積木         |
| Mutation      | 變異     | 動態改變形狀的積木 |
| Serialization | 序列化   | 儲存/載入積木狀態  |
| Generator     | 生成器   | 程式碼生成器       |
| Tooltip       | 提示文字 | 滑鼠懸停說明       |

## 硬體相關

| 英文       | 繁體中文      | 說明                   |
| ---------- | ------------- | ---------------------- |
| Arduino    | Arduino       | 開發板品牌，不翻譯     |
| ESP32      | ESP32         | 晶片型號，不翻譯       |
| Super Mini | Super Mini    | ESP32-C3 開發板變體    |
| PWM        | PWM           | 脈衝寬度調變，保持縮寫 |
| I2C        | I2C           | 通訊協定，保持縮寫     |
| UART       | UART          | 串列通訊，保持縮寫     |
| Serial     | 串列 / Serial | 依上下文選擇           |
| GPIO       | GPIO          | 通用輸入輸出，保持縮寫 |
| Pin        | 腳位 / 引腳   |                        |
| Servo      | 伺服馬達      |                        |
| Motor      | 馬達          |                        |
| Encoder    | 編碼器        |                        |
| Sensor     | 感測器        |                        |
| LED        | LED           | 發光二極體，保持縮寫   |

## 通訊相關

| 英文      | 繁體中文  | 說明               |
| --------- | --------- | ------------------ |
| WiFi      | WiFi      | 保持原文           |
| MQTT      | MQTT      | 通訊協定，保持縮寫 |
| Broker    | Broker    | MQTT 伺服器        |
| Topic     | 主題      | MQTT 訊息主題      |
| Payload   | 訊息內容  |                    |
| Subscribe | 訂閱      |                    |
| Publish   | 發布      |                    |
| Client ID | Client ID |                    |

## 開發相關

| 英文       | 繁體中文    | 說明             |
| ---------- | ----------- | ---------------- |
| PlatformIO | PlatformIO  | 開發平台，不翻譯 |
| Build      | 建置 / 編譯 |                  |
| Compile    | 編譯        |                  |
| Deploy     | 部署        |                  |
| Upload     | 上傳        | 燒錄程式         |
| Debug      | 除錯        |                  |
| Test       | 測試        |                  |
| Coverage   | 覆蓋率      | 測試覆蓋率       |

## MCP 相關

| 英文       | 繁體中文   | 說明                   |
| ---------- | ---------- | ---------------------- |
| MCP        | MCP        | Model Context Protocol |
| MCP Server | MCP 伺服器 |                        |
| MCP Tool   | MCP 工具   |                        |
| STDIO      | STDIO      | 標準輸入輸出           |

## i18n 相關

| 英文        | 繁體中文        | 說明                 |
| ----------- | --------------- | -------------------- |
| i18n        | 國際化          | Internationalization |
| Locale      | 語系 / 地區設定 |                      |
| Message     | 訊息            | i18n 訊息鍵          |
| Translation | 翻譯            |                      |
| Fallback    | 後備 / 預設     |                      |

## 常用縮寫

| 縮寫  | 全稱                                           | 說明 |
| ----- | ---------------------------------------------- | ---- |
| API   | Application Programming Interface              |      |
| JSON  | JavaScript Object Notation                     |      |
| XML   | Extensible Markup Language                     |      |
| HTML  | HyperText Markup Language                      |      |
| CSS   | Cascading Style Sheets                         |      |
| IDE   | Integrated Development Environment             |      |
| CI/CD | Continuous Integration / Continuous Deployment |      |
| PR    | Pull Request                                   |      |
| SOP   | Standard Operating Procedure                   |      |

---

## 使用原則

1. **技術術語**：如 PWM、I2C、GPIO 等保持英文縮寫
2. **品牌名稱**：如 Arduino、ESP32、Blockly 不翻譯
3. **程式碼元素**：函數名、變數名保持原文
4. **UI 文字**：依照 VSCode 繁體中文語言包風格
5. **文件說明**：以繁體中文為主，必要時附加英文原文

---

_最後更新：2025-12-14_
