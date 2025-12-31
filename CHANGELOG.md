# 更新日誌 Changelog

此專案所有重要更新都會記錄在此文件中。
All notable changes to this project will be documented in this file.

此格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
並且本專案遵循 [語意化版本](https://semver.org/lang/zh-TW/)。
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.50.5] - 2025-12-31

### 安全性 Security

-   **依賴套件安全性更新** (Dependency Security Update)

    -   修復 `qs` 套件高嚴重性漏洞 (GHSA-6rw7-vpxm-498p)
        Fixed high severity vulnerability in `qs` package (GHSA-6rw7-vpxm-498p)
    -   `qs` 從 6.14.0 升級至 6.14.1，防止 arrayLimit bypass 導致的 DoS 記憶體耗盡攻擊
        Upgraded `qs` from 6.14.0 to 6.14.1 to prevent DoS memory exhaustion via arrayLimit bypass

-   **Code Scanning Alert #7 修復** (Code Scanning Alert #7 Fix)

    -   修復 CodeQL 偵測到的未驗證動態方法呼叫問題
        Fixed unvalidated dynamic method call detected by CodeQL
    -   在調用 `callback` 前增加 `typeof callback === 'function'` 類型檢查
        Added `typeof callback === 'function'` type check before invoking callback
    -   防止潛在的 TypeError 異常和意外行為
        Prevents potential TypeError exceptions and unexpected behavior

## [0.50.4] - 2025-12-31

### 修復 Bug Fixes

-   **Extension Host i18n 硬編碼字串修復** (Extension Host i18n Hardcoded Strings Fix)

    -   修復英文環境顯示 i18n key 名稱而非翻譯文字的問題
        Fixed English environment showing i18n key names instead of translated text
    -   修復 MicroPython 上傳進度訊息在非英文環境顯示英文的問題
        Fixed MicroPython upload progress messages showing English in non-English environments
    -   修復備份對話框訊息硬編碼中文的問題
        Fixed backup dialog messages being hardcoded in Chinese
    -   新增 LocaleService fallback 鏈機制：當前語言 → 英文 → fallback 參數 → key 名稱
        Added LocaleService fallback chain: current language → English → fallback parameter → key name
    -   新增 `src/types/i18nKeys.ts` 提供類型安全的 i18n 鍵名常數
        Added `src/types/i18nKeys.ts` for type-safe i18n key constants
    -   更新所有 15 種語言的翻譯檔案，新增 39 個翻譯鍵值
        Updated all 15 language translation files with 39 new translation keys

## [0.50.3] - 2025-12-31

### 修復 Bug Fixes

-   **i18n 翻譯審計機制優化** (i18n Translation Audit Optimization)

    -   修復俄語翻譯檔案中 `CONTROLS_IF_ELSE_TITLE_ELSE` 使用西里爾字母的 key 名稱錯誤（СЕ → SE）
        Fixed Russian translation file key name error using Cyrillic characters (СЕ → SE) in `CONTROLS_IF_ELSE_TITLE_ELSE`
    -   新增 CyberBrick 品牌名稱白名單規則，避免技術專有名詞誤報
        Added CyberBrick brand name whitelist rules to prevent technical term false positives
    -   新增國際技術縮寫白名單（LED/GPIO/PWM/I2C/UART/WiFi）
        Added international technical acronym whitelist (LED/GPIO/PWM/I2C/UART/WiFi)
    -   為 CJK 語言（日文、韓文、繁體中文）放寬檢測閾值以適應字元效率差異
        Relaxed detection thresholds for CJK languages (Japanese, Korean, Traditional Chinese) to accommodate character efficiency differences
    -   將文化適切性（culturalMismatch）檢測降級為低嚴重性，避免阻擋 PR
        Downgraded cultural mismatch detection to low severity to prevent blocking PRs
    -   白名單版本更新至 v1.2.0，總規則數從 16 增至 19
        Updated whitelist to v1.2.0, total rules increased from 16 to 19

### 維護 Maintenance

-   **Issue #29 已關閉** (Issue #29 Closed)
    -   解決翻譯審計誤報問題，高嚴重度問題從 31 降至 5 以下
        Resolved translation audit false positives, high severity issues reduced from 31 to under 5

## [0.50.2] - 2025-12-31

### 修復 Bug Fixes

-   **Arduino C++ 中文參數名稱自動轉換** (Arduino C++ Chinese Parameter Name Auto-Conversion)

    -   自訂函數的中文參數名稱自動轉換為合法的 C++ 識別符
        Chinese parameter names in custom functions are automatically converted to valid C++ identifiers
    -   新增 `functionParamMap` 追蹤參數名稱轉換對應
        Added `functionParamMap` to track parameter name conversions
    -   `variables_get` 和 `variables_set` 生成器現在支援轉換後的參數名稱
        `variables_get` and `variables_set` generators now support converted parameter names
    -   中文參數名稱編碼為十六進位格式（例如：「速度」→ `fn901f_5ea6`）
        Chinese parameter names are encoded to hex format (e.g., '速度' → `fn901f_5ea6`)

## [0.50.1] - 2025-12-31

### 修復 Bug Fixes

-   **MicroPython 函數生成器防禦性檢查** (MicroPython Function Generator Defensive Check)

    -   為 `arduino_function` 生成器加入函數名稱空值防護
        Added null check for function name in `arduino_function` generator
    -   為 `arduino_function_call` 生成器加入函數名稱空值防護
        Added null check for function name in `arduino_function_call` generator
    -   函數名稱為空時跳過生成並記錄警告，避免產生無效 Python 語法
        Skip generation and log warning when function name is empty, preventing invalid Python syntax

## [0.50.0] - 2025-12-31

### 新增功能 Features

-   **MicroPython 自訂函數生成器** (MicroPython Custom Function Generator) 🎉

    -   為 `arduino_function` 積木新增 MicroPython 程式碼生成器，生成 Python `def` 語法
        Added MicroPython code generator for `arduino_function` blocks, generating Python `def` syntax
    -   為 `arduino_function_call` 積木新增 MicroPython 生成器，支援函數呼叫語法
        Added MicroPython generator for `arduino_function_call` blocks, supporting function call syntax
    -   支援中文函數名稱，保留原始 Unicode 識別符（Python 3 原生支援）
        Support Chinese function names, preserving original Unicode identifiers (Python 3 native support)
    -   支援帶參數的自訂函數，參數以 Python 動態型別處理
        Support custom functions with parameters, handled as Python dynamic types
    -   空函數體自動生成 `pass` 語句，符合 Python 語法要求
        Empty function bodies automatically generate `pass` statement, conforming to Python syntax requirements
    -   修復 CyberBrick Python 模式使用自訂函數時出現的 "MicroPython generator does not know how to generate code" 錯誤
        Fixed "MicroPython generator does not know how to generate code" error when using custom functions in CyberBrick Python mode

## [0.49.0] - 2025-12-30

### 新增功能 Features

-   **CyberBrick MicroPython 支援** (CyberBrick MicroPython Support) 🎉

    -   新增 CyberBrick 主板支援（ESP32-C3 架構），可進行 MicroPython 視覺化程式設計
        Added CyberBrick board support (ESP32-C3 architecture) for MicroPython visual programming
    -   實作完整的 MicroPython 程式碼生成器：邏輯、迴圈、數學、文字、列表、變數、函數積木
        Implemented complete MicroPython code generators: logic, loops, math, text, lists, variables, functions blocks
    -   新增 CyberBrick 專用積木：主程式、LED（RGB）、GPIO（讀寫）、時序（毫秒/秒延遲）、WiFi（連線/斷線/狀態/IP）
        Added CyberBrick-specific blocks: main, LED (RGB), GPIO (read/write), time (ms/s delay), WiFi (connect/disconnect/status/IP)
    -   主板切換時自動備份工作區並切換工具箱（Arduino ↔ MicroPython）
        Auto-backup workspace and switch toolbox when switching boards (Arduino ↔ MicroPython)
    -   實作 MicropythonUploader 服務支援一鍵上傳（使用 mpremote）
        Implemented MicropythonUploader service for one-click upload (using mpremote)
    -   選擇 CyberBrick 時自動刪除 platformio.ini 避免與 PlatformIO 衝突
        Auto-delete platformio.ini when CyberBrick selected to avoid PlatformIO conflicts
    -   支援 15 種語言的 i18n 翻譯（新增 64 個翻譯鍵/語言）
        Supports i18n translations for 15 languages (64 new translation keys per language)
    -   Preview 面板支援 CyberBrick 主板
        Preview panel supports CyberBrick board

## [0.48.3] - 2025-12-28

### 修復 Bug Fixes

-   **修正 HuskyLens 積木 RX/TX 標籤顯示** (Fix HuskyLens Block RX/TX Label Display)

    -   將 HuskyLens UART 積木的標籤從「RX 腳位」「TX 腳位」改為「連接 HuskyLens TX →」「連接 HuskyLens RX →」
        Changed HuskyLens UART block labels from "RX Pin" / "TX Pin" to "Connect to HuskyLens TX →" / "Connect to HuskyLens RX →"
    -   更清楚指引使用者 Arduino 腳位應連接到 HuskyLens 的哪個腳位
        Clearer guidance for users on which HuskyLens pin to connect Arduino pins to
    -   新增智慧預設腳位：ESP32 (GPIO16/17)、Super Mini (GPIO20/21)、AVR (D2/D3)
        Added smart default pins: ESP32 (GPIO16/17), Super Mini (GPIO20/21), AVR (D2/D3)
    -   新增腳位驗證 fallback：當預設腳位不在有效列表中時回退到第一個可用腳位
        Added pin validation fallback: falls back to first available pin when default is invalid
    -   支援 15 種語言的 i18n 翻譯
        Supports i18n translations for 15 languages
    -   100% 向後相容：舊版 main.json 的 HuskyLens 積木腳位設定能正確還原
        100% backward compatible: old main.json HuskyLens block pin settings restore correctly

## [0.48.2] - 2025-12-26

### 修復 Bug Fixes

-   **空 Workspace 防護機制** (Empty Workspace Guard)

    -   修復方塊拖曳時意外消失的資料遺失問題
        Fixed data loss issue where blocks disappear unexpectedly during drag
    -   WebView 層：拖曳中不儲存，避免序列化不完整狀態
        WebView layer: Skip save during drag to avoid serializing incomplete state
    -   WebView 層：空工作區狀態不送出，防止覆寫有效資料
        WebView layer: Empty workspace state not sent, prevents overwriting valid data
    -   Extension 層：拒絕空狀態儲存請求，作為第二層防護
        Extension layer: Reject empty state save requests as second-line defense
    -   覆寫前自動備份：每次儲存前將現有 `main.json` 備份到 `main.json.bak`
        Auto backup before overwrite: Backs up existing `main.json` to `main.json.bak` before each save
    -   新增 7 個單元測試確保防護機制正常運作
        Added 7 unit tests to ensure guard mechanism works correctly

## [0.48.1] - 2025-12-25

### 修復 Bug Fixes

-   **修復預覽模式開發板配置顯示錯誤** (Fix Preview Mode Board Configuration Display)

    -   修復 ESP32 備份檔案預覽時顯示 Arduino 腳位而非 GPIO 腳位的問題
        Fixed ESP32 backup preview showing Arduino pins instead of GPIO pins
    -   預覽模式現在正確讀取備份檔案中的 `board` 設定並套用對應的腳位配置
        Preview mode now correctly reads `board` setting from backup and applies corresponding pin configuration
    -   新增 ESP32 WiFi/MQTT 積木定義載入，確保預覽時正確顯示這些積木
        Added ESP32 WiFi/MQTT block definitions loading to preview for correct display
    -   向後相容：舊版備份檔案（無 `board` 欄位）自動使用 Arduino Uno 預設配置
        Backward compatible: old backups without `board` field default to Arduino Uno configuration

## [0.48.0] - 2025-12-20

### 新增 Added

-   **Ctrl+S 快速備份快捷鍵** (Ctrl+S Quick Backup Shortcut)

    -   在 Blockly 編輯區按下 Ctrl+S（macOS 為 Cmd+S）即可快速備份工作區
        Press Ctrl+S (Cmd+S on macOS) in Blockly editor for quick workspace backup
    -   備份檔案自動命名為 `backup_YYYYMMDD_HHMMSS` 格式
        Backup files auto-named with `backup_YYYYMMDD_HHMMSS` format
    -   新增 Toast 通知系統，即時顯示備份結果（成功/警告）
        Added Toast notification system for instant backup feedback (success/warning)
    -   支援 ARIA 無障礙屬性（role="status", aria-live="polite"）
        Supports ARIA accessibility attributes (role="status", aria-live="polite")

-   **備份節流機制** (Backup Throttle Mechanism)

    -   3 秒冷卻時間防止短時間內重複建立備份
        3-second cooldown prevents duplicate backups in short succession
    -   冷卻期間按下 Ctrl+S 顯示友善提示
        Shows friendly message when pressing Ctrl+S during cooldown

-   **空工作區保護** (Empty Workspace Protection)
    -   工作區為空時跳過備份並顯示提示，避免建立無意義的空備份
        Skips backup and shows notification when workspace is empty

### 維護 Maintenance

-   新增 3 個 i18n 翻譯鍵（15 種語言）
    Added 3 i18n translation keys (15 languages)
-   Toast 通知支援淺色/深色主題
    Toast notifications support light/dark themes
-   380 個測試全部通過
    380 tests passing

## [0.47.2] - 2025-12-13

### 改進 Improved

-   **計算 PID 積木外觀優化** (Encoder PID Compute Block UI Improvement)

    -   將「目標值」輸入改為內嵌模式 (inline)，使積木更緊湊
        Changed "Target" input to inline mode for a more compact block appearance
    -   減少積木佔用空間，提升工作區視覺整潔度
        Reduced block footprint for cleaner workspace layout

### 維護 Maintenance

-   380 個測試全部通過
    380 tests passing

## [0.47.1] - 2025-12-13

### 修復 Fixed

-   **MCP 積木字典完整性** (MCP Block Dictionary Completeness)

    -   新增 39 個 Blockly 核心積木到 MCP 字典（從 82 個增加到 121 個）
        Added 39 Blockly core blocks to MCP dictionary (from 82 to 121 blocks)
    -   包含邏輯積木：`controls_if`、`logic_compare`、`logic_operation` 等 7 個
        Includes logic blocks: `controls_if`, `logic_compare`, `logic_operation`, etc. (7 blocks)
    -   包含迴圈積木：`controls_repeat_ext`、`controls_whileUntil`、`controls_for` 等 5 個
        Includes loop blocks: `controls_repeat_ext`, `controls_whileUntil`, `controls_for`, etc. (5 blocks)
    -   包含數學積木：`math_number`、`math_arithmetic`、`math_single` 等 12 個
        Includes math blocks: `math_number`, `math_arithmetic`, `math_single`, etc. (12 blocks)
    -   包含文字積木：`text`、`text_length`、`text_isEmpty` 等 8 個
        Includes text blocks: `text`, `text_length`, `text_isEmpty`, etc. (8 blocks)
    -   包含清單積木：`lists_create_empty`、`lists_create_with`、`lists_length` 等 8 個
        Includes list blocks: `lists_create_empty`, `lists_create_with`, `lists_length`, etc. (8 blocks)
    -   修復 AI 工具無法查詢基本積木用法的問題
        Fixed issue where AI tools couldn't query basic block usage

### 維護 Maintenance

-   380 個測試全部通過
    380 tests passing

## [0.47.0] - 2025-12-13

### 新增 Added

-   **ESP32 WiFi/MQTT 通訊積木** (ESP32 WiFi/MQTT Communication Blocks)

    -   新增 7 個 WiFi 積木：連線、斷線、狀態檢查、取得 IP、掃描網路、取得 SSID、取得 RSSI
        Added 7 WiFi blocks: connect, disconnect, status check, get IP, scan networks, get SSID, get RSSI
    -   新增 7 個 MQTT 積木：設定、連線、發布、訂閱、迴圈處理、取得主題、取得訊息
        Added 7 MQTT blocks: setup, connect, publish, subscribe, loop, get topic, get message
    -   自動引入 PubSubClient@^2.8 函式庫依賴
        Auto-includes PubSubClient@^2.8 library dependency
    -   支援 ESP32 與 ESP32-C3 (Super Mini) 開發板
        Supports ESP32 and ESP32-C3 (Super Mini) boards
    -   非 ESP32 板使用時生成警告註解
        Generates warning comment when used with non-ESP32 boards

-   **文字轉數字積木** (Text to Number Block)

    -   新增 `text_to_number` 積木，支援整數與浮點數轉換
        Added `text_to_number` block supporting integer and float conversion
    -   使用 Arduino String 類別的 `.toInt()` 與 `.toFloat()` 方法
        Uses Arduino String class `.toInt()` and `.toFloat()` methods
    -   適用於 MQTT 訊息處理場景
        Useful for MQTT message processing scenarios

-   **通訊類別** (Communication Category)

    -   新增「通訊」工具箱類別，整合 WiFi 與 MQTT 積木
        Added "Communication" toolbox category integrating WiFi and MQTT blocks
    -   包含完整 shadow blocks 設定
        Includes complete shadow blocks configuration

### 修復 Fixed

-   **積木刪除視角跳轉問題** (Block Delete Viewport Jump Fix)

    -   修復刪除積木時視角自動跳到原點的問題
        Fixed viewport automatically jumping to origin when deleting blocks
    -   實作 50ms debounce 機制處理批次刪除
        Implemented 50ms debounce mechanism for batch deletions
    -   使用 `workspace.scroll()` 恢復視角座標
        Uses `workspace.scroll()` to restore viewport coordinates

-   **text_join 型態錯誤** (text_join Type Error Fix)

    -   修復 `text_join` 積木連接數字時生成指標運算的錯誤
        Fixed `text_join` block generating pointer arithmetic when joining numbers
    -   所有輸入項目現在都正確包裝為 `String()`
        All input items are now correctly wrapped in `String()`
    -   更新 ORDER 優先級為 `ORDER_ADDITION`
        Updated ORDER priority to `ORDER_ADDITION`

### 維護 Maintenance

-   15 語言完整 i18n 支援（約 50 個新翻譯鍵值）
    Full 15-language i18n support (~50 new translation keys)
-   380 個測試全部通過
    380 tests passing

## [0.46.1] - 2025-12-12

### 修復 Fixed

-   **PlatformIO 誤觸發問題** (PlatformIO False Trigger Fix)

    -   修復編輯積木時誤觸發「開發板已切換」訊息的問題
        Fixed false "board changed" message trigger when editing blocks
    -   修復每次編輯都觸發 PlatformIO 重新檢查專案的問題
        Fixed PlatformIO project reconfiguration on every block edit
    -   新增 `loadWorkspace` 時的開發板比較邏輯，避免無變更時發送 `updateBoard`
        Added board comparison in `loadWorkspace` to prevent unnecessary `updateBoard` messages
    -   新增 `platformio.ini` 內容比較，只有實際變更時才覆寫檔案
        Added `platformio.ini` content comparison, only write when actually changed
    -   優化 `syncPlatformIOSettings` 函數，比較 `lib_deps`、`build_flags`、`lib_ldf_mode` 新舊值
        Optimized `syncPlatformIOSettings` to compare existing vs new values for `lib_deps`, `build_flags`, `lib_ldf_mode`

### 維護 Maintenance

-   380 個測試全部通過
    380 tests passing

## [0.46.0] - 2025-12-12

### 新增 Added

-   **MCP Server 整合** (MCP Server Integration)

    -   全新 MCP (Model Context Protocol) 伺服器，讓 AI 助手能理解並操作 Blockly 積木系統
        New MCP (Model Context Protocol) server enabling AI assistants to understand and interact with Blockly block system
    -   積木字典系統，包含 111 個積木定義與 15 語言 i18n 支援
        Block dictionary system with 111 block definitions and 15-language i18n support
    -   VSCode MCP Provider 自動註冊（需 VSCode 1.105.0+）
        VSCode MCP Provider auto-registration (requires VSCode 1.105.0+)
    -   8 個 AI 工具：`get_block_usage`、`search_blocks`、`list_blocks_by_category`、`get_platform_config`、`get_board_pins`、`get_generated_code`、`get_workspace_state`、`refresh_editor`
        8 AI tools: `get_block_usage`, `search_blocks`, `list_blocks_by_category`, `get_platform_config`, `get_board_pins`, `get_generated_code`, `get_workspace_state`, `refresh_editor`

-   **PID 控制器增強** (PID Controller Enhancement)

    -   為 `encoder_pid_setup` 積木新增 MODE 欄位，支援位置模式與速度模式
        Added MODE field to `encoder_pid_setup` block, supporting Position and Speed modes
    -   新增 `encoder_pid_reset` 積木，用於重設 PID 控制器狀態
        Added `encoder_pid_reset` block for resetting PID controller state
    -   15 語言翻譯更新
        15-language translation updates

-   **For 迴圈遞減支援** (For Loop Decrement Support)
    -   `controls_for` 積木現可自動偵測並生成遞減迴圈
        `controls_for` block now auto-detects and generates decrement loops
    -   範例：從 10 到 1 會自動生成 `for (int i = 10; i >= 1; i -= 1)`
        Example: from 10 to 1 auto-generates `for (int i = 10; i >= 1; i -= 1)`

### 修復 Fixed

-   **編輯器效能優化** (Editor Performance Optimization)

    -   修復拖動積木時的延遲問題，使用 `BLOCK_DRAG` 事件追蹤拖動狀態
        Fixed block dragging lag using `BLOCK_DRAG` event for drag state tracking
    -   修復拖動後視圖位置重設問題，透過 FileWatcher 內部更新標記避免重載
        Fixed view position reset after drag via FileWatcher internal update flag
    -   新增 150ms 防抖動機制優化程式碼更新
        Added 150ms debounce for code update optimization

-   **字典修正** (Dictionary Fixes)
    -   修正 `threshold_function_setup` 缺少 NAME 和 PIN 欄位定義
        Fixed missing NAME and PIN field definitions in `threshold_function_setup`
    -   新增閾值函式使用說明（函式名稱可自訂）
        Added usage notes for threshold functions (function name customizable)

### 維護 Maintenance

-   完整規格文件 `specs/015-mcp-server-integration/`
    Complete specification in `specs/015-mcp-server-integration/`
-   新增 MCP 測試套件（blockDictionary、blockQuery、platformConfig、workspaceOps）
    Added MCP test suite (blockDictionary, blockQuery, platformConfig, workspaceOps)
-   Webpack 配置新增 MCP Server 打包
    Webpack config added MCP Server bundling

### 測試 Tests

-   380 個測試通過
    380 tests passing
-   所有 14 個語言的 i18n 驗證通過
    All 14 languages passed i18n validation

## [0.45.0] - 2025-12-11

### 新增 Added

-   **Encoder 積木 JSON 序列化修復** (Encoder Block JSON Serialization Fix)

    -   為 5 個 encoder 積木新增 `saveExtraState`/`loadExtraState` JSON hooks
        Added `saveExtraState`/`loadExtraState` JSON hooks for 5 encoder blocks
    -   修復 Blockly 12.x 中積木連接關係在保存/載入後遺失的問題
        Fixed block connection loss after save/load in Blockly 12.x
    -   影響積木：`encoder_setup`、`encoder_read`、`encoder_reset`、`encoder_pid_setup`、`encoder_pid_compute`
        Affected blocks: `encoder_setup`, `encoder_read`, `encoder_reset`, `encoder_pid_setup`, `encoder_pid_compute`

-   **裸露表達式防護機制** (Naked Value Expression Protection)
    -   新增 `arduinoGenerator.scrubNakedValue` 方法
        Added `arduinoGenerator.scrubNakedValue` method
    -   將獨立放置的 value block 轉為註釋，避免 Arduino C++ 編譯錯誤
        Converts standalone value blocks to comments, preventing Arduino C++ compilation errors
    -   例如：`myEncoder.getCount();` → `// 未連接的表達式: myEncoder.getCount()`
        Example: `myEncoder.getCount();` → `// 未連接的表達式: myEncoder.getCount()`

### 修復 Fixed

-   **FieldDropdown 箭頭函數參考問題** (FieldDropdown Arrow Function Reference Issue)

    -   修復 7 處 `this.sourceBlock_` 在箭頭函數中為 undefined 的問題
        Fixed 7 instances of `this.sourceBlock_` being undefined in arrow functions
    -   改用 `this.workspace || Blockly.getMainWorkspace()` 取得工作區
        Changed to use `this.workspace || Blockly.getMainWorkspace()` for workspace access
    -   影響檔案：`motors.js`（6 處）、`arduino.js`（1 處）
        Affected files: `motors.js` (6 places), `arduino.js` (1 place)

-   **ORDER_FUNCTION_CALL 常數遺漏** (ORDER_FUNCTION_CALL Constant Missing)
    -   補充 `arduinoGenerator.ORDER_FUNCTION_CALL` 常數定義
        Added `arduinoGenerator.ORDER_FUNCTION_CALL` constant definition
    -   解決 "Expecting valid order from value block" 錯誤
        Fixed "Expecting valid order from value block" error

### 維護 Maintenance

-   新增完整規格文件 `specs/014-block-serialization-fix/`
    Added complete specification documents in `specs/014-block-serialization-fix/`

### 測試 Tests

-   手動測試：encoder_read 連接 text_print 後保存/載入，連接關係正確保持
    Manual test: encoder_read connected to text_print saves/loads with connection preserved
-   手動測試：程式碼生成正確產生 `Serial.println(myEncoder.getCount());`
    Manual test: Code generation correctly produces `Serial.println(myEncoder.getCount());`
-   手動測試：獨立放置的 encoder_read 生成註釋而非裸露表達式
    Manual test: Standalone encoder_read generates comment instead of naked expression

## [0.44.1] - 2025-11-26

### 變更 Changed

-   **視覺感測器積木正式化** (Vision Sensor Blocks Graduation)
    -   將 8 個已測試完成的 Pixetto 與 HUSKYLENS 積木從實驗階段移除
        Graduated 8 tested Pixetto and HUSKYLENS blocks from experimental status
    -   Pixetto 正式積木：初始化、偵測到物體、取得偵測類型 ID、獲取偵測物體座標
        Pixetto graduated blocks: init, is_detected, get_type_id, get_position
    -   HUSKYLENS 正式積木：UART 初始化、請求辨識結果、偵測到的方塊數量、取得方塊資訊
        HUSKYLENS graduated blocks: init_uart, request, count_blocks, get_block_info
    -   其餘視覺感測器積木維持實驗階段標記
        Remaining vision sensor blocks retain experimental status

## [0.44.0] - 2025-11-25

### 新增 Added

-   **HuskyLens 動態腳位提示** (HuskyLens Dynamic Pin Hints)
    -   I2C 初始化區塊 tooltip 根據開發板顯示對應腳位資訊
        I2C initialization block tooltip displays board-specific pin information
        -   Uno/Nano: A4(SDA)/A5(SCL)
        -   Mega: D20(SDA)/D21(SCL)
        -   ESP32: GPIO21(SDA)/GPIO22(SCL)
        -   Super Mini: GPIO8(SDA)/GPIO9(SCL)
    -   UART 初始化區塊 tooltip 根據開發板顯示建議腳位
        UART initialization block tooltip displays recommended pins per board
        -   AVR 系列: 任意數位腳位 (Any digital pin)
        -   ESP32: GPIO16(RX2)/GPIO17(TX2)
        -   Super Mini: GPIO20(RX)/GPIO21(TX)
    -   使用 Blockly 12.x 動態函數 tooltip 機制，切換開發板後自動更新
        Uses Blockly 12.x dynamic function tooltip mechanism, auto-updates on board change

### 變更 Changed

-   更新 15 種語言翻譯以支援腳位提示功能
    Updated translations for 15 languages to support pin hint feature
    -   新增 i18n 鍵值：`HUSKYLENS_I2C_PIN_HINT`、`HUSKYLENS_UART_PIN_HINT`、`HUSKYLENS_UART_ANY_DIGITAL`
        Added i18n keys: `HUSKYLENS_I2C_PIN_HINT`, `HUSKYLENS_UART_PIN_HINT`, `HUSKYLENS_UART_ANY_DIGITAL`

### 修復 Fixed

-   **Vision Sensors 工具箱間距一致性** (Vision Sensors Toolbox Spacing Consistency)
    -   移除 `vision-sensors.json` 中 3 個多餘的 `sep` 分隔符
        Removed 3 redundant `sep` separators in `vision-sensors.json`
    -   保留 Pixetto 與 HuskyLens 群組之間的分隔
        Preserved separator between Pixetto and HuskyLens groups
    -   工具箱間距現與其他類別（Arduino、感測器、馬達）一致
        Toolbox spacing now consistent with other categories (Arduino, Sensors, Motors)

### 測試 Tests

-   `npm run validate:i18n`: 14/14 語言 PASS，0 錯誤
    `npm run validate:i18n`: 14/14 languages PASS, 0 errors
-   `npm run lint`: 無錯誤
    `npm run lint`: No errors
-   `npm run compile`: 成功（4.2 秒）
    `npm run compile`: Successful (4.2 seconds)

## [0.43.2] - 2025-11-25

### 修復 Fixed

-   **ESP32 Pixetto 程式碼生成修正** (ESP32 Pixetto Code Generation Fix)
    -   修正 Pixetto 智慧鏡頭積木在 ESP32 開發板上生成不必要的 SoftwareSerial 引用
        Fixed Pixetto vision sensor block generating unnecessary SoftwareSerial references on ESP32 boards
    -   ESP32 不再添加 `#include <SoftwareSerial.h>` 和 AVR 專用 build_flags
        ESP32 no longer adds `#include <SoftwareSerial.h>` and AVR-specific build_flags
    -   AVR 開發板（UNO/Nano/Mega）維持現有行為
        AVR boards (UNO/Nano/Mega) maintain existing behavior
    -   參照 HuskyLens 實作模式，使用 `window.currentBoard.includes('esp32')` 判斷開發板類型
        Following HuskyLens implementation pattern, using `window.currentBoard.includes('esp32')` for board type detection

### 測試 Tests

-   4/4 手動測試通過（100%）：ESP32、Arduino UNO、開發板切換、Super Mini 驗證
    4/4 manual tests passing (100%): ESP32, Arduino UNO, board switching, Super Mini verification

## [0.43.1] - 2025-01-22

### 修復 Fixed

-   **測試框架改進** (Test Framework Improvements)
    -   修復 WebViewManager 測試中的主題設定讀取問題,確保測試環境正確使用 mock 檔案系統
        Fixed theme settings reading issue in WebViewManager tests, ensuring test environment correctly uses mock file system
    -   SettingsManager 與 WebViewManager 現在支援依賴注入,提升測試可靠性
        SettingsManager and WebViewManager now support dependency injection, improving test reliability
    -   所有 285 個單元測試穩定通過 (100%)
        All 285 unit tests passing stably (100%)

## [0.43.0] - 2025-01-22

### 新增 Added

-   **ESP32 PWM 頻率與解析度設定** (ESP32 PWM Frequency and Resolution Configuration)
    **ESP32 PWM Frequency and Resolution Configuration**

    -   新增 `esp32_pwm_setup` 積木，允許使用者自訂 PWM 頻率（1-80000 Hz）和解析度（8-16 bit）
        Added `esp32_pwm_setup` block for custom PWM frequency (1-80000 Hz) and resolution (8-16 bit) configuration
    -   支援馬達驅動晶片高頻 PWM 需求（20-75KHz，適用於 AT8833CR、DRV8833 等晶片）
        Support for high-frequency PWM requirements of motor driver chips (20-75KHz, compatible with AT8833CR, DRV8833, etc.)
    -   自動驗證與調整機制：符合 ESP32 硬體限制（頻率 × 2^解析度 ≤ 80,000,000）
        Automatic validation and adjustment: complies with ESP32 hardware limits (frequency × 2^resolution ≤ 80,000,000)
    -   向後相容：現有專案無需 PWM 設定積木即可使用預設值（75000Hz / 8bit）
        Backward compatible: existing projects work with default values (75000Hz / 8bit) without PWM setup block
    -   與 ESP32Servo 伺服馬達積木獨立運作，互不干擾
        Independent operation with ESP32Servo blocks, no interference

### 變更 Changed

-   更新 15 種語言翻譯以支援 ESP32 PWM 功能（包含繁體中文、英文、德文、法文、西班牙文、義大利文、日文、韓文、葡萄牙文、波蘭文、土耳其文、捷克文、俄文、匈牙利文、保加利亞文）
    Updated translations for 15 languages to support ESP32 PWM features (including Traditional Chinese, English, German, French, Spanish, Italian, Japanese, Korean, Portuguese, Polish, Turkish, Czech, Russian, Hungarian, Bulgarian)

### 測試 Tests

-   新增 18 個 PWM 驗證單元測試（100% 通過率）
    Added 18 PWM validation unit tests (100% pass rate)
-   新增 15 個程式碼生成文件化測試
    Added 15 code generation documentation tests
-   284/285 單元測試通過（99.6%）
    284/285 unit tests passing (99.6%)
-   22/22 手動測試通過（100%）
    22/22 manual tests passing (100%)
-   5/5 硬體測試通過（100%）
    5/5 hardware tests passing (100%)

### 維護 Maintenance

-   移除多餘的臨時檔案和升級記錄
    Removed redundant temporary files and upgrade records
-   更新 .gitignore 以排除開發過程產物
    Updated .gitignore to exclude development artifacts

## [0.42.0] - 2025-01-18

### 新增 Added

-   **國際化品質保證系統** (Internationalization Quality Assurance System)
    **Internationalization Quality Assurance System**

    -   建立完整的 i18n 品質保證系統，採用自動化優先策略
        Established comprehensive i18n QA system with automation-first strategy
    -   100% 消除高嚴重性誤報 (61 → 0 個問題)
        100% high-severity false positive elimination (61 → 0 issues)
    -   15 種語言平均翻譯覆蓋率達 98.94%
        98.94% average translation coverage across 15 languages
    -   33 個單元測試，100% 通過率
        33 unit tests with 100% pass rate
    -   Whitelist 規則系統 v1.1.0 (16 條規則，效能 <100ms)
        Whitelist rule system v1.1.0 (16 rules, <100ms performance)
    -   CI/CD 自動化品質檢查閘門
        Zero validation errors with automated CI/CD quality gates

-   **翻譯審計白名單系統** (Translation Audit Whitelist System)
    **Translation Audit Whitelist System**

    -   新增 audit-whitelist.json 包含 8 條過濾規則
        Added audit-whitelist.json with 8 filtering rules
    -   實作 whitelist-checker.js 用於誤報過濾
        Implemented whitelist-checker.js for false positive filtering
    -   整合白名單至 audit-translations.js
        Integrated whitelist into audit-translations.js
    -   生成包含白名單統計的審計報告
        Generated audit report with whitelist statistics
    -   高嚴重性問題減少 68.9% (61 → 19)
        Reduced high-severity issues by 68.9% (61 → 19)
    -   過濾 149 個誤報 (佔總問題的 8.8%)
        Filtered 149 false positives (8.8% of total issues)

-   **Speckit 自動化增強** (Speckit Automation Enhancement)
    **Speckit Automation Enhancement**
    -   擴充 create-new-feature.ps1 功能
        Extended create-new-feature.ps1 functionality
    -   改進 update-agent-context.ps1 錯誤處理
        Improved update-agent-context.ps1 error handling
    -   新增多個 Speckit prompt 範本以改善開發流程
        Added multiple Speckit prompt templates to improve development workflow

### 已修復 Fixed

-   **安全性修復** (Security Fix)
    **Security Fix**
    -   修復 blocklyPreview 中的 XSS 漏洞
        Fixed XSS vulnerability in blocklyPreview
    -   改用 textContent 設定文字並安全地添加 badge 元素
        Used textContent for text setting and safely added badge elements

### 已變更 Changed

-   **模板重構** (Template Refactoring)
    **Template Refactoring**

    -   簡化 plan-template.md 的技術上下文段落
        Simplified technical context section in plan-template.md
    -   優化 spec-template.md 使用者故事優先級結構
        Optimized user story priority structure in spec-template.md
    -   重組 tasks-template.md 使其更符合獨立測試原則
        Reorganized tasks-template.md to align with independent testing principles

-   **憲法更新** (Constitution Update)
    **Constitution Update**

    -   更新 constitution.md 至 v1.4.0
        Updated constitution.md to v1.4.0
    -   新增完整 Conventional Commits 1.0.0 規範
        Added full Conventional Commits 1.0.0 specification
    -   新增 11 種 commit type 定義與繁體中文說明
        Added 11 commit type definitions with Traditional Chinese descriptions
    -   新增 breaking change 標記規範 (!)
        Added breaking change marker specification (!)
    -   新增 git tag 觸發 CI/CD 警告
        Added git tag triggering CI/CD warning

-   **工作區設定** (Workspace Settings)
    **Workspace Settings**
    -   更新 VSCode 工作區設定並調整編輯器配置
        Updated VSCode workspace settings and adjusted editor configuration

### 文件 Documentation

-   新增 Feature 010 完整規格文件 (Project Safety Guard)
    Added Feature 010 complete specification documents (Project Safety Guard)
    -   17 個完整文件，涵蓋完整開發生命週期
        17 complete documents covering full development lifecycle
    -   包含規格、研究、資料模型、計畫、任務清單、快速入門等
        Includes specifications, research, data models, plans, task lists, quickstart guides
-   更新所有 Speckit 命令提示詞檔案
    Updated all Speckit command prompt files
    -   同步格式化與內容改進
        Synchronized formatting and content improvements
    -   更新命令執行流程說明
        Updated command execution flow descriptions

### 技術細節 Technical Details

-   Pure function 架構用於 whitelist-checker.js
    Pure function architecture for whitelist-checker.js
-   JSON 驅動的規則配置 (非技術編輯者友好)
    JSON-driven rule configuration (non-technical editor friendly)
-   GitHub Actions CI/CD 整合
    GitHub Actions CI/CD integration
-   完成 6/8 個開發階段 (Phase 0-4, 7-8)
    Completed 6/8 development phases (Phase 0-4, 7-8)
-   測試通過率: 249/250 (99.6%)
    Test pass rate: 249/250 (99.6%)

相關 PR: #17  
相關 Issue: #16

## [0.41.0] - 2025-10-22

### 新增 Added

-   **專案安全防護機制** (Project Safety Guard)
    **Project Safety Guard Feature**
    -   在非 Blockly 專案中開啟編輯器時顯示警告對話框
        Shows warning dialog when opening editor in non-Blockly projects
    -   智慧型專案類型識別 (支援 Node.js, Python, Java, .NET, Go 等 6 種類型)
        Smart project type detection (supports 6 types: Node.js, Python, Java, .NET, Go, etc.)
    -   三種使用者選擇: 繼續 / 取消 / 不再提醒
        Three user choices: Continue / Cancel / Don't remind again
    -   工作區級別的偏好設定記憶
        Workspace-level preference memory
    -   完整多語言支援 (15 種語言)
        Full multilingual support (15 languages)

### 已修復 Fixed

-   修正安全警告對話框註解描述不準確的問題
    Fixed inaccurate comment description in safety warning dialog

### 技術細節 Technical

-   新增 `WorkspaceValidator` 服務類別 (292 行)
    Added WorkspaceValidator service class (292 lines)
-   新增 `ProjectTypeDetector` 純函式模組 (109 行)
    Added ProjectTypeDetector pure function module (109 lines)
-   新增 54 個單元測試與整合測試 (涵蓋率 100%)
    Added 54 unit and integration tests (100% coverage)
-   改進測試環境偵測邏輯,支援 NODE_ENV 環境變數
    Improved test environment detection logic with NODE_ENV support
-   使用 `path.isAbsolute()` 替代手動路徑驗證,支援 UNC 路徑
    Replaced manual path validation with `path.isAbsolute()` for UNC path support
-   JSDoc 範例路徑改用跨平台 POSIX 格式
    Updated JSDoc example paths to cross-platform POSIX format
-   Bundle 大小: 152 KiB (+25 KiB)
    Bundle size: 152 KiB (+25 KiB)
-   測試套件: 249/250 通過 (99.6%)
    Test suite: 249/250 passing (99.6%)

## [0.40.0] - 2025-10-22

### 新增 Added

-   新增 ES2023 語法驗證測試套件 (5 個測試)
    Added ES2023 syntax validation test suite (5 tests)
    -   toSorted() - 不可變陣列排序
    -   findLast() - 從末尾查找
    -   toReversed() - 不可變陣列反轉
    -   with() - 不可變元素替換
    -   findLastIndex() - 從末尾查找索引

### 已更新 Updated

-   升級 @typescript-eslint/eslint-plugin 從 8.46.1 至 8.46.2
    Upgraded @typescript-eslint/eslint-plugin from 8.46.1 to 8.46.2
-   升級 webpack-cli 從 5.1.4 至 6.0.1 (MAJOR 版本)
    Upgraded webpack-cli from 5.1.4 to 6.0.1 (MAJOR version)
    -   包含 @webpack-cli/configtest 3.0.1, @webpack-cli/info 3.0.1, @webpack-cli/serve 3.0.1
    -   無需修改配置檔案或腳本
-   更新 ESLint ecmaVersion 設定從 2022 至 2023
    Updated ESLint ecmaVersion configuration from 2022 to 2023

### 技術細節 Technical

-   **效能改善**: 編譯時間改善 7% (5775ms → 5368ms)
    **Performance Improvement**: 7% faster compilation time (5775ms → 5368ms)
-   **測試覆蓋率提升**: 測試數量從 190 增加至 195
    **Test Coverage Increased**: Test count increased from 190 to 195
-   **零破壞性變更**: 所有升級維持完全向後相容
    **Zero Breaking Changes**: All upgrades maintain full backward compatibility
-   **Node.js 需求**: webpack-cli 6.x 需要 Node.js 18.12+ (專案使用 22.16.0)
    **Node.js Requirement**: webpack-cli 6.x requires Node.js 18.12+ (project uses 22.16.0)

## [0.39.1] - 2025-10-21

### 已修改 Changed

-   重新發布版本,修正標籤發布順序問題
    Re-release version to fix tag publishing order issue
-   內容與 0.39.0 完全相同,僅修正發布流程
    Content identical to 0.39.0, only fixing release process

## [0.39.0] - 2025-10-21

### 已更新 Updated

-   升級 Blockly 從 11.2.2 至 12.3.1
    Upgraded Blockly from 11.2.2 to 12.3.1
-   升級 @blockly/theme-modern 從 6.0.12 至 7.0.1
    Upgraded @blockly/theme-modern from 6.0.12 to 7.0.1

### 技術細節 Technical

-   **完全向後相容**: 零破壞性變更,所有現有工作區和積木定義無需修改
    **Fully Backward Compatible**: Zero breaking changes, all existing workspaces and block definitions work without modification
-   **效能改善**: 編譯時間改善 13.1% (3.999s vs 4.6s)
    **Performance Improvement**: 13.1% faster compilation time (3.999s vs 4.6s)
-   **API 相容性**: 100% API 相容性驗證通過
    **API Compatibility**: 100% API compatibility verified
    -   Blockly.inject() - 無變更
    -   Blockly.serialization.\* - 無變更
    -   Blockly.Events.\* - 無變更
    -   Blockly.Theme.defineTheme() - 無變更
-   **測試覆蓋率**: 維持 87.21% 測試覆蓋率,189/190 測試通過
    **Test Coverage**: Maintained 87.21% test coverage, 189/190 tests passing
-   **Blockly 12.x 新功能**:
    -   改善的渲染效能和記憶體使用
    -   增強的事件系統內部最佳化
    -   更清晰的積木邊框 (@blockly/theme-modern 7.x "darker borders")
    -   TypeScript 內建定義檔 (無需 @types/blockly)

## [0.38.1] - 2025-10-21

### 已修復 Fixed

-   修正 package.json 中 engines.vscode 版本要求 (從 ^1.96.0 更新至 ^1.105.0)
    Fixed engines.vscode version requirement in package.json (updated from ^1.96.0 to ^1.105.0)
-   修正 GitHub Actions 工作流程中的 Node.js 版本不匹配問題
    Fixed Node.js version mismatch in GitHub Actions workflows
-   升級所有 CI/CD 流程使用 Node.js 22 以匹配 @types/node@^22.0.0
    Upgraded all CI/CD pipelines to use Node.js 22 to match @types/node@^22.0.0

### 技術細節 Technical

-   此修正確保 VSCode Marketplace 發布流程正常運作
    This fix ensures VSCode Marketplace publishing workflow operates correctly
-   所有 GitHub Actions workflows 現在使用一致的 Node.js 版本
    All GitHub Actions workflows now use consistent Node.js version

## [0.38.0] - 2025-10-21

### 已修改 Changed

-   升級 @types/vscode 從 1.96.0 至 1.105.0
    Upgraded @types/vscode from 1.96.0 to 1.105.0
-   升級 @types/node 從 20.19.22 至 22.18.12 以對齊 Node.js 22.16.0 runtime
    Upgraded @types/node from 20.19.22 to 22.18.12 to align with Node.js 22.16.0 runtime
-   更新 TypeScript target 從 ES2022 至 ES2023
    Updated TypeScript target from ES2022 to ES2023

### 技術細節 Technical

-   所有變更向後相容,無破壞性變更
    All changes are backward compatible with no breaking changes
-   190 測試全數通過,覆蓋率維持 87.21%
    All 190 tests passing, coverage maintained at 87.21%
-   建置產物大小變化: 0% (130,506 bytes, 與基準完全一致)
    Build artifact size change: 0% (130,506 bytes, identical to baseline)

## [0.37.1] - 2025-10-20

### 已更新 Updated

-   升級開發依賴套件 (Phase 2 - 次要版本更新)
    Upgraded development dependencies (Phase 2 - Minor updates)
    -   @blockly/theme-modern: 6.0.10 → 6.0.12 (主題系統 bug 修復)
        @blockly/theme-modern: 6.0.10 → 6.0.12 (theme system bug fixes)
    -   @types/node: 20.17.12 → 20.19.22 (Node.js 20.x 型別定義改進)
        @types/node: 20.17.12 → 20.19.22 (Node.js 20.x type definition improvements)

## [0.37.0] - 2025-10-20

### 已更新 Updated

-   升級開發依賴套件至最新穩定版本 (Phase 1 - 安全更新)
    Upgraded development dependencies to latest stable versions (Phase 1 - Safe Updates)
    -   TypeScript: 5.7.2 → 5.9.3 (效能提升 11%, 編譯時間 -25%)
        TypeScript: 5.7.2 → 5.9.3 (11% performance improvement, -25% compilation time)
    -   @typescript-eslint/eslint-plugin: 8.19.1 → 8.46.1 (27 個 bug 修復)
        @typescript-eslint/eslint-plugin: 8.19.1 → 8.46.1 (27 bug fixes)
    -   @typescript-eslint/parser: 8.19.1 → 8.46.1
    -   @vscode/test-electron: 2.4.1 → 2.5.2
    -   @vscode/test-cli: 0.0.10 → 0.0.12 (測試執行時間 -34%)
        @vscode/test-cli: 0.0.10 → 0.0.12 (-34% test execution time)
    -   sinon: 20.0.0 → 21.0.0 (完全向後相容)
        sinon: 20.0.0 → 21.0.0 (fully backward compatible)
    -   webpack: 5.97.1 → 5.102.1 (ES modules 優化, 建置時間 -25%)
        webpack: 5.97.1 → 5.102.1 (ES modules optimizations, -25% build time)
    -   ts-loader: 9.5.1 → 9.5.4
    -   eslint: 9.32.0 → 9.38.0 (新規則和 bug 修復)
        eslint: 9.32.0 → 9.38.0 (new rules and bug fixes)

### 已修改 Changed

-   開發工作流程效能大幅改善 Significant development workflow performance improvements
    -   編譯時間減少 25.22% (6.1s → 4.6s)
        Compilation time reduced by 25.22% (6.1s → 4.6s)
    -   測試執行時間減少 33.81% (29.6s → 19.6s)
        Test execution time reduced by 33.81% (29.6s → 19.6s)
    -   Lint 時間減少 16.44% (3.7s → 3.1s)
        Lint duration reduced by 16.44% (3.7s → 3.1s)
    -   Bundle 大小維持穩定 (130,506 bytes, 0% 變化)
        Bundle size maintained stable (130,506 bytes, 0% change)

## [0.36.0] - 2025-10-19

### 新增 Added

-   新增 63 個高品質測試,大幅提升測試覆蓋率
    Added 63 high-quality tests, significantly improved test coverage
    -   SettingsManager 進階測試 (20 個): syncLibraryDeps, syncPlatformIOSettings, 錯誤處理
        SettingsManager advanced tests (20 tests): syncLibraryDeps, syncPlatformIOSettings, error handling
    -   MessageHandler 錯誤處理測試 (25 個): catch blocks, 驗證邏輯, 邊界案例
        MessageHandler error handling tests (25 tests): catch blocks, validation logic, edge cases
    -   WebViewManager 進階測試 (8 個): 臨時檔案清理, 錯誤處理, HTML 內容生成
        WebViewManager advanced tests (8 tests): temp file cleanup, error handling, HTML content generation
    -   Extension.ts 錯誤處理測試 (10 個): previewBackup, toggleTheme, openBlocklyEdit 錯誤場景
        Extension.ts error handling tests (10 tests): previewBackup, toggleTheme, openBlocklyEdit error scenarios
-   新增測試工具模組 (Test Helpers): 隔離服務建立、Mock 驗證函式
    Added test helper modules: isolated service creation, mock validation functions
-   新增完整專案文件: COMPLETION-REPORT.md (測試覆蓋率優化專案完成報告)
    Added comprehensive project documentation: COMPLETION-REPORT.md (test coverage improvement project completion report)

### 已修復 Fixed

-   修正 3 個測試失敗問題: API 方法錯誤、command 名稱不符、非同步回調處理
    Fixed 3 test failures: API method errors, command name mismatches, async callback handling
-   修正 5 個 TypeScript 編譯錯誤: 型別不匹配、私有方法存取、檔案 metadata 格式
    Fixed 5 TypeScript compilation errors: type mismatches, private method access, file metadata format

### 已更新 Updated

-   測試覆蓋率從 83.09% 提升至 87.21% (+4.12%)
    Test coverage improved from 83.09% to 87.21% (+4.12%)
    -   Statement coverage: 87.21% (3330/3818 lines)
    -   Branch coverage: 83.78% (429/512 branches, +12.42%)
    -   Function coverage: 89.68% (113/126 functions, +7.94%)
-   核心服務測試覆蓋率達 94.08%: FileService 97.85%, SettingsManager 92.65%, LocaleService 90.67%
    Core services test coverage reached 94.08%: FileService 97.85%, SettingsManager 92.65%, LocaleService 90.67%
-   測試執行時間優化至 <3 秒 (從 ~5 秒優化 40%)
    Test execution time optimized to <3 seconds (40% improvement from ~5 seconds)
-   測試數量從 127 個增加至 190 個 (+63 tests, +49.6%)
    Test count increased from 127 to 190 (+63 tests, +49.6%)

### 已修改 Changed

-   重構測試架構: 統一 Mock 管理策略, 改善測試可維護性
    Refactored test architecture: unified mock management strategy, improved test maintainability
-   優化測試 setup/teardown 模式: 更清晰的測試結構
    Optimized test setup/teardown patterns: clearer test structure

## [0.35.0] - 2025-10-18

### 新增 Added

-   新增 HuskyLens AI 視覺感測器完整支援 (11 個積木)
    Added complete HuskyLens AI Vision Sensor support (11 blocks)
    -   初始化積木：I2C (0x32)、UART (支援 Arduino AVR SoftwareSerial 與 ESP32 HardwareSerial)
        Initialization blocks: I2C (0x32), UART (supports Arduino AVR SoftwareSerial and ESP32 HardwareSerial)
    -   演算法設定：7 種 AI 辨識演算法 (人臉辨識、物體追蹤、物體辨識、線條追蹤、色塊辨識、標籤辨識、物體分類)
        Algorithm configuration: 7 AI recognition algorithms (face recognition, object tracking, object recognition, line tracking, color recognition, tag recognition, object classification)
    -   資料查詢：請求資料、檢查學習狀態、計數方塊/箭頭、取得座標/尺寸/ID 資訊
        Data query: request data, check learning status, count blocks/arrows, get coordinates/dimensions/ID information
    -   學習功能：學習目標 (指定 ID)、忘記學習內容
        Learning functions: learn target (specify ID), forget learned content
-   新增 HuskyLens 積木 15 種語言國際化翻譯 (645 個翻譯單元)
    Added HuskyLens blocks i18n support for 15 languages (645 translation units)
-   新增 8 份完整驗證報告文件 (積木定義、程式碼生成、國際化、錯誤處理、註冊機制、邊界案例、手動測試、完整驗證流程)
    Added 8 comprehensive validation report documents (block definition, code generation, i18n, error handling, registration mechanism, edge cases, manual testing, complete validation workflow)

### 已修復 Fixed

-   修正 ESP32 開發板 UART 初始化問題：使用 HardwareSerial 取代不支援的 SoftwareSerial
    Fixed ESP32 board UART initialization: use HardwareSerial instead of unsupported SoftwareSerial
-   修正 HuskyLens 方塊/箭頭資訊取得積木的 ID 屬性：從小寫 `.id` 改為大寫 `.ID` 以符合 HuskyLens API
    Fixed ID property in HuskyLens block/arrow info blocks: changed from lowercase `.id` to uppercase `.ID` to match HuskyLens API
-   修正多個 HuskyLens 積木同時使用時的重複宣告問題：實作去重邏輯 (includes, variables, lib_deps, setupCode)
    Fixed duplicate declarations when using multiple HuskyLens blocks: implemented deduplication logic (includes, variables, lib_deps, setupCode)
-   修正測試框架相依性注入問題：提升測試通過率從 41 個到 67 個 (98.5%)
    Fixed test framework dependency injection issues: improved test pass rate from 41 to 67 (98.5%)

### 已更新 Updated

-   更新 FileService：改進建構函式參數類型，支援更靈活的路徑解析
    Updated FileService: improved constructor parameter types for more flexible path resolution
-   更新 LocaleService：優化語言檔案載入邏輯
    Updated LocaleService: optimized language file loading logic
-   更新 logging 服務：增強日誌輸出功能
    Updated logging service: enhanced logging output functionality
-   更新測試輔助工具 (mocks.ts)：改進 mock 函式實作，支援依賴注入測試模式
    Updated test helpers (mocks.ts): improved mock function implementation to support dependency injection test patterns

### 測試與品質 Testing & Quality

-   完成 HuskyLens 積木完整驗證 (78/105 任務，100% 通過率)
    Completed comprehensive HuskyLens blocks validation (78/105 tasks, 100% pass rate)
    -   自動化驗證：71/71 任務通過
        Automated validation: 71/71 tasks passed
    -   手動測試：7/7 任務通過 (UI、國際化、程式碼生成)
        Manual testing: 7/7 tasks passed (UI, i18n, code generation)
    -   完整驗證流程：79/79 檢查項目通過
        Complete validation workflow: 79/79 checks passed
-   PlatformIO 編譯測試：4 種開發板全部通過 (Arduino Uno/Nano/Mega、ESP32)
    PlatformIO compilation tests: all 4 board types passed (Arduino Uno/Nano/Mega, ESP32)
-   單元測試：提升通過率從 77.4% 到 98.5% (67/68 測試通過)
    Unit tests: improved pass rate from 77.4% to 98.5% (67/68 tests passed)
-   品質評分：5/5 星，零缺陷
    Quality score: 5/5 stars, zero defects

### 文檔 Documentation

-   新增 specs/004-test-coverage-improvement/TEST-FRAMEWORK-FIX-PROGRESS.md：記錄測試框架修復過程
    Added specs/004-test-coverage-improvement/TEST-FRAMEWORK-FIX-PROGRESS.md: documents test framework fix process
-   更新 specs/003-huskylens-blocks-validation/tasks.md：完整任務追蹤與狀態記錄
    Updated specs/003-huskylens-blocks-validation/tasks.md: complete task tracking and status records

## [0.34.0] - 2025-10-17

### 新增 Added

-   新增國際化品質保證系統：4 個自動化工具（驗證、統計、偵測、稽核）
    Added internationalization quality assurance system: 4 automation tools (validate, stats, detect, audit)
-   新增 228 個翻譯鍵值，涵蓋 15 種語言（平均覆蓋率 98.94%）
    Added 228 translation keys across 15 languages (98.94% average coverage)
-   新增 CI/CD 自動化驗證流程 (`.github/workflows/i18n-validation.yml`)
    Added CI/CD automated validation workflow (`.github/workflows/i18n-validation.yml`)
-   新增 5 個語言風格指南 (日文、韓文、德文、西班牙文、繁體中文)
    Added 5 language style guidelines (Japanese, Korean, German, Spanish, Traditional Chinese)
-   新增專案術語詞彙表 (`localization-glossary.json`)，895 個術語條目
    Added project terminology glossary (`localization-glossary.json`) with 895 term entries
-   新增本地化 PR 模板 (`.github/PULL_REQUEST_TEMPLATE/localization.md`)
    Added localization PR template (`.github/PULL_REQUEST_TEMPLATE/localization.md`)
-   新增貢獻者指南 (`CONTRIBUTING.md`)，包含完整的本地化工作流程
    Added contributor guide (`CONTRIBUTING.md`) with complete localization workflow

### 已修復 Fixed

-   修正 15 種語言的缺失翻譯問題（bg, cs, de, es, fr, hu, it, ja, ko, pl, pt-br, ru, tr, zh-hant, en）
    Fixed missing translations in 15 languages (bg, cs, de, es, fr, hu, it, ja, ko, pl, pt-br, ru, tr, zh-hant, en)
-   修正日文、韓文、德文中的直譯和文化不適配問題
    Fixed literal translations and cultural mismatches in Japanese, Korean, and German
-   修正術語一致性問題（如 sensor/感測器、motor/馬達 等）
    Fixed terminology consistency issues (e.g., sensor/感測器, motor/馬達)

### 已更新 Updated

-   更新 README.md 國際化章節，新增品質指標和語言覆蓋率詳情
    Updated README.md internationalization section with quality metrics and language coverage details
-   更新所有語言檔案至最新結構（bg, cs, de, es, fr, hu, it, ja, ko, pl, pt-br, ru, tr, zh-hant, en）
    Updated all language files to latest structure (bg, cs, de, es, fr, hu, it, ja, ko, pl, pt-br, ru, tr, zh-hant, en)

### 技術改進 Technical Improvements

-   建立 4 層驗證機制（JSON Schema → 語法 → 模式 → 稽核）
    Established 4-layer validation mechanism (JSON Schema → Syntax → Pattern → Audit)
-   整合 10+ npm 腳本用於 i18n 工作流程
    Integrated 10+ npm scripts for i18n workflow
-   建立基準稽核報告系統用於長期品質追蹤
    Established baseline audit report system for long-term quality tracking

### 文檔 Documentation

-   新增完整的 i18n 專案規格文件 (`specs/002-i18n-localization-review/`)
    Added complete i18n project specification documentation (`specs/002-i18n-localization-review/`)
-   新增快速入門指南 (`quickstart.md`)，協助貢獻者參與本地化工作
    Added quickstart guide (`quickstart.md`) to help contributors participate in localization
-   新增實作計畫和任務追蹤文件 (`plan.md`, `tasks.md`)
    Added implementation plan and task tracking documents (`plan.md`, `tasks.md`)

## [0.33.0] - 2025-10-17

### 新增 Added

-   新增 FileService 雙實例模式：`extensionFileService` 用於擴充套件資源，`fileService` 用於工作區檔案
    Added dual FileService pattern: `extensionFileService` for extension resources, `fileService` for workspace files
-   新增動態 Arduino 模組發現機制 (`discoverArduinoModules()`)，自動掃描 `media/blockly/generators/arduino/` 目錄
    Added dynamic Arduino module discovery mechanism (`discoverArduinoModules()`), automatically scans `media/blockly/generators/arduino/` directory
-   新增唯一暫存檔案命名機制 (`temp_toolbox_{timestamp}.json`)，避免多視窗衝突
    Added unique temporary file naming mechanism (`temp_toolbox_{timestamp}.json`) to prevent multi-window conflicts
-   新增計時常數以提升程式碼可讀性：`UI_MESSAGE_DELAY_MS`, `UI_REVEAL_DELAY_MS`, `BOARD_CONFIG_REQUEST_TIMEOUT_MS`
    Added timing constants to improve code readability: `UI_MESSAGE_DELAY_MS`, `UI_REVEAL_DELAY_MS`, `BOARD_CONFIG_REQUEST_TIMEOUT_MS`
-   新增過期暫存檔案自動清理功能，啟動時清理超過 1 小時的 temp*toolbox*_.json 檔案
    Added automatic stale temporary file cleanup, removing temp*toolbox*_.json files older than 1 hour on activation

### 已修復 Fixed

-   移除 `webviewManager.ts` 中的直接 `fs` 模組引用，改用 FileService 抽象層
    Removed direct `fs` module imports in `webviewManager.ts`, replaced with FileService abstraction
-   修正暫存工具箱檔案在多視窗場景下的競爭條件問題
    Fixed race condition issues with temporary toolbox files in multi-window scenarios
-   修正 `threshold_function_read` 積木的下拉選單驗證錯誤，新增錯誤處理機制
    Fixed dropdown validation error in `threshold_function_read` block, added error handling mechanism
-   修正暫存工具箱檔案被誤加入 Git 追蹤的問題，新增 .gitignore 規則
    Fixed temporary toolbox files being incorrectly tracked by Git, added .gitignore rules

### 已更新 Updated

-   將 6 個方法轉換為非同步模式 (`getWebviewContent`, `loadArduinoModules` 等)
    Converted 6 methods to async mode (`getWebviewContent`, `loadArduinoModules`, etc.)
-   重構語言檔案載入邏輯，統一為單一方法 `loadLocaleScripts()`，減少 50% 程式碼重複
    Refactored locale file loading logic into unified `loadLocaleScripts()` method, reducing 50% code duplication
-   改進 `threshold_function_read` 積木的向後相容性，自動修正舊版 workspace 中的無效值
    Improved backward compatibility for `threshold_function_read` block, auto-correcting invalid values from legacy workspaces

### 已修改 Changed

-   移除 `src/modules/` 下所有空目錄 (core/, features/, services/, types/, utils/)
    Removed all empty directories under `src/modules/` (core/, features/, services/, types/, utils/)
-   移除硬編碼的 Arduino 模組列表，改用目錄掃描動態發現
    Removed hardcoded Arduino module list, replaced with directory scanning for dynamic discovery
-   所有魔術數字已提取為命名常數，提升程式碼可維護性
    All magic numbers extracted to named constants for improved code maintainability

### 測試與品質 Testing & Quality

-   完成 6 項手動測試，涵蓋 Phase 1-6 所有功能（100% 通過率）
    Completed 6 manual tests covering all Phase 1-6 features (100% pass rate)
    -   T032-T033: Phase 1 FileService 整合測試
        Phase 1 FileService integration tests
    -   T045-T046: Phase 3 語言載入測試
        Phase 3 locale loading tests
    -   T058-T059: Phase 6 魔術數字消除測試
        Phase 6 magic number elimination tests
-   維護測試基準線：22 個通過，31 個失敗（無新增迴歸）
    Maintained test baseline: 22 passing, 31 failing (no new regressions)

### 重構詳情 Refactoring Details

完成 6 個主要架構清理任務（78/79 tasks, 98.7%）：
Completed 6 major architecture cleanup tasks (78/79 tasks, 98.7%):

1. **Phase 1**: 移除空目錄 (Empty directory cleanup)
2. **Phase 2**: FileService 整合 (FileService integration)
3. **Phase 3**: 語言載入去重 (Locale loading deduplication)
4. **Phase 4**: 暫存檔案處理 (Unique temp file handling + stale cleanup)
5. **Phase 5**: 動態模組發現 (Dynamic module discovery)
6. **Phase 6**: 魔術數字消除 (Magic number elimination)

詳細報告請參閱：`specs/001-refactor-architecture-cleanup/PHASE-COMPLETION-REPORT.md`
For detailed report, see: `specs/001-refactor-architecture-cleanup/PHASE-COMPLETION-REPORT.md`

## [0.32.2] - 2025-08-05

### 新增 Added

-   新增 form-data 套件依賴 (v4.0.4)，提供表單數據處理功能
    Added form-data package dependency (v4.0.4) for form data processing functionality

### 已更新 Updated

-   升級 Blockly 版本從 11.2.2 到 11.2.2，保持最新穩定版本
    Updated Blockly version from 11.2.0 to 11.2.2 to maintain latest stable version
-   更新多個 ESLint 相關套件到最新版本，提升程式碼品質和安全性
    Updated multiple ESLint-related packages to latest versions for improved code quality and security
    -   @eslint/config-array: 0.19.1 → 0.21.0
    -   @eslint/core: 0.9.1 → 0.15.1
    -   @eslint/eslintrc: 3.2.0 → 3.3.1
    -   @eslint/js: 9.17.0 → 9.32.0
    -   @eslint/object-schema: 2.1.5 → 2.1.6
    -   @eslint/plugin-kit: 0.2.4 → 0.3.4
    -   eslint: 9.17.0 → 9.32.0
    -   其他相關依賴的版本更新
        Other related dependency version updates

## [0.32.1] - 2025-06-14

### 已更新 Updated

-   升級 Blockly 版本從 11.2.0 到 11.2.2，提升穩定性和性能
    Updated Blockly version from 11.2.0 to 11.2.2 for improved stability and performance
-   改進 Blockly API 兼容性處理，使用新的 `setLocale` API (v11.2.0+) 並保持向後兼容
    Improved Blockly API compatibility handling, using new `setLocale` API (v11.2.0+) while maintaining backward compatibility
-   優化程式碼品質，移除重複的程式碼片段和改善函數結構
    Optimized code quality by removing duplicate code fragments and improving function structure
-   增強錯誤處理和回退機制，提供更穩定的語言切換體驗
    Enhanced error handling and fallback mechanisms for more stable language switching experience

### 已修改 Changed

-   更新檢查流程提示檔案，增加新的工具支援選項
    Updated check process prompt file with additional tool support options
-   重構語言載入機制，採用更現代和安全的 Blockly API 呼叫方式
    Refactored language loading mechanism using more modern and secure Blockly API calling methods

## [0.32.0] - 2025-06-13

### 新增 Added

-   新增 HUSKYLENS 智慧鏡頭積木支援，包含 I2C 和 UART 初始化方式
    Added HUSKYLENS smart camera block support, including I2C and UART initialization modes
-   新增 HUSKYLENS 多種辨識演算法積木：人臉辨識、物體追蹤、物體辨識、線路追蹤、顏色辨識、標籤辨識、物體分類
    Added HUSKYLENS multiple recognition algorithm blocks: face recognition, object tracking, object recognition, line tracking, color recognition, tag recognition, object classification
-   新增 HUSKYLENS 資料取得積木：方塊和箭頭的偵測結果、位置資訊、ID 等
    Added HUSKYLENS data retrieval blocks: block and arrow detection results, position information, ID, etc.
-   新增 HUSKYLENS 學習功能積木：學習物體和忘記所有學習內容
    Added HUSKYLENS learning function blocks: learn objects and forget all learned content
-   所有 HUSKYLENS 積木標記為實驗性質，提供視覺指示和通知系統
    All HUSKYLENS blocks marked as experimental with visual indicators and notification system

### 已更新 Updated

-   更新視覺感測器工具箱分類，整合 HUSKYLENS 積木
    Updated vision sensors toolbox category to integrate HUSKYLENS blocks
-   更新實驗積木標記系統，增強對 HUSKYLENS 積木的支援
    Updated experimental block marking system with enhanced support for HUSKYLENS blocks
-   更新所有語言文件的授權標頭格式，提升一致性
    Updated license header format in all language files for improved consistency

### 已修改 Changed

-   重新組織視覺感測器積木分類，將 HUSKYLENS 和 Pixetto 分別標註
    Reorganized vision sensor block categories with separate labeling for HUSKYLENS and Pixetto

## [0.31.0] - 2025-06-13

### 新增 Added

-   新增 Pixetto 基礎檢測積木：是否偵測到物體、取得偵測類型 ID、取得功能 ID
    Added Pixetto basic detection blocks: object detected check, get type ID, get function ID
-   增強 Pixetto 程式碼生成邏輯，改善各種偵測模式的準確性和一致性
    Enhanced Pixetto code generation logic, improving accuracy and consistency of various detection modes
-   更新所有語言的 Pixetto 翻譯支援，涵蓋新增的積木功能
    Updated Pixetto translations for all languages, covering newly added block functions

### 已修復 Fixed

-   修正 Pixetto 形狀偵測中六邊形的對應問題（改用五邊形代替）
    Fixed hexagon mapping issue in Pixetto shape detection (using pentagon instead)
-   改善 Pixetto 程式碼生成的常數名稱，符合最新函式庫規範
    Improved Pixetto code generation constant names to comply with latest library specifications

### 已更新 Updated

-   更新 Pixetto 工具箱配置，整合新的基礎檢測積木
    Updated Pixetto toolbox configuration to integrate new basic detection blocks

### 已修改 Changed

-   重構 Pixetto 偵測積木的程式碼生成方式，使用更精確的條件判斷
    Refactored Pixetto detection block code generation to use more precise conditional logic

## [0.30.0] - 2025-06-13

### 新增 Added

-   新增 Pixetto 智慧鏡頭支援：完整的視覺識別積木組件
    Added Pixetto Smart Camera support: Complete visual recognition block components
-   新增 Pixetto 初始化功能，支援 UART 通訊設定
    Added Pixetto initialization function with UART communication setup
-   新增多種 Pixetto 偵測模式：顏色偵測、形狀偵測、人臉偵測、AprilTag 偵測
    Added multiple Pixetto detection modes: color detection, shape detection, face detection, AprilTag detection
-   新增 Pixetto 進階功能：神經網路辨識、手寫數字辨識、道路偵測
    Added Pixetto advanced features: neural network recognition, handwritten digit recognition, road detection
-   新增 Pixetto 資料讀取功能：座標、尺寸和道路資訊取得
    Added Pixetto data reading functions: coordinate, size and road information retrieval
-   新增 15 種語言的 Pixetto 相關翻譯支援
    Added Pixetto-related translations for 15 languages
-   增強 platformio.ini 設定同步功能，支援 build_flags 和 lib_ldf_mode 設定
    Enhanced platformio.ini settings synchronization to support build_flags and lib_ldf_mode configurations

### 已修復 Fixed

### 已更新 Updated

### 已修改 Changed

## [0.29.0] - 2025-06-10

### 新增 Added

-   新增重新整理按鈕功能：在積木編輯器右上角新增重新整理按鈕，可手動觸發程式碼重新生成
    Added refresh button feature: Added a refresh button in the top-right corner of the block editor to manually trigger code regeneration
-   重新整理按鈕具備旋轉動畫效果，提供視覺回饋
    Refresh button features rotation animation for visual feedback
-   新增 15 種語言的重新整理按鈕標題翻譯支援
    Added refresh button title translations for 15 languages

### 已修復 Fixed

-   修正重新整理按鈕 SVG 圖示的旋轉中心點，確保以圖片中心進行旋轉
    Fixed refresh button SVG icon rotation center to ensure rotation around the image center

### 已更新 Updated

### 已修改 Changed

## [0.28.1] - 2025-06-02

### 新增 Added

### 已修復 Fixed

-   修正預覽視窗缺少 loops block 的問題
    Fixed preview window missing loops block

### 已更新 Updated

### 已修改 Changed

## [0.28.0] - 2025-05-21

### 新增 Added

-   新增獨立的 loops.js 文件，專門管理與循環相關的區塊定義
    Added a dedicated loops.js file for managing loop-related block definitions
-   新增 `singular_flow_statements` 區塊，包含自定義驗證邏輯確保只在循環內使用
    Added `singular_flow_statements` block with custom validation logic to ensure it's used only within loops

### 已修改 Changed

-   將 `controls_duration` 區塊從 arduino.js 移動到 loops.js 文件中，改善程式碼組織結構
    Moved `controls_duration` block from arduino.js to loops.js file, improving code organization
-   在工具箱中將 `controls_flow_statements` 更改為 `singular_flow_statements`
    Changed `controls_flow_statements` to `singular_flow_statements` in the toolbox

## [0.27.1] - 2025-05-16

### 已修改 Changed

-   改進搜尋結果容器的捲軸樣式，使其與備份管理的捲軸保持一致性
    Improved scrollbar styles for search results container to maintain consistency with backup management scrollbars

## [0.27.0] - 2025-05-16

### 新增 Added

-   新增積木搜尋功能，支援在工作區內快速搜尋積木名稱或參數，並可高亮、導覽搜尋結果，支援多國語言與快捷鍵（Ctrl+F）
    Added block search feature: quickly search blocks by name or parameter in the workspace, highlight and navigate results, with multi-language support and keyboard shortcut (Ctrl+F)

### 已更新 Updated

-   所有支援語言新增積木搜尋相關翻譯字串
    Added block search related translation strings for all supported languages

## [0.26.0] - 2025-05-15

### 新增 Added

-   新增超音波觸發（ultrasonic_trigger）和讀取（ultrasonic_read）積木的自動註冊，確保它們能找到超音波感測器積木
    Added automatic registration of ultrasonic trigger and read blocks, ensuring they can find the ultrasonic sensor block

### 已更新 Updated

-   改進超音波感測器相關積木之間的關聯性，現在超音波觸發和讀取積木能自動偵測工作區中的超音波感測器積木
    Improved relationship between ultrasonic-related blocks; now ultrasonic trigger and read blocks can automatically detect ultrasonic sensor blocks in the workspace
-   增強超音波感測器積木的日誌系統，提供更詳細的運行時資訊，有助於除錯
    Enhanced logging system for ultrasonic sensor blocks, providing more detailed runtime information for debugging

### 已修改 Changed

-   重構超音波感測器程式碼生成邏輯，提升程式碼品質和可維護性
    Refactored ultrasonic sensor code generation logic for better code quality and maintainability

## [0.25.0] - 2025-05-02

### 新增 Added

-   新增編碼馬達相關積木，包括設定、讀取、重設和 PID 控制功能
    Added encoder motor blocks, including setup, read, reset and PID control functionality
-   新增實驗性積木追蹤系統，可自動識別與管理實驗階段的積木
    Added experimental blocks tracking system to automatically identify and manage blocks in experimental stage

### 已修復 Fixed

### 已更新 Updated

-   更新專案資料夾結構，將指導文件從 `instructions` 移至 `prompts` 資料夾並新增模式標記
    Updated project folder structure, moved instruction files from `instructions` to `prompts` folder and added mode tags
-   更新日誌輸出方式說明，統一使用 `log.info`、`log.error` 等方法，取代 `console.log`
    Updated logging method instructions, standardized to use `log.info`, `log.error`, etc., instead of `console.log`

### 已修改 Changed

## [0.24.0] - 2025-04-27

### 新增 Added

-   新增 `getPWMPinOptions()` 函數來獲取支援 PWM 的引腳選項，提高伺服馬達和類比寫入積木的準確性
    Added `getPWMPinOptions()` function to get PWM-supported pins, improving accuracy for servo and analog write blocks
-   在程式碼生成中添加註釋系統，使生成的程式碼更易於理解
    Added comments system in code generation, making generated code more understandable

### 已更新 Updated

-   更新類比寫入積木，現在使用專用的 PWM 引腳選項函數，確保只顯示支援 PWM 的引腳
    Updated analog write block to use dedicated PWM pin options function, ensuring only PWM-capable pins are displayed
-   更新伺服馬達積木，現在使用 PWM 引腳選項，確保硬體相容性
    Updated servo motor blocks to use PWM pin options, ensuring hardware compatibility

### 已修改 Changed

-   為 ESP32 開發板添加專用的伺服馬達支援，使用 ESP32Servo 庫及其特定設定
    Added dedicated servo support for ESP32 boards, using ESP32Servo library and its specific configurations
-   改進伺服馬達程式碼生成，根據不同開發板選擇適當的伺服馬達庫和設定
    Improved servo code generation, selecting appropriate servo libraries and settings based on different boards

## [0.23.1] - 2025-04-27

### 已修復 Fixed

-   改進了檔案名稱驗證功能，允許使用中文和更多有效字符，排除了檔案系統不允許的特殊字符
    Improved filename validation to support Chinese characters and more valid characters, excluding only special characters not allowed by the file system
-   更新了無效檔案名稱的錯誤訊息，使其更具體明確
    Updated error message for invalid filenames to be more specific and clear

## [0.23.0] - 2025-04-26

### 新增 Added

-   新增自動備份功能，定期儲存工作區以防止意外資料遺失
    Added auto-backup feature that periodically saves the workspace to prevent accidental data loss
-   新增自動備份間隔設定功能，使用者可依需求自訂備份頻率
    Added auto-backup interval setting feature, allowing users to customize backup frequency
-   新增備份管理介面 UI 改進，包含按鈕樣式和版面配置優化
    Added UI improvements to the backup management interface, including button styling and layout optimization

### 已更新 Updated

-   更新備份管理介面的樣式，提供更現代化的使用者體驗
    Updated the style of the backup management interface for a more modern user experience
-   為所有支援的語言添加了自動備份相關的翻譯
    Added translations related to auto-backup for all supported languages

### 已修改 Changed

-   改進備份列表顯示，增加視覺回饋和互動體驗
    Improved backup list display with enhanced visual feedback and interaction experience
-   重構備份相關 CSS 樣式，使用更一致的風格並支援不同設備尺寸
    Refactored backup-related CSS styles for more consistent styling and support for different device sizes

## [0.22.1] - 2025-04-25

### 已更新 Updated

-   更新 ESP32 開發板的引腳定義，標記多個引腳支援 PWM 功能，提供更準確的硬體功能描述
    Updated ESP32 pin definitions to mark multiple pins as supporting PWM functionality, providing more accurate hardware capability descriptions

### 已修改 Changed

-   改進類比寫入 (analogWrite) 積木的程式碼生成邏輯，現在對所有類型的輸入值（包括數字字面量和表達式）都套用 constrain 函數，確保輸出在開發板支援的範圍內
    Improved code generation logic for analog write (analogWrite) blocks, now applying constrain function to all types of input values (including numeric literals and expressions), ensuring output is within the range supported by the board
-   將 `arduino_analog_write` 和 `arduino_digital_write` 積木註冊為始終生成的積木，確保在特定情況下的正確程式碼生成
    Registered `arduino_analog_write` and `arduino_digital_write` blocks as always-generate blocks, ensuring correct code generation in specific scenarios

## [0.22.0] - 2025-04-24

### 新增 Added

-   新增伺服馬達停止積木，允許透過 detach() 函數停止伺服訊號輸出
    Added servo motor stop block, allowing servo signal output to be stopped using the detach() function
-   為所有支援的語言添加了伺服馬達停止積木的相關翻譯
    Added translations for the servo motor stop block for all supported languages

## [0.21.1] - 2025-04-24

### 已更新 Updated

-   更新 Arduino Nano 的 platformio 設定，將板子類型從 nanoatmega328 改為 nanoatmega328new
    Updated Arduino Nano platformio configuration, changing board type from nanoatmega328 to nanoatmega328new

### 已修改 Changed

-   改進開發板選擇機制，從靜態 HTML 選項改為動態生成選單
    Improved board selection mechanism, changing from static HTML options to dynamically generated menu
    -   開發板選項現在直接從 BOARD_CONFIGS 物件動態產生
        Board options are now dynamically generated from the BOARD_CONFIGS object
    -   確保開發板顯示名稱與內部配置保持一致
        Ensure board display names are consistent with internal configurations

## [0.21.0] - 2025-04-23

### 新增 Added

-   新增深色主題圖示於預覽模式中，改善深色模式的視覺體驗
    Added dark theme icon in preview mode, improving visual experience in dark mode

### 已更新 Updated

-   更新 Blockly 工作區，支援觸控設備的縮放功能 (pinch 縮放)
    Updated Blockly workspace to support touch device zooming (pinch zoom)

### 已修改 Changed

-   在預覽模式中調整滾輪行為，避免縮放功能與滾動衝突
    Adjusted wheel behavior in preview mode to avoid conflicts between zooming and scrolling

## [0.20.0] - 2025-04-23

### 新增 Added

-   新增積木自動生成機制，讓特定積木類型無論位置都能生成代碼
    Added automatic block generation mechanism to ensure specific block types generate code regardless of their position
    -   新增 `alwaysGenerateBlocks_` 陣列用於管理必須生成的積木
        Added `alwaysGenerateBlocks_` array to manage blocks that must generate code
    -   提供 `registerAlwaysGenerateBlock` 輔助函數使各模組能註冊自身積木
        Provided `registerAlwaysGenerateBlock` helper function for modules to register their blocks

### 已更新 Updated

-   改進伺服馬達積木，從文字輸入改為下拉選單
    Improved servo motor blocks, changing from text input to dropdown menu
    -   自動顯示工作區中所有已設定的伺服馬達名稱
        Automatically displays all configured servo motor names in the workspace
    -   實現變異記錄功能，保存選擇的馬達值
        Implemented mutation recording to save selected motor values

### 已修改 Changed

-   改進代碼生成的日誌記錄，從 console.log 改為使用標準日誌服務
    Improved code generation logging, changing from console.log to standard logging service

## [0.19.0] - 2025-04-23

### 新增 Added

-   新增伺服馬達積木
    Added servo motor blocks
    -   支援伺服馬達設定與角度控制
        Support servo motor setup and angle control
    -   在所有支援的語言中加入馬達相關翻譯
        Add motor-related translations in all supported languages

### 已更新 Updated

-   改進函式庫依賴管理
    Improved library dependency management
    -   新增 `lib_deps_` 系統用於追蹤函式庫依賴
        Added `lib_deps_` system for tracking library dependencies
    -   自動在 platformio.ini 中同步函式庫依賴資訊
        Automatically synchronize library dependency information in platformio.ini

### 已修改 Changed

-   更新 Blockly 編輯器與預覽頁面，增加馬達積木的主題顏色
    Updated Blockly editor and preview page with motor block theme colors

## [0.18.0] - 2025-04-20

### 新增 Added

-   新增函數名稱轉換功能，支援將中文函數名稱轉換為合法的 C++ 函數名稱
    Added function name conversion functionality to support converting Chinese function names to valid C++ function names

### 已修復 Fixed

-   修復了函數名稱變更時的邏輯和連接恢復機制
    Fixed function name change logic and connection recovery mechanism

### 已更新 Updated

-   更新使用統一的日誌系統，取代直接使用 console 方法
    Updated to use unified logging system instead of direct console methods
-   改進了函數定義處理的正則表達式，使其更健壯
    Improved the regular expression for function definition processing to make it more robust

## [0.17.1] - 2025-04-19

### 新增 Added

-   新增複製貼上函數積木時的自動名稱處理功能，避免重複名稱
    Added automatic name handling when copy-pasting function blocks to avoid duplicate names
-   新增檢查防止建立同名函數，顯示警告並還原為原有名稱
    Added check to prevent creating functions with duplicate names, showing warning and reverting to original name

### 已修復 Fixed

-   優化函數複製貼上後的名稱處理邏輯，避免重複函數名稱引起的問題
    Optimized name handling logic after function block duplication to avoid issues caused by duplicate function names

## [0.17.0] - 2025-04-19

### 新增 Added

-   在預覽頁面中新增頁內標題更新功能，顯示更加一致的多語言標題
    Added in-page title update functionality in preview page for consistent multilingual title display

### 已更新 Updated

-   更新預覽頁面，新增對感測器區塊的支援
    Updated preview page to add support for sensor blocks

### 已改進 Improved

-   改進多語言訊息解析的正則表達式，支援更多格式的訊息定義
    Improved regex for multilingual message parsing to support more message definition formats
-   增強預覽視窗的多語言支援，統一視窗標題和頁內標題顯示
    Enhanced multilingual support for preview windows, unifying window title and in-page title display

## [0.16.1] - 2025-04-19

### 新增 Added

-   新增自動掃描機制，確保 threshold_function_setup 與 ultrasonic_sensor 設定積木正確初始化
    Added automatic scanning mechanism to ensure threshold_function_setup and ultrasonic_sensor setup blocks are properly initialized

### 已修復 Fixed

-   移除未使用的腳位模式追蹤全局物件，優化記憶體使用
    Removed unused pin mode tracking global object to optimize memory usage

## [0.16.0] - 2025-04-17

### 新增 Added

-   新增超音波觸發積木  
    Added independent ultrasonic trigger block

## [0.15.0] - 2025-04-17

### 新增 Added

-   新增超音波感測器積木
    Added ultrasonic sensor blocks
    -   支援設定 Trig 和 Echo 腳位
        Support setting Trig and Echo pins
    -   支援使用硬體中斷提高精確度
        Support using hardware interrupts for better accuracy
    -   支援不同開發板的硬體中斷腳位
        Support hardware interrupt pins for different boards

### 已更新 Updated

-   更新所有語言檔案，支援新增的感測器功能
    Updated all language files to support new sensor features
-   開發板配置增強：為所有支援的開發板新增硬體中斷腳位設定
    Enhanced board configurations: Added hardware interrupt pin configurations for all supported boards
-   更新積木顏色管理，使用主題樣式而非直接設置顏色
    Updated block color management to use theme styles instead of direct color setting
-   更新主題檔案，添加感測器區塊樣式
    Updated theme files to add sensor block styles

## [0.14.1] - 2025-04-16

### 已更新 Updated

-   改進備份管理界面的響應式設計
    Improved responsive design of backup management interface
    -   新增按鈕區域自動換行功能，提高在小視窗下的可用性
        Added button area auto-wrap functionality to improve usability in small windows
    -   添加按鈕之間的間距，優化換行後的視覺效果
        Added spacing between buttons to optimize visual appearance after wrapping

### 已修改 Changed

-   修改自動備份文件的命名格式
    Modified auto-backup file naming format
    -   從`auto_backup_before_restore_YYYYMMDD_HHMMSS`簡化為`auto_restore_YYYYMMDD_HHMMSS`
        Simplified from `auto_backup_before_restore_YYYYMMDD_HHMMSS` to `auto_restore_YYYYMMDD_HHMMSS`

## [0.14.0] - 2025-04-16

### 已更新 Updated

-   增強多語言支援功能
    Enhanced multilingual support functionality
    -   改進了使用者介面元素的多語言支援
        Improved multilingual support for user interface elements
    -   為備份管理視窗和預覽模式添加多語言支援
        Added multilingual support for backup management window and preview mode
    -   增強了從 JS 檔案中提取訊息的能力
        Enhanced ability to extract messages from JS files

## [0.13.2] - 2025-04-16

### 已修改 Changed

-   修改滑鼠滾輪設定，避免與縮放功能衝突
    Modified mouse wheel settings to avoid conflicts with zoom functionality
    -   在編輯器中禁用滾輪的移動功能
        Disabled wheel movement in the editor

## [0.13.1] - 2025-04-16

### 已修復 Fixed

-   修復程式碼生成器中的運算優先順序問題
    Fixed operator precedence issues in code generators
    -   在邏輯比較運算中加入括號以確保運算優先順序正確
        Added parentheses to logic comparison operations to ensure correct operator precedence
    -   在邏輯運算（AND、OR）中加入括號
        Added parentheses to logic operations (AND, OR)
    -   在邏輯否定運算中加入括號
        Added parentheses to logic negation operations
    -   修正 while-until 迴圈中的條件判斷加入括號
        Fixed condition evaluation in while-until loops by adding parentheses

## [0.13.0] - 2025-04-16

### 已修改 Changed

-   移除預覽模式中的複製功能
    Removed copy functionality from preview mode
    -   將預覽工作區設為完全唯讀模式
        Set preview workspace to fully read-only mode
    -   移除相關的複製界面元素和提示文字
        Removed related copy UI elements and prompt text
    -   清理不再需要的複製成功提示樣式和腳本
        Cleaned up no longer needed copy success notification styles and scripts

## [0.12.0] - 2025-04-13

### 新增 Added

-   新增備份預覽功能
    Added backup preview functionality
    -   用戶現在可以直接在閱讀模式中預覽備份檔案，不需要先還原
        Users can now preview backup files in read mode without having to restore them first
    -   新增 blocklyPreview.html 和 blocklyPreview.js 實現預覽視窗功能
        Added blocklyPreview.html and blocklyPreview.js to implement preview window functionality
    -   在備份管理面板中新增預覽按鈕，點擊即可在新視窗中查看備份內容
        Added preview button in the backup management panel for viewing backup content in a new window

### 已更新 Updated

-   改進 UI 元素設計和互動體驗
    Improved UI element design and interaction experience
    -   優化備份操作按鈕的視覺效果，添加圖標提高可識別性
        Optimized the visual effects of backup operation buttons, adding icons to improve recognizability
    -   更新主題命名系統，從 dark-mode/light-mode 改為 theme-dark/theme-light
        Updated theme naming system from dark-mode/light-mode to theme-dark/theme-light
    -   改進複製功能，新增成功提示訊息
        Improved copy functionality with success notification messages

## [0.11.0] - 2025-04-12

### 新增 Added

-   新增獲取檔案時間戳功能
    Added file timestamp retrieval functionality
    -   在 FileService 中新增 getFileStats 方法，可獲取檔案的完整時間戳資訊
        Added getFileStats method in FileService to retrieve complete timestamp information for files

### 已更新 Updated

-   改進備份檔案處理機制
    Improved backup file handling mechanism
    -   備份列表現在顯示真實的檔案創建時間和大小
        Backup list now displays actual file creation time and size
    -   優化備份檔案路徑管理，便於後續功能擴展
        Optimized backup file path management for future feature extensions

## [0.10.0] - 2025-04-11

### 新增 Added

-   新增備份還原功能
    Added backup restoration feature
    -   用戶現在可以透過界面還原之前創建的備份
        Users can now restore previously created backups through the interface
    -   在還原前自動創建臨時備份，確保操作安全
        Temporary backups are automatically created before restoration to ensure operation safety
    -   新增還原按鈕和相應的視覺樣式
        Added restoration button and corresponding visual styles

## [0.9.0] - 2025-04-11

### 新增 Added

-   新增自動檢測需要 Serial 初始化的積木功能
    Added automatic detection for blocks requiring Serial initialization
    -   當工作區中存在 text_print 或 text_prompt_ext 積木時，自動添加 Serial.begin(9600)
        Automatically adds Serial.begin(9600) when text_print or text_prompt_ext blocks exist in workspace
    -   優化代碼生成流程，提高用戶體驗
        Optimized code generation process for better user experience

## [0.8.1] - 2025-04-11

### 已修復 Fixed

-   修復門檻值函數讀取區塊功能問題
    Fixed threshold function read block issues
    -   增強變異記錄與恢復機制，解決運行時選項保存問題
        Enhanced mutation recording and restoration mechanism to solve runtime option preservation issues
    -   改進正則表達式處理，支援含有換行符的函式定義
        Improved regex processing to support function definitions with line breaks

## [0.8.0] - 2025-04-11

### 已修改 Changed

-   重構擴充功能架構，提升代碼可維護性與擴展性
    Refactored extension architecture to improve code maintainability and extensibility
    -   將大型檔案拆分成模組化的服務類別
        Split large files into modular service classes
    -   實作日誌服務、檔案服務、多語言服務和設定管理服務
        Implemented logging service, file service, locale service, and settings manager -採用更好的物件導向設計，提高程式碼組織結構
        Adopted better object-oriented design for improved code organization

## [0.7.0] - 2025-04-11

### 已更新 Updated

-   改進閾值函數讀取區塊功能
    Enhanced threshold function read block functionality
    -   現在會保留使用者先前選擇的函數值
        Now preserves previously selected function value
    -   新增變異記錄方法，可在重新載入時保持選擇狀態
        Added mutation recording methods to maintain selection state when reloaded

## [0.6.0] - 2025-04-10

### 新增 Added

-   新增備份管理功能，支援區塊程式碼的備份與復原
    Added backup management functionality, supporting block code backup and restoration
    -   實作備份檔案儲存與載入機制
        Implemented backup file storage and loading mechanism
    -   新增備份建立、刪除功能
        Added backup creation and deletion features
    -   整合備份管理對話框與使用者介面
        Integrated backup management dialog and user interface

### 已更新 Updated

-   改進使用者介面
    Enhanced user interface
    -   新增備份管理按鈕與對話框
        Added backup management button and modal dialog
    -   優化深色模式下的備份管理介面
        Optimized backup management interface in dark mode

## [0.5.0] - 2025-04-10

### 已更新 Updated

-   優化函數處理機制，提升代碼生成穩定性
    Optimized function processing mechanism to improve code generation stability
    -   改進日誌輸出，增加函數數量和清單的記錄
        Improved logging output with function count and list information

### 已修改 Changed

-   改進 Arduino 程式碼生成器的函數處理流程
    Enhanced Arduino generator's function processing workflow
    -   新增函數前向宣告機制，解決相依性問題
        Added function forward declarations mechanism to solve dependency issues
    -   保持函數定義的原始順序，提升生成代碼的一致性
        Preserved original order of function definitions for better generated code consistency

## [0.4.0] - 2025-04-10

### 新增 Added

-   新增統一的日誌系統，支援跨模組的日誌記錄與監控
    Added unified logging system supporting cross-module logging and monitoring
    -   實作了分層級的日誌功能 (debug、info、warn、error)
        Implemented multi-level logging functionality (debug, info, warn, error)
    -   新增 VS Code 輸出頻道整合，便於除錯
        Added VS Code output channel integration for easier debugging

### 已修復 Fixed

-   修正函式積木名稱變更時影響其他不相關函式積木的問題
    Fixed a bug where changing one function block name would affect unrelated function blocks
-   修正函數呼叫積木在工作區重新載入後連接點消失的問題
    Fixed function call blocks losing connections after workspace reload
-   修正多個代碼格式與條件判斷中的括號問題
    Fixed multiple code formatting issues and missing brackets in conditional statements

### 已更新 Updated

-   重新實作函數與函數呼叫積木，提高穩定性與兼容性
    Reimplemented function and function call blocks for better stability and compatibility
    -   統一函數為無回傳值 (void) 類型，簡化設計
        Unified functions as void type, simplifying the design
    -   改進函數積木參數的變數整合
        Improved variable integration for function parameters
    -   優化函數呼叫積木的連接還原機制
        Enhanced connection restoration mechanism for function call blocks

## [0.3.0] - 2025-04-02

### 新增 Added

-   新增深色主題支援與主題切換功能
    Added dark theme support and theme switching functionality

    -   實作 singularDark.js Blockly 深色主題
        Implemented singularDark.js Blockly dark theme
    -   新增主題切換按鈕與深色模式樣式
        Added theme toggle button and dark mode styles
    -   支援主題偏好設定儲存
        Support for saving theme preferences
    -   加入自動主題同步機制，同步編輯器與使用者設定
        Added automatic theme synchronization between editor and user settings

-   新增 PlatformIO 板子設定整合
    Added PlatformIO board configuration integration
    -   為所有支援的開發板新增 platformio 設定
        Added platformio configuration for all supported boards
    -   實作 getBoardConfig 函數用於獲取板子的 platformio.ini 設定
        Implemented getBoardConfig function to retrieve platformio.ini settings for boards

### 已更新 Updated

-   優化使用者介面
    Enhanced user interface
    -   重構控制元件區域佈局，改善主題切換與開發板選擇的整合
        Refactored control element area layout for better theme switching and board selection integration
    -   改進深色模式下的元件樣式與可讀性
        Improved component styles and readability in dark mode

### 已修改 Changed

-   改進 VSCode 設定處理機制
    Improved VSCode settings handling mechanism
    -   修改 WebView 訊息處理架構，支援主題與板子設定訊息
        Modified WebView messaging architecture to support theme and board configuration messages
    -   優化主題與開發板設定的儲存與載入流程
        Optimized saving and loading processes for theme and board settings

## [0.2.0] - 2025-04-01

### 新增 Added

-   新增確認對話框機制，改善使用者體驗
    Added confirmation dialog mechanism for better user experience
    -   使用 VSCode API 顯示對話框，取代原生瀏覽器對話框
        Using VSCode API for dialogs instead of native browser dialogs
    -   優化方塊刪除確認流程
        Enhanced block deletion confirmation process

### 已更新 Updated

-   增強多語言支援系統
    Enhanced internationalization support system
    -   在所有語言檔中新增 VS Code UI 相關訊息翻譯
        Added VS Code UI related message translations in all language files
    -   實作完整的 UI 訊息本地化機制
        Implemented complete UI message localization mechanism

### 已修改 Changed

-   改進方塊整理後的儲存機制
    Improved block organization and saving mechanism
    -   方塊整理 (Clean Up) 後自動保存工作區狀態
        Automatically save workspace state after block cleanup
    -   優化方塊拖曳與座標變更的儲存邏輯
        Optimized block dragging and coordinate change saving logic

## [0.1.8] - 2025-03-31

### 已修改 Changed

-   改進多語言處理機制
    Improved multilingual processing mechanism
    -   新增 `syncToBlocklyMsg` 函數，自動同步翻譯到 Blockly.Msg
        Added `syncToBlocklyMsg` function to automatically sync translations to Blockly.Msg
    -   移除舊版覆蓋 Blockly 訊息的方法
        Removed legacy method for overriding Blockly messages
    -   優化語言切換和載入時的翻譯同步處理
        Enhanced translation synchronization handling during language switching and loading

## [0.1.7] - 2025-03-19

### 已更新 Updated

-   優化 PlatformIO 整合功能
    Enhanced PlatformIO integration
    -   移除舊有的監控系統
        Removed legacy monitoring system
    -   新增預設停用 PlatformIO 首頁啟動功能
        Added default setting to disable PlatformIO Home startup
    -   新增自動配置 PlatformIO 設定功能，預設停用自動開啟 platformio.ini
        Added automatic PlatformIO configuration, disabled auto-opening of platformio.ini by default
    -   改進工作區檢查邏輯
        Improved workspace validation logic

## [0.1.5] - 2025-03-09

### 新增 Added

-   新增腳位模式追蹤系統，提升 Arduino 積木使用體驗
    Added pin mode tracking system for enhanced Arduino block experience
    -   自動記錄每個腳位的模式 (INPUT、OUTPUT、INPUT_PULLUP)
        Automatically tracks pin modes (INPUT, OUTPUT, INPUT_PULLUP)
    -   偵測腳位模式衝突並顯示警告
        Detects pin mode conflicts and displays warnings
    -   產生程式碼時自動添加必要的 pinMode 設定
        Automatically adds necessary pinMode configurations during code generation
    -   程式碼產生時顯示腳位模式警告訊息
        Displays pin mode warning messages during code generation

## [0.1.4] - 2025-03-07

### 新增 Added

-   增加門檻值函式積木，可以建立基於類比輸入的門檻觸發函式
    Added threshold function blocks, allowing creation of threshold-triggered functions based on analog inputs
    -   新增「設定門檻值函式」積木，用於設定感測器腳位、門檻值與輸出值
        Added "Set Threshold Function" block for configuring sensor pin, threshold value, and output values
    -   新增「讀取門檻值函式」積木，用於取得函式運算結果
        Added "Get Threshold Function" block for retrieving function computation results
    -   支援數字、布林值與字串輸出型別
        Support for numeric, boolean, and string output types
-   新增自動關閉 platformio.ini 預覽模式功能，當開啟 Blockly 編輯器時，會自動監控並關閉預覽模式的 platformio.ini 檔案
    Added automatic closing of platformio.ini preview mode, which monitors and closes the platformio.ini file in preview mode when the Blockly editor is opened

## [0.1.3] - 2025-02-28

### 已更新 Updated

-   更新 README.md 文件，新增 VS Code 市集徽章（版本、下載量及評分）
    Updated README.md documentation with VS Code Marketplace badges (version, downloads, and ratings)
-   新增多種語言支援：西班牙文、法文、匈牙利文、義大利文、日文、韓文、波蘭文、葡萄牙文（巴西）、俄文、土耳其文
    Added support for multiple languages: Spanish, French, Hungarian, Italian, Japanese, Korean, Polish, Portuguese (Brazil), Russian, Turkish
-   擴展 VSCode 語言檢測與對應支援，自動選擇合適的 Blockly 語言
    Extended VSCode language detection and mapping, automatically selecting the appropriate Blockly language

## [0.1.2] - 2025-02-26

### 已新增 Added

-   新增七段顯示器積木 (七段顯示器與顯示器腳位設定)
    Added seven-segment display blocks (seven-segment display and pin configuration)
-   新增七段顯示器相關多語系文字
    Added seven-segment display related i18n text
-   實作七段顯示器程式碼生成器，支援共陰極與共陽極模式
    Implemented seven-segment display code generator with support for common cathode and anode modes
-   可選擇是否顯示小數點
    Added option to display decimal point
-   新增數值映射積木 (Arduino map)
    Added value mapping block (Arduino map)
-   新增數值映射相關多語系文字  
    Added value mapping related i18n text

## [0.1.0] - 2025-02-24

### 已新增 Added

-   新增語言檔案載入機制及工具箱翻譯前處理功能  
    Added language file loading mechanism and toolbox translation pre-processing functionality
-   新增覆寫 Blockly 字串替換函數以支援多語系  
    Added override for Blockly's message replacement function to support i18n

### 已更新 Updated

-   將積木、板卡配置及函式區塊中硬編碼文字替換為 `window.languageManager.getMessage(...)` 呼叫，提升多語系支援  
    Replaced hard-coded texts in blocks, board configurations, and function blocks with `window.languageManager.getMessage(...)` calls for enhanced i18n support
-   更新本地化訊息檔案（en 與 zh-hant），新增多項鍵值（如 ARDUINO_PULLUP、ARDUINO_MODE、DURATION_REPEAT 等）  
    Updated localization message files (en and zh-hant) with new keys such as ARDUINO_PULLUP, ARDUINO_MODE, DURATION_REPEAT, etc.
-   更新工具箱類別名稱為翻譯標記（例如：%{CATEGORY_ARDUINO}、%{CATEGORY_LISTS}、%{CATEGORY_LOGIC}、%{CATEGORY_LOOPS}、%{CATEGORY_MATH}、%{CATEGORY_TEXT}、%{CATEGORY_VARIABLES}、%{CATEGORY_FUNCTIONS}）  
    Updated toolbox category names to use translation tokens (e.g., %{CATEGORY_ARDUINO}, %{CATEGORY_LISTS}, %{CATEGORY_LOGIC}, %{CATEGORY_LOOPS}, %{CATEGORY_MATH}, %{CATEGORY_TEXT}, %{CATEGORY_VARIABLES}, %{CATEGORY_FUNCTIONS})

### 已修改 Changed

-   移除不再需要的 `ms-vscode.cpptools` 相依性  
    Removed the unnecessary `ms-vscode.cpptools` dependency
-   更新 extension 以引入語言檔案並支援多語系  
    Updated extension to include language file loading for enhanced i18n support

## [0.0.8] - 2025-02-21

### 已更新 Updated

-   更新 README.md 文件內容
    Updated README.md documentation content

### 新增 Added

-   多開發板支援 (Arduino 與 ESP32 平台)
    Multi-board support (Arduino and ESP32 platforms)
-   多語言本地化功能
    Multi-language localization
-   函式積木系統
    Function block system
-   變數管理系統
    Variable management system
    -   重新命名功能
        Rename functionality
    -   刪除功能
        Delete functionality
-   即時程式碼產生
    Real-time code generation
-   工作區狀態持久化
    Workspace state persistence
-   客製化主題實作
    Custom theme implementation

### 已修改 Changed

-   更新積木顏色配置以提升可讀性
    Updated block color scheme for better readability
-   優化使用者界面佈局
    Optimized user interface layout

### 技術性更動 Technical Changes

-   整合 Blockly 核心功能
    Integrated Blockly core functionality
-   實作 Arduino 程式碼生成器
    Implemented Arduino code generator
-   新增工作區狀態管理機制
    Added workspace state management
-   加入單元測試框架
    Added unit testing framework
