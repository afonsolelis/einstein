#!/usr/bin/env python3
"""Gera a base sintética da Aula 04 (Rede Vita) e os recortes dos três grupos.

Execução: python3 gerar_base.py
Dependências: somente biblioteca padrão. A semente fixa torna a base reprodutível:
executar novamente produz arquivos byte a byte idênticos.

A base é inteiramente sintética. Nenhum registro corresponde a paciente, unidade
hospitalar ou operação real. Os parâmetros abaixo foram escolhidos para que o
conjunto reproduza quatro fenômenos estatísticos de interesse gerencial:
efeito de composição entre estratos, distribuição bimodal, amostra pequena e
indicador único insuficiente para julgar desempenho.
"""

from __future__ import annotations

import csv
import math
import random
from datetime import date, timedelta
from pathlib import Path

SEMENTE = 20260902
PASTA = Path(__file__).resolve().parent
INICIO = date(2025, 1, 1)

# unidade -> gravidade -> (quantidade, permanência média em dias, coef. de variação)
PERFIL = {
    "Norte": {
        "Baixa": (1470, 3.0, 0.42),
        "Média": (462, 6.0, 0.42),
        "Alta": (168, 11.0, 0.42),
    },
    "Sul": {
        "Baixa": (600, 2.6, 0.42),
        "Média": (840, 5.6, 0.42),
        "Alta": (960, 10.4, 0.42),
    },
    "Leste": {
        "Baixa": (962, 1.35, 0.30),
        "Alta": (338, 12.6, 0.38),
    },
    "Oeste": {
        "Baixa": (30, 2.1, 0.55),
        "Alta": (8, 8.5, 0.75),
    },
}

# probabilidade de reinternação em 30 dias por unidade e gravidade
REINTERNACAO = {
    "Norte": {"Baixa": 0.16, "Média": 0.20, "Alta": 0.26},
    "Sul": {"Baixa": 0.06, "Média": 0.09, "Alta": 0.12},
    "Leste": {"Baixa": 0.11, "Média": 0.14, "Alta": 0.19},
    "Oeste": {"Baixa": 0.10, "Média": 0.13, "Alta": 0.17},
}

LINHAS = {
    "Baixa": ["Clínica Médica", "Ortopedia", "Clínica Médica", "Cardiologia"],
    "Média": ["Cardiologia", "Clínica Médica", "Ortopedia"],
    "Alta": ["Oncologia", "Cardiologia", "Oncologia"],
}

FATOR_CUSTO = {"Baixa": 1.0, "Média": 2.2, "Alta": 4.5}
DIARIA = 1_820.0
CUSTO_FIXO = 4_150.0


def lognormal(media: float, cv: float, rng: random.Random) -> float:
    """Amostra positiva com média e coeficiente de variação especificados."""
    sigma = math.sqrt(math.log(1 + cv**2))
    mu = math.log(media) - sigma**2 / 2
    return rng.lognormvariate(mu, sigma)


def gerar_registros(rng: random.Random) -> list[dict[str, object]]:
    registros: list[dict[str, object]] = []
    for unidade, estratos in PERFIL.items():
        for gravidade, (quantidade, media, cv) in estratos.items():
            for _ in range(quantidade):
                dias = max(1, round(lognormal(media, cv, rng)))
                fator = FATOR_CUSTO[gravidade]
                custo = (DIARIA * dias + CUSTO_FIXO * fator) * lognormal(1.0, 0.14, rng)
                admissao = INICIO + timedelta(days=rng.randrange(0, 365))
                registros.append(
                    {
                        "unidade": unidade,
                        "linha_cuidado": rng.choice(LINHAS[gravidade]),
                        "gravidade": gravidade,
                        "data_admissao": admissao,
                        "data_alta": admissao + timedelta(days=dias),
                        "dias_internacao": dias,
                        "custo_total": round(custo, 2),
                        "reinternacao_30d": int(rng.random() < REINTERNACAO[unidade][gravidade]),
                    }
                )
    rng.shuffle(registros)
    for posicao, registro in enumerate(registros, start=1):
        registro["atendimento_id"] = f"VITA-{posicao:05d}"
    return registros


def escrever(caminho: Path, colunas: list[str], linhas: list[dict[str, object]]) -> None:
    with caminho.open("w", newline="", encoding="utf-8") as stream:
        escritor = csv.DictWriter(stream, fieldnames=colunas, extrasaction="ignore")
        escritor.writeheader()
        for linha in linhas:
            escritor.writerow({coluna: linha[coluna] for coluna in colunas})


def painel_mensal(registros: list[dict[str, object]]) -> list[dict[str, object]]:
    """Recorte do Grupo A: apenas totais e médias por unidade e mês."""
    agrupado: dict[tuple[str, str], list[dict[str, object]]] = {}
    for registro in registros:
        chave = (registro["unidade"], registro["data_alta"].strftime("%Y-%m"))
        agrupado.setdefault(chave, []).append(registro)

    painel = []
    for (unidade, mes), grupo in sorted(agrupado.items()):
        dias = [r["dias_internacao"] for r in grupo]
        custos = [r["custo_total"] for r in grupo]
        painel.append(
            {
                "unidade": unidade,
                "mes": mes,
                "altas": len(grupo),
                "media_dias_internacao": round(sum(dias) / len(dias), 2),
                "custo_medio": round(sum(custos) / len(custos), 2),
            }
        )
    return painel


def main() -> None:
    rng = random.Random(SEMENTE)
    registros = gerar_registros(rng)

    completo = [
        "atendimento_id", "unidade", "linha_cuidado", "gravidade",
        "data_admissao", "data_alta", "dias_internacao", "custo_total",
        "reinternacao_30d",
    ]
    escrever(PASTA / "rede_vita_internacoes.csv", completo, registros)

    escrever(
        PASTA / "grupo_a_painel_operacoes.csv",
        ["unidade", "mes", "altas", "media_dias_internacao", "custo_medio"],
        painel_mensal(registros),
    )
    escrever(
        PASTA / "grupo_b_registros_clinicos.csv",
        ["atendimento_id", "unidade", "linha_cuidado", "gravidade", "dias_internacao", "custo_total"],
        [r for r in registros if r["unidade"] in {"Norte", "Sul"}],
    )
    escrever(
        PASTA / "grupo_c_registros_risco.csv",
        ["atendimento_id", "unidade", "dias_internacao", "custo_total", "reinternacao_30d"],
        [r for r in registros if r["unidade"] in {"Norte", "Leste", "Oeste"}],
    )


if __name__ == "__main__":
    main()
