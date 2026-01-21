# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript extension source plus services and MCP/webview logic.
- `src/test/`: Mocha-based unit and integration tests (see `src/test/suite` and `src/test/integration`).
- `media/`: Webview assets (HTML/CSS/JS), Blockly bundles, and `media/locales/` translations.
- `scripts/`: build and i18n utilities (audit/validate/detect).
- `specs/` and `docs/`: product specs, localization guidance, and testing coverage notes.
- `dist/` and `out/`: generated build outputs; `coverage/` holds test reports.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run watch`: webpack watch for development.
- `npm run compile`: one-off webpack build.
- `npm run package`: production build for VS Code packaging.
- `npm run lint`: ESLint over `src/`.
- `npm test`: run VS Code extension tests via `@vscode/test`.
- `npm run test:coverage`: run tests with coverage output in `coverage/`.
- `npm run generate:dictionary`: rebuild the block dictionary used by MCP tooling.
- `npm run audit:i18n:ja` / `npm run validate:i18n`: translation QA checks.

## Coding Style & Naming Conventions
- TypeScript (ES2023) with strict compiler options in `tsconfig.json`.
- ESLint is the primary style gate; follow existing file formatting.
- Import names should be `camelCase` or `PascalCase` per lint rules.
- Keep command IDs and settings keys consistent with `package.json` conventions (e.g., `singular-blockly.*`).

## Communication
- Use Traditional Chinese when replying to the user.

## Testing Guidelines
- Frameworks: Mocha + Sinon, with `@vscode/test-electron` for extension integration.
- File naming: `{module}.test.ts` under `src/test/`.
- Coverage goal is documented in `docs/specifications/04-quality-testing/test-coverage.md` (target 90%+). Add tests for new behavior.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits with optional scopes, as seen in history:
  - `feat(scope): ...`, `docs(README): ...`, `chore(deps): ...`, `i18n(ja): ...`
- PRs require CI passing, maintainer approval, no merge conflicts, and ESLint clean.
- Localization PRs should use `.github/PULL_REQUEST_TEMPLATE/localization.md` and include before/after examples, audit references, and screenshots when applicable.

## Security & Configuration Tips
- Report security issues via `SECURITY.md`.
- VS Code requirement is `^1.105.0`. README lists Node.js 22.16.0+ while CONTRIBUTING allows 18+; prefer 22.16.0+ to match runtime requirements.
- PlatformIO extension is required for hardware upload workflows.
