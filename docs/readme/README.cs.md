# Singular Blockly

[English](../../README.md) · [繁體中文](README.zh-hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-br.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · **Čeština** · [Magyar](README.hu.md) · [Български](README.bg.md)

> Tento dokument je překladem anglického [README](../../README.md). Při rozdílech platí anglická verze.

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Ikona Singular Blockly">
</p>

**Vizuální programování pro Arduino, CyberBrick a fischertechnik TXT Controller přímo ve VS Code.**

Skládejte programy v Blockly, hned uvidíte vygenerovaný kód a nahrajete ho přes PlatformIO, USB, OTA v místní síti nebo SSH.

[Nainstalovat z VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Nainstalovat z Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [Číst dokumentaci](../specifications/README.md)

## Jak to vypadá

Tyto záznamy vznikly ve skutečném okně VS Code s aktuálním sestavením rozšíření.

**1. Otevřete editor a vyberte desku.** Klikněte na ikonu Singular Blockly na panelu aktivit a v nabídce „Vybrat desku“ zvolte svou desku.

![Otevření editoru Blockly z panelu aktivit a výběr Arduino Uno](../images/readme/open-editor-and-select-board.gif)

**2. Přetahujte bloky a sledujte kód.** Přetáhněte bloky ze sady nástrojů do „Nastavení“ a „Smyčka“, měňte hodnoty v rozbalovacích nabídkách a nechte `src/main.cpp` otevřený vedle editoru, abyste viděli, jak se vygenerovaný program mění během práce.

![Sestavení programu pro blikání LED přetahováním, zatímco se src/main.cpp aktualizuje](../images/readme/build-program-with-live-code.gif)

**3. Přepněte jazyk a motiv.** Rozbalte panel nástrojů tlačítkem se šipkou, v nabídce se zeměkoulí okamžitě změňte jazyk editoru a tlačítkem motivu přepínejte mezi světlým a tmavým.

![Přepnutí editoru do tradiční čínštiny a tmavého motivu](../images/readme/switch-language-and-theme.gif)

## Zpětná vazba, online služby a použití dat

Použijte tlačítko „Odeslat zpětnou vazbu“ v editoru Blockly, spusťte **Singular Blockly: Odeslat zpětnou vazbu** z palety příkazů nebo použijte nástroj pro hlášení problémů ve VS Code. Účet na GitHubu není potřeba. Otevření ani vyplňování formuláře neodesílá žádný síťový požadavek; před odesláním formulář zobrazí celý obsah a požádá o výslovné potvrzení.

Základní diagnostika prostředí je ve výchozím stavu zapnutá a lze ji vypnout. Nedávné strukturované události jsou ve výchozím stavu vypnuté. Seznam povolených položek vylučuje zdrojový kód, obsah pracovní plochy Blockly, vygenerovaný kód, názvy souborů a složek, cesty, identifikátory počítače a zařízení, sériové porty, informace o Wi-Fi a IP, proměnné prostředí, přihlašovací údaje a nezpracované chyby a protokoly. Jeden volitelný snímek obrazovky se místně znovu zakóduje, odstraní se z něj původní metadata, omezí se na 1920 pixelů a 3 MiB, zobrazí se náhled a odešle se až po potvrzení.

Zpětná vazba používá anonymní tajný klíč uložený ve VS Code SecretStorage a vyhrazenou službu Cloudflare D1/R2; správci pracují se soukromým repozitářem na GitHubu. Tento přenos pro podporu, který spouští sám uživatel, není telemetrie ani analytika. Viz [oznámení o ochraně soukromí](../../PRIVACY.md), [zásady podpory](../../SUPPORT.md), [podmínky služby zpětné vazby](../../TERMS.md) a [bezpečnostní zásady](../../SECURITY.md).

## Proč Singular Blockly?

- **Jeden vizuální editor, tři způsoby programování**: Arduino C++, CyberBrick MicroPython a TXT Controller Python.
- **Nahrávání přímo do hardwaru**: PlatformIO pro Arduino, USB nebo OTA ve spárované LAN pro CyberBrick a SSH pro TXT Controller.
- **Nástroje pro výuku**: lokalizované příklady, virtuální ovládací prvky TXT, testování vstupů a výstupů, zálohy a srozumitelná diagnostika hardwaru.
- **Moderní Blockly**: Blockly 13.4.0 s `@blockly/theme-modern`, světlý a tmavý motiv, hledání bloků, podpora dotyku, ovládání klávesnicí a výstižné popisky ovládacích prvků – vše přibaleno pro práci offline.
- **Bezpečné soubory projektu**: automatické ukládání, obnova ze záloh, ochrana před osamocenými bloky a kontrola externích úprav pracovní plochy za běhu.
- **Projekty připravené na AI**: Agent Skills uložené v projektu předávají programovacím agentům aktuální desku, formát pracovní plochy a kontrakt bloků.

## Rychlý start

1. Nainstalujte Singular Blockly z [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) nebo z [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly).
2. Otevřete ve VS Code složku s právem zápisu.
3. Klikněte na ikonu Singular Blockly na panelu aktivit nebo spusťte **Singular Blockly: Otevřít editor Blockly** z palety příkazů.
4. Vyberte desku a sestavte program z bloků v sadě nástrojů.
5. Otevřete vygenerovaný soubor (například `src/main.cpp`), zkontrolujte kód a pak klikněte na tlačítko nahrání na panelu nástrojů editoru.

Po spuštění VS Code začne Singular Blockly v úložišti patřícím rozšíření připravovat ověřený Python, PlatformIO Core z otestovaného rozsahu verzí a prostředí `mpremote`. Při otevření editoru Blockly se prostředí znovu zkontroluje, aniž by blokovalo úpravy. Arduino dál nejprve používá poskytovatele: VS Code používá `platformio.platformio-ide`, prostředí Open VSX, například VSCodium, mohou používat `pioarduino.pioarduino-ide`; Singular Core je záložní cesta. Vlastní složka spravovaného prostředí musí být při prvním použití prázdná, aby oprava ani úklid nepřevzaly nesouvisející soubory.

<details>
<summary><b>Instalace VSIX offline</b></summary>

1. Stáhněte nejnovější `.vsix` z [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases).
2. Otevřete z palety příkazů **Extensions: Install from VSIX...** (Rozšíření: Nainstalovat z VSIX).
3. Vyberte stažený soubor.

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>Řešení potíží s CyberBrick přes USB</b></summary>

`mpremote` se automaticky instaluje do spravovaného prostředí Singular, které nepotřebuje systémový Python. Otevřete **diagnostiku PlatformIO** a zkontrolujte nebo opravte ho. Prostředí poskytovatele PlatformIO zůstává jako záložní cesta kvůli kompatibilitě a Singular Blockly ho nikdy neodstraní ani neuklidí.

</details>

## Podporované desky

| Deska                         | Generovaný kód   | ID ve výběru | Nahrávání / spouštění                                     |
| ----------------------------- | ---------------- | ------------ | --------------------------------------------------------- |
| Arduino Uno                   | `src/main.cpp`   | `uno`        | PlatformIO                                                |
| Arduino Nano                  | `src/main.cpp`   | `nano`       | PlatformIO                                                |
| Arduino Mega                  | `src/main.cpp`   | `mega`       | PlatformIO                                                |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`      | PlatformIO                                                |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`  | PlatformIO                                                |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick` | USB `mpremote` nebo OTA ve spárované LAN → `/app/rc_main.py` |
| fischertechnik TXT Controller | `src/main.py`    | `txt`        | SSH + `python3` → `/tmp/singular_blockly/main.py`         |

Projekty Arduino ponechávají `platformio.ini`; projekty CyberBrick a TXT používají Python a soubor odstraní, když není potřeba.

## Hlavní funkce

### Arduino a ESP32

- Generuje C++ pro Arduino a automaticky synchronizuje `platformio.ini`.
- Kompiluje a nahrává přes PlatformIO s detekcí portu podle desky a chybovými hlášeními, která říkají, co dělat.
- Zobrazuje sériový výstup v terminálu VS Code; u projektů ESP32 se automaticky zapíná dekódování výjimek.
- Nabízí bloky pro vstupy a výstupy, PWM, servo, motor s enkodérem, Wi-Fi/MQTT, Pixetto, HUSKYLENS a standardní programování.
- Experimentální bloky přijímače RC umožní desce ESP32 DevKit přijímat vstupy z dálkového ovladače CyberBrick přes ESP-NOW.

### CyberBrick

- Generuje MicroPython pro ESP32-C3 včetně bloků GPIO, vestavěné LED, časování, Wi-Fi, X11/X12 a dálkového ovládání ESP-NOW.
- Ve výchozím stavu používá USB; spárovaný cíl OTA v místní síti nastavíte v nabídce s ozubeným kolem CyberBrick.
- První nastavení OTA se dokončuje přes USB. Neúspěšné nahrání přes OTA se nikdy automaticky nepřepne na USB, aby se kód ve třídě nedostal do nesprávného zařízení.
- Při nahrávání přes síť udržuje kompatibilní agenty OTA aktuální; varování o aktualizaci agenta nezruší nahrání hlavního programu.
- Zobrazuje výstup `print()` z MicroPythonu přes `mpremote` v terminálu VS Code.
- Umožňuje procházet lokalizované příklady CyberBrick, offline s přibalenými příklady.
- Hesla Wi-Fi, tokeny OTA a tajné klíče párování ukládá do VS Code SecretStorage. Nastavení OTA nemění firmware, `/boot.py`, WebREPL ani jiné soubory v zařízení.

[Podrobnosti o CyberBrick](../specifications/03-hardware-support/cyberbrick-micropython.md) · [Rozšiřující desky](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [Párování RC](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- Vytvořte jeden postup nastavení a více současně běžících procesních postupů TXT.
- Nahrávejte, spouštějte a zastavujte programy v Pythonu přes SSH.
- Nastavte a otestujte připojení, aniž byste opustili editor Blockly.
- Vytvářejte přetahovatelná virtuální tlačítka se stálými vazbami.
- Testujte motory, výstupy a senzory v integrovaném panelu testů vstupů a výstupů.

Hesla TXT se ukládají do VS Code SecretStorage. Výchozí cíl je `192.168.7.2` s uživatelským jménem `ftc`; vygenerovaný program se nahraje do `/tmp/singular_blockly/main.py`.

[Podrobnosti o TXT Controller](../specifications/03-hardware-support/txt-controller.md)

### Práce s pomocí AI

Agent Skills uložené v projektu předávají nástrojům Codex a Claude Code aktuální desku, formát pracovní plochy a kontrakt bloků odvozený za běhu. Uživatel nemusí instalovat žádný server Node.js.

Externí změny souboru `blockly/main.json` projdou jednorázovými prostředími Blockly, než se dostanou do aktivní pracovní plochy. Neplatný obsah se umístí do karantény a obnoví se poslední platná pracovní plocha.

[Agent Skills a bezpečnost pracovní plochy](../specifications/06-features/agent-skills.md)

## Soubory projektu

| Cesta                   | Účel                                                         |
| ----------------------- | ------------------------------------------------------------ |
| `blockly/main.json`     | Hlavní zdroj bloků, výběru desky a stavu rozhraní            |
| `blockly/main.json.bak` | Záloha poslední platné pracovní plochy                       |
| `src/main.cpp`          | Vygenerovaný program pro Arduino / ESP32                     |
| `src/rc_main.py`        | Vygenerovaný program MicroPython pro CyberBrick              |
| `src/main.py`           | Vygenerovaný program pro TXT Controller                      |
| `platformio.ini`        | Nastavení prostředí PlatformIO, jen pro Arduino              |

## Nastavení

Nastavení najdete v rozhraní Nastavení ve VS Code. Výchozí hodnoty níže odpovídají manifestu rozšíření.

| Nastavení                                     | Výchozí                                       | Účel                                                       |
| --------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `singularBlockly.managedRuntime.path`         | `""`                                          | Volitelná složka pro spravované prostředí                  |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | Skrýt bezpečnostní varování u projektů mimo Blockly        |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | Adresa TXT Controller                                      |
| `singular-blockly.txt.username`               | `ftc`                                         | Uživatelské jméno SSH pro TXT                              |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | Cíl nahrání na TXT                                         |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | Základní port panelu testů vstupů a výstupů TXT            |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | Seznam zařízení CyberBrick pro USB / spárované OTA         |

Hesla Wi-Fi, tokeny OTA, tajné klíče párování a hesla TXT se ukládají do VS Code SecretStorage, ne do `settings.json`. Dokumentace a protokoly používají zástupné nebo skryté hodnoty; nikdy nevkládejte skutečné přihlašovací údaje do souborů projektu ani do hlášení chyb.

## Požadavky

- VS Code 1.126.0 nebo novější, případně VSCodium 1.126.04524 nebo novější. Před instalací této verze aktualizujte starší editory.
- Složka pracovní plochy s právem zápisu.
- Arduino / ESP32: poskytovatel PlatformIO a rozšíření C/C++ (`ms-vscode.cpptools`).
- CyberBrick: USB pro běžné nahrávání a první nastavení OTA; sdílená místní síť jen pro OTA. Po aktivaci rozšíření připraví `mpremote` ve vlastním spravovaném prostředí Pythonu a při otevření editoru Blockly ho znovu zkontroluje.
- TXT Controller: síťový přístup k řídicí jednotce a v zařízení Python 3 a `ftrobopy`.

Uživatelé rozšíření nepotřebují Node.js.

## Dokumentace a nápověda

Rozhraní je k dispozici v 15 jazycích: angličtině, tradiční čínštině, japonštině, korejštině, němčině, španělštině, francouzštině, italštině, polštině, portugalštině (Brazílie), ruštině, turečtině, češtině, maďarštině a bulharštině. Automatický režim se řídí jazykem zobrazení VS Code a nabídka se zeměkoulí v editoru jazyk okamžitě přepne. Toto README je k dispozici ve stejných 15 jazycích; použijte odkazy na jazyky v horní části stránky.

- [Souhrnné specifikace](../specifications/README.md)
- [Diagnostika PlatformIO a řízená oprava](../specifications/06-features/platformio-diagnostics.md)
- [Sériový monitor](../specifications/06-features/serial-monitor.md)
- [Internacionalizace](../specifications/02-internationalization/i18n.md)
- [Postup lokalizace rozhraní](../specifications/02-internationalization/user-facing-localization.md)
- [Seznam změn](../../CHANGELOG.md)
- [Hlášení problémů](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [Bezpečnostní zásady](../../SECURITY.md)

Ukázkový projekt: [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot) – robot dálkově ovládaný přes ESP-NOW s dokumentací v angličtině a tradiční čínštině.

## Vývoj

Příkazy pro vývoj a sestavení najdete v sekci Development anglického [README](../../README.md#development) a v [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licence

Šířeno pod licencí [Apache License 2.0](../../LICENSE).
