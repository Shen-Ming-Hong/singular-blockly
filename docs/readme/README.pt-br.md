# Singular Blockly

[English](../../README.md) · [繁體中文](README.zh-hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Polski](README.pl.md) · **Português (Brasil)** · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [Čeština](README.cs.md) · [Magyar](README.hu.md) · [Български](README.bg.md)

> Este documento é uma tradução do [README](../../README.md) em inglês. Em caso de diferença, vale a versão em inglês.

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Ícone do Singular Blockly">
</p>

**Programação visual para Arduino, CyberBrick e fischertechnik TXT Controller, dentro do VS Code.**

Monte programas com o Blockly, veja na hora o código gerado e envie por PlatformIO, USB, OTA na rede local ou SSH.

[Instalar pelo VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [Instalar pelo Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [Ler a documentação](../specifications/README.md)

## Veja em ação

Estas gravações foram feitas em uma janela real do VS Code com a versão atual da extensão.

**1. Abra o editor e escolha uma placa.** Clique no ícone do Singular Blockly na barra de atividades e escolha sua placa em "Selecionar placa".

![Abrir o editor Blockly pela barra de atividades e selecionar Arduino Uno](../images/readme/open-editor-and-select-board.gif)

**2. Arraste blocos e acompanhe o código.** Arraste blocos da caixa de ferramentas para "Configuração" e "Loop", altere valores nos menus suspensos e deixe `src/main.cpp` aberto ao lado do editor para ver o programa gerado mudar enquanto você trabalha.

![Montar um programa de piscar arrastando blocos enquanto src/main.cpp é atualizado](../images/readme/build-program-with-live-code.gif)

**3. Troque o idioma e o tema.** Expanda a barra de ferramentas com o botão de seta, use o menu do globo para trocar o idioma do editor na hora e use o botão de tema para alternar entre claro e escuro.

![Trocar o editor para chinês tradicional e para o tema escuro](../images/readme/switch-language-and-theme.gif)

## Feedback, serviços on-line e uso de dados

Use o botão "Enviar feedback" no editor Blockly, execute **Singular Blockly: Enviar feedback** na paleta de comandos ou use o relator de problemas do VS Code. Não é preciso ter conta no GitHub. Abrir ou preencher o formulário não faz nenhuma requisição de rede; antes do envio, o formulário mostra todo o conteúdo e pede uma confirmação explícita.

O diagnóstico básico do ambiente fica ativado por padrão e pode ser desativado. Os eventos estruturados recentes ficam desativados por padrão. A lista de campos permitidos exclui código-fonte, conteúdo do espaço de trabalho do Blockly, código gerado, nomes de arquivos e pastas, caminhos, identificadores de computador e de dispositivo, portas seriais, informações de Wi-Fi e IP, variáveis de ambiente, credenciais, erros brutos e logs brutos. Uma captura de tela opcional é recodificada localmente, tem os metadados originais removidos, é limitada a 1920 pixels e 3 MiB, aparece em pré-visualização e só é enviada após a confirmação.

O feedback usa um segredo anônimo guardado no VS Code SecretStorage e um serviço dedicado do Cloudflare D1/R2; os mantenedores trabalham com um repositório privado no GitHub. Este envio de suporte iniciado pelo usuário não é telemetria nem análise de uso. Consulte o [aviso de privacidade](../../PRIVACY.md), a [política de suporte](../../SUPPORT.md), os [termos do serviço de feedback](../../TERMS.md) e a [política de segurança](../../SECURITY.md).

## Por que usar o Singular Blockly?

- **Um editor visual, três fluxos de programação**: Arduino C++, CyberBrick MicroPython e TXT Controller Python.
- **Envio direto para o hardware**: PlatformIO para Arduino, USB ou OTA em LAN pareada para CyberBrick e SSH para o TXT Controller.
- **Ferramentas para a sala de aula**: exemplos localizados, controles virtuais do TXT, teste de E/S, backups e diagnósticos de hardware claros.
- **Experiência Blockly moderna**: Blockly 13.4.0 com `@blockly/theme-modern`, temas claro e escuro, busca de blocos, suporte a toque, navegação por teclado e rótulos de controle descritivos, tudo incluído para uso off-line.
- **Arquivos de projeto seguros**: salvamento automático, recuperação por backup, proteção contra blocos órfãos e validação em tempo de execução das edições externas no espaço de trabalho.
- **Projetos prontos para IA**: os Agent Skills locais do projeto informam aos agentes de programação a placa atual, o formato do espaço de trabalho e o contrato dos blocos.

## Início rápido

1. Instale o Singular Blockly pelo [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) ou pelo [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly).
2. Abra no VS Code uma pasta com permissão de escrita.
3. Clique no ícone do Singular Blockly na barra de atividades ou execute **Singular Blockly: Abrir editor Blockly** na paleta de comandos.
4. Selecione uma placa e monte seu programa pela caixa de ferramentas.
5. Abra o arquivo gerado (por exemplo, `src/main.cpp`) para revisar o código e clique no botão de envio na barra de ferramentas do editor.

Ao iniciar o VS Code, o Singular Blockly começa a preparar, no armazenamento próprio da extensão, um Python verificado, o PlatformIO Core dentro da faixa de versões testada e o ambiente do `mpremote`. Ao abrir o editor Blockly, esse ambiente é verificado de novo sem bloquear a edição. O Arduino continua usando primeiro o provedor: o VS Code usa `platformio.platformio-ide`, enquanto ambientes Open VSX como o VSCodium podem usar `pioarduino.pioarduino-ide`; o Singular Core é a alternativa. Uma pasta personalizada para o ambiente gerenciado precisa estar vazia no primeiro uso, para que o reparo ou a limpeza não adotem arquivos sem relação.

<details>
<summary><b>Instalação off-line do VSIX</b></summary>

1. Baixe o `.vsix` mais recente em [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases).
2. Abra **Extensions: Install from VSIX...** (Extensões: Instalar do VSIX) na paleta de comandos.
3. Selecione o arquivo baixado.

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>Solução de problemas do CyberBrick por USB</b></summary>

O `mpremote` é instalado automaticamente no ambiente gerenciado do Singular, que não precisa de um Python do sistema. Abra o **diagnóstico do PlatformIO** para verificar ou reparar. O ambiente do provedor PlatformIO continua como alternativa de compatibilidade e nunca é removido nem limpo pelo Singular Blockly.

</details>

## Placas compatíveis

| Placa                         | Código gerado    | ID do seletor | Envio / execução                                          |
| ----------------------------- | ---------------- | ------------- | --------------------------------------------------------- |
| Arduino Uno                   | `src/main.cpp`   | `uno`         | PlatformIO                                                |
| Arduino Nano                  | `src/main.cpp`   | `nano`        | PlatformIO                                                |
| Arduino Mega                  | `src/main.cpp`   | `mega`        | PlatformIO                                                |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`       | PlatformIO                                                |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`   | PlatformIO                                                |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick`  | USB `mpremote` ou OTA em LAN pareada → `/app/rc_main.py`  |
| fischertechnik TXT Controller | `src/main.py`    | `txt`         | SSH + `python3` → `/tmp/singular_blockly/main.py`         |

Projetos Arduino mantêm o `platformio.ini`; projetos CyberBrick e TXT usam fluxos em Python e removem o arquivo quando ele não é necessário.

## Principais fluxos

### Arduino e ESP32

- Gera C++ para Arduino e sincroniza o `platformio.ini` automaticamente.
- Compila e envia pelo PlatformIO, com detecção de porta de acordo com a placa e mensagens de erro que indicam o que fazer.
- Monitora a saída serial em um terminal do VS Code; nos projetos ESP32 a decodificação de exceções é ativada automaticamente.
- Oferece blocos de E/S, PWM, servo, motor com encoder, Wi-Fi/MQTT, Pixetto, HUSKYLENS e programação padrão.
- Recebe em um ESP32 DevKit os comandos do controle remoto CyberBrick via ESP-NOW com os blocos experimentais de receptor RC.

### CyberBrick

- Gera MicroPython para o ESP32-C3, com blocos de GPIO, LED da placa, temporização, Wi-Fi, X11/X12 e controle remoto ESP-NOW.
- Usa USB por padrão; configure um destino OTA pareado na rede local pelo menu de engrenagem do CyberBrick.
- A primeira configuração do OTA é feita por USB. Se um envio OTA falhar, ele nunca passa para USB automaticamente, evitando que o código chegue ao dispositivo errado da sala.
- Mantém os agentes OTA compatíveis atualizados durante envios pela rede; um aviso de atualização do agente não descarta o envio do programa principal.
- Monitora a saída `print()` do MicroPython pelo `mpremote` em um terminal do VS Code.
- Navega por exemplos localizados do CyberBrick, com exemplos incluídos para uso off-line.
- Guarda senhas de Wi-Fi, tokens OTA e segredos de pareamento no VS Code SecretStorage. A configuração do OTA não altera o firmware, o `/boot.py`, o WebREPL nem outros arquivos do dispositivo.

[Detalhes do CyberBrick](../specifications/03-hardware-support/cyberbrick-micropython.md) · [Placas de expansão](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [Pareamento RC](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- Crie um fluxo de configuração e vários fluxos de processo TXT executados ao mesmo tempo.
- Envie, execute e pare programas Python por SSH.
- Configure e teste a conexão sem sair do editor Blockly.
- Crie botões virtuais arrastáveis com vínculos estáveis.
- Teste motores, saídas e sensores no painel integrado de teste de E/S.

As senhas do TXT ficam no VS Code SecretStorage. O destino padrão é `192.168.7.2` com o usuário `ftc`; o programa gerado é enviado para `/tmp/singular_blockly/main.py`.

[Detalhes do TXT Controller](../specifications/03-hardware-support/txt-controller.md)

### Fluxos assistidos por IA

Os Agent Skills locais do projeto informam ao Codex e ao Claude Code a placa atual, o formato do espaço de trabalho e o contrato de blocos derivado em tempo de execução. Não é preciso instalar nenhum servidor Node.js.

Alterações externas no `blockly/main.json` passam por ambientes Blockly descartáveis antes de chegar ao espaço de trabalho ativo. Conteúdos inválidos ficam em quarentena e o último espaço de trabalho válido é restaurado.

[Agent Skills e segurança do espaço de trabalho](../specifications/06-features/agent-skills.md)

## Arquivos do projeto

| Caminho                 | Finalidade                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| `blockly/main.json`     | Fonte oficial dos blocos, da placa selecionada e do estado da interface |
| `blockly/main.json.bak` | Backup do último espaço de trabalho válido                        |
| `src/main.cpp`          | Programa Arduino / ESP32 gerado                                   |
| `src/rc_main.py`        | Programa MicroPython do CyberBrick gerado                         |
| `src/main.py`           | Programa do TXT Controller gerado                                 |
| `platformio.ini`        | Configuração do ambiente PlatformIO, só para Arduino              |

## Configuração

As configurações ficam na interface de Configurações do VS Code. Os valores padrão abaixo são os do manifesto da extensão.

| Configuração                                  | Padrão                                        | Finalidade                                                  |
| --------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `singularBlockly.managedRuntime.path`         | `""`                                          | Pasta opcional para o ambiente gerenciado                   |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | Ocultar o aviso de segurança em projetos que não são Blockly |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | Host do TXT Controller                                      |
| `singular-blockly.txt.username`               | `ftc`                                         | Usuário SSH do TXT                                          |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | Destino do envio no TXT                                     |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | Porta base do painel de teste de E/S do TXT                 |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | Registro de dispositivos CyberBrick USB / OTA pareado       |

Senhas de Wi-Fi, tokens OTA, segredos de pareamento e senhas do TXT ficam no VS Code SecretStorage, não no `settings.json`. A documentação e os logs usam marcadores ou valores ocultos; nunca cole credenciais reais em arquivos do projeto ou em relatos de bugs.

## Requisitos

- VS Code 1.126.0 ou posterior, ou VSCodium 1.126.04524 ou posterior. Atualize editores mais antigos antes de instalar esta versão.
- Uma pasta de espaço de trabalho com permissão de escrita.
- Arduino / ESP32: um provedor PlatformIO e a extensão C/C++ (`ms-vscode.cpptools`).
- CyberBrick: USB para o envio normal e a primeira configuração do OTA; uma rede local compartilhada só para o OTA. Depois de ativada, a extensão prepara o `mpremote` no próprio ambiente Python gerenciado e verifica de novo ao abrir o editor Blockly.
- TXT Controller: acesso de rede ao controlador, com Python 3 e `ftrobopy` disponíveis no dispositivo.

Quem usa a extensão não precisa de Node.js.

## Documentação e ajuda

A interface está disponível em 15 idiomas: inglês, chinês tradicional, japonês, coreano, alemão, espanhol, francês, italiano, polonês, português (Brasil), russo, turco, tcheco, húngaro e búlgaro. O modo automático segue o idioma de exibição do VS Code, e o menu do globo do editor troca o idioma na hora. Este README está disponível nos mesmos 15 idiomas; use os links de idioma no topo da página.

- [Especificações integradas](../specifications/README.md)
- [Diagnóstico do PlatformIO e reparo guiado](../specifications/06-features/platformio-diagnostics.md)
- [Monitor serial](../specifications/06-features/serial-monitor.md)
- [Internacionalização](../specifications/02-internationalization/i18n.md)
- [Fluxo de localização da interface](../specifications/02-internationalization/user-facing-localization.md)
- [Registro de alterações](../../CHANGELOG.md)
- [Rastreador de issues](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [Política de segurança](../../SECURITY.md)

Projeto de exemplo: [CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot), um robô controlado remotamente por ESP-NOW, com documentação em inglês e chinês tradicional.

## Desenvolvimento

Os comandos de desenvolvimento e compilação estão na seção Development do [README](../../README.md#development) em inglês e no [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licença

Distribuído sob a [Apache License 2.0](../../LICENSE).
