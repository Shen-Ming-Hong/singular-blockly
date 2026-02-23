---
name: specs-consolidation
description: |
    整合 specs/ 資料夾的規格文件到 docs/specifications/ 的完整工作流程。
    當使用者提到整合規格、清理 specs、merge specs、整理技術規格、specs 到 docs、
    consolidate specs、spec cleanup、規格整合、歸檔規格文件時自動啟用。
    依照規格編號由小到大依序整併，以較新的規格內容為準，刪除已整合的舊規格目錄，
    僅保留最新一筆 specs。
    Consolidates specs/ documents into docs/specifications/ in chronological number order.
    Newer spec content overrides older when overlapping. Deletes merged spec folders,
    keeping only the latest spec.
metadata:
    author: singular-blockly
    version: '1.0.0'
    category: documentation
license: Apache-2.0
---

# 規格整合技能 Specs Consolidation Skill

將 `specs/` 目錄中按編號排列的規格文件，依序整合進 `docs/specifications/` 的對應分類，
確保技術規格完整、無重複、以最新版本為準。

## 適用情境 When to Use

- `specs/` 積累了多個已完成的規格，需要歸檔到 `docs/`
- 準備發布版本，需確認技術文件是最新狀態
- 定期整理文件，刪除已不需要的 spec 目錄
- 新人 onboarding 前，需要完整且一致的技術規格庫

---

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
Get-ChildItem -Path specs/ -Directory | Sort-Object Name

# 確認最後一筆 spec 編號（要保留，不刪除）
# 例如：045-rc-remove-rc-get-button
```

#### 0.2 確認已整合範圍

讀取 `docs/specifications/README.md` 的文件結構說明，確認最後整合到哪個 spec 編號。
例如 "整合自 specs/001-031" → 尚未整合的從 032 開始。

同時讀取 `docs/specifications/EVOLUTION.md` 的時間軸，確認最後記錄的 spec 編號。

#### 0.3 彙整待整合清單

依以下欄位建立清單：

| spec 編號 | 目錄名稱 | 主要功能描述 | 目標 docs 分類 | 是否有重疊（與哪個 docs 檔） |
| --------- | -------- | ------------ | -------------- | ---------------------------- |

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
4. 在段落開頭標注來源：`> 來源：spec/{NNN}-{name}`

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

### Phase 2: 刪除已整合的 spec 目錄

整合完畢後，**刪除所有已整合的 spec 目錄**，只保留最新一筆（例如 `045-*`）。

```powershell
# 範例：刪除 spec 029~044（根據實際情況調整）
029, 030, 031, 032, ... | ForEach-Object {
    $dir = "specs\0$_-*"
    Remove-Item -Path $dir -Recurse -Force
}
```

> ⚠️ 執行前需先確認所有 spec 都已整合，且 git diff 已包含對應 docs 更新。

---

### Phase 3: 更新索引文件

#### 3.1 更新 docs/specifications/README.md

1. 更新開頭說明：`整合自 specs/001-{最新已整合編號}`
2. 在文件結構表格中新增對應的新 docs 檔案條目
3. 更新「快速導覽」表格

#### 3.2 最終驗證清單

```
[ ] specs/ 只剩最新一筆（如 045-*）
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
> 來源：spec/{NNN}-{name}（{YYYY-MM}）
```

這讓未來開發者能快速找到原始雜訊細節（checklists、tasks 等）。

---

## 相關資源 Related Resources

- `docs/specifications/README.md` — 當前整合狀態的索引
- `docs/specifications/EVOLUTION.md` — 開發歷程時間軸
- `specs/{NNN}-{name}/spec.md` — 每筆規格的主文件
