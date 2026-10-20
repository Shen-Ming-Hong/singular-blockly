#!/usr/bin/env node
// 以 Playwright 驅動 @vscode/test-electron 下載的真實 VS Code，在 xvfb 中開啟 Blockly 編輯器、
// 截圖並做一次「flyout 拖曳積木到工作區」互動，結果寫入 <out>/result.json。
//
// 用法（在 repo 根目錄，先完成 `npm run compile` 與一次 `xvfb-run -a npm run test:unit:ci`）：
//   xvfb-run -a -s "-screen 0 1440x900x24" node .github/skills/cloud-local-verification/scripts/vscode-webview-smoke.mjs \
//     --out /tmp/sb-visual [--board uno|esp32|cyberbrick] [--theme light|dark] [--repo <path>]
//
// playwright-core 裝在 repo 外的暫存目錄，以 NODE_PATH 指向其 node_modules；不要加入專案依賴。
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ESM import 不讀 NODE_PATH，改用 CommonJS require 解析。
const { _electron: electron } = createRequire(import.meta.url)(
  "playwright-core",
);

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  const next = process.argv[i + 1];
  args[key.slice(2)] = next && !next.startsWith("--") ? next : "true";
}

const repo = path.resolve(args.repo || process.cwd());
const outDir = path.resolve(
  args.out || path.join(os.tmpdir(), "singular-blockly-visual"),
);
const board = args.board || "uno";
const theme = args.theme || "light";
fs.mkdirSync(outDir, { recursive: true });

function findVSCode() {
  if (process.env.VSCODE_EXECUTABLE_PATH)
    return process.env.VSCODE_EXECUTABLE_PATH;
  const root = path.join(repo, ".vscode-test");
  const dir =
    fs.existsSync(root) &&
    fs.readdirSync(root).find((name) => name.startsWith("vscode-linux-"));
  if (!dir)
    throw new Error(
      "找不到 VS Code：先執行一次 `xvfb-run -a npm run test:unit:ci`，或設定 VSCODE_EXECUTABLE_PATH",
    );
  return path.join(root, dir, "code");
}

// 隔離的使用者資料、工作區，以及 PlatformIO 擴充依賴的空殼，避免啟用被擋下。
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "sb-visual-"));
const workspace = path.join(temp, "workspace");
const extensionsDir = path.join(temp, "extensions");
const userDataDir = path.join(temp, "user-data");
const stub = path.join(extensionsDir, "platformio.platformio-ide-0.0.0");
fs.mkdirSync(path.join(workspace, "blockly"), { recursive: true });
fs.mkdirSync(stub, { recursive: true });
fs.writeFileSync(
  path.join(stub, "package.json"),
  JSON.stringify({
    name: "platformio-ide",
    publisher: "platformio",
    version: "0.0.0",
    engines: { vscode: "*" },
  }),
);
fs.mkdirSync(path.join(userDataDir, "User"), { recursive: true });
fs.writeFileSync(
  path.join(userDataDir, "User", "settings.json"),
  JSON.stringify({
    "workbench.startupEditor": "none",
    "workbench.tips.enabled": false,
    "workbench.secondarySideBar.defaultVisibility": "hidden",
    "chat.disableAIFeatures": true,
    "security.workspace.trust.enabled": false,
    "extensions.autoCheckUpdates": false,
    "update.mode": "none",
    "window.titleBarStyle": "custom",
  }),
);
fs.writeFileSync(
  path.join(workspace, "blockly", "main.json"),
  JSON.stringify({
    workspace: { blocks: { languageVersion: 0, blocks: [] } },
    board,
  }),
);
// 主題由 SettingsManager 從工作區 .vscode/settings.json 讀取。
fs.mkdirSync(path.join(workspace, ".vscode"), { recursive: true });
fs.writeFileSync(
  path.join(workspace, ".vscode", "settings.json"),
  JSON.stringify({ "singular-blockly.theme": theme }),
);

const app = await electron.launch({
  executablePath: findVSCode(),
  args: [
    workspace,
    `--extensionDevelopmentPath=${repo}`,
    `--extensions-dir=${extensionsDir}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-workspace-trust",
    "--skip-welcome",
    "--skip-release-notes",
    "--disable-gpu",
    "--no-sandbox",
    "--new-window",
  ],
  timeout: 120000,
});

const results = {
  board,
  theme,
  screenshots: [],
  checks: {},
  webviewErrors: [],
};
const shot = async (page, name) => {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file });
  results.screenshots.push(file);
};

try {
  const window = await app.firstWindow();
  window.on("console", (message) => {
    if (
      message.type() === "error" &&
      /vscode-webview|vscode-resource/.test(message.location().url || "")
    ) {
      results.webviewErrors.push(message.text());
    }
  });
  window.on("pageerror", (error) => results.webviewErrors.push(String(error)));
  await window.waitForSelector(".monaco-workbench", { timeout: 120000 });
  await window.waitForTimeout(3000);

  // 透過命令選擇區開啟 Blockly 編輯器。
  await window.keyboard.press("F1");
  await window.waitForSelector(".quick-input-widget input", { timeout: 15000 });
  await window.keyboard.type("Singular Blockly: Open Blockly Edit");
  await window.waitForTimeout(800);
  await window.keyboard.press("Enter");

  // Webview 位於巢狀 iframe（workbench > webview host > active-frame），逐一探測 .blocklySvg。
  let blocklyFrame;
  const deadline = Date.now() + 90000;
  while (!blocklyFrame && Date.now() < deadline) {
    for (const frame of window.frames()) {
      try {
        if (await frame.$(".blocklySvg")) blocklyFrame = frame;
      } catch {
        // 探測時 frame 已卸載。
      }
    }
    if (!blocklyFrame) await window.waitForTimeout(1000);
  }
  if (!blocklyFrame) throw new Error("Webview 中沒有渲染出 Blockly 工作區");
  await window.waitForTimeout(2500);
  results.checks.workspaceRendered = true;
  await shot(window, "01-editor-open");

  results.checks.blocklyVersion = await blocklyFrame.evaluate(
    () => window.Blockly?.VERSION || null,
  );
  results.checks.toolboxCategories = await blocklyFrame.$$eval(
    ".blocklyToolboxCategory, .blocklyTreeRow",
    (nodes) => nodes.length,
  );

  // 互動：開啟第一個工具箱分類，把 flyout 的第一個積木拖到工作區。
  const category = await blocklyFrame.$(
    ".blocklyToolboxCategory, .blocklyTreeRow",
  );
  if (category) {
    await category.click();
    await window.waitForTimeout(1200);
    await shot(window, "02-flyout-open");
    const flyoutBlock = await blocklyFrame.$(
      ".blocklyFlyout .blocklyDraggable",
    );
    const canvas = await blocklyFrame.$(".blocklyMainBackground");
    if (flyoutBlock && canvas) {
      const count = () =>
        blocklyFrame.evaluate(
          () => Blockly.getMainWorkspace().getAllBlocks(false).length,
        );
      const before = await count();
      const from = await flyoutBlock.boundingBox();
      const to = await canvas.boundingBox();
      await window.mouse.move(from.x + 10, from.y + 10);
      await window.mouse.down();
      await window.mouse.move(to.x + to.width * 0.55, to.y + to.height * 0.45, {
        steps: 15,
      });
      await window.mouse.up();
      await window.waitForTimeout(1500);
      results.checks.dragAddedBlocks = (await count()) - before;
      await shot(window, "03-after-drag");
    }
  }

  // 產生程式碼確認 generator 可在拖曳後正常運作（只記錄長度與開頭，避免結果過長）。
  results.checks.generatedCode = await blocklyFrame.evaluate(() => {
    const workspace = Blockly.getMainWorkspace();
    const generator = window.arduinoGenerator;
    if (!generator) return null;
    const code = generator.workspaceToCode(workspace);
    return { length: code.length, head: code.slice(0, 200) };
  });
} catch (error) {
  results.error = String(error && error.stack ? error.stack : error);
  try {
    await shot(await app.firstWindow(), "99-failure");
  } catch {
    // 視窗已關閉。
  }
} finally {
  fs.writeFileSync(
    path.join(outDir, "result.json"),
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
  await app.close().catch(() => {});
  fs.rmSync(temp, { recursive: true, force: true });
}
process.exit(results.error ? 1 : 0);
