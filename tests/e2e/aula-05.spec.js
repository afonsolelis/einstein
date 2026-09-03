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

test('cronograma apresenta a aula 5 com Docker e base para download', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/index.html');
  const card = page.locator('.card').nth(4);
  await expect(card).toContainText('Metabase local com Docker');
  await expect(card.locator('.tag-ai')).toHaveText('Docker');
  const link = card.locator('.btn-data');
  await expect(link).toHaveAttribute('href', 'materiais/aula-05/dados/hospital_patients_real_world.csv');
  expect(errors).toEqual([]);
});

test('docker-compose publicado declara os tres servicos e os volumes', async ({ request }) => {
  const response = await request.get('/materiais/aula-05/docker-compose.yml');
  expect(response.ok()).toBeTruthy();
  const compose = await response.text();
  for (const servico of ['postgres-app:', 'postgres-dados:', 'metabase:']) {
    expect(compose, `servico ${servico} ausente`).toContain(servico);
  }
  expect(compose).toContain('MB_DB_HOST: postgres-app');
  expect(compose).toContain('"3000:3000"');
  expect(compose).toContain('app-data:/var/lib/postgresql/data');
  expect(compose).toContain('dados-data:/var/lib/postgresql/data');
});

test('aula 5 percorre comandos, controles e navegacao cruzada', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-05.html');
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  const total = await page.locator('.slide').count();
  await expect(page.locator('.copy-prompt')).toHaveCount(14);
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
  await expect(page).toHaveURL(/\/materiais\/aula-05\/index\.html$/);
  await expect(page.getByRole('heading', { name: /Dois bancos com papéis diferentes/ })).toBeVisible();
  await expect(page.locator('a[download="docker-compose.yml"]')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('material da aula 5 traz os sete diagnosticos com os numeros de conferencia', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/materiais/aula-05/index.html');
  const conteudo = await page.locator('.content').innerText();
  for (const numero of ['5.000', '350', '321', '150', '1.513', '28', '14']) {
    expect(conteudo, `numero de conferencia ${numero} ausente`).toContain(numero);
  }
  await expect(page.locator('.code-block')).toHaveCount(13);
  expect(errors).toEqual([]);
});

test('slides e material da aula 5 nao geram overflow horizontal', async ({ page }) => {
  for (const path of ['/slides/aula-05.html', '/materiais/aula-05/index.html']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
