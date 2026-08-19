# Singular Blockly

[![CI](https://github.com/Shen-Ming-Hong/singular-blockly/actions/workflows/ci.yml/badge.svg)](https://github.com/Shen-Ming-Hong/singular-blockly/actions/workflows/ci.yml)
[![Built on Blockly](https://img.shields.io/badge/Built%20on-Blockly-4285F4?style=flat&cacheSeconds=3600&logoWidth=20&labelColor=5F6368&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJMYXllcl82IiBkYXRhLW5hbWU9IkxheWVyIDYiIHZpZXdCb3g9IjAgMCAxOTIgMTkyIj4KICA8ZGVmcyBpZD0iZGVmczkwMiIvPgogIDxnIGlkPSJnMTAxMyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjMuNSAtOCkiPgogICAgPHBhdGggaWQ9InBhdGg5MDYiIGZpbGw9IiM0Mjg1ZjQiIGQ9Ik0yMC4xIDMyQzEzLjQgMzIgOCAzNy40IDggNDQuMVYxNDljMCA2LjcgNS40IDEyLjEgMTIuMSAxMi4xSDI1YTIwIDIwIDAgMCAwIDM4LjUgMEg4NGE4IDggMCAwIDAgOC04VjQwbC04LTh6Ii8+CiAgICA8cGF0aCBpZD0icGF0aDkwOCIgZmlsbD0iI2M4ZDFkYiIgZD0iTTgwIDMyVjg1bC0xNi42LTkuNGEzLjYgMy42IDAgMCAwLTUuNCAzLjF2NDAuN2MwIDIuNyAzIDQuNCA1LjQgM2wxNi42LTkuM1YxNjFoNDUuNGM2LjQgMCAxMS42IDAgMCAwIDExLjYtMTEuNXYtMTA2YzAtNi40LTUuMi0xMS41LTExLjUtMTEuNXoiLz4KICA8L2c+Cjwvc3ZnPgo=)](https://github.com/google/blockly)
[![PlatformIO](https://img.shields.io/badge/PlatformIO-Scripts-orange.svg)](https://platformio.org/)
[![CyberBrick](https://img.shields.io/badge/Supports-CyberBrick%20MicroPython-00979D?style=flat)](https://github.com/CyberBrick-Official/CyberBrick_Controller_Core)
[![VS Code Marketplace](https://vsmarketplacebadges.dev/version-short/Singular-Ray.singular-blockly.svg?color=teal&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly&ssr=false#overview)
[![Open VSX](https://img.shields.io/open-vsx/v/Singular-Ray/singular-blockly?style=flat&label=Open%20VSX)](https://open-vsx.org/extension/Singular-Ray/singular-blockly)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/Singular-Ray.singular-blockly.svg?color=7A52B3&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly)
[![Rating](https://vsmarketplacebadges.dev/rating-star/Singular-Ray.singular-blockly.svg?color=E05D44&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

<p align="center">
  <img src="images/icon.png" width="112" alt="Singular Blockly icon">
</p>

**Visual programming for Arduino, CyberBrick, and fischertechnik TXT Controller—inside VS Code.**

Build with Blockly, preview generated code instantly, and upload through PlatformIO, USB, local-network OTA, or SSH.

[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Install from Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [Read the documentation](docs/specifications/README.md)

## Why Singular Blockly?

- **One visual editor, three programming workflows**: Arduino C++, CyberBrick MicroPython, and TXT Controller Python.
- **Hardware-ready uploads**: PlatformIO for Arduino, USB or paired LAN OTA for CyberBrick, and SSH for TXT Controller.
- **Classroom-friendly tools**: localized samples, virtual TXT controls, I/O testing, backups, and clear hardware diagnostics.
- **Modern Blockly experience**: Blockly 13.2.1 with `@blockly/theme-modern`, light and dark themes, block search, touch support, keyboard navigation, and screen-reader labels—all packaged for offline use.
- **Safe project files**: automatic persistence, backup recovery, orphan-block guards, and runtime validation of external workspace edits.
- **AI-aware projects**: project-local Agent Skills plus optional GitHub Copilot shadow-block suggestions.

## Quick Start

1. Install Singular Blockly from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) or [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly).
2. Open a writable folder in VS Code.
3. Click the wand icon in the status bar or the Singular Blockly activity-bar icon.
4. Select a board and build your program from the toolbox.
5. Preview the generated code, then use the shared upload button.

After VS Code startup, Singular Blockly begins preparing its own verified Python, tested-range PlatformIO Core, and `mpremote` runtime in extension-owned storage. Opening the Blockly editor checks that runtime again without blocking editing. Arduino keeps the existing provider-first route: VS Code uses `platformio.platformio-ide`, while Open VSX environments such as VSCodium can use `pioarduino.pioarduino-ide`; the Singular Core is the fallback. A custom managed-runtime folder must be empty when first claimed, preventing repair or cleanup from adopting unrelated files.

<details>
<summary><b>Offline VSIX installation</b></summary>

1. Download the latest `.vsix` from [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases).
2. Open **Extensions: Install from VSIX...** from the Command Palette.
3. Select the downloaded file.

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>CyberBrick USB troubleshooting</b></summary>

`mpremote` is installed automatically in the Singular managed runtime, which does not require a system Python. Open **PlatformIO Diagnostic** to check or repair it. The PlatformIO provider environment remains a compatibility fallback and is never removed or cleaned by Singular Blockly.

</details>

## Supported Boards

| Board                          | Generated code      | Selector ID  | Upload / runtime workflow                            |
| ------------------------------ | ------------------- | ------------ | ---------------------------------------------------- |
| Arduino Uno                    | `src/main.cpp`      | `uno`        | PlatformIO                                           |
| Arduino Nano                   | `src/main.cpp`      | `nano`       | PlatformIO                                           |
| Arduino Mega                   | `src/main.cpp`      | `mega`       | PlatformIO                                           |
| ESP32 Dev Module               | `src/main.cpp`      | `esp32`      | PlatformIO                                           |
| ESP32-C3 Super Mini            | `src/main.cpp`      | `supermini`  | PlatformIO                                           |
| CyberBrick                     | `src/rc_main.py`    | `cyberbrick` | USB `mpremote` or paired LAN OTA → `/app/rc_main.py` |
| fischertechnik TXT Controller  | `src/main.py`       | `txt`        | SSH + `python3` → `/tmp/singular_blockly/main.py`    |

Arduino projects keep `platformio.ini`; CyberBrick and TXT projects use Python workflows and remove it when it is not needed.

## Key Workflows

### Arduino and ESP32

- Generate Arduino C++ and synchronize `platformio.ini` automatically.
- Compile and upload through PlatformIO with board-aware port detection and actionable error messages.
- Monitor serial output in a VS Code terminal; ESP32 projects enable exception decoding automatically.
- Build with I/O, PWM, servo, encoder motor, Wi-Fi/MQTT, Pixetto, HUSKYLENS, and standard programming blocks.

### CyberBrick

- Generate MicroPython for the ESP32-C3, including GPIO, onboard LED, timing, Wi-Fi, X11/X12, and ESP-NOW RC blocks.
- Use USB by default; configure a paired local-network OTA target from the CyberBrick gear menu.
- Complete first-time OTA setup over USB. Failed OTA uploads never fall back to USB automatically, preventing code from reaching the wrong classroom device.
- Keep compatible OTA agents current during network uploads; an agent-update warning does not discard the main program upload.
- Monitor MicroPython `print()` output through `mpremote` from a VS Code terminal.
- Browse localized CyberBrick samples with a packaged offline fallback.
- Keep Wi-Fi passwords, OTA tokens, and pairing secrets in VS Code SecretStorage. OTA setup does not modify firmware, `/boot.py`, WebREPL, or unrelated device files.

[CyberBrick details](docs/specifications/03-hardware-support/cyberbrick-micropython.md) · [Expansion boards](docs/specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [RC pairing](docs/specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- Author one setup flow and multiple concurrent TXT process flows.
- Upload, run, and stop Python programs over SSH.
- Configure the connection and test it without leaving the Blockly editor.
- Create draggable virtual buttons with stable bindings.
- Test motors, outputs, and sensors from the integrated I/O Test Panel.

TXT passwords are stored in VS Code SecretStorage. The default target is `192.168.7.2` with username `ftc`; the generated program is uploaded to `/tmp/singular_blockly/main.py`.

[TXT Controller details](docs/specifications/03-hardware-support/txt-controller.md)

### AI-Assisted Workflows

Singular Blockly provides two separate AI experiences:

- **Project-local Agent Skills** give Codex and Claude Code the current board, workspace format, and runtime-derived block contract. No user-installed Node.js server is required.
- **Optional GitHub Copilot suggestions** can display temporary shadow blocks in the editor. They are disabled by default and remain unsaved until accepted. Use the AI status-bar item to inspect or configure the feature, or request a suggestion with `Ctrl+Shift+Space` (`Cmd+Shift+Space` on macOS).

External changes to `blockly/main.json` pass through disposable Blockly runtimes before reaching the live workspace. Invalid candidates are quarantined and the last valid workspace is restored.

[Agent Skills and workspace safety](docs/specifications/06-features/agent-skills.md)

## Project Files

| Path                    | Purpose                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `blockly/main.json`     | Source of truth for blocks, board selection, and UI state  |
| `blockly/main.json.bak` | Last valid workspace backup                                |
| `src/main.cpp`          | Generated Arduino / ESP32 program                          |
| `src/rc_main.py`        | Generated CyberBrick MicroPython program                   |
| `src/main.py`           | Generated TXT Controller program                           |
| `platformio.ini`        | Arduino-only PlatformIO environment configuration          |

## Configuration

Settings are available through VS Code's Settings UI. Defaults below match the extension manifest.

| Setting                                             | Default                                      | Purpose                                      |
| --------------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| `singularBlockly.safetyGuard.suppressWarning`       | `false`                                      | Hide the non-Blockly-project safety warning  |
| `singularBlockly.ai.enabled`                        | `false`                                      | Enable Copilot shadow-block suggestions      |
| `singularBlockly.ai.model`                          | `gpt-4o-mini`                                | Select the suggestion model                  |
| `singularBlockly.ai.triggerDelay`                   | `1500` ms                                    | Delay before automatic suggestions           |
| `singularBlockly.ai.maxSuggestionsPerMinute`        | `5`                                          | Rate-limit suggestions                       |
| `singularBlockly.ai.reasoningEffort`                | `low`                                        | Use `low`, `medium`, or `high` reasoning      |
| `singular-blockly.txt.host`                         | `192.168.7.2`                                | TXT Controller host                          |
| `singular-blockly.txt.username`                     | `ftc`                                        | TXT SSH username                             |
| `singular-blockly.txt.remotePath`                   | `/tmp/singular_blockly/main.py`              | TXT upload destination                       |
| `singular-blockly.txt.runtimePort`                  | `8080`                                       | TXT I/O Test Panel base port                  |
| `singular-blockly.cyberbrick.uploadSettings`        | `{ "schemaVersion": 2, "pairedDevices": [] }` | CyberBrick USB / paired OTA device registry  |

Wi-Fi passwords, OTA tokens, pairing secrets, and TXT passwords are stored in VS Code SecretStorage, not in `settings.json`. Documentation and logs use placeholders or redacted values; never paste real credentials into project files or bug reports.

## Requirements

- VS Code 1.109.0 or later, or a compatible Open VSX editor such as VSCodium.
- A workspace folder with write access.
- Arduino / ESP32: PlatformIO provider and the C/C++ extension (`ms-vscode.cpptools`).
- CyberBrick: USB for normal upload and first-time OTA setup; a shared local network only for OTA. The extension prepares `mpremote` in its own managed Python runtime after activation and rechecks it when the Blockly editor opens.
- TXT Controller: network access to the controller, with Python 3 and `ftrobopy` available on the device.

Node.js is not required for extension users.

## Documentation and Help

The interface ships in 15 languages with **99.36% average coverage**. Auto mode follows the VS Code display language, while the editor's globe menu can switch languages immediately.

<details>
<summary><b>Current language coverage</b></summary>

| Language            | Code      | Coverage |
| ------------------- | --------- | -------- |
| English             | `en`      | 99.45%   |
| Japanese            | `ja`      | 99.72%   |
| Korean              | `ko`      | 99.72%   |
| German              | `de`      | 99.26%   |
| Traditional Chinese | `zh-hant` | 99.72%   |
| Spanish             | `es`      | 99.26%   |
| French              | `fr`      | 99.26%   |
| Italian             | `it`      | 99.26%   |
| Polish              | `pl`      | 99.26%   |
| Portuguese (Brazil) | `pt-br`   | 99.26%   |
| Russian             | `ru`      | 99.26%   |
| Turkish             | `tr`      | 99.26%   |
| Czech               | `cs`      | 99.26%   |
| Hungarian           | `hu`      | 99.26%   |
| Bulgarian           | `bg`      | 99.26%   |

</details>

- [Integrated specifications](docs/specifications/README.md)
- [PlatformIO diagnostics and guided repair](docs/specifications/06-features/platformio-diagnostics.md)
- [Serial Monitor](docs/specifications/06-features/serial-monitor.md)
- [Internationalization](docs/specifications/02-internationalization/i18n.md)
- [User-facing localization workflow](docs/specifications/02-internationalization/user-facing-localization.md)
- [Changelog](CHANGELOG.md)
- [Issue tracker](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [Security policy](SECURITY.md)

Example project: [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot) — an ESP-NOW remote-controlled robot with English and Traditional Chinese documentation.

## Development

Contributor baseline: Node.js 22.16.0+, TypeScript 6.0.3, Blockly 13.2.1, `@blockly/theme-modern` 13.2.0, and VS Code 1.109.0+.

```bash
npm install
npm run compile
npm run lint
npm test
npm run validate:i18n
npm run check:project-skills
```

When block definitions, toolbox entries, the workspace schema, or packaged Skill content changes, run `npm run generate:project-skills` before the freshness check. Add new user-facing block messages to all 15 locale files.

## License

Licensed under the [Apache License 2.0](LICENSE).
