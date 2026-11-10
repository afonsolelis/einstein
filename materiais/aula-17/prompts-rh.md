# Aula 17 · Roteiro de prompts

Estudo de caso de RH: rotatividade voluntária da enfermagem com a base sintética `rh_enfermagem.csv`.

Use os prompts em ordem, no Copilot em modo agente ou no agente de sua preferência, dentro do GitHub Codespaces. Antes de aceitar cada etapa, leia o plano e o código, execute a célula e confira a contagem esperada. Se o número divergir, investigue o caminho, o filtro e a ordem das regras; não altere a regra para acertar a contagem.

A análise trata de segmentos da equipe. Recuse qualquer sugestão do agente que produza listas de pessoas, probabilidades individuais ou ordenação de profissionais por risco.

Preparação no terminal:

```bash
mkdir -p aula-17-seunome/entrada aula-17-seunome/saidas
cp materiais/aula-17/dados/rh_enfermagem.csv aula-17-seunome/entrada/
```

## Prompt 1 · Perfil: Perfil da base antes da limpeza

```text
Atue como meu assistente de análise de RH neste laboratório. Crie aula-17-seunome/Aula_17_SeuNome.ipynb e carregue aula-17-seunome/entrada/rh_enfermagem.csv em um DataFrame chamado bruta, convertendo data_registro para data.

Mostre: shape, dtypes, id_profissional duplicado, ausências por coluna, contagem de motivo_desligamento, quantos registros têm tempo_casa_meses igual a zero e a taxa de desligou sem limpeza. Não limpe nem remova nada. Espero 3.090 linhas e 16 colunas; se divergir, pare e me avise. Mostre o plano antes de editar.
```

## Prompt 2 · Regras: Aplicação das regras com contagem

```text
No mesmo notebook, crie base a partir de bruta, sem alterar bruta nem o CSV. Aplique nesta ordem e mostre as linhas antes e depois de cada regra:
1. Transferências: ordenar por id_profissional e data_registro e manter o registro mais recente de cada id.
2. Excluir registros com tempo_casa_meses igual a zero.
3. Excluir motivo_desligamento igual a "Aposentadoria" ou "Fim de contrato temporário".
Crie saida_voluntaria = 1 para "Pedido de demissão" e 0 para os demais.

Espero 3.000, 2.893 e 2.789 linhas e 483 saídas voluntárias. Salve regra, justificativa, linhas_antes, linhas_depois em aula-17-seunome/saidas/regras_de_limpeza.csv. Se algum número divergir, investigue; não ajuste a regra para acertar a contagem.
```

## Prompt 3 · Segmentos: Taxas de saída por segmento

```text
Calcule a taxa de saida_voluntaria, com o número de profissionais, por turno, por unidade e por três faixas: horas_extras_mes (até 10, 10 a 20, acima de 20), salario_vs_mercado (abaixo de 0,90, 0,90 a 1,00, acima de 1,00) e faltas (0 a 1, 2 a 3, 4 ou mais).

Use pd.cut com limites [-1, 10, 20, 100], [0, 0.9, 1.0, 2] e [-1, 1, 3, 100]. Faça um gráfico de barras horizontais por variável, com uma linha vertical na taxa geral de 17,3%. Salve as tabelas em aula-17-seunome/saidas/taxas_por_segmento.csv.
```

## Prompt 4 · Confusão: Faltas comparadas dentro do turno

```text
Monte uma tabela cruzada com a taxa de saida_voluntaria por turno nas linhas e faixa de faltas nas colunas, em percentual com uma casa decimal. Mostre também a média de faltas e de horas_extras_mes por turno.

Explique em até cinco linhas se as faltas continuam associadas à saída quando o turno é mantido fixo, e o que isso significa para uma política que puna faltas como forma de reduzir a rotatividade. Não afirme causalidade.
```

## Prompt 5 · Modelo: Regressão logística sem idade e gênero

```text
Treine um Pipeline do scikit-learn com StandardScaler nas colunas horas_extras_mes, salario_vs_mercado, avaliacao_lider, tempo_casa_meses, distancia_km, treinamentos e faltas, OneHotEncoder(drop="first") em turno, cargo e unidade, e LogisticRegression(max_iter=1000). Não use idade nem genero.

Separe 30% para teste com stratify=y e random_state=42. Mostre a acurácia da taxa base (prever que ninguém sai), a acurácia do modelo, a matriz de confusão e o recall. Liste os coeficientes ordenados e interprete cada um como associação, não como causa.
```

## Prompt 6 · Disparidade: Verificação de disparidade por gênero

```text
No conjunto de teste, recupere a coluna genero pelo índice e compare, para cada gênero, o número de profissionais, a taxa real de saida_voluntaria e a probabilidade média prevista pelo modelo, em percentual.

Comente se o modelo subestima ou superestima a saída de algum grupo e se o tamanho do grupo permite conclusão. Registre em aula-17-seunome/saidas/disparidade_genero.csv. Não reintroduza genero no modelo.
```

## Prompt 7 · Parecer: Parecer para a diretoria

```text
Crie aula-17-seunome/PARECER_RH.md com: pergunta da diretoria, definição de rotatividade voluntária, regras de limpeza e contagens, os cinco segmentos de maior taxa, o resultado da comparação de faltas dentro do turno, acurácia e recall do modelo contra a taxa base, coeficientes interpretados como associação, verificação de disparidade e três ações por segmento.

Use somente números produzidos no notebook. Não inclua nenhum id_profissional nem lista de pessoas. Depois proponha git add, commit e push, sem executar antes da minha aprovação.
```

## Conferência final

Execute o script de referência e compare com o notebook:

```bash
python materiais/aula-17/referencia/rh_referencia.py
```
