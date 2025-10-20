# Data Model: Safe Dependency Updates

**Feature**: 005-safe-dependency-updates  
**Date**: 2025-10-20

## Overview

本文件定義依賴升級流程中涉及的核心資料實體及其關係,用於追蹤升級狀態、驗證結果和效能指標。

---

## 術語對照表 (Terminology)

為確保文件一致性,以下術語在本專案中具有特定含義:

| 繁體中文     | English                           | 說明                        | 檔案範例            |
| ------------ | --------------------------------- | --------------------------- | ------------------- |
| 建置產出     | Build Artifact / Bundle           | Webpack 編譯後的輸出檔案    | `dist/extension.js` |
| 建置產出大小 | Build Artifact Size / Bundle Size | 建置產出檔案的位元組大小    | 用於效能比對        |
| 編譯         | Compilation                       | TypeScript 型別檢查和轉譯   | `npx tsc --noEmit`  |
| 建置         | Build                             | Webpack 打包流程 (包含編譯) | `npm run compile`   |
| 測試覆蓋率   | Test Coverage                     | 程式碼被測試覆蓋的百分比    | >= 87.21%           |
| 驗證檢查點   | Validation Checkpoint             | 自動化驗證關卡              | `compilation-check` |

**使用原則**: 文件中應優先使用繁體中文術語,必要時可在括號中補充英文對照 (如「建置產出 (bundle)」)。

---

## Entity Definitions

### 1. Dependency Package (依賴套件)

代表一個需要升級的 npm 套件,包含版本資訊和升級狀態。

```typescript
interface DependencyPackage {
	/** 套件名稱 (例如: "typescript") */
	name: string;

	/** 當前版本 (例如: "5.7.2") */
	currentVersion: string;

	/** 目標版本 (例如: "5.9.3") */
	targetVersion: string;

	/** 優先級: P1 (高), P2 (中), P3 (低) */
	priority: 'P1' | 'P2' | 'P3';

	/** 類別: TypeScript編譯器, 測試框架, 建置工具, 程式碼品質 */
	category: 'compiler' | 'testing' | 'build' | 'quality';

	/** 版本類型: major (主要), minor (次要), patch (補丁) */
	versionType: 'major' | 'minor' | 'patch';

	/** 升級狀態 */
	status: DependencyStatus;

	/** 升級時間戳記 (ISO 8601) */
	upgradedAt?: string;

	/** 驗證結果 */
	validation?: ValidationResult;

	/** 已知的 breaking changes */
	breakingChanges: string[];

	/** 升級備註 */
	notes?: string;
}

enum DependencyStatus {
	Pending = 'pending', // 等待升級
	InProgress = 'in-progress', // 升級中
	Validating = 'validating', // 驗證中
	Completed = 'completed', // 已完成
	Failed = 'failed', // 升級失敗
	RolledBack = 'rolled-back', // 已回滾
}
```

**Example**:

```json
{
	"name": "typescript",
	"currentVersion": "5.7.2",
	"targetVersion": "5.9.3",
	"priority": "P1",
	"category": "compiler",
	"versionType": "minor",
	"status": "pending",
	"breakingChanges": ["ArrayBuffer no longer supertype of TypedArray types", "DOM type adjustments"],
	"notes": "Performance improvements: 11% faster builds"
}
```

---

### 2. Validation Result (驗證結果)

記錄每個套件升級後的驗證結果,包含多個驗證檢查點。

```typescript
interface ValidationResult {
	/** 套件名稱 */
	packageName: string;

	/** 驗證開始時間 (ISO 8601) */
	startedAt: string;

	/** 驗證完成時間 (ISO 8601) */
	completedAt?: string;

	/** 整體驗證結果 */
	overallStatus: 'passed' | 'failed' | 'warning';

	/** 個別檢查點結果 */
	checks: ValidationCheck[];

	/** 驗證摘要 */
	summary: {
		totalChecks: number;
		passedChecks: number;
		failedChecks: number;
		warningChecks: number;
	};

	/** 失敗原因 (如有) */
	failureReasons?: string[];
}

interface ValidationCheck {
	/** 檢查點名稱 */
	name: string;

	/** 檢查類型 */
	type: 'compilation' | 'test' | 'build' | 'lint' | 'coverage' | 'performance';

	/** 檢查結果 */
	status: 'passed' | 'failed' | 'warning' | 'skipped';

	/** 執行時間 (毫秒) */
	duration: number;

	/** 詳細訊息 */
	message?: string;

	/** 錯誤詳情 (如有) */
	error?: {
		message: string;
		stack?: string;
		code?: string;
	};

	/** 效能指標 (如適用) */
	metrics?: Record<string, number | string>;
}
```

**Example**:

```json
{
	"packageName": "typescript",
	"startedAt": "2025-10-20T10:30:00Z",
	"completedAt": "2025-10-20T10:35:00Z",
	"overallStatus": "passed",
	"checks": [
		{
			"name": "TypeScript Compilation",
			"type": "compilation",
			"status": "passed",
			"duration": 45000,
			"message": "No type errors found"
		},
		{
			"name": "Unit Tests",
			"type": "test",
			"status": "passed",
			"duration": 120000,
			"metrics": {
				"totalTests": 63,
				"passedTests": 63,
				"failedTests": 0
			}
		},
		{
			"name": "Code Coverage",
			"type": "coverage",
			"status": "passed",
			"duration": 5000,
			"metrics": {
				"linesCovered": 87.21,
				"baseline": 87.21,
				"delta": 0
			}
		}
	],
	"summary": {
		"totalChecks": 6,
		"passedChecks": 6,
		"failedChecks": 0,
		"warningChecks": 0
	}
}
```

---

### 3. Build Artifact (建置產物)

記錄升級前後的建置產物資訊,用於比對和回歸測試。

```typescript
interface BuildArtifact {
	/** 建置 ID (時間戳記 + 套件名稱) */
	id: string;

	/** 關聯的套件名稱 */
	packageName: string;

	/** 套件版本 */
	packageVersion: string;

	/** 建置時間 (ISO 8601) */
	builtAt: string;

	/** 建置類型 */
	buildType: 'development' | 'production';

	/** 主要檔案路徑和大小 */
	files: {
		path: string;
		sizeBytes: number;
		sizeKB: number;
		hash?: string;
	}[];

	/** 建置時間 (毫秒) */
	buildTime: number;

	/** Source map 是否生成 */
	hasSourceMap: boolean;

	/** 編譯警告數量 */
	warnings: number;

	/** 編譯錯誤數量 */
	errors: number;

	/** 與基準的差異 (如適用) */
	deltaFromBaseline?: {
		sizeDelta: number; // 檔案大小變化 (bytes)
		sizePercentDelta: number; // 檔案大小變化 (%)
		timeDelta: number; // 建置時間變化 (ms)
		timePercentDelta: number; // 建置時間變化 (%)
	};
}
```

**Example**:

```json
{
	"id": "20251020-103000-typescript",
	"packageName": "typescript",
	"packageVersion": "5.9.3",
	"builtAt": "2025-10-20T10:30:00Z",
	"buildType": "development",
	"files": [
		{
			"path": "dist/extension.js",
			"sizeBytes": 1234567,
			"sizeKB": 1205.63,
			"hash": "sha256:abc123..."
		},
		{
			"path": "dist/extension.js.map",
			"sizeBytes": 2345678,
			"sizeKB": 2290.7
		}
	],
	"buildTime": 45000,
	"hasSourceMap": true,
	"warnings": 0,
	"errors": 0,
	"deltaFromBaseline": {
		"sizeDelta": -5000,
		"sizePercentDelta": -0.4,
		"timeDelta": -3000,
		"timePercentDelta": -6.25
	}
}
```

---

### 4. Change Log Entry (變更記錄)

記錄整個升級過程的操作歷史,用於追溯和審計。

```typescript
interface ChangeLogEntry {
	/** 記錄 ID */
	id: string;

	/** 時間戳記 (ISO 8601) */
	timestamp: string;

	/** 操作類型 */
	action: ChangeAction;

	/** 關聯的套件名稱 */
	packageName?: string;

	/** 操作者 (system, developer) */
	actor: string;

	/** 操作描述 */
	description: string;

	/** 操作前狀態 */
	beforeState?: Record<string, any>;

	/** 操作後狀態 */
	afterState?: Record<string, any>;

	/** 操作結果 */
	result: 'success' | 'failure' | 'partial';

	/** 關聯的 Git commit SHA (如有) */
	commitSha?: string;

	/** 額外的上下文資訊 */
	metadata?: Record<string, any>;
}

enum ChangeAction {
	UpgradeStarted = 'upgrade-started',
	UpgradeCompleted = 'upgrade-completed',
	UpgradeFailed = 'upgrade-failed',
	ValidationStarted = 'validation-started',
	ValidationCompleted = 'validation-completed',
	ValidationFailed = 'validation-failed',
	RollbackStarted = 'rollback-started',
	RollbackCompleted = 'rollback-completed',
	CommitCreated = 'commit-created',
	NoteAdded = 'note-added',
}
```

**Example**:

```json
{
	"id": "log-20251020-103000-001",
	"timestamp": "2025-10-20T10:30:00Z",
	"action": "upgrade-started",
	"packageName": "typescript",
	"actor": "developer",
	"description": "開始升級 TypeScript 從 5.7.2 到 5.9.3",
	"beforeState": {
		"version": "5.7.2",
		"status": "pending"
	},
	"afterState": {
		"version": "5.9.3",
		"status": "in-progress"
	},
	"result": "success",
	"metadata": {
		"category": "compiler",
		"priority": "P1"
	}
}
```

---

## Entity Relationships

```
┌─────────────────────┐
│ DependencyPackage   │
│ - name              │
│ - currentVersion    │
│ - targetVersion     │◄────┐
│ - priority          │     │
│ - status            │     │
└──────┬──────────────┘     │
       │ 1                  │
       │ has                │
       │ 0..1               │
       ▼                    │
┌─────────────────────┐     │
│ ValidationResult    │     │
│ - overallStatus     │     │
│ - checks[]          │     │
│ - summary           │     │
└──────┬──────────────┘     │
       │ 1                  │
       │ generates          │
       │ 0..n               │ references
       ▼                    │
┌─────────────────────┐     │
│ BuildArtifact       │     │
│ - files[]           │     │
│ - buildTime         │     │
│ - deltaFromBaseline │     │
└─────────────────────┘     │
                            │
┌─────────────────────┐     │
│ ChangeLogEntry      │─────┘
│ - action            │
│ - description       │
│ - beforeState       │
│ - afterState        │
└─────────────────────┘
```

### Relationship Rules

1. **DependencyPackage → ValidationResult**: 一對零或一

    - 每個套件最多有一個最新的驗證結果
    - 驗證結果在升級完成後創建

2. **ValidationResult → BuildArtifact**: 一對多

    - 每次驗證可能產生多個建置產物 (development + production)
    - 建置產物用於比對基準和回歸測試

3. **DependencyPackage → ChangeLogEntry**: 一對多
    - 每個套件可有多筆變更記錄
    - 記錄包含升級、驗證、回滾等所有操作

---

## Data Flow

### 升級流程的資料流動

```
1. [開始升級]
   ├─ 創建 DependencyPackage (status: pending)
   └─ 創建 ChangeLogEntry (action: upgrade-started)

2. [執行 npm update]
   ├─ 更新 DependencyPackage (status: in-progress)
   └─ 創建 ChangeLogEntry (action: upgrade-completed)

3. [開始驗證]
   ├─ 更新 DependencyPackage (status: validating)
   ├─ 創建 ValidationResult
   └─ 創建 ChangeLogEntry (action: validation-started)

4. [執行驗證檢查]
   ├─ 編譯檢查 → 更新 ValidationCheck
   ├─ 測試檢查 → 更新 ValidationCheck
   ├─ 建置檢查 → 創建 BuildArtifact
   └─ Lint 檢查 → 更新 ValidationCheck

5. [驗證完成]
   ├─ 更新 ValidationResult (overallStatus, summary)
   ├─ 更新 DependencyPackage (status: completed/failed)
   └─ 創建 ChangeLogEntry (action: validation-completed)

6. [如需回滾]
   ├─ 更新 DependencyPackage (status: rolled-back)
   └─ 創建 ChangeLogEntry (action: rollback-completed)
```

---

## Validation Checkpoints Schema

定義標準化的驗證檢查點配置,用於自動化驗證流程。

```yaml
# validation-checkpoints.yaml

checkpoints:
    - name: 'TypeScript Compilation'
      type: compilation
      command: 'tsc --noEmit'
      successCriteria:
          exitCode: 0
          maxDuration: 60000 # 60 秒
      failureHandling: 'abort'

    - name: 'Unit Tests'
      type: test
      command: 'npm test'
      successCriteria:
          exitCode: 0
          minPassRate: 100
          maxDuration: 180000 # 3 分鐘
      failureHandling: 'abort'

    - name: 'Code Coverage'
      type: coverage
      command: 'npm run test:coverage'
      successCriteria:
          minCoverage: 87.21
          maxDelta: -0.5 # 允許降低 0.5%
      failureHandling: 'warn'

    - name: 'Lint Check'
      type: lint
      command: 'npm run lint'
      successCriteria:
          exitCode: 0
          maxWarnings: 0
      failureHandling: 'warn'

    - name: 'Development Build'
      type: build
      command: 'npm run compile'
      successCriteria:
          exitCode: 0
          maxSizeIncrease: 5 # 5% 增長上限
          maxDuration: 120000 # 2 分鐘
      failureHandling: 'abort'

    - name: 'Production Build'
      type: build
      command: 'npm run package'
      successCriteria:
          exitCode: 0
          maxSizeIncrease: 5
          maxDuration: 180000 # 3 分鐘
      failureHandling: 'abort'
```

---

## Performance Metrics Schema

定義效能指標的追蹤格式,用於升級前後的效能比對。

```typescript
interface PerformanceBaseline {
	/** 基準版本 */
	version: string;

	/** 基準建立時間 */
	timestamp: string;

	/** 編譯效能 */
	compilation: {
		duration: number; // 毫秒
		memoryUsage: number; // MB
		cpuUsage: number; // %
	};

	/** 測試執行效能 */
	testing: {
		duration: number; // 毫秒
		totalTests: number;
		averageTestDuration: number; // 毫秒
	};

	/** 建置效能 */
	build: {
		developmentDuration: number; // 毫秒
		productionDuration: number; // 毫秒
		bundleSize: number; // KB
		sourcemapSize: number; // KB
	};

	/** Lint 效能 */
	lint: {
		duration: number; // 毫秒
		filesScanned: number;
	};
}
```

---

## Implementation Notes

### 資料持久化策略

1. **package.json**: 套件版本的唯一真實來源
2. **upgrade-log.json**: 記錄所有變更歷史 (ChangeLogEntry[])
3. **validation-results/**: 每個套件的驗證結果 JSON 檔案
4. **build-artifacts/**: 建置產物的中繼資料 JSON 檔案
5. **performance-baseline.json**: 效能基準資料

### 檔案結構範例

```
specs/005-safe-dependency-updates/
├── data/
│   ├── upgrade-log.json           # 完整變更記錄
│   ├── performance-baseline.json  # 升級前效能基準
│   ├── validation-results/
│   │   ├── typescript-5.9.3.json
│   │   ├── eslint-9.38.0.json
│   │   └── ...
│   └── build-artifacts/
│       ├── typescript-5.7.2-baseline.json
│       ├── typescript-5.9.3-after.json
│       └── ...
└── ...
```

---

## Conclusion

本資料模型定義了依賴升級流程中的四個核心實體:

1. **DependencyPackage**: 追蹤套件升級狀態
2. **ValidationResult**: 記錄驗證結果和檢查點
3. **BuildArtifact**: 比對建置產物和效能
4. **ChangeLogEntry**: 記錄所有操作歷史

這些實體構成完整的追蹤和審計系統,確保升級過程可追溯、可回滾、可驗證。
