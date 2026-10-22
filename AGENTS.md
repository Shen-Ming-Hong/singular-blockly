# Repository Guidelines

## Communication
- Use Traditional Chinese when replying to the user.

## Project Overview
- VS Code extension for visual Arduino/MicroPython programming with Google Blockly.
- Generates Arduino C++ through PlatformIO and MicroPython through `mpremote` for CyberBrick.
- Supports 15 locales; validate localization changes before shipping.
- Runtime/tooling baseline: TypeScript 6.0.3, Blockly 13.2.1, `@blockly/theme-modern` 13.2.0, VS Code `^1.126.0`, Node.js 24.20.0 for the default contributor toolchain (minimum supported: 22.16.0).
- PlatformIO IDE (`platformio.platformio-ide`) is an extension dependency.

## Project Structure
- `src/`: TypeScript extension source, services, project-Skill management, and webview orchestration.
- `src/test/`: Mocha/Sinon tests, including suite and integration coverage.
- `media/`: Webview HTML/CSS/JS, Blockly blocks/generators, toolbox, and `media/locales/`.
- `resources/project-skills/`: packaged English project Skill, workspace schema, and runtime-derived block contract.
- `scripts/`: build, Skill-contract, and i18n utilities.
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
- `npm run generate:skill-contract`: rebuild the runtime-derived project Skill contract.
- `npm run check:project-skills`: verify tracked Skill assets and manifest hashes.
- `npm run validate:i18n`: validate all locale files.
- `npm run test:i18n`: run deterministic i18n contract tests.

## Architecture Rules
- Extension Host code in `src/` and WebView code in `media/` are separate contexts; communicate only through `postMessage`.
- Route file I/O through `FileService` and inject the `FileSystem` interface in tests.
- Use `log()` from `src/services/logging.ts`; do not add `console.log` in extension code.
- Check `vscode.workspace.workspaceFolders` before workspace operations.
- Preserve the empty-state guard before writing Blockly workspace data.
- WebView resources must use `webview.asWebviewUri()`.
- Use `window.getCurrentBoard()` in Blockly generators; `window.currentBoard` is deprecated.
- Board-aware upload flow routes through `ArduinoUploader` for PlatformIO, `MicropythonUploader` (USB, mpremote) or `CyberBrickOtaUploader` (Wi-Fi) for CyberBrick, and `TxtUploader` (SSH) for the fischertechnik TXT Controller.
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
- Do not remove Copilot SDD files just because `default_integration` is `codex`; Copilot remains not multi-install safe, so `integration.json` stays Codex-only to keep `specify integration status` clean.
- Use full SDD for changes to Extension Host/WebView contracts, Blockly block/generator contracts, persisted workspace formats, board upload flows, managed runtime, security boundaries, or major compatibility. Classify major dependency upgrades by actual impact. Documentation, translations, and isolated fixes that preserve contracts may use their focused maintenance skills.
- In Codex and Claude Code, use the Spec Kit skills in this order for full SDD: `$speckit-specify`, `$speckit-clarify`, `$speckit-plan`, `$speckit-tasks`, `$speckit-analyze`, `$speckit-implement`, `$speckit-converge`; use `$speckit-checklist` when a quality checklist is needed (Claude Code invokes the same skills as `/speckit-*`). Clarify requires an existing spec.
- At the start of new full SDD work, check the installed Spec Kit CLI, `specify integration status`, and the official stable release; upgrade only when required by compatibility or the task. The installed `speckit` workflow runs core stages only; it does not replace the full skill sequence above.
- In Copilot, use the matching `speckit.*` agents/prompts from `.github/agents` and `.github/prompts`.
- Claude Code reads the Spec Kit skills through `.claude/skills/speckit-*` relative links to `.agents/skills/speckit-*`; do not install a Claude integration or edit the linked copies.
- Feature branches follow the parallel development rules below, not the bare `NNN-name` default. Before `$speckit-specify`, get the next number with `.specify/extensions/git/scripts/bash/create-new-feature.sh --json --dry-run --short-name <name> "<description>"` and confirm no open PR already uses it. On a desktop, create the task worktree with branch `codex/NNN-name` or `claude/NNN-name` from the latest `origin/master` (see `parallel-worktrees.md`); in a cloud session, stay on the system-assigned `claude/…` branch. Run the `before_specify` hook (`speckit.git.feature`) inside that worktree with `GIT_BRANCH_NAME` set to the current branch and `--allow-existing-branch`, so it keeps the task branch instead of creating another one, and set `SPECIFY_FEATURE_DIRECTORY=specs/NNN-name` so the spec folder still uses the numbered name.
- Feature specs live in `specs/{NNN}-feature-name/`; check existing specs before creating a new one.
- Keep generated `spec.md`, `plan.md`, and `tasks.md` in the feature spec folder.
- Project-specific skills from `.github/skills` are linked into `.agents/skills`; update the source under `.github/skills`.
- For repository write tasks, use `maintain-singular-blockly` to establish a task-owned worktree and branch; for cross-file product maintenance, also use it to locate owning files and select affected checks. Specialized skills keep their own workflows.
- Contributor skills under `.github/skills` are linked into both `.agents/skills` (Codex) and `.claude/skills` (Claude Code); Spec Kit skills live in `.agents/skills` and are linked into `.claude/skills`. `CLAUDE.md` imports this file.

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

## Product Agent Skill
- This repository ships the Product Agent Skill to users; it is not one of the contributor skills above. The extension installs it into the user's project as `.agents/skills/singular-blockly/` (canonical) and `.claude/skills/singular-blockly/SKILL.md` (compact compatibility entry); neither path exists in this repository.
- Edit only the packaged sources under `resources/project-skills/singular-blockly/` (`canonical/` and `compatibility/claude-SKILL.md`); all human-readable Skill content must remain English.
- Run `npm run generate:project-skills` after block, toolbox, schema, or Skill changes, then run `npm run check:project-skills`.
- External `blockly/main.json` changes must pass the real Blockly load/save/load gate before becoming the last valid workspace.

## Commit and Pull Request Guidelines
- Use Conventional Commits, for example `feat(blocks): ...`, `fix(webview): ...`, `i18n(ja): ...`, `chore(deps): ...`.
- Common scopes: `blocks`, `generators`, `i18n`, `webview`, `skills`, `services`, `toolbox`, `deps`.
- PRs require CI passing (`CI Gate` and CodeQL on the current head), no merge conflicts, and clean ESLint. Branch naming, merge order, and merge preconditions follow the parallel development rules below.
- Localization PRs should use `.github/PULL_REQUEST_TEMPLATE/localization.md` and include before/after examples, audit references, and screenshots when useful.
- Translation-bearing changes must use the workspace `i18n-maintenance` Skill before commit and release review.

## Parallel Development and Merging
- Codex and Claude Code sessions (desktop or cloud) may work in parallel. Each write task uses its own worktree and branch: `codex/<task>` for Codex, `claude/<task>` for Claude Code, and the system-assigned `claude/…` branch in cloud sessions. See `.github/skills/maintain-singular-blockly/references/parallel-worktrees.md`.
- Before editing and again before opening a PR, list open PRs and their changed files. When two tasks touch the same shared contract (dependencies, WebView messages, blocks/generators/toolbox, Skill contract, workspace format, workflows, locales, shared summaries), split the shared part into a first PR and order the rest after it.
- Open PRs form the integration queue; only the PR carrying the `merge-lease` label may sync `master` and merge. Waiting PRs do not chase `master`. If `master` itself is red, fix the base in a separate PR at the front of the queue.
- Standing authorization from Ray (2026-10-20): non-release PRs may be squash-merged by the session that opened them, and routine Dependabot version updates within the scope defined in `manage-dependabot-prs` by the session handling them, without asking, once all preconditions in `.github/skills/maintain-singular-blockly/references/merge-queue.md` hold: in-scope local review is clear, the branch contains the latest `origin/master`, cloud-local verification (including visual and interaction checks for UI changes) passed on the final head, `CI Gate` and CodeQL succeeded on that head, there are no conflicts or unresolved review threads, and the merge uses `expectedHeadSha`. After merging, confirm the `master` CI run.
- Never overwrite other work: after every rebase, merge, or conflict resolution, check `git diff origin/master...HEAD` contains only this task's changes (no reverted lines from already-merged PRs) before pushing; never force-push someone else's branch; merge with `expectedHeadSha`.
- Release gates (Ray, 2026-10-22; see "發布門檻" in `.github/skills/pr-review-release/SKILL.md`): new user-visible UI needs Ray's confirmation of its appearance, and hardware-affecting features need Ray's physical hardware test, before they merge or ship enabled by default; until then they may merge only behind a default-off experimental setting. Cloud-local screenshots are evidence for Ray, not Ray's confirmation. Before any release, the coordinator checks every VSIX change since the last tag against these gates.
- Still ask Ray first for major-release candidates, releases the project coordinator did not decide (the coordinator decides patch and minor releases per "何時發布" and "誰決定發布" in `.github/skills/pr-review-release/SKILL.md`, then reports to Ray), removing or changing user-visible features when the scope is unclear, product decisions, repository settings/secrets/ruleset changes, and other people's PRs.

## Security and Configuration
- Report security issues through `SECURITY.md`.
- Contributors should use Node.js 24.20.0 to match the build and test toolchain; Node.js 22.16.0 remains the supported minimum.
- PlatformIO extension is required for hardware upload workflows.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/071-esp32-cyberbrick-rc/plan.md`
<!-- SPECKIT END -->
