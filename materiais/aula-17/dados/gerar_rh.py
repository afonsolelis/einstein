"""Gera a base sintética da aula 17: rotatividade da enfermagem em 2025.

Execute a partir da raiz do repositório:

    python materiais/aula-17/dados/gerar_rh.py

A semente é fixa, portanto o arquivo gerado é sempre o mesmo. Nenhum registro
corresponde a pessoa real. As relações e os problemas plantados estão
descritos no README.md desta pasta.
"""

from pathlib import Path

import numpy as np
import pandas as pd

SEMENTE = 2025
N = 3000
SAIDA = Path(__file__).resolve().parent / "rh_enfermagem.csv"

rng = np.random.default_rng(SEMENTE)

unidades = ["Unidade Centro", "Unidade Norte", "Unidade Sul", "Unidade Leste", "Unidade Oeste"]
unidade = rng.choice(unidades, size=N, p=[0.26, 0.20, 0.20, 0.17, 0.17])
cargo = rng.choice(["Técnico de enfermagem", "Enfermeiro"], size=N, p=[0.66, 0.34])
turno = rng.choice(["Diurno", "Noturno", "Administrativo"], size=N, p=[0.50, 0.38, 0.12])
noturno = turno == "Noturno"
leste = unidade == "Unidade Leste"
tecnico = cargo == "Técnico de enfermagem"

tempo_casa = np.clip(rng.gamma(2.0, 22.0, size=N).round(), 1, 360).astype(int)

# Horas extras: maiores no noturno e na unidade com escala desfalcada
horas_extras = rng.gamma(2.2, 4.0, size=N) + 7 * noturno + 5 * leste - 4 * (turno == "Administrativo")
horas_extras = np.clip(horas_extras, 0, 60).round(1)

# Salário em relação à mediana de mercado do cargo
salario = rng.normal(1.0, 0.09, size=N) - 0.04 * tecnico + 0.0005 * np.minimum(tempo_casa, 120)
salario = np.clip(salario, 0.70, 1.35).round(2)

distancia = np.clip(rng.gamma(2.0, 7.0, size=N), 0.5, 80).round(1)

# Avaliação da liderança imediata, de 1 a 5: mais baixa na Unidade Leste
lider = rng.normal(3.8, 0.55, size=N) - 1.0 * leste
lider = np.clip(lider, 1.0, 5.0).round(1)

treinamentos = rng.poisson(2.2, size=N)

# Faltas: efeito do turno noturno e das horas extras, sem efeito próprio na saída
faltas = rng.poisson(1.5 + 2.0 * noturno + 0.06 * horas_extras)

idade = np.clip(rng.normal(36, 9, size=N) + tempo_casa / 40, 19, 66).round().astype(int)
genero = rng.choice(["Feminino", "Masculino", "Não informado"], size=N, p=[0.78, 0.20, 0.02])

# Saída voluntária: horas extras, noturno, salário, liderança e pouco tempo de casa
logit = (
    -2.35
    + 0.075 * (horas_extras - 10)
    + 0.55 * noturno
    - 6.0 * (salario - 1.0)
    - 0.75 * (lider - 3.6)
    - 0.006 * (tempo_casa - 40)
    + 0.012 * (distancia - 14)
    - 0.08 * (treinamentos - 2)
)
voluntario = rng.random(N) < 1 / (1 + np.exp(-logit))

# Desligamentos que não são rotatividade voluntária
idade_aposentadoria = idade >= 54
aposentadoria = (~voluntario) & idade_aposentadoria & (rng.random(N) < 0.60)
fim_contrato = (~voluntario) & (~aposentadoria) & (tempo_casa <= 9) & (rng.random(N) < 0.40)

motivo = np.full(N, "", dtype=object)
motivo[voluntario] = "Pedido de demissão"
motivo[aposentadoria] = "Aposentadoria"
motivo[fim_contrato] = "Fim de contrato temporário"
desligou = (motivo != "").astype(int)

# Admissões de dezembro: tempo de casa zero, ainda sem ciclo observável
admissao_recente = rng.random(N) < 0.035
tempo_casa = np.where(admissao_recente, 0, tempo_casa)
desligou = np.where(admissao_recente, 0, desligou)
motivo = np.where(admissao_recente, "", motivo)

dias = rng.integers(0, 365, size=N)
data_registro = pd.Timestamp("2025-01-01") + pd.to_timedelta(dias, unit="D")
data_registro = np.where(admissao_recente, pd.Timestamp("2025-12-15"), data_registro)

base = pd.DataFrame(
    {
        "id_profissional": [f"P{i:05d}" for i in range(1, N + 1)],
        "data_registro": pd.to_datetime(data_registro).strftime("%Y-%m-%d"),
        "unidade": unidade,
        "cargo": cargo,
        "turno": turno,
        "tempo_casa_meses": tempo_casa,
        "horas_extras_mes": horas_extras,
        "salario_vs_mercado": salario,
        "distancia_km": distancia,
        "avaliacao_lider": lider,
        "treinamentos": treinamentos,
        "faltas": faltas,
        "idade": idade,
        "genero": genero,
        "desligou": desligou,
        "motivo_desligamento": motivo,
    }
)

# Transferências: o registro de origem permanece no sistema, com data anterior
transferidos = base[(base["desligou"] == 0) & (base["tempo_casa_meses"] > 12)].sample(
    n=90, random_state=SEMENTE
)
origem = transferidos.copy()
dia_destino = pd.to_datetime(transferidos["data_registro"]).dt.dayofyear.to_numpy() - 1
dia_origem = np.maximum(dia_destino - 200, 0)
origem["data_registro"] = (
    pd.Timestamp("2025-01-01") + pd.to_timedelta(dia_origem, unit="D")
).strftime("%Y-%m-%d")
outras = {u: [x for x in unidades if x != u] for u in unidades}
origem["unidade"] = [rng.choice(outras[u]) for u in transferidos["unidade"]]

base = pd.concat([base, origem]).sort_values(["id_profissional", "data_registro"])
base.to_csv(SAIDA, index=False, lineterminator="\n")
print(SAIDA, base.shape)
