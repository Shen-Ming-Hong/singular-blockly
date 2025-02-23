# Singular Blockly

[![Built on Blockly](https://img.shields.io/badge/Built%20on-Blockly-4285F4?style=flat&cacheSeconds=3600&logoWidth=20&labelColor=5F6368&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJMYXllcl82IiBkYXRhLW5hbWU9IkxheWVyIDYiIHZpZXdCb3g9IjAgMCAxOTIgMTkyIj4KICA8ZGVmcyBpZD0iZGVmczkwMiIvPgogIDxnIGlkPSJnMTAxMyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjMuNSAtOCkiPgogICAgPHBhdGggaWQ9InBhdGg5MDYiIGZpbGw9IiM0Mjg1ZjQiIGQ9Ik0yMC4xIDMyQzEzLjQgMzIgOCAzNy40IDggNDQuMVYxNDljMCA2LjcgNS40IDEyLjEgMTIuMSAxMi4xSDI1YTIwIDIwIDAgMCAwIDM4LjUgMEg4NGE4IDggMCAwIDAgOC04VjQwbC04LTh6Ii8+CiAgICA8cGF0aCBpZD0icGF0aDkwOCIgZmlsbD0iI2M4ZDFkYiIgZD0iTTgwIDMyVjg1bC0xNi42LTkuNGEzLjYgMy42IDAgMCAwLTUuNCAzLjF2NDAuN2MwIDIuNyAzIDQuNCA1LjQgM2wxNi42LTkuM1YxNjFoNDUuNGM2LjQgMCAxMS42LTUuMiAxMS42LTExLjV2LTEwNmMwLTYuNC01LjItMTEuNS0xMS41LTExLjV6Ii8+CiAgPC9nPgo8L3N2Zz4K)](https://github.com/google/blockly)
[![PlatformIO](https://img.shields.io/badge/PlatformIO-Scripts-orange.svg)](https://platformio.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A Visual Studio Code extension that provides a visual programming interface using Blockly for Arduino development, with multi-board support and internationalization.

## Features

- 🎯 **Multi-Board Support**
  - Arduino Uno
  - Arduino Nano
  - Arduino Mega
  - ESP32
  - Super Mini (Lolin C3 Mini)

- 🌐 **Internationalization Support**
  - Multiple language support
  - Automatic language detection based on VS Code settings
  - Customizable messages for different locales

- 🧩 **Rich Block Categories**
  - Arduino I/O Operations
  - Functions with parameter support
  - Variables with rename/delete capabilities
  - Lists and Arrays
  - Logic Operations
  - Loops
  - Math Operations
  - Text Operations

- 💾 **Workspace Management**
  - Automatic state saving
  - Project persistence
  - Board configuration management
  - Code generation to Arduino (.cpp) files
  - Automatic PlatformIO configuration generation

- 🛠 **Development Features**
  - Real-time code generation
  - Integrated board configuration
  - Visual block programming interface
  - Drag-and-drop block management
  - Zoom controls and trashcan
  - Custom theme support
  - PlatformIO integration for hardware upload

## Requirements

- Visual Studio Code 1.96.0 or higher
- Basic understanding of Arduino programming concepts
- Required Extensions:
  - PlatformIO IDE Extension
  - C/C++ Extension (ms-vscode.cpptools)

## Usage

1. Open or create a folder in VS Code:
   - This extension requires a workspace folder to store its files
   - Use File > Open Folder... or File > New Folder
   - Make sure you have write permissions in the folder

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

## Supported Boards and Platforms

Each board is configured with specific PlatformIO settings for optimal compatibility:

### AVR Based

- **Arduino Uno**
  - Platform: atmelavr
  - Board: uno
- **Arduino Nano**
  - Platform: atmelavr
  - Board: nanoatmega328
- **Arduino Mega**
  - Platform: atmelavr
  - Board: megaatmega2560

### ESP32 Based

- **ESP32 Dev Module**
  - Platform: espressif32
  - Board: esp32dev
- **Super Mini (Lolin C3 Mini)**
  - Platform: espressif32
  - Board: lolin_c3_mini

> Note: The extension will automatically generate the appropriate `platformio.ini` configuration when you select a board, ensuring the correct platform settings for hardware upload.

## Known Issues

Please report any issues on our GitHub repository.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project incorporates the following third-party components:

- [Blockly](https://github.com/google/blockly) - Licensed under the Apache License 2.0
- [PlatformIO](https://platformio.org/) - Licensed under the Apache License 2.0
- Arduino Core Libraries - Licensed under the LGPL

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
