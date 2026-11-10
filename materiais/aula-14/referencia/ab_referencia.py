"""Referência da aula 14: limpeza orientada ao negócio e teste A/B.

Execute a partir da raiz do repositório:

    python materiais/aula-14/referencia/ab_referencia.py

O script reproduz os números de conferência do material. Ele serve para comparar
com o notebook construído em aula e não substitui a leitura do código gerado
pelo agente.
"""

from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

CSV = Path(__file__).resolve().parents[1] / "dados" / "experimento_agendamento.csv"

# Plano registrado antes de olhar os dados
TAXA_BASE = 0.40   # conclusão histórica da página atual
EFEITO_MINIMO = 0.03  # 3 pontos percentuais
ALFA = 0.05
PODER = 0.80

# 1. Tamanho amostral por grupo, teste bicaudal de duas proporções
p1, p2 = TAXA_BASE, TAXA_BASE + EFEITO_MINIMO
p_media = (p1 + p2) / 2
z_alfa = stats.norm.ppf(1 - ALFA / 2)
z_poder = stats.norm.ppf(PODER)
n_por_grupo = (
    z_alfa * np.sqrt(2 * p_media * (1 - p_media))
    + z_poder * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
) ** 2 / EFEITO_MINIMO**2
n_por_grupo = int(np.ceil(n_por_grupo))
print("usuários necessários por grupo:", n_por_grupo)

# 2. Perfil da base bruta
bruta = pd.read_csv(CSV, parse_dates=["data"])
print("sessões brutas:", len(bruta))
print("linhas duplicadas:", int(bruta.duplicated().sum()))
print("sessões por variante (bruta):", bruta["variante"].value_counts().sort_index().to_dict())
srm_bruta = stats.chisquare(bruta["variante"].value_counts().sort_index())
print("SRM na base bruta, p-valor:", f"{srm_bruta.pvalue:.2g}")

# 3. Regras de limpeza
sem_duplicadas = bruta.drop_duplicates()
print("após remover duplicadas:", len(sem_duplicadas))

internos = sem_duplicadas["usuario_interno"].eq("sim")
print("sessões internas:", int(internos.sum()),
      "| usuários internos:", sem_duplicadas.loc[internos, "usuario_id"].nunique())
externas = sem_duplicadas[~internos]
print("após remover internos:", len(externas))

variantes_por_usuario = externas.groupby("usuario_id")["variante"].nunique()
contaminados = variantes_por_usuario[variantes_por_usuario > 1].index
print("usuários expostos às duas variantes:", len(contaminados),
      "| sessões:", int(externas["usuario_id"].isin(contaminados).sum()))
sessoes = externas[~externas["usuario_id"].isin(contaminados)].copy()
print("sessões válidas:", len(sessoes))

# 4. Uma linha por usuário, a unidade sorteada
usuarios = sessoes.groupby("usuario_id").agg(
    variante=("variante", "first"),
    dispositivo=("dispositivo", "first"),
    primeira_data=("data", "min"),
    sessoes=("sessao_id", "count"),
    concluiu=("concluiu", "max"),
    tempo_segundos=("tempo_segundos", "max"),
)
print("usuários válidos:", len(usuarios))
contagem = usuarios["variante"].value_counts().sort_index()
print("usuários por variante:", contagem.to_dict())
srm = stats.chisquare(contagem)
print("SRM na base limpa, p-valor:", round(srm.pvalue, 3))

# 5. Métrica primária: proporção de usuários que concluíram
tabela = pd.crosstab(usuarios["variante"], usuarios["concluiu"])
taxas = usuarios.groupby("variante")["concluiu"].mean()
diferenca = taxas["B"] - taxas["A"]
qui2, p_qui2, _, _ = stats.chi2_contingency(tabela, correction=False)
n_a, n_b = contagem["A"], contagem["B"]
erro_padrao = np.sqrt(taxas["A"] * (1 - taxas["A"]) / n_a + taxas["B"] * (1 - taxas["B"]) / n_b)
ic = (diferenca - z_alfa * erro_padrao, diferenca + z_alfa * erro_padrao)
print("taxa A:", round(100 * taxas["A"], 1), "% | taxa B:", round(100 * taxas["B"], 1), "%")
print("diferença:", round(100 * diferenca, 1), "p.p. | IC 95%:",
      round(100 * ic[0], 1), "a", round(100 * ic[1], 1), "p.p.")
print("qui-quadrado:", round(qui2, 2), "| p-valor:", f"{p_qui2:.4f}")

# 6. Métrica secundária: tempo até concluir, só entre quem concluiu
tempo_a = usuarios.loc[(usuarios["variante"] == "A") & (usuarios["concluiu"] == 1), "tempo_segundos"]
tempo_b = usuarios.loc[(usuarios["variante"] == "B") & (usuarios["concluiu"] == 1), "tempo_segundos"]
welch = stats.ttest_ind(tempo_b, tempo_a, equal_var=False)
print("tempo médio A:", round(tempo_a.mean(), 1), "s | B:", round(tempo_b.mean(), 1), "s",
      "| diferença:", round(tempo_b.mean() - tempo_a.mean(), 1), "s")
print("Welch t:", round(welch.statistic, 2), "| p-valor:", f"{welch.pvalue:.2g}")

# 7. O efeito da limpeza: mesma análise na base bruta, por sessão
bruta_taxas = bruta.groupby("variante")["concluiu"].mean()
print("base bruta por sessão, taxa A:", round(100 * bruta_taxas["A"], 1),
      "% | B:", round(100 * bruta_taxas["B"], 1), "% | diferença:",
      round(100 * (bruta_taxas["B"] - bruta_taxas["A"]), 1), "p.p.")

# 8. Leitura diária acumulada do p-valor (peeking)
dias = sorted(usuarios["primeira_data"].unique())
diario = []
for dia in dias:
    ate = usuarios[usuarios["primeira_data"] <= dia]
    t = pd.crosstab(ate["variante"], ate["concluiu"])
    diario.append({"dia": pd.Timestamp(dia).date(), "usuarios": len(ate),
                   "p_valor": stats.chi2_contingency(t, correction=False)[1]})
diario = pd.DataFrame(diario)
print(diario.assign(p_valor=diario["p_valor"].round(3)).to_string(index=False))

# 9. Simulação A/A: as duas variantes iguais, olhando o p-valor todo dia
rng = np.random.default_rng(14)
SIMULACOES = 2_000
por_dia = len(usuarios) / len(dias) / 2
acumulado = np.zeros((SIMULACOES, 2, 2))
falso_positivo_diario = np.zeros(SIMULACOES, dtype=bool)
falso_positivo_final = np.zeros(SIMULACOES, dtype=bool)
n_dia = int(round(por_dia))
for d in range(len(dias)):
    conv = rng.binomial(n_dia, TAXA_BASE, size=(SIMULACOES, 2))
    acumulado[:, :, 0] += conv
    acumulado[:, :, 1] += n_dia
    pa = acumulado[:, 0, 0] / acumulado[:, 0, 1]
    pb = acumulado[:, 1, 0] / acumulado[:, 1, 1]
    pm = (acumulado[:, 0, 0] + acumulado[:, 1, 0]) / (acumulado[:, 0, 1] + acumulado[:, 1, 1])
    z = (pb - pa) / np.sqrt(pm * (1 - pm) * (1 / acumulado[:, 0, 1] + 1 / acumulado[:, 1, 1]))
    significativo = 2 * stats.norm.sf(np.abs(z)) < ALFA
    falso_positivo_diario |= significativo
    if d == len(dias) - 1:
        falso_positivo_final = significativo
print("A/A, falso positivo olhando só no fim:", round(100 * falso_positivo_final.mean(), 1), "%")
print("A/A, falso positivo olhando todo dia:", round(100 * falso_positivo_diario.mean(), 1), "%")
