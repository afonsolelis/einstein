import csv
import hashlib
import unittest
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "materiais/aula-13/dados/olist_pedidos.csv"


class Aula13DatasetTests(unittest.TestCase):
    def setUp(self):
        with DATASET.open(newline="", encoding="utf-8") as stream:
            self.rows = list(csv.DictReader(stream))

    def test_dataset_is_the_reviewed_copy(self):
        digest = hashlib.sha256(DATASET.read_bytes()).hexdigest()
        self.assertEqual(
            "00efcd40947d6205e21d16a0d1601ac05cfc03c5ddd7b7eaaea5609ba9eb0fe4",
            digest,
        )
        self.assertEqual(99_441, len(self.rows))
        self.assertEqual(
            [
                "order_id",
                "order_status",
                "order_purchase_timestamp",
                "customer_state",
                "itens",
                "valor_produtos",
                "valor_frete",
            ],
            list(self.rows[0]),
        )

    def test_checkpoints_match_the_guided_practice(self):
        self.assertEqual(99_441, len({row["order_id"] for row in self.rows}))
        self.assertEqual(775, sum(not row["itens"] for row in self.rows))
        status = Counter(row["order_status"] for row in self.rows)
        self.assertEqual(625, status["canceled"])
        self.assertEqual(609, status["unavailable"])

        janela = [
            row for row in self.rows
            if "2017-01-09" <= row["order_purchase_timestamp"] < "2018-08-20"
        ]
        self.assertEqual(97_845, len(janela))
        vendas = [row for row in janela if row["order_status"] not in {"canceled", "unavailable"}]
        self.assertEqual(96_690, len(vendas))
        self.assertEqual(5, sum(not row["itens"] for row in vendas))
        self.assertEqual(
            1_176,
            sum(row["order_purchase_timestamp"].startswith("2017-11-24") for row in self.rows),
        )


if __name__ == "__main__":
    unittest.main()
