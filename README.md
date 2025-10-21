# Singular Blockly

[![Built on Blockly](https://img.shields.io/badge/Built%20on-Blockly-4285F4?style=flat&cacheSeconds=3600&logoWidth=20&labelColor=5F6368&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJMYXllcl82IiBkYXRhLW5hbWU9IkxheWVyIDYiIHZpZXdCb3g9IjAgMCAxOTIgMTkyIj4KICA8ZGVmcyBpZD0iZGVmczkwMiIvPgogIDxnIGlkPSJnMTAxMyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjMuNSAtOCkiPgogICAgPHBhdGggaWQ9InBhdGg5MDYiIGZpbGw9IiM0Mjg1ZjQiIGQ9Ik0yMC4xIDMyQzEzLjQgMzIgOCAzNy40IDggNDQuMVYxNDljMCA2LjcgNS40IDEyLjEgMTIuMSAxMi4xSDI1YTIwIDIwIDAgMCAwIDM4LjUgMEg4NGE4IDggMCAwIDAgOC04VjQwbC04LTh6Ii8+CiAgICA8cGF0aCBpZD0icGF0aDkwOCIgZmlsbD0iI2M4ZDFkYiIgZD0iTTgwIDMyVjg1bC0xNi42LTkuNGEzLjYgMy42IDAgMCAwLTUuNCAzLjF2NDAuN2MwIDIuNyAzIDQuNCA1LjQgM2wxNi42LTkuM1YxNjFoNDUuNGM2LjQgMCAxMS42LTUuMiAxMS42LTExLjV2LTEwNmMwLTYuNC01LjItMTEuNS0xMS41LTExLjV6Ii8+CiAgPC9nPgo8L3N2Zz4K)](https://github.com/google/blockly)
[![PlatformIO](https://img.shields.io/badge/PlatformIO-Scripts-orange.svg)](https://platformio.org/)
[![VS Code Marketplace](https://vsmarketplacebadges.dev/version-short/Singular-Ray.singular-blockly.svg?color=teal&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly&ssr=false#overview)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/Singular-Ray.singular-blockly.svg?color=7A52B3&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly)
[![Rating](https://vsmarketplacebadges.dev/rating-star/Singular-Ray.singular-blockly.svg?color=E05D44&style=flat)](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A Visual Studio Code extension that provides a visual programming interface using Blockly for Arduino development, with multi-board support and internationalization.

## Core Dependencies

-   **Blockly**: 12.3.1 - Visual programming library
-   **@blockly/theme-modern**: 7.0.1 - Modern theme with darker borders
-   **Node.js**: 22.16.0+ required
-   **VS Code**: 1.105.0+ required

## Features

-   🎯 **Multi-Board Support**

    -   Arduino Uno
    -   Arduino Nano
    -   Arduino Mega
    -   ESP32
    -   Super Mini (Lolin C3 Mini)

-   🌐 **Internationalization Support**

    -   **15 Languages Supported** with 98.94% average translation coverage
    -   Automatic language detection based on VS Code settings
    -   Block search UI supports all available languages
    -   Automated quality validation (CI/CD integration)
    -   Supported languages:
        -   English (en) - 99.3% coverage
        -   Spanish (es) - 98.9% coverage
        -   Portuguese (pt-br) - 98.9% coverage
        -   French (fr) - 98.9% coverage
        -   German (de) - 98.9% coverage
        -   Italian (it) - 98.9% coverage
        -   Russian (ru) - 98.9% coverage
        -   Japanese (ja) - 98.9% coverage
        -   Korean (ko) - 98.9% coverage
        -   Traditional Chinese (zh-hant) - 99.3% coverage
        -   Polish (pl) - 98.9% coverage
        -   Hungarian (hu) - 98.6% coverage
        -   Turkish (tr) - 98.9% coverage
        -   Bulgarian (bg) - 98.6% coverage
        -   Czech (cs) - 98.6% coverage
    -   **Quality Assurance**:
        -   ✅ Automated validation for placeholders, encoding, and consistency
        -   ✅ Direct translation pattern detection
        -   ✅ Monthly quality audits via GitHub Actions
        -   📚 For contributors: See [Localization Quickstart Guide](specs/002-i18n-localization-review/quickstart.md)

-   🧩 **Rich Block Categories**

    -   Arduino I/O Operations
        -   Smart pin options with automatic PWM pin detection
        -   Optimized analog write functionality for PWM pins
    -   Servo Motor Control
        -   Configurable servo setup and angle control
        -   Smart dropdown menu with automatic servo name detection
        -   Board-specific servo library support (ESP32/Arduino)
    -   Encoder Motor Support
        -   Setup, read, reset and PID control functionality
        -   Automatic pin management for encoder motors
    -   Sensor Blocks
        -   Ultrasonic Sensor with hardware interrupt support
            -   Smart block linking for ultrasonic trigger and read operations
            -   Automatic detection and configuration between ultrasonic blocks
        -   Seven-segment Display with common cathode/anode modes
        -   Threshold function blocks for analog input monitoring
    -   Pixetto Smart Camera
        -   Complete visual recognition system
        -   Color detection (8 colors: red, blue, green, yellow, orange, purple, black, white)
        -   Shape detection (triangle, rectangle, pentagon, hexagon, circle)
        -   Face detection and AprilTag recognition
        -   Neural network recognition and handwritten digit recognition
        -   Road detection with center and boundary information
        -   Position and size data retrieval (X, Y coordinates, width, height)
        -   UART communication configuration (RX/TX pins)
        -   Multiple function modes with easy switching
    -   HUSKYLENS Smart Camera (Experimental)
        -   Advanced AI vision recognition system
        -   Dual communication modes: I2C and UART
        -   Multiple recognition algorithms: face recognition, object tracking, object recognition, line tracking, color recognition, tag recognition, object classification
        -   Real-time data retrieval: block and arrow detection results with position and ID information
        -   Interactive learning functions: learn objects and forget all learned content
        -   Easy algorithm switching and configuration
        -   Comprehensive detection result analysis with count and detailed information blocks
    -   Functions with parameter support
        -   Custom threshold functions with analog input support
        -   Configurable sensor pins and threshold values
        -   Multiple output types (numeric, boolean, string)
        -   Support for converting Chinese function names to valid C++ code
    -   Variables with rename/delete capabilities
    -   Lists and Arrays
    -   Logic Operations
    -   Loops
        -   Standard loop blocks (repeat, while, for)
        -   Time-based duration loops (execute for a specific time)
        -   Flow control statements (break, continue) with context validation
    -   Math Operations
    -   Text Operations
    -   Value Mapping (Arduino map function)

-   💾 **Workspace Management**

    -   Automatic state saving
    -   Project persistence
    -   Board configuration management
    -   Code generation to Arduino (.cpp) files
    -   Automatic PlatformIO configuration generation
    -   Automatic platformio.ini preview mode management
    -   Comprehensive backup system
        -   Backup creation with timestamps
        -   Backup preview without restoration
        -   Safe restoration with automatic temporary backups
        -   Auto-backup with configurable time intervals
        -   Modern UI with responsive design for backup management
    -   Seven-segment display support with common cathode/anode modes

-   🛠 **Development Features**
    -   Real-time code generation
    -   Manual code refresh button for instant code regeneration
    -   Integrated board configuration
    -   Visual block programming interface
    -   Drag-and-drop block management
    -   Automatic block code generation system for critical blocks
    -   Standardized logging service for code generation
    -   Code comments generation system for improved readability
    -   Experimental blocks tracking system
        -   Visual indication with yellow dashed borders
        -   Notification system for experimental features
        -   Automatic detection and marking of experimental blocks
    -   🔍 **Block Search Function**
        -   Quickly search blocks by name or parameter in the workspace
        -   Highlight and navigate search results
        -   Multi-language UI and keyboard shortcut (Ctrl+F) support
        -   Search UI is fully integrated and accessible from the editor
    -   Zoom controls and trashcan
    -   Light and dark theme support with theme toggle
    -   Touch device support with pinch-to-zoom functionality
    -   PlatformIO integration for hardware upload
    -   Pin mode tracking and conflict detection
        -   Automatically tracks pin modes (INPUT, OUTPUT, INPUT_PULLUP)
        -   Detects pin mode conflicts and displays warnings
        -   Automatically adds necessary pinMode configurations
    -   Value mapping (Arduino map function)

## Requirements

-   Visual Studio Code 1.96.0 or higher
-   Basic understanding of Arduino programming concepts
-   Required Extensions:
    -   PlatformIO IDE Extension
    -   C/C++ Extension (ms-vscode.cpptools)

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

-   **Arduino Uno**
    -   Platform: atmelavr
    -   Board: uno
-   **Arduino Nano**
    -   Platform: atmelavr
    -   Board: nanoatmega328
-   **Arduino Mega**
    -   Platform: atmelavr
    -   Board: megaatmega2560

### ESP32 Based

-   **ESP32 Dev Module**
    -   Platform: espressif32
    -   Board: esp32dev
-   **Super Mini (Lolin C3 Mini)**
    -   Platform: espressif32
    -   Board: lolin_c3_mini

> Note: The extension will automatically generate the appropriate `platformio.ini` configuration when you select a board, ensuring the correct platform settings for hardware upload.

## Known Issues

Please report any issues on our GitHub repository.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project incorporates the following third-party components:

-   [Blockly](https://github.com/google/blockly) - Licensed under the Apache License 2.0
-   [PlatformIO](https://platformio.org/) - Licensed under the Apache License 2.0
-   Arduino Core Libraries - Licensed under the LGPL

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
