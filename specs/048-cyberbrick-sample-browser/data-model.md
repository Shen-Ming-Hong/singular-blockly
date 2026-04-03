# 資料模型：CyberBrick 範例工作區瀏覽器

**功能**: 048-cyberbrick-sample-browser
**日期**: 2026-04-04

---

## 實體概觀

本功能涉及三個核心實體，均以 JSON 格式儲存於 `media/samples/` 資料夾。

---

## Sample Index（`index.json`）

**用途**：範例目錄，由雲端優先取得，描述所有可用範例的元資料。

```typescript
interface SampleIndex {
    version: number;           // 純紀錄用，讀取時不做版本比對
    samples: SampleEntry[];
}

interface SampleEntry {
    id: string;                // 唯一識別碼，如 "cyberbrick-soccer-robot"
    filename: string;          // 相對檔名，如 "cyberbrick-soccer-robot.json"
    board: string;             // 目前固定為 "cyberbrick"
    title: LocalizedText;      // 多語言標題
    description: LocalizedText; // 多語言描述
}

interface LocalizedText {
    en: string;                // 必填，作為 fallback
    "zh-hant"?: string;
    ja?: string;
    ko?: string;
    de?: string;
    fr?: string;
    es?: string;
    it?: string;
    pt-br?: string;
    ru?: string;
    pl?: string;
    cs?: string;
    hu?: string;
    bg?: string;
    tr?: string;
}
```

**驗證規則**：

- `version`：必填，正整數，純紀錄用
- `samples`：必填，陣列（允許空陣列，UI 顯示「目前沒有可用範例」）
- `id`：必填，每個條目唯一，建議使用 kebab-case
- `filename`：必填，相對於 `media/samples/` 的檔名
- `board`：必填，目前僅接受 `"cyberbrick"`
- `title.en`：必填（`LocalizedText` 的最低要求）
- 當前 UI 語言不存在時，fallback 至 `en`

**範例**：

```json
{
	"version": 1,
	"samples": [
		{
			"id": "cyberbrick-soccer-robot",
			"filename": "cyberbrick-soccer-robot.json",
			"board": "cyberbrick",
			"title": {
				"en": "Soccer Robot",
				"zh-hant": "足球機器人",
				"ja": "サッカーロボット",
				"ko": "축구 로봇",
				"de": "Fußballroboter",
				"fr": "Robot de football",
				"es": "Robot de fútbol",
				"it": "Robot da calcio",
				"pt-br": "Robô de futebol",
				"ru": "Футбольный робот",
				"pl": "Robot piłkarski",
				"cs": "Fotbalový robot",
				"hu": "Focis robot",
				"bg": "Футболен робот",
				"tr": "Futbol robotu"
			},
			"description": {
				"en": "A complete starter workspace for a CyberBrick soccer robot.",
				"zh-hant": "CyberBrick 足球機器人的完整起始工作區。",
				"ja": "CyberBrick サッカーロボットの完全なスターターワークスペース。",
				"ko": "CyberBrick 축구 로봇을 위한 완전한 시작 작업공간.",
				"de": "Ein vollständiger Starter-Arbeitsbereich für einen CyberBrick-Fußballroboter.",
				"fr": "Un espace de travail de démarrage complet pour un robot de football CyberBrick.",
				"es": "Un espacio de trabajo inicial completo para un robot de fútbol CyberBrick.",
				"it": "Uno spazio di lavoro iniziale completo per un robot da calcio CyberBrick.",
				"pt-br": "Um espaço de trabalho inicial completo para um robô de futebol CyberBrick.",
				"ru": "Полное стартовое рабочее пространство для футбольного робота CyberBrick.",
				"pl": "Kompletne startowe środowisko pracy dla robota piłkarskiego CyberBrick.",
				"cs": "Kompletní startovací pracovní prostor pro fotbalového robota CyberBrick.",
				"hu": "Teljes kezdő munkaterület CyberBrick focis robothoz.",
				"bg": "Пълно начално работно пространство за футболен робот CyberBrick.",
				"tr": "CyberBrick futbol robotu için eksiksiz bir başlangıç çalışma alanı."
			}
		}
	]
}
```

---

## Sample Workspace（`{id}.json`）

**用途**：標準 Blockly workspace 序列化格式，與 `blockly/main.json` 使用相同 schema。

```typescript
interface SampleWorkspace {
	workspace: BlocklyWorkspaceState; // Blockly 序列化狀態
	board: 'cyberbrick'; // 固定值
}
```

**驗證規則（FR-011）**：

- `workspace`：必填，物件型別（`typeof === 'object' && value !== null`）
- `board`：必填，必須等於 `"cyberbrick"`
- 其餘積木內容不做深度驗證（信任 Blockly 自身的稀錯能力）

**狀態轉換**：

```
雲端取得 → schema 驗證 → 通過 → 傳送至 WebView → Blockly.serialization.workspaces.load()
                         ↓ 失敗
                     顯示錯誤通知，工作區不變
```

---

## FetchResult（Service 內部型別）

**用途**：包裝 HTTP + fallback 取得結果，附帶離線旗標供 WebView 顯示提示。

```typescript
interface FetchResult<T> {
	data: T;
	isOffline: boolean; // true 表示 fallback 至本機版本已觸發
}
```

---

## Sample Card（WebView UI 狀態）

**用途**：模態瀏覽器中每張卡片的渲染資料，從 `SampleEntry` 加上當前語言文字萃取而來。

```typescript
interface SampleCard {
	id: string;
	filename: string;
	localizedTitle: string; // 已解析為當前語系的標題
	localizedDescription: string; // 已解析為當前語系的描述
}
```

**語言解析規則**：

```
localizedTitle = entry.title[currentLang] ?? entry.title['en']
```

其中 `currentLang` 來自 `window.languageManager.getCurrentLanguage()` 或 `showSampleBrowser` 訊息中的 `language` 欄位。

---

## i18n 鍵值（Extension Host 端，需加入所有 15 個 locale）

| 鍵值                            | 用途                | 英文預設值                                              |
| ------------------------------- | ------------------- | ------------------------------------------------------- |
| `SAMPLE_BROWSER_BUTTON_TITLE`   | 工具列按鈕 tooltip  | `"Load Sample"`                                         |
| `SAMPLE_BROWSER_TITLE`          | 模態標題            | `"CyberBrick Samples"`                                  |
| `SAMPLE_BROWSER_LOADING`        | 載入中文字          | `"Loading samples..."`                                  |
| `SAMPLE_BROWSER_OFFLINE_NOTICE` | 離線提示            | `"Using built-in samples (offline)"`                    |
| `SAMPLE_BROWSER_LOAD_BUTTON`    | 卡片載入按鈕        | `"Load"`                                                |
| `SAMPLE_BROWSER_EMPTY`          | 無範例提示          | `"No samples available"`                                |
| `SAMPLE_BROWSER_CONFIRM_LOAD`   | 確認對話框訊息      | `"This will replace your current workspace. Continue?"` |
| `SAMPLE_BROWSER_CONFIRM_YES`    | 確認按鈕            | `"Load Sample"`                                         |
| `SAMPLE_BROWSER_CONFIRM_NO`     | 取消按鈕            | `"Cancel"`                                              |
| `SAMPLE_BROWSER_ERROR_INVALID`  | schema 驗證失敗通知 | `"Invalid sample format, cannot load"`                  |
