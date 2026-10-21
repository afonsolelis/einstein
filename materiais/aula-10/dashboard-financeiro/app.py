"""Dashboard financeiro de referência · Aula 10.

Lê cotações da API pública do Yahoo Finance (biblioteca yfinance) e monta um
painel interativo em Streamlit para o comitê financeiro de um grupo hospitalar
comparar empresas de saúde listadas na B3 com o Ibovespa.

Execução no Codespace:
    streamlit run materiais/aula-10/dashboard-financeiro/app.py
Depois, abra a porta 8501 pela aba PORTS.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
import yfinance as yf

EMPRESAS = {
    "RDOR3.SA": "Rede D'Or",
    "HAPV3.SA": "Hapvida",
    "FLRY3.SA": "Fleury",
    "RADL3.SA": "Raia Drogasil",
    "ODPV3.SA": "Odontoprev",
    "HYPE3.SA": "Hypera",
    "QUAL3.SA": "Qualicorp",
    "MATD3.SA": "Mater Dei",
}
REFERENCIA = "^BVSP"
NOMES = {**EMPRESAS, REFERENCIA: "Ibovespa"}
PERIODOS = {"1 mês": "1mo", "3 meses": "3mo", "6 meses": "6mo", "1 ano": "1y", "2 anos": "2y", "5 anos": "5y"}

# Paleta categórica em ordem fixa: a cor acompanha a empresa, não a posição no filtro.
PALETA = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]
CORES = {ticker: PALETA[i] for i, ticker in enumerate(EMPRESAS)}
CORES[REFERENCIA] = "#7a7974"


@st.cache_data(ttl=900, show_spinner="Consultando o Yahoo Finance...")
def baixar_cotacoes(tickers: tuple[str, ...], periodo: str) -> pd.DataFrame:
    """Baixa preços diários e devolve uma tabela longa: data, ticker, preços e volume."""
    bruto = yf.download(list(tickers), period=periodo, interval="1d", auto_adjust=True, progress=False)
    if bruto.empty:
        return pd.DataFrame()
    longo = bruto.stack(level="Ticker", future_stack=True).reset_index()
    longo = longo.rename(columns={"Date": "data", "Ticker": "ticker", "Open": "abertura", "High": "maxima",
                                  "Low": "minima", "Close": "fechamento", "Volume": "volume"})
    longo = longo.dropna(subset=["fechamento"]).sort_values(["ticker", "data"])
    longo["empresa"] = longo["ticker"].map(NOMES)
    longo["retorno_diario"] = longo.groupby("ticker")["fechamento"].pct_change()
    longo["base_100"] = longo["fechamento"] / longo.groupby("ticker")["fechamento"].transform("first") * 100
    return longo


def indicadores(cotacoes: pd.DataFrame) -> pd.DataFrame:
    """Calcula, por ticker, retorno no período, volatilidade anualizada e queda máxima."""
    linhas = []
    for ticker, serie in cotacoes.groupby("ticker"):
        preco = serie["fechamento"]
        pico = preco.cummax()
        linhas.append({
            "ticker": ticker,
            "empresa": NOMES[ticker],
            "ultimo_preco": preco.iloc[-1],
            "retorno_pct": (preco.iloc[-1] / preco.iloc[0] - 1) * 100,
            "volatilidade_pct": serie["retorno_diario"].std() * np.sqrt(252) * 100,
            "queda_maxima_pct": ((preco / pico) - 1).min() * 100,
        })
    return pd.DataFrame(linhas).sort_values("retorno_pct", ascending=False)


st.set_page_config(page_title="Painel financeiro · Saúde na B3", page_icon="📈", layout="wide")
st.title("Empresas de saúde na B3 comparadas ao Ibovespa")
st.caption("Fonte: Yahoo Finance via yfinance, preços ajustados por proventos. Dados com atraso; uso didático, não é recomendação de investimento.")

# Filtros em uma linha, acima dos gráficos.
col_emp, col_per, col_media = st.columns([3, 1, 1])
selecionadas = col_emp.multiselect("Empresas", options=list(EMPRESAS), default=list(EMPRESAS)[:4],
                                   format_func=lambda t: f"{EMPRESAS[t]} ({t})")
rotulo_periodo = col_per.selectbox("Período", list(PERIODOS), index=3)
janela = col_media.slider("Média móvel (dias)", min_value=5, max_value=60, value=21, step=1)

if not selecionadas:
    st.info("Selecione ao menos uma empresa para montar o painel.")
    st.stop()

cotacoes = baixar_cotacoes(tuple(selecionadas + [REFERENCIA]), PERIODOS[rotulo_periodo])
if cotacoes.empty:
    st.error("O Yahoo Finance não devolveu dados. Aguarde um minuto e recarregue a página.")
    st.stop()

tabela = indicadores(cotacoes)
ibov = tabela.set_index("ticker").loc[REFERENCIA]

# 1. Cartões: retorno de cada empresa e a diferença em relação ao Ibovespa.
st.subheader(f"Retorno em {rotulo_periodo.lower()}")
cartoes = st.columns(len(selecionadas) + 1)
cartoes[0].metric("Ibovespa", f"{ibov.retorno_pct:+.1f}%", help="Referência do mercado")
for cartao, linha in zip(cartoes[1:], tabela[tabela.ticker != REFERENCIA].itertuples()):
    cartao.metric(linha.empresa, f"{linha.retorno_pct:+.1f}%",
                  delta=f"{linha.retorno_pct - ibov.retorno_pct:+.1f} p.p. vs Ibovespa")

# 2. Evolução em base 100: todas as séries no mesmo eixo, sem eixo duplo.
st.subheader("Evolução do preço (base 100 no início do período)")
fig_base = px.line(cotacoes, x="data", y="base_100", color="ticker", color_discrete_map=CORES,
                   labels={"data": "", "base_100": "Base 100", "ticker": ""},
                   hover_data={"empresa": True, "fechamento": ":.2f", "ticker": False})
fig_base.for_each_trace(lambda tr: tr.update(name=NOMES[tr.name], line_width=2,
                                             line_dash="dash" if tr.name == REFERENCIA else "solid"))
fig_base.add_hline(y=100, line_color="#b5b4ad", line_width=1)
fig_base.update_layout(hovermode="x unified", legend_orientation="h", legend_y=1.08, margin=dict(t=30, b=10))
st.plotly_chart(fig_base, width="stretch")

# 3. Detalhe de uma empresa: candles, média móvel e volume.
st.subheader("Detalhe de uma empresa")
foco = st.selectbox("Empresa em foco", selecionadas, format_func=lambda t: EMPRESAS[t])
serie = cotacoes[cotacoes.ticker == foco].copy()
serie["media_movel"] = serie["fechamento"].rolling(janela).mean()
fig_candle = go.Figure([
    go.Candlestick(x=serie["data"], open=serie["abertura"], high=serie["maxima"], low=serie["minima"],
                   close=serie["fechamento"], name="Preço (R$)"),
    go.Scatter(x=serie["data"], y=serie["media_movel"], name=f"Média móvel {janela} dias",
               line=dict(color=CORES[foco], width=2)),
])
fig_candle.update_layout(xaxis_rangeslider_visible=False, legend_orientation="h", legend_y=1.1,
                         yaxis_title="R$", margin=dict(t=30, b=10))
st.plotly_chart(fig_candle, width="stretch")
fig_vol = px.bar(serie, x="data", y="volume", labels={"data": "", "volume": "Volume negociado"},
                 color_discrete_sequence=[CORES[foco]])
fig_vol.update_layout(height=220, margin=dict(t=10, b=10))
st.plotly_chart(fig_vol, width="stretch")

# 4. Risco e retorno: quem entregou mais retorno por unidade de oscilação.
col_risco, col_corr = st.columns(2)
with col_risco:
    st.subheader("Risco versus retorno")
    fig_risco = px.scatter(tabela, x="volatilidade_pct", y="retorno_pct", color="ticker", text="empresa",
                           color_discrete_map=CORES,
                           labels={"volatilidade_pct": "Volatilidade anualizada (%)", "retorno_pct": "Retorno no período (%)"})
    fig_risco.update_traces(marker_size=12, textposition="top center", showlegend=False)
    fig_risco.add_hline(y=0, line_color="#b5b4ad", line_width=1)
    st.plotly_chart(fig_risco, width="stretch")
with col_corr:
    st.subheader("Correlação dos retornos diários")
    largura = cotacoes.pivot(index="data", columns="empresa", values="retorno_diario")
    fig_corr = px.imshow(largura.corr().round(2), text_auto=True, zmin=-1, zmax=1,
                         color_continuous_scale=["#2a78d6", "#f1f0ec", "#e34948"])
    st.plotly_chart(fig_corr, width="stretch")

# 5. Tabela e download: o número que aparece no gráfico pode ser conferido.
st.subheader("Indicadores do período")
st.dataframe(
    tabela.drop(columns="ticker").rename(columns={"empresa": "Empresa", "ultimo_preco": "Último preço (R$)",
                                                  "retorno_pct": "Retorno (%)", "volatilidade_pct": "Volatilidade (%)",
                                                  "queda_maxima_pct": "Queda máxima (%)"}),
    hide_index=True, width="stretch",
    column_config={c: st.column_config.NumberColumn(format="%.2f") for c in
                   ["Último preço (R$)", "Retorno (%)", "Volatilidade (%)", "Queda máxima (%)"]},
)
st.download_button("Baixar cotações em CSV", cotacoes.to_csv(index=False).encode("utf-8"),
                   file_name="cotacoes_saude_b3.csv", mime="text/csv")
