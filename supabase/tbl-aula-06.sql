-- TBL · Aula 06 · Inteligência Artificial no dia a dia da administração
-- Sala isolada no projeto Supabase compartilhado pelos cursos.
-- O script é idempotente: pode ser executado de novo para atualizar funções e o caso.
-- Na primeira criação, troque __TBL_HOST_TOKEN__ por um token forte; reexecuções preservam o token já gravado.
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

-- Fases em andamento: stage guarda a fase que o professor abriu por último e stage_ends_at o seu fim.
-- Quando o prazo passa, as fases seguintes são derivadas: rodada 1 (100 s) → discussão (600 s) → rodada 2 (100 s) → revelação.
alter table public.tbl_sessions add column if not exists stage text check (stage in ('round1','discussion','round2'));
alter table public.tbl_sessions add column if not exists stage_ends_at timestamptz;
update public.tbl_sessions set status='lobby',started_at=null where status='running' and stage is null;

create or replace function public.tbl_timeline(p_slug text, out phase text, out ends_at timestamptz)
language plpgsql volatile security definer set search_path = public as $$
declare s public.tbl_sessions; t timestamptz := clock_timestamp(); st text; e timestamptz;
begin
  select * into s from public.tbl_sessions where slug=p_slug;
  if not found then phase:='missing'; return; end if;
  if s.status='lobby' then phase:='lobby'; return; end if;
  if s.status='revealed' then phase:='reveal'; return; end if;
  st:=s.stage; e:=s.stage_ends_at;
  if st='round1' then
    if t<e then phase:='round1'; ends_at:=e; return; end if;
    st:='discussion'; e:=e+interval '600 seconds';
  end if;
  if st='discussion' then
    if t<e then phase:='discussion'; ends_at:=e; return; end if;
    st:='round2'; e:=e+interval '100 seconds';
  end if;
  if st='round2' and t<e then phase:='round2'; ends_at:=e; return; end if;
  phase:='reveal';
end $$;

create or replace function public.tbl_phase(p_slug text)
returns text language sql volatile security definer set search_path = public as $$
  select phase from public.tbl_timeline(p_slug);
$$;

create or replace function public.tbl_enter(p_slug text, p_id uuid, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare clean_name text;
begin
  clean_name := trim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g'));
  if char_length(clean_name) not between 2 and 60 then raise exception 'Informe seu nome com 2 a 60 caracteres.'; end if;
  if not exists(select 1 from public.tbl_sessions where slug=p_slug) then raise exception 'Sala inexistente.'; end if;
  insert into public.tbl_participants(id,session_slug,name) values(p_id,p_slug,clean_name)
  on conflict(id) do update set name=excluded.name,last_seen_at=now()
  where tbl_participants.session_slug=excluded.session_slug;
  if not exists(select 1 from public.tbl_participants where id=p_id and session_slug=p_slug) then
    raise exception 'Identificação já usada em outra sala. Recarregue a página.';
  end if;
  return jsonb_build_object('id',p_id,'name',clean_name);
end $$;

create or replace function public.tbl_vote(p_slug text, p_id uuid, p_round smallint, p_choice smallint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare current_phase text;
begin
  if not exists(select 1 from public.tbl_participants where id=p_id and session_slug=p_slug) then raise exception 'Entre na sala antes de votar.'; end if;
  if p_round not in (1,2) then raise exception 'Rodada inválida.'; end if;
  if p_choice not between 0 and 3 then raise exception 'Escolha inválida.'; end if;
  current_phase := public.tbl_phase(p_slug);
  if (p_round=1 and current_phase<>'round1') or (p_round=2 and current_phase<>'round2') then raise exception 'Esta rodada não está aberta.'; end if;
  insert into public.tbl_votes(session_slug,participant_id,round,choice) values(p_slug,p_id,p_round,p_choice)
  on conflict(session_slug,participant_id,round) do update set choice=excluded.choice,voted_at=now();
  update public.tbl_participants set last_seen_at=now() where id=p_id;
  return jsonb_build_object('saved',true,'round',p_round,'choice',p_choice);
end $$;

create or replace function public.tbl_distribution(p_slug text, p_round smallint)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(c order by choice),'[]'::jsonb) from (
    select g choice,count(v.choice)::int votes
    from generate_series(0,3) g
    left join public.tbl_votes v on v.session_slug=p_slug and v.round=p_round and v.choice=g
    group by g
  ) c;
$$;

-- Estado público. A distribuição das rodadas só aparece para os alunos na revelação;
-- o painel do professor recebe a primeira rodada antes, por tbl_host_state.
-- Com p_id, registra presença (no máximo a cada 5 s) e informa se o participante ainda existe.
create or replace function public.tbl_state(p_slug text, p_id uuid default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare s public.tbl_sessions; phase text; ends_at timestamptz; remaining integer; r1 jsonb; r2 jsonb; transitions jsonb; mine jsonb; online integer; enrolled integer; v1 integer; v2 integer;
begin
  select * into s from public.tbl_sessions where slug=p_slug;
  if not found then raise exception 'Sala inexistente.'; end if;
  if p_id is not null then
    update public.tbl_participants set last_seen_at=now()
    where id=p_id and session_slug=p_slug and last_seen_at < now()-interval '5 seconds';
  end if;
  select t.phase,t.ends_at into phase,ends_at from public.tbl_timeline(p_slug) t;
  remaining := coalesce(greatest(0,ceil(extract(epoch from(ends_at-clock_timestamp()))))::int,0);
  select count(*) filter(where last_seen_at > now()-interval '20 seconds'),count(*) into online,enrolled from public.tbl_participants where session_slug=p_slug;
  select count(*) filter(where round=1),count(*) filter(where round=2) into v1,v2 from public.tbl_votes where session_slug=p_slug;
  if phase='reveal' then
    r1 := public.tbl_distribution(p_slug,1::smallint);
    r2 := public.tbl_distribution(p_slug,2::smallint);
    select coalesce(jsonb_agg(t order by from_choice,to_choice),'[]'::jsonb) into transitions from (select a.choice from_choice,b.choice to_choice,count(*)::int people from public.tbl_votes a join public.tbl_votes b using(session_slug,participant_id) where a.session_slug=p_slug and a.round=1 and b.round=2 group by a.choice,b.choice) t;
  end if;
  select jsonb_build_object(
    'joined',exists(select 1 from public.tbl_participants where id=p_id and session_slug=p_slug),
    'round1',(select choice from public.tbl_votes where session_slug=p_slug and participant_id=p_id and round=1),
    'round2',(select choice from public.tbl_votes where session_slug=p_slug and participant_id=p_id and round=2)
  ) into mine;
  return jsonb_build_object('slug',s.slug,'title',s.title,'case_title',s.case_title,'case_text',s.case_text,'options',s.options,'phase',phase,'remaining',remaining,
    'participants',online,'enrolled',enrolled,'votes_round1',v1,'votes_round2',v2,
    'round1',coalesce(r1,'[]'::jsonb),'round2',coalesce(r2,'[]'::jsonb),'transitions',coalesce(transitions,'[]'::jsonb),'mine',mine,'started_at',s.started_at);
end $$;

create or replace function public.tbl_host_state(p_slug text,p_token text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare base jsonb; roster jsonb;
begin
  if not exists(select 1 from public.tbl_sessions where slug=p_slug and host_token=p_token) then raise exception 'Token do professor inválido.'; end if;
  base := public.tbl_state(p_slug,null);
  select coalesce(jsonb_agg(x order by name),'[]'::jsonb) into roster from (
    select p.name,p.last_seen_at > now()-interval '20 seconds' online,
      max(v.choice) filter(where v.round=1) r1,max(v.choice) filter(where v.round=2) r2
    from public.tbl_participants p left join public.tbl_votes v on v.participant_id=p.id
    where p.session_slug=p_slug group by p.id,p.name,p.last_seen_at
  ) x;
  return base || jsonb_build_object('roster',roster,'round1',public.tbl_distribution(p_slug,1::smallint));
end $$;

-- Ações do professor:
--   start    inicia a sequência e apaga os votos anteriores (mantém os participantes)
--   advance  encerra a fase atual e abre a seguinte
--   extend   acrescenta 60 s à fase atual
--   reveal   revela imediatamente
--   lobby    volta ao lobby e apaga os votos (mantém os participantes)
--   reset    nova turma: apaga participantes e votos e volta ao lobby
create or replace function public.tbl_host(p_slug text, p_token text, p_action text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare current_phase text; current_end timestamptz; t timestamptz := clock_timestamp();
begin
  perform 1 from public.tbl_sessions where slug=p_slug and host_token=p_token for update;
  if not found then raise exception 'Token do professor inválido.'; end if;
  select x.phase,x.ends_at into current_phase,current_end from public.tbl_timeline(p_slug) x;
  if p_action='start' then
    delete from public.tbl_votes where session_slug=p_slug;
    update public.tbl_sessions set status='running',started_at=t,stage='round1',stage_ends_at=t+interval '100 seconds' where slug=p_slug;
  elsif p_action='advance' then
    if current_phase='lobby' then
      update public.tbl_sessions set status='running',started_at=t,stage='round1',stage_ends_at=t+interval '100 seconds' where slug=p_slug;
    elsif current_phase='round1' then
      update public.tbl_sessions set stage='discussion',stage_ends_at=t+interval '600 seconds' where slug=p_slug;
    elsif current_phase='discussion' then
      update public.tbl_sessions set stage='round2',stage_ends_at=t+interval '100 seconds' where slug=p_slug;
    elsif current_phase='round2' then
      update public.tbl_sessions set status='revealed' where slug=p_slug;
    end if;
  elsif p_action='extend' then
    if current_phase not in ('round1','discussion','round2') then raise exception 'Só é possível estender uma fase em andamento.'; end if;
    update public.tbl_sessions set stage=current_phase,stage_ends_at=current_end+interval '60 seconds' where slug=p_slug;
  elsif p_action='reveal' then
    update public.tbl_sessions set status='revealed' where slug=p_slug;
  elsif p_action='lobby' then
    update public.tbl_sessions set status='lobby',started_at=null,stage=null,stage_ends_at=null where slug=p_slug;
    delete from public.tbl_votes where session_slug=p_slug;
  elsif p_action in ('reset','clear') then
    update public.tbl_sessions set status='lobby',started_at=null,stage=null,stage_ends_at=null where slug=p_slug;
    delete from public.tbl_participants where session_slug=p_slug;
  else raise exception 'Ação inválida.';
  end if;
  return public.tbl_host_state(p_slug,p_token);
end $$;

revoke all on function public.tbl_timeline(text),public.tbl_phase(text),public.tbl_distribution(text,smallint) from public,anon,authenticated;
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
on conflict(slug) do update set title=excluded.title,case_title=excluded.case_title,case_text=excluded.case_text,options=excluded.options;

-- Impede publicar a sala com o token de exemplo (o literal é partido para sobreviver à substituição).
do $$ begin
  if exists(select 1 from public.tbl_sessions where slug='einstein-ia-a06-2026-2' and host_token='__TBL_'||'HOST_TOKEN__') then
    raise exception 'Defina o token do professor antes de criar a sala.';
  end if;
end $$;

commit;
