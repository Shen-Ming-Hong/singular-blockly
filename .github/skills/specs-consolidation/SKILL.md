---
name: specs-consolidation
description: |
    整合 specs/ 資料夾的規格文件到 docs/specifications/ 的完整工作流程。
    當使用者提到整合規格、清理 specs、merge specs、整理技術規格、specs 到 docs、
    consolidate specs、spec cleanup、規格整合、歸檔規格文件時自動啟用。
    依照規格編號由小到大依序整併，以較新的規格內容為準；以 Git／PR 合併紀錄修正
    未同步的 Draft 或 tasks 狀態，保留所有未完成的 SDD 及編號最新的 5 個已完成 SDD，
    只刪除其餘已確認整合完成的舊規格目錄。
    Consolidates specs/ documents into docs/specifications/ in chronological number order.
    Newer spec content overrides older when overlapping. Merged PR evidence overrides stale
    Draft or task metadata. Keeps every incomplete SDD plus the five newest completed SDDs,
    and removes older completed folders only after verification.
---

# 規格整合技能 Specs Consolidation Skill

將 `specs/` 目錄中按編號排列的規格文件，依序整合進 `docs/specifications/` 的對應分類，
確保技術規格完整、無重複、以最新版本為準。

## docs/specifications/ 目錄對應表 Category Mapping

| 目錄                       | 說明                   | 適用 spec 類型                        |
| -------------------------- | ---------------------- | ------------------------------------- |
| `00-technical-foundation/` | 技術基礎架構、資料模型 | 架構重構、核心系統設計                |
| `01-architecture/`         | 系統架構文件           | 模組化、訊息協定、服務層              |
| `02-internationalization/` | 多語言翻譯品質         | i18n、locale 相關                     |
| `03-hardware-support/`     | 硬體積木與板子支援     | CyberBrick、HuskyLens、ESP32、RC 相關 |
| `04-quality-testing/`      | 測試覆蓋率、安全防護   | 測試、品質、workspace 驗證            |
| `05-dependencies/`         | 依賴管理與升級         | npm 依賴、安全性修補                  |
| `06-features/`             | 功能開發與整合         | MCP、上傳 UI、語言選擇器、Bug 修復    |
| `appendix/`                | 附錄                   | 術語表、名詞定義                      |

---

## 工作流程 Workflow

### Phase 0: 先期調查

#### 0.1 掃描現有狀態

```bash
# 列出 specs/ 目錄（按編號排序）
find specs -maxdepth 1 -mindepth 1 -type d -print | sort

# 列出 GitHub feature PR 狀態；以 headRefName 對照 spec 的 Feature Branch
gh pr list --state all --limit 300 \
  --json number,title,state,headRefName,mergedAt,closedAt,url,mergeCommit

# 依下方完成狀態規則分類，再找出最新 5 個已完成 SDD
```

#### 0.2 判定完成狀態與保留集合

先將每個 `specs/{NNN}-{name}/` 分為「已完成」或「未完成」。從 `spec.md` 的
`Feature Branch`／`功能分支` 取得分支名稱，並以規格編號、分支名稱和 PR 標題交叉比對 GitHub。

完成證據依可靠性排序如下；較高順位證據可修正未同步的 Draft 或 tasks 核取方塊：

1. 對應 feature PR 的 `state` 是 `MERGED` 且 `mergedAt` 非空。
2. feature branch 的提交已確認可從預設分支到達，或由另一個已合併 PR／明確取代 PR 納入。
3. `tasks.md` 存在、至少包含一項任務，且所有任務核取方塊皆為 `[x]` 或 `[X]`。
4. `spec.md` 明確標示 `Shipped`、`Complete`、`已完成` 或 `已實作`，且沒有相反證據。

對應 PR 已合併時，即使 `spec.md` 仍為 Draft、缺少 `tasks.md`，或 `tasks.md` 留有未同步的
人工驗收項目，仍判定該 SDD 已完成，並在整合清單記錄 PR 編號、merge commit 與合併日期。

以下情況仍判定為**未完成**：

- 對應 PR 仍為 `OPEN`，且沒有其他合併／交付證據。
- PR 只有 `CLOSED`、`mergedAt` 為空，且找不到另一個已合併 PR 或預設分支納入證據。
- feature branch 尚未進入預設分支，文件也沒有完成證據。
- 完成證據互相衝突，且無法從 Git 歷史確認實作已交付。

GitHub 的「關閉」可能包含已合併與未合併兩種結果。不得只因遠端分支已刪除或 PR 顯示
`CLOSED` 就判定完成；優先確認 `MERGED`／`mergedAt`／`mergeCommit`。如果 repository 無法連線，
改以本地 `git branch --merged`、`git merge-base --is-ancestor` 與預設分支程式證據判斷；證據不足時保留。

`Status: Draft` 與未勾選任務只能表示 SDD 文件尚未收尾，不能推翻已合併 PR 的交付證據。
同樣地，不得因編號較舊就假定完成。

建立兩個保留集合：

1. 保留全部未完成 SDD。
2. 將已完成 SDD 依三位數編號排序，保留編號最新的 5 個。

只有「已完成、未列入最新 5 個已完成 SDD」的目錄可以進入待整合清單。若已完成 SDD 不足 5 個，不刪除任何已完成 SDD。

#### 0.3 確認已整合範圍

讀取 `docs/specifications/README.md` 的文件結構說明，確認最後整合到哪個 spec 編號。
例如 "整合自 specs/001-031" → 尚未整合的從 032 開始。

同時讀取 `docs/specifications/EVOLUTION.md` 的時間軸，確認最後記錄的 spec 編號。

`README.md` 宣告的整合編號只能作為線索，不能取代內容驗證。即使索引聲稱已整合，也必須確認每個待刪除 SDD 的核心知識確實存在於目標文件。

#### 0.4 彙整待整合清單

依以下欄位建立清單：

| spec 編號 | Git／PR 完成證據 | 文件證據 | 保留／整合 | 主要功能描述 | 目標 docs 分類 | 是否有重疊 |
| --------- | ---------------- | -------- | ----------- | ------------ | -------------- | ------------ |

**重疊判斷原則**：

- 同一硬體元件（如 CyberBrick RC）→ 合併進同一個 `03-hardware-support/` 檔案
- 同一功能域（如 bug fixes）→ 合併進 `06-features/bug-fixes.md`
- 時間順序衝突時 → **一律以較新 spec 為準，舊內容需刪除或標記過時**

---

### Phase 1: 逐一整合規格

對每個待整合的 spec（由小到大）：

#### 1.1 讀取 spec 內容

讀取 `specs/{NNN}-{name}/spec.md`（主規格）。
若存在，也讀取：

- `plan.md`（實作計畫精要）
- `data-model.md`（資料模型）
- `tasks.md`（核心任務清單，只取關鍵決策與結果）
- `research.md`（技術研究背景）

> ⚠️ 不要原封不動複製所有內容。提取**可複用的技術知識**：
>
> - 設計決策（為什麼這樣做）
> - 資料結構與 API 契約
> - 已實作的 Acceptance Criteria
> - 架構影響（新增/修改了什麼模組）

#### 1.2 判斷目標 docs 檔案

依 **Category Mapping** 表找到對應目錄，再判斷：

- **已有對應檔案**：直接在該檔案末尾加入新 spec 章節，或更新現有章節
- **無對應檔案**：在對應目錄建立新 `.md` 檔

命名原則：

- 單功能域：`{主題}.md`，例如 `cyberbrick-rc.md`
- 多 spec 合併：保持既有檔名，在末尾追加章節

#### 1.3 處理重疊內容

若目標檔案中已有舊版描述，且與新 spec 衝突：

1. 找到舊內容段落（透過標題或關鍵字）
2. **刪除舊段落**
3. 插入新 spec 內容
4. 在段落開頭標注來源：`> 來源：specs/{NNN}-{name}`

> ❗ 嚴禁保留兩個版本並存，這會誤導未來開發者。

#### 1.4 更新 EVOLUTION.md

在 `docs/specifications/EVOLUTION.md` 時間軸中追加新條目：

```markdown
YYYY-MM ─┼─ {NNN} {功能摘要}
```

格式：

- 使用實際的 `Created` 日期（取自 spec.md 的 **Created** 欄位）
- 包含：目標、主要變更（2-5 條重點）、架構決策（如有）

---

### Phase 2: 移除已整合的舊 spec 目錄

整合完畢後，只移除同時符合以下條件的 spec 目錄：

1. 已依 Phase 0 判定為完成。
2. 不屬於編號最新的 5 個已完成 SDD。
3. 核心技術知識已逐項確認存在於 `docs/specifications/`。
4. 對應的 `README.md` 與 `EVOLUTION.md` 已更新。

先列出精確目錄名稱並逐一核對，再執行移除。不得使用未解析的廣域 glob。執行前確認 git diff 已包含對應 docs 更新；移除後說明刪除了哪些目錄，以及可由 Git 歷史復原。

---

### Phase 3: 更新索引文件

#### 3.1 更新 docs/specifications/README.md

1. 更新開頭說明，清楚區分「文件涵蓋到的最高 spec 編號」與「本次實際歸檔的 spec 編號」
2. 在文件結構表格中新增對應的新 docs 檔案條目
3. 更新「快速導覽」表格

#### 3.2 最終驗證清單

```
[ ] specs/ 保留所有未完成 SDD
[ ] specs/ 保留編號最新的 5 個已完成 SDD
[ ] Draft／未勾選任務已用對應 PR 與預設分支歷史交叉核對
[ ] 其餘已完成 SDD 都已完成內容驗證後才移除
[ ] 每個已整合 spec 的核心技術規格都能在 docs/ 中找到
[ ] EVOLUTION.md 時間軸已涵蓋新增的 spec
[ ] README.md 的文件結構清單已同步更新
[ ] 無重複/矛盾的描述殘留在 docs/ 中
[ ] 已刪除的舊 spec 資料夾在 git status 中顯示為已移除
```

---

## 整合品質原則 Quality Principles

### 1. 不複製，要提煉

不要把 spec.md 整份複製到 docs。提取：

- **為什麼**（動機、設計決策）
- **What**（API、資料結構、積木名稱）
- **重要的限制**（Non-goals、已知問題）

省略：

- 草稿性文字（"Draft", "TODO"）
- 使用者故事的完整描述（保留 Acceptance Criteria 的精要）
- 重複的背景說明

### 2. 新舊衝突處理

| 情況                              | 處理方式                   |
| --------------------------------- | -------------------------- |
| 新 spec 新增功能，舊文件完全沒提  | 追加新章節到 docs          |
| 新 spec 修改/廢棄舊 spec 的某功能 | **刪除舊描述，替換為新版** |
| 新 spec 是對舊 spec 的 bugfix     | 在原章節更新，備注修復說明 |
| 兩個 spec 描述同一積木不同版本    | 只保留最新版，刪除舊版     |

### 3. 可追溯性

每個從 spec 整合的主要章節，在標題下方加一行：

```markdown
> 來源：specs/{NNN}-{name}（{YYYY-MM}）
```

這讓未來開發者能透過 Git 歷史快速找到原始細節（checklists、tasks 等）。

---

## 相關資源 Related Resources

- `docs/specifications/README.md` — 當前整合狀態的索引
- `docs/specifications/EVOLUTION.md` — 開發歷程時間軸
- `specs/{NNN}-{name}/spec.md` — 每筆規格的主文件
