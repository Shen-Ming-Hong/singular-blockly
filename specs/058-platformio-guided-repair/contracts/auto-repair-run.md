# Contract：Auto Repair Run

## 範圍

此契約定義 guided repair 的規劃與執行邊界。v1 只支援 user-space、allowlisted、有限步驟的 primary flow。

## 前置條件

- 已完成一次 PlatformIO diagnostic session。
- Repair planner 根據診斷結果與官方 PlatformIO settings evidence 找到至少一個安全 flow。
- 使用者完成 lightweight confirmation。
- 沒有其他 active repair run。

## 允許的 Step 類型

| 類型 | 是否可有副作用 | 說明 |
|------|----------------|------|
| `diagnostic-retry` | 否 | 重新執行診斷或版本 probe。 |
| `settings-aware-resolution` | 否 | 將 `platformio-ide.customPATH` 等公開設定納入候選並重新解析。 |
| `platformio-installer-check` | 否（v1 預設） | 可執行官方 installer `check core` 類似檢查；若要安裝需另列為 future work 或明確 confirmation。 |
| `user-space-python-package` | 是 | 在已確認的 user-space Python/penv 中安裝或更新必要 Python 套件，例如 `mpremote`。 |
| `manual-instruction` | 否 | 自動修復無法安全處理時，產生下一步指引。 |

## 禁止行為

- 不使用 `sudo`、系統管理員權限或 Windows registry edit。
- 不呼叫 Homebrew、apt、dnf、pacman、choco、winget 等系統套件管理器。
- 不修改 shell profile、系統 PATH、使用者 PATH 或全域環境變數。
- 不依賴 PlatformIO extension private `penv` internals 作為唯一來源。
- 不用 shell 字串執行外部程序；必須使用 `execFile` 或等效 API。
- 不在未確認前執行有副作用 step。

## 執行流程

```text
診斷完成
  -> 規劃 flow
  -> 使用者按「自動修復」
  -> 顯示 lightweight confirmation
  -> 使用者確認
  -> 建立 run record
  -> step 1
  -> 若成功且需要 retest，執行 retest
  -> step 2/3（若仍需要）
  -> stop on success 或 blocking failure
  -> 保存 history
  -> render 最終結果
```

## 成功判定

- 指令 exit code 成功只是 step success，不等於整體修復成功。
- 整體 `succeeded` 必須在修復後診斷中看到原本 blocking finding 變成 `ok`，或至少從 `unavailable` 改善到可明確下一步的 `degraded` 時標示 `partially-succeeded`。
- 若修復後仍 `unavailable`，run 應為 `failed` 或 `blocked`，並提供 AI packet/issue draft。

## Timeout 與輸出限制

- 每個外部程序 step 必須有 timeout。
- stdout/stderr 需截斷成摘要；完整 raw output 不應寫入 workspaceState。
- 被截斷或遮罩時，需在結果中標記 `outputRedacted: true` 或等效欄位。

## 錯誤分類

| 分類 | 說明 | Flow 行為 |
|------|------|-----------|
| `missing-executable` | 必要 executable 不存在 | 停止並產生 manual instruction。 |
| `probe-timeout` | 版本 probe 或安裝檢查逾時 | 停止或跳下一個無副作用 step。 |
| `network-or-proxy` | PyPI/installer 網路問題 | 停止，提示 proxy/PyPI 設定與 AI packet。 |
| `permission-denied` | user-space 仍無權限 | 停止，不升級到 sudo。 |
| `unsupported-platform` | OS/path 格式無法安全處理 | 停止，產生 manual instruction。 |
| `cancelled` | 使用者取消 | 停止未開始 step，保存已完成結果。 |

## 歷程寫入

- run 開始時寫入 `running` 可選；run 結束時必須寫入 final status。
- 若 VS Code 中途中止，下次面板開啟應將過期 `running` 標記為 `blocked` 或 `interrupted` 摘要。
- 歷程最多保留最近 20 筆。
