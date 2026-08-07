# 驗證快速指南：VSCodium / Open VSX 支援與引導安裝

## 前置條件

- Node.js 22.16.0+
- `npm install` 完成
- Git branch：`063-vscodium-openvsx-guided-install`

## 情境 1：VS Code 初次設定（任一板子）

**目的**：驗證積木編輯器開啟時維持原有共同 PlatformIO 前置

**設定步驟**：
1. 確認 PlatformIO IDE 和 pioarduino 均未安裝
2. 開啟任一 Singular Blockly 工作區

**執行**：開啟積木編輯器

**預期結果**：
- 不顯示 Singular Blockly 自訂的安裝前確認按鈕
- 直接啟動 PlatformIO provider 安裝
- provider 安裝成功後自動開啟 PlatformIO Home，開始 Core 初始化
- Home 命令完成或失敗隔離後，顯示既有 Reload Required 提示
- Blockly 編輯器仍可正常操作

**驗證指令**：
```bash
npm run compile-tests
npm run lint
```

---

## 情境 2：直接安裝（VS Code Marketplace）

**目的**：驗證 platformio.platformio-ide 自動安裝

**前置**：同情境 1

**執行**：開啟積木編輯器

**預期結果**：
- PlatformIO IDE 開始安裝（Extensions 面板顯示安裝進度）
- 安裝完成後自動執行 `platformio-ide.showHome`
- PlatformIO Home／Core installer 開始初始化環境
- Home 命令完成或失敗隔離後，Singular Blockly 顯示「Reload Required」

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
- 不顯示 Singular Blockly 自訂的安裝前確認按鈕
- 嘗試安裝 `platformio.platformio-ide` 失敗（Open VSX 無此 extension）
- 自動 fallback 安裝 `pioarduino.pioarduino-ide`
- pioarduino 安裝成功後自動執行相同的 `platformio-ide.showHome` 命令
- pioarduino Home／Core 初始化流程啟動，之後顯示 Reload Required

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

**預期結果**：開啟積木編輯器後仍直接觸發 PlatformIO provider 安裝

---

## 情境 5：現有使用者不受影響

**目的**：迴歸驗證

**設定步驟**：確認 PlatformIO IDE 已安裝

**預期結果**：
- 不重複觸發 provider 安裝
- 所有現有上傳功能正常運作
- `npm test` 全數通過

---

## 情境 6：兩個 extension 均安裝失敗

**目的**：驗證失敗 fallback 開啟 Extensions 面板

**設定步驟**（單元測試中驗證，不需手動測試）：
- mock `executeCommand` 的 `installExtension` 呼叫均 reject
- 驗證 `workbench.extensions.search` 被呼叫且參數為 `'platformio'`
- 驗證顯示 `PENV_PROVIDER_INSTALL_FAILED` 訊息
- 驗證不呼叫 `platformio-ide.showHome`
- 驗證不顯示重新載入或「環境已就緒」訊息

---

## 情境 7：Home 命令失敗

**目的**：驗證 provider 已安裝但 Home contributed command rejected 時的錯誤隔離

**設定步驟**（單元測試中驗證）：
- mock provider `installExtension` 成功
- mock `platformio-ide.showHome` reject
- mock 使用者選擇 Reload Now

**預期結果**：
- 不重新嘗試安裝官方 provider 或 pioarduino
- 記錄不含第三方例外細節的警告
- 仍顯示既有 Reload Required，確認後呼叫 `workbench.action.reloadWindow`

---

## 情境 8：安裝期間重複開啟積木編輯器

**目的**：驗證並行觸發共用同一條 provider setup

**設定步驟**（單元測試中驗證）：
- 保持第一個 `installExtension` Promise pending
- 連續觸發兩次 provider setup
- 完成第一條流程後再次觸發一次

**預期結果**：
- pending 期間只呼叫一次 `installExtension`、Home 與 reload
- setup settle 後清除 in-flight 狀態，後續操作可重新偵測與重試

---

## 情境 9：Windows `pio.exe` 無法執行

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
npm run compile-tests
npx vscode-test --label unit \
  --run out/test/penvProviderService.test.js \
  --run out/test/services/micropythonUploaderAvailability.test.js
# 預期：17 passing

# provider setup 與並行回歸測試（使用可用的 VS Code／VSCodium test host）
npx vscode-test --label unit \
  --run out/test/penvProviderService.test.js \
  --run out/test/webviewManager.test.js
# 預期：45 passing

npm test
# 目前完整基線：984 passing、1 pending，另有 1 個與本功能無關且已記錄的 OTA bootstrap 既有失敗
```
