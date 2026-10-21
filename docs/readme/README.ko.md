# Singular Blockly

[English](../../README.md) · [繁體中文](README.zh-hant.md) · [日本語](README.ja.md) · **한국어** · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-br.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [Čeština](README.cs.md) · [Magyar](README.hu.md) · [Български](README.bg.md)

> 이 문서는 영어 [README](../../README.md)의 번역본입니다. 내용이 다르면 영어판을 기준으로 합니다.

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Singular Blockly 아이콘">
</p>

**VS Code 안에서 Arduino, CyberBrick, fischertechnik TXT Controller를 블록으로 프로그래밍하세요.**

Blockly로 프로그램을 만들고, 생성된 코드를 바로 확인한 뒤 PlatformIO, USB, 로컬 네트워크 OTA 또는 SSH로 업로드할 수 있습니다.

[VS Code Marketplace에서 설치](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Open VSX에서 설치](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [문서 읽기](../specifications/README.md)

## 사용 모습

아래 녹화는 현재 확장 기능 빌드로 실제 VS Code 창에서 직접 조작한 화면입니다.

**1. 편집기를 열고 보드를 선택합니다.** 활동 표시줄의 Singular Blockly 아이콘을 클릭한 다음 "보드 선택"에서 사용할 보드를 고릅니다.

![활동 표시줄에서 Blockly 편집기를 열고 Arduino Uno 선택](../images/readme/open-editor-and-select-board.gif)

**2. 블록을 끌어 놓고 코드가 바뀌는 것을 확인합니다.** 도구 상자의 블록을 "설정"과 "반복"으로 끌어 놓고 드롭다운으로 값을 바꿉니다. `src/main.cpp`를 편집기 옆에 열어 두면 생성되는 프로그램이 작업에 맞춰 바뀌는 모습을 볼 수 있습니다.

![끌어 놓기로 LED 깜빡이기 프로그램을 만들고 src/main.cpp가 갱신되는 모습](../images/readme/build-program-with-live-code.gif)

**3. 언어와 테마를 바꿉니다.** 화살표 버튼으로 도구 모음을 펼치고, 지구본 메뉴로 편집기 언어를 즉시 바꾸며, 테마 버튼으로 밝은 테마와 어두운 테마를 전환합니다.

![편집기를 번체 중국어와 어두운 테마로 전환](../images/readme/switch-language-and-theme.gif)

## 의견 보내기, 온라인 서비스 및 데이터 사용

Blockly 편집기 안의 "의견 보내기" 버튼, 명령 팔레트의 **Singular Blockly: 의견 보내기**, 또는 VS Code의 문제 보고 도구를 사용할 수 있습니다. GitHub 계정은 필요하지 않습니다. 양식을 열거나 작성하는 동안에는 네트워크 요청이 발생하지 않으며, 보내기 전에 전송할 내용 전체를 보여 주고 명시적인 확인을 요청합니다.

기본 환경 진단은 기본으로 켜져 있으며 끌 수 있습니다. 최근 구조화 이벤트는 기본으로 꺼져 있습니다. 전송 허용 목록에는 소스 코드, Blockly 작업 공간 내용, 생성된 코드, 파일 및 폴더 이름, 경로, 컴퓨터와 장치 식별자, 시리얼 포트, Wi-Fi 및 IP 정보, 환경 변수, 자격 증명, 원본 오류, 원본 로그가 포함되지 않습니다. 선택 사항인 스크린샷 1장은 로컬에서 다시 인코딩되어 원본 메타데이터가 제거되고, 1920픽셀과 3MiB 이내로 제한되며, 미리 보기 후 확인해야만 전송됩니다.

의견 보내기는 VS Code SecretStorage에 저장된 익명 비밀 값과 전용 Cloudflare D1/R2 서비스를 사용하며, 관리자 작업에는 비공개 GitHub 저장소를 사용합니다. 이는 사용자가 직접 시작하는 지원용 전송이며 원격 측정이나 분석이 아닙니다. 자세한 내용은 [개인정보 고지](../../PRIVACY.md), [지원 정책](../../SUPPORT.md), [의견 서비스 약관](../../TERMS.md), [보안 정책](../../SECURITY.md)을 참고하세요.

## Singular Blockly를 쓰는 이유

- **하나의 시각적 편집기, 세 가지 프로그래밍 흐름**: Arduino C++, CyberBrick MicroPython, TXT Controller Python.
- **하드웨어로 바로 업로드**: Arduino는 PlatformIO, CyberBrick은 USB 또는 페어링된 LAN OTA, TXT Controller는 SSH.
- **수업에 알맞은 도구**: 현지화된 예제, TXT 가상 컨트롤, I/O 테스트, 백업, 명확한 하드웨어 진단.
- **최신 Blockly 경험**: Blockly 13.4.0과 `@blockly/theme-modern`, 밝은/어두운 테마, 블록 검색, 터치 지원, 키보드 탐색, 의미 있는 컨트롤 레이블. 모두 오프라인에서 쓸 수 있도록 포함되어 있습니다.
- **안전한 프로젝트 파일**: 자동 저장, 백업 복구, 고립 블록 보호, 외부 작업 공간 편집의 실행 중 검증.
- **AI를 고려한 프로젝트**: 프로젝트 안의 Agent Skills가 코딩 에이전트에게 현재 보드, 작업 공간 형식, 블록 계약을 알려 줍니다.

## 빠른 시작

1. [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) 또는 [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly)에서 Singular Blockly를 설치합니다.
2. VS Code에서 쓰기 가능한 폴더를 엽니다.
3. 활동 표시줄의 Singular Blockly 아이콘을 클릭하거나, 명령 팔레트에서 **Singular Blockly: Blockly 편집기 열기**를 실행합니다.
4. 보드를 선택하고 도구 상자에서 프로그램을 만듭니다.
5. 생성된 파일(예: `src/main.cpp`)을 열어 코드를 확인한 다음 편집기 도구 모음의 업로드 버튼을 클릭합니다.

VS Code가 시작되면 Singular Blockly는 확장 기능 전용 저장소에 검증된 Python, 테스트된 버전 범위의 PlatformIO Core, `mpremote` 실행 환경을 준비하기 시작합니다. Blockly 편집기를 열면 편집을 막지 않고 실행 환경을 다시 확인합니다. Arduino는 기존처럼 제공자를 우선 사용합니다. VS Code는 `platformio.platformio-ide`를 사용하고, VSCodium 같은 Open VSX 환경은 `pioarduino.pioarduino-ide`를 사용할 수 있으며, Singular Core는 대체 경로입니다. 사용자 지정 관리형 실행 환경 폴더는 처음 사용할 때 비어 있어야 하며, 이를 통해 복구나 정리 과정에서 관련 없는 파일을 가져오지 않습니다.

<details>
<summary><b>VSIX 오프라인 설치</b></summary>

1. [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases)에서 최신 `.vsix`를 내려받습니다.
2. 명령 팔레트에서 **Extensions: Install from VSIX...**(확장: VSIX에서 설치)를 엽니다.
3. 내려받은 파일을 선택합니다.

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>CyberBrick USB 문제 해결</b></summary>

`mpremote`는 Singular 관리형 실행 환경에 자동으로 설치되므로 시스템 Python이 필요하지 않습니다. **PlatformIO 진단**을 열어 확인하거나 복구할 수 있습니다. PlatformIO 제공자 환경은 호환용 대체 경로로 남아 있으며 Singular Blockly가 제거하거나 정리하지 않습니다.

</details>

## 지원 보드

| 보드                          | 생성 코드        | 선택기 ID    | 업로드 / 실행 방식                                     |
| ----------------------------- | ---------------- | ------------ | ------------------------------------------------------ |
| Arduino Uno                   | `src/main.cpp`   | `uno`        | PlatformIO                                             |
| Arduino Nano                  | `src/main.cpp`   | `nano`       | PlatformIO                                             |
| Arduino Mega                  | `src/main.cpp`   | `mega`       | PlatformIO                                             |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`      | PlatformIO                                             |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`  | PlatformIO                                             |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick` | USB `mpremote` 또는 페어링된 LAN OTA → `/app/rc_main.py` |
| fischertechnik TXT Controller | `src/main.py`    | `txt`        | SSH + `python3` → `/tmp/singular_blockly/main.py`      |

Arduino 프로젝트는 `platformio.ini`를 유지합니다. CyberBrick과 TXT 프로젝트는 Python 흐름을 사용하며 필요하지 않으면 이 파일을 제거합니다.

## 주요 기능

### Arduino와 ESP32

- Arduino C++를 생성하고 `platformio.ini`를 자동으로 동기화합니다.
- 보드에 맞는 포트 감지와 해결 방법을 알려 주는 오류 메시지와 함께 PlatformIO로 컴파일하고 업로드합니다.
- VS Code 터미널에서 시리얼 출력을 모니터링합니다. ESP32 프로젝트는 예외 디코딩이 자동으로 켜집니다.
- I/O, PWM, 서보, 엔코더 모터, Wi-Fi/MQTT, Pixetto, HUSKYLENS 및 일반 프로그래밍 블록을 제공합니다.
- 실험적인 RC 수신 블록으로 ESP32 DevKit에서 CyberBrick ESP-NOW 리모컨 입력을 받을 수 있습니다.

### CyberBrick

- ESP32-C3용 MicroPython을 생성하며 GPIO, 내장 LED, 타이밍, Wi-Fi, X11/X12, ESP-NOW 리모컨 블록을 포함합니다.
- 기본은 USB이며, CyberBrick 톱니바퀴 메뉴에서 페어링된 로컬 네트워크 OTA 대상을 설정할 수 있습니다.
- 처음 OTA 설정은 USB로 완료합니다. OTA 업로드가 실패해도 자동으로 USB로 바꾸지 않으므로 교실에서 코드가 다른 장치로 가는 일을 막습니다.
- 네트워크 업로드 중에 호환되는 OTA 에이전트를 최신 상태로 유지합니다. 에이전트 업데이트 경고가 있어도 메인 프로그램 업로드는 취소되지 않습니다.
- VS Code 터미널에서 `mpremote`로 MicroPython `print()` 출력을 모니터링합니다.
- 현지화된 CyberBrick 예제를 둘러볼 수 있으며, 오프라인일 때는 포함된 예제를 사용합니다.
- Wi-Fi 비밀번호, OTA 토큰, 페어링 비밀 값은 VS Code SecretStorage에 저장됩니다. OTA 설정은 펌웨어, `/boot.py`, WebREPL 또는 관련 없는 장치 파일을 수정하지 않습니다.

[CyberBrick 자세히](../specifications/03-hardware-support/cyberbrick-micropython.md) · [확장 보드](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [RC 페어링](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- 하나의 설정 흐름과 동시에 실행되는 여러 TXT 프로세스 흐름을 작성합니다.
- SSH로 Python 프로그램을 업로드, 실행, 중지합니다.
- Blockly 편집기를 벗어나지 않고 연결을 설정하고 테스트합니다.
- 안정적으로 연결되는, 끌어서 옮길 수 있는 가상 버튼을 만듭니다.
- 통합 I/O 테스트 패널에서 모터, 출력, 센서를 테스트합니다.

TXT 비밀번호는 VS Code SecretStorage에 저장됩니다. 기본 대상은 `192.168.7.2`, 사용자 이름은 `ftc`이며 생성된 프로그램은 `/tmp/singular_blockly/main.py`로 업로드됩니다.

[TXT Controller 자세히](../specifications/03-hardware-support/txt-controller.md)

### AI 지원 작업 흐름

프로젝트 안의 Agent Skills가 Codex와 Claude Code에 현재 보드, 작업 공간 형식, 실행 환경에서 생성된 블록 계약을 알려 줍니다. 사용자가 Node.js 서버를 설치할 필요는 없습니다.

외부에서 `blockly/main.json`을 변경하면, 사용 중인 작업 공간에 반영하기 전에 일회용 Blockly 실행 환경에서 검증합니다. 잘못된 내용은 격리되고 마지막 유효 작업 공간이 복원됩니다.

[Agent Skills와 작업 공간 안전](../specifications/06-features/agent-skills.md)

## 프로젝트 파일

| 경로                    | 용도                                              |
| ----------------------- | ------------------------------------------------- |
| `blockly/main.json`     | 블록, 보드 선택, UI 상태의 기준 원본              |
| `blockly/main.json.bak` | 마지막 유효 작업 공간 백업                        |
| `src/main.cpp`          | 생성된 Arduino / ESP32 프로그램                   |
| `src/rc_main.py`        | 생성된 CyberBrick MicroPython 프로그램            |
| `src/main.py`           | 생성된 TXT Controller 프로그램                    |
| `platformio.ini`        | Arduino 전용 PlatformIO 환경 설정                 |

## 설정

설정은 VS Code 설정 UI에서 바꿀 수 있습니다. 아래 기본값은 확장 기능 매니페스트와 같습니다.

| 설정                                          | 기본값                                        | 용도                                       |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| `singularBlockly.managedRuntime.path`         | `""`                                          | 관리형 실행 환경용 폴더(선택)              |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | Blockly 프로젝트가 아닐 때의 안전 경고 숨기기 |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | TXT Controller 호스트                      |
| `singular-blockly.txt.username`               | `ftc`                                         | TXT SSH 사용자 이름                        |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | TXT 업로드 위치                            |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | TXT I/O 테스트 패널 기본 포트              |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | CyberBrick USB / 페어링된 OTA 장치 목록    |

Wi-Fi 비밀번호, OTA 토큰, 페어링 비밀 값, TXT 비밀번호는 `settings.json`이 아니라 VS Code SecretStorage에 저장됩니다. 문서와 로그에는 자리 표시자나 가린 값을 사용합니다. 실제 자격 증명을 프로젝트 파일이나 버그 보고에 붙여 넣지 마세요.

## 요구 사항

- VS Code 1.126.0 이상 또는 VSCodium 1.126.04524 이상. 이 버전을 설치하기 전에 오래된 편집기를 업그레이드하세요.
- 쓰기 권한이 있는 작업 공간 폴더.
- Arduino / ESP32: PlatformIO 제공자와 C/C++ 확장(`ms-vscode.cpptools`).
- CyberBrick: 일반 업로드와 첫 OTA 설정에는 USB, OTA에만 공유 로컬 네트워크가 필요합니다. 확장 기능은 활성화 후 자체 관리형 Python 환경에 `mpremote`를 준비하고 Blockly 편집기를 열 때 다시 확인합니다.
- TXT Controller: 컨트롤러에 네트워크로 접속할 수 있어야 하며, 장치에 Python 3와 `ftrobopy`가 있어야 합니다.

확장 기능 사용자는 Node.js가 필요하지 않습니다.

## 문서와 도움말

인터페이스는 15개 언어를 지원합니다: 영어, 번체 중국어, 일본어, 한국어, 독일어, 스페인어, 프랑스어, 이탈리아어, 폴란드어, 포르투갈어(브라질), 러시아어, 튀르키예어, 체코어, 헝가리어, 불가리아어. 자동 모드는 VS Code 표시 언어를 따르며, 편집기의 지구본 메뉴에서 언어를 즉시 바꿀 수도 있습니다. 이 README도 같은 15개 언어로 제공되니 페이지 위쪽의 언어 링크를 이용하세요.

- [통합 사양 문서](../specifications/README.md)
- [PlatformIO 진단과 안내형 복구](../specifications/06-features/platformio-diagnostics.md)
- [시리얼 모니터](../specifications/06-features/serial-monitor.md)
- [국제화](../specifications/02-internationalization/i18n.md)
- [사용자 화면 현지화 흐름](../specifications/02-internationalization/user-facing-localization.md)
- [변경 내역](../../CHANGELOG.md)
- [이슈 트래커](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [보안 정책](../../SECURITY.md)

예제 프로젝트: [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot). ESP-NOW로 원격 조종하는 로봇이며 영어와 번체 중국어 문서가 있습니다.

## 개발

개발 및 빌드 명령은 영어 [README](../../README.md#development)의 Development 섹션과 [CONTRIBUTING.md](../../CONTRIBUTING.md)를 참고하세요.

## 라이선스

[Apache License 2.0](../../LICENSE)에 따라 배포됩니다.
