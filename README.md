# Singular Blockly

[![Built on Blockly](https://img.shields.io/badge/Built%20on-Blockly-4285F4?style=flat&cacheSeconds=3600&logoWidth=20&labelColor=5F6368&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJMYXllcl82IiBkYXRhLW5hbWU9IkxheWVyIDYiIHZpZXdCb3g9IjAgMCAxOTIgMTkyIj4KICA8ZGVmcyBpZD0iZGVmczkwMiIvPgogIDxnIGlkPSJnMTAxMyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjMuNSAtOCkiPgogICAgPHBhdGggaWQ9InBhdGg5MDYiIGZpbGw9IiM0Mjg1ZjQiIGQ9Ik0yMC4xIDMyQzEzLjQgMzIgOCAzNy40IDggNDQuMVYxNDljMCA2LjcgNS40IDEyLjEgMTIuMSAxMi4xSDI1YTIwIDIwIDAgMCAwIDM4LjUgMEg4NGE4IDggMCAwIDAgOC04VjQwbC04LTh6Ii8+CiAgICA8cGF0aCBpZD0icGF0aDkwOCIgZmlsbD0iI2M4ZDFkYiIgZD0iTTgwIDMyVjg1bC0xNi42LTkuNGEzLjYgMy42IDAgMCAwLTUuNCAzLjF2NDAuN2MwIDIuNyAzIDQuNCA1LjQgM2wxNi42LTkuM1YxNjFoNDUuNGM2LjQgMCAxMS42LTUuMiAxMS42LTExLjV2LTEwNmMwLTYuNC01LjItMTEuNS0xMS41LTExLjV6Ii8+CiAgPC9nPgo8L3N2Zz4K)](https://github.com/google/blockly)
[![PlatformIO](https://img.shields.io/badge/PlatformIO-Scripts-orange.svg)](https://platformio.org/)
[![CyberBrick](https://img.shields.io/badge/Supports-CyberBrick%20MicroPython-00979D?style=flat)](https://makerworld.com/en/cyberbrick)
[![VS Code Marketplace](https://vsmarketplacebadges.dev/version-short/Singular-Ray.singular-blockly.svg?color=teal&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly&ssr=false#overview)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/Singular-Ray.singular-blockly.svg?color=7A52B3&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly)
[![Rating](https://vsmarketplacebadges.dev/rating-star/Singular-Ray.singular-blockly.svg?color=E05D44&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

VS Code extension for visual Arduino & MicroPython programming with Blockly. Multi-board support (Uno, Nano, Mega, ESP32, CyberBrick), WiFi/MQTT IoT blocks, AI camera integration (Pixetto, HuskyLens), MCP server for GitHub Copilot, PlatformIO integration, and 15 languages with 99% coverage.

---

## 📑 Table of Contents

-   [Core Dependencies](#core-dependencies)
-   [Features](#features)
-   [Installation](#installation)
-   [Requirements](#requirements)
-   [Quick Start](#quick-start)
-   [Usage](#usage)
-   [Block Categories](#block-categories)
-   [Supported Boards and Platforms](#supported-boards-and-platforms)
-   [Extension Settings](#extension-settings)
-   [Known Issues](#known-issues)
-   [License](#license)
-   [Contributing](#contributing)

---

## Core Dependencies

-   **Blockly**: 12.3.1 - Visual programming library
-   **@blockly/theme-modern**: 7.0.1 - Modern theme with darker borders
-   **Node.js**: 22.16.0+ required
-   **VS Code**: 1.105.0+ required

## Features

### 🎯 Multi-Board Support

-   Arduino Uno, Nano, Mega
-   ESP32 Dev Module
-   Super Mini (Lolin C3 Mini)
-   **🆕 CyberBrick** (ESP32-C3, MicroPython)

### 🌐 Internationalization

-   **15 Languages** with 98.94% average coverage
-   Automatic language detection
-   Multi-language block search UI

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

-   ✅ Automated validation (placeholders, encoding, consistency)
-   ✅ Direct translation pattern detection
-   ✅ Monthly CI/CD quality audits
-   📚 [Localization Quickstart Guide](specs/002-i18n-localization-review/quickstart.md)

### 💾 Workspace Management

-   Automatic state saving and project persistence
-   Board configuration management
-   Arduino code generation (.cpp files)
-   **🆕 MicroPython code generation** (CyberBrick)
-   Automatic PlatformIO configuration
-   **Project Safety Guard** 🛡️
    -   Smart project type detection (Node.js, Python, Java, etc.)
    -   Warning dialog to prevent accidental modifications
    -   Workspace-level preference memory
-   **Comprehensive Backup System**
    -   Timestamped backups with preview
    -   Safe restoration with temporary backups
    -   Auto-backup with configurable intervals
    -   Modern responsive UI

### 🛠 Development Features

-   Real-time code generation with manual refresh
-   Visual drag-and-drop block interface
-   Integrated board configuration
-   **Block Search** 🔍
    -   Search by name or parameter (Ctrl+F)
    -   Highlight and navigate results
    -   Multi-language UI support
-   **Experimental Blocks Tracking**
    -   Yellow dashed border indicators
    -   Notification system
-   Theme support (light/dark with toggle)
-   Touch device support (pinch-to-zoom)
-   PlatformIO integration for hardware upload
-   **Pin Mode Tracking**
    -   Auto-track modes (INPUT, OUTPUT, INPUT_PULLUP)
    -   Conflict detection and warnings
    -   Auto-add pinMode configurations

### 🤖 AI Integration with MCP Server

Seamless integration with GitHub Copilot and AI assistants through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/).

**AI-Assisted Block Programming:**

-   **Block Query**: Ask AI "How do I use the servo motor block?" and get detailed usage info
-   **Smart Suggestions**: AI understands your hardware setup and suggests compatible blocks
-   **Natural Language**: Add blocks using commands like "Add an ultrasonic sensor block"
-   **Project Awareness**: AI knows your board type, pins, and current workspace state

**Available MCP Tools:**

| Tool                      | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| `get_block_usage`         | Get detailed block documentation with fields and examples |
| `search_blocks`           | Search blocks by keyword (Chinese/English)                |
| `list_blocks_by_category` | Browse blocks by category                                 |
| `get_workspace_state`     | Read current workspace and block arrangement              |
| `update_workspace`        | Add, modify, delete, or replace blocks                    |
| `refresh_editor`          | Sync changes to the visual editor                         |
| `get_platform_config`     | Get board configuration and PlatformIO settings           |
| `get_board_pins`          | Query pin capabilities (digital, analog, PWM, I2C)        |
| `get_generated_code`      | Read the generated Arduino code                           |

**Getting Started with AI:**

1. Open VS Code with Copilot Agent Mode enabled
2. The MCP Server auto-registers when extension activates
3. Use natural language in Copilot chat:
    - "What servo blocks are available?"
    - "Add a servo setup block on pin 9"
    - "Change the servo angle to 45 degrees"
    - "Show me the generated Arduino code"

> 💡 **Tip**: The AI maintains workspace backup (main.json.bak) for safe modifications.

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

-   Visual Studio Code 1.105.0 or higher
-   Node.js 22.16.0 or higher
-   Basic understanding of Arduino programming concepts
-   Required Extensions:
    -   PlatformIO IDE Extension
    -   C/C++ Extension (ms-vscode.cpptools)
-   **For CyberBrick (MicroPython):**
    -   Python 3.x installed
    -   `mpremote` tool (`pip install mpremote`)

---

## Quick Start

**Get started in 3 minutes:**

1. **Install** the extension from VS Code Marketplace
2. **Open a folder** (File → Open Folder)
3. **Click the wand icon** 🪄 in the status bar
4. **Select your Arduino board** from the dropdown
5. **Drag blocks** from the toolbox and start coding!

> 💡 **First time?** The extension will auto-generate `platformio.ini` and `src/main.cpp` for you.

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

    - The extension will automatically create and configure `platformio.ini`
    - First-time board selection requires a workspace reload

4. Create your program using the visual blocks:

    - Drag blocks from the toolbox categories
    - Configure block parameters
    - Connect blocks to build your logic
    - Changes are auto-saved and persist between sessions

5. The extension will automatically:
    - Generate Arduino code in `src/main.cpp`
    - Save workspace state in `blockly/main.json`
    - Update PlatformIO configuration
    - Provide real-time code(.cpp) generation

---

## Block Categories

### 🔌 Arduino I/O Operations

-   Smart pin options with automatic PWM pin detection
-   Optimized analog write functionality for PWM pins

### ⚙️ ESP32 PWM Configuration (v0.43.0+)

-   Custom PWM frequency (1-80000 Hz) and resolution (8-16 bit)
-   High-frequency PWM for motor driver chips (20-75KHz)
-   Automatic validation: `frequency × 2^resolution ≤ 80,000,000`
-   Backward compatible (default: 75000Hz / 8bit)
-   Independent from ESP32Servo blocks

### 🎮 Servo Motor Control

-   Configurable setup and angle control
-   Smart dropdown with auto-detection
-   Board-specific library support (ESP32/Arduino)

### 🔧 Encoder Motor Support

-   Setup, read, reset, and PID control
-   Automatic pin management

### 📡 Sensor Blocks

**Ultrasonic Sensor**

-   Hardware interrupt support
-   Smart block linking (trigger + read)
-   Auto-detection between blocks

**Seven-Segment Display**

-   Common cathode/anode modes

**Threshold Functions**

-   Analog input monitoring

### 📷 Pixetto Smart Camera

-   Complete visual recognition system
-   **Color Detection**: 8 colors (red, blue, green, yellow, orange, purple, black, white)
-   **Shape Detection**: triangle, rectangle, pentagon, hexagon, circle
-   **Face Detection** and **AprilTag Recognition**
-   **Neural Network** and **Handwritten Digit Recognition**
-   **Road Detection** with center/boundary info
-   Position data (X, Y, width, height)
-   UART configuration (RX/TX pins)

### 🤖 HUSKYLENS Smart Camera (Experimental)

-   Advanced AI vision system
-   **Dual Modes**: I2C and UART
-   **Recognition Algorithms**:
    -   Face recognition
    -   Object tracking/recognition
    -   Line tracking
    -   Color recognition
    -   Tag recognition
    -   Object classification
-   Real-time block/arrow detection results
-   Interactive learning functions
-   Position and ID information

### 📡 ESP32 WiFi/MQTT Communication (v0.47.0+)

**WiFi Connectivity (ESP32/Super Mini only)**

-   Connect/Disconnect with 10-second timeout protection
-   Network scanning with SSID and signal strength
-   Connection status monitoring
-   IP address retrieval

**MQTT IoT Communication**

-   Broker setup (server, port, client ID)
-   Publish/Subscribe messaging
-   Message callback handling
-   Auto-include PubSubClient library dependency

**Utility Blocks**

-   `to_string` - Convert numbers/booleans to strings
-   `text_to_number` - Convert strings to integers/floats

> 💡 WiFi/MQTT blocks appear only when ESP32 boards are selected. Non-ESP32 boards show a warning.

### 🐍 CyberBrick MicroPython Blocks (v0.49.0+)

**ESP32-C3 MicroPython visual programming for CyberBrick board:**

**Main & GPIO**

-   Main program structure (setup/loop equivalent)
-   Digital GPIO read/write
-   GPIO mode configuration (INPUT/OUTPUT/PULLUP/PULLDOWN)

**LED Control**

-   RGB LED with customizable colors
-   Brightness control

**Time Functions**

-   Delay in milliseconds
-   Delay in seconds

**WiFi Connectivity**

-   Connect/Disconnect
-   Connection status
-   IP address retrieval

**Built-in MicroPython Generators**

-   Complete logic, loops, math, text, list, variable, and function block support
-   Clean Python code generation with proper indentation
-   One-click upload via `mpremote` tool

> 💡 When switching to CyberBrick, `platformio.ini` is auto-removed to avoid conflicts. Workspace is auto-backed up before board switch.

### 🧮 Programming Constructs

**Functions**

-   Parameter support
-   Custom threshold functions
-   Multiple output types (numeric, boolean, string)
-   Chinese function name conversion

**Variables**

-   Rename/delete capabilities

**Data Structures**

-   Lists and Arrays

**Control Flow**

-   Logic Operations
-   Loops (repeat, while, for)
-   Time-based duration loops
-   Flow control (break, continue) with validation

**Operations**

-   Math Operations
-   Text Operations
-   Value Mapping (Arduino `map()` function)

---

## Supported Boards and Platforms

Each board is configured with optimized PlatformIO settings:

| Board                          | Platform    | Board ID       | Architecture |
| ------------------------------ | ----------- | -------------- | ------------ |
| **Arduino Uno**                | atmelavr    | uno            | AVR          |
| **Arduino Nano**               | atmelavr    | nanoatmega328  | AVR          |
| **Arduino Mega**               | atmelavr    | megaatmega2560 | AVR          |
| **ESP32 Dev Module**           | espressif32 | esp32dev       | ESP32        |
| **Super Mini (Lolin C3 Mini)** | espressif32 | lolin_c3_mini  | ESP32-C3     |
| **🆕 CyberBrick**              | MicroPython | esp32c3        | ESP32-C3     |

> 💡 The extension auto-generates `platformio.ini` with correct settings for hardware upload (Arduino boards), or uses `mpremote` for MicroPython upload (CyberBrick).

---

## Extension Settings

-   **`singularBlockly.safetyGuard.suppressWarning`**
    -   **Type**: `boolean`
    -   **Default**: `false`
    -   **Scope**: Workspace-level
    -   **Description**: Suppress safety warnings when opening non-Blockly projects

### Project Safety Guard 🛡️

The extension detects non-Blockly projects (Node.js, Python, Java, etc.) and shows a warning dialog:

-   **Continue** → Proceed with opening
-   **Cancel** → Abort operation
-   **Don't remind again** → Suppress warnings for this workspace

**Re-enable warnings** by changing workspace settings:

```json
{
	"singularBlockly.safetyGuard.suppressWarning": false
}
```

---

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project incorporates the following third-party components:

-   [Blockly](https://github.com/google/blockly) - Apache License 2.0
-   [PlatformIO](https://platformio.org/) - Apache License 2.0
-   Arduino Core Libraries - LGPL

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

**Resources**:

-   [GitHub Repository](https://github.com/Shen-Ming-Hong/singular-blockly)
-   [Issue Tracker](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
-   [Localization Guide](specs/002-i18n-localization-review/quickstart.md)
