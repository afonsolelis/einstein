# Contrato de uma aula completa

## Fonte de verdade

O item correspondente no array `aulas` de `index.html` define número, data, tema e tag. Slides e material devem refletir esses dados e apontar explicitamente um para o outro.

## Slides

- HTML autossuficiente em `slides/aula-XX.html`, idioma `pt-BR`, viewport responsiva e favicon.
- `#slider` com capa ativa, slide final e pelo menos 10 slides no total.
- Slides identificáveis para: objetivos, agenda, conteúdo conceitual, prática guiada, desafio/entrega, síntese e próximos passos.
- Controles fixos com Home, Material, anterior, próximo e tela cheia.
- Navegação por `ArrowLeft`, `ArrowRight` e espaço; botões desabilitados nos limites.
- Dark mode premium, foco visível e adaptação para telas pequenas/redução de movimento.

## Material

- Wiki em `materiais/aula-XX/index.html`, light mode e impressão.
- Introdução, objetivos, fundamentos, exemplos de negócio, múltiplos blocos de código, alerta, prática guiada, desafio/entrega, checklist, síntese e referências/continuidade.
- Código copiável e explicado; exemplos devem ser executáveis ou declarar claramente dependências externas.
- Ações finais para Home, Slides e impressão, todas adequadas a `file://`.

## Qualidade didática

Objetivos usam verbos observáveis. A prática progride de demonstração a execução pelo estudante. A entrega tem critério verificável. A síntese retoma os objetivos e prepara a próxima aula. Conteúdo factual sensível ao tempo deve ser verificado antes da publicação.

## Critério de aceite no navegador

Em desktop e viewport móvel: nenhuma rolagem indevida nos slides, material legível sem overflow horizontal, controles operáveis por teclado, links sem 404 e console sem erros. A validação deve cobrir abertura direta ou servidor estático e a navegação cruzada entre cronograma, slides e material.

Executar `npm run test:e2e`. A configuração Playwright inicia o servidor estático e cobre Chromium desktop e mobile; não substituir falhas por tolerâncias sem investigar primeiro a implementação.
