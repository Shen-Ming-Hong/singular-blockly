# Singular Blockly - AI Coding Agent Instructions

## Language Convention

**IMPORTANT**: Always respond in **Traditional Chinese (繁體中文)** unless explicitly requested otherwise.

## Project Overview

VSCode extension for visual Arduino/MicroPython programming using Google Blockly. Generates Arduino C++ (via PlatformIO) or MicroPython (via mpremote for CyberBrick) based on board selection. Supports 15 languages with 99% i18n coverage.

**Tech Stack**: TypeScript 5.9.3 | Blockly 12.3.1 | VSCode 1.105.0+ | MCP SDK 1.25.2

## Architecture (Two-Context System)

```
Extension Host (Node.js)              WebView (Browser)
├── src/extension.ts          ←→      ├── media/html/blocklyEdit.html
├── src/webview/                      ├── media/js/blocklyEdit.js (3000+ lines)
│   ├── webviewManager.ts             └── media/blockly/
│   └── messageHandler.ts                 ├── blocks/*.js (定義積木外觀)
├── src/mcp/mcpServer.ts                  └── generators/{arduino,micropython}/*.js
├── src/mcp/tools/
│   ├── blockQuery.ts         # get_block_usage, search_blocks, list_blocks_by_category
│   ├── platformConfig.ts     # get_platform_config, get_board_pins
│   └── workspaceOps.ts       # update_workspace, refresh_editor, get_workspace_state
└── src/services/
    ├── fileService.ts        # ALL file I/O (inject FileSystem for tests)
    ├── logging.ts            # ALL logging (never use console.log)
    ├── settingsManager.ts    # PlatformIO config + theme + auto-backup
    ├── micropythonUploader.ts # mpremote upload for CyberBrick
    ├── arduinoUploader.ts    # PlatformIO upload for Arduino boards
    ├── workspaceValidator.ts # Validate workspace state integrity
    └── projectTypeDetector.ts # Detect non-Blockly projects (safety guard)
```

**Data Flow**: WebView `saveWorkspace` → `messageHandler.ts` → `FileService` → `blockly/main.json`

## Critical Patterns

### Extension ↔ WebView Communication

```typescript
// Extension → WebView (in messageHandler.ts)
panel.webview.postMessage({ command: 'loadWorkspace', state: {...}, board: 'esp32' });

// WebView → Extension (in blocklyEdit.js)
vscode.postMessage({ command: 'saveWorkspace', state: {...}, board: currentBoard });

// Add handlers in messageHandler.ts switch-case:
case 'newCommand': await this.handleNewCommand(message); break;
```

### Dual Code Generators (Board-Aware)

**Arduino** (`media/blockly/generators/arduino/*.js`):

```javascript
arduinoGenerator.forBlock['servo_setup'] = function (block) {
	const currentBoard = window.getCurrentBoard(); // 'uno' | 'esp32' | 'mega' ...
	if (currentBoard === 'esp32') {
		arduinoGenerator.lib_deps_.push('madhephaestus/ESP32Servo@^3.0.6');
	} else {
		arduinoGenerator.lib_deps_.push('arduino-libraries/Servo@^1.2.2');
	}
	return ''; // Setup blocks return empty string
};
```

**MicroPython** (`media/blockly/generators/micropython/*.js`):

```javascript
micropythonGenerator.forBlock['cyberbrick_led_set_color'] = function (block) {
	generator.addImport('from machine import Pin');
	generator.addImport('from neopixel import NeoPixel');
	generator.addHardwareInit('onboard_led', 'onboard_led = NeoPixel(Pin(8), 1)');
	return `onboard_led[0] = (${red}, ${green}, ${blue})\nonboard_led.write()\n`;
};
```

### Service Layer Rules

-   **File I/O**: Use `FileService` only — inject `FileSystem` interface for testing
-   **Logging**: Use `log('message', 'info')` from `logging.ts`; WebView uses `log.info()`
-   **Workspace**: Always check `vscode.workspace.workspaceFolders` before operations
-   **Empty State Guard**: `isEmptyWorkspaceState()` prevents overwriting valid data with empty state

### Upload Architecture (Unified UI)

Both Arduino and MicroPython use the same WebView upload UI. The `messageHandler.ts` routes to:

-   `ArduinoUploader` → PlatformIO CLI for compilation/upload
-   `MicropythonUploader` → `mpremote` tool for CyberBrick

Board language detection via `getBoardLanguage(board)` in `src/types/arduino.ts`.

### CyberBrick Extension Boards (X11/X12)

MicroPython generators for extension boards use `bbl.*` library imports:

```javascript
// X11 example (media/blockly/generators/micropython/x11.js)
generator.forBlock['x11_servo_180_angle'] = function (block) {
	generator.addImport('from bbl.servos import ServosController');
	generator.addHardwareInit('servos', 'servos = ServosController()');
	const port = block.getFieldValue('PORT');
	const angle = generator.valueToCode(block, 'ANGLE', generator.ORDER_NONE) || '0';
	return `servos.set_angle(${port}, max(0, min(180, ${angle})))\n`;
};
```

**Extension board files**: `x11.js` (servos, motors, LEDs) | `x12.js` (joystick, buttons) | `rc.js` (remote control)

## Development Commands

```powershell
npm run watch          # Watch mode (F5 to debug)
npm run test           # Run all tests
npm run test:coverage  # Run with coverage report
npm run validate:i18n  # Check all 15 language translations
npm run audit:i18n:all # Full i18n quality audit
npm run generate:dictionary  # Update MCP block dictionary
```

**Debug WebView**: F5 → Right-click panel → "Open Developer Tools"

## Adding New Blocks (5-Step Checklist)

1. **Block definition**: `media/blockly/blocks/{category}.js` — define appearance, fields, connections
2. **Arduino generator**: `media/blockly/generators/arduino/{category}.js` — use `window.getCurrentBoard()` for board-specific code
3. **MicroPython generator**: `media/blockly/generators/micropython/{category}.js` — use `generator.addImport()`, `generator.addHardwareInit()`
4. **Toolbox entry**: `media/toolbox/categories/{category}.json` (categories: arduino, communication, cyberbrick\_\*, lists, logic, loops, math, motors, sensors, text, vision-sensors)
5. **i18n keys**: All 15 `media/locales/*/messages.js` files (use `npm run validate:i18n` to check)

**For setup blocks** (servo, encoder): Register with `arduinoGenerator.registerAlwaysGenerateBlock('block_type')` at module load (see `motors.js` IIFE pattern)

## MCP Server (AI Tool Integration)

**Entry**: `src/mcp/mcpServer.ts` (STDIO) | **Provider**: `src/mcp/mcpProvider.ts` | **Tools**: `src/mcp/tools/*.ts`

Adding tools:

1. Create `src/mcp/tools/{name}.ts` with `registerXxxTools(server: McpServer)`
2. Register in `mcpServer.ts`
3. Use Zod schemas for input validation
4. Run `npm run generate:dictionary` to update `block-dictionary.json`

## Specs-Driven Development

Features documented in `/specs/{NNN}-feature-name/`:

-   `spec.md` → Requirements | `plan.md` → Strategy | `tasks.md` → Breakdown

**Check existing specs before implementing new features.**

## Testing with Dependency Injection

```typescript
// src/test/helpers/mocks.ts provides VSCodeMock, FSMock
import { FSMock, VSCodeMock } from './helpers/mocks';

const fsMock = new FSMock();
fsMock.addFile('/workspace/blockly/main.json', '{}');
const fileService = new FileService('/workspace', fsMock);

// For messageHandler tests, inject services via constructor:
const handler = new WebViewMessageHandler(context, panel, localeService, fileService, settingsManager);
```

**Note**: FSMock normalizes paths to forward slashes internally — use either `\` or `/` in tests.

## Common Pitfalls

1. **WebView resources**: Must use `webview.asWebviewUri()` for all paths
2. **CyberBrick board**: Extension auto-deletes `platformio.ini` on activation (see `extension.ts:50-70`)
3. **Generator block names**: Must match block type exactly (`forBlock['exact_name']`)
4. **Board detection**: Use `window.getCurrentBoard()` in generators, `window.currentBoard` is deprecated
5. **Backup before save**: `createBackupBeforeSave()` creates `main.json.bak` automatically
6. **i18n placeholders**: Use `{0}`, `{1}` format in `messages.js`, not `%s`
7. **VSCode API injection**: Use `_setVSCodeApi()` and `_reset()` for testing (see `extension.ts`, `messageHandler.ts`)

## Key File Locations

| Purpose            | File                                    |
| ------------------ | --------------------------------------- |
| Extension entry    | `src/extension.ts`                      |
| WebView main logic | `media/js/blocklyEdit.js`               |
| Message handling   | `src/webview/messageHandler.ts`         |
| File operations    | `src/services/fileService.ts`           |
| Workspace state    | `blockly/main.json` (in user project)   |
| MCP block metadata | `src/mcp/block-dictionary.json`         |
| i18n validation    | `scripts/i18n/validate-translations.js` |
| Block definitions  | `media/blockly/blocks/*.js`             |
| Toolbox categories | `media/toolbox/categories/*.json`       |
| Translation files  | `media/locales/{lang}/messages.js`      |
| Test mocks         | `src/test/helpers/mocks.ts`             |
