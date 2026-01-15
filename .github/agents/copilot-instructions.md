# singular-blockly Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-21

## Active Technologies
- TypeScript 5.9.3 (Extension) + JavaScript (Blockly blocks/generators) + Blockly 12.3.1, VSCode API 1.105.0+, MicroPython `rc_module` API (028-x12-rc-blocks)
- N/A (使用現有 blockly/main.json 儲存工作區狀態) (028-x12-rc-blocks)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (029-espnow-rc-pairing)
- TypeScript 5.9.3 (Extension) / JavaScript ES6 (Blockly) / MicroPython (Generated) + Blockly 12.3.1, VSCode API 1.105.0+, MicroPython espnow module (029-espnow-rc-pairing)
- JSON (blockly/main.json workspace state) (029-espnow-rc-pairing)

-   JavaScript (ES6+) - WebView 環境 + Blockly 12.3.1, arduinoGenerator (自訂程式碼生成器) (012-esp32-pixetto-fix)
-   JavaScript (ES2022) / TypeScript 5.9.3 + Blockly 12.3.1, VS Code Extension API 1.96.0+ (014-block-serialization-fix)
-   JSON 檔案 (`{workspace}/blockly/main.json`) (014-block-serialization-fix)
-   TypeScript 5.9.3 / JavaScript (ES2022) + VSCode Extension API 1.105.0+, @modelcontextprotocol/sdk (TypeScript SDK), Blockly 12.3.1 (015-mcp-server-integration)
-   JSON 檔案 (`{workspace}/blockly/main.json`)、INI 檔案 (`platformio.ini`) (015-mcp-server-integration)
-   TypeScript 5.9.3 (Extension), JavaScript ES2022 (WebView/Blockly) (016-esp32-wifi-mqtt)
-   JSON 檔案（workspace 狀態存於 `{workspace}/blockly/main.json`） (016-esp32-wifi-mqtt)
-   TypeScript 5.9.3 / JavaScript (ES2022+) + VSCode Extension API 1.105.0+, Blockly 12.3.1 (017-ctrl-s-quick-backup)
-   JSON 檔案 (`{workspace}/blockly/backup/*.json`) (017-ctrl-s-quick-backup)
-   TypeScript 5.9.3, JavaScript ES2023 + Blockly 12.3.1, VS Code API 1.105.0+ (018-fix-preview-board-config)
-   JSON 檔案（備份格式: `{ workspace, board, theme }`） (018-fix-preview-board-config)
-   TypeScript 5.9.3, JavaScript ES2023 + Blockly 12.3.1, VS Code API 1.105.0+ (019-empty-workspace-guard)
-   JSON 檔案 (`blockly/main.json`, `blockly/main.json.bak`) (019-empty-workspace-guard)
-   JavaScript (ES6+), TypeScript 5.9.3 + Google Blockly 12.3.1, VSCode Extension API 1.105.0+ (020-fix-huskylens-rxtx)
-   Workspace JSON 檔案 (`blockly/main.json`) (020-fix-huskylens-rxtx)
-   TypeScript 5.9.3 (Extension) + JavaScript (WebView/Blockly) + Blockly 12.3.1, VS Code API 1.105.0+, mpremote (MicroPython 工具) (021-cyberbrick-micropython)
-   工作區 `blockly/main.json`（積木狀態）、`blockly/backups/`（備份目錄） (021-cyberbrick-micropython)
-   TypeScript 5.9.3 + JavaScript (WebView) + MicroPython (生成) + Blockly 12.3.1, VS Code Extension API 1.105.0+, mpremote 1.20+ (021-cyberbrick-micropython)
-   `{workspace}/blockly/main.json`（工作區）, `{workspace}/blockly/backups/`（備份） (021-cyberbrick-micropython)
-   JavaScript (ES6+), MicroPython 目標程式碼 + Blockly 12.3.1, 現有 `micropythonGenerator` 生成器框架 (022-micropython-custom-function)
-   N/A（純程式碼生成，無儲存需求） (022-micropython-custom-function)
-   JavaScript (Node.js 22+), TypeScript 5.9.3 + Node.js fs 模組、glob 模式匹配 (023-i18n-audit-optimization)
-   JSON 檔案 (audit-whitelist.json)、JS 模組 (messages.js) (023-i18n-audit-optimization)
-   TypeScript 5.9.3 + VSCode Extension API 1.105.0+, Blockly 12.3.1 (024-i18n-hardcode-fix)
-   JSON 翻譯檔案 (`media/locales/{lang}/messages.js`) (024-i18n-hardcode-fix)
-   TypeScript 5.9.3 (Extension) / JavaScript ES2022 (WebView) + Blockly 12.3.1, VSCode API 1.105.0+, MCP SDK 1.24.3 (025-fix-drag-reload-crash)
-   JSON 檔案 (`main.json` 工作區狀態, `.bak` 備份) (025-fix-drag-reload-crash)
-   TypeScript 5.9.3 | JavaScript ES6+ + Blockly 12.3.1 | VSCode API 1.105.0+ | PlatformIO CLI (026-unified-upload-ui)
-   JSON 檔案 (blockly/main.json, platformio.ini) (026-unified-upload-ui)
-   TypeScript 5.9.3 (Extension) / JavaScript (WebView) + Blockly 12.3.1 | VSCode API 1.105.0+ | MicroPython (027-cyberbrick-x11-blocks)
-   JSON 檔案 (`{workspace}/blockly/main.json`), `{workspace}/blockly/backups/`（備份） (027-cyberbrick-x11-blocks)

-   TypeScript 5.9.3 (Extension), JavaScript ES2020 (WebView/Blockly) (011-esp32-pwm-setup)

## Project Structure

```text
src/                # Extension Host (TypeScript)
  extension.ts      # Main entry point
  services/         # Core services (fileService, settingsManager, etc.)
  webview/          # WebView management (webviewManager, messageHandler)
  test/suite/       # Test files
media/              # WebView (JavaScript/HTML/CSS)
  blockly/          # Blockly blocks & generators
  js/               # blocklyEdit.js, blocklyPreview.js
  html/             # blocklyEdit.html, blocklyPreview.html
  locales/          # i18n translations
specs/              # Feature specifications
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.9.3 (Extension), JavaScript ES2020 (WebView/Blockly): Follow standard conventions

## Recent Changes
- 029-espnow-rc-pairing: Added TypeScript 5.9.3 (Extension) / JavaScript ES6 (Blockly) / MicroPython (Generated) + Blockly 12.3.1, VSCode API 1.105.0+, MicroPython espnow module
- 029-espnow-rc-pairing: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]
- 028-x12-rc-blocks: Added TypeScript 5.9.3 (Extension) + JavaScript (Blockly blocks/generators) + Blockly 12.3.1, VSCode API 1.105.0+, MicroPython `rc_module` API


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
