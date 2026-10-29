const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// As páginas do TBL falam com o contrato próprio do app (aulas-projeto, ADR-18): /static/js/aulas.js e
// /api/v1/einstein/tbl/{sala}/... Aqui o app é simulado em memória com as regras do modelo único
// (app/rpc/tbl/modelo.py, parâmetros do Einstein) e o cliente aulas.js vem do repositório do app, ao lado deste.
const AULAS_JS = process.env.AULAS_JS || path.join(__dirname, '..', '..', '..', 'aulas-projeto', 'app', 'static', 'js', 'aulas.js');

function fakeRoom() {
  const TOKEN = 'token-de-teste';
  const db = { fase: 'lobby', endsAt: null, participants: new Map(), votes: new Map() };
  const now = () => Date.now();
  const fail = (status, codigo, mensagem) => ({ status, body: { erro: { codigo, mensagem } } });
  const next = { voto1: ['discussao', 600], discussao: ['voto2', 100], voto2: ['revelacao', null] };
  // Avanço pelo relógio (Einstein): cada fase vencida passa à seguinte.
  const clock = () => {
    while (next[db.fase] && db.endsAt != null && now() >= db.endsAt) {
      const [fase, d] = next[db.fase];
      db.fase = fase; db.endsAt = d == null ? null : db.endsAt + d * 1000;
    }
  };
  const distribution = round => [0, 1, 2, 3].map(escolha => ({
    escolha,
    votos: [...db.votes].filter(([key, c]) => key.endsWith(`:${round}`) && c === escolha).length
  }));
  const trajetos = () => {
    const t = [];
    for (const pid of db.participants.keys()) {
      const a = db.votes.get(`${pid}:1`), b = db.votes.get(`${pid}:2`);
      if (a == null || b == null) continue;
      const x = t.find(y => y.de === a && y.para === b);
      x ? x.pessoas++ : t.push({ de: a, para: b, pessoas: 1 });
    }
    return t;
  };
  const state = id => {
    clock();
    const f = db.fase;
    const meus = {};
    for (const r of [1, 2]) if (db.votes.has(`${id}:${r}`)) meus[r] = { escolha: db.votes.get(`${id}:${r}`), justificativa: null };
    const s = {
      caso_titulo: 'Caso', caso_texto: 'Texto do caso',
      alternativas: f === 'lobby' ? null : ['A', 'B', 'C', 'D'].map(letra => ({ letra, titulo: `Opção ${letra}`, texto: 'x', ganho: 'g', custo: 'c' })),
      fase: f, restante: db.endsAt ? Math.max(0, Math.ceil((db.endsAt - now()) / 1000)) : null,
      participantes: db.participants.size, inscritos: db.participants.size,
      inscrito: db.participants.has(id), meus_votos: meus
    };
    if (['discussao', 'voto2', 'revelacao'].includes(f)) s.rodada1 = distribution(1);
    if (f === 'revelacao') Object.assign(s, { rodada2: distribution(2), trajetos: trajetos() });
    return s;
  };
  const painel = () => ({
    ...state(null),
    alternativas: ['A', 'B', 'C', 'D'].map(letra => ({ letra, titulo: `Opção ${letra}`, texto: 'x', ganho: 'g', custo: 'c' })),
    rodada1: distribution(1), rodada2: distribution(2), trajetos: trajetos(),
    votos1: [...db.votes.keys()].filter(k => k.endsWith(':1')).length,
    votos2: [...db.votes.keys()].filter(k => k.endsWith(':2')).length,
    turma: [...db.participants].map(([id, nome]) => ({ nome, online: true, r1: db.votes.get(`${id}:1`) ?? null, r2: db.votes.get(`${id}:2`) ?? null }))
  });
  const authorized = headers => headers.authorization === `Bearer ${TOKEN}`;
  const api = {
    entrar: ({ body }) => {
      const dono = [...db.participants].find(([, n]) => n.toLowerCase() === body.nome.toLowerCase());
      if (dono && dono[0] !== body.participante) return fail(409, 'nome_em_uso', 'Esse nome já está em uso nesta sala. Escolha outro.');
      db.participants.set(body.participante, body.nome);
      return { participante: body.participante, nome: body.nome };
    },
    votar: ({ body }) => {
      if (!db.participants.has(body.participante)) return fail(404, 'participante_inexistente', 'Participante não encontrado. Entre novamente na sala.');
      clock();
      if (db.fase !== `voto${body.rodada}`) return fail(409, 'rodada_fechada', 'Esta rodada não está aberta.');
      db.votes.set(`${body.participante}:${body.rodada}`, body.escolha);
      return { questao: 1, rodada: body.rodada, escolha: body.escolha };
    },
    estado: ({ query }) => state(query.get('participante')),
    host: ({ body, headers }) => {
      if (!authorized(headers)) return fail(401, 'nao_autenticado', 'Token do professor inválido.');
      clock();
      const open = (fase, seconds) => { db.fase = fase; db.endsAt = now() + seconds * 1000; };
      const a = body.acao;
      if (a === 'iniciar') { db.votes.clear(); open('voto1', 100); }
      if (a === 'avancar') {
        if (db.fase === 'lobby') open('voto1', 100);
        else if (db.fase === 'voto1') open('discussao', 600);
        else if (db.fase === 'discussao') open('voto2', 100);
        else if (db.fase === 'voto2') { db.fase = 'revelacao'; db.endsAt = null; }
      }
      if (a === 'estender') db.endsAt += 60_000;
      if (a === 'revelar') { db.fase = 'revelacao'; db.endsAt = null; }
      if (a === 'lobby') { db.fase = 'lobby'; db.endsAt = null; db.votes.clear(); }
      if (a === 'reiniciar') { db.fase = 'lobby'; db.endsAt = null; db.votes.clear(); db.participants.clear(); }
      return painel();
    }
  };
  const offline = new Set();
  const attach = async context => {
    await context.route('**/static/js/aulas.js', route => route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(AULAS_JS, 'utf-8') }));
    // Sem tempo real na simulação: as páginas seguem com a consulta a cada 2 s.
    await context.route('**/api/v1/einstein/eventos*', route => route.fulfill({ status: 204, body: '' }));
    await context.route('**/api/v1/einstein/tbl/*/*', async route => {
      const url = new URL(route.request().url());
      const acao = url.pathname.split('/').pop();
      if (offline.has(acao)) { offline.delete(acao); return route.abort('internetdisconnected'); }
      const result = api[acao]({ body: route.request().postDataJSON() || {}, query: url.searchParams, headers: route.request().headers() });
      const failed = result && result.body && result.body.erro;
      await route.fulfill({ status: failed ? result.status : 200, contentType: 'application/json', body: JSON.stringify(failed ? result.body : result) });
    });
  };
  return { TOKEN, db, attach, offline };
}

async function openHost(browser, room) {
  const context = await browser.newContext();
  await room.attach(context);
  const page = await context.newPage();
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/tbl/aula-06/painel.html');
  await page.fill('#token', room.TOKEN);
  await page.click('#token-form button');
  await expect(page.locator('#dashboard')).toBeVisible();
  return page;
}

async function openStudent(browser, room, name) {
  const context = await browser.newContext();
  await room.attach(context);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tbl/aula-06/index.html');
  await page.fill('#name', name);
  await page.click('#join-form button');
  await expect(page.locator('#room')).toBeVisible();
  return { page, errors };
}

test('fluxo completo do TBL: duas rodadas, debate e revelação', async ({ browser }) => {
  const room = fakeRoom();
  const host = await openHost(browser, room);
  const ana = await openStudent(browser, room, 'Ana');
  const bruno = await openStudent(browser, room, 'Bruno');

  await host.click('[data-action="start"]');
  await expect(host.locator('#host-message')).toHaveText('Sequência iniciada: 100 s + 10 min + 100 s.');
  await expect(host.locator('#phase')).toHaveText('Rodada 1');

  await expect(ana.page.locator('[data-choice]')).toHaveCount(4);
  await ana.page.click('[data-choice="2"]');
  await ana.page.click('[data-choice="0"]');
  await expect(ana.page.locator('#message')).toContainText('Escolha A registrada');
  await expect(ana.page.locator('[data-choice="0"]')).toHaveAttribute('aria-pressed', 'true');
  await bruno.page.click('[data-choice="1"]');
  await expect(host.locator('#progress')).toHaveText('· 2 de 2 votaram');

  await host.click('[data-action="advance"]');
  await expect(host.locator('#host-message')).toHaveText('Fase avançada.');
  await expect(ana.page.locator('#phase')).toHaveText('Discussão');
  await expect(ana.page.locator('#content')).toContainText('Você escolheu A');
  await expect(ana.page.locator('.bars')).toHaveCount(0);
  await expect(ana.page.locator('#content > :first-child')).toContainText('Texto do caso');
  await expect(ana.page.locator('#content .option')).toHaveCount(4);
  await expect(ana.page.locator('[data-choice]')).toHaveCount(0);
  await expect(ana.page.locator('#content .option.selected')).toHaveCount(1);
  await expect(host.locator('#host-content .bars')).toHaveCount(1);
  await expect(host.locator('#host-content')).toContainText('Texto do caso');
  await expect(host.locator('#host-content .option')).toHaveCount(4);

  await host.click('[data-action="extend"]');
  await expect(host.locator('#host-message')).toHaveText('Mais 1 minuto na fase atual.');
  await expect(host.locator('#phase')).toHaveText('Discussão');
  await expect(host.locator('#timer')).toHaveText(/^1[01]:\d\d$/);

  await host.click('[data-action="advance"]');
  await expect(bruno.page.locator('#phase')).toHaveText('Rodada 2');
  await expect(host.locator('#host-content')).toContainText('Texto do caso');
  await expect(host.locator('#host-content .option')).toHaveCount(4);
  await expect(bruno.page.locator('[data-choice]')).toHaveCount(4);
  await ana.page.click('[data-choice="3"]');
  await bruno.page.click('[data-choice="1"]');
  await expect(host.locator('#progress')).toHaveText('· 2 de 2 votaram');

  await host.click('[data-action="advance"]');
  await expect(ana.page.locator('#phase')).toHaveText('Deslocamento');
  await expect(ana.page.locator('#content')).toContainText('de A para D');
  await expect(host.locator('#host-content')).toContainText('A → D');
  expect([...ana.errors, ...bruno.errors]).toEqual([]);
});

test('votos individuais ficam ocultos no painel até o professor pedir', async ({ browser }) => {
  const room = fakeRoom();
  const host = await openHost(browser, room);
  await openStudent(browser, room, 'Carla');
  await expect(host.locator('#enrolled')).toHaveText('1');
  await expect(host.locator('#roster')).toBeHidden();
  await host.click('#toggle-roster');
  await expect(host.locator('#roster')).toContainText('Carla');
});

test('voltar ao lobby pede confirmação antes de apagar votos', async ({ browser }) => {
  const room = fakeRoom();
  const host = await openHost(browser, room);
  host.removeAllListeners('dialog');
  let asked = '';
  host.on('dialog', dialog => { asked = dialog.message(); dialog.dismiss(); });
  await host.click('[data-action="start"]');
  expect(asked).toContain('votos anteriores');
  asked = '';
  Object.assign(room.db, { fase: 'voto1', endsAt: Date.now() + 100_000 });
  await host.click('[data-action="lobby"]');
  expect(asked).toContain('votos desta sequência serão apagados');
  expect(room.db.fase).toBe('voto1');
});

test('reiniciar para nova turma devolve os alunos ao formulário de entrada', async ({ browser }) => {
  const room = fakeRoom();
  const host = await openHost(browser, room);
  const student = await openStudent(browser, room, 'Diego');
  await host.click('[data-action="clear"]');
  await expect(host.locator('#reset-message')).toHaveText('Sala reiniciada: 0 participantes e nenhum voto.');
  expect(room.db.participants.size).toBe(0);
  await expect(student.page.locator('#join-panel')).toBeVisible();
  await expect(student.page.locator('#join-message')).toContainText('reiniciada');
  await expect(student.page.locator('#name')).toHaveValue('Diego');
  await student.page.click('#join-form button');
  await expect(student.page.locator('#room')).toBeVisible();
  expect(room.db.participants.size).toBe(1);
});

test('falha de rede ao reabrir a página não apaga a identidade do aluno', async ({ browser }) => {
  const room = fakeRoom();
  const { page } = await openStudent(browser, room, 'Eva');
  const id = await page.evaluate(() => JSON.parse(localStorage.getItem('tbl:einstein-ia-a06-2026-2')).id);
  room.offline.add('estado');
  await page.reload();
  await expect(page.locator('#message')).toContainText('Sem conexão');
  await expect(page.locator('#message')).toHaveText('');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tbl:einstein-ia-a06-2026-2')).id)).toBe(id);
  expect(room.db.participants.size).toBe(1);
});

test('cronograma, slides e material levam ao TBL da aula 6', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.card').nth(5).locator('a[href="tbl/aula-06/index.html"]')).toBeVisible();
  await expect(page.locator('.card').nth(5).locator('a[href="tbl/aula-06/painel.html"]')).toBeVisible();
  await page.goto('/slides/aula-06.html');
  await expect(page.locator('.btn-group a[href="../tbl/aula-06/painel.html"]')).toBeVisible();
  await page.goto('/materiais/aula-06/index.html');
  await expect(page.locator('h2', { hasText: '4. Prática guiada: do processo ao banco com IA agêntica' })).toHaveCount(1);
  await expect(page.locator('a[href="https://demo.bpmn.io/new"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://dbdiagram.io/d"]').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Imprimir Material/ })).toBeVisible();
});

test('slides da prática guiada da aula 6 cabem na tela e o material não transborda', async ({ page }) => {
  await page.goto('/slides/aula-06.html');
  const next = page.locator('#btn-next');
  const total = await page.locator('.slide').count();
  for (let index = 1; index < total; index += 1) {
    await next.click();
    const dimensions = await page.locator('.slide.active').evaluate(element => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth
    }));
    expect(dimensions.scrollHeight, `slide ${index + 1} foi cortado verticalmente`).toBeLessThanOrEqual(dimensions.clientHeight);
    expect(dimensions.scrollWidth, `slide ${index + 1} foi cortado horizontalmente`).toBeLessThanOrEqual(dimensions.clientWidth);
  }
  await expect(page.locator('.slide h2', { hasText: 'Etapas 2–4: BPMN é só XML' })).toHaveCount(1);

  await page.goto('/materiais/aula-06/index.html');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
