# Singular Blockly

[English](../../README.md) · [繁體中文](README.zh-hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Deutsch** · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-br.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [Čeština](README.cs.md) · [Magyar](README.hu.md) · [Български](README.bg.md)

> Dieses Dokument ist eine Übersetzung der englischen [README](../../README.md). Bei Abweichungen gilt die englische Fassung.

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Singular-Blockly-Symbol">
</p>

**Visuelle Programmierung für Arduino, CyberBrick und fischertechnik TXT Controller – direkt in VS Code.**

Erstelle Programme mit Blockly, sieh dir den erzeugten Code sofort an und lade ihn über PlatformIO, USB, OTA im lokalen Netzwerk oder SSH hoch.

[Im VS Code Marketplace installieren](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Bei Open VSX installieren](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [Dokumentation lesen](../specifications/README.md)

## So sieht es aus

Diese Aufnahmen entstanden in einem echten VS-Code-Fenster mit dem aktuellen Build der Erweiterung.

**1. Editor öffnen und Board auswählen.** Klicke in der Aktivitätsleiste auf das Singular-Blockly-Symbol und wähle dein Board unter „Board auswählen“.

![Blockly-Editor über die Aktivitätsleiste öffnen und Arduino Uno auswählen](../images/readme/open-editor-and-select-board.gif)

**2. Blöcke ziehen und den Code mitverfolgen.** Ziehe Blöcke aus der Werkzeugleiste in „Setup“ und „Schleife“, ändere Werte über die Auswahllisten und lass `src/main.cpp` neben dem Editor geöffnet, um zu sehen, wie sich das erzeugte Programm während der Arbeit ändert.

![Ein Blink-Programm per Drag-and-drop bauen, während sich src/main.cpp aktualisiert](../images/readme/build-program-with-live-code.gif)

**3. Sprache und Design wechseln.** Klappe die Symbolleiste mit der Pfeiltaste auf, wechsle die Editorsprache sofort über das Globus-Menü und schalte mit der Design-Taste zwischen hell und dunkel um.

![Editor auf traditionelles Chinesisch und das dunkle Design umstellen](../images/readme/switch-language-and-theme.gif)

## Feedback, Onlinedienste und Datennutzung

Nutze die deutlich beschriftete Schaltfläche „Feedback geben“ im Blockly-Editor, führe **Singular Blockly: Feedback geben** in der Befehlspalette aus oder verwende den Problembericht von VS Code. Ein GitHub-Konto ist nicht nötig. Das Öffnen oder Ausfüllen des Formulars sendet keine Netzwerkanfrage; vor dem Senden zeigt das Formular den vollständigen Inhalt an und bittet um ausdrückliche Bestätigung.

Grundlegende Umgebungsdiagnosen sind standardmäßig aktiviert und lassen sich abschalten. Aktuelle strukturierte Ereignisse sind standardmäßig deaktiviert. Die Liste der erlaubten Felder schließt Quellcode, Inhalte des Blockly-Arbeitsbereichs, erzeugten Code, Datei- und Ordnernamen, Pfade, Rechner- und Gerätekennungen, serielle Ports, WLAN- und IP-Informationen, Umgebungsvariablen, Zugangsdaten sowie unbearbeitete Fehlermeldungen und Protokolle aus. Ein optionaler Screenshot wird lokal neu codiert, von ursprünglichen Metadaten befreit, auf 1920 Pixel und 3 MiB begrenzt, als Vorschau angezeigt und erst nach Bestätigung gesendet.

Das Feedback verwendet ein anonymes Geheimnis im VS Code SecretStorage und einen eigenen Cloudflare-D1/R2-Dienst; für die Arbeit der Maintainer wird ein privates GitHub-Repository genutzt. Diese vom Benutzer ausgelöste Support-Übertragung ist keine Telemetrie und keine Analyse. Siehe [Datenschutzhinweis](../../PRIVACY.md), [Support-Richtlinie](../../SUPPORT.md), [Nutzungsbedingungen des Feedback-Dienstes](../../TERMS.md) und [Sicherheitsrichtlinie](../../SECURITY.md).

## Warum Singular Blockly?

- **Ein visueller Editor, drei Programmierabläufe**: Arduino C++, CyberBrick MicroPython und TXT Controller Python.
- **Direkt auf die Hardware hochladen**: PlatformIO für Arduino, USB oder gekoppeltes LAN-OTA für CyberBrick und SSH für den TXT Controller.
- **Werkzeuge für den Unterricht**: lokalisierte Beispiele, virtuelle TXT-Steuerelemente, I/O-Tests, Backups und klare Hardware-Diagnosen.
- **Modernes Blockly**: Blockly 13.4.0 mit `@blockly/theme-modern`, helles und dunkles Design, Blocksuche, Touch-Unterstützung, Tastaturnavigation und aussagekräftige Beschriftungen – alles für die Offline-Nutzung mitgeliefert.
- **Sichere Projektdateien**: automatisches Speichern, Wiederherstellung aus Backups, Schutz vor verwaisten Blöcken und Laufzeitprüfung externer Änderungen am Arbeitsbereich.
- **KI-fähige Projekte**: Projektlokale Agent Skills geben Coding-Agenten das aktuelle Board, das Arbeitsbereichsformat und den Blockvertrag.

## Schnellstart

1. Installiere Singular Blockly aus dem [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) oder von [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly).
2. Öffne in VS Code einen beschreibbaren Ordner.
3. Klicke in der Aktivitätsleiste auf das Singular-Blockly-Symbol oder führe in der Befehlspalette **Singular Blockly: Blockly-Editor öffnen** aus.
4. Wähle ein Board und baue dein Programm aus der Werkzeugleiste.
5. Öffne die erzeugte Datei (zum Beispiel `src/main.cpp`), um den Code zu prüfen, und klicke dann in der Symbolleiste des Editors auf die Upload-Schaltfläche.

Nach dem Start von VS Code beginnt Singular Blockly, im erweiterungseigenen Speicher ein geprüftes Python, PlatformIO Core aus dem getesteten Versionsbereich und `mpremote` bereitzustellen. Beim Öffnen des Blockly-Editors wird diese Laufzeitumgebung erneut geprüft, ohne das Bearbeiten zu blockieren. Arduino nutzt weiterhin zuerst den Anbieter: VS Code verwendet `platformio.platformio-ide`, Open-VSX-Umgebungen wie VSCodium können `pioarduino.pioarduino-ide` nutzen; der Singular Core ist der Ausweichweg. Ein eigener Ordner für die verwaltete Laufzeitumgebung muss bei der ersten Verwendung leer sein, damit Reparatur oder Bereinigung keine fremden Dateien übernehmen.

<details>
<summary><b>VSIX offline installieren</b></summary>

1. Lade die neueste `.vsix` von [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases) herunter.
2. Öffne in der Befehlspalette **Extensions: Install from VSIX...** (Erweiterungen: Aus VSIX installieren).
3. Wähle die heruntergeladene Datei aus.

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>Fehlerbehebung für CyberBrick über USB</b></summary>

`mpremote` wird automatisch in der verwalteten Singular-Laufzeitumgebung installiert; ein System-Python ist nicht nötig. Öffne die **PlatformIO-Diagnose**, um es zu prüfen oder zu reparieren. Die Umgebung des PlatformIO-Anbieters bleibt als Kompatibilitäts-Ausweichweg erhalten und wird von Singular Blockly nie entfernt oder bereinigt.

</details>

## Unterstützte Boards

| Board                         | Erzeugter Code   | Auswahl-ID   | Upload / Laufzeit                                       |
| ----------------------------- | ---------------- | ------------ | ------------------------------------------------------- |
| Arduino Uno                   | `src/main.cpp`   | `uno`        | PlatformIO                                              |
| Arduino Nano                  | `src/main.cpp`   | `nano`       | PlatformIO                                              |
| Arduino Mega                  | `src/main.cpp`   | `mega`       | PlatformIO                                              |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`      | PlatformIO                                              |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`  | PlatformIO                                              |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick` | USB `mpremote` oder gekoppeltes LAN-OTA → `/app/rc_main.py` |
| fischertechnik TXT Controller | `src/main.py`    | `txt`        | SSH + `python3` → `/tmp/singular_blockly/main.py`       |

Arduino-Projekte behalten `platformio.ini`; CyberBrick- und TXT-Projekte verwenden Python-Abläufe und entfernen die Datei, wenn sie nicht gebraucht wird.

## Wichtige Abläufe

### Arduino und ESP32

- Erzeugt Arduino C++ und synchronisiert `platformio.ini` automatisch.
- Kompiliert und lädt über PlatformIO hoch, mit boardabhängiger Porterkennung und verständlichen Fehlermeldungen.
- Zeigt die serielle Ausgabe in einem VS-Code-Terminal an; bei ESP32-Projekten wird die Exception-Dekodierung automatisch aktiviert.
- Bietet Blöcke für I/O, PWM, Servo, Encoder-Motor, WLAN/MQTT, Pixetto, HUSKYLENS und die üblichen Programmierbausteine.
- Empfängt mit den experimentellen RC-Empfängerblöcken Fernsteuerungseingaben von CyberBrick über ESP-NOW auf einem ESP32 DevKit.

### CyberBrick

- Erzeugt MicroPython für den ESP32-C3, einschließlich GPIO, Onboard-LED, Zeitsteuerung, WLAN, X11/X12 und ESP-NOW-Fernsteuerungsblöcken.
- Standardmäßig wird USB verwendet; ein gekoppeltes OTA-Ziel im lokalen Netzwerk lässt sich im Zahnradmenü von CyberBrick einrichten.
- Die erste OTA-Einrichtung erfolgt über USB. Fehlgeschlagene OTA-Uploads fallen nie automatisch auf USB zurück, damit Code im Klassenzimmer nicht auf dem falschen Gerät landet.
- Hält kompatible OTA-Agenten bei Netzwerk-Uploads aktuell; eine Warnung zum Agenten-Update verwirft den Upload des Hauptprogramms nicht.
- Zeigt die `print()`-Ausgabe von MicroPython über `mpremote` in einem VS-Code-Terminal an.
- Durchsucht lokalisierte CyberBrick-Beispiele, mit mitgelieferten Beispielen für den Offline-Fall.
- Speichert WLAN-Passwörter, OTA-Token und Kopplungsgeheimnisse im VS Code SecretStorage. Die OTA-Einrichtung verändert weder Firmware noch `/boot.py`, WebREPL oder andere Dateien auf dem Gerät.

[CyberBrick im Detail](../specifications/03-hardware-support/cyberbrick-micropython.md) · [Erweiterungsboards](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [RC-Kopplung](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- Erstelle einen Setup-Ablauf und mehrere gleichzeitig laufende TXT-Prozessabläufe.
- Lade Python-Programme über SSH hoch, starte und stoppe sie.
- Richte die Verbindung ein und teste sie, ohne den Blockly-Editor zu verlassen.
- Erstelle verschiebbare virtuelle Tasten mit stabilen Zuordnungen.
- Teste Motoren, Ausgänge und Sensoren im integrierten I/O-Testbereich.

TXT-Passwörter werden im VS Code SecretStorage gespeichert. Das Standardziel ist `192.168.7.2` mit dem Benutzernamen `ftc`; das erzeugte Programm wird nach `/tmp/singular_blockly/main.py` hochgeladen.

[TXT Controller im Detail](../specifications/03-hardware-support/txt-controller.md)

### KI-gestützte Abläufe

Projektlokale Agent Skills geben Codex und Claude Code das aktuelle Board, das Arbeitsbereichsformat und den zur Laufzeit abgeleiteten Blockvertrag. Ein vom Benutzer installierter Node.js-Server ist nicht nötig.

Externe Änderungen an `blockly/main.json` werden in kurzlebigen Blockly-Laufzeitumgebungen geprüft, bevor sie den aktiven Arbeitsbereich erreichen. Ungültige Inhalte werden isoliert und der letzte gültige Arbeitsbereich wird wiederhergestellt.

[Agent Skills und Sicherheit des Arbeitsbereichs](../specifications/06-features/agent-skills.md)

## Projektdateien

| Pfad                    | Zweck                                                        |
| ----------------------- | ------------------------------------------------------------ |
| `blockly/main.json`     | Maßgebliche Quelle für Blöcke, Boardauswahl und UI-Zustand   |
| `blockly/main.json.bak` | Backup des letzten gültigen Arbeitsbereichs                  |
| `src/main.cpp`          | Erzeugtes Arduino-/ESP32-Programm                            |
| `src/rc_main.py`        | Erzeugtes CyberBrick-MicroPython-Programm                    |
| `src/main.py`           | Erzeugtes TXT-Controller-Programm                            |
| `platformio.ini`        | PlatformIO-Umgebung, nur für Arduino                         |

## Konfiguration

Die Einstellungen sind über die Einstellungsoberfläche von VS Code erreichbar. Die Standardwerte unten entsprechen dem Manifest der Erweiterung.

| Einstellung                                   | Standard                                      | Zweck                                                   |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| `singularBlockly.managedRuntime.path`         | `""`                                          | Optionaler Ordner für die verwaltete Laufzeitumgebung   |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | Sicherheitswarnung für Nicht-Blockly-Projekte ausblenden |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | Host des TXT Controllers                                |
| `singular-blockly.txt.username`               | `ftc`                                         | SSH-Benutzername für TXT                                |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | Upload-Ziel auf dem TXT                                 |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | Basisport des TXT-I/O-Testbereichs                      |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | Geräteliste für CyberBrick USB / gekoppeltes OTA        |

WLAN-Passwörter, OTA-Token, Kopplungsgeheimnisse und TXT-Passwörter werden im VS Code SecretStorage gespeichert, nicht in `settings.json`. Dokumentation und Protokolle verwenden Platzhalter oder geschwärzte Werte; füge niemals echte Zugangsdaten in Projektdateien oder Fehlerberichte ein.

## Voraussetzungen

- VS Code 1.126.0 oder neuer bzw. VSCodium 1.126.04524 oder neuer. Aktualisiere ältere Editoren, bevor du diese Version installierst.
- Ein Arbeitsbereichsordner mit Schreibzugriff.
- Arduino / ESP32: ein PlatformIO-Anbieter und die C/C++-Erweiterung (`ms-vscode.cpptools`).
- CyberBrick: USB für normale Uploads und die erste OTA-Einrichtung; ein gemeinsames lokales Netzwerk nur für OTA. Die Erweiterung stellt `mpremote` nach der Aktivierung in ihrer eigenen verwalteten Python-Umgebung bereit und prüft es beim Öffnen des Blockly-Editors erneut.
- TXT Controller: Netzwerkzugriff auf den Controller sowie Python 3 und `ftrobopy` auf dem Gerät.

Benutzer der Erweiterung brauchen kein Node.js.

## Dokumentation und Hilfe

Die Oberfläche gibt es in 15 Sprachen: Englisch, traditionelles Chinesisch, Japanisch, Koreanisch, Deutsch, Spanisch, Französisch, Italienisch, Polnisch, Portugiesisch (Brasilien), Russisch, Türkisch, Tschechisch, Ungarisch und Bulgarisch. Der automatische Modus folgt der Anzeigesprache von VS Code; über das Globus-Menü des Editors lässt sich die Sprache sofort wechseln. Diese README gibt es in denselben 15 Sprachen – siehe die Sprachlinks oben.

- [Integrierte Spezifikationen](../specifications/README.md)
- [PlatformIO-Diagnose und geführte Reparatur](../specifications/06-features/platformio-diagnostics.md)
- [Serieller Monitor](../specifications/06-features/serial-monitor.md)
- [Internationalisierung](../specifications/02-internationalization/i18n.md)
- [Lokalisierung der Benutzeroberfläche](../specifications/02-internationalization/user-facing-localization.md)
- [Änderungsprotokoll](../../CHANGELOG.md)
- [Issue-Tracker](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [Sicherheitsrichtlinie](../../SECURITY.md)

Beispielprojekt: [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot) – ein per ESP-NOW ferngesteuerter Roboter mit Dokumentation auf Englisch und traditionellem Chinesisch.

## Entwicklung

Entwicklungs- und Build-Befehle findest du im Abschnitt Development der englischen [README](../../README.md#development) und in [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Lizenz

Lizenziert unter der [Apache License 2.0](../../LICENSE).
