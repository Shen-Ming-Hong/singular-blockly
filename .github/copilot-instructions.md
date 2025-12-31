# Singular Blockly - AI Coding Agent Instructions

## Language Convention

**IMPORTANT**: Always respond in **Traditional Chinese (繁體中文)** unless explicitly requested otherwise.

## Project Overview

VSCode extension for visual Arduino/MicroPython programming using Google Blockly. Generates Arduino C++ (via PlatformIO) or MicroPython (via mpremote for CyberBrick) based on board selection.

**Tech Stack**: TypeScript 5.9.3 | Blockly 12.3.1 | VSCode 1.105.0+ | MCP SDK 1.24.3

## Architecture (Two-Context System)

```
Extension Host (Node.js)              WebView (Browser)
├── src/extension.ts          ←→      ├── media/html/blocklyEdit.html
├── src/webview/                      ├── media/js/blocklyEdit.js
│   ├── webviewManager.ts             └── media/blockly/
│   └── messageHandler.ts                 ├── blocks/*.js
├── src/mcp/mcpServer.ts                  └── generators/{arduino,micropython}/*.js
└── src/services/
    ├── fileService.ts        # ALL file I/O (never use fs directly)
    ├── logging.ts            # ALL logging (never use console.log)
    └── settingsManager.ts    # PlatformIO config
```

## Critical Patterns

### Extension ↔ WebView Communication

```typescript
// Extension → WebView (in messageHandler.ts)
panel.webview.postMessage({ command: 'loadWorkspace', state: {...} });

// WebView → Extension (in blocklyEdit.js)
vscode.postMessage({ command: 'saveWorkspace', state: {...} });

// Add handlers in messageHandler.ts switch-case:
case 'newCommand': await this.handleNewCommand(message); break;
```

### Dual Code Generators

**Arduino** (`media/blockly/generators/arduino/*.js`):

```javascript
arduinoGenerator.forBlock['servo_setup'] = function (block) {
	arduinoGenerator.lib_deps_.push('ESP32Servo@^3.0.6'); // Auto-add to platformio.ini
	return ['code', arduinoGenerator.ORDER_ATOMIC];
};
```

**MicroPython** (`media/blockly/generators/micropython/*.js`):

```javascript
micropythonGenerator.forBlock['cyberbrick_led'] = function (block) {
	generator.addImport('from machine import Pin');
	generator.addHardwareInit('led', 'led = Pin(8, Pin.OUT)');
	return 'led.value(1)\n';
};
```

### Service Layer Rules

-   **File I/O**: Use `FileService` only (`src/services/fileService.ts`)
-   **Logging**: Use `log('message', 'info')` from `logging.ts`
-   **Workspace**: Always check `vscode.workspace.workspaceFolders` before operations

## Development Commands

```powershell
npm run watch          # Watch mode (F5 to debug)
npm run test           # Run tests
npm run validate:i18n  # Check all 15 language translations
```

**Debug WebView**: F5 → Right-click panel → "Open Developer Tools"

## Adding New Blocks (5-Step Checklist)

1. Block definition: `media/blockly/blocks/{category}.js`
2. Arduino generator: `media/blockly/generators/arduino/{category}.js`
3. MicroPython generator: `media/blockly/generators/micropython/{category}.js`
4. Toolbox entry: `media/toolbox/categories/{category}.json`
5. i18n keys: All 15 `media/locales/*/messages.js` files

## MCP Server (AI Tool Integration)

**Entry**: `src/mcp/mcpServer.ts` (STDIO) | **Tools**: `src/mcp/tools/*.ts`

Adding tools:

1. Create `src/mcp/tools/{name}.ts` with `registerXxxTools(server: McpServer)`
2. Register in `mcpServer.ts`
3. Use Zod schemas for input validation

## Specs-Driven Development

Features documented in `/specs/{NNN}-feature-name/`:

-   `spec.md` → Requirements | `plan.md` → Strategy | `tasks.md` → Breakdown

**Check existing specs before implementing new features.**

## Testing with Dependency Injection

```typescript
import { FSMock, createIsolatedFileService } from './helpers';
const fsMock = new FSMock();
fsMock.addFile('/workspace/blockly/main.json', '{}');
const fileService = createIsolatedFileService(fsMock, '/workspace');
```

## Common Pitfalls

1. **WebView resources**: Must use `webview.asWebviewUri()` for all paths
2. **CyberBrick board**: Extension auto-deletes `platformio.ini` on activation
3. **Generator block names**: Must match block type exactly (`forBlock['exact_name']`)
4. **Board detection**: Use `window.currentBoard` in generators for board-specific code

---

**Core Files**: [src/extension.ts](src/extension.ts) | [media/js/blocklyEdit.js](media/js/blocklyEdit.js) | [src/webview/messageHandler.ts](src/webview/messageHandler.ts)
