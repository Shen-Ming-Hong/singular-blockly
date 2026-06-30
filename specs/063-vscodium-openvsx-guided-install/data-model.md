# 資料模型：VSCodium / Open VSX 支援與引導安裝

## 新增型別

### `PenvProviderStatus`

provider extension 安裝狀態與 penv 就緒狀態的組合。

```
PenvProviderStatus
├── 'not-installed'     provider extension 未安裝
├── 'installed-ready'   provider 已安裝，penv 路徑存在且可執行
└── 'installed-pending' provider 已安裝，但 penv 尚未完成初始化
```

**使用者**：`PenvProviderService`、`arduinoUploader`、`micropythonUploader`

---

### `PenvProviderServiceDeps`

`PenvProviderService` 的依賴注入介面，使所有 VS Code API 呼叫可在測試中替換。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `getExtension` | `(id: string) => { id: string } \| undefined` | 對應 `vscode.extensions.getExtension` |
| `executeCommand` | `(cmd: string, ...args: unknown[]) => Thenable<unknown>` | 對應 `vscode.commands.executeCommand` |
| `showInformationMessage` | `(msg: string, ...items: string[]) => Thenable<string \| undefined>` | 對應 `vscode.window.showInformationMessage` |
| `checkPenvExists` | `() => boolean` | 檢查 `~/.platformio/penv/` 路徑是否存在 |
| `getMsg` | `(key: string, fallback: string) => Promise<string>` (**可選**) | i18n 訊息查找；由 `localeService.getLocalizedMessage` 提供，未傳入時退回英文 fallback |

---

### 既有型別（無變更）

以下型別已存在，本功能不修改：

- `UploadStage`、`UploadProgress`、`UploadResult`（`micropythonUploader.ts`）
- `MpremoteAvailabilityResult`（`micropythonUploader.ts`）

## 狀態轉移

```
初始狀態
  │
  ▼
偵測 provider extension
  ├── 未安裝 → [not-installed]
  │     └── 使用者點擊安裝按鈕
  │           ├── 安裝成功 → VS Code reload → [installed-pending]
  │           └── 安裝失敗 → 開啟 Extensions 面板 → 使用者手動安裝
  │
  └── 已安裝 → 偵測 penv 路徑
        ├── 路徑存在 → [installed-ready] ← 正常上傳流程
        └── 路徑不存在（初始化中）→ [installed-pending]
              └── 重試（最多 3 次，間隔 3 秒）
                    ├── 路徑出現 → [installed-ready]
                    └── 仍不存在 → 顯示「環境初始化中，請稍候再試」
```

## i18n Key 設計

新增至 `media/locales/*/messages.js`（全部 15 個語系）：

| Key | 說明 | 範例（繁體中文）|
|-----|------|----------------|
| `PENV_PROVIDER_NOT_INSTALLED` | 通知主訊息 | `PlatformIO 環境尚未設定。點擊安裝以啟用上傳功能。` |
| `PENV_PROVIDER_INSTALL_BUTTON` | 安裝按鈕文字 | `安裝擴充功能環境` |
| `PENV_PROVIDER_INSTALL_FAILED` | 兩者均安裝失敗 | `自動安裝失敗。請在擴充功能市集搜尋 PlatformIO IDE 或 pioarduino 並手動安裝。` |
| `PENV_PROVIDER_PENDING` | 已安裝但 penv 初始化中 | `PlatformIO 環境初始化中，請稍候再試。` |
