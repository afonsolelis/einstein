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

test('cronograma mostra a aula 10 financeira e adia Data Viz III para 28/10', async ({ page }) => {
  await page.goto('/index.html');
  const aula10 = page.locator('.card').nth(10);
  await expect(aula10).toContainText('Laboratório 10 · 21/10');
  await expect(aula10).toContainText('Yahoo Finance');
  await expect(aula10.locator('a[href="slides/aula-10.html"]')).toHaveCount(1);
  await expect(aula10.locator('a[href="materiais/aula-10/index.html"]')).toHaveCount(1);
  const aula11 = page.locator('.card').nth(11);
  await expect(aula11).toContainText('Laboratório 11 · 28/10');
  await expect(aula11).toContainText('Data Visualization III');
  await expect(page.locator('.card')).toHaveCount(20);
  await expect(page.locator('.card').last()).toContainText('Laboratório 19 · 23/12');
});

test('aula 10 percorre slides, prompt e navegação cruzada', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-10.html');
  const total = await page.locator('.slide').count();
  const next = page.locator('#btn-next');
  await expect(page.locator('#btn-prev')).toBeDisabled();
  await expect(page.locator('.copy-prompt')).toHaveCount(1);

  for (let index = 1; index < total; index += 1) {
    await next.click();
    const dimensions = await page.locator('.slide.active').evaluate(element => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth
    }));
    expect(dimensions.scrollHeight, `slide ${index + 1} foi cortado verticalmente`).toBeLessThanOrEqual(dimensions.clientHeight);
    expect(dimensions.scrollWidth, `slide ${index + 1} foi cortado horizontalmente`).toBeLessThanOrEqual(dimensions.clientWidth);
  }
  await expect(next).toBeDisabled();
  await expect(page.locator('.slide.active h2')).toHaveText('Fim do Laboratório 10');

  await page.locator('#controls a[href="../materiais/aula-10/index.html"]').click();
  await expect(page).toHaveURL(/\/materiais\/aula-10\/index\.html$/);
  await expect(page.locator('a[href="dashboard-financeiro/app.py"]').first()).toBeVisible();
  await expect(page.locator('img[src="dashboard-financeiro/painel-referencia.png"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('app de referência é publicado junto com o material', async ({ request }) => {
  const response = await request.get('/materiais/aula-10/dashboard-financeiro/app.py');
  expect(response.ok()).toBeTruthy();
  const codigo = await response.text();
  for (const trecho of ['import yfinance as yf', '@st.cache_data(ttl=900', 'auto_adjust=True', '"^BVSP"']) {
    expect(codigo).toContain(trecho);
  }
});

test('slides e material da aula 10 não geram overflow horizontal', async ({ page }) => {
  for (const path of ['/slides/aula-10.html', '/materiais/aula-10/index.html']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
