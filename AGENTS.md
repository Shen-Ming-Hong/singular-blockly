# Repository Guidelines

## Communication
- Use Traditional Chinese when replying to the user.

## Project Overview
- VS Code extension for visual Arduino/MicroPython programming with Google Blockly.
- Generates Arduino C++ through PlatformIO and MicroPython through `mpremote` for CyberBrick.
- Supports 15 locales; validate localization changes before shipping.
- Runtime/tooling baseline: TypeScript 5.9.3, Blockly 12.3.1, VS Code `^1.105.0`, Node.js 22.16.0+.
- PlatformIO IDE (`platformio.platformio-ide`) is an extension dependency.

## Project Structure
- `src/`: TypeScript extension source, services, MCP, and webview orchestration.
- `src/test/`: Mocha/Sinon tests, including suite and integration coverage.
- `media/`: Webview HTML/CSS/JS, Blockly blocks/generators, toolbox, and `media/locales/`.
- `scripts/`: build, dictionary, and i18n utilities.
- `specs/`: Spec Kit feature specs with `spec.md`, `plan.md`, and `tasks.md`.
- `docs/`: project documentation and testing coverage notes.
- `dist/`, `out/`, and `coverage/`: generated outputs.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run watch`: webpack watch for development.
- `npm run compile`: one-off webpack build.
- `npm run package`: production build for VS Code packaging.
- `npm run lint`: ESLint over `src/`.
- `npm test`: run VS Code extension tests through `@vscode/test`.
- `npm run test:coverage`: write coverage output to `coverage/`.
- `npm run test:bail`: stop tests on first failure.
- `npm run test:integration`: integration tests.
- `npm run generate:dictionary`: rebuild MCP block dictionary.
- `npm run validate:i18n`: validate all locale files.
- `npm run audit:i18n:ja`: Japanese translation audit.

## Architecture Rules
- Extension Host code in `src/` and WebView code in `media/` are separate contexts; communicate only through `postMessage`.
- Route file I/O through `FileService` and inject the `FileSystem` interface in tests.
- Use `log()` from `src/services/logging.ts`; do not add `console.log` in extension code.
- Check `vscode.workspace.workspaceFolders` before workspace operations.
- Preserve the empty-state guard before writing Blockly workspace data.
- WebView resources must use `webview.asWebviewUri()`.
- Use `window.getCurrentBoard()` in Blockly generators; `window.currentBoard` is deprecated.
- Board-aware upload flow routes through `ArduinoUploader` for PlatformIO and `MicropythonUploader` for CyberBrick/mpremote.
- Orphan Blockly blocks must keep the three-layer guard: `workspaceToCode` skip, `forBlock` context guard, and `onchange` warning.

## Adding New Blocks
1. Add the block definition in `media/blockly/blocks/{category}.js`.
2. Add the Arduino generator in `media/blockly/generators/arduino/{category}.js`.
3. Add the MicroPython generator in `media/blockly/generators/micropython/{category}.js`.
4. Add toolbox entries in `media/toolbox/categories/{category}.json`.
5. Add i18n keys to all 15 `media/locales/*/messages.js` files and run `npm run validate:i18n`.

Setup blocks that must always be emitted should register with `arduinoGenerator.registerAlwaysGenerateBlock('block_type')`.

## Spec-Driven Development
- Spec Kit is configured with Codex as the default integration. Use `.agents/skills` as the Codex skill root.
- Copilot SDD support is intentionally kept alongside Codex through `.github/agents/speckit.*.agent.md` and `.github/prompts/speckit.*.prompt.md`.
- Do not remove Copilot SDD files just because `default_integration` is `codex`; Spec Kit 0.11.3 marks Copilot as not multi-install safe, so `integration.json` stays Codex-only to keep `specify integration status` clean.
- In Codex, use the Spec Kit skills in this order when a feature needs full SDD: `$speckit-clarify`, `$speckit-specify`, `$speckit-plan`, `$speckit-tasks`, `$speckit-analyze`, `$speckit-implement`, `$speckit-checklist`.
- In Copilot, use the matching `speckit.*` agents/prompts from `.github/agents` and `.github/prompts`.
- Feature specs live in `specs/{NNN}-feature-name/`; check existing specs before creating a new one.
- Keep generated `spec.md`, `plan.md`, and `tasks.md` in the feature spec folder.
- Project-specific skills from `.github/skills` are linked into `.agents/skills`; update the source under `.github/skills`.

## Coding Style
- TypeScript uses strict compiler options from `tsconfig.json`.
- Follow ESLint and existing formatting.
- Import names should be `camelCase` or `PascalCase`.
- Keep command IDs and setting keys aligned with `package.json` conventions such as `singular-blockly.*`.
- WebView JavaScript is not linted by the TypeScript ESLint target; keep it boring and consistent.

## Testing Guidelines
- Frameworks: Mocha + Sinon with `@vscode/test-electron`.
- Name test files `{module}.test.ts` under `src/test/`.
- Use `.only` temporarily to focus a single Mocha test, then remove it before finishing.
- WebView code cannot be imported into Node.js tests; use contract-style tests.
- Coverage target is documented in `docs/specifications/04-quality-testing/test-coverage.md`.

## MCP Server
- Entry: `src/mcp/mcpServer.ts`; provider: `src/mcp/mcpProvider.ts`.
- Add tools under `src/mcp/tools/{name}.ts`, export them from `src/mcp/tools/index.ts`, then register them in `mcpServer.ts`.
- Use Zod schemas for MCP tool input validation.
- Run `npm run generate:dictionary` after block dictionary changes.

## Commit and Pull Request Guidelines
- Use Conventional Commits, for example `feat(blocks): ...`, `fix(webview): ...`, `i18n(ja): ...`, `chore(deps): ...`.
- Common scopes: `blocks`, `generators`, `i18n`, `webview`, `mcp`, `services`, `toolbox`, `deps`.
- PRs require CI passing, maintainer approval, no merge conflicts, and clean ESLint.
- Localization PRs should use `.github/PULL_REQUEST_TEMPLATE/localization.md` and include before/after examples, audit references, and screenshots when useful.

## Security and Configuration
- Report security issues through `SECURITY.md`.
- Prefer Node.js 22.16.0+ to match runtime requirements.
- PlatformIO extension is required for hardware upload workflows.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/063-vscodium-openvsx-guided-install/plan.md`
<!-- SPECKIT END -->
