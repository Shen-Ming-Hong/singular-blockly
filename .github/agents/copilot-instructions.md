# singular-blockly Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-21

## Active Technologies

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

-   011-esp32-pwm-setup: Added TypeScript 5.9.3 (Extension), JavaScript ES2020 (WebView/Blockly)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
