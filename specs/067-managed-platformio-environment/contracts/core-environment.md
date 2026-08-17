# 契約：Core Environment 與工作負載路由

```ts
interface CoreInvocation {
  command: string;
  prefixArgs: readonly string[];
  env: Readonly<NodeJS.ProcessEnv>;
  source: 'provider' | 'managed';
}
```

呼叫者只能用 argument array 與 `shell: false`。Arduino profile 為 provider → managed，Python profile 為 managed → provider。

## 選擇程序

1. 有 sticky Core 時先做輕量健康檢查。
2. 依 profile 探測 primary、fallback；探測不載入專案。
3. project-aware preparation 前確認 Workspace Trust。
4. preparation 因允許的本機 failure class 失敗時，可切換一次。
5. project process spawn 成功後永遠禁止 fallback。
6. 成功 fallback 後寫入視窗記憶體；retest、repair 或新 Extension Host 清除。

結果包含 selected、各次 attempt、fallbackUsed 與分類後 failure；attempt 不得包含完整使用者路徑、環境內容或 stdout／stderr 原文。
