---
applyTo: '**'
description: '這份指導文件提供了 VScode Extension 開發的基本資訊和原則，幫助開發者撰寫高品質、易於維護的程式碼。'
---

# 基本資訊

-   這是一個 VScode Extension
-   必須先閱讀`src/extension.ts`、`media/js/blocklyEdit.js`、`media/html/blocklyEdit.html`再接著下去做其他修改
-   如果判斷需要最新資訊或查找指令可以使用網路搜尋工具
-   log 的輸出方式請使用 `log.info`、`log.error`、`log.debug`、`log.warn`，而不是 `console.log`、`window.log`，這樣可以方便後續的除錯和維護
-   在 html 當中 log 的輸出方式請使用 `console.log`，因為這是瀏覽器的原生 API，並且在開發過程中可以直接在瀏覽器的開發者工具中查看輸出

# 開發原則

## 撰寫風格指南

-   **簡單好維護**: 撰寫清晰易懂的程式碼，避免過度複雜的實作，優先考慮可讀性
-   **可擴充性**: 設計模組化的架構，讓未來能夠容易地擴充功能而無需大幅改動現有程式碼
-   **避免過度開發**: 專注於實現核心功能，避免開發過多非必要功能，遵循「足夠好」的原則
-   **保持彈性**: 撰寫通用、可配置的程式碼，讓系統能適應不同使用場景和需求變化
