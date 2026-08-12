#!/usr/bin/env python3
"""Audita se o repositório segue trunk-based development em `main`."""

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
TRUNK = "main"
REMOTE_TRUNK = "origin/main"


def git(*args):
    result = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def check_current_branch(errors):
    _, branch, _ = git("rev-parse", "--abbrev-ref", "HEAD")
    if branch != TRUNK:
        errors.append(f"HEAD está em '{branch}'; o trabalho deve acontecer em '{TRUNK}'")


def check_extra_branches(errors):
    _, output, _ = git("for-each-ref", "--format=%(refname:short)", "refs/heads")
    extra = [name for name in output.splitlines() if name and name != TRUNK]
    for name in extra:
        code, _, _ = git("merge-base", "--is-ancestor", name, TRUNK)
        estado = "já integrada, apagar com git branch -d" if code == 0 else "NÃO integrada"
        errors.append(f"branch local extra: {name} ({estado})")

    _, output, _ = git("for-each-ref", "--format=%(refname:short)\t%(symref)", "refs/remotes/origin")
    for line in output.splitlines():
        name, _, symref = line.partition("\t")
        if not name or symref or name in {REMOTE_TRUNK, "origin", "origin/HEAD"}:
            continue
        errors.append(f"branch remota extra: {name} (integrar e apagar)")


def check_sync(errors):
    code, _, _ = git("rev-parse", "--verify", "--quiet", REMOTE_TRUNK)
    if code != 0:
        errors.append(f"referência {REMOTE_TRUNK} ausente; rodar git fetch origin")
        return
    _, counts, _ = git("rev-list", "--left-right", "--count", f"{REMOTE_TRUNK}...{TRUNK}")
    try:
        atras, adiante = (int(value) for value in counts.split())
    except ValueError:
        errors.append("não foi possível comparar main com origin/main")
        return
    if atras:
        errors.append(f"main está {atras} commit(s) atrás de origin/main; rodar git pull --rebase")
    if adiante:
        errors.append(f"main tem {adiante} commit(s) não publicado(s); rodar git push origin main")


def check_linear_history(errors, depth):
    _, output, _ = git("log", "--merges", "--oneline", f"-{depth}", TRUNK)
    for line in output.splitlines():
        if line:
            errors.append(f"commit de merge no histórico: {line} (integrar com --ff-only ou rebase)")


def check_clean_tree(errors):
    _, output, _ = git("status", "--porcelain")
    if output:
        arquivos = len(output.splitlines())
        errors.append(f"árvore de trabalho suja: {arquivos} arquivo(s) pendente(s) de commit")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fetch", action="store_true", help="atualizar referências remotas antes de auditar")
    parser.add_argument("--depth", type=int, default=30, help="commits inspecionados na checagem de linearidade")
    parser.add_argument("--allow-dirty", action="store_true", help="não reclamar de alterações não commitadas")
    args = parser.parse_args()

    if args.fetch:
        code, _, stderr = git("fetch", "origin", "--prune")
        if code != 0:
            print(f"falha ao buscar do remoto: {stderr}", file=sys.stderr)
            return 1

    errors = []
    check_current_branch(errors)
    check_extra_branches(errors)
    check_sync(errors)
    check_linear_history(errors, args.depth)
    if not args.allow_dirty:
        check_clean_tree(errors)

    if errors:
        print("\n".join(f"- {error}" for error in errors), file=sys.stderr)
        return 1
    print("trunk íntegro: apenas main, histórico linear e sincronizado com origin")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
