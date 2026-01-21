# 資料模型：移除 CyberBrick Timer 實驗標記

> 本功能不新增持久化資料，以下為概念性實體與欄位，用於描述實驗標記判定。

## 實體

### 1) TimerBlockType
- **說明**：CyberBrick Timer 積木類型清單。
- **欄位**：
  - `typeId`：`cyberbrick_ticks_ms` / `cyberbrick_ticks_diff`
  - `displayName`：顯示名稱
  - `category`：`cyberbrick`
  - `experimental`：固定為 `false`

### 2) ExperimentalBlockRegistry
- **說明**：實驗性積木註冊清單（由前端腳本建立與維護）。
- **欄位**：
  - `potentialExperimentalTypeIds`：可能實驗積木類型集合
  - `experimentalTypeIds`：實際標記為實驗的類型集合

### 3) WorkspaceBlockSet
- **說明**：當前工作區內的積木類型集合。
- **欄位**：
  - `blockTypeIds`：工作區所有積木 type 集合
  - `hasExperimentalBlocks`：是否包含實驗積木（由 `experimentalTypeIds` 判定）

## 關係

- `ExperimentalBlockRegistry.experimentalTypeIds` 用於判斷 `WorkspaceBlockSet.hasExperimentalBlocks`。
- `TimerBlockType.typeId` 不得出現在 `experimentalTypeIds` 中。

## 驗證規則

- `cyberbrick_ticks_ms` 與 `cyberbrick_ticks_diff` 必須永遠判定為非實驗性。
- 其他實驗積木判定規則維持既有機制。
