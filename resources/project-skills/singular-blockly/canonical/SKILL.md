---
name: singular-blockly
description: Understand existing Singular Blockly workspaces and create or modify legal Blockly JSON. Use when inspecting, explaining, adding, changing, or removing blocks in blockly/main.json for Arduino, CyberBrick, or TXT projects.
---

# Work with Singular Blockly

1. Read `blockly/main.json` before proposing or applying a workspace change.
2. Read [workspace-format.md](references/workspace-format.md) for the document and editing rules.
3. Read [workspace.schema.json](references/workspace.schema.json) for the document-level shape.
4. Read the [block contract index](references/block-contract.json), locate every block type you will use in `shards[].blockTypes`, and read only the referenced category shard files. Treat each block's board membership and the selected board's `variants[board]` fields, inputs, connections, extra state, and minimal state as authoritative.
5. Read [project-notes.md](project-notes.md) when it exists. Preserve all user notes and project-specific constraints.
6. Write a complete `blockly/main.json` document. Never invent a block type, field, input, connection, or extra state.
7. Wait for Singular Blockly runtime validation after writing. A valid candidate is normalized and loaded by the real Blockly runtime.
8. If the candidate is quarantined, inspect `blockly/.singular-blockly/workspace-validation-status.json` and its stable issue code, correct the candidate, and try again. Do not delete `blockly/main.json.bak`, `blockly/main.invalid.json`, or recovery history.

Keep the existing board unless the user explicitly requests a board change. Use the generator output locations described in [workspace-format.md](references/workspace-format.md); do not hand-edit generated source as a substitute for workspace changes.
