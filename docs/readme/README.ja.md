# Singular Blockly

[English](../../README.md) · [繁體中文](README.zh-hant.md) · **日本語** · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-br.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [Čeština](README.cs.md) · [Magyar](README.hu.md) · [Български](README.bg.md)

> このドキュメントは英語版 [README](../../README.md) の翻訳です。内容が異なる場合は英語版が優先されます。

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Singular Blockly アイコン">
</p>

**VS Code の中で、Arduino・CyberBrick・fischertechnik TXT Controller をビジュアルプログラミング。**

Blockly でプログラムを組み立て、生成されたコードをすぐに確認し、PlatformIO、USB、ローカルネットワーク OTA、SSH でアップロードできます。

[VS Code Marketplace からインストール](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Open VSX からインストール](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [ドキュメントを読む](../specifications/README.md)

## 操作デモ

以下の録画は、現在の拡張機能ビルドを使い、実際の VS Code ウィンドウで操作したものです。

**1. エディターを開いてボードを選ぶ。** アクティビティバーの Singular Blockly アイコンをクリックし、「ボードを選択」から使うボードを選びます。

![アクティビティバーから Blockly エディターを開き、Arduino Uno を選択する](../images/readme/open-editor-and-select-board.gif)

**2. ブロックをドラッグして、コードの変化を確認する。** ツールボックスからブロックを「セットアップ」と「ループ」にドラッグし、ドロップダウンで値を変更します。`src/main.cpp` をエディターの横に開いておくと、生成されるプログラムが操作に合わせて変わる様子を確認できます。

![ドラッグ＆ドロップで LED 点滅プログラムを作り、src/main.cpp が更新される](../images/readme/build-program-with-live-code.gif)

**3. 言語とテーマを切り替える。** 矢印ボタンでツールバーを展開し、地球儀メニューでエディターの言語をすぐに切り替え、テーマボタンでライトとダークを切り替えます。

![エディターを繁体字中国語とダークテーマに切り替える](../images/readme/switch-language-and-theme.gif)

## フィードバック、オンラインサービス、データの利用

Blockly エディター内の「フィードバックを送る」ボタン、コマンドパレットの **Singular Blockly: フィードバックを送る**、または VS Code の問題レポーターを使えます。GitHub アカウントは不要です。フォームを開いたり入力したりしてもネットワーク通信は発生しません。送信前に、送信内容のすべてを表示して明示的な確認を求めます。

基本的な環境診断は既定で有効で、無効にできます。最近の構造化イベントは既定で無効です。送信を許可する項目のリストには、ソースコード、Blockly ワークスペースの内容、生成されたコード、ファイル名やフォルダー名、パス、コンピューターやデバイスの識別子、シリアルポート、Wi-Fi と IP の情報、環境変数、認証情報、生のエラーやログは含まれません。任意で添付できるスクリーンショットは 1 枚で、ローカルで再エンコードして元のメタデータを取り除き、1920 ピクセル・3 MiB 以内に制限し、プレビューしたうえで確認後にのみ送信します。

フィードバックには VS Code SecretStorage に保存された匿名のシークレットと、専用の Cloudflare D1/R2 サービスを使用します。メンテナーの作業には非公開の GitHub リポジトリを使用します。これはユーザーが自分で開始するサポート用の送信であり、テレメトリや分析ではありません。詳しくは[プライバシー通知](../../PRIVACY.md)、[サポートポリシー](../../SUPPORT.md)、[フィードバックサービス利用規約](../../TERMS.md)、[セキュリティポリシー](../../SECURITY.md)をご覧ください。

## Singular Blockly の特長

- **1 つのビジュアルエディターで 3 つのワークフロー**：Arduino C++、CyberBrick MicroPython、TXT Controller Python。
- **ハードウェアへそのままアップロード**：Arduino は PlatformIO、CyberBrick は USB またはペアリング済みの LAN OTA、TXT Controller は SSH。
- **授業で使いやすいツール**：ローカライズされたサンプル、TXT の仮想コントロール、I/O テスト、バックアップ、わかりやすいハードウェア診断。
- **モダンな Blockly 体験**：Blockly 13.4.0 と `@blockly/theme-modern`、ライト／ダークテーマ、ブロック検索、タッチ操作、キーボード操作、意味のあるコントロールラベル。すべてオフラインで使えるよう同梱されています。
- **安全なプロジェクトファイル**：自動保存、バックアップからの復元、孤立ブロックの保護、外部からのワークスペース編集の実行時検証。
- **AI 対応のプロジェクト**：プロジェクト内の Agent Skills が、現在のボード、ワークスペース形式、ブロック契約をコーディングエージェントに伝えます。

## クイックスタート

1. [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) または [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly) から Singular Blockly をインストールします。
2. VS Code で書き込み可能なフォルダーを開きます。
3. アクティビティバーの Singular Blockly アイコンをクリックするか、コマンドパレットで **Singular Blockly: Blockly エディターを開く** を実行します。
4. ボードを選び、ツールボックスからプログラムを組み立てます。
5. 生成されたファイル（例：`src/main.cpp`）を開いてコードを確認し、エディターのツールバーにあるアップロードボタンをクリックします。

VS Code の起動後、Singular Blockly は拡張機能専用のストレージに、検証済みの Python、テスト済みバージョン範囲の PlatformIO Core、`mpremote` の実行環境を準備し始めます。Blockly エディターを開くと、編集を妨げずに実行環境を再確認します。Arduino では従来どおりプロバイダーを優先します。VS Code では `platformio.platformio-ide`、VSCodium などの Open VSX 環境では `pioarduino.pioarduino-ide` を使用でき、Singular Core はフォールバックです。カスタムのマネージド実行環境フォルダーは、初回に使用するとき空である必要があります。これにより、修復やクリーンアップで無関係なファイルを取り込むことを防ぎます。

<details>
<summary><b>VSIX のオフラインインストール</b></summary>

1. [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases) から最新の `.vsix` をダウンロードします。
2. コマンドパレットで **Extensions: Install from VSIX...**（拡張機能: VSIX からのインストール）を開きます。
3. ダウンロードしたファイルを選びます。

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>CyberBrick USB のトラブルシューティング</b></summary>

`mpremote` は Singular のマネージド実行環境に自動でインストールされるため、システムの Python は不要です。**PlatformIO 診断** を開くと確認や修復ができます。PlatformIO プロバイダーの環境は互換用のフォールバックとして残り、Singular Blockly が削除やクリーンアップをすることはありません。

</details>

## 対応ボード

| ボード                        | 生成されるコード | セレクター ID | アップロード／実行方法                                     |
| ----------------------------- | ---------------- | ------------- | ---------------------------------------------------------- |
| Arduino Uno                   | `src/main.cpp`   | `uno`         | PlatformIO                                                 |
| Arduino Nano                  | `src/main.cpp`   | `nano`        | PlatformIO                                                 |
| Arduino Mega                  | `src/main.cpp`   | `mega`        | PlatformIO                                                 |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`       | PlatformIO                                                 |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`   | PlatformIO                                                 |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick`  | USB `mpremote` またはペアリング済み LAN OTA → `/app/rc_main.py` |
| fischertechnik TXT Controller | `src/main.py`    | `txt`         | SSH + `python3` → `/tmp/singular_blockly/main.py`          |

Arduino プロジェクトは `platformio.ini` を保持します。CyberBrick と TXT のプロジェクトは Python のワークフローを使い、不要な場合は `platformio.ini` を削除します。

## 主なワークフロー

### Arduino と ESP32

- Arduino C++ を生成し、`platformio.ini` を自動で同期します。
- ボードに応じたポート検出と、対処方法がわかるエラーメッセージ付きで、PlatformIO によるコンパイルとアップロードを行います。
- VS Code のターミナルでシリアル出力をモニターできます。ESP32 プロジェクトでは例外デコードが自動で有効になります。
- I/O、PWM、サーボ、エンコーダーモーター、Wi-Fi/MQTT、Pixetto、HUSKYLENS、標準のプログラミングブロックを使えます。
- 実験的な RC 受信ブロックで、ESP32 DevKit が CyberBrick の ESP-NOW リモコン入力を受け取れます。

### CyberBrick

- ESP32-C3 向けの MicroPython を生成します。GPIO、オンボード LED、タイミング、Wi-Fi、X11/X12、ESP-NOW リモコンのブロックを含みます。
- 既定は USB です。CyberBrick の歯車メニューから、ペアリング済みのローカルネットワーク OTA の送信先を設定できます。
- OTA の初回設定は USB で行います。OTA アップロードが失敗しても自動で USB に切り替えることはなく、教室で別のデバイスにコードが送られることを防ぎます。
- ネットワーク経由のアップロード時に、互換性のある OTA エージェントを最新に保ちます。エージェント更新の警告が出ても、メインプログラムのアップロードは取り消されません。
- VS Code のターミナルから `mpremote` で MicroPython の `print()` 出力をモニターできます。
- ローカライズされた CyberBrick サンプルを閲覧できます。オフライン時は同梱のサンプルを使います。
- Wi-Fi パスワード、OTA トークン、ペアリング用シークレットは VS Code SecretStorage に保存します。OTA の設定でファームウェア、`/boot.py`、WebREPL、無関係なデバイス上のファイルが変更されることはありません。

[CyberBrick の詳細](../specifications/03-hardware-support/cyberbrick-micropython.md) · [拡張ボード](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [RC ペアリング](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- 1 つのセットアップフローと、同時に動く複数の TXT プロセスフローを作成できます。
- SSH で Python プログラムをアップロード、実行、停止できます。
- Blockly エディターから離れずに接続を設定してテストできます。
- 安定したバインドを持つ、ドラッグ可能な仮想ボタンを作成できます。
- 統合された I/O テストパネルで、モーター、出力、センサーをテストできます。

TXT のパスワードは VS Code SecretStorage に保存されます。既定の接続先は `192.168.7.2`、ユーザー名は `ftc` で、生成されたプログラムは `/tmp/singular_blockly/main.py` にアップロードされます。

[TXT Controller の詳細](../specifications/03-hardware-support/txt-controller.md)

### AI 支援ワークフロー

プロジェクト内の Agent Skills が、Codex と Claude Code に現在のボード、ワークスペース形式、実行時に生成されるブロック契約を伝えます。ユーザーが Node.js サーバーをインストールする必要はありません。

外部から `blockly/main.json` が変更された場合は、使い捨ての Blockly 実行環境で検証してから、使用中のワークスペースに反映します。無効な内容は隔離され、最後の有効なワークスペースが復元されます。

[Agent Skills とワークスペースの安全性](../specifications/06-features/agent-skills.md)

## プロジェクトファイル

| パス                    | 用途                                                   |
| ----------------------- | ------------------------------------------------------ |
| `blockly/main.json`     | ブロック、ボードの選択、UI 状態の唯一の情報源          |
| `blockly/main.json.bak` | 最後の有効なワークスペースのバックアップ               |
| `src/main.cpp`          | 生成された Arduino／ESP32 プログラム                   |
| `src/rc_main.py`        | 生成された CyberBrick MicroPython プログラム           |
| `src/main.py`           | 生成された TXT Controller プログラム                   |
| `platformio.ini`        | Arduino 専用の PlatformIO 環境設定                     |

## 設定

設定は VS Code の設定 UI から変更できます。以下の既定値は拡張機能のマニフェストと一致しています。

| 設定                                          | 既定値                                        | 用途                                       |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| `singularBlockly.managedRuntime.path`         | `""`                                          | マネージド実行環境用のフォルダー（任意）   |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | Blockly 以外のプロジェクトでの安全警告を隠す |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | TXT Controller のホスト                    |
| `singular-blockly.txt.username`               | `ftc`                                         | TXT の SSH ユーザー名                      |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | TXT のアップロード先                       |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | TXT I/O テストパネルの基本ポート           |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | CyberBrick の USB／ペアリング済み OTA デバイス一覧 |

Wi-Fi パスワード、OTA トークン、ペアリング用シークレット、TXT のパスワードは `settings.json` ではなく VS Code SecretStorage に保存されます。ドキュメントやログではプレースホルダーまたはマスクされた値を使います。実際の認証情報をプロジェクトファイルやバグ報告に貼り付けないでください。

## 動作要件

- VS Code 1.126.0 以降、または VSCodium 1.126.04524 以降。このバージョンをインストールする前に、古いエディターを更新してください。
- 書き込み可能なワークスペースフォルダー。
- Arduino／ESP32：PlatformIO プロバイダーと C/C++ 拡張機能（`ms-vscode.cpptools`）。
- CyberBrick：通常のアップロードと OTA の初回設定には USB、OTA には共有のローカルネットワークが必要です。拡張機能は有効化後に専用のマネージド Python 環境で `mpremote` を準備し、Blockly エディターを開いたときに再確認します。
- TXT Controller：コントローラーへのネットワーク接続と、デバイス上の Python 3 および `ftrobopy`。

拡張機能の利用者が Node.js をインストールする必要はありません。

## ドキュメントとヘルプ

インターフェースは 15 言語に対応しています：英語、繁体字中国語、日本語、韓国語、ドイツ語、スペイン語、フランス語、イタリア語、ポーランド語、ポルトガル語（ブラジル）、ロシア語、トルコ語、チェコ語、ハンガリー語、ブルガリア語。自動モードでは VS Code の表示言語に従い、エディターの地球儀メニューからすぐに言語を切り替えることもできます。この README も同じ 15 言語で用意しています。ページ上部の言語リンクを使ってください。

- [統合仕様書](../specifications/README.md)
- [PlatformIO 診断とガイド付き修復](../specifications/06-features/platformio-diagnostics.md)
- [シリアルモニター](../specifications/06-features/serial-monitor.md)
- [国際化](../specifications/02-internationalization/i18n.md)
- [ユーザー向けローカライズの流れ](../specifications/02-internationalization/user-facing-localization.md)
- [変更履歴](../../CHANGELOG.md)
- [Issue トラッカー](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [セキュリティポリシー](../../SECURITY.md)

サンプルプロジェクト：[CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot)。ESP-NOW でリモート操作するロボットで、英語と繁体字中国語のドキュメントがあります。

## 開発

開発とビルドのコマンドは、英語版 [README](../../README.md#development) の Development セクションと [CONTRIBUTING.md](../../CONTRIBUTING.md) をご覧ください。

## ライセンス

[Apache License 2.0](../../LICENSE) のもとで提供されています。
