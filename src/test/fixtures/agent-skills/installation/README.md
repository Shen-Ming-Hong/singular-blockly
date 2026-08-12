# Project Skill installation fixtures

- `old-manifest.json`: trusted older payload metadata.
- `unmanaged-conflict.json`: same-name content without a trusted manifest.
- Filesystem error and read-only cases are injected by the unit-test `FileSystem` implementation so they remain deterministic.
