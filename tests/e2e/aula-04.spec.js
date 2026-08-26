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

const RECORTES = [
  ['grupo_a_painel_operacoes.csv', '1774973813c115bae8c1f7034ee6eabadd3005bb2bbacecea244cc1904bb8c03', 53],
  ['grupo_b_registros_clinicos.csv', '2ba9a180f27c64cbf8f70d2b1df48d654b257773f3f166ba94da76afc1d44c69', 4501],
  ['grupo_c_registros_risco.csv', 'c05e6e8b60e779a0e2c52e198236d1c6046a728d005d06b3b16a7e0d9e5821c1', 3439]
];

test('cronograma oferece download direto da base da aula 4', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/index.html');
  const card = page.locator('.card').nth(3);
  await expect(card).toContainText('Estatística para gestão de negócios');
  const link = card.locator('.btn-data');
  await expect(link).toHaveAttribute('href', 'materiais/aula-04/dados/rede_vita_internacoes.csv');
  await expect(link).toHaveAttribute('download', 'rede_vita_internacoes.csv');

  const downloadPromise = page.waitForEvent('download');
  await link.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('rede_vita_internacoes.csv');
  expect(errors).toEqual([]);
});

test('base completa publicada mantém conteúdo e assinatura esperados', async ({ request }) => {
  const response = await request.get('/materiais/aula-04/dados/rede_vita_internacoes.csv');
  expect(response.ok()).toBeTruthy();
  const body = await response.body();
  expect(body.toString('utf8').trim().split(/\r?\n/)).toHaveLength(5839);
  expect(createHash('sha256').update(body).digest('hex')).toBe(
    'ca2476f35979da0dc575acd1432fd6ef7a2d7503b8fdb6bd25b924cf976af083'
  );
});

test('cada comitê recebe o seu recorte íntegro', async ({ request }) => {
  for (const [arquivo, digest, linhas] of RECORTES) {
    const response = await request.get(`/materiais/aula-04/dados/${arquivo}`);
    expect(response.ok(), arquivo).toBeTruthy();
    const body = await response.body();
    expect(body.toString('utf8').trim().split(/\r?\n/), arquivo).toHaveLength(linhas);
    expect(createHash('sha256').update(body).digest('hex'), arquivo).toBe(digest);
  }
});

test('aula 4 percorre prompts, controles e navegação cruzada', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-04.html');
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  await expect(page.locator('.slide')).toHaveCount(27);
  await expect(page.locator('.copy-prompt')).toHaveCount(8);
  await expect(page.locator('#slide-counter')).toHaveText('1 / 27');
  await expect(previous).toBeDisabled();

  for (let index = 1; index < 27; index += 1) {
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
  await expect(page.locator('#slide-counter')).toHaveText('27 / 27');
  await expect(next).toBeDisabled();

  await page.getByRole('link', { name: /Material/ }).click();
  await expect(page).toHaveURL(/\/materiais\/aula-04\/index\.html$/);
  await expect(page.getByRole('heading', { name: /Os três comitês e seus recortes/ })).toBeVisible();
  await expect(page.locator('a[download$=".csv"]')).toHaveCount(6);
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
