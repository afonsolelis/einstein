# Aula 14 · Roteiro de prompts

Teste A/B da nova página de agendamento com a base sintética `experimento_agendamento.csv`.

Use os prompts em ordem, no Copilot em modo agente ou no agente de sua preferência, dentro do GitHub Codespaces. Antes de aceitar cada etapa, leia o plano e o código, execute a célula e confira a contagem esperada. Se o número divergir, investigue o caminho, o filtro e a ordem das regras; não altere a regra para acertar a contagem.

Preparação no terminal:

```bash
mkdir -p aula-14-seunome/entrada aula-14-seunome/saidas
cp materiais/aula-14/dados/experimento_agendamento.csv aula-14-seunome/entrada/
```

## Prompt 1 · Plano: Cálculo do tamanho amostral

```text
Atue como meu assistente de análise neste laboratório. Crie aula-14-seunome/Aula_14_SeuNome.ipynb. Na primeira célula, registre em texto a hipótese, a métrica primária, a métrica secundária, o efeito mínimo de 3 pontos percentuais sobre a taxa de 40%, alfa de 5%, poder de 80% e duração de 14 dias.

Na célula seguinte, calcule o tamanho amostral por grupo para um teste bicaudal de duas proporções usando scipy.stats.norm, sem statsmodels, e arredonde para cima. Espero 4.234 usuários por grupo. Mostre o plano antes de editar.
```

## Prompt 2 · Perfil: Perfil da base antes da limpeza

```text
No mesmo notebook, carregue aula-14-seunome/entrada/experimento_agendamento.csv em um DataFrame chamado bruta, convertendo data para data.

Mostre: shape, dtypes, linhas duplicadas, sessao_id repetido, usuários distintos, sessões e usuários com usuario_interno igual a "sim", usuários que aparecem nas duas variantes e sessões por variante. Não limpe nem remova nada. Espero 14.392 linhas e 8 colunas; se divergir, pare e me avise.
```

## Prompt 3 · Regras: Aplicação das regras com contagem

```text
Crie sessoes a partir de bruta, sem alterar bruta nem o CSV. Aplique nesta ordem e mostre as linhas antes e depois de cada regra:
1. Remover linhas duplicadas.
2. Excluir usuario_interno igual a "sim".
3. Excluir todas as sessões de usuários que aparecem nas duas variantes.
4. Criar usuarios com uma linha por usuario_id: variante, dispositivo, primeira_data, concluiu (máximo) e tempo_segundos (máximo).

Espero 14.152, 13.516, 13.044 sessões e 10.400 usuários. Salve a tabela regra, justificativa, linhas_antes, linhas_depois em aula-14-seunome/saidas/regras_de_limpeza.csv. Se algum número divergir, investigue; não ajuste a regra.
```

## Prompt 4 · SRM: Teste de SRM antes e depois

```text
Aplique scipy.stats.chisquare à contagem por variante em dois momentos: nas sessões de bruta e nos usuários de usuarios. Mostre as contagens e os p-valores lado a lado.

Explique em duas frases qual regra de limpeza explica a diferença entre os dois resultados, mostrando a contagem de sessões internas por variante como evidência. Não prossiga para os testes das métricas se o SRM da base limpa tiver p-valor abaixo de 0,01.
```

## Prompt 5 · Proporções: Qui-quadrado da métrica primária

```text
Com usuarios, calcule a taxa de conclusão por variante e a diferença B menos A em pontos percentuais. Monte a tabela de contingência variante × concluiu e aplique scipy.stats.chi2_contingency com correction=False.

Calcule o intervalo de confiança de 95% da diferença pela aproximação normal. Mostre taxas, diferença, intervalo, estatística e p-valor, e salve em aula-14-seunome/saidas/resultado_primario.csv. Compare em uma frase o intervalo com o efeito mínimo de 3 pontos percentuais.
```

## Prompt 6 · Médias: Teste t de Welch da métrica secundária

```text
Filtre os usuários que concluíram o agendamento e compare tempo_segundos entre B e A com scipy.stats.ttest_ind e equal_var=False. Mostre média, mediana e desvio padrão por variante, a diferença das médias e o p-valor.

Faça um histograma sobreposto dos tempos das duas páginas. Explique por que o teste usa apenas quem concluiu e por que Welch é preferível ao teste t com variâncias iguais.
```

## Prompt 7 · Leitura diária: p-valor acumulado e simulação A/A

```text
Para cada dia do experimento, recalcule o qui-quadrado da conclusão com os usuários cuja primeira_data é até aquele dia e faça um gráfico do p-valor com uma linha horizontal em 0,05.

Depois simule 2.000 testes A/A com numpy (semente 14), com as duas páginas a 40% e 371 usuários por grupo por dia durante 14 dias. Calcule a proporção de simulações com p-valor abaixo de 0,05 apenas no último dia e em pelo menos um dos 14 dias. Explique o resultado.
```

## Prompt 8 · Parecer: Parecer para a diretoria

```text
Crie aula-14-seunome/PARECER_AB.md com: pergunta de negócio, plano registrado, regras de limpeza e contagens, resultado do SRM antes e depois, taxas, diferença com intervalo de confiança e p-valor, resultado do tempo, leitura diária e simulação A/A, recomendação e três limitações.

Use somente números produzidos no notebook; não invente valores. Separe o que os dados mostram do que é recomendação. Depois proponha git add, commit e push, sem executar antes da minha aprovação.
```

## Conferência final

Execute o script de referência e compare com o notebook:

```bash
python materiais/aula-14/referencia/ab_referencia.py
```
