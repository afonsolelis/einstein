const { test, expect } = require('@playwright/test');

const MIRO = 'https://miro.com/welcomeonboard/YUtZL0c5TWQ3RHc5a1NMWXJsZGl0cXhZOGptTkYzK1BHak9YZ2pkb1lpMHRFc09mVzB3d0E1SVlMK2VRN3RjTmZpMTRDUkJJbWk3dWVsYmk2M3VWREd5d3ZCaDVPc09Qd0ZydjE1OGY0dmFyejh1MVBONzF3QjhHZUVXM3N2NjJzVXVvMm53MW9OWFg5bkJoVXZxdFhRPT0hdjE=?share_link_id=238603895059';

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

async function activeSlideFits(page) {
  return page.locator('.slide.active').evaluate(element => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth
  }));
}

async function goToSlide(page, heading) {
  const total = await page.locator('.slide').count();
  for (let index = 0; index < total; index += 1) {
    const title = await page.locator('.slide.active h2, .slide.active h1').first().innerText();
    if (title.includes(heading)) return;
    await page.locator('#btn-next').click();
  }
  throw new Error(`slide "${heading}" não encontrado`);
}

test('aula 7 percorre todos os slides pelos botões sem corte e sem erro de console', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-07.html');
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  const total = await page.locator('.slide').count();
  expect(total).toBeGreaterThanOrEqual(10);
  await expect(page.locator('#slide-counter')).toHaveText(`1 / ${total}`);
  await expect(previous).toBeDisabled();
  await expect(page.locator('.slide.active h1')).toHaveText('Do fluxo ao modelo');

  for (let index = 1; index < total; index += 1) {
    await next.click();
    await expect(page.locator('#slide-counter')).toHaveText(`${index + 1} / ${total}`);
    const dimensions = await activeSlideFits(page);
    expect(dimensions.scrollHeight, `slide ${index + 1} foi cortado verticalmente`).toBeLessThanOrEqual(dimensions.clientHeight);
    expect(dimensions.scrollWidth, `slide ${index + 1} foi cortado horizontalmente`).toBeLessThanOrEqual(dimensions.clientWidth);
  }
  await expect(next).toBeDisabled();
  await expect(page.locator('.slide.active h2')).toHaveText('Fim do Laboratório 7');

  await previous.click();
  await expect(page.locator('#slide-counter')).toHaveText(`${total - 1} / ${total}`);
  const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(pageOverflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('slides da aula 7 respondem ao teclado e expõem os controles fixos', async ({ page }) => {
  await page.goto('/slides/aula-07.html');
  const total = await page.locator('.slide').count();
  const counter = page.locator('#slide-counter');
  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText(`2 / ${total}`);
  await page.keyboard.press('Space');
  await expect(counter).toHaveText(`3 / ${total}`);
  await page.keyboard.press('ArrowLeft');
  await expect(counter).toHaveText(`2 / ${total}`);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(counter).toHaveText(`1 / ${total}`);

  await expect(page.locator('#controls a[href="../index.html"]')).toBeVisible();
  await expect(page.locator('#controls a[href="../materiais/aula-07/index.html"]')).toBeVisible();
  await expect(page.locator('#btn-fs')).toBeEnabled();

  for (const section of ['objectives', 'agenda', 'concepts', 'guided-practice', 'challenge', 'summary', 'next-steps']) {
    expect(await page.locator(`.slide[data-lesson-section="${section}"]`).count(), `seção ${section}`).toBeGreaterThan(0);
  }
});

test('slide desenha o formato do fluxo anotado: tarefa, três raias, passos numerados e âncoras rosa', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-07.html');
  await goToSlide(page, 'O formato do fluxo de interação anotado');

  const fluxo = page.locator('.slide.active svg#fluxo-anotado');
  await expect(fluxo).toBeVisible();
  await expect(fluxo).toHaveAttribute('role', 'img');
  await expect(fluxo.locator('title')).toHaveText('Formato do fluxo de interação anotado');
  await expect(fluxo.locator('.fl-task-text')).toContainText('Chief de Vendas decide');

  await expect(fluxo.locator('.raia')).toHaveCount(3);
  await expect(fluxo.locator('.fl-lane-label')).toHaveText(['USUÁRIO', 'INTERFACE', 'DADO']);

  const passos = await fluxo.locator('.passo').evaluateAll(nodes => nodes.map(node => Number(node.dataset.passo)).sort((a, b) => a - b));
  expect(passos).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  await expect(fluxo.locator('.passo-usuario')).toHaveCount(4);
  await expect(fluxo.locator('.passo-interface')).toHaveCount(4);
  await expect(fluxo.locator('.fonte-dado')).toHaveCount(4);
  await expect(fluxo.locator('.fonte-dado .fl-num')).toHaveCount(0);
  await expect(fluxo.locator('.ancora')).toHaveCount(3);
  await expect(fluxo.locator('.fl-anchor-text')).toHaveText(['D1', 'D2', 'D3']);

  const fills = await fluxo.evaluate(svg => {
    const fill = selector => getComputedStyle(svg.querySelector(selector)).fill;
    return {
      usuario: fill('.passo-usuario .fl-note'),
      interface: fill('.passo-interface .fl-note'),
      dado: fill('.fonte-dado .fl-note'),
      ancora: fill('.ancora .fl-anchor')
    };
  });
  expect(fills).toEqual({
    usuario: 'rgb(253, 224, 71)',
    interface: 'rgb(147, 197, 253)',
    dado: 'rgb(134, 239, 172)',
    ancora: 'rgb(244, 114, 182)'
  });

  const box = await fluxo.boundingBox();
  expect(box.width).toBeGreaterThan(300);
  expect(box.height).toBeGreaterThan(150);

  await page.locator('#btn-next').click();
  await expect(page.locator('.slide.active h2')).toHaveText('Regras do board');
  expect(errors).toEqual([]);
});

test('slides da aula 7 levam ao board da turma, ao esquema estrela e ao material', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-07.html');
  await goToSlide(page, 'Miro: um único frame');
  const miro = page.locator('.slide.active a.action-link');
  await expect(miro).toHaveAttribute('href', MIRO);
  await expect(miro).toHaveAttribute('target', '_blank');

  await goToSlide(page, 'O esquema estrela do case');
  const estrela = page.locator('.slide.active svg#estrela');
  await expect(estrela).toBeVisible();
  await expect(estrela.locator('[data-tabela]')).toHaveCount(6);
  await expect(estrela.locator('.st-fato')).toHaveCount(2);

  await page.locator('#controls a[href="../materiais/aula-07/index.html"]').click();
  await expect(page).toHaveURL(/\/materiais\/aula-07\/index\.html$/);
  await expect(page.locator('h1')).toContainText('Data Visualization I');
  await page.locator('.floating-nav a[href="../../slides/aula-07.html"]').click();
  await expect(page).toHaveURL(/\/slides\/aula-07\.html$/);
  expect(errors).toEqual([]);
});

test('material da aula 7 tem as seções completas, links locais válidos e nenhum overflow', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/materiais/aula-07/index.html');

  for (const section of ['objectives', 'concepts', 'guided-practice', 'challenge', 'checklist', 'summary', 'next-steps']) {
    expect(await page.locator(`[data-lesson-section="${section}"]`).count(), `seção ${section}`).toBeGreaterThan(0);
  }
  await expect(page.locator('a[href="../../index.html"]').first()).toBeAttached();
  await expect(page.locator('a[href="../../slides/aula-07.html"]').first()).toBeAttached();
  expect(await page.locator(`a[href="${MIRO}"]`).count()).toBeGreaterThan(0);

  const localLinks = await page.locator('a[href]').evaluateAll(anchors => [...new Set(anchors
    .map(anchor => anchor.getAttribute('href'))
    .filter(href => !href.startsWith('#') && !/^(https?:|mailto:)/.test(href)))]);
  expect(localLinks).toEqual(expect.arrayContaining(['olist/carregar_olist.py', 'olist/estrela.sql']));
  for (const href of localLinks) {
    expect(href.endsWith('/'), `${href} aponta para diretório`).toBe(false);
    const response = await page.request.get(new URL(href, page.url()).href);
    expect(response.status(), `${href} deveria existir`).toBe(200);
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('material da aula 7 ensina Supabase com segurança e prova as armadilhas em SQL', async ({ page }) => {
  await page.goto('/materiais/aula-07/index.html');
  const conteudo = await page.locator('.content').innerText();

  for (const trecho of ['Session pooler', 'IPv6', 'getpass', 'Reset database password', 'SQL Editor', 'Table Editor',
    'python materiais/aula-07/olist/carregar_olist.py', 'git remote -v', 'pip install -r requirements.txt']) {
    expect(conteudo, `trecho ausente: ${trecho}`).toContain(trecho);
  }
  for (const numero of ['99.441', '96.096', '547', '775', '610', '96.478', '13.591.643,70', '14.209.115,34', '112.650']) {
    expect(conteudo, `número ausente: ${numero}`).toContain(numero);
  }
  for (const identificador of ['customer_unique_id', 'product_category_name_translati', 'product_name_lenght',
    'fato_itens_pedido', 'fato_pedidos', 'dim_tempo', 'dim_cliente', 'dim_produto', 'dim_vendedor', 'pedido_sk']) {
    expect(conteudo, `identificador ausente: ${identificador}`).toContain(identificador);
  }
  expect(conteudo, 'a senha nunca pode aparecer como exemplo preenchido').not.toMatch(/postgres\.[a-z0-9]{20}:[^[\s]/);

  const fluxo = page.locator('svg#fluxo-anotado-material');
  await expect(fluxo).toBeVisible();
  await expect(fluxo.locator('.passo')).toHaveCount(8);
  await expect(fluxo.locator('.ancora')).toHaveCount(3);
  await expect(page.locator('svg#estrela-material [data-tabela]')).toHaveCount(6);
  expect(await page.locator('.code-block').count()).toBeGreaterThanOrEqual(15);
  expect(await page.locator('.alert-box').count()).toBeGreaterThanOrEqual(2);
});

test('botões de copiar do material respondem e não entram no texto copiado', async ({ page, context, browserName }) => {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/materiais/aula-07/index.html');
  const botoes = page.locator('.copy-code');
  expect(await botoes.count()).toBe(await page.locator('.code-block').count());
  const primeiro = botoes.first();
  await primeiro.scrollIntoViewIfNeeded();
  await primeiro.click();
  await expect(primeiro).toHaveText(/Copiado|Selecione/);
  const copiado = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  if (copiado) expect(copiado).not.toContain('Copiar');
});
