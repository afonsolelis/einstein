"""Gera a base sintética do experimento A/B da aula 14.

Execute a partir da raiz do repositório:

    python materiais/aula-14/dados/gerar_experimento.py

A semente é fixa, de modo que o CSV produzido é sempre o mesmo. Os dados são
fictícios e não descrevem pacientes, usuários nem instituições reais.
"""

from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

SEMENTE = 20261118
SAIDA = Path(__file__).resolve().parent / "experimento_agendamento.csv"

INICIO = date(2026, 3, 2)
DIAS = 14
USUARIOS_EXTERNOS = 10_400
TAXA = {"A": 0.40, "B": 0.43}            # conclusão real por usuário
TEMPO_MEDIANO = {"A": 290.0, "B": 265.0}  # segundos até concluir
USUARIOS_DUAS_VARIANTES = 160
USUARIOS_INTERNOS = 15
LINHAS_DUPLICADAS = 240

rng = np.random.default_rng(SEMENTE)
linhas = []


def sessoes_do_usuario(usuario_id, variantes, interno, taxa, mediana, n_sessoes):
    """Cria as sessões de um usuário; só a última pode concluir o agendamento."""
    primeiro_dia = int(rng.integers(0, DIAS))
    dias = sorted(min(DIAS - 1, primeiro_dia + int(rng.integers(0, 4))) for _ in range(n_sessoes))
    dias[0] = primeiro_dia
    dias.sort()
    dispositivo = "celular" if rng.random() < 0.62 else "computador"
    concluiu_usuario = rng.random() < taxa
    for i, dia in enumerate(dias):
        variante = variantes[i % len(variantes)]
        ultima = i == n_sessoes - 1
        concluiu = bool(concluiu_usuario and ultima)
        tempo = float(np.round(rng.lognormal(np.log(mediana[variante]), 0.45), 0)) if concluiu else np.nan
        linhas.append(
            {
                "usuario_id": usuario_id,
                "data": (INICIO + timedelta(days=int(dia))).isoformat(),
                "variante": variante,
                "dispositivo": dispositivo,
                "usuario_interno": interno,
                "concluiu": int(concluiu),
                "tempo_segundos": tempo,
            }
        )


def n_sessoes_comum():
    return int(rng.choice([1, 2, 3], p=[0.80, 0.15, 0.05]))


# Usuários externos, sorteados 50/50 para A ou B
for k in range(USUARIOS_EXTERNOS):
    variante = "A" if rng.random() < 0.5 else "B"
    sessoes_do_usuario(f"U{k:05d}", [variante], False, TAXA[variante], TEMPO_MEDIANO, n_sessoes_comum())

# Usuários que, por falha de cookie, viram as duas variantes
for k in range(USUARIOS_DUAS_VARIANTES):
    ordem = ["A", "B"] if rng.random() < 0.5 else ["B", "A"]
    taxa = (TAXA["A"] + TAXA["B"]) / 2
    sessoes_do_usuario(f"U{USUARIOS_EXTERNOS + k:05d}", ordem, False, taxa, TEMPO_MEDIANO, int(rng.choice([2, 3, 4])))

# Equipe de TI validando a página nova: muitas sessões, quase sempre em B
mediana_ti = {"A": 70.0, "B": 60.0}
for k in range(USUARIOS_INTERNOS):
    usuario_id = f"T{k:03d}"
    for _ in range(int(rng.integers(30, 51))):
        variante = "B" if rng.random() < 0.9 else "A"
        sessoes_do_usuario(usuario_id, [variante], True, 0.9, mediana_ti, 1)

base = pd.DataFrame(linhas).sample(frac=1, random_state=SEMENTE).reset_index(drop=True)
base.insert(0, "sessao_id", [f"S{i:06d}" for i in range(1, len(base) + 1)])

# Reenvio do log: algumas sessões aparecem duas vezes, idênticas
duplicadas = base.sample(LINHAS_DUPLICADAS, random_state=SEMENTE + 1)
base = pd.concat([base, duplicadas]).sort_values(["data", "sessao_id"], kind="stable")

base["usuario_interno"] = base["usuario_interno"].map({True: "sim", False: "nao"})
base["tempo_segundos"] = base["tempo_segundos"].astype("Int64")
base.to_csv(SAIDA, index=False, lineterminator="\n")
print(f"{len(base)} linhas gravadas em {SAIDA.name}")
