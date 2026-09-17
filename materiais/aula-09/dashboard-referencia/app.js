/* Dashboard de referência · Aula 9 · Laboratório de Programação, Ciência de Dados & IA
 *
 * Fluxo: navegador → (GitHub Pages entrega este arquivo) → fetch → API REST do Supabase → views.
 * Nenhum resultado está escrito aqui: títulos, rótulos e valores saem das linhas de cada view.
 * O que aparece como texto fixo são definições (período, filtros, nomes de view), não resultados.
 */
(function () {
  'use strict';

  const CHAVE_ARMAZENAMENTO = 'einstein-aula09-dashboard-referencia';
  const TEMPO_LIMITE_MS = 20000;

  const CORES = {
    destaque: '#0a9ad0',
    atencao: '#d0772a',
    contexto: '#5b6b80',
    contextoFraco: 'rgba(91, 107, 128, 0.55)',
    grade: 'rgba(203, 213, 225, 0.10)',
    texto: '#e2ebf2',
    texto2: '#cbd5e1',
    texto3: '#94a3b8'
  };

  /* ---------- Formatação pt-BR ---------- */
  const formatos = {
    moeda: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    inteiro: new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }),
    umaCasa: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    duasCasas: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  };
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  const brl = valor => formatos.moeda.format(valor);
  const inteiro = valor => formatos.inteiro.format(valor);
  const decimal1 = valor => formatos.umaCasa.format(valor);
  const decimal2 = valor => formatos.duasCasas.format(valor);
  const pct = (valor, casas = 1) => `${casas === 2 ? decimal2(valor) : decimal1(valor)}%`;
  function brlCurto(valor) {
    if (Math.abs(valor) >= 1e6) return `R$ ${decimal2(valor / 1e6)} mi`;
    if (Math.abs(valor) >= 1e3) return `R$ ${decimal1(valor / 1e3)} mil`;
    return brl(valor);
  }
  function brlEixo(valor) {
    if (Math.abs(valor) >= 1e6) return `R$ ${decimal1(valor / 1e6)} mi`;
    if (Math.abs(valor) >= 1e3) return `R$ ${inteiro(valor / 1e3)} mil`;
    return `R$ ${inteiro(valor)}`;
  }
  function mesCurto(anoMes) {
    const [ano, mes] = String(anoMes).split('-');
    return `${MESES[Number(mes) - 1]}/${ano.slice(2)}`;
  }
  const semPrefixo = faixa => String(faixa).replace(/^\d+\s*/, '');
  const somar = (linhas, coluna) => linhas.reduce((total, linha) => total + linha[coluna], 0);
  const maiorPor = (linhas, coluna) => linhas.reduce((a, b) => (b[coluna] > a[coluna] ? b : a));
  const menorPor = (linhas, coluna) => linhas.reduce((a, b) => (b[coluna] < a[coluna] ? b : a));
  const ordenar = (linhas, coluna, sentido = -1) => [...linhas].sort((a, b) => sentido * (a[coluna] - b[coluna]));

  /* ---------- DOM ---------- */
  function el(tag, atributos = {}, ...filhos) {
    const no = document.createElement(tag);
    for (const [nome, valor] of Object.entries(atributos)) {
      if (valor === undefined || valor === null || valor === false) continue;
      if (nome === 'class') no.className = valor;
      else if (nome === 'text') no.textContent = valor;
      else if (nome === 'style') no.style.cssText = valor;
      else no.setAttribute(nome, valor === true ? '' : valor);
    }
    for (const filho of filhos.flat()) {
      if (filho === undefined || filho === null || filho === false) continue;
      no.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
    }
    return no;
  }

  /* ---------- Armazenamento local (pode falhar em aba anônima ou com site bloqueado) ---------- */
  const armazenamento = {
    ler() {
      try {
        const texto = window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
        const dados = texto ? JSON.parse(texto) : null;
        return dados && typeof dados.url === 'string' && typeof dados.chave === 'string' ? dados : null;
      } catch (erro) {
        return null;
      }
    },
    gravar(config) {
      try {
        window.localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(config));
        return true;
      } catch (erro) {
        return false;
      }
    },
    apagar() {
      try { window.localStorage.removeItem(CHAVE_ARMAZENAMENTO); } catch (erro) { /* nada a apagar */ }
    }
  };

  /* ---------- Validação da conexão ---------- */
  function normalizarUrl(bruta) {
    const texto = String(bruta || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
    let url;
    try { url = new URL(texto); } catch (erro) { return { erro: 'A Project URL precisa começar com https://, por exemplo https://seu-projeto.supabase.co.' }; }
    if (/(^|\.)supabase\.com$/i.test(url.hostname)) {
      return { erro: 'Essa é a URL do painel do Supabase. Use a Project URL, no formato https://seu-projeto.supabase.co.' };
    }
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
      return { erro: 'A Project URL precisa usar https://.' };
    }
    return { url: `${url.origin}${url.pathname.replace(/\/+$/, '')}` };
  }

  function problemaNaChave(chave) {
    if (!chave) return 'Cole a chave publicável do projeto.';
    if (/^postgres(ql)?:\/\//i.test(chave)) {
      return 'Isso é a string de conexão, com a senha do banco. Ela nunca vai para uma página web: use a chave publicável.';
    }
    if (/^sb_secret_/i.test(chave)) {
      return 'Esta é a chave secreta (sb_secret_…). Ela ignora o RLS e não pode ir para uma página pública. Use a chave publicável (sb_publishable_…).';
    }
    const partes = chave.split('.');
    if (partes.length === 3) {
      try {
        const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)));
        if (payload && payload.role === 'service_role') {
          return 'Esta é a chave service_role. Ela ignora o RLS e não pode ir para uma página pública. Use a anon public ou a publicável.';
        }
      } catch (erro) { /* não é um JWT legível: a API dirá se a chave vale */ }
    }
    return null;
  }

  /* ---------- Leitura das views pela API REST ---------- */
  class ErroView extends Error {
    constructor(view, status, corpo, causa) {
      super(`${view}: ${status ? `HTTP ${status}` : causa || 'falha de rede'}`);
      this.view = view;
      this.status = status;
      this.corpo = corpo || {};
      this.causa = causa;
    }
  }

  async function lerView(config, view) {
    const controle = new AbortController();
    const relogio = window.setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    let resposta;
    try {
      resposta = await fetch(`${config.url}/rest/v1/${view}?select=*`, {
        headers: { apikey: config.chave, Authorization: `Bearer ${config.chave}`, Accept: 'application/json' },
        signal: controle.signal
      });
    } catch (erro) {
      throw new ErroView(view, 0, null, erro.name === 'AbortError' ? 'tempo esgotado' : 'falha de rede');
    } finally {
      window.clearTimeout(relogio);
    }
    const texto = await resposta.text();
    let corpo = null;
    try { corpo = texto ? JSON.parse(texto) : null; } catch (erro) { corpo = null; }
    if (!resposta.ok) throw new ErroView(view, resposta.status, corpo);
    if (!Array.isArray(corpo)) throw new ErroView(view, resposta.status, null, 'resposta sem lista de linhas');
    return corpo;
  }

  /* O PostgREST entrega numeric e bigint como número JSON (3.00 chega como 3).
     Number() é conversão defensiva: se uma view mudar e mandar texto, o painel acusa em vez de concatenar. */
  function normalizar(linhas, numericas, view) {
    return linhas.map(linha => {
      const copia = { ...linha };
      for (const coluna of numericas) {
        if (!(coluna in linha)) throw new Error(`A view ${view} respondeu sem a coluna ${coluna}.`);
        const numero = Number(linha[coluna]);
        if (linha[coluna] === null || linha[coluna] === '' || !Number.isFinite(numero)) {
          throw new Error(`A coluna ${coluna} de ${view} trouxe um valor que não é número: ${JSON.stringify(linha[coluna])}.`);
        }
        copia[coluna] = numero;
      }
      return copia;
    });
  }

  function explicarErro(erro, config) {
    if (!(erro instanceof ErroView)) {
      return { titulo: 'A view respondeu num formato inesperado', texto: erro.message };
    }
    const mensagem = erro.corpo && (erro.corpo.message || erro.corpo.msg);
    const codigo = erro.corpo && erro.corpo.code;
    if (erro.status === 0) {
      return {
        titulo: `Sem resposta de ${config.url} (${erro.causa})`,
        texto: 'Confira a Project URL e a conexão. Um erro de CORS no console quase sempre é consequência de URL errada, não a causa: a API do Supabase aceita chamadas de qualquer site.'
      };
    }
    if ((erro.status === 401 || erro.status === 403) && codigo === '42501') {
      return {
        titulo: `HTTP ${erro.status}: sem permissão de leitura em ${erro.view}`,
        texto: 'A chave foi aceita, mas o papel anon não pode ler a view. Rode de novo o grant select do final de views.sql.'
      };
    }
    if (erro.status === 401 || erro.status === 403) {
      return {
        titulo: `HTTP ${erro.status}: chave recusada pelo Supabase`,
        texto: `Copie de novo a chave publicável em Project Settings → API Keys e confira se ela é do mesmo projeto da URL.${mensagem ? ` Resposta da API: “${mensagem}”.` : ''}`
      };
    }
    if (erro.status === 404) {
      return {
        titulo: `HTTP 404: a API não encontrou ${erro.view}`,
        texto: `Rode views.sql no SQL Editor do projeto. Se a view acabou de ser criada, execute notify pgrst, 'reload schema'; para atualizar o cache da API.${codigo ? ` Código ${codigo}.` : ''}`
      };
    }
    return {
      titulo: `HTTP ${erro.status} ao ler ${erro.view}`,
      texto: mensagem ? `Resposta da API: “${mensagem}”.` : 'A API devolveu um erro sem mensagem. Tente ler de novo em alguns segundos.'
    };
  }

  /* ---------- Gráficos ---------- */
  const graficos = new Map();

  /* Rótulos diretos na ponta das barras (ou sobre pontos escolhidos da linha).
     A função fica numa closure: funções dentro de options seriam tratadas como opções "scriptable" pelo Chart.js. */
  function rotulosNasBarras(textoDoRotulo, afastamento = 6) {
    return {
      id: 'rotulosNasBarras',
      afterDatasetsDraw(grafico) {
        const { ctx } = grafico;
        const horizontal = grafico.options.indexAxis === 'y';
        grafico.data.datasets.forEach((serie, indiceSerie) => {
          const meta = grafico.getDatasetMeta(indiceSerie);
          if (meta.hidden) return;
          meta.data.forEach((elemento, indice) => {
            const texto = textoDoRotulo(serie.data[indice], indice, indiceSerie);
            if (!texto) return;
            ctx.save();
            ctx.fillStyle = CORES.texto2;
            ctx.font = "600 12px 'Outfit', system-ui, sans-serif";
            if (horizontal) {
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(texto, elemento.x + 6, elemento.y);
            } else {
              const metade = ctx.measureText(texto).width / 2;
              const limite = grafico.chartArea.right + 8;
              ctx.textAlign = elemento.x + metade > limite ? 'right' : 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(texto, ctx.textAlign === 'right' ? elemento.x + 6 : elemento.x, elemento.y - afastamento);
            }
            ctx.restore();
          });
        });
      }
    };
  }

  function prepararChart() {
    if (typeof window.Chart !== 'function') return false;
    const padrao = window.Chart.defaults;
    if (padrao) {
      padrao.color = CORES.texto3;
      padrao.borderColor = CORES.grade;
      if (padrao.font) {
        padrao.font.family = "'Outfit', system-ui, sans-serif";
        padrao.font.size = 12;
      }
    }
    return true;
  }

  function eixoValor(formatar, extra = {}) {
    return {
      beginAtZero: true,
      grace: '12%',
      grid: { color: CORES.grade, drawTicks: false },
      border: { display: false },
      ticks: { callback: valor => formatar(valor), maxTicksLimit: 5, padding: 6 },
      ...extra
    };
  }
  const eixoCategoria = { grid: { display: false }, border: { color: 'rgba(203, 213, 225, 0.25)' }, ticks: { color: CORES.texto2, padding: 4 } };

  function barrasHorizontais({ rotulos, valores, cores, formatarEixo, rotuloBarra, tooltip, grace = '30%' }) {
    return {
      type: 'bar',
      data: {
        labels: rotulos,
        datasets: [{ data: valores, backgroundColor: cores, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 20, categoryPercentage: 0.82, barPercentage: 0.92 }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: { padding: { right: 4 } },
        scales: { x: eixoValor(formatarEixo, { grace }), y: eixoCategoria },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: tooltip } }
        }
      },
      plugins: [rotulosNasBarras(rotuloBarra)]
    };
  }

  function desenharGrafico(corpo, contexto, altura, config, descricao) {
    if (!prepararChart()) {
      corpo.append(el('p', { class: 'estado estado-aviso', text: 'Gráfico indisponível: o Chart.js não carregou do CDN jsdelivr. Os números da view estão na tabela abaixo.' }));
      contexto.abrirTabela = true;
      return;
    }
    const area = el('div', { class: 'area-grafico', style: `height:${altura}px` });
    const canvas = el('canvas', { role: 'img', 'aria-label': descricao });
    area.append(canvas);
    corpo.append(area);
    graficos.set(contexto.id, new window.Chart(canvas, config));
  }

  function legenda(itens) {
    return el('ul', { class: 'legenda' }, itens.map(([cor, texto]) => el('li', {}, el('i', { style: `background:${cor}`, 'aria-hidden': 'true' }), texto)));
  }

  /* ---------- As dez perguntas, na ordem narrativa ---------- */
  const SECOES = [
    { id: 'contexto', nome: 'Contexto', frase: 'onde a Olist está: ritmo, geografia e mix' },
    { id: 'tensao', nome: 'Tensão', frase: 'o que ameaça o crescimento de 2019' },
    { id: 'decisao', nome: 'Decisão', frase: 'onde agir: categorias, frete e calendário' }
  ];

  const PERIODO = 'jan/2017 a ago/2018';

  const PERGUNTAS = [
    {
      id: 'p01', secao: 'contexto', tipo: 'Tempo', largo: true,
      view: 'vw_p01_receita_mensal', numericas: ['receita', 'pedidos', 'ticket_medio'],
      pergunta: 'Como evoluíram receita e pedidos mês a mês?',
      decisao: 'meta e ritmo de 2019',
      subtitulo: `Receita em R$ por mês (preço dos itens, sem frete) · pedidos entregues · ${PERIODO}`,
      leitura: 'o pico de novembro inclui a Black Friday: é sazonalidade, não uma nova base. Os meses incompletos das pontas da base ficaram fora da view para não desenhar uma queda que não aconteceu.',
      preparar: linhas => [...linhas].sort((a, b) => String(a.ano_mes).localeCompare(String(b.ano_mes))),
      titulo(linhas) {
        const primeiro = linhas[0];
        const ultimo = linhas[linhas.length - 1];
        const pico = maiorPor(linhas, 'receita');
        return `A receita mensal subiu de ${brlCurto(primeiro.receita)} (${mesCurto(primeiro.ano_mes)}) para ${brlCurto(ultimo.receita)} (${mesCurto(ultimo.ano_mes)}), com pico de ${brlCurto(pico.receita)} em ${mesCurto(pico.ano_mes)}`;
      },
      desenhar(corpo, linhas, contexto) {
        const receita = somar(linhas, 'receita');
        const pedidos = somar(linhas, 'pedidos');
        corpo.append(el('div', { class: 'kpis' },
          el('div', { class: 'kpi' }, el('span', { text: 'Receita no período' }), el('strong', { text: brl(receita) })),
          el('div', { class: 'kpi' }, el('span', { text: 'Pedidos entregues' }), el('strong', { text: inteiro(pedidos) })),
          el('div', { class: 'kpi' }, el('span', { text: 'Meses completos' }), el('strong', { text: inteiro(linhas.length) }))
        ));
        const pico = linhas.indexOf(maiorPor(linhas, 'receita'));
        const ultimo = linhas.length - 1;
        const marcados = new Set([pico, ultimo]);
        desenharGrafico(corpo, contexto, 290, {
          type: 'line',
          data: {
            labels: linhas.map(l => mesCurto(l.ano_mes)),
            datasets: [{
              data: linhas.map(l => l.receita),
              borderColor: CORES.destaque, borderWidth: 2, tension: 0.25,
              backgroundColor: 'rgba(10, 154, 208, 0.10)', fill: 'origin',
              pointRadius: linhas.map((_, i) => (marcados.has(i) ? 5 : 0)),
              pointHoverRadius: 6, pointHitRadius: 14,
              pointBackgroundColor: CORES.destaque, pointBorderColor: '#111c2e', pointBorderWidth: 2
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            interaction: { mode: 'index', intersect: false },
            layout: { padding: { top: 22, right: 44 } },
            scales: {
              x: { grid: { display: false }, border: { color: 'rgba(203, 213, 225, 0.25)' }, ticks: { maxRotation: 0, autoSkipPadding: 10 } },
              y: eixoValor(brlEixo, { grace: '10%' })
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: item => {
                    const linha = linhas[item.dataIndex];
                    return [`Receita: ${brl(linha.receita)}`, `Pedidos: ${inteiro(linha.pedidos)}`, `Ticket médio: ${brl(linha.ticket_medio)}`];
                  }
                }
              }
            }
          },
          plugins: [rotulosNasBarras((valor, i) => (marcados.has(i) ? brlCurto(valor) : ''), 10)]
        }, this.titulo(linhas));
        const janela = Math.min(6, linhas.length);
        const recentes = linhas.slice(-janela);
        const minimo = menorPor(recentes, 'receita');
        const maximo = maiorPor(recentes, 'receita');
        const picoForaDaJanela = pico < linhas.length - janela;
        corpo.append(el('p', {
          class: 'destaque-texto',
          text: `Nos últimos ${inteiro(janela)} meses (${mesCurto(recentes[0].ano_mes)} a ${mesCurto(linhas[ultimo].ano_mes)}), a receita oscilou entre ${brlCurto(minimo.receita)} e ${brlCurto(maximo.receita)}${picoForaDaJanela ? `, sem voltar ao pico de ${mesCurto(linhas[pico].ano_mes)}` : ''}.`
        }));
      }
    },
    {
      id: 'p05', secao: 'contexto', tipo: 'Geografia',
      view: 'vw_p05_receita_estado', numericas: ['receita', 'participacao_pct', 'pedidos'],
      pergunta: 'Como a receita se distribui por estado do cliente?',
      decisao: 'expansão fora de SP',
      subtitulo: `Receita em R$ por estado do cliente · rótulo: % da receita · dez maiores e demais agrupados · ${PERIODO}`,
      leitura: 'o estado é o do cliente, não o do vendedor. O gráfico mostra onde está a demanda, não de onde sai a mercadoria.',
      preparar: linhas => ordenar(linhas, 'receita'),
      titulo(linhas) {
        const total = somar(linhas, 'receita');
        const tres = linhas.slice(0, 3);
        const fatia = (100 * somar(tres, 'receita')) / total;
        return `${tres[0].estado} concentra ${pct(tres[0].participacao_pct)} da receita; com ${tres[1].estado} e ${tres[2].estado}, chega a ${pct(fatia)}`;
      },
      desenhar(corpo, linhas, contexto) {
        const total = somar(linhas, 'receita');
        const maiores = linhas.slice(0, 10);
        const demais = linhas.slice(10);
        const barras = maiores.map(l => ({ rotulo: l.estado, receita: l.receita, pct: l.participacao_pct, pedidos: l.pedidos }));
        if (demais.length) {
          const receitaDemais = somar(demais, 'receita');
          barras.push({ rotulo: `Outros (${inteiro(demais.length)})`, receita: receitaDemais, pct: (100 * receitaDemais) / total, pedidos: somar(demais, 'pedidos') });
        }
        desenharGrafico(corpo, contexto, barras.length * 26 + 40, barrasHorizontais({
          rotulos: barras.map(b => b.rotulo),
          valores: barras.map(b => b.receita),
          cores: barras.map((_, i) => (i === 0 ? CORES.destaque : i === maiores.length ? CORES.contextoFraco : CORES.contexto)),
          formatarEixo: brlEixo,
          rotuloBarra: (_, i) => pct(barras[i].pct),
          tooltip: item => [`Receita: ${brl(barras[item.dataIndex].receita)}`, `Participação: ${pct(barras[item.dataIndex].pct)}`, `Pedidos: ${inteiro(barras[item.dataIndex].pedidos)}`]
        }), this.titulo(linhas));
      }
    },
    {
      id: 'p03', secao: 'contexto', tipo: 'Categoria',
      view: 'vw_p03_top_categorias', numericas: ['receita', 'participacao_pct', 'pedidos', 'ticket_medio'],
      pergunta: 'Quais 10 categorias concentram a receita e qual o ticket de cada?',
      decisao: 'onde concentrar o mix',
      subtitulo: `Receita em R$ por categoria · rótulo: % da receita de todas as categorias · ${PERIODO}`,
      leitura: 'receita alta pode vir de volume ou de ticket. Compare as duas medidas antes de decidir onde concentrar o mix.',
      preparar: linhas => ordenar(linhas, 'receita'),
      titulo(linhas) {
        const lider = linhas[0];
        const ticket = maiorPor(linhas, 'ticket_medio');
        if (ticket === lider) return `${lider.categoria} lidera a receita (${pct(lider.participacao_pct)}) e também tem o maior ticket (${brl(lider.ticket_medio)})`;
        return `${lider.categoria} lidera com ${pct(lider.participacao_pct)} da receita; ${ticket.categoria} tem o maior ticket (${brl(ticket.ticket_medio)})`;
      },
      desenhar(corpo, linhas, contexto) {
        desenharGrafico(corpo, contexto, linhas.length * 28 + 40, barrasHorizontais({
          rotulos: linhas.map(l => l.categoria),
          valores: linhas.map(l => l.receita),
          cores: linhas.map((_, i) => (i === 0 ? CORES.destaque : CORES.contexto)),
          formatarEixo: brlEixo,
          rotuloBarra: (_, i) => pct(linhas[i].participacao_pct),
          tooltip: item => {
            const l = linhas[item.dataIndex];
            return [`Receita: ${brl(l.receita)}`, `Pedidos: ${inteiro(l.pedidos)}`, `Ticket médio: ${brl(l.ticket_medio)}`];
          }
        }), this.titulo(linhas));
        const maior = maiorPor(linhas, 'ticket_medio');
        const menor = menorPor(linhas, 'ticket_medio');
        corpo.append(el('p', { class: 'destaque-texto', text: `Ticket médio entre as dez: de ${brl(menor.ticket_medio)} (${menor.categoria}) a ${brl(maior.ticket_medio)} (${maior.categoria}).` }));
      }
    },
    {
      id: 'p10', secao: 'tensao', tipo: 'Livre',
      view: 'vw_p10_concentracao_vendedores', numericas: ['decil', 'vendedores', 'receita', 'participacao_pct'],
      pergunta: 'Quanto a receita depende dos maiores vendedores?',
      decisao: 'captação e retenção de sellers',
      subtitulo: `% da receita por decil de vendedores, do maior (1º) ao menor (10º) · ${PERIODO}`,
      leitura: 'concentração não diz se o vendedor grande é rentável nem se é substituível: a view não traz margem nem custo de captação.',
      preparar: linhas => ordenar(linhas, 'decil', 1),
      titulo(linhas) {
        const primeiro = linhas[0];
        const inferiores = linhas.slice(-5);
        const fatia = (100 * somar(inferiores, 'receita')) / somar(linhas, 'receita');
        return `Os ${inteiro(primeiro.vendedores)} vendedores do 1º decil geram ${pct(primeiro.participacao_pct)} da receita; os ${inteiro(inferiores.length)} decis inferiores somam ${pct(fatia)}`;
      },
      desenhar(corpo, linhas, contexto) {
        desenharGrafico(corpo, contexto, 260, {
          type: 'bar',
          data: {
            labels: linhas.map(l => `${inteiro(l.decil)}º`),
            datasets: [{ data: linhas.map(l => l.participacao_pct), backgroundColor: linhas.map((_, i) => (i === 0 ? CORES.atencao : CORES.contexto)), borderRadius: 4, borderSkipped: 'start', maxBarThickness: 24 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            layout: { padding: { top: 20 } },
            scales: { x: { ...eixoCategoria, title: { display: true, text: 'decil de vendedores', color: CORES.texto3 } }, y: eixoValor(v => `${inteiro(v)}%`, { grace: '8%' }) },
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: item => { const l = linhas[item.dataIndex]; return [`Participação: ${pct(l.participacao_pct)}`, `Receita: ${brl(l.receita)}`, `Vendedores: ${inteiro(l.vendedores)}`]; } } }
            }
          },
          plugins: [rotulosNasBarras(valor => pct(valor))]
        }, this.titulo(linhas));
      }
    },
    {
      id: 'p09', secao: 'tensao', tipo: 'Livre',
      view: 'vw_p09_recompra', numericas: ['clientes', 'clientes_recorrentes', 'recompra_pct'],
      pergunta: 'Quantos clientes voltam a comprar?',
      decisao: 'programa de fidelização',
      subtitulo: `% de clientes (customer_unique_id) com mais de um pedido entregue · ${PERIODO}`,
      leitura: 'o cliente leva o endereço mais recente, e quem comprou pela primeira vez perto do fim do período teve pouco tempo para voltar. A taxa descreve este período, não a fidelidade ao longo de um ano.',
      titulo(linhas) {
        const l = linhas[0];
        return `Só ${pct(l.recompra_pct, 2)} dos clientes voltaram a comprar: ${inteiro(l.clientes_recorrentes)} de ${inteiro(l.clientes)}`;
      },
      desenhar(corpo, linhas) {
        const l = linhas[0];
        const preenchidos = Math.max(0, Math.min(100, Math.round(l.recompra_pct)));
        const grade = el('div', { class: 'waffle', role: 'img', 'aria-label': `Aproximadamente ${inteiro(preenchidos)} em cada 100 clientes compraram de novo` },
          Array.from({ length: 100 }, (_, i) => el('i', { class: i < preenchidos ? 'on' : '' })));
        corpo.append(el('div', { class: 'recompra' },
          el('div', {}, el('div', { class: 'numero-heroi', text: pct(l.recompra_pct, 2) }), el('p', { text: `${inteiro(l.clientes_recorrentes)} clientes recorrentes de ${inteiro(l.clientes)} clientes` })),
          el('div', {}, grade, el('p', { class: 'waffle-legenda', text: 'Cada quadrado é 1% dos clientes; o arredondamento vale só para o desenho.' }))
        ));
      }
    },
    {
      id: 'p07', secao: 'tensao', tipo: 'Prazo',
      view: 'vw_p07_atraso_estado', numericas: ['entregas', 'atraso_pct', 'dias_entrega_medio'],
      pergunta: 'Em que estados mais se entrega com atraso?',
      decisao: 'promessa de prazo por estado',
      subtitulo: `% de pedidos entregues depois da data prometida · estados com pelo menos 500 entregas · ${PERIODO}`,
      leitura: 'taxa não é volume. Um estado pequeno com taxa alta afeta menos clientes que um estado grande com taxa média; por isso o título compara os dois.',
      preparar: linhas => ordenar(linhas, 'atraso_pct'),
      analisar(linhas) {
        const taxas = linhas.map(l => l.atraso_pct).sort((a, b) => a - b);
        const meio = Math.floor(taxas.length / 2);
        const mediana = taxas.length % 2 ? taxas[meio] : (taxas[meio - 1] + taxas[meio]) / 2;
        const acima = linhas.filter(l => l.atraso_pct > mediana);
        const volumeAcima = acima.length ? maiorPor(acima, 'entregas') : linhas[0];
        const maiorVolume = maiorPor(linhas, 'entregas');
        return { mediana, acima, volumeAcima, maiorVolume };
      },
      titulo(linhas) {
        const pior = linhas[0];
        const { volumeAcima } = this.analisar(linhas);
        if (volumeAcima === pior) return `${pior.estado} tem a maior taxa de atraso (${pct(pior.atraso_pct)}) e o maior volume entre os estados acima da mediana: ${inteiro(pior.entregas)} entregas`;
        return `${pior.estado} atrasa ${pct(pior.atraso_pct)} das entregas; entre os estados acima da mediana, ${volumeAcima.estado} pesa mais: ${inteiro(volumeAcima.entregas)} entregas, ${pct(volumeAcima.atraso_pct)} com atraso`;
      },
      desenhar(corpo, linhas, contexto) {
        const { mediana, maiorVolume } = this.analisar(linhas);
        corpo.append(legenda([
          [CORES.atencao, `acima da mediana dos estados (${pct(mediana)})`],
          [CORES.destaque, 'maior volume de entregas'],
          [CORES.contexto, 'demais estados']
        ]));
        desenharGrafico(corpo, contexto, linhas.length * 22 + 40, barrasHorizontais({
          rotulos: linhas.map(l => l.estado),
          valores: linhas.map(l => l.atraso_pct),
          cores: linhas.map(l => (l === maiorVolume ? CORES.destaque : l.atraso_pct > mediana ? CORES.atencao : CORES.contexto)),
          formatarEixo: v => `${inteiro(v)}%`,
          rotuloBarra: valor => pct(valor),
          grace: '18%',
          tooltip: item => { const l = linhas[item.dataIndex]; return [`Atraso: ${pct(l.atraso_pct)}`, `Entregas: ${inteiro(l.entregas)}`, `Dias até a entrega: ${decimal1(l.dias_entrega_medio)}`]; }
        }), this.titulo(linhas));
        corpo.append(el('p', { class: 'destaque-texto', text: `Base de comparação: ${maiorVolume.estado}, com ${inteiro(maiorVolume.entregas)} entregas, atrasa ${pct(maiorVolume.atraso_pct)} e leva ${decimal1(maiorVolume.dias_entrega_medio)} dias em média para entregar.` }));
      }
    },
    {
      id: 'p08', secao: 'tensao', tipo: 'Satisfação',
      view: 'vw_p08_nota_prazo', numericas: ['pedidos_avaliados', 'nota_media', 'notas_1_e_2_pct'],
      pergunta: 'O atraso derruba a nota do cliente?',
      decisao: 'custo comercial do atraso',
      subtitulo: `% de avaliações com nota 1 ou 2 e nota média (1 a 5) · pedidos entregues e avaliados · ${PERIODO}`,
      leitura: 'atraso e nota baixa andam juntos, mas a view não prova que o atraso causa a nota: produto, vendedor e região também mudam entre os dois grupos.',
      titulo(linhas) {
        const noPrazo = linhas.find(l => l.entrega === 'no prazo');
        const atraso = linhas.find(l => l.entrega === 'com atraso');
        if (!noPrazo || !atraso) throw new Error('A view vw_p08_nota_prazo precisa das linhas "no prazo" e "com atraso".');
        return `Com atraso, a nota média cai de ${decimal2(noPrazo.nota_media)} para ${decimal2(atraso.nota_media)} e ${pct(atraso.notas_1_e_2_pct)} das avaliações são 1 ou 2`;
      },
      desenhar(corpo, linhas) {
        const grupos = [
          { linha: linhas.find(l => l.entrega === 'no prazo'), nome: 'No prazo', cor: CORES.destaque },
          { linha: linhas.find(l => l.entrega === 'com atraso'), nome: 'Com atraso', cor: CORES.atencao }
        ];
        corpo.append(el('div', { class: 'comparacao', role: 'list' }, grupos.map(g => el('div', { class: 'comp-linha', role: 'listitem' },
          el('div', { class: 'comp-rotulo' }, g.nome, el('small', { text: `${inteiro(g.linha.pedidos_avaliados)} pedidos avaliados` })),
          el('div', { class: 'comp-barra', 'aria-hidden': 'true' }, el('i', { style: `width:${Math.max(0, Math.min(100, g.linha.notas_1_e_2_pct))}%;background:${g.cor}` })),
          el('div', { class: 'comp-valores' },
            el('span', {}, 'Notas 1 e 2: ', el('b', { text: pct(g.linha.notas_1_e_2_pct) })),
            el('span', {}, 'Nota média: ', el('b', { text: decimal2(g.linha.nota_media) })))
        ))));
        corpo.append(el('p', { class: 'destaque-texto', text: 'A barra ocupa a escala inteira de 0% a 100% das avaliações do grupo.' }));
      }
    },
    {
      id: 'p04', secao: 'decisao', tipo: 'Categoria',
      view: 'vw_p04_crescimento_categorias', numericas: ['receita_2017', 'receita_2018', 'crescimento_pct'],
      pergunta: 'Quais categorias mais cresceram de jan–ago/17 para jan–ago/18?',
      decisao: 'apostas de crescimento',
      subtitulo: 'Receita em R$ de janeiro a agosto de cada ano · categorias com pelo menos R$ 50 mil em jan–ago/2017 · ordem: crescimento %',
      leitura: 'crescimento percentual sobre base pequena engana. Por isso a view exige um piso de receita em 2017 e o gráfico mostra os dois anos lado a lado, com o ganho em reais no título.',
      preparar: linhas => ordenar(linhas, 'crescimento_pct'),
      titulo(linhas) {
        const lider = linhas[0];
        const ganho = l => l.receita_2018 - l.receita_2017;
        const maiorGanho = linhas.reduce((a, b) => (ganho(b) > ganho(a) ? b : a));
        if (maiorGanho === lider) return `${lider.categoria} cresceu ${pct(lider.crescimento_pct)} e também somou o maior ganho em reais: +${brlCurto(ganho(lider))}`;
        return `${lider.categoria} cresceu ${pct(lider.crescimento_pct)}, mas partiu de ${brlCurto(lider.receita_2017)}; em reais, ${maiorGanho.categoria} somou mais: +${brlCurto(ganho(maiorGanho))}`;
      },
      desenhar(corpo, linhas, contexto) {
        corpo.append(legenda([[CORES.contexto, 'jan–ago/2017'], [CORES.destaque, 'jan–ago/2018']]));
        const serie = (dados, cor) => ({ data: dados, backgroundColor: cor, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 12, categoryPercentage: 0.8, barPercentage: 0.9 });
        desenharGrafico(corpo, contexto, linhas.length * 42 + 40, {
          type: 'bar',
          data: {
            labels: linhas.map(l => [l.categoria, `+${pct(l.crescimento_pct)}`]),
            datasets: [serie(linhas.map(l => l.receita_2017), CORES.contexto), serie(linhas.map(l => l.receita_2018), CORES.destaque)]
          },
          options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false,
            scales: { x: eixoValor(brlEixo, { grace: '6%', ticks: { callback: v => brlEixo(v), maxTicksLimit: 4, maxRotation: 0, padding: 6 } }), y: eixoCategoria },
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: item => { const l = linhas[item.dataIndex]; return item.datasetIndex === 0 ? `2017: ${brl(l.receita_2017)}` : [`2018: ${brl(l.receita_2018)}`, `Crescimento: ${pct(l.crescimento_pct)}`]; } } }
            }
          }
        }, this.titulo(linhas));
      }
    },
    {
      id: 'p06', secao: 'decisao', tipo: 'Geografia',
      view: 'vw_p06_frete_regiao', numericas: ['frete_sobre_preco_pct', 'frete_medio_item', 'itens'],
      pergunta: 'Quanto o frete pesa sobre o preço em cada região?',
      decisao: 'subsídio de frete',
      subtitulo: `Frete como % do preço dos itens, por região do cliente · itens entregues · ${PERIODO}`,
      leitura: 'a view mede o peso do frete, não vendas perdidas por frete caro: a base não registra carrinho abandonado, nem o custo de um subsídio.',
      preparar: linhas => ordenar(linhas, 'frete_sobre_preco_pct'),
      titulo(linhas) {
        const maior = linhas[0];
        const menor = linhas[linhas.length - 1];
        return `No ${maior.regiao}, o frete equivale a ${pct(maior.frete_sobre_preco_pct)} do preço (${brl(maior.frete_medio_item)} por item); no ${menor.regiao}, a ${pct(menor.frete_sobre_preco_pct)} (${brl(menor.frete_medio_item)})`;
      },
      desenhar(corpo, linhas, contexto) {
        const ultimo = linhas.length - 1;
        desenharGrafico(corpo, contexto, linhas.length * 34 + 40, barrasHorizontais({
          rotulos: linhas.map(l => l.regiao),
          valores: linhas.map(l => l.frete_sobre_preco_pct),
          cores: linhas.map((_, i) => (i === 0 ? CORES.atencao : i === ultimo ? CORES.destaque : CORES.contexto)),
          formatarEixo: v => `${inteiro(v)}%`,
          rotuloBarra: valor => pct(valor),
          grace: '25%',
          tooltip: item => { const l = linhas[item.dataIndex]; return [`Frete sobre o preço: ${pct(l.frete_sobre_preco_pct)}`, `Frete médio por item: ${brl(l.frete_medio_item)}`, `Itens: ${inteiro(l.itens)}`]; }
        }), this.titulo(linhas));
        corpo.append(el('p', { class: 'destaque-texto', text: `Frete médio por item: ${linhas.map(l => `${l.regiao} ${brl(l.frete_medio_item)}`).join(' · ')}.` }));
      }
    },
    {
      id: 'p02', secao: 'decisao', tipo: 'Tempo', largo: true,
      view: 'vw_p02_dia_hora', numericas: ['dia_semana', 'pedidos'],
      pergunta: 'Em que dia da semana e faixa de horário o cliente compra?',
      decisao: 'calendário de campanhas',
      subtitulo: `Pedidos entregues por dia da semana e faixa de horário da compra · ${PERIODO}`,
      leitura: 'o horário é o da compra, não o da aprovação do pagamento. Dia com mais pedidos não é, por si só, o dia em que uma campanha converte melhor.',
      analisar(linhas) {
        const dias = new Map();
        const faixas = new Map();
        for (const l of linhas) {
          const dia = dias.get(l.dia_semana) || { ordem: l.dia_semana, nome: l.nome_dia_semana, total: 0, celulas: new Map() };
          dia.total += l.pedidos;
          dia.celulas.set(l.faixa_horario, l.pedidos);
          dias.set(l.dia_semana, dia);
          faixas.set(l.faixa_horario, (faixas.get(l.faixa_horario) || 0) + l.pedidos);
        }
        const listaDias = [...dias.values()].sort((a, b) => a.ordem - b.ordem);
        const listaFaixas = [...faixas.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))).map(([chave, total]) => ({ chave, nome: semPrefixo(chave), total }));
        return { listaDias, listaFaixas };
      },
      titulo(linhas) {
        const { listaDias, listaFaixas } = this.analisar(linhas);
        const mais = maiorPor(listaDias, 'total');
        const menos = menorPor(listaDias, 'total');
        const faixa = maiorPor(listaFaixas, 'total');
        const nome = mais.nome.charAt(0).toUpperCase() + mais.nome.slice(1);
        return `${nome} tem mais pedidos (${inteiro(mais.total)}) e ${menos.nome}, menos (${inteiro(menos.total)}); a ${faixa.nome} é a faixa com mais compras (${inteiro(faixa.total)})`;
      },
      desenhar(corpo, linhas) {
        const { listaDias, listaFaixas } = this.analisar(linhas);
        const HORAS = { madrugada: '0h–6h', 'manhã': '6h–12h', tarde: '12h–18h', noite: '18h–24h' };
        const valores = linhas.map(l => l.pedidos);
        const minimo = Math.min(...valores);
        const maximo = Math.max(...valores);
        const cabecalho = el('tr', {}, el('th', { scope: 'col', text: 'Dia' }),
          listaFaixas.map(f => el('th', { scope: 'col' }, f.nome, el('small', { text: HORAS[f.nome] || '' }))),
          el('th', { scope: 'col', class: 'total', text: 'Total' }));
        const corpoTabela = listaDias.map(dia => el('tr', {},
          el('th', { scope: 'row', text: dia.nome }),
          listaFaixas.map(f => {
            const valor = dia.celulas.get(f.chave) || 0;
            const intensidade = maximo === minimo ? 1 : (valor - minimo) / (maximo - minimo);
            const alfa = 0.12 + 0.83 * intensidade;
            return el('td', {
              class: valor === maximo ? 'maximo' : '',
              style: `background:rgba(10,154,208,${alfa.toFixed(3)});color:${alfa > 0.55 ? '#ffffff' : CORES.texto2}`,
              text: inteiro(valor)
            });
          }),
          el('td', { class: 'total', text: inteiro(dia.total) })));
        const rodape = el('tr', {}, el('th', { scope: 'row', class: 'total', text: 'Total' }), listaFaixas.map(f => el('td', { class: 'total', text: inteiro(f.total) })), el('td', { class: 'total', text: '' }));
        corpo.append(el('div', { class: 'calor-rolagem' }, el('table', { class: 'calor', 'aria-label': this.titulo(linhas) }, el('thead', {}, cabecalho), el('tbody', {}, corpoTabela, rodape))));
        corpo.append(el('p', { class: 'destaque-texto', text: 'Quanto mais intenso o azul, mais pedidos; a borda branca marca a célula com mais pedidos.' }));
      }
    }
  ];

  /* ---------- Tabela da view (reconciliação tela × view) ---------- */
  function formatarCelula(coluna, valor) {
    if (typeof valor !== 'number') return String(valor);
    if (/receita|ticket|frete_medio/.test(coluna)) return brl(valor);
    if (coluna === 'recompra_pct') return pct(valor, 2);
    if (/_pct$/.test(coluna)) return pct(valor);
    if (coluna === 'nota_media') return decimal2(valor);
    if (/^dias/.test(coluna)) return decimal1(valor);
    return inteiro(valor);
  }

  function tabelaDaView(pergunta, linhas, aberta) {
    const colunas = Object.keys(linhas[0] || {});
    return el('details', { class: 'dados', open: aberta },
      el('summary', { text: `Ver as ${inteiro(linhas.length)} linhas de ${pergunta.view}` }),
      el('div', { class: 'tabela-rolagem' },
        el('table', {},
          el('thead', {}, el('tr', {}, colunas.map(c => el('th', { scope: 'col', text: c })))),
          el('tbody', {}, linhas.map(l => el('tr', {}, colunas.map(c => el('td', { class: typeof l[c] === 'number' ? 'num' : '', text: formatarCelula(c, l[c]) }))))))));
  }

  /* ---------- Montagem da página ---------- */
  const $ = seletor => document.querySelector(seletor);
  const painel = $('#painel');
  const secaoConexao = $('#conexao');
  const form = $('#form-conexao');
  const campoUrl = $('#supabase-url');
  const campoChave = $('#supabase-chave');
  const campoLembrar = $('#lembrar');
  const mensagemForm = $('#mensagem-form');
  const barraStatus = $('#status');
  const textoStatus = $('#status-texto');

  let configAtual = null;
  let geracao = 0;

  function montarEsqueleto() {
    for (const grafico of graficos.values()) {
      try { grafico.destroy(); } catch (erro) { /* gráfico já descartado */ }
    }
    graficos.clear();
    painel.replaceChildren();
    const cartoes = new Map();
    SECOES.forEach((secao, indice) => {
      const grade = el('div', { class: 'grade-cartoes' });
      painel.append(el('section', { class: 'secao', id: `secao-${secao.id}`, 'aria-labelledby': `titulo-${secao.id}` },
        el('div', { class: 'secao-cabecalho' },
          el('h2', { id: `titulo-${secao.id}` }, `${inteiro(indice + 1)}. ${secao.nome} `, el('span', { text: `· ${secao.frase}` }))),
        grade));
      for (const pergunta of PERGUNTAS.filter(p => p.secao === secao.id)) {
        const titulo = el('h3', { text: 'Carregando…' });
        const corpo = el('div', { class: 'corpo' }, el('p', { class: 'estado estado-carregando', text: `Lendo ${pergunta.view} no Supabase…` }));
        const cartao = el('article', { class: `cartao vidro${pergunta.largo ? ' largo' : ''}`, 'data-card': pergunta.id, 'data-view': pergunta.view, 'data-estado': 'carregando', 'aria-busy': 'true' },
          el('div', { class: 'cartao-topo' },
            el('span', { class: 'etiqueta', text: `${pergunta.id.toUpperCase()} · ${pergunta.tipo}` }),
            el('span', { class: 'pergunta', text: pergunta.pergunta })),
          titulo,
          el('p', { class: 'subtitulo', text: pergunta.subtitulo }),
          corpo,
          el('p', { class: 'nota-leitura' }, el('b', { text: 'Leitura cuidadosa: ' }), pergunta.leitura),
          el('div', { class: 'rodape-cartao' },
            el('p', {}, 'Fonte: ', el('code', { text: `public.${pergunta.view}` }), ' · API REST do Supabase'),
            el('p', { text: `Decisão que sustenta: ${pergunta.decisao}` })));
        grade.append(cartao);
        cartoes.set(pergunta.id, { cartao, titulo, corpo });
      }
    });
    return cartoes;
  }

  function renderizarCartao(pergunta, partes, linhasBrutas) {
    if (!linhasBrutas.length) {
      throw new Error(`A view ${pergunta.view} respondeu sem linhas. Se as tabelas da estrela têm RLS ativo sem política de leitura, a view devolve lista vazia: confira o final de estrela.sql.`);
    }
    const normalizadas = normalizar(linhasBrutas, pergunta.numericas, pergunta.view);
    const linhas = pergunta.preparar ? pergunta.preparar(normalizadas) : normalizadas;
    const titulo = pergunta.titulo(linhas);
    const corpo = el('div', { class: 'corpo' });
    const contexto = { id: pergunta.id, abrirTabela: false };
    // O corpo entra no documento antes do desenho: o Chart.js mede o contêiner para dimensionar o canvas.
    partes.corpo.replaceWith(corpo);
    partes.corpo = corpo;
    pergunta.desenhar(corpo, linhas, contexto);
    corpo.append(tabelaDaView(pergunta, linhas, contexto.abrirTabela));
    partes.titulo.textContent = titulo;
    partes.cartao.dataset.estado = 'pronto';
    partes.cartao.removeAttribute('aria-busy');
  }

  function renderizarErro(partes, erro, config) {
    const { titulo, texto } = explicarErro(erro, config);
    partes.titulo.textContent = 'Não foi possível ler esta view';
    const corpo = el('div', { class: 'corpo' }, el('div', { class: 'estado estado-erro', role: 'alert' }, el('strong', { text: titulo }), el('p', { text: texto })));
    partes.corpo.replaceWith(corpo);
    partes.corpo = corpo;
    partes.cartao.dataset.estado = 'erro';
    partes.cartao.removeAttribute('aria-busy');
  }

  async function carregar(config) {
    configAtual = config;
    const minhaGeracao = ++geracao;
    const host = new URL(config.url).host;
    secaoConexao.hidden = true;
    barraStatus.hidden = false;
    textoStatus.textContent = `Lendo ${inteiro(PERGUNTAS.length)} views de ${host}…`;
    const cartoes = montarEsqueleto();

    const resultados = await Promise.all(PERGUNTAS.map(async pergunta => {
      const partes = cartoes.get(pergunta.id);
      try {
        const linhas = await lerView(config, pergunta.view);
        if (minhaGeracao !== geracao) return null;
        renderizarCartao(pergunta, partes, linhas);
        return { ok: true };
      } catch (erro) {
        if (minhaGeracao !== geracao) return null;
        renderizarErro(partes, erro, config);
        return { ok: false, erro };
      }
    }));
    if (minhaGeracao !== geracao) return;

    const falhas = resultados.filter(r => r && !r.ok);
    const lidas = PERGUNTAS.length - falhas.length;
    const hora = new Date().toLocaleTimeString('pt-BR');
    textoStatus.textContent = falhas.length
      ? `${inteiro(lidas)} de ${inteiro(PERGUNTAS.length)} views lidas de ${host} às ${hora}; ${inteiro(falhas.length)} com erro (detalhes nos cartões).`
      : `Conectado a ${host}: ${inteiro(lidas)} de ${inteiro(PERGUNTAS.length)} views lidas às ${hora}.`;

    const chaveRecusada = falhas.length === PERGUNTAS.length &&
      falhas.every(f => f.erro instanceof ErroView && (f.erro.status === 401 || f.erro.status === 403) && f.erro.corpo.code !== '42501');
    if (chaveRecusada) {
      mostrarFormulario('O Supabase recusou a chave em todas as views (HTTP 401). Confira a chave publicável e tente de novo.', true);
    }
  }

  function mostrarFormulario(mensagem, erro) {
    secaoConexao.hidden = false;
    mensagemForm.textContent = mensagem || '';
    mensagemForm.classList.toggle('erro', Boolean(erro));
    if (configAtual) {
      campoUrl.value = configAtual.url;
      campoChave.value = configAtual.chave;
    }
    campoUrl.focus();
  }

  form.addEventListener('submit', evento => {
    evento.preventDefault();
    const { url, erro } = normalizarUrl(campoUrl.value);
    if (erro) { mostrarMensagem(erro); campoUrl.focus(); return; }
    const chave = campoChave.value.trim();
    const problema = problemaNaChave(chave);
    if (problema) { mostrarMensagem(problema); campoChave.focus(); return; }
    const config = { url, chave };
    if (campoLembrar.checked) {
      if (!armazenamento.gravar(config)) mostrarMensagem('Este navegador não deixou guardar a chave; o painel funciona, mas vai pedir de novo na próxima visita.', false);
      else mostrarMensagem('', false);
    } else {
      armazenamento.apagar();
      mostrarMensagem('', false);
    }
    carregar(config);
  });

  function mostrarMensagem(texto, erro = true) {
    mensagemForm.textContent = texto;
    mensagemForm.classList.toggle('erro', Boolean(texto) && erro);
  }

  $('#btn-recarregar').addEventListener('click', () => { if (configAtual) carregar(configAtual); });
  $('#btn-trocar').addEventListener('click', () => mostrarFormulario('Altere a URL ou a chave e carregue de novo.'));
  $('#btn-esquecer').addEventListener('click', () => {
    armazenamento.apagar();
    configAtual = null;
    geracao++;
    painel.replaceChildren();
    barraStatus.hidden = true;
    campoChave.value = '';
    mostrarFormulario('A chave foi apagada deste navegador.');
  });

  const salva = armazenamento.ler();
  if (salva) {
    campoUrl.value = salva.url;
    campoChave.value = salva.chave;
    const { url, erro } = normalizarUrl(salva.url);
    if (!erro && !problemaNaChave(salva.chave)) carregar({ url, chave: salva.chave });
    else armazenamento.apagar();
  }
}());
