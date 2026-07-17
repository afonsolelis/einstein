#!/usr/bin/env python3
"""Valida o catálogo index.json contra o cronograma e os HTMLs do curso."""

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
CATALOG = ROOT / "index.json"
SCHEDULE_RE = re.compile(
    r'\{\s*n:\s*(\d+),\s*data:\s*"([^"]+)",\s*tema:\s*"([^"]+)",\s*tag:\s*"([^"]+)"\s*\}'
)


def fail(message, errors):
    errors.append(message)


def main():
    errors = []
    try:
        catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"index.json inválido: {exc}", file=sys.stderr)
        return 1

    schedule = [
        {"number": int(number), "date": date, "theme": theme, "tag": tag}
        for number, date, theme, tag in SCHEDULE_RE.findall(
            (ROOT / "index.html").read_text(encoding="utf-8")
        )
    ]
    lessons = catalog.get("lessons", [])
    if len(lessons) != len(schedule):
        fail(f"lessons deve conter {len(schedule)} itens; encontrou {len(lessons)}", errors)

    for expected, lesson in zip(schedule, lessons):
        number = expected["number"]
        for key in ("number", "date", "theme", "tag"):
            if lesson.get(key) != expected[key]:
                fail(f"aula {number}: {key} diverge do cronograma", errors)
        if lesson.get("status") not in {"complete", "partial", "placeholder"}:
            fail(f"aula {number}: status inválido", errors)

        slide_meta = lesson.get("slides", {})
        material_meta = lesson.get("material", {})
        for label, meta in (("slides", slide_meta), ("material", material_meta)):
            path = meta.get("path", "")
            if not path.endswith(".html"):
                fail(f"aula {number}: caminho de {label} deve terminar em .html", errors)
                continue
            if not (ROOT / path).is_file():
                fail(f"aula {number}: arquivo ausente: {path}", errors)

        slide_path = ROOT / slide_meta.get("path", "__missing__")
        if slide_path.is_file():
            html = slide_path.read_text(encoding="utf-8")
            count = len(re.findall(r'<div\s+class="[^"]*\bslide\b', html))
            if slide_meta.get("slide_count") != count:
                fail(f"aula {number}: slide_count deve ser {count}", errors)
            sections = sorted(set(re.findall(r'data-lesson-section="([^"]+)"', html)))
            if sorted(slide_meta.get("sections", [])) != sections:
                fail(f"aula {number}: sections dos slides divergentes", errors)

        material_path = ROOT / material_meta.get("path", "__missing__")
        if material_path.is_file():
            html = material_path.read_text(encoding="utf-8")
            content = re.search(r'<div class="content">(.*?)<div class="actions">', html, re.S)
            count = len(re.findall(r'<h2\b', content.group(1))) if content else 0
            if material_meta.get("section_count") != count:
                fail(f"aula {number}: material.section_count deve ser {count}", errors)

    for group, paths in catalog.get("project_files", {}).items():
        if not isinstance(paths, list):
            fail(f"project_files.{group} deve ser uma lista", errors)
            continue
        for path in paths:
            if not (ROOT / path).is_file():
                fail(f"project_files.{group}: arquivo ausente: {path}", errors)

    if errors:
        print("\n".join(f"- {error}" for error in errors), file=sys.stderr)
        return 1
    print(f"index.json válido: {len(lessons)} aulas catalogadas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
