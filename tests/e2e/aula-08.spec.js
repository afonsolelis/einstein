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

async function activeDimensions(page) {
  return page.locator('.slide.active').evaluate(element => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth
  }));
}

async function goToSlide(page, title) {
  const target = await page.locator('.slide').evaluateAll(
    (slides, text) => slides.findIndex(slide => (slide.querySelector('h2')?.textContent || '').includes(text)), title
  );
  expect(target, `slide "${title}" não encontrado`).toBeGreaterThan(0);
  for (let index = 0; index < target; index += 1) await page.keyboard.press('ArrowRight');
  await expect(page.locator('.slide').nth(target)).toHaveClass(/active/);
}

test('aula 8 percorre todos os slides por botões sem corte e chega ao material', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-08.html');
  const previous = page.locator('#btn-prev');
  const next = page.locator('#btn-next');
  const total = await page.locator('.slide').count();
  expect(total).toBeGreaterThanOrEqual(20);
  await expect(page.locator('#slide-counter')).toHaveText(`1 / ${total}`);
  await expect(previous).toBeDisabled();

  for (let index = 1; index < total; index += 1) {
    await next.click();
    await expect(page.locator('#slide-counter')).toHaveText(`${index + 1} / ${total}`);
    const dimensions = await activeDimensions(page);
    expect(dimensions.scrollHeight, `slide ${index + 1} foi cortado verticalmente`).toBeLessThanOrEqual(dimensions.clientHeight);
    expect(dimensions.scrollWidth, `slide ${index + 1} foi cortado horizontalmente`).toBeLessThanOrEqual(dimensions.clientWidth);
  }
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(page.locator('#slide-counter')).toHaveText(`${total - 1} / ${total}`);

  await expect(page.locator('#controls a[href="../index.html"]')).toBeVisible();
  await expect(page.locator(`#controls a[href="${MIRO}"]`)).toHaveAttribute('target', '_blank');
  await page.locator('#controls a[href="../materiais/aula-08/index.html"]').click();
  await expect(page).toHaveURL(/\/materiais\/aula-08\/index\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Brainstorming de fluxo: das 10 perguntas às views');
  expect(errors).toEqual([]);
});

test('slides da aula 8 navegam por teclado respeitando os limites', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-08.html');
  const total = await page.locator('.slide').count();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#slide-counter')).toHaveText(`1 / ${total}`);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press(' ');
  await expect(page.locator('#slide-counter')).toHaveText(`3 / ${total}`);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#slide-counter')).toHaveText(`2 / ${total}`);
  for (let index = 0; index < total + 3; index += 1) await page.keyboard.press('ArrowRight');
  await expect(page.locator('#slide-counter')).toHaveText(`${total} / ${total}`);
  await expect(page.locator('#btn-next')).toBeDisabled();
  await expect(page.locator('.slide').last()).toHaveClass(/active/);
  expect(errors).toEqual([]);
});

test('slide mostra o formato do fluxo anotado em SVG com raias, passos e âncora', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/slides/aula-08.html');
  await goToSlide(page, 'O formato do fluxo de interação anotado');
  await expect(page.locator('#slide-formato')).toHaveClass(/active/);

  const formato = page.locator('#slide-formato svg.flow-svg[role="img"]');
  await expect(formato).toBeVisible();
  await expect(page.locator('#svg-formato-t')).toHaveText('Formato do fluxo de interação anotado');
  await expect(page.locator('#svg-formato-d')).toHaveCount(1);
  for (const raia of ['TAREFA', 'USUÁRIO', 'INTERFACE', 'DADO', 'D1']) {
    await expect(formato.locator('text', { hasText: raia }).first()).toBeAttached();
  }
  await expect(formato.locator('rect.pi-usuario')).toHaveCount(4);
  await expect(formato.locator('rect.pi-interface')).toHaveCount(4);
  await expect(formato.locator('rect.pi-dado')).toHaveCount(4);
  await expect(formato.locator('rect.tag-d')).toHaveCount(1);
  await expect(formato.locator('.step-num')).toHaveCount(6);
  const fills = await formato.locator('rect.pi, rect.tag-d').evaluateAll(nodes =>
    [...new Set(nodes.map(node => getComputedStyle(node).fill))]
  );
  expect(fills).toEqual(expect.arrayContaining(['rgb(253, 230, 138)', 'rgb(191, 219, 254)', 'rgb(187, 247, 208)', 'rgb(249, 168, 212)']));
  const box = await formato.boundingBox();
  expect(box.height).toBeGreaterThan(150);

  await page.keyboard.press('ArrowRight');
  const exemplo = page.locator('#slide-exemplo-p06 svg.flow-svg[role="img"]');
  await expect(exemplo).toBeVisible();
  await expect(exemplo.locator('.step-num')).toHaveCount(8);
  await expect(exemplo.locator('rect.tag-d')).toHaveCount(3);
  await expect(exemplo.locator('text', { hasText: 'vw_p06_frete_regiao' })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('botões de cópia dos slides copiam o SQL de conferência', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors = watchPage(page);
  await page.goto('/slides/aula-08.html');
  const slide = page.locator('.slide', { has: page.locator('h2', { hasText: 'Confira contra a referência' }) });
  await goToSlide(page, 'Confira contra a referência');
  const button = slide.locator('.copy-prompt');
  await button.click();
  await expect(button).toHaveText('Copiado ✓');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("union all select 'P09', recompra_pct::text, '3.00' from vw_p09_recompra");
  expect(copied).not.toContain('Copiar');
  expect(errors).toEqual([]);
});

test('material explica as 10 views com o SQL idêntico ao gabarito e os números de referência', async ({ page, request }) => {
  const errors = watchPage(page);
  const response = await request.get('/materiais/aula-08/olist/views.sql');
  expect(response.ok()).toBeTruthy();
  const gabarito = await response.text();
  const statements = gabarito.match(/create (?:or replace )?view public\.vw_[a-z0-9_]+ with \(security_invoker = on\) as[\s\S]*?;/g);
  expect(statements).toHaveLength(11);

  await page.goto('/materiais/aula-08/index.html');
  const blocks = await page.locator('.view-card .code-block').allInnerTexts();
  expect(blocks).toHaveLength(11);
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  const joined = normalize(blocks.join('\n'));
  for (const statement of statements) {
    expect(joined, `SQL divergente do gabarito: ${statement.slice(0, 60)}`).toContain(normalize(statement));
  }

  for (let n = 1; n <= 10; n += 1) {
    const code = `P${String(n).padStart(2, '0')}`;
    const card = page.locator(`#view-p${String(n).padStart(2, '0')}`);
    await expect(card.locator('h3')).toContainText(code);
    await expect(card.locator('dt')).toHaveText(['O que calcula', 'Grão', 'Filtro', 'Cuidado de leitura']);
    await expect(card.locator('.ref')).toContainText('Referência');
  }

  const content = await page.locator('.content').innerText();
  for (const numero of ['13.181.027,13', '96.211', '987.765,37', '15.660', '211,89', '268,6%', '38,4%', '22,7%', '17,5%', '2,27', '2.789 de 93.104', '67,0%']) {
    expect(content, `número de referência ${numero} ausente`).toContain(numero);
  }
  expect(errors).toEqual([]);
});

test('material traz o fluxo anotado, a dinâmica do brainstorming e o teste da API', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors = watchPage(page);
  await page.goto('/materiais/aula-08/index.html');

  for (const id of ['fig-formato', 'fig-p06']) {
    await expect(page.locator(`svg#${id}[role="img"]`)).toBeVisible();
    await expect(page.locator(`#${id}-t`)).toHaveCount(1);
    await expect(page.locator(`#${id}-d`)).toHaveCount(1);
  }
  for (const section of ['objectives', 'concepts', 'guided-practice', 'challenge', 'checklist', 'summary', 'next-steps']) {
    expect(await page.locator(`section[data-lesson-section="${section}"]`).count(), section).toBeGreaterThan(0);
  }
  await expect(page.getByRole('heading', { name: '6.3 Regras para não virar debate de gosto' })).toBeVisible();
  await expect(page.locator('td', { hasText: 'Crazy 8s' })).toHaveCount(1);
  await expect(page.locator(`a[href="${MIRO}"]`)).toHaveCount(3);
  await expect(page.locator('.code-block', { hasText: '/rest/v1/vw_p09_recompra?select=*' })).toHaveCount(1);
  await expect(page.locator('.code-block', { hasText: 'Frame do dashboard no Miro' })).toHaveCount(1);

  const copy = page.locator('.code-block', { hasText: '/rest/v1/vw_p09_recompra?select=*' }).locator('xpath=..').locator('.copy-btn');
  await copy.click();
  await expect(copy).toHaveText('Copiado ✓');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Authorization: Bearer $SUPABASE_KEY');

  await expect(page.getByRole('button', { name: /Imprimir Material/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('links locais da aula 8 apontam para arquivos existentes e nada transborda', async ({ page, request }) => {
  const errors = watchPage(page);
  for (const path of ['/slides/aula-08.html', '/materiais/aula-08/index.html']) {
    await page.goto(path);
    const hrefs = await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')));
    for (const href of hrefs.filter(h => !/^(https?:|mailto:|#)/.test(h))) {
      expect(href, `${path}: link para diretório`).not.toMatch(/\/$/);
      const target = new URL(href, `http://127.0.0.1:8765${path}`).pathname;
      const response = await request.get(target);
      expect(response.status(), `${path} → ${href}`).toBe(200);
    }
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${path} excedeu o viewport`).toBeLessThanOrEqual(dimensions.viewport);
  }
  expect(errors).toEqual([]);
});
