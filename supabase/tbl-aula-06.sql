-- TBL · Aula 06 · Inteligência Artificial no dia a dia da administração
-- Sala isolada no projeto Supabase compartilhado pelos cursos.
begin;

create table if not exists public.tbl_sessions (
  slug text primary key,
  title text not null,
  case_title text not null,
  case_text text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  status text not null default 'lobby' check (status in ('lobby','running','revealed')),
  started_at timestamptz,
  host_token text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tbl_participants (
  id uuid primary key,
  session_slug text not null references public.tbl_sessions(slug) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.tbl_votes (
  session_slug text not null references public.tbl_sessions(slug) on delete cascade,
  participant_id uuid not null references public.tbl_participants(id) on delete cascade,
  round smallint not null check (round in (1,2)),
  choice smallint not null check (choice between 0 and 3),
  voted_at timestamptz not null default now(),
  primary key (session_slug, participant_id, round)
);

alter table public.tbl_sessions enable row level security;
alter table public.tbl_participants enable row level security;
alter table public.tbl_votes enable row level security;

create or replace function public.tbl_phase(p_slug text)
returns text language plpgsql stable security definer set search_path = public as $$
declare s public.tbl_sessions; elapsed_seconds numeric; enrolled integer; voted integer;
begin
  select * into s from public.tbl_sessions where slug=p_slug;
  if not found then return 'missing'; end if;
  if s.status='lobby' then return 'lobby'; end if;
  if s.status='revealed' then return 'reveal'; end if;
  elapsed_seconds := extract(epoch from (clock_timestamp()-s.started_at));
  if elapsed_seconds < 100 then return 'round1'; end if;
  if elapsed_seconds < 700 then return 'discussion'; end if;
  select count(*) into enrolled from public.tbl_participants where session_slug=p_slug and joined_at <= s.started_at;
  select count(*) into voted from public.tbl_votes where session_slug=p_slug and round=2;
  if elapsed_seconds < 800 and (enrolled=0 or voted<enrolled) then return 'round2'; end if;
  return 'reveal';
end $$;

create or replace function public.tbl_enter(p_slug text, p_id uuid, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare clean_name text;
begin
  clean_name := trim(regexp_replace(p_name, '\s+', ' ', 'g'));
  if char_length(clean_name) not between 2 and 60 then raise exception 'Informe seu nome com 2 a 60 caracteres.'; end if;
  if not exists(select 1 from public.tbl_sessions where slug=p_slug) then raise exception 'Sala inexistente.'; end if;
  insert into public.tbl_participants(id,session_slug,name) values(p_id,p_slug,clean_name)
  on conflict(id) do update set name=excluded.name,last_seen_at=now()
  where tbl_participants.session_slug=excluded.session_slug;
  return jsonb_build_object('id',p_id,'name',clean_name);
end $$;

create or replace function public.tbl_vote(p_slug text, p_id uuid, p_round smallint, p_choice smallint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare current_phase text;
begin
  if not exists(select 1 from public.tbl_participants where id=p_id and session_slug=p_slug) then raise exception 'Entre na sala antes de votar.'; end if;
  current_phase := public.tbl_phase(p_slug);
  if (p_round=1 and current_phase<>'round1') or (p_round=2 and current_phase<>'round2') then raise exception 'Esta rodada não está aberta.'; end if;
  if p_choice not between 0 and 3 then raise exception 'Escolha inválida.'; end if;
  insert into public.tbl_votes(session_slug,participant_id,round,choice) values(p_slug,p_id,p_round,p_choice)
  on conflict(session_slug,participant_id,round) do update set choice=excluded.choice,voted_at=now();
  return jsonb_build_object('saved',true,'round',p_round,'choice',p_choice);
end $$;

create or replace function public.tbl_state(p_slug text, p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare s public.tbl_sessions; phase text; elapsed_seconds numeric; remaining integer; r1 jsonb; r2 jsonb; transitions jsonb; mine jsonb; total integer;
begin
  select * into s from public.tbl_sessions where slug=p_slug;
  if not found then raise exception 'Sala inexistente.'; end if;
  phase := public.tbl_phase(p_slug);
  elapsed_seconds := case when s.started_at is null then 0 else extract(epoch from(clock_timestamp()-s.started_at)) end;
  remaining := case phase when 'round1' then greatest(0,ceil(100-elapsed_seconds)) when 'discussion' then greatest(0,ceil(700-elapsed_seconds)) when 'round2' then greatest(0,ceil(800-elapsed_seconds)) else 0 end;
  select count(*) into total from public.tbl_participants where session_slug=p_slug;
  if phase in ('discussion','round2','reveal') then
    select coalesce(jsonb_agg(c order by choice),'[]'::jsonb) into r1 from (select g choice,count(v.choice)::int votes from generate_series(0,3) g left join public.tbl_votes v on v.session_slug=p_slug and v.round=1 and v.choice=g group by g) c;
  end if;
  if phase='reveal' then
    select coalesce(jsonb_agg(c order by choice),'[]'::jsonb) into r2 from (select g choice,count(v.choice)::int votes from generate_series(0,3) g left join public.tbl_votes v on v.session_slug=p_slug and v.round=2 and v.choice=g group by g) c;
    select coalesce(jsonb_agg(t order by from_choice,to_choice),'[]'::jsonb) into transitions from (select a.choice from_choice,b.choice to_choice,count(*)::int people from public.tbl_votes a join public.tbl_votes b using(session_slug,participant_id) where a.session_slug=p_slug and a.round=1 and b.round=2 group by a.choice,b.choice) t;
  end if;
  select jsonb_build_object('round1',max(choice) filter(where round=1),'round2',max(choice) filter(where round=2)) into mine from public.tbl_votes where session_slug=p_slug and participant_id=p_id;
  return jsonb_build_object('slug',s.slug,'title',s.title,'case_title',s.case_title,'case_text',s.case_text,'options',s.options,'phase',phase,'remaining',remaining,'participants',total,'round1',coalesce(r1,'[]'::jsonb),'round2',coalesce(r2,'[]'::jsonb),'transitions',coalesce(transitions,'[]'::jsonb),'mine',coalesce(mine,'{}'::jsonb),'started_at',s.started_at);
end $$;

create or replace function public.tbl_host(p_slug text, p_token text, p_action text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.tbl_sessions;
begin
  select * into s from public.tbl_sessions where slug=p_slug and host_token=p_token;
  if not found then raise exception 'Token do professor inválido.'; end if;
  if p_action='start' then
    delete from public.tbl_votes where session_slug=p_slug;
    update public.tbl_sessions set status='running',started_at=clock_timestamp() where slug=p_slug;
  elsif p_action='reveal' then
    update public.tbl_sessions set status='revealed' where slug=p_slug;
  elsif p_action='lobby' then
    update public.tbl_sessions set status='lobby',started_at=null where slug=p_slug;
    delete from public.tbl_votes where session_slug=p_slug;
  elsif p_action='clear' then
    update public.tbl_sessions set status='lobby',started_at=null where slug=p_slug;
    delete from public.tbl_participants where session_slug=p_slug;
  else raise exception 'Ação inválida.';
  end if;
  return public.tbl_state(p_slug,null);
end $$;

create or replace function public.tbl_host_state(p_slug text,p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare base jsonb; roster jsonb;
begin
  if not exists(select 1 from public.tbl_sessions where slug=p_slug and host_token=p_token) then raise exception 'Token do professor inválido.'; end if;
  base := public.tbl_state(p_slug,null);
  select coalesce(jsonb_agg(x order by name),'[]'::jsonb) into roster from (
    select p.name,max(v.choice) filter(where v.round=1) r1,max(v.choice) filter(where v.round=2) r2
    from public.tbl_participants p left join public.tbl_votes v on v.participant_id=p.id
    where p.session_slug=p_slug group by p.id,p.name
  ) x;
  return base || jsonb_build_object('roster',roster);
end $$;

revoke all on function public.tbl_phase(text) from public,anon,authenticated;
grant execute on function public.tbl_enter(text,uuid,text),public.tbl_vote(text,uuid,smallint,smallint),public.tbl_state(text,uuid),public.tbl_host(text,text,text),public.tbl_host_state(text,text) to anon,authenticated;

insert into public.tbl_sessions(slug,title,case_title,case_text,options,host_token)
values(
  'einstein-ia-a06-2026-2',
  'TBL — Arquitetura de decisão financeira com IA',
  'O caixa que precisa falar com o conselho',
  'Você assumiu um projeto em uma rede hospitalar com quatro unidades. O CFO precisa apresentar ao conselho, na próxima sexta-feira, uma previsão de caixa para 13 semanas e três cenários: base, pressão de glosas e atraso de repasses. Contas a pagar estão no ERP, recebíveis em planilhas das unidades e saldos em extratos bancários. Os totais divergem, parte dos dados contém informações sensíveis e ninguém documentou uma regra única para classificar entradas e saídas. Sua equipe deve modelar o processo, estruturar a base e criar uma apresentação executiva. A IA pode apoiar o trabalho, mas a decisão publicada precisa ser rastreável e aprovada por uma pessoa responsável.',
  '[
    {"letter":"A","title":"Apresentação primeiro","text":"Reunir as planilhas, pedir à IA que identifique padrões e produza imediatamente os três cenários e os slides. Registrar as premissas no final e formalizar banco e processo depois da reunião.","gain":"Entrega rápida e cria um artefato concreto para alinhar expectativas.","cost":"Expõe o conselho a números ainda não reconciliados e reduz a rastreabilidade."},
    {"letter":"B","title":"Base primeiro","text":"Suspender a apresentação analítica até integrar ERP, planilhas e bancos em um modelo dimensional completo. Só depois calcular os cenários e usar IA para redigir a narrativa.","gain":"Constrói uma fonte consistente e favorece auditoria e reutilização.","cost":"Pode perder a janela decisória e transformar o modelo completo em pré-requisito excessivo."},
    {"letter":"C","title":"Processo primeiro","text":"Mapear donos, regras de classificação, conciliações e aprovações. Apresentar na sexta apenas saldos validados, lacunas e um plano de implantação, sem previsão quantitativa de 13 semanas.","gain":"Expõe responsabilidades e impede que incerteza seja escondida pela tecnologia.","cost":"Controla o processo, mas responde parcialmente à decisão financeira urgente."},
    {"letter":"D","title":"Duas frentes com escopo mínimo","text":"Criar um mart mínimo de caixa reconciliado para 13 semanas enquanto outra frente documenta fontes, regras e aprovações. Usar IA para rascunhar cenários e narrativa, com citações das premissas e validação humana antes da apresentação.","gain":"Combina utilidade imediata, rastreabilidade e evolução incremental.","cost":"Exige coordenação intensa e pode gerar duas versões da verdade se os contratos entre as frentes falharem."}
  ]'::jsonb,
  '__TBL_HOST_TOKEN__'
)
on conflict(slug) do update set title=excluded.title,case_title=excluded.case_title,case_text=excluded.case_text,options=excluded.options,host_token=excluded.host_token;

commit;
