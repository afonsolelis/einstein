# Base da Aula 15

Arquivos: `contas_a_pagar.csv` e `fornecedores.csv`.

Origem: dados sintéticos gerados por `gerar_contas.py`, nesta pasta, com a semente `20251125`. A rede hospitalar, os fornecedores e os solicitantes são fictícios. A execução do gerador a partir da raiz do repositório reproduz os dois arquivos byte a byte:

```bash
python materiais/aula-15/dados/gerar_contas.py
```

## Inventário verificável

- `contas_a_pagar.csv`: 5.440 lançamentos de 2025 e 7 colunas (`pagamento_id`, `data_pagamento`, `fornecedor_id`, `nota_fiscal`, `valor`, `solicitante`, `tipo`).
  SHA-256: `b3898f2daa84095b6d56c1ccb661a2dba6c8736e36807770204be4d8b0d3e9ce`.
- `fornecedores.csv`: 120 fornecedores e 4 colunas (`fornecedor_id`, `nome`, `categoria`, `data_cadastro`).
  SHA-256: `2a5fede2703f558f2933798055b03f0eb080e84fbcf361b09d640ca7e45918ea`.

## Composição dos lançamentos

| Origem | Lançamentos | Descrição |
|---|---:|---|
| Legítimos | 5.200 | valores log-normais amplos, aderentes à Lei de Benford, em dias úteis |
| Contratos mensais | 36 | ruído inocente: 12 parcelas iguais de `F012` (R$ 18.500), `F031` (R$ 12.000) e `F058` (R$ 4.750), com notas distintas |
| Estornos | 32 | valores negativos, `tipo = estorno` |
| Duplicados | 18 | mesma nota, fornecedor e valor de um pagamento legítimo, 1 a 5 dias úteis depois |
| Fracionamento | 15 | 5 episódios de 3 pagamentos entre R$ 9.000 e R$ 9.990 na mesma semana (`F023`/`S14`, `F066`/`S19`, `F089`/`S14`) |
| Sem cadastro | 14 | fornecedores `F901` (9) e `F902` (5), ausentes de `fornecedores.csv` |
| Dia não útil | 25 | pagamentos em sábado, domingo ou feriado nacional de 2025 |
| Valores redondos | 40 | `F045`, múltiplos de R$ 500 entre R$ 1.000 e R$ 9.000 |
| Fora de Benford | 60 | `F077`, valores uniformes entre R$ 4.000 e R$ 9.990 |

Além disso, 47 códigos de fornecedor de lançamentos legítimos foram exportados com letras minúsculas ou espaços nas bordas, simulando um defeito de cadastro que a limpeza precisa tratar antes do cruzamento com `fornecedores.csv`.

Essas quantidades são o gabarito da aula. Os testes de regra e estatísticos, descritos no material, devem recuperá-las sem que os parâmetros sejam ajustados para isso; os ruídos inocentes mostram que regra disparada não equivale a irregularidade comprovada.
