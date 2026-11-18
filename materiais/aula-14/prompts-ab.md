# Aula 14 · Roteiro de prompts CREATE

Teste A/B da nova página de agendamento com a base sintética `experimento_agendamento.csv`, conduzido no seu computador com o Claude Code, no terminal ou no Claude Desktop (aba Code).

Cada prompt segue o formato CREATE, em seis campos: [C] personagem, [R] pedido, [E] exemplos, [A] ajustes, [T] tipo de saída e [E] extras. Cole um prompt por vez. Leia o plano que o agente apresenta, autorize, acompanhe a execução e confira os números esperados antes de passar à etapa seguinte. Se um número divergir, peça ao agente que investigue o caminho, o filtro e a ordem das regras; não altere a regra para acertar a contagem.

## Preparação no terminal

macOS e Linux:

```bash
mkdir -p aula-14-ab/entrada
cd aula-14-ab
curl -L -o entrada/experimento_agendamento.csv https://afonsolelis.github.io/einstein/materiais/aula-14/dados/experimento_agendamento.csv
claude
```

Windows (PowerShell):

```powershell
mkdir aula-14-ab\entrada
cd aula-14-ab
curl.exe -L -o entrada\experimento_agendamento.csv https://afonsolelis.github.io/einstein/materiais/aula-14/dados/experimento_agendamento.csv
claude
```

No Claude Desktop, depois de criar a pasta e baixar o CSV, abra a aba Code e escolha `aula-14-ab` como pasta de trabalho.

## Etapa 00 · Ambiente e regras do projeto

```text
[C] Personagem
Você é meu assistente de análise de dados neste laboratório e trabalha
somente dentro desta pasta, aula-14-ab. Nesta etapa você prepara o
ambiente e escreve as regras do projeto; não analisa dados.

[R] Pedido
1. Crie CLAUDE.md com as regras do projeto listadas em Ajustes.
2. Verifique se há Python 3.10 ou superior. Crie um ambiente virtual em
   .venv e instale pandas, numpy, scipy e matplotlib.
3. Confira entrada/experimento_agendamento.csv: linhas de dados,
   colunas e SHA-256.

[E] Exemplos
Trecho esperado do CLAUDE.md:
## Regras
- entrada/ é somente leitura.
- Cada etapa vira um script analise/NN_nome.py, executado com o Python
  da .venv, que grava o que produz em saidas/.

[A] Ajustes
- Regras do CLAUDE.md: entrada/ é somente leitura; uma etapa, um script;
  todo número citado vem de um script executado; regras de limpeza não
  dependem do resultado e valem para A e B; cada prompt recebido é
  registrado em prompts.md com a data e os arquivos gerados.
- Não instale nada fora da .venv. Se não houver Python, pare e me
  explique como instalar no meu sistema operacional.
- Espero 14.392 linhas de dados, 8 colunas e SHA-256 iniciado por
  3b6b13db. Se divergir, pare e me avise.

[T] Tipo de saída
CLAUDE.md com até 25 linhas e, no chat, um resumo com a versão do
Python, as bibliotecas instaladas e a conferência do CSV.

[E] Extras
Mostre o plano e espere meu ok antes de instalar qualquer coisa. Ao
terminar, registre este prompt em prompts.md e pare.
```

Conferência: `.venv` criada, `CLAUDE.md` com as regras, 14.392 linhas, 8 colunas e SHA-256 `3b6b13db7720df3c07d8e7b9cfeed99bf80040261ba185f89905d0f18bbc80c3`.

## Etapa 01 · Plano do experimento e tamanho amostral

```text
[C] Personagem
Você é estatístico de experimentos. Nesta etapa registra o plano do
teste A/B e calcula o tamanho amostral, sem abrir a base de dados.

[R] Pedido
1. Crie saidas/plano.md com: pergunta de negócio, hipótese, unidade
   sorteada, métrica primária, métrica secundária, efeito mínimo, alfa,
   poder e duração.
2. Crie analise/01_tamanho_amostral.py, que calcula o tamanho amostral
   por grupo para um teste bicaudal de duas proporções e acrescenta o
   resultado ao fim de saidas/plano.md.

[E] Exemplos
| Item | Definição |
|---|---|
| Métrica primária | proporção de usuários que concluíram o agendamento |

[A] Ajustes
- Dados do plano: página atual A e nova página B; pergunta: B aumenta a
  proporção de pacientes que concluem o agendamento?; unidade sorteada:
  usuário; taxa histórica de 40%; efeito mínimo de 3 pontos
  percentuais; alfa de 5%; poder de 80%; 14 dias, de 02 a 15/03/2026;
  métrica secundária: tempo até concluir, entre quem concluiu.
- Use scipy.stats.norm, sem statsmodels, e arredonde para cima.
- Espero 4.234 usuários por grupo. Se divergir, pare e me mostre a conta.
- Não leia nada em entrada/ nesta etapa.

[T] Tipo de saída
plano.md com uma tabela de até 12 linhas e o tamanho amostral;
script com até 30 linhas e comentários curtos.

[E] Extras
Leia CLAUDE.md. Mostre a fórmula antes de escrever o código, espere meu
ok, execute o script, registre o prompt em prompts.md e pare.
```

Conferência: 4.234 usuários por grupo.

## Etapa 02 · Estudo estatístico da base bruta

```text
[C] Personagem
Você é analista de dados e faz o estudo exploratório da base bruta de
um experimento. Descreve e mede; não remove nem corrige nada.

[R] Pedido
Crie analise/02_estudo_base.py, que lê entrada/experimento_agendamento.csv
e grava saidas/estudo_base.md com:
1. Estrutura: linhas, colunas, tipo de cada coluna, período e usuários
   distintos.
2. Qualidade: nulos por coluna e em que situação aparecem, linhas
   duplicadas e sessao_id repetido.
3. Variáveis categóricas: frequência e percentual de variante,
   dispositivo e usuario_interno.
4. Variáveis numéricas: média, mediana, desvio padrão, quartis, mínimo,
   máximo e assimetria de tempo_segundos; taxa geral de conclusão.
5. Distribuição de sessões por usuário e de sessões por dia.
6. Indícios que ameaçam o experimento: sessões internas por variante e
   usuários que aparecem nas duas variantes.
Grave em saidas/ o histograma de tempo_segundos e o gráfico de sessões
por dia, uma linha por variante.

[E] Exemplos
Formato de cada achado no fim do relatório:
- Achado: 240 linhas idênticas em todos os campos.
- Evidência: bruta.duplicated().sum() = 240.
- Ameaça ao experimento: a mesma sessão contaria duas vezes.

[A] Ajustes
- Não remova nem altere registros; a limpeza é a etapa seguinte.
- Espero 14.392 linhas e 8 colunas. Se divergir, pare e me avise.
- Não compare a conclusão de A e B nesta etapa: isso é teste, não
  descrição.
- Não leia o README da pasta de dados.
- Use somente números calculados pelo script.

[T] Tipo de saída
estudo_base.md com até 90 linhas, em tabelas curtas, terminando na
lista de achados; dois PNG em saidas/.

[E] Extras
Leia CLAUDE.md e saidas/plano.md. Mostre o plano e espere meu ok,
execute, registre o prompt em prompts.md e pare.
```

Conferência: 14.392 linhas, 10.575 usuários, 9.363 tempos vazios (todos em sessões sem conclusão), 240 duplicadas, mediana de 257 s contra média de 279,2 s, 15 usuários com 33 a 50 sessões cada, 642 sessões internas (588 em B), 160 usuários nas duas variantes, 6.974 sessões em A e 7.418 em B.

## Etapa 03 · Regras de limpeza com contagem

```text
[C] Personagem
Você aplica regras de limpeza definidas pelo desenho do experimento.
Não propõe regras novas nem muda a ordem.

[R] Pedido
Crie analise/03_limpeza.py, que lê o CSV bruto, aplica as regras nesta
ordem e mostra as linhas antes e depois de cada uma:
1. Remover linhas duplicadas.
2. Excluir as sessões com usuario_interno igual a "sim".
3. Excluir todas as sessões de usuários que aparecem nas duas variantes.
4. Agregar uma linha por usuario_id com variante, dispositivo,
   primeira_data, concluiu (máximo) e tempo_segundos (máximo).
Grave saidas/regras_de_limpeza.csv e saidas/usuarios.csv.

[E] Exemplos
regra,justificativa,linhas_antes,linhas_depois
remover_duplicadas,a sessão ocorreu uma vez; a cópia vem do reenvio do log,14392,14152

[A] Ajustes
- Espero 14.152, 13.516 e 13.044 sessões e 10.400 usuários.
- Se algum número divergir, investigue o caminho, o filtro e a ordem;
  não ajuste a regra para acertar a contagem.
- As regras valem igualmente para A e para B.
- O CSV em entrada/ não é alterado.

[T] Tipo de saída
Os dois CSV e, no chat, uma tabela com regra, linhas antes e linhas
depois.

[E] Extras
Leia CLAUDE.md e saidas/estudo_base.md. Mostre o plano e espere meu ok,
execute, registre o prompt em prompts.md e pare.
```

Conferência: 14.152, 13.516, 13.044 sessões e 10.400 usuários (5.280 em A e 5.120 em B).

## Etapa 04 · Teste de SRM antes e depois da limpeza

```text
[C] Personagem
Você confere se o sorteio foi respeitado antes de qualquer comparação
de resultado.

[R] Pedido
Crie analise/04_srm.py, que aplica scipy.stats.chisquare à contagem por
variante em dois momentos, nas sessões da base bruta e nos usuários de
saidas/usuarios.csv, com divisão esperada de 50/50. Grave saidas/srm.csv
e mostre as contagens e os p-valores lado a lado. Mostre também as
sessões internas por variante na base bruta, como evidência.

[E] Exemplos
momento,A,B,p_valor
bruta_sessoes,6974,7418,0.00021

[A] Ajustes
- O alarme de SRM dispara com p-valor abaixo de 0,01.
- Se o alarme disparar na base limpa, pare e não prossiga para os
  testes das métricas.
- Não calcule taxas de conclusão nesta etapa.

[T] Tipo de saída
srm.csv com duas linhas e, no chat, até três frases dizendo qual regra
de limpeza explica a diferença entre os dois resultados.

[E] Extras
Leia CLAUDE.md. Mostre o plano e espere meu ok, execute, registre o
prompt em prompts.md e pare.
```

Conferência: p-valor de 0,0002 na base bruta e de 0,117 na base limpa; 588 sessões internas em B e 54 em A.

## Etapa 05 · Qui-quadrado da métrica primária

```text
[C] Personagem
Você testa a métrica primária do plano. Relata a evidência; a
recomendação não é sua.

[R] Pedido
Crie analise/05_conclusao.py, que usa saidas/usuarios.csv para:
1. Calcular a taxa de conclusão por variante e a diferença B menos A em
   pontos percentuais.
2. Montar a tabela de contingência variante × concluiu e aplicar
   scipy.stats.chi2_contingency com correction=False.
3. Calcular o intervalo de confiança de 95% da diferença pela
   aproximação normal.
4. Para comparação, calcular a taxa por sessão na base bruta, sem
   limpeza.
Grave saidas/resultado_primario.csv.

[E] Exemplos
variante,usuarios,concluiram,taxa
A,5280,2138,0.405

[A] Ajustes
- Espero 40,5% em A, 42,8% em B e p-valor próximo de 0,019.
- Não use a correção de Yates.
- Compare o intervalo com o efeito mínimo de 3 pontos de
  saidas/plano.md.
- Não escreva que B é melhor sem citar o intervalo.

[T] Tipo de saída
resultado_primario.csv e, no chat, uma tabela com taxas, diferença,
intervalo, estatística e p-valor, seguida de duas frases.

[E] Extras
Leia CLAUDE.md e saidas/srm.csv. Mostre o plano e espere meu ok,
execute, registre o prompt em prompts.md e pare.
```

Conferência: 40,5% em A, 42,8% em B, diferença de 2,3 p.p., intervalo de 0,4 a 4,2, qui-quadrado de 5,47, p-valor de 0,019. Na base bruta, por sessão: 32,2% contra 37,5%.

## Etapa 06 · Teste t de Welch da métrica secundária

```text
[C] Personagem
Você testa a métrica secundária do plano, o tempo até concluir.

[R] Pedido
Crie analise/06_tempo.py, que filtra em saidas/usuarios.csv os usuários
que concluíram e:
1. Mostra n, média, mediana e desvio padrão de tempo_segundos por
   variante.
2. Aplica scipy.stats.ttest_ind(B, A, equal_var=False).
3. Grava o histograma sobreposto dos dois grupos em
   saidas/tempo_por_variante.png e a tabela em saidas/resultado_tempo.csv.

[E] Exemplos
variante,n,media,mediana,desvio_padrao
A,2138,322.5,...,...

[A] Ajustes
- Espero média de 322,5 s em A e 292,6 s em B.
- Não use o teste t com variâncias iguais.
- Lembre no texto que esta é a métrica secundária.

[T] Tipo de saída
CSV, PNG e, no chat, até quatro frases: o resultado, por que o teste
usa apenas quem concluiu e por que Welch.

[E] Extras
Leia CLAUDE.md. Mostre o plano e espere meu ok, execute, registre o
prompt em prompts.md e pare.
```

Conferência: 322,5 s em A, 292,6 s em B, diferença de −30,0 s, t de −6,8 e p-valor da ordem de 10⁻¹¹.

## Etapa 07 · Leitura diária do p-valor e simulação A/A

```text
[C] Personagem
Você mostra o risco de decidir um teste A/B olhando o p-valor todos os
dias.

[R] Pedido
Crie analise/07_leitura_diaria.py com duas partes.
1. Para cada dia do experimento, recalcule o qui-quadrado da conclusão
   (correction=False) com os usuários cuja primeira_data é até aquele
   dia. Grave saidas/p_valor_diario.csv e o gráfico
   saidas/p_valor_diario.png, com uma linha horizontal em 0,05.
2. Simule 2.000 testes A/A com numpy.random.default_rng(14): as duas
   páginas com 40% de conclusão, 371 usuários por grupo por dia, 14
   dias, teste z de duas proporções sobre o acumulado. Calcule a
   proporção de simulações com p-valor abaixo de 0,05 só no último dia
   e em pelo menos um dos 14 dias.

[E] Exemplos
dia,usuarios,p_valor
2026-03-02,784,0.080

[A] Ajustes
- Espero p-valor de 0,516 no 5º dia e de 0,019 no 14º.
- Na simulação, espero cerca de 5% no último dia e cerca de 22% em
  algum dia.
- Não altere a duração nem o tamanho amostral do plano.

[T] Tipo de saída
CSV, PNG e, no chat, os dois percentuais da simulação e até três
frases de explicação.

[E] Extras
Leia CLAUDE.md e saidas/plano.md. Mostre o plano e espere meu ok,
execute, registre o prompt em prompts.md e pare.
```

Conferência: 0,516 no 5º dia, 0,035 no 12º, 0,019 no 14º; na simulação de referência, 5,4% e 22,3%.

## Etapa 08 · Parecer para a diretoria

```text
[C] Personagem
Você redige o parecer técnico de um teste A/B para a diretoria de uma
rede hospitalar. Separa evidência, interpretação e recomendação.

[R] Pedido
Crie PARECER_AB.md com: pergunta de negócio, plano registrado, estudo
da base, regras de limpeza e contagens, SRM antes e depois, taxas,
diferença com intervalo de confiança e p-valor, resultado do tempo,
leitura diária e simulação A/A, recomendação e três limitações.

[E] Exemplos
## Evidência
Na base limpa, a conclusão foi de 40,5% em A e 42,8% em B
(saidas/resultado_primario.csv).

[A] Ajustes
- Use somente números presentes em saidas/; cite o arquivo de origem
  de cada número.
- Não invente custo, receita nem prazo de implantação.
- Explique por que a decisão não foi tomada no 5º nem no 12º dia.
- A recomendação considera o efeito mínimo de 3 pontos do plano.

[T] Tipo de saída
Markdown com até 80 linhas, em seções com títulos curtos.

[E] Extras
Leia CLAUDE.md, saidas/ inteira e prompts.md. Mostre o sumário antes de
escrever e espere meu ok. Ao terminar, registre o prompt. Se a pasta
estiver num repositório Git, proponha git add, commit e push, sem
executar antes da minha aprovação.
```

## Conferência final

Para comparar com a resolução do professor, peça ao agente que execute o script de referência, baixado de `materiais/aula-14/referencia/ab_referencia.py`, com o Python da `.venv`, e que compare cada número com o que está em `saidas/`.
