import csv
import hashlib
import unittest
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "materiais/aula-17/dados/rh_enfermagem.csv"
MOTIVOS_FORA = {"Aposentadoria", "Fim de contrato temporário"}


class Aula17DatasetTests(unittest.TestCase):
    def setUp(self):
        with DATASET.open(newline="", encoding="utf-8") as stream:
            self.rows = list(csv.DictReader(stream))

    def test_dataset_is_the_reviewed_copy(self):
        digest = hashlib.sha256(DATASET.read_bytes()).hexdigest()
        self.assertEqual(
            "dfaebee6ba7b5cf2093bbf31b1b728f5a4220367c8f03ca6dbfd2a5a5f9cc7b4",
            digest,
        )
        self.assertEqual(3_090, len(self.rows))
        self.assertEqual(16, len(self.rows[0]))
        self.assertEqual(3_000, len({row["id_profissional"] for row in self.rows}))

    def test_checkpoints_match_the_guided_practice(self):
        motivos = Counter(row["motivo_desligamento"] for row in self.rows)
        self.assertEqual(483, motivos["Pedido de demissão"])
        self.assertEqual(64, motivos["Fim de contrato temporário"])
        self.assertEqual(40, motivos["Aposentadoria"])
        self.assertEqual(587, sum(row["desligou"] == "1" for row in self.rows))

        recentes = {}
        for row in sorted(self.rows, key=lambda r: (r["id_profissional"], r["data_registro"])):
            recentes[row["id_profissional"]] = row
        base = list(recentes.values())
        self.assertEqual(3_000, len(base))
        base = [row for row in base if row["tempo_casa_meses"] != "0"]
        self.assertEqual(2_893, len(base))
        base = [row for row in base if row["motivo_desligamento"] not in MOTIVOS_FORA]
        self.assertEqual(2_789, len(base))
        self.assertEqual(483, sum(row["motivo_desligamento"] == "Pedido de demissão" for row in base))


if __name__ == "__main__":
    unittest.main()
