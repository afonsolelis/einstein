import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / ".agents/skills/create-complete-lesson/scripts/validate_lesson.py"
SPEC = importlib.util.spec_from_file_location("validate_lesson", VALIDATOR)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


# Encontros sem conteúdo de laboratório: slide único, sem prática nem entrega.
ENCONTROS_ESPECIAIS = {8}


class LessonStandardTests(unittest.TestCase):
    def test_every_scheduled_lesson_has_valid_structure(self):
        for lesson in sorted(set(range(1, 20)) - ENCONTROS_ESPECIAIS):
            with self.subTest(lesson=lesson):
                self.assertEqual([], MODULE.validate(ROOT, lesson))

    def test_completed_lessons_are_complete(self):
        for lesson in (1, 2, 3, 4):
            with self.subTest(lesson=lesson):
                self.assertEqual([], MODULE.validate(ROOT, lesson, complete=True))


if __name__ == "__main__":
    unittest.main()
