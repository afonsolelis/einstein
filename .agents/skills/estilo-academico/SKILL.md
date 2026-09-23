---
name: estilo-academico
description: Revisor de estilo acadêmico para slides, materiais, quizzes e atividades do curso. Localiza e reescreve os vícios de linguagem típicos de texto gerado por IA (frases de efeito, fragmentos telegráficos, travessões, dois-pontos dramáticos, tríades retóricas, negrito de ênfase, fechos publicitários) e devolve prosa formal e encadeada. Use ao revisar ou reescrever uma aula inteira, antes de publicar texto destinado ao aluno, ou quando o autor pedir um tom mais acadêmico; combine com escrita-afonso e humanizacao.
---

# Revisor de estilo acadêmico

Adaptação do comando `/escrita:estilo-academico` do projeto irmão `tese` para as aulas deste repositório. O original está em [references/original-tese.md](references/original-tese.md). As regras de voz vêm de [escrita-afonso](../escrita-afonso/SKILL.md) e a lista de vícios de prosa vem de [humanizacao](../humanizacao/SKILL.md). Esta skill acrescenta o procedimento de revisão de uma aula inteira e as proibições que o autor considera inaceitáveis em qualquer material.

## O problema

Texto gerado por LLM tende a um ritmo de marketing: frases curtas de efeito, apostos entre travessões que interrompem o fluxo, fragmentos sem verbo usados como ênfase, tríades retóricas e fechos de impacto. Estudantes e colegas reconhecem esse padrão, e ele reduz a credibilidade do material. O autor determinou que esse registro não deve aparecer em slides, materiais, quizzes ou atividades.

## Proibições

1. **Frases de efeito.** Exemplos do padrão proibido: "Hoje construímos o chão que sustenta as dez.", "Gera um número errado no board.", "Nada mais entra.", "E isso muda tudo.". Toda afirmação deve vir num período completo que a explique e a ligue ao conteúdo vizinho.
2. **Fragmentos telegráficos usados como ênfase.** Orações soltas ou sequências sem verbo não servem como recurso dramático. Em listas de slide, frases nominais são admitidas quando descrevem um item (um campo, um passo, um arquivo), e não quando fazem papel de slogan.
3. **Travessão como conector.** Na prosa, prefira, nesta ordem, oração subordinada ou relativa, vírgula, parênteses ou dois períodos. Travessão só é admitido em intervalos de datas e valores ("jan/2017–ago/2018") e em notação técnica.
4. **Dois-pontos dramáticos.** Construções como "a resposta: o humano" ou "o resultado: falha" são manchete. Dois-pontos continuam válidos para introduzir listas, definições, campos e exemplos.
5. **Contraste de efeito "não é X, é Y".** Reescreva quando a negação só prepara a frase de impacto ("Um centavo de diferença não é arredondamento: é sinal de junção errada"). Mantenha contrastes que carregam informação técnica ("customer_id identifica o pedido, e não a pessoa").
6. **Tríades e anáforas retóricas.** Enumerações em ritmo de manchete só são admitidas quando enumeram conteúdo técnico real.
7. **Negrito e itálico de ênfase.** `<strong>` marca termos definidos, rótulos de campo ou nomes de interface; nunca serve para dar força a uma frase. Na dúvida, retire.
8. **Imperativos absolutos e tom de alerta.** "Nunca", "sempre", "pare" e similares ficam apenas em regras operacionais de segurança ou de procedimento, formuladas com a razão que as justifica.
9. **Fechos publicitários.** O slide, o parágrafo ou o bloco terminam quando o conteúdo termina. O slide final traz síntese, encaminhamento ou pergunta, e não um lema.
10. **Emojis, setas e ornamentos em texto.** Setas (→) em instruções de interface viram texto ("em Project Settings, abra Database"); emojis saem de links e de títulos. Ícones de controle da navegação dos slides não são prosa e ficam.

## Prescrições

1. **Períodos completos e encadeados.** A prosa avança por conectivos explícitos (portanto, desse modo, uma vez que, por isso, em consequência, além disso), de modo que cada frase decorra da anterior.
2. **Princípio, justificativa e consequência.** Enuncia-se o que se faz, explica-se por que e descreve-se o efeito observável, num fluxo contínuo.
3. **Registro formal.** Prefira formas impessoais ("verifica-se", "adota-se", "recomenda-se") e o artefato ou o dado como sujeito. A primeira pessoa do plural fica restrita à ação da turma em sala ("nesta aula, a turma constrói..."). O imperativo é admitido em instruções de procedimento (passos de laboratório, comandos a executar).
4. **Títulos de slide descritivos.** Curtos, em uma linha na projeção, dizendo o assunto do slide. Evite título-aforismo ("hipótese não é fato", "a estrela não inventa receita") e título-slogan.
5. **Densidade de slide.** O slide continua sendo slide: listas curtas e poucas linhas. O tom acadêmico se obtém pela forma de cada frase, e não pela conversão de telas em parágrafos de artigo.
6. **Teste de leitura em voz alta.** Se o trecho soar como post de LinkedIn, manchete ou anúncio, reescreva até soar como um professor explicando o conteúdo a uma turma de graduação.

## O que preservar

- Números, datas, unidades, contagens, valores monetários, nomes de tabelas e colunas, caminhos de arquivo, comandos, SQL, prompts e URLs.
- Toda a marcação: tags, classes CSS, atributos `data-*`, SVGs, entidades HTML, scripts e a ordem dos slides.
- A sequência didática e o conteúdo técnico de cada slide. A revisão é de estilo; não acrescenta nem retira afirmações. Se uma afirmação só existia como frase de efeito, reescreva-a como constatação sustentada pelo dado do próprio slide ou retire-a quando nada informar.
- Os links explícitos para arquivos (regra de navegação offline do `AGENTS.md`).

## Procedimento

1. Ler o arquivo inteiro antes de editar, para herdar terminologia e sequência.
2. Localizar os alvos mecanicamente e depois por leitura:
   - `grep -nE "—|–| - " arquivo.html` para travessões (descartando intervalos e código);
   - `grep -nE "<strong>|<em>" arquivo.html` para ênfases;
   - `grep -nE "→|←|⇒" arquivo.html` e emojis em texto;
   - `grep -niE "não é .*[:,] é|nunca|sempre|hoje " arquivo.html` para contrastes de efeito e absolutos;
   - leitura atenta de títulos, primeiras e últimas frases de cada slide, onde se concentram aforismos e fechos.
3. Reescrever cada ocorrência conforme as prescrições, sem alterar fatos.
4. Conferir: os mesmos números aparecem antes e depois (`grep -oE "[0-9][0-9.,]*" | sort | uniq -c` nas duas versões), o HTML continua válido e os títulos cabem em uma linha.
5. Relatar o que mudou com exemplos de antes e depois e listar o que ficou pendente de decisão do autor.

Ao revisar um material inteiro (slides e página de material da mesma aula), mantenha a mesma terminologia nos dois arquivos.
