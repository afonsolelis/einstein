-- Aula 15 · Fase H: limpeza e detecção em SQL no CrateDB
--
-- Cada view reproduz uma etapa do notebook da aula com os mesmos parâmetros.
-- O carregador executa os comandos na ordem deste arquivo; linhas que começam
-- com "--" são ignoradas.

-- Limpeza orientada ao negócio: código de fornecedor normalizado e estornos fora.
CREATE OR REPLACE VIEW doc.v_pagamentos AS
SELECT pagamento_id,
       data_pagamento,
       upper(trim(fornecedor_id)) AS fornecedor_id,
       fornecedor_id AS fornecedor_original,
       nota_fiscal,
       valor,
       solicitante
FROM doc.contas_bruta
WHERE tipo = 'pagamento';

-- Regra 1: duplicidade pela chave fornecedor + nota fiscal + valor; a primeira ocorrência fica de fora.
CREATE OR REPLACE VIEW doc.v_duplicidade AS
SELECT pagamento_id, data_pagamento, fornecedor_id, nota_fiscal, valor, solicitante
FROM (
  SELECT p.*,
         row_number() OVER (PARTITION BY fornecedor_id, nota_fiscal, valor ORDER BY pagamento_id) AS ocorrencia
  FROM doc.v_pagamentos p
) t
WHERE ocorrencia > 1;

-- Regra 2: fornecedor ausente do cadastro, depois da normalização do código.
CREATE OR REPLACE VIEW doc.v_sem_cadastro AS
SELECT p.pagamento_id, p.data_pagamento, p.fornecedor_id, p.nota_fiscal, p.valor, p.solicitante
FROM doc.v_pagamentos p
LEFT JOIN doc.fornecedores f ON p.fornecedor_id = f.fornecedor_id
WHERE f.fornecedor_id IS NULL;

-- Regra 3: pagamento em sábado, domingo ou feriado nacional de 2025.
CREATE OR REPLACE VIEW doc.v_dia_nao_util AS
SELECT pagamento_id, data_pagamento, fornecedor_id, nota_fiscal, valor, solicitante
FROM doc.v_pagamentos
WHERE extract(day_of_week FROM data_pagamento) IN (6, 7)
   OR data_pagamento IN (SELECT data FROM doc.feriados);

-- Regra 4: fracionamento. Pagamentos entre R$ 9.000 e a alçada de R$ 10.000,
-- do mesmo fornecedor e solicitante, a até 6 dias um do outro, que somados
-- passam da alçada.
CREATE OR REPLACE VIEW doc.v_fracionamento AS
SELECT a.pagamento_id, a.data_pagamento, a.fornecedor_id, a.nota_fiscal, a.valor, a.solicitante,
       count(*) AS pagamentos_na_janela,
       sum(b.valor) AS soma_na_janela
FROM doc.v_pagamentos a
JOIN doc.v_pagamentos b
  ON a.fornecedor_id = b.fornecedor_id
 AND a.solicitante = b.solicitante
 AND abs(extract(epoch FROM a.data_pagamento) - extract(epoch FROM b.data_pagamento)) <= 6 * 86400
WHERE a.valor >= 9000 AND a.valor < 10000
  AND b.valor >= 9000 AND b.valor < 10000
GROUP BY a.pagamento_id, a.data_pagamento, a.fornecedor_id, a.nota_fiscal, a.valor, a.solicitante
HAVING count(*) >= 2 AND sum(b.valor) >= 10000;

-- Regra 5: proporção de valores redondos (múltiplos de R$ 100 a partir de R$ 1.000) por fornecedor.
CREATE OR REPLACE VIEW doc.v_redondo_fornecedor AS
SELECT fornecedor_id,
       count(*) AS pagamentos,
       sum(CASE WHEN valor >= 1000 AND valor % 100 = 0 THEN 1 ELSE 0 END) AS redondos,
       sum(CASE WHEN valor >= 1000 AND valor % 100 = 0 THEN 1 ELSE 0 END) * 1.0 / count(*) AS proporcao,
       count(*) >= 10
         AND sum(CASE WHEN valor >= 1000 AND valor % 100 = 0 THEN 1 ELSE 0 END) * 1.0 / count(*) >= 0.30 AS concentrado
FROM doc.v_pagamentos
GROUP BY fornecedor_id;

-- Lei de Benford: primeiro dígito dos pagamentos a partir de R$ 10, com a
-- proporção esperada log10(1 + 1/d).
CREATE OR REPLACE VIEW doc.v_benford_digitos AS
SELECT d.digito,
       log(1 + 1.0 / d.digito) AS esperada,
       coalesce(o.pagamentos, 0) * 1.0 / (SELECT count(*) FROM doc.v_pagamentos WHERE valor >= 10) AS observada,
       coalesce(o.pagamentos, 0) AS pagamentos
FROM (SELECT generate_series AS digito FROM generate_series(1, 9)) d
LEFT JOIN (
  SELECT floor(valor / power(10, floor(log(valor)))) AS digito, count(*) AS pagamentos
  FROM doc.v_pagamentos
  WHERE valor >= 10
  GROUP BY 1
) o ON d.digito = o.digito;

-- Benford por fornecedor com 50 ou mais pagamentos. O qui-quadrado tem 8 graus
-- de liberdade; o valor crítico para p < 0,001 é 26,12.
CREATE OR REPLACE VIEW doc.v_benford_fornecedor AS
SELECT n.fornecedor_id,
       n.pagamentos,
       sum(abs(coalesce(o.qtd, 0) * 1.0 / n.pagamentos - log(1 + 1.0 / d.digito))) / 9 AS mad,
       sum(power(coalesce(o.qtd, 0) - n.pagamentos * log(1 + 1.0 / d.digito), 2)
           / (n.pagamentos * log(1 + 1.0 / d.digito))) AS qui_quadrado,
       sum(power(coalesce(o.qtd, 0) - n.pagamentos * log(1 + 1.0 / d.digito), 2)
           / (n.pagamentos * log(1 + 1.0 / d.digito))) > 26.12 AS fora_benford
FROM (
  SELECT fornecedor_id, count(*) AS pagamentos
  FROM doc.v_pagamentos WHERE valor >= 10
  GROUP BY fornecedor_id HAVING count(*) >= 50
) n
CROSS JOIN (SELECT generate_series AS digito FROM generate_series(1, 9)) d
LEFT JOIN (
  SELECT fornecedor_id, floor(valor / power(10, floor(log(valor)))) AS digito, count(*) AS qtd
  FROM doc.v_pagamentos WHERE valor >= 10
  GROUP BY 1, 2
) o ON o.fornecedor_id = n.fornecedor_id AND o.digito = d.digito
GROUP BY n.fornecedor_id, n.pagamentos;

-- Uma linha por pagamento e sinal, com o peso da matriz de risco.
-- O Isolation Forest (peso 1) fica no notebook: nenhum dos seus 55 pagamentos
-- coincide com outro sinal, então a fila de exame não muda sem ele.
CREATE OR REPLACE VIEW doc.v_sinais AS
SELECT pagamento_id, 'duplicidade' AS sinal, 3 AS peso FROM doc.v_duplicidade
UNION ALL
SELECT pagamento_id, 'fracionamento', 3 FROM doc.v_fracionamento
UNION ALL
SELECT pagamento_id, 'sem_cadastro', 3 FROM doc.v_sem_cadastro
UNION ALL
SELECT pagamento_id, 'fornecedor_fora_benford', 2
FROM doc.v_pagamentos
WHERE fornecedor_id IN (SELECT fornecedor_id FROM doc.v_benford_fornecedor WHERE fora_benford)
UNION ALL
SELECT pagamento_id, 'dia_nao_util', 2 FROM doc.v_dia_nao_util
UNION ALL
SELECT pagamento_id, 'redondo_concentrado', 2
FROM doc.v_pagamentos
WHERE valor >= 1000 AND valor % 100 = 0
  AND fornecedor_id IN (SELECT fornecedor_id FROM doc.v_redondo_fornecedor WHERE concentrado);

-- Fila de exame: pontuação 2 ou mais, ordenada por pontuação e valor.
CREATE OR REPLACE VIEW doc.v_fila_exame AS
SELECT p.pagamento_id, p.data_pagamento, p.fornecedor_id, p.nota_fiscal, p.valor, p.solicitante,
       s.pontuacao, s.sinais
FROM (
  SELECT pagamento_id, sum(peso) AS pontuacao, string_agg(sinal, ', ') AS sinais
  FROM doc.v_sinais
  GROUP BY pagamento_id
) s
JOIN doc.v_pagamentos p ON p.pagamento_id = s.pagamento_id
WHERE s.pontuacao >= 2;

-- Série diária para o painel de tempo: pagamentos e valor por dia.
CREATE OR REPLACE VIEW doc.v_serie_diaria AS
SELECT date_trunc('day', data_pagamento) AS dia,
       count(*) AS pagamentos,
       sum(valor) AS valor_pago,
       sum(CASE WHEN valor >= 9000 AND valor < 10000 THEN 1 ELSE 0 END) AS na_faixa_da_alcada
FROM doc.v_pagamentos
GROUP BY 1;

-- Monitor diário: valor pago no dia comparado à média dos 20 dias anteriores
-- com pagamento mais três desvios padrão. O CrateDB não aceita janela que
-- termina antes da linha atual; por isso a janela inclui o dia e a conta
-- retira o próprio dia das somas.
CREATE OR REPLACE VIEW doc.v_monitor_diario AS
SELECT dia,
       valor_pago,
       media_20d,
       media_20d + 3 * sqrt(greatest(soma_quadrados / dias_anteriores - media_20d * media_20d, 0)) AS limite_superior,
       dias_anteriores >= 10
         AND valor_pago > media_20d + 3 * sqrt(greatest(soma_quadrados / dias_anteriores - media_20d * media_20d, 0)) AS acima_do_limite
FROM (
  SELECT dia,
         valor_pago,
         n - 1 AS dias_anteriores,
         (s1 - valor_pago) / (n - 1) AS media_20d,
         s2 - valor_pago * valor_pago AS soma_quadrados
  FROM (
    SELECT dia,
           valor_pago,
           count(*) OVER (ORDER BY dia ROWS BETWEEN 20 PRECEDING AND CURRENT ROW) AS n,
           sum(valor_pago) OVER (ORDER BY dia ROWS BETWEEN 20 PRECEDING AND CURRENT ROW) AS s1,
           sum(valor_pago * valor_pago) OVER (ORDER BY dia ROWS BETWEEN 20 PRECEDING AND CURRENT ROW) AS s2
    FROM doc.v_serie_diaria
  ) janela
  WHERE n > 1
) estatisticas;

-- Resumo da fila por sinal, para o dashboard e a conferência da carga.
-- Parte da fila agregada: no CrateDB 5.10, um JOIN direto sobre v_sinais
-- filtrado por sinal devolve contagens erradas.
CREATE OR REPLACE VIEW doc.v_painel_resumo AS
SELECT sinais AS sinal,
       count(*) AS pagamentos,
       round(sum(valor) * 100) / 100.0 AS valor_total
FROM doc.v_fila_exame
GROUP BY sinais;
