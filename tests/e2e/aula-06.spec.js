const { test, expect } = require('@playwright/test');

// Supabase simulado em memória com as mesmas regras de supabase/tbl-aula-06.sql.
function fakeRoom() {
  const TOKEN = 'token-de-teste';
  const db = { status: 'lobby', stage: null, endsAt: null, participants: new Map(), votes: new Map() };
  const now = () => Date.now();
  const fail = message => ({ status: 400, body: { message } });
  const next = { round1: ['discussion', 600], discussion: ['round2', 100] };
  const timeline = () => {
    if (db.status === 'lobby') return { phase: 'lobby', endsAt: null };
    if (db.status === 'revealed') return { phase: 'reveal', endsAt: null };
    let stage = db.stage, endsAt = db.endsAt;
    while (now() >= endsAt && next[stage]) { endsAt += next[stage][1] * 1000; stage = next[stage][0]; }
    return now() < endsAt ? { phase: stage, endsAt } : { phase: 'reveal', endsAt: null };
  };
  const phase = () => timeline().phase;
  const distribution = round => [0, 1, 2, 3].map(choice => ({
    choice,
    votes: [...db.votes].filter(([key, c]) => key.endsWith(`:${round}`) && c === choice).length
  }));
  const state = id => {
    const { phase: p, endsAt } = timeline();
    const transitions = [];
    if (p === 'reveal') {
      for (const pid of db.participants.keys()) {
        const a = db.votes.get(`${pid}:1`), b = db.votes.get(`${pid}:2`);
        if (a == null || b == null) continue;
        const t = transitions.find(x => x.from_choice === a && x.to_choice === b);
        t ? t.people++ : transitions.push({ from_choice: a, to_choice: b, people: 1 });
      }
    }
    return {
      case_title: 'Caso', case_text: 'Texto do caso',
      options: ['A', 'B', 'C', 'D'].map(letter => ({ letter, title: `Opção ${letter}`, text: 'x', gain: 'g', cost: 'c' })),
      phase: p, remaining: endsAt ? Math.max(0, Math.ceil((endsAt - now()) / 1000)) : 0,
      participants: db.participants.size, enrolled: db.participants.size,
      votes_round1: [...db.votes.keys()].filter(k => k.endsWith(':1')).length,
      votes_round2: [...db.votes.keys()].filter(k => k.endsWith(':2')).length,
      round1: p === 'reveal' ? distribution(1) : [], round2: p === 'reveal' ? distribution(2) : [],
      transitions,
      mine: { joined: db.participants.has(id), round1: db.votes.get(`${id}:1`) ?? null, round2: db.votes.get(`${id}:2`) ?? null }
    };
  };
  const hostState = () => ({
    ...state(null),
    round1: distribution(1),
    roster: [...db.participants].map(([id, name]) => ({ name, online: true, r1: db.votes.get(`${id}:1`) ?? null, r2: db.votes.get(`${id}:2`) ?? null }))
  });
  const rpc = {
    tbl_enter: b => { db.participants.set(b.p_id, b.p_name); return { id: b.p_id, name: b.p_name }; },
    tbl_vote: b => {
      if (!db.participants.has(b.p_id)) return fail('Entre na sala antes de votar.');
      if (phase() !== `round${b.p_round}`) return fail('Esta rodada não está aberta.');
      db.votes.set(`${b.p_id}:${b.p_round}`, b.p_choice);
      return { saved: true };
    },
    tbl_state: b => state(b.p_id),
    tbl_host_state: b => b.p_token === TOKEN ? hostState() : fail('Token do professor inválido.'),
    tbl_host: b => {
      if (b.p_token !== TOKEN) return fail('Token do professor inválido.');
      const { phase: p, endsAt } = timeline();
      const open = (stage, seconds) => { db.status = 'running'; db.stage = stage; db.endsAt = now() + seconds * 1000; };
      if (b.p_action === 'start') { db.votes.clear(); open('round1', 100); }
      if (b.p_action === 'advance') {
        if (p === 'lobby') open('round1', 100);
        if (p === 'round1') open('discussion', 600);
        if (p === 'discussion') open('round2', 100);
        if (p === 'round2') db.status = 'revealed';
      }
      if (b.p_action === 'extend') { db.stage = p; db.endsAt = endsAt + 60_000; }
      if (b.p_action === 'reveal') db.status = 'revealed';
      if (b.p_action === 'lobby') { db.status = 'lobby'; db.votes.clear(); }
      if (b.p_action === 'reset') { db.status = 'lobby'; db.votes.clear(); db.participants.clear(); }
      return hostState();
    }
  };
  const offline = new Set();
  const attach = async context => {
    await context.route('**/rest/v1/rpc/*', async route => {
      const fn = new URL(route.request().url()).pathname.split('/').pop();
      if (offline.has(fn)) { offline.delete(fn); return route.abort('internetdisconnected'); }
      const result = rpc[fn](route.request().postDataJSON());
      const failed = result && result.status === 400;
      await route.fulfill({ status: failed ? 400 : 200, contentType: 'application/json', body: JSON.stringify(failed ? result.body : result) });
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
  await ana.page.click('[data-choice="0"]');
  await expect(ana.page.locator('[data-choice="0"]')).toHaveAttribute('aria-pressed', 'true');
  await bruno.page.click('[data-choice="1"]');
  await expect(host.locator('#progress')).toHaveText('· 2 de 2 votaram');

  await host.click('[data-action="advance"]');
  await expect(host.locator('#host-message')).toHaveText('Fase avançada.');
  await expect(ana.page.locator('#phase')).toHaveText('Discussão');
  await expect(ana.page.locator('#content')).toContainText('Você escolheu A');
  await expect(ana.page.locator('.bars')).toHaveCount(0);
  await expect(host.locator('#host-content .bars')).toHaveCount(1);

  await host.click('[data-action="extend"]');
  await expect(host.locator('#host-message')).toHaveText('Mais 1 minuto na fase atual.');
  await expect(host.locator('#phase')).toHaveText('Discussão');
  await expect(host.locator('#timer')).toHaveText(/^1[01]:\d\d$/);

  await host.click('[data-action="advance"]');
  await expect(bruno.page.locator('#phase')).toHaveText('Rodada 2');
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
  Object.assign(room.db, { status: 'running', stage: 'round1', endsAt: Date.now() + 100_000 });
  await host.click('[data-action="lobby"]');
  expect(asked).toContain('votos desta sequência serão apagados');
  expect(room.db.status).toBe('running');
});

test('reiniciar para nova turma devolve os alunos ao formulário de entrada', async ({ browser }) => {
  const room = fakeRoom();
  const host = await openHost(browser, room);
  const student = await openStudent(browser, room, 'Diego');
  await host.click('[data-action="reset"]');
  await expect(host.locator('#host-message')).toHaveText('Sala reiniciada para uma nova turma.');
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
  room.offline.add('tbl_state');
  await page.reload();
  await expect(page.locator('#message')).toContainText('Sem conexão');
  await expect(page.locator('#message')).toHaveText('');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tbl:einstein-ia-a06-2026-2')).id)).toBe(id);
  expect(room.db.participants.size).toBe(1);
});

test('cronograma, slides e material levam ao TBL da aula 6', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.card').nth(5).locator('a[href="tbl/aula-06/index.html"]')).toBeVisible();
  await page.goto('/materiais/aula-06/index.html');
  await expect(page.locator('h2', { hasText: '4. Prática guiada em Python' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Imprimir Material/ })).toBeVisible();
});
