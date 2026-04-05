---
name: add-cyberbrick-sample
description: 新增或更新 CyberBrick MicroPython 範例工作區的完整工作流程。當使用者提到新增範例、更新範例、add sample、update sample、修改範例積木、建立範例積木、新增 CyberBrick 示範程式、sample workspace、範例工作區 時自動啟用。包含從 Blockly 工作區匯出 JSON、建立或覆蓋範例檔、更新索引、15 語系翻譯填寫、本機驗證到推送上線的完整流程。Full workflow for adding or updating a CyberBrick MicroPython sample workspace: export Blockly JSON, create or overwrite sample file, update index, fill 15-language translations, local validation, and push to production.
metadata:
    author: singular-blockly
    version: '1.1.0'
    category: content
argument-hint: 'add | update，以及範例名稱（英文 kebab-case），例如 update cyberbrick-soccer-robot'
license: Apache-2.0
---

# 新增或更新 CyberBrick 範例工作區技能 Add / Update CyberBrick Sample Skill

在 `media/samples/` 新增或更新一個合規的 CyberBrick MicroPython 範例工作區，並同步雲端索引 `index.json`，完成 15 語系本地化描述。

## 適用情境 When to Use

- 想**新增** CyberBrick 專題範例（如巡線機器人、避障機器人）
- 想**更新**現有範例的積木內容或翻譯描述
- 驗證範例能被範例瀏覽器正確載入

## 架構背景 Architecture Context

```
media/samples/
├── index.json                        ← 雲端優先範例索引
├── cyberbrick-soccer-robot.json      ← 既有範例
└── {新範例 id}.json                  ← 你將建立的檔案
```

**雲端 URL（上線後生效）**：

```
https://raw.githubusercontent.com/Shen-Ming-Hong/singular-blockly/master/media/samples/index.json
https://raw.githubusercontent.com/Shen-Ming-Hong/singular-blockly/master/media/samples/{filename}
```

**驗證規則**（`validateSampleWorkspace` + `validateSampleFilename`）：

- `filename` 必須是純 basename、不含路徑分隔符、副檔名必須是 `.json`
- 工作區 JSON 必須有非 null 的 `workspace` 物件
- `board` 欄位必須是 `"cyberbrick"`

## 15 個語系代碼 Locale Codes

`en` / `zh-hant` / `ja` / `ko` / `de` / `fr` / `es` / `it` / `pt-br` / `ru` / `pl` / `cs` / `hu` / `bg` / `tr`

---

## 工作流程 Workflow

### Phase 0: 確認範例資訊 Gather Info

向使用者確認或自行決定以下資訊：

| 欄位          | 說明                    | 範例                                |
| ------------- | ----------------------- | ----------------------------------- |
| `id`          | kebab-case 唯一識別碼   | `cyberbrick-line-follower`          |
| `filename`    | 與 id 相同加 `.json`    | `cyberbrick-line-follower.json`     |
| `title`       | 各語系標題（`en` 必填） | `"Line Follower"`                   |
| `description` | 各語系描述（`en` 必填） | `"A workspace for line following."` |

若使用者未提供翻譯，**僅填寫英文**，其他語系留空字串，並在最後提示使用者補充。

### Phase 1: 取得工作區 JSON Get Workspace JSON

**方法 A：使用者提供**（推薦）

- 請使用者在 Extension Development Host 中：
    1. 切換至 CyberBrick 板子
    2. 拖出積木並建立範例程式
    3. 開啟 VS Code 指令面板 → `Singular Blockly: Open Blockly Editor`
    4. 確認工作區正確後，打開 `blockly/main.json`，複製全部內容

**方法 B：讀取現有 main.json**

```bash
# 從目前工作區取得
Get-Content -Path "blockly/main.json" -Raw
```

**方法 C：以既有範例為基礎**

```bash
# 複製既有範例並修改
Copy-Item media/samples/cyberbrick-soccer-robot.json media/samples/{new-filename}.json
```

### Phase 2: 建立範例 JSON 檔 Create Sample File

建立 `media/samples/{filename}.json`，結構如下：

```json
{
	"workspace": {
		/* Blockly 工作區序列化物件，來自 main.json */
	},
	"board": "cyberbrick"
}
```

**⚠️ 必要規則：**

- `board` 必須是字串 `"cyberbrick"`（驗證函式強制檢查）
- `workspace` 必須是物件（非 null、非陣列）
- `filename` 不得包含 `/`、`\`、`..` 等路徑字元

若使用者提供的 `main.json` 已是完整的工作區 JSON（含 `blocks`、`variables` 等），則整個物件作為 `workspace` 的值。

### Phase 3: 同步索引 Sync index.json

**依照 Phase 0 判斷的模式執行：**

#### ADD 模式：在 `samples` 陣列末尾新增條目

#### UPDATE metadata 模式：找到對應 `id` 的條目，只更新 `title` / `description` 欄位，**保留其他欄位不變**

```powershell
# 確認目標 id 存在
$index = Get-Content media/samples/index.json | ConvertFrom-Json
$entry = $index.samples | Where-Object { $_.id -eq "{id}" }
if (-not $entry) { Write-Error "id '{id}' not found in index.json" }
```

#### UPDATE workspace 模式：**直接跳過此步驟**（index.json 無需異動）

---

**ADD / UPDATE metadata 使用的完整條目格式：**

在 `media/samples/index.json` 的 `samples` 陣列**末尾**新增條目（ADD），或直接更新對應條目的 title/description（UPDATE metadata）：

```json
{
	"id": "{id}",
	"filename": "{filename}",
	"board": "cyberbrick",
	"title": {
		"en": "{英文標題}",
		"zh-hant": "{繁體中文標題}",
		"ja": "{日文標題}",
		"ko": "{韓文標題}",
		"de": "{德文標題}",
		"fr": "{法文標題}",
		"es": "{西班牙文標題}",
		"it": "{義大利文標題}",
		"pt-br": "{葡萄牙文（巴西）標題}",
		"ru": "{俄文標題}",
		"pl": "{波蘭文標題}",
		"cs": "{捷克文標題}",
		"hu": "{匈牙利文標題}",
		"bg": "{保加利亞文標題}",
		"tr": "{土耳其文標題}"
	},
	"description": {
		"en": "{英文描述}",
		"zh-hant": "{繁體中文描述}",
		"ja": "{日文描述}",
		"ko": "{韓文描述}",
		"de": "{德文描述}",
		"fr": "{法文描述}",
		"es": "{西班牙文描述}",
		"it": "{義大利文描述}",
		"pt-br": "{葡萄牙文（巴西）描述}",
		"ru": "{俄文描述}",
		"pl": "{波蘭文描述}",
		"cs": "{捷克文描述}",
		"hu": "{匈牙利文描述}",
		"bg": "{保加利亞文描述}",
		"tr": "{土耳其文描述}"
	}
}
```

> 💡 若部分語言翻譯留空字串 `""`，範例瀏覽器會 fallback 到 `"en"` 顯示，功能不受影響。

### Phase 4: 本機驗證 Local Validation

#### 4.1 JSON 格式驗證

```powershell
# 驗證 index.json 格式合法
Get-Content media/samples/index.json | ConvertFrom-Json | Select-Object -ExpandProperty samples | Select-Object id, filename, board

# 驗證新範例 JSON 結構
$sample = Get-Content "media/samples/{filename}" | ConvertFrom-Json
Write-Host "board: $($sample.board)"
Write-Host "workspace type: $($sample.workspace.GetType().Name)"
```

#### 4.2 驗證規則確認清單

- [ ] `filename` 純 basename，僅含字母、數字、連字號、底線
- [ ] `filename` 結尾為 `.json`
- [ ] JSON 檔案中 `board === "cyberbrick"`
- [ ] JSON 檔案中 `workspace` 為物件（非 null）
- [ ] `index.json` 中 `id` 唯一（不重複）
- [ ] `index.json` 的 `title.en` 和 `description.en` 非空

#### 4.3 Extension 本機測試（強烈建議）

```powershell
# 建置 extension
npm run compile

# 可選：強制使用本機 fallback（修改後記得還原）
# 在 sampleBrowserService.ts 中將 FETCH_TIMEOUT_MS 改為 1
```

1. 按 **F5** 啟動 Extension Development Host
2. 在 Host 中切換到 CyberBrick 板子
3. 點擊工具列書本圖示
4. 確認新範例卡片出現、title/description 顯示正確
5. 點擊「Load」確認積木能正確載入

### Phase 5: 提交與推送 Commit & Push

**依據模式選擇對應的 commit message 與 staged 檔案：**

```powershell
# ADD 模式（新增範例）
git add media/samples/{filename}.json media/samples/index.json
git commit -m "feat(samples): add {id} sample workspace"

# UPDATE workspace 模式（只更新積木內容）
git add media/samples/{filename}.json
git commit -m "fix(samples): update {id} workspace content"

# UPDATE metadata 模式（只更新翻譯/描述）
git add media/samples/index.json
git commit -m "i18n(samples): update {id} title/description"

# UPDATE both 模式
git add media/samples/{filename}.json media/samples/index.json
git commit -m "feat(samples): update {id} workspace and metadata"

git push origin master
```

> **⚠️ 直接推送 master**：範例內容更新屬於內容性變更，不需 PR 流程。
> 推送後約 30 秒 GitHub CDN 生效，使用者不需重新安裝 extension 即可看到新範例。

---

## 翻譯輔助 Translation Helper

若使用者只提供英文，可用以下模板要求 AI 翻譯：

```
請將以下英文 title 和 description 翻譯成 14 種語言：
title: "{英文標題}"
description: "{英文描述}"

需要的語言：繁體中文(zh-hant)、日文(ja)、韓文(ko)、德文(de)、法文(fr)、
西班牙文(es)、義大利文(it)、葡萄牙文巴西(pt-br)、俄文(ru)、波蘭文(pl)、
捷克文(cs)、匈牙利文(hu)、保加利亞文(bg)、土耳其文(tr)

以 JSON 格式回傳。
```

---

## 既有範例格式參考 Reference Format

參考 [`media/samples/cyberbrick-soccer-robot.json`](../../../../media/samples/cyberbrick-soccer-robot.json) 的頂層結構：

```json
{
    "workspace": {
        "blocks": { "languageVersion": 0, "blocks": [...] },
        "variables": [...]
    },
    "board": "cyberbrick"
}
```

---

## 完成檢核 Completion Checklist

### ADD 模式

- [ ] `media/samples/{filename}.json` 已建立，結構合規（有 `workspace` 物件、`board: "cyberbrick"`）
- [ ] `media/samples/index.json` 已新增條目（`id` 唯一、`title.en` 和 `description.en` 非空）
- [ ] 15 語系 title/description 已填寫（或至少 `en` + `zh-hant` 已填寫）
- [ ] 本機 JSON 格式驗證通過
- [ ] Extension 本機測試時**新卡片**顯示正確、積木可載入
- [ ] `git commit -m "feat(samples): add {id}..."` 已推送至 master

### UPDATE workspace 模式

- [ ] `media/samples/{filename}.json` 已覆蓋，結構合規
- [ ] `media/samples/index.json` **未被異動**
- [ ] 本機測試時載入範例確認積木內容為最新版本
- [ ] `git commit -m "fix(samples): update {id} workspace content"` 已推送至 master

### UPDATE metadata 模式

- [ ] `media/samples/index.json` 中對應條目的 title/description 已更新
- [ ] `media/samples/{filename}.json` **未被異動**
- [ ] 本機測試時卡片顯示更新後的 title/description
- [ ] `git commit -m "i18n(samples): update {id} title/description"` 已推送至 master

### 通用

- [ ] 推送後 30 秒確認雲端可存取
