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

test('cronograma oferece download direto da base da aula 4', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/index.html');
  const card = page.locator('.card').nth(3);
  await expect(card).toContainText('Limpeza de dados');
  const link = card.locator('.btn-data');
  await expect(link).toHaveAttribute('href', 'materiais/aula-04/dados/hospital_patients_real_world.csv');
  await expect(link).toHaveAttribute('download', 'hospital_patients_real_world.csv');

  const downloadPromise = page.waitForEvent('download');
  await link.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('hospital_patients_real_world.csv');
  expect(errors).toEqual([]);
});

test('base publicada mantém conteúdo e assinatura esperados', async ({ request }) => {
  const response = await request.get('/materiais/aula-04/dados/hospital_patients_real_world.csv');
  expect(response.ok()).toBeTruthy();
  const body = await response.body();
  expect(body.toString('utf8').trim().split(/\r?\n/)).toHaveLength(5001);
  expect(createHash('sha256').update(body).digest('hex')).toBe(
    'af6c3023e87c1950cb021579521534c3d44fc940953216ca560ca1d7e3eabc8a'
  );
});

test('aula 4 percorre prompts, controles e navegação cruzada', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-04.html');
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  await expect(page.locator('.slide')).toHaveCount(24);
  await expect(page.locator('.copy-prompt')).toHaveCount(12);
  await expect(page.locator('#slide-counter')).toHaveText('1 / 24');
  await expect(previous).toBeDisabled();

  for (let index = 1; index < 24; index += 1) {
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
  await expect(page.locator('#slide-counter')).toHaveText('24 / 24');
  await expect(next).toBeDisabled();

  await page.getByRole('link', { name: /Material/ }).click();
  await expect(page).toHaveURL(/\/materiais\/aula-04\/index\.html$/);
  await expect(page.getByRole('heading', { name: /O case e a base do Kaggle/ })).toBeVisible();
  await expect(page.locator('a[download="hospital_patients_real_world.csv"]')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('slides e material da aula 4 não geram overflow horizontal', async ({ page }) => {
  for (const path of ['/slides/aula-04.html', '/materiais/aula-04/index.html']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
