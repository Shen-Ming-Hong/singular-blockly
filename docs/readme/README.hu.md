# Singular Blockly

[English](../../README.md) · [繁體中文](README.zh-hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-br.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [Čeština](README.cs.md) · **Magyar** · [Български](README.bg.md)

> Ez a dokumentum az angol [README](../../README.md) fordítása. Eltérés esetén az angol változat az irányadó.

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Singular Blockly ikon">
</p>

**Vizuális programozás Arduinóhoz, CyberBrickhez és a fischertechnik TXT Controllerhez – közvetlenül a VS Code-ban.**

Építs programot a Blockly segítségével, nézd meg azonnal a generált kódot, majd töltsd fel PlatformIO-val, USB-n, helyi hálózati OTA-val vagy SSH-n.

[Telepítés a VS Code Marketplace-ről](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Telepítés az Open VSX-ről](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [Dokumentáció](../specifications/README.md)

## Így működik

A felvételek egy valódi VS Code-ablakban készültek, a bővítmény jelenlegi változatával.

**1. Nyisd meg a szerkesztőt, és válaszd ki a táblát.** Kattints a Singular Blockly ikonra a tevékenységsávon, majd válaszd ki a táblát a „Válassz táblát” listából.

![A Blockly szerkesztő megnyitása a tevékenységsávról és az Arduino Uno kiválasztása](../images/readme/open-editor-and-select-board.gif)

**2. Húzd be a blokkokat, és kövesd a kódot.** Húzz blokkokat az eszköztárból a „Beállítás” és a „Ciklus” részbe, módosítsd az értékeket a legördülő listákkal, és tartsd nyitva a `src/main.cpp` fájlt a szerkesztő mellett, hogy lásd, hogyan változik munka közben a generált program.

![LED-villogtató program összeállítása húzással, miközben a src/main.cpp frissül](../images/readme/build-program-with-live-code.gif)

**3. Válts nyelvet és témát.** Bontsd ki az eszköztárat a nyíl gombbal, a földgömb menüvel azonnal válts a szerkesztő nyelvén, a téma gombbal pedig válts a világos és a sötét téma között.

![A szerkesztő átváltása hagyományos kínai nyelvre és sötét témára](../images/readme/switch-language-and-theme.gif)

## Visszajelzés, online szolgáltatások és adatkezelés

Használd a Blockly szerkesztő „Visszajelzés küldése” gombját, futtasd a **Singular Blockly: Visszajelzés küldése** parancsot a parancspalettáról, vagy használd a VS Code hibabejelentőjét. GitHub-fiók nem szükséges. Az űrlap megnyitása vagy kitöltése nem küld hálózati kérést; küldés előtt az űrlap megmutatja a teljes tartalmat, és kifejezett megerősítést kér.

Az alapvető környezeti diagnosztika alapértelmezetten be van kapcsolva, és kikapcsolható. A legutóbbi strukturált események alapértelmezetten ki vannak kapcsolva. Az engedélyezett mezők listája nem tartalmaz forráskódot, Blockly-munkaterület tartalmat, generált kódot, fájl- és mappaneveket, elérési utakat, gép- és eszközazonosítókat, soros portokat, Wi-Fi- és IP-adatokat, környezeti változókat, hitelesítő adatokat, nyers hibákat és nyers naplókat. Egy opcionális képernyőkép helyben újrakódolódik, az eredeti metaadatok törlődnek róla, legfeljebb 1920 pixel és 3 MiB lehet, előnézetben megjelenik, és csak megerősítés után kerül elküldésre.

A visszajelzés a VS Code SecretStorage-ban tárolt névtelen titkos kulcsot és egy külön Cloudflare D1/R2 szolgáltatást használ; a karbantartók munkájához egy privát GitHub-tárolót használunk. Ez a felhasználó által indított támogatási adatküldés nem telemetria és nem elemzés. Lásd az [adatvédelmi tájékoztatót](../../PRIVACY.md), a [támogatási szabályzatot](../../SUPPORT.md), a [visszajelzési szolgáltatás feltételeit](../../TERMS.md) és a [biztonsági szabályzatot](../../SECURITY.md).

## Miért a Singular Blockly?

- **Egy vizuális szerkesztő, háromféle programozás**: Arduino C++, CyberBrick MicroPython és TXT Controller Python.
- **Feltöltés közvetlenül a hardverre**: Arduinóhoz PlatformIO, CyberBrickhez USB vagy párosított LAN OTA, a TXT Controllerhez SSH.
- **Tanórára szánt eszközök**: honosított példák, virtuális TXT-vezérlők, I/O-teszt, biztonsági mentések és érthető hardverdiagnosztika.
- **Modern Blockly-élmény**: Blockly 13.4.0 a `@blockly/theme-modern` témával, világos és sötét téma, blokkkeresés, érintéses vezérlés, billentyűzetes navigáció és beszédes vezérlőfeliratok – mind a csomag része, internet nélkül is működik.
- **Biztonságos projektfájlok**: automatikus mentés, visszaállítás mentésből, árva blokkok elleni védelem és a munkaterület külső módosításainak futás közbeni ellenőrzése.
- **MI-re felkészített projektek**: a projektben tárolt Agent Skills átadja a kódoló ágenseknek az aktuális táblát, a munkaterület formátumát és a blokkszerződést.

## Gyors kezdés

1. Telepítsd a Singular Blocklyt a [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) vagy az [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly) oldaláról.
2. Nyiss meg a VS Code-ban egy írható mappát.
3. Kattints a Singular Blockly ikonra a tevékenységsávon, vagy futtasd a **Singular Blockly: Blockly szerkesztő megnyitása** parancsot a parancspalettáról.
4. Válassz táblát, és építsd fel a programot az eszköztár blokkjaiból.
5. Nyisd meg a generált fájlt (például `src/main.cpp`), nézd át a kódot, majd kattints a feltöltés gombra a szerkesztő eszköztárán.

A VS Code indulása után a Singular Blockly a bővítmény saját tárhelyén elkezdi előkészíteni az ellenőrzött Pythont, a tesztelt verziótartományba eső PlatformIO Core-t és az `mpremote` futtatókörnyezetet. A Blockly szerkesztő megnyitásakor a környezet újra ellenőrződik anélkül, hogy akadályozná a szerkesztést. Arduino esetén továbbra is a szolgáltató élvez elsőbbséget: a VS Code a `platformio.platformio-ide` bővítményt használja, az Open VSX-környezetek (például a VSCodium) a `pioarduino.pioarduino-ide` bővítményt használhatják; a Singular Core a tartalék megoldás. A felügyelt futtatókörnyezet egyéni mappájának első használatkor üresnek kell lennie, hogy a javítás vagy a takarítás ne vegyen át nem odatartozó fájlokat.

<details>
<summary><b>VSIX telepítése internet nélkül</b></summary>

1. Töltsd le a legújabb `.vsix` fájlt a [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases) oldalról.
2. Nyisd meg a parancspalettán az **Extensions: Install from VSIX...** (Bővítmények: Telepítés VSIX-ből) parancsot.
3. Válaszd ki a letöltött fájlt.

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>CyberBrick USB hibaelhárítás</b></summary>

Az `mpremote` automatikusan települ a Singular felügyelt futtatókörnyezetébe, amelyhez nem kell rendszerszintű Python. Nyisd meg a **PlatformIO diagnosztikát** az ellenőrzéshez vagy a javításhoz. A PlatformIO-szolgáltató környezete kompatibilitási tartalékként megmarad, és a Singular Blockly soha nem törli vagy takarítja.

</details>

## Támogatott táblák

| Tábla                         | Generált kód     | Választó azonosító | Feltöltés / futtatás                                      |
| ----------------------------- | ---------------- | ------------------ | --------------------------------------------------------- |
| Arduino Uno                   | `src/main.cpp`   | `uno`              | PlatformIO                                                |
| Arduino Nano                  | `src/main.cpp`   | `nano`             | PlatformIO                                                |
| Arduino Mega                  | `src/main.cpp`   | `mega`             | PlatformIO                                                |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`            | PlatformIO                                                |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`        | PlatformIO                                                |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick`       | USB `mpremote` vagy párosított LAN OTA → `/app/rc_main.py` |
| fischertechnik TXT Controller | `src/main.py`    | `txt`              | SSH + `python3` → `/tmp/singular_blockly/main.py`         |

Az Arduino-projektek megtartják a `platformio.ini` fájlt; a CyberBrick- és TXT-projektek Pythont használnak, és ha nincs rá szükség, törlik.

## Fő funkciók

### Arduino és ESP32

- Arduino C++ kódot generál, és automatikusan szinkronizálja a `platformio.ini` fájlt.
- PlatformIO-val fordít és tölt fel, a táblához igazított portfelismeréssel és teendőket megjelölő hibaüzenetekkel.
- A soros kimenetet egy VS Code-terminálban figyeli; ESP32-projekteknél a kivételek dekódolása automatikusan bekapcsol.
- I/O-, PWM-, szervó-, enkóderes motor-, Wi-Fi/MQTT-, Pixetto-, HUSKYLENS- és általános programozási blokkokat kínál.
- A kísérleti RC-vevő blokkokkal az ESP32 DevKit fogadni tudja a CyberBrick ESP-NOW távirányító jeleit.

### CyberBrick

- MicroPython kódot generál az ESP32-C3-hoz, GPIO-, beépített LED-, időzítési, Wi-Fi-, X11/X12- és ESP-NOW távirányító blokkokkal.
- Alapértelmezés szerint USB-t használ; a párosított helyi hálózati OTA-célt a CyberBrick fogaskerék menüjében állíthatod be.
- Az első OTA-beállítás USB-n történik. A sikertelen OTA-feltöltés soha nem vált automatikusan USB-re, így a kód nem kerül az osztályteremben rossz eszközre.
- Hálózati feltöltéskor naprakészen tartja a kompatibilis OTA-ügynököket; az ügynökfrissítési figyelmeztetés nem vonja vissza a főprogram feltöltését.
- A MicroPython `print()` kimenetét `mpremote` segítségével egy VS Code-terminálban figyeli.
- Honosított CyberBrick-példák között böngészhetsz, internet nélkül a csomagban lévő példákkal.
- A Wi-Fi-jelszavakat, OTA-tokeneket és párosítási titkokat a VS Code SecretStorage tárolja. Az OTA-beállítás nem módosítja a firmware-t, a `/boot.py` fájlt, a WebREPL-t vagy az eszköz egyéb fájljait.

[CyberBrick részletek](../specifications/03-hardware-support/cyberbrick-micropython.md) · [Bővítőpanelek](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [RC-párosítás](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- Készíts egy beállítási folyamatot és több, egyszerre futó TXT-folyamatot.
- Tölts fel, futtass és állíts le Python-programokat SSH-n.
- Állítsd be és teszteld a kapcsolatot a Blockly szerkesztő elhagyása nélkül.
- Hozz létre húzható virtuális gombokat állandó hozzárendeléssel.
- Teszteld a motorokat, kimeneteket és érzékelőket a beépített I/O-tesztpanelen.

A TXT-jelszavakat a VS Code SecretStorage tárolja. Az alapértelmezett cél a `192.168.7.2`, a felhasználónév `ftc`; a generált program a `/tmp/singular_blockly/main.py` helyre töltődik fel.

[TXT Controller részletek](../specifications/03-hardware-support/txt-controller.md)

### MI-vel támogatott munka

A projektben tárolt Agent Skills átadja a Codexnek és a Claude Code-nak az aktuális táblát, a munkaterület formátumát és a futásidőben levezetett blokkszerződést. Nem kell Node.js-kiszolgálót telepíteni.

A `blockly/main.json` külső módosításai eldobható Blockly-futtatókörnyezeteken mennek át, mielőtt az élő munkaterületre kerülnének. Az érvénytelen tartalom karanténba kerül, és az utolsó érvényes munkaterület áll vissza.

[Agent Skills és a munkaterület biztonsága](../specifications/06-features/agent-skills.md)

## Projektfájlok

| Elérési út              | Szerep                                                          |
| ----------------------- | --------------------------------------------------------------- |
| `blockly/main.json`     | A blokkok, a választott tábla és a felület állapotának forrása  |
| `blockly/main.json.bak` | Az utolsó érvényes munkaterület mentése                         |
| `src/main.cpp`          | Generált Arduino / ESP32 program                                |
| `src/rc_main.py`        | Generált CyberBrick MicroPython program                         |
| `src/main.py`           | Generált TXT Controller program                                 |
| `platformio.ini`        | Csak Arduinóhoz használt PlatformIO-környezetbeállítás          |

## Beállítások

A beállítások a VS Code Beállítások felületén érhetők el. Az alábbi alapértékek megegyeznek a bővítmény jegyzékével.

| Beállítás                                     | Alapérték                                     | Szerep                                                    |
| --------------------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| `singularBlockly.managedRuntime.path`         | `""`                                          | Opcionális mappa a felügyelt futtatókörnyezethez          |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | Nem Blockly-projekteknél elrejti a biztonsági figyelmeztetést |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | A TXT Controller címe                                     |
| `singular-blockly.txt.username`               | `ftc`                                         | TXT SSH-felhasználónév                                    |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | Feltöltési cél a TXT-n                                    |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | A TXT I/O-tesztpanel alapportja                           |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | CyberBrick USB / párosított OTA eszközjegyzék             |

A Wi-Fi-jelszavakat, OTA-tokeneket, párosítási titkokat és TXT-jelszavakat a VS Code SecretStorage tárolja, nem a `settings.json`. A dokumentáció és a naplók helyőrzőket vagy kitakart értékeket használnak; soha ne másolj valódi hitelesítő adatokat projektfájlokba vagy hibabejelentésekbe.

## Követelmények

- VS Code 1.126.0 vagy újabb, illetve VSCodium 1.126.04524 vagy újabb. A verzió telepítése előtt frissítsd a régebbi szerkesztőket.
- Írási joggal rendelkező munkaterület-mappa.
- Arduino / ESP32: PlatformIO-szolgáltató és a C/C++ bővítmény (`ms-vscode.cpptools`).
- CyberBrick: USB a normál feltöltéshez és az első OTA-beállításhoz; közös helyi hálózat csak az OTA-hoz. Aktiválás után a bővítmény a saját felügyelt Python-környezetében előkészíti az `mpremote` eszközt, és a Blockly szerkesztő megnyitásakor újra ellenőrzi.
- TXT Controller: hálózati hozzáférés a vezérlőhöz, az eszközön Python 3 és `ftrobopy`.

A bővítmény felhasználóinak nincs szükségük Node.js-re.

## Dokumentáció és súgó

A felület 15 nyelven érhető el: angol, hagyományos kínai, japán, koreai, német, spanyol, francia, olasz, lengyel, portugál (brazíliai), orosz, török, cseh, magyar és bolgár. Az automatikus mód a VS Code megjelenítési nyelvét követi, a szerkesztő földgömb menüjével pedig azonnal nyelvet válthatsz. Ez a README ugyanezen a 15 nyelven érhető el; használd az oldal tetején lévő nyelvi hivatkozásokat.

- [Egységes specifikációk](../specifications/README.md)
- [PlatformIO diagnosztika és vezetett javítás](../specifications/06-features/platformio-diagnostics.md)
- [Soros monitor](../specifications/06-features/serial-monitor.md)
- [Nemzetköziesítés](../specifications/02-internationalization/i18n.md)
- [A felület honosítási folyamata](../specifications/02-internationalization/user-facing-localization.md)
- [Változásnapló](../../CHANGELOG.md)
- [Hibakövető](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [Biztonsági szabályzat](../../SECURITY.md)

Példaprojekt: [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot) – ESP-NOW-val távvezérelt robot angol és hagyományos kínai dokumentációval.

## Fejlesztés

A fejlesztési és fordítási parancsok az angol [README](../../README.md#development) Development szakaszában és a [CONTRIBUTING.md](../../CONTRIBUTING.md) fájlban találhatók.

## Licenc

Az [Apache License 2.0](../../LICENSE) licenc alatt érhető el.
