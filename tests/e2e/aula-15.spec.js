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

test('bases da aula 15 mantêm conteúdo e assinaturas esperados', async ({ request }) => {
  const arquivos = [
    ['contas_a_pagar.csv', 5441, 'b3898f2daa84095b6d56c1ccb661a2dba6c8736e36807770204be4d8b0d3e9ce'],
    ['fornecedores.csv', 121, '2a5fede2703f558f2933798055b03f0eb080e84fbcf361b09d640ca7e45918ea']
  ];
  for (const [nome, linhas, hash] of arquivos) {
    const response = await request.get(`/materiais/aula-15/dados/${nome}`);
    expect(response.ok()).toBeTruthy();
    const body = await response.body();
    expect(body.toString('utf8').trim().split(/\r?\n/)).toHaveLength(linhas);
    expect(createHash('sha256').update(body).digest('hex')).toBe(hash);
  }
});

test('aula 15 percorre prompts, controles e navegação cruzada', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-15.html');
  const total = await page.locator('.slide').count();
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  expect(total).toBe(30);
  await expect(page.locator('.copy-prompt')).toHaveCount(7);
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
  await expect(page).toHaveURL(/\/materiais\/aula-15\/index\.html$/);
  await expect(page.getByRole('heading', { name: /Indício, anomalia, irregularidade e fraude/ })).toBeVisible();
  await expect(page.locator('a[download="contas_a_pagar.csv"]')).toHaveCount(3);
  await expect(page.locator('a[download="fornecedores.csv"]')).toHaveCount(1);
  await expect(page.locator('a[download="prompts-auditoria.md"]')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('slides e material da aula 15 não geram overflow horizontal', async ({ page }) => {
  for (const path of ['/slides/aula-15.html', '/materiais/aula-15/index.html']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
