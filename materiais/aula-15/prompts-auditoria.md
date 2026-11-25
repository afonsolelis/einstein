# Aula 15 · Roteiro de prompts CREATE

Auditoria de contas a pagar com regras de controle, Lei de Benford e Isolation Forest, sobre as bases sintéticas `contas_a_pagar.csv` e `fornecedores.csv`, conduzida no seu computador com o Claude Code, no terminal ou no Claude Desktop (aba Code).

Cada prompt segue o formato CREATE, em seis campos: [C] personagem, [R] pedido, [E] exemplos, [A] ajustes, [T] tipo de saída e [E] extras. Cole um prompt por vez. Leia o plano que o agente apresenta, autorize, acompanhe a execução e confira os números esperados antes de passar à etapa seguinte. Se um número divergir, peça ao agente que investigue o caminho, o filtro e a ordem das regras; não altere janela, limiar ou peso para acertar a contagem. Recuse qualquer frase do agente que atribua fraude, culpa ou intenção: o relatório recomenda examinar.

## Preparação no terminal

macOS e Linux:

```bash
mkdir -p aula-15-auditoria/entrada
cd aula-15-auditoria
curl -L -o entrada/contas_a_pagar.csv https://afonsolelis.github.io/einstein/materiais/aula-15/dados/contas_a_pagar.csv
curl -L -o entrada/fornecedores.csv https://afonsolelis.github.io/einstein/materiais/aula-15/dados/fornecedores.csv
claude
```

Windows (PowerShell):

```powershell
mkdir aula-15-auditoria\entrada
cd aula-15-auditoria
curl.exe -L -o entrada\contas_a_pagar.csv https://afonsolelis.github.io/einstein/materiais/aula-15/dados/contas_a_pagar.csv
curl.exe -L -o entrada\fornecedores.csv https://afonsolelis.github.io/einstein/materiais/aula-15/dados/fornecedores.csv
claude
```

No Claude Desktop, depois de criar a pasta e baixar os dois CSV, abra a aba Code e escolha `aula-15-auditoria` como pasta de trabalho.

Hashes esperados:

- `contas_a_pagar.csv`: `b3898f2daa84095b6d56c1ccb661a2dba6c8736e36807770204be4d8b0d3e9ce`
- `fornecedores.csv`: `2a5fede2703f558f2933798055b03f0eb080e84fbcf361b09d640ca7e45918ea`

## Etapa 00 · Ambiente e regras do projeto

```text
[C] Personagem
Você é meu assistente de auditoria de dados neste laboratório e trabalha
somente dentro desta pasta, aula-15-auditoria. Nesta etapa você prepara
o ambiente e escreve as regras do projeto; não analisa dados.

[R] Pedido
1. Crie CLAUDE.md com as regras do projeto listadas em Ajustes.
2. Verifique se há Python 3.10 ou superior. Crie um ambiente virtual em
   .venv e instale pandas, numpy, scipy, scikit-learn, matplotlib e
   plotly.
3. Confira os dois CSV de entrada/: linhas de dados, colunas e SHA-256.

[E] Exemplos
Trecho esperado do CLAUDE.md:
## Regras
- entrada/ é somente leitura.
- Cada etapa vira um script analise/NN_nome.py, executado com o Python
  da .venv, que grava o que produz em saidas/.

[A] Ajustes
- Regras do CLAUDE.md: entrada/ é somente leitura; uma etapa, um script;
  todo número citado vem de um script executado; alçada, janelas,
  limiares e pesos vêm do prompt e não mudam para acertar contagem;
  nenhum texto atribui fraude, culpa ou intenção, e o termo usado é
  "examinar"; cada prompt recebido é registrado em prompts.md com a
  data e os arquivos gerados.
- Não instale nada fora da .venv. Se não houver Python, pare e me
  explique como instalar no meu sistema operacional.
- Espero contas_a_pagar.csv com 5.440 linhas, 7 colunas e SHA-256
  iniciado por b3898f2d, e fornecedores.csv com 120 linhas, 4 colunas e
  SHA-256 iniciado por 2a5fede2. Se divergir, pare e me avise.

[T] Tipo de saída
CLAUDE.md com até 25 linhas e, no chat, um resumo com a versão do
Python, as bibliotecas instaladas e a conferência dos dois CSV.

[E] Extras
Mostre o plano e espere meu ok antes de instalar qualquer coisa. Ao
terminar, registre este prompt em prompts.md e pare.
```

Conferência: `.venv` criada, `CLAUDE.md` com as regras, 5.440 linhas e 7 colunas em `contas_a_pagar.csv`, 120 linhas e 4 colunas em `fornecedores.csv`, hashes iguais aos da preparação.

## Etapa 01 · Perfil da base com hash de entrada

```text
[C] Personagem
Você é auditor de dados e abre a cadeia de custódia da análise.
Descreve a base recebida; não limpa nem corrige nada.

[R] Pedido
Crie analise/01_perfil.py, que:
1. Calcula o SHA-256 dos dois CSV de entrada/ e grava
   saidas/custodia.csv com arquivo, sha256, linhas, momento ("inicio") e
   data_execucao.
2. Lê contas_a_pagar.csv com data_pagamento como data e fornecedor_id
   como texto, e fornecedores.csv.
3. Grava saidas/perfil.md com: linhas e colunas, tipo de cada coluna,
   pagamento_id duplicado, contagem por tipo, valor mínimo e máximo e
   pagamentos por mês.

[E] Exemplos
arquivo,sha256,linhas,momento,data_execucao
contas_a_pagar.csv,b3898f2d...,5440,inicio,2026-11-25

[A] Ajustes
- Espero 5.440 linhas, 7 colunas, nenhum pagamento_id duplicado, 5.408
  pagamentos, 32 estornos e valor máximo de R$ 1.865.925,92. Se
  divergir, pare e me avise.
- Não remova nem altere registros; a limpeza é a etapa seguinte.
- Não leia o README da pasta de dados.

[T] Tipo de saída
custodia.csv com duas linhas, perfil.md com até 60 linhas em tabelas
curtas e, no chat, os dois hashes e as contagens.

[E] Extras
Leia CLAUDE.md. Mostre o plano e espere meu ok, execute, registre o
prompt em prompts.md e pare.
```

Conferência: hash iniciado por `b3898f2d`, base `(5440, 7)`, nenhum `pagamento_id` duplicado, 5.408 pagamentos e 32 estornos, maior valor de R$ 1.865.925,92.

## Etapa 02 · Limpeza orientada ao negócio

```text
[C] Personagem
Você aplica a limpeza de uma auditoria, cuja finalidade é evitar
alarmes falsos. Não propõe regras novas nem muda a ordem.

[R] Pedido
Crie analise/02_limpeza.py, que lê os dois CSV de entrada/ e:
1. Conta quantos fornecedor_id da base não existem no cadastro.
2. Normaliza fornecedor_id com strip e upper, conta quantos códigos
   mudaram e repete a contagem sem cadastro.
3. Mantém apenas tipo igual a pagamento; os estornos ficam fora dos
   testes porque não são saída de caixa.
4. Mostra o número de pagamentos, o valor total e quantos têm valor
   igual ou acima da alçada de R$ 10.000.
Grave saidas/pagamentos.csv e saidas/regras_de_limpeza.csv.

[E] Exemplos
regra,justificativa,linhas_antes,linhas_depois
normalizar_fornecedor,códigos exportados com minúsculas ou espaços,5440,5440

[A] Ajustes
- Espero 61 sem cadastro antes, 47 códigos normalizados, 14 sem
  cadastro depois, 5.408 pagamentos, R$ 46.918.492,83 no total e 929 na
  alçada ou acima.
- Se algum número divergir, investigue o caminho, o filtro e a ordem;
  não ajuste a regra para acertar a contagem.
- Os CSV em entrada/ não são alterados.

[T] Tipo de saída
Os dois CSV e, no chat, uma tabela com regra, linhas antes e linhas
depois, seguida das contagens de cadastro e alçada.

[E] Extras
Leia CLAUDE.md e saidas/perfil.md. Mostre o plano e espere meu ok,
execute, registre o prompt em prompts.md e pare.
```

Conferência: 61 sem cadastro antes da normalização e 14 depois, todos de `F901` e `F902`; 47 códigos normalizados; 5.408 pagamentos, R$ 46.918.492,83 e 929 na alçada ou acima.

## Etapa 03 · Duplicidade, cadastro e calendário

```text
[C] Personagem
Você traduz controles internos de contas a pagar em regras
verificáveis. Marca pagamentos; não remove nenhum.

[R] Pedido
Crie analise/03_regras.py, que lê saidas/pagamentos.csv e
entrada/fornecedores.csv e cria três flags booleanas:
1. duplicidade: duplicated por fornecedor_id, nota_fiscal e valor,
   mantendo a primeira ocorrência. Compare com a regra ingênua, por
   fornecedor_id e valor, e mostre quais fornecedores explicam a
   diferença.
2. sem_cadastro: fornecedor_id ausente do cadastro.
3. dia_nao_util: sábado, domingo ou um destes feriados de 2025: 01/01,
   03/03, 04/03, 18/04, 21/04, 01/05, 19/06, 07/09, 12/10, 02/11, 15/11,
   20/11 e 25/12.
Grave saidas/sinais_regras.csv com pagamento_id e as três flags.

[E] Exemplos
pagamento_id,duplicidade,sem_cadastro,dia_nao_util
P00001,False,False,False

[A] Ajustes
- Espero 18 duplicidades, 14 sem cadastro e 25 em dia não útil. A regra
  ingênua deve marcar 77.
- Mostre três exemplos de cada flag.
- Os feriados ficam numa constante no topo do script.

[T] Tipo de saída
sinais_regras.csv e, no chat, uma tabela com regra, critério e
contagem, seguida de até três frases sobre a diferença entre as duas
regras de duplicidade.

[E] Extras
Leia CLAUDE.md. Mostre o plano e espere meu ok, execute, registre o
prompt em prompts.md e pare.
```

Conferência: a regra ingênua marca 77 pagamentos e a regra com nota fiscal, 18. A diferença de 59 vem de `F045` (26), `F012`, `F031` e `F058` (11 cada), os três últimos com contratos mensais de R$ 18.500, R$ 12.000 e R$ 4.750. São 14 sem cadastro e 25 em dia não útil, 24 em fim de semana e 1 em feriado.

## Etapa 04 · Fracionamento e valores redondos

```text
[C] Personagem
Você testa os controles ligados à alçada de aprovação de R$ 10.000.
Marca pagamentos; não remove nenhum.

[R] Pedido
Crie analise/04_alcada.py, que lê saidas/pagamentos.csv e cria:
1. fracionamento: entre pagamentos de R$ 9.000 a R$ 9.999,99, agrupe por
   fornecedor_id e solicitante e marque cada pagamento que tenha, a até
   6 dias dele (inclusive ele), pelo menos 2 pagamentos somando
   R$ 10.000 ou mais.
2. valor_redondo: valor igual ou acima de R$ 1.000 e múltiplo de R$ 100.
3. redondo_concentrado: pagamento redondo de fornecedor com 10 ou mais
   pagamentos e 30% ou mais de valores redondos.
Grave saidas/sinais_alcada.csv com pagamento_id e as três flags.

[E] Exemplos
fornecedor_id,solicitante,pagamentos_marcados
F023,S14,6

[A] Ajustes
- Espero 116 pagamentos na faixa, 15 em fracionamento, 64 redondos e 40
  concentrados.
- A janela de 6 dias, a faixa e os limiares ficam em constantes no topo
  do script.
- Ao comentar o solicitante que aparece em mais de um fornecedor,
  escreva uma pergunta para o exame, e não uma conclusão.

[T] Tipo de saída
sinais_alcada.csv e, no chat, os grupos marcados por fornecedor e
solicitante e a proporção de redondos dos quatro fornecedores com a
maior proporção.

[E] Extras
Leia CLAUDE.md. Mostre o plano e espere meu ok, execute, registre o
prompt em prompts.md e pare.
```

Conferência: 116 pagamentos na faixa e 15 em fracionamento, 6 de `F023` com `S14`, 6 de `F066` com `S19` e 3 de `F089` com `S14`. São 64 redondos e 40 concentrados, todos de `F045`, com 100% de valores redondos; `F031` tem 24% e fica abaixo do limiar.

## Etapa 05 · Benford no total e por fornecedor

```text
[C] Personagem
Você aplica a Lei de Benford a pagamentos, como na auditoria forense.
Mede o afastamento; não explica a causa.

[R] Pedido
Crie analise/05_benford.py, que usa os pagamentos de
saidas/pagamentos.csv com valor de R$ 10 ou mais e:
1. Extrai o primeiro dígito significativo e compara a proporção
   observada com a esperada, log10(1 + 1/d), em saidas/benford_total.csv
   e no gráfico de barras saidas/benford.png.
2. Calcula o MAD e o qui-quadrado (scipy.stats.chisquare) da população.
3. Repete para cada fornecedor com 50 ou mais pagamentos e grava mad,
   qui_quadrado e p_valor em saidas/benford_fornecedores.csv.
4. Cria fornecedor_fora_benford para p-valor abaixo de 0,001 e grava
   saidas/sinais_benford.csv com pagamento_id e a flag.

[E] Exemplos
fornecedor_id,pagamentos,mad,qui_quadrado,p_valor
F077,60,0.1338,105.5,3.2e-19

[A] Ajustes
- Espero 5.407 valores, MAD de 0,0050 e qui-quadrado de 13,8 na
  população; 24 fornecedores testados e apenas F077 abaixo de 0,001.
- Mostre quantos fornecedores teriam MAD acima de 0,015 e explique por
  que esse critério não serve para amostras pequenas.
- Por fornecedor, o critério é o qui-quadrado; não troque o limiar.

[T] Tipo de saída
Três CSV, um PNG e, no chat, a tabela dos cinco fornecedores com menor
p-valor e até quatro frases sobre MAD e qui-quadrado.

[E] Extras
Leia CLAUDE.md. Mostre o plano e espere meu ok, execute, registre o
prompt em prompts.md e pare.
```

Conferência: 5.407 valores, MAD de 0,0050, qui-quadrado de 13,8 (p-valor de 0,086). São 24 fornecedores testados, 19 com MAD acima de 0,015 e apenas `F077` com p-valor abaixo de 0,001, com qui-quadrado de 105,5. O segundo colocado, `F031`, tem p-valor de 0,008.

## Etapa 06 · Isolation Forest como triagem complementar

```text
[C] Personagem
Você usa aprendizado de máquina como triagem estatística, sem
conhecimento das regras do negócio. Relata raridade, e não
irregularidade.

[R] Pedido
Crie analise/06_isolation.py, que lê saidas/pagamentos.csv e:
1. Monta os atributos log_valor (log10 do valor), dia_semana e
   pagamentos_fornecedor_mes (pagamentos do mesmo fornecedor no mesmo
   mês).
2. Treina IsolationForest(contamination=0.01, random_state=42) do
   scikit-learn e cria a flag anomalia_isolation.
3. Lê os sinais de saidas/sinais_regras.csv, sinais_alcada.csv e
   sinais_benford.csv e conta quantas anomalias também dispararam
   alguma regra ou Benford.
Grave saidas/sinais_isolation.csv com pagamento_id e a flag.

[E] Exemplos
faixa_de_valor,anomalias
acima de R$ 100.000,14

[A] Ajustes
- Espero 55 anomalias, nenhuma coincidente com regra ou Benford, 14
  acima de R$ 100.000 e 23 abaixo de R$ 100.
- Se a contagem divergir por pouco, informe a versão do scikit-learn
  instalada; não mude contamination nem random_state.

[T] Tipo de saída
sinais_isolation.csv e, no chat, as contagens e duas frases: o que o
algoritmo encontrou e por que isso não equivale a irregularidade.

[E] Extras
Leia CLAUDE.md. Mostre o plano e espere meu ok, execute, registre o
prompt em prompts.md e pare.
```

Conferência: 55 anomalias, nenhuma coincidente com regra ou com Benford; 14 acima de R$ 100.000 e 23 abaixo de R$ 100.

## Etapa 07 · Matriz de risco e fila de exame

```text
[C] Personagem
Você combina os sinais de auditoria numa matriz de risco definida pelo
comitê e fecha a cadeia de custódia.

[R] Pedido
Crie analise/07_fila.py, que junta saidas/pagamentos.csv aos quatro
arquivos saidas/sinais_*.csv e:
1. Calcula pontuacao com os pesos: duplicidade, fracionamento e
   sem_cadastro valem 3; fornecedor_fora_benford, dia_nao_util e
   redondo_concentrado valem 2; anomalia_isolation vale 1.
2. Cria a coluna sinais com os nomes das flags ativas.
3. Grava saidas/fila_de_exame.csv com pontuação 2 ou mais, ordenada por
   pontuação e valor, e saidas/achados.csv com uma linha por pagamento
   e sinal, com o parâmetro da regra e a data da execução.
4. Recalcula o SHA-256 de entrada/contas_a_pagar.csv, acrescenta a
   linha "fim" em saidas/custodia.csv e confirma com assert que é igual
   ao da linha "inicio".

[E] Exemplos
pagamento_id,sinal,parametro,data_execucao
P02247,fracionamento,"faixa 9.000-9.999,99; janela 6 dias",2026-11-25

[A] Ajustes
- Espero 172 pagamentos na fila, R$ 1.052.985,30, 47 com pontuação 3 e
  125 com pontuação 2; 55 pagamentos com pontuação 1 ficam fora.
- Os pesos ficam num dicionário no topo do script.
- Se o assert falhar, pare e me avise; não recalcule o hash inicial.

[T] Tipo de saída
Os dois CSV, custodia.csv com quatro linhas e, no chat, uma tabela com
sinal, pagamentos na fila e valor.

[E] Extras
Leia CLAUDE.md. Mostre o plano e espere meu ok, execute, registre o
prompt em prompts.md e pare.
```

Conferência: 172 pagamentos, R$ 1.052.985,30, cerca de 2,2% do valor pago. Por sinal: Benford 60, redondo concentrado 40, dia não útil 25, duplicidade 18, fracionamento 15 e sem cadastro 14. O hash final é igual ao inicial.

## Etapa 08 · Painel local de monitoramento

```text
[C] Personagem
Você monta o painel de acompanhamento que o comitê vai abrir no
navegador, sem servidor e sem banco de dados.

[R] Pedido
Crie analise/08_painel.py, que lê saidas/ e:
1. Calcula o monitor diário: para cada dia com pagamento, o valor pago,
   a média e o desvio padrão populacional dos 20 dias anteriores com
   pagamento e o limite de média mais três desvios. O alarme dispara
   quando há 10 ou mais dias anteriores e o valor passa do limite.
   Grave saidas/monitor_diario.csv.
2. Gera saidas/painel.html com Plotly, autocontido
   (include_plotlyjs=True), com: indicadores de pagamentos analisados,
   pagamentos na fila, valor da fila e hash conferido; barras da fila
   por sinal; linha do valor diário com o limite e os alarmes
   destacados; barras de pagamentos em dia não útil por mês; tabela com
   os 20 primeiros da fila.

[E] Exemplos
dia,valor_pago,media_20d,limite_superior,acima_do_limite
2025-03-17,2598605.96,...,621136.71,True

[A] Ajustes
- Espero 276 dias com pagamento, 11 acima do limite e o maior em
  17/03/2025. Só 5 desses dias têm pagamento da fila.
- As barras de dia não útil vão de janeiro a novembro e somam 25, com 4
  em março e 4 em maio.
- Todo número do painel vem de saidas/; não recalcule regras aqui.
- Títulos dos gráficos descritivos, sem adjetivos.

[T] Tipo de saída
monitor_diario.csv, painel.html que abre com duplo clique e, no chat,
os 11 dias de alarme e até três frases sobre o que o monitor encontrou.

[E] Extras
Leia CLAUDE.md. Mostre o plano e espere meu ok, execute, abra o painel
no navegador, registre o prompt em prompts.md e pare.
```

Conferência: 276 dias com pagamento, 11 acima do limite, o maior com R$ 2.598.605,96 em 17/03/2025. Os 5 dias com pagamento da fila somam 6 pagamentos e R$ 39.014,37. As barras de dia não útil somam 25.

## Etapa 09 · Parecer para o comitê

```text
[C] Personagem
Você redige o parecer técnico de uma auditoria de contas a pagar para o
comitê de auditoria de uma rede hospitalar. Separa sinal, evidência e
recomendação de exame.

[R] Pedido
Crie RELATORIO_AUDITORIA.md com: hashes de início e fim, limpeza e
contagens, regras com critério e parâmetro, Benford no total e por
fornecedor, Isolation Forest, pesos da matriz de risco, fila por sinal,
monitor diário, documento a pedir no exame de cada sinal e três
limitações.

[E] Exemplos
## Fila de exame
A fila tem 172 pagamentos, que somam R$ 1.052.985,30
(saidas/fila_de_exame.csv). Recomenda-se examinar o contrato e as
notas de F077.

[A] Ajustes
- Use somente números presentes em saidas/; cite o arquivo de origem
  de cada número.
- Escreva "examinar"; nunca "fraude", "desvio comprovado", "culpa" ou
  "intenção".
- Inclua uma explicação legítima possível para F077 e para o
  solicitante S14.
- Diga o que mudaria na fila se o peso de dia não útil caísse para 1,
  calculando com os dados de saidas/.

[T] Tipo de saída
Markdown com até 90 linhas, em seções com títulos curtos.

[E] Extras
Leia CLAUDE.md, saidas/ inteira e prompts.md. Mostre o sumário antes de
escrever e espere meu ok. Ao terminar, registre o prompt. Se a pasta
estiver num repositório Git, proponha git add, commit e push, sem
executar antes da minha aprovação.
```

## Conferência final

Para comparar com a resolução do professor, peça ao agente que baixe `https://afonsolelis.github.io/einstein/materiais/aula-15/referencia/auditoria_referencia.py` para a pasta da aula, execute-o com o Python da `.venv` e compare cada número com o que está em `saidas/`. O script lê os CSV de `entrada/`.
