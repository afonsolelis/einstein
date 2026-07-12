---
name: generate_material_placeholder
description: Instruções para criar placeholders detalhados para materiais de aula, contendo explicações e tópicos.
---

# Como criar placeholders de material de aula

Sempre que for solicitado a criar um placeholder para uma página de "Material" (ou material de apoio de aula), você NÃO deve criar uma página genérica vazia.

Você deve seguir o seguinte padrão:
1. **Estrutura Visual**: Utilize um layout limpo, focado na leitura. O container principal deve ter uma largura confortável (ex: `max-width: 1100px;`) para não ficar espremido no desktop.
2. **Contextualização**: Inclua o número da aula e o tema exato (ex: `Aula 01: Primeiros passos`).
3. **Explicação Detalhada**: Escreva 1 a 2 parágrafos detalhando sobre o que a aula se trata (mesmo que seja um texto gerado por você baseado no tema). O tamanho da fonte deve ser agradável (ex: `font-size: 1.25rem`).
4. **Lista de Tópicos**: Apresente uma lista de `bullet points` limpos (sem `\n` explícitos no código fonte) com os temas e subtópicos exatos que seriam abordados na aula.
5. **Sem Menção a Arquivos Físicos**: NÃO adicione caixas de "Arquivos da Aula", "Faça o download do PDF", etc. O material é um placeholder explicativo e não deve prometer arquivos específicos na sala de aula ainda.
6. **Navegação (CRÍTICO)**: O placeholder DEVE conter links interativos (botões) para voltar ao cronograma e para os slides. **Regra de Ouro:** Qualquer link local DEVE terminar explicitamente em `index.html` (ex: `href="../../index.html"`) para que a navegação funcione perfeitamente quando o usuário abrir via explorador de arquivos (`file://`).

*Nota: Essa skill trava o padrão de qualidade, garantindo materiais ricos, responsivos e 100% navegáveis offline.*
