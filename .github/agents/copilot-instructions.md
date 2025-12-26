# singular-blockly Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-21

## Active Technologies
- JavaScript (ES6+) - WebView 環境 + Blockly 12.3.1, arduinoGenerator (自訂程式碼生成器) (012-esp32-pixetto-fix)
- JavaScript (ES2022) / TypeScript 5.9.3 + Blockly 12.3.1, VS Code Extension API 1.96.0+ (014-block-serialization-fix)
- JSON 檔案 (`{workspace}/blockly/main.json`) (014-block-serialization-fix)
- TypeScript 5.9.3 / JavaScript (ES2022) + VSCode Extension API 1.105.0+, @modelcontextprotocol/sdk (TypeScript SDK), Blockly 12.3.1 (015-mcp-server-integration)
- JSON 檔案 (`{workspace}/blockly/main.json`)、INI 檔案 (`platformio.ini`) (015-mcp-server-integration)
- TypeScript 5.9.3 (Extension), JavaScript ES2022 (WebView/Blockly) (016-esp32-wifi-mqtt)
- JSON 檔案（workspace 狀態存於 `{workspace}/blockly/main.json`） (016-esp32-wifi-mqtt)
- TypeScript 5.9.3 / JavaScript (ES2022+) + VSCode Extension API 1.105.0+, Blockly 12.3.1 (017-ctrl-s-quick-backup)
- JSON 檔案 (`{workspace}/blockly/backup/*.json`) (017-ctrl-s-quick-backup)
- TypeScript 5.9.3, JavaScript ES2023 + Blockly 12.3.1, VS Code API 1.105.0+ (018-fix-preview-board-config)
- JSON 檔案（備份格式: `{ workspace, board, theme }`） (018-fix-preview-board-config)
- TypeScript 5.9.3, JavaScript ES2023 + Blockly 12.3.1, VS Code API 1.105.0+ (019-empty-workspace-guard)
- JSON 檔案 (`blockly/main.json`, `blockly/main.json.bak`) (019-empty-workspace-guard)

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
- 019-empty-workspace-guard: Added TypeScript 5.9.3, JavaScript ES2023 + Blockly 12.3.1, VS Code API 1.105.0+
- 018-fix-preview-board-config: Added TypeScript 5.9.3, JavaScript ES2023 + Blockly 12.3.1, VS Code API 1.105.0+
- 017-ctrl-s-quick-backup: Added TypeScript 5.9.3 / JavaScript (ES2022+) + VSCode Extension API 1.105.0+, Blockly 12.3.1


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
