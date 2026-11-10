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

test('base da aula 14 mantém conteúdo e assinatura esperados', async ({ request }) => {
  const response = await request.get('/materiais/aula-14/dados/experimento_agendamento.csv');
  expect(response.ok()).toBeTruthy();
  const body = await response.body();
  expect(body.toString('utf8').trim().split(/\r?\n/)).toHaveLength(14393);
  expect(createHash('sha256').update(body).digest('hex')).toBe(
    '3b6b13db7720df3c07d8e7b9cfeed99bf80040261ba185f89905d0f18bbc80c3'
  );
});

test('aula 14 percorre prompts, controles e navegação cruzada', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-14.html');
  const total = await page.locator('.slide').count();
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  expect(total).toBe(30);
  await expect(page.locator('.copy-prompt')).toHaveCount(8);
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
  await expect(page).toHaveURL(/\/materiais\/aula-14\/index\.html$/);
  await expect(page.getByRole('heading', { name: /O plano do experimento/ })).toBeVisible();
  await expect(page.locator('a[download="experimento_agendamento.csv"]')).toHaveCount(3);
  await expect(page.locator('a[download="prompts-ab.md"]')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('slides e material da aula 14 não geram overflow horizontal', async ({ page }) => {
  for (const path of ['/slides/aula-14.html', '/materiais/aula-14/index.html']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
