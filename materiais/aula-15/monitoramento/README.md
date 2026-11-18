# Aula 15 · Fase H: monitoramento com CrateDB e Grafana

O Compose desta pasta carrega as contas a pagar da aula no CrateDB, recalcula os sinais de auditoria em SQL e publica a fila de exame em um dashboard do Grafana, provisionado a partir de um arquivo JSON versionado.

## Como subir

Na pasta de materiais, a carga lê `../dados`:

```bash
cd materiais/aula-15/monitoramento
docker compose up -d
docker compose logs carga
```

Na cópia do aluno, a carga lê a pasta `entrada`, indicada no `.env` (ignorado pelo Git; recrie depois de clonar):

```bash
cp -r materiais/aula-15/monitoramento aula-15-seunome/
cd aula-15-seunome/monitoramento
echo "DADOS_DIR=../entrada" > .env
docker compose up -d
```

No Codespace, abra pela aba PORTS a porta 3001 (Grafana, leitura anônima; `admin`/`admin` para administrar) e a 4200 (console do CrateDB). A porta 3000 fica com o Metabase do laboratório 5. Para encerrar, `docker compose down`; com `-v`, o volume do CrateDB também é apagado.

## Conteúdo

| Caminho | Função |
|---|---|
| `docker-compose.yml` | serviços `cratedb` (5.10.6), `carga` (Python 3.12, execução única) e `grafana` (11.6.0) |
| `carga/carregar.py` | confere o SHA-256 dos CSV, cria as tabelas brutas, insere sem limpar, grava a tabela `custodia` e executa `sql/deteccao.sql` |
| `sql/deteccao.sql` | views `v_pagamentos`, `v_duplicidade`, `v_sem_cadastro`, `v_dia_nao_util`, `v_fracionamento`, `v_redondo_fornecedor`, `v_benford_digitos`, `v_benford_fornecedor`, `v_sinais`, `v_fila_exame`, `v_serie_diaria`, `v_monitor_diario` e `v_painel_resumo` |
| `grafana/provisioning/datasources/cratedb.yml` | fonte de dados `CrateDB` (uid `cratedb`), pelo plugin de PostgreSQL na porta 5432 |
| `grafana/provisioning/dashboards/auditoria.yml` | lê `grafana/dashboards` a cada 10 s, com `allowUiUpdates: false` |
| `grafana/dashboards/auditoria-contas.json` | dashboard `aula15-auditoria`, com 10 painéis |

## Números de conferência

Conferidos em 18/11/2026 com as imagens acima; coincidem com `referencia/auditoria_referencia.py`.

- 5.440 linhas carregadas e 5.408 pagamentos analisados.
- Fila de exame com 172 pagamentos e R$ 1.052.985,30: fornecedor fora de Benford 60, redondo concentrado 40, dia não útil 25, duplicidade 18, fracionamento 15 e sem cadastro 14.
- Benford por fornecedor: 24 fornecedores, só `F077` acima do qui-quadrado crítico de 26,12 (105,5).
- Monitor diário: 11 dias acima da média dos 20 dias anteriores mais três desvios; 5 deles têm algum pagamento da fila (6 pagamentos, R$ 39.014,37).
- Painel do Prompt 8 (pagamentos em dia não útil por mês): 11 barras que somam 25.

O Isolation Forest não está nas views, porque depende do scikit-learn. Nenhum dos seus 55 pagamentos coincide com outro sinal, então a fila não muda.

## Limitações do CrateDB 5.10 encontradas na montagem

- A janela de uma função de janela não pode terminar antes da linha atual (`ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING`). `v_monitor_diario` usa a janela até a linha atual e retira o próprio dia das somas.
- Uma view não pode usar a cláusula `WINDOW w AS (...)`: o CrateDB não consegue regravar a consulta. A janela é escrita em cada função.
- `SELECT ... FROM unnest([...])` nomeia a coluna `unnest`, e não `col1`; as views usam `generate_series(1, 9)`.
- Um JOIN de `v_sinais` (que usa `UNION ALL`) com `v_pagamentos` filtrado por `sinal` devolveu metade das linhas. `v_painel_resumo` agrega a partir de `v_fila_exame`, que confere com a referência.
