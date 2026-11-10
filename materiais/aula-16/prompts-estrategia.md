# Aula 16 · Roteiro de prompts

Decisão sobre o próximo centro de distribuição com a base `olist_pedidos.csv` da aula 13.

Use os prompts em ordem, no Copilot em modo agente ou no agente de sua preferência, dentro do GitHub Codespaces. Antes de aceitar cada etapa, leia o plano e o código, execute a célula e confira o número esperado. Premissas sem origem na base são registradas como suposição, com o responsável por confirmá-las; a IA não deve estimá-las.

Preparação no terminal:

```bash
mkdir -p aula-16-seunome/entrada aula-16-seunome/saidas
cp materiais/aula-13/dados/olist_pedidos.csv aula-16-seunome/entrada/
```

## Prompt 1 · Enquadramento: Estrutura da decisão antes dos dados

```text
Atue como analista de estratégia. A diretoria de um marketplace avalia abrir um centro de distribuição regional fora de São Paulo, ou não abrir agora. Ainda não recomende nenhuma alternativa e não escreva código.

Estruture a decisão em: objetivo, quem decide, alternativas (inclua "não abrir"), critérios mensuráveis, informações que faltam e riscos de cada critério. Para cada critério, diga se ele pode ser medido com uma base de pedidos que tem estado do cliente, data, status, valor dos produtos e frete.
```

## Prompt 2 · Indicadores: Indicadores por estado com a base limpa

```text
Crie aula-16-seunome/Aula_16_SeuNome.ipynb. Carregue aula-16-seunome/entrada/olist_pedidos.csv e aplique as regras da aula 13: compras de 2017-01-09 até antes de 2018-08-20 e exclusão dos status canceled e unavailable. Espero 96.690 vendas.

Agregue por customer_state: pedidos, receita (soma de valor_produtos), frete_medio, peso_frete (frete total sobre receita) e participacao. Calcule o crescimento comparando 09/01 a 19/08 de 2018 com o mesmo trecho de 2017. Salve em aula-16-seunome/saidas/indicadores_estado.csv, ordenado por pedidos.
```

## Prompt 3 · Premissas: Classificação das premissas

```text
Liste as premissas necessárias para decidir sobre o centro de distribuição. Para cada uma, classifique como DADO (indique a coluna ou o cálculo do notebook que a sustenta) ou SUPOSIÇÃO (indique quem na empresa deve confirmá-la).

Não invente valores. Se uma premissa exigir número que não está na base, como custo do centro ou redução de frete, escreva A CONFIRMAR em vez de estimar. Salve a tabela em aula-16-seunome/premissas.md.
```

## Prompt 4 · Matriz: Matriz com os pesos de base

```text
A partir de indicadores_estado.csv, selecione como candidatos os estados fora de SP com pelo menos 1.500 vendas. Espero 10 candidatos.

Normalize volume (pedidos), frete_medio e crescimento de 0 a 1 entre os candidatos, pelo mínimo e pelo máximo. Calcule a nota com pesos 0,5, 0,3 e 0,2 e ordene. Salve aula-16-seunome/saidas/matriz_decisao.csv com os valores originais, os normalizados e a nota. Explique em duas frases o que a normalização faz com a diferença entre RJ e MG.
```

## Prompt 5 · Sensibilidade: Sensibilidade do ranking aos pesos

```text
Para cada critério, varie o peso de 0 a 1 em passos de 0,001, mantendo a proporção entre os outros dois pesos. Registre os valores de peso em que o primeiro colocado muda e quem passa a liderar.

Mostre o resultado em uma tabela e em um gráfico da nota de RJ, MG e PE em função do peso do frete. Salve em aula-16-seunome/saidas/sensibilidade.csv.
```

## Prompt 6 · Cenários: Cenários e teto de custo do centro

```text
Para RJ e MG, some pedidos e frete dos últimos 12 meses da janela (compras a partir de 2017-08-20). Projete o próximo ano em três cenários de crescimento: pessimista 0%, base 20% e otimista 50%.

Calcule o teto de custo anual do centro como 25% do frete projetado, que é a economia suposta. Mostre a tabela e explique que o centro só se paga se o custo anual informado pela área financeira ficar abaixo desse teto. Salve em aula-16-seunome/saidas/cenarios.csv.
```

## Prompt 7 · Crítica: Crítica adversarial e pre-mortem

```text
Nossa recomendação provisória é: [escreva a recomendação da dupla]. Atue agora como conselheiro cético da diretoria.

1. Apresente o argumento mais forte contra essa recomendação, usando apenas os números do notebook.
2. Faça um pre-mortem: suponha que, dois anos depois, a decisão se mostrou errada, e liste as três causas mais prováveis.
3. Aponte qual premissa, se estiver errada, mais altera a decisão.
Não suavize a crítica e não proponha números que não estejam no notebook.
```

## Prompt 8 · Memorando: Memorando de decisão

```text
Crie aula-16-seunome/MEMORANDO_DECISAO.md com no máximo uma página: decisão recomendada, alternativas consideradas, evidência (ranking, sensibilidade e cenários), premissas a confirmar com responsável, resposta às críticas do conselheiro e a condição que faria a dupla mudar de recomendação.

Use somente números do notebook. A recomendação final é da dupla: escreva-a como redigida por nós, sem acrescentar argumentos novos. Depois proponha git add, commit e push, sem executar antes da minha aprovação.
```

## Conferência final

Execute o script de referência e compare com o notebook:

```bash
python materiais/aula-16/referencia/estrategia_referencia.py
```
