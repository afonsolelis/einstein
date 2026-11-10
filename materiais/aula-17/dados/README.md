# Base da Aula 17

Arquivo: `rh_enfermagem.csv`

A base é sintética e foi gerada pelo script `gerar_rh.py`, nesta pasta, com a semente `2025`. Ela descreve a equipe de enfermagem de uma rede hospitalar fictícia ao longo de 2025, com um registro por profissional. Nenhum registro corresponde a pessoa real, e a rede, as unidades e os números não representam nenhuma instituição existente.

Para reconstruir o arquivo, execute a partir da raiz do repositório:

```bash
python materiais/aula-17/dados/gerar_rh.py
```

## Inventário verificável

- 3.090 linhas e 16 colunas, com 3.000 profissionais distintos.
- SHA-256 do CSV: `dfaebee6ba7b5cf2093bbf31b1b728f5a4220367c8f03ca6dbfd2a5a5f9cc7b4`.
- Colunas: `id_profissional`, `data_registro`, `unidade`, `cargo`, `turno`, `tempo_casa_meses`, `horas_extras_mes`, `salario_vs_mercado`, `distancia_km`, `avaliacao_lider`, `treinamentos`, `faltas`, `idade`, `genero`, `desligou` e `motivo_desligamento`.
- `salario_vs_mercado` é a razão entre o salário do profissional e a mediana de mercado do cargo; 1,00 significa salário igual à mediana.
- `avaliacao_lider` é a nota média dada pela equipe à liderança imediata, de 1 a 5.
- `motivo_desligamento` fica vazio para quem permaneceu.

## Relações plantadas na geração

- A probabilidade de pedido de demissão cresce com as horas extras, com o turno noturno e com a distância até o trabalho.
- A probabilidade cai com o salário em relação ao mercado, com a avaliação da liderança, com o tempo de casa e com os treinamentos.
- A Unidade Leste tem avaliação de liderança mais baixa e mais horas extras do que as demais unidades.
- As faltas dependem do turno noturno e das horas extras, mas não entram no cálculo da saída. A associação entre faltas e saída é, portanto, efeito do turno, e desaparece quando se compara dentro de cada turno.
- Idade e gênero não entram no cálculo da saída.

## Problemas plantados para a limpeza

- 90 profissionais transferidos entre unidades aparecem duas vezes; o registro mais antigo é o da unidade de origem.
- 107 admissões de dezembro têm `tempo_casa_meses` igual a zero e ainda não têm ciclo observável de permanência.
- 104 desligamentos não são rotatividade voluntária: 40 aposentadorias e 64 fins de contrato temporário.
- Restam 2.789 profissionais e 483 pedidos de demissão, uma taxa de rotatividade voluntária de 17,3%.

Essas contagens servem de conferência para a prática da aula. Elas não autorizam remover registros sem uma regra de negócio declarada.
