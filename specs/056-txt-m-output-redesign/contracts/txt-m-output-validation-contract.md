# 契約：TXT M 系列輸出驗證與阻擋

## 適用範圍

本契約定義 M 埠用途衝突與 M/O shared-pin 衝突的判定規則，以及這些衝突如何影響 warning、TXT 上傳／執行流程與匯出／程式碼輸出入口。

## 衝突種類

### 1. 同 M 埠不同元件衝突

當同一個 M 埠在同一個工作區中被指定為超過一種元件類型，即構成 blocking conflict。

**範例**：

| Block A | Block B | 結果 |
|---|---|---|
| M1 MOTOR | M1 LAMP | 衝突 |
| M2 MOTOR | M2 MOTOR | 不衝突 |
| M3 LAMP | M4 MOTOR | 不衝突 |

**規則**：

- 掃描範圍是整個 workspace。
- 不做 runtime branch / condition 互斥分析。
- 不論積木位於 setup、process 或函式，只要會被工作區使用模型納入，即可形成衝突。

### 2. M/O 實際共腳位衝突

只有當已使用的 M 埠與其實際共用腳位的 O 埠同時使用時，才構成 blocking conflict。

**固定映射**：

| M 埠 | 共用 O 埠 |
|---|---|
| M1 | O1, O2 |
| M2 | O3, O4 |
| M3 | O5, O6 |
| M4 | O7, O8 |

**正例**：

| M 使用 | O 使用 | 結果 |
|---|---|---|
| M1 | O1 | 衝突 |
| M1 | O2 | 衝突 |
| M2 | O3 | 衝突 |
| M4 | O8 | 衝突 |

**負例**：

| M 使用 | O 使用 | 結果 |
|---|---|---|
| M1 | O3 | 不衝突 |
| M2 | O1 | 不衝突 |
| M3 | O7 | 不衝突 |
| M4 | 無 O | 不衝突 |

## Warning 呈現契約

- 編輯時應盡早顯示可見 warning。
- warning 必須指出是哪個 M 埠造成衝突。
- M/O shared-pin warning 必須指出相關 O 埠或 O 埠組。
- 若同一 block 同時有 orphan warning 與 M/O warning，兩者都必須可見。

## 阻擋契約

當存在任一 blocking conflict：

- TXT 上傳／執行必須停止，不得連線到 TXT controller。
- 匯出／程式碼輸出 action 若存在，必須停止或拒絕輸出可被誤認為安全的程式。
- 使用者解除衝突後，TXT 上傳／執行流程與匯出／程式碼輸出入口必須恢復。

## 驗證結果格式（概念）

```json
{
  "conflicts": [
    {
      "kind": "M_O_SHARED_PIN_CONFLICT",
      "mPort": "M1",
      "relatedOPorts": ["O1"],
      "blockIds": ["..."],
      "severity": "blocking-warning"
    }
  ],
  "canUpload": false,
  "canExport": false
}
```

實作可使用不同內部結構，但必須提供等價資訊給 warning 與阻擋流程。

## 與既有 TXT workspace warning 的關係

本契約不取代既有規則：

- 缺少 `txt_setup`
- 缺少 `txt_process`
- 重複 `txt_setup`
- orphan block warning

M/O 衝突 warning 必須可與上述 warning 共存。

## 非目標

- 不分析接線以外的物理硬體狀態。
- 不分析 runtime branch 是否互斥。
- 不因 M 與 O block 同時存在就一律警告。
