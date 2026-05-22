# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.76.x  | :white_check_mark: |
| < 0.76  | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities by opening a [GitHub Security Advisory](https://github.com/Shen-Ming-Hong/singular-blockly/security/advisories/new).

## Known Deferred Vulnerabilities

| Package  | Severity | Advisory | Reason                                                    |
| -------- | -------- | -------- | --------------------------------------------------------- |
| _(none)_ | —        | —        | All known vulnerabilities have been resolved as of 0.76.1 |

> **0.76.1 更新 Update**: `ws` (`GHSA-58qx-3vcg-4xpx`, `CVE-2026-45736`) 已透過 npm override 升級至 `8.20.1` 修復；`brace-expansion` (`GHSA-jxxr-4gwj-5jf2`) 已在 `glob` → `minimatch@10.2.4` 路徑下升級至 `5.0.6`，清除本地 `npm audit` 的 moderate 風險。
> `ws` (`GHSA-58qx-3vcg-4xpx`, `CVE-2026-45736`) has been fixed by upgrading the npm override to `8.20.1`; `brace-expansion` (`GHSA-jxxr-4gwj-5jf2`) has been upgraded to `5.0.6` on the `glob` → `minimatch@10.2.4` path, clearing the moderate findings from local `npm audit`.

> **0.73.1 更新 Update**: `hono` (`GHSA-9vqf-7f2p-gf9v`, `GHSA-69xw-7hcm-h432`, `GHSA-p77w-8qqv-26rm`, `GHSA-hm8q-7f3q-5f36`, `GHSA-qp7p-654g-cw7p`) 已透過 npm override 升級至 `4.12.18` 修復；`fast-uri` (`GHSA-q3j6-qgpj-74h6`, `GHSA-v39h-62p7-jpjc`) 已升級至 `3.1.2`；`express-rate-limit` 已升級至 `8.5.1` 並搭配 `ip-address` (`GHSA-v2v4-37r5-5v8g`) 升級至 `10.2.0`。
> `hono` (`GHSA-9vqf-7f2p-gf9v`, `GHSA-69xw-7hcm-h432`, `GHSA-p77w-8qqv-26rm`, `GHSA-hm8q-7f3q-5f36`, `GHSA-qp7p-654g-cw7p`) has been fixed by upgrading the npm override to `4.12.18`; `fast-uri` (`GHSA-q3j6-qgpj-74h6`, `GHSA-v39h-62p7-jpjc`) has been upgraded to `3.1.2`; `express-rate-limit` has been upgraded to `8.5.1` together with `ip-address` (`GHSA-v2v4-37r5-5v8g`) upgraded to `10.2.0`.

> **0.72.3 更新 Update**: `hono` (GHSA-458j-xx4x-4375) 已透過 npm override 升級至 `4.12.14` 修復。
> `hono` (GHSA-458j-xx4x-4375) has been fixed by upgrading the npm override to `4.12.14`.

> **0.67.6 更新 Update**: `picomatch` (CVE-2026-33672)、`path-to-regexp` (GHSA-j3q9-mxjg-w52f / GHSA-27v5-c462-wpq7)、`brace-expansion` (GHSA-f886-m6hf-6m8v)、`serialize-javascript` (GHSA-qj8w-gfj5-8c6v) 已透過 npm override 修復。
> `picomatch` (CVE-2026-33672), `path-to-regexp` (GHSA-j3q9-mxjg-w52f / GHSA-27v5-c462-wpq7), `brace-expansion` (GHSA-f886-m6hf-6m8v), `serialize-javascript` (GHSA-qj8w-gfj5-8c6v) have been fixed via npm overrides.

---

_Last updated: 2026-05-22_
