const { test, expect } = require('@playwright/test');

test('cronograma oferece download direto do banco SQLite da aula 4', async ({ page }) => {
  await page.goto('/index.html');
  const card = page.locator('.card').nth(3);
  await expect(card).toContainText('SQL II');
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

test('aula 4 é um laboratório de DDL, DML e DQL', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-04.html');
  await expect(page.locator('.slide')).toHaveCount(20);
  await expect(page.locator('h2', { hasText: 'DDL · criar CONVÊNIO' })).toBeAttached();
  await expect(page.locator('h2', { hasText: 'DML · UPDATE com critério' })).toBeAttached();
  await expect(page.locator('h2', { hasText: 'DQL · JOIN' })).toBeAttached();
  await page.getByRole('link', { name: /Material/ }).click();
  await expect(page).toHaveURL(/materiais\/aula-04\/index\.html$/);
  await expect(page.getByRole('heading', { name: /Rodada DDL/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('laboratório executa SQLite e persiste alterações no localStorage', async ({ page }) => {
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

test('slides, material e laboratório não geram overflow horizontal', async ({ page }) => {
  for (const path of ['/slides/aula-04.html', '/materiais/aula-04/index.html', '/materiais/aula-04/laboratorio-sql.html']) {
    await page.goto(path);
    const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(size.content, path).toBeLessThanOrEqual(size.viewport);
  }
});
