const { test, expect } = require('@playwright/test');

test('cronograma da aula 4 aponta para o Metabase e oferece o SQLite de apoio', async ({ page }) => {
  await page.goto('/index.html');
  const card = page.locator('.card').nth(3);
  await expect(card).toContainText('SQL II');
  await expect(card).toContainText('Metabase');
  const link = card.locator('.btn-data');
  await expect(link).toHaveAttribute('href', 'materiais/aula-04/rede-cuidar.sqlite');
  await expect(link).toHaveAttribute('download', 'rede-cuidar.sqlite');

  const downloadPromise = page.waitForEvent('download');
  await link.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('rede-cuidar.sqlite');
});

function watchPage(page) {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) errors.push(`HTTP ${response.status()}: ${url.pathname}`);
  });
  return errors;
}

test('aula 4 explora o Olist no Metabase', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-04.html');
  await expect(page.locator('.slide')).toHaveCount(28);
  await expect(page.locator('h2', { hasText: 'Acesso ao Metabase' })).toBeAttached();
  await expect(page.locator('h2', { hasText: 'Grão: o conceito da aula' })).toBeAttached();
  await expect(page.locator('h2', { hasText: 'Rodada 3 · JOIN com tradução' })).toBeAttached();
  await expect(page.locator('h2', { hasText: 'Monte o dashboard' })).toBeAttached();
  const metabase = page.getByRole('link', { name: /Metabase/ }).first();
  await expect(metabase).toHaveAttribute('href', 'https://metabase-production-76b0.up.railway.app');
  await page.getByRole('link', { name: /Material/ }).click();
  await expect(page).toHaveURL(/materiais\/aula-04\/index\.html$/);
  await expect(page.getByRole('heading', { name: /Rodada 0: reconhecer/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /três perguntas, três gráficos e um dashboard/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('material publica o acesso do Metabase e mantém o SQLite como treino opcional', async ({ page }) => {
  await page.goto('/materiais/aula-04/index.html');
  await expect(page.locator('.code-block').first()).toContainText('alunos@aula.local');
  await expect(page.getByRole('link', { name: /metabase-production-76b0/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Abrir laboratório SQL/ })).toHaveAttribute('href', 'laboratorio-sql.html');
});

test('laboratório executa SQLite e persiste alterações no localStorage', async ({ page }) => {
  test.slow(); // carregar o motor SQLite de 1,3 MB é lento sob paralelismo
  const errors = watchPage(page);
  await page.goto('/materiais/aula-04/laboratorio-sql.html');
  await expect(page.locator('#status')).toContainText(/Banco/);
  await page.locator('#sql').fill("INSERT INTO paciente(nome,cidade) VALUES ('Teste Persistente','Santos'); SELECT * FROM paciente WHERE nome='Teste Persistente';");
  await page.locator('#run').click();
  await expect(page.locator('#results')).toContainText('Teste Persistente');
  await page.reload();
  await expect(page.locator('#status')).toContainText('localStorage');
  await page.locator('#sql').fill("SELECT * FROM paciente WHERE nome='Teste Persistente';");
  await page.locator('#run').click();
  await expect(page.locator('#results')).toContainText('Santos');
  expect(errors).toEqual([]);
});

test('botão Executar sinaliza o carregamento do SQLite em vez de ficar mudo', async ({ page }) => {
  const errors = watchPage(page);
  let liberar;
  const segurar = new Promise(resolve => { liberar = resolve; });
  test.slow(); // carregar o motor SQLite de 1,3 MB é lento sob paralelismo
  await page.route('**/sql-asm.js', async route => { await segurar; await route.continue(); });

  await page.goto('/materiais/aula-04/laboratorio-sql.html', { waitUntil: 'commit' });
  const run = page.locator('#run');

  // Enquanto o motor baixa, o botão precisa estar desabilitado E visivelmente diferente.
  await expect(run).toBeDisabled();
  await expect(run).toContainText('Carregando');
  await expect(page.locator('#save')).toBeDisabled();
  await expect(page.locator('#reset')).toBeDisabled();
  const opacidade = await run.evaluate(el => getComputedStyle(el).opacity);
  expect(Number(opacidade)).toBeLessThan(1);

  liberar();
  await expect(run).toBeEnabled();
  await expect(run).toContainText('Executar');
  expect(errors).toEqual([]);
});

test('falha ao carregar o SQLite mostra erro e opção de recarregar', async ({ page }) => {
  await page.route('**/sql-asm.js', route => route.abort());
  await page.goto('/materiais/aula-04/laboratorio-sql.html');
  await expect(page.locator('#status')).toContainText('Falha ao carregar');
  await expect(page.locator('#results')).toContainText('motor SQLite');
  await expect(page.locator('#results button')).toContainText('Recarregar');
});

test('laboratório renderiza todos os conjuntos de resultado do lote', async ({ page }) => {
  test.slow(); // carregar o motor SQLite de 1,3 MB é lento sob paralelismo
  const errors = watchPage(page);
  await page.goto('/materiais/aula-04/laboratorio-sql.html');
  await expect(page.locator('#run')).toBeEnabled();
  await page.locator('#sql').fill('SELECT * FROM medico; SELECT * FROM paciente;');
  await page.locator('#run').click();
  await expect(page.locator('#results table')).toHaveCount(2);
  await expect(page.locator('#results')).toContainText('Resultado 1 de 2');
  expect(errors).toEqual([]);
});

test('editor não entrega a resposta da missão guiada pronta', async ({ page }) => {
  await page.route('**/sql-asm.js', route => route.abort()); // o conteúdo inicial não depende do motor
  await page.goto('/materiais/aula-04/laboratorio-sql.html');
  const sql = await page.locator('#sql').inputValue();
  expect(sql).toContain('sqlite_master');
  expect(sql).not.toContain('GROUP BY m.especialidade');
});

test('slides, material e laboratório não geram overflow horizontal', async ({ page }) => {
  test.slow(); // carregar o motor SQLite de 1,3 MB é lento sob paralelismo
  for (const path of ['/slides/aula-04.html', '/materiais/aula-04/index.html', '/materiais/aula-04/laboratorio-sql.html']) {
    await page.goto(path);
    const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(size.content, path).toBeLessThanOrEqual(size.viewport);
  }
});
