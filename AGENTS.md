# Project Context
A static content site for a Data Science & AI course curriculum.

## Key Architecture
- **Monolithic Frontend**: `index.html` is self-contained (HTML, CSS, and JS) and requires no build process.
- **Content Source**: Lesson data and display logic are controlled via the `aulas` array within `index.html`.

## Directory Structure & Navigation
- **Slides**: Located in `slides/` (e.g., `aula-01.html`).
- **Materials**: Located in `materiais/` per lesson (e.g., `materiais/aula-XX/`).

## Navegação e Arquitetura Offline (Regra de Ouro)
- **Links Explícitos:** Como o projeto costuma ser aberto diretamente pelos arquivos locais (`file://`) sem um servidor web, **NUNCA** deixe links apontando para diretórios. Links para materiais devem **SEMPRE** apontar explicitamente para o arquivo (ex: `materiais/aula-XX/index.html` ao invés de `materiais/aula-XX/`).

## Regras de Interface (UI)
- **Cards do Cronograma**: Os cards no `index.html` devem manter um layout de **lista horizontal** no desktop (`flex-direction: row`), com o bloco de data/aula na lateral e conteúdo no restante da linha. No mobile, eles devem empilhar (`flex-direction: column`). Não utilize layouts em grid multi-colunas para os cards.
- **Aparência Premium**: Mantenha a paleta oficial, utilize gradientes sutis e efeitos de hover para garantir que o projeto mantenha uma estética sofisticada.