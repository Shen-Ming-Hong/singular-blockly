# 更新日誌 Changelog

此專案所有重要更新都會記錄在此文件中。
All notable changes to this project will be documented in this file.

此格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
並且本專案遵循 [語意化版本](https://semver.org/lang/zh-TW/)。
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [未發布] - Unreleased

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
