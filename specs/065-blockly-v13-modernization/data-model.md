# Phase 1 資料模型：Blockly 13 現代化升級

本功能不改變 `main.json` 的對外工作區 schema；以下模型描述 WebView runtime、非同步對話與相容性驗證所需的應用程式狀態。

## BlocklyRuntimeConfig

代表 editor 或 preview 注入 Blockly 時的固定執行設定。

| 欄位 | 型別 | 規則 |
|------|------|------|
| `mode` | `edit \| preview` | editor 可修改；preview 必須唯讀 |
| `renderer` | `thrasos` | 固定使用 Thrasos |
| `theme` | `singular-light \| singular-dark` | 依 VS Code／使用者設定選擇 |
| `mediaUri` | WebView URI | 必須指向封裝內 Blockly media 並以 `/` 結尾 |
| `localeUris` | locale → WebView URI | 必須涵蓋十五種支援語言 |
| `board` | board identifier | 必須通過既有 board config 驗證 |

## WorkspaceSession

代表單一 editor 或 preview workspace 的生命週期。

| 欄位 | 型別 | 規則 |
|------|------|------|
| `workspace` | Workspace instance 或 `null` | 只能由 workspace factory 設定或清除 |
| `mode` | `edit \| preview` | 建立後不可變 |
| `board` | board identifier | 重建後必須保留 |
| `locale` | supported locale | 必須存在於 locale URI map |
| `theme` | light/dark identifier | 重建後必須保留 |
| `state` | workspace JSON 或 `null` | 保存前遵守空狀態 guard |
| `status` | lifecycle state | 依下列狀態轉換 |

### 狀態轉換

```text
uninitialized → initializing → ready
ready → rebuilding → ready
ready → disposing → disposed
initializing/rebuilding → failed → initializing
```

- `rebuilding` 期間禁止將暫時空 workspace 寫回有效專案。
- 進入 `failed` 必須保留最近一次有效 JSON state。
- 任一時刻每個 WebView 僅能有一個 canonical editor/preview workspace。

## LocaleBundle

代表一次語言切換所需的核心與專案訊息。

| 欄位 | 型別 | 規則 |
|------|------|------|
| `locale` | supported locale | 使用專案既有 locale normalization |
| `coreScriptUri` | WebView URI | 指向對應 Blockly 官方 msg script |
| `projectMessages` | key/value map | 由既有 `media/locales` 載入 |
| `loadStatus` | `idle \| loading \| ready \| failed` | 同一 locale 的並行載入共用 pending promise |

### 套用順序

1. 官方核心訊息覆寫所有 Blockly core keys。
2. Singular project messages 覆寫同名 key 並提供應用程式文字。
3. 只有兩層都完成後才能建立／重建 workspace。

## BlocklyDialogRequest

代表 WebView 對 Extension Host 發出的 prompt 或 confirm 請求。

| 欄位 | 型別 | 規則 |
|------|------|------|
| `requestId` | 非空唯一字串 | pending map 中不得重複 |
| `kind` | `prompt \| confirm` | 決定 payload 與 result 型別 |
| `message` | 非空字串 | 顯示給使用者的已解析文字 |
| `defaultValue` | 字串，可選 | 僅 prompt 使用 |
| `board` | board identifier，可選 | 供名稱驗證使用 |
| `status` | `pending \| resolved \| cancelled` | result 只能完成一次 |
| `callback` | Blockly callback | result 後立即移除，不得持久化 |

### 驗證與失敗規則

- Prompt 的 `null` 表示取消；空字串是否有效由 Extension Host validator 與 Blockly callback 決定。
- Confirm 必須回傳布林值；WebView dispose 時所有 pending request 以取消完成。
- 未知或重複 result 只記錄警告，不得拋出造成 workspace listener 中止。

## DynamicBlockState

代表自訂 mutator、函式參數、鎖定狀態及 shadow 預設值的可序列化狀態。

| 欄位 | 型別 | 規則 |
|------|------|------|
| `blockType` | registered block type | 必須存在於 block registry |
| `extraState` | JSON-compatible object | 新格式的唯一 runtime state 來源 |
| `legacyMutation` | XML node，可選 | 僅舊資料匯入使用 |
| `shadowState` | Blockly block state，可選 | 必須使用已註冊 block type |

- 新建 block 不得依賴 XML 才能得到正確 shape。
- `legacyMutation` 載入後必須產生與 `extraState` 等價的 block shape。

## CompatibilityFixture

代表自動及人工驗收用的固定回歸樣本，不屬於使用者資料。

| 欄位 | 型別 | 規則 |
|------|------|------|
| `id` | 唯一字串 | 穩定且可讀 |
| `format` | `json \| xml` | XML 僅作 legacy input |
| `board` | board identifier | 至少涵蓋 Arduino、CyberBrick、TXT |
| `features` | feature tag array | 變數、函式、mutator、shadow、locked、orphan 等 |
| `expectedCode` | language → fixture | 未核准差異不得更新 golden output |
| `expectedState` | normalized assertions | 忽略非語意性序列化順序差異 |

## 關係

- `BlocklyRuntimeConfig` 建立一個 `WorkspaceSession`。
- `WorkspaceSession` 在語言變更時載入一個 `LocaleBundle` 並以既有 state 重建。
- `WorkspaceSession` 可同時管理多個 pending `BlocklyDialogRequest`，但每個 request ID 唯一。
- Workspace JSON 包含多個 `DynamicBlockState`；legacy XML 匯入後轉為同一 workspace state。
- `CompatibilityFixture` 驗證上述模型在 editor、preview、locale rebuild 與 code generation 流程中的一致性。
