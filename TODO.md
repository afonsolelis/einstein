# Em andamento

## Aula 7 (23/09) · Storytelling, Dashboards e Segmentação — próxima a construir
Hoje é esqueleto (11 slides, 7 seções). É a primeira aula do cronograma que ainda
não tem conteúdo real, agora que 5 e 6 estão fechadas.

Ponto de partida: a aula 6 entrega uma base tratada com flags e um relatório de
qualidade; a aula 7 deveria consumir esses artefatos em vez de começar do zero.

# Concluído

## Aula 5 (09/09) · Metabase local com Docker
Substituiu a aula de limpeza no slot de 09/09. Sobe Metabase + dois PostgreSQL
via Compose, carrega o CSV hospitalar bruto e responde "podemos confiar nesta
base?" com sete consultas de diagnóstico. Passa no validador `--complete`.

- `materiais/aula-05/docker-compose.yml` validado com `docker compose config`.
- Checkpoints conferidos direto no CSV: 5.000 linhas; 350 idades, 350 gêneros e
  350 diagnósticos ausentes; 321 diagnósticos em maiúsculas (28 categorias
  aparentes contra 14 reais); 150 altas anteriores à admissão; 0 duplicidades.
- O dataset mora agora em `materiais/aula-05/dados/`; a aula 6 aponta para lá.
- `tests/e2e/aula-05.spec.js` cobre o card, o Compose publicado, os 26 slides sem
  corte em desktop e mobile e os números de conferência no material.

### Decisões de cronograma tomadas
- A limpeza com Pandas foi empurrada para a aula 6 (16/09) intacta, e as aulas
  6, 7 e 8 antigas viraram 7, 8 e 9.
- O slot extra saiu da fusão das antigas aulas 9 e 10 — a 10 era declaradamente
  o estudo de caso prático da 9. A nova aula 10 (14/10) cobre desenho do
  experimento, os dois testes e o caso completo.
- As 19 datas fixas (12/08 a 16/12) foram preservadas; nada caiu em 23/12.

### Correções de arrasto encontradas na renumeração
- `slides/aula-06.html` tinha `<title>Laboratório 4</title>` e prompts pedindo
  `Aula_04_SeuNome.ipynb`; ambos corrigidos para 6.
- `materiais/aula-05/dados/README.md` dizia "Base da Aula 03".
- O validador de aulas rejeita a palavra solta "todo" como marcador pendente —
  vale lembrar ao escrever as próximas aulas.

## Aula 4 (02/09) · SQL II com Olist no Metabase hospedado
Commits `a513d15` e `b44f5a2`.
