# Feedback VSIX 封裝證據

**日期**：2026-08-26
**版本**：0.88.0
**暫存產物**：`/private/tmp/singular-blockly-feedback-0.88.0-20260826.vsix`

## 結果

- [x] `npm run package`：webpack 5.109.2 production build 成功。
- [x] 正式 `vsce package` 使用 production dependency discovery；VSIX 共 1,085 個 entries，檔案大小 6,827,557 bytes（約 6.51 MB）。
- [x] SHA-256：`ccb0c88011fcc72ce55b0f1c7d1e8951af16a5ce955d2c39b6890a3e22f54a21`。
- [x] `npm run feedback:verify-vsix -- /private/tmp/singular-blockly-feedback-0.88.0-20260826.vsix`：PASS（1,085 entries）。
- [x] `npm run feedback:verify-vsix:test`：6 passing。
- [x] 包含 `PRIVACY.md`、`SUPPORT.md`、`TERMS.md`、README、manifest 與 feedback HTML/CSS/JS。
- [x] 包含 Blockly、`@blockly/theme-modern`、`node-ssh` 與 `ssh2` 必要 runtime；不包含 Worker-only `jpeg-js`、`workers/`、D1 migrations、Wrangler 設定、Spec、維護者 Skill、`.env`、`ssh2/test` 私鑰 fixtures 或 webhook/GitHub secrets；三個必要 `ssh2` runtime parser 檔僅允許格式 marker，符合 PEM 結構的完整私鑰區塊仍拒絕。
- [x] 對實際封裝的 feedback JavaScript 掃描，沒有 `eval`、`new Function`、`innerHTML`、`outerHTML`、`insertAdjacentHTML` 或 `document.write`。
- [ ] 正式發布時仍須通過 VS Code Marketplace certification 與 Open VSX server-side secret/blocklist/namespace scan。

VSIX 僅建立於系統暫存目錄，未加入版本庫、未上傳、未發布。
