const { test, expect } = require('@playwright/test');
const { createHash } = require('node:crypto');

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

test('cronograma oferece download direto da base da aula 13', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/index.html');
  const card = page.locator('.card').nth(13);
  await expect(card).toContainText('Fazendo previsões');
  const link = card.locator('.btn-data');
  await expect(link).toHaveAttribute('href', 'materiais/aula-13/dados/olist_pedidos.csv');
  await expect(link).toHaveAttribute('download', 'olist_pedidos.csv');
  expect(errors).toEqual([]);
});

test('base da aula 13 mantém conteúdo e assinatura esperados', async ({ request }) => {
  const response = await request.get('/materiais/aula-13/dados/olist_pedidos.csv');
  expect(response.ok()).toBeTruthy();
  const body = await response.body();
  expect(body.toString('utf8').trim().split(/\r?\n/)).toHaveLength(99442);
  expect(createHash('sha256').update(body).digest('hex')).toBe(
    '00efcd40947d6205e21d16a0d1601ac05cfc03c5ddd7b7eaaea5609ba9eb0fe4'
  );
});

test('aula 13 percorre prompts, controles e navegação cruzada', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-13.html');
  const total = await page.locator('.slide').count();
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  expect(total).toBe(29);
  await expect(page.locator('.copy-prompt')).toHaveCount(6);
  await expect(page.locator('#slide-counter')).toHaveText(`1 / ${total}`);
  await expect(previous).toBeDisabled();

  for (let index = 1; index < total; index += 1) {
    await next.click();
    const active = page.locator('.slide.active');
    const dimensions = await active.evaluate(element => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth
    }));
    expect(dimensions.scrollHeight, `slide ${index + 1} foi cortado verticalmente`).toBeLessThanOrEqual(dimensions.clientHeight);
    expect(dimensions.scrollWidth, `slide ${index + 1} foi cortado horizontalmente`).toBeLessThanOrEqual(dimensions.clientWidth);
  }
  await expect(page.locator('#slide-counter')).toHaveText(`${total} / ${total}`);
  await expect(next).toBeDisabled();

  await page.getByRole('link', { name: /Material/ }).click();
  await expect(page).toHaveURL(/\/materiais\/aula-13\/index\.html$/);
  await expect(page.getByRole('heading', { name: /A pergunta de negócio define a limpeza/ })).toBeVisible();
  await expect(page.locator('a[download="olist_pedidos.csv"]')).toHaveCount(3);
  await expect(page.locator('a[download="prompts-previsao.md"]')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('slides e material da aula 13 não geram overflow horizontal', async ({ page }) => {
  for (const path of ['/slides/aula-13.html', '/materiais/aula-13/index.html']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
