# Singular Blockly

[English](../../README.md) · [繁體中文](README.zh-hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Español](README.es.md) · **Français** · [Italiano](README.it.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-br.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [Čeština](README.cs.md) · [Magyar](README.hu.md) · [Български](README.bg.md)

> Ce document est une traduction du [README](../../README.md) anglais. En cas de différence, la version anglaise fait foi.

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Icône de Singular Blockly">
</p>

**Programmation visuelle pour Arduino, CyberBrick et le fischertechnik TXT Controller, directement dans VS Code.**

Construisez vos programmes avec Blockly, consultez immédiatement le code généré, puis téléversez-le via PlatformIO, USB, OTA sur le réseau local ou SSH.

[Installer depuis VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Installer depuis Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [Lire la documentation](../specifications/README.md)

## En action

Ces enregistrements ont été réalisés dans une vraie fenêtre VS Code avec la version actuelle de l’extension.

**1. Ouvrez l’éditeur et choisissez une carte.** Cliquez sur l’icône Singular Blockly dans la barre d’activité, puis choisissez votre carte dans « Sélectionner une carte ».

![Ouvrir l’éditeur Blockly depuis la barre d’activité et sélectionner Arduino Uno](../images/readme/open-editor-and-select-board.gif)

**2. Glissez des blocs et suivez le code.** Faites glisser des blocs de la boîte à outils vers « Configuration » et « Boucle », modifiez les valeurs avec les listes déroulantes et gardez `src/main.cpp` ouvert à côté de l’éditeur pour voir le programme généré évoluer au fil de votre travail.

![Créer un programme de clignotement par glisser-déposer pendant que src/main.cpp se met à jour](../images/readme/build-program-with-live-code.gif)

**3. Changez de langue et de thème.** Dépliez la barre d’outils avec le bouton fléché, changez immédiatement la langue de l’éditeur avec le menu en forme de globe et passez du thème clair au thème sombre avec le bouton de thème.

![Passer l’éditeur en chinois traditionnel et en thème sombre](../images/readme/switch-language-and-theme.gif)

## Avis, services en ligne et utilisation des données

Utilisez le bouton « Donner votre avis » de l’éditeur Blockly, exécutez **Singular Blockly: Donner votre avis** depuis la palette de commandes, ou utilisez le rapporteur de problèmes de VS Code. Aucun compte GitHub n’est nécessaire. Ouvrir ou remplir le formulaire n’envoie aucune requête réseau ; avant l’envoi, le formulaire affiche l’intégralité du contenu et demande une confirmation explicite.

Les diagnostics de base de l’environnement sont activés par défaut et peuvent être désactivés. Les événements structurés récents sont désactivés par défaut. La liste des champs autorisés exclut le code source, le contenu de l’espace de travail Blockly, le code généré, les noms de fichiers et de dossiers, les chemins, les identifiants de machine et d’appareil, les ports série, les informations Wi-Fi et IP, les variables d’environnement, les identifiants de connexion, ainsi que les erreurs et journaux bruts. Une capture d’écran facultative est réencodée localement, débarrassée de ses métadonnées d’origine, limitée à 1920 pixels et 3 Mio, affichée en aperçu et envoyée uniquement après confirmation.

Les avis utilisent un secret anonyme stocké dans VS Code SecretStorage et un service Cloudflare D1/R2 dédié ; un dépôt GitHub privé sert au travail des mainteneurs. Cet envoi d’assistance déclenché par l’utilisateur n’est ni de la télémétrie ni de l’analyse. Consultez l’[avis de confidentialité](../../PRIVACY.md), la [politique d’assistance](../../SUPPORT.md), les [conditions du service d’avis](../../TERMS.md) et la [politique de sécurité](../../SECURITY.md).

## Pourquoi Singular Blockly ?

- **Un éditeur visuel, trois façons de programmer** : Arduino C++, CyberBrick MicroPython et TXT Controller Python.
- **Téléversement direct sur le matériel** : PlatformIO pour Arduino, USB ou OTA sur réseau local appairé pour CyberBrick, et SSH pour le TXT Controller.
- **Des outils adaptés à la classe** : exemples localisés, commandes virtuelles TXT, tests d’E/S, sauvegardes et diagnostics matériels clairs.
- **Une expérience Blockly moderne** : Blockly 13.4.0 avec `@blockly/theme-modern`, thèmes clair et sombre, recherche de blocs, prise en charge du tactile, navigation au clavier et libellés de commande explicites, le tout intégré pour une utilisation hors ligne.
- **Des fichiers de projet sûrs** : sauvegarde automatique, restauration depuis les sauvegardes, protection contre les blocs orphelins et validation à l’exécution des modifications externes de l’espace de travail.
- **Des projets prêts pour l’IA** : les Agent Skills locaux au projet indiquent aux agents de programmation la carte actuelle, le format de l’espace de travail et le contrat des blocs.

## Démarrage rapide

1. Installez Singular Blockly depuis [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) ou [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly).
2. Ouvrez un dossier accessible en écriture dans VS Code.
3. Cliquez sur l’icône Singular Blockly dans la barre d’activité, ou exécutez **Singular Blockly: Ouvrir l’éditeur Blockly** depuis la palette de commandes.
4. Sélectionnez une carte et construisez votre programme à partir de la boîte à outils.
5. Ouvrez le fichier généré (par exemple `src/main.cpp`) pour relire le code, puis cliquez sur le bouton de téléversement dans la barre d’outils de l’éditeur.

Au démarrage de VS Code, Singular Blockly commence à préparer, dans le stockage propre à l’extension, un Python vérifié, PlatformIO Core dans la plage de versions testée et l’environnement `mpremote`. L’ouverture de l’éditeur Blockly vérifie à nouveau cet environnement sans bloquer l’édition. Arduino continue de privilégier le fournisseur : VS Code utilise `platformio.platformio-ide`, tandis que les environnements Open VSX comme VSCodium peuvent utiliser `pioarduino.pioarduino-ide` ; le Singular Core sert de solution de repli. Un dossier personnalisé pour l’environnement géré doit être vide lors de sa première utilisation, afin que la réparation ou le nettoyage n’adoptent pas de fichiers sans rapport.

<details>
<summary><b>Installation hors ligne du VSIX</b></summary>

1. Téléchargez le dernier `.vsix` depuis [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases).
2. Ouvrez **Extensions: Install from VSIX...** (Extensions : installer à partir de VSIX) dans la palette de commandes.
3. Sélectionnez le fichier téléchargé.

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>Dépannage de CyberBrick en USB</b></summary>

`mpremote` est installé automatiquement dans l’environnement géré de Singular, qui ne nécessite pas de Python système. Ouvrez le **diagnostic PlatformIO** pour le vérifier ou le réparer. L’environnement du fournisseur PlatformIO reste une solution de repli de compatibilité et n’est jamais supprimé ni nettoyé par Singular Blockly.

</details>

## Cartes prises en charge

| Carte                         | Code généré      | ID du sélecteur | Téléversement / exécution                                 |
| ----------------------------- | ---------------- | --------------- | --------------------------------------------------------- |
| Arduino Uno                   | `src/main.cpp`   | `uno`           | PlatformIO                                                |
| Arduino Nano                  | `src/main.cpp`   | `nano`          | PlatformIO                                                |
| Arduino Mega                  | `src/main.cpp`   | `mega`          | PlatformIO                                                |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`         | PlatformIO                                                |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`     | PlatformIO                                                |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick`    | USB `mpremote` ou OTA sur LAN appairé → `/app/rc_main.py` |
| fischertechnik TXT Controller | `src/main.py`    | `txt`           | SSH + `python3` → `/tmp/singular_blockly/main.py`         |

Les projets Arduino conservent `platformio.ini` ; les projets CyberBrick et TXT utilisent des flux Python et le suppriment lorsqu’il n’est pas nécessaire.

## Principales fonctionnalités

### Arduino et ESP32

- Génère du C++ Arduino et synchronise automatiquement `platformio.ini`.
- Compile et téléverse via PlatformIO, avec une détection des ports adaptée à la carte et des messages d’erreur qui indiquent quoi faire.
- Affiche la sortie série dans un terminal VS Code ; les projets ESP32 activent automatiquement le décodage des exceptions.
- Propose des blocs d’E/S, PWM, servo, moteur à encodeur, Wi-Fi/MQTT, Pixetto, HUSKYLENS et de programmation standard.
- Reçoit sur un ESP32 DevKit les commandes de la télécommande CyberBrick en ESP-NOW grâce aux blocs expérimentaux de récepteur RC.

### CyberBrick

- Génère du MicroPython pour l’ESP32-C3, avec des blocs GPIO, LED intégrée, temporisation, Wi-Fi, X11/X12 et télécommande ESP-NOW.
- Utilise l’USB par défaut ; une cible OTA appairée sur le réseau local se configure depuis le menu en forme d’engrenage de CyberBrick.
- La première configuration OTA se fait en USB. Un téléversement OTA qui échoue ne bascule jamais automatiquement sur l’USB, pour éviter que le code n’arrive sur le mauvais appareil de la classe.
- Maintient à jour les agents OTA compatibles lors des téléversements réseau ; un avertissement de mise à jour de l’agent n’annule pas le téléversement du programme principal.
- Affiche la sortie `print()` de MicroPython via `mpremote` dans un terminal VS Code.
- Parcourt des exemples CyberBrick localisés, avec des exemples intégrés pour une utilisation hors ligne.
- Conserve les mots de passe Wi-Fi, les jetons OTA et les secrets d’appairage dans VS Code SecretStorage. La configuration OTA ne modifie ni le micrologiciel, ni `/boot.py`, ni WebREPL, ni d’autres fichiers de l’appareil.

[Détails sur CyberBrick](../specifications/03-hardware-support/cyberbrick-micropython.md) · [Cartes d’extension](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [Appairage RC](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- Créez un flux de configuration et plusieurs flux de processus TXT qui s’exécutent en même temps.
- Téléversez, exécutez et arrêtez des programmes Python via SSH.
- Configurez et testez la connexion sans quitter l’éditeur Blockly.
- Créez des boutons virtuels déplaçables avec des liaisons stables.
- Testez moteurs, sorties et capteurs depuis le panneau de test d’E/S intégré.

Les mots de passe TXT sont stockés dans VS Code SecretStorage. La cible par défaut est `192.168.7.2` avec l’utilisateur `ftc` ; le programme généré est téléversé vers `/tmp/singular_blockly/main.py`.

[Détails sur le TXT Controller](../specifications/03-hardware-support/txt-controller.md)

### Flux assistés par l’IA

Les Agent Skills locaux au projet fournissent à Codex et Claude Code la carte actuelle, le format de l’espace de travail et le contrat de blocs dérivé à l’exécution. Aucun serveur Node.js n’est à installer par l’utilisateur.

Les modifications externes de `blockly/main.json` passent par des environnements Blockly jetables avant d’atteindre l’espace de travail actif. Les contenus non valides sont mis en quarantaine et le dernier espace de travail valide est restauré.

[Agent Skills et sécurité de l’espace de travail](../specifications/06-features/agent-skills.md)

## Fichiers du projet

| Chemin                  | Rôle                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| `blockly/main.json`     | Source de référence des blocs, du choix de carte et de l’état de l’interface |
| `blockly/main.json.bak` | Sauvegarde du dernier espace de travail valide                       |
| `src/main.cpp`          | Programme Arduino / ESP32 généré                                     |
| `src/rc_main.py`        | Programme MicroPython CyberBrick généré                              |
| `src/main.py`           | Programme TXT Controller généré                                      |
| `platformio.ini`        | Configuration de l’environnement PlatformIO, pour Arduino uniquement |

## Configuration

Les paramètres sont accessibles dans l’interface des paramètres de VS Code. Les valeurs par défaut ci-dessous correspondent au manifeste de l’extension.

| Paramètre                                     | Valeur par défaut                             | Rôle                                                        |
| --------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `singularBlockly.managedRuntime.path`         | `""`                                          | Dossier facultatif pour l’environnement géré                |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | Masquer l’avertissement de sécurité hors projet Blockly     |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | Hôte du TXT Controller                                      |
| `singular-blockly.txt.username`               | `ftc`                                         | Nom d’utilisateur SSH du TXT                                |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | Destination du téléversement sur le TXT                     |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | Port de base du panneau de test d’E/S du TXT                |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | Registre des appareils CyberBrick USB / OTA appairés        |

Les mots de passe Wi-Fi, les jetons OTA, les secrets d’appairage et les mots de passe TXT sont stockés dans VS Code SecretStorage, et non dans `settings.json`. La documentation et les journaux utilisent des valeurs fictives ou masquées ; ne collez jamais de vrais identifiants dans les fichiers du projet ou les rapports de bogue.

## Prérequis

- VS Code 1.126.0 ou ultérieur, ou VSCodium 1.126.04524 ou ultérieur. Mettez à jour les éditeurs plus anciens avant d’installer cette version.
- Un dossier d’espace de travail accessible en écriture.
- Arduino / ESP32 : un fournisseur PlatformIO et l’extension C/C++ (`ms-vscode.cpptools`).
- CyberBrick : l’USB pour le téléversement normal et la première configuration OTA ; un réseau local partagé uniquement pour l’OTA. Après son activation, l’extension prépare `mpremote` dans son propre environnement Python géré et le vérifie à nouveau à l’ouverture de l’éditeur Blockly.
- TXT Controller : un accès réseau au contrôleur, avec Python 3 et `ftrobopy` disponibles sur l’appareil.

Les utilisateurs de l’extension n’ont pas besoin de Node.js.

## Documentation et aide

L’interface est disponible en 15 langues : anglais, chinois traditionnel, japonais, coréen, allemand, espagnol, français, italien, polonais, portugais (Brésil), russe, turc, tchèque, hongrois et bulgare. Le mode automatique suit la langue d’affichage de VS Code, et le menu en forme de globe de l’éditeur permet de changer de langue immédiatement. Ce README existe dans les mêmes 15 langues ; utilisez les liens de langue en haut de la page.

- [Spécifications intégrées](../specifications/README.md)
- [Diagnostic PlatformIO et réparation guidée](../specifications/06-features/platformio-diagnostics.md)
- [Moniteur série](../specifications/06-features/serial-monitor.md)
- [Internationalisation](../specifications/02-internationalization/i18n.md)
- [Processus de localisation de l’interface](../specifications/02-internationalization/user-facing-localization.md)
- [Journal des modifications](../../CHANGELOG.md)
- [Suivi des problèmes](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [Politique de sécurité](../../SECURITY.md)

Projet d’exemple : [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot), un robot télécommandé en ESP-NOW, documenté en anglais et en chinois traditionnel.

## Développement

Les commandes de développement et de compilation se trouvent dans la section Development du [README](../../README.md#development) anglais et dans [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licence

Distribué sous [Apache License 2.0](../../LICENSE).
