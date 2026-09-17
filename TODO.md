# Em andamento

## Aula 6 (16/09) · IA no dia a dia: da pesquisa ao pitch — escrever amanhã
A aula deixa de ser esqueleto. Escopo combinado: o estudante usa IA para
**pesquisar um case financeiro na internet, montar uma apresentação em HTML e
defendê-la em um pitch** no fim das três horas. A pergunta pedagógica da aula é a
mesma da 5 e da 7 — o modelo pesquisa e escreve, mas quem responde pelo número é
o estudante.

### Por que slide em HTML e não PowerPoint
É o argumento de abertura e ele é auto-evidente na disciplina: **os slides desta
aula são um arquivo HTML só**. Versiona no Git, abre em qualquer máquina por
`file://`, o diff é legível, o agente escreve o arquivo direto no Codespace e a
entrega é `commit` + `push`, como todo o resto do curso. Publicar no GitHub Pages
é um bônus, não o objetivo.

### Os quatro cases financeiros (o estudante escolhe um)
Dois de saúde, para puxar o domínio da casa; dois de fora, para não virar aula de
setor. Cada case entra como **pergunta a investigar**, nunca como número afirmado
no material — quem apura é a turma, na fonte primária (site de RI, CVM, B3,
release de resultados):

1. **Rede D'Or** — crescimento por aquisição de hospitais: o que sustenta a margem?
2. **Hapvida / NotreDame** — sinistralidade e a fusão que decepcionou o mercado.
3. **Americanas** — as inconsistências contábeis de 2023: governança e detecção.
4. **Magazine Luiza** — margem, alavancagem e o efeito da taxa de juros.

Checar antes de publicar se os quatro continuam com dados públicos acessíveis e
recentes; trocar qualquer um que exija fonte paga.

### Os prompts que a aula ensina
Um roteiro em `materiais/aula-06/prompts-apresentacao.md` (mesmo padrão do
`prompts-antigravity.md` da aula 8), com os blocos copiáveis também no material e
nos slides:

- **pesquisa com fonte obrigatória** — URL e data ao lado de cada número; se não
  achar, escrever `NÃO ENCONTRADO`; proibido estimar;
- **verificação adversarial** — segunda passada (de preferência em outro modelo)
  contestando cada número da primeira;
- **estrutura narrativa** — sete telas, títulos afirmativos, uma ideia por tela;
- **geração do HTML** — arquivo único, sem CDN, navegação por teclado, 16:9,
  paleta da disciplina, a partir do template;
- **crítica do deck** — onde o slide afirma além da evidência;
- **ensaio do pitch** — as perguntas difíceis que a banca faria.

O contra-exemplo entra junto: *"faça uma apresentação bonita sobre a Americanas"*
e o número plausível com fonte inventada que ele devolve. É a armadilha central
da aula.

### Entrega e pitch
`apresentacao.html` + `fontes.md` (tabela número → link → data de acesso),
entregues por commit e push. Pitch de 5 minutos com a sequência já usada nas
aulas 5 e 7: problema → evidência → comparação → mecanismo → recomendação → **o
que me faria mudar de recomendação**. Critério de aceite: todo número no slide
rastreável até fonte primária.

### Artefatos a produzir
- `slides/aula-06.html` — reescrita completa (mínimo 10 slides, seções
  `data-lesson-section`, componente `.prompt-wrap` + `.copy-prompt` copiado da
  aula 7);
- `materiais/aula-06/index.html` — wiki completa, no nível da aula 5;
- `materiais/aula-06/template-slides.html` — deck inicial que o estudante copia,
  autossuficiente e comentado, para ele entender o que o agente gera;
- `materiais/aula-06/prompts-apresentacao.md`;
- `index.json` e `calendar.json` (`content_state`, objetivos, atividade,
  entregável, `slide_count`, `section_count`, `files`);
- `tests/e2e/aula-06.spec.js` nos moldes do de aula 7;
- fechar esta seção no TODO quando passar em
  `validate_lesson.py --lesson 6 --complete`, `unittest` e `npm run test:e2e`.

### Decisões ainda abertas
- **Qual ferramenta de IA assumir como oficial.** A aula 2 usa Copilot e a 8 usa
  Antigravity; a 6 precisa de um modelo com acesso à web. Decidir entre fixar uma
  ou escrever a aula agnóstica com uma recomendada.
- **Título da aula.** Mantido "Inteligência Artificial no dia a dia da
  administração" para não repetir o custo de renumeração; o subtítulo dos slides
  carrega "da pesquisa ao pitch". Reavaliar se vale renomear de fato.

## Esqueleto proposital — decisão de 03/09/2026
As aulas 9 a 19 **ficam como esqueleto de propósito**, porque os temas ainda
estão mudando. Não vale escrever conteúdo definitivo sobre um cronograma que
ainda se mexe: cada troca de tema até aqui custou renumeração, links, testes e
badges. Retomar só quando os temas estiverem fixos.

Todas passam no validador estrutural e o site navega inteiro; o que falta é
conteúdo, não conserto.

### Gancho que a aula 6 herda
A aula 5 termina em um parecer escrito e a aula 7 em uma recomendação com "o que
a invalidaria". Ambas são exatamente o tipo de julgamento que não se delega a um
modelo — é daí que sai o eixo do pitch da aula 6.

# Concluído

## Reorganização do cronograma (17/09)
As aulas 7, 8 e 9 passam a formar a sequência de Data Visualization sobre o case
Olist (fluxo de interação anotado, Supabase e dashboard no GitHub Pages). A antiga
aula 7 (Storytelling, Dashboards e Segmentação RFV) saiu do cronograma; as notas
históricas abaixo sobre ela e sobre a "aula 8" de limpeza referem-se à numeração
anterior. Nova correspondência: limpeza 8 → 10; previsões 9 → 11; testes A/B
10 → 12; IA estratégica 12 → 14; RH 14 → 15. Fusões em esqueleto: auditoria (11)
+ forense (13) → 13; previsão de caixa (15) + demanda (16) → 16.

## Aula 5 (09/09) · Passo a passo do Metabase no Codespaces
O material ganhou os dez passos completos, do `Create codespace on main` ao primeiro
`SELECT`, mais uma seção sobre suspensão do ambiente e uma tabela de sete sintomas.

**Detalhe do ambiente que custou uma correção:** o Codespaces traz Docker na imagem
*universal*, usada quando o repositório não tem `devcontainer.json`. Este repositório
tem, e fixa `mcr.microsoft.com/devcontainers/python:1-3.12-bookworm` — nesse caminho o
Codespaces monta só o que o arquivo declara, e essa imagem não traz o Docker CLI
(conferido rodando a imagem). O `devcontainer.json` agora declara a feature
`docker-in-docker:4` e encaminha a porta 3000, de modo que a garantia passa a valer
também por aqui.

Quem já tiver um Codespace criado precisa de **Rebuild Container**; o material e o
README avisam.

Pilha validada de verdade nesta passada: `docker compose up -d` sobe os três serviços,
`/api/health` responde `{"status":"ok"}`, o log fecha em `Metabase Initialization COMPLETE`,
`postgres-dados` resolve de dentro do contêiner do Metabase e só a 3000 é publicada.

## calendar.json
Cronograma das 19 semanas gerado a partir do `index.json`, com data ISO, dia da semana,
horário, tópicos, entregável e caminhos. O campo `content_state` separa aula escrita de
esqueleto, distinção que o `status` do `index.json` não faz — lá `complete` significa
apenas estrutura válida.

## Aula 7 (23/09) · Storytelling, Dashboards e Segmentação
Segmenta os clientes do Olist por RFV no Metabase da disciplina e fecha em um
dashboard narrativo. Passa no validador `--complete`.

- Armadilhas ensinadas com o dado real: `customer_id` contra `customer_unique_id`;
  recência medida contra a data de corte da base, não contra hoje; o mês parcial
  no fim da série; a cauda agrupada em "Outros" **depois** do ranqueamento.
- Regra dura do material: nunca dois eixos y.
- A seção "Quando o gráfico mente" traz uma figura SVG com o top 7 de diagnósticos
  antes e depois de unificar a capitalização. Diverticulitis sobe do 7º para o 4º
  e Acute Bronchitis cai do 4º para o 7º — números conferidos no CSV.
- Cor dos gráficos validada com o script da skill de dataviz: `#1f6fb2` passa no
  contraste sobre fundo claro; `#00a3d9` não passa (2,83:1) e só serve com rótulo
  direto.
- `tests/e2e/aula-07.spec.js` cobre o card, os 25 slides sem corte, os títulos e
  descrições acessíveis dos dois SVGs e a presença de `customer_unique_id`.

## Troca das aulas 6 e 8
A limpeza com Pandas saiu de 16/09 para 30/09; "IA no dia a dia" fez o caminho
inverso. O arco ficou: **5** diagnostica a base suja → **7** monta o dashboard e
descobre que os gráficos mentem → **8** limpa com Pandas.

Bug corrigido nesta passada: a renumeração anterior tinha trocado os números dos
laboratórios mas **não as datas nos badges** das aulas 6, 7 e 8. Auditadas as 19.

## Aula 5 (09/09) · Metabase local com Docker
Sobe Metabase + dois PostgreSQL via Compose, carrega o CSV hospitalar bruto e
responde "podemos confiar nesta base?" com sete consultas de diagnóstico.

- `materiais/aula-05/docker-compose.yml` validado com `docker compose config`.
- Checkpoints conferidos direto no CSV: 5.000 linhas; 350 idades, 350 gêneros e
  350 diagnósticos ausentes; 321 diagnósticos em maiúsculas (28 categorias
  aparentes contra 14 reais); 150 altas anteriores à admissão; 0 duplicidades.
- O dataset mora em `materiais/aula-05/dados/`; a aula 8 aponta para lá.

## Aula 4 (02/09) · SQL II com Olist no Metabase hospedado
Commits `a513d15` e `b44f5a2`.

# Armadilhas do repositório
- O validador de aulas rejeita a palavra solta **"todo"** como marcador pendente
  (`\b(TODO|TBD|PLACEHOLDER)\b`, sem distinguir maiúsculas). Já custou quatro
  correções; prefira "cada", "toda" ou reescreva a frase.
- Ao renumerar, os badges de slide carregam **número e data**. Auditar os dois.
