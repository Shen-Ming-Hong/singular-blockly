# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.51.x  | :white_check_mark: |
| < 0.50  | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities by opening a [GitHub Security Advisory](https://github.com/Shen-Ming-Hong/singular-blockly/security/advisories/new).

## Known Issues

### @modelcontextprotocol/sdk ReDoS Vulnerability (CVE-2026-0621)

**Status**: Waiting for upstream fix  
**Severity**: High (CVSS 4.0: 8.7)  
**Affected versions**: <= 1.25.1  
**Advisory**: [GHSA-8r9q-7v3j-jr4g](https://github.com/advisories/GHSA-8r9q-7v3j-jr4g)

**Description**: The MCP TypeScript SDK contains a ReDoS vulnerability in the `UriTemplate` class when processing RFC 6570 exploded array patterns.

**Impact Assessment for Singular Blockly**:
- **Risk Level**: Low for typical usage
- **Attack Vector**: Requires sending malicious URI patterns to the MCP server
- **Mitigation**: The MCP server in this extension only accepts local connections from VS Code/GitHub Copilot. External network access is not exposed.

**Workaround**: No workaround available. Waiting for upstream `@modelcontextprotocol/sdk` to release a patched version.

**Tracking**: 
- Upstream issue: https://github.com/modelcontextprotocol/typescript-sdk/issues/965
- Dependabot alert: https://github.com/Shen-Ming-Hong/singular-blockly/security/dependabot/10

We will update the dependency as soon as a patched version becomes available.

---

*Last updated: 2026-01-07*
