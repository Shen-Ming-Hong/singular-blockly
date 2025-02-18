# Singular Blockly

<a href="https://github.com/google/blockly"><img src="https://tinyurl.com/built-on-blockly" /></a>
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

- Visual Studio Code 1.6.0 or higher
- Basic understanding of Arduino programming concepts
- PlatformIO IDE Extension (for hardware upload capabilities)

## Usage

1. Open the extension using:
   - Click the wand icon (🪄) in the status bar
   - Use the activity bar button

2. Select your target board from the dropdown menu:
   - The extension will automatically generate appropriate PlatformIO configuration
   - A `platformio.ini` file will be created with correct board settings
   - First-time board selection will prompt for a workspace reload

3. Create your program using the visual blocks:
   - Drag blocks from the toolbox
   - Configure block parameters
   - Connect blocks to build your logic

4. The extension will automatically:
   - Generate Arduino code in `src/main.cpp`
   - Save your workspace state
   - Update board configurations
   - Configure PlatformIO settings for hardware upload

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

## Release Notes

### 1.0.0

- Multi-board support including Arduino and ESP32 platforms
- Internationalization with multiple language support
- Advanced variable management with rename/delete capabilities
- Function block support with parameter handling
- Real-time code generation and workspace state persistence
- Custom theme implementation

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project incorporates the following third-party components:

- [Blockly](https://github.com/google/blockly) - Licensed under the Apache License 2.0
- [PlatformIO](https://platformio.org/) - Licensed under the Apache License 2.0
- Arduino Core Libraries - Licensed under the LGPL

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
