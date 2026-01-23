## ✨ 新功能 Feature

**功能名稱**: <!-- 簡短描述功能 -->  
**Spec 目錄**: `/specs/{NNN}-feature-name/`  
**優先級**: P1 / P2 / P3

---

## 功能摘要 Feature Summary

<!-- 用 2-3 句話描述此功能的目的和價值 -->

## 相關文件 Related Documents

- [ ] `spec.md` - 需求規格
- [ ] `plan.md` - 技術計劃
- [ ] `tasks.md` - 任務分解
- [ ] `data-model.md` - 資料模型 (如適用)
- [ ] `research.md` - 技術調研 (如適用)

---

## 變更內容 Changes

### 新增檔案 New Files

| 檔案路徑 | 說明 |
| -------- | ---- |
|          |      |

### 修改檔案 Modified Files

| 檔案路徑 | 變更說明 |
| -------- | -------- |
|          |          |

---

## 積木變更 Block Changes (if applicable)

### 新增積木 New Blocks

| 積木類型 | 類別 | 說明 |
| -------- | ---- | ---- |
|          |      |      |

### 生成程式碼範例 Generated Code Example

```cpp
// Arduino 程式碼範例
```

```python
# MicroPython 程式碼範例 (如適用)
```

---

## 國際化 Internationalization

- [ ] 已新增所有翻譯鍵至 15 種語言
- [ ] 執行 `npm run validate:i18n` 通過
- [ ] Tooltip 和積木文字皆已翻譯

**翻譯鍵數量**: <!-- 例如：新增 11 個翻譯鍵 -->

---

## 測試計劃 Test Plan

### 自動化測試 Automated Tests

- [ ] `npm run lint` 通過
- [ ] `npm run compile` 成功
- [ ] `npm run test` 通過
- [ ] `npm run generate:dictionary` 成功 (如涉及積木)

### 手動測試 Manual Tests

- [ ] F5 啟動 Extension Development Host
- [ ] 驗證積木在 Toolbox 中正確顯示
- [ ] 驗證程式碼生成正確
- [ ] 驗證多語言切換正常
- [ ] 驗證 Tooltip 顯示正確

---

## 安全考量 Security Considerations

<!-- 如有安全相關變更，請說明 -->

- [ ] 無命令注入風險
- [ ] 無 XSS 風險
- [ ] 無敏感資料外洩
- [ ] 已遵循 FileService 檔案操作規範

---

## 檢查清單 Checklist

- [ ] 所有 tasks.md 任務已完成
- [ ] 程式碼遵循專案編碼規範
- [ ] 已更新 MCP block dictionary (如適用)
- [ ] 已通過安全掃描
- [ ] 無 ESLint 警告

---

**For Reviewers**:

1. 驗證功能符合 spec.md 需求
2. 檢查程式碼品質和一致性
3. 確認翻譯完整且正確
4. 測試積木功能和程式碼生成
