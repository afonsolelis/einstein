import csv
import hashlib
import unittest
from collections import Counter
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DADOS = ROOT / "materiais/aula-15/dados"
CONTAS = DADOS / "contas_a_pagar.csv"
FORNECEDORES = DADOS / "fornecedores.csv"
FERIADOS_2025 = {
    "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21",
    "2025-05-01", "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02",
    "2025-11-15", "2025-11-20", "2025-12-25",
}


def ler(caminho):
    with caminho.open(newline="", encoding="utf-8") as stream:
        return list(csv.DictReader(stream))


class Aula15DatasetTests(unittest.TestCase):
    def setUp(self):
        self.contas = ler(CONTAS)
        self.cadastro = {row["fornecedor_id"] for row in ler(FORNECEDORES)}
        self.pagamentos = [row for row in self.contas if row["tipo"] == "pagamento"]
        for row in self.pagamentos:
            row["fornecedor_id"] = row["fornecedor_id"].strip().upper()
            row["valor"] = float(row["valor"])

    def test_files_are_the_reviewed_copies(self):
        self.assertEqual(
            "b3898f2daa84095b6d56c1ccb661a2dba6c8736e36807770204be4d8b0d3e9ce",
            hashlib.sha256(CONTAS.read_bytes()).hexdigest(),
        )
        self.assertEqual(
            "2a5fede2703f558f2933798055b03f0eb080e84fbcf361b09d640ca7e45918ea",
            hashlib.sha256(FORNECEDORES.read_bytes()).hexdigest(),
        )
        self.assertEqual(5_440, len(self.contas))
        self.assertEqual(120, len(self.cadastro))
        self.assertEqual(
            ["pagamento_id", "data_pagamento", "fornecedor_id", "nota_fiscal", "valor", "solicitante", "tipo"],
            list(self.contas[0]),
        )

    def test_cleaning_checkpoints(self):
        brutos = ler(CONTAS)
        self.assertEqual(61, sum(row["fornecedor_id"] not in self.cadastro for row in brutos))
        self.assertEqual(47, sum(row["fornecedor_id"] != row["fornecedor_id"].strip().upper() for row in brutos))
        self.assertEqual(32, sum(row["tipo"] == "estorno" for row in brutos))
        self.assertEqual(5_408, len(self.pagamentos))
        self.assertEqual(929, sum(row["valor"] >= 10_000 for row in self.pagamentos))

    def test_rule_checkpoints(self):
        vistos, duplicados = set(), 0
        for row in self.pagamentos:
            chave = (row["fornecedor_id"], row["nota_fiscal"], row["valor"])
            duplicados += chave in vistos
            vistos.add(chave)
        self.assertEqual(18, duplicados)

        vistos, ingenua = set(), 0
        for row in self.pagamentos:
            chave = (row["fornecedor_id"], row["valor"])
            ingenua += chave in vistos
            vistos.add(chave)
        self.assertEqual(77, ingenua)

        self.assertEqual(14, sum(row["fornecedor_id"] not in self.cadastro for row in self.pagamentos))
        nao_util = sum(
            date.fromisoformat(row["data_pagamento"]).weekday() >= 5 or row["data_pagamento"] in FERIADOS_2025
            for row in self.pagamentos
        )
        self.assertEqual(25, nao_util)
        self.assertEqual(116, sum(9_000 <= row["valor"] < 10_000 for row in self.pagamentos))
        redondos = [row for row in self.pagamentos if row["valor"] >= 1_000 and row["valor"] % 100 == 0]
        self.assertEqual(64, len(redondos))
        self.assertEqual(40, Counter(row["fornecedor_id"] for row in redondos)["F045"])

    def test_benford_supplier_has_no_low_first_digits(self):
        f077 = [row["valor"] for row in self.pagamentos if row["fornecedor_id"] == "F077"]
        self.assertEqual(60, len(f077))
        self.assertTrue(all(str(valor)[0] not in "123" for valor in f077))


if __name__ == "__main__":
    unittest.main()
