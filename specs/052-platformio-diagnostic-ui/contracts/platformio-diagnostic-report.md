# PlatformIO 診斷報告合約

**版本**：v1（獨立診斷 panel 報告）  
**主要輸出**：panel 內完整清單 + clipboard summary  
**目標介面**：WebView Editor Panel / 剪貼簿 / Issue 回報文字

---

## 合約概述

第一版 PlatformIO 診斷報告必須同時滿足兩種使用情境：

1. **當下閱讀**：使用者在 panel 中快速看懂本機工具鏈是否可用
2. **分享回報**：使用者可把結果直接貼給維護者、教師或 Issue 討論串

因此報告格式必須固定、可比對、可局部失敗，不可只回傳一段模糊訊息如「找不到 PlatformIO」，也不可只把主要資訊藏在通知摘要裡。

---

## Panel 資訊架構契約

第一版 panel MUST 由以下三個主要區塊組成：

1. **摘要區（summary section）**
2. **工具清單區（tools section）**
3. **範圍提醒區（scope section）**

### 摘要區必備欄位

| 欄位 | 必填 | 說明 |
|------|------|------|
| 整體狀態 | 是 | `operational` / `degraded` / `unavailable` |
| 最近檢查時間 | 是 | 讓使用者知道資訊是否剛更新 |
| 工作區路徑 | 否 | 若可取得則顯示 |
| 操作列 | 是 | 僅包含 `重新測試`、`複製診斷摘要` |

### Loading / timeout 呈現契約

- MUST 在第一次開啟 panel 或按下 `重新測試` 後約 1 秒內顯示可見的 loading UI
- MUST 在單次診斷開始後 10 秒內離開 loading，並呈現 `operational`、`degraded`、`unavailable` 或頂層 `error` 對應畫面
- 若個別工具 probe timeout，MUST 以可理解的 `reason` / `nextStep` 呈現 timeout 影響，而不是讓整個 panel 持續停留在 loading

### 工具清單區必備特性

- MUST 以固定順序顯示五個項目
- MUST 保留完整清單，不可折疊成只剩總結的一行訊息
- SHOULD 讓使用者在單一 scroll flow 中看完主要資訊，而不是四處跳轉

### 範圍提醒區必備內容

- MUST 明確提醒「本次檢查只涵蓋工具辨識與可用性」
- MUST 提醒裝置、USB 線材、權限與埠連線仍可能是其他問題來源

---

## 固定項目順序

診斷報告 MUST 依照下列順序呈現：

1. `pio`
2. `penv` 根目錄
3. `python`
4. `pip`
5. `mpremote`

**理由**：

- 先看入口工具 `pio`
- 再看 `penv` 根目錄
- 最後看 CyberBrick 依賴鏈 `python` / `pip` / `mpremote`

---

## 單一項目欄位契約

每個項目至少要能表達以下資訊：

| 欄位 | 必填 | 說明 |
|------|------|------|
| 狀態 | 是 | `ok` / `warning` / `error` |
| 顯示名稱 | 是 | `pio`、`penv`、`python`、`pip`、`mpremote` |
| 實際位置 | 是 | 若未找到則明確顯示未找到 |
| 來源說明 | 是 | 例如預設路徑、PATH 搜尋、由 resolved `pio` 推導 |
| `penv` 關聯 | 視項目 | `python` / `pip` / `mpremote` 必須顯示是否屬於 detected `penv` |
| 版本／探測結果 | executable 必填 | `penv` 根目錄除外 |
| 原因說明 (`reason`) | 是 | 需可被使用者理解 |
| 下一步建議 (`nextStep`) | warning / error 必填 | 需可讓使用者採取下一步行動 |

---

## 各項目特殊規則

### `pio`

- MUST 顯示最終採用的 executable path
- MUST 執行 `--version` 作為版本探測
- 若存在但 `--version` 失敗，不可標示為完全成功

### `penv` 根目錄

- 視為 derived directory，而非 executable
- MUST 顯示該路徑是否存在
- MUST 顯示它是如何推導出來的
- 不需執行版本探測

### `python`

- MUST 顯示 path
- MUST 執行 `--version`
- MUST 顯示是否屬於 detected `penv`

### `pip`

- MUST 顯示 path
- MUST 執行 `--version`
- MUST 顯示是否屬於 detected `penv`

### `mpremote`

- MUST 顯示 path
- MUST 執行 `version`
- MUST 顯示是否屬於 detected `penv`
- MUST 明確支援「存在但無法執行」與「根本不存在」兩種失敗表達

---

## 整體狀態契約

報告 MUST 提供整體狀態，且僅能是以下三種之一：

- `operational`
- `degraded`
- `unavailable`

### 判定原則

- **operational**：五個固定項目都有符合預期的結果
- **degraded**：至少有一項失敗，但仍有足夠資訊可解釋現況
- **unavailable**：無法取得 `pio` 或整體工具鏈判定基礎不足

---

## 原因與下一步建議契約

第一版 panel 的核心價值不只是顯示狀態，而是幫助使用者知道「為什麼」與「接下來做什麼」。

**要求**：

- `reason` MUST 用使用者可理解的語句描述失敗或警告原因
- `nextStep` MUST 指向具體下一步，例如檢查 PATH、確認 `penv` 位置、重裝 `mpremote`、確認權限或重新執行測試
- `nextStep` SHOULD 避免空泛表述，例如「請修正問題」這類沒有資訊價值的句子

---

## 來源標記契約

第一版來源標記至少應包含以下語意：

| 標記語意 | 說明 |
|---------|------|
| 預設 PlatformIO 路徑 | 來自預設 `penv` 位置 |
| PATH 搜尋 | 來自 PATH / common bin 搜尋結果 |
| resolved `pio` 同層 | 根據已解析 `pio` 所在目錄推導 |
| 由 `penv` 衍生 | 根據已確認的 `penv` 根目錄推導 |
| 未解析 | 無法決定有效來源 |

> 呈現用語可以本地化，但語意不可缺漏。

---

## 視覺一致性契約

第一版 panel MUST 與 repo 現有 WebView / panel / modal 視覺語言一致。

**至少需符合以下語意**：

- 分段卡片／區塊結構，而不是單一長段通知文字
- 約 8px 等級的圓角與輕量 box-shadow
- compact header 與清楚的 action row
- 成功／警告／錯誤狀態色清楚可辨
- `重新測試` 與 `複製診斷摘要` 沿用既有 primary / secondary button 語言
- light / dark theme parity 與既有 `theme-dark` 覆蓋邏輯一致

**不允許**：

- 另起一套與 repo 無關的診斷儀表板設計
- 只靠通知訊息或 Quick Pick 呈現主要報告內容

---

## 剪貼簿摘要契約

複製到剪貼簿的內容 MUST：

1. 為純文字
2. 含時間戳
3. 含整體狀態
4. 含五個固定項目的結果
5. 含 scope 提醒
6. 對 warning / error 項目補上 `reason` 與 `nextStep` 的精簡版資訊

### 建議格式（示意）

```text
PlatformIO Diagnostic Report
===========================
Generated at: 2026-05-13 14:30:00
Overall Status: Degraded
Workspace: /path/to/workspace

- pio: OK
  Path: /custom/bin/pio
  Source: PATH search
  Version: PlatformIO Core, version 6.1.18

- penv: OK
  Path: /custom/bin
  Source: resolved pio sibling

- python: OK
  Path: /custom/bin/python
  Source: derived from penv
  From detected penv: Yes
  Version: Python 3.11.9

- pip: OK
  ...

- mpremote: WARNING
  Path: /custom/bin/mpremote
  Source: derived from penv
  From detected penv: Yes
  Reason: executable exists but version probe failed
  Next step: reinstall or verify mpremote inside the detected penv

Scope: This diagnostic only covers tool resolution and executable availability.
```

---

## 報告範圍提醒契約

每份報告 MUST 明確提醒：

- 本次檢查只涵蓋工具辨識與可用性
- 不保證 USB 線材、實體板子、裝置權限或埠連線一定正常

這是避免使用者把「工具鏈健康」誤解成「上傳一定成功」的必要保護欄。

---

## 非目標（v1 不承諾）

以下不屬於第一版報告合約：

- JSON machine-readable export
- 歷史報告比較
- 自動修復建議排序
- upload button 視覺狀態欄位（此回歸由獨立 UI smoke test 保護）
- 手動工具路徑設定欄位或覆寫輸入
- PlatformIO 擴充套件安裝狀態欄位
- 裝置連接埠清單或 USB 裝置診斷
