# Aula 18 · Roteiro de prompts

Projeto integrador no GitHub Codespaces, com o Copilot em modo agente ou o agente de sua preferência.

Use os prompts em ordem. Antes de aceitar cada etapa, leia o plano e o código, execute a célula e confira os critérios descritos no material da aula. Os números de qualquer arquivo entregue devem sair do notebook do projeto.

Preparação no terminal (troque `aula-XX` e `ARQUIVO.csv` pela base escolhida):

```bash
mkdir -p projeto-final-seunome/entrada projeto-final-seunome/saidas
cp materiais/aula-XX/dados/ARQUIVO.csv projeto-final-seunome/entrada/
sha256sum projeto-final-seunome/entrada/*.csv
```

Bases disponíveis:

- `materiais/aula-13/dados/olist_pedidos.csv` (demanda semanal, aula 13)
- `materiais/aula-14/dados/experimento_agendamento.csv` (nova página de agendamento, aula 14)
- `materiais/aula-15/dados/contas_a_pagar.csv` (pagamentos suspeitos, aula 15)
- `materiais/aula-17/dados/rh_enfermagem.csv` (rotatividade da enfermagem, aula 17)

## Prompt 1 · Carta do projeto: Carta do projeto antes do código

```text
Vamos iniciar um projeto de análise. Ainda não escreva código. Leia o cabeçalho e dez linhas de projeto-final-seunome/entrada/ARQUIVO.csv e me ajude a redigir projeto-final-seunome/CARTA_DO_PROJETO.md com: problema de negócio em uma frase, decisão que a análise apoia, quem decide, unidade de análise, período, métrica de sucesso e o resultado que faria a recomendação mudar.

Faça perguntas quando faltar informação, em vez de supor. Não invente números nem dados que não estejam no arquivo.
```

## Prompt 2 · Perfil: Perfil da base sem limpeza

```text
Crie projeto-final-seunome/Projeto_Final_SeuNome.ipynb. Na primeira célula de texto, copie o problema e a decisão da CARTA_DO_PROJETO.md. Carregue a base em um DataFrame chamado bruta e mostre: shape, dtypes, ausências por coluna, duplicidade da chave, valores únicos das colunas categóricas e intervalo das datas.

Não limpe nem remova nada. Ao final, liste os problemas encontrados, separando o que pode afetar a decisão do que é irrelevante para ela. Mostre o plano antes de editar.
```

## Prompt 3 · Regras: Regras de limpeza derivadas da decisão

```text
Com base no perfil e na CARTA_DO_PROJETO.md, proponha regras de limpeza. Para cada regra, apresente a justificativa ligada à decisão; se não houver ligação com a decisão, não proponha a regra. Aguarde minha aprovação.

Depois de aprovado, crie dados a partir de bruta sem alterá-la, aplique as regras em ordem e salve a tabela regra, justificativa, linhas_antes, linhas_depois em projeto-final-seunome/saidas/regras_de_limpeza.csv. Casos duvidosos recebem flag e não são removidos.
```

## Prompt 4 · Análise: Análise principal com o método da aula

```text
Aplique à base tratada o método da aula de origem do projeto (aula XX), conforme a CARTA_DO_PROJETO.md. Antes de escrever o código, explique em até cinco linhas qual pergunta o método responde e qual comparação de referência será usada.

Salve o artefato principal em projeto-final-seunome/saidas/ e faça um gráfico com título, unidade e fonte. Mostre os números com denominador. Não escreva conclusões além do que os números mostram.
```

## Prompt 5 · Contestação: Verificação adversarial da análise

```text
Agora atue como revisor cético da diretoria. Leia o notebook inteiro e liste até cinco motivos pelos quais a conclusão pode estar errada: vazamento de informação, denominador inadequado, regra de limpeza que favorece o resultado, comparação ausente, associação lida como causa ou amostra pequena.

Para cada motivo, proponha um teste que o confirme ou descarte. Não altere o notebook; apenas escreva a lista em projeto-final-seunome/CONTESTACAO.md.
```

## Prompt 6 · Recomendação: Recomendação com limitações

```text
Com o notebook e a CONTESTACAO.md atualizados, escreva a seção final do notebook com: a recomendação em uma frase, dirigida ao decisor da carta; os três números que a sustentam, cada um com a célula de origem; a comparação de referência; as limitações confirmadas na contestação; e o resultado que faria a recomendação mudar.

Use somente números calculados no notebook. Se a evidência não sustentar uma recomendação, diga isso e proponha o dado que faltou.
```

## Prompt 7 · README e Git: README do projeto e versionamento

```text
Crie projeto-final-seunome/README.md com: título, problema, decisão, base e hash SHA-256, regras de limpeza, método, resultado principal, recomendação, limitações, como reexecutar o notebook e uma seção "Uso da IA" com sugestões aceitas, alteradas e rejeitadas.

Reinicie o kernel e execute o notebook inteiro. Depois mostre git status e proponha git add, commit e push apenas da pasta do projeto, sem executar antes da minha aprovação e sem usar force.
```
