# Singular Blockly

[English](../../README.md) · [繁體中文](README.zh-hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · **Polski** · [Português (Brasil)](README.pt-br.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [Čeština](README.cs.md) · [Magyar](README.hu.md) · [Български](README.bg.md)

> Ten dokument jest tłumaczeniem angielskiego pliku [README](../../README.md). W razie rozbieżności obowiązuje wersja angielska.

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Ikona Singular Blockly">
</p>

**Programowanie wizualne dla Arduino, CyberBrick i fischertechnik TXT Controller – bezpośrednio w VS Code.**

Twórz programy w Blockly, od razu oglądaj wygenerowany kod i wgrywaj go przez PlatformIO, USB, OTA w sieci lokalnej lub SSH.

[Zainstaluj z VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Zainstaluj z Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [Przeczytaj dokumentację](../specifications/README.md)

## Zobacz, jak to działa

Nagrania wykonano w prawdziwym oknie VS Code z bieżącą wersją rozszerzenia.

**1. Otwórz edytor i wybierz płytkę.** Kliknij ikonę Singular Blockly na pasku aktywności, a potem wybierz płytkę z listy „Wybierz płytkę”.

![Otwieranie edytora Blockly z paska aktywności i wybór Arduino Uno](../images/readme/open-editor-and-select-board.gif)

**2. Przeciągaj bloki i obserwuj kod.** Przeciągnij bloki z przybornika do „Konfiguracja” i „Pętla”, zmień wartości na listach rozwijanych i trzymaj `src/main.cpp` otwarty obok edytora, aby widzieć, jak wygenerowany program zmienia się w trakcie pracy.

![Budowanie programu migania diodą metodą przeciągnij i upuść, gdy src/main.cpp się aktualizuje](../images/readme/build-program-with-live-code.gif)

**3. Zmień język i motyw.** Rozwiń pasek narzędzi przyciskiem ze strzałką, zmień od razu język edytora w menu z globusem i przełącz motyw jasny lub ciemny przyciskiem motywu.

![Przełączanie edytora na chiński tradycyjny i ciemny motyw](../images/readme/switch-language-and-theme.gif)

## Opinie, usługi online i wykorzystanie danych

Użyj przycisku „Prześlij opinię” w edytorze Blockly, uruchom **Singular Blockly: Prześlij opinię** z palety poleceń albo skorzystaj z narzędzia zgłaszania problemów VS Code. Konto GitHub nie jest potrzebne. Otwarcie ani wypełnianie formularza nie wysyła żadnych żądań sieciowych; przed wysłaniem formularz pokazuje całą treść i prosi o wyraźne potwierdzenie.

Podstawowa diagnostyka środowiska jest domyślnie włączona i można ją wyłączyć. Ostatnie zdarzenia strukturalne są domyślnie wyłączone. Lista dozwolonych pól wyklucza kod źródłowy, zawartość obszaru roboczego Blockly, wygenerowany kod, nazwy plików i folderów, ścieżki, identyfikatory komputera i urządzeń, porty szeregowe, informacje o Wi-Fi i IP, zmienne środowiskowe, dane logowania oraz surowe błędy i logi. Jeden opcjonalny zrzut ekranu jest lokalnie ponownie kodowany, pozbawiany oryginalnych metadanych, ograniczany do 1920 pikseli i 3 MiB, pokazywany w podglądzie i wysyłany dopiero po potwierdzeniu.

Opinie korzystają z anonimowego sekretu przechowywanego w VS Code SecretStorage oraz z dedykowanej usługi Cloudflare D1/R2; opiekunowie pracują na prywatnym repozytorium GitHub. To wysyłanie danych do pomocy technicznej, uruchamiane przez użytkownika, nie jest telemetrią ani analityką. Zobacz [informację o prywatności](../../PRIVACY.md), [zasady wsparcia](../../SUPPORT.md), [warunki usługi opinii](../../TERMS.md) i [zasady bezpieczeństwa](../../SECURITY.md).

## Dlaczego Singular Blockly?

- **Jeden edytor wizualny, trzy sposoby programowania**: Arduino C++, CyberBrick MicroPython i TXT Controller Python.
- **Wgrywanie prosto na sprzęt**: PlatformIO dla Arduino, USB lub OTA w sparowanej sieci LAN dla CyberBrick oraz SSH dla TXT Controller.
- **Narzędzia do pracy w klasie**: zlokalizowane przykłady, wirtualne kontrolki TXT, testy wejść/wyjść, kopie zapasowe i czytelna diagnostyka sprzętu.
- **Nowoczesne Blockly**: Blockly 13.4.0 z `@blockly/theme-modern`, motywy jasny i ciemny, wyszukiwanie bloków, obsługa dotyku, nawigacja klawiaturą i opisowe etykiety kontrolek – wszystko dołączone do pracy offline.
- **Bezpieczne pliki projektu**: automatyczny zapis, odzyskiwanie z kopii zapasowych, ochrona przed osieroconymi blokami i sprawdzanie zewnętrznych zmian obszaru roboczego w czasie działania.
- **Projekty gotowe na AI**: lokalne Agent Skills projektu przekazują agentom programistycznym bieżącą płytkę, format obszaru roboczego i kontrakt bloków.

## Szybki start

1. Zainstaluj Singular Blockly z [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) lub [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly).
2. Otwórz w VS Code folder z prawem zapisu.
3. Kliknij ikonę Singular Blockly na pasku aktywności albo uruchom **Singular Blockly: Otwórz edytor Blockly** z palety poleceń.
4. Wybierz płytkę i zbuduj program z bloków z przybornika.
5. Otwórz wygenerowany plik (na przykład `src/main.cpp`), aby sprawdzić kod, a potem kliknij przycisk wgrywania na pasku narzędzi edytora.

Po uruchomieniu VS Code Singular Blockly zaczyna przygotowywać we własnej pamięci rozszerzenia zweryfikowany Python, PlatformIO Core z przetestowanego zakresu wersji oraz środowisko `mpremote`. Otwarcie edytora Blockly ponownie sprawdza to środowisko, nie blokując edycji. Arduino nadal najpierw korzysta z dostawcy: VS Code używa `platformio.platformio-ide`, a środowiska Open VSX, takie jak VSCodium, mogą używać `pioarduino.pioarduino-ide`; Singular Core jest rozwiązaniem zapasowym. Własny folder środowiska zarządzanego musi być pusty przy pierwszym użyciu, aby naprawa ani czyszczenie nie przejęły niezwiązanych plików.

<details>
<summary><b>Instalacja VSIX offline</b></summary>

1. Pobierz najnowszy plik `.vsix` z [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases).
2. Otwórz **Extensions: Install from VSIX...** (Rozszerzenia: Zainstaluj z pliku VSIX) z palety poleceń.
3. Wybierz pobrany plik.

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>Rozwiązywanie problemów z CyberBrick przez USB</b></summary>

`mpremote` instaluje się automatycznie w zarządzanym środowisku Singular, które nie wymaga systemowego Pythona. Otwórz **diagnostykę PlatformIO**, aby go sprawdzić lub naprawić. Środowisko dostawcy PlatformIO pozostaje zapasowym rozwiązaniem zgodności i Singular Blockly nigdy go nie usuwa ani nie czyści.

</details>

## Obsługiwane płytki

| Płytka                        | Generowany kod   | ID w selektorze | Wgrywanie / uruchamianie                                   |
| ----------------------------- | ---------------- | --------------- | ---------------------------------------------------------- |
| Arduino Uno                   | `src/main.cpp`   | `uno`           | PlatformIO                                                 |
| Arduino Nano                  | `src/main.cpp`   | `nano`          | PlatformIO                                                 |
| Arduino Mega                  | `src/main.cpp`   | `mega`          | PlatformIO                                                 |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`         | PlatformIO                                                 |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`     | PlatformIO                                                 |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick`    | USB `mpremote` lub OTA w sparowanej sieci LAN → `/app/rc_main.py` |
| fischertechnik TXT Controller | `src/main.py`    | `txt`           | SSH + `python3` → `/tmp/singular_blockly/main.py`          |

Projekty Arduino zachowują `platformio.ini`; projekty CyberBrick i TXT korzystają z Pythona i usuwają ten plik, gdy nie jest potrzebny.

## Najważniejsze funkcje

### Arduino i ESP32

- Generuje C++ dla Arduino i automatycznie synchronizuje `platformio.ini`.
- Kompiluje i wgrywa przez PlatformIO z wykrywaniem portu zależnym od płytki i komunikatami błędów, które mówią, co zrobić.
- Pokazuje wyjście portu szeregowego w terminalu VS Code; w projektach ESP32 dekodowanie wyjątków włącza się automatycznie.
- Zawiera bloki wejść/wyjść, PWM, serwa, silnika z enkoderem, Wi-Fi/MQTT, Pixetto, HUSKYLENS i standardowe bloki programistyczne.
- Odbiera na ESP32 DevKit sygnały z pilota CyberBrick przez ESP-NOW dzięki eksperymentalnym blokom odbiornika RC.

### CyberBrick

- Generuje MicroPython dla ESP32-C3, w tym bloki GPIO, wbudowanej diody LED, odmierzania czasu, Wi-Fi, X11/X12 i pilota ESP-NOW.
- Domyślnie używa USB; sparowany cel OTA w sieci lokalnej konfiguruje się w menu z kołem zębatym CyberBrick.
- Pierwszą konfigurację OTA wykonuje się przez USB. Nieudane wgrywanie przez OTA nigdy nie przełącza się automatycznie na USB, aby kod nie trafił na niewłaściwe urządzenie w klasie.
- Podczas wgrywania przez sieć utrzymuje aktualność zgodnych agentów OTA; ostrzeżenie o aktualizacji agenta nie anuluje wgrania programu głównego.
- Pokazuje wyjście `print()` MicroPythona przez `mpremote` w terminalu VS Code.
- Pozwala przeglądać zlokalizowane przykłady CyberBrick, z wbudowanymi przykładami na wypadek braku sieci.
- Przechowuje hasła Wi-Fi, tokeny OTA i sekrety parowania w VS Code SecretStorage. Konfiguracja OTA nie zmienia oprogramowania układowego, `/boot.py`, WebREPL ani innych plików na urządzeniu.

[Szczegóły CyberBrick](../specifications/03-hardware-support/cyberbrick-micropython.md) · [Płytki rozszerzeń](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [Parowanie RC](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- Twórz jeden przepływ konfiguracji i wiele równolegle działających przepływów procesów TXT.
- Wgrywaj, uruchamiaj i zatrzymuj programy w Pythonie przez SSH.
- Konfiguruj i testuj połączenie bez wychodzenia z edytora Blockly.
- Twórz przeciągane wirtualne przyciski ze stałymi powiązaniami.
- Testuj silniki, wyjścia i czujniki w zintegrowanym panelu testów wejść/wyjść.

Hasła TXT są przechowywane w VS Code SecretStorage. Domyślny cel to `192.168.7.2` z użytkownikiem `ftc`; wygenerowany program trafia do `/tmp/singular_blockly/main.py`.

[Szczegóły TXT Controller](../specifications/03-hardware-support/txt-controller.md)

### Praca wspierana przez AI

Lokalne Agent Skills projektu przekazują Codex i Claude Code bieżącą płytkę, format obszaru roboczego i kontrakt bloków wyznaczany w czasie działania. Użytkownik nie musi instalować serwera Node.js.

Zewnętrzne zmiany w `blockly/main.json` przechodzą przez jednorazowe środowiska Blockly, zanim trafią do aktywnego obszaru roboczego. Nieprawidłowa zawartość jest izolowana, a ostatni prawidłowy obszar roboczy zostaje przywrócony.

[Agent Skills i bezpieczeństwo obszaru roboczego](../specifications/06-features/agent-skills.md)

## Pliki projektu

| Ścieżka                 | Przeznaczenie                                                  |
| ----------------------- | -------------------------------------------------------------- |
| `blockly/main.json`     | Źródło prawdy dla bloków, wyboru płytki i stanu interfejsu     |
| `blockly/main.json.bak` | Kopia zapasowa ostatniego prawidłowego obszaru roboczego       |
| `src/main.cpp`          | Wygenerowany program Arduino / ESP32                           |
| `src/rc_main.py`        | Wygenerowany program MicroPython dla CyberBrick                |
| `src/main.py`           | Wygenerowany program dla TXT Controller                        |
| `platformio.ini`        | Konfiguracja środowiska PlatformIO, tylko dla Arduino          |

## Konfiguracja

Ustawienia są dostępne w interfejsie ustawień VS Code. Poniższe wartości domyślne odpowiadają manifestowi rozszerzenia.

| Ustawienie                                    | Domyślnie                                     | Przeznaczenie                                              |
| --------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `singularBlockly.managedRuntime.path`         | `""`                                          | Opcjonalny folder środowiska zarządzanego                  |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | Ukrycie ostrzeżenia bezpieczeństwa dla projektów spoza Blockly |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | Host TXT Controller                                        |
| `singular-blockly.txt.username`               | `ftc`                                         | Nazwa użytkownika SSH dla TXT                              |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | Miejsce docelowe wgrywania na TXT                          |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | Port bazowy panelu testów wejść/wyjść TXT                  |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | Rejestr urządzeń CyberBrick USB / sparowanych przez OTA    |

Hasła Wi-Fi, tokeny OTA, sekrety parowania i hasła TXT są przechowywane w VS Code SecretStorage, a nie w `settings.json`. Dokumentacja i logi używają symboli zastępczych lub zamaskowanych wartości; nigdy nie wklejaj prawdziwych danych logowania do plików projektu ani zgłoszeń błędów.

## Wymagania

- VS Code 1.126.0 lub nowszy albo VSCodium 1.126.04524 lub nowszy. Przed instalacją tej wersji zaktualizuj starsze edytory.
- Folder obszaru roboczego z prawem zapisu.
- Arduino / ESP32: dostawca PlatformIO i rozszerzenie C/C++ (`ms-vscode.cpptools`).
- CyberBrick: USB do zwykłego wgrywania i pierwszej konfiguracji OTA; wspólna sieć lokalna tylko dla OTA. Po aktywacji rozszerzenie przygotowuje `mpremote` we własnym zarządzanym środowisku Pythona i sprawdza je ponownie przy otwarciu edytora Blockly.
- TXT Controller: dostęp sieciowy do kontrolera oraz Python 3 i `ftrobopy` na urządzeniu.

Użytkownicy rozszerzenia nie potrzebują Node.js.

## Dokumentacja i pomoc

Interfejs jest dostępny w 15 językach: angielskim, chińskim tradycyjnym, japońskim, koreańskim, niemieckim, hiszpańskim, francuskim, włoskim, polskim, portugalskim (Brazylia), rosyjskim, tureckim, czeskim, węgierskim i bułgarskim. Tryb automatyczny podąża za językiem wyświetlania VS Code, a menu z globusem w edytorze pozwala od razu zmienić język. Ten plik README jest dostępny w tych samych 15 językach – skorzystaj z linków na górze strony.

- [Zintegrowane specyfikacje](../specifications/README.md)
- [Diagnostyka PlatformIO i naprawa z przewodnikiem](../specifications/06-features/platformio-diagnostics.md)
- [Monitor portu szeregowego](../specifications/06-features/serial-monitor.md)
- [Internacjonalizacja](../specifications/02-internationalization/i18n.md)
- [Proces lokalizacji interfejsu](../specifications/02-internationalization/user-facing-localization.md)
- [Dziennik zmian](../../CHANGELOG.md)
- [Zgłaszanie problemów](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [Zasady bezpieczeństwa](../../SECURITY.md)

Przykładowy projekt: [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot) – robot sterowany zdalnie przez ESP-NOW, z dokumentacją po angielsku i po chińsku (tradycyjnym).

## Rozwój

Polecenia dla programistów i budowania znajdziesz w sekcji Development angielskiego pliku [README](../../README.md#development) oraz w [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencja

Udostępniane na licencji [Apache License 2.0](../../LICENSE).
