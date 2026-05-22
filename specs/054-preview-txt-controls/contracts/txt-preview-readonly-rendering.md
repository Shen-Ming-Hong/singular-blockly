# TXT 預覽唯讀畫布渲染合約

**版本**：v1  
**範圍**：`media/html/blocklyPreview.html`、`media/js/blocklyPreview.js`、`media/css/blocklyEdit.css`

---

## 合約目標

本文件定義 TXT preview 中虛擬控制畫布的 DOM 結構、互動邊界與視覺狀態，確保：

- 使用者能完整檢視保存內容
- Preview 維持唯讀
- 左右佔比可調整，但不影響內容或持久化資料

---

## DOM 結構契約

### 必要區塊

TXT preview 啟用時，畫面至少需包含：

```text
preview-container/
├── txtVirtualControlsPanel
│   ├── txtVirtualControlsHeader
│   ├── txtVirtualControlsWarningList
│   ├── txtVirtualControlsEmptyState
│   └── txtVirtualControlsCanvas
├── txtVirtualControlsSplitter
└── blocklyArea
    └── blocklyDiv
```

### 規則

1. `txtVirtualControlsPanel` 在 TXT preview 中必須存在，即使沒有任何控制元件也不可消失。
2. `txtVirtualControlsCanvas` 負責顯示已保存的虛擬按鈕或 placeholder。
3. `txtVirtualControlsSplitter` 只控制視覺左右佔比，不可驅動任何保存行為。
4. 非 TXT preview 不得顯示、啟用或佔用上述 TXT panel 版面，避免回歸其他板型。
5. 若 HTML template 靜態包含 TXT panel DOM，非 TXT preview 必須讓該 DOM 維持 hidden / inert / `aria-hidden`；若採動態建立，則僅能在 TXT preview 中建立。

---

## 允許互動

TXT preview 中，僅允許以下互動：

### 1. Blockly 工作區既有唯讀互動

- 平移
- 縮放
- 捲動

### 2. 虛擬控制畫布檢視互動

- 畫布捲動
- 左右佔比調整
- 滑鼠 hover 顯示 tooltip / warning（若有）

### 3. 視覺同步互動

- 主題切換
- 語言切換

---

## 禁止互動

TXT preview 中，下列動作都必須被阻止：

- 拖曳虛擬按鈕
- 重新命名
- 改色
- 新增 / 刪除控制項
- 模擬 press / release
- Context menu 編輯行為
- 任何導向 `saveWorkspace` 或 runtime 的事件

### 規則

1. `pointer` 與 `keyboard` 事件都必須有 readonly guard。
2. 被阻止的互動不得靜默改變 DOM 後再回復；應直接不讓狀態進入可編輯流程。
3. Splitter 例外：允許調整左右佔比，但該互動不屬於內容編輯。

---

## 視覺狀態契約

### A. 正常內容狀態

- 顯示所有可恢復的虛擬按鈕
- 保留保存時的位置、尺寸與顏色
- 不顯示空狀態訊息

### B. 空狀態

- 保留虛擬控制面板
- 在畫布區顯示明確空狀態訊息
- 不因缺少 `txtVirtualControls` 而隱藏 panel

### C. 部分恢復狀態

- 顯示可恢復的虛擬按鈕
- 顯示 warning list 或對應 placeholder
- 不阻止整體 preview 使用

### D. 錯誤狀態

- 以可理解方式告知虛擬控制資料無法完整顯示
- 優先保住 Blockly 工作區 preview
- 不讓整個 preview 白屏或崩潰

---

## Splitter 契約

### 互動規則

- 使用者可以拖曳 `txtVirtualControlsSplitter` 改變左右佔比
- 佔比調整僅影響當前 preview 視窗
- 關閉 preview 後，下次重新開啟回到預設比例

### 禁止事項

- 不得把佔比寫回 backup 或 workspace 檔案
- 不得因 splitter 互動改變虛擬按鈕位置
- 不得因 splitter 互動解除任何 readonly guard

---

## Warning / Placeholder 契約

### Warning list

- 用於顯示舊備份缺少文件、部分資料無法還原、失效引用等情況
- 文字需支援 i18n
- 屬於非阻斷提示

### Placeholder

- 只在有足夠定位資訊能讓使用者理解「這裡本來有東西」時使用
- 若無法合理定位，改用 warning list 顯示，不強行畫 placeholder

---

## 可近性與語意化要求

- 唯讀 panel 應以語意或 class 明確標示 preview mode
- Splitter 應有對應的 aria 說明（例如調整檢視比例）
- Warning 區域應可被螢幕閱讀器讀取
- 不可讓使用者誤以為按鈕可操作或可執行

---

## 不做的事（v1 範圍外）

- 不支援在 preview 中改名後即時重排
- 不支援 preview 內虛擬控制按壓示範
- 不支援持久化 splitter ratio
- 不支援 preview 端編輯虛擬控制內容
