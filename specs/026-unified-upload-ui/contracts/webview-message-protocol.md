# WebView Message Protocol: 上傳功能

**Version**: 1.0.0  
**Feature**: 026-unified-upload-ui

---

## 概述

定義 WebView 與 Extension Host 之間上傳功能的訊息協定。

---

## 1. WebView → Extension Host

### 1.1 requestUpload

請求執行上傳操作。

**Message Schema**:

```json
{
  "command": "requestUpload",
  "code": "string (required)",
  "board": "string (required)",
  "port": "string (optional)",
  "lib_deps": ["string"] (optional),
  "build_flags": ["string"] (optional),
  "lib_ldf_mode": "string (optional)"
}
```

**Example - Arduino 板子**:

```json
{
	"command": "requestUpload",
	"code": "#include <Arduino.h>\nvoid setup() {}\nvoid loop() {}",
	"board": "esp32",
	"lib_deps": ["madhephaestus/ESP32Servo@^3.0.6"],
	"build_flags": ["-DCONFIG_FREERTOS_HZ=1000"]
}
```

**Example - CyberBrick 板子**:

```json
{
	"command": "requestUpload",
	"code": "from machine import Pin\nled = Pin(2, Pin.OUT)",
	"board": "cyberbrick"
}
```

---

## 2. Extension Host → WebView

### 2.1 uploadProgress

回報上傳進度。

**Message Schema**:

```json
{
	"command": "uploadProgress",
	"stage": "string (required)",
	"progress": "number (0-100, required)",
	"message": "string (required)",
	"error": "string (optional)"
}
```

**Stage Values (Arduino)**:

-   `syncing`: 同步 platformio.ini 設定
-   `saving`: 儲存工作區
-   `checking_pio`: 檢查 PlatformIO CLI
-   `detecting`: 偵測連接的板子
-   `compiling`: 編譯中
-   `uploading`: 上傳中

**Stage Values (MicroPython)**:

-   `preparing`: 準備中
-   `checking_tool`: 檢查 mpremote
-   `installing_tool`: 安裝 mpremote
-   `connecting`: 連接裝置
-   `resetting`: 重置裝置
-   `uploading`: 上傳中
-   `restarting`: 重啟裝置

**Example - 編譯進度**:

```json
{
	"command": "uploadProgress",
	"stage": "compiling",
	"progress": 60,
	"message": "Compiling..."
}
```

### 2.2 uploadResult

回報上傳結果。

**Message Schema**:

```json
{
	"command": "uploadResult",
	"success": "boolean (required)",
	"timestamp": "string ISO-8601 (required)",
	"port": "string (required)",
	"duration": "number milliseconds (required)",
	"mode": "'compile-only' | 'upload' (optional, Arduino only)",
	"error": {
		"stage": "string (optional)",
		"message": "string (optional)",
		"details": "string (optional)"
	}
}
```

**Example - 編譯成功（無板子連接）**:

```json
{
	"command": "uploadResult",
	"success": true,
	"timestamp": "2026-01-03T10:30:00.000Z",
	"port": "none",
	"duration": 15000,
	"mode": "compile-only"
}
```

**Example - 上傳成功**:

```json
{
	"command": "uploadResult",
	"success": true,
	"timestamp": "2026-01-03T10:30:00.000Z",
	"port": "COM3",
	"duration": 25000,
	"mode": "upload"
}
```

**Example - 編譯失敗**:

```json
{
	"command": "uploadResult",
	"success": false,
	"timestamp": "2026-01-03T10:30:00.000Z",
	"port": "none",
	"duration": 5000,
	"error": {
		"stage": "compiling",
		"message": "Compilation failed",
		"details": "error: 'ledPin' was not declared in this scope"
	}
}
```

---

## 3. 訊息流程圖

### 3.1 Arduino 編譯/上傳流程

```
WebView                          Extension Host
   │                                   │
   │ ── requestUpload ───────────────► │
   │    {board: "esp32", code: "..."}  │
   │                                   │
   │ ◄── uploadProgress ────────────── │
   │    {stage: "syncing", progress: 5}│
   │                                   │
   │ ◄── uploadProgress ────────────── │
   │    {stage: "saving", progress: 15}│
   │                                   │
   │ ◄── uploadProgress ────────────── │
   │    {stage: "checking_pio", p: 25} │
   │                                   │
   │ ◄── uploadProgress ────────────── │
   │    {stage: "detecting", p: 35}    │
   │                                   │
   │ ◄── uploadProgress ────────────── │
   │    {stage: "compiling", p: 50}    │
   │                                   │
   │    [若偵測到板子]                  │
   │ ◄── uploadProgress ────────────── │
   │    {stage: "uploading", p: 80}    │
   │                                   │
   │ ◄── uploadResult ─────────────── │
   │    {success: true, mode: "upload"}│
   │                                   │
```

### 3.2 Arduino 僅編譯流程（無板子）

```
WebView                          Extension Host
   │                                   │
   │ ── requestUpload ───────────────► │
   │    {board: "uno", code: "..."}    │
   │                                   │
   │ ◄── uploadProgress (syncing) ──── │
   │ ◄── uploadProgress (saving) ───── │
   │ ◄── uploadProgress (checking) ─── │
   │ ◄── uploadProgress (detecting) ── │
   │    [未偵測到板子，切換為僅編譯]    │
   │ ◄── uploadProgress (compiling) ── │
   │                                   │
   │ ◄── uploadResult ─────────────── │
   │    {success: true,                │
   │     mode: "compile-only"}         │
   │                                   │
```

---

## 4. 錯誤碼

| 錯誤碼            | 階段         | 說明                  |
| ----------------- | ------------ | --------------------- |
| PIO_NOT_FOUND     | checking_pio | PlatformIO CLI 未安裝 |
| NO_WORKSPACE      | syncing      | 工作區未開啟          |
| COMPILE_ERROR     | compiling    | 編譯錯誤              |
| UPLOAD_ERROR      | uploading    | 上傳錯誤              |
| TIMEOUT           | any          | 操作逾時              |
| DEVICE_DISCONNECT | uploading    | 裝置連線中斷          |

---

## 5. 相容性

-   本協定向後相容 MicroPython 上傳訊息格式
-   Arduino 特有欄位（如 `mode`）為可選，不影響現有功能
-   所有新增階段名稱不與現有 MicroPython 階段衝突
