# Esquema do `index.json`

## Raiz

- `schema_version`: versão do contrato.
- `generated_at`: data ISO da última atualização efetiva.
- `course`: metadados gerais do curso.
- `project_files`: inventário agrupado de arquivos relevantes.
- `lessons`: lista ordenada das 19 aulas.

## `project_files`

Objeto de grupos, cada um com uma lista de caminhos relativos à raiz. Todo caminho listado deve existir.

- `root`: arquivos da raiz do repositório, incluindo `requirements.txt`.
- `development_environment`: configuração do ambiente do estudante, hoje `.devcontainer/devcontainer.json` (GitHub Codespaces).
- `assets`: identidade visual.
- `official_documents`: documentos institucionais.
- `tests`: suítes Python e Playwright.
- `authoring_skills`: `SKILL.md`, referências, agentes e validadores de `.agents/skills/`, inclusive a skill de versionamento `trunk-based-git`.

Novos grupos são aceitos desde que sigam o mesmo formato de lista de caminhos existentes.

## Aula

Cada item contém `number`, `date`, `theme`, `tag`, `status`, `topics`, `objectives`, `slides` e `material`.

- `status`: `complete`, `partial` ou `placeholder`.
- `topics`: conceitos centrais efetivamente abordados.
- `objectives`: resultados observáveis; vazio para placeholders.
- `slides.path`: arquivo HTML explícito.
- `slides.slide_count`: total real de `.slide`.
- `slides.sections`: valores de `data-lesson-section` presentes.
- `material.path`: arquivo `index.html` explícito.
- `material.section_count`: total real de `h2` dentro de `.content`.
- `material.highlights`: destaques úteis do guia; vazio para placeholders.
- `material.activity`: resumo da prática ou `null`.
- `material.deliverable`: critério de entrega ou `null`.

O validador também aceita campos adicionais, desde que os obrigatórios permaneçam coerentes.
