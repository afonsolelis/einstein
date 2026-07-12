---
name: generate_slide_placeholder
description: Instruções e template para criar placeholders de slides interativos em HTML/JS.
---

# Padrão de Slides do Projeto (Presentation App)

Sempre que você precisar criar, atualizar ou gerar um arquivo de slide (ex: `slides/aula-XX.html`), você **DEVE** utilizar a seguinte estrutura de apresentação interativa com JavaScript (nada de páginas estáticas simples).

## Regras Estruturais
1. O body deve ter `overflow: hidden; background: #16233d; color: white;`.
2. O conteúdo dos slides deve ficar dentro de uma `<div id="slider">`.
3. Cada slide é uma `<div class="slide">` com opacidade controlada via JS.
4. **Rodapé de Controles**: O slide deve incluir uma `<div id="controls">` fixada no rodapé contendo:
   - Botão 🏠 Home (`<a href="../index.html">`)
   - Botão 📎 Material (`<a href="../materiais/aula-XX/index.html">`) **OBS: SEMPRE inclua index.html no final para suportar acessos locais via file://.**
   - Botões de navegação: Anterior (◄), Próximo (►) e Tela Cheia (⛶).
5. **Navegação JS**: Inclua sempre o script para fazer a navegação por teclado (Setas e Espaço) e clique nos botões.

## Template Base

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aula XX · Slides</title>
  <style>
    /* Cole aqui os estilos oficiais de slides (ver arquivos existentes como aula-01.html) */
    /* Garanta estilos para #slider, .slide, .slide-start, .slide-end e #controls */
  </style>
</head>
<body>
  <div id="slider">
    <!-- Slide Inicial -->
    <div class="slide slide-start active">
      <div class="badge">AULA XX · DD/MM</div>
      <h1>Laboratório de Dados &amp; IA</h1>
      <p>[Tema da Aula]</p>
    </div>
    
    <!-- Se for Aula 01, inclua o slide do professor aqui -->

    <!-- Slide Final -->
    <div class="slide slide-end">
      <h2>Fim da Aula XX</h2>
      <p>Obrigado pela atenção!</p>
    </div>
  </div>

  <div id="controls">
    <div class="footer-text">Faculdade Albert Einstein · Laboratório de Programação, Ciência de Dados &amp; IA</div>
    <div class="btn-group">
      <a href="../index.html" class="ctrl-btn" title="Voltar ao Cronograma"><span class="ctrl-icon">🏠</span> Home</a>
      <a href="../materiais/aula-XX/index.html" class="ctrl-btn" title="Ir para o Material"><span class="ctrl-icon">📎</span> Material</a>
      <button class="ctrl-btn ctrl-btn-only-icon" id="btn-prev">◄</button>
      <button class="ctrl-btn ctrl-btn-only-icon" id="btn-next">►</button>
      <button class="ctrl-btn ctrl-btn-only-icon" id="btn-fs">⛶</button>
    </div>
  </div>

  <script>
    // Cole aqui a lógica JS de atualização de classe 'active' e listeners de teclado/botões.
  </script>
</body>
</html>
```
