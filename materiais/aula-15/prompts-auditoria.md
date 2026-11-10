# Aula 15 · Roteiro de prompts

Auditoria de contas a pagar com regras de negócio, Lei de Benford e Isolation Forest, sobre as bases sintéticas `contas_a_pagar.csv` e `fornecedores.csv`.

Use os prompts em ordem, no Copilot em modo agente ou no agente de sua preferência, dentro do GitHub Codespaces. Antes de aceitar cada etapa, leia o plano e o código, execute a célula e confira a contagem esperada. Se o número divergir, investigue o código; não altere janela, limiar ou peso para acertar a contagem. Recuse qualquer frase do agente que atribua fraude, culpa ou intenção: o relatório recomenda examinar.

Preparação no terminal:

```bash
mkdir -p aula-15-seunome/entrada aula-15-seunome/saidas
cp materiais/aula-15/dados/contas_a_pagar.csv aula-15-seunome/entrada/
cp materiais/aula-15/dados/fornecedores.csv aula-15-seunome/entrada/
sha256sum aula-15-seunome/entrada/*.csv
```

Hashes esperados:

- `contas_a_pagar.csv`: `b3898f2daa84095b6d56c1ccb661a2dba6c8736e36807770204be4d8b0d3e9ce`
- `fornecedores.csv`: `2a5fede2703f558f2933798055b03f0eb080e84fbcf361b09d640ca7e45918ea`

## Prompt 1 · Perfil e custódia: Perfil da base com hash de entrada

```text
Atue como meu assistente de auditoria neste laboratório. Crie aula-15-seunome/Aula_15_SeuNome.ipynb. Na primeira célula, calcule o SHA-256 de entrada/contas_a_pagar.csv e guarde em hash_inicial.

Carregue contas_a_pagar.csv em bruta (data_pagamento como data, fornecedor_id como texto) e fornecedores.csv em cadastro. Mostre shape, dtypes, pagamento_id duplicado, contagem por tipo, valor mínimo e máximo e pagamentos por mês. Não limpe nada. Espero 5.440 linhas e 7 colunas; se divergir, pare. Mostre o plano antes de editar.
```

## Prompt 2 · Limpeza: Limpeza orientada ao negócio

```text
Crie base a partir de bruta, sem alterar bruta nem os CSVs. Conte quantos fornecedor_id de bruta não existem em cadastro. Em seguida normalize fornecedor_id com strip e upper, conte quantos códigos mudaram e repita a contagem sem cadastro.

Crie pagamentos apenas com tipo igual a pagamento; os estornos ficam fora dos testes porque não são saída de caixa. Mostre o número de pagamentos, o valor total e quantos têm valor igual ou acima da alçada de R$ 10.000. Espero 61 sem cadastro antes, 47 códigos normalizados, 14 sem cadastro depois e 5.408 pagamentos.
```

## Prompt 3 · Regras: Duplicidade, cadastro e calendário

```text
Em pagamentos, crie as flags booleanas:
1. duplicidade: duplicated por fornecedor_id, nota_fiscal e valor, mantendo a primeira ocorrência. Compare com a regra ingênua por fornecedor_id e valor e mostre quais fornecedores explicam a diferença.
2. sem_cadastro: fornecedor_id ausente de cadastro.
3. dia_nao_util: sábado, domingo ou um destes feriados de 2025: 01/01, 03/03, 04/03, 18/04, 21/04, 01/05, 19/06, 07/09, 12/10, 02/11, 15/11, 20/11 e 25/12.

Espero 18, 14 e 25. Mostre amostras de cada flag. Não remova nenhum pagamento.
```

## Prompt 4 · Alçada: Fracionamento e valores redondos

```text
Crie a flag fracionamento: entre pagamentos de R$ 9.000 a R$ 9.999,99, agrupe por fornecedor_id e solicitante e marque cada pagamento que tenha, a até 6 dias dele (inclusive ele), pelo menos 2 pagamentos somando R$ 10.000 ou mais.

Crie valor_redondo para valor igual ou acima de R$ 1.000 e múltiplo de R$ 100. Calcule, por fornecedor, a proporção de valores redondos e crie redondo_concentrado quando o pagamento é redondo e o fornecedor tem 10 ou mais pagamentos com 30% ou mais de redondos. Espero 116 pagamentos na faixa, 15 em fracionamento, 64 redondos e 40 concentrados.
```

## Prompt 5 · Benford: Benford no total e por fornecedor

```text
Use os pagamentos com valor de R$ 10 ou mais. Extraia o primeiro dígito significativo e compare a proporção observada com a esperada por Benford, log10(1 + 1/d), em tabela e gráfico de barras. Calcule o MAD e o qui-quadrado (scipy.stats.chisquare) da população inteira.

Repita para cada fornecedor com 50 ou mais pagamentos, salve mad, qui_quadrado e p_valor em saidas/benford_fornecedores.csv e crie a flag fornecedor_fora_benford para p-valor abaixo de 0,001. Mostre quantos fornecedores teriam MAD acima de 0,015 e explique por que esse critério não serve para amostras pequenas.
```

## Prompt 6 · Isolation Forest: Triagem estatística complementar

```text
Monte os atributos log_valor (log10 do valor), dia_semana e pagamentos_fornecedor_mes (quantidade de pagamentos do mesmo fornecedor no mesmo mês). Treine IsolationForest(contamination=0.01, random_state=42) do scikit-learn e crie a flag anomalia_isolation.

Mostre quantos pagamentos foram marcados, quantos também dispararam alguma regra ou Benford e a distribuição de valor dos marcados. Explique em duas frases o que o algoritmo encontrou e por que isso não equivale a irregularidade.
```

## Prompt 7 · Fila e relatório: Fila priorizada e relatório

```text
Calcule pontuacao com os pesos: duplicidade, fracionamento e sem_cadastro valem 3; fornecedor_fora_benford, dia_nao_util e redondo_concentrado valem 2; anomalia_isolation vale 1. Crie a coluna sinais com os nomes das flags ativas.

Salve em saidas/fila_de_exame.csv os pagamentos com pontuação 2 ou mais, ordenados por pontuação e valor. Salve saidas/achados.csv com uma linha por pagamento e sinal, incluindo parâmetro e data da execução. Recalcule o SHA-256 da entrada e confirme com assert que é igual a hash_inicial.

Crie RELATORIO_AUDITORIA.md com hashes, regras, contagens, pesos, fila por sinal e limitações. Use somente números do notebook e escreva "examinar", nunca "fraude comprovada". Proponha git add, commit e push sem executar.
```

## Conferência final

Execute o script de referência e compare com o notebook:

```bash
python materiais/aula-15/referencia/auditoria_referencia.py
```
