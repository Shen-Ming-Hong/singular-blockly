---
name: singular-blockly
description: Understand existing Singular Blockly workspaces and create or modify legal Blockly JSON. Use when inspecting, explaining, adding, changing, or removing blocks in blockly/main.json for Arduino, CyberBrick, or TXT projects.
---

# Work with Singular Blockly

1. Read `blockly/main.json` before changing or explaining a workspace.
2. For edits or format questions, read [workspace-format.md](references/workspace-format.md) and [workspace.schema.json](references/workspace.schema.json).
3. When block metadata matters, use the [block contract index](references/block-contract.json) `shards[].blockTypes` to locate types; read only the referenced category shard files, extracting matching `blocks[]` entries. The selected board's `variants[board]` defines legal fields, inputs, connections, extra state, and minimal state.
4. Before edits or when relevant to an answer, read [project-notes.md](project-notes.md) if present; preserve its constraints.
5. Edit the complete `blockly/main.json` document. Never invent block metadata or change the board without a request. Let Singular Blockly generate source at the paths in [workspace-format.md](references/workspace-format.md).
6. After writing, wait for runtime validation; report it as unverified if unavailable. If quarantined, inspect `blockly/.singular-blockly/workspace-validation-status.json`, correct the candidate, and retry. Never delete `blockly/main.json.bak`, `blockly/main.invalid.json`, or recovery history.
