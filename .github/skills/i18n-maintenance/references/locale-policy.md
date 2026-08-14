# Locale policy and terminology v1.0.0

## Contents

- Status vocabulary
- Protected product terms
- Locale profiles
- Policy evolution

## Status vocabulary

- `preferred`: default for new or changed copy.
- `allowed`: equally valid in the documented context.
- `deprecated`: do not introduce; migrate only in scoped terminology work.
- `forbidden`: use only for wording that changes a product, regional, safety, or operational meaning.

## Protected product terms

Keep these preferred spellings in every locale unless grammar requires an unambiguous suffix or case ending:

`Arduino`, `Blockly`, `CyberBrick`, `MicroPython`, `Node.js`, `PlatformIO`, `Python`, `VS Code`, `Wi-Fi`.

Keep board IDs, API names, protocols, pin labels, file paths, keyboard shortcuts, units, and code identifiers exact. Translate the explanation around them.

## Locale profiles

### en — English

- Use plain international English and concrete verbs.
- Prefer “folder and files” over abstract “workspace” in child-facing safety consequences.
- Allow established technical names when the action is explained.

### zh-hant — Traditional Chinese (Taiwan)

- Use Taiwan terminology and natural Traditional Chinese.
- Preferred: `程式`, `函式`, `感測器`, `伺服馬達`, `積木`.
- Forbidden for changed UI: `程序`, `函數`, `傳感器`, `伺服電機` when they refer to the concepts above.
- Use concrete consequences such as `建立 Blockly 資料夾和檔案` for child-facing safety copy.

### ja — Japanese

- Use natural educational Japanese; use です・ます style for instructions and dialogs.
- Preferred technical terms: `ブロック`, `センサー`.
- Allowed: concise noun phrases and plain forms in block labels where polite endings would be unnatural.
- Deprecated: excessive katakana transliteration when a common Japanese educational term exists.

### ko — Korean

- Use 해요체 for instructions and child-facing dialogs.
- Preferred technical terms: `블록`, `센서`.
- Allowed: concise noun phrases in block labels.
- Deprecated: 하십시오체 in ordinary student guidance unless a platform-provided string requires it.

### de — German

- Use direct, informal educational language; prefer `du` or pronoun-free imperatives.
- Preferred technical terms: `Block`, `Sensor`.
- Deprecated: formal `Sie` in student instructions. Do not flag capitalized `Sie` when it is not a pronoun.

### fr — French

- Use neutral, clear educational French and concise action labels.
- Preferred technical terms: `bloc`, `capteur`.
- Preserve product names and explain necessary English technical terms in surrounding text.

### es — Spanish

- Use neutral Spanish suitable across regions and informal direct instructions.
- Preferred technical terms: `bloque`, `sensor`, `computadora` when a device noun is necessary.
- Allowed: region-neutral phrasing that avoids the computer noun entirely.
- Deprecated: `usted` and strongly Spain-specific `ordenador` in new child-facing instructions; treat as advisory unless comprehension changes.

### it — Italian

- Use clear, neutral educational Italian and direct action labels.
- Preferred technical terms: `blocco`, `sensore`.

### pt-br — Brazilian Portuguese

- Use Brazilian Portuguese, not European Portuguese defaults.
- Preferred technical terms: `bloco`, `sensor`, `computador`.

### ru — Russian

- Use clear educational Russian and concise imperatives without unnecessary bureaucracy.
- Preferred technical terms: `блок`, `датчик`.
- Preserve Latin product names and identifiers.

### pl — Polish

- Use clear educational Polish and consistent aspect in actions.
- Preferred technical terms: `blok`, `czujnik`.
- Preserve Latin product names and identifiers.

### cs — Czech

- Use clear educational Czech and concise action labels.
- Preferred technical terms: `blok`, `senzor`.
- Preserve Latin product names and identifiers.

### hu — Hungarian

- Use clear educational Hungarian; grammatical suffixes on protected product names are allowed when unmistakable.
- Preferred technical terms: `blokk`, `érzékelő`.

### bg — Bulgarian

- Use clear educational Bulgarian and concise action labels.
- Preferred technical terms: `блок`, `сензор`.
- Preserve Latin product names and identifiers.

### tr — Turkish

- Use clear educational Turkish; grammatical suffixes on protected product names are allowed when unmistakable.
- Preferred technical terms: `blok`, `sensör`.

## Policy evolution

- Treat this file and `semantic-policy.md` as versioned product policy, not suggestions generated during an audit.
- Change terminology status only in a separately reviewed change with examples and migration scope.
- When a rule or status changes audit outcomes, increment the versions in this file, `semantic-policy.md`, and `scripts/i18n/prepare-semantic-audit.js`. Leave the older value in `audit-state.json` until the new full audit starts so the helper returns `policy-changed`.
- A newly deprecated term does not retroactively block unrelated PRs. A newly forbidden operationally incorrect term may create a full-audit Blocker.
