# Singular Blockly Workspace Format

## Source of truth

`blockly/main.json` is the complete editable workspace document. Read it before every change and replace it only with another complete document. Do not write a block fragment or generated source code into this file.

Use `workspace.schema.json` for the outer document. Use `block-contract.json` as the index for legal runtime metadata, then read only the category shard files it identifies for the block types you need. JSON Schema catches basic document errors; only Singular Blockly's real Blockly runtime decides whether the workspace is valid.

## Required document properties

- `board`: One board ID listed in `workspace.schema.json` and the block contract index.
- `workspace`: A Blockly serialization object accepted by `Blockly.serialization.workspaces.load`.
- `txtVirtualControls`: Optional TXT Controller virtual controls. Preserve it unless the requested change concerns those controls. A TXT document may contain valid virtual controls even when its Blockly workspace has no blocks.

Preserve unknown top-level properties. They may belong to a newer extension version or a project-specific workflow.

## Editing rules

1. Preserve the current `board` unless the user requests a supported board change.
2. Select block types whose `boards` array contains the document board, then use that board's entry in `variants` for all runtime metadata.
3. Start from `variants[board].minimalState` when creating a block.
4. Use only named fields and values allowed by `variants[board].fields`. Preserve variable field objects and dynamic `extraState` structures.
5. Put value blocks in `variants[board].inputs` whose kind is `VALUE`; put statement chains in inputs whose kind is `STATEMENT`; use `next` only when the involved board variant connections are enabled.
6. Respect the selected board variant's connection `check` arrays. `check: null` with `enabled: true` is unrestricted; `enabled: false` means the connection does not exist.
7. Preserve block IDs for unchanged blocks. Use fresh unique IDs for new blocks.
8. Keep required setup, main, and context-owner blocks. Do not create orphan blocks that violate product guards.
9. Write valid UTF-8 JSON and wait for runtime validation. Do not treat a successful file write as successful workspace loading.

## Validation and recovery

The extension loads candidates into disposable Blockly workspaces, saves a normalized result, and loads it a second time. Invalid candidates are placed at `blockly/main.invalid.json` with limited history, while the last valid `blockly/main.json.bak` is restored when available.

Use the stable issue code in `blockly/.singular-blockly/workspace-validation-status.json` to correct a rejected candidate. Never expose or copy candidate content into diagnostics, and never delete recovery files to force acceptance.

## Generated program locations

- Arduino boards: generated C++ is written to `src/main.cpp`.
- CyberBrick: generated MicroPython is written to `src/rc_main.py`.
- TXT Controller: generated Python is written to `src/main.py`.

Modify `blockly/main.json`, then let Singular Blockly regenerate program output. Preserve existing generator files and project configuration unless the user explicitly asks for a separate code-level change.
