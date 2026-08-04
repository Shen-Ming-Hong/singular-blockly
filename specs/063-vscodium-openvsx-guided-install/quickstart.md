# 驗證快速指南：VSCodium / Open VSX 支援與引導安裝

## 前置條件

- Node.js 22.16.0+
- `npm install` 完成
- Git branch：`063-vscodium-openvsx-guided-install`

## 情境 1：VS Code 初次設定（任一板子）

**目的**：驗證積木編輯器開啟時維持原有共同 PlatformIO 前置

**設定步驟**：
1. 確認 PlatformIO IDE 和 pioarduino 均未安裝
2. 開啟任一 Singular Blockly 工作區與積木編輯器

**執行**：重新開啟 VS Code 視窗（`Developer: Reload Window`）

**預期結果**：
- 右下角出現 VS Code 通知，包含「安裝擴充功能環境」按鈕
- Blockly 編輯器仍可正常操作（通知非 modal）

**驗證指令**：
```bash
npm test  # 所有測試通過（908+ 筆）
```

---

## 情境 2：安裝按鈕觸發（VS Code Marketplace）

**目的**：驗證 platformio.platformio-ide 自動安裝

**前置**：同情境 1 且已顯示通知

**執行**：點擊「安裝擴充功能環境」按鈕

**預期結果**：
- PlatformIO IDE 開始安裝（Extensions 面板顯示安裝進度）
- 安裝完成後 VS Code 自動顯示「Reload Required」
- Reload 後 PlatformIO 啟動並自動建立 `~/.platformio/penv/`

---

## 情境 3：VSCodium 自動 fallback（pioarduino）

**目的**：驗證 Open VSX 環境正確安裝 pioarduino

**設定步驟**：
1. 安裝 VSCodium（`brew install --cask vscodium`）
2. 以獨立測試環境啟動：
   ```bash
   /Applications/VSCodium.app/Contents/MacOS/VSCodium --user-data-dir /tmp/vscodium-test
   ```
3. 安裝本擴充功能（`.vsix`）
4. 開啟 Arduino 工作區

**預期結果**：
- 通知出現
- 點擊按鈕後，嘗試安裝 `platformio.platformio-ide` 失敗（Open VSX 無此 extension）
- 自動 fallback 安裝 `pioarduino.pioarduino-ide`
- pioarduino 安裝成功，VS Code 顯示 Reload Required

**清理**：
```bash
rm -rf /tmp/vscodium-test
```

---

## 情境 4：TXT 工作區維持共同前置環境

**目的**：驗證移除硬性 dependency 後仍與舊版行為一致

**設定步驟**：
1. 確認 PlatformIO IDE 和 pioarduino 均未安裝
2. 開啟 TXT Controller 工作區（`mainJson.board === 'txt'`）

**預期結果**：開啟積木編輯器後仍觸發 PlatformIO provider 安裝確認

---

## 情境 5：現有使用者不受影響

**目的**：迴歸驗證

**設定步驟**：確認 PlatformIO IDE 已安裝

**預期結果**：
- 不出現安裝通知
- 所有現有上傳功能正常運作
- `npm test` 全數通過

---

## 情境 6：兩個 extension 均安裝失敗

**目的**：驗證失敗 fallback 開啟 Extensions 面板

**設定步驟**（單元測試中驗證，不需手動測試）：
- mock `executeCommand` 的 `installExtension` 呼叫均 reject
- 驗證 `workbench.extensions.search` 被呼叫且參數為 `'platformio'`
- 驗證顯示 `PENV_PROVIDER_INSTALL_FAILED` 訊息
- 驗證不顯示重新載入或「環境已就緒」訊息

---

## 情境 7：Windows `pio.exe` 無法執行

**目的**：驗證 Core 存在但 launcher 被拒絕時仍可使用

**設定步驟**：
1. 設定 `PLATFORMIO_CORE_DIR=C:\.platformio`
2. 確認 `C:\.platformio\penv\Scripts\pio.exe --version` 失敗
3. 確認 `C:\.platformio\penv\Scripts\python.exe -m platformio --version` 成功
4. 執行 Singular Blockly 的編譯、上傳與 Arduino Serial Monitor

**預期結果**：
- PlatformIO 狀態為可用，日誌記錄 `python-module` fallback
- 編譯、上傳與 Monitor 都使用相同的 Python module 啟動方式

---

## i18n 驗證

```bash
npm run validate:i18n
# 預期：所有 15 個語系驗證通過，無缺少的 key
```

---

## 單元測試執行

```bash
npm test
# 預期輸出：908+ tests passing
```
