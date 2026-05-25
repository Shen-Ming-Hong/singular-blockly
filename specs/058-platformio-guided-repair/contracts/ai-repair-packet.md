# Contract：AI Repair Packet

## 範圍

AI repair packet 是使用者可複製給 AI 助手的 Markdown/plain text。它的目標不是替 AI 下指令操作本機，而是提供足夠脈絡讓 AI 回覆「這次問題的可能原因、已排除項目、下一步與風險」。

## 產生時機

- 使用者點擊 `複製 AI 修復摘要`。
- 診斷結果為 `degraded` 或 `unavailable` 時應可用。
- 修復流程成功或失敗後也應可用，並包含修復歷程。

## 必要欄位

```text
# Singular Blockly PlatformIO Repair Packet
Generated At: <ISO timestamp>
Workspace Scope: <masked workspace summary>
Overall Status: <operational|degraded|unavailable>

## Problem
<簡短問題描述>

## Environment
- OS: <platform/arch>
- VS Code: <version if available>
- Singular Blockly: <version if available>
- PlatformIO Extension: <installed/enabled/version if available>
- PlatformIO Settings Evidence: <masked summary>

## Diagnostics
<fixed-order diagnostic findings with status, source, masked path, probe summary>

## Repair Attempts
<repair history or "No automatic repair has been run yet">

## Current Blocker
<目前最可能阻塞點與證據>

## Constraints
- Do not recommend system-level changes unless explicitly asked.
- Prefer user-space, reversible steps.
- Account for Windows Unicode paths and VS Code/PlatformIO customPATH.

## Requested Response
Please reply with:
1. Likely root cause
2. What has already been ruled out
3. Safest next steps
4. Risks or data to check before changing anything
```

## Redaction 規則

必須預設遮罩：

- 使用者 home path：`/Users/<name>`、`C:\Users\<name>`。
- Workspace path：以 `<workspace>` 或 hash summary 取代。
- Proxy credential：`http://user:pass@host` → `http://<redacted>@host`。
- token-like 字串：長度高且符合 API key/token pattern 的內容。
- Email、私有 hostname（可採保守遮罩）。
- stdout/stderr 中的 credential 或 path。

可保留：

- OS 類型、CPU arch、工具版本。
- 檔名或目錄尾端（例如 `penv/bin/pio`），前提是不暴露使用者名稱。
- 設定是否啟用，例如 `useBuiltinPIOCore=true`。

## 正確性規則

- 不可聲稱執行了未發生的 repair step。
- 不可把 AI packet 當作 public issue；issue draft 使用另一個 contract。
- 若 redactor 無法判定內容是否安全，預設遮罩。
- 內容應穩定排序，便於測試與比對。

## 成功回饋

複製成功後 WebView 顯示：

- 成功狀態。
- 已遮罩提醒。
- 若有歷程被 fingerprint 標記為 stale，需註明「部分歷程可能已過期」。
