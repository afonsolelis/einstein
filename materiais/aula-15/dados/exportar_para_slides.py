"""Exporta as bases da aula 15 para um arquivo JavaScript lido pelos slides.

Aberto por file://, o navegador não deixa o slide ler o CSV diretamente; por
isso os dois arquivos vão, sem alteração, para dentro de base_slides.js, junto
com os hashes. Reexecute sempre que gerar_contas.py mudar:

    python materiais/aula-15/dados/exportar_para_slides.py
"""

import hashlib
import json
from pathlib import Path

PASTA = Path(__file__).resolve().parent
arquivos = {"contas": "contas_a_pagar.csv", "fornecedores": "fornecedores.csv"}

dados = {}
for chave, nome in arquivos.items():
    conteudo = (PASTA / nome).read_bytes()
    dados[chave] = conteudo.decode("utf-8")
    dados[f"sha256_{chave}"] = hashlib.sha256(conteudo).hexdigest()

js = (
    "// Gerado por exportar_para_slides.py a partir dos CSV desta pasta. Não edite à mão.\n"
    f"window.AULA15_DADOS = {json.dumps(dados, ensure_ascii=False)};\n"
)
(PASTA / "base_slides.js").write_text(js, encoding="utf-8")
print("base_slides.js:", len(js.encode()), "bytes")
