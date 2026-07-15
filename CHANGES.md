Capture a página atual por inteiro e com confiabilidade!

A maneira mais simples de tirar uma captura de página inteira da janela atual do navegador. Clique na extensão na barra do navegador (ou pressione Alt+Shift+P), acompanhe a captura de cada parte da página e acesse uma nova aba com a imagem, na qual você poderá clicar com o botão direito para salvá-la ou simplesmente arrastá-la para a área de trabalho. Sem recursos desnecessários: apenas uma forma simples de transformar uma página da web inteira em uma imagem.

A única maneira de capturar a página inteira é percorrer cada parte visível. Portanto, aguarde enquanto a extensão monta rapidamente todas as partes. No caso raro de a página ser grande demais para o Chrome armazená-la em uma única imagem, a extensão avisará e a dividirá no menor número possível de imagens, abertas em abas separadas.

Este é um projeto de código aberto. Acesse a página do Full Page Screen Capture no GitHub para obter mais informações, relatar erros ou contribuir:

https://github.com/mrcoles/full-page-screen-capture-chrome-extension


Histórico de alterações:

```
1.0.1 — 2016-05-14 — correção do erro “Arquivo não encontrado” no modo anônimo e melhoria no gerenciamento de abas
1.0.0 — 2016-05-09 — esta é uma versão principal: introduz o atalho de teclado, a divisão de imagens para páginas muito longas, melhorias no tratamento de páginas ampliadas ou emuladas, um ícone cinza mais discreto, compatibilidade com SVG e correções de estabilidade (agradecimentos a @bluememory14, @BSierakowski, @denilsonsa e a todos que enviaram relatos de erros)
0.0.15 — 2015-04-05 — adição de data e hora às imagens para que tenham caminhos exclusivos (por @HetIsNiels) e correção da exibição do popup
0.0.14 — 2015-02-14 — mais correções para telas “Retina”
0.0.13 — 2015-01-02 — remoção do recurso de escala para tentar corrigir erros encontrados em telas “Retina”
0.0.12 — 2014-08-24 — alteração das permissões para a opção mais restritiva `activeTab`
0.0.11 — 2014-04-19 — atualização de permissões com compatibilidade retroativa
0.0.10 — 2014-04-17 — correção do problema de permissões que impedia capturas de tela no Chrome 34
0.0.9 — 2013-12-08 — correção de erros na montagem da imagem em telas Retina
0.0.8 — 2013-11-17 — melhoria no cálculo da largura e da altura de páginas fora do padrão
0.0.7 — 2013-10-10 — captura dez vezes mais rápida e restauração da posição de rolagem original após a captura (por @terrycojones)
0.0.6 — 2013-01-26 — correção do caso em que a imagem capturada podia ser carregada como um ícone corrompido, causado pelo carregamento antes do término da gravação no sistema de arquivos
0.0.5 — 2013-01-21 — correção de um pequeno erro da versão 0.0.4
0.0.4 — 2013-01-21 — substituição da API obsoleta `BlobBuilder` por `Blob` (por @gleitz)
0.0.3 — 2012-11-25 — remoção da necessidade de recarregar páginas que estavam abertas antes da instalação da extensão
0.0.2 — 2012-11-21 — mensagens melhores para páginas que não podem ser capturadas (por exemplo, scripts de conteúdo não podem ser executados na Chrome Web Store); a imagem gerada agora também incorpora a URL ao nome
0.0.1 — 2012-11-06 — versão inicial
```
