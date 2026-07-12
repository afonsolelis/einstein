---
name: design_system
description: Sistema de design (Design System) contendo as regras oficiais de paleta de cores, tipografia, componentes e CSS das apresentações e páginas do projeto.
---

# Albert Einstein Data & IA - Design System

Este Design System consolida a identidade visual premium criada para o laboratório. Todo código front-end (HTML/CSS) novo deve seguir estritamente essas diretrizes para manter o padrão "Dark Mode Premium com Glassmorphism".

## 1. Tipografia e Cores Base

- **Fontes Primárias**:
  - `Outfit` (Google Fonts): Utilizada para todo o texto corrido, títulos e botões. Pesos sugeridos: `300` (light), `400` (regular), `600` (semibold), `800` (extrabold).
  - `Fira Code` (Google Fonts): Utilizada para blocos de código e nomes de funções/arquivos.
- **Background Principal (Dark Mode)**:
  - Cor sólida base: `#0b1120`
  - Gradiente radial para profundidade: `radial-gradient(circle at 100% 0%, rgba(31, 111, 178, 0.15) 0%, #0b1120 50%)`
- **Textos e Contraste**:
  - Títulos principais (H1): `background: linear-gradient(to right, #ffffff, #4bc4e8); -webkit-background-clip: text; color: transparent;`
  - Textos de conteúdo (P, LI): `#cbd5e1` ou `#94a3b8` para textos secundários.

## 2. Paleta Oficial da Marca
- Azul Escuro Profundo: `#0b1120`
- Azul Marinho (Legado): `#1a2f5e`
- Azul Principal: `#1f6fb2`
- Ciano Vibrante (Destaque principal): `#00a3d9`
- Ciano Claro (Brilhos e glows): `#4bc4e8`

## 3. Elementos de UI Premium

### 3.1. Glassmorphism (Painéis e Controles)
Para componentes flutuantes (como barras de controle ou menus):
```css
background: rgba(15, 23, 42, 0.4);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-top: 1px solid rgba(255,255,255,0.05);
box-shadow: 0 -10px 30px rgba(0,0,0,0.2);
```

### 3.2. Badges (Pílulas de Data/Aula)
Sempre usar estilo de alto contraste com neon:
```css
background: rgba(0, 163, 217, 0.1);
color: #4bc4e8;
border: 1px solid rgba(75, 196, 232, 0.3);
box-shadow: 0 0 20px rgba(0, 163, 217, 0.15);
```

### 3.3. Blocos de Código (Code Blocks)
Padrão "Atom One Dark" customizado:
```css
background: rgba(15, 23, 42, 0.6);
color: #e2ebf2;
border-radius: 16px;
border: 1px solid rgba(255,255,255,0.05);
border-left: 4px solid #00a3d9;
box-shadow: 0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
backdrop-filter: blur(10px);
```
**Syntax Highlighting:**
- Comentários: `#64748b` (italic)
- Keywords (if, import, print): `#c678dd`
- Strings: `#98c379`

### 3.4. Animações e Transições
Para transições de páginas e slides, use *cubic-bezier* para movimento natural (não linear):
```css
transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
/* Estado inicial: */ transform: translateY(30px) scale(0.98);
/* Estado final: */ transform: translateY(0) scale(1);
```

### 3.5. Bullets customizados (Listas)
Em listas de conteúdo (`<ul>`), remova o ponto padrão e use um ponto neon:
```css
li::before { content: ''; position: absolute; left: 0; top: 12px; width: 8px; height: 8px; background: #00a3d9; border-radius: 50%; box-shadow: 0 0 8px #00a3d9; }
```
