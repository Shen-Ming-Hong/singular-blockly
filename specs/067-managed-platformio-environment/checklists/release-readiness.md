# 發布就緒需求品質檢查清單：受管理的 PlatformIO 雙 Core 環境

**目的**：供 PR reviewer 與 release reviewer 檢查初始化生命週期、Core 路由、供應鏈安全、隱私及發布證據的需求是否完整、明確且可量測
**建立日期**：2026-08-16
**功能規格**：[spec.md](../spec.md)

**Note**：本清單由 `$speckit-checklist` 依功能規格、計畫與任務產生；項目檢查需求文字品質，不取代實作測試。

## 需求完整性

- [x] CHK001 是否明確定義安裝 Extension、首次啟用、重新載入視窗與一般重新啟動各自何時開始 managed Core 初始化？[Completeness, Spec §FR-028]
- [x] CHK002 是否完整定義 activation、editor-open 與上傳前 `ensureReady()` 三個檢查點的責任與先後關係？[Completeness, Spec §FR-028–FR-029]
- [x] CHK003 是否分別定義 Arduino build／upload／monitor 與 Python／mpremote 的 primary、fallback 及 provider 不可用行為？[Completeness, Spec §FR-007–FR-011]
- [x] CHK004 是否列出每個受支援 OS／CPU、archive 格式與暫不支援環境，且與發布矩陣範圍一致？[Completeness, Spec §FR-003, Assumptions]
- [x] CHK005 是否完整規定下載、staging、健康探測、atomic commit、rollback、repair 與 cleanup 的狀態轉換？[Completeness, Spec §FR-004–FR-005, FR-017, FR-030]
- [x] CHK006 是否定義 provider Core 仍由 provider 擁有、不得被 Singular 更新或刪除的相容性界線？[Completeness, Spec §FR-006, FR-017]

## 需求清晰度

- [x] CHK007 「非阻塞初始化」是否以 UI 可繼續開啟、錯誤處理與 installer 執行邊界清楚定義？[Clarity, Spec §FR-028–FR-029]
- [x] CHK008 「同視窗單一初始化 Promise」及「跨視窗 lock」是否清楚區分共享範圍、重試時機與失效條件？[Clarity, Spec §FR-029–FR-030]
- [x] CHK009 「上傳開始」是否具有足以判斷禁止跨 Core 重試的唯一事件定義？[Clarity, Spec §FR-011]
- [x] CHK010 「本機 runtime 故障」是否以封閉分類清單和 pre-start 邊界定義，避免把編譯、網路、裝置或取消錯誤誤列為 fallback？[Clarity, Spec §FR-009–FR-011]
- [x] CHK011 managed storage 的「本機」、「可寫入」、「絕對路徑」、「既有 symlink component」與 root／UNC 拒絕條件是否無歧義？[Clarity, Spec §FR-002, FR-018–FR-019, FR-030]
- [x] CHK012 診斷中的 healthy、degraded、unavailable 與 unknown package 狀態是否都有可客觀判定的定義？[Clarity, Spec §FR-015–FR-016]

## 需求一致性

- [x] CHK013 啟用時立即初始化的需求是否與「診斷不得觸發安裝」一致，並清楚區分 coordinator 與 diagnostics 的副作用？[Consistency, Spec §FR-015–FR-016, FR-028]
- [x] CHK014 「不要求 Workspace Trust 的 runtime-only probe／install」是否與「所有可能載入專案 script 的操作先要求 trust」一致？[Consistency, Spec §FR-013, FR-028–FR-029]
- [x] CHK015 provider 優先的 Arduino 路由是否與 managed Core 預先安裝、官方 provider 引導保留及無 `extensionDependencies` 的要求互不衝突？[Consistency, Spec §FR-006–FR-007, FR-028]
- [x] CHK016 ARM64 的 release-candidate 限制是否與支援平台宣告、manifest artifact 與成功指標的敘述一致？[Consistency, Spec §FR-003, FR-022, §SC-007]
- [x] CHK017 自訂 managed storage 的可設定性是否與 cleanup 只刪除可證明由 Singular 擁有的項目一致？[Consistency, Spec §FR-002, FR-017, FR-030]

## 驗收條件品質

- [x] CHK018 首次安裝 15 分鐘門檻是否定義測量起訖、網路例外與 runner 等級，使結果可重現？[Measurability, Spec §SC-001]
- [x] CHK019 路徑矩陣成功條件是否列出各 OS 適用的 Unicode、空白、特殊字元、正規化與長路徑案例？[Measurability, Spec §SC-002]
- [x] CHK020 「初始化早於任何上傳請求」及 installer 呼叫一次是否具有可自動蒐集的事件或計數依據？[Measurability, Spec §SC-011]
- [x] CHK021 離線重啟零下載是否明定必須重用相同 manifest／install record，且排除明確 repair 或版本變更？[Measurability, Spec §SC-006]
- [x] CHK022 evidence 綁定的 PR、event、head、tree、VSIX、manifest、runner 與 artifact id／SHA-256 欄位是否足以客觀判斷資料已過期？[Measurability, Spec §FR-023, §SC-007–SC-008]

## 情境與邊界覆蓋

- [x] CHK023 是否涵蓋啟用初始化失敗但編輯器仍開啟、之後 editor-open 重試及上傳端續裝的 recovery flow？[Coverage, Spec §FR-029]
- [x] CHK024 是否涵蓋 checksum 錯誤、archive traversal／link、權限不足、磁碟不足、程序中斷及舊版本可恢復等例外情境？[Coverage, Spec §FR-004–FR-005, FR-017–FR-019]
- [x] CHK025 是否涵蓋兩個 VS Code 視窗同時安裝、stale lock、已有 current 版本與部分 staging 等競態及復原需求？[Coverage, Spec §FR-005, FR-029–FR-030]
- [x] CHK026 是否明確涵蓋外部 PR、fork、label 被移除、新 commit、squash merge 與 release tree 不同等 evidence 失效情境？[Coverage, Spec §FR-023–FR-025]
- [x] CHK027 是否涵蓋 proxy、TLS、registry、device、serial、cancel 與 upload post-start 錯誤禁止 fallback 的負面情境？[Coverage, Spec §FR-009–FR-011]
- [x] CHK028 是否定義 machine-scoped 路徑為空、相對路徑、filesystem root、UNC／network、symlink 與無權限時的預期錯誤分類？[Coverage, Spec §FR-002, FR-018–FR-019, FR-030]

## 非功能需求、依賴與假設

- [x] CHK029 是否規定 logs、診斷、clipboard 與 CI artifacts 對 home、workspace、URL query、環境變數、credentials 及 secrets 的遮蔽要求？[Security, Spec §FR-015, FR-019, FR-023–FR-025]
- [x] CHK030 是否清楚規定 artifact URL、redirect、傳輸編碼與解碼後大小、timeout、SHA-256、archive entry／alias link 類型及執行前驗證的供應鏈邊界？[Security, Spec §FR-004–FR-005]
- [x] CHK031 是否記錄首次安裝依賴外部 Python／套件來源及 proxy／企業憑證不在自動修復範圍的假設？[Dependency, Assumption]
- [x] CHK032 是否定義 runtime-sensitive PR label 的授權者、branch protection required check 與 release evidence 保存責任？[Governance, Spec §FR-021–FR-025]
- [x] CHK033 是否清楚排除 cloud runner 實體硬體上傳，並指定人工 Arduino／CyberBrick smoke 的發布責任？[Scope, Spec §Out of Scope]
- [x] CHK034 是否要求所有新增診斷、狀態、錯誤與操作文字涵蓋 15 語系，且沒有只為英文定義的例外？[Localization, Spec §FR-026]
- [x] CHK035 managed root ownership marker、空目錄認領與 install／cleanup 共用 lock 的需求是否可測且不會認領未受管檔案？[Security, Spec §FR-030]
- [x] CHK036 PlatformIO pip constraint、安裝後版本 probe 與超出受測範圍不得 ready 的需求是否一致？[Supply Chain, Spec §FR-031]

## F5 回饋增量品質

- [x] CHK037 是否完整列出一般資料夾的取消、Escape／關閉、繼續與「不再提醒」選擇，並為每條路徑定義允許的 workspace 寫入？[Coverage, Spec §US7, FR-032–FR-034]
- [x] CHK038 「明確同意」是否具有可由 editor-open result 客觀驗證的 authority boundary，而不是依時間或推測專案狀態判斷？[Clarity, Spec §FR-032]
- [x] CHK039 取消後「資料夾不變」是否明列 `.agents/`、`.claude/`、`blockly/` 與 `.vscode/`，並有零呼叫與零差異成功指標？[Measurability, Spec §FR-033, SC-012]
- [x] CHK040 既有 Blockly 專案的靜默 Skill 維護是否與一般資料夾 consent gate 清楚區分且沒有相互矛盾？[Consistency, Spec §FR-034]
- [x] CHK041 OTA 設定與清除是否明確要求共用單一進度 surface、request 前可見及 running 時鎖定衝突控制項？[Completeness, Spec §FR-035]
- [x] CHK042 是否以資料可用性清楚區分設定的 determinate 與清除的 indeterminate progress，並禁止沒有中間事件時虛構百分比？[Clarity, Spec §FR-037]
- [x] CHK043 是否定義亮色、暗色、forced-colors、reduced-motion 及未定義 CSS token 的可驗收標準？[Accessibility, Spec §FR-036, SC-014]
- [x] CHK044 動態進度文案、ARIA terminal state 與 15 語系需求是否一致，且沒有只驗收視覺動畫而忽略輔助科技？[Accessibility, Spec §FR-026, FR-035–FR-037]

## issue #130／v0.87.1 增量品質

- [x] CHK045 Windows 正式預設 global storage 形狀、Unicode／空白／特殊字元上層與固定長度 version directory 是否共同形成可重現的路徑預算驗收？[Measurability, Spec §FR-038, FR-041, SC-015]
- [x] CHK046 runtime／artifact 身分移出目錄名稱後，是否仍由 install record 與 manifest SHA 保留供應鏈及向後相容依據？[Consistency, Spec §FR-004–FR-005, FR-038]
- [x] CHK047 provisioning running／failed snapshot 是否完整定義 attempt、trigger、stage、percent、時間與最近失敗的建立、成功清除及 Extension 重啟行為？[Completeness, Spec §FR-039]
- [x] CHK048 installer evidence 是否同時規定資料來源、最大長度、控制字元處理、home／workspace／managed root／credential／token 遮蔽與一般 log 禁止 raw output？[Security, Spec §FR-039, SC-016]
- [x] CHK049 provider operational 時 managed provisioning blocker 是否仍須呈現，且診斷、AI packet 與人工 issue draft 的欄位一致？[Consistency, Spec §FR-015, FR-039, SC-016]
- [x] CHK050 `managed-provisioning` 是否只在 probe／prepare 可 fallback，並對 cancellation、project-process 與 post-spawn 提供明確零 fallback 負面條件？[Security, Spec §FR-040, SC-017]

## issue #132／v0.87.2 增量品質

- [x] CHK051 short scratch 是否明確限定在 extension-owned 使用者暫存子目錄、固定長度不可預測 leaf 與本次交易 ownership，且禁止刪除碰撞目錄？[Security, Spec §FR-042]
- [x] CHK052 Windows path-budget 是否同時涵蓋 immutable runtime 與 installer scratch 的最深後代，並在任何 artifact 執行前以穩定錯誤碼拒絕？[Measurability, Spec §FR-043, SC-018]
- [x] CHK053 首次安裝、editor-open、ready／unsupported、repair、取消與成功後 reload 的 Notification 生命週期是否完整且互不矛盾？[Completeness, Spec §FR-044–FR-046]
- [x] CHK054 絕對百分比轉增量與 waiting-lock 零虛構進度是否具有單調、可由自動測試驗證的判定方式？[Truthfulness, Spec §FR-045]
- [x] CHK055 非取消失敗的三個 action 是否固定、在地化、隱私安全，且 `path-too-long` 明確保證 provider Core 未變更？[Recovery/Security, Spec §FR-046]
- [x] CHK056 同視窗去重與跨視窗 lock 後採用是否分別定義，且採用前必須重新驗證 current manifest／artifact／health？[Concurrency, Spec §FR-044, FR-047]
- [x] CHK057 乾淨 Windows `LongPathsEnabled=0`、六平台 runtime、15 語系與 provider 不變是否都列入 PR／release gate？[Coverage, Spec §SC-018–SC-019]

## 備註

- 完成方式：由 PR reviewer 逐項判斷需求是否足以實作及驗收；若答案為否，先修訂規格再進入 release gate。
- 本清單不替代 `tasks.md`、自動測試、實機 smoke 或安全審查紀錄。
- 2026-08-16 已依更新後 spec／plan／contracts 與 F5 回饋完成 44 項需求品質復核。
- 2026-08-17 已依 issue #130 hotfix 的 spec／plan／tests 完成 CHK045－CHK050 增量品質復核。
- 2026-08-17 已依 issue #132 hotfix 的 spec／plan／tests 完成 CHK051－CHK057 增量品質復核。
