# Base da Aula 04 — Rede Vita

Conjunto sintético construído para o laboratório de estatística descritiva
aplicada à gestão. Nenhum registro corresponde a paciente, unidade hospitalar ou
operação real. A base é gerada por `gerar_base.py`, com semente fixa `20260902`
e apenas biblioteca padrão do Python: executar o script novamente reproduz os
mesmos arquivos.

## Arquivos publicados

| Arquivo | Destinatário | Conteúdo | Linhas |
|---|---|---|---|
| `rede_vita_internacoes.csv` | Toda a turma, na segunda rodada | Base completa, um registro por internação | 5.838 |
| `grupo_a_painel_operacoes.csv` | Comitê de Operações (Grupo A) | Painel agregado por unidade e mês de alta | 52 |
| `grupo_b_registros_clinicos.csv` | Comitê Clínico (Grupo B) | Registros individuais das unidades Norte e Sul, com gravidade | 4.500 |
| `grupo_c_registros_risco.csv` | Comitê de Riscos (Grupo C) | Registros individuais das unidades Norte, Leste e Oeste, com reinternação | 3.438 |
| `relatorio_executivo_ia.md` | Toda a turma | Parecer produzido por assistente de IA, objeto da auditoria | — |

Cada recorte é um subconjunto fiel da base completa. Nenhum valor foi alterado
entre a base e os recortes: as divergências de conclusão entre os grupos decorrem
exclusivamente do escopo de cada recorte e da estatística escolhida.

## Dicionário da base completa

| Coluna | Tipo | Significado |
|---|---|---|
| `atendimento_id` | string | Identificador sintético da internação |
| `unidade` | string | Unidade da rede: Norte, Sul, Leste ou Oeste |
| `linha_cuidado` | string | Clínica Médica, Cardiologia, Ortopedia ou Oncologia |
| `gravidade` | string | Estrato de complexidade do caso: Baixa, Média ou Alta |
| `data_admissao` | data | Data de admissão |
| `data_alta` | data | Data de alta |
| `dias_internacao` | inteiro | Permanência em dias, sempre maior ou igual a 1 |
| `custo_total` | decimal | Custo total da internação em reais |
| `reinternacao_30d` | inteiro | 1 quando houve reinternação em até 30 dias; 0 caso contrário |

## Inventário verificável

- 5.838 internações, 9 colunas, sem valores ausentes e sem identificadores duplicados.
- Altas registradas entre 02/01/2025 e 12/02/2026.
- Volume por unidade: Norte 2.100, Sul 2.400, Leste 1.300, Oeste 38.
- Custo total acumulado da rede: R$ 107.899.062,92.

### Assinaturas SHA-256

```
ca2476f35979da0dc575acd1432fd6ef7a2d7503b8fdb6bd25b924cf976af083  rede_vita_internacoes.csv
1774973813c115bae8c1f7034ee6eabadd3005bb2bbacecea244cc1904bb8c03  grupo_a_painel_operacoes.csv
2ba9a180f27c64cbf8f70d2b1df48d654b257773f3f166ba94da76afc1d44c69  grupo_b_registros_clinicos.csv
c05e6e8b60e779a0e2c52e198236d1c6046a728d005d06b3b16a7e0d9e5821c1  grupo_c_registros_risco.csv
```

## Estrutura estatística deliberada

Os parâmetros de geração foram escolhidos para que a base reproduza quatro
situações recorrentes na análise gerencial. A tabela abaixo é referência para o
professor e serve de gabarito de conferência; ela não substitui a demonstração
empírica exigida na entrega dos estudantes.

| Fenômeno | Onde aparece | Evidência esperada |
|---|---|---|
| Efeito de composição entre estratos | Norte e Sul | A unidade Sul apresenta permanência menor em Baixa (2,60 contra 3,02), Média (5,56 contra 6,06) e Alta (10,27 contra 10,89), mas permanência agregada maior (6,70 contra 4,32), porque concentra 40% de casos de gravidade Alta contra 8% da Norte |
| Distribuição bimodal | Leste | Média 4,21 e mediana 1,0; 73,0% das internações duram até dois dias e 19,5% duram dez dias ou mais |
| Amostra pequena | Oeste | 38 internações; a exclusão dos dois casos mais longos move a média de 3,45 para 2,75; a taxa de reinternação de 2,6% corresponde a um único evento |
| Indicador único insuficiente | Norte | Menor permanência agregada da rede entre as unidades comparáveis e a maior taxa de reinternação em 30 dias (17,0% contra 10,0% da Sul), inclusive dentro de cada estrato de gravidade |

Uma quinta situação decorre da janela de observação: as altas de janeiro e
fevereiro de 2026 formam meses incompletos, com poucas linhas e permanência
média elevada. No painel do Grupo A, a média não ponderada das médias mensais
atribui a um mês com uma única alta o mesmo peso de um mês com 123 altas.
