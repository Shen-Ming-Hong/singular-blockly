#!/usr/bin/env node
// 錄製 README 操作說明 GIF：以 Playwright 驅動 .vscode-test/ 中真實的 VS Code，在 xvfb 中操作 Blockly 編輯器，
// 用 ffmpeg x11grab 錄影後轉成小檔 GIF。工作區上會畫一個假游標，因為 Playwright 的合成滑鼠事件不會移動 X 游標。
//
// 用法（repo 根目錄，先完成 `npm run compile`、`npm run compile-tests` 與一次 `xvfb-run -a npm run test:unit:ci`）：
//   for s in open build language; do
//     NODE_PATH=/tmp/sb-pw/node_modules xvfb-run -a -s "-screen 0 1280x760x24" \
//       node .github/skills/cloud-local-verification/scripts/record-readme-gifs.mjs --scene $s --out /tmp/sb-gifs
//   done
// language 場景會讀 build 場景存下的 blink.json，所以 build 要先跑。
// 輸出 <out>/<scene>.mp4 與 <scene>.gif；確認畫面後，依 README 的檔名複製到 docs/images/readme/。
import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const { _electron: electron } = createRequire(import.meta.url)("playwright-core");

const W = 1280;
const H = 760;

async function launch({ repo, board = "none", theme = "light", language, files = {}, settings = {}, workspaceState }) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "sb-rec-"));
  const workspace = path.join(temp, "my-robot");
  const extensionsDir = path.join(temp, "extensions");
  const userDataDir = path.join(temp, "user-data");
  const stub = path.join(extensionsDir, "platformio.platformio-ide-0.0.0");
  fs.mkdirSync(path.join(workspace, "blockly"), { recursive: true });
  fs.mkdirSync(stub, { recursive: true });
  fs.writeFileSync(path.join(stub, "package.json"), JSON.stringify({ name: "platformio-ide", publisher: "platformio", version: "0.0.0", engines: { vscode: "*" } }));
  fs.mkdirSync(path.join(userDataDir, "User"), { recursive: true });
  fs.writeFileSync(path.join(userDataDir, "User", "settings.json"), JSON.stringify({
    "workbench.startupEditor": "none",
    "workbench.tips.enabled": false,
    "workbench.secondarySideBar.defaultVisibility": "hidden",
    "chat.disableAIFeatures": true,
    "security.workspace.trust.enabled": false,
    "extensions.autoCheckUpdates": false,
    "update.mode": "none",
    "window.titleBarStyle": "custom",
    "window.commandCenter": false,
    "workbench.layoutControl.enabled": false,
    "editor.minimap.enabled": false,
    "workbench.activityBar.location": "default",
    "window.zoomLevel": 0,
    ...settings,
  }));
  fs.writeFileSync(path.join(workspace, "blockly", "main.json"), JSON.stringify({ workspace: workspaceState || { blocks: { languageVersion: 0, blocks: [] } }, board }));
  fs.mkdirSync(path.join(workspace, ".vscode"), { recursive: true });
  fs.writeFileSync(path.join(workspace, ".vscode", "settings.json"), JSON.stringify({ "singular-blockly.theme": theme, ...(language ? { "singular-blockly.language": language } : {}) }));
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(workspace, rel)), { recursive: true });
    fs.writeFileSync(path.join(workspace, rel), content);
  }
  const root = path.join(repo, ".vscode-test");
  const dir = fs.readdirSync(root).find((n) => n.startsWith("vscode-linux-"));
  const app = await electron.launch({
    executablePath: path.join(root, dir, "code"),
    args: [workspace, `--extensionDevelopmentPath=${repo}`, `--extensions-dir=${extensionsDir}`, `--user-data-dir=${userDataDir}`,
      "--disable-workspace-trust", "--skip-welcome", "--skip-release-notes", "--disable-gpu", "--no-sandbox", "--new-window"],
    timeout: 120000,
  });
  const win = await app.firstWindow();
  await win.waitForSelector(".monaco-workbench", { timeout: 120000 });
  await app.evaluate(({ BrowserWindow }, { W, H }) => {
    const w = BrowserWindow.getAllWindows()[0];
    w.setBounds({ x: 0, y: 0, width: W, height: H });
  }, { W, H });
  await win.waitForTimeout(2500);
  return { app, win, temp, workspace };
}

const CURSOR_SVG = "M2 1 L2 18 L6.5 13.8 L9.6 20.5 L12.6 19.2 L9.6 12.6 L15.5 12.6 Z";

async function installCursor(win) {
  await win.evaluate((svg) => {
    if (document.getElementById("__demo_cursor")) return;
    const c = document.createElement("div");
    c.id = "__demo_cursor";
    const NS = "http://www.w3.org/2000/svg";
    const el = document.createElementNS(NS, "svg");
    el.setAttribute("width", "22"); el.setAttribute("height", "22"); el.setAttribute("viewBox", "0 0 22 22");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", svg);
    p.setAttribute("fill", "black"); p.setAttribute("stroke", "white"); p.setAttribute("stroke-width", "1.4"); p.setAttribute("stroke-linejoin", "round");
    el.appendChild(p); c.appendChild(el);
    Object.assign(c.style, { position: "fixed", left: "640px", top: "380px", width: "22px", height: "22px", zIndex: 2147483647, pointerEvents: "none" });
    const ring = document.createElement("div");
    ring.id = "__demo_ring";
    Object.assign(ring.style, { position: "fixed", width: "30px", height: "30px", marginLeft: "-15px", marginTop: "-15px", borderRadius: "50%", border: "3px solid rgba(255,140,0,0.9)", background: "rgba(255,170,0,0.25)", zIndex: 2147483646, pointerEvents: "none", opacity: "0", transition: "opacity 120ms" });
    document.body.appendChild(ring);
    document.body.appendChild(c);
  }, CURSOR_SVG);
}

function makeMouse(win) {
  let x = 640, y = 380;
  const place = (nx, ny) => win.evaluate(([a, b]) => {
    const c = document.getElementById("__demo_cursor");
    const r = document.getElementById("__demo_ring");
    if (c) { c.style.left = a + "px"; c.style.top = b + "px"; }
    if (r) { r.style.left = a + "px"; r.style.top = b + "px"; }
  }, [nx, ny]);
  const ring = (on) => win.evaluate((v) => { const r = document.getElementById("__demo_ring"); if (r) r.style.opacity = v ? "1" : "0"; }, on);
  async function move(tx, ty, ms = 600) {
    const steps = Math.max(8, Math.round(ms / 30));
    const sx = x, sy = y;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const nx = sx + (tx - sx) * e, ny = sy + (ty - sy) * e;
      await win.mouse.move(nx, ny);
      await place(nx, ny);
      await win.waitForTimeout(12);
    }
    x = tx; y = ty;
  }
  async function click(tx, ty, ms) {
    await move(tx, ty, ms);
    await ring(true);
    await win.waitForTimeout(120);
    await win.mouse.down();
    await win.waitForTimeout(60);
    await win.mouse.up();
    await win.waitForTimeout(180);
    await ring(false);
  }
  async function drag(fx, fy, tx, ty, ms = 900) {
    await move(fx, fy, 600);
    await ring(true);
    await win.waitForTimeout(150);
    await win.mouse.down();
    // small first step so Blockly starts the drag gesture
    await win.mouse.move(fx + 6, fy + 6);
    await move(tx, ty, ms);
    await win.waitForTimeout(150);
    await win.mouse.up();
    await ring(false);
  }
  return { move, click, drag, get pos() { return { x, y }; }, place };
}

async function findBlocklyFrame(win, timeout = 90000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const frame of win.frames()) {
      try { if (await frame.$(".blocklySvg")) return frame; } catch {}
    }
    await win.waitForTimeout(500);
  }
  throw new Error("no blockly frame");
}

async function frameOffset(frame) {
  const el = await frame.frameElement();
  const box = await el.boundingBox();
  return { x: box.x, y: box.y };
}

// Center of an element inside the Blockly frame, in top-window coordinates.
async function centerOf(frame, selector) {
  const off = await frameOffset(frame);
  const box = await frame.$eval(selector, (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  return { x: off.x + box.x + box.w / 2, y: off.y + box.y + box.h / 2 };
}


const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  const next = process.argv[i + 1];
  args[key.slice(2)] = next && !next.startsWith("--") ? next : "true";
}
const repo = path.resolve(args.repo || process.cwd());
const scene = args.scene;
const outDir = path.resolve(args.out || path.join(os.tmpdir(), "singular-blockly-gifs"));
if (!["open", "build", "language"].includes(scene)) throw new Error("--scene must be open, build or language");
fs.mkdirSync(outDir, { recursive: true });

const startBoard = { open: "none", build: "uno", language: "uno" }[scene];
const blink = scene === "language" ? JSON.parse(fs.readFileSync(path.join(outDir, "blink.json"), "utf8")) : null;
const { app, win, temp } = await launch({ repo, board: startBoard, workspaceState: blink });

let ffmpeg;
function startRecording() {
  ffmpeg = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "x11grab", "-draw_mouse", "0", "-framerate", "15",
    "-video_size", `${W}x${H}`, "-i", `${process.env.DISPLAY}+0,0`, "-c:v", "libx264", "-preset", "ultrafast", "-crf", "12", "-pix_fmt", "yuv444p",
    path.join(outDir, `${scene}.mp4`)], { stdio: ["pipe", "inherit", "inherit"] });
}
async function stopRecording() {
  ffmpeg.stdin.write("q");
  await new Promise((r) => ffmpeg.on("close", r));
}

// Hide demo-irrelevant noise: root warning / runtime install toasts and the dev-host title.
async function quietWorkbench() {
  await win.evaluate(() => {
    const s = document.createElement("style");
    s.textContent = `.notifications-toasts, .notifications-center { display: none !important; }
      .window-title { visibility: hidden !important; }`;
    document.head.appendChild(s);
  });
}

// Blockly helpers executed inside the webview frame.
async function flyoutGrab(frame, type) {
  const off = await frameOffset(frame);
  const r = await frame.evaluate((t) => {
    const fly = Blockly.getMainWorkspace().getToolbox().getFlyout();
    const b = fly.getWorkspace().getTopBlocks(false).find((x) => x.type === t);
    const rect = b.getSvgRoot().getBoundingClientRect();
    return { x: rect.x, y: rect.y };
  }, type);
  return { x: off.x + r.x + 8, y: off.y + r.y + 8, dx: 8, dy: 8 };
}
async function connectionPoint(frame, expr) {
  const off = await frameOffset(frame);
  const r = await frame.evaluate((e) => {
    const ws = Blockly.getMainWorkspace();
    // eslint-disable-next-line no-new-func
    const conn = new Function("ws", `return ${e}`)(ws);
    const p = Blockly.utils.svgMath.wsToScreenCoordinates(ws, new Blockly.utils.Coordinate(conn.x, conn.y));
    return { x: p.x, y: p.y };
  }, expr);
  return { x: off.x + r.x, y: off.y + r.y };
}
async function openCategory(frame, mouse, name) {
  const off = await frameOffset(frame);
  const r = await frame.evaluate((n) => {
    const el = [...document.querySelectorAll(".blocklyToolboxCategory, .blocklyTreeRow")].find((e) => e.textContent.trim() === n);
    const b = el.getBoundingClientRect();
    return { x: b.x + Math.min(b.width / 2, 60), y: b.y + b.height / 2 };
  }, name);
  await mouse.click(off.x + r.x, off.y + r.y, 500);
  await win.waitForTimeout(700);
}
async function dragFromFlyout(frame, mouse, category, type, target) {
  await openCategory(frame, mouse, category);
  let g = await flyoutGrab(frame, type);
  const fb = await (await frame.frameElement()).boundingBox();
  for (let i = 0; i < 6 && g.y > fb.y + fb.height - 60; i++) {
    await mouse.move(g.x + 40, fb.y + fb.height / 2, 400);
    await win.mouse.wheel(0, 120);
    await win.waitForTimeout(350);
    g = await flyoutGrab(frame, type);
  }
  const to = typeof target === "string" ? await connectionPoint(frame, target) : target;
  await mouse.drag(g.x, g.y, to.x + g.dx, to.y + g.dy, 900);
  await win.waitForTimeout(600);
}

async function pickDropdown(frame, mouse, type, fieldName, re) {
  const off = await frameOffset(frame);
  const r = await frame.evaluate(([t, f]) => {
    const b = Blockly.getMainWorkspace().getAllBlocks(false).find((x) => x.type === t);
    const field = b.getField(f) || b.inputList.flatMap((i) => i.fieldRow).find((x) => x instanceof Blockly.FieldDropdown);
    const rect = field.getSvgRoot().getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }, [type, fieldName]);
  await mouse.click(off.x + r.x, off.y + r.y, 700);
  await win.waitForTimeout(700);
  const item = await frame.evaluateHandle((src) => {
    const rx = new RegExp(src);
    return [...document.querySelectorAll(".blocklyDropDownDiv .blocklyMenuItem")].find((e) => rx.test(e.textContent.trim()));
  }, re.source);
  await item.asElement().evaluate((e) => e.scrollIntoView({ block: "center" }));
  await win.waitForTimeout(400);
  const ib = await item.asElement().boundingBox();
  await mouse.click(ib.x + ib.width / 2, ib.y + ib.height / 2, 600);
  await win.waitForTimeout(900);
}

try {
  await quietWorkbench();
  await installCursor(win);
  const mouse = makeMouse(win);
  let frame;

  if (scene === "open") {
    await win.waitForTimeout(1000);
    startRecording();
    await win.waitForTimeout(1200);
    // Activity bar icon of Singular Blockly
    const icon = await win.$('.activitybar a[aria-label^="Singular Blockly"], .activitybar .action-item[aria-label^="Singular Blockly"] a, .activitybar li[aria-label^="Singular Blockly"]');
    const box = await icon.boundingBox();
    await mouse.click(box.x + box.width / 2, box.y + box.height / 2, 900);
    frame = await findBlocklyFrame(win);
    await win.waitForTimeout(2500);
    const toggle = await centerOf(frame, "#boardSelectToggle");
    await mouse.click(toggle.x, toggle.y, 800);
    await win.waitForTimeout(900);
    const uno = await centerOf(frame, '#boardDropdown .board-option[data-board="uno"]');
    await mouse.move(uno.x, uno.y + 120, 500);
    await mouse.move(uno.x, uno.y, 600);
    await win.waitForTimeout(300);
    await mouse.click(uno.x, uno.y, 200);
    await win.waitForTimeout(2200);
    await openCategory(frame, mouse, "Arduino");
    await win.waitForTimeout(1600);
    await stopRecording();
  }

  if (scene === "build") {
    await win.keyboard.press("F1");
    await win.waitForSelector(".quick-input-widget input");
    await win.keyboard.type("Singular Blockly: Open Blockly Edit");
    await win.waitForTimeout(600);
    await win.keyboard.press("Enter");
    frame = await findBlocklyFrame(win);
    await win.waitForTimeout(3000);
    // Close sidebar for a roomy canvas.
    await win.keyboard.press("Control+B");
    await win.waitForTimeout(1500);
    // Show the generated code below the editor.
    await win.keyboard.press("Control+P");
    await win.waitForSelector(".quick-input-widget input");
    await win.keyboard.type("main.cpp", { delay: 60 });
    await win.waitForTimeout(900);
    await win.keyboard.press("Enter");
    await win.waitForTimeout(800);
    await win.keyboard.press("F1");
    await win.waitForSelector(".quick-input-widget input");
    await win.keyboard.type(">View: Move Editor into Group Below".slice(1), { delay: 15 });
    await win.waitForTimeout(700);
    await win.keyboard.press("Enter");
    await win.waitForTimeout(1500);
    // Focus the Blockly group again.
    await win.keyboard.press("Control+1");
    await win.waitForTimeout(1500);
    frame = await findBlocklyFrame(win);
    startRecording();
    await win.waitForTimeout(800);
    const off = await frameOffset(frame);
    await dragFromFlyout(frame, mouse, "Arduino", "arduino_setup_loop", { x: off.x + 260, y: off.y + 40 });
    await dragFromFlyout(frame, mouse, "Arduino", "arduino_digital_write",
      "ws.getTopBlocks(false).find(b=>b.type==='arduino_setup_loop').getInput('LOOP').connection");
    await dragFromFlyout(frame, mouse, "Arduino", "arduino_delay",
      "ws.getAllBlocks(false).find(b=>b.type==='arduino_digital_write').nextConnection");
    await win.waitForTimeout(500);
    await pickDropdown(frame, mouse, "arduino_digital_write", "PIN", /^D?13\b/);
    await pickDropdown(frame, mouse, "arduino_level", "LEVEL", /^HIGH$/);
    await win.waitForTimeout(900);
    await win.waitForTimeout(2500);
    await stopRecording();
  }

  if (scene === "language") {
    await win.keyboard.press("F1");
    await win.waitForSelector(".quick-input-widget input");
    await win.keyboard.type("Singular Blockly: Open Blockly Edit");
    await win.waitForTimeout(600);
    await win.keyboard.press("Enter");
    frame = await findBlocklyFrame(win);
    await win.waitForTimeout(3000);
    await win.keyboard.press("Control+B");
    await win.waitForTimeout(1500);
    startRecording();
    await win.waitForTimeout(800);
    await win.waitForTimeout(800);
    const more = await centerOf(frame, "#toolbarActionsToggle");
    await mouse.click(more.x, more.y, 800);
    await win.waitForTimeout(900);
    const globe = await centerOf(frame, "#languageToggle");
    await mouse.click(globe.x, globe.y, 700);
    await win.waitForTimeout(900);
    const zh = await centerOf(frame, '#languageDropdown .language-option[data-language="zh-hant"]');
    await mouse.move(zh.x, zh.y, 700);
    await win.waitForTimeout(300);
    await mouse.click(zh.x, zh.y, 200);
    await win.waitForTimeout(2500);
    frame = await findBlocklyFrame(win);
    await win.waitForTimeout(1200);
    const theme = await centerOf(frame, "#themeToggle");
    await mouse.click(theme.x, theme.y, 800);
    await win.waitForTimeout(2500);
    await stopRecording();
  }

  if (scene === "build") fs.writeFileSync(path.join(outDir, "blink.json"), JSON.stringify(await frame.evaluate(() => Blockly.serialization.workspaces.save(Blockly.getMainWorkspace()))));
  console.log("blocks:", frame && (await frame.evaluate(() => Blockly.getMainWorkspace().getAllBlocks(false).map((b) => b.type))));
  await win.screenshot({ path: path.join(outDir, `${scene}-final.png`) });
} catch (e) {
  console.error(e);
  await win.screenshot({ path: path.join(outDir, `${scene}-fail.png`) }).catch(() => {});
  if (ffmpeg) await stopRecording().catch(() => {});
  process.exitCode = 1;
} finally {
  await app.close().catch(() => {});
  fs.rmSync(temp, { recursive: true, force: true });
}

// 15 fps 錄影 → 960px、10 fps、128 色 GIF，控制檔案大小。
if (!process.exitCode) {
  const mp4 = path.join(outDir, `${scene}.mp4`);
  const palette = path.join(outDir, `${scene}-palette.png`);
  const filter = "fps=10,scale=960:-1:flags=lanczos";
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp4, "-vf", `${filter},palettegen=max_colors=128:stats_mode=diff`, palette]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp4, "-i", palette, "-lavfi",
    `${filter}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`, path.join(outDir, `${scene}.gif`)]);
  fs.rmSync(palette);
  console.log(`GIF: ${path.join(outDir, `${scene}.gif`)} (${fs.statSync(path.join(outDir, `${scene}.gif`)).size} bytes)`);
}
