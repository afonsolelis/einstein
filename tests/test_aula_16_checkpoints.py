import csv
import unittest
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "materiais/aula-13/dados/olist_pedidos.csv"


class Aula16CheckpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with DATASET.open(newline="", encoding="utf-8") as stream:
            cls.vendas = [
                row for row in csv.DictReader(stream)
                if "2017-01-09" <= row["order_purchase_timestamp"] < "2018-08-20"
                and row["order_status"] not in {"canceled", "unavailable"}
            ]

    def test_indicadores_por_estado(self):
        self.assertEqual(96_690, len(self.vendas))
        pedidos = defaultdict(int)
        frete = defaultdict(float)
        for row in self.vendas:
            pedidos[row["customer_state"]] += 1
            frete[row["customer_state"]] += float(row["valor_frete"] or 0)
        self.assertEqual(27, len(pedidos))
        self.assertEqual(40_279, pedidos["SP"])
        self.assertEqual(12_531, pedidos["RJ"])
        self.assertEqual(11_324, pedidos["MG"])
        self.assertAlmostEqual(41.7, 100 * pedidos["SP"] / len(self.vendas), places=1)
        candidatos = sorted(uf for uf, n in pedidos.items() if uf != "SP" and n >= 1_500)
        self.assertEqual(["BA", "DF", "ES", "GO", "MG", "PE", "PR", "RJ", "RS", "SC"], candidatos)

    def test_matriz_com_pesos_de_base(self):
        pedidos = defaultdict(int)
        frete = defaultdict(float)
        com_frete = defaultdict(int)
        p2017 = defaultdict(int)
        p2018 = defaultdict(int)
        for row in self.vendas:
            uf = row["customer_state"]
            pedidos[uf] += 1
            if row["valor_frete"]:
                frete[uf] += float(row["valor_frete"])
                com_frete[uf] += 1
            data = row["order_purchase_timestamp"]
            if data < "2017-08-20":
                p2017[uf] += 1
            elif data >= "2018-01-09":
                p2018[uf] += 1
        candidatos = [uf for uf, n in pedidos.items() if uf != "SP" and n >= 1_500]
        criterios = {
            "volume": {uf: pedidos[uf] for uf in candidatos},
            "frete": {uf: frete[uf] / com_frete[uf] for uf in candidatos},
            "crescimento": {uf: p2018[uf] / p2017[uf] - 1 for uf in candidatos},
        }
        pesos = {"volume": 0.5, "frete": 0.3, "crescimento": 0.2}
        nota = {uf: 0.0 for uf in candidatos}
        for nome, valores in criterios.items():
            minimo, maximo = min(valores.values()), max(valores.values())
            for uf in candidatos:
                nota[uf] += pesos[nome] * (valores[uf] - minimo) / (maximo - minimo)
        ranking = sorted(candidatos, key=nota.get, reverse=True)
        self.assertEqual(["RJ", "MG", "PE"], ranking[:3])
        self.assertAlmostEqual(0.537, nota["RJ"], places=3)
        self.assertAlmostEqual(0.508, nota["MG"], places=3)


if __name__ == "__main__":
    unittest.main()
