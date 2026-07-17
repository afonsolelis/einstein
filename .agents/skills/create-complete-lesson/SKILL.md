---
name: create-complete-lesson
description: Criar, completar, revisar e validar aulas deste curso, incluindo slides HTML interativos, material wiki, navegação offline, coerência com o cronograma e testes de conformidade. Usar ao implementar uma aula real, transformar placeholders em conteúdo completo ou auditar o padrão de uma aula existente.
---

# Criar uma aula completa

## Fluxo obrigatório

1. Ler `index.html` e localizar no array `aulas` o número, data, tema e tag.
2. Ler integralmente `../design_system/SKILL.md`, `../generate_slide_placeholder/SKILL.md` e `../generate_material_placeholder/SKILL.md`.
3. Ler [references/lesson-standard.md](references/lesson-standard.md) e planejar objetivos, sequência, prática e evidências de aprendizagem antes de editar.
4. Atualizar `slides/aula-XX.html` e `materiais/aula-XX/index.html` como um par coerente. Não deixar placeholders, marcadores `TODO` nem links para diretórios.
5. Executar `python3 .agents/skills/create-complete-lesson/scripts/validate_lesson.py --lesson XX --complete`.
6. Executar `python3 -m unittest discover -s tests -v`.
7. Executar `npm run test:e2e` para validar no Chromium as páginas inicial, slides e material em desktop e mobile. Percorrer os slides por botões e teclado, verificar links, overflow e erros de console.
8. Ler e aplicar `../update-course-index/SKILL.md` para atualizar e validar `index.json` somente depois que a aula passar nas validações anteriores.

## Regras de autoria

- Escrever em português do Brasil, com exemplos aplicados a Administração e decisões de negócio.
- Tratar slides como apoio visual: uma ideia principal por tela, texto escaneável e código legível.
- Tratar o material como referência autônoma: aprofundar conceitos, explicar código e incluir boas práticas.
- Manter os mesmos título, objetivos, conceitos e atividade nas duas superfícies.
- Incluir na aula completa: objetivos observáveis, agenda, contexto, conceitos, prática guiada, desafio/entrega, síntese e próximos passos.
- Preservar navegação `file://` com caminhos terminados em `.html`.

## Validação

Usar o validador incluído para verificações estruturais e de completude. Sem `--complete`, ele aceita placeholders estruturalmente íntegros; com `--complete`, exige o ciclo didático integral descrito na referência. Corrigir todas as falhas antes de concluir.
