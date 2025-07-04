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
