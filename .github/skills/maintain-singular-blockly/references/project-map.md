# 專案地圖

只查本次變更涉及的列；詳細不變量與通用命令以 `AGENTS.md`、現行程式碼和相關規格為準。

| 變更範圍 | 從這些來源追查 | 定向驗證 |
| --- | --- | --- |
| 擴充套件啟動、命令與 WebView 訊息 | `src/extension.ts`、`src/webview/`、`media/js/blocklyEdit.js` | `src/test/webview/`、相關 `src/test/suite/`；`npm run compile`、`npm run lint` |
| 工作區存取與外部候選復原 | `src/services/fileService.ts`、`workspaceCandidateService.ts`、`src/webview/messageHandler.ts`、`media/js/blocklyEdit.js` | `src/test/services/workspaceCandidateService.test.ts`、`src/test/suite/workspaceValidation.contract.test.ts` |
| 積木、工具箱與程式產生 | `media/blockly/blocks/`、`media/toolbox/`、`media/blockly/generators/`、`scripts/generate-skill-contract.js` | 相關 generator／contract 測試；`npm run generate:project-skills`、`npm run check:project-skills` |
| 板型上傳與 Runtime | `src/services/arduinoUploader.ts`、`micropythonUploader.ts`、`coreEnvironmentManager.ts`、`managedRuntime*.ts` | 相關 `src/test/services/`；改 Runtime manifest 時另執行 `npm run check:managed-runtime` |
| 產品 Agent Skill | `resources/project-skills/singular-blockly/`、`src/services/projectSkillService.ts`、`blockContractService.ts` | `npm run generate:project-skills`、`npm run check:project-skills`；`src/test/suite/projectSkillLayout.contract.test.ts` |
| CyberBrick 範例與翻譯 | `media/samples/`、`src/services/sampleBrowserService.ts`、`media/locales/`、`package.nls*.json` | `add-cyberbrick-sample`、`i18n-maintenance`；`npm run validate:i18n`、`npm run test:i18n` |
| 回饋入口與私人資料 | `src/services/feedback*.ts`、`src/webview/feedbackPanel.ts`、`workers/feedback/` | 相關 `src/test/` 與 `npm run feedback:contracts`、`npm run feedback:typecheck`、`npm run feedback:test` |

`npm test` 會透過 `@vscode/test` 執行擴充套件測試；先確認它是本次變更所需的驗證，再執行。使用者可見行為若需要真實 WebView 或硬體證據，單元／契約測試不能代替該證據，應說明實際已驗證的範圍。
