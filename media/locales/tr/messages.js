/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
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
	BACKUP_PREVIEW_BTN: 'Önizleme',
	BACKUP_RESTORE_BTN: 'Geri Yükle',
	BACKUP_DELETE_BTN: 'Sil',

	// Board Names
	BOARD_NONE: 'Yok',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',

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
});
