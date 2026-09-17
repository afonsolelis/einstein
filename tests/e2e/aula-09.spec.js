const { test, expect } = require('@playwright/test');

// Respostas reais do PostgREST para as views de materiais/aula-08/olist/views.sql (numeric chega como número JSON).
const RESPOSTAS = {
  vw_p01_receita_mensal: '[{"ano_mes":"2017-01","receita":111798.36,"pedidos":750,"ticket_medio":149.06}, {"ano_mes":"2017-02","receita":234223.40,"pedidos":1653,"ticket_medio":141.70}, {"ano_mes":"2017-03","receita":359198.85,"pedidos":2546,"ticket_medio":141.08}, {"ano_mes":"2017-04","receita":340669.68,"pedidos":2303,"ticket_medio":147.92}, {"ano_mes":"2017-05","receita":489338.25,"pedidos":3546,"ticket_medio":138.00}, {"ano_mes":"2017-06","receita":421923.37,"pedidos":3135,"ticket_medio":134.58}, {"ano_mes":"2017-07","receita":481604.52,"pedidos":3872,"ticket_medio":124.38}, {"ano_mes":"2017-08","receita":554699.70,"pedidos":4193,"ticket_medio":132.29}, {"ano_mes":"2017-09","receita":607399.67,"pedidos":4150,"ticket_medio":146.36}, {"ano_mes":"2017-10","receita":648247.65,"pedidos":4478,"ticket_medio":144.76}, {"ano_mes":"2017-11","receita":987765.37,"pedidos":7289,"ticket_medio":135.51}, {"ano_mes":"2017-12","receita":726033.19,"pedidos":5513,"ticket_medio":131.69}, {"ano_mes":"2018-01","receita":924645.00,"pedidos":7069,"ticket_medio":130.80}, {"ano_mes":"2018-02","receita":826437.13,"pedidos":6555,"ticket_medio":126.08}, {"ano_mes":"2018-03","receita":953356.25,"pedidos":7003,"ticket_medio":136.14}, {"ano_mes":"2018-04","receita":973534.09,"pedidos":6798,"ticket_medio":143.21}, {"ano_mes":"2018-05","receita":977544.69,"pedidos":6749,"ticket_medio":144.84}, {"ano_mes":"2018-06","receita":856077.86,"pedidos":6099,"ticket_medio":140.36}, {"ano_mes":"2018-07","receita":867953.46,"pedidos":6159,"ticket_medio":140.92}, {"ano_mes":"2018-08","receita":838576.64,"pedidos":6351,"ticket_medio":132.04}]',
  vw_p02_dia_hora: '[{"dia_semana":1,"nome_dia_semana":"segunda","faixa_horario":"1 madrugada","pedidos":583}, {"dia_semana":1,"nome_dia_semana":"segunda","faixa_horario":"2 manhã","pedidos":3483}, {"dia_semana":1,"nome_dia_semana":"segunda","faixa_horario":"3 tarde","pedidos":6050}, {"dia_semana":1,"nome_dia_semana":"segunda","faixa_horario":"4 noite","pedidos":5544}, {"dia_semana":2,"nome_dia_semana":"terça","faixa_horario":"1 madrugada","pedidos":610}, {"dia_semana":2,"nome_dia_semana":"terça","faixa_horario":"2 manhã","pedidos":3597}, {"dia_semana":2,"nome_dia_semana":"terça","faixa_horario":"3 tarde","pedidos":5960}, {"dia_semana":2,"nome_dia_semana":"terça","faixa_horario":"4 noite","pedidos":5282}, {"dia_semana":3,"nome_dia_semana":"quarta","faixa_horario":"1 madrugada","pedidos":724}, {"dia_semana":3,"nome_dia_semana":"quarta","faixa_horario":"2 manhã","pedidos":3620}, {"dia_semana":3,"nome_dia_semana":"quarta","faixa_horario":"3 tarde","pedidos":5804}, {"dia_semana":3,"nome_dia_semana":"quarta","faixa_horario":"4 noite","pedidos":4893}, {"dia_semana":4,"nome_dia_semana":"quinta","faixa_horario":"1 madrugada","pedidos":678}, {"dia_semana":4,"nome_dia_semana":"quinta","faixa_horario":"2 manhã","pedidos":3396}, {"dia_semana":4,"nome_dia_semana":"quinta","faixa_horario":"3 tarde","pedidos":5652}, {"dia_semana":4,"nome_dia_semana":"quinta","faixa_horario":"4 noite","pedidos":4555}, {"dia_semana":5,"nome_dia_semana":"sexta","faixa_horario":"1 madrugada","pedidos":806}, {"dia_semana":5,"nome_dia_semana":"sexta","faixa_horario":"2 manhã","pedidos":3407}, {"dia_semana":5,"nome_dia_semana":"sexta","faixa_horario":"3 tarde","pedidos":5404}, {"dia_semana":5,"nome_dia_semana":"sexta","faixa_horario":"4 noite","pedidos":4029}, {"dia_semana":6,"nome_dia_semana":"sábado","faixa_horario":"1 madrugada","pedidos":626}, {"dia_semana":6,"nome_dia_semana":"sábado","faixa_horario":"2 manhã","pedidos":2131}, {"dia_semana":6,"nome_dia_semana":"sábado","faixa_horario":"3 tarde","pedidos":4043}, {"dia_semana":6,"nome_dia_semana":"sábado","faixa_horario":"4 noite","pedidos":3719}, {"dia_semana":7,"nome_dia_semana":"domingo","faixa_horario":"1 madrugada","pedidos":555}, {"dia_semana":7,"nome_dia_semana":"domingo","faixa_horario":"2 manhã","pedidos":1891}, {"dia_semana":7,"nome_dia_semana":"domingo","faixa_horario":"3 tarde","pedidos":4170}, {"dia_semana":7,"nome_dia_semana":"domingo","faixa_horario":"4 noite","pedidos":4999}]',
  vw_p03_top_categorias: '[{"categoria":"beleza_saude","receita":1229557.50,"participacao_pct":9.3,"pedidos":8610,"ticket_medio":142.81}, {"categoria":"relogios_presentes","receita":1163465.91,"participacao_pct":8.8,"pedidos":5491,"ticket_medio":211.89}, {"categoria":"cama_mesa_banho","receita":1022955.77,"participacao_pct":7.8,"pedidos":9267,"ticket_medio":110.39}, {"categoria":"esporte_lazer","receita":952840.40,"participacao_pct":7.2,"pedidos":7513,"ticket_medio":126.83}, {"categoria":"informatica_acessorios","receita":888055.59,"participacao_pct":6.7,"pedidos":6518,"ticket_medio":136.25}, {"categoria":"moveis_decoracao","receita":706237.17,"participacao_pct":5.4,"pedidos":6258,"ticket_medio":112.85}, {"categoria":"utilidades_domesticas","receita":614341.62,"participacao_pct":4.7,"pedidos":5734,"ticket_medio":107.14}, {"categoria":"cool_stuff","receita":609158.00,"participacao_pct":4.6,"pedidos":3552,"ticket_medio":171.50}, {"categoria":"automotivo","receita":577838.39,"participacao_pct":4.4,"pedidos":3802,"ticket_medio":151.98}, {"categoria":"ferramentas_jardim","receita":469135.40,"participacao_pct":3.6,"pedidos":3443,"ticket_medio":136.26}]',
  vw_p04_crescimento_categorias: '[{"categoria":"bebes","receita_2017":67998.26,"receita_2018":250615.79,"crescimento_pct":268.6}, {"categoria":"relogios_presentes","receita_2017":201137.86,"receita_2018":687855.20,"crescimento_pct":242.0}, {"categoria":"beleza_saude","receita_2017":243521.70,"receita_2018":755724.50,"crescimento_pct":210.3}, {"categoria":"utilidades_domesticas","receita_2017":127534.54,"receita_2018":391823.46,"crescimento_pct":207.2}, {"categoria":"telefonia","receita_2017":57472.64,"receita_2018":174123.68,"crescimento_pct":203.0}, {"categoria":"automotivo","receita_2017":125247.48,"receita_2018":343288.30,"crescimento_pct":174.1}, {"categoria":"esporte_lazer","receita_2017":216724.33,"receita_2018":517166.26,"crescimento_pct":138.6}, {"categoria":"informatica_acessorios","receita_2017":214631.27,"receita_2018":496269.30,"crescimento_pct":131.2}, {"categoria":"moveis_decoracao","receita_2017":170858.58,"receita_2018":381649.57,"crescimento_pct":123.4}, {"categoria":"cama_mesa_banho","receita_2017":254444.82,"receita_2018":532358.85,"crescimento_pct":109.2}]',
  vw_p05_receita_estado: '[{"estado":"SP","receita":5057381.81,"participacao_pct":38.4,"pedidos":40410}, {"estado":"RJ","receita":1751414.46,"participacao_pct":13.3,"pedidos":12312}, {"estado":"MG","receita":1547967.86,"participacao_pct":11.7,"pedidos":11316}, {"estado":"RS","receita":726453.92,"participacao_pct":5.5,"pedidos":5328}, {"estado":"PR","receita":663093.13,"participacao_pct":5.0,"pedidos":4901}, {"estado":"SC","receita":504472.07,"participacao_pct":3.8,"pedidos":3538}, {"estado":"BA","receita":493109.27,"participacao_pct":3.7,"pedidos":3251}, {"estado":"DF","receita":294653.94,"participacao_pct":2.2,"pedidos":2071}, {"estado":"GO","receita":282219.20,"participacao_pct":2.1,"pedidos":1949}, {"estado":"ES","receita":267873.56,"participacao_pct":2.0,"pedidos":1993}, {"estado":"PE","receita":250428.39,"participacao_pct":1.9,"pedidos":1586}, {"estado":"CE","receita":218339.50,"participacao_pct":1.7,"pedidos":1275}, {"estado":"PA","receita":173382.99,"participacao_pct":1.3,"pedidos":942}, {"estado":"MT","receita":152228.92,"participacao_pct":1.2,"pedidos":885}, {"estado":"MA","receita":116617.92,"participacao_pct":0.9,"pedidos":716}, {"estado":"MS","receita":115260.07,"participacao_pct":0.9,"pedidos":700}, {"estado":"PB","receita":112288.03,"participacao_pct":0.9,"pedidos":514}, {"estado":"PI","receita":84511.00,"participacao_pct":0.6,"pedidos":475}, {"estado":"RN","receita":81376.97,"participacao_pct":0.6,"pedidos":470}, {"estado":"AL","receita":78805.73,"participacao_pct":0.6,"pedidos":396}, {"estado":"SE","receita":56464.83,"participacao_pct":0.4,"pedidos":333}, {"estado":"TO","receita":48402.51,"participacao_pct":0.4,"pedidos":274}, {"estado":"RO","receita":45801.66,"participacao_pct":0.3,"pedidos":244}, {"estado":"AM","receita":22155.84,"participacao_pct":0.2,"pedidos":145}, {"estado":"AC","receita":15930.97,"participacao_pct":0.1,"pedidos":80}, {"estado":"AP","receita":13374.81,"participacao_pct":0.1,"pedidos":67}, {"estado":"RR","receita":7017.77,"participacao_pct":0.1,"pedidos":40}]',
  vw_p06_frete_regiao: '[{"regiao":"Norte","frete_sobre_preco_pct":22.7,"frete_medio_item":36.82,"itens":2012}, {"regiao":"Nordeste","frete_sobre_preco_pct":21.7,"frete_medio_item":32.26,"itens":10053}, {"regiao":"Sul","frete_sobre_preco_pct":17.7,"frete_medio_item":21.19,"itens":15817}, {"regiao":"Centro-Oeste","frete_sobre_preco_pct":17.6,"frete_medio_item":22.99,"itens":6457}, {"regiao":"Sudeste","frete_sobre_preco_pct":15.2,"frete_medio_item":17.34,"itens":75541}]',
  vw_p07_atraso_estado: '[{"estado":"MA","entregas":716,"atraso_pct":17.5,"dias_entrega_medio":21.4}, {"estado":"CE","entregas":1275,"atraso_pct":13.8,"dias_entrega_medio":21.2}, {"estado":"RJ","entregas":12312,"atraso_pct":12.2,"dias_entrega_medio":15.2}, {"estado":"BA","entregas":3251,"atraso_pct":12.2,"dias_entrega_medio":19.3}, {"estado":"PA","entregas":942,"atraso_pct":11.3,"dias_entrega_medio":23.7}, {"estado":"ES","entregas":1993,"atraso_pct":10.7,"dias_entrega_medio":15.7}, {"estado":"PB","entregas":514,"atraso_pct":10.3,"dias_entrega_medio":20.3}, {"estado":"MS","entregas":700,"atraso_pct":9.7,"dias_entrega_medio":15.5}, {"estado":"PE","entregas":1586,"atraso_pct":9.7,"dias_entrega_medio":18.4}, {"estado":"SC","entregas":3538,"atraso_pct":8.2,"dias_entrega_medio":14.9}, {"estado":"GO","entregas":1949,"atraso_pct":6.5,"dias_entrega_medio":15.5}, {"estado":"MT","entregas":885,"atraso_pct":6.1,"dias_entrega_medio":18.0}, {"estado":"RS","entregas":5327,"atraso_pct":6.1,"dias_entrega_medio":15.2}, {"estado":"DF","entregas":2071,"atraso_pct":5.6,"dias_entrega_medio":12.9}, {"estado":"MG","entregas":11316,"atraso_pct":4.6,"dias_entrega_medio":11.9}, {"estado":"SP","entregas":40403,"atraso_pct":4.5,"dias_entrega_medio":8.7}, {"estado":"PR","entregas":4901,"atraso_pct":4.1,"dias_entrega_medio":11.9}]',
  vw_p08_nota_prazo: '[{"entrega":"no prazo","pedidos_avaliados":89182,"nota_media":4.29,"notas_1_e_2_pct":9.2}, {"entrega":"com atraso","pedidos_avaliados":6378,"nota_media":2.27,"notas_1_e_2_pct":62.4}]',
  vw_p09_recompra: '[{"clientes":93104,"clientes_recorrentes":2789,"recompra_pct":3.00}]',
  vw_p10_concentracao_vendedores: '[{"decil":1,"vendedores":295,"receita":8837182.78,"participacao_pct":67.0}, {"decil":2,"vendedores":295,"receita":2002125.41,"participacao_pct":15.2}, {"decil":3,"vendedores":295,"receita":1024699.74,"participacao_pct":7.8}, {"decil":4,"vendedores":295,"receita":550128.39,"participacao_pct":4.2}, {"decil":5,"vendedores":295,"receita":327772.65,"participacao_pct":2.5}, {"decil":6,"vendedores":294,"receita":202899.34,"participacao_pct":1.5}, {"decil":7,"vendedores":294,"receita":118313.50,"participacao_pct":0.9}, {"decil":8,"vendedores":294,"receita":67565.65,"participacao_pct":0.5}, {"decil":9,"vendedores":294,"receita":36697.29,"participacao_pct":0.3}, {"decil":10,"vendedores":294,"receita":13642.38,"participacao_pct":0.1}]',
};

const SUPABASE_URL = 'https://teste-aula09.supabase.co';
const CHAVE = 'sb_publishable_chave_de_teste_aula09';
const ORDEM_NARRATIVA = ['p01', 'p05', 'p03', 'p10', 'p09', 'p07', 'p08', 'p04', 'p06', 'p02'];
const DASHBOARD = '/materiais/aula-09/dashboard-referencia/index.html';

// Substituto do Chart.js: registra a configuração de cada gráfico sem depender do CDN.
const CHART_STUB = `
  window.__graficos = [];
  window.Chart = class {
    constructor(canvas, config) {
      window.__graficos.push({
        card: canvas.closest('[data-card]').dataset.card,
        type: config.type,
        indexAxis: config.options && config.options.indexAxis,
        labels: config.data.labels,
        data: config.data.datasets.map(serie => serie.data)
      });
    }
    destroy() {}
  };
  window.Chart.defaults = { font: {}, plugins: {} };
`;

const TITULOS_ESPERADOS = {
  p01: ['R$ 111,8 mil (jan/17)', 'R$ 838,6 mil (ago/18)', 'pico de R$ 987,8 mil em nov/17'],
  p02: ['Segunda tem mais pedidos (15.660)', 'sábado, menos (10.519)', 'tarde', '(37.083)'],
  p03: ['beleza_saude lidera com 9,3% da receita', 'relogios_presentes tem o maior ticket (R$ 211,89)'],
  p04: ['bebes cresceu 268,6%', 'partiu de R$ 68,0 mil', 'beleza_saude somou mais'],
  p05: ['SP concentra 38,4% da receita', 'chega a 63,4%'],
  p06: ['No Norte', '22,7% do preço (R$ 36,82 por item)', 'no Sudeste, a 15,2% (R$ 17,34)'],
  p07: ['MA atrasa 17,5% das entregas', 'RJ pesa mais: 12.312 entregas, 12,2% com atraso'],
  p08: ['cai de 4,29 para 2,27', '62,4% das avaliações são 1 ou 2'],
  p09: ['3,00% dos clientes voltaram a comprar', '2.789 de 93.104'],
  p10: ['295 vendedores do 1º decil geram 67,0% da receita', '5 decis inferiores somam 3,3%']
};

const normalizar = texto => texto.replace(/\s+/g, ' ').trim();

function watchPage(page) {
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) errors.push(`HTTP ${response.status()}: ${url.pathname}`);
  });
  return errors;
}

async function prepararDashboard(page, { status = 200, respostas = RESPOSTAS, corpoErro, chart = 'stub', falhar = [] } = {}) {
  const chamadas = [];
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/**', route => (chart === 'stub'
    ? route.fulfill({ status: 200, contentType: 'application/javascript', body: CHART_STUB })
    : route.abort('internetdisconnected')));
  await page.route(`${SUPABASE_URL}/rest/v1/*`, route => {
    const request = route.request();
    const url = new URL(request.url());
    const view = url.pathname.split('/').pop();
    chamadas.push({ view, search: url.search, apikey: request.headers()['apikey'], authorization: request.headers()['authorization'] });
    if (status !== 200) {
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(corpoErro) });
    }
    if (falhar.includes(view)) {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST205', details: null, hint: null, message: `Could not find the table 'public.${view}' in the schema cache` }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: respostas[view] });
  });
  await page.goto(DASHBOARD);
  return chamadas;
}

async function conectar(page, chave = CHAVE) {
  await page.fill('#supabase-url', `${SUPABASE_URL}/rest/v1/`);
  await page.fill('#supabase-chave', chave);
  await page.click('#form-conexao button[type="submit"]');
}

async function semOverflowHorizontal(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test('slides da aula 9 navegam por botões e teclado, sem corte e sem erros', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-09.html');
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  const total = await page.locator('.slide').count();
  expect(total).toBeGreaterThanOrEqual(20);
  await expect(page.locator('#slide-counter')).toHaveText(`1 / ${total}`);
  await expect(previous).toBeDisabled();

  for (let index = 0; index < total; index += 1) {
    if (index > 0) await next.click();
    const dimensions = await page.locator('.slide.active').evaluate(element => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth
    }));
    expect(dimensions.scrollHeight, `slide ${index + 1} foi cortado verticalmente`).toBeLessThanOrEqual(dimensions.clientHeight);
    expect(dimensions.scrollWidth, `slide ${index + 1} foi cortado horizontalmente`).toBeLessThanOrEqual(dimensions.clientWidth);
  }
  await expect(next).toBeDisabled();
  await expect(page.locator('#slide-counter')).toHaveText(`${total} / ${total}`);

  await page.locator('body').press('ArrowLeft');
  await expect(page.locator('#slide-counter')).toHaveText(`${total - 1} / ${total}`);
  await page.locator('body').press('Space');
  await expect(page.locator('#slide-counter')).toHaveText(`${total} / ${total}`);
  expect(errors).toEqual([]);
});

test('slide de arquitetura desenha o caminho navegador → Pages → API → views', async ({ page }) => {
  await page.goto('/slides/aula-09.html');
  const indice = await page.locator('.slide').evaluateAll(slides => slides.findIndex(slide => slide.dataset.slide === 'arquitetura'));
  expect(indice).toBeGreaterThan(0);
  for (let i = 0; i < indice; i += 1) await page.locator('#btn-next').click();
  const slide = page.locator('.slide.active');
  await expect(slide.locator('h2')).toHaveText('Quem conversa com quem');
  const svg = slide.locator('svg:visible');
  await expect(svg).toHaveCount(1);
  for (const texto of ['GitHub Pages', 'Navegador', 'API REST', 'Views', 'Estrela']) {
    await expect(svg.locator('text', { hasText: texto }).first()).toBeVisible();
  }
  const caixa = await svg.boundingBox();
  const viewport = page.viewportSize();
  expect(caixa.width).toBeLessThanOrEqual(viewport.width);
});

test('slides e material apontam um para o outro e para o dashboard de referência', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-09.html');
  await expect(page.locator('#controls a[href="../index.html"]')).toHaveCount(1);
  await expect(page.locator('#controls a[href="../materiais/aula-09/dashboard-referencia/index.html"]')).toHaveCount(1);
  await page.locator('#controls a[href="../materiais/aula-09/index.html"]').click();
  await expect(page).toHaveURL(/\/materiais\/aula-09\/index\.html$/);
  await expect(page.locator('h1')).toHaveText('Dashboard online: GitHub Pages lendo o Supabase');
  await expect(page.locator('.floating-nav a[href="../../slides/aula-09.html"]')).toHaveCount(1);
  await expect(page.locator('.actions a[href="dashboard-referencia/index.html"]')).toHaveCount(1);
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: CHART_STUB }));
  await page.locator('.actions a[href="dashboard-referencia/index.html"]').click();
  await expect(page).toHaveURL(/\/materiais\/aula-09\/dashboard-referencia\/index\.html$/);
  await expect(page.locator('#form-conexao')).toBeVisible();
  await expect(page.locator('a[href="../index.html"]')).toHaveCount(1);
  await expect(page.locator('a[href="../../../slides/aula-09.html"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('material da aula 9 cobre arquitetura, chaves, código, publicação e erros sem transbordar', async ({ page, request }) => {
  const errors = watchPage(page);
  await page.goto('/materiais/aula-09/index.html');
  for (const secao of ['objectives', 'concepts', 'guided-practice', 'challenge', 'checklist', 'summary', 'next-steps']) {
    await expect(page.locator(`[data-lesson-section="${secao}"]`).first()).toBeAttached();
  }
  const conteudo = normalizar(await page.locator('.content').innerText());
  for (const trecho of [
    'Project Settings → API Keys', 'sb_publishable_', 'sb_secret_', 'Authorization: Bearer',
    'Intl.NumberFormat', 'Number(', 'chart.js@4.4.1', 'python -m http.server 8000', 'PORTS',
    'Settings → Pages', 'Deploy from a branch', '/(root)', 'https://<usuario>.github.io/<repo>/aula-09-seunome/',
    'PGRST205', 'Invalid API key', "notify pgrst, 'reload schema';", 'Quase nunca é CORS', 'fork precisa ser público',
    'vw_p01_receita_mensal', 'vw_p09_recompra', 'security_invoker = on', 'leitura_publica', 'ESPECIFICACAO.md'
  ]) {
    expect(conteudo, `material sem "${trecho}"`).toContain(trecho);
  }
  expect(await page.locator('.code-block').count()).toBeGreaterThanOrEqual(12);
  await expect(page.locator('.copy-prompt')).toHaveCount(1);
  await expect(page.locator('.figura svg:visible')).toHaveCount(1);

  const locais = await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => !/^(https?:|mailto:|#)/.test(href)));
  for (const href of locais) {
    expect(href.endsWith('/'), `link para diretório: ${href}`).toBe(false);
    const alvo = new URL(href, page.url());
    const resposta = await request.get(alvo.pathname);
    expect(resposta.status(), `link quebrado: ${href}`).toBe(200);
  }
  expect(await semOverflowHorizontal(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('dashboard de referência lê as dez views e desenha os cartões na ordem narrativa', async ({ page }) => {
  const errors = watchPage(page);
  const chamadas = await prepararDashboard(page);
  await expect(page.locator('#status')).toBeHidden();
  await conectar(page);

  await expect(page.locator('[data-card][data-estado="pronto"]')).toHaveCount(10);
  const ordem = await page.locator('[data-card]').evaluateAll(cards => cards.map(card => card.dataset.card));
  expect(ordem).toEqual(ORDEM_NARRATIVA);
  await expect(page.locator('#status-texto')).toContainText('10 de 10 views lidas');

  for (const [id, trechos] of Object.entries(TITULOS_ESPERADOS)) {
    const titulo = normalizar(await page.locator(`[data-card="${id}"] h3`).innerText());
    for (const trecho of trechos) expect(titulo, `título de ${id}`).toContain(trecho);
    const cartao = normalizar(await page.locator(`[data-card="${id}"]`).innerText());
    expect(cartao, `${id} sem período`).toMatch(/jan\/2017 a ago\/2018|janeiro a agosto/);
    expect(cartao, `${id} sem fonte`).toContain(`Fonte: public.vw_${id}_`);
  }
  const kpis = normalizar(await page.locator('[data-card="p01"] .kpis').innerText());
  expect(kpis).toContain('R$ 13.181.027,13');
  expect(kpis).toContain('96.211');

  expect(chamadas).toHaveLength(10);
  for (const chamada of chamadas) {
    expect(chamada.search).toBe('?select=*');
    expect(chamada.apikey).toBe(CHAVE);
    expect(chamada.authorization).toBe(`Bearer ${CHAVE}`);
  }

  const graficos = await page.evaluate(() => window.__graficos);
  const porCartao = Object.fromEntries(graficos.map(g => [g.card, g]));
  expect(Object.keys(porCartao).sort()).toEqual(['p01', 'p03', 'p04', 'p05', 'p06', 'p07', 'p10']);
  expect(porCartao.p01.type).toBe('line');
  expect(porCartao.p01.labels).toHaveLength(20);
  expect(porCartao.p01.labels[10]).toBe('nov/17');
  expect(porCartao.p01.data[0][10]).toBe(987765.37);
  expect(porCartao.p05.indexAxis).toBe('y');
  expect(porCartao.p05.labels).toEqual(['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'DF', 'GO', 'ES', 'Outros (17)']);
  expect(porCartao.p03.data[0][0]).toBe(1229557.5);
  expect(porCartao.p04.data).toHaveLength(2);
  expect(porCartao.p07.labels[0]).toBe('MA');
  expect(porCartao.p10.data[0][0]).toBe(67);

  await expect(page.locator('[data-card="p02"] table.calor tbody tr')).toHaveCount(8);
  await expect(page.locator('[data-card="p09"] .waffle i.on')).toHaveCount(3);
  const linhasP05 = page.locator('[data-card="p05"] details.dados');
  await linhasP05.locator('summary').click();
  await expect(linhasP05.locator('tbody tr')).toHaveCount(27);
  await expect(linhasP05.locator('th').first()).toHaveText('estado');

  expect(await semOverflowHorizontal(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);

  const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem('einstein-aula09-dashboard-referencia')));
  expect(salvo).toEqual({ url: SUPABASE_URL, chave: CHAVE });
  await page.reload();
  await expect(page.locator('#conexao')).toBeHidden();
  await expect(page.locator('[data-card][data-estado="pronto"]')).toHaveCount(10);
  await page.click('#btn-esquecer');
  await expect(page.locator('#conexao')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('einstein-aula09-dashboard-referencia'))).toBeNull();
});

test('dashboard mostra erro legível quando o Supabase recusa a chave (401)', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await prepararDashboard(page, { status: 401, corpoErro: { message: 'Invalid API key', hint: 'Double check your Supabase `anon` or `service_role` API key.' } });
  await conectar(page, 'sb_publishable_chave_errada');

  await expect(page.locator('[data-card][data-estado="erro"]')).toHaveCount(10);
  await expect(page.locator('[data-card="p01"] .estado-erro')).toContainText('HTTP 401: chave recusada pelo Supabase');
  await expect(page.locator('[data-card="p01"] .estado-erro')).toContainText('Invalid API key');
  await expect(page.locator('#conexao')).toBeVisible();
  await expect(page.locator('#mensagem-form')).toContainText('HTTP 401');
  await expect(page.locator('#status-texto')).toContainText('10 com erro');
  expect(await semOverflowHorizontal(page)).toBeLessThanOrEqual(0);
  expect(pageErrors).toEqual([]);
});

test('dashboard isola a falha de uma view inexistente (404) nos demais cartões', async ({ page }) => {
  await prepararDashboard(page, { falhar: ['vw_p09_recompra'] });
  await conectar(page);
  await expect(page.locator('[data-card][data-estado="pronto"]')).toHaveCount(9);
  const erro = page.locator('[data-card="p09"][data-estado="erro"] .estado-erro');
  await expect(erro).toContainText('HTTP 404');
  await expect(erro).toContainText("notify pgrst, 'reload schema';");
  await expect(page.locator('#conexao')).toBeHidden();
});

test('dashboard recusa chave secreta antes de chamar a API', async ({ page }) => {
  const chamadas = await prepararDashboard(page);
  await conectar(page, 'sb_secret_nao_pode_ir_para_o_html');
  await expect(page.locator('#mensagem-form')).toContainText('chave secreta');
  await expect(page.locator('[data-card]')).toHaveCount(0);
  expect(chamadas).toHaveLength(0);
  expect(await page.evaluate(() => localStorage.getItem('einstein-aula09-dashboard-referencia'))).toBeNull();
});

test('dashboard converte valores em texto e continua legível sem o CDN do Chart.js', async ({ page }) => {
  const comoTexto = Object.fromEntries(Object.entries(RESPOSTAS).map(([view, corpo]) => [
    view,
    JSON.stringify(JSON.parse(corpo).map(linha => Object.fromEntries(Object.entries(linha).map(([coluna, valor]) => [coluna, String(valor)]))))
  ]));
  await prepararDashboard(page, { respostas: comoTexto, chart: 'offline' });
  await conectar(page);
  await expect(page.locator('[data-card][data-estado="pronto"]')).toHaveCount(10);
  for (const [id, trechos] of Object.entries(TITULOS_ESPERADOS)) {
    const titulo = normalizar(await page.locator(`[data-card="${id}"] h3`).innerText());
    for (const trecho of trechos) expect(titulo, `título de ${id} com valores em texto`).toContain(trecho);
  }
  await expect(page.locator('.estado-aviso', { hasText: 'Chart.js não carregou' })).toHaveCount(7);
  await expect(page.locator('[data-card="p05"] details.dados')).toHaveAttribute('open', '');
});

test('nenhum número de referência está digitado no HTML ou no JavaScript do dashboard', async ({ request }) => {
  const arquivos = ['index.html', 'app.js'].map(nome => `/materiais/aula-09/dashboard-referencia/${nome}`);
  for (const caminho of arquivos) {
    const texto = await (await request.get(caminho)).text();
    for (const numero of ['13.181.027', '13181027', '987.765', '987765', '38,4', '67,0', '2.789', '2789', '93.104', '93104', '4,29', '268,6', '15.660', '15660', '22,7', '17,5', '12.312', '12312']) {
      expect(texto, `${caminho} contém ${numero}`).not.toContain(numero);
    }
  }
});
