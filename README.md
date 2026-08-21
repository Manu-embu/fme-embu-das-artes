# FME — Fórum Municipal de Educação de Embu das Artes

Protótipo estático para apresentação ao Fórum Municipal de Educação.

## Visualização
Para testar localmente, abra a pasta em um servidor local (por exemplo, Live Server no VS Code). O site também está pronto para GitHub Pages.

## Estrutura
- `index.html`: página principal.
- `assets/css/style.css`: identidade visual e responsividade.
- `assets/js/app.js`: busca de integrantes e menu mobile.
- `assets/js/membros.json`: cadastro básico dos integrantes.
- `assets/img/membros/`: fotografias padronizadas para os cards.

## Próximas expansões
A estrutura pode receber segmento/instituição/cargo de cada integrante, agenda, atas, resoluções, legislação, conferências e monitoramento do Plano Municipal de Educação.


## Compatibilidade local
Esta versão não depende de `fetch()` para carregar os integrantes e funciona ao abrir `index.html` diretamente pelo Windows (`file://`), além de funcionar normalmente no GitHub Pages.
