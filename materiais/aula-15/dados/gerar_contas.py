"""Gera a base sintética de contas a pagar da aula 15.

Rede hospitalar fictícia, ano de 2025. Os pagamentos legítimos seguem uma
distribuição log-normal ampla, aderente à Lei de Benford. Sobre essa base são
plantadas irregularidades em quantidades conhecidas, além de ruídos inocentes
que disparam regras sem configurar irregularidade.

Execute a partir da raiz do repositório:

    python materiais/aula-15/dados/gerar_contas.py

A semente é fixa; a execução reproduz os mesmos arquivos byte a byte.
"""

from pathlib import Path

import numpy as np
import pandas as pd

SEMENTE = 20251125
PASTA = Path(__file__).resolve().parent
rng = np.random.default_rng(SEMENTE)

FERIADOS_2025 = pd.to_datetime([
    "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21",
    "2025-05-01", "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02",
    "2025-11-15", "2025-11-20", "2025-12-25",
])
dias = pd.date_range("2025-01-01", "2025-12-31", freq="D")
dias_uteis = dias[(dias.dayofweek < 5) & ~dias.isin(FERIADOS_2025)]
dias_nao_uteis = dias[(dias.dayofweek >= 5) | dias.isin(FERIADOS_2025)]


def sorteia(calendario):
    return calendario[int(rng.integers(len(calendario)))]

CATEGORIAS = [
    "Materiais médicos", "Medicamentos", "Serviços de limpeza", "Manutenção predial",
    "Equipamentos", "Nutrição", "Tecnologia", "Consultoria", "Laboratório", "Lavanderia",
]

# ---------------------------------------------------------------- cadastro
N_FORN = 120
fornecedores = pd.DataFrame({
    "fornecedor_id": [f"F{i:03d}" for i in range(1, N_FORN + 1)],
    "nome": [f"Fornecedor {i:03d} Ltda" for i in range(1, N_FORN + 1)],
    "categoria": rng.choice(CATEGORIAS, N_FORN),
    "data_cadastro": pd.to_datetime("2019-01-01")
    + pd.to_timedelta(rng.integers(0, 2000, N_FORN), unit="D"),
})
fornecedores.loc[fornecedores["fornecedor_id"] == "F077", "categoria"] = "Consultoria"
fornecedores.loc[fornecedores["fornecedor_id"] == "F045", "categoria"] = "Manutenção predial"

SOLICITANTES = [f"S{i:02d}" for i in range(1, 26)]
linhas = []
nota_seq = iter(range(100000, 999999))


def pagamento(data, fornecedor, valor, solicitante=None, nota=None, origem="legitimo"):
    linhas.append({
        "data_pagamento": pd.Timestamp(data),
        "fornecedor_id": fornecedor,
        "nota_fiscal": nota if nota is not None else f"NF-{next(nota_seq)}",
        "valor": round(float(valor), 2),
        "solicitante": solicitante or SOLICITANTES[int(rng.integers(len(SOLICITANTES)))],
        "origem": origem,
    })


# --------------------------------------------------------- base legítima
comuns = [f for f in fornecedores["fornecedor_id"] if f not in ("F077", "F045")]
pesos = 1 / np.arange(1, len(comuns) + 1) ** 0.8
pesos /= pesos.sum()
for _ in range(5200):
    pagamento(
        sorteia(dias_uteis),
        rng.choice(comuns, p=pesos),
        np.exp(rng.normal(7.6, 1.7)) + 5,
    )

# Ruído inocente: três contratos mensais com parcelas iguais e notas distintas
for fornecedor, valor, solicitante in [("F012", 18500.00, "S03"), ("F031", 12000.00, "S07"), ("F058", 4750.00, "S11")]:
    for mes in range(1, 13):
        dia = dias_uteis[dias_uteis.month == mes][4]
        pagamento(dia, fornecedor, valor, solicitante, origem="contrato_mensal")

# Estornos legítimos (valores negativos)
for _ in range(32):
    pagamento(sorteia(dias_uteis), rng.choice(comuns), -(np.exp(rng.normal(6.5, 1.0)) + 5), origem="estorno")

# ------------------------------------------------------- irregularidades
# 1. Pagamentos duplicados: mesma nota, mesmo fornecedor e valor, 1 a 5 dias depois
base_legit = [l for l in linhas if l["origem"] == "legitimo"]
escolhidos = rng.choice(len(base_legit), 18, replace=False)
for i in escolhidos:
    original = base_legit[i]
    posicao = dias_uteis.get_loc(original["data_pagamento"])
    nova_data = dias_uteis[min(posicao + int(rng.integers(1, 6)), len(dias_uteis) - 1)]
    pagamento(nova_data, original["fornecedor_id"], original["valor"],
              original["solicitante"], original["nota_fiscal"], origem="duplicado")

# 2. Fracionamento: 5 episódios de 3 pagamentos entre R$ 9.000 e R$ 9.999 na mesma semana
for fornecedor, solicitante in [("F023", "S14"), ("F023", "S14"), ("F066", "S19"), ("F066", "S19"), ("F089", "S14")]:
    inicio = sorteia(dias_uteis[:-10])
    semana = dias_uteis[dias_uteis >= inicio][:3]
    for d in semana:
        pagamento(d, fornecedor, rng.uniform(9000, 9990), solicitante, origem="fracionamento")

# 3. Fornecedores sem cadastro: 14 pagamentos
for fornecedor, n in [("F901", 9), ("F902", 5)]:
    for _ in range(n):
        pagamento(sorteia(dias_uteis), fornecedor, np.exp(rng.normal(8.6, 0.6)), origem="sem_cadastro")

# 4. Pagamentos em fim de semana ou feriado: 25
for _ in range(25):
    pagamento(sorteia(dias_nao_uteis), rng.choice(comuns), np.exp(rng.normal(8.0, 1.2)), origem="dia_nao_util")

# 5. Valores redondos excessivos: F045 com 40 pagamentos múltiplos de R$ 500
for _ in range(40):
    pagamento(sorteia(dias_uteis), "F045", 500 * rng.integers(2, 19), origem="valor_redondo")

# 6. Fornecedor fora de Benford: F077 com 60 pagamentos uniformes entre R$ 4.000 e R$ 9.990
for _ in range(60):
    pagamento(sorteia(dias_uteis), "F077", rng.uniform(4000, 9990), origem="benford")

# ---------------------------------------------------------- montagem
contas = pd.DataFrame(linhas)
contas["tipo"] = np.where(contas["valor"] < 0, "estorno", "pagamento")

# Defeito de cadastro na exportação: 47 códigos com caixa ou espaços irregulares
legit_idx = contas.index[contas["origem"] == "legitimo"]
sujos = rng.choice(legit_idx, 47, replace=False)
for k, i in enumerate(sujos):
    codigo = contas.at[i, "fornecedor_id"]
    contas.at[i, "fornecedor_id"] = codigo.lower() if k % 2 == 0 else f" {codigo} "

contas = contas.sort_values(["data_pagamento", "nota_fiscal"], kind="stable").reset_index(drop=True)
contas.insert(0, "pagamento_id", [f"P{i:05d}" for i in range(1, len(contas) + 1)])
contas["data_pagamento"] = contas["data_pagamento"].dt.strftime("%Y-%m-%d")
gabarito = contas[["pagamento_id", "origem"]]
contas = contas.drop(columns="origem")
fornecedores["data_cadastro"] = fornecedores["data_cadastro"].dt.strftime("%Y-%m-%d")

contas.to_csv(PASTA / "contas_a_pagar.csv", index=False, lineterminator="\n")
fornecedores.to_csv(PASTA / "fornecedores.csv", index=False, lineterminator="\n")
print("contas:", contas.shape, "| fornecedores:", fornecedores.shape)
print(gabarito["origem"].value_counts().to_string())
