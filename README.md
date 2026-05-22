# Singular Blockly

[![Built on Blockly](https://img.shields.io/badge/Built%20on-Blockly-4285F4?style=flat&cacheSeconds=3600&logoWidth=20&labelColor=5F6368&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJMYXllcl82IiBkYXRhLW5hbWU9IkxheWVyIDYiIHZpZXdCb3g9IjAgMCAxOTIgMTkyIj4KICA8ZGVmcyBpZD0iZGVmczkwMiIvPgogIDxnIGlkPSJnMTAxMyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjMuNSAtOCkiPgogICAgPHBhdGggaWQ9InBhdGg5MDYiIGZpbGw9IiM0Mjg1ZjQiIGQ9Ik0yMC4xIDMyQzEzLjQgMzIgOCAzNy40IDggNDQuMVYxNDljMCA2LjcgNS40IDEyLjEgMTIuMSAxMi4xSDI1YTIwIDIwIDAgMCAwIDM4LjUgMEg4NGE4IDggMCAwIDAgOC04VjQwbC04LTh6Ii8+CiAgICA8cGF0aCBpZD0icGF0aDkwOCIgZmlsbD0iI2M4ZDFkYiIgZD0iTTgwIDMyVjg1bC0xNi42LTkuNGEzLjYgMy42IDAgMCAwLTUuNCAzLjF2NDAuN2MwIDIuNyAzIDQuNCA1LjQgM2wxNi42LTkuM1YxNjFoNDUuNGM2LjQgMCAxMS42LTUuMiAxMS42LTExLjV2LTEwNmMwLTYuNC01LjItMTEuNS0xMS41LTExLjV6Ii8+CiAgPC9nPgo8L3N2Zz4K)](https://github.com/google/blockly)
[![PlatformIO](https://img.shields.io/badge/PlatformIO-Scripts-orange.svg)](https://platformio.org/)
[![CyberBrick](https://img.shields.io/badge/Supports-CyberBrick%20MicroPython-00979D?style=flat)](https://github.com/CyberBrick-Official/CyberBrick_Controller_Core)
[![VS Code Marketplace](https://vsmarketplacebadges.dev/version-short/Singular-Ray.singular-blockly.svg?color=teal&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly&ssr=false#overview)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/Singular-Ray.singular-blockly.svg?color=7A52B3&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly)
[![Rating](https://vsmarketplacebadges.dev/rating-star/Singular-Ray.singular-blockly.svg?color=E05D44&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Singular Blockly is a VS Code extension for Blockly-based visual programming across Arduino, CyberBrick MicroPython, and fischertechnik TXT Controller projects. It generates `src/main.cpp`, `src/rc_main.py`, or `src/main.py` for the selected board, supports PlatformIO, `mpremote`, and SSH-based TXT workflows, and includes MCP tooling for GitHub Copilot plus a 15-language UI.

---

## 📑 Table of Contents

- [Core Dependencies](#core-dependencies)
- [Features](#features)
- [Installation](#installation)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [TXT Controller Support](#txt-controller-support)
- [Examples & Projects](#-examples--projects)
- [Block Categories](#block-categories)
- [Supported Boards and Platforms](#supported-boards-and-platforms)
- [Extension Settings](#extension-settings)
- [License](#license)
- [Contributing](#contributing)

---

## Core Dependencies

- **Blockly**: 12.3.1 - Visual programming library
- **@blockly/theme-modern**: 7.0.1 - Modern theme with darker borders
- **Node.js**: 22.16.0+ required
- **VS Code**: 1.105.0+ required

## Features

### 🎯 Multi-Board Support

- Arduino Uno, Nano, Mega
- ESP32 Dev Module
- Super Mini (Lolin C3 Mini)
- **🆕 CyberBrick** (ESP32-C3, MicroPython via `mpremote`)
- **🆕 fischertechnik TXT Controller** (Python via SSH + `ftrobopy`)

### 🌐 Internationalization

- **15 Languages** with 98.94% average coverage
- In-editor language picker (globe icon) with instant UI updates
- Auto mode follows VS Code's display language
- Multi-language block search UI

**Change Language (in editor):**

1. Click the globe icon in the Blockly toolbar
2. Choose **Auto (follow VS Code)** or a specific language
3. The Blockly UI updates immediately

**Change VS Code Display Language (affects Auto):**

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Configure Display Language"
3. Select your preferred language
4. VS Code will restart and Blockly Auto mode will follow

<details>
<summary><b>📊 Supported Languages Coverage</b></summary>

| Language            | Code    | Coverage |
| ------------------- | ------- | -------- |
| English             | en      | 99.3%    |
| Traditional Chinese | zh-hant | 99.3%    |
| Spanish             | es      | 98.9%    |
| Portuguese (Brazil) | pt-br   | 98.9%    |
| French              | fr      | 98.9%    |
| German              | de      | 98.9%    |
| Italian             | it      | 98.9%    |
| Russian             | ru      | 98.9%    |
| Japanese            | ja      | 98.9%    |
| Korean              | ko      | 98.9%    |
| Polish              | pl      | 98.9%    |
| Turkish             | tr      | 98.9%    |
| Hungarian           | hu      | 98.6%    |
| Bulgarian           | bg      | 98.6%    |
| Czech               | cs      | 98.6%    |

</details>

**Quality Assurance**:

- ✅ Automated validation (placeholders, encoding, consistency)
- ✅ Direct translation pattern detection
- ✅ Monthly CI/CD quality audits
- 📚 [Localization Quickstart Guide](specs/002-i18n-localization-review/quickstart.md)

### 💾 Workspace Management

- Automatic state saving and project persistence
- Board configuration management
- Arduino code generation (`src/main.cpp`)
- **🆕 CyberBrick MicroPython code generation** (`src/rc_main.py`)
- **🆕 TXT Controller Python code generation** (`src/main.py`)
- Automatic `platformio.ini` configuration for Arduino boards
- Automatic `platformio.ini` cleanup for CyberBrick and TXT workflows
- **Project Safety Guard** 🛡️
    - Smart project type detection (Node.js, Python, Java, etc.)
    - Warning dialog to prevent accidental modifications
    - Workspace-level preference memory
- **Comprehensive Backup System**
    - Timestamped backups with preview
    - Safe restoration with temporary backups
    - Auto-backup with configurable intervals
    - Modern responsive UI

### 🛠 Development Features

- Real-time code generation with manual refresh
- Visual drag-and-drop block interface
- Integrated board configuration
- **TXT Controller Tools**
    - In-editor connection settings dialog
    - SSH upload / run / stop workflow
    - Integrated I/O Test Panel for motors, outputs, and inputs
- **Block Search** 🔍
    - Search by name or parameter (Ctrl+F)
    - Highlight and navigate results
    - Multi-language UI support
- **Experimental Blocks Tracking**
    - Yellow dashed border indicators
    - Notification system
- Theme support (light/dark with toggle)
- Touch device support (pinch-to-zoom)
- PlatformIO integration for Arduino hardware upload
- **Pin Mode Tracking**
    - Auto-track modes (INPUT, OUTPUT, INPUT_PULLUP)
    - Conflict detection and warnings
    - Auto-add pinMode configurations

### 🤖 AI Integration with MCP Server

Seamless integration with GitHub Copilot and AI assistants through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/).

**AI-Assisted Block Programming:**

- **Block Query**: Ask AI "How do I use the servo motor block?" and get detailed usage info
- **Smart Suggestions**: AI understands your hardware setup and suggests compatible blocks
- **Natural Language**: Add blocks using commands like "Add an ultrasonic sensor block"
- **Project Awareness**: AI knows your board type, pins, and current workspace state

**Available MCP Tools:**

| Tool                      | Description                                                     |
| ------------------------- | --------------------------------------------------------------- |
| `get_block_usage`         | Get detailed block documentation with fields and JSON templates |
| `search_blocks`           | Search blocks by keyword (Chinese/English), sorted by relevance |
| `list_blocks_by_category` | Browse blocks by category (15 categories available)             |
| `get_workspace_state`     | Read current workspace, block arrangement, and board config     |
| `update_workspace`        | Add, modify, delete, or replace blocks in workspace             |
| `refresh_editor`          | Sync changes to the visual editor after workspace updates       |
| `get_platform_config`     | Get board configuration and PlatformIO settings                 |
| `get_board_pins`          | Query pin capabilities (digital, analog, PWM, I2C, SPI)         |
| `get_generated_code`      | Read the generated Arduino/MicroPython code                     |

**Getting Started with AI:**

1. Open VS Code with Copilot Agent Mode enabled
2. The MCP Server auto-registers when extension activates
3. Use natural language in Copilot chat:
    - "What servo blocks are available?"
    - "Add a servo setup block on pin 9"
    - "Show me blocks in the motors category"
    - "Show me the generated Arduino code"

> 💡 **Tip**: The AI maintains workspace backup (`main.json.bak`) for safe modifications. Use `get_block_usage` with context parameter to get ready-to-use JSON templates.

---

## Installation

### From VS Code Marketplace (Recommended)

1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for **"Singular Blockly"**
4. Click **Install**

### Offline Installation (GitHub Release)

For restricted network environments (企業內網 / 教育環境):

1. Download the latest `.vsix` file from [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases)
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Select **"Extensions: Install from VSIX..."**
4. Choose the downloaded `.vsix` file

**Command Line Alternative**:

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

---

## Requirements

- Visual Studio Code 1.105.0 or higher
- Node.js 22.16.0 or higher
- Basic understanding of visual programming and your target board workflow
- **For Arduino / ESP32 boards:**
    - PlatformIO IDE Extension
    - C/C++ Extension (`ms-vscode.cpptools`)
- **For CyberBrick (MicroPython):**
    - Python 3.x installed
    - `mpremote` tool (`pip install mpremote`)
- **For fischertechnik TXT Controller:**
    - Network access to the TXT Controller over SSH
    - Python 3 and `ftrobopy` available on the controller
    - Default connection values: host `192.168.7.2`, username `ftc`
    - Runtime port `8080` available for the integrated I/O Test Panel

---

## Quick Start

**Get started in 3 minutes:**

1. **Install** the extension from VS Code Marketplace
2. **Open a folder** (File → Open Folder)
3. **Click the wand icon** 🪄 in the status bar
4. **Select your target board** from the dropdown (`uno`, `esp32`, `cyberbrick`, or `txt`)
5. If you selected **TXT Controller**, open the TXT connection dialog in the editor toolbar and click **Test Connection**
6. **Drag blocks** from the toolbox, generate code, and upload with the workflow for your board

> 💡 The extension keeps `blockly/main.json` as the source of truth and generates `src/main.cpp` for Arduino boards, `src/rc_main.py` for CyberBrick, and `src/main.py` for TXT Controller projects.

---

## Usage

1. Open or create a folder in VS Code:
    - This extension requires a workspace folder to store its files
    - Use File > Open Folder... or File > New Folder
    - Make sure you have write permissions in the folder
    - **Note**: The extension will warn you if opened in a non-Blockly project to prevent accidental file modifications

2. Open the extension using:
    - Click the wand icon (🪄) in the status bar
    - Click the Singular Blockly icon in the activity bar

3. Select your target board from the dropdown menu:
    - Arduino boards automatically create and configure `platformio.ini`
    - CyberBrick and TXT Controller use Python workflows and do not keep `platformio.ini`
    - First-time board selection requires a workspace reload

4. Create your program using the visual blocks:
    - Drag blocks from the toolbox categories
    - Configure block parameters
    - Connect blocks to build your logic
    - Changes are auto-saved and persist between sessions

5. The extension will automatically:
    - Generate Arduino code in `src/main.cpp` for Arduino boards
    - Generate MicroPython code in `src/rc_main.py` for CyberBrick
    - Generate TXT Python code in `src/main.py` for TXT Controller
    - Save workspace state in `blockly/main.json`
    - Update `platformio.ini` only for Arduino boards
    - Provide real-time generated code for the active board workflow

---

## TXT Controller Support

Singular Blockly includes a dedicated SSH-based workflow for the fischertechnik TXT Controller, so TXT projects can be created in the same Blockly editor as Arduino and CyberBrick projects without forcing them through a PlatformIO-shaped doorway.

### Current TXT workflow

- Board selector entry: `txt`
- Blockly authoring model: one `TXT Setup` block plus one or more `TXT Process` blocks
- Generated file: `src/main.py`
- Runtime model: shared `ftrobopy.ftrobopy('auto')` connection with multiple TXT processes
- Upload path: default `/tmp/singular_blockly/main.py`
- Execution method: SSH upload + `python3` on the controller
- Stop command available from the extension
- TXT projects do **not** use `platformio.ini`

### TXT virtual controls canvas

- Runs inside the same Blockly editor panel; no second TXT control window is created
- Lets you add, rename, recolor, and drag virtual buttons during editing mode
- Button bindings use `stableId` internally so Blockly references survive rename operations
- The `txt_virtual_button_state` block reads button state through `_txt_virtual_button_state(stableId)`
- Invalid or deleted button references block TXT execution until the user re-selects a valid button
- Virtual-control runtime traffic uses `singular-blockly.txt.runtimePort + 1`, keeping it separate from the existing I/O Test Panel runtime

### Connection & testing

- In-editor TXT connection settings dialog
- Workspace-scoped settings for host, username, remote path, and runtime port
- Password stored securely via VS Code SecretStorage
- `Test Connection` uses the current form values before you save them
- Default connection values:
    - Host: `192.168.7.2`
    - Username: `ftc`
    - Remote path: `/tmp/singular_blockly/main.py`
    - Runtime port: `8080`

### I/O Test Panel

- Automatically uploads and starts `txt-runtime/io_server.py` when needed
- Motor control for `M1`–`M4`
- Output control for `O1`–`O8`
- Input polling for `I1`–`I8`
- Sensor configuration for button, light gate, and ultrasonic inputs
- `STOP ALL` action to stop motors and outputs from the panel

> 💡 If the TXT screen shows an SSH confirmation prompt on first connection, confirm it on the device. After a successful setup, the extension tries to make later SSH connections smoother.

---

## 📚 Examples & Projects

Explore real-world projects built with Singular Blockly:

| Project                                                                                | Description                                         | Board      |
| -------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------- |
| [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot) 🌐 EN/繁中 | Remote-controlled soccer robot with ESP-NOW pairing | CyberBrick |

> 💡 **Tip**: Have a project to share? Submit a PR to add it here!

---

## Block Categories

### 🔌 Arduino I/O Operations

- Smart pin options with automatic PWM pin detection
- Optimized analog write functionality for PWM pins

### ⚙️ ESP32 PWM Configuration (v0.43.0+)

- Custom PWM frequency (1-80000 Hz) and resolution (8-16 bit)
- High-frequency PWM for motor driver chips (20-75KHz)
- Automatic validation: `frequency × 2^resolution ≤ 80,000,000`
- Backward compatible (default: 75000Hz / 8bit)
- Independent from ESP32Servo blocks

### 🎮 Servo Motor Control

- Configurable setup and angle control
- Smart dropdown with auto-detection
- Board-specific library support (ESP32/Arduino)

### 🔧 Encoder Motor Support

- Setup, read, reset, and PID control
- Automatic pin management

### 📡 Sensor Blocks

**Ultrasonic Sensor**

- Hardware interrupt support
- Smart block linking (trigger + read)
- Auto-detection between blocks

**Seven-Segment Display**

- Common cathode/anode modes

**Threshold Functions**

- Analog input monitoring

### 📷 Pixetto Smart Camera

- Complete visual recognition system
- **Color Detection**: 8 colors (red, blue, green, yellow, orange, purple, black, white)
- **Shape Detection**: triangle, rectangle, pentagon, hexagon, circle
- **Face Detection** and **AprilTag Recognition**
- **Neural Network** and **Handwritten Digit Recognition**
- **Road Detection** with center/boundary info
- Position data (X, Y, width, height)
- UART configuration (RX/TX pins)

### 🤖 HUSKYLENS Smart Camera (Experimental)

- Advanced AI vision system
- **Dual Modes**: I2C and UART
- **Recognition Algorithms**:
    - Face recognition
    - Object tracking/recognition
    - Line tracking
    - Color recognition
    - Tag recognition
    - Object classification
- Real-time block/arrow detection results
- Interactive learning functions
- Position and ID information

### 📡 ESP32 WiFi/MQTT Communication (v0.47.0+)

**WiFi Connectivity (ESP32/Super Mini only)**

- Connect/Disconnect with 10-second timeout protection
- Network scanning with SSID and signal strength
- Connection status monitoring
- IP address retrieval

**MQTT IoT Communication**

- Broker setup (server, port, client ID)
- Publish/Subscribe messaging
- Message callback handling
- Auto-include PubSubClient library dependency

**Utility Blocks**

- `to_string` - Convert numbers/booleans to strings
- `text_to_number` - Convert strings to integers/floats

> 💡 WiFi/MQTT blocks appear only when ESP32 boards are selected. Non-ESP32 boards show a warning.

### 🐍 CyberBrick MicroPython Blocks (v0.49.0+)

**ESP32-C3 MicroPython visual programming for CyberBrick board:**

**Main & GPIO**

- Main program structure (setup/loop equivalent)
- Digital GPIO read/write
- GPIO mode configuration (INPUT/OUTPUT/PULLUP/PULLDOWN)

**LED Control**

- RGB LED with customizable colors
- Brightness control

**Time Functions**

- Delay in milliseconds
- Delay in seconds

**WiFi Connectivity**

- Connect/Disconnect
- Connection status
- IP address retrieval

**X11 Extension Board (v0.51.0+)**

- 180° Servo angle control (S1-S4 ports)
- 360° Servo speed control (S1-S4 ports)
- DC Motor speed control (M1-M2 ports)
- WS2812 LED strip color control (D1-D2 ports)

**🆕 X12 Transmitter Extension Board (v0.52.0+)**

- Local joystick reading (L1-L3, R1-R3 axes, ADC 0-4095)
- Joystick value mapping to custom range
- Local button state detection (K1-K4)

**🆕 Serial Monitor (v0.60.0+)**

- Real-time serial output viewing in VS Code terminal
- **Arduino boards**: Uses `pio device monitor` with auto baud rate detection from `platformio.ini`
- **CyberBrick**: Uses `mpremote` for MicroPython `print()` output
- Auto-close before upload to release COM port, auto-restart after success
- ESP32 boards auto-enable exception decoder for crash analysis
- Monitor button shows for all board types

**Built-in MicroPython Generators**

- Complete logic, loops, math, text, list, variable, and function block support
- Clean Python code generation with proper indentation
- One-click upload via `mpremote` tool

> 💡 When switching to CyberBrick, `platformio.ini` is auto-removed to avoid conflicts. Workspace is auto-backed up before board switch.

> ⚠️ **Compatibility Note**: This tool uses the officially supported `mpremote` method to upload code—**it does not modify or damage the official firmware**. You can switch back to the official CyberBrick editor anytime by simply uploading from it, which will overwrite the program directly (tested and verified).

### 🧱 TXT Controller Blocks

**SSH-based Blockly workflow for the fischertechnik TXT Controller:**

- Top-level `TXT Setup` block for shared initialization
- Multiple `TXT Process` blocks for flow-style concurrent programs
- Motor speed / motor stop blocks for `M1`–`M4`
- Output control blocks for `O1`–`O8`
- Input sensor blocks for button, light gate, and ultrasonic sensors on `I1`–`I8`
- Wait and stop-all blocks for pacing and safe shutdown

### 🧮 Programming Constructs

**Functions**

- Parameter support
- Custom threshold functions
- Multiple output types (numeric, boolean, string)
- Chinese function name conversion

**Variables**

- Rename/delete capabilities

**Data Structures**

- Lists and Arrays

**Control Flow**

- Logic Operations
- Loops (repeat, while, for)
- Time-based duration loops
- Flow control (break, continue) with validation

**Operations**

- Math Operations
- Text Operations
- Value Mapping (Arduino `map()` function)

---

## Supported Boards and Platforms

Each board is wired to the appropriate code generation and upload workflow:

| Board                          | Code generation  | Selector ID   | Upload / runtime workflow                    |
| ------------------------------ | ---------------- | ------------- | -------------------------------------------- |
| **Arduino Uno**                | Arduino C++      | `uno`         | PlatformIO                                   |
| **Arduino Nano**               | Arduino C++      | `nano`        | PlatformIO                                   |
| **Arduino Mega**               | Arduino C++      | `mega`        | PlatformIO                                   |
| **ESP32 Dev Module**           | Arduino C++      | `esp32`       | PlatformIO                                   |
| **Super Mini (Lolin C3 Mini)** | Arduino C++      | `supermini`   | PlatformIO                                   |
| **🆕 CyberBrick**              | MicroPython      | `cyberbrick`  | `mpremote` → `/app/rc_main.py`               |
| **🆕 TXT Controller**          | Python (`ftrobopy`) | `txt`      | SSH + `python3` → `/tmp/singular_blockly/main.py` |

> 💡 Arduino boards keep `platformio.ini`; CyberBrick and TXT use Python workflows and remove `platformio.ini` when it is not needed.

---

## Extension Settings

### TXT Controller connection settings

- **`singular-blockly.txt.host`**
    - **Type**: `string`
    - **Default**: `192.168.7.2`
    - **Scope**: Workspace-level
    - **Description**: TXT Controller host/IP used for SSH upload and the I/O Test Panel

- **`singular-blockly.txt.username`**
    - **Type**: `string`
    - **Default**: `ftc`
    - **Scope**: Workspace-level
    - **Description**: SSH username for the TXT Controller

- **`singular-blockly.txt.remotePath`**
    - **Type**: `string`
    - **Default**: `/tmp/singular_blockly/main.py`
    - **Scope**: Workspace-level
    - **Description**: Remote path where the generated TXT Python program is uploaded

- **`singular-blockly.txt.runtimePort`**
    - **Type**: `number`
    - **Default**: `8080`
    - **Scope**: Workspace-level
    - **Description**: Base runtime port used by the integrated TXT I/O Test Panel; TXT virtual controls use the next port (`runtimePort + 1`)

> 💡 TXT passwords are configured from the editor connection dialog and stored in VS Code SecretStorage, not in plain-text settings files.

- **`singularBlockly.safetyGuard.suppressWarning`**
    - **Type**: `boolean`
    - **Default**: `false`
    - **Scope**: Workspace-level
    - **Description**: Suppress safety warnings when opening non-Blockly projects

### Project Safety Guard 🛡️

The extension detects non-Blockly projects (Node.js, Python, Java, etc.) and shows a warning dialog:

- **Continue** → Proceed with opening
- **Cancel** → Abort operation
- **Don't remind again** → Suppress warnings for this workspace

**Re-enable warnings** by changing workspace settings:

```json
{
	"singularBlockly.safetyGuard.suppressWarning": false
}
```

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project incorporates the following third-party components:

- [Blockly](https://github.com/google/blockly) - Apache License 2.0
- [PlatformIO](https://platformio.org/) - Apache License 2.0
- Arduino Core Libraries - LGPL

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

**Resources**:

- [GitHub Repository](https://github.com/Shen-Ming-Hong/singular-blockly)
- [Issue Tracker](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [Localization Guide](specs/002-i18n-localization-review/quickstart.md)
