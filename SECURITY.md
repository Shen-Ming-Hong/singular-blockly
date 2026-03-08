# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.67.x  | :white_check_mark: |
| < 0.67  | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities by opening a [GitHub Security Advisory](https://github.com/Shen-Ming-Hong/singular-blockly/security/advisories/new).

## Known Deferred Vulnerabilities

| Package | Severity | Advisory | Reason |
| ------- | -------- | -------- | ------ |
| `diff` (via `@vscode/test-cli` → `mocha`) | Low | [GHSA-73rr-hh4g-fpgx](https://github.com/advisories/GHSA-73rr-hh4g-fpgx) | Fix requires downgrading `@vscode/test-cli` to `0.0.11` (breaking change); dev-only dependency, not shipped to users |

---

_Last updated: 2026-03-08_
