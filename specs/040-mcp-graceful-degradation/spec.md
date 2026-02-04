# Feature Specification: MCP Server 優雅降級與 Node.js 依賴處理

**Feature Branch**: `040-mcp-graceful-degradation`  
**Created**: 2026年2月4日  
**Status**: Draft  
**Input**: User description: "MCP Server 優雅降級與 Node.js 缺失處理"

## 背景說明

**問題描述**：當使用者電腦沒有安裝 Node.js 時，MCP Server 無法啟動，導致 GitHub Copilot 無法使用積木搜尋等 AI 輔助功能。更嚴重的是，MCP 啟動失敗會靜默發生，使用者不知道問題原因，即使他們不需要使用 MCP 功能也會困惑為何 AI 對話無法正常運作。

**影響範圍**：

- 使用者無法使用 Copilot/Claude 的積木搜尋、工作區查詢、平台配置等 MCP 工具
- 沒有明確錯誤訊息，使用者不知道需要安裝 Node.js
- nvm/fnm 使用者的 Node.js 路徑可能不在系統 PATH 中
- 缺乏診斷工具來協助使用者和開發者排查問題

**設計原則**：

1. MCP 功能定位為**增強功能**，失敗不應阻擋 Blockly 編輯器核心功能
2. 優雅降級（Graceful Degradation）：失敗時提供明確訊息，但不中斷使用體驗
3. 使用者友善：提供可操作的解決方案（安裝連結、設定指引）
4. 可診斷性：提供工具幫助使用者理解 MCP 狀態

## Clarifications

### Session 2026-02-04

- Q: User Story 1 提到「稍後提醒」按鈕。點擊後應該如何處理？ → A: 永久不再顯示（將 showStartupWarning 設定為 false）
- Q: User Story 3 的診斷命令應該在哪裡顯示報告？ → A: 訊息框 (vscode.window.showInformationMessage)
- Q: Node.js 版本檢測的頻率應該是？ → A: Extension 啟動時檢測一次（快取結果）
- Q: 自訂 Node.js 路徑 (singularBlockly.mcp.nodePath) 的驗證時機？ → A: 設定變更時立即驗證並顯示警告
- Q: 在多工作區 (Multi-root workspace) 環境中,Node.js 缺失警告應該如何顯示？ → A: 僅顯示一次（為主要工作區）

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Node.js 缺失時的友善警告 (Priority: P1)

當使用者電腦沒有安裝 Node.js 時，Extension 啟動時會顯示清楚的警告訊息，說明 MCP 功能需要 Node.js，並提供安裝連結。使用者可以選擇立即安裝或稍後提醒，同時 Blockly 編輯器的核心功能（積木拖放、程式碼生成、硬體上傳）完全不受影響。

**Why this priority**: 這是最關鍵的使用者體驗改善。目前靜默失敗會讓使用者困惑，這個功能直接解決核心問題，讓使用者知道為什麼 AI 功能無法使用以及如何解決。

**Independent Test**: 可透過暫時從 PATH 移除 Node.js 來完整測試。在沒有 Node.js 的環境中安裝 Extension，應該看到警告訊息，點擊「安裝 Node.js」會開啟官方下載頁面，選擇「稍後提醒」會關閉訊息，而 Blockly 編輯器功能完全正常運作。

**Acceptance Scenarios**:

1. **Given** 使用者電腦沒有安裝 Node.js（或 Node.js 不在 PATH 中），**When** 開啟包含 Blockly 專案的工作區，**Then** 看到警告訊息框顯示「MCP Server 需要 Node.js 才能讓 AI 助手（Copilot）使用積木搜尋功能。請安裝 Node.js 22.16.0 以上版本。」並提供「安裝 Node.js」和「稍後提醒」按鈕。

2. **Given** 警告訊息已顯示，**When** 點擊「安裝 Node.js」按鈕，**Then** 系統預設瀏覽器開啟 https://nodejs.org/ 下載頁面。

3. **Given** 警告訊息已顯示，**When** 點擊「稍後提醒」按鈕，**Then** 訊息框關閉，系統自動將 `singularBlockly.mcp.showStartupWarning` 設定為 `false`，Extension 正常運作，MCP 功能不可用但不顯示錯誤。

4. **Given** MCP Server 啟動失敗，**When** 使用者嘗試使用 Blockly 編輯器（開啟積木介面、拖放積木、生成程式碼、上傳到硬體），**Then** 所有功能正常運作，沒有任何錯誤或警告。

5. **Given** 使用者已點擊「稍後提醒」（`showStartupWarning` 已設為 `false`），**When** 下次啟動 Extension，**Then** 不再顯示警告訊息，即使 Node.js 仍未安裝。

6. **Given** 警告訊息是繁體中文介面，**When** 使用者檢視訊息內容，**Then** 所有文字都是繁體中文。

7. **Given** 使用者後來安裝了 Node.js，**When** 重新啟動 VSCode 並開啟 Blockly 專案，**Then** 不顯示警告訊息，MCP Server 成功啟動。

---

### User Story 2 - 自訂 Node.js 路徑設定 (Priority: P2)

進階使用者（特別是使用 nvm 或 fnm 管理多版本 Node.js 的開發者）可以在 VSCode 設定中指定自訂的 Node.js 可執行檔路徑。Extension 會優先使用自訂路徑來啟動 MCP Server，而不是從系統 PATH 尋找。

**Why this priority**: 這個功能為進階使用者提供彈性，特別是那些使用版本管理器的開發者。雖然不如 P1 關鍵（因為大多數使用者的 Node.js 都在 PATH 中），但對於特定使用者群體是必需的。

**Independent Test**: 可透過設定不同的 Node.js 路徑來獨立測試。在有多個 Node.js 版本的環境中，設定 `singularBlockly.mcp.nodePath` 為特定版本的路徑，驗證 MCP Server 使用該版本啟動（透過診斷命令查看版本資訊）。

**Acceptance Scenarios**:

1. **Given** 使用者在設定中指定了 `singularBlockly.mcp.nodePath: "C:\\Program Files\\nodejs\\node.exe"`，**When** Extension 初始化 MCP Provider，**Then** 使用該路徑而非系統 PATH 的 `node` 命令來啟動 MCP Server。

2. **Given** 使用者在設定 UI 中修改 `nodePath` 為無效路徑（檔案不存在），**When** 儲存設定的瞬間，**Then** 立即顯示警告訊息「指定的 Node.js 路徑無效：[路徑]。請檢查設定或使用預設的 'node' 命令。」，並記錄錯誤到 Output Channel。

3. **Given** 使用者設定的路徑指向有效的可執行檔但不是 Node.js（如 `python.exe`），**When** Extension 驗證該路徑，**Then** 顯示錯誤訊息「指定的檔案不是有效的 Node.js 可執行檔。請指定正確的 node.exe 路徑。」

4. **Given** 使用者設定的 Node.js 版本低於 22.16.0，**When** Extension 檢測 Node.js 版本，**Then** 顯示警告訊息「偵測到 Node.js [版本]，但 MCP Server 需要 22.16.0 以上版本。請升級 Node.js 或在設定中指定較新版本的路徑。」

5. **Given** 使用者使用 nvm 並切換了 Node.js 版本，**When** 重新啟動 VSCode，**Then** Extension 使用新版本的 Node.js（如果設定中是 nvm 路徑或相對路徑）。

6. **Given** 使用者在設定 UI 中找到「MCP: Node Path」設定項，**When** hover 在設定名稱上，**Then** 看到說明文字「Node.js 可執行檔路徑。留空以使用系統 PATH 的 'node' 命令。範例：C:\\Program Files\\nodejs\\node.exe」

---

### User Story 3 - MCP 狀態診斷命令 (Priority: P3)

使用者和開發者可以執行命令面板中的「Singular Blockly: Check MCP Status」命令，查看完整的 MCP Server 診斷資訊，包括 Node.js 版本、MCP Server 檔案存在性、VSCode API 版本、工作區路徑等。診斷結果可以複製到剪貼簿，方便分享給技術支援或提交 issue 時使用。

**Why this priority**: 這是診斷和故障排除工具，對於技術支援和開發者很有價值，但不是一般使用者的日常需求。放在 P3 是因為它依賴 P1 和 P2 的基礎設施（Node.js 檢測服務），應該在核心功能穩定後再實作。

**Independent Test**: 可在各種環境中獨立測試（有/無 Node.js、不同版本、自訂路徑等）。執行診斷命令應該總是能顯示結果，無論 MCP Server 是否正常運作。診斷資訊應該足以幫助使用者或開發者識別問題。

**Acceptance Scenarios**:

1. **Given** 使用者開啟命令面板（Ctrl+Shift+P），**When** 輸入「MCP Status」並執行命令，**Then** 顯示訊息框包含完整診斷資訊：

    ```
    【MCP Server 診斷報告】

    ✅ Node.js 版本: 22.16.0
    ✅ MCP Server Bundle: 存在
    ✅ VSCode API 版本: 1.105.0
    📁 工作區路徑: E:\my-project
    ⚙️ Node.js 路徑: node (系統 PATH)

    狀態：MCP Server 可正常運作
    ```

2. **Given** 診斷報告顯示，**When** 點擊「複製診斷資訊」按鈕，**Then** 診斷報告的純文字版本被複製到剪貼簿，並顯示「已複製到剪貼簿」提示。

3. **Given** Node.js 不存在，**When** 執行診斷命令，**Then** 顯示：

    ```
    【MCP Server 診斷報告】

    ❌ Node.js: 未安裝或不在 PATH 中
    ✅ MCP Server Bundle: 存在
    ✅ VSCode API 版本: 1.105.0
    📁 工作區路徑: E:\my-project
    ⚙️ Node.js 路徑: node (系統 PATH)

    狀態：MCP Server 無法啟動
    建議：安裝 Node.js 22.16.0 或更新版本
    ```

4. **Given** 使用者設定了自訂 Node.js 路徑，**When** 執行診斷命令，**Then** 「Node.js 路徑」顯示完整的自訂路徑而非 "node (系統 PATH)"。

5. **Given** MCP Server bundle 檔案缺失（如開發環境未編譯），**When** 執行診斷命令，**Then** 顯示「❌ MCP Server Bundle: 檔案不存在 (dist/mcp-server.js)」並建議「請執行 npm run compile 或重新安裝 Extension」。

6. **Given** 診斷命令在日文介面執行，**When** 檢視報告，**Then** 所有訊息（包括圖示說明、狀態文字、建議）都是日文。

---

### Edge Cases

- **同時缺少 Node.js 和 MCP Server bundle**：診斷報告應列出兩個問題，並按優先級提供建議（先解決 Node.js，再處理 bundle）。

- **Node.js 版本剛好是 22.16.0**：應視為合格版本，不顯示警告。版本比較使用語意化版本規則（semver）。

- **自訂路徑指向符號連結（symlink）**：應正確解析並驗證最終的可執行檔。

- **Windows 長路徑（超過 260 字元）**：自訂路徑設定應支援長路徑（如 `\\?\C:\...` 格式）。

- **多工作區（Multi-root workspace）**：MCP Server 僅為主要工作區（第一個資料夾）啟動。Node.js 缺失警告僅顯示一次（不會為每個工作區都彈出），診斷命令顯示主要工作區路徑。

- **權限問題**：Node.js 可執行檔存在但無執行權限時，應顯示「權限不足」錯誤而非「未找到」。

- **中文路徑**：自訂路徑包含中文字元時應正確處理（Windows 路徑編碼問題）。

- **使用者快速切換 Node.js 版本**：nvm/fnm 使用者切換版本後，重新啟動 VSCode 應使用新版本（不快取舊版本資訊）。

- **VSCode 版本過低（< 1.105.0）**：MCP Provider 應靜默跳過註冊（已有邏輯），診斷命令顯示「❌ VSCode API 版本過低」。

- **離線環境**：點擊「安裝 Node.js」按鈕在無網路時無法開啟頁面，應顯示「無法開啟瀏覽器，請手動訪問 https://nodejs.org/」。

- **Extension 更新後 MCP Server bundle 改變**：重新啟動後應使用新 bundle，檢測邏輯不應快取檔案狀態。

## Requirements _(mandatory)_

### Functional Requirements

#### Node.js 檢測與驗證

- **FR-001**: Extension MUST 在 MCP Provider 註冊前檢測 Node.js 是否可用（透過執行 `node --version` 命令）

- **FR-002**: Extension MUST 支援檢測系統 PATH 的 `node` 命令以及使用者設定的自訂路徑

- **FR-003**: Extension MUST 驗證 Node.js 版本是否符合最低需求（22.16.0 或更高）

- **FR-004**: Extension MUST 解析 `node --version` 輸出（格式如 `v22.16.0`）並進行語意化版本比較

- **FR-005**: Extension MUST 在 Node.js 不可用或版本過低時，記錄詳細錯誤資訊到 Output Channel（包含版本號、路徑、錯誤訊息）

#### 使用者通知與錯誤處理

- **FR-006**: Extension MUST 在 Node.js 缺失或版本過低時，顯示本地化的警告訊息框（支援目前的 15 種介面語言）

- **FR-007**: 警告訊息 MUST 包含問題描述、影響範圍（AI 功能無法使用）、解決方案（安裝或升級 Node.js）以及可操作的按鈕

- **FR-008**: Extension MUST 提供「安裝 Node.js」按鈕，點擊後在系統預設瀏覽器開啟 https://nodejs.org/ 下載頁面

- **FR-009**: Extension MUST 提供「稍後提醒」按鈕，點擊後自動將 `singularBlockly.mcp.showStartupWarning` 設定為 `false` 並關閉訊息框，永久停用該警告

- **FR-010**: Extension MUST 尊重 `singularBlockly.mcp.showStartupWarning` 設定，當設為 `false` 時不再顯示警告訊息

- **FR-011**: Extension MUST 在 MCP Server 啟動失敗時執行優雅降級：不註冊 MCP Provider，但不阻擋 Blockly 編輯器的核心功能

#### 設定選項

- **FR-012**: Extension MUST 提供 `singularBlockly.mcp.nodePath` 設定項，允許使用者指定 Node.js 可執行檔的完整路徑

- **FR-013**: Extension MUST 在 `nodePath` 設定為空或未設定時，使用預設值 `"node"`（從系統 PATH 尋找）

- **FR-014**: Extension MUST 在使用者修改 `nodePath` 設定時立即驗證路徑的有效性（檔案存在、可執行、是 Node.js），並在無效時顯示警告訊息，提示使用者修正或恢復預設值

- **FR-015**: Extension MUST 提供 `singularBlockly.mcp.showStartupWarning` 設定項（布林值，預設 `true`），控制是否顯示啟動警告

- **FR-016**: 設定項 MUST 包含本地化的描述文字和 markdown 說明（包含範例路徑和使用場景）

#### 診斷命令

- **FR-017**: Extension MUST 註冊命令 `singular-blockly.checkMcpStatus`，標題為「Singular Blockly: Check MCP Status」（本地化）

- **FR-018**: 診斷命令 MUST 收集以下資訊：
    - Node.js 可用性（✅/❌）和版本號
    - MCP Server bundle 檔案存在性（檢查 `dist/mcp-server.js`）
    - VSCode API 版本（檢查 `vscode.lm.registerMcpServerDefinitionProvider` 可用性）
    - 目前工作區路徑
    - 使用的 Node.js 路徑（系統 PATH 或自訂路徑）

- **FR-019**: 診斷命令 MUST 使用 VSCode 訊息框（`vscode.window.showInformationMessage`）顯示格式化的報告，包含圖示（✅/❌/⚙️/📁）和本地化文字

- **FR-020**: 診斷報告 MUST 根據檢測結果提供可操作的建議（如「安裝 Node.js」、「重新編譯 Extension」、「升級 VSCode」）

- **FR-021**: 診斷命令 MUST 提供「複製診斷資訊」按鈕，將報告的純文字版本複製到剪貼簿

#### 國際化

- **FR-022**: Extension MUST 為所有新增的錯誤訊息、設定描述、命令標題提供 15 種語言的翻譯（en, zh-hant, ja, ko, es, pt-br, fr, de, it, ru, pl, hu, tr, bg, cs）

- **FR-023**: Extension MUST 使用現有的 `LocaleService` 來載入本地化訊息

- **FR-024**: 所有訊息鍵 MUST 遵循現有命名慣例（如 `ERROR_MCP_NODE_NOT_FOUND`、`config.mcp.nodePath`）

#### 向後相容性

- **FR-025**: Extension MUST 保持現有的 MCP Provider 註冊邏輯，僅在檢測通過時才執行註冊

- **FR-026**: Extension MUST 在 VSCode 版本低於 1.105.0 時靜默跳過 MCP Provider 註冊（現有行為）

- **FR-027**: Extension MUST 確保現有使用者（已安裝 Node.js）的體驗完全不變，不顯示任何新警告

### Key Entities

- **Node.js 環境資訊**：代表使用者系統上的 Node.js 安裝狀態，包含以下屬性：
    - 可用性（布林值）
    - 版本號（字串，如 "22.16.0"）
    - 可執行檔路徑（字串）
    - 錯誤訊息（字串，當不可用時）

- **MCP 診斷報告**：代表 MCP Server 的完整運作狀態，包含：
    - Node.js 檢測結果
    - MCP Server bundle 檔案狀態
    - VSCode API 相容性
    - 工作區路徑資訊
    - 綜合狀態評估（可運作/部分可用/無法啟動）
    - 建議的解決方案列表

- **使用者設定**：與 MCP 相關的配置項目：
    - Node.js 自訂路徑（可選）
    - 是否顯示啟動警告（布林值）

### Assumptions

- **Node.js 版本需求**：使用 22.16.0 作為最低版本，與 README.md 和 CONTRIBUTING.md 的既有需求一致。

- **檢測方法**：使用 `child_process.exec('node --version')` 作為檢測方式，這是跨平台且可靠的標準做法。

- **版本解析**：假設 `node --version` 輸出格式為 `v<major>.<minor>.<patch>`（Node.js 官方標準格式）。

- **檢測頻率與快取**：Extension 啟動時檢測一次 Node.js 狀態並快取結果（用於 MCP Provider 註冊決策）。後續使用中不重複檢測，除非手動執行診斷命令（診斷命令總是重新檢測以獲取最新狀態）。使用者重新啟動 VSCode 後會重新檢測，因此 nvm/fnm 切換版本後的新狀態會在下次啟動時生效。

- **MCP Server bundle 路徑**：假設編譯後的檔案位於 `dist/mcp-server.js`（由 webpack.config.js 配置）。

- **多工作區行為**：MCP Server 僅為第一個工作區資料夾啟動，這是 VSCode MCP API 的限制。

- **權限問題**：假設大多數使用者有足夠權限執行 Node.js。權限錯誤會被視為「不可用」並顯示通用錯誤訊息。

- **瀏覽器可用性**：假設使用者系統有預設瀏覽器設定。`vscode.env.openExternal()` 無法開啟時會靜默失敗。

- **設定同步**：使用者的 `singularBlockly.mcp.*` 設定會透過 VSCode Settings Sync 在不同裝置間同步。

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 當使用者電腦沒有 Node.js 時，Extension 啟動後 5 秒內顯示清楚的警告訊息，100% 的情況下使用者能理解問題原因和解決方案

- **SC-002**: 使用者點擊「安裝 Node.js」按鈕後，系統瀏覽器在 2 秒內開啟 Node.js 官方下載頁面

- **SC-003**: 在 MCP Server 無法啟動的情況下，Blockly 編輯器的核心功能（開啟、編輯、儲存、上傳）維持 100% 可用性，無任何錯誤或效能降級

- **SC-004**: 診斷命令執行時間不超過 3 秒，並提供完整且可操作的診斷報告

- **SC-005**: 使用者設定自訂 Node.js 路徑後，Extension 在下次啟動時使用該路徑，驗證成功率 100%

- **SC-006**: 所有錯誤訊息、設定描述、診斷報告支援 15 種語言，翻譯完整性達 100%（透過 `npm run validate:i18n` 驗證）

- **SC-007**: 現有使用者（已安裝 Node.js 22.16.0+）升級 Extension 後，體驗保持一致，不看到任何新警告或提示

- **SC-008**: 技術支援人員收到 MCP 相關問題時，使用者提供的診斷報告能在 90% 的情況下直接識別問題原因

- **SC-009**: 使用 nvm/fnm 的進階使用者能透過設定自訂路徑，100% 成功使用指定版本的 Node.js 啟動 MCP Server

- **SC-010**: Extension 啟動後的記憶體使用量增加不超過 5MB（Node.js 檢測服務的額外開銷）

- **SC-011**: 在離線環境中，診斷命令仍能正常運作並提供本地化的建議（不依賴網路連線）

- **SC-012**: 單元測試覆蓋率達 90% 以上（針對 Node.js 檢測服務、MCP Provider 初始化邏輯、診斷命令）

### User Satisfaction Metrics

- **使用者理解度**：在沒有 Node.js 的情況下，90% 的使用者能透過警告訊息理解問題並知道如何解決（透過使用者訪談或調查）

- **自助解決率**：遇到 MCP 啟動問題的使用者中，80% 能透過警告訊息或診斷命令自行解決，無需聯繫技術支援

- **功能感知**：使用者能清楚區分「MCP 增強功能」和「Blockly 核心功能」，理解 MCP 失敗不影響主要工作流程

- **進階使用者滿意度**：使用 nvm/fnm 的開發者能輕鬆配置自訂 Node.js 路徑，不需要查閱文檔或尋求協助

### Business Metrics

- **技術支援負擔降低**：MCP 相關的技術支援請求數量減少 70%（相較於實作前的靜默失敗狀況）

- **首次成功率提升**：新使用者首次安裝 Extension 後能成功使用 AI 功能的比例提升至 95%（包含提示安裝 Node.js 的引導）

- **錯誤日誌品質**：在使用者回報的問題中，包含診斷報告的比例達 60%，大幅提升問題診斷效率

- **更新採用率**：現有使用者升級到新版本後，無因 MCP 相關問題而回退到舊版本的案例（0% 回退率）
