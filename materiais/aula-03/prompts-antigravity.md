# Aula 03 — Prompts para o Antigravity

Use estes prompts na ordem. Trabalhe em **modo orientado por revisão**: leia o plano e o diff, autorize comandos conscientemente e só avance quando a evidência pedida aparecer.

O arquivo `hospital_patients_real_world.csv` contém dados sintéticos e CC0. O processamento do CSV e do notebook ocorre no workspace, mas o serviço de IA pode processar prompts e arquivos mencionados conforme a política da conta. Nunca reutilize este roteiro com dados reais, pessoais, sigilosos ou credenciais.

## Prompt 0 — Contrato de trabalho

```text
Atue como meu assistente de qualidade de dados neste laboratório. Leia
@hospital_patients_real_world.csv, mas ainda não edite nem crie arquivos.
Primeiro apresente um plano curto e aguarde minha aprovação.

Regras obrigatórias: preservar o CSV bruto; não inventar valores ausentes;
não trocar datas por suposição; não excluir linhas silenciosamente; explicar
cada regra de negócio; trabalhar apenas dentro desta pasta; não instalar
pacotes nem executar comandos sem minha aprovação. A entrega terá notebook,
base tratada, fila de revisão, relatório de qualidade e revisão da IA.
```

## Prompt 1 — Perfil da base, sem limpar

```text
Crie Aula_03_SeuNome.ipynb. Nas primeiras células, importe pathlib e pandas,
carregue @hospital_patients_real_world.csv em um DataFrame chamado bruta e
mostre: cinco linhas, shape, nomes das colunas, dtypes, ausências por coluna,
linhas duplicadas, PatientID duplicado e valores únicos de Gender e Diagnosis.
Não faça nenhuma limpeza nesta etapa. Execute as células e resuma os achados.
Espero 5.000 linhas e 7 colunas; se divergir, pare e me avise.
```

## Prompt 2 — Cópia de trabalho e tipos

```text
No mesmo notebook, crie base = bruta.copy(deep=True) e nunca sobrescreva
bruta nem o CSV. Renomeie as colunas para snake_case. Converta identificadores,
gênero e diagnóstico para string; idade para Float64; datas para datetime com
errors="coerce". Conte falhas de conversão antes de prosseguir. Mostre o código,
a saída e explique por que cada tipo foi escolhido. Não faça imputação.
```

## Prompt 3 — Ausências sem adivinhação

```text
Adicione uma seção sobre dados ausentes. Crie flags booleanas que preservem a
origem das ausências em idade, gênero e diagnóstico. Mantenha idade ausente
como pd.NA. Padronize gênero vazio ou Unknown como "Não informado" e diagnóstico
vazio como "Não informado". Gere uma tabela antes/depois com quantidade e
percentual. Não use média, moda ou qualquer valor clínico inventado.
```

## Prompt 4 — Categorias consistentes

```text
Normalize espaços e capitalização de gender e diagnosis. Para gender, aplique
um dicionário explícito: Female→Feminino, Male→Masculino, Other→Outro e
Unknown/vazio→Não informado. Em diagnosis, una apenas variantes que diferem por
espaços ou capitalização; não faça aproximação clínica por significado.
Mostre value_counts antes/depois e registre o mapeamento aplicado.
```

## Prompt 5 — Chaves e duplicidades

```text
Audite duplicidade de linha completa e de patient_id. Não use drop_duplicates
automaticamente. Se houver linhas idênticas, apresente a evidência antes de
propor remoção. Se a mesma chave tiver conteúdos diferentes, crie a flag
chave_duplicada e envie esses registros para revisão. Registre também o caso
em que a contagem for zero. Explique a diferença entre linha duplicada e chave
de negócio duplicada.
```

## Prompt 6 — Regras hospitalares

```text
Implemente, sem apagar registros, as flags idade_fora_faixa para idade menor
que 0 ou maior que 110, hospital_id_invalido para valores fora do padrão
HOSP-[número] e cronologia_invalida quando discharge_date for anterior a
admission_date. Mostre contagens e amostras. Não inverta datas automaticamente.
Nesta versão espero 0 idades fora da faixa, 0 hospitais inválidos e 150
cronologias inválidas; se divergir, investigue antes de alterar a regra.
```

## Prompt 7 — Indicador derivado com segurança

```text
Crie dias_internacao somente para registros com datas válidas e cronologia
coerente. Nos demais casos use pd.NA e mantenha a flag de revisão. Converta o
resultado para Int64 anulável. Mostre describe(), mínimo, máximo e confirme que
nenhum valor negativo foi aceito. Explique por que corrigir para valor absoluto
seria uma decisão perigosa.
```

## Prompt 8 — Relatório antes/depois

```text
Crie um DataFrame relatorio_qualidade com as colunas metrica, antes, depois,
regra_aplicada e pendencia_humana. Inclua: linhas, duplicidades, chaves
duplicadas, ausências, gêneros não informados, categorias de diagnóstico,
capitalização inconsistente, idade fora da faixa, hospital inválido e cronologia
inválida. Salve como saidas/relatorio_qualidade.csv e exiba a tabela completa.
Não trate uma flag pendente como erro resolvido.
```

## Prompt 9 — Produtos da limpeza

```text
Exporte saidas/base_hospitalar_tratada.csv com todas as 5.000 linhas, campos
padronizados e flags. Exporte saidas/registros_para_revisao.csv com qualquer
regra crítica violada. Crie saidas/dicionario_de_dados.md explicando coluna,
tipo, significado, regra e possibilidade de ausência. Não inclua o índice do
DataFrame nos CSVs e não modifique o arquivo bruto.
```

## Prompt 10 — Testes e execução completa

```text
Adicione ao final do notebook asserts legíveis para: 5.000 linhas preservadas;
patient_id único; gêneros dentro do dicionário; nenhum dias_internacao negativo;
150 cronologias inválidas devidamente sinalizadas; arquivos de saída existentes.
Reinicie o kernel e execute todas as células em ordem. Se um teste falhar,
diagnostique a causa; não remova nem enfraqueça o teste para fazê-lo passar.
Mostre um resumo final das evidências.
```

## Prompt 11 — Auditoria da IA e versionamento

```text
Crie REVISAO_IA.md com: objetivo, prompts usados, sugestões aceitas, sugestões
rejeitadas, regras humanas, testes executados, limitações e decisão sobre uso da
base. Depois mostre git status e proponha comandos git add, commit e push apenas
para os arquivos desta entrega. Não execute commit ou push sem minha aprovação,
não crie remoto e nunca use force. Sugira a mensagem: "Documenta limpeza
auditável da base hospitalar".
```

## Conferência oral antes da entrega

O estudante deve conseguir explicar:

1. Por que o arquivo bruto nunca foi sobrescrito.
2. Por que ausência não é sinônimo de zero.
3. Por que a IA pode sugerir código, mas não definir uma regra clínica.
4. Por que as 150 datas incoerentes foram sinalizadas em vez de “consertadas”.
5. Quais evidências permitem reproduzir a limpeza.
