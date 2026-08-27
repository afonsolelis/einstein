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

test('cronograma separa fundamentos e prática de SQL', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.card').nth(2)).toContainText('Modelagem de dados e SQL I');
  await expect(page.locator('.card').nth(3)).toContainText('SQL II');
  await expect(page.locator('.card').nth(4)).toContainText('Limpeza de dados');
  await expect(page.locator('.card').nth(4).locator('.btn-data')).toHaveAttribute('href', 'materiais/aula-05/dados/hospital_patients_real_world.csv');
});

test('home apresenta a conexão PostgreSQL separada para o DBeaver', async ({ page }) => {
  await page.goto('/index.html');
  const connection = page.locator('.database-access');
  await expect(connection).toContainText('altaria.proxy.rlwy.net');
  await expect(connection).toContainText('30763');
  await expect(connection).toContainText('railway');
  await expect(connection).toContainText('postgres');
  await expect(connection.locator('#database-uri')).toHaveText(/^postgresql:\/\//);
  await expect(connection.locator('#copy-database-uri')).toBeVisible();
});

test('slides percorrem os fundamentos e encaminham para a prática da aula 4', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-03.html');
  const count = await page.locator('.slide').count();
  expect(count).toBeGreaterThanOrEqual(10);
  await expect(page.locator('h2', { hasText: 'As cinco sublinguagens SQL' })).toBeAttached();
  await expect(page.locator('h2', { hasText: 'Preparação para a aula 4' })).toBeAttached();
  for (let index = 1; index < count; index += 1) await page.locator('#btn-next').click();
  await expect(page.locator('#btn-next')).toBeDisabled();
  await page.getByRole('link', { name: /Material/ }).click();
  await expect(page).toHaveURL(/materiais\/aula-03\/index\.html$/);
  await expect(page.getByRole('heading', { name: /As cinco sublinguagens SQL/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('slides e material não geram overflow horizontal', async ({ page }) => {
  for (const path of ['/slides/aula-03.html', '/materiais/aula-03/index.html']) {
    await page.goto(path);
    const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(size.content, path).toBeLessThanOrEqual(size.viewport);
  }
});
