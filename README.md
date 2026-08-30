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
- `pme.html`: ambiente de consulta e elaboração do PME 2026–2036.
- `assets/js/pne-par-data.js`: objetivos, metas e estratégias do PNE e ações do PAR.
- `assets/js/pme.js`: filtros, vinculações e rascunhos de estratégias municipais.
- `assets/css/pme.css`: identidade visual e responsividade do módulo do PME.
- `assets/img/banner-pme-2026-2036.webp`: banner otimizado para divulgação no site.

## Módulo do PME

O módulo reúne os 19 objetivos, 73 metas e 372 estratégias do PNE 2026–2036,
além de 47 ações da planilha municipal de monitoramento do PAR. A vinculação
PAR–PNE é uma proposta técnica inicial para validação durante a elaboração do
Plano Municipal de Educação.

As estratégias municipais criadas na página ficam salvas no navegador do
dispositivo e podem ser exportadas em CSV. Esse recurso é destinado a rascunhos
de trabalho; não substitui o processo de aprovação e publicação oficial.

## Próximas expansões
A estrutura pode receber segmento/instituição/cargo de cada integrante, agenda, atas, resoluções, legislação, conferências e monitoramento do Plano Municipal de Educação.


## Compatibilidade local
Esta versão não depende de `fetch()` para carregar os integrantes e funciona ao abrir `index.html` diretamente pelo Windows (`file://`), além de funcionar normalmente no GitHub Pages.
