#!/usr/bin/env node
// 以 Playwright 驅動 @vscode/test-electron 下載的真實 VS Code，在 xvfb 中開啟 Blockly 編輯器、
// 截圖並做一次「flyout 拖曳積木到工作區」互動，結果寫入 <out>/result.json。
//
// 用法（在 repo 根目錄，先完成 `npm run compile` 與一次 `xvfb-run -a npm run test:unit:ci`）：
//   xvfb-run -a -s "-screen 0 1440x900x24" node .github/skills/cloud-local-verification/scripts/vscode-webview-smoke.mjs \
//     --out /tmp/sb-visual [--board uno|esp32|cyberbrick] [--theme light|dark] [--repo <path>] [--size 900x700]
//     [--main-json <file>] [--click "<selector>,<selector>"] [--skip-default] [--keep-tour]
//     [--command "Singular Blockly: Provide Feedback" --ready "#feedbackForm"]
//
// --main-json 直接放入準備好的 blockly/main.json（不靠拖曳備資料）；--click 依序點擊指定元素，
// 每一步截圖並自動檢查；--skip-default 略過工具箱、拖曳與右鍵選單；--command／--ready 開其他面板。
// 每個狀態都會自動檢查 webview 錯誤、原生對話框、水平捲動、小於 12px 的字與小於 24px 的點擊目標，
// 結果在 result.json 的 checks.uiAudit。
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
const openCommand = args.command || "Singular Blockly: Open Blockly Edit";
const readySelector = args.ready || ".blocklySvg";
const isBlocklyEditor = readySelector === ".blocklySvg";
const clickSelectors = (args.click || "")
  .split(",")
  .map((selector) => selector.trim())
  .filter(Boolean);
const theme = args.theme || "light";
// 視窗大小（寬x高）；用來檢查 VS Code 視窗變窄（側邊欄開著、分割編輯器）時的版面。
const sizeMatch = /^(\d{3,4})x(\d{3,4})$/.exec(args.size || "");
if (args.size && !sizeMatch) throw new Error(`--size 格式應為 寬x高，例如 900x700：${args.size}`);
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
  args["main-json"]
    ? fs.readFileSync(path.resolve(args["main-json"]), "utf8")
    : JSON.stringify({
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
    // macOS 預設的浮動捲軸會忽略 scrollbar-color；加上 --overlay-scrollbars 在 Linux 重現。
    ...(args["overlay-scrollbars"] ? ["--enable-features=OverlayScrollbar"] : []),
  ],
  timeout: 120000,
});

const results = {
  board,
  theme,
  screenshots: [],
  checks: { uiAudit: {} },
  webviewErrors: [],
  nativeDialogs: [],
};

// 在 webview frame 內檢查目前畫面：水平捲動、字級小於 12px、點擊目標小於 24x24 CSS px
// （WCAG 2.2 SC 2.5.8 的最低尺寸；行內連結與有足夠間距的目標屬例外，候選項要人工判斷）、
// 以及 frame 內被呼叫的 alert／confirm／prompt。只列前 10 筆，避免結果過長。
const auditFrame = (frame) =>
  frame.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        style.opacity !== "0" &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < innerHeight &&
        rect.left < innerWidth
      );
    };
    const describe = (element) =>
      element.getAttribute("data-testid")
        ? `[data-testid="${element.getAttribute("data-testid")}"]`
        : element.id
          ? `#${element.id}`
          : `${element.tagName.toLowerCase()}${element.classList.length ? "." + [...element.classList].slice(0, 2).join(".") : ""}`;
    const root = document.scrollingElement || document.documentElement;
    const smallText = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const element = node.parentElement;
      if (!element || !node.textContent.trim() || !visible(element)) continue;
      // Blockly 的 SVG 積木文字隨工作區縮放，不在此檢查範圍。
      if (element.closest("svg")) continue;
      const size = parseFloat(getComputedStyle(element).fontSize);
      if (size < 12 && !smallText.some((item) => item.element === describe(element))) {
        smallText.push({ element: describe(element), fontSize: size, text: node.textContent.trim().slice(0, 40) });
      }
    }
    const smallTargets = [];
    for (const element of document.querySelectorAll(
      'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="menuitem"], [role="tab"], [role="option"]',
    )) {
      // 隱藏的原生元件（例如被自訂下拉取代的 #boardSelect）不是點擊目標。
      if (!visible(element) || element.closest("svg") || getComputedStyle(element).pointerEvents === "none") continue;
      const rect = element.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 24) {
        smallTargets.push({ element: describe(element), width: Math.round(rect.width), height: Math.round(rect.height) });
      }
    }
    return {
      horizontalScroll: root.scrollWidth > root.clientWidth + 1,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      smallText: smallText.slice(0, 10),
      smallTextCount: smallText.length,
      smallTargets: smallTargets.slice(0, 10),
      smallTargetCount: smallTargets.length,
      nativeDialogs: window.__sbNativeDialogs || [],
    };
  });
let auditTarget = null;
const shot = async (page, name) => {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file });
  results.screenshots.push(file);
  if (auditTarget) {
    results.checks.uiAudit[name] = await auditFrame(auditTarget).catch(
      (error) => ({ error: String(error) }),
    );
    // VS Code 自己的模態對話框（例如 showWarningMessage 的 modal）。
    if (await page.$(".monaco-dialog-box")) results.nativeDialogs.push(`${name}: VS Code modal dialog`);
  }
};

try {
  const window = await app.firstWindow();
  if (sizeMatch) {
    const [width, height] = [Number(sizeMatch[1]), Number(sizeMatch[2])];
    await app.evaluate(
      ({ BrowserWindow }, size) => {
        const win = BrowserWindow.getAllWindows()[0];
        win.unmaximize();
        win.setSize(size.width, size.height);
      },
      { width, height },
    );
    results.checks.windowSize = await window.evaluate(() => [
      window.innerWidth,
      window.innerHeight,
    ]);
  }
  window.on("console", (message) => {
    if (
      message.type() === "error" &&
      /vscode-webview|vscode-resource/.test(message.location().url || "")
    ) {
      results.webviewErrors.push(message.text());
    }
  });
  window.on("pageerror", (error) => results.webviewErrors.push(String(error)));
  window.on("dialog", async (dialog) => {
    results.nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss().catch(() => {});
  });
  await window.waitForSelector(".monaco-workbench", { timeout: 120000 });
  await window.waitForTimeout(3000);

  // 透過命令選擇區開啟 Blockly 編輯器。
  await window.keyboard.press("F1");
  await window.waitForSelector(".quick-input-widget input", { timeout: 15000 });
  await window.keyboard.type(openCommand);
  await window.waitForTimeout(800);
  await window.keyboard.press("Enter");

  // Webview 位於巢狀 iframe（workbench > webview host > active-frame），逐一探測 ready 選擇器。
  let blocklyFrame;
  const deadline = Date.now() + 90000;
  while (!blocklyFrame && Date.now() < deadline) {
    for (const frame of window.frames()) {
      try {
        if (await frame.$(readySelector)) blocklyFrame = frame;
      } catch {
        // 探測時 frame 已卸載。
      }
    }
    if (!blocklyFrame) await window.waitForTimeout(1000);
  }
  if (!blocklyFrame) throw new Error(`Webview 中沒有出現 ${readySelector}`);
  // 記錄之後在 frame 內被呼叫的原生對話框，並讓呼叫不阻塞。
  await blocklyFrame.evaluate(() => {
    window.__sbNativeDialogs = [];
    for (const name of ["alert", "confirm", "prompt"]) {
      window[name] = (message) => {
        window.__sbNativeDialogs.push(`${name}: ${String(message).slice(0, 80)}`);
        return name === "confirm" ? false : null;
      };
    }
  });
  auditTarget = blocklyFrame;
  await window.waitForTimeout(2500);
  // 全新使用者資料會自動開導覽，蓋住工作區；除非要驗導覽（--keep-tour），先按「略過」。
  if (!args["keep-tour"]) {
    const skipTour = await blocklyFrame.$("#guidedTour .guided-tour-skip");
    if (skipTour && (await skipTour.isVisible())) {
      await skipTour.click();
      await window.waitForTimeout(500);
      results.checks.guidedTourSkipped = true;
    }
  }
  results.checks.workspaceRendered = true;
  await shot(window, "01-editor-open");

  // --fill-json <檔案>：點擊前先填表單，內容為 [{ "selector": "#id", "value": "文字" }]。
  if (args["fill-json"]) {
    for (const { selector, value } of JSON.parse(fs.readFileSync(args["fill-json"], "utf8"))) {
      await blocklyFrame.fill(selector, value);
    }
  }

  // 只點這次改到的元件：每一步截圖並自動檢查。選擇器優先用 data-testid，其次是固定的 id。
  for (const [index, selector] of clickSelectors.entries()) {
    const element = await blocklyFrame.waitForSelector(selector, { state: "visible", timeout: 15000 });
    await element.click();
    await window.waitForTimeout(800);
    await shot(window, `${String(5 + index).padStart(2, "0")}-click-${index + 1}`);
  }

  results.checks.blocklyVersion = await blocklyFrame.evaluate(
    () => window.Blockly?.VERSION || null,
  );
  results.checks.toolboxCategories = await blocklyFrame.$$eval(
    ".blocklyToolboxCategory, .blocklyTreeRow",
    (nodes) => nodes.length,
  );

  const runDefault = isBlocklyEditor && !args["skip-default"];
  // 互動：開啟第一個工具箱分類，把 flyout 的第一個積木拖到工作區。
  const category = runDefault && await blocklyFrame.$(
    ".blocklyToolboxCategory, .blocklyTreeRow",
  );
  if (category) {
    await category.click();
    await window.waitForTimeout(1200);
    await shot(window, "02-flyout-open");
    // 窄視窗時工具列會蓋住 flyout 上方的積木；挑第一個起點沒被遮住的積木。
    const flyoutBlocks = await blocklyFrame.$$(
      ".blocklyFlyout .blocklyDraggable",
    );
    const visibleIndex = await blocklyFrame.evaluate(() =>
      Array.from(
        document.querySelectorAll(".blocklyFlyout .blocklyDraggable"),
      ).findIndex((block) => {
        const rect = block.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + 10, rect.top + 10);
        return Boolean(hit && block.contains(hit));
      }),
    );
    const flyoutBlock = flyoutBlocks[Math.max(visibleIndex, 0)];
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

  // 右鍵選單：在積木上按右鍵，限制選單高度強制出現捲軸，記錄捲軸配色並截圖。
  const contextTarget = await blocklyFrame.evaluateHandle((enabled) => {
    if (!enabled) return null;
    const block = Blockly.getMainWorkspace().getTopBlocks(false)[0];
    return block ? block.getSvgRoot().querySelector(".blocklyPath") : null;
  }, runDefault);
  const contextElement = contextTarget.asElement();
  if (contextElement) {
    const box = await contextElement.boundingBox();
    await window.mouse.click(box.x + 8, box.y + 8, { button: "right" });
    await window.waitForTimeout(800);
    results.checks.contextMenu = await blocklyFrame.evaluate(() => {
      const menu = document.querySelector(".blocklyWidgetDiv .blocklyContextMenu");
      if (!menu) return null;
      // 項目都放得下時不應出現捲軸（Blockly 以 content-box 量測選單高度）。
      const fitsWithoutScrollbar = menu.scrollHeight <= menu.clientHeight;
      menu.style.maxHeight = "48px";
      menu.scrollTop = 1;
      const style = getComputedStyle(menu);
      return {
        fitsWithoutScrollbar,
        overflows: menu.scrollHeight > menu.clientHeight,
        scrollbarWidth: style.scrollbarWidth,
        scrollbarColor: style.scrollbarColor,
        colorScheme: style.colorScheme,
        background: style.backgroundColor,
        htmlScrollbarColor: getComputedStyle(document.documentElement).scrollbarColor,
      };
    });
    await window.waitForTimeout(400);
    const menuBox = await blocklyFrame
      .$(".blocklyWidgetDiv .blocklyContextMenu")
      .then((menu) => menu && menu.boundingBox());
    if (menuBox) {
      const file = path.join(outDir, "04-context-menu.png");
      await window.screenshot({
        path: file,
        clip: {
          x: Math.max(menuBox.x - 40, 0),
          y: Math.max(menuBox.y - 40, 0),
          width: menuBox.width + 80,
          height: menuBox.height + 80,
        },
      });
      results.screenshots.push(file);
      results.checks.uiAudit["04-context-menu"] = await auditFrame(blocklyFrame);
    }
    await window.keyboard.press("Escape");
  }

  // 產生程式碼確認 generator 可在拖曳後正常運作（只記錄長度與開頭，避免結果過長）。
  results.checks.generatedCode = await blocklyFrame.evaluate(() => {
    if (!window.Blockly) return null;
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
  // 彙總：任何一項不為 0／false 都要看截圖判斷，並和 base 分支比較是否為本次新增。
  const audits = Object.values(results.checks.uiAudit).filter((audit) => !audit.error);
  results.auditSummary = {
    states: Object.keys(results.checks.uiAudit).length,
    webviewErrors: results.webviewErrors.length,
    nativeDialogs:
      results.nativeDialogs.length +
      Math.max(0, ...audits.map((audit) => audit.nativeDialogs.length)),
    horizontalScrollStates: audits.filter((audit) => audit.horizontalScroll).length,
    maxSmallText: Math.max(0, ...audits.map((audit) => audit.smallTextCount)),
    maxSmallTargets: Math.max(0, ...audits.map((audit) => audit.smallTargetCount)),
  };
  fs.writeFileSync(
    path.join(outDir, "result.json"),
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
  await app.close().catch(() => {});
  fs.rmSync(temp, { recursive: true, force: true });
}
process.exit(results.error ? 1 : 0);
