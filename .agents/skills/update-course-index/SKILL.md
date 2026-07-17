---
name: update-course-index
description: Criar, atualizar e validar o index.json que cataloga o curso, suas aulas, temas, slides, materiais, destaques, arquivos e estado de completude. Usar sempre depois de criar, completar, revisar, renomear ou remover aulas, slides, materiais ou outros arquivos relevantes deste projeto.
---

# Atualizar o índice do curso

## Fluxo obrigatório

1. Ler o array `aulas` em `index.html`; ele é a fonte de verdade para número, data, tema e tag.
2. Ler `index.json` e [references/schema.md](references/schema.md).
3. Inspecionar os arquivos alterados e atualizar os campos editoriais: objetivos, tópicos, destaques do material, atividade e entrega.
4. Atualizar o inventário de arquivos e os metadados verificáveis: caminhos explícitos, quantidade de slides, quantidade de seções e status.
5. Usar `complete` somente quando slides e material passarem no validador completo da aula. Usar `placeholder` quando ambos ainda forem modelos e `partial` nos demais casos.
6. Não inventar destaques. Resumir apenas conteúdo presente nos arquivos.
7. Executar `python3 .agents/skills/update-course-index/scripts/validate_index.py` e corrigir todas as falhas.

## Regras

- Manter todas as 19 aulas na ordem do cronograma, inclusive placeholders.
- Usar caminhos relativos ao repositório e sempre terminar páginas HTML em `.html`.
- Manter `slide_count` igual ao número real de elementos `.slide`.
- Manter `material.section_count` igual ao número real de títulos `h2` dentro de `.content`.
- Catalogar em `project_files` somente arquivos úteis à navegação, autoria, validação ou identidade do projeto; não incluir `.git`, caches ou dependências.
- Preservar chaves desconhecidas compatíveis ao atualizar o catálogo.
- Atualizar `generated_at` com a data ISO da alteração efetiva do catálogo.

## Critério de aceite

O JSON deve ser válido, refletir o cronograma, apontar para arquivos existentes, não conter diretórios em links de páginas e passar no validador incluído.
