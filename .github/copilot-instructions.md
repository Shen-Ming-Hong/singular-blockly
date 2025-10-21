# Singular Blockly - AI Coding Agent Instructions

## Language Convention

**IMPORTANT**: When interacting with users, always respond in **Traditional Chinese (繁體中文)** unless the user explicitly requests otherwise. This instruction file is written in English for technical standardization, but all conversational responses should be in Traditional Chinese.

## Project Overview

**Singular Blockly** is a VSCode extension that provides visual programming for Arduino development using Google Blockly. The extension generates Arduino C++ code and integrates with PlatformIO for hardware deployment.

### Technology Stack

-   **Blockly**: 12.3.1 (upgraded from 11.2.2)
-   **@blockly/theme-modern**: 7.0.1 (upgraded from 6.0.12)
-   **TypeScript**: 5.9.3
-   **Node.js**: 22.16.0+
-   **VS Code Engine**: 1.96.0+
-   **Webpack**: 5.102.1

**Upgrade Notes (Blockly 12.x)**:

-   All core APIs maintain backward compatibility (inject, serialization, events, themes)
-   Workspace JSON format unchanged - existing `main.json` files load seamlessly
-   Theme structure fully compatible - custom themes require no modifications
-   Only breaking change: CSS icon class names converted to camelCase (check `media/css/*.css`)

### Core Architecture

```
Extension Host (Node.js)           WebView (Browser Context)
├── extension.ts                   ├── blocklyEdit.html
├── webview/                       ├── blocklyEdit.js
│   ├── webviewManager.ts         └── blockly/
│   └── messageHandler.ts             ├── blocks/*.js (定義積木)
└── services/                         └── generators/arduino/*.js (生成程式碼)
    ├── fileService.ts
    ├── settingsManager.ts
    ├── localeService.ts
    └── logging.ts
```

**Critical Entry Points**: Before modifying ANY code, read these three files in order:

1. `src/extension.ts` - Extension activation & command registration
2. `media/html/blocklyEdit.html` - WebView structure & initialization
3. `media/js/blocklyEdit.js` - Blockly workspace logic & event handling

## Key Architectural Patterns

### 1. Extension ↔ WebView Communication

**Message-Based Architecture**: The extension and WebView communicate via `postMessage` API:

```typescript
// Extension → WebView
panel.webview.postMessage({ command: 'loadWorkspace', state: {...} });

// WebView → Extension
vscode.postMessage({ command: 'saveWorkspace', state: {...} });
```

**Handler Pattern**: `WebViewMessageHandler` (in `messageHandler.ts`) processes all WebView messages using a switch-case pattern. Add new message handlers following this structure:

```typescript
case 'newCommand':
    await this.handleNewCommand(message);
    break;
```

### 2. Service Layer Pattern

All file I/O and settings go through service classes:

-   **FileService**: All file operations (read/write/copy/delete)
-   **SettingsManager**: VSCode settings & PlatformIO configuration
-   **LocaleService**: i18n message loading & language detection
-   **logging**: Unified logging (`log.info/error/warn/debug`)

**Never** use `fs` or `console.log` directly - always use these services.

### 3. Blockly Block Definition Pattern

Each hardware feature has two parts:

**Block Definition** (`media/blockly/blocks/*.js`):

```javascript
Blockly.Blocks['block_name'] = {
	init: function () {
		this.appendDummyInput().appendField('Block Label');
		this.setColour(230);
	},
};
```

**Code Generator** (`media/blockly/generators/arduino/*.js`):

```javascript
arduinoGenerator.forBlock['block_name'] = function (block) {
	return 'generated C++ code\n';
};
```

**Important**: Block types and generator names must match exactly.

**Blockly 12.x API Compatibility**:

-   `Blockly.Blocks[]` registry: Unchanged from v11
-   `arduinoGenerator.forBlock[]` pattern: Unchanged from v11
-   Block definition structure: Fully compatible
-   All existing blocks work without modification

## Multi-Board Support System

The extension supports multiple Arduino boards (Uno, Nano, Mega, ESP32, Super Mini). Board configurations are in `media/blockly/blocks/board_configs.js`:

```javascript
window.BOARD_CONFIGS = {
    'arduino_uno': { name: 'Arduino Uno', platform: 'atmelavr', board: 'uno', ... }
};
```

**Board-Specific Code Generation**: Use `window.currentBoard` in generators to emit board-specific code:

```javascript
if (window.currentBoard === 'esp32') {
	// ESP32 specific code
} else {
	// Arduino specific code
}
```

## State Management & Persistence

### Workspace State

-   Saved to: `{workspace}/blockly/main.json`
-   Structure: `{ workspace: {...}, board: 'arduino_uno', theme: 'light' }`
-   Auto-saves on every block change

**Serialization API (Blockly 12.x)**:

```javascript
// Save workspace (unchanged from v11)
const state = Blockly.serialization.workspaces.save(workspace);

// Load workspace (unchanged from v11)
Blockly.serialization.workspaces.load(state, workspace);
```

**Backward Compatibility**: Blockly 12 can load JSON files created by Blockly 11 without modification. The serialization format remains identical.

### PlatformIO Integration

-   Configuration: `{workspace}/platformio.ini`
-   Auto-generated when board is selected
-   **Library Dependencies**: Managed via `arduinoGenerator.lib_deps_` array
-   **Build Flags**: Managed via `arduinoGenerator.build_flags_` array

**Adding Library Dependencies**:

```javascript
arduinoGenerator.lib_deps_.push('library-name@version');
arduinoGenerator.build_flags_.push('-DFLAG_NAME');
```

These are synced to `platformio.ini` automatically via `SettingsManager.syncPlatformIOSettings()`.

## Internationalization (i18n)

### Language Files Structure

-   Extension messages: `media/locales/{lang}/messages.js`
-   Blockly core: `node_modules/blockly/msg/{lang}.js`

### Message Loading Flow

1. `LocaleService` detects VSCode language
2. Maps to Blockly language code (e.g., `zh-tw` → `zh-hant`)
3. Injects both custom and Blockly messages into WebView
4. `window.languageManager.getMessage(key, default)` retrieves messages

**Adding New Translatable Text**:

1. Add key to all `media/locales/*/messages.js` files
2. Use `languageManager.getMessage('KEY', 'fallback')` in JS
3. Use `localeService.getLocalizedMessage('KEY', default)` in TS

## Development Workflows

### Building & Testing

```powershell
npm run watch          # Watch mode for development
npm run compile        # One-time compilation
npm run test          # Run test suite
```

### Debugging WebView

1. Open extension in Extension Development Host (F5)
2. In the WebView panel: Right-click → "Open Developer Tools"
3. Use `console.log` in browser context (WebView)
4. Use `log.info/error` for extension-side logs (Output Channel: "Singular Blockly")

### Adding New Blockly Blocks

**Complete Workflow**:

1. Define block in `media/blockly/blocks/{category}.js`
2. Add generator in `media/blockly/generators/arduino/{category}.js`
3. Add to toolbox: `media/toolbox/categories/{category}.json`
4. Add i18n messages for all languages
5. Update `arduinoModules` array in `webviewManager.ts` if new generator file

**Example - New Sensor Block**:

```javascript
// 1. blocks/sensors.js
Blockly.Blocks['sensor_read'] = {
    init: function() {
        this.appendDummyInput()
            .appendField(Blockly.Msg['SENSOR_READ'] || '讀取感測器');
        this.setOutput(true, 'Number');
        this.setColour(160);
    }
};

// 2. generators/arduino/sensors.js
arduinoGenerator.forBlock['sensor_read'] = function(block) {
    return ['analogRead(A0)', arduinoGenerator.ORDER_ATOMIC];
};

// 3. toolbox/categories/sensors.json
{
    "kind": "block",
    "type": "sensor_read"
}

// 4. locales/*/messages.js
'SENSOR_READ': 'Read Sensor'
```

## Critical Conventions

### Logging Standards

-   **Extension context**: `log.info/error/debug/warn()` (never `console.log`)
-   **WebView context**: `console.log` OK (browser environment)
-   **Always include context**: `log.info('Saving workspace', { board, theme })`

### Code Generation Comments

Add descriptive comments in generated Arduino code:

```javascript
const comment = '// 設定伺服馬達到 90 度\n';
return comment + `servo.write(90);\n`;
```

### MCP Tool Usage (REQUIRED Before Implementation)

**Before adding/modifying ANY Blockly or VSCode API code**:

1. Use `resolve-library-id` to find library (e.g., "blockly", "vscode")
2. Use `get-library-docs` to fetch latest API documentation
3. Use `webSearch` for breaking changes and migration guides
4. Document findings in code comments or commit messages

Example workflow:

```typescript
// Before: Adding new Blockly theme feature
// 1. Checked Blockly v12.3.1 docs via MCP: setTheme() API confirmed
// 2. Verified theme format via get-library-docs: Theme interface structure
// Implementation:
Blockly.getMainWorkspace().setTheme(window.SingularBlocklyDarkTheme);
```

**Blockly 12.x API Reference**:

-   Workspace initialization: `Blockly.inject(container, options)` - unchanged
-   Event system: `Blockly.Events.*` - internal improvements, external API compatible
-   Theme system: `Blockly.Theme.defineTheme()` - fully compatible
-   TypeScript definitions: Built-in (no `@types/blockly` needed)

### File Organization

-   Services in `src/services/` - reusable, testable logic
-   WebView logic in `src/webview/` - WebView-specific handlers
-   Blockly files in `media/blockly/` - visual programming definitions
-   Tests mirror source structure in `src/test/`

### Simplicity Principles

-   **Avoid over-engineering**: Implement only what's needed
-   **Readable > Clever**: Clear code beats complex optimizations
-   **Modular but pragmatic**: Create services for shared logic, not every function
-   **Extensible interfaces**: Design for future boards/sensors without rewriting

## Common Pitfalls

1. **WebView URI Conversion**: Always use `webview.asWebviewUri()` for resources loaded in WebView
2. **Workspace Folder Check**: Always verify `vscode.workspace.workspaceFolders` exists before file operations
3. **Message Handler Registration**: Register in `messageHandler.ts` switch AND add typing in message interfaces
4. **Generator Library Tracking**: Update `lib_deps_` array when blocks need Arduino libraries
5. **Multi-language Testing**: Test UI in at least English and Traditional Chinese
6. **Theme Consistency**: Both light and dark themes must be tested for new UI elements
7. **Blockly Version Assumptions**: Don't assume Blockly v11 behavior - verify API compatibility with v12 documentation
8. **CSS Class Names**: Icon-related CSS may need updates (v12 uses camelCase for icon classes)

## Testing Strategy

-   **Unit Tests**: Service classes (FileService, SettingsManager) have comprehensive tests
-   **Integration Tests**: Message handler workflows tested with mocked VSCode APIs
-   **Manual Testing**: Blockly editor functionality requires manual WebView testing
-   Run `npm test` before committing changes

**Blockly 12.x Upgrade Testing**:

-   **Backward Compatibility**: Test loading Blockly 11 `main.json` files
-   **Serialization**: Verify save/load cycle produces identical workspace
-   **Theme Switching**: Test both light and dark themes display correctly
-   **Board Configuration**: Test all 5 board types (Uno, Nano, Mega, ESP32, Super Mini)
-   **Code Generation**: Verify Arduino C++ output matches expected format
-   **Performance**: Compile time ≤5s, bundle size ≤137KB, tests ≤3s

## Release Checklist

Before publishing updates:

-   [ ] All tests pass (`npm test`)
-   [ ] Extension compiles (`npm run compile`)
-   [ ] Tested in both light and dark themes
-   [ ] Multi-language UI verified (EN, ZH-HANT minimum)
-   [ ] Board configurations work (test Arduino Uno + ESP32)
-   [ ] PlatformIO integration tested (library dependencies sync correctly)
-   [ ] Performance benchmarks met (compile ≤5s, bundle ≤137KB, tests ≤3s)
-   [ ] Blockly 11 workspace files load successfully (backward compatibility)
-   [ ] Changelog updated
-   [ ] Version bumped in package.json

---

## Blockly 12.x Upgrade Reference

For detailed information about the Blockly 12.3.1 upgrade, see:

-   **Research Document**: `specs/008-core-deps-upgrade/research.md` - API analysis, breaking changes, migration guide
-   **Data Model**: `specs/008-core-deps-upgrade/data-model.md` - Entity definitions, relationships, state management
-   **Quickstart Guide**: `specs/008-core-deps-upgrade/quickstart.md` - Development environment setup, testing workflows
-   **Task Breakdown**: `specs/008-core-deps-upgrade/tasks.md` - Implementation task list (generated in Phase 2)

**Key Takeaways**:

-   Blockly 12.x is a **low-risk upgrade** with high backward compatibility
-   No code changes required in JavaScript files (blocks, generators, themes)
-   Only `package.json` and potentially CSS files need updates
-   All 190 existing tests should pass without modification

---

**Remember**: This is a visual programming tool for education. Prioritize clarity and ease-of-use over technical sophistication. When in doubt, check existing patterns in the three core files listed at the top.
