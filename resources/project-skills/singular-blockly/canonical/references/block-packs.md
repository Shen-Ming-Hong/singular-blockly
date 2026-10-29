# Singular Blockly Block Packs

A block pack adds blocks for one sensor or module. Its definition lives inside the workspace, so a project keeps working when the original `.sbpack.json` file is not present. Block packs generate code only for the ESP32 DevKit board (`esp32`).

## Where packs are stored

`blockly/main.json` stores imported packs at `workspace.customBlocks`:

```json
{ "formatVersion": 1, "packs": [ { "formatVersion": 1, "id": "hc_sr04", "version": "1.0.0", "...": "..." } ] }
```

- Preserve `workspace.customBlocks` exactly unless the user asks to add, update, or remove a pack. When it is absent, the project has no packs.
- Each entry is a complete pack definition plus optional `importedAt` and `sourceName`. Pack `id` values are unique.
- The extension validates this section before loading an edited `blockly/main.json`. An invalid section rejects the candidate with `INVALID_BLOCK_PACK`.

## Using pack blocks

- A pack block type is `pack_<packId>_<blockName>`, for example `pack_hc_sr04_distance`. Only use types whose pack is present in `workspace.customBlocks.packs`.
- These types are not in `block-contract.json`. Derive their shape from the pack:
  - `shape: "statement"` has previous and next connections; `shape: "value"` has an output (`output` is its check, or unrestricted when omitted).
  - `kind: "value"` and `kind: "statement"` inputs are Blockly inputs named after the input. Put value blocks and statement chains there.
  - `number`, `text`, `dropdown`, and `pin` inputs are fields named after the input. A `dropdown` value must be one of its option values. A `pin` value is an ESP32 GPIO number as a string; `direction: "output"` cannot use 34, 35, 36, or 39, and `mode: "analog"` uses 32, 33, 34, 35, 36, or 39.
- Pack blocks follow the same orphan rules as built-in blocks: put them inside `setup()`, `loop()`, or a function.
- On other boards pack blocks stay in the workspace but generate only a comment; do not add them to non-ESP32 projects.

## Packs made in the block designer

Most packs are made in the editor's block designer instead of written by hand. A designed pack has an extra `designer` section: `{ "formatVersion": 1, "globals": "...", "blocks": [{ "name", "state", "body" }] }`. `state` is the designer's own Blockly workspace and `body` is the function body the user wrote; the designer regenerates `blocks`, `targets.esp32.blocks`, and the function definitions in `targets.esp32.globals` from them.

- Do not edit a designed pack's `blocks`, `targets`, or `designer` by hand. The next save in the designer would overwrite the hand edits. Ask the user to change the block in the designer instead.
- Each designed block calls one C++ function: value blocks use `fn(args)`, statement blocks use `fn(args);`, and a block with an inner statement input uses `if (fn(args)) { ... }`.
- When the designer removes an input, blocks that were plugged into that input on existing pack blocks are moved to the top level of the workspace instead of being deleted.

## Placeholders

When a pack is missing, its blocks load as `block_pack_placeholder_statement` or `block_pack_placeholder_value`. `extraState.original` keeps the complete original block. Never edit or delete a placeholder's `extraState.original`; the extension restores the block when the pack is imported again.

## Writing a pack file

Pack files use the `.sbpack.json` extension. The rules below match the extension's validator.

- Top level: `formatVersion: 1`, `id` (`^[a-z][a-z0-9_]{1,31}$`), `version` (`MAJOR.MINOR.PATCH`), optional `author` (80 characters or fewer), `defaultLocale` (one of `en`, `zh-hant`, `ja`, `ko`, `de`, `fr`, `es`, `it`, `pt-br`, `ru`, `pl`, `cs`, `hu`, `bg`, `tr`), `category: { name, colour }` with `colour` either a hue from 0 to 360 or a `#rrggbb` string, `blocks` (1 to 50), `targets` containing only `esp32`, and optional `designer` (see above). No other keys are allowed except `$schema`.
- Text that people read (`category.name`, `label`, `tooltip`, dropdown option labels) is either a string or an object keyed by locale that includes `defaultLocale`.
- Each block has `name` (`^[a-z][a-z0-9_]{0,31}$`, unique in the pack), `shape`, `label`, optional `tooltip`, optional `output` for value blocks, and up to 10 `inputs`.
- Each input has `name` (`^[A-Z][A-Z0-9_]{0,31}$`, unique in the block) and `kind`: `value` (optional `check` and `default`), `number` (`default`, optional `min`, `max`, `precision`), `text` (`default`), `dropdown` (`options: [[label, value], ...]`, values match `^[A-Za-z0-9_]+$`), `pin` (`mode: "digital" | "analog"`, optional `direction: "input" | "output"` and `exclusive`), or `statement`.
- Every label, in every language, uses each input exactly once as `{NAME}`.
- `targets.esp32` has `blocks` with one C++ template per block, plus optional `includes` (header names such as `DHT.h`), `libDeps` (PlatformIO `owner/name@version`, never a URL), `globals`, and `setup`.
- Templates may reference only their own block's inputs as `{{NAME}}`. Value inputs are wrapped in parentheses, text inputs become escaped C++ string literals, and statement inputs become the inner code. `includes`, `globals`, `setup`, and `libDeps` are emitted once per program.
- Templates are plain text substitution. Nothing in a pack runs inside the editor.

Designing, importing, exporting, updating, or removing packs in the editor requires the experimental `singular-blockly.experimental.blockPacks` setting, which is off by default; packs already in `blockly/main.json` still load and generate code without it.

Importing a pack with `libDeps` requires a trusted VS Code workspace and the user's confirmation, because PlatformIO downloads those libraries when building.
