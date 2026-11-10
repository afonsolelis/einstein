"""Referência da aula 15: auditoria de contas a pagar com regras, Benford e
Isolation Forest.

Execute a partir da raiz do repositório:

    python materiais/aula-15/referencia/auditoria_referencia.py

O script reproduz os números de conferência do material. Ele serve para comparar
com o notebook construído em aula e não substitui a leitura do código gerado
pelo agente.
"""

import hashlib
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import chisquare
from sklearn.ensemble import IsolationForest

DADOS = Path(__file__).resolve().parents[1] / "dados"
CONTAS = DADOS / "contas_a_pagar.csv"
FORNECEDORES = DADOS / "fornecedores.csv"

ALCADA = 10_000.00
FERIADOS_2025 = pd.to_datetime([
    "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21",
    "2025-05-01", "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02",
    "2025-11-15", "2025-11-20", "2025-12-25",
])
PESOS = {
    "duplicidade": 3, "fracionamento": 3, "sem_cadastro": 3,
    "fornecedor_fora_benford": 2, "dia_nao_util": 2, "redondo_concentrado": 2,
    "anomalia_isolation": 1,
}
CORTE_FILA = 2


def sha256(caminho):
    return hashlib.sha256(caminho.read_bytes()).hexdigest()


# 0. Cadeia de custódia: assinatura da entrada antes de qualquer leitura
hash_inicial = sha256(CONTAS)
print("SHA-256 da entrada:", hash_inicial)

bruta = pd.read_csv(CONTAS, parse_dates=["data_pagamento"], dtype={"fornecedor_id": "string"})
cadastro = pd.read_csv(FORNECEDORES)
print("linhas:", len(bruta), "| fornecedores no cadastro:", len(cadastro))
print("pagamento_id duplicado:", int(bruta["pagamento_id"].duplicated().sum()))
print("estornos:", int((bruta["tipo"] == "estorno").sum()))

# 1. Limpeza orientada ao negócio
base = bruta.copy()
sem_cadastro_antes = int((~base["fornecedor_id"].isin(cadastro["fornecedor_id"])).sum())
base["fornecedor_id"] = base["fornecedor_id"].str.strip().str.upper()
normalizados = int((base["fornecedor_id"] != bruta["fornecedor_id"]).sum())
print("códigos de fornecedor normalizados:", normalizados)
print("sem cadastro antes da normalização:", sem_cadastro_antes)

pagamentos = base[base["tipo"] == "pagamento"].copy()
print("pagamentos analisados (sem estornos):", len(pagamentos))
print("valor total pago: R$", f"{pagamentos['valor'].sum():,.2f}")
print("pagamentos acima da alçada:", int((pagamentos["valor"] >= ALCADA).sum()))

# 2. Testes de regra
chave = ["fornecedor_id", "nota_fiscal", "valor"]
pagamentos["duplicidade"] = pagamentos.duplicated(chave, keep="first")
ingenua = pagamentos.duplicated(["fornecedor_id", "valor"], keep="first")
print("duplicidade pela regra ingênua (fornecedor + valor):", int(ingenua.sum()))
print("duplicidade pela regra com nota fiscal:", int(pagamentos["duplicidade"].sum()))

faixa = pagamentos[(pagamentos["valor"] >= 9_000) & (pagamentos["valor"] < ALCADA)]
pagamentos["fracionamento"] = False
for _, grupo in faixa.groupby(["fornecedor_id", "solicitante"]):
    dia = grupo["data_pagamento"].dt.dayofyear.to_numpy()
    valor = grupo["valor"].to_numpy()
    for i, d in zip(grupo.index, dia):
        vizinhos = np.abs(dia - d) <= 6   # pagamentos a até 6 dias deste
        if vizinhos.sum() >= 2 and valor[vizinhos].sum() >= ALCADA:
            pagamentos.loc[i, "fracionamento"] = True
print("pagamentos em fracionamento:", int(pagamentos["fracionamento"].sum()))
print("pagamentos na faixa de R$ 9.000 a R$ 9.999,99:", len(faixa))

pagamentos["sem_cadastro"] = ~pagamentos["fornecedor_id"].isin(cadastro["fornecedor_id"])
print("sem cadastro após normalização:", int(pagamentos["sem_cadastro"].sum()),
      sorted(pagamentos.loc[pagamentos["sem_cadastro"], "fornecedor_id"].unique()))

data = pagamentos["data_pagamento"]
pagamentos["dia_nao_util"] = (data.dt.dayofweek >= 5) | data.isin(FERIADOS_2025)
print("pagamentos em fim de semana ou feriado:", int(pagamentos["dia_nao_util"].sum()))

pagamentos["valor_redondo"] = (pagamentos["valor"] >= 1_000) & (pagamentos["valor"] % 100 == 0)
print("valores redondos:", int(pagamentos["valor_redondo"].sum()))
proporcao = pagamentos.groupby("fornecedor_id")["valor_redondo"].agg(["mean", "size"])
concentrados = proporcao[(proporcao["mean"] >= 0.30) & (proporcao["size"] >= 10)].index.tolist()
print(proporcao.sort_values("mean", ascending=False).head(4).round(3).to_string())
print("fornecedores com 30% ou mais de valores redondos:", concentrados)
pagamentos["redondo_concentrado"] = pagamentos["valor_redondo"] & pagamentos["fornecedor_id"].isin(concentrados)

# 3. Lei de Benford no primeiro dígito
benford = np.log10(1 + 1 / np.arange(1, 10))
populacao = pagamentos[pagamentos["valor"] >= 10].copy()
populacao["digito"] = populacao["valor"].astype(str).str.lstrip("0.").str[0].astype(int)
print("população de Benford (valor >= R$ 10):", len(populacao))


def mad(digitos):
    observada = digitos.value_counts(normalize=True).reindex(range(1, 10), fill_value=0)
    return float(np.mean(np.abs(observada.values - benford)))


def qui_quadrado(digitos):
    observada = digitos.value_counts().reindex(range(1, 10), fill_value=0)
    return chisquare(observada.values, benford * len(digitos))


global_mad = mad(populacao["digito"])
global_chi = qui_quadrado(populacao["digito"])
print("MAD global:", round(global_mad, 4), "| qui-quadrado:", round(global_chi.statistic, 1),
      "| p:", round(global_chi.pvalue, 4))
print("proporção observada do dígito 1:",
      round(float((populacao["digito"] == 1).mean()), 3), "| esperada:", round(benford[0], 3))

por_fornecedor = []
for fornecedor, grupo in populacao.groupby("fornecedor_id"):
    if len(grupo) >= 50:
        teste = qui_quadrado(grupo["digito"])
        por_fornecedor.append({
            "fornecedor_id": fornecedor, "pagamentos": len(grupo),
            "mad": round(mad(grupo["digito"]), 4),
            "qui_quadrado": round(teste.statistic, 1), "p_valor": teste.pvalue,
        })
por_fornecedor = pd.DataFrame(por_fornecedor).sort_values("mad", ascending=False)
print("fornecedores com 50 ou mais pagamentos:", len(por_fornecedor))
print(por_fornecedor.head(5).to_string(index=False))
# Com 50 a 70 pagamentos, o MAD oscila demais; por fornecedor usa-se o
# qui-quadrado com limiar rigoroso, porque são 24 testes simultâneos.
fora = por_fornecedor[por_fornecedor["p_valor"] < 0.001]["fornecedor_id"].tolist()
print("fornecedores com MAD acima de 0,015:", int((por_fornecedor["mad"] > 0.015).sum()))
print("fornecedores com p-valor abaixo de 0,001:", fora)
pagamentos["fornecedor_fora_benford"] = pagamentos["fornecedor_id"].isin(fora)

# 4. Isolation Forest como triagem complementar
pagamentos["mes"] = data.dt.month
atributos = pd.DataFrame({
    "log_valor": np.log10(pagamentos["valor"]),
    "dia_semana": data.dt.dayofweek,
    "pagamentos_fornecedor_mes": pagamentos.groupby(["fornecedor_id", "mes"])["valor"].transform("size"),
})
floresta = IsolationForest(contamination=0.01, random_state=42).fit(atributos)
pagamentos["anomalia_isolation"] = floresta.predict(atributos) == -1
regras = ["duplicidade", "fracionamento", "sem_cadastro", "dia_nao_util", "valor_redondo", "fornecedor_fora_benford"]
so_floresta = pagamentos["anomalia_isolation"] & ~pagamentos[regras].any(axis=1)
print("anomalias do Isolation Forest:", int(pagamentos["anomalia_isolation"].sum()),
      "| sem nenhuma regra disparada:", int(so_floresta.sum()))

# 5. Matriz de risco e fila priorizada
pagamentos["pontuacao"] = sum(pagamentos[s].astype(int) * p for s, p in PESOS.items())
pagamentos["sinais"] = pagamentos[list(PESOS)].apply(
    lambda linha: ", ".join(s for s in PESOS if linha[s]), axis=1)
print("pagamentos com algum sinal:", int((pagamentos["pontuacao"] > 0).sum()))
print(pagamentos["pontuacao"].value_counts().sort_index().to_string())
fila = (pagamentos[pagamentos["pontuacao"] >= CORTE_FILA]
        .sort_values(["pontuacao", "valor"], ascending=[False, False]))
print("fila de exame (pontuação >= 2):", len(fila),
      "| valor: R$", f"{fila['valor'].sum():,.2f}")
print(fila["sinais"].value_counts().to_string())
print(fila[["pagamento_id", "fornecedor_id", "valor", "pontuacao", "sinais"]].head(10).to_string(index=False))
anomalias = pagamentos[pagamentos["anomalia_isolation"]]
print("anomalias acima de R$ 100.000:", int((anomalias["valor"] >= 100_000).sum()),
      "| abaixo de R$ 100:", int((anomalias["valor"] < 100).sum()))

# 6. Custódia: a entrada não mudou durante a análise
hash_final = sha256(CONTAS)
assert hash_final == hash_inicial
print("entrada inalterada:", hash_final == hash_inicial)
