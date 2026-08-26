import csv
import hashlib
import statistics
import unittest
from collections import defaultdict
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DADOS = ROOT / "materiais/aula-04/dados"
BASE = DADOS / "rede_vita_internacoes.csv"

ASSINATURAS = {
    "rede_vita_internacoes.csv": "ca2476f35979da0dc575acd1432fd6ef7a2d7503b8fdb6bd25b924cf976af083",
    "grupo_a_painel_operacoes.csv": "1774973813c115bae8c1f7034ee6eabadd3005bb2bbacecea244cc1904bb8c03",
    "grupo_b_registros_clinicos.csv": "2ba9a180f27c64cbf8f70d2b1df48d654b257773f3f166ba94da76afc1d44c69",
    "grupo_c_registros_risco.csv": "c05e6e8b60e779a0e2c52e198236d1c6046a728d005d06b3b16a7e0d9e5821c1",
}


def ler(caminho: Path) -> list[dict[str, str]]:
    with caminho.open(newline="", encoding="utf-8") as stream:
        return list(csv.DictReader(stream))


class Aula04DatasetTests(unittest.TestCase):
    """A base é gerada por dados/gerar_base.py com semente fixa: os números
    publicados nos slides e no material precisam permanecer verificáveis."""

    def setUp(self):
        self.linhas = ler(BASE)
        for linha in self.linhas:
            linha["dias_internacao"] = int(linha["dias_internacao"])
            linha["custo_total"] = float(linha["custo_total"])
            linha["reinternacao_30d"] = int(linha["reinternacao_30d"])
        self.por_unidade = defaultdict(list)
        for linha in self.linhas:
            self.por_unidade[linha["unidade"]].append(linha)

    def dias(self, unidade: str, gravidade: str | None = None) -> list[int]:
        return [
            linha["dias_internacao"]
            for linha in self.por_unidade[unidade]
            if gravidade is None or linha["gravidade"] == gravidade
        ]

    def test_arquivos_publicados_mantem_assinatura(self):
        for nome, digest in ASSINATURAS.items():
            with self.subTest(arquivo=nome):
                arquivo = DADOS / nome
                self.assertTrue(arquivo.is_file())
                self.assertEqual(digest, hashlib.sha256(arquivo.read_bytes()).hexdigest())

    def test_inventario_da_base_completa(self):
        self.assertEqual(5_838, len(self.linhas))
        self.assertEqual(
            [
                "atendimento_id", "unidade", "linha_cuidado", "gravidade",
                "data_admissao", "data_alta", "dias_internacao", "custo_total",
                "reinternacao_30d",
            ],
            list(self.linhas[0]),
        )
        self.assertEqual(5_838, len({linha["atendimento_id"] for linha in self.linhas}))
        self.assertFalse(any(valor == "" for linha in self.linhas for valor in linha.values()))
        self.assertEqual({"Norte", "Sul", "Leste", "Oeste"}, set(self.por_unidade))
        self.assertEqual(
            {"Norte": 2_100, "Sul": 2_400, "Leste": 1_300, "Oeste": 38},
            {unidade: len(linhas) for unidade, linhas in self.por_unidade.items()},
        )
        self.assertTrue(all(linha["dias_internacao"] >= 1 for linha in self.linhas))
        self.assertTrue(
            all(
                date.fromisoformat(linha["data_alta"]) > date.fromisoformat(linha["data_admissao"])
                for linha in self.linhas
            )
        )

    def test_efeito_de_composicao_entre_norte_e_sul(self):
        media_norte = statistics.mean(self.dias("Norte"))
        media_sul = statistics.mean(self.dias("Sul"))
        self.assertLess(media_norte, media_sul)
        self.assertAlmostEqual(4.32, media_norte, places=2)
        self.assertAlmostEqual(6.70, media_sul, places=2)

        for gravidade in ("Baixa", "Média", "Alta"):
            with self.subTest(gravidade=gravidade):
                self.assertLess(
                    statistics.mean(self.dias("Sul", gravidade)),
                    statistics.mean(self.dias("Norte", gravidade)),
                )

        peso_sul = {g: len(self.dias("Sul", g)) / 2_400 for g in ("Baixa", "Média", "Alta")}
        peso_norte = {g: len(self.dias("Norte", g)) / 2_100 for g in ("Baixa", "Média", "Alta")}
        norte_no_mix_sul = sum(statistics.mean(self.dias("Norte", g)) * peso_sul[g] for g in peso_sul)
        sul_no_mix_norte = sum(statistics.mean(self.dias("Sul", g)) * peso_norte[g] for g in peso_norte)
        self.assertAlmostEqual(7.23, norte_no_mix_sul, places=2)
        self.assertAlmostEqual(3.86, sul_no_mix_norte, places=2)

    def test_distribuicao_bimodal_da_unidade_leste(self):
        leste = self.dias("Leste")
        norte = self.dias("Norte")
        self.assertAlmostEqual(4.21, statistics.mean(leste), places=2)
        self.assertAlmostEqual(4.32, statistics.mean(norte), places=2)
        self.assertEqual(1, statistics.median(leste))
        self.assertEqual(3, statistics.median(norte))
        self.assertAlmostEqual(73.0, 100 * sum(d <= 2 for d in leste) / len(leste), places=1)
        self.assertAlmostEqual(19.5, 100 * sum(d >= 10 for d in leste) / len(leste), places=1)
        self.assertAlmostEqual(6.6, 100 * sum(d >= 10 for d in norte) / len(norte), places=1)

    def test_amostra_pequena_da_unidade_oeste(self):
        oeste = sorted(self.dias("Oeste"))
        self.assertEqual(38, len(oeste))
        self.assertAlmostEqual(3.45, statistics.mean(oeste), places=2)
        self.assertAlmostEqual(2.75, statistics.mean(oeste[:-2]), places=2)
        self.assertEqual(1, sum(linha["reinternacao_30d"] for linha in self.por_unidade["Oeste"]))

    def test_indicador_unico_nao_descreve_desempenho(self):
        taxa = {
            unidade: statistics.mean(linha["reinternacao_30d"] for linha in linhas)
            for unidade, linhas in self.por_unidade.items()
        }
        self.assertGreater(taxa["Norte"], taxa["Sul"])
        self.assertAlmostEqual(0.170, taxa["Norte"], places=3)
        self.assertAlmostEqual(0.100, taxa["Sul"], places=3)
        self.assertAlmostEqual(0.132, taxa["Leste"], places=3)

    def test_recortes_sao_subconjuntos_fieis_da_base(self):
        completa = {linha["atendimento_id"]: linha for linha in self.linhas}

        grupo_b = ler(DADOS / "grupo_b_registros_clinicos.csv")
        self.assertEqual(4_500, len(grupo_b))
        self.assertEqual({"Norte", "Sul"}, {linha["unidade"] for linha in grupo_b})

        grupo_c = ler(DADOS / "grupo_c_registros_risco.csv")
        self.assertEqual(3_438, len(grupo_c))
        self.assertEqual({"Norte", "Leste", "Oeste"}, {linha["unidade"] for linha in grupo_c})

        for recorte in (grupo_b, grupo_c):
            for linha in recorte:
                origem = completa[linha["atendimento_id"]]
                for coluna, valor in linha.items():
                    self.assertEqual(str(origem[coluna]), valor)

    def test_painel_do_grupo_a_reproduz_os_numeros_do_parecer(self):
        painel = ler(DADOS / "grupo_a_painel_operacoes.csv")
        self.assertEqual(52, len(painel))

        por_unidade = defaultdict(list)
        for linha in painel:
            por_unidade[linha["unidade"]].append(
                (int(linha["altas"]), float(linha["media_dias_internacao"]))
            )

        parecer = {"Oeste": 3.35, "Norte": 4.50, "Sul": 6.86, "Leste": 7.28}
        for unidade, esperado in parecer.items():
            with self.subTest(unidade=unidade):
                medias = [media for _, media in por_unidade[unidade]]
                self.assertAlmostEqual(esperado, statistics.mean(medias), places=2)

                altas = sum(altas for altas, _ in por_unidade[unidade])
                ponderada = sum(a * m for a, m in por_unidade[unidade]) / altas
                self.assertEqual(len(self.por_unidade[unidade]), altas)
                self.assertAlmostEqual(
                    statistics.mean(self.dias(unidade)), ponderada, places=2
                )

        # a inversão de posição da unidade Leste é o achado central da rodada 2
        ordem_parecer = sorted(parecer, key=parecer.get)
        ordem_correta = sorted(parecer, key=lambda u: statistics.mean(self.dias(u)))
        self.assertEqual(["Oeste", "Norte", "Sul", "Leste"], ordem_parecer)
        self.assertEqual(["Oeste", "Leste", "Norte", "Sul"], ordem_correta)


if __name__ == "__main__":
    unittest.main()
