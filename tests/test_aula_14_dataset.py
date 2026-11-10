import csv
import hashlib
import unittest
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "materiais/aula-14/dados/experimento_agendamento.csv"


class Aula14DatasetTests(unittest.TestCase):
    def setUp(self):
        with DATASET.open(newline="", encoding="utf-8") as stream:
            self.rows = list(csv.DictReader(stream))

    def test_dataset_is_the_reviewed_copy(self):
        digest = hashlib.sha256(DATASET.read_bytes()).hexdigest()
        self.assertEqual(
            "3b6b13db7720df3c07d8e7b9cfeed99bf80040261ba185f89905d0f18bbc80c3",
            digest,
        )
        self.assertEqual(14_392, len(self.rows))
        self.assertEqual(
            [
                "sessao_id",
                "usuario_id",
                "data",
                "variante",
                "dispositivo",
                "usuario_interno",
                "concluiu",
                "tempo_segundos",
            ],
            list(self.rows[0]),
        )

    def test_checkpoints_match_the_guided_practice(self):
        brutas = Counter(row["variante"] for row in self.rows)
        self.assertEqual({"A": 6_974, "B": 7_418}, dict(brutas))
        self.assertEqual(10_575, len({row["usuario_id"] for row in self.rows}))

        unicas = list({tuple(row.values()): row for row in self.rows}.values())
        self.assertEqual(14_152, len(unicas))

        externas = [row for row in unicas if row["usuario_interno"] == "nao"]
        self.assertEqual(13_516, len(externas))

        variantes = {}
        for row in externas:
            variantes.setdefault(row["usuario_id"], set()).add(row["variante"])
        contaminados = {u for u, v in variantes.items() if len(v) > 1}
        self.assertEqual(160, len(contaminados))

        validas = [row for row in externas if row["usuario_id"] not in contaminados]
        self.assertEqual(13_044, len(validas))

        usuarios = {}
        for row in validas:
            atual = usuarios.setdefault(row["usuario_id"], {"variante": row["variante"], "concluiu": 0})
            atual["concluiu"] = max(atual["concluiu"], int(row["concluiu"]))
        self.assertEqual(10_400, len(usuarios))
        por_variante = Counter(u["variante"] for u in usuarios.values())
        self.assertEqual({"A": 5_280, "B": 5_120}, dict(por_variante))
        conversoes = Counter(u["variante"] for u in usuarios.values() if u["concluiu"])
        self.assertEqual({"A": 2_138, "B": 2_189}, dict(conversoes))


if __name__ == "__main__":
    unittest.main()
