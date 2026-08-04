# 資料模型：VSCodium / Open VSX 支援與引導安裝

## 新增型別

### `PenvProviderServiceDeps`

`PenvProviderService` 的依賴注入介面，使所有 VS Code API 呼叫可在測試中替換。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `getExtension` | `(id: string) => { id: string } \| undefined` | 對應 `vscode.extensions.getExtension` |
| `executeCommand` | `(cmd: string, ...args: unknown[]) => Thenable<unknown>` | 對應 `vscode.commands.executeCommand` |
| `showInformationMessage` | `(msg: string, ...items: string[]) => Thenable<string \| undefined>` | 對應 `vscode.window.showInformationMessage` |
| `getMsg` | `(key: string, fallback: string) => Promise<string>` (**可選**) | i18n 訊息查找；由 `localeService.getLocalizedMessage` 提供，未傳入時退回英文 fallback |

---

### `ProviderInstallResult`

provider 安裝動作的明確結果，避免安裝失敗後仍進入 reload / ready 路徑。

```
ProviderInstallResult
├── { status: 'installed', providerId }
└── { status: 'manual-required' }
```

### `PlatformioInvocation`

已通過 `--version` 驗證、可供後續流程重複使用的 PlatformIO 啟動描述。

| 欄位 | 說明 |
|------|------|
| `command` | 實際執行檔，例如 `pio.exe` 或 penv 的 `python.exe` |
| `prefixArgs` | 固定前綴；Python fallback 為 `['-m', 'platformio']` |
| `mode` | `direct` 或 `python-module` |
| `source` | customPATH、`PLATFORMIO_CORE_DIR`、系統磁碟、預設 Core 或 PATH |

---

### 既有型別（無變更）

以下型別已存在，本功能不修改：

- `UploadStage`、`UploadProgress`、`UploadResult`（`micropythonUploader.ts`）
- `MpremoteAvailabilityResult`（`micropythonUploader.ts`）

## 狀態轉移

```
偵測 provider extension
  ├── 未安裝
  │     └── VS Code 安裝確認
  │           ├── 安裝成功 → 顯示 reload（只代表 provider 已安裝）
  │           └── 安裝失敗 → [manual-required] → 開啟 Extensions 面板
  │
  └── 已安裝
        └── 實際執行所有可信候選的 `--version`
              ├── direct 成功 → direct invocation
              ├── direct 失敗、python module 成功 → python-module invocation
              └── 全部失敗 → unavailable + 明確診斷
```

provider 安裝狀態與 Core 可執行狀態刻意分開，不再以 Python 檔案存在推導「環境已就緒」。

## i18n Key 設計

新增至 `media/locales/*/messages.js`（全部 15 個語系）：

| Key | 說明 | 範例（繁體中文）|
|-----|------|----------------|
| `PENV_PROVIDER_NOT_INSTALLED` | 通知主訊息 | `PlatformIO 環境尚未設定。點擊安裝以啟用上傳功能。` |
| `PENV_PROVIDER_INSTALL_BUTTON` | 安裝按鈕文字 | `安裝擴充功能環境` |
| `PENV_PROVIDER_INSTALL_FAILED` | 兩者均安裝失敗 | `自動安裝失敗。請在擴充功能市集搜尋 PlatformIO IDE 或 pioarduino 並手動安裝。` |
| `PENV_PROVIDER_PENDING` | 已安裝但 penv 初始化中 | `PlatformIO 環境初始化中，請稍候再試。` |
