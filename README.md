# 🔬 Laboratório de Ciência de Dados & IA — Albert Einstein

Site do **Laboratório de Ciência de Dados e Inteligência Artificial** da
**Faculdade Israelita de Ciências da Saúde Albert Einstein**, disciplina da
**Graduação em Administração** (Trilha BI & Data Science).

O site apresenta o cronograma completo das aulas em formato de cards, cada um
reunindo os **slides** e os **materiais de apoio** da respectiva aula.

🔗 **Site:** https://afonsolelis.github.io/einstein/ · **Repo:** https://github.com/afonsolelis/einstein

---

## 📋 Sobre a disciplina

| | |
|---|---|
| **Curso** | Graduação em Administração |
| **Trilha** | BI & Data Science |
| **Carga horária** | 80 horas |
| **Formato** | Laboratório prático (quartas, 19h–22h) |
| **Período** | 12/08 a 09/12 |
| **Avaliação** | Exclusivamente formativa (acompanhamento contínuo) |
| **Docente** | Prof. Afonso Cesar Lelis Brandão |

### Ementa

Introdução à Ciência de Dados e Inteligência Artificial. Fundamentos de
programação em **Python** para análise de dados. Manipulação e visualização de
dados com bibliotecas especializadas (**Pandas, NumPy, Matplotlib**). Introdução
a algoritmos de aprendizado de máquina e detecção de anomalias. Aplicações
práticas de análise estatística e forense numérica em conjuntos de dados reais.

### Objetivos

Ao concluir a unidade curricular, o estudante será capaz de:

- Compreender os fundamentos de Ciência de Dados e IA aplicados a negócios.
- Desenvolver habilidades de programação em Python para manipulação de dados.
- Utilizar Pandas, NumPy e Matplotlib para análise e visualização de dados.
- Aplicar aprendizado de máquina e detecção de anomalias em dados reais.
- Realizar análises estatísticas e forenses para suporte à decisão.

---

## 🗓️ Cronograma

| # | Data | Tema |
|---|------|------|
| 1 | 12/08 | Primeiros passos: Configurando sua ferramenta de análise |
| 2 | 19/08 | Organizando informações: Dados estruturados para gestão |
| 3 | 26/08 | Limpeza de dados: Preparando a base para análises |
| 4 | 02/09 | Entendendo o cenário: Estatística para gestão de negócios |
| 5 | 09/09 | Storytelling, Dashboards e Segmentação de Clientes |
| 6 | 16/09 | Inteligência Artificial no dia a dia da administração |
| 7 | 23/09 | Refinando dados para modelos de decisão |
| 8 | 30/09 | Fazendo previsões com IA: Vendas e Tendências |
| 9 | 07/10 | Testes A/B: Médias (t de Student), Proporções (Chi-quadrado) e Tamanho Amostral |
| 10 | 14/10 | Auditoria automatizada: Detectando anomalias e riscos |
| 11 | 21/10 | IA aplicada à estratégia e tomada de decisão |
| 12 | 28/10 | Análise forense de dados: Identificando fraudes |
| 13 | 04/11 | Fechando um balanço: Aplicações práticas |
| 14 | 11/11 | Projeto Integrador: Resolvendo um problema de negócio real |
| 15 | 18/11 | Apresentação de resultados e recomendações executivas |
| 16 | 25/11 | Introdução à análise forense numérica |
| 17 | 02/12 | Projeto prático: pipeline de dados |
| 18 | 09/12 | Apresentação de projetos |

---

## 📁 Estrutura do projeto

```
einstein/
├── index.html                  # Página principal (cronograma em cards)
├── assets/                     # Identidade visual Albert Einstein
│   ├── einstein-logo.png       #   Logo institucional (cabeçalho)
│   ├── einstein-header.jpg     #   Banner original do plano de ensino
│   ├── einstein-footer.jpg
│   └── einstein-cover.png      #   Capa do plano de ensino
├── slides/                     # Slides por aula
│   ├── aula-01.html
│   └── … aula-18.html
├── materiais/                  # Materiais de apoio por aula
│   ├── aula-01/index.html
│   └── … aula-18/index.html
└── Plano de Ensino e Aprendizagem - LABS.zip   # Documento fonte (.docx)
```

O `index.html` é um **único arquivo autossuficiente** (HTML + CSS + JS, sem
dependências ou build). Os cards são gerados a partir de um array `aulas`
declarado no próprio arquivo.

---

## 🚀 Como usar

### Visualizar localmente

Basta abrir o `index.html` no navegador:

```bash
# opção 1: abrir direto
xdg-open index.html      # Linux
open index.html          # macOS

# opção 2: servidor local (recomendado para navegar entre páginas)
python3 -m http.server 8000
# acesse http://localhost:8000
```

### Publicar no GitHub Pages

`Settings → Pages → Branch: main / root`. O site ficará disponível em
`https://afonsolelis.github.io/einstein/`.

---

## ✏️ Como editar o conteúdo

| Tarefa | O que editar |
|---|---|
| Alterar tema, data ou tag de uma aula | Array `aulas` dentro de `index.html` |
| Adicionar slides de uma aula | `slides/aula-XX.html` |
| Adicionar materiais (notebooks, datasets, leituras) | `materiais/aula-XX/` |
| Trocar cores / identidade visual | Variáveis CSS `:root` no `index.html` |

### Paleta (identidade Albert Einstein)

| Cor | Hex |
|---|---|
| Azul-marinho | `#1a2f5e` |
| Azul | `#1f6fb2` |
| Ciano | `#00a3d9` |
| Ciano claro | `#4bc4e8` |

---

## 👨‍🏫 Docente

**Afonso Cesar Lelis Brandão** — Software Engineer, Data Engineer, Industrial
Engineer e Pesquisador (ATAM). Leciona e mentora em Engenharia de Software,
Estruturas de Dados, Sistemas ERP e Big Data desde 2023, em instituições como
Inteli, Mackenzie, ESPM e Senac. Co-fundador da 1950colab desde 2016.

---

## 📄 Licença

🔓 Material de leitura aberta, criado para fins educacionais no âmbito da
Faculdade Israelita de Ciências da Saúde Albert Einstein.
