# Phase 0 Research：移除 CyberBrick Timer 實驗標記

> 目標：釐清實驗標記來源、影響範圍與最小變更策略，並確認不需要新增外部依賴。

## 決策 1：實驗標記來源與處理位置

- **Decision**：將 `cyberbrick_ticks_ms` 與 `cyberbrick_ticks_diff` 從 `media/blockly/blocks/cyberbrick.js` 內的實驗註冊清單移除。
- **Rationale**：實驗標記由 `window.potentialExperimentalBlocks` 收集，並由 `experimentalBlockMarker.js` 根據清單決定提示與視覺標記；移除註冊是最小且直接的做法。
- **Alternatives considered**：
  - 在 `experimentalBlockMarker.js` 內硬性排除這兩個 type（較侵入、可讀性較差）。
  - 僅修改 MCP 字典標記（無法影響 WebView 的實驗提示來源）。

## 決策 2：MCP 積木字典處理

- **Decision**：僅在需要時重跑 `npm run generate:dictionary`，不手動修改 `src/mcp/block-dictionary.json`。
- **Rationale**：字典應由腳本生成維護，且此變更主要影響 WebView 實驗提示；若字典內未標記為 experimental，則無需額外調整。
- **Alternatives considered**：
  - 手動編輯 `block-dictionary.json`（容易與生成結果不一致）。

## 決策 3：文件更新時機

- **Decision**：文件與變更紀錄更新延後至 PR 發布階段處理。
- **Rationale**：規格明確要求延後，不在本次變更範圍內。
- **Alternatives considered**：
  - 立即更新 README/CHANGELOG（違反需求範圍）。

## 決策 4：測試策略

- **Decision**：採用手動 WebView 驗證（工具箱與工作區）作為主要驗證方式。
- **Rationale**：WebView 互動測試屬於憲法允許的手動測試範圍，且此變更為視覺標記行為。
- **Alternatives considered**：
  - 建立自動化 WebView 測試（成本高、ROI 不符本次變更）。

## 結論

- 無需新增外部依賴或 API。
- 以最小變更移除實驗註冊即可達成需求。
- 後續 PR 發布時再補文件與變更紀錄。
