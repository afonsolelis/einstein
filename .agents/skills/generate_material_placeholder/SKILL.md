---
name: generate_material_placeholder
description: Instruções e template para criar materiais (wikis) de aula de forma aprofundada, com design Light Mode focado em leitura e impressão.
---

# Padrão Arquitetural para Materiais de Aula (Wiki)

Sempre que for solicitado criar ou atualizar uma página de "Material", você DEVE estruturá-la como uma **Wiki Rica e Aprofundada**. O material deve ir muito além de um "placeholder vazio", atuando como um guia definitivo de estudo.

## 1. Conteúdo Nível "Wiki"
- **Contexto Histórico**: Explique o "porquê" das ferramentas, de onde vieram e que problema resolvem no mercado atual.
- **Teoria Aprofundada**: Se a aula é sobre Pandas, explique o que é um DataFrame de forma análoga a algo de negócios.
- **Blocos de Código (Hands-On)**: Sempre inclua múltiplos exemplos práticos de código resolvendo problemas de negócio reais.
- **Avisos e Boas Práticas**: Adicione blocos de alerta (ex: `div.alert-box`) para atenção crítica (ex: commit e push do notebook antes de encerrar o Codespace).
- **Ambiente Oficial**: Todo passo prático deve pressupor **GitHub Codespaces + Jupyter**, com bibliotecas já instaladas via `requirements.txt`. Não instruir uso de Google Colab, Google Drive ou instalação manual de Python; a persistência do trabalho é por `git commit` e `git push`.

## 2. Design System: Light Mode Premium & Print-Friendly
Os materiais são focados em leitura longa e impressão, portanto devem usar **EXCLUSIVAMENTE Light Mode**:
- **Tipografia**: `Outfit` para textos e `Fira Code` para blocos de código.
- **Cores**: Fundo principal `#f4f8fb`, container `#ffffff`, textos principais escuros `#334155` e `#1a2f5e`.
- **Botão de Impressão**: O rodapé DEVE conter `<button onclick="window.print()" class="btn btn-print">🖨️ Imprimir Material</button>`.
- **Controles Flutuantes**: O `<body>` DEVE começar com a `<nav class="floating-nav">` fixa no topo, com atalhos para o cronograma, para os slides da aula e para impressão. Ela acompanha a rolagem e some na impressão.
- **Media Query (`@media print`)**: O CSS DEVE conter regras para impressão (remover fundos, sombras, esconder a div `.actions` e a `.floating-nav`, usar fontes pretas em fundo branco).
- **Favicon**: Incluir sempre `<link rel="icon" type="image/png" href="../../assets/einstein-logo.png">` no `<head>`.

## 3. Template Base HTML/CSS

Sempre utilize o código abaixo como estrutura base exata do Material:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <link rel="icon" type="image/png" href="../../assets/einstein-logo.png">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Material · {{AULA_NUMERO}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Fira+Code:wght@400;600&display=swap');
    
    body { margin: 0; font-family: 'Outfit', system-ui, sans-serif; background: #f4f8fb; color: #334155; line-height: 1.7; padding: 3rem 1rem; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; }
    .container { max-width: 1100px; width: 100%; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2ebf2; }
    
    .header { padding: 4rem; position: relative; border-bottom: 2px solid #f0f4f8; background: #ffffff; }
    .badge { display: inline-block; background: rgba(0, 163, 217, 0.1); color: #1f6fb2; padding: 0.5rem 1.2rem; border-radius: 999px; font-weight: 800; font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1.5rem; border: 1px solid rgba(75, 196, 232, 0.3); }
    .header h1 { margin: 0; font-size: clamp(2rem, 4vw, 3rem); line-height: 1.2; color: #1a2f5e; font-weight: 800; letter-spacing: -1px; }
    
    .content { padding: 4rem; }
    .desc { font-size: 1.25rem; color: #64748b; margin-bottom: 3rem; font-weight: 400; }
    
    h2, h3 { color: #1a2f5e; font-weight: 600; margin-top: 3rem; margin-bottom: 1.5rem; }
    h2 { font-size: 2rem; border-bottom: 2px solid #f0f4f8; padding-bottom: 1rem; }
    h3 { font-size: 1.4rem; color: #00a3d9; }
    
    p { margin-bottom: 1.5rem; }
    ul, ol { padding-left: 1.5rem; margin-bottom: 2rem; }
    li { padding: 0.4rem 0; }
    strong { color: #1a2f5e; font-weight: 800; }
    em { color: #00a3d9; font-style: normal; font-weight: 600; }
    
    code { background: #e2ebf2; border: 1px solid #cbd5e1; padding: 0.2rem 0.5rem; border-radius: 6px; font-family: 'Fira Code', monospace; color: #1f6fb2; font-size: 0.9em; font-weight: 600; }
    
    .code-block { background: #f8fafc; color: #334155; padding: 1.5rem; border-radius: 12px; font-family: 'Fira Code', monospace; font-size: 1rem; line-height: 1.6; overflow-x: auto; margin: 2rem 0; border: 1px solid #e2ebf2; border-left: 4px solid #00a3d9; }
    .code-comment { color: #94a3b8; font-style: italic; }
    .code-keyword { color: #d946ef; font-weight: 600; }
    .code-string { color: #16a34a; }
    
    .alert-box { background: #fdf4ff; border-left: 4px solid #d946ef; padding: 1.5rem; border-radius: 0 12px 12px 0; margin: 2rem 0; border: 1px solid #fae8ff; border-left-width: 4px; }
    .alert-box h4 { margin: 0 0 0.5rem 0; color: #a21caf; }
    .alert-box p { margin: 0; font-size: 0.95rem; color: #701a75; }
    
    .actions { display: flex; gap: 1rem; justify-content: flex-start; flex-wrap: wrap; border-top: 2px solid #f0f4f8; padding-top: 3rem; margin-top: 3rem; }
    .btn { padding: 0.8rem 1.8rem; border-radius: 10px; font-weight: 600; text-decoration: none; transition: all 0.3s; display: inline-flex; align-items: center; gap: 0.6rem; font-family: 'Outfit', sans-serif; cursor: pointer; border: none; font-size: 1rem; }
    .btn:hover { transform: translateY(-2px); }
    
    .btn-home { background: #ffffff; color: #64748b; border: 1px solid #e2ebf2; }
    .btn-home:hover { background: #f8fafc; color: #1a2f5e; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
    .btn-slides { background: rgba(0, 163, 217, 0.1); color: #1f6fb2; border: 1px solid rgba(75, 196, 232, 0.3); }
    .btn-slides:hover { background: rgba(0, 163, 217, 0.15); color: #00a3d9; box-shadow: 0 5px 15px rgba(0,163,217,0.15); }
    .btn-print { background: #1a2f5e; color: #ffffff; }
    .btn-print:hover { background: #0b1120; box-shadow: 0 5px 15px rgba(26,47,94,0.3); }

    /* Controles flutuantes de navegacao */
    .floating-nav { position: fixed; top: 1rem; left: 50%; transform: translateX(-50%); z-index: 999; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid #e2ebf2; border-radius: 999px; box-shadow: 0 10px 30px rgba(26,47,94,0.14); max-width: calc(100% - 1.5rem); }
    .floating-nav a, .floating-nav button { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1.15rem; border-radius: 999px; border: 1px solid transparent; font-family: 'Outfit', system-ui, sans-serif; font-size: 0.9rem; font-weight: 600; line-height: 1; text-decoration: none; white-space: nowrap; cursor: pointer; transition: all 0.25s; }
    .floating-nav .nav-home { background: #ffffff; color: #64748b; border-color: #e2ebf2; }
    .floating-nav .nav-home:hover { background: #f8fafc; color: #1a2f5e; box-shadow: 0 5px 15px rgba(0,0,0,0.06); }
    .floating-nav .nav-slides { background: rgba(0, 163, 217, 0.12); color: #1f6fb2; border-color: rgba(75, 196, 232, 0.35); }
    .floating-nav .nav-slides:hover { background: rgba(0, 163, 217, 0.2); color: #00a3d9; box-shadow: 0 5px 15px rgba(0,163,217,0.18); }
    .floating-nav .nav-print { background: #1a2f5e; color: #ffffff; }
    .floating-nav .nav-print:hover { background: #0b1120; box-shadow: 0 5px 15px rgba(26,47,94,0.3); }
    .floating-nav a:focus-visible, .floating-nav button:focus-visible { outline: 3px solid rgba(0,163,217,0.45); outline-offset: 2px; }
    body { padding-top: 6rem; }

    @media (max-width: 768px) {
      .header, .content { padding: 2.5rem; }
      .actions { flex-direction: column; }
      .btn { width: 100%; justify-content: center; }
      .floating-nav { top: 0.6rem; gap: 0.35rem; padding: 0.35rem; }
      .floating-nav a, .floating-nav button { width: auto; padding: 0.5rem 0.8rem; font-size: 0.85rem; }
      body { padding-top: 4.75rem; }
    }

    @media (max-width: 480px) {
      .floating-nav .nav-label { display: none; }
      .floating-nav a, .floating-nav button { padding: 0.55rem 0.85rem; font-size: 1rem; }
    }

    @media print {
      body { background: white; padding: 0; display: block; font-size: 12pt; }
      .container { box-shadow: none; border: none; max-width: 100%; border-radius: 0; }
      .header, .content { padding: 1rem 0; }
      .actions, .btn-print, .btn-home, .btn-slides, .floating-nav { display: none !important; }
      body { padding-top: 0 !important; }
      h1, h2, h3 { color: black !important; break-after: avoid; }
      .badge { border: 1px solid #ccc; color: black; background: white; }
      .code-block { background: #f9f9f9; border: 1px solid #ccc; border-left: 4px solid black; break-inside: avoid; }
      .alert-box { background: white; border: 1px solid #ccc; border-left: 4px solid black; }
      p, li { color: black; }
      @page { margin: 2cm; }
    }
  </style>
</head>
<body>
  <nav class="floating-nav" aria-label="Navegação rápida do material">
    <a href="../../index.html" class="nav-home" title="Voltar ao cronograma">🏠 <span class="nav-label">Cronograma</span></a>
    <a href="../../slides/aula-{{AULA_NUMERO}}.html" class="nav-slides" title="Ver os slides da aula">📊 <span class="nav-label">Slides</span></a>
    <button type="button" onclick="window.print()" class="nav-print" title="Imprimir material">🖨️ <span class="nav-label">Imprimir</span></button>
  </nav>
  <div class="container">
    <div class="header">
      <div class="badge">LABORATÓRIO {{AULA_NUMERO}}</div>
      <h1>{{TITULO_AULA}}</h1>
    </div>
    
    <div class="content">
      <p class="desc">{{INTRODUCAO_EXTENSA_HISTORICA_E_CONCEITUAL}}</p>
      
      <h2>1. {{TITULO_TEORICO}}</h2>
      <p>{{TEXTO_TEORICO_APROFUNDADO}}</p>
      
      <div class="alert-box">
        <h4>{{TITULO_ALERTA}}</h4>
        <p>{{TEXTO_ALERTA_SOBRE_RISCOS_OU_BOAS_PRATICAS}}</p>
      </div>

      <h2>2. Hands-On: {{TITULO_PRATICO}}</h2>
      <p>{{EXPLICACAO_DO_CODIGO}}</p>
      <div class="code-block">
        <span class="code-comment"># Exemplo de código altamente formatado</span><br>
        <span class="code-keyword">import</span> biblioteca_exemplo<br>
        <br>
        variavel = <span class="code-string">"Hello Wiki"</span><br>
        <span class="code-keyword">print</span>(variavel)
      </div>

      <div class="actions">
        <a href="../../index.html" class="btn btn-home">🏠 Voltar ao Cronograma</a>
        <a href="../../slides/aula-{{AULA_NUMERO}}.html" class="btn btn-slides">📊 Ver Slides</a>
        <button onclick="window.print()" class="btn btn-print">🖨️ Imprimir Material</button>
      </div>
    </div>
  </div>
</body>
</html>
```

## 4. Navegação Offline
A div `actions` e a `nav.floating-nav` **DEVEM SEMPRE** conter os arquivos nomeados de forma exata terminando em `.html` (`../../index.html` e `../../slides/aula-XX.html`) para habilitar navegação offline com `file://`.
