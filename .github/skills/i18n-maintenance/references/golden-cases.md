# Semantic audit golden cases

Use these cases to calibrate the finding schema. Exact wording may vary; classification and gate outcome must remain stable.

| Case | Source and target | Required result |
| --- | --- | --- |
| Reversed action | Source button `Cancel`; Spanish target `Continuar` | `SEM-002`, Blocker, context-backed |
| Missing safety consequence | Source says Blockly folders and files will be created; target says only “Continue with this workspace?” | `SEM-003`, Blocker, context-backed |
| Wrong technical value | Source `GPIO 4`; target says `GPIO 5` | `SEM-004`, Blocker, context-backed |
| Lost negation | Source `Do not disconnect`; target means `Disconnect` | `SEM-001`, Blocker, context-backed |
| Placeholder multiplicity | Source contains `{0}` twice; target once | deterministic validator finding, not a style judgment |
| Necessary technical term | Child-facing text keeps `Node.js` and says why it is needed | Pass; `SEM-005` must not remove the name |
| Taiwan terminology | Changed zh-hant UI uses `傳感器` for sensor | `SEM-008`, Major, policy-backed; recommend `感測器` |
| Allowed grammar | Turkish adds an unambiguous case suffix to `CyberBrick` | Pass under locale policy |
| Regional preference | Spanish uses `ordenador` but meaning remains clear | Minor advisory for changed child-facing text; never Blocker by itself |
| Two plausible readings | A short target can mean either “keep this file” or “keep all current files” and context does not resolve it | Major, ambiguous, `NEEDS_USER_DECISION`; provide back-translation and two candidates |
| Length only | Target is 170% of English but complete and UI has not been rendered | `SEM-011`, Info at most |
| Visual-only ARIA | ARIA says `Click the blue icon` without purpose | `SEM-010`, Major, context-backed |
