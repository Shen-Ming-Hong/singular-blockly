# Phase 1 資料模型：Agent Skills 取代 MCP

## 1. PackagedSkillBundle（封裝 Skill 組合）

擴充套件內的唯讀英文資產，是安裝至使用者專案的來源。

| 欄位 | 型別 | 規則 |
|------|------|------|
| `schemaVersion` | integer | 目前固定為 `1`。 |
| `manager` | string | 固定為 `singular-blockly`。 |
| `skillVersion` | string | 與提供該契約的 extension 版本對應。 |
| `manifestTarget` | string | 固定為 `.agents/skills/singular-blockly/managed-manifest.json`；manifest 是提交記錄，不列入 `managedFiles`。 |
| `managedFiles` | ManagedFile[] | 固定、無重複的專案相對 payload；須包含正式 `SKILL.md`、references 與 Claude 入口，不得包含 manifest 自身。 |
| `preservedFiles` | PreservedFile[] | 只建立一次、之後由使用者擁有；首版只有 `project-notes.md`。 |

### ManagedFile

| 欄位 | 型別 | 規則 |
|------|------|------|
| `source` | string | extension bundle 內相對路徑。 |
| `target` | string | 專案相對 POSIX 路徑，不得為絕對路徑或包含 `..`。 |
| `sha256` | string | 64 位小寫十六進位；對來源位元組計算。 |
| `kind` | enum | `canonical`、`reference`、`compatibility`。 |

### PreservedFile

| 欄位 | 型別 | 規則 |
|------|------|------|
| `source` | string | 英文初始範本來源。 |
| `target` | string | 固定專案相對路徑。 |
| `policy` | enum | 固定為 `create-if-missing`。 |

## 2. InstalledSkillManifest（已安裝受管理清單）

位置：`.agents/skills/singular-blockly/managed-manifest.json`。由 extension 管理且使用英文鍵值；是後續更新可否接管既有檔案的證據。

| 欄位 | 型別 | 規則 |
|------|------|------|
| `schemaVersion` | integer | 必須為支援版本。 |
| `manager` | string | 固定為 `singular-blockly`。 |
| `skillVersion` | string | 已完整提交的 Skill 版本。 |
| `managedFiles` | InstalledManagedFile[] | 只列可覆寫 payload 目標與安裝時雜湊，不列 manifest 自身或使用者檔案內容。 |
| `preservedFiles` | string[] | 只記錄保留政策路徑，不記錄內容或雜湊。 |

### InstalledManagedFile

| 欄位 | 型別 | 規則 |
|------|------|------|
| `path` | string | 專案相對固定路徑。 |
| `sha256` | string | 安裝完成時的官方內容雜湊。 |
| `kind` | enum | 與 packaged manifest 相同；不得為 manifest。 |

installed manifest 由通過驗證的 packaged manifest 產生，並在全部 payload 已提交後以固定 target 原子寫入。更新器只接受 `manager`、schema 與固定 target 合法的 manifest，實際更新集合永遠取舊 `managedFiles.path` 與新版 packaged allowlist 的交集；舊 manifest 的額外路徑不會被讀取、覆寫或刪除，也不會擴張權限。

## 3. SkillInstallationPlan（安裝計畫）

由純函式比較封裝 manifest、已安裝 manifest 與實際雜湊產生，不直接執行 I/O。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `result` | enum | `no-change`、`install`、`update`、`conflict`。 |
| `create` | path[] | 不存在且可安全建立的受管理檔。 |
| `replace` | path[] | 雜湊符合舊 manifest、可直接更新的檔案。 |
| `backupThenReplace` | path[] | 已知受管理但被修改，須先逐位元備份。 |
| `preserve` | path[] | 使用者擁有或未知內容。 |
| `conflicts` | SkillIssue[] | 無可信 manifest、路徑不安全或來源不一致。 |

### 狀態轉換

```text
inspect → no-change
        → conflict → write safe status/log → stop
        → prepare → backup → stage → commit payload → commit manifest → ready
                    └ any failure → rollback → failed
```

`ready` 只能在全部 canonical、references、compatibility 與不自我雜湊的 manifest 已提交後出現。rollback 失敗時狀態為 `failed`，並記錄需採取的恢復動作，但不得宣稱安裝成功；本次新建且尚未交付給使用者的 preserved file 也須在 rollback 時安全移除。

## 4. SkillStatus（AI 可讀狀態）

位置：`blockly/.singular-blockly/skill-status.json`。內容由 extension 管理，固定使用英文鍵值、英文枚舉與英文動作碼。

| 欄位 | 型別 | 規則 |
|------|------|------|
| `schemaVersion` | integer | 固定 `1`。 |
| `status` | enum | `ready`、`conflict`、`failed`。 |
| `skillVersion` | string/null | 只有可證明完整版本時填入。 |
| `manifestPath` | string | 只能是專案相對路徑。 |
| `backupPaths` | string[] | 本次建立的專案相對備份根目錄；不得列備份內容。 |
| `issues` | SkillIssue[] | 經清理的錯誤碼、受管理檔識別與動作。 |
| `lastAttemptAt` | ISO-8601 string | UTC 時間。 |

`lastAttemptAt` 只在實際 install、update、conflict 或 failed attempt 時改變。若啟動檢查結果為 `no-change` 且現有 `ready` 狀態內容正確，服務不得重寫狀態檔。

### SkillIssue

| 欄位 | 型別 | 規則 |
|------|------|------|
| `code` | string enum | 例如 `UNMANAGED_CONFLICT`、`BACKUP_FAILED`、`WRITE_FAILED`、`ROLLBACK_REQUIRED`。 |
| `path` | string/null | 只能是 manifest 內或狀態檔本身的專案相對路徑。 |
| `action` | string enum | 例如 `INSPECT_CONFLICT`、`RESTORE_BACKUP`、`RETRY_ON_WRITABLE_WORKSPACE`。 |

不得加入例外堆疊、憑證、環境變數、絕對路徑、完整 workspace JSON 或使用者自訂檔案內容。唯讀專案無法安全建立狀態時，只寫入 extension diagnostics。

## 5. BlockContract（積木契約）

位置：正式 Skill 的 `references/block-contract.json`。由 runtime 產生且固定使用英文。

| 欄位 | 型別 | 規則 |
|------|------|------|
| `schemaVersion` | integer | 契約 schema 版本。 |
| `blocklyVersion` | string | 產生時實際 Blockly 版本。 |
| `boards` | BoardContract[] | 從 `window.BOARD_CONFIGS` 衍生的 Arduino、CyberBrick 與 TXT 支援板型識別，依 `id` 排序。 |
| `blocks` | BlockTypeContract[] | 依 `type` 穩定排序且不得重複。 |

### BlockTypeContract

| 欄位 | 型別 | 規則 |
|------|------|------|
| `type` | string | `Blockly.Blocks` 已註冊且可由支援 UI 建立。 |
| `categories` | string[] | 由解析後工具箱或動態 flyout owner 衍生的穩定英文 category ID，至少一個且排序去重。 |
| `boards` | string[] | 至少一個可用板型，穩定排序。 |
| `connections` | object | `previous`、`next`、`output` 各使用 `ConnectionContract`，明確區分連線是否存在及其實際 check。 |
| `inputs` | InputContract[] | 名稱、input kind、連線 check 及必要性。 |
| `fields` | FieldContract[] | 欄位名稱、field type、預設序列化值與可選值。 |
| `extraState` | JSON value/absent | runtime 預設序列化所需的動態狀態。 |
| `minimalState` | object | 可在 disposable workspace 完成 load/save 的最小 block state。 |

### BoardContract

| 欄位 | 型別 | 規則 |
|------|------|------|
| `id` | string | 必須與 `main.json.board` 及 `window.BOARD_CONFIGS` key 相同，例如 `uno`、`cyberbrick`、`txt`。 |
| `language` | enum | `arduino`、`micropython`、`txt`。 |
| `toolbox` | string | 該板型實際解析的 toolbox 識別，不是絕對檔案路徑。 |

`BlockTypeContract.boards` 只能引用同一契約 `boards[].id`；不得延用舊 MCP dictionary 的另一套板型別名。

### ConnectionContract

| 欄位 | 型別 | 規則 |
|------|------|------|
| `enabled` | boolean | runtime 有建立該 connection 時為 `true`，否則為 `false`。 |
| `check` | string[]/null | `enabled: true` 時保存實際型別限制；Blockly 的 unrestricted connection 使用 `null`。`enabled: false` 時固定為 `null`。 |

不得只以 `check: null` 表示連線不存在，因為 Blockly 合法的 unrestricted connection 也會回傳 `null` check。

### 不變條件

- `blocks` 必須等於所有支援板型解析後 toolbox 類型與公開動態 flyout 類型的聯集，且每個 type 的 `categories` 與 `boards` 必須等於實際來源 membership。
- 未註冊、內部 mutator/helper、已移除或 UI 不可建立類型不得出現。
- 每個 `minimalState` 必須以目前 runtime round-trip 成功。
- 產物不得包含翻譯後的非英文說明、絕對檔案路徑或來源程式碼片段。

## 6. WorkspaceDocument（工作區文件）

位置：`blockly/main.json`。維持既有對外格式，不進行 migration。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `workspace` | object | Blockly JSON serialization state；正式驗證核心。 |
| `board` | string/既有型別 | 目前選擇的板型；須為產品支援值。 |
| 其他既有欄位 | existing | TXT 虛擬控制及現有 metadata 保持相容。 |

空物件、缺少可用 workspace 的文件、未知 block type、無法還原的 extra state、非法 field/connection 及不適用板型都不能成為有效候選。

## 7. WorkspaceCandidate（候選工作區）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `generation` | integer | Extension Host 單調遞增；只允許最新 generation 提交。 |
| `requestId` | string | 驗證訊息關聯識別，不包含路徑或內容。 |
| `validationStartedAt` | timestamp/absent | 候選送入 WebView validator channel 時的單調時鐘值；解析前失敗時不存在。 |
| `deadlineAt` | timestamp/absent | 固定為 `validationStartedAt + 10 秒`，不受拖曳、重試或舊回覆延長。 |
| `rawBytes` | bytes | 只在記憶體、正式主檔或隔離檔保存；不寫入 diagnostics/status。 |
| `parsedDocument` | WorkspaceDocument/absent | JSON 解析成功後存在。 |
| `state` | enum | `observed`、`validating`、`valid`、`invalid`、`timed-out`、`channel-unavailable`、`superseded`、`recovered`。 |
| `issue` | WorkspaceIssue/absent | 可清理的錯誤摘要。 |

### 狀態轉換

```text
observed → invalid(parse/delete/empty) → quarantine → recovered
         → validating → valid → commit backup → load live
                      → invalid(runtime) → quarantine → recovered
                      → timed-out/channel-unavailable → quarantine → recovered
                      → superseded → ignore result
```

## 8. LastValidWorkspace（最後有效工作區）

持久化位置：`blockly/main.json.bak`；執行中另保留最近一次正式 workspace 成功序列化的記憶體快照。初次既有 `main.json` 必須先經 disposable runtime gate，只有成功載入正式 workspace 後才能初始化此狀態；之後每次正式編輯器儲存成功都會更新。

- 外部候選只有 round-trip 成功、正式 workspace 載入 acknowledgement 成功且獲最新 generation 提交後才能更新；正式編輯器正常儲存成功也能更新。
- 提交前必須保留舊 `.bak` bytes 與記憶體快照，正式載入或雙檔磁碟提交失敗時用於 rollback；恢復不得先覆寫唯一備份。
- 若磁碟備份不存在，允許使用記憶體快照；兩者皆不存在時不得用空資料取代主檔。

## 9. QuarantinedWorkspace（隔離工作區）

| 種類 | 路徑 | 保留規則 |
|------|------|----------|
| 最新 | `blockly/main.invalid.json` | 每次失敗更新，永不納入 5 份歷史計數。 |
| 歷史 | `blockly/main.invalid.<YYYYMMDDTHHmmssSSSZ>.json` | 依檔名 UTC 時間排序，只保留最近 5 份。 |

隔離保存原始候選位元組；刪除事件沒有候選位元組時，以英文 metadata JSON 記錄 `MAIN_FILE_DELETED`，但不得把最後有效內容偽裝成無效候選。清理只能匹配固定目錄與完整歷史檔名正規表示式。
