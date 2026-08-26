const { test, expect } = require('@playwright/test');

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

test('cronograma apresenta a nova aula 3 e move limpeza para a aula 4', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.card').nth(2)).toContainText('Modelagem de dados e SQL');
  await expect(page.locator('.card').nth(3)).toContainText('Limpeza de dados');
  await expect(page.locator('.card').nth(3).locator('.btn-data')).toHaveAttribute('href', 'materiais/aula-04/dados/hospital_patients_real_world.csv');
});

test('slides percorrem a aula e oferecem laboratório e desafio final', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-03.html');
  const count = await page.locator('.slide').count();
  expect(count).toBeGreaterThanOrEqual(10);
  await expect(page.locator('h2', { hasText: 'As cinco sublinguagens SQL' })).toBeAttached();
  await expect(page.locator('h2', { hasText: 'SQL Murder Mystery' })).toBeAttached();
  for (let index = 1; index < count; index += 1) await page.locator('#btn-next').click();
  await expect(page.locator('#btn-next')).toBeDisabled();
  await page.getByRole('link', { name: /Material/ }).click();
  await expect(page).toHaveURL(/materiais\/aula-03\/index\.html$/);
  await expect(page.getByRole('heading', { name: /As cinco sublinguagens SQL/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('laboratório executa SQLite e persiste alterações no localStorage', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/materiais/aula-03/laboratorio-sql.html');
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
  for (const path of ['/slides/aula-03.html', '/materiais/aula-03/index.html', '/materiais/aula-03/laboratorio-sql.html']) {
    await page.goto(path);
    const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(size.content, path).toBeLessThanOrEqual(size.viewport);
  }
});
