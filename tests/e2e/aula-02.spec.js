const { test, expect } = require('@playwright/test');

function watchPage(page) {
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) {
      errors.push(`HTTP ${response.status()}: ${url.pathname}`);
    }
  });
  return errors;
}

test('cronograma e navegação cruzada apontam para a aula 2', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/index.html');
  const card = page.locator('.card').nth(1);
  await expect(card).toContainText('Organizando informações');
  await expect(card.locator('.btn-slides')).toHaveAttribute('href', 'slides/aula-02.html');
  await card.locator('.btn-slides').click();
  await expect(page).toHaveURL(/\/slides\/aula-02\.html$/);
  await page.getByRole('link', { name: /Material/ }).click();
  await expect(page).toHaveURL(/\/materiais\/aula-02\/index\.html$/);
  await expect(page.getByRole('heading', { name: 'Objetivos de aprendizagem' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('aula 2 percorre 16 slides por botões e teclado', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-02.html');
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  await expect(page.locator('.slide')).toHaveCount(16);
  await expect(page.locator('#slide-counter')).toHaveText('1 / 16');
  await expect(previous).toBeDisabled();
  await page.keyboard.press('Space');
  await expect(page.locator('#slide-counter')).toHaveText('2 / 16');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#slide-counter')).toHaveText('1 / 16');
  for (let index = 1; index < 16; index += 1) await next.click();
  await expect(page.locator('#slide-counter')).toHaveText('16 / 16');
  await expect(next).toBeDisabled();
  expect(errors).toEqual([]);
});

test('aula 2 permanece dentro do viewport em desktop e mobile', async ({ page }) => {
  for (const path of ['/slides/aula-02.html', '/materiais/aula-02/index.html']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
