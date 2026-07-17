import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / ".agents/skills/create-complete-lesson/scripts/validate_lesson.py"
SPEC = importlib.util.spec_from_file_location("validate_lesson", VALIDATOR)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class LessonStandardTests(unittest.TestCase):
    def test_every_scheduled_lesson_has_valid_structure(self):
        for lesson in range(1, 20):
            with self.subTest(lesson=lesson):
                self.assertEqual([], MODULE.validate(ROOT, lesson))

    def test_completed_lessons_are_complete(self):
        for lesson in (1, 2):
            with self.subTest(lesson=lesson):
                self.assertEqual([], MODULE.validate(ROOT, lesson, complete=True))


if __name__ == "__main__":
    unittest.main()
