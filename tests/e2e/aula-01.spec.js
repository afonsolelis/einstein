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

test('cronograma aponta explicitamente para os arquivos da aula 1', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/index.html');

  const firstCard = page.locator('.card').first();
  await expect(firstCard).toContainText('Primeiros passos');
  await expect(firstCard.locator('.btn-slides')).toHaveAttribute('href', 'slides/aula-01.html');
  await expect(firstCard.locator('.btn-mat')).toHaveAttribute('href', 'materiais/aula-01/index.html');
  expect(errors).toEqual([]);
});

test('slides navegam por botões e teclado respeitando os limites', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-01.html');

  const slides = page.locator('.slide');
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  await expect(slides).toHaveCount(15);
  await expect(page.locator('#slide-counter')).toHaveText('1 / 15');
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(page.locator('#slide-counter')).toHaveText('2 / 15');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#slide-counter')).toHaveText('1 / 15');
  await page.keyboard.press('Space');
  await expect(page.locator('#slide-counter')).toHaveText('2 / 15');

  for (let index = 2; index < 15; index += 1) await next.click();
  await expect(page.locator('#slide-counter')).toHaveText('15 / 15');
  await expect(next).toBeDisabled();
  await expect(previous).toBeEnabled();
  expect(errors).toEqual([]);
});

test('slides e material possuem navegação cruzada e conteúdo completo', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-01.html');
  await page.getByRole('link', { name: /Material/ }).click();
  await expect(page).toHaveURL(/\/materiais\/aula-01\/index\.html$/);
  await expect(page.getByRole('heading', { name: 'Objetivos de aprendizagem' })).toBeVisible();
  await expect(page.locator('[data-lesson-section="challenge"]')).toBeVisible();
  await expect(page.locator('[data-lesson-section="checklist"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /Imprimir Material/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Ver Slides/ })).toHaveAttribute('href', '../../slides/aula-01.html');
  expect(errors).toEqual([]);
});

test('páginas não geram overflow horizontal no viewport', async ({ page }) => {
  for (const path of ['/slides/aula-01.html', '/materiais/aula-01/index.html']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
