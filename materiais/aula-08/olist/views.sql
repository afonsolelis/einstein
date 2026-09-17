-- As 10 perguntas do Chief de Vendas, uma view por pergunta.
-- Depende de estrela.sql. Execute inteiro no SQL Editor do Supabase.
-- Convenções: receita = soma do preço dos itens (sem frete) de pedidos entregues;
-- período = meses completos da base, de janeiro de 2017 a agosto de 2018.

drop view if exists public.vw_p01_receita_mensal, public.vw_p02_dia_hora, public.vw_p03_top_categorias,
  public.vw_p04_crescimento_categorias, public.vw_p05_receita_estado, public.vw_p06_frete_regiao,
  public.vw_p07_atraso_estado, public.vw_p08_nota_prazo, public.vw_p09_recompra,
  public.vw_p10_concentracao_vendedores;

-- Base comum: itens entregues no período, já com as dimensões
create or replace view public.vw_itens_entregues with (security_invoker = on) as
select i.*, t.data, t.ano, t.mes, t.ano_mes, c.estado as estado_cliente, c.regiao as regiao_cliente,
       p.categoria
from public.fato_itens_pedido i
join public.dim_tempo t   using (data_sk)
join public.dim_cliente c using (cliente_sk)
join public.dim_produto p using (produto_sk)
where i.status = 'delivered' and t.data between '2017-01-01' and '2018-08-31';

-- P01 · Tempo · Como evoluíram receita e pedidos mês a mês?
create view public.vw_p01_receita_mensal with (security_invoker = on) as
select ano_mes, round(sum(preco), 2) as receita, count(distinct pedido_sk) as pedidos,
       round(sum(preco) / count(distinct pedido_sk), 2) as ticket_medio
from public.vw_itens_entregues
group by ano_mes order by ano_mes;

-- P02 · Tempo · Em que dia da semana e em que faixa de horário o cliente compra?
create view public.vw_p02_dia_hora with (security_invoker = on) as
select t.dia_semana, t.nome_dia_semana,
       case when p.hora_compra < 6 then '1 madrugada' when p.hora_compra < 12 then '2 manhã'
            when p.hora_compra < 18 then '3 tarde' else '4 noite' end as faixa_horario,
       count(*) as pedidos
from public.fato_pedidos p
join public.dim_tempo t using (data_sk)
where p.status = 'delivered' and t.data between '2017-01-01' and '2018-08-31'
group by 1, 2, 3 order by 1, 3;

-- P03 · Categoria · Quais 10 categorias concentram a receita e qual o ticket de cada?
create view public.vw_p03_top_categorias with (security_invoker = on) as
select categoria, round(sum(preco), 2) as receita,
       round(100 * sum(preco) / sum(sum(preco)) over (), 1) as participacao_pct,
       count(distinct pedido_sk) as pedidos,
       round(sum(preco) / count(distinct pedido_sk), 2) as ticket_medio
from public.vw_itens_entregues
group by categoria order by receita desc limit 10;

-- P04 · Categoria · Quais categorias mais cresceram de jan–ago/2017 para jan–ago/2018?
-- Só entram categorias com pelo menos R$ 50 mil em 2017: crescimento sobre base pequena engana.
create view public.vw_p04_crescimento_categorias with (security_invoker = on) as
select categoria,
       round(sum(preco) filter (where ano = 2017), 2) as receita_2017,
       round(sum(preco) filter (where ano = 2018), 2) as receita_2018,
       round(100 * (sum(preco) filter (where ano = 2018) / sum(preco) filter (where ano = 2017) - 1), 1)
         as crescimento_pct
from public.vw_itens_entregues
where mes <= 8
group by categoria
having sum(preco) filter (where ano = 2017) >= 50000
order by crescimento_pct desc limit 10;

-- P05 · Geografia · Como a receita se distribui por estado do cliente?
create view public.vw_p05_receita_estado with (security_invoker = on) as
select estado_cliente as estado, round(sum(preco), 2) as receita,
       round(100 * sum(preco) / sum(sum(preco)) over (), 1) as participacao_pct,
       count(distinct pedido_sk) as pedidos
from public.vw_itens_entregues
group by estado_cliente order by receita desc;

-- P06 · Geografia · Quanto o frete pesa sobre o preço em cada região?
create view public.vw_p06_frete_regiao with (security_invoker = on) as
select regiao_cliente as regiao, round(100 * sum(frete) / sum(preco), 1) as frete_sobre_preco_pct,
       round(avg(frete), 2) as frete_medio_item, count(*) as itens
from public.vw_itens_entregues
group by regiao_cliente order by frete_sobre_preco_pct desc;

-- P07 · Prazo · Em que estados mais se entrega com atraso?
-- Estados com menos de 500 entregas ficam de fora: a taxa oscila demais.
create view public.vw_p07_atraso_estado with (security_invoker = on) as
select c.estado, count(*) as entregas,
       round(100 * (1 - avg(p.entregue_no_prazo)), 1) as atraso_pct,
       round(avg(p.dias_entrega), 1) as dias_entrega_medio
from public.fato_pedidos p
join public.dim_tempo t   using (data_sk)
join public.dim_cliente c using (cliente_sk)
where p.status = 'delivered' and p.entregue_no_prazo is not null
  and t.data between '2017-01-01' and '2018-08-31'
group by c.estado having count(*) >= 500
order by atraso_pct desc;

-- P08 · Satisfação · O atraso derruba a nota do cliente?
create view public.vw_p08_nota_prazo with (security_invoker = on) as
select case p.entregue_no_prazo when 1 then 'no prazo' else 'com atraso' end as entrega,
       count(*) as pedidos_avaliados,
       round(avg(p.nota_avaliacao), 2) as nota_media,
       round(100 * avg((p.nota_avaliacao <= 2)::int), 1) as notas_1_e_2_pct
from public.fato_pedidos p
join public.dim_tempo t using (data_sk)
where p.status = 'delivered' and p.entregue_no_prazo is not null and p.nota_avaliacao is not null
  and t.data between '2017-01-01' and '2018-08-31'
group by 1 order by 1 desc;

-- P09 · Livre · Quantos clientes voltam a comprar?
create view public.vw_p09_recompra with (security_invoker = on) as
with por_cliente as (
  select p.cliente_sk, count(*) as pedidos
  from public.fato_pedidos p
  join public.dim_tempo t using (data_sk)
  where p.status = 'delivered' and t.data between '2017-01-01' and '2018-08-31'
  group by p.cliente_sk
)
select count(*) as clientes,
       count(*) filter (where pedidos > 1) as clientes_recorrentes,
       round(100.0 * count(*) filter (where pedidos > 1) / count(*), 2) as recompra_pct
from por_cliente;

-- P10 · Livre · Quanto a receita depende dos maiores vendedores?
create view public.vw_p10_concentracao_vendedores with (security_invoker = on) as
with por_vendedor as (
  select vendedor_sk, sum(preco) as receita from public.vw_itens_entregues group by vendedor_sk
), faixas as (
  select receita, ntile(10) over (order by receita desc) as decil from por_vendedor
)
select decil, count(*) as vendedores, round(sum(receita), 2) as receita,
       round(100 * sum(receita) / sum(sum(receita)) over (), 1) as participacao_pct
from faixas group by decil order by decil;

grant select on public.vw_itens_entregues, public.vw_p01_receita_mensal, public.vw_p02_dia_hora,
  public.vw_p03_top_categorias, public.vw_p04_crescimento_categorias, public.vw_p05_receita_estado,
  public.vw_p06_frete_regiao, public.vw_p07_atraso_estado, public.vw_p08_nota_prazo, public.vw_p09_recompra,
  public.vw_p10_concentracao_vendedores to anon, authenticated;
