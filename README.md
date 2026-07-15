Captura de Página Inteira
==========================

Uma extensão simples para o Google Chrome que captura uma página da web inteira. Nenhuma das extensões que testei conseguia fazer isso no Chrome 22, no Mac OS X Lion. Por isso, criei esta extensão para realizar a captura de forma confiável. (Ainda não foi testada em outras configurações.)

### Como instalar

Para desenvolvimento:

1. Clone este repositório.
2. Abra o Chrome e acesse a página de extensões (`chrome://extensions`).
3. Ative o modo do desenvolvedor, caso ainda não esteja ativado.
4. Clique em “Carregar sem compactação”.
5. Selecione a pasta desta extensão.

Pela Chrome Web Store:

Encontre o aplicativo [Full Page Screen Capture](https://chrome.google.com/webstore/detail/full-page-screen-capture/fdpohaocaechififmbbbbbknoalclacl) na Chrome Web Store e clique em instalar. (OBSERVAÇÃO: a versão da loja agora utiliza uma branch privada deste repositório e pode conter atualizações adicionais.)

### Observações adicionais

* Informe qualquer erro encontrado por meio das issues do projeto.
* Veja mais detalhes [nesta publicação do blog](http://mrcoles.com/full-page-screen-capture-chrome-extension/).
* Agradecimentos a [terrycojones](https://github.com/terrycojones) e [gleitz](https://github.com/gleitz) pelas contribuições!

### Notas de versão

Este projeto é uma versão modificada e não oficial do
Full Page Screen Capture, criado originalmente por Peter Coles.

Código original:
https://github.com/mrcoles/full-page-screen-capture-chrome-extension

Modificações desta versão:
- Interface traduzida para português do Brasil
- Migração para Manifest V3
- Cópia da captura PNG para a área de transferência
