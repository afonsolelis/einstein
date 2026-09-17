-- Esquema estrela do case "Estratégias de vendas da Olist"
-- Origem: schema bruto (carregado por carregar_olist.py). Destino: schema public.
-- Execute inteiro no SQL Editor do Supabase. Pode ser executado de novo: recria tudo.

drop table if exists public.fato_itens_pedido, public.fato_pedidos,
  public.dim_tempo, public.dim_cliente, public.dim_produto, public.dim_vendedor cascade;
drop table if exists pg_temp.uf_regiao, pg_temp.pedido_chave;

-- dim_tempo · grão: um dia do período de compras
create table public.dim_tempo as
select to_char(d, 'YYYYMMDD')::int              as data_sk,
       d::date                                  as data,
       extract(year from d)::int                as ano,
       extract(month from d)::int               as mes,
       to_char(d, 'YYYY-MM')                    as ano_mes,
       to_char(d, 'YYYY-"T"Q')                  as trimestre,
       extract(isodow from d)::int              as dia_semana,
       (array['segunda','terça','quarta','quinta','sexta','sábado','domingo'])[extract(isodow from d)::int]
                                                as nome_dia_semana
from generate_series((select min(order_purchase_timestamp)::date from bruto.orders),
                     (select max(order_purchase_timestamp)::date from bruto.orders),
                     interval '1 day') as d;
alter table public.dim_tempo add primary key (data_sk);

-- dim_cliente · grão: uma pessoa (customer_unique_id), não um customer_id por pedido.
-- Quem comprou de endereços diferentes fica com o endereço do pedido mais recente.
create table public.dim_cliente as
select row_number() over (order by cliente_id)::int as cliente_sk, *
from (
  select distinct on (c.customer_unique_id)
         c.customer_unique_id as cliente_id, c.customer_city as cidade, c.customer_state as estado
  from bruto.orders o
  join bruto.customers c on c.customer_id = o.customer_id
  order by c.customer_unique_id, o.order_purchase_timestamp desc
) as ultimo_endereco;
alter table public.dim_cliente add primary key (cliente_sk);
alter table public.dim_cliente add column regiao text;

-- dim_produto · grão: um produto. Produto sem categoria recebe um rótulo explícito.
create table public.dim_produto as
select row_number() over (order by p.product_id)::int                        as produto_sk,
       p.product_id                                                         as produto_id,
       coalesce(p.product_category_name, 'sem_categoria')                    as categoria,
       coalesce(t.product_category_name_english, p.product_category_name, 'no_category') as categoria_en,
       p.product_weight_g                                                   as peso_g
from bruto.products p
left join bruto.category_translation t on t.product_category_name = p.product_category_name;
alter table public.dim_produto add primary key (produto_sk);

-- dim_vendedor · grão: um vendedor do marketplace
create table public.dim_vendedor as
select row_number() over (order by seller_id)::int as vendedor_sk,
       seller_id as vendedor_id, seller_city as cidade, seller_state as estado
from bruto.sellers;
alter table public.dim_vendedor add primary key (vendedor_sk);
alter table public.dim_vendedor add column regiao text;

-- Região a partir da UF, para cliente e vendedor
create temporary table uf_regiao (uf text primary key, regiao text);
insert into uf_regiao
select uf, regiao from (values
  ('Norte', array['AC','AM','PA','RO','RR','AP','TO']),
  ('Nordeste', array['MA','PI','CE','RN','PB','PE','AL','SE','BA']),
  ('Centro-Oeste', array['MT','MS','GO','DF']),
  ('Sudeste', array['SP','RJ','MG','ES']),
  ('Sul', array['PR','SC','RS'])) as r(regiao, ufs), unnest(ufs) as uf;
update public.dim_cliente c set regiao = u.regiao from uf_regiao u where u.uf = c.estado;
update public.dim_vendedor v set regiao = u.regiao from uf_regiao u where u.uf = v.estado;

-- Chave substituta do pedido, compartilhada pelos dois fatos
create temporary table pedido_chave as
select o.order_id,
       row_number() over (order by o.order_purchase_timestamp, o.order_id)::int as pedido_sk,
       to_char(o.order_purchase_timestamp, 'YYYYMMDD')::int                    as data_sk,
       dc.cliente_sk
from bruto.orders o
join bruto.customers c on c.customer_id = o.customer_id
join public.dim_cliente dc on dc.cliente_id = c.customer_unique_id;

-- fato_itens_pedido · grão: um item vendido dentro de um pedido
create table public.fato_itens_pedido as
select k.pedido_sk, i.order_item_id as item_seq, k.data_sk, k.cliente_sk,
       dp.produto_sk, dv.vendedor_sk, o.order_status as status,
       i.price as preco, i.freight_value as frete
from bruto.order_items i
join bruto.orders o      on o.order_id = i.order_id
join pedido_chave k      on k.order_id = i.order_id
join public.dim_produto dp  on dp.produto_id = i.product_id
join public.dim_vendedor dv on dv.vendedor_id = i.seller_id;
alter table public.fato_itens_pedido add primary key (pedido_sk, item_seq);

-- fato_pedidos · grão: um pedido. Pagamento e avaliação existem por pedido, não por item.
create table public.fato_pedidos as
with itens as (
  select order_id, count(*)::int as qtd_itens, sum(price) as valor_itens, sum(freight_value) as valor_frete
  from bruto.order_items group by order_id
), pagamentos as (
  select order_id, sum(payment_value) as valor_pago, max(payment_installments) as parcelas,
         (array_agg(payment_type order by payment_value desc))[1] as meio_pagamento
  from bruto.order_payments group by order_id
), avaliacao as (
  -- 547 pedidos têm mais de uma avaliação: vale a última respondida.
  select distinct on (order_id) order_id, review_score as nota_avaliacao
  from bruto.order_reviews order by order_id, review_answer_timestamp desc
)
select k.pedido_sk, o.order_id as pedido_id, k.data_sk,
       extract(hour from o.order_purchase_timestamp)::int as hora_compra,
       k.cliente_sk, o.order_status as status,
       coalesce(i.qtd_itens, 0) as qtd_itens,
       coalesce(i.valor_itens, 0) as valor_itens,
       coalesce(i.valor_frete, 0) as valor_frete,
       p.valor_pago, p.parcelas, p.meio_pagamento,
       o.order_delivered_customer_date::date - o.order_purchase_timestamp::date as dias_entrega,
       o.order_delivered_customer_date::date - o.order_estimated_delivery_date::date as dias_atraso,
       case when o.order_delivered_customer_date is null then null
            else (o.order_delivered_customer_date::date <= o.order_estimated_delivery_date::date)::int end
         as entregue_no_prazo,
       a.nota_avaliacao
from bruto.orders o
join pedido_chave k      on k.order_id = o.order_id
left join itens i        on i.order_id = o.order_id
left join pagamentos p   on p.order_id = o.order_id
left join avaliacao a    on a.order_id = o.order_id;
alter table public.fato_pedidos add primary key (pedido_sk);

-- Chaves estrangeiras: o desenho da estrela fica declarado no banco
alter table public.fato_itens_pedido
  add foreign key (data_sk) references public.dim_tempo,
  add foreign key (cliente_sk) references public.dim_cliente,
  add foreign key (produto_sk) references public.dim_produto,
  add foreign key (vendedor_sk) references public.dim_vendedor;
alter table public.fato_pedidos
  add foreign key (data_sk) references public.dim_tempo,
  add foreign key (cliente_sk) references public.dim_cliente;
create index on public.fato_itens_pedido (data_sk);
create index on public.fato_itens_pedido (produto_sk);
create index on public.fato_itens_pedido (vendedor_sk);
create index on public.fato_pedidos (data_sk);
create index on public.fato_pedidos (cliente_sk);

-- Leitura pública pela API (o dashboard da aula 9 usa a chave publicável); escrita continua bloqueada.
do $$
declare t text;
begin
  foreach t in array array['dim_tempo','dim_cliente','dim_produto','dim_vendedor','fato_itens_pedido','fato_pedidos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy leitura_publica on public.%I for select to anon, authenticated using (true)', t);
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;
end $$;

-- Reconciliação: a estrela não pode perder nem inventar receita.
select (select sum(price) from bruto.order_items)          as receita_bruto,
       (select sum(preco) from public.fato_itens_pedido)    as receita_fato_itens,
       (select sum(valor_itens) from public.fato_pedidos)   as receita_fato_pedidos,
       (select count(*) from bruto.order_items)             as itens_bruto,
       (select count(*) from public.fato_itens_pedido)      as itens_fato,
       (select count(*) from bruto.orders)                  as pedidos_bruto,
       (select count(*) from public.fato_pedidos)           as pedidos_fato;
