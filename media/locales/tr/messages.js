/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Turkish
window.languageManager.loadMessages('tr', {
	// UI Elements
	BLOCKS_TAB: 'Bloklar',
	CODE_TAB: 'Kod',
	BOARD_SELECT_LABEL: 'Kart seç:',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Deneysel Bloklar Tespit Edildi',
	EXPERIMENTAL_BLOCKS_DESC:
		'Çalışma alanınız deneysel bloklar içeriyor (sarı kesikli kenarlıklarla vurgulanmış). Bu özellikler gelecekteki güncellemelerde değişebilir veya kaldırılabilir, dikkatli kullanın.',

	// Preview Mode UI
	PREVIEW_BADGE: 'Önizleme',
	THEME_TOGGLE: 'Temayı değiştir',
	PREVIEW_WINDOW_TITLE: 'Blockly Önizleme - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Önizleme - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Yedek Yöneticisi',
	BACKUP_CREATE_NEW: 'Yeni Yedek Oluştur',
	BACKUP_NAME_LABEL: 'Yedek adı:',
	BACKUP_NAME_PLACEHOLDER: 'Yedek adı girin',
	BACKUP_CONFIRM: 'Onayla',
	BACKUP_CANCEL: 'İptal',
	BACKUP_LIST_TITLE: 'Yedek Listesi',
	BACKUP_LIST_EMPTY: 'Yedek bulunmuyor',
	BACKUP_BUTTON_TITLE: 'Yedek Yöneticisi',
	REFRESH_BUTTON_TITLE: 'Kodu Yenile',
	BACKUP_PREVIEW_BTN: 'Önizleme',
	BACKUP_RESTORE_BTN: 'Geri Yükle',
	BACKUP_DELETE_BTN: 'Sil',
	AUTO_BACKUP_TITLE: 'Otomatik Yedekleme Ayarları',
	AUTO_BACKUP_INTERVAL_LABEL: 'Yedekleme aralığı:',
	AUTO_BACKUP_MINUTES: 'dakika',
	AUTO_BACKUP_SAVE: 'Ayarları Kaydet',
	AUTO_BACKUP_SAVED: 'Otomatik yedekleme ayarları kaydedildi',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Manuel Yedekleme',

	// Board Names
	BOARD_NONE: 'Yok',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Blok Ara',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Blok Ara',
	FUNCTION_SEARCH_PLACEHOLDER: 'Blok adı veya parametreleri girin...',
	FUNCTION_SEARCH_BTN: 'Ara',
	FUNCTION_SEARCH_PREV: 'Önceki',
	FUNCTION_SEARCH_NEXT: 'Sonraki',
	FUNCTION_SEARCH_EMPTY: 'Henüz arama yapılmadı',
	FUNCTION_SEARCH_NO_RESULTS: 'Eşleşen blok bulunamadı',
	FUNCTION_RESULT_PREFIX: 'Blok: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Kısayol: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'Arama Geçmişi',

	// Block Categories
	CATEGORY_LOGIC: 'Mantık',
	CATEGORY_LOOPS: 'Döngüler',
	CATEGORY_MATH: 'Matematik',
	CATEGORY_TEXT: 'Metin',
	CATEGORY_LISTS: 'Listeler',
	CATEGORY_VARIABLES: 'Değişkenler',
	CATEGORY_FUNCTIONS: 'Fonksiyonlar',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Sensörler',
	CATEGORY_MOTORS: 'Motorlar',
	VISION_SENSORS_CATEGORY: 'Görü Sensörleri',
	// Servo Block Labels
	SERVO_SETUP: 'Servo Motor Kurulum',
	SERVO_PIN: 'Pin',
	SERVO_SETUP_TOOLTIP: 'Servo motor değişkeni tanımla ve pin ayarla',
	SERVO_MOVE: 'Servo Motoru Döndür',
	SERVO_ANGLE: 'Açı',
	SERVO_MOVE_TOOLTIP: 'Servo motoru belirli bir açıya döndür',
	SERVO_STOP: 'Servo Motoru Durdur',
	SERVO_STOP_TOOLTIP: 'Servo motor sinyal çıkışını durdur',

	// Encoder Motor Control
	ENCODER_SETUP: 'Enkoder Motor Kurulumu',
	ENCODER_NAME: 'İsim',
	ENCODER_PIN_A: 'Pin A',
	ENCODER_PIN_B: 'Pin B',
	ENCODER_USE_INTERRUPT: 'Kesme Kullan',
	ENCODER_SETUP_TOOLTIP: 'İsim ve pin yapılandırmalarıyla enkoder motoru kur',
	ENCODER_READ: 'Enkoder Oku',
	ENCODER_READ_TOOLTIP: 'Enkoderin mevcut pozisyonunu al',
	ENCODER_RESET: 'Enkoder Sıfırla',
	ENCODER_RESET_TOOLTIP: 'Enkoder pozisyonunu sıfıra sıfırla',
	ENCODER_PID_SETUP: 'PID Kontrol Kurulumu',
	ENCODER_PID_MOTOR: 'Motor',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_MODE: 'Mod',
	ENCODER_PID_MODE_POSITION: 'Pozisyon',
	ENCODER_PID_MODE_SPEED: 'Hız',
	ENCODER_PID_SETUP_TOOLTIP: 'Hassas motor kontrolü için PID kontrolü yapılandır. Pozisyon veya hız modunu seçin.',
	ENCODER_PID_COMPUTE: 'PID Hesapla',
	ENCODER_PID_TARGET: 'Hedef',
	ENCODER_PID_COMPUTE_TOOLTIP: 'Hedef pozisyona göre PID kontrol çıkışını hesapla',
	ENCODER_PID_RESET: "PID'i Sıfırla",
	ENCODER_PID_RESET_TOOLTIP: 'PID denetleyici durumunu sıfırla (integral birikimini temizle, sayacı sıfırla)',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Kurulum',
	ARDUINO_LOOP: 'Döngü',
	ARDUINO_DIGITAL_WRITE: 'Dijital Yazma',
	ARDUINO_DIGITAL_READ: 'Dijital Okuma',
	ARDUINO_ANALOG_WRITE: 'Analog Yazma',
	ARDUINO_ANALOG_READ: 'Analog Okuma',
	ARDUINO_PIN: 'Pin',
	ARDUINO_VALUE: 'Değer',
	ARDUINO_DELAY: 'Gecikme',
	ARDUINO_DELAY_MS: 'milisaniye',
	ARDUINO_PULLUP: 'Dahili Pull-up Direncini Etkinleştir',
	ARDUINO_MODE: 'Mod',
	ARDUINO_MODE_INPUT: 'GİRİŞ',
	ARDUINO_MODE_OUTPUT: 'ÇIKIŞ',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Ultrasonik Sensör',
	ULTRASONIC_TRIG_PIN: 'Trig Pini',
	ULTRASONIC_ECHO_PIN: 'Echo Pini',
	ULTRASONIC_USE_INTERRUPT: 'Donanım Kesmesi Kullan',
	ULTRASONIC_READ: 'Ultrasonik Mesafeyi Oku (cm)',
	ULTRASONIC_TOOLTIP_SETUP:
		'Ultrasonik sensörü Trig ve Echo pinleriyle yapılandırır. Daha yüksek hassasiyet için isteğe bağlı donanım kesmesi.',
	ULTRASONIC_TOOLTIP_READ: 'Ultrasonik sensörle ölçülen mesafeyi santimetre cinsinden okur.',
	ULTRASONIC_WARNING: 'Seçilen Echo pini {0} donanım kesmesi desteklemiyor. Lütfen şu pinlerden birini seçin: {1}',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'üzerinde',
	THRESHOLD_VALUE: 'eğer >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'değilse',
	THRESHOLD_TOOLTIP_SETUP:
		'Bir eşik fonksiyonu yapılandır. Analog giriş eşiği aştığında ilk çıktıyı, aksi takdirde ikinci çıktıyı döndürür.',
	THRESHOLD_TOOLTIP_READ: 'Eşik fonksiyonundan değer al',

	// Duration block
	DURATION_REPEAT: 'Tekrarla',
	DURATION_TIME: 'süre',
	DURATION_MS: 'milisaniye',
	DURATION_DO: 'yap',

	// Print block
	TEXT_PRINT_SHOW: 'yazdır',
	TEXT_PRINT_NEWLINE: 'yeni satır',

	// Pin Mode block
	PIN_MODE_SET: 'ayarla',

	// Function Block Labels
	FUNCTION_CREATE: 'Fonksiyon Oluştur',
	FUNCTION_NAME: 'İsim',
	FUNCTION_PARAMS: 'Parametreler',
	FUNCTION_RETURN: 'Dönüş',
	FUNCTION_CALL: 'Çağrı',

	// Logic Block Labels
	LOGIC_IF: 'eğer',
	LOGIC_ELSE: 'değilse',
	LOGIC_THEN: 'o zaman',
	LOGIC_AND: 've',
	LOGIC_OR: 'veya',
	LOGIC_NOT: 'değil',
	LOGIC_TRUE: 'doğru',
	LOGIC_FALSE: 'yanlış',

	// Loop Block Labels
	LOOP_REPEAT: 'tekrarla',
	LOOP_WHILE: 'iken',
	LOOP_UNTIL: 'kadar',
	LOOP_FOR: 'için',
	LOOP_FOREACH: 'her biri için',
	LOOP_BREAK: 'sonlandır',
	LOOP_CONTINUE: 'devam et',

	// Math Block Labels
	MATH_NUMBER: 'sayı',
	MATH_ARITHMETIC: 'aritmetik',
	MATH_OPERATIONS: 'işlemler',
	MATH_ADD: 'topla',
	MATH_SUBTRACT: 'çıkar',
	MATH_MULTIPLY: 'çarp',
	MATH_DIVIDE: 'böl',
	MATH_POWER: 'üs',

	// Math Map Block
	MATH_MAP_VALUE: 'eşle',
	MATH_MAP_TOOLTIP:
		'Bir sayıyı bir aralıktan diğerine eşler. Örneğin, map(değer, 0, 1023, 0, 255) bir analog girişi 8-bit PWM çıkışına ölçeklendirir.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Klasör Aç',
	VSCODE_PLEASE_OPEN_PROJECT: 'Lütfen önce bir proje klasörü açın!',
	VSCODE_FAILED_SAVE_FILE: 'Dosya kaydedilemedi: {0}',
	VSCODE_FAILED_UPDATE_INI: 'platformio.ini güncellenemedi: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'Çalışma alanı durumu kaydedilemedi: {0}',
	VSCODE_FAILED_START: 'Singular Blockly başlatılamadı: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: '"{0}" değişkenini silmek istediğinizden emin misiniz?',
	VSCODE_BOARD_UPDATED: 'Kart yapılandırması güncellendi: {0}',
	VSCODE_RELOAD_REQUIRED: '，Kurulumu tamamlamak için lütfen pencereyi yeniden yükleyin',
	VSCODE_ENTER_VARIABLE_NAME: 'Yeni değişken adını girin',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Yeni değişken adını girin (mevcut: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'Değişken adı boş olamaz',
	VSCODE_VARIABLE_NAME_INVALID: 'Değişken adı yalnızca harf, rakam ve alt çizgi içerebilir ve bir rakamla başlayamaz',
	VSCODE_RELOAD: 'Yeniden Yükle',
	VSCODE_OK: 'Tamam',
	VSCODE_CANCEL: 'İptal',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Blockly Düzenleyici Aç',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Lütfen önce bir kart seçin',
	ERROR_INVALID_PIN: 'Geçersiz pin numarası',
	ERROR_INVALID_VALUE: 'Geçersiz değer',
	ERROR_MISSING_TRANSLATION: 'Eksik çeviri',

	// Blockly core messages
	ADD: 'ekle',
	REMOVE: 'kaldır',
	RENAME: 'yeniden adlandır',
	NEW: 'yeni',
	ADD_COMMENT: 'Yorum Ekle',
	REMOVE_COMMENT: 'Yorumu Kaldır',
	DUPLICATE_BLOCK: 'Kopyala',
	HELP: 'Yardım',
	UNDO: 'Geri Al',
	REDO: 'Yinele',
	COLLAPSE_BLOCK: 'Bloğu Daralt',
	EXPAND_BLOCK: 'Bloğu Genişlet',
	DELETE_BLOCK: 'Bloğu Sil',
	DELETE_X_BLOCKS: '%1 Bloğu Sil',
	DELETE_ALL_BLOCKS: 'Tüm %1 bloklar silinsin mi?',
	CLEAN_UP: 'Blokları Temizle',
	COLLAPSE_ALL: 'Blokları Daralt',
	EXPAND_ALL: 'Blokları Genişlet',
	DISABLE_BLOCK: 'Bloğu Devre Dışı Bırak',
	ENABLE_BLOCK: 'Bloğu Etkinleştir',
	INLINE_INPUTS: 'Satır İçi Girdiler',
	EXTERNAL_INPUTS: 'Harici Girdiler',

	// Variable & Function messages
	RENAME_VARIABLE: 'Değişkeni yeniden adlandır...',
	NEW_VARIABLE: 'Değişken oluştur...',
	DELETE_VARIABLE: 'Değişken %1 sil',
	PROCEDURE_ALREADY_EXISTS: '"%1" adlı bir prosedür zaten var.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'eğer',
	CONTROLS_IF_MSG_THEN: 'o zaman',
	CONTROLS_IF_MSG_ELSE: 'değilse',
	CONTROLS_IF_MSG_ELSEIF: 'değilse eğer',
	CONTROLS_IF_IF_TITLE_IF: 'eğer',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'değilse eğer',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'değilse',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Her iki giriş birbirine eşitse doğru döndür.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Her iki giriş birbirine eşit değilse doğru döndür.',
	LOGIC_COMPARE_TOOLTIP_LT: 'İlk giriş ikinci girişten küçükse doğru döndür.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'İlk giriş ikinci girişten küçük veya eşitse doğru döndür.',
	LOGIC_COMPARE_TOOLTIP_GT: 'İlk giriş ikinci girişten büyükse doğru döndür.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'İlk giriş ikinci girişten büyük veya eşitse doğru döndür.',
	LOGIC_OPERATION_AND: 've',
	LOGIC_OPERATION_OR: 'veya',
	LOGIC_NEGATE_TITLE: '%1 değil',
	LOGIC_BOOLEAN_TRUE: 'doğru',
	LOGIC_BOOLEAN_FALSE: 'yanlış',
	LOGIC_NULL: 'boş',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://tr.wikipedia.org/wiki/Eşitsizlik_(matematik)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: 'Giriş yanlışsa doğru döndürür. Giriş doğruysa yanlış döndürür.',
	LOGIC_OPERATION_TOOLTIP_AND: 'Her iki giriş de doğruysa doğru döndür.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Girişlerden en az biri doğruysa doğru döndür.',
	LOGIC_BOOLEAN_TOOLTIP: 'Doğru veya yanlış döndürür.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: '%1 kez tekrarla',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'olduğu sürece tekrarla',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'olana kadar tekrarla',
	CONTROLS_FOR_TITLE: '%1 ile %2 den %3 e %4 artışla say',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'döngüden çık',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'sonraki yinelemeye devam et',
	CONTROLS_REPEAT_TOOLTIP: 'Bazı ifadeleri birkaç kez tekrarla.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'Bir değer doğru olduğu sürece, bazı ifadeleri yap.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'Bir değer yanlış olduğu sürece, bazı ifadeleri yap.',
	CONTROLS_FOR_TOOLTIP: 'Belirtilen aralıkla başlangıç sayısından bitiş sayısına kadar say.',
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Uyarı: Bu blok yalnızca bir döngü içinde kullanılabilir.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://tr.wikipedia.org/wiki/Sayı',
	MATH_NUMBER_TOOLTIP: 'Bir sayı.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'karekök',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'mutlak',
	MATH_IS_EVEN: 'çift mi',
	MATH_IS_ODD: 'tek mi',
	MATH_IS_PRIME: 'asal mı',
	MATH_IS_WHOLE: 'tam sayı mı',
	MATH_IS_POSITIVE: 'pozitif mi',
	MATH_IS_NEGATIVE: 'negatif mi',
	MATH_ARITHMETIC_HELPURL: 'https://tr.wikipedia.org/wiki/Aritmetik',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'İki sayının toplamını döndür.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'İki sayının farkını döndür.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'İki sayının çarpımını döndür.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'İki sayının bölümünü döndür.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'İlk sayının ikinci sayı kuvvetini döndür.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'metin oluştur',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'birleştir',
	TEXT_LENGTH_TITLE: '%1 uzunluğu',
	TEXT_ISEMPTY_TITLE: '%1 boş mu',
	TEXT_INDEXOF_OPERATOR_FIRST: 'metnin ilk geçtiği yeri bul',
	TEXT_INDEXOF_OPERATOR_LAST: 'metnin son geçtiği yeri bul',
	TEXT_CHARAT_FROM_START: '# harfini al',
	TEXT_CHARAT_FROM_END: 'sondan # harfini al',
	TEXT_CHARAT_FIRST: 'ilk harfi al',
	TEXT_CHARAT_LAST: 'son harfi al',
	TEXT_CHARAT_RANDOM: 'rastgele harf al',
	TEXT_JOIN_TOOLTIP: 'Herhangi bir sayıda öğeyi birleştirerek bir metin parçası oluştur.',
	TEXT_APPEND_VARIABLE: 'öğe',
	TEXT_APPEND_TOOLTIP: '"%1" değişkenine bir metin ekle.',
	TEXT_LENGTH_TOOLTIP: 'Verilen metindeki harf sayısını (boşluklar dahil) döndürür.',
	TEXT_ISEMPTY_TOOLTIP: 'Verilen metin boşsa doğru döndürür.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'boş liste oluştur',
	LISTS_CREATE_WITH_INPUT_WITH: 'liste oluştur',
	LISTS_LENGTH_TITLE: '%1 uzunluğu',
	LISTS_ISEMPTY_TITLE: '%1 boş mu',
	LISTS_INDEXOF_FIRST: 'öğenin ilk geçtiği yeri bul',
	LISTS_INDEXOF_LAST: 'öğenin son geçtiği yeri bul',
	LISTS_GET_INDEX_GET: 'al',
	LISTS_GET_INDEX_REMOVE: 'kaldır',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: 'sondan #',
	LISTS_GET_INDEX_FIRST: 'ilk',
	LISTS_GET_INDEX_LAST: 'son',
	LISTS_GET_INDEX_RANDOM: 'rastgele',
	LISTS_CREATE_WITH_TOOLTIP: 'Herhangi bir sayıda öğe ile bir liste oluştur.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Veri kaydı içermeyen, uzunluğu 0 olan bir liste döndürür',
	LISTS_LENGTH_TOOLTIP: 'Bir listenin uzunluğunu döndürür.',
	LISTS_ISEMPTY_TOOLTIP: 'Liste boşsa doğru döndürür.',

	// Variables
	VARIABLES_SET: '%1 değerini %2 olarak ayarla',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'öğe',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Bir değer doğruysa, bazı ifadeleri yap.',
	CONTROLS_IF_TOOLTIP_2: 'Bir değer doğruysa, birinci ifade bloğunu yap. Değilse, ikinci ifade bloğunu yap.',
	CONTROLS_IF_TOOLTIP_3: 'Birinci değer doğruysa, birinci ifade bloğunu yap. Değilse, ikinci değer doğruysa, ikinci ifade bloğunu yap.',
	CONTROLS_IF_TOOLTIP_4:
		'Birinci değer doğruysa, birinci ifade bloğunu yap. Değilse, ikinci değer doğruysa, ikinci ifade bloğunu yap. Değerlerden hiçbiri doğru değilse, son ifade bloğunu yap.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'bir şeyler yap',
	PROCEDURES_BEFORE_PARAMS: 'ile:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'ile:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Çıktısı olmayan bir fonksiyon oluşturur.',
	PROCEDURES_DEFRETURN_RETURN: 'döndür',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Çıktısı olan bir fonksiyon oluşturur.',
	PROCEDURES_DEFRETURN_COMMENT: 'Bu fonksiyonu açıklayın...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'dönüşlü bir şeyler yap',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://tr.wikipedia.org/wiki/Alt_yordam',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'Kullanıcı tanımlı fonksiyonu çalıştır.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://tr.wikipedia.org/wiki/Alt_yordam',
	PROCEDURES_CALLRETURN_TOOLTIP: 'Kullanıcı tanımlı fonksiyonu çalıştır ve çıktısını kullan.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Yedi Segment Ekran',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Ortak Katot',
	SEVEN_SEGMENT_COMMON_ANODE: 'Ortak Anot',
	SEVEN_SEGMENT_NUMBER: 'Sayı (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Ondalık Nokta',
	SEVEN_SEGMENT_TOOLTIP: 'Yedi segment ekranda isteğe bağlı ondalık nokta ile bir sayı (0-9) görüntüle.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Yedi segment ekran pinlerini ayarla',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'Yedi segment ekranın her bir segmenti (A-G) ve ondalık noktası (DP) için pinleri yapılandırın.',

	// Pixetto Smart Camera
	PIXETTO_INIT: 'Pixetto Akıllı Kamerayı Başlat',
	PIXETTO_RX_PIN: 'RX Pin',
	PIXETTO_TX_PIN: 'TX Pin',
	PIXETTO_IS_DETECTED: 'Pixetto Nesne Algılandı',
	PIXETTO_GET_TYPE_ID: "Pixetto Tip ID'si Al",
	PIXETTO_GET_FUNC_ID: "Pixetto Fonksiyon ID'si Al",
	PIXETTO_COLOR_DETECT: 'Pixetto Renk Tespiti',
	PIXETTO_SHAPE_DETECT: 'Pixetto Şekil Tespiti',
	PIXETTO_FACE_DETECT: 'Pixetto Yüz Tespiti',
	PIXETTO_APRILTAG_DETECT: 'Pixetto Nisan Etiketi Tespiti',
	PIXETTO_NEURAL_NETWORK: 'Pixetto Sinir Ağı Tanıma',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto Elle Yazılmış Rakamı Tanı',
	PIXETTO_GET_POSITION: 'Pixetto Tespit Edilen Nesneyi Al',
	PIXETTO_ROAD_DETECT: 'Pixetto Yol Tespiti',
	PIXETTO_SET_MODE: 'Pixetto Fonksiyon Modunu Ayarla',
	PIXETTO_COLOR: 'Renk',
	PIXETTO_SHAPE: 'Şekil',
	PIXETTO_MODE: 'Mod',
	PIXETTO_TAG_ID: 'Etiket ID',
	PIXETTO_CLASS_ID: 'Sınıf ID',
	PIXETTO_DIGIT: 'Rakam',
	PIXETTO_COORDINATE: 'Koordinat',
	PIXETTO_ROAD_INFO: 'Bilgi', // Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',
	// HUSKYLENS Akıllı Kamera
	HUSKYLENS_INIT_I2C: 'HUSKYLENS başlat (I2C)',
	HUSKYLENS_INIT_UART: 'HUSKYLENS başlat (UART)',
	HUSKYLENS_RX_PIN: "HuskyLens TX'e bağlan →",
	HUSKYLENS_TX_PIN: "HuskyLens RX'e bağlan →",
	HUSKYLENS_SET_ALGORITHM: 'HUSKYLENS algoritmasını şuna ayarla',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: 'Yüz tanıma',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: 'Nesne takibi',
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: 'Nesne tanıma',
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'Çizgi takibi',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: 'Renk tanıma',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'Etiket tanıma',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: 'Nesne sınıflandırma',
	HUSKYLENS_REQUEST: 'HUSKYLENS tanıma sonucunu iste',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS nesneleri öğrendi',
	HUSKYLENS_COUNT_BLOCKS: 'HUSKYLENS algılanan blok sayısı',
	HUSKYLENS_COUNT_ARROWS: 'HUSKYLENS algılanan ok sayısı',
	HUSKYLENS_GET_BLOCK_INFO: 'Blok al',
	HUSKYLENS_GET_ARROW_INFO: 'Ok al',
	HUSKYLENS_BLOCK_INFO_TYPE: ' ',
	HUSKYLENS_ARROW_INFO_TYPE: ' ',
	HUSKYLENS_X_CENTER: 'X merkez',
	HUSKYLENS_Y_CENTER: 'Y merkez',
	HUSKYLENS_WIDTH: 'Genişlik',
	HUSKYLENS_HEIGHT: 'Yükseklik',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'X başlangıç',
	HUSKYLENS_Y_ORIGIN: 'Y başlangıç',
	HUSKYLENS_X_TARGET: 'X hedef',
	HUSKYLENS_Y_TARGET: 'Y hedef',
	HUSKYLENS_LEARN: 'HUSKYLENS ID öğrensin',
	HUSKYLENS_FORGET: 'HUSKYLENS tüm öğrenilenleri unutsun',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Pixetto akıllı kamerasını başlatın ve UART iletişim pinlerini ayarlayın',
	PIXETTO_IS_DETECTED_TOOLTIP: "Pixetto'nun herhangi bir nesne algılayıp algılamadığını tespit et",
	PIXETTO_GET_TYPE_ID_TOOLTIP: "Pixetto tarafından algılanan nesnenin tip ID'sini al (renk, şekil vb.)",
	PIXETTO_GET_FUNC_ID_TOOLTIP: "Pixetto tarafından şu anda kullanılan fonksiyonun ID'sini al (renk algılama, şekil algılama vb.)",
	PIXETTO_COLOR_DETECT_TOOLTIP: "Pixetto'nun belirtilen renkteki nesneyi algılayıp algılamadığını tespit edin",
	PIXETTO_SHAPE_DETECT_TOOLTIP: "Pixetto'nun belirtilen şekildeki nesneyi algılayıp algılamadığını tespit edin",
	PIXETTO_FACE_DETECT_TOOLTIP: "Pixetto'nun yüz algılayıp algılamadığını tespit edin",
	PIXETTO_APRILTAG_DETECT_TOOLTIP: "Pixetto'nun belirtilen ID'li AprilTag algılayıp algılamadığını tespit edin",
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Pixetto sinir ağının belirtilen sınıftaki nesneyi tanıyıp tanımadığını tespit edin',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: "Pixetto'nun belirtilen el yazısı rakamını tanıyıp tanımadığını tespit edin",
	PIXETTO_GET_POSITION_TOOLTIP: 'Pixetto tarafından algılanan nesnenin konum veya boyut bilgilerini alın',
	PIXETTO_ROAD_DETECT_TOOLTIP: "Pixetto'dan yol algılama ile ilgili bilgileri alın",
	PIXETTO_SET_MODE_TOOLTIP: 'Pixetto akıllı kamerasının işlevsel modunu ayarlayın',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Kırmızı',
	PIXETTO_COLOR_BLUE: 'Mavi',
	PIXETTO_COLOR_GREEN: 'Yeşil',
	PIXETTO_COLOR_YELLOW: 'Sarı',
	PIXETTO_COLOR_ORANGE: 'Turuncu',
	PIXETTO_COLOR_PURPLE: 'Mor',
	PIXETTO_COLOR_BLACK: 'Siyah',
	PIXETTO_COLOR_WHITE: 'Beyaz',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Üçgen',
	PIXETTO_SHAPE_RECTANGLE: 'Dikdörtgen',
	PIXETTO_SHAPE_PENTAGON: 'Beşgen',
	PIXETTO_SHAPE_HEXAGON: 'Altıgen',
	PIXETTO_SHAPE_CIRCLE: 'Daire',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'X Koordinatı',
	PIXETTO_POSITION_Y: 'Y Koordinatı',
	PIXETTO_POSITION_WIDTH: 'Genişlik',
	PIXETTO_POSITION_HEIGHT: 'Yükseklik',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Merkez X',
	PIXETTO_ROAD_CENTER_Y: 'Merkez Y',
	PIXETTO_ROAD_LEFT_X: 'Sol Sınır X',
	PIXETTO_ROAD_RIGHT_X: 'Sağ Sınır X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Renk Algılama',
	PIXETTO_MODE_SHAPE_DETECTION: 'Şekil Algılama',
	PIXETTO_MODE_FACE_DETECTION: 'Yüz Algılama',
	PIXETTO_MODE_APRILTAG_DETECTION: 'AprilTag Algılama',
	PIXETTO_MODE_NEURAL_NETWORK: 'Sinir Ağı',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'El Yazısı Rakam',
	PIXETTO_MODE_ROAD_DETECTION: 'Yol Algılama',
	PIXETTO_MODE_BALL_DETECTION: 'Top Algılama',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Şablon Eşleştirme',

	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'I2C kullanarak HUSKYLENS akıllı kamerasını başlat',
	HUSKYLENS_INIT_UART_TOOLTIP: 'UART kullanarak HUSKYLENS akıllı kamerasını başlat, RX/TX pinlerini ayarla',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: 'HUSKYLENS tarafından kullanılan tanıma algoritmasını ayarla',
	HUSKYLENS_REQUEST_TOOLTIP: "HUSKYLENS'ten en son tanıma sonuçlarını iste",
	HUSKYLENS_IS_LEARNED_TOOLTIP: "HUSKYLENS'in herhangi bir nesne öğrenip öğrenmediğini kontrol et",
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'HUSKYLENS tarafından algılanan blok sayısını al',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'HUSKYLENS tarafından algılanan ok sayısını al',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: 'Belirtilen bloğun bilgilerini al (konum, boyut veya ID)',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: 'Belirtilen okun bilgilerini al (başlangıç, hedef veya ID)',
	HUSKYLENS_LEARN_TOOLTIP: "HUSKYLENS'i belirtilen ID'ye sahip nesneyi öğrenmeye zorla (sadece Nesne Sınıflandırma modunda)",
	HUSKYLENS_FORGET_TOOLTIP: "HUSKYLENS'ten tüm öğrenilmiş nesneleri temizle (sadece Nesne Sınıflandırma modunda)",
	HUSKYLENS_I2C_PIN_HINT: 'Kablolama: ',
	HUSKYLENS_UART_PIN_HINT: 'Önerilen pinler: ',
	HUSKYLENS_UART_ANY_DIGITAL: 'Herhangi bir dijital pin',
	// ESP32 PWM Setup
	ESP32_PWM_SETUP: 'ESP32 PWM Ayarı',
	ESP32_PWM_FREQUENCY: 'Frekans',
	ESP32_PWM_RESOLUTION: 'Çözünürlük',
	ESP32_PWM_FREQUENCY_TOOLTIP: 'PWM frekansını ayarla, aralık 1-80000 Hz. Motor sürücü yongaları için yüksek frekans (20-75KHz)',
	ESP32_PWM_RESOLUTION_TOOLTIP: 'PWM çözünürlüğünü ayarla, çıkış hassasiyetini etkiler. Not: frekans × 2^çözünürlük ≤ 80.000.000',
	ESP32_PWM_RESOLUTION_8BIT: '8 bits (0-255)',
	ESP32_PWM_RESOLUTION_10BIT: '10 bits (0-1023)',
	ESP32_PWM_RESOLUTION_12BIT: '12 bits (0-4095)',
	ESP32_PWM_RESOLUTION_13BIT: '13 bits (0-8191)',
	ESP32_PWM_RESOLUTION_14BIT: '14 bits (0-16383)',
	ESP32_PWM_RESOLUTION_15BIT: '15 bits (0-32767)',
	ESP32_PWM_RESOLUTION_16BIT: '16 bits (0-65535)',
	// Safety Guard (Project Safety Protection)
	SAFETY_WARNING_BODY_NO_TYPE:
		'Bu projede henüz Blockly blokları yok. Devam ederseniz, burada blockly klasörü ve dosyaları oluşturulacak. Devam etmek istiyor musunuz?',
	SAFETY_WARNING_BODY_WITH_TYPE:
		'{0} projesi algılandı. Bu projede henüz Blockly blokları yok. Devam ederseniz, burada blockly klasörü ve dosyaları oluşturulacak. Devam etmek istiyor musunuz?',
	BUTTON_CONTINUE: 'Devam',
	BUTTON_CANCEL: 'İptal',
	BUTTON_SUPPRESS: 'Hatırlatma',
	SAFETY_GUARD_CANCELLED: 'Blockly editörünü açma iptal edildi',
	SAFETY_GUARD_SUPPRESSED: 'Tercih kaydedildi, bu uyarı bir daha gösterilmeyecek',

	// Communication Category
	CATEGORY_COMMUNICATION: 'İletişim',

	// ESP32 WiFi
	ESP32_WIFI_LABEL: 'WiFi',
	ESP32_WIFI_CONNECT: 'WiFi Bağlan',
	ESP32_WIFI_CONNECT_SSID: 'SSID',
	ESP32_WIFI_CONNECT_PASSWORD: 'Şifre',
	ESP32_WIFI_CONNECT_TOOLTIP: "ESP32'yi belirtilen SSID ve şifre ile WiFi ağına bağla",
	ESP32_WIFI_DISCONNECT: 'WiFi Bağlantısını Kes',
	ESP32_WIFI_DISCONNECT_TOOLTIP: "ESP32'nin WiFi bağlantısını kes",
	ESP32_WIFI_STATUS: 'WiFi Durumu',
	ESP32_WIFI_STATUS_TOOLTIP: "ESP32'nin WiFi ağına bağlı olup olmadığını kontrol et",
	ESP32_WIFI_GET_IP: 'WiFi IP Adresini Al',
	ESP32_WIFI_GET_IP_TOOLTIP: "ESP32'nin yerel IP adresini metin olarak al",
	ESP32_WIFI_SCAN: 'WiFi Ağlarını Tara',
	ESP32_WIFI_SCAN_TOOLTIP: 'Mevcut WiFi ağlarını tara ve bulunan ağ sayısını döndür',
	ESP32_WIFI_GET_SSID: 'Ağ SSID Al',
	ESP32_WIFI_GET_SSID_INDEX: 'indeks',
	ESP32_WIFI_GET_SSID_TOOLTIP: 'Verilen indeksteki WiFi ağının SSID adını al',
	ESP32_WIFI_GET_RSSI: 'Ağ RSSI Al',
	ESP32_WIFI_GET_RSSI_INDEX: 'indeks',
	ESP32_WIFI_GET_RSSI_TOOLTIP: 'Verilen indeksteki WiFi ağının sinyal gücünü (RSSI) al',

	// ESP32 MQTT
	ESP32_MQTT_LABEL: 'MQTT',
	ESP32_MQTT_SETUP: 'MQTT Kurulum',
	ESP32_MQTT_SETUP_SERVER: 'Sunucu',
	ESP32_MQTT_SETUP_PORT: 'Port',
	ESP32_MQTT_SETUP_CLIENT_ID: 'İstemci ID',
	ESP32_MQTT_SETUP_TOOLTIP: 'MQTT istemcisini sunucu adresi, port ve istemci kimliği ile yapılandır',
	ESP32_MQTT_CONNECT: 'MQTT Bağlan',
	ESP32_MQTT_CONNECT_USERNAME: 'Kullanıcı Adı',
	ESP32_MQTT_CONNECT_PASSWORD: 'Şifre',
	ESP32_MQTT_CONNECT_TOOLTIP: 'İsteğe bağlı kullanıcı adı ve şifre ile MQTT sunucusuna bağlan',
	ESP32_MQTT_PUBLISH: 'MQTT Yayınla',
	ESP32_MQTT_PUBLISH_TOPIC: 'Konu',
	ESP32_MQTT_PUBLISH_MESSAGE: 'Mesaj',
	ESP32_MQTT_PUBLISH_TOOLTIP: 'Bir MQTT konusuna mesaj yayınla',
	ESP32_MQTT_SUBSCRIBE: 'MQTT Abone Ol',
	ESP32_MQTT_SUBSCRIBE_TOPIC: 'Konu',
	ESP32_MQTT_SUBSCRIBE_TOOLTIP: 'Mesaj almak için bir MQTT konusuna abone ol',
	ESP32_MQTT_LOOP: 'MQTT Döngü',
	ESP32_MQTT_LOOP_TOOLTIP: 'Gelen MQTT mesajlarını işle (ana döngüde çağır)',
	ESP32_MQTT_GET_TOPIC: 'MQTT Konu Al',
	ESP32_MQTT_GET_TOPIC_TOOLTIP: 'En son alınan MQTT mesajının konusunu al',
	ESP32_MQTT_GET_MESSAGE: 'MQTT Mesaj Al',
	ESP32_MQTT_GET_MESSAGE_TOOLTIP: 'En son alınan MQTT mesajının içeriğini al',
	ESP32_MQTT_STATUS: 'MQTT Bağlı',
	ESP32_MQTT_STATUS_TOOLTIP: 'MQTT sunucusuna bağlı olup olmadığını kontrol et',

	// Text to Number
	TEXT_TO_NUMBER: 'Metin sayıya',
	TEXT_TO_NUMBER_INT: 'tam sayı',
	TEXT_TO_NUMBER_FLOAT: 'ondalık',
	TEXT_TO_NUMBER_TOOLTIP: 'Metni sayıya dönüştür (tam sayı veya ondalık)',

	// To String Block
	TO_STRING: 'Metne Dönüştür',
	TO_STRING_TOOLTIP: 'Sayı veya boolean değeri metne dönüştür',

	// ESP32 Only Block Warning
	ESP32_ONLY_BLOCK_WARNING: 'Bu blok sadece ESP32 kartlarını destekler',

	// Quick Backup Toast Messages
	BACKUP_QUICK_SAVE_SUCCESS: 'Yedek kaydedildi: {0}',
	BACKUP_QUICK_SAVE_EMPTY: 'Çalışma alanı boş, yedekleme gerekli değil',
	BACKUP_QUICK_SAVE_COOLDOWN: 'Lütfen bekleyin, yedekleme az önce tamamlandı',

	// Board Switch Warning
	BOARD_SWITCH_WARNING_TITLE: 'Kart türünü değiştir',
	BOARD_SWITCH_WARNING_MESSAGE:
		'Farklı bir kart türüne geçiş mevcut çalışma alanını temizleyecektir.\nÇalışmanız önce otomatik olarak yedeklenecektir.\n\nDevam etmek istiyor musunuz?',

	// CyberBrick Board
	BOARD_CYBERBRICK: 'CyberBrick',

	// CyberBrick Category
	CATEGORY_CYBERBRICK_CORE: 'CyberBrick',
	CATEGORY_CYBERBRICK_LED: 'LED',
	CATEGORY_CYBERBRICK_GPIO: 'GPIO',
	CATEGORY_CYBERBRICK_TIME: 'Zaman',

	// CyberBrick Main Block
	CYBERBRICK_MAIN: 'Ana program',
	CYBERBRICK_MAIN_TOOLTIP: 'CyberBrick ana program giriş noktası. Tüm kod bu bloğun içine yerleştirilmelidir.',

	// CyberBrick LED Blocks
	CYBERBRICK_LED_SET_COLOR: 'LED rengini ayarla',
	CYBERBRICK_LED_SET_COLOR_PREFIX: 'Dahili LED rengini ayarla',
	CYBERBRICK_LED_RED: 'Kırmızı',
	CYBERBRICK_LED_GREEN: 'Yeşil',
	CYBERBRICK_LED_BLUE: 'Mavi',
	CYBERBRICK_LED_SET_COLOR_TOOLTIP: 'Dahili LED (GPIO8) rengini RGB değerleri (0-255) kullanarak ayarla',
	CYBERBRICK_LED_OFF: "LED'i kapat",
	CYBERBRICK_LED_OFF_TOOLTIP: "Dahili LED'i kapat",

	// CyberBrick GPIO Blocks
	CYBERBRICK_GPIO_SET: "GPIO'yu ayarla",
	CYBERBRICK_GPIO_SET_PREFIX: 'GPIO',
	CYBERBRICK_GPIO_SET_TO: 'olarak',
	CYBERBRICK_GPIO_PIN: 'Pin',
	CYBERBRICK_GPIO_VALUE: 'Değer',
	CYBERBRICK_GPIO_HIGH: 'YÜKSEK',
	CYBERBRICK_GPIO_LOW: 'DÜŞÜK',
	CYBERBRICK_GPIO_SET_TOOLTIP: 'GPIO pinini YÜKSEK veya DÜŞÜK olarak ayarla',
	CYBERBRICK_GPIO_READ: "GPIO'yu oku",
	CYBERBRICK_GPIO_READ_TOOLTIP: 'GPIO pininden dijital değer oku (0 veya 1 döndürür)',

	// CyberBrick Time Blocks
	CYBERBRICK_DELAY_MS: 'Gecikme (ms)',
	CYBERBRICK_DELAY_MS_PREFIX: 'Gecikme',
	CYBERBRICK_DELAY_MS_SUFFIX: 'ms',
	CYBERBRICK_DELAY_MS_TOOLTIP: 'Program yürütmesini belirtilen milisaniye kadar duraklat',
	CYBERBRICK_DELAY_S: 'Gecikme (s)',
	CYBERBRICK_DELAY_S_PREFIX: 'Gecikme',
	CYBERBRICK_DELAY_S_SUFFIX: 'saniye',
	CYBERBRICK_DELAY_S_TOOLTIP: 'Program yürütmesini belirtilen saniye kadar duraklat',

	// CyberBrick WiFi Blocks
	CATEGORY_CYBERBRICK_WIFI: 'WiFi',
	CYBERBRICK_WIFI_CONNECT: 'WiFi bağlan',
	CYBERBRICK_WIFI_SSID: 'SSID',
	CYBERBRICK_WIFI_PASSWORD: 'Şifre',
	CYBERBRICK_WIFI_CONNECT_TOOLTIP: 'Belirtilen WiFi ağına bağlan',
	CYBERBRICK_WIFI_DISCONNECT: 'WiFi bağlantısını kes',
	CYBERBRICK_WIFI_DISCONNECT_TOOLTIP: 'Mevcut WiFi ağından bağlantıyı kes',
	CYBERBRICK_WIFI_IS_CONNECTED: 'WiFi bağlı mı?',
	CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP: 'WiFi bağlı olup olmadığını kontrol et',
	CYBERBRICK_WIFI_GET_IP: 'IP adresini al',
	CYBERBRICK_WIFI_GET_IP_TOOLTIP: 'Mevcut IP adresini al',

	// CyberBrick Upload
	UPLOAD_BUTTON_TITLE: "CyberBrick'e yükle",
	UPLOAD_BUTTON_DISABLED_TITLE: 'Yüklemeyi etkinleştirmek için önce çalışma alanını kaydedin',
	UPLOAD_STARTING: 'Yükleme başlatılıyor...',
	UPLOAD_SUCCESS: 'Yükleme başarılı!',
	UPLOAD_FAILED: 'Yükleme başarısız: {0}',
	UPLOAD_NO_PORT: 'CyberBrick cihazı bulunamadı',
	UPLOAD_IN_PROGRESS: 'Yükleniyor...',
	UPLOAD_EMPTY_WORKSPACE: 'Çalışma alanı boş, önce blok ekleyin',
	UPLOAD_NO_CODE: 'Kod oluşturulamıyor',

	// Upload progress stages
	UPLOAD_STAGE_PREPARING: 'Hazırlanıyor',
	UPLOAD_STAGE_CHECKING: 'Araçlar kontrol ediliyor',
	UPLOAD_STAGE_INSTALLING: 'Araçlar yükleniyor',
	UPLOAD_STAGE_CONNECTING: 'Cihaza bağlanılıyor',
	UPLOAD_STAGE_RESETTING: 'Cihaz sıfırlanıyor',
	UPLOAD_STAGE_BACKUP: 'Yedekleniyor',
	UPLOAD_STAGE_UPLOADING: 'Yükleniyor',
	UPLOAD_STAGE_RESTARTING: 'Cihaz yeniden başlatılıyor',
	UPLOAD_STAGE_COMPLETED: 'Tamamlandı',

	// Upload error messages
	ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Yalnızca CyberBrick kartı desteklenmektedir',
	ERROR_UPLOAD_CODE_EMPTY: 'Kod boş olamaz',
	ERROR_UPLOAD_NO_PYTHON: 'PlatformIO Python ortamı bulunamadı. Lütfen önce PlatformIO kurun.',
	ERROR_UPLOAD_MPREMOTE_FAILED: 'mpremote kurulumu başarısız',
	ERROR_UPLOAD_DEVICE_NOT_FOUND: 'CyberBrick cihazı bulunamadı. Bağlı olduğundan emin olun.',
	ERROR_UPLOAD_RESET_FAILED: 'Cihaz sıfırlanamadı',
	ERROR_UPLOAD_UPLOAD_FAILED: 'Program yüklenemedi',
	ERROR_UPLOAD_RESTART_FAILED: 'Cihaz yeniden başlatılamadı',

	// Arduino Upload Button
	UPLOAD_BUTTON_TITLE_ARDUINO: 'Derle ve Yükle',
	UPLOAD_SELECT_BOARD: 'Lütfen önce bir kart seçin',

	// Arduino Upload Stages
	ARDUINO_STAGE_SYNCING: 'Ayarlar senkronize ediliyor',
	ARDUINO_STAGE_SAVING: 'Çalışma alanı kaydediliyor',
	ARDUINO_STAGE_CHECKING: 'Derleyici kontrol ediliyor',
	ARDUINO_STAGE_DETECTING: 'Kart algılanıyor',
	ARDUINO_STAGE_COMPILING: 'Derleniyor',
	ARDUINO_STAGE_UPLOADING: 'Yükleniyor',

	// Arduino Upload Results
	ARDUINO_COMPILE_SUCCESS: 'Derleme başarılı!',
	ARDUINO_UPLOAD_SUCCESS: 'Yükleme başarılı!',

	// Arduino Upload Errors
	ERROR_ARDUINO_PIO_NOT_FOUND: 'PlatformIO CLI bulunamadı. Lütfen önce PlatformIO kurun.',
	ERROR_ARDUINO_COMPILE_FAILED: 'Derleme başarısız',
	ERROR_ARDUINO_UPLOAD_FAILED: 'Yükleme başarısız',
	ERROR_ARDUINO_NO_WORKSPACE: 'Lütfen önce bir proje klasörü açın',
	ERROR_ARDUINO_TIMEOUT: 'İşlem zaman aşımına uğradı',
	ERROR_ARDUINO_DEVICE_DISCONNECT: 'Cihazın bağlantısı kesildi',

	// Backup messages
	BACKUP_CONFIRM_DELETE: '"{0}" yedeklemesini silmek istediğinizden emin misiniz?',
	BACKUP_CONFIRM_RESTORE:
		'"{0}" yedeklemesini geri yüklemek istediğinizden emin misiniz? Bu, mevcut çalışma alanının üzerine yazacaktır.',
	BACKUP_ERROR_NOT_FOUND: '"{0}" yedeklemesi bulunamadı',
	BACKUP_ERROR_CREATE_FAILED: 'Yedekleme oluşturulamadı: {0}',
	BACKUP_ERROR_DELETE_FAILED: 'Yedekleme silinemedi: {0}',
	BACKUP_ERROR_RESTORE_FAILED: 'Yedekleme geri yüklenemedi: {0}',
	BACKUP_ERROR_PREVIEW_FAILED: 'Yedekleme önizlenemedi: {0}',
	BACKUP_ERROR_NAME_NOT_SPECIFIED: 'Yedekleme adı belirtilmedi',
	BACKUP_ERROR_MAIN_NOT_FOUND: 'main.json dosyası bulunamıyor',
	BACKUP_ERROR_UPDATE_SETTINGS_FAILED: 'Otomatik yedekleme ayarları güncellenemedi',

	// Button labels
	BUTTON_DELETE: 'Sil',
	BUTTON_RESTORE: 'Geri Yükle',

	// Error messages
	ERROR_PROCESSING_MESSAGE: 'Mesaj işlenirken hata oluştu: {0}',
	ERROR_SETTINGS_UPDATE_FAILED: 'Ayarlar güncellenemedi',
	ERROR_RELOAD_WORKSPACE_FAILED: 'Çalışma alanı yeniden yüklenemedi: {0}',
	ERROR_OPEN_PROJECT_FOLDER_FIRST: 'Lütfen önce bir proje klasörü açın',

	// Info messages
	INFO_NO_BACKUPS_TO_PREVIEW: 'Önizlenecek yedekleme dosyası yok',

	// Dialog messages
	DIALOG_SELECT_BACKUP_TITLE: 'Önizlenecek yedekleme dosyasını seçin',
	DIALOG_BACKUP_FILES_LABEL: 'Yedekleme Dosyaları',

	// X11 Genişletme Kartı
	CATEGORY_X11: 'X11 Uzantı',
	X11_LABEL_SERVOS: 'Servo Motorlar',
	X11_LABEL_MOTORS: 'Motorlar',
	X11_LABEL_LEDS: "LED'ler",

	// X11 180° Servo blokları
	X11_SERVO_180_ANGLE_PREFIX: 'Servo ayarla',
	X11_SERVO_180_ANGLE_SUFFIX: 'açı',
	X11_SERVO_180_ANGLE_TOOLTIP: '180° servo açısını ayarla (0-180 derece)',

	// X11 360° Servo blokları
	X11_SERVO_360_SPEED_PREFIX: 'Servo ayarla',
	X11_SERVO_360_SPEED_SUFFIX: 'hız',
	X11_SERVO_360_SPEED_TOOLTIP: '360° sürekli dönen servo hızını ayarla (-100 ile 100 arası, negatif=geri)',

	// X11 Servo durdurma bloğu
	X11_SERVO_STOP: 'Servoyu durdur',
	X11_SERVO_STOP_TOOLTIP: 'Belirtilen servoyu durdur',

	// X11 Motor blokları
	X11_MOTOR_SPEED_PREFIX: 'Motor ayarla',
	X11_MOTOR_SPEED_SUFFIX: 'hız',
	X11_MOTOR_SPEED_TOOLTIP: 'DC motor hızını ayarla (-2048 ile 2048 arası, negatif=geri)',
	X11_MOTOR_STOP: 'Motoru durdur',
	X11_MOTOR_STOP_TOOLTIP: 'Belirtilen motoru durdur',

	// X11 LED blokları
	X11_LED_SET_COLOR_PREFIX: 'LED şerit',
	X11_LED_SET_COLOR_INDEX: 'indeks',
	X11_LED_SET_COLOR_INDEX_SUFFIX: 'renk ayarla R',
	X11_LED_SET_COLOR_TOOLTIP: 'LED şerit piksel rengini ayarla (indeks 0=ilk piksel veya tümü)',
	X11_LED_INDEX_ALL: 'Tümü',
});
