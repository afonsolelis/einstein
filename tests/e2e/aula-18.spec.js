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

test('aula 18 percorre prompts, controles e navegação cruzada', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-18.html');
  const total = await page.locator('.slide').count();
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  expect(total).toBe(24);
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
  await expect(page).toHaveURL(/\/materiais\/aula-18\/index\.html$/);
  await expect(page.getByRole('heading', { name: /Os quatro problemas à escolha/ })).toBeVisible();
  await expect(page.locator('a[download="prompts-projeto.md"]')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('slides e material da aula 18 não geram overflow horizontal', async ({ page }) => {
  for (const path of ['/slides/aula-18.html', '/materiais/aula-18/index.html']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
