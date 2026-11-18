"""Carga da aula 15 no CrateDB.

Confere o SHA-256 dos CSV, cria as tabelas brutas, insere as linhas sem
nenhuma limpeza e executa sql/deteccao.sql, que cria as views de limpeza e de
detecção usadas pelo Grafana. Usa só a biblioteca padrão e a API HTTP do
CrateDB (POST /_sql), por isso roda tanto no serviço "carga" do Compose quanto
no terminal do Codespace:

    CRATE_URL=http://localhost:4200/_sql python materiais/aula-15/monitoramento/carga/carregar.py

A carga é idempotente: apaga e recria as tabelas a cada execução.
"""

import csv
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

AQUI = Path(__file__).resolve().parent
CRATE_URL = os.environ.get("CRATE_URL", "http://localhost:4200/_sql")
DADOS = Path(os.environ.get("DADOS") or AQUI.parent.parent / "dados")
SQL = Path(os.environ.get("SQL") or AQUI.parent / "sql")

HASHES_ESPERADOS = {
    "contas_a_pagar.csv": "b3898f2daa84095b6d56c1ccb661a2dba6c8736e36807770204be4d8b0d3e9ce",
    "fornecedores.csv": "2a5fede2703f558f2933798055b03f0eb080e84fbcf361b09d640ca7e45918ea",
}
FERIADOS_2025 = [
    "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21",
    "2025-05-01", "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02",
    "2025-11-15", "2025-11-20", "2025-12-25",
]


def sql(stmt, args=None, bulk_args=None):
    corpo = {"stmt": stmt}
    if args is not None:
        corpo["args"] = args
    if bulk_args is not None:
        corpo["bulk_args"] = bulk_args
    pedido = urllib.request.Request(
        CRATE_URL, data=json.dumps(corpo).encode(), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(pedido, timeout=60) as resposta:
            return json.load(resposta)
    except urllib.error.HTTPError as erro:
        sys.exit(f"Erro do CrateDB em:\n{stmt}\n{erro.read().decode()}")


def sha256(caminho):
    return hashlib.sha256(caminho.read_bytes()).hexdigest()


def ler_csv(caminho):
    with caminho.open(newline="", encoding="utf-8") as arquivo:
        return list(csv.DictReader(arquivo))


# 1. Cadeia de custódia: o hash é conferido antes de qualquer leitura
hashes = {}
for nome, esperado in HASHES_ESPERADOS.items():
    if not (DADOS / nome).exists():
        sys.exit(f"{nome} não encontrado em {DADOS}. Na pasta do aluno, crie o .env com DADOS_DIR=../entrada.")
    hashes[nome] = sha256(DADOS / nome)
    situacao = "confere" if hashes[nome] == esperado else "DIVERGE"
    print(f"SHA-256 {nome}: {hashes[nome]} ({situacao})")
    if hashes[nome] != esperado:
        sys.exit("A entrada mudou. Restaure o arquivo original antes de carregar.")

contas = ler_csv(DADOS / "contas_a_pagar.csv")
fornecedores = ler_csv(DADOS / "fornecedores.csv")

# 2. Tabelas brutas, sem limpeza: a normalização acontece nas views
for tabela in ("contas_bruta", "fornecedores", "feriados", "custodia"):
    sql(f"DROP TABLE IF EXISTS doc.{tabela}")
for view in ("v_painel_resumo", "v_fila_exame", "v_sinais", "v_benford_fornecedor", "v_benford_digitos",
             "v_redondo_fornecedor", "v_fracionamento", "v_dia_nao_util", "v_sem_cadastro",
             "v_duplicidade", "v_monitor_diario", "v_serie_diaria", "v_pagamentos"):
    sql(f"DROP VIEW IF EXISTS doc.{view}")

sql("""CREATE TABLE doc.contas_bruta (
    pagamento_id TEXT PRIMARY KEY,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    fornecedor_id TEXT,
    nota_fiscal TEXT,
    valor DOUBLE PRECISION,
    solicitante TEXT,
    tipo TEXT
) WITH (number_of_replicas = 0)""")
sql("""CREATE TABLE doc.fornecedores (
    fornecedor_id TEXT PRIMARY KEY,
    nome TEXT,
    categoria TEXT,
    data_cadastro TIMESTAMP WITH TIME ZONE
) WITH (number_of_replicas = 0)""")
sql("CREATE TABLE doc.feriados (data TIMESTAMP WITH TIME ZONE PRIMARY KEY) WITH (number_of_replicas = 0)")
sql("""CREATE TABLE doc.custodia (
    arquivo TEXT PRIMARY KEY,
    sha256 TEXT,
    linhas INTEGER,
    carregado_em TIMESTAMP WITH TIME ZONE
) WITH (number_of_replicas = 0)""")

sql("INSERT INTO doc.contas_bruta VALUES (?, ?, ?, ?, ?, ?, ?)", bulk_args=[
    [c["pagamento_id"], c["data_pagamento"], c["fornecedor_id"], c["nota_fiscal"],
     float(c["valor"]), c["solicitante"], c["tipo"]] for c in contas])
sql("INSERT INTO doc.fornecedores VALUES (?, ?, ?, ?)", bulk_args=[
    [f["fornecedor_id"], f["nome"], f["categoria"], f["data_cadastro"]] for f in fornecedores])
sql("INSERT INTO doc.feriados VALUES (?)", bulk_args=[[d] for d in FERIADOS_2025])
agora = datetime.now(timezone.utc).isoformat()
sql("INSERT INTO doc.custodia VALUES (?, ?, ?, ?)", bulk_args=[
    ["contas_a_pagar.csv", hashes["contas_a_pagar.csv"], len(contas), agora],
    ["fornecedores.csv", hashes["fornecedores.csv"], len(fornecedores), agora]])
for tabela in ("contas_bruta", "fornecedores", "feriados", "custodia"):
    sql(f"REFRESH TABLE doc.{tabela}")

# 3. Views de limpeza e detecção, na ordem do arquivo
texto = (SQL / "deteccao.sql").read_text(encoding="utf-8")
sem_comentarios = "\n".join(l for l in texto.splitlines() if not l.strip().startswith("--"))
for comando in (c.strip() for c in sem_comentarios.split(";")):
    if comando:
        sql(comando)

# 4. Conferência: os números devem bater com o notebook da aula
print("linhas carregadas:", sql("SELECT count(*) FROM doc.contas_bruta")["rows"][0][0])
for linha in sql("SELECT sinal, pagamentos, valor_total FROM doc.v_painel_resumo ORDER BY valor_total DESC")["rows"]:
    print(f"{linha[0]}: {linha[1]} pagamentos, R$ {linha[2]:,.2f}")
total = sql("SELECT count(*), sum(valor) FROM doc.v_fila_exame")["rows"][0]
print(f"fila de exame: {total[0]} pagamentos, R$ {total[1]:,.2f}")
print("Carga concluída. Abra a porta 3001 na aba PORTS.")
