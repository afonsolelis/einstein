"""Referência da aula 17: rotatividade voluntária da enfermagem.

Execute a partir da raiz do repositório:

    python materiais/aula-17/referencia/rh_referencia.py

O script reproduz os números de conferência do material. Ele serve para comparar
com o notebook construído em aula e não substitui a leitura do código gerado
pelo agente.
"""

from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

CSV = Path(__file__).resolve().parents[1] / "dados" / "rh_enfermagem.csv"
MOTIVOS_FORA = ["Aposentadoria", "Fim de contrato temporário"]

bruta = pd.read_csv(CSV, parse_dates=["data_registro"])
print("linhas brutas:", len(bruta))
print("id_profissional duplicado:", int(bruta["id_profissional"].duplicated().sum()))
print("motivos:", bruta["motivo_desligamento"].value_counts().to_dict())

# 1. Transferências: fica o registro mais recente de cada profissional
base = (
    bruta.sort_values(["id_profissional", "data_registro"])
    .drop_duplicates("id_profissional", keep="last")
    .copy()
)
print("após transferências:", len(base))

# 2. Admissões do mês corrente: sem ciclo observável
antes = len(base)
base = base[base["tempo_casa_meses"] > 0].copy()
print("admissões recentes fora:", antes - len(base), "| restam:", len(base))

# 3. Desligamentos que não são rotatividade voluntária
antes = len(base)
base = base[~base["motivo_desligamento"].isin(MOTIVOS_FORA)].copy()
print("desligamentos não voluntários fora:", antes - len(base), "| restam:", len(base))

base["saida_voluntaria"] = (base["motivo_desligamento"] == "Pedido de demissão").astype(int)
taxa = base["saida_voluntaria"].mean()
print("saídas voluntárias:", int(base["saida_voluntaria"].sum()), "| taxa:", round(100 * taxa, 1), "%")

# 4. Taxas por segmento
base["faixa_horas_extras"] = pd.cut(
    base["horas_extras_mes"], [-1, 10, 20, 100], labels=["até 10 h", "10 a 20 h", "acima de 20 h"]
)
base["faixa_salario"] = pd.cut(
    base["salario_vs_mercado"], [0, 0.9, 1.0, 2], labels=["abaixo de 90%", "90% a 100%", "acima de 100%"]
)
base["faixa_faltas"] = pd.cut(base["faltas"], [-1, 1, 3, 100], labels=["0 a 1", "2 a 3", "4 ou mais"])
for coluna in ["turno", "unidade", "faixa_horas_extras", "faixa_salario", "faixa_faltas"]:
    tabela = base.groupby(coluna, observed=True)["saida_voluntaria"].agg(["size", "mean"])
    tabela["mean"] = (100 * tabela["mean"]).round(1)
    print(tabela.rename(columns={"size": "profissionais", "mean": "taxa_%"}).to_string(), "\n")

# 5. Armadilha: faltas dentro de cada turno
dentro = (
    base.groupby(["turno", "faixa_faltas"], observed=True)["saida_voluntaria"].mean().mul(100).round(1)
)
print("taxa por turno e faltas (%):\n", dentro.unstack().to_string(), "\n")

# 6. Regressão logística sem idade nem gênero
numericas = [
    "horas_extras_mes", "salario_vs_mercado", "avaliacao_lider", "tempo_casa_meses",
    "distancia_km", "treinamentos", "faltas",
]
categoricas = ["turno", "cargo", "unidade"]
X = base[numericas + categoricas]
y = base["saida_voluntaria"]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, stratify=y, random_state=42)

modelo = Pipeline([
    ("prep", ColumnTransformer([
        ("num", StandardScaler(), numericas),
        ("cat", OneHotEncoder(drop="first"), categoricas),
    ])),
    ("logit", LogisticRegression(max_iter=1000)),
])
modelo.fit(X_tr, y_tr)
prob = modelo.predict_proba(X_te)[:, 1]
pred = (prob >= 0.5).astype(int)

print("treino:", len(X_tr), "| teste:", len(X_te), "| saídas no teste:", int(y_te.sum()))
print("acurácia da taxa base (ninguém sai):", round(100 * (1 - y_te.mean()), 1), "%")
print("acurácia do modelo:", round(100 * accuracy_score(y_te, pred), 1), "%")
print("matriz de confusão [[VN, FP], [FN, VP]]:", confusion_matrix(y_te, pred).tolist())
print("saídas identificadas (recall):", round(100 * recall_score(y_te, pred), 1), "%")
print("AUC:", round(roc_auc_score(y_te, prob), 3))

nomes = modelo.named_steps["prep"].get_feature_names_out()
coef = pd.Series(modelo.named_steps["logit"].coef_[0], index=nomes).round(2)
print("coeficientes (padronizados):\n", coef.sort_values(ascending=False).to_string(), "\n")

# 7. Disparidade por gênero: o modelo não usa gênero, mas pode reproduzir diferenças
teste = base.loc[X_te.index, ["genero"]].assign(real=y_te, previsto=prob)
disp = teste.groupby("genero").agg(profissionais=("real", "size"), taxa_real=("real", "mean"), prob_media=("previsto", "mean"))
print("disparidade por gênero no teste (%):\n", (disp.assign(taxa_real=100 * disp["taxa_real"], prob_media=100 * disp["prob_media"]).round(1)).to_string(), "\n")

# 8. Segmentos para ação
base["segmento"] = base["turno"] + " · " + base["faixa_horas_extras"].astype(str)
seg = base.groupby("segmento").agg(profissionais=("saida_voluntaria", "size"), saidas=("saida_voluntaria", "sum"))
seg["taxa_%"] = (100 * seg["saidas"] / seg["profissionais"]).round(1)
print(seg.sort_values("saidas", ascending=False).head(5).to_string(), "\n")

leste = base[base["unidade"] == "Unidade Leste"]
print("avaliação média da liderança: Leste", round(leste["avaliacao_lider"].mean(), 2),
      "| demais", round(base.loc[base["unidade"] != "Unidade Leste", "avaliacao_lider"].mean(), 2))
