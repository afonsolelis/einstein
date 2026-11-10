# Aula 13 · Roteiro de prompts

Limpeza orientada ao negócio e previsão semanal de vendas com a base `olist_pedidos.csv`.

Use os prompts em ordem, no Copilot em modo agente ou no agente de sua preferência, dentro do GitHub Codespaces. Antes de aceitar cada etapa, leia o plano e o código, execute a célula e confira a contagem esperada. Se o número divergir, investigue o caminho, o filtro e a ordem das regras; não altere a regra para acertar a contagem.

Preparação no terminal:

```bash
mkdir -p aula-13-seunome/entrada aula-13-seunome/saidas
cp materiais/aula-13/dados/olist_pedidos.csv aula-13-seunome/entrada/
```

## Prompt 1 · Perfil: Perfil da base antes da limpeza

```text
Atue como meu assistente de análise neste laboratório. Crie aula-13-seunome/Aula_13_SeuNome.ipynb e carregue aula-13-seunome/entrada/olist_pedidos.csv em um DataFrame chamado bruta, convertendo order_purchase_timestamp para data.

Mostre: shape, dtypes, order_id duplicado, ausências por coluna, contagem por order_status, primeira e última data de compra e pedidos por mês. Não limpe nem remova nada. Espero 99.441 linhas e 7 colunas; se divergir, pare e me avise. Mostre o plano antes de editar.
```

## Prompt 2 · Regras: Aplicação das regras com contagem

```text
No mesmo notebook, crie vendas a partir de bruta, sem alterar bruta nem o CSV. Aplique nesta ordem e mostre as linhas antes e depois de cada regra:
1. Janela: order_purchase_timestamp de 2017-01-09 até antes de 2018-08-20.
2. Venda: excluir order_status canceled e unavailable.
3. Criar a flag sem_itens para itens ausentes, sem remover a linha.

Espero 97.845 linhas após a regra 1, 96.690 após a regra 2 e 5 flags. Salve a tabela regra, justificativa, linhas_antes, linhas_depois em aula-13-seunome/saidas/regras_de_limpeza.csv. Se algum número divergir, pare e investigue; não ajuste a regra para acertar a contagem.
```

## Prompt 3 · Série: Organização em série semanal

```text
Agregue vendas em uma série semanal de segunda a domingo (resample "W-SUN" sobre order_purchase_timestamp) com as colunas pedidos (contagem de order_id) e receita (soma de valor_produtos). Crie a flag semana_black_friday para a semana encerrada em 2017-11-26.

Verifique com assert que a soma de pedidos é igual ao número de linhas de vendas e que não há semana faltando. Espero 84 semanas, de 2017-01-15 a 2018-08-19. Salve em aula-13-seunome/saidas/vendas_semanais.csv e faça um gráfico de linha de pedidos por semana.
```

## Prompt 4 · Referência: Referências simples no teste

```text
A partir de aula-13-seunome/saidas/vendas_semanais.csv, crie em um DataFrame dados os atributos semana_anterior (pedidos com shift de 1) e media_4_semanas (média das quatro semanas anteriores, com shift de 1 antes do rolling). Remova as linhas sem atributo completo.

Separe as 12 últimas semanas como teste e as demais como treino, sem embaralhar. Calcule o MAE de duas referências no teste: prever semana_anterior e prever media_4_semanas. Explique em uma frase por que o shift evita usar informação do futuro.
```

## Prompt 5 · Modelo: Regressão linear com teste temporal

```text
Treine uma LinearRegression do scikit-learn no treino com os atributos semana_anterior e media_4_semanas e alvo pedidos. Preveja o teste e calcule o MAE.

Monte uma tabela com real, previsto e erro por semana e salve em aula-13-seunome/saidas/real_versus_previsto.csv. Faça um gráfico com as duas linhas. Em seguida repita o treino com train_test_split aleatório (test_size=12, random_state=42) apenas para comparar o MAE, e explique por que esse segundo número não pode ser usado.
```

## Prompt 6 · Parecer: Previsão em faixa e parecer

```text
Com o modelo treinado, preveja a semana de 20 a 26/08/2018 usando a última semana da série e a média das quatro últimas. Apresente o valor previsto e a faixa de mais ou menos um MAE.

Crie aula-13-seunome/PARECER_PREVISAO.md com: pergunta de negócio, regras de limpeza e contagens, MAE das referências e do modelo, previsão em faixa, as duas semanas de maior erro no teste e três limitações. Use somente números produzidos no notebook; não invente valores. Depois proponha git add, commit e push, sem executar antes da minha aprovação.
```

## Conferência final

Execute o script de referência e compare com o notebook:

```bash
python materiais/aula-13/referencia/previsao_referencia.py
```
