# Base da Aula 14

Arquivo: `experimento_agendamento.csv`

Origem: base sintética gerada por `gerar_experimento.py`, nesta pasta, com semente fixa `20261118`. Os registros são fictícios e não descrevem pacientes, usuários nem instituições reais. O case trata de uma rede hospitalar fictícia que testa uma nova página de agendamento online (variante B) contra a atual (A).

Para reproduzir o arquivo, a partir da raiz do repositório:

```bash
python materiais/aula-14/dados/gerar_experimento.py
```

## Inventário verificável

- 14.392 linhas (uma por sessão) e 8 colunas.
- Colunas: `sessao_id`, `usuario_id`, `data`, `variante`, `dispositivo`, `usuario_interno`, `concluiu` e `tempo_segundos`.
- Sessões de 02/03/2026 a 15/03/2026 (14 dias).
- 10.575 usuários distintos.
- SHA-256 do CSV: `3b6b13db7720df3c07d8e7b9cfeed99bf80040261ba185f89905d0f18bbc80c3`.

## Parâmetros da simulação

- 10.400 usuários externos sorteados com probabilidade de 50% para cada variante.
- Taxa real de conclusão por usuário: 40% em A e 43% em B.
- Tempo até concluir com distribuição lognormal, mediana de 290 segundos em A e 265 em B.
- Cada usuário tem de 1 a 3 sessões; só a última pode concluir o agendamento.

## Problemas inseridos de propósito

Leia esta seção somente depois de concluir o perfil da base em aula.

- 240 linhas duplicadas, idênticas em todos os campos, simulando reenvio do log.
- 15 usuários internos (`usuario_interno = "sim"`), da equipe de TI, com 642 sessões no arquivo (636 sem as duplicadas), 588 delas na variante B e conclusão de 90%.
- 160 usuários expostos às duas variantes por falha de cookie, com 472 sessões sem as duplicadas.
- Em consequência, a divisão de sessões por variante na base bruta (6.974 em A e 7.418 em B) falha no teste de SRM, com p-valor de 0,0002.

A prática da aula remove esses registros por regras ligadas ao desenho do experimento e analisa uma linha por usuário. A base limpa tem 10.400 usuários, 5.280 em A e 5.120 em B.
