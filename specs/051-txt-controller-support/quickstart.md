# 快速啟動指南：TXT Controller 支援開發

**功能分支**：`051-txt-controller-support`  
**適用對象**：接手本功能實作的開發者

---

## 開發環境設定

### 1. 安裝依賴

```bash
cd /path/to/singular-blockly
npm install
```

> 實作 Phase B 後，`node-ssh` 會出現在 `package.json`，需重新執行 `npm install`。

### 2. 啟動開發模式

```bash
npm run watch
```

然後在 VS Code 按 `F5` 啟動 Extension Development Host。

### 3. 驗證建置

```bash
npm run compile   # TypeScript + webpack 建置
npm run lint      # ESLint 檢查
npm test          # 完整測試套件
npm run validate:i18n  # 15 語系 i18n 驗證
```

---

## 實作入口點

### Phase A（型別 + 積木）優先讀取

| 參考文件 | 說明 |
|---------|------|
| [data-model.md](./data-model.md) | 所有 TypeScript 型別定義 |
| [contracts/txt-blocks-api.md](./contracts/txt-blocks-api.md) | 積木 + Generator 合約 |
| [spec.md](./spec.md) FR-001 ~ FR-004 | 功能需求 |

**第一個要修改的檔案**：`src/types/board.ts`

```typescript
// 在此處新增
export type BoardLanguage = 'arduino' | 'micropython' | 'txt';
export type UploadMethod = 'platformio' | 'mpremote' | 'ssh';
```

### Phase B（後端 Service）優先讀取

| 參考文件 | 說明 |
|---------|------|
| [research.md](./research.md) | node-ssh API 用法、SecretStorage 模式 |
| [data-model.md](./data-model.md) | TxtConnectionConfig、TxtUploadStage 等型別 |
| `src/services/micropythonUploader.ts` | Service 模式參考（照此模式實作 TxtUploader） |

**node-ssh 安裝**：

```bash
npm install node-ssh
```

### Phase C（WebView UI）優先讀取

| 參考文件 | 說明 |
|---------|------|
| [spec.md](./spec.md) FR-010 ~ FR-013 | 連線設定 UI 需求 |
| [spec.md](./spec.md) FR-014 ~ FR-020 | Test Panel 需求 |
| [contracts/io-server-api.md](./contracts/io-server-api.md) | Test Panel ↔ io_server.py HTTP API |

**參考 WebView**：`media/html/blocklyEdit.html`（照此結構新增 TXT 連線設定區塊）

### Phase D（TXT Runtime）優先讀取

| 參考文件 | 說明 |
|---------|------|
| [contracts/io-server-api.md](./contracts/io-server-api.md) | io_server.py 的完整 HTTP API 規格 |
| [research.md](./research.md) 研究議題三 | Python 架構設計決策 |

---

## 關鍵測試場景

### 積木生成驗證（無需硬體）

1. 在 Extension Development Host 中選擇「TXT Controller」開發板
2. 從工具箱拖入以下積木並排列：
    - `txt_main`
    - 在容器內依序放入 `txt_motor_speed`（M1，速度 200，反轉）
    - `txt_wait`（2000ms）
    - `txt_stop_all`
3. 點擊「生成程式碼」

**預期輸出至少包含以下片段**：

```python
import ftrobopy
import time

txt = ftrobopy.ftrobopy('auto')
_m1 = txt.motor(1)
_m1.setSpeed(
time.sleep(2.0)
_m1.setSpeed(0)
for i in range(1, 9):
    txt.output(i).setLevel(0)
```

### 自動 pacing 驗證（無需硬體）

1. 在 `txt_main` 容器內加入一個 `while True` 迴圈
2. 讓迴圈條件式或內容讀取 `txt_input_sensor`
3. **不要** 放入 `txt_wait`
4. 點擊「生成程式碼」

**預期**：

- 若該 loop 存在未節流且可抵達尾端的 TXT 硬體輪詢/控制路徑，尾端會自動補 `txt.updateWait(0.01)`
- 若某條路徑已明確 `txt_wait`，或進入不返回的內層 `while True`，外層不應再多補一個多餘的 `txt.updateWait(0.01)`
- `txt_wait` 積木本身仍生成 `time.sleep(...)`，不會被改寫成 `txt.updateWait()`

### SSH 連線驗證（需要 TXT 硬體）

1. 在 Blockly Editor 的 TXT 連線設定區填入：
   - Host: `192.168.x.x`（TXT 的 IP）
    - Username: `ftc`
   - Password: ftCommunity 預設密碼
2. 點擊「測試連線」
3. **預期**：5 秒內顯示「連線成功」

### Test Panel 驗證（需要 TXT 硬體 + io_server.py）

1. 執行「安裝 TXT Runtime」命令
2. 執行「開啟 TXT Test Panel」命令
3. 拖動 M1 滑桿至 200
4. **預期**：M1 馬達開始旋轉（速度 200）
5. 鬆開滑桿
6. **預期**：M1 馬達**維持**速度 200（不自動歸零）
7. 點擊「全部停止」
8. **預期**：M1 停止，1 秒內完成

---

## 檔案創建清單（照順序執行）

```
Phase A:
□ src/types/txt.ts                          （新增）
□ src/types/board.ts                        （修改：新增 'txt', 'ssh'）
□ src/types/arduino.ts                      （修改：getBoardLanguage 支援 'txt'）
□ media/blockly/blocks/txt.js               （新增）
□ media/blockly/generators/txt/txt.js       （新增）
□ media/blockly/generators/txt/python_common.js（修改：TXT 共通流程控制與 while 自動 pacing）
□ media/toolbox/categories/txt.json         （新增）
□ media/locales/{15語系}/messages.js        （修改：新增 TXT i18n 鍵值）
□ package.json                              （修改：新增 node-ssh、TXT board、命令）

Phase B:
□ src/services/txtConnectionService.ts      （新增）
□ src/services/txtUploader.ts               （新增）
□ src/services/txtTestService.ts            （新增）
□ src/webview/messageHandler.ts             （修改：新增 TXT case）
□ src/extension.ts                          （修改：新增命令註冊）
□ src/test/suite/txtConnectionService.test.ts（新增）
□ src/test/suite/txtUploader.test.ts        （新增）
□ src/test/suite/txtTestService.test.ts     （新增）

Phase C:
□ media/html/blocklyEdit.html               （修改：新增 TXT 連線設定區塊）
□ media/js/blocklyEdit.js                   （修改：新增 UI 互動邏輯）
□ media/html/txtTestPanel.html              （新增）
□ media/js/txtTestPanel.js                  （新增）
□ src/webview/webviewManager.ts             （修改：新增 createTxtTestPanel）

Phase D:
□ txt-runtime/io_server.py                  （新增）
```

---

## 注意事項

1. **BoardLanguage 擴展**：修改 `getBoardLanguage()` 時，確認所有 `switch` 語句有 `'txt'` 的 case，避免 fallthrough 到 Arduino 邏輯
2. **Generator 隔離**：TXT 積木專屬 generator 使用獨立的 `txtGenerator`；積木本體在 `txt.js`，共通流程控制與 while 自動 pacing 在 `python_common.js`，不能共用 `arduinoGenerator` 或 `micropythonGenerator`
3. **node-ssh webpack**：`node-ssh` 是 Node.js 模組，在 `webpack.config.js` 的 `externals` 中加入（Extension Host 不打包 node_modules）
4. **i18n 驗證**：每次修改 `messages.js` 後執行 `npm run validate:i18n`，確保 15 個語系的鍵值完整
5. **密碼安全**：任何地方都不得將密碼 log 出來（logging.ts 或 console.log），確認 `TxtConnectionService` 的 log 語句排除密碼欄位
