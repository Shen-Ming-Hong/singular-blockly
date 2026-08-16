# Managed Runtime Third-Party Notices

Singular Blockly downloads these components only after validating the version,
platform, architecture, source URL, and SHA-256 recorded in `runtime-manifest.json`.

## CPython standalone distributions

- Project: Astral `python-build-standalone`
- Release: `20260814` (CPython 3.11.16)
- Source: <https://github.com/astral-sh/python-build-standalone/releases/tag/20260814>
- Distribution license: MIT
- Bundled Python and library license metadata remains inside each downloaded
  distribution and is not removed by Singular Blockly.

## PlatformIO Core Installer

- Project: PlatformIO Core Installer
- Commit: `30e73f7e60283a653b9bb09205f91b6b9175a135`
- Source: <https://github.com/platformio/platformio-core-installer>
- License: Apache-2.0

## PlatformIO Core

- Project: PlatformIO Core
- Channel: latest stable at installation time
- Source: <https://github.com/platformio/platformio-core>
- License: Apache-2.0

## mpremote

- Version: 1.28.0
- Source: <https://pypi.org/project/mpremote/1.28.0/>
- License: MIT

The extension does not redistribute the downloaded runtime bytes in the VSIX.
The VSIX contains this notice and the immutable manifest used to authenticate
the downloads.
