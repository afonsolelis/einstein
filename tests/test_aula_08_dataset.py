import csv
import hashlib
import unittest
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "materiais/aula-05/dados/hospital_patients_real_world.csv"


class Aula08DatasetTests(unittest.TestCase):
    def setUp(self):
        with DATASET.open(newline="", encoding="utf-8-sig") as stream:
            self.rows = list(csv.DictReader(stream))

    def test_dataset_is_the_reviewed_kaggle_copy(self):
        digest = hashlib.sha256(DATASET.read_bytes()).hexdigest()
        self.assertEqual(
            "af6c3023e87c1950cb021579521534c3d44fc940953216ca560ca1d7e3eabc8a",
            digest,
        )
        self.assertEqual(5_000, len(self.rows))
        self.assertEqual(
            [
                "PatientID",
                "Age",
                "Gender",
                "Diagnosis",
                "AdmissionDate",
                "DischargeDate",
                "HospitalID",
            ],
            list(self.rows[0]),
        )

    def test_checkpoints_match_the_guided_practice(self):
        self.assertEqual(350, sum(not row["Age"].strip() for row in self.rows))
        self.assertEqual(350, sum(not row["Gender"].strip() for row in self.rows))
        self.assertEqual(350, sum(not row["Diagnosis"].strip() for row in self.rows))
        self.assertEqual(321, sum(bool(row["Diagnosis"]) and row["Diagnosis"].isupper() for row in self.rows))
        self.assertEqual(0, len(self.rows) - len({tuple(row.values()) for row in self.rows}))
        self.assertEqual(5_000, len({row["PatientID"] for row in self.rows}))

        invalid_chronology = sum(
            date.fromisoformat(row["DischargeDate"])
            < date.fromisoformat(row["AdmissionDate"])
            for row in self.rows
        )
        self.assertEqual(150, invalid_chronology)


if __name__ == "__main__":
    unittest.main()
