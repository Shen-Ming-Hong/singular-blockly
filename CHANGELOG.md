# 更新日誌 Changelog

此專案所有重要更新都會記錄在此文件中。
All notable changes to this project will be documented in this file.

此格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
並且本專案遵循 [語意化版本](https://semver.org/lang/zh-TW/)。
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [未發布] - Unreleased

### 新增 Added

### 已修復 Fixed

### 已更新 Updated

### 已修改 Changed

## [0.20.0] - 2025-04-23

### 新增 Added

- 新增積木自動生成機制，讓特定積木類型無論位置都能生成代碼
  Added automatic block generation mechanism to ensure specific block types generate code regardless of their position
  - 新增 `alwaysGenerateBlocks_` 陣列用於管理必須生成的積木
    Added `alwaysGenerateBlocks_` array to manage blocks that must generate code
  - 提供 `registerAlwaysGenerateBlock` 輔助函數使各模組能註冊自身積木
    Provided `registerAlwaysGenerateBlock` helper function for modules to register their blocks

### 已更新 Updated

- 改進伺服馬達積木，從文字輸入改為下拉選單
  Improved servo motor blocks, changing from text input to dropdown menu
  - 自動顯示工作區中所有已設定的伺服馬達名稱
    Automatically displays all configured servo motor names in the workspace
  - 實現變異記錄功能，保存選擇的馬達值
    Implemented mutation recording to save selected motor values

### 已修改 Changed

- 改進代碼生成的日誌記錄，從 console.log 改為使用標準日誌服務
  Improved code generation logging, changing from console.log to standard logging service

## [0.19.0] - 2025-04-23

### 新增 Added

- 新增伺服馬達積木
  Added servo motor blocks
  - 支援伺服馬達設定與角度控制
    Support servo motor setup and angle control
  - 在所有支援的語言中加入馬達相關翻譯
    Add motor-related translations in all supported languages

### 已更新 Updated

- 改進函式庫依賴管理
  Improved library dependency management
  - 新增 `lib_deps_` 系統用於追蹤函式庫依賴
    Added `lib_deps_` system for tracking library dependencies
  - 自動在 platformio.ini 中同步函式庫依賴資訊
    Automatically synchronize library dependency information in platformio.ini

### 已修改 Changed

- 更新 Blockly 編輯器與預覽頁面，增加馬達積木的主題顏色
  Updated Blockly editor and preview page with motor block theme colors

## [0.18.0] - 2025-04-20

### 新增 Added

- 新增函數名稱轉換功能，支援將中文函數名稱轉換為合法的 C++ 函數名稱
  Added function name conversion functionality to support converting Chinese function names to valid C++ function names

### 已修復 Fixed

- 修復了函數名稱變更時的邏輯和連接恢復機制
  Fixed function name change logic and connection recovery mechanism

### 已更新 Updated

- 更新使用統一的日誌系統，取代直接使用 console 方法
  Updated to use unified logging system instead of direct console methods
- 改進了函數定義處理的正則表達式，使其更健壯
  Improved the regular expression for function definition processing to make it more robust

## [0.17.1] - 2025-04-19

### 新增 Added

- 新增複製貼上函數積木時的自動名稱處理功能，避免重複名稱
  Added automatic name handling when copy-pasting function blocks to avoid duplicate names
- 新增檢查防止建立同名函數，顯示警告並還原為原有名稱
  Added check to prevent creating functions with duplicate names, showing warning and reverting to original name

### 已修復 Fixed

- 優化函數複製貼上後的名稱處理邏輯，避免重複函數名稱引起的問題
  Optimized name handling logic after function block duplication to avoid issues caused by duplicate function names

## [0.17.0] - 2025-04-19

### 新增 Added

- 在預覽頁面中新增頁內標題更新功能，顯示更加一致的多語言標題
  Added in-page title update functionality in preview page for consistent multilingual title display

### 已更新 Updated

- 更新預覽頁面，新增對感測器區塊的支援
  Updated preview page to add support for sensor blocks

### 已改進 Improved

- 改進多語言訊息解析的正則表達式，支援更多格式的訊息定義
  Improved regex for multilingual message parsing to support more message definition formats
- 增強預覽視窗的多語言支援，統一視窗標題和頁內標題顯示
  Enhanced multilingual support for preview windows, unifying window title and in-page title display

## [0.16.1] - 2025-04-19

### 新增 Added

- 新增自動掃描機制，確保 threshold_function_setup 與 ultrasonic_sensor 設定積木正確初始化
  Added automatic scanning mechanism to ensure threshold_function_setup and ultrasonic_sensor setup blocks are properly initialized

### 已修復 Fixed

- 移除未使用的腳位模式追蹤全局物件，優化記憶體使用
  Removed unused pin mode tracking global object to optimize memory usage

## [0.16.0] - 2025-04-17

### 新增 Added

- 新增超音波觸發積木  
  Added independent ultrasonic trigger block

## [0.15.0] - 2025-04-17

### 新增 Added

- 新增超音波感測器積木
  Added ultrasonic sensor blocks
  - 支援設定 Trig 和 Echo 腳位
    Support setting Trig and Echo pins
  - 支援使用硬體中斷提高精確度
    Support using hardware interrupts for better accuracy
  - 支援不同開發板的硬體中斷腳位
    Support hardware interrupt pins for different boards

### 已更新 Updated

- 更新所有語言檔案，支援新增的感測器功能
  Updated all language files to support new sensor features
- 開發板配置增強：為所有支援的開發板新增硬體中斷腳位設定
  Enhanced board configurations: Added hardware interrupt pin configurations for all supported boards
- 更新積木顏色管理，使用主題樣式而非直接設置顏色
  Updated block color management to use theme styles instead of direct color setting
- 更新主題檔案，添加感測器區塊樣式
  Updated theme files to add sensor block styles

## [0.14.1] - 2025-04-16

### 已更新 Updated

- 改進備份管理界面的響應式設計
  Improved responsive design of backup management interface
  - 新增按鈕區域自動換行功能，提高在小視窗下的可用性
    Added button area auto-wrap functionality to improve usability in small windows
  - 添加按鈕之間的間距，優化換行後的視覺效果
    Added spacing between buttons to optimize visual appearance after wrapping

### 已修改 Changed

- 修改自動備份文件的命名格式
  Modified auto-backup file naming format
  - 從`auto_backup_before_restore_YYYYMMDD_HHMMSS`簡化為`auto_restore_YYYYMMDD_HHMMSS`
    Simplified from `auto_backup_before_restore_YYYYMMDD_HHMMSS` to `auto_restore_YYYYMMDD_HHMMSS`

## [0.14.0] - 2025-04-16

### 已更新 Updated

- 增強多語言支援功能
  Enhanced multilingual support functionality
  - 改進了使用者介面元素的多語言支援
    Improved multilingual support for user interface elements
  - 為備份管理視窗和預覽模式添加多語言支援
    Added multilingual support for backup management window and preview mode
  - 增強了從JS檔案中提取訊息的能力
    Enhanced ability to extract messages from JS files

## [0.13.2] - 2025-04-16

### 已修改 Changed

- 修改滑鼠滾輪設定，避免與縮放功能衝突
  Modified mouse wheel settings to avoid conflicts with zoom functionality
  - 在編輯器中禁用滾輪的移動功能
    Disabled wheel movement in the editor

## [0.13.1] - 2025-04-16

### 已修復 Fixed

- 修復程式碼生成器中的運算優先順序問題
  Fixed operator precedence issues in code generators
  - 在邏輯比較運算中加入括號以確保運算優先順序正確
    Added parentheses to logic comparison operations to ensure correct operator precedence
  - 在邏輯運算（AND、OR）中加入括號
    Added parentheses to logic operations (AND, OR)
  - 在邏輯否定運算中加入括號
    Added parentheses to logic negation operations
  - 修正 while-until 迴圈中的條件判斷加入括號
    Fixed condition evaluation in while-until loops by adding parentheses

## [0.13.0] - 2025-04-16

### 已修改 Changed

- 移除預覽模式中的複製功能
  Removed copy functionality from preview mode
  - 將預覽工作區設為完全唯讀模式
    Set preview workspace to fully read-only mode
  - 移除相關的複製界面元素和提示文字
    Removed related copy UI elements and prompt text
  - 清理不再需要的複製成功提示樣式和腳本
    Cleaned up no longer needed copy success notification styles and scripts

## [0.12.0] - 2025-04-13

### 新增 Added

- 新增備份預覽功能
  Added backup preview functionality
  - 用戶現在可以直接在閱讀模式中預覽備份檔案，不需要先還原
    Users can now preview backup files in read mode without having to restore them first
  - 新增 blocklyPreview.html 和 blocklyPreview.js 實現預覽視窗功能
    Added blocklyPreview.html and blocklyPreview.js to implement preview window functionality
  - 在備份管理面板中新增預覽按鈕，點擊即可在新視窗中查看備份內容
    Added preview button in the backup management panel for viewing backup content in a new window
  
### 已更新 Updated

- 改進 UI 元素設計和互動體驗
  Improved UI element design and interaction experience
  - 優化備份操作按鈕的視覺效果，添加圖標提高可識別性
    Optimized the visual effects of backup operation buttons, adding icons to improve recognizability
  - 更新主題命名系統，從 dark-mode/light-mode 改為 theme-dark/theme-light
    Updated theme naming system from dark-mode/light-mode to theme-dark/theme-light
  - 改進複製功能，新增成功提示訊息
    Improved copy functionality with success notification messages

## [0.11.0] - 2025-04-12

### 新增 Added

- 新增獲取檔案時間戳功能
  Added file timestamp retrieval functionality
  - 在 FileService 中新增 getFileStats 方法，可獲取檔案的完整時間戳資訊
    Added getFileStats method in FileService to retrieve complete timestamp information for files
  
### 已更新 Updated

- 改進備份檔案處理機制
  Improved backup file handling mechanism
  - 備份列表現在顯示真實的檔案創建時間和大小
    Backup list now displays actual file creation time and size
  - 優化備份檔案路徑管理，便於後續功能擴展
    Optimized backup file path management for future feature extensions

## [0.10.0] - 2025-04-11

### 新增 Added

- 新增備份還原功能
  Added backup restoration feature
  - 用戶現在可以透過界面還原之前創建的備份
    Users can now restore previously created backups through the interface
  - 在還原前自動創建臨時備份，確保操作安全
    Temporary backups are automatically created before restoration to ensure operation safety
  - 新增還原按鈕和相應的視覺樣式
    Added restoration button and corresponding visual styles

## [0.9.0] - 2025-04-11

### 新增 Added

- 新增自動檢測需要 Serial 初始化的積木功能
  Added automatic detection for blocks requiring Serial initialization
  - 當工作區中存在 text_print 或 text_prompt_ext 積木時，自動添加 Serial.begin(9600)
    Automatically adds Serial.begin(9600) when text_print or text_prompt_ext blocks exist in workspace
  - 優化代碼生成流程，提高用戶體驗
    Optimized code generation process for better user experience

## [0.8.1] - 2025-04-11

### 已修復 Fixed

- 修復門檻值函數讀取區塊功能問題
  Fixed threshold function read block issues
  - 增強變異記錄與恢復機制，解決運行時選項保存問題
    Enhanced mutation recording and restoration mechanism to solve runtime option preservation issues
  - 改進正則表達式處理，支援含有換行符的函式定義
    Improved regex processing to support function definitions with line breaks

## [0.8.0] - 2025-04-11

### 已修改 Changed

- 重構擴充功能架構，提升代碼可維護性與擴展性
  Refactored extension architecture to improve code maintainability and extensibility
  - 將大型檔案拆分成模組化的服務類別
    Split large files into modular service classes
  - 實作日誌服務、檔案服務、多語言服務和設定管理服務
    Implemented logging service, file service, locale service, and settings manager
  -採用更好的物件導向設計，提高程式碼組織結構
    Adopted better object-oriented design for improved code organization

## [0.7.0] - 2025-04-11

### 已更新 Updated

- 改進閾值函數讀取區塊功能
  Enhanced threshold function read block functionality
  - 現在會保留使用者先前選擇的函數值
    Now preserves previously selected function value
  - 新增變異記錄方法，可在重新載入時保持選擇狀態
    Added mutation recording methods to maintain selection state when reloaded

## [0.6.0] - 2025-04-10

### 新增 Added

- 新增備份管理功能，支援區塊程式碼的備份與復原
  Added backup management functionality, supporting block code backup and restoration
  - 實作備份檔案儲存與載入機制
    Implemented backup file storage and loading mechanism
  - 新增備份建立、刪除功能
    Added backup creation and deletion features
  - 整合備份管理對話框與使用者介面
    Integrated backup management dialog and user interface

### 已更新 Updated

- 改進使用者介面
  Enhanced user interface
  - 新增備份管理按鈕與對話框
    Added backup management button and modal dialog
  - 優化深色模式下的備份管理介面
    Optimized backup management interface in dark mode

## [0.5.0] - 2025-04-10

### 已更新 Updated

- 優化函數處理機制，提升代碼生成穩定性
  Optimized function processing mechanism to improve code generation stability
  - 改進日誌輸出，增加函數數量和清單的記錄
    Improved logging output with function count and list information

### 已修改 Changed

- 改進 Arduino 程式碼生成器的函數處理流程
  Enhanced Arduino generator's function processing workflow
  - 新增函數前向宣告機制，解決相依性問題
    Added function forward declarations mechanism to solve dependency issues
  - 保持函數定義的原始順序，提升生成代碼的一致性
    Preserved original order of function definitions for better generated code consistency

## [0.4.0] - 2025-04-10

### 新增 Added

- 新增統一的日誌系統，支援跨模組的日誌記錄與監控
  Added unified logging system supporting cross-module logging and monitoring
  - 實作了分層級的日誌功能 (debug、info、warn、error)
    Implemented multi-level logging functionality (debug, info, warn, error)
  - 新增 VS Code 輸出頻道整合，便於除錯
    Added VS Code output channel integration for easier debugging

### 已修復 Fixed

- 修正函式積木名稱變更時影響其他不相關函式積木的問題
  Fixed a bug where changing one function block name would affect unrelated function blocks
- 修正函數呼叫積木在工作區重新載入後連接點消失的問題
  Fixed function call blocks losing connections after workspace reload
- 修正多個代碼格式與條件判斷中的括號問題
  Fixed multiple code formatting issues and missing brackets in conditional statements

### 已更新 Updated

- 重新實作函數與函數呼叫積木，提高穩定性與兼容性
  Reimplemented function and function call blocks for better stability and compatibility
  - 統一函數為無回傳值 (void) 類型，簡化設計
    Unified functions as void type, simplifying the design
  - 改進函數積木參數的變數整合
    Improved variable integration for function parameters
  - 優化函數呼叫積木的連接還原機制
    Enhanced connection restoration mechanism for function call blocks

## [0.3.0] - 2025-04-02

### 新增 Added

- 新增深色主題支援與主題切換功能
  Added dark theme support and theme switching functionality
  - 實作 singularDark.js Blockly 深色主題
    Implemented singularDark.js Blockly dark theme
  - 新增主題切換按鈕與深色模式樣式
    Added theme toggle button and dark mode styles
  - 支援主題偏好設定儲存
    Support for saving theme preferences
  - 加入自動主題同步機制，同步編輯器與使用者設定
    Added automatic theme synchronization between editor and user settings

- 新增 PlatformIO 板子設定整合
  Added PlatformIO board configuration integration
  - 為所有支援的開發板新增 platformio 設定
    Added platformio configuration for all supported boards
  - 實作 getBoardConfig 函數用於獲取板子的 platformio.ini 設定
    Implemented getBoardConfig function to retrieve platformio.ini settings for boards

### 已更新 Updated

- 優化使用者介面
  Enhanced user interface
  - 重構控制元件區域佈局，改善主題切換與開發板選擇的整合
    Refactored control element area layout for better theme switching and board selection integration
  - 改進深色模式下的元件樣式與可讀性
    Improved component styles and readability in dark mode

### 已修改 Changed

- 改進 VSCode 設定處理機制
  Improved VSCode settings handling mechanism
  - 修改 WebView 訊息處理架構，支援主題與板子設定訊息
    Modified WebView messaging architecture to support theme and board configuration messages
  - 優化主題與開發板設定的儲存與載入流程
    Optimized saving and loading processes for theme and board settings

## [0.2.0] - 2025-04-01

### 新增 Added

- 新增確認對話框機制，改善使用者體驗
  Added confirmation dialog mechanism for better user experience
  - 使用 VSCode API 顯示對話框，取代原生瀏覽器對話框
    Using VSCode API for dialogs instead of native browser dialogs
  - 優化方塊刪除確認流程
    Enhanced block deletion confirmation process

### 已更新 Updated

- 增強多語言支援系統
  Enhanced internationalization support system
  - 在所有語言檔中新增 VS Code UI 相關訊息翻譯
    Added VS Code UI related message translations in all language files
  - 實作完整的 UI 訊息本地化機制
    Implemented complete UI message localization mechanism

### 已修改 Changed

- 改進方塊整理後的儲存機制
  Improved block organization and saving mechanism
  - 方塊整理 (Clean Up) 後自動保存工作區狀態
    Automatically save workspace state after block cleanup
  - 優化方塊拖曳與座標變更的儲存邏輯
    Optimized block dragging and coordinate change saving logic

## [0.1.8] - 2025-03-31

### 已修改 Changed

- 改進多語言處理機制
  Improved multilingual processing mechanism
  - 新增 `syncToBlocklyMsg` 函數，自動同步翻譯到 Blockly.Msg
    Added `syncToBlocklyMsg` function to automatically sync translations to Blockly.Msg
  - 移除舊版覆蓋 Blockly 訊息的方法
    Removed legacy method for overriding Blockly messages
  - 優化語言切換和載入時的翻譯同步處理
    Enhanced translation synchronization handling during language switching and loading

## [0.1.7] - 2025-03-19

### 已更新 Updated

- 優化 PlatformIO 整合功能
  Enhanced PlatformIO integration
  - 移除舊有的監控系統
    Removed legacy monitoring system
  - 新增預設停用 PlatformIO 首頁啟動功能
    Added default setting to disable PlatformIO Home startup
  - 新增自動配置 PlatformIO 設定功能，預設停用自動開啟 platformio.ini
    Added automatic PlatformIO configuration, disabled auto-opening of platformio.ini by default
  - 改進工作區檢查邏輯
    Improved workspace validation logic

## [0.1.5] - 2025-03-09

### 新增 Added

- 新增腳位模式追蹤系統，提升 Arduino 積木使用體驗
  Added pin mode tracking system for enhanced Arduino block experience
  - 自動記錄每個腳位的模式 (INPUT、OUTPUT、INPUT_PULLUP)
    Automatically tracks pin modes (INPUT, OUTPUT, INPUT_PULLUP)
  - 偵測腳位模式衝突並顯示警告
    Detects pin mode conflicts and displays warnings
  - 產生程式碼時自動添加必要的 pinMode 設定
    Automatically adds necessary pinMode configurations during code generation
  - 程式碼產生時顯示腳位模式警告訊息
    Displays pin mode warning messages during code generation

## [0.1.4] - 2025-03-07

### 新增 Added

- 增加門檻值函式積木，可以建立基於類比輸入的門檻觸發函式
  Added threshold function blocks, allowing creation of threshold-triggered functions based on analog inputs
  - 新增「設定門檻值函式」積木，用於設定感測器腳位、門檻值與輸出值
      Added "Set Threshold Function" block for configuring sensor pin, threshold value, and output values
  - 新增「讀取門檻值函式」積木，用於取得函式運算結果
      Added "Get Threshold Function" block for retrieving function computation results
  - 支援數字、布林值與字串輸出型別
      Support for numeric, boolean, and string output types
- 新增自動關閉 platformio.ini 預覽模式功能，當開啟 Blockly 編輯器時，會自動監控並關閉預覽模式的 platformio.ini 檔案
  Added automatic closing of platformio.ini preview mode, which monitors and closes the platformio.ini file in preview mode when the Blockly editor is opened

## [0.1.3] - 2025-02-28

### 已更新 Updated

- 更新 README.md 文件，新增 VS Code 市集徽章（版本、下載量及評分）
  Updated README.md documentation with VS Code Marketplace badges (version, downloads, and ratings)
- 新增多種語言支援：西班牙文、法文、匈牙利文、義大利文、日文、韓文、波蘭文、葡萄牙文（巴西）、俄文、土耳其文
  Added support for multiple languages: Spanish, French, Hungarian, Italian, Japanese, Korean, Polish, Portuguese (Brazil), Russian, Turkish
- 擴展 VSCode 語言檢測與對應支援，自動選擇合適的 Blockly 語言
  Extended VSCode language detection and mapping, automatically selecting the appropriate Blockly language

## [0.1.2] - 2025-02-26

### 已新增 Added

- 新增七段顯示器積木 (七段顯示器與顯示器腳位設定)
  Added seven-segment display blocks (seven-segment display and pin configuration)
- 新增七段顯示器相關多語系文字
  Added seven-segment display related i18n text
- 實作七段顯示器程式碼生成器，支援共陰極與共陽極模式
  Implemented seven-segment display code generator with support for common cathode and anode modes
- 可選擇是否顯示小數點
  Added option to display decimal point
- 新增數值映射積木 (Arduino map)
  Added value mapping block (Arduino map)
- 新增數值映射相關多語系文字  
  Added value mapping related i18n text

## [0.1.0] - 2025-02-24

### 已新增 Added

- 新增語言檔案載入機制及工具箱翻譯前處理功能  
  Added language file loading mechanism and toolbox translation pre-processing functionality
- 新增覆寫 Blockly 字串替換函數以支援多語系  
  Added override for Blockly's message replacement function to support i18n

### 已更新 Updated

- 將積木、板卡配置及函式區塊中硬編碼文字替換為 `window.languageManager.getMessage(...)` 呼叫，提升多語系支援  
  Replaced hard-coded texts in blocks, board configurations, and function blocks with `window.languageManager.getMessage(...)` calls for enhanced i18n support
- 更新本地化訊息檔案（en 與 zh-hant），新增多項鍵值（如 ARDUINO_PULLUP、ARDUINO_MODE、DURATION_REPEAT 等）  
  Updated localization message files (en and zh-hant) with new keys such as ARDUINO_PULLUP, ARDUINO_MODE, DURATION_REPEAT, etc.
- 更新工具箱類別名稱為翻譯標記（例如：%{CATEGORY_ARDUINO}、%{CATEGORY_LISTS}、%{CATEGORY_LOGIC}、%{CATEGORY_LOOPS}、%{CATEGORY_MATH}、%{CATEGORY_TEXT}、%{CATEGORY_VARIABLES}、%{CATEGORY_FUNCTIONS}）  
  Updated toolbox category names to use translation tokens (e.g., %{CATEGORY_ARDUINO}, %{CATEGORY_LISTS}, %{CATEGORY_LOGIC}, %{CATEGORY_LOOPS}, %{CATEGORY_MATH}, %{CATEGORY_TEXT}, %{CATEGORY_VARIABLES}, %{CATEGORY_FUNCTIONS})

### 已修改 Changed

- 移除不再需要的 `ms-vscode.cpptools` 相依性  
  Removed the unnecessary `ms-vscode.cpptools` dependency
- 更新 extension 以引入語言檔案並支援多語系  
  Updated extension to include language file loading for enhanced i18n support

## [0.0.8] - 2025-02-21

### 已更新 Updated

- 更新 README.md 文件內容
  Updated README.md documentation content

### 新增 Added

- 多開發板支援 (Arduino 與 ESP32 平台)
  Multi-board support (Arduino and ESP32 platforms)
- 多語言本地化功能
  Multi-language localization
- 函式積木系統
  Function block system
- 變數管理系統
  Variable management system
  - 重新命名功能
    Rename functionality
  - 刪除功能
    Delete functionality
- 即時程式碼產生
  Real-time code generation
- 工作區狀態持久化
  Workspace state persistence
- 客製化主題實作
  Custom theme implementation

### 已修改 Changed

- 更新積木顏色配置以提升可讀性
  Updated block color scheme for better readability
- 優化使用者界面佈局
  Optimized user interface layout

### 技術性更動 Technical Changes

- 整合 Blockly 核心功能
  Integrated Blockly core functionality
- 實作 Arduino 程式碼生成器
  Implemented Arduino code generator
- 新增工作區狀態管理機制
  Added workspace state management
- 加入單元測試框架
  Added unit testing framework
