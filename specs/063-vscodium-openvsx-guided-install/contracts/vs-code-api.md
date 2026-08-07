# VS Code API 合約

本文件記錄本功能使用的 VS Code API 介面及其在 Open VSX 環境的預期行為。

---

## `vscode.extensions.getExtension(id)`

**用途**：偵測 penv provider 是否已安裝。

```typescript
vscode.extensions.getExtension('platformio.platformio-ide')
// 已安裝 → { id: 'platformio.platformio-ide', ... }
// 未安裝 → undefined
```

**跨平台行為**：
- VS Code Marketplace：可偵測到 `platformio.platformio-ide`
- Open VSX（VSCodium 等）：只能偵測到已安裝的 extension，若 pioarduino 已安裝則回傳其物件

**測試替換**：透過 `PenvProviderServiceDeps.getExtension` 注入，測試中可直接替換回傳值。

---

## `workbench.extensions.installExtension`

**用途**：背景自動安裝 penv provider。

```typescript
await vscode.commands.executeCommand(
  'workbench.extensions.installExtension',
  'platformio.platformio-ide'
);
```

**參數**：extension ID 字串（`publisher.name` 格式）

**回傳**：`Thenable<void>`（Promise）

**成功**：安裝完成後由 Singular Blockly 呼叫 `platformio-ide.showHome` 啟動 provider／Core 初始化，再顯示「Reload Now」提示。

**失敗情境**：
- Extension ID 在當前 marketplace 不存在 → **rejected Promise**（實作時需以單元測試確認錯誤型別）
- 無網路連線 → rejected Promise

**fallback 策略**：

```typescript
try {
  await executeCommand('workbench.extensions.installExtension', 'platformio.platformio-ide');
  return { status: 'installed', providerId: 'platformio.platformio-ide' };
} catch {
  try {
    await executeCommand('workbench.extensions.installExtension', 'pioarduino.pioarduino-ide');
    return { status: 'installed', providerId: 'pioarduino.pioarduino-ide' };
  } catch {
    // 兩者均失敗：開啟 Extensions 面板
    await executeCommand('workbench.extensions.search', 'platformio');
    showInformationMessage(/* PENV_PROVIDER_INSTALL_FAILED */);
    return { status: 'manual-required' };
  }
}
```

---

## `workbench.extensions.search`

**用途**：失敗 fallback，開啟 Extensions 面板讓使用者手動選擇。

```typescript
await vscode.commands.executeCommand('workbench.extensions.search', 'platformio');
```

**跨平台行為**：
- VS Code：Extensions 面板顯示 PlatformIO IDE 為第一結果
- VSCodium：Extensions 面板顯示 pioarduino 為第一結果（Open VSX 搜尋結果）

**優點**：不需要平台偵測，兩個平台都能自然顯示適合的 extension。

---

## `platformio-ide.showHome`

**用途**：provider 安裝成功後開啟 PlatformIO Home，並透過 contributed command 啟動 PlatformIO IDE 或 pioarduino extension，使其進入 Core 初始化流程。

```typescript
try {
  await executeCommand('platformio-ide.showHome');
} catch {
  log('[PenvProviderService] Failed to open PlatformIO Home; continuing with reload prompt', 'warn');
}
```

**呼叫時機**：僅限本次 `installExtension` 剛回傳成功；若積木編輯器開啟時 provider 已存在，不自動開啟 Home。

**並行約束**：同一個 `WebViewManager` 在 provider setup settle 前保存 in-flight Promise；重複開啟積木編輯器不得再次呼叫安裝、Home 或 reload。settle 後清除狀態，下一次操作重新執行 provider 偵測。

**跨 provider 行為**：`platformio.platformio-ide` 與 `pioarduino.pioarduino-ide` 共用相同命令 ID，不需要依 provider 分支命令。

**失敗處理**：Home rejected 不改變已成功的 provider 安裝結果、不觸發另一個 provider fallback，也不記錄第三方例外內容；流程繼續顯示既有 reload 提示。

---

## `vscode.window.showInformationMessage`

**用途**：只顯示安裝失敗說明或安裝成功後的重新載入提示；不作為安裝前確認。

```typescript
const selected = await vscode.window.showInformationMessage(reloadMessage, reloadButton);
if (selected === reloadButton) {
  await vscode.commands.executeCommand('workbench.action.reloadWindow');
}
```

**行為**：provider 缺失時直接執行 `installExtension`，不先顯示自訂確認按鈕。安裝成功時等待 Home 命令完成或失敗隔離後才顯示 reload；兩個 provider 都失敗時則顯示不含按鈕的手動安裝說明。

---

## 重新載入處理

只有安裝指令成功後，擴充功能才呼叫 PlatformIO Home 並顯示「Reload Now」提示；使用者選擇後可呼叫 `workbench.action.reloadWindow`。兩個 provider 均失敗時不得進入 Home 或 reload 路徑。

Home 命令會啟動 PlatformIO IDE / pioarduino 並進入其 Core installer；重新載入提示仍作為後續完成設定的保底，無需使用者手動執行 build。

重新載入提示只代表 provider 已安裝，**不代表 PlatformIO Core 已可用**。Core 狀態由實際 `--version` 探測決定。
