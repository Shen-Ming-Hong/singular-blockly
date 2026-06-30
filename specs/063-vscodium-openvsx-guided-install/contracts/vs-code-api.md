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

**成功**：安裝完成，VS Code 自動顯示「Reload Required」提示。

**失敗情境**：
- Extension ID 在當前 marketplace 不存在 → **rejected Promise**（實作時需以單元測試確認錯誤型別）
- 無網路連線 → rejected Promise

**fallback 策略**：

```typescript
try {
  await executeCommand('workbench.extensions.installExtension', 'platformio.platformio-ide');
} catch {
  try {
    await executeCommand('workbench.extensions.installExtension', 'pioarduino.pioarduino-ide');
  } catch {
    // 兩者均失敗：開啟 Extensions 面板
    await executeCommand('workbench.extensions.search', 'platformio');
    showInformationMessage(/* PENV_PROVIDER_INSTALL_FAILED */);
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

## `vscode.window.showInformationMessage`

**用途**：顯示非阻擋式通知。

```typescript
const selected = await vscode.window.showInformationMessage(
  message,    // 通知主訊息（使用 i18n key 翻譯後的字串）
  buttonText  // 「安裝擴充功能環境」按鈕
);
// selected === buttonText → 使用者點擊按鈕
// selected === undefined  → 使用者 dismiss
```

**行為**：非 modal，使用者可繼續操作 Blockly 同時看到通知。

---

## 重新載入處理

安裝完成後，VS Code 框架**自動**顯示「Reload Required」提示，本擴充功能無需額外實作。

重新載入後 PlatformIO IDE / pioarduino 啟動，自動執行 `get-platformio.py` 建立 `~/.platformio/penv/`，無需使用者手動操作。
