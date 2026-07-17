#!/usr/bin/env python3
"""Validate structural and didactic contracts for one repository lesson."""

from __future__ import annotations

import argparse
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class LessonHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.classes: list[set[str]] = []
        self.hrefs: list[str] = []
        self.sections: set[str] = set()
        self.buttons: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if data.get("id"):
            self.ids.add(data["id"] or "")
        classes = set((data.get("class") or "").split())
        if classes:
            self.classes.append(classes)
        if data.get("href"):
            self.hrefs.append(data["href"] or "")
        if data.get("data-lesson-section"):
            self.sections.add(data["data-lesson-section"] or "")
        if tag == "button" and data.get("id"):
            self.buttons.add(data["id"] or "")


def parse(path: Path) -> tuple[str, LessonHTMLParser]:
    text = path.read_text(encoding="utf-8")
    parser = LessonHTMLParser()
    parser.feed(text)
    return text, parser


def validate(root: Path, lesson: int, complete: bool = False) -> list[str]:
    code = f"{lesson:02d}"
    slide_path = root / "slides" / f"aula-{code}.html"
    material_path = root / "materiais" / f"aula-{code}" / "index.html"
    errors: list[str] = []
    for path in (slide_path, material_path):
        if not path.is_file():
            errors.append(f"arquivo ausente: {path.relative_to(root)}")
    if errors:
        return errors

    slides, sp = parse(slide_path)
    material, mp = parse(material_path)
    slide_classes = [c for c in sp.classes if "slide" in c]

    checks = [
        ("slider" in sp.ids, "slides: #slider ausente"),
        ("controls" in sp.ids, "slides: #controls ausente"),
        (len(slide_classes) >= 2, "slides: capa e encerramento obrigatórios"),
        (any("active" in c for c in slide_classes), "slides: nenhum slide ativo"),
        ({"btn-prev", "btn-next", "btn-fs"} <= sp.buttons, "slides: controles incompletos"),
        (f"../materiais/aula-{code}/index.html" in sp.hrefs, "slides: link explícito para material ausente"),
        ("../index.html" in sp.hrefs, "slides: link explícito para home ausente"),
        (all(token in slides for token in ("ArrowLeft", "ArrowRight", "requestFullscreen")), "slides: teclado/tela cheia incompletos"),
        ("@media" in slides, "slides: CSS responsivo ausente"),
        (f"../../slides/aula-{code}.html" in mp.hrefs, "material: link explícito para slides ausente"),
        ("../../index.html" in mp.hrefs, "material: link explícito para home ausente"),
        ("window.print()" in material and "@media print" in material, "material: impressão incompleta"),
        (any("alert-box" in c for c in mp.classes), "material: alerta de boa prática ausente"),
        (sum("code-block" in c for c in mp.classes) >= 1, "material: bloco de código ausente"),
    ]
    errors.extend(message for ok, message in checks if not ok)

    directory_links = [h for h in sp.hrefs + mp.hrefs if not h.startswith(("#", "http", "mailto:")) and h.endswith("/")]
    if directory_links:
        errors.append(f"navegação offline: links para diretórios: {', '.join(directory_links)}")
    if re.search(r"\b(?:TODO|TBD|PLACEHOLDER)\b|\{\{[^}]+\}\}", slides + material, re.I):
        errors.append("conteúdo: placeholder ou marcador pendente encontrado")

    if complete:
        required = {"objectives", "agenda", "concepts", "guided-practice", "challenge", "summary", "next-steps"}
        missing_slides = required - sp.sections
        missing_material = (required - {"agenda"}) - mp.sections
        if len(slide_classes) < 10:
            errors.append("slides completos: mínimo de 10 slides")
        if missing_slides:
            errors.append(f"slides completos: seções ausentes: {', '.join(sorted(missing_slides))}")
        if missing_material:
            errors.append(f"material completo: seções ausentes: {', '.join(sorted(missing_material))}")
        if "checklist" not in mp.sections:
            errors.append("material completo: checklist ausente")
        if sum("code-block" in c for c in mp.classes) < 2:
            errors.append("material completo: ao menos dois blocos de código são obrigatórios")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lesson", type=int, required=True)
    parser.add_argument("--complete", action="store_true")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[4])
    args = parser.parse_args()
    errors = validate(args.root.resolve(), args.lesson, args.complete)
    if errors:
        print("\n".join(f"FAIL: {error}" for error in errors))
        return 1
    print(f"OK: aula {args.lesson:02d} atende ao padrão{' completo' if args.complete else ' estrutural'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
