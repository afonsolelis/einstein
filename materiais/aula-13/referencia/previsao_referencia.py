"""Referência da aula 13: limpeza orientada ao negócio e previsão semanal.

Execute a partir da raiz do repositório:

    python materiais/aula-13/referencia/previsao_referencia.py

O script reproduz os números de conferência do material. Ele serve para comparar
com o notebook construído em aula e não substitui a leitura do código gerado
pelo agente.
"""

from pathlib import Path

import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

CSV = Path(__file__).resolve().parents[1] / "dados" / "olist_pedidos.csv"

# Regras de negócio da aula
INICIO = "2017-01-09"          # primeira segunda-feira com operação contínua
FIM_EXCLUSIVO = "2018-08-20"   # a extração perde volume depois de 19/08/2018
STATUS_FORA = ["canceled", "unavailable"]
SEMANAS_TESTE = 12

bruta = pd.read_csv(CSV, parse_dates=["order_purchase_timestamp"])
print("linhas brutas:", len(bruta))
print("order_id duplicado:", int(bruta["order_id"].duplicated().sum()))
print("pedidos sem itens:", int(bruta["itens"].isna().sum()))

# 1. Janela de análise
na_janela = bruta[
    (bruta["order_purchase_timestamp"] >= INICIO)
    & (bruta["order_purchase_timestamp"] < FIM_EXCLUSIVO)
].copy()
print("fora da janela:", len(bruta) - len(na_janela), "| na janela:", len(na_janela))

# 2. Definição de venda
vendas = na_janela[~na_janela["order_status"].isin(STATUS_FORA)].copy()
print("excluídos por status:", len(na_janela) - len(vendas), "| vendas:", len(vendas))

# 3. Pedidos sem itens ficam sinalizados e fora da receita
vendas["sem_itens"] = vendas["itens"].isna()
print("vendas sem itens (sinalizadas):", int(vendas["sem_itens"].sum()))

# 4. Série semanal, de segunda a domingo
semanal = (
    vendas.set_index("order_purchase_timestamp")
    .resample("W-SUN")
    .agg(pedidos=("order_id", "count"), receita=("valor_produtos", "sum"))
)
semanal["semana_black_friday"] = semanal.index == pd.Timestamp("2017-11-26")
assert semanal["pedidos"].sum() == len(vendas)
print("semanas:", len(semanal), "| de", semanal.index.min().date(), "a", semanal.index.max().date())

# 5. Atributos que só usam o passado
dados = semanal[["pedidos"]].copy()
dados["semana_anterior"] = dados["pedidos"].shift(1)
dados["media_4_semanas"] = dados["pedidos"].shift(1).rolling(4).mean()
dados["tendencia"] = range(len(dados))
dados = dados.dropna()

treino, teste = dados.iloc[:-SEMANAS_TESTE], dados.iloc[-SEMANAS_TESTE:]
print("treino:", len(treino), "semanas | teste:", len(teste), "semanas")
print("média de pedidos no teste:", round(teste["pedidos"].mean(), 1))

# 6. Referências simples
mae_ingenuo = mean_absolute_error(teste["pedidos"], teste["semana_anterior"])
mae_media = mean_absolute_error(teste["pedidos"], teste["media_4_semanas"])

# 7. Regressão linear
atributos = ["semana_anterior", "media_4_semanas"]
modelo = LinearRegression().fit(treino[atributos], treino["pedidos"])
previsto = modelo.predict(teste[atributos])
mae_modelo = mean_absolute_error(teste["pedidos"], previsto)

so_tendencia = LinearRegression().fit(treino[["tendencia"]], treino["pedidos"])
mae_tendencia = mean_absolute_error(teste["pedidos"], so_tendencia.predict(teste[["tendencia"]]))

# 8. Contraexemplo: separação aleatória mistura passado e futuro
X_tr, X_te, y_tr, y_te = train_test_split(
    dados[atributos], dados["pedidos"], test_size=SEMANAS_TESTE, random_state=42
)
mae_aleatorio = mean_absolute_error(y_te, LinearRegression().fit(X_tr, y_tr).predict(X_te))

print("MAE previsão ingênua:", round(mae_ingenuo, 1))
print("MAE média de 4 semanas:", round(mae_media, 1))
print("MAE regressão linear:", round(mae_modelo, 1))
print("MAE só tendência:", round(mae_tendencia, 1))
print("MAE com separação aleatória (ilusório):", round(mae_aleatorio, 1))
print("erro relativo do modelo:", round(100 * mae_modelo / teste["pedidos"].mean(), 1), "%")

comparacao = teste[["pedidos"]].assign(previsto=previsto.round(0), erro=(teste["pedidos"] - previsto).round(0))
print(comparacao.to_string())

# 9. Previsão da semana seguinte, com faixa baseada no erro medido
proxima = pd.DataFrame(
    {
        "semana_anterior": [semanal["pedidos"].iloc[-1]],
        "media_4_semanas": [semanal["pedidos"].iloc[-4:].mean()],
    }
)
ponto = float(modelo.predict(proxima)[0])
print("previsão para a semana de 20 a 26/08/2018:", round(ponto), "pedidos")
print("faixa (± MAE):", round(ponto - mae_modelo), "a", round(ponto + mae_modelo))
