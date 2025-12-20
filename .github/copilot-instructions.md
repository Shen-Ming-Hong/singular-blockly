# Singular Blockly - AI Coding Agent Instructions

## Language Convention

**IMPORTANT**: Always respond in **Traditional Chinese (繁體中文)** unless explicitly requested otherwise.

## Project Overview

**Singular Blockly** is a VSCode extension providing visual programming for Arduino development using Google Blockly. It generates Arduino C++ code and integrates with PlatformIO for hardware deployment.

### Technology Stack

-   **Blockly**: 12.3.1 | **@blockly/theme-modern**: 7.0.1
-   **TypeScript**: 5.9.3 | **Node.js**: 22.16.0+ | **VS Code**: 1.105.0+
-   **Webpack**: 5.102.1 (dual entry: `dist/extension.js`, `dist/mcp-server.js`)
-   **MCP SDK**: @modelcontextprotocol/sdk 1.24.3 (STDIO transport)

### Architecture Overview

```
Extension Host (Node.js)           WebView (Browser Context)
├── extension.ts                   ├── blocklyEdit.html
├── webview/                       ├── blocklyEdit.js (~1930 lines)
│   ├── webviewManager.ts (~970)  └── blockly/
│   └── messageHandler.ts (~800)      ├── blocks/*.js (block definitions)
├── mcp/                              └── generators/arduino/*.js (code gen)
│   ├── mcpProvider.ts (MCP registration)
│   ├── mcpServer.ts (STDIO transport)
│   └── tools/*.ts (MCP tools)
└── services/
    ├── fileService.ts
    ├── settingsManager.ts
    ├── localeService.ts
    ├── workspaceValidator.ts
    └── logging.ts
```

**Read First** (critical entry points):

1. `src/extension.ts` - Activation, command registration, MCP provider
2. `media/html/blocklyEdit.html` - WebView DOM structure, script loading order
3. `media/js/blocklyEdit.js` - Blockly workspace initialization, event handlers

## Critical Patterns

### 1. Extension ↔ WebView Communication

**Message flow**: Extension and WebView use `postMessage` bidirectionally:

```typescript
// Extension → WebView (messageHandler.ts)
panel.webview.postMessage({ command: 'loadWorkspace', state: {...} });

// WebView → Extension (blocklyEdit.js)
vscode.postMessage({ command: 'saveWorkspace', state: {...} });
```

**Add handlers in `messageHandler.ts`** using switch-case (never modify `blocklyEdit.js` message sending):

```typescript
case 'newCommand': await this.handleNewCommand(message); break;
```

### 2. Service Layer (Never Use `fs` or `console.log` Directly)

-   **FileService**: All file I/O (workspace + extension contexts)
-   **SettingsManager**: VSCode settings, PlatformIO `platformio.ini` generation
-   **LocaleService**: i18n message loading, language mapping (e.g., `zh-tw` → `zh-hant`)
-   **WorkspaceValidator**: Project type detection (Node.js, Python, etc.)
-   **logging**: Unified `log.info/error/warn/debug()` - output to "Singular Blockly" channel

### 3. Blockly Block Definition (Two-File Pattern)

**Block** (`media/blockly/blocks/sensors.js`) + **Generator** (`generators/arduino/sensors.js`):

```javascript
// 1. Block definition
Blockly.Blocks['sensor_read'] = {
	init: function () {
		this.appendDummyInput().appendField(Blockly.Msg['SENSOR_READ'] || '讀取感測器');
		this.setOutput(true, 'Number');
		this.setColour(160);
	},
};

// 2. Code generator (must match block name exactly)
arduinoGenerator.forBlock['sensor_read'] = function (block) {
	arduinoGenerator.lib_deps_.push('library@version'); // Auto-add to platformio.ini
	return ['analogRead(A0)', arduinoGenerator.ORDER_ATOMIC];
};
```

**Update `webviewManager.ts`**: Generator files are auto-discovered via `discoverArduinoModules()` from `media/blockly/generators/arduino/`. No manual array update needed.

## MCP Server Integration (AI Tool Support)

**Architecture**: VSCode 1.105.0+ MCP API with STDIO transport.

**Files**:

-   `src/mcp/mcpProvider.ts` - Registers `McpServerDefinitionProvider` with VSCode
-   `src/mcp/mcpServer.ts` - STDIO server entry point (separate bundle)
-   `src/mcp/tools/*.ts` - Tool implementations (blockQuery, platformConfig, workspaceOps)
-   `src/mcp/blockDictionary.ts` - Block metadata for AI queries

**Available MCP Tools**:
| Tool | Purpose |
|------|---------|
| `get_block_usage` | Get block docs with JSON template generation |
| `search_blocks` | Search by keyword (Chinese/English) |
| `list_blocks_by_category` | Browse blocks by category |
| `get_workspace_state` | Read current workspace state |
| `get_generated_code` | Read generated Arduino code |
| `refresh_editor` | Notify WebView to reload |

**Adding new MCP tools**:

1. Create tool in `src/mcp/tools/{toolName}.ts`
2. Export registration function: `registerXxxTools(server: McpServer)`
3. Register in `src/mcp/mcpServer.ts` via `registerXxxTools(server)`
4. Use Zod schemas for input validation

## Multi-Board & State Management

**Board configs** (`media/blockly/blocks/board_configs.js`): Define PlatformIO settings per board (Uno, Nano, Mega, ESP32, Super Mini).

**Board-specific generation**: Use `window.currentBoard` in generators:

```javascript
if (window.currentBoard === 'esp32') {
	arduinoGenerator.lib_deps_.push('ESP32Servo@1.2.1');
} else {
	arduinoGenerator.lib_deps_.push('Servo@1.2.2');
}
```

**Workspace persistence**:

-   Saved to: `{workspace}/blockly/main.json`
-   Structure: `{ workspace: {...}, board: 'arduino_uno', theme: 'light' }`
-   API: `Blockly.serialization.workspaces.save/load()` (unchanged in Blockly 12.x)
-   Auto-saves on every block change

**PlatformIO integration**: Libraries/flags auto-sync to `platformio.ini` via `SettingsManager.syncPlatformIOSettings()`.

## Internationalization (i18n)

**15 languages** (98.94% avg coverage): EN, ES, PT-BR, FR, DE, IT, RU, JA, KO, ZH-HANT, PL, HU, TR, BG, CS

**Message files**: `media/locales/{lang}/messages.js` (custom) + `node_modules/blockly/msg/{lang}.js` (core)

**Usage**:

-   WebView JS: `window.languageManager.getMessage('KEY', 'fallback')`
-   Extension TS: `localeService.getLocalizedMessage('KEY', default)`

**Quality assurance**:

-   **Validation**: `npm run validate:i18n` checks placeholders, encoding, consistency
-   **Audits**: `npm run audit:i18n:all` detects direct translation patterns
-   **Stats**: `npm run stats:i18n` generates coverage reports
-   **CI integration**: Monthly automated audits via GitHub Actions
-   See `specs/002-i18n-localization-review/quickstart.md` for contributor guide

## Development Workflows

### Building & Testing

```powershell
npm run watch          # Watch mode for development
npm run compile        # One-time compilation
npm run test          # Run test suite
npm run lint          # ESLint validation
npm run validate:i18n  # Check translation quality
```

### Debugging

**WebView**: F5 → Right-click panel → "Open Developer Tools" → Use `console.log`  
**Extension**: Use `log.info/error()` → Output Channel: "Singular Blockly"

### Adding New Blockly Blocks

1. Define in `media/blockly/blocks/{category}.js`
2. Generator in `media/blockly/generators/arduino/{category}.js`
3. Toolbox entry: `media/toolbox/categories/{category}.json`
4. i18n: Add messages to all `media/locales/*/messages.js`
5. (Auto-discovered) Generator files loaded via `discoverArduinoModules()`

## Specs-Driven Development

**All features follow** `/specs/{NNN}-feature-name/` structure:

-   `research.md` - API investigation, MCP tool findings
-   `plan.md` - Implementation strategy, risk assessment
-   `quickstart.md` - Developer onboarding guide
-   `tasks.md` - Breakdown for execution

**Active specs**: `016-esp32-wifi-mqtt`, `017-ctrl-s-quick-backup`

**Before implementation**: Check if spec exists. If modifying core APIs (Blockly, VSCode), document findings in research.md.

## Project Safety Guard 🛡️

**Prevents file loss** in non-Blockly projects (Node.js, Python, Java, etc.):

-   Detection: `WorkspaceValidator` in `src/services/workspaceValidator.ts`
-   Behavior: Shows warning dialog with Continue/Cancel/Don't remind again
-   Setting: `singularBlockly.safetyGuard.suppressWarning` (workspace-level)
-   Test environment: Auto-bypassed via `NODE_ENV === 'test'` check

**Pattern**: Always check `workspaceFolders` exists before file operations.

## Critical Conventions

### Logging

-   **Extension**: `log.info/error/warn/debug()` (never `console.log`)
-   **WebView**: `console.log` OK (browser environment)
-   **Context**: Always include `{ board, file, action }` objects

### Code Generation

Add descriptive comments in Arduino output:

```javascript
const comment = '// 設定伺服馬達到 90 度\n';
return comment + `servo.write(90);\n`;
```

### Testing Structure

-   **Services**: `src/test/{service}.test.ts` - Unit tests with mocked dependencies
-   **Integration**: `src/test/integration/` - Cross-component workflows
-   **Helpers**: `src/test/helpers/` - Mock factories, test utilities
-   **Pattern**: Mirror source structure in test files

**Test helpers** (in `src/test/helpers/testHelpers.ts`):

```typescript
// Use factory functions for isolated testing
import { createIsolatedFileService, createIsolatedSettingsManager } from './helpers';

const fsMock = new FSMock();
fsMock.addFile('/workspace/blockly/main.json', '{}');
const fileService = createIsolatedFileService(fsMock, '/workspace');
```

**Mock pattern**: Services accept DI via constructor (e.g., `FileService(path, fileSystem?)`).

### API Documentation Requirement

**Before modifying Blockly/VSCode APIs**:

1. Use MCP `resolve-library-id` + `get-library-docs` OR `webSearch`
2. Document findings in code comments
3. Reference spec research.md if available

### File Organization

-   Services: `src/services/` - Testable, reusable logic
-   WebView: `src/webview/` - Panel/message handlers
-   Blockly: `media/blockly/` - Blocks + generators
-   Tests: `src/test/` - Mirror source structure

## Common Pitfalls

1. **WebView URI**: Always `webview.asWebviewUri()` for resources
2. **Workspace Check**: Verify `workspaceFolders` exists before operations
3. **Message Handlers**: Register in `messageHandler.ts` switch + type interfaces
4. **Generator Libraries**: Update `lib_deps_` for Arduino dependencies
5. **i18n Testing**: Test EN + ZH-HANT minimum
6. **Theme Testing**: Both light/dark themes required
7. **Test Bypass**: Safety guard skips in test env via `NODE_ENV === 'test'`

## Performance Targets

-   **Compile**: ≤5s (`npm run compile`)
-   **Bundle**: ≤137KB (`dist/extension.js`)
-   **Tests**: ≤3s (`npm test`)
-   **Backward Compat**: Blockly 11 `main.json` files must load

## Key References

-   **Architecture**: `specs/001-refactor-architecture-cleanup/`
-   **i18n Guide**: `specs/002-i18n-localization-review/quickstart.md`
-   **Blockly 12**: `specs/008-core-deps-upgrade/research.md`
-   **Safety Guard**: `specs/010-project-safety-guard/`
-   **MCP Server**: `specs/015-mcp-server-integration/`
-   **ESP32 WiFi/MQTT**: `specs/016-esp32-wifi-mqtt/`

---

**Remember**: This is an educational tool. Prioritize clarity over complexity. Check the three core files (extension.ts, blocklyEdit.html, blocklyEdit.js) when patterns are unclear.
