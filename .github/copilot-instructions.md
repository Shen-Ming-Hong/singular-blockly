# Singular Blockly - AI Coding Agent Instructions

## Language Convention

**IMPORTANT**: Always respond in **Traditional Chinese (繁體中文)** unless explicitly requested otherwise.

## Project Overview

**Singular Blockly** is a VSCode extension providing visual programming for Arduino and MicroPython development using Google Blockly. It generates Arduino C++ or MicroPython code depending on board selection, integrating with PlatformIO (Arduino) or mpremote (CyberBrick) for hardware deployment.

### Technology Stack

-   **Blockly**: 12.3.1 | **@blockly/theme-modern**: 7.0.1
-   **TypeScript**: 5.9.3 | **Node.js**: 22.16.0+ | **VS Code**: 1.105.0+
-   **Webpack**: 5.102.1 (dual entry: `dist/extension.js`, `dist/mcp-server.js`)
-   **MCP SDK**: @modelcontextprotocol/sdk 1.24.3 (STDIO transport)

### Architecture Overview

```
Extension Host (Node.js)           WebView (Browser Context)
├── extension.ts                   ├── blocklyEdit.html
├── webview/                       ├── blocklyEdit.js (~2780 lines)
│   ├── webviewManager.ts (~1300) └── blockly/
│   └── messageHandler.ts (~1150)     ├── blocks/*.js (block definitions)
├── mcp/                              └── generators/
│   ├── mcpProvider.ts                    ├── arduino/*.js (C++ generators)
│   ├── mcpServer.ts (STDIO)              └── micropython/*.js (Python generators)
│   └── tools/*.ts
└── services/
    ├── fileService.ts            # All file I/O
    ├── settingsManager.ts        # PlatformIO ini generation
    ├── micropythonUploader.ts    # CyberBrick upload via mpremote
    ├── localeService.ts          # i18n support
    └── logging.ts                # Unified logging (never use console.log)
```

**Read First**: `src/extension.ts`, `media/html/blocklyEdit.html`, `media/js/blocklyEdit.js`

## Critical Patterns

### 1. Extension ↔ WebView Communication

```typescript
// Extension → WebView (messageHandler.ts)
panel.webview.postMessage({ command: 'loadWorkspace', state: {...} });

// WebView → Extension (blocklyEdit.js)
vscode.postMessage({ command: 'saveWorkspace', state: {...} });
```

**Add handlers** in `messageHandler.ts` switch-case:

```typescript
case 'newCommand': await this.handleNewCommand(message); break;
```

### 2. Dual Code Generator Architecture (Arduino + MicroPython)

**Arduino** (blocks in `blocks/*.js`, generators in `generators/arduino/*.js`):

```javascript
arduinoGenerator.forBlock['sensor_read'] = function (block) {
	arduinoGenerator.lib_deps_.push('library@version'); // Auto-add to platformio.ini
	return ['analogRead(A0)', arduinoGenerator.ORDER_ATOMIC];
};
```

**MicroPython** (generators in `generators/micropython/*.js`):

```javascript
micropythonGenerator.forBlock['cyberbrick_led'] = function (block) {
	micropythonGenerator.addImport('from machine import Pin');
	micropythonGenerator.addHardwareInit('led', 'led = Pin(8, Pin.OUT)');
	return 'led.value(1)\n';
};
```

**Key difference**: Arduino uses `lib_deps_` for dependencies; MicroPython uses `addImport()`, `addHardwareInit()`, `addVariable()`.

### 3. Board-Specific Behavior

**CyberBrick auto-cleanup** (in `extension.ts` activation):

-   Deletes `platformio.ini` when board is `cyberbrick`
-   Prevents PlatformIO extension from interfering

**Board detection in generators**:

```javascript
if (window.currentBoard === 'cyberbrick') {
	// Use micropythonGenerator
} else if (window.currentBoard === 'esp32') {
	arduinoGenerator.lib_deps_.push('ESP32Servo@1.2.1');
}
```

### 4. Service Layer Rules

-   **Never use `fs` directly** - use `FileService`
-   **Never use `console.log`** - use `log.info/error/warn/debug()`
-   **Always check `workspaceFolders`** exists before file operations

## MCP Server (AI Integration)

**Files**: `src/mcp/mcpProvider.ts` (registration), `src/mcp/mcpServer.ts` (STDIO server), `src/mcp/tools/*.ts`

**Available tools**: `get_block_usage`, `search_blocks`, `list_blocks_by_category`, `get_workspace_state`, `get_generated_code`, `refresh_editor`

**Adding new MCP tools**:

1. Create in `src/mcp/tools/{name}.ts`
2. Export `registerXxxTools(server: McpServer)`
3. Register in `mcpServer.ts`
4. Use Zod schemas for validation

## Development Workflows

```powershell
npm run watch          # Watch mode (recommended)
npm run compile        # One-time build
npm run test           # Run tests
npm run validate:i18n  # Check translations
```

**Debugging**: F5 → Right-click panel → "Open Developer Tools"

### Adding New Blocks

1. Block definition: `media/blockly/blocks/{category}.js`
2. Arduino generator: `media/blockly/generators/arduino/{category}.js`
3. MicroPython generator: `media/blockly/generators/micropython/{category}.js` (if applicable)
4. Toolbox: `media/toolbox/categories/{category}.json`
5. i18n: All `media/locales/*/messages.js` files

## Specs-Driven Development

All features follow `/specs/{NNN}-feature-name/` structure:

-   `spec.md` - User stories, acceptance criteria
-   `research.md` - API investigation
-   `plan.md` - Implementation strategy
-   `tasks.md` - Task breakdown

**Active specs**: `021-cyberbrick-micropython`, `022-micropython-custom-function`

**Before implementation**: Check if spec exists. Document API findings in `research.md`.

## Internationalization (i18n)

**15 languages** (99% coverage): EN, ZH-HANT, ES, PT-BR, FR, DE, IT, RU, JA, KO, PL, HU, TR, BG, CS

```javascript
// WebView
window.languageManager.getMessage('KEY', 'fallback')

// Extension
localeService.getLocalizedMessage('KEY', default)
```

## Testing Patterns

```typescript
// Use helper factories for isolation
import { createIsolatedFileService, FSMock } from './helpers';

const fsMock = new FSMock();
fsMock.addFile('/workspace/blockly/main.json', '{}');
const fileService = createIsolatedFileService(fsMock, '/workspace');
```

**Test bypass**: Safety guard skips via `NODE_ENV === 'test'`

## Common Pitfalls

1. **WebView resources**: Always use `webview.asWebviewUri()`
2. **CyberBrick switching**: Extension auto-deletes `platformio.ini`
3. **Generator registration**: Block name must match exactly
4. **MicroPython functions**: Use `arduino_function` / `arduino_function_call` blocks with MicroPython generators

## Key References

-   **CyberBrick**: `specs/021-cyberbrick-micropython/`
-   **Custom Functions**: `specs/022-micropython-custom-function/`
-   **i18n Guide**: `specs/002-i18n-localization-review/quickstart.md`
-   **Safety Guard**: `specs/010-project-safety-guard/`

---

**Remember**: This is an educational tool. Prioritize clarity over complexity. When unsure, check the three core files: `extension.ts`, `blocklyEdit.html`, `blocklyEdit.js`.
