# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.82.x  | :white_check_mark: |
| < 0.82  | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities by opening a [GitHub Security Advisory](https://github.com/Shen-Ming-Hong/singular-blockly/security/advisories/new).

## Known Deferred Vulnerabilities

| Package  | Severity | Advisory | Reason                                                    |
| -------- | -------- | -------- | --------------------------------------------------------- |
| _(none)_ | —        | —        | All known vulnerabilities have been resolved as of 0.82.16 |

> **0.82.16 更新 Update**: `form-data` (`GHSA-hmw2-7cc7-3qxx` / `CVE-2026-12143`) 升級至 `4.0.6`，修復 CRLF 注入；`hono` (`GHSA-88fw-hqm2-52qc` / `CVE-2026-54290`, `GHSA-wwfh-h76j-fc44` / `CVE-2026-54286`, `GHSA-j6c9-x7qj-28xf` / `CVE-2026-54287`, `GHSA-wgpf-jwqj-8h8p` / `CVE-2026-54289`, `GHSA-rv63-4mwf-qqc2` / `CVE-2026-54288`) override 升級至 `^4.12.25`，lockfile 安裝 `4.12.27`，修復 Dependabot Alerts #75-#80；`ws` override 升級至 `^8.21.0`，修復記憶體耗盡 DoS；新增 `js-yaml` override `>=4.2.0` 修復 merge key DoS。本地 `npm audit` 顯示 0 vulnerabilities。
> `form-data` (`GHSA-hmw2-7cc7-3qxx` / `CVE-2026-12143`) upgraded to `4.0.6`, fixing CRLF injection; `hono` override upgraded to `^4.12.25` (lockfile `4.12.27`), fixing Dependabot Alerts #75–#80; `ws` override upgraded to `^8.21.0`, fixing memory exhaustion DoS; added `js-yaml` override `>=4.2.0`, fixing merge key DoS. Local `npm audit` reports 0 vulnerabilities.

> **0.82.15 更新 Update**: `hono` (`GHSA-f577-qrjj-4474` / `CVE-2026-47673`, `GHSA-xrhx-7g5j-rcj5` / `CVE-2026-47674`, `GHSA-3hrh-pfw6-9m5x` / `CVE-2026-47675`, `GHSA-2gcr-mfcq-wcc3` / `CVE-2026-47676`) 已透過 npm override 升級至 `^4.12.21`，lockfile 安裝版本為 `4.12.23`，修復 Dependabot Alerts #71-#74 並清除本地 `npm audit` 的 medium 風險。
> `hono` (`GHSA-f577-qrjj-4474` / `CVE-2026-47673`, `GHSA-xrhx-7g5j-rcj5` / `CVE-2026-47674`, `GHSA-3hrh-pfw6-9m5x` / `CVE-2026-47675`, `GHSA-2gcr-mfcq-wcc3` / `CVE-2026-47676`) has been upgraded via npm override to `^4.12.21`, with `4.12.23` installed in the lockfile, fixing Dependabot Alerts #71-#74 and clearing the local `npm audit` medium finding.

> **0.82.11 更新 Update**: CyberBrick USB port 預掃描與 OTA 設定頁 USB port 清單會先沿用 PlatformIO `penv` 的 `mpremote` 自動安裝流程；缺少 `mpremote` 不再被靜默誤判成找不到 COM port，且未改動 v0.82.10 已驗證的 Windows `fs cp` / `resume + run` 命令分流。
> CyberBrick USB port pre-detection and the OTA settings USB port list now reuse the PlatformIO `penv`-based `mpremote` auto-install flow first; missing `mpremote` is no longer silently treated as no COM port found, and the Windows `fs cp` / `resume + run` command split verified in v0.82.10 is unchanged.

> **0.82.10 更新 Update**: Windows `mpremote ... fs cp` USB 上傳改用 `execFile` argv 執行，避免 shell 解析本機暫存路徑造成「檔案名稱、目錄名稱或磁碟區標籤語法錯誤」；Windows `resume + run` helper 維持前次驗證過的 shell 相容路徑。
> Windows `mpremote ... fs cp` USB uploads now run through `execFile` argv to avoid shell parsing failures for local temporary paths; Windows `resume + run` helpers keep the previously verified shell-compatible path.

> **0.82.9 更新 Update**: Windows Python / pyserial helper 改用 `execFile` argv 直接執行，避免暫存腳本路徑被 short path helper 轉成 `C:\"C:\...\"` 這類無效路徑；short path helper 也會驗證輸出並在格式異常時回退原路徑。
> Windows Python / pyserial helpers now run directly through `execFile` argv, preventing temporary script paths from being converted into malformed values such as `C:\"C:\...\"`; the short path helper also validates output and falls back to the original path when malformed.

> **0.82.8 更新 Update**: Windows `mpremote` helper 命令恢復相容格式：只 quote executable、COM port 與本機檔案路徑，mpremote command tokens 不加引號，修復 v0.82.7 在 Windows 造成 Wi-Fi 掃描與 USB 上傳失敗的回歸；仍未重新引入 incomplete backslash quote。
> Windows `mpremote` helper commands now use the compatible format again: only the executable, COM port, and local file paths are quoted while mpremote command tokens remain unquoted, fixing the v0.82.7 Windows Wi-Fi scan and USB upload regression without reintroducing incomplete backslash quoting.

> **0.82.7 更新 Update**: GitHub Code scanning Alert #11 (`js/incomplete-sanitization`) 已在本地修復：CyberBrick MicroPython 上傳相關命令避免不完整 backslash quote；Windows `mpremote` helper 命令維持相容的 shell command 執行路徑，避免 Wi-Fi 掃描回歸。
> GitHub Code scanning Alert #11 (`js/incomplete-sanitization`) has been fixed locally: CyberBrick MicroPython upload commands avoid incomplete backslash quoting; Windows `mpremote` helper commands keep the compatible shell-command path to avoid Wi-Fi scan regressions.

> **0.82.6 更新 Update**: 本地 `npm audit` 顯示 0 vulnerabilities，GitHub Dependabot open alerts 為 0；目前沒有已知待處理漏洞。
> Local `npm audit` reports 0 vulnerabilities, and GitHub Dependabot has 0 open alerts; there are no known pending vulnerabilities.

> **0.78.1 更新 Update**: `qs` (`GHSA-q8mj-m7cp-5q26`, `CVE-2026-8723`) 已透過 npm override 升級至 `6.15.2` 修復，清除本地 `npm audit` 的 moderate 風險。
> `qs` (`GHSA-q8mj-m7cp-5q26`, `CVE-2026-8723`) has been fixed by upgrading the npm override to `6.15.2`, clearing the moderate finding from local `npm audit`.

> **0.76.1 更新 Update**: `ws` (`GHSA-58qx-3vcg-4xpx`, `CVE-2026-45736`) 已透過 npm override 升級至 `8.20.1` 修復；`brace-expansion` (`GHSA-jxxr-4gwj-5jf2`) 已在 `glob` → `minimatch@10.2.4` 路徑下升級至 `5.0.6`，清除本地 `npm audit` 的 moderate 風險。
> `ws` (`GHSA-58qx-3vcg-4xpx`, `CVE-2026-45736`) has been fixed by upgrading the npm override to `8.20.1`; `brace-expansion` (`GHSA-jxxr-4gwj-5jf2`) has been upgraded to `5.0.6` on the `glob` → `minimatch@10.2.4` path, clearing the moderate findings from local `npm audit`.

> **0.73.1 更新 Update**: `hono` (`GHSA-9vqf-7f2p-gf9v`, `GHSA-69xw-7hcm-h432`, `GHSA-p77w-8qqv-26rm`, `GHSA-hm8q-7f3q-5f36`, `GHSA-qp7p-654g-cw7p`) 已透過 npm override 升級至 `4.12.18` 修復；`fast-uri` (`GHSA-q3j6-qgpj-74h6`, `GHSA-v39h-62p7-jpjc`) 已升級至 `3.1.2`；`express-rate-limit` 已升級至 `8.5.1` 並搭配 `ip-address` (`GHSA-v2v4-37r5-5v8g`) 升級至 `10.2.0`。
> `hono` (`GHSA-9vqf-7f2p-gf9v`, `GHSA-69xw-7hcm-h432`, `GHSA-p77w-8qqv-26rm`, `GHSA-hm8q-7f3q-5f36`, `GHSA-qp7p-654g-cw7p`) has been fixed by upgrading the npm override to `4.12.18`; `fast-uri` (`GHSA-q3j6-qgpj-74h6`, `GHSA-v39h-62p7-jpjc`) has been upgraded to `3.1.2`; `express-rate-limit` has been upgraded to `8.5.1` together with `ip-address` (`GHSA-v2v4-37r5-5v8g`) upgraded to `10.2.0`.

> **0.72.3 更新 Update**: `hono` (GHSA-458j-xx4x-4375) 已透過 npm override 升級至 `4.12.14` 修復。
> `hono` (GHSA-458j-xx4x-4375) has been fixed by upgrading the npm override to `4.12.14`.

> **0.67.6 更新 Update**: `picomatch` (CVE-2026-33672)、`path-to-regexp` (GHSA-j3q9-mxjg-w52f / GHSA-27v5-c462-wpq7)、`brace-expansion` (GHSA-f886-m6hf-6m8v)、`serialize-javascript` (GHSA-qj8w-gfj5-8c6v) 已透過 npm override 修復。
> `picomatch` (CVE-2026-33672), `path-to-regexp` (GHSA-j3q9-mxjg-w52f / GHSA-27v5-c462-wpq7), `brace-expansion` (GHSA-f886-m6hf-6m8v), `serialize-javascript` (GHSA-qj8w-gfj5-8c6v) have been fixed via npm overrides.

---

_Last updated: 2026-06-23_
