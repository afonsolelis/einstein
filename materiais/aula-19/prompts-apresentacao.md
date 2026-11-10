# Aula 19 · Roteiro de prompts

Apresentação executiva no GitHub Codespaces, com o Copilot em modo agente ou o agente de sua preferência.

Use os prompts em ordem. Antes de aceitar cada etapa, leia o plano e o código, execute a célula e confira os critérios descritos no material da aula. Os números de qualquer arquivo entregue devem sair do notebook do projeto.

Ponto de partida: a pasta `projeto-final-seunome` entregue na aula 18, com o notebook reexecutado.

## Prompt 1 · Pirâmide: Resposta, argumentos e evidências

```text
Leia projeto-final-seunome/README.md, CARTA_DO_PROJETO.md, CONTESTACAO.md e a seção final do notebook. Ainda não crie arquivos. Organize o resultado em uma pirâmide de Minto: no topo, a recomendação em uma frase dirigida ao decisor da carta; abaixo, de dois a quatro argumentos; sob cada argumento, os números que o sustentam, com a célula de origem.

Use somente números que estão no notebook. Se algum argumento não tiver evidência, aponte a lacuna em vez de completá-la.
```

## Prompt 2 · Resumo: Resumo executivo de uma página

```text
Com a pirâmide aprovada, crie projeto-final-seunome/RESUMO_EXECUTIVO.md com no máximo 350 palavras, nesta ordem: recomendação e decisão pedida; contexto em duas frases; argumentos com seus números; principal limitação; resultado que faria a recomendação mudar; próximo passo com responsável e prazo.

Escreva em prosa formal, sem negrito de ênfase, sem frases de efeito e sem jargão técnico sem explicação. Conte as palavras ao final.
```

## Prompt 3 · Roteiro: Roteiro das sete telas

```text
A partir do RESUMO_EXECUTIVO.md, escreva projeto-final-seunome/ROTEIRO_TELAS.md com sete telas nesta ordem: recomendação; problema e métrica; evidência principal; comparação com a referência; mecanismo; limitações e o que mudaria a decisão; próximos passos.

Para cada tela, informe: título afirmativo de no máximo 10 palavras, uma ideia, o gráfico ou tabela (com o arquivo de saidas/ de onde vem) e a fala de 30 a 45 segundos. Não crie o HTML ainda.
```

## Prompt 4 · HTML: Apresentação em um único HTML

```text
Com o ROTEIRO_TELAS.md aprovado, crie projeto-final-seunome/apresentacao.html: um único arquivo, sem CDN nem fonte externa, com CSS e JavaScript embutidos. Cada tela em proporção 16:9, navegação por setas e espaço, contador de telas e um anexo após a tela 7 com regras de limpeza e método.

Gráficos devem ser imagens PNG geradas pelo notebook em saidas/ e embutidas em base64, ou tabelas HTML. Cada número na tela deve ser idêntico ao do notebook. Mostre o plano antes de editar.
```

## Prompt 5 · Números: Checagem de cada número

```text
Extraia todos os números de projeto-final-seunome/apresentacao.html e de RESUMO_EXECUTIVO.md. Para cada um, localize a célula do notebook que o produz e monte a tabela numero, onde_aparece, celula_de_origem, valor_no_notebook, confere.

Salve em projeto-final-seunome/saidas/checagem_numeros.csv. Se algum número não tiver origem ou divergir, liste-o e proponha a correção no HTML, sem alterar o notebook para fazer o número coincidir.
```

## Prompt 6 · Ensaio: Ensaio com perguntas da banca

```text
Atue como a banca: uma diretora financeira, um gerente de operações e um professor de estatística. Leia apresentacao.html, RESUMO_EXECUTIVO.md e CONTESTACAO.md e faça as oito perguntas mais difíceis que eles fariam, uma por vez. Espere minha resposta antes da próxima.

Ao final, avalie cada resposta como sustentada, parcialmente sustentada ou sem evidência, citando o trecho do projeto que a apoia, e liste o que devo acrescentar ao anexo.
```
