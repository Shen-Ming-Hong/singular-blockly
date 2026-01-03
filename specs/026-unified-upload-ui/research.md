# Research: 統一 Arduino C++ 與 MicroPython 上傳 UI

**Feature**: 026-unified-upload-ui  
**Date**: 2026-01-03

## 研究摘要

本研究文件彙整統一上傳 UI 功能的技術調研結果，解決規劃階段標記為「NEEDS CLARIFICATION」的問題。

---

## R1: PlatformIO CLI 執行路徑與指令

### 決策

使用 PlatformIO CLI 的預設安裝路徑執行編譯與上傳：

-   **Windows**: `%USERPROFILE%\.platformio\penv\Scripts\pio.exe`
-   **macOS/Linux**: `~/.platformio/penv/bin/pio`

### 理由

1. PlatformIO IDE 擴充功能會自動安裝 CLI 到預設位置
2. 無需使用者額外設定環境變數
3. 與現有 MicropythonUploader 的 Python 路徑取得方式一致

### 相關指令

```bash
# 僅編譯（無板子連接時）
pio run --project-dir "<workspace>"

# 編譯並上傳（有板子連接時）
pio run --target upload --project-dir "<workspace>"

# 自動偵測連接埠
pio device list --json
```

### 替代方案考量

-   ❌ 使用 `which pio` 查找：跨平台相容性差
-   ❌ 要求使用者設定 PATH：增加使用者門檻
-   ✅ 使用固定路徑：與專案現有模式一致

---

## R2: 板子連接偵測機制

### 決策

使用 PlatformIO 的 `device list` 指令搭配 `--json` 參數偵測連接的 Arduino 裝置。

### 理由

1. PlatformIO 已有成熟的裝置偵測機制
2. JSON 輸出便於程式解析
3. 無需自行實作 USB VID/PID 查詢

### 偵測流程

```typescript
// 1. 取得裝置列表
const result = await exec(`"${pioPath}" device list --json`);
const devices = JSON.parse(result.stdout);

// 2. 過濾有效的 Arduino 裝置
const arduinoDevices = devices.filter(d => d.description && !d.description.includes('Bluetooth'));

// 3. 決定上傳模式
if (arduinoDevices.length > 0) {
	// 完整上傳模式
	await exec(`"${pioPath}" run --target upload`);
} else {
	// 僅編譯模式
	await exec(`"${pioPath}" run`);
}
```

### 替代方案考量

-   ❌ 使用 serialport npm 套件：需額外依賴，體積增加
-   ❌ 直接列舉 COM 埠：無法識別裝置類型
-   ✅ 使用 PlatformIO device list：原生整合，無額外依賴

---

## R3: 上傳階段定義（Arduino 模式）

### 決策

為 Arduino 模式定義獨立的上傳階段，與 MicroPython 模式區分：

```typescript
type ArduinoUploadStage =
	| 'syncing' // 同步 platformio.ini 設定
	| 'saving' // 儲存工作區 (main.cpp)
	| 'checking_pio' // 檢查 PlatformIO CLI
	| 'detecting' // 偵測連接的板子
	| 'compiling' // 編譯中
	| 'uploading' // 上傳中（僅有板子時）
	| 'completed' // 完成
	| 'failed'; // 失敗
```

### 理由

1. 階段名稱反映 Arduino 工作流程的實際步驟
2. 便於在 Toast 訊息中顯示對應的階段文字
3. 與 MicroPython 階段（preparing, checking_tool, connecting 等）明確區分

### Toast 訊息對應

| 階段             | Toast 訊息（繁中） | Toast 訊息（英文）   |
| ---------------- | ------------------ | -------------------- |
| syncing          | 同步設定...        | Syncing settings...  |
| saving           | 儲存工作區...      | Saving workspace...  |
| checking_pio     | 檢查編譯工具...    | Checking compiler... |
| detecting        | 偵測開發板...      | Detecting board...   |
| compiling        | 編譯中...          | Compiling...         |
| uploading        | 上傳中...          | Uploading...         |
| completed (編譯) | 編譯成功           | Compile successful   |
| completed (上傳) | 上傳成功           | Upload successful    |

---

## R4: 服務層架構設計

### 決策

新增 `ArduinoUploader` 服務類別，與現有 `MicropythonUploader` 平行：

```
src/services/
├── micropythonUploader.ts  # 現有 - 處理 CyberBrick 上傳
├── arduinoUploader.ts      # 新增 - 處理 Arduino C++ 編譯/上傳
└── uploadService.ts        # 新增 - 統一介面，根據板子類型路由
```

### 理由

1. **單一職責**：每個 Uploader 專注於特定平台
2. **可測試性**：可獨立測試各 Uploader 的邏輯
3. **開放封閉**：未來支援新平台時只需新增 Uploader

### 介面設計

```typescript
// 統一的上傳介面
interface IUploader {
  upload(request: UploadRequest, onProgress?: ProgressCallback): Promise<UploadResult>;
}

// 統一的上傳服務
class UploadService {
  private uploaders: Map<string, IUploader>;

  async upload(board: string, ...): Promise<UploadResult> {
    const uploader = this.getUploader(board);
    return uploader.upload(...);
  }

  private getUploader(board: string): IUploader {
    if (board === 'cyberbrick') {
      return this.uploaders.get('micropython');
    }
    return this.uploaders.get('arduino');
  }
}
```

---

## R5: WebView UI 修改策略

### 決策

統一上傳按鈕圖示，透過以下方式區分模式：

1. **按鈕顯示**：所有板子都顯示上傳按鈕（移除 `display: none` 條件）
2. **Tooltip 文字**：根據板子語言類型動態更新
3. **Toast 訊息**：區分「編譯成功」與「上傳成功」

### 理由

1. 提供一致的使用者介面
2. 降低學習曲線
3. 減少 UI 元素的動態顯示/隱藏邏輯

### UI 變更清單

| 元素               | 現狀                      | 變更後                                                         |
| ------------------ | ------------------------- | -------------------------------------------------------------- |
| uploadContainer    | 僅 CyberBrick 顯示        | 所有板子顯示                                                   |
| uploadButton title | 固定「上傳到 CyberBrick」 | 動態：Arduino→「編譯並上傳」/ CyberBrick→「上傳至 CyberBrick」 |
| Toast 成功訊息     | 固定「上傳成功」          | 動態：「編譯成功」/「上傳成功」                                |

### 新增 i18n 鍵名

```javascript
// Arduino 模式專用
UPLOAD_BUTTON_TITLE_ARDUINO: '編譯並上傳',
ARDUINO_STAGE_SYNCING: '同步設定',
ARDUINO_STAGE_SAVING: '儲存工作區',
ARDUINO_STAGE_CHECKING: '檢查編譯工具',
ARDUINO_STAGE_DETECTING: '偵測開發板',
ARDUINO_STAGE_COMPILING: '編譯中',
ARDUINO_STAGE_UPLOADING: '上傳中',
ARDUINO_COMPILE_SUCCESS: '編譯成功',
ARDUINO_UPLOAD_SUCCESS: '上傳成功',

// 錯誤訊息
ERROR_ARDUINO_PIO_NOT_FOUND: '找不到 PlatformIO CLI，請先安裝 PlatformIO',
ERROR_ARDUINO_COMPILE_FAILED: '編譯失敗',
ERROR_ARDUINO_UPLOAD_FAILED: '上傳失敗',
ERROR_ARDUINO_NO_WORKSPACE: '請先開啟專案資料夾',
```

---

## R6: 錯誤處理策略

### 決策

提供分層的錯誤處理機制：

1. **前置檢查**：在執行前驗證環境（PlatformIO 安裝、工作區存在）
2. **執行時錯誤**：捕獲 CLI 輸出的錯誤訊息
3. **使用者友善訊息**：將技術錯誤轉換為可理解的提示

### 錯誤分類與處理

| 錯誤類型          | 偵測方式              | 使用者訊息                | 建議動作            |
| ----------------- | --------------------- | ------------------------- | ------------------- |
| PlatformIO 未安裝 | 路徑不存在            | 找不到編譯工具            | 提示安裝 PlatformIO |
| 工作區未開啟      | workspaceFolders 為空 | 請先開啟專案資料夾        | 顯示開啟資料夾按鈕  |
| 編譯錯誤          | CLI exit code ≠ 0     | 編譯失敗：{error summary} | 顯示錯誤摘要        |
| 上傳逾時          | 執行時間 > 90s        | 上傳逾時                  | 建議檢查連線        |
| 板子斷線          | CLI 錯誤輸出含 "port" | 裝置連線中斷              | 建議重新連接        |

### CLI 錯誤解析範例

```typescript
function parseCompileError(stderr: string): string {
	// 提取 PlatformIO 錯誤摘要
	const errorMatch = stderr.match(/error: (.+)/i);
	if (errorMatch) {
		return errorMatch[1].slice(0, 100); // 截取前 100 字元
	}
	return '未知編譯錯誤';
}
```

---

## R7: 現有架構整合點

### 與 messageHandler.ts 的整合

現有的 `handleRequestUpload` 僅處理 CyberBrick，需擴展：

```typescript
private async handleRequestUpload(message: UploadRequest): Promise<void> {
  const board = message.board;

  if (board === 'cyberbrick') {
    // 現有 MicroPython 流程
    const uploader = new MicropythonUploader(workspaceRoot);
    // ...
  } else {
    // 新增 Arduino 流程
    const uploader = new ArduinoUploader(workspaceRoot);
    // ...
  }
}
```

### 與 settingsManager.ts 的整合

Arduino 上傳前需同步 platformio.ini：

```typescript
// 上傳流程中呼叫
await this.settingsManager.syncPlatformIOSettings(libDeps, buildFlags, libLdfMode);
```

### 與 blocklyEdit.js 的整合

修改 `updateUIForBoard` 函式：

```javascript
function updateUIForBoard(boardId, isCyberBrick) {
	const uploadContainer = document.getElementById('uploadContainer');

	// 變更：所有板子都顯示上傳按鈕
	if (uploadContainer) {
		uploadContainer.style.display = 'block'; // 不再隱藏
	}

	// 更新 tooltip
	if (uploadButton && window.languageManager) {
		const titleKey = isCyberBrick ? 'UPLOAD_BUTTON_TITLE' : 'UPLOAD_BUTTON_TITLE_ARDUINO';
		uploadButton.title = window.languageManager.getMessage(titleKey, 'Upload');
	}

	// ...其餘邏輯
}
```

---

## 結論

基於以上研究，本功能的技術實現路徑已明確：

1. **新增 ArduinoUploader 服務**：處理 PlatformIO CLI 操作
2. **擴展 messageHandler**：路由上傳請求到對應服務
3. **修改 WebView UI**：統一按鈕顯示，動態更新文字
4. **新增 i18n 鍵名**：支援 15 種語系的上傳訊息

所有 NEEDS CLARIFICATION 項目已解決，可進入 Phase 1 設計階段。
