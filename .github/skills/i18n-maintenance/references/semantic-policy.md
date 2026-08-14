# Semantic policy v1.0.0

## Contents

- Authority and evidence
- Severity rules
- Message-class checks
- Repair and waiver rules

## Authority and evidence

Use this precedence when sources disagree:

1. Actual product behavior and safety consequences.
2. Approved feature specifications and runtime contracts.
3. Versioned terminology and locale policy.
4. English locale text as the structural translation baseline.
5. Existing translations and model preference.

For sample names and strings, preserve the runtime fallback contract: target locale, then English, then the original Traditional Chinese text.

Evidence values are independent from severity:

- `deterministic`: a script proves a structural mismatch.
- `policy-backed`: a versioned rule or protected term proves the mismatch.
- `context-backed`: the call site or approved spec makes the intended behavior unambiguous.
- `ambiguous`: native-language preference, missing context, or multiple valid readings remain.

Never convert model confidence percentages into evidence.

## Severity rules

### SEM-001 Meaning completeness — Blocker or Major

Preserve actor, action, object, conditions, timing, negation, quantities, causality, fallback, and consequence. Use Blocker when omission or addition changes an operation, safety outcome, generated program, or user decision; otherwise use Major.

### SEM-002 Action and reversibility — Blocker

Ensure labels such as Continue, Cancel, Delete, Replace, Retry, Upload, and Save match the action. Never confuse reversible and irreversible actions.

### SEM-003 Safety and recovery — Blocker

Preserve risk level, concrete effect, affected files or device, and recovery or cancellation path. Do not replace a concrete consequence with an abstract “workspace/project problem.”

### SEM-004 Technical integrity — Blocker

Preserve board names, pins, protocols, brands, units, numeric ranges, paths, shortcuts, code identifiers, and placeholder meaning. Grammatical inflection is allowed only when it cannot be mistaken for a different technical entity.

### SEM-005 Child comprehension — Major

For child-facing UI, a user aged 8–14 should be able to answer: what happened, what should I do, and what will happen next? Prefer common words, concrete verbs, and short complete sentences. Keep necessary technical names and explain their effect in context; do not erase them merely because they are advanced.

### SEM-006 Tone and agency — Major or Minor

Use friendly, neutral, non-blaming language. Do not frighten, shame, patronize, or infantilize. Use Major only when tone could discourage or mislead the user; stylistic polish is Minor.

### SEM-007 Locale naturalness — Major or Minor

Follow the locale's grammar, politeness, and regional standard. Literal wording is Major only when it creates ambiguity or poor comprehension; otherwise it is Minor.

### SEM-008 Terminology status — Blocker, Major, or Minor

- `forbidden`: Blocker only when the term misidentifies an operation, region, or technical concept; otherwise Major.
- `deprecated`: Major for changed text, advisory for untouched baseline text.
- `preferred`: use for new or changed text.
- `allowed`: never flag solely because it differs from `preferred`.

### SEM-009 Cross-surface consistency — Major

Use one product concept consistently across WebView messages, VS Code commands, samples, and errors. Different grammatical forms are allowed.

### SEM-010 Accessibility — Blocker or Major

ARIA text must identify purpose, state, or action without relying only on color, icon position, or sight. Use Blocker when the wrong action/state is announced; otherwise Major.

### SEM-011 UI fit — Minor or Info

Character-count ratios alone never prove a semantic problem. Treat likely clipping as Minor only with message-class or rendered-UI evidence. Keep existing explicit safety-copy limits as guidance, not universal locale limits.

### SEM-012 Cultural and temporal stability — Minor or Info

Avoid stereotypes, trendy slang, memes, and short-lived internet wording. Do not modernize an accepted term during an unrelated audit. Propose terminology changes through a separate policy review.

## Message-class checks

- **Buttons and menu actions**: one unmistakable action; concise parallel grammar.
- **Warnings and confirmations**: affected object, consequence, reversibility, and safe next step.
- **Errors**: what failed, what remains safe, and a concrete recovery action when available.
- **Progress and success**: do not claim completion before the runtime has completed it.
- **Block labels and tooltips**: preserve technical meaning and placeholder order; labels may be terse, tooltips should explain.
- **ARIA**: describe semantic state/action rather than appearance.
- **Sample title/description**: natural educational wording; do not turn optional fallback locales into hard failures.
- **Sample identifiers**: retain ASCII identifier validity and definition/call consistency.

## Repair and waiver rules

- A single confirmed Blocker blocks release; do not average it away.
- Changed, policy-backed Major findings must be repaired.
- An ambiguous Major must remain `NEEDS_USER_DECISION` until the product owner chooses a candidate or accepts the current wording.
- Record a waiver with finding ID, chosen wording, literal back-translation, risk, and rationale. A waiver does not change policy.
- Existing untouched translations remain on the incremental baseline until a full audit or policy migration examines them.
- Full-audit Major findings become backlog; full-audit Blockers remain blocking until resolved.
