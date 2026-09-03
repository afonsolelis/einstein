# Em andamento

## Aula 5 (09/09) · migrar para Metabase local com Docker

**Estado:** nada foi alterado ainda. Aula 5 continua sendo a de limpeza com Pandas
e Antigravity, intacta e com os testes passando.

### Decisão tomada
- A aula 5 passa a ser **rodar o Metabase localmente com Docker e subir um CSV/Excel
  para análise**, mantendo o case ("podemos confiar nesta base?"), o CSV hospitalar
  do Kaggle e uma entrega verificável.
- **Pandas não sai do curso**: a aula de limpeza é empurrada para depois da aula 5.

### Pendência que trava o resto — decidir primeiro
Empurrar a limpeza cria uma 20ª aula, e o cronograma tem 19 datas fixas
(12/08 a 16/12, quartas). Como absorver:
- (a) renumerar tudo +1 e aceitar uma aula em 23/12;
- (b) fundir a limpeza com a aula 6 atual (Storytelling/Dashboards), que já
  encosta no conteúdo de Metabase das aulas 4 e 5;
- (c) cortar ou fundir uma das aulas 6–19 (todas ainda são esqueletos:
  11 slides e 7 seções cada, contra 24 slides e 20 seções da aula 5).

### Levantado e verificado
- Upload nativo do Metabase aceita **CSV e TSV, não .xlsx** — Excel entra
  convertendo para CSV (vira ponto de ensino sobre encoding e separador).
- Upload exige banco com suporte a upload: o `docker run` simples usa H2 e não
  serve. Precisa de **docker compose com Metabase + Postgres**, mais
  Admin → Settings → Uploads apontando para um schema.
- Artefato a criar: `materiais/aula-05/docker-compose.yml`.
- Checkpoints do CSV já validados em `tests/test_aula_05_dataset.py` e reaproveitáveis
  como consultas de diagnóstico no Metabase: 350 idades / 350 gêneros / 350
  diagnósticos ausentes, 321 diagnósticos em maiúsculas, 150 altas anteriores à
  admissão, 0 duplicidades, 5.000 linhas.
- `tests/e2e/aula-05.spec.js` fixa 24 slides e 12 botões `.copy-prompt`; os botões
  podem ser reaproveitados para copiar comandos Docker e SQL.
- `materiais/aula-05/prompts-antigravity.md` é específico de Pandas — segue com a
  aula de limpeza, para onde ela for.

## Aula 4 (02/09) · concluída
Metabase hospedado + Olist, com fechamento em três gráficos e um dashboard.
Commits `a513d15` e `b44f5a2`. Testes: 50/50 Playwright, 4/4 Python.
