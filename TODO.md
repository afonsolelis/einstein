# Em andamento

## Aula 6 (16/09) · IA no dia a dia da administração — próxima a construir
Hoje é esqueleto (11 slides, 7 seções). Passou a ocupar o slot de 16/09 na troca
com a limpeza, e agora é a única aula sem conteúdo real antes da 9.

Gancho disponível: a aula 5 termina em um parecer escrito e a aula 7 em uma
recomendação com "o que a invalidaria". Ambas são exatamente o tipo de julgamento
que não se delega a um modelo — bom ponto de partida para discutir onde a IA
ajuda e onde ela só produz confiança injustificada.

## Aula 9 (07/10) · Regressão — esqueleto
## Aula 10 (14/10) · Testes A/B fundida — esqueleto
Ambas ainda com 11-13 slides genéricos.

# Concluído

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
