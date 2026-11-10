"""Referência da aula 16: decisão sobre o próximo centro de distribuição.

Execute a partir da raiz do repositório:

    python materiais/aula-16/referencia/estrategia_referencia.py

O script reproduz os números de conferência do material. A base é a mesma da
aula 13 (materiais/aula-13/dados/olist_pedidos.csv), com as mesmas regras de
limpeza. Pesos, cenários e a redução de frete de 25% são premissas da aula,
e não dados da base.
"""

from pathlib import Path

import numpy as np
import pandas as pd

CSV = Path(__file__).resolve().parents[2] / "aula-13" / "dados" / "olist_pedidos.csv"

# Regras de limpeza da aula 13
INICIO = "2017-01-09"
FIM_EXCLUSIVO = "2018-08-20"
STATUS_FORA = ["canceled", "unavailable"]

# Premissas da aula 16
MINIMO_VENDAS = 1_500
PESOS_BASE = {"volume": 0.5, "frete_medio": 0.3, "crescimento": 0.2}
CENARIOS = {"pessimista": 0.0, "base": 0.2, "otimista": 0.5}
REDUCAO_FRETE = 0.25

bruta = pd.read_csv(CSV, parse_dates=["order_purchase_timestamp"])
data = bruta["order_purchase_timestamp"]
vendas = bruta[
    (data >= INICIO) & (data < FIM_EXCLUSIVO) & ~bruta["order_status"].isin(STATUS_FORA)
].copy()
assert len(vendas) == 96_690
data = vendas["order_purchase_timestamp"]

# 1. Indicadores por estado
estado = vendas.groupby("customer_state").agg(
    pedidos=("order_id", "count"),
    receita=("valor_produtos", "sum"),
    frete_total=("valor_frete", "sum"),
    frete_medio=("valor_frete", "mean"),
)
estado["peso_frete"] = estado["frete_total"] / estado["receita"]
estado["participacao"] = estado["pedidos"] / estado["pedidos"].sum()

# Crescimento no mesmo trecho do calendário: 09/01 a 19/08 de cada ano
p2017 = vendas[(data >= "2017-01-09") & (data < "2017-08-20")].groupby("customer_state").size()
p2018 = vendas[(data >= "2018-01-09") & (data < "2018-08-20")].groupby("customer_state").size()
estado["crescimento"] = p2018 / p2017 - 1

ultimos_12 = vendas[data >= "2017-08-20"]
estado["pedidos_12m"] = ultimos_12.groupby("customer_state").size()
estado["frete_12m"] = ultimos_12.groupby("customer_state")["valor_frete"].sum()
estado = estado.sort_values("pedidos", ascending=False)

print("estados:", len(estado))
print(estado[["pedidos", "receita", "frete_medio", "peso_frete", "participacao", "crescimento"]]
      .head(10).round(3).to_string())
print("participação de SP:", round(100 * estado.loc["SP", "participacao"], 1), "%")
print("frete médio geral:", round(vendas["valor_frete"].mean(), 2))
print("crescimento geral:", round(100 * (p2018.sum() / p2017.sum() - 1), 1), "%")

# 2. Candidatos: fora de SP e com pelo menos 1.500 vendas na janela
candidatos = estado[(estado.index != "SP") & (estado["pedidos"] >= MINIMO_VENDAS)].copy()
print("candidatos:", len(candidatos), sorted(candidatos.index))

# 3. Matriz de decisão com critérios normalizados de 0 a 1
criterios = candidatos[["pedidos", "frete_medio", "crescimento"]].rename(columns={"pedidos": "volume"})
normalizado = (criterios - criterios.min()) / (criterios.max() - criterios.min())


def pontuar(pesos):
    return sum(normalizado[c] * p for c, p in pesos.items()).sort_values(ascending=False)


ranking = pontuar(PESOS_BASE)
print("ranking com pesos base:")
print(ranking.round(3).to_string())

# 4. Sensibilidade: um peso varia de 0 a 1, os outros mantêm a proporção entre si
for criterio in PESOS_BASE:
    outros = {c: p for c, p in PESOS_BASE.items() if c != criterio}
    soma = sum(outros.values())
    anterior = None
    for w in np.arange(0, 1.00001, 0.001):
        pesos = {criterio: w, **{c: (1 - w) * p / soma for c, p in outros.items()}}
        primeiro = pontuar(pesos).index[0]
        if primeiro != anterior:
            print(f"peso de {criterio} = {w:.3f}: lidera {primeiro}")
            anterior = primeiro

# 5. Cenários para os dois primeiros colocados
for uf in ranking.index[:2]:
    for nome, taxa in CENARIOS.items():
        pedidos = candidatos.loc[uf, "pedidos_12m"] * (1 + taxa)
        frete = candidatos.loc[uf, "frete_12m"] * (1 + taxa)
        teto = frete * REDUCAO_FRETE
        print(f"{uf} {nome}: {pedidos:,.0f} pedidos/ano, frete R$ {frete:,.0f}, "
              f"teto de custo anual do CD R$ {teto:,.0f}")
