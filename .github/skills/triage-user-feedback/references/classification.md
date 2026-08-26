# Classification vocabulary

Use exactly one value from each group.

## Kind

- `kind:bug`: existing behavior fails or differs from documented behavior.
- `kind:feature`: asks for a new capability or material behavior change.
- `kind:question`: requests guidance and does not establish a product defect.
- `kind:other`: feedback that cannot responsibly fit the other kinds.

## Area

- `area:webview`: editor UI, accessibility, layout, or Blockly workspace orchestration.
- `area:blocks`: block definitions, toolbox entries, or block behavior.
- `area:generators`: Arduino or MicroPython code generation.
- `area:upload`: device discovery, build, upload, or execution.
- `area:toolchain`: PlatformIO, Python, mpremote, or managed runtime readiness.
- `area:hardware`: board- or sensor-specific behavior not isolated to upload.
- `area:localization`: translations, locale selection, or localized content.
- `area:documentation`: user-facing help or examples.
- `area:other`: no supported area fits without guessing.

## Impact

- `impact:critical`: credible security, privacy, destructive data loss, or broad unusability. Do not infer critical impact from urgency wording alone.
- `impact:high`: blocks a core workflow for a reproducible group with no reasonable workaround.
- `impact:medium`: materially degrades a workflow but has a workaround or limited scope.
- `impact:low`: cosmetic, minor friction, documentation, or uncertain impact.

## Recommendation

- `recommendation:investigate`: evidence is insufficient or a defect needs reproduction.
- `recommendation:duplicate`: strong observable match to a cited candidate.
- `recommendation:plan`: sufficiently clear candidate for owner prioritization; this is not approval.
- `recommendation:decline`: appears outside supported product scope; this is not a final decision.
- `recommendation:ask-info`: a precise missing fact prevents useful triage.

`ai:triaged` means only that suggestions were produced. It does not indicate correctness or approval.
