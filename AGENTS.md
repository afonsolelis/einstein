# Project Context
A static content site for a Data Science & AI course curriculum.

## Key Architecture
- **Monolithic Frontend**: `index.html` is self-contained (HTML, CSS, and JS) and requires no build process.
- **Content Source**: Lesson data and display logic are controlled via the `aulas` array within `index.html`.

## Directory Structure & Navigation
- **Slides**: Located in `slides/` (e.g., `aula-01.html`).
- **Materials**: Located in `materiais/` per lesson (e.g., `materiais/aula-XX/`).
- **Skills**: Located in `.agents/skills/`; cada `SKILL.md` é normativo para o seu domínio.

## Versionamento (Regra de Ouro)
- **Trunk-based**: o repositório tem uma única linha de desenvolvimento, `main`. Commitar direto em `main`, com histórico linear (`--ff-only` ou rebase) e sem commits de merge.
- **Sem branches remanescentes**: branches criadas por ferramentas ou agentes são temporárias; integrar e apagar (local e remota) no mesmo ciclo.
- **Publicar sempre**: após validar, `git push origin main`. Nunca `push --force` em `main`.
- Regras completas, fluxo e auditoria em `.agents/skills/trunk-based-git/SKILL.md`.

## Ambiente de execução do curso
- **GitHub Codespaces** é o ambiente oficial dos estudantes, definido em `.devcontainer/devcontainer.json` com as bibliotecas de `requirements.txt` (Jupyter, Pandas, NumPy, Matplotlib, Seaborn, scikit-learn).
- Notebooks rodam em **Jupyter dentro do Codespace**; a persistência do trabalho é feita por **commit e push**, não por armazenamento em nuvem externo. Materiais e slides devem refletir esse fluxo.
- O mesmo devcontainer habilita **Docker e Docker Compose** (feature `docker-in-docker`) e encaminha a **porta 3000**, usada pelo Metabase do laboratório 5. Aulas que subam serviços devem instruir o acesso pela aba **PORTS** do Codespaces, nunca por `localhost` no navegador do estudante.

## Navegação e Arquitetura Offline (Regra de Ouro)
- **Links Explícitos:** Como o projeto costuma ser aberto diretamente pelos arquivos locais (`file://`) sem um servidor web, **NUNCA** deixe links apontando para diretórios. Links para materiais devem **SEMPRE** apontar explicitamente para o arquivo (ex: `materiais/aula-XX/index.html` ao invés de `materiais/aula-XX/`).

## Regras de Interface (UI)
- **Cards do Cronograma**: Os cards no `index.html` devem manter um layout de **lista horizontal** no desktop (`flex-direction: row`), com o bloco de data/aula na lateral e conteúdo no restante da linha. No mobile, eles devem empilhar (`flex-direction: column`). Não utilize layouts em grid multi-colunas para os cards.
- **Aparência Premium**: Mantenha a paleta oficial, utilize gradientes sutis e efeitos de hover para garantir que o projeto mantenha uma estética sofisticada.
## Escrita (obrigatório)

Todo texto destinado ao aluno (slides, materiais, páginas, quizzes, atividades) segue as skills `escrita-afonso` e `humanizacao`, em `.agents/skills/`. Aplique-as já na redação, e não só numa revisão posterior. Para revisar ou reescrever uma aula inteira em tom acadêmico, use a skill `estilo-academico` (revisor trazido do projeto `tese`), que traz a lista de vícios de IA a eliminar e o procedimento de conferência. Evite linguagem de rede social: título em forma de aforismo, travessão como conector, "não é X, é Y", negrito na prosa, setas decorativas e frases de efeito no fechamento. Títulos de slide devem ser descritivos e curtos, cabendo em uma linha na projeção. Preserve números, fatos, código e prompts.
