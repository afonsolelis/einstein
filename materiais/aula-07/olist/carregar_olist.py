"""Carrega os três Excels do Olist no schema bruto do seu Postgres no Supabase.

Uso, no terminal do Codespace:
    python carregar_olist.py

A string de conexão é pedida sem aparecer na tela. Use a do Session pooler
(Supabase → Connect → Session pooler), que funciona no Codespaces.
"""
import getpass
import io
import os
import sys
from pathlib import Path

import pandas as pd
import psycopg

DADOS = Path(__file__).resolve().parent.parent / "dados"

# Tabela de destino → (arquivo, aba, colunas com tipo). A ordem respeita o Excel.
TABELAS = {
    "customers": ("olist_pedidos_clientes.xlsx", "olist_customers", {
        "customer_id": "text", "customer_unique_id": "text", "customer_zip_code_prefix": "text",
        "customer_city": "text", "customer_state": "text"}),
    "orders": ("olist_pedidos_clientes.xlsx", "olist_orders", {
        "order_id": "text", "customer_id": "text", "order_status": "text",
        "order_purchase_timestamp": "timestamp", "order_approved_at": "timestamp",
        "order_delivered_carrier_date": "timestamp", "order_delivered_customer_date": "timestamp",
        "order_estimated_delivery_date": "timestamp"}),
    "order_items": ("olist_itens_pagamentos_avaliacoes.xlsx", "olist_order_items", {
        "order_id": "text", "order_item_id": "integer", "product_id": "text", "seller_id": "text",
        "shipping_limit_date": "timestamp", "price": "numeric(10,2)", "freight_value": "numeric(10,2)"}),
    "order_payments": ("olist_itens_pagamentos_avaliacoes.xlsx", "olist_order_payments", {
        "order_id": "text", "payment_sequential": "integer", "payment_type": "text",
        "payment_installments": "integer", "payment_value": "numeric(10,2)"}),
    "order_reviews": ("olist_itens_pagamentos_avaliacoes.xlsx", "olist_order_reviews", {
        "review_id": "text", "order_id": "text", "review_score": "integer", "review_comment_title": "text",
        "review_comment_message": "text", "review_creation_date": "timestamp",
        "review_answer_timestamp": "timestamp"}),
    "products": ("olist_catalogo.xlsx", "olist_products", {
        "product_id": "text", "product_category_name": "text", "product_name_lenght": "integer",
        "product_description_lenght": "integer", "product_photos_qty": "integer", "product_weight_g": "integer",
        "product_length_cm": "integer", "product_height_cm": "integer", "product_width_cm": "integer"}),
    "sellers": ("olist_catalogo.xlsx", "olist_sellers", {
        "seller_id": "text", "seller_zip_code_prefix": "text", "seller_city": "text", "seller_state": "text"}),
    # O Excel limita nomes de aba a 31 caracteres: a aba chega como product_category_name_translati.
    "category_translation": ("olist_catalogo.xlsx", "product_category_name_translati", {
        "product_category_name": "text", "product_category_name_english": "text"}),
}


def conexao():
    url = os.environ.get("SUPABASE_DB_URL") or getpass.getpass("Cole a string do Session pooler: ")
    if "[YOUR-PASSWORD]" in url:
        sys.exit("Troque [YOUR-PASSWORD] pela senha do banco antes de colar a string.")
    return psycopg.connect(url.strip())


def main():
    abas = {}
    for arquivo in sorted({arquivo for arquivo, _, _ in TABELAS.values()}):
        print(f"Lendo {arquivo}…", flush=True)
        abas[arquivo] = pd.read_excel(DADOS / arquivo, sheet_name=None, dtype=str)

    with conexao() as con, con.cursor() as cur:
        cur.execute("CREATE SCHEMA IF NOT EXISTS bruto")
        for tabela, (arquivo, aba, colunas) in TABELAS.items():
            df = abas[arquivo][aba][list(colunas)]
            cur.execute(f"DROP TABLE IF EXISTS bruto.{tabela} CASCADE")
            cur.execute(f"CREATE TABLE bruto.{tabela} ("
                        + ", ".join(f"{c} {t}" for c, t in colunas.items()) + ")")
            # CSV em memória + COPY: centenas de milhares de linhas em segundos.
            buffer = io.StringIO()
            df.to_csv(buffer, index=False, header=False)
            buffer.seek(0)
            with cur.copy(f"COPY bruto.{tabela} FROM STDIN WITH (FORMAT csv)") as copy:
                while bloco := buffer.read(1 << 20):
                    copy.write(bloco)
            cur.execute(f"SELECT COUNT(*) FROM bruto.{tabela}")
            print(f"bruto.{tabela}: {cur.fetchone()[0]:,} linhas (Excel: {len(df):,})", flush=True)
    print("Carga concluída. Abra o SQL Editor do Supabase e confira as contagens.")


if __name__ == "__main__":
    main()
