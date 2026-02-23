# Singular Blockly - Copilot Instructions

## Language Convention

**IMPORTANT**: Always respond in **Traditional Chinese (繁體中文)** unless explicitly requested otherwise.

## Project Overview

VS Code extension for visual Arduino/MicroPython programming using Google Blockly. Generates Arduino C++ (via PlatformIO) or MicroPython (via mpremote for CyberBrick) based on board selection. Supports 15 languages with 99% i18n coverage.

**Tech Stack**: TypeScript 5.9.3 | Blockly 12.3.1 | VS Code 1.105.0+ | MCP SDK 1.26.0 | Zod 4.1.13

**Extension dependency**: PlatformIO IDE (`platformio.platformio-ide`) is declared in `extensionDependencies`.

## Build, Test, and Lint

```powershell
npm run watch              # Webpack watch (F5 to debug in VS Code)
npm run compile            # One-off webpack build
npm run package            # Production build (--mode production)
npm run lint               # ESLint over src/
npm test                   # Full test suite via @vscode/test-cli
npm run test:coverage      # Tests with coverage report
npm run test:bail          # Stop on first failure
npm run test:integration   # Integration tests (requires Copilot)
npm run validate:i18n      # Validate all 15 locale files
npm run generate:dictionary # Rebuild MCP block-dictionary.json
```

**Run a single test file**: Tests run via `@vscode/test-cli` which launches a VS Code instance. To focus on specific tests, use `.only` in Mocha (`describe.only` / `it.only`) then run `npm test`. Test config is in `.vscode-test.mjs` with two labels: `unit` (excludes integration) and `integration`.

**Debug WebView**: F5 → Right-click Blockly panel → "Open Developer Tools"

## Architecture (Two-Context System)

The extension runs in two isolated JavaScript contexts that communicate via `postMessage`:

```
Extension Host (Node.js)              WebView (Browser)
├── src/extension.ts          ←→      ├── media/html/blocklyEdit.html
├── src/webview/                      ├── media/js/blocklyEdit.js
│   ├── webviewManager.ts             └── media/blockly/
│   └── messageHandler.ts                 ├── blocks/*.js (block definitions)
├── src/mcp/mcpServer.ts                  └── generators/{arduino,micropython}/*.js
├── src/mcp/tools/*.ts
├── src/services/
│   ├── fileService.ts         # ALL file I/O (inject FileSystem for tests)
│   ├── logging.ts             # ALL logging (never use console.log)
│   ├── settingsManager.ts     # PlatformIO config + theme + auto-backup
│   ├── arduinoUploader.ts     # PlatformIO CLI upload
│   ├── micropythonUploader.ts # mpremote upload for CyberBrick
│   ├── workspaceValidator.ts  # Workspace state integrity
│   ├── projectTypeDetector.ts # Non-Blockly project safety guard
│   └── shadowSuggestionService.ts # AI block suggestions via Copilot LM API
└── src/types/
    ├── board.ts               # BoardLanguage, UploadMethod types
    ├── arduino.ts             # getBoardLanguage(), board configs
    └── nodeDetection.ts       # Node.js detection types & MIN_NODE_VERSION
```

**Complete services inventory** (`src/services/`):
| Service | Role |
|---|---|
| `fileService.ts` | ALL file I/O — inject `FileSystem` for tests |
| `logging.ts` | ALL logging — never use `console.log` |
| `settingsManager.ts` | PlatformIO config, theme, auto-backup |
| `arduinoUploader.ts` | PlatformIO CLI upload |
| `micropythonUploader.ts` | mpremote upload for CyberBrick |
| `arduinoMonitorService.ts` | Arduino PlatformIO serial monitor |
| `serialMonitorService.ts` | CyberBrick MicroPython serial monitor (mpremote) |
| `workspaceValidator.ts` | Workspace state integrity checks |
| `projectTypeDetector.ts` | Non-Blockly project safety guard |
| `shadowSuggestionService.ts` | AI block suggestions via Copilot LM API |
| `aiModelManager.ts` | Copilot tier detection & per-tier AI config |
| `aiStatusBar.ts` | Status bar indicator for AI suggestion state |
| `localeService.ts` | Runtime locale/UI messages loader |
| `nodeDetectionService.ts` | Node.js availability & version validation |
| `diagnosticService.ts` | VS Code Diagnostic collection management |

**Data Flow**: WebView `saveWorkspace` → `messageHandler.ts` → `FileService` → `blockly/main.json`

**Key constraint**: Extension Host code (TypeScript in `src/`) cannot import WebView code (`media/`), and vice versa. They only communicate via `postMessage`.

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

Each block needs both an Arduino and MicroPython generator. They use different patterns:

**Arduino** (`media/blockly/generators/arduino/*.js`):

```javascript
arduinoGenerator.forBlock['servo_setup'] = function (block) {
	const currentBoard = window.getCurrentBoard(); // 'uno' | 'esp32' | 'mega'
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

### Orphan Block Prevention (Three-Layer Guard)

Blocks placed outside allowed containers (`arduino_setup_loop`, `micropython_main`, functions) are protected by:

1. **`workspaceToCode` filter**: Top-level orphan blocks are skipped with `// [Skipped]` (Arduino) or `# [Skipped]` (MicroPython) comments
2. **`forBlock` guard**: Control/flow blocks (`controls_whileUntil`, `controls_for`, `controls_forEach`, `controls_repeat_ext`, `controls_if`, `singular_flow_statements`) call `isInAllowedContext()` and return empty if orphaned
3. **`onchange` warning**: Orphan blocks show `setWarningText()` with generator-specific i18n messages

When adding new control/flow blocks, add both the `forBlock` guard and `onchange` handler (see `media/blockly/blocks/loops.js` for the `wrapOnchange` pattern).

### Service Layer Rules

- **File I/O**: Use `FileService` only — inject `FileSystem` interface for testing
- **Logging**: Use `log('message', 'info')` from `logging.ts`; never `console.log`
- **Workspace**: Always check `vscode.workspace.workspaceFolders` before operations
- **Empty State Guard**: `isEmptyWorkspaceState()` prevents overwriting valid data with empty state

### Upload Architecture

Both Arduino and MicroPython share the same WebView upload UI. `messageHandler.ts` routes to:

- `ArduinoUploader` → PlatformIO CLI for compilation/upload
- `MicropythonUploader` → `mpremote` tool for CyberBrick

Board language detection: `getBoardLanguage(board)` in `src/types/arduino.ts`.

## Adding New Blocks (5-Step Checklist)

1. **Block definition**: `media/blockly/blocks/{category}.js`
2. **Arduino generator**: `media/blockly/generators/arduino/{category}.js` — use `window.getCurrentBoard()` for board-specific code
3. **MicroPython generator**: `media/blockly/generators/micropython/{category}.js` — use `generator.addImport()`, `generator.addHardwareInit()`
4. **Toolbox entry**: `media/toolbox/categories/{category}.json`
5. **i18n keys**: All 15 `media/locales/*/messages.js` files (verify with `npm run validate:i18n`)

**For setup blocks** (servo, encoder): Register with `arduinoGenerator.registerAlwaysGenerateBlock('block_type')` at module load. These blocks are scanned by container blocks and must not be marked as orphans by `workspaceToCode`.

## Testing Conventions

Tests use Mocha + Sinon with `@vscode/test-electron`. All tests are under `src/test/`.

```typescript
// Dependency injection via src/test/helpers/mocks.ts
import { FSMock, VSCodeMock } from './helpers/mocks';

const fsMock = new FSMock();
fsMock.addFile('/workspace/blockly/main.json', '{}');
const fileService = new FileService('/workspace', fsMock);
```

- FSMock normalizes paths to forward slashes internally
- Use `_setVSCodeApi()` / `_reset()` for VS Code API injection in tests
- WebView code (`media/`) cannot be imported into Node.js tests — use contract-style tests instead

## MCP Server

**Entry**: `src/mcp/mcpServer.ts` (STDIO) | **Provider**: `src/mcp/mcpProvider.ts`

Adding tools:

1. Create `src/mcp/tools/{name}.ts` with `register{Name}Tools(server: McpServer)` function
2. Export in `src/mcp/tools/index.ts`
3. Register in `mcpServer.ts`
4. Use Zod schemas for input validation
5. Run `npm run generate:dictionary` to update `block-dictionary.json`

## Specs-Driven Development

Features are documented in `/specs/{NNN}-feature-name/` with `spec.md`, `plan.md`, `tasks.md`. Check existing specs before implementing new features.

**SpecKit Agents**: Use `.github/agents/speckit.*.agent.md` (or equivalent prompts in `.github/prompts/`) for a structured spec → implementation pipeline:

| Agent                   | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `speckit.clarify`       | Elicit requirements from user description |
| `speckit.specify`       | Generate formal `spec.md`                 |
| `speckit.plan`          | Produce `plan.md` implementation plan     |
| `speckit.tasks`         | Break plan into `tasks.md` checklist      |
| `speckit.analyze`       | Analyze existing codebase for spec impact |
| `speckit.implement`     | Implement tasks from `tasks.md`           |
| `speckit.checklist`     | Verify implementation against spec        |
| `speckit.taskstoissues` | Convert tasks to GitHub Issues            |

## Commit Conventions

Conventional Commits with scopes: `feat(blocks)`, `fix(webview)`, `i18n(ja)`, `chore(deps)`, etc.

**Types**: `feat` | `fix` | `docs` | `i18n` | `chore` | `refactor` | `test` | `style`

**Scopes**: `blocks` | `generators` | `i18n` | `webview` | `mcp` | `services` | `toolbox` | `deps`

**Branch naming**: `feature/{name}`, `fix/{description}`, `localization/{lang}/{description}`, `docs/{description}`

## Common Pitfalls

1. **WebView resources**: Must use `webview.asWebviewUri()` for all paths
2. **Generator block names**: Must match block type exactly (`forBlock['exact_name']`)
3. **Board detection**: Use `window.getCurrentBoard()` in generators; `window.currentBoard` is deprecated
4. **i18n placeholders**: Use `{0}`, `{1}` format in `messages.js`, not `%s`
5. **`alwaysGenerateBlocks_`**: These are scanned by container blocks — do not skip them in `workspaceToCode`
6. **ESLint scope**: Only `src/` TypeScript is linted; `media/js/` and `media/blockly/` are excluded (browser context)
