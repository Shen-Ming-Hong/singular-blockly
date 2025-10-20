# Data Model: 次要依賴更新 (Phase 2)

**Feature**: 升級 @blockly/theme-modern 和 @types/node  
**Date**: 2025-10-20  
**Context**: 此為依賴管理功能,主要數據模型為套件狀態和驗證結果

---

## 核心實體 (Core Entities)

本升級功能的核心數據實體,定義升級流程中涉及的主要資料結構。

### 1. PackageUpgrade (套件升級)

**用途**: 描述單一套件的升級資訊

**屬性**:

```typescript
interface PackageUpgrade {
	name: string; // 套件名稱 (例: "@blockly/theme-modern")
	currentVersion: string; // 當前版本 (例: "6.0.10")
	targetVersion: string; // 目標版本 (例: "6.0.12")
	updateType: 'major' | 'minor' | 'patch'; // 升級類型
	riskLevel: 'low' | 'medium' | 'high'; // 風險等級
	dependencies: string[]; // 相依套件清單
	status: PackageUpgradeStatus; // 升級狀態
}

enum PackageUpgradeStatus {
	PENDING = 'pending', // 待升級
	IN_PROGRESS = 'in_progress', // 升級中
	VALIDATING = 'validating', // 驗證中
	COMPLETED = 'completed', // 已完成
	FAILED = 'failed', // 失敗
	ROLLED_BACK = 'rolled_back', // 已回滾
}
```

**範例資料**:

```json
{
	"name": "@blockly/theme-modern",
	"currentVersion": "6.0.10",
	"targetVersion": "6.0.12",
	"updateType": "patch",
	"riskLevel": "low",
	"dependencies": ["blockly"],
	"status": "pending"
}
```

**驗證規則**:

-   `name` 必須為有效的 npm 套件名稱
-   `currentVersion` 和 `targetVersion` 必須符合 semver 格式
-   `targetVersion` 必須大於 `currentVersion`
-   `updateType` 必須與版本號變化一致 (patch: x.y.Z, minor: x.Y.z, major: X.y.z)

---

### 2. ValidationCheckpoint (驗證檢查點)

**用途**: 定義升級過程中的驗證步驟和結果

**屬性**:

```typescript
interface ValidationCheckpoint {
	id: string; // 檢查點唯一識別碼
	name: string; // 檢查點名稱
	type: 'automated' | 'manual'; // 檢查類型
	phase: 'compile' | 'test' | 'security' | 'manual'; // 檢查階段
	command?: string; // 執行命令 (自動化檢查)
	expectedResult: string; // 預期結果描述
	actualResult?: string; // 實際結果 (執行後)
	status: ValidationStatus; // 驗證狀態
	executionTime?: number; // 執行時間 (毫秒)
	errorMessage?: string; // 錯誤訊息 (如失敗)
}

enum ValidationStatus {
	NOT_STARTED = 'not_started', // 未開始
	RUNNING = 'running', // 執行中
	PASSED = 'passed', // 通過
	FAILED = 'failed', // 失敗
	SKIPPED = 'skipped', // 跳過
}
```

**範例資料**:

```json
{
	"id": "compile-typescript",
	"name": "TypeScript 編譯檢查",
	"type": "automated",
	"phase": "compile",
	"command": "npx tsc --noEmit",
	"expectedResult": "Exit code 0, 無型別錯誤",
	"status": "not_started"
}
```

**驗證規則**:

-   自動化檢查 (`type: 'automated'`) 必須提供 `command`
-   手動檢查 (`type: 'manual'`) `command` 為可選
-   `status` 轉換規則:
    -   NOT_STARTED → RUNNING → (PASSED | FAILED)
    -   任何狀態可轉換為 SKIPPED (如回滾)

---

### 3. UpgradeSession (升級工作階段)

**用途**: 追蹤整個升級流程的執行狀態

**屬性**:

```typescript
interface UpgradeSession {
	sessionId: string; // 工作階段 ID (例: "006-minor-deps-update")
	startTime: Date; // 開始時間
	endTime?: Date; // 結束時間
	packages: PackageUpgrade[]; // 升級套件清單
	checkpoints: ValidationCheckpoint[]; // 驗證檢查點清單
	status: SessionStatus; // 工作階段狀態
	rollbackReason?: string; // 回滾原因 (如需要)
	metrics: UpgradeMetrics; // 效能指標
}

enum SessionStatus {
	INITIALIZED = 'initialized', // 已初始化
	UPGRADING = 'upgrading', // 升級中
	VALIDATING = 'validating', // 驗證中
	COMPLETED = 'completed', // 已完成
	FAILED = 'failed', // 失敗
	ROLLED_BACK = 'rolled_back', // 已回滾
}

interface UpgradeMetrics {
	totalDuration?: number; // 總執行時間 (秒)
	compileTime?: number; // 編譯時間 (秒)
	testTime?: number; // 測試時間 (秒)
	bundleSize?: number; // 建置產出大小 (bytes)
	testPassRate?: number; // 測試通過率 (0-1)
	coverageRate?: number; // 測試覆蓋率 (0-1)
}
```

**範例資料**:

```json
{
	"sessionId": "006-minor-deps-update",
	"startTime": "2025-10-20T10:00:00Z",
	"packages": [
		{
			"name": "@blockly/theme-modern",
			"currentVersion": "6.0.10",
			"targetVersion": "6.0.12",
			"updateType": "patch",
			"riskLevel": "low",
			"dependencies": ["blockly"],
			"status": "pending"
		},
		{
			"name": "@types/node",
			"currentVersion": "20.17.12",
			"targetVersion": "20.19.22",
			"updateType": "minor",
			"riskLevel": "low",
			"dependencies": [],
			"status": "pending"
		}
	],
	"checkpoints": [],
	"status": "initialized",
	"metrics": {}
}
```

**驗證規則**:

-   `sessionId` 必須與 Git 分支名稱一致
-   `packages` 至少包含一個套件
-   `checkpoints` 必須包含所有契約定義的驗證點
-   `metrics` 在完成後必須包含所有效能指標

---

## 工作流程狀態 (Workflow States)

描述升級流程的狀態轉換和決策路徑。

### 升級流程狀態圖

```
┌─────────────┐
│ INITIALIZED │  (建立工作階段,準備升級)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  UPGRADING  │  (執行 npm install)
└──────┬──────┘
       │
       ├──► [升級失敗] ──► FAILED ──► ROLLED_BACK
       │
       ▼
┌─────────────┐
│ VALIDATING  │  (執行所有驗證檢查點)
└──────┬──────┘
       │
       ├──► [驗證失敗] ──► FAILED ──► ROLLED_BACK
       │
       ▼
┌─────────────┐
│  COMPLETED  │  (升級成功,更新文件)
└─────────────┘
```

### 狀態轉換規則

| 當前狀態    | 觸發條件                | 下一狀態    | 動作                       |
| ----------- | ----------------------- | ----------- | -------------------------- |
| INITIALIZED | 開始升級                | UPGRADING   | 執行 `npm install`         |
| UPGRADING   | npm install 成功        | VALIDATING  | 執行第一個驗證檢查點       |
| UPGRADING   | npm install 失敗        | FAILED      | 記錄錯誤                   |
| VALIDATING  | 所有檢查點通過          | COMPLETED   | 更新 CHANGELOG, Git commit |
| VALIDATING  | 任一檢查點失敗          | FAILED      | 記錄失敗檢查點             |
| FAILED      | 執行回滾程序            | ROLLED_BACK | Git checkout, npm ci       |
| ROLLED_BACK | (終止狀態,需要人工介入) | -           | -                          |
| COMPLETED   | (終止狀態)              | -           | -                          |

---

## 檔案變更追蹤 (File Change Tracking)

升級過程中涉及的檔案及其變更類型。

### FileChange (檔案變更)

**用途**: 追蹤升級過程中的檔案變更

**屬性**:

```typescript
interface FileChange {
	path: string; // 檔案路徑
	changeType: 'modify' | 'create' | 'delete'; // 變更類型
	beforeContent?: string; // 變更前內容 (用於回滾)
	afterContent?: string; // 變更後內容
	automated: boolean; // 是否為自動變更 (npm install)
}
```

**本升級涉及的檔案清單**:

| 檔案路徑          | 變更類型 | 自動化 | 說明                       |
| ----------------- | -------- | ------ | -------------------------- |
| package.json      | modify   | 否     | 手動更新 dependencies 版本 |
| package-lock.json | modify   | 是     | npm install 自動更新       |
| CHANGELOG.md      | modify   | 否     | 手動新增版本記錄           |

**回滾策略**:

```bash
# 方案 1: Git 回滾 (最快)
git checkout package.json package-lock.json
npm ci

# 方案 2: 手動降版 (如 Git 不可用)
npm install @blockly/theme-modern@6.0.10 @types/node@20.17.12
```

---

## 效能基準與目標 (Performance Baselines & Targets)

定義升級前後的效能比較基準。

### PerformanceBaseline (效能基準)

**用途**: 記錄 Phase 1 的效能基準,用於升級後比較

**屬性**:

```typescript
interface PerformanceBaseline {
	phase: string; // 階段名稱 (例: "Phase 1")
	compileTime: number; // 編譯時間 (秒)
	testTime: number; // 測試時間 (秒)
	bundleSize: number; // 建置產出大小 (bytes)
	testPassCount: number; // 測試通過數
	testTotalCount: number; // 測試總數
	coverageRate: number; // 覆蓋率 (0-1)
	recordDate: Date; // 記錄日期
}
```

**Phase 1 基準資料** (來源: Phase 1 完成報告):

```json
{
	"phase": "Phase 1 (005-safe-dependency-updates)",
	"compileTime": 4.6,
	"testTime": 19.6,
	"bundleSize": 130506,
	"testPassCount": 190,
	"testTotalCount": 191,
	"coverageRate": 0.8721,
	"recordDate": "2025-10-19"
}
```

**Phase 2 目標** (基於 spec.md 成功標準):

```json
{
	"phase": "Phase 2 (006-minor-deps-update)",
	"compileTime": 5.06, // ≤ 4.6 × 110%
	"testTime": 21.58, // ≤ 19.6 × 110%
	"bundleSize": 133116, // ≤ 130506 × 1.02
	"testPassCount": 190, // 維持不變
	"testTotalCount": 191, // 維持不變
	"coverageRate": 0.8721, // ≥ 87.21%
	"recordDate": "2025-10-20"
}
```

**驗證邏輯**:

```typescript
function validatePerformance(baseline: PerformanceBaseline, actual: PerformanceBaseline): boolean {
	return actual.compileTime <= baseline.compileTime * 1.1 && actual.testTime <= baseline.testTime * 1.1 && actual.bundleSize <= baseline.bundleSize * 1.02 && actual.testPassCount >= baseline.testPassCount && actual.coverageRate >= baseline.coverageRate;
}
```

---

## 驗證契約資料結構 (Validation Contract Data)

定義驗證契約中使用的資料格式,與 `contracts/upgrade-validation-contract.yaml` 對應。

### ContractCheckpoint (契約檢查點)

**YAML 結構** (將在 contracts/ 中定義):

```yaml
checkpoint:
    id: string # 檢查點 ID
    name: string # 檢查點名稱
    phase: enum # compile | test | security | manual
    type: enum # automated | manual
    command: string? # 執行命令 (自動化檢查)
    expectedResult: string # 預期結果
    passCondition: string # 通過條件
    failureAction: string # 失敗處理動作
```

**範例** (TypeScript 編譯檢查):

```yaml
- id: compile-typescript
  name: TypeScript 編譯檢查
  phase: compile
  type: automated
  command: 'npx tsc --noEmit'
  expectedResult: 'Exit code 0, 無型別錯誤'
  passCondition: 'exitCode === 0'
  failureAction: 'ROLLBACK'
```

---

## 資料流程圖 (Data Flow Diagram)

描述升級過程中的資料流動和轉換。

```
┌───────────────┐
│   開始升級     │
└───────┬───────┘
        │
        ▼
┌───────────────────────────┐
│ 讀取 package.json         │  ← 當前版本資訊
│ 取得當前版本              │
└───────┬───────────────────┘
        │
        ▼
┌───────────────────────────┐
│ 建立 UpgradeSession       │  → sessionId, packages[], status: INITIALIZED
└───────┬───────────────────┘
        │
        ▼
┌───────────────────────────┐
│ 執行 npm install          │  → 更新 package-lock.json
│ 更新套件版本              │
└───────┬───────────────────┘
        │
        ▼
┌───────────────────────────┐
│ 執行驗證檢查點            │  → ValidationCheckpoint[] 狀態更新
│ (compile → test → ...)    │
└───────┬───────────────────┘
        │
        ├──► [失敗] ──┐
        │             ▼
        │        ┌────────────┐
        │        │ 回滾變更   │  → 恢復 package.json, package-lock.json
        │        └────────────┘
        │
        ▼
┌───────────────────────────┐
│ 記錄效能指標              │  → UpgradeMetrics (compileTime, testTime, ...)
└───────┬───────────────────┘
        │
        ▼
┌───────────────────────────┐
│ 更新 CHANGELOG.md         │  → FileChange (modify)
│ Git commit                │
└───────┬───────────────────┘
        │
        ▼
┌───────────────────────────┐
│ 標記工作階段為 COMPLETED  │  → UpgradeSession.status = 'completed'
└───────────────────────────┘
```

---

## 資料持久化 (Data Persistence)

說明資料儲存和恢復機制。

### 儲存位置

| 資料類型              | 儲存位置                | 格式     | 用途         |
| --------------------- | ----------------------- | -------- | ------------ |
| PackageUpgrade        | package.json            | JSON     | 套件版本定義 |
| PackageUpgrade (lock) | package-lock.json       | JSON     | 套件依賴鎖定 |
| UpgradeSession (log)  | Git commit 訊息         | 純文字   | 升級歷史記錄 |
| UpgradeMetrics        | CHANGELOG.md            | Markdown | 版本變更記錄 |
| ValidationCheckpoint  | Terminal 輸出 / CI 日誌 | 純文字   | 驗證結果追蹤 |
| PerformanceBaseline   | specs/.../research.md   | Markdown | 效能基準文件 |

### 資料恢復策略

**回滾場景**:

1. **升級失敗** → 使用 Git 恢復 package.json 和 package-lock.json
2. **驗證失敗** → 執行 `npm ci` 重新安裝原版本
3. **效能不符** → 人工決策是否回滾或調整目標

**資料完整性**:

-   Git 提供版本控制和變更歷史
-   package-lock.json 確保套件版本一致性
-   CHANGELOG.md 提供人類可讀的變更記錄

---

## 總結

本資料模型定義了 Phase 2 升級流程的核心實體和資料流程:

1. **核心實體**: PackageUpgrade, ValidationCheckpoint, UpgradeSession
2. **狀態管理**: 清晰的狀態轉換規則和決策路徑
3. **效能追蹤**: 基準比較和目標驗證機制
4. **資料持久化**: Git 和 npm 原生機制,無需額外儲存

所有資料結構設計遵循 **Simplicity and Maintainability** 原則,使用 TypeScript 介面定義確保型別安全,並與現有工具 (npm, Git, VSCode) 無縫整合。
