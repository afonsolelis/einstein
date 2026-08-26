# Aula 04 — Roteiro de prompts para a auditoria estatística

Use estes prompts na ordem, em modo orientado por revisão: leia o plano, autorize
cada execução conscientemente e só avance quando a evidência solicitada aparecer
na saída da célula. O ambiente oficial de execução é o GitHub Codespaces da
disciplina, com Pandas e Matplotlib já instalados.

Todos os arquivos desta aula são sintéticos e de uso educacional. O processamento
dos dados ocorre no workspace, mas prompts e arquivos mencionados podem ser
processados pelo serviço de IA conforme a política da conta. Não reutilize este
roteiro com dados reais, pessoais ou sigilosos.

A regra da aula: **a IA calcula; o comitê decide**. Nenhuma recomendação
gerencial pode entrar no memorando sem uma tabela que a sustente.

---

## Rodada 1 — auditoria do parecer com o recorte do seu comitê

### Prompt 0 — Contrato de auditoria

```text
Atue como analista de apoio de um comitê de auditoria estatística. Leia
@relatorio_executivo_ia.md e o arquivo de dados do meu comitê, mas ainda não
edite nem crie arquivos. Apresente um plano curto e aguarde aprovação.

Regras obrigatórias: não alterar os arquivos recebidos; não descartar registros
sem que eu autorize e sem registrar o critério; nunca substituir um número do
parecer sem antes reproduzi-lo com o método declarado nele; separar o que é
cálculo do que é recomendação; não afirmar causalidade. A entrega terá notebook
executado, tabela de auditoria, gráfico de distribuição e memorando executivo.
```

### Prompt 1 — Reprodução do número auditado

```text
Crie Aula_04_SeuNome.ipynb. Carregue o arquivo do meu comitê em um DataFrame
chamado recorte e mostre shape, dtypes, ausências por coluna e as cinco
primeiras linhas. Em seguida, reproduza exatamente o número que o parecer
atribui a cada unidade presente no meu recorte, usando o método descrito na
seção Metodologia do parecer. Não corrija nada ainda: o objetivo desta etapa é
demonstrar que consigo chegar ao mesmo resultado do documento auditado.
```

### Prompt 2 — Estatística descritiva do recorte

Comitê de Operações (Grupo A), painel agregado:

```text
Com o painel mensal, calcule para cada unidade: a média não ponderada das médias
mensais e a média ponderada pelo número de altas. Apresente as duas em uma única
tabela, com a diferença em dias e em percentual, e ordene as unidades pelos dois
critérios. Mostre também quantas linhas mensais cada unidade possui e quantas
delas têm menos de 20 altas. Não descarte linhas: descreva o efeito delas.
```

Comitê Clínico (Grupo B), registros de Norte e Sul:

```text
Calcule permanência média, mediana, desvio-padrão e contagem por unidade e, em
seguida, por unidade e gravidade. Apresente a distribuição percentual dos
estratos de gravidade em cada unidade. Compare as duas unidades dentro de cada
estrato e diga explicitamente se a ordenação por estrato coincide com a
ordenação agregada. Não interprete ainda: apenas apresente as tabelas.
```

Comitê de Riscos (Grupo C), registros de Norte, Leste e Oeste:

```text
Para cada unidade, calcule contagem, média, mediana, desvio-padrão, mínimo,
máximo e os quantis 25, 50, 75 e 90 da permanência. Acrescente o percentual de
internações com até dois dias, o percentual com dez dias ou mais e a taxa de
reinternação em 30 dias. Apresente tudo em uma única tabela ordenada pela média.
```

### Prompt 3 — Parecer preliminar do comitê

```text
Com base apenas nas tabelas já calculadas, redija em cinco linhas o parecer
preliminar do meu comitê sobre a pergunta: qual unidade deve ser tomada como
referência de eficiência pela rede? Separe explicitamente o que a evidência
sustenta do que ela não permite afirmar. Liste as informações ausentes no meu
recorte que poderiam alterar a conclusão. Não consulte outros arquivos.
```

---

## Rodada 2 — reanálise com a base completa

### Prompt 4 — Perfil da base completa

```text
Carregue @rede_vita_internacoes.csv em um DataFrame chamado base. Mostre shape,
dtypes, ausências, duplicidade de atendimento_id, período coberto por data_alta
e a contagem de internações por unidade. Confirme 5.838 registros e 9 colunas;
se divergir, pare e me avise antes de qualquer análise.
```

### Prompt 5 — O efeito da ponderação

```text
Calcule a permanência média de cada unidade a partir dos registros individuais
e compare com os valores publicados no parecer. Monte uma tabela com: unidade,
valor do parecer, média ponderada correta, diferença e ordenação em cada
critério. Explique em duas frases por que a média das médias mensais difere da
média dos registros e em que condição as duas coincidem.
```

### Prompt 6 — Estratificação e padronização direta

```text
Compare Norte e Sul dentro de cada estrato de gravidade e apresente a
composição percentual dos estratos em cada unidade. Em seguida, faça a
padronização direta: recalcule a permanência média de cada unidade aplicando a
composição de gravidade da outra. Mostre os quatro valores em uma tabela e
indique se a ordenação entre as unidades se mantém. Não altere os dados de
origem e não afirme causalidade a partir dessa comparação.
```

### Prompt 7 — Forma da distribuição

```text
Para Norte e Leste, gere um histograma da permanência com a mesma escala e o
mesmo número de faixas, e uma tabela com média, mediana, desvio-padrão,
quantis 25, 75 e 90, percentual de internações com até dois dias e percentual
com dez dias ou mais. Salve a figura em saidas/distribuicao_norte_leste.png.
Descreva o que a média isolada não revela sobre essas duas unidades.
```

### Prompt 8 — Tamanho amostral e sensibilidade

```text
Isole a unidade Oeste e mostre a contagem, a permanência de todos os registros
ordenada, a média, a mediana e a amplitude. Recalcule a média sem os dois casos
mais longos e informe a variação. Calcule também quantos eventos sustentam a
taxa de reinternação dessa unidade. Conclua se o volume observado permite tratar
a unidade como referência da rede e justifique com os números.
```

### Prompt 9 — Segundo indicador

```text
Calcule a taxa de reinternação em 30 dias e o custo médio por internação, por
unidade e por unidade e gravidade. Apresente uma tabela conjunta com permanência
média, reinternação e custo médio. Verifique se a unidade com menor permanência
também apresenta melhor resultado nos demais indicadores e registre o resultado
dessa verificação sem suavizar a divergência.
```

### Prompt 10 — Tabela executiva e memorando

```text
Monte a tabela final de decisão com uma linha por unidade e as colunas:
internações, permanência média ponderada, mediana, quantil 90, permanência
padronizada pela composição da rede, reinternação em 30 dias e custo médio.
Salve em saidas/tabela_executiva.csv. Em seguida, redija MEMORANDO.md com, no
máximo, uma página: achado, evidência, risco de decidir pelo parecer original e
recomendação. Toda afirmação do memorando deve remeter a uma linha da tabela.
```

### Prompt 11 — Testes, auditoria da IA e versionamento

```text
Adicione asserts legíveis para: 5.838 registros carregados; média ponderada da
unidade Norte entre 4,3 e 4,4; média da unidade Sul acima da média da Norte no
agregado; média da Sul abaixo da média da Norte em cada estrato de gravidade;
unidade Oeste com menos de 50 registros; taxa de reinternação da Norte superior
à da Sul. Reinicie o kernel, execute todas as células em ordem e, se um teste
falhar, diagnostique a causa sem enfraquecer o teste.

Depois crie REVISAO_IA.md registrando: erros identificados no parecer original,
prompts utilizados, sugestões aceitas, sugestões rejeitadas, limitações da
análise e decisão final do comitê. Mostre git status e proponha add, commit e
push apenas dos arquivos desta entrega, sem executar sem minha aprovação.
Mensagem sugerida: "Audita parecer de eficiência com estatística descritiva".
```

---

## Conferência oral antes da entrega

O estudante deve conseguir sustentar, sem consultar o notebook:

1. Por que a média das médias mensais não é a média da unidade.
2. Por que a comparação entre Norte e Sul se inverte ao controlar a gravidade.
3. Por que duas unidades com médias praticamente iguais exigem decisões distintas.
4. Que incerteza acompanha um indicador calculado sobre 38 internações.
5. Por que a permanência isolada não é suficiente para declarar eficiência.
