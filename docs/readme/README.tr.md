# Singular Blockly

[English](../../README.md) · [繁體中文](README.zh-hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-br.md) · [Русский](README.ru.md) · **Türkçe** · [Čeština](README.cs.md) · [Magyar](README.hu.md) · [Български](README.bg.md)

> Bu belge İngilizce [README](../../README.md) dosyasının çevirisidir. Farklılık olursa İngilizce sürüm esas alınır.

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Singular Blockly simgesi">
</p>

**Arduino, CyberBrick ve fischertechnik TXT Controller için görsel programlama, doğrudan VS Code içinde.**

Blockly ile program oluşturun, üretilen kodu anında görün ve PlatformIO, USB, yerel ağ OTA veya SSH ile yükleyin.

[VS Code Marketplace'ten yükle](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Open VSX'ten yükle](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [Belgeleri oku](../specifications/README.md)

## Nasıl çalıştığını görün

Bu kayıtlar, eklentinin güncel derlemesiyle gerçek bir VS Code penceresinde yapıldı.

**1. Düzenleyiciyi açın ve kartınızı seçin.** Etkinlik çubuğundaki Singular Blockly simgesine tıklayın, ardından "Kart seç" listesinden kartınızı seçin.

![Etkinlik çubuğundan Blockly düzenleyicisini açıp Arduino Uno seçmek](../images/readme/open-editor-and-select-board.gif)

**2. Blokları sürükleyin ve kodu izleyin.** Araç kutusundaki blokları "Kurulum" ve "Döngü" içine sürükleyin, değerleri açılır listelerden değiştirin ve `src/main.cpp` dosyasını düzenleyicinin yanında açık tutarak üretilen programın siz çalışırken nasıl değiştiğini görün.

![Sürükle bırak ile LED yakıp söndürme programı oluşturulurken src/main.cpp güncelleniyor](../images/readme/build-program-with-live-code.gif)

**3. Dili ve temayı değiştirin.** Ok düğmesiyle araç çubuğunu genişletin, küre menüsüyle düzenleyicinin dilini anında değiştirin ve tema düğmesiyle açık ve koyu tema arasında geçiş yapın.

![Düzenleyiciyi Geleneksel Çince ve koyu temaya geçirmek](../images/readme/switch-language-and-theme.gif)

## Geri bildirim, çevrim içi hizmetler ve veri kullanımı

Blockly düzenleyicisindeki "Geri bildirim gönder" düğmesini kullanın, komut paletinden **Singular Blockly: Geri bildirim gönder** komutunu çalıştırın ya da VS Code'un sorun bildirme aracını kullanın. GitHub hesabı gerekmez. Formu açmak veya doldurmak hiçbir ağ isteği göndermez; göndermeden önce form, gönderilecek içeriğin tamamını gösterir ve açık onay ister.

Temel ortam tanılamaları varsayılan olarak açıktır ve kapatılabilir. Son yapılandırılmış olaylar varsayılan olarak kapalıdır. İzin verilen alanlar listesi; kaynak kodu, Blockly çalışma alanı içeriğini, üretilen kodu, dosya ve klasör adlarını, yolları, bilgisayar ve cihaz kimliklerini, seri portları, Wi-Fi ve IP bilgilerini, ortam değişkenlerini, kimlik bilgilerini, ham hataları ve ham günlükleri içermez. İsteğe bağlı tek bir ekran görüntüsü yerelde yeniden kodlanır, özgün meta verileri kaldırılır, 1920 piksel ve 3 MiB ile sınırlandırılır, önizlemesi gösterilir ve yalnızca onaydan sonra gönderilir.

Geri bildirim, VS Code SecretStorage'da saklanan anonim bir gizli anahtar ve özel bir Cloudflare D1/R2 hizmeti kullanır; bakımcıların iş akışı için özel bir GitHub deposu kullanılır. Kullanıcının başlattığı bu destek aktarımı telemetri ya da analiz değildir. Ayrıntılar için [Gizlilik Bildirimi](../../PRIVACY.md), [Destek Politikası](../../SUPPORT.md), [Geri Bildirim Hizmeti Koşulları](../../TERMS.md) ve [Güvenlik Politikası](../../SECURITY.md) belgelerine bakın.

## Neden Singular Blockly?

- **Tek görsel düzenleyici, üç programlama akışı**: Arduino C++, CyberBrick MicroPython ve TXT Controller Python.
- **Doğrudan donanıma yükleme**: Arduino için PlatformIO, CyberBrick için USB veya eşleştirilmiş LAN OTA, TXT Controller için SSH.
- **Sınıfa uygun araçlar**: yerelleştirilmiş örnekler, TXT sanal kontrolleri, G/Ç testi, yedekler ve anlaşılır donanım tanılamaları.
- **Modern Blockly deneyimi**: `@blockly/theme-modern` ile Blockly 13.4.0, açık ve koyu temalar, blok arama, dokunmatik destek, klavyeyle gezinme ve anlamlı kontrol etiketleri; hepsi çevrimdışı kullanım için pakete dahil.
- **Güvenli proje dosyaları**: otomatik kaydetme, yedekten kurtarma, sahipsiz blok koruması ve dışarıdan yapılan çalışma alanı değişikliklerinin çalışma anında doğrulanması.
- **Yapay zekâya hazır projeler**: projeye özel Agent Skills, kodlama ajanlarına geçerli kartı, çalışma alanı biçimini ve blok sözleşmesini verir.

## Hızlı başlangıç

1. Singular Blockly'yi [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) veya [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly) üzerinden yükleyin.
2. VS Code'da yazılabilir bir klasör açın.
3. Etkinlik çubuğundaki Singular Blockly simgesine tıklayın veya komut paletinden **Singular Blockly: Blockly düzenleyicisini aç** komutunu çalıştırın.
4. Bir kart seçin ve araç kutusundan programınızı oluşturun.
5. Kodu incelemek için üretilen dosyayı (örneğin `src/main.cpp`) açın, ardından düzenleyici araç çubuğundaki yükleme düğmesine tıklayın.

VS Code başladıktan sonra Singular Blockly, eklentiye ait depolama alanında doğrulanmış bir Python, test edilmiş sürüm aralığında PlatformIO Core ve `mpremote` çalışma ortamını hazırlamaya başlar. Blockly düzenleyicisi açıldığında bu ortam, düzenlemeyi engellemeden yeniden denetlenir. Arduino yine öncelikle sağlayıcıyı kullanır: VS Code `platformio.platformio-ide` kullanır, VSCodium gibi Open VSX ortamları `pioarduino.pioarduino-ide` kullanabilir; Singular Core yedek yoldur. Yönetilen çalışma ortamı için özel bir klasör ilk kullanımda boş olmalıdır; böylece onarım veya temizlik ilgisiz dosyaları sahiplenmez.

<details>
<summary><b>Çevrimdışı VSIX kurulumu</b></summary>

1. En son `.vsix` dosyasını [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases) sayfasından indirin.
2. Komut paletinden **Extensions: Install from VSIX...** (Uzantılar: VSIX'ten Yükle) komutunu açın.
3. İndirdiğiniz dosyayı seçin.

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>CyberBrick USB sorun giderme</b></summary>

`mpremote`, sistem Python'u gerektirmeyen Singular yönetilen çalışma ortamına otomatik olarak kurulur. Denetlemek veya onarmak için **PlatformIO Tanılama**'yı açın. PlatformIO sağlayıcı ortamı uyumluluk için yedek olarak kalır ve Singular Blockly tarafından asla kaldırılmaz veya temizlenmez.

</details>

## Desteklenen kartlar

| Kart                          | Üretilen kod     | Seçici kimliği | Yükleme / çalışma                                          |
| ----------------------------- | ---------------- | -------------- | ---------------------------------------------------------- |
| Arduino Uno                   | `src/main.cpp`   | `uno`          | PlatformIO                                                 |
| Arduino Nano                  | `src/main.cpp`   | `nano`         | PlatformIO                                                 |
| Arduino Mega                  | `src/main.cpp`   | `mega`         | PlatformIO                                                 |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`        | PlatformIO                                                 |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`    | PlatformIO                                                 |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick`   | USB `mpremote` veya eşleştirilmiş LAN OTA → `/app/rc_main.py` |
| fischertechnik TXT Controller | `src/main.py`    | `txt`          | SSH + `python3` → `/tmp/singular_blockly/main.py`          |

Arduino projeleri `platformio.ini` dosyasını korur; CyberBrick ve TXT projeleri Python akışlarını kullanır ve gerekmediğinde bu dosyayı kaldırır.

## Temel iş akışları

### Arduino ve ESP32

- Arduino C++ üretir ve `platformio.ini` dosyasını otomatik olarak eşitler.
- Karta göre port algılama ve ne yapılacağını söyleyen hata mesajlarıyla PlatformIO üzerinden derler ve yükler.
- Seri çıkışı bir VS Code terminalinde izler; ESP32 projelerinde istisna çözümleme otomatik olarak açılır.
- G/Ç, PWM, servo, enkoderli motor, Wi-Fi/MQTT, Pixetto, HUSKYLENS ve standart programlama blokları sunar.
- Deneysel RC alıcı bloklarıyla ESP32 DevKit üzerinde CyberBrick ESP-NOW uzaktan kumanda girdisini alır.

### CyberBrick

- ESP32-C3 için MicroPython üretir; GPIO, kart üstü LED, zamanlama, Wi-Fi, X11/X12 ve ESP-NOW uzaktan kumanda bloklarını içerir.
- Varsayılan olarak USB kullanır; eşleştirilmiş yerel ağ OTA hedefini CyberBrick dişli menüsünden yapılandırabilirsiniz.
- İlk OTA kurulumu USB ile tamamlanır. Başarısız OTA yüklemeleri hiçbir zaman otomatik olarak USB'ye geçmez; böylece kod sınıftaki yanlış cihaza gitmez.
- Ağ üzerinden yüklemelerde uyumlu OTA ajanlarını güncel tutar; ajan güncelleme uyarısı ana programın yüklenmesini iptal etmez.
- MicroPython `print()` çıkışını bir VS Code terminalinde `mpremote` ile izler.
- Yerelleştirilmiş CyberBrick örneklerine göz atar; çevrimdışıyken pakete dahil örnekleri kullanır.
- Wi-Fi parolalarını, OTA belirteçlerini ve eşleştirme gizli anahtarlarını VS Code SecretStorage'da saklar. OTA kurulumu ürün yazılımını, `/boot.py` dosyasını, WebREPL'i veya ilgisiz cihaz dosyalarını değiştirmez.

[CyberBrick ayrıntıları](../specifications/03-hardware-support/cyberbrick-micropython.md) · [Genişletme kartları](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [RC eşleştirme](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- Bir kurulum akışı ve aynı anda çalışan birden çok TXT süreç akışı oluşturun.
- Python programlarını SSH ile yükleyin, çalıştırın ve durdurun.
- Bağlantıyı Blockly düzenleyicisinden çıkmadan yapılandırın ve test edin.
- Kalıcı bağlamalara sahip, sürüklenebilir sanal düğmeler oluşturun.
- Motorları, çıkışları ve sensörleri tümleşik G/Ç Test Panelinden test edin.

TXT parolaları VS Code SecretStorage'da saklanır. Varsayılan hedef `192.168.7.2`, kullanıcı adı `ftc`'dir; üretilen program `/tmp/singular_blockly/main.py` konumuna yüklenir.

[TXT Controller ayrıntıları](../specifications/03-hardware-support/txt-controller.md)

### Yapay zekâ destekli iş akışları

Projeye özel Agent Skills, Codex ve Claude Code'a geçerli kartı, çalışma alanı biçimini ve çalışma zamanında türetilen blok sözleşmesini verir. Kullanıcının bir Node.js sunucusu kurması gerekmez.

`blockly/main.json` dosyasına dışarıdan yapılan değişiklikler, etkin çalışma alanına ulaşmadan önce geçici Blockly çalışma ortamlarında doğrulanır. Geçersiz içerik karantinaya alınır ve son geçerli çalışma alanı geri yüklenir.

[Agent Skills ve çalışma alanı güvenliği](../specifications/06-features/agent-skills.md)

## Proje dosyaları

| Yol                     | Amaç                                                           |
| ----------------------- | -------------------------------------------------------------- |
| `blockly/main.json`     | Bloklar, kart seçimi ve arayüz durumu için asıl kaynak         |
| `blockly/main.json.bak` | Son geçerli çalışma alanının yedeği                            |
| `src/main.cpp`          | Üretilen Arduino / ESP32 programı                              |
| `src/rc_main.py`        | Üretilen CyberBrick MicroPython programı                       |
| `src/main.py`           | Üretilen TXT Controller programı                               |
| `platformio.ini`        | Yalnızca Arduino için PlatformIO ortam yapılandırması          |

## Yapılandırma

Ayarlara VS Code Ayarlar arayüzünden ulaşabilirsiniz. Aşağıdaki varsayılanlar eklenti bildirimiyle aynıdır.

| Ayar                                          | Varsayılan                                    | Amaç                                                       |
| --------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `singularBlockly.managedRuntime.path`         | `""`                                          | Yönetilen çalışma ortamı için isteğe bağlı klasör          |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | Blockly dışı projelerdeki güvenlik uyarısını gizler        |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | TXT Controller ana makinesi                                |
| `singular-blockly.txt.username`               | `ftc`                                         | TXT SSH kullanıcı adı                                      |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | TXT yükleme hedefi                                         |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | TXT G/Ç Test Paneli temel portu                            |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | CyberBrick USB / eşleştirilmiş OTA cihaz kaydı             |

Wi-Fi parolaları, OTA belirteçleri, eşleştirme gizli anahtarları ve TXT parolaları `settings.json` yerine VS Code SecretStorage'da saklanır. Belgeler ve günlükler yer tutucu veya maskelenmiş değerler kullanır; gerçek kimlik bilgilerini asla proje dosyalarına veya hata bildirimlerine yapıştırmayın.

## Gereksinimler

- VS Code 1.126.0 veya üzeri ya da VSCodium 1.126.04524 veya üzeri. Bu sürümü kurmadan önce eski düzenleyicileri yükseltin.
- Yazma izni olan bir çalışma alanı klasörü.
- Arduino / ESP32: bir PlatformIO sağlayıcısı ve C/C++ eklentisi (`ms-vscode.cpptools`).
- CyberBrick: normal yükleme ve ilk OTA kurulumu için USB; yalnızca OTA için ortak bir yerel ağ. Eklenti etkinleştikten sonra kendi yönetilen Python ortamında `mpremote` hazırlar ve Blockly düzenleyicisi açıldığında yeniden denetler.
- TXT Controller: denetleyiciye ağ erişimi ve cihazda Python 3 ile `ftrobopy`.

Eklenti kullanıcılarının Node.js'e ihtiyacı yoktur.

## Belgeler ve yardım

Arayüz 15 dilde sunulur: İngilizce, Geleneksel Çince, Japonca, Korece, Almanca, İspanyolca, Fransızca, İtalyanca, Lehçe, Portekizce (Brezilya), Rusça, Türkçe, Çekçe, Macarca ve Bulgarca. Otomatik mod VS Code görüntüleme dilini izler; düzenleyicideki küre menüsüyle dili anında değiştirebilirsiniz. Bu README de aynı 15 dilde mevcuttur; sayfanın üstündeki dil bağlantılarını kullanın.

- [Bütünleşik belirtimler](../specifications/README.md)
- [PlatformIO tanılama ve rehberli onarım](../specifications/06-features/platformio-diagnostics.md)
- [Seri monitör](../specifications/06-features/serial-monitor.md)
- [Uluslararasılaştırma](../specifications/02-internationalization/i18n.md)
- [Arayüz yerelleştirme süreci](../specifications/02-internationalization/user-facing-localization.md)
- [Değişiklik günlüğü](../../CHANGELOG.md)
- [Sorun izleyici](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [Güvenlik politikası](../../SECURITY.md)

Örnek proje: [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot); ESP-NOW ile uzaktan kumandalı, İngilizce ve Geleneksel Çince belgeli bir robot.

## Geliştirme

Geliştirme ve derleme komutları için İngilizce [README](../../README.md#development) dosyasının Development bölümüne ve [CONTRIBUTING.md](../../CONTRIBUTING.md) dosyasına bakın.

## Lisans

[Apache License 2.0](../../LICENSE) ile lisanslanmıştır.
