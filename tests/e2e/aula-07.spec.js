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

test('cronograma apresenta a aula 7 de visualizacao', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/index.html');
  const card = page.locator('.card').nth(6);
  await expect(card).toContainText('Storytelling, Dashboards e Segmentação de Clientes');
  await expect(card.locator('.tag')).toContainText(['Visualização', 'Olist']);
  await expect(card.locator('.btn-data')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('aula 7 percorre os slides sem corte e chega ao material', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-07.html');
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  const total = await page.locator('.slide').count();
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
  await expect(next).toBeDisabled();

  await page.getByRole('link', { name: /Material/ }).click();
  await expect(page).toHaveURL(/\/materiais\/aula-07\/index\.html$/);
  await expect(page.getByRole('heading', { name: /Quando o gráfico mente/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('material da aula 7 traz a figura acessivel e a segmentacao correta', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/materiais/aula-07/index.html');

  const figuras = page.locator('.figura svg[role="img"]');
  await expect(figuras).toHaveCount(2);
  for (const id of ['fig-antes', 'fig-depois']) {
    await expect(page.locator(`#${id}-t`)).toHaveCount(1);
    await expect(page.locator(`#${id}-d`)).toHaveCount(1);
  }

  const conteudo = await page.locator('.content').innerText();
  expect(conteudo, 'a segmentacao precisa usar customer_unique_id').toContain('customer_unique_id');
  expect(conteudo, 'a recencia precisa sair da data de corte da base').toContain('data_corte');
  for (const numero of ['28', '14', '321', '363', '342']) {
    expect(conteudo, `numero ${numero} ausente na figura ou no texto`).toContain(numero);
  }
  expect(conteudo, 'CURRENT_DATE nao deve ser usado como regua de recencia').toContain('não de <code>CURRENT_DATE</code>'.replace(/<[^>]+>/g, ''));
  expect(errors).toEqual([]);
});

test('slides e material da aula 7 nao geram overflow horizontal', async ({ page }) => {
  for (const path of ['/slides/aula-07.html', '/materiais/aula-07/index.html']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
});
