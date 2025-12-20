# Data Model: Ctrl+S 快速備份快捷鍵

**Feature**: 017-ctrl-s-quick-backup  
**Date**: 2025-12-20  
**Status**: Completed

## 實體定義

### 1. QuickBackupState（快速備份狀態）

追蹤快速備份的節流狀態。

```typescript
interface QuickBackupState {
	/** 上次成功備份的時間戳（毫秒） */
	lastSaveTime: number;

	/** 節流冷卻時間（毫秒），預設 3000 */
	readonly COOLDOWN_MS: number;
}
```

**位置**：`media/js/blocklyEdit.js` 中的 `quickBackup` 物件

**初始狀態**：

```javascript
{
    lastSaveTime: 0,
    COOLDOWN_MS: 3000
}
```

---

### 2. ToastNotification（Toast 通知）

臨時顯示的訊息元素。

```typescript
interface ToastNotification {
	/** 訊息文字 */
	message: string;

	/** 通知類型 */
	type: 'success' | 'warning' | 'error';

	/** 顯示時長（毫秒），預設 2500 */
	duration: number;
}
```

**視覺狀態**：
| type | 背景色 | 說明 |
|------|--------|------|
| success | `#4CAF50` (綠色) | 備份成功 |
| warning | `#FF9800` (橙色) | 空工作區、冷卻中 |
| error | `#F44336` (紅色) | 備份失敗（預留） |

---

### 3. BackupRequest（備份請求）

WebView → Extension 的備份訊息。

```typescript
interface BackupRequest {
	/** 訊息命令 */
	command: 'createBackup';

	/** 備份名稱，格式：backup_YYYYMMDD_HHMMSS */
	name: string;

	/** Blockly 工作區序列化狀態 */
	state: BlocklyWorkspaceState;

	/** 當前選擇的開發板 */
	board: string;

	/** 當前主題 */
	theme: 'light' | 'dark';

	/** 是否為快速備份（可選，用於日誌區分） */
	isQuickBackup?: boolean;
}
```

**命名格式規範**：

```
backup_YYYYMMDD_HHMMSS
       │       │
       │       └── 時分秒（24小時制）
       └── 年月日

範例：backup_20251220_143052
```

---

### 4. BlocklyWorkspaceState（工作區狀態）

Blockly 序列化的工作區資料（現有類型，無需新增）。

```typescript
interface BlocklyWorkspaceState {
	blocks?: {
		blocks: BlockData[];
	};
	variables?: VariableData[];
}
```

**空工作區判斷**：

```javascript
const isEmpty = !state || !state.blocks || state.blocks.blocks.length === 0;
```

---

## 狀態轉換

### 快速備份流程

```
[初始狀態]
    │
    ▼
按下 Ctrl+S / Cmd+S
    │
    ▼
┌─────────────────────────────────┐
│ 檢查節流狀態                    │
│ canSave() = (now - lastSaveTime) >= COOLDOWN_MS │
└─────────────────────────────────┘
    │
    ├── canSave = false ──────────────────────────────┐
    │                                                 │
    ▼                                                 ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ 檢查工作區是否為空              │   │ 顯示冷卻警告 Toast              │
│ isEmpty = blocks.length === 0   │   │ type: 'warning'                 │
└─────────────────────────────────┘   │ message: BACKUP_QUICK_SAVE_COOLDOWN │
    │                                 └─────────────────────────────────┘
    ├── isEmpty = true ───────────────────────────────┐
    │                                                 │
    ▼                                                 ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ 執行備份                        │   │ 顯示空工作區警告 Toast          │
│ 1. 生成備份名稱                 │   │ type: 'warning'                 │
│ 2. 發送 createBackup 訊息       │   │ message: BACKUP_QUICK_SAVE_EMPTY │
│ 3. 更新 lastSaveTime            │   └─────────────────────────────────┘
│ 4. 顯示成功 Toast               │
└─────────────────────────────────┘
```

---

## i18n 訊息鍵

| 鍵名                         | 用途         | 佔位符               |
| ---------------------------- | ------------ | -------------------- |
| `BACKUP_QUICK_SAVE_SUCCESS`  | 備份成功訊息 | `{0}` = 備份檔案名稱 |
| `BACKUP_QUICK_SAVE_EMPTY`    | 空工作區警告 | 無                   |
| `BACKUP_QUICK_SAVE_COOLDOWN` | 節流警告     | 無                   |

### 各語言翻譯

| 語言    | SUCCESS                          | EMPTY                                                               | COOLDOWN                                                          |
| ------- | -------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| en      | Backup saved: {0}                | Workspace is empty, no backup needed                                | Please wait, backup just completed                                |
| zh-hant | 備份已儲存：{0}                  | 工作區為空，不需要備份                                              | 請稍候，上次備份剛完成                                            |
| ja      | バックアップ保存完了：{0}        | ワークスペースが空です、バックアップ不要                            | しばらくお待ちください、バックアップが完了したばかりです          |
| ko      | 백업 저장됨: {0}                 | 작업 공간이 비어 있습니다, 백업 불필요                              | 잠시 기다려 주세요, 백업이 방금 완료되었습니다                    |
| es      | Copia guardada: {0}              | El espacio de trabajo está vacío, no se necesita copia de seguridad | Por favor espere, la copia de seguridad acaba de completarse      |
| pt-br   | Backup salvo: {0}                | O espaço de trabalho está vazio, backup não necessário              | Por favor aguarde, o backup acabou de ser concluído               |
| fr      | Sauvegarde enregistrée : {0}     | L'espace de travail est vide, aucune sauvegarde nécessaire          | Veuillez patienter, la sauvegarde vient de se terminer            |
| de      | Backup gespeichert: {0}          | Arbeitsbereich ist leer, kein Backup erforderlich                   | Bitte warten, Backup wurde gerade abgeschlossen                   |
| it      | Backup salvato: {0}              | Lo spazio di lavoro è vuoto, backup non necessario                  | Attendere, il backup è appena stato completato                    |
| ru      | Резервная копия сохранена: {0}   | Рабочая область пуста, резервное копирование не требуется           | Пожалуйста, подождите, резервное копирование только что завершено |
| pl      | Kopia zapasowa zapisana: {0}     | Obszar roboczy jest pusty, kopia zapasowa nie jest potrzebna        | Proszę czekać, kopia zapasowa właśnie została ukończona           |
| hu      | Biztonsági mentés mentve: {0}    | A munkaterület üres, nincs szükség biztonsági mentésre              | Kérem várjon, a biztonsági mentés éppen befejeződött              |
| tr      | Yedek kaydedildi: {0}            | Çalışma alanı boş, yedekleme gerekli değil                          | Lütfen bekleyin, yedekleme az önce tamamlandı                     |
| bg      | Резервното копие е запазено: {0} | Работното пространство е празно, не е необходимо архивиране         | Моля, изчакайте, архивирането току-що приключи                    |
| cs      | Záloha uložena: {0}              | Pracovní prostor je prázdný, záloha není potřeba                    | Prosím počkejte, záloha byla právě dokončena                      |

---

## 驗證規則

### 備份名稱驗證

```javascript
// 已存在於 backupManager.isValidFilename()
function isValidFilename(filename) {
	return /^[^\\/:*?"<>|]+$/.test(filename);
}
```

**備份名稱格式**：`backup_YYYYMMDD_HHMMSS`

-   自動生成，無需使用者輸入驗證
-   僅包含字母、數字、底線，符合驗證規則

### 節流驗證

```javascript
function canSave() {
	const now = Date.now();
	return now - this.lastSaveTime >= this.COOLDOWN_MS;
}
```

**規則**：

-   `lastSaveTime` 初始為 0，首次備份一定可執行
-   連續備份間隔必須 ≥ 3000ms
