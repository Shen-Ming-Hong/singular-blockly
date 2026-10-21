# Singular Blockly

[English](../../README.md) · [繁體中文](README.zh-hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · **Español** · [Français](README.fr.md) · [Italiano](README.it.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-br.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [Čeština](README.cs.md) · [Magyar](README.hu.md) · [Български](README.bg.md)

> Este documento es una traducción del [README](../../README.md) en inglés. Si hay diferencias, prevalece la versión en inglés.

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Icono de Singular Blockly">
</p>

**Programación visual para Arduino, CyberBrick y fischertechnik TXT Controller, dentro de VS Code.**

Crea programas con Blockly, revisa al instante el código generado y cárgalo mediante PlatformIO, USB, OTA en la red local o SSH.

[Instalar desde VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Instalar desde Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [Leer la documentación](../specifications/README.md)

## Míralo en acción

Estas grabaciones se hicieron en una ventana real de VS Code con la versión actual de la extensión.

**1. Abre el editor y elige una placa.** Haz clic en el icono de Singular Blockly en la barra de actividades y elige tu placa en «Seleccionar placa».

![Abrir el editor Blockly desde la barra de actividades y seleccionar Arduino Uno](../images/readme/open-editor-and-select-board.gif)

**2. Arrastra bloques y observa cómo cambia el código.** Arrastra bloques de la caja de herramientas a «Configuración» y «Bucle», cambia valores con los menús desplegables y deja `src/main.cpp` abierto junto al editor para ver cómo cambia el programa generado mientras trabajas.

![Crear un programa de parpadeo arrastrando bloques mientras src/main.cpp se actualiza](../images/readme/build-program-with-live-code.gif)

**3. Cambia el idioma y el tema.** Despliega la barra de herramientas con el botón de flecha, usa el menú del globo para cambiar el idioma del editor al instante y usa el botón de tema para alternar entre claro y oscuro.

![Cambiar el editor a chino tradicional y al tema oscuro](../images/readme/switch-language-and-theme.gif)

## Comentarios, servicios en línea y uso de datos

Usa el botón «Enviar comentarios» del editor Blockly, ejecuta **Singular Blockly: Enviar comentarios** desde la paleta de comandos o usa el informador de problemas de VS Code. No necesitas una cuenta de GitHub. Abrir o rellenar el formulario no realiza ninguna solicitud de red; antes de enviar, el formulario muestra todo el contenido y pide una confirmación explícita.

El diagnóstico básico del entorno está activado de forma predeterminada y se puede desactivar. Los eventos estructurados recientes están desactivados de forma predeterminada. La lista de campos permitidos excluye código fuente, contenido del área de trabajo de Blockly, código generado, nombres de archivos y carpetas, rutas, identificadores de equipos y dispositivos, puertos serie, información de Wi-Fi e IP, variables de entorno, credenciales, errores sin procesar y registros sin procesar. Una captura de pantalla opcional se vuelve a codificar localmente, se le quitan los metadatos originales, se limita a 1920 píxeles y 3 MiB, se muestra en vista previa y solo se envía tras la confirmación.

Los comentarios usan un secreto anónimo guardado en VS Code SecretStorage y un servicio dedicado de Cloudflare D1/R2; los mantenedores trabajan con un repositorio privado de GitHub. Este envío de soporte iniciado por el usuario no es telemetría ni analítica. Consulta el [aviso de privacidad](../../PRIVACY.md), la [política de soporte](../../SUPPORT.md), los [términos del servicio de comentarios](../../TERMS.md) y la [política de seguridad](../../SECURITY.md).

## ¿Por qué Singular Blockly?

- **Un editor visual, tres flujos de programación**: Arduino C++, CyberBrick MicroPython y TXT Controller Python.
- **Carga directa al hardware**: PlatformIO para Arduino, USB u OTA por LAN emparejada para CyberBrick y SSH para TXT Controller.
- **Herramientas pensadas para el aula**: ejemplos localizados, controles virtuales para TXT, pruebas de E/S, copias de seguridad y diagnósticos de hardware claros.
- **Experiencia Blockly moderna**: Blockly 13.4.0 con `@blockly/theme-modern`, temas claro y oscuro, búsqueda de bloques, soporte táctil, navegación con teclado y etiquetas de control descriptivas, todo incluido para uso sin conexión.
- **Archivos de proyecto seguros**: guardado automático, recuperación desde copias, protección contra bloques huérfanos y validación en tiempo de ejecución de los cambios externos al área de trabajo.
- **Proyectos preparados para IA**: los Agent Skills locales del proyecto dan a los agentes de programación la placa actual, el formato del área de trabajo y el contrato de bloques.

## Inicio rápido

1. Instala Singular Blockly desde [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) u [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly).
2. Abre en VS Code una carpeta con permisos de escritura.
3. Haz clic en el icono de Singular Blockly en la barra de actividades o ejecuta **Singular Blockly: Abrir editor de Blockly** desde la paleta de comandos.
4. Selecciona una placa y construye tu programa con la caja de herramientas.
5. Abre el archivo generado (por ejemplo, `src/main.cpp`) para revisar el código y luego haz clic en el botón de carga de la barra de herramientas del editor.

Al iniciar VS Code, Singular Blockly empieza a preparar en el almacenamiento propio de la extensión un Python verificado, PlatformIO Core dentro del rango de versiones probado y el entorno de `mpremote`. Al abrir el editor Blockly se vuelve a comprobar ese entorno sin bloquear la edición. Arduino sigue dando prioridad al proveedor: VS Code usa `platformio.platformio-ide`, mientras que los entornos de Open VSX como VSCodium pueden usar `pioarduino.pioarduino-ide`; Singular Core es la alternativa. Una carpeta personalizada para el entorno administrado debe estar vacía la primera vez que se usa, para que la reparación o la limpieza no adopten archivos ajenos.

<details>
<summary><b>Instalación sin conexión desde VSIX</b></summary>

1. Descarga el `.vsix` más reciente desde [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases).
2. Abre **Extensions: Install from VSIX...** (Extensiones: Instalar desde VSIX) en la paleta de comandos.
3. Selecciona el archivo descargado.

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>Solución de problemas de CyberBrick por USB</b></summary>

`mpremote` se instala automáticamente en el entorno administrado de Singular, que no necesita un Python del sistema. Abre el **diagnóstico de PlatformIO** para comprobarlo o repararlo. El entorno del proveedor de PlatformIO se mantiene como alternativa de compatibilidad y Singular Blockly nunca lo elimina ni lo limpia.

</details>

## Placas compatibles

| Placa                         | Código generado  | ID del selector | Carga / ejecución                                          |
| ----------------------------- | ---------------- | --------------- | ---------------------------------------------------------- |
| Arduino Uno                   | `src/main.cpp`   | `uno`           | PlatformIO                                                 |
| Arduino Nano                  | `src/main.cpp`   | `nano`          | PlatformIO                                                 |
| Arduino Mega                  | `src/main.cpp`   | `mega`          | PlatformIO                                                 |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`         | PlatformIO                                                 |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`     | PlatformIO                                                 |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick`    | USB `mpremote` u OTA por LAN emparejada → `/app/rc_main.py` |
| fischertechnik TXT Controller | `src/main.py`    | `txt`           | SSH + `python3` → `/tmp/singular_blockly/main.py`          |

Los proyectos de Arduino conservan `platformio.ini`; los de CyberBrick y TXT usan flujos de Python y lo eliminan cuando no hace falta.

## Flujos principales

### Arduino y ESP32

- Genera C++ para Arduino y sincroniza `platformio.ini` automáticamente.
- Compila y carga con PlatformIO, con detección de puertos según la placa y mensajes de error que indican qué hacer.
- Supervisa la salida serie en una terminal de VS Code; en los proyectos ESP32 la decodificación de excepciones se activa automáticamente.
- Incluye bloques de E/S, PWM, servo, motor con encoder, Wi-Fi/MQTT, Pixetto, HUSKYLENS y programación estándar.
- Recibe en un ESP32 DevKit la entrada del control remoto CyberBrick por ESP-NOW con los bloques experimentales de receptor RC.

### CyberBrick

- Genera MicroPython para el ESP32-C3, con bloques de GPIO, LED integrado, temporización, Wi-Fi, X11/X12 y control remoto ESP-NOW.
- Usa USB de forma predeterminada; configura un destino OTA emparejado en la red local desde el menú de engranaje de CyberBrick.
- La primera configuración de OTA se hace por USB. Si una carga OTA falla, nunca se pasa a USB automáticamente, para evitar que el código llegue al dispositivo equivocado del aula.
- Mantiene actualizados los agentes OTA compatibles durante las cargas por red; un aviso de actualización del agente no descarta la carga del programa principal.
- Supervisa la salida de `print()` de MicroPython mediante `mpremote` en una terminal de VS Code.
- Explora ejemplos localizados de CyberBrick, con ejemplos incluidos para usar sin conexión.
- Guarda las contraseñas de Wi-Fi, los tokens OTA y los secretos de emparejamiento en VS Code SecretStorage. La configuración OTA no modifica el firmware, `/boot.py`, WebREPL ni otros archivos del dispositivo.

[Detalles de CyberBrick](../specifications/03-hardware-support/cyberbrick-micropython.md) · [Placas de expansión](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [Emparejamiento RC](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- Crea un flujo de configuración y varios flujos de proceso TXT que se ejecutan a la vez.
- Carga, ejecuta y detiene programas Python por SSH.
- Configura y prueba la conexión sin salir del editor Blockly.
- Crea botones virtuales que se pueden arrastrar, con asignaciones estables.
- Prueba motores, salidas y sensores desde el panel integrado de pruebas de E/S.

Las contraseñas de TXT se guardan en VS Code SecretStorage. El destino predeterminado es `192.168.7.2` con el usuario `ftc`; el programa generado se carga en `/tmp/singular_blockly/main.py`.

[Detalles de TXT Controller](../specifications/03-hardware-support/txt-controller.md)

### Flujos asistidos por IA

Los Agent Skills locales del proyecto dan a Codex y Claude Code la placa actual, el formato del área de trabajo y el contrato de bloques derivado en tiempo de ejecución. No hace falta que el usuario instale un servidor Node.js.

Los cambios externos en `blockly/main.json` pasan por entornos Blockly desechables antes de llegar al área de trabajo activa. Los contenidos no válidos se ponen en cuarentena y se restaura la última área de trabajo válida.

[Agent Skills y seguridad del área de trabajo](../specifications/06-features/agent-skills.md)

## Archivos del proyecto

| Ruta                    | Función                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `blockly/main.json`     | Fuente principal de bloques, selección de placa y estado de la UI |
| `blockly/main.json.bak` | Copia de seguridad de la última área de trabajo válida           |
| `src/main.cpp`          | Programa generado para Arduino / ESP32                           |
| `src/rc_main.py`        | Programa MicroPython generado para CyberBrick                    |
| `src/main.py`           | Programa generado para TXT Controller                            |
| `platformio.ini`        | Configuración del entorno PlatformIO, solo para Arduino          |

## Configuración

Los ajustes están disponibles en la interfaz de configuración de VS Code. Los valores predeterminados coinciden con el manifiesto de la extensión.

| Ajuste                                        | Predeterminado                                | Función                                                    |
| --------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `singularBlockly.managedRuntime.path`         | `""`                                          | Carpeta opcional para el entorno administrado              |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | Ocultar la advertencia de seguridad en proyectos que no son de Blockly |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | Host del TXT Controller                                    |
| `singular-blockly.txt.username`               | `ftc`                                         | Usuario SSH del TXT                                        |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | Destino de carga en el TXT                                 |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | Puerto base del panel de pruebas de E/S del TXT            |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | Registro de dispositivos CyberBrick por USB / OTA emparejada |

Las contraseñas de Wi-Fi, los tokens OTA, los secretos de emparejamiento y las contraseñas de TXT se guardan en VS Code SecretStorage, no en `settings.json`. La documentación y los registros usan marcadores o valores ocultos; nunca pegues credenciales reales en archivos del proyecto ni en informes de errores.

## Requisitos

- VS Code 1.126.0 o posterior, o VSCodium 1.126.04524 o posterior. Actualiza los editores más antiguos antes de instalar esta versión.
- Una carpeta de trabajo con permisos de escritura.
- Arduino / ESP32: un proveedor de PlatformIO y la extensión C/C++ (`ms-vscode.cpptools`).
- CyberBrick: USB para la carga normal y la primera configuración de OTA; una red local compartida solo para OTA. La extensión prepara `mpremote` en su propio entorno Python administrado después de activarse y lo vuelve a comprobar al abrir el editor Blockly.
- TXT Controller: acceso de red al controlador, con Python 3 y `ftrobopy` disponibles en el dispositivo.

Los usuarios de la extensión no necesitan Node.js.

## Documentación y ayuda

La interfaz está disponible en 15 idiomas: inglés, chino tradicional, japonés, coreano, alemán, español, francés, italiano, polaco, portugués (Brasil), ruso, turco, checo, húngaro y búlgaro. El modo automático sigue el idioma de visualización de VS Code, y el menú del globo del editor permite cambiar de idioma al instante. Este README está disponible en los mismos 15 idiomas; usa los enlaces de idioma de la parte superior.

- [Especificaciones integradas](../specifications/README.md)
- [Diagnóstico de PlatformIO y reparación guiada](../specifications/06-features/platformio-diagnostics.md)
- [Monitor serie](../specifications/06-features/serial-monitor.md)
- [Internacionalización](../specifications/02-internationalization/i18n.md)
- [Flujo de localización de la interfaz](../specifications/02-internationalization/user-facing-localization.md)
- [Registro de cambios](../../CHANGELOG.md)
- [Seguimiento de incidencias](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [Política de seguridad](../../SECURITY.md)

Proyecto de ejemplo: [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot), un robot controlado a distancia por ESP-NOW con documentación en inglés y chino tradicional.

## Desarrollo

Consulta los comandos de desarrollo y compilación en la sección Development del [README](../../README.md#development) en inglés y en [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencia

Distribuido bajo la [Apache License 2.0](../../LICENSE).
