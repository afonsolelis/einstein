---
name: trunk-based-git
description: Regras de versionamento deste repositório, que opera em trunk-based development com histórico truncado e linear em `main`. Usar sempre que for criar commits, integrar trabalho de agentes, revisar o estado das branches ou publicar mudanças no GitHub.
---

# Versionamento trunk-based

Este repositório tem **uma única linha de desenvolvimento: `main`**. Não existem branches de longa duração, branches de feature nem fluxo de release. Todo trabalho concluído aterrissa em `main`.

## Regras invioláveis

1. **Commitar direto em `main`.** Não criar branch para trabalho comum. Se uma ferramenta ou agente criar uma branch automaticamente, ela é temporária e deve ser integrada e apagada no mesmo ciclo de trabalho.
2. **Histórico linear.** Integrar sempre com `git merge --ff-only` ou `git rebase`. Nunca gerar commits de merge.
3. **Commits pequenos e completos.** Cada commit deve deixar o site navegável e os validadores passando. Não commitar trabalho pela metade nem quebrar navegação `file://`.
4. **Validar antes de commitar.** Rodar os validadores e testes aplicáveis à mudança (ver "Portão de qualidade").
5. **Publicar no mesmo ciclo.** Commit sem `git push origin main` deixa o trunk divergente; sempre empurrar após validar.
6. **Nunca reescrever histórico publicado.** Sem `push --force` em `main`. Correção de erro publicado é um novo commit.
7. **Zero branches remanescentes.** Ao final de qualquer tarefa, `git branch -a` deve listar apenas `main` e `remotes/origin/main`.

## Fluxo padrão de uma mudança

```bash
git pull --rebase origin main     # sincronizar antes de editar
# ... editar arquivos ...
python3 .agents/skills/update-course-index/scripts/validate_index.py
python3 -m unittest discover -s tests
git add <arquivos>
git commit -m "Mensagem no imperativo em português"
git push origin main
```

## Integrar uma branch criada por agente ou ferramenta

```bash
git fetch origin --prune
git checkout main
git merge --ff-only <branch>          # se falhar, rebasear a branch sobre main e repetir
git push origin main
git branch -d <branch>
git push origin --delete <branch>     # confirmar com o professor antes de apagar remotas
```

Se `--ff-only` falhar, a branch está atrasada: `git rebase main` nela e refazer a integração. Nunca resolver com merge commit.

## Auditar o estado do trunk

```bash
python3 .agents/skills/trunk-based-git/scripts/check_trunk.py
```

O script falha quando existem branches além de `main`, quando há trabalho não integrado, quando `main` está divergente de `origin/main` ou quando o histórico contém commits de merge recentes.

## Mensagens de commit

- Português do Brasil, no imperativo, uma linha de até ~72 caracteres.
- Descrever o efeito editorial ou funcional, não o arquivo mexido.
- Bom: `Adapta laboratório 02 para Git com case hospitalar`.
- Ruim: `Ok`, `update`, `ajustes finais`, `wip`.

## Conteúdo do curso e o trunk

A disciplina ensina Git e GitHub (laboratório 02). O repositório é material didático vivo: manter o histórico legível é parte do exemplo. Commits com mensagens descritivas e histórico linear são a referência que os estudantes veem ao inspecionar `git log --graph`.

Branches ainda são ensinadas em aula como conceito e prática do estudante no repositório **dele**; a operação deste repositório permanece trunk-based.
