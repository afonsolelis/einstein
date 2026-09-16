const API='https://lwamaovuxcevsjfvtqhf.supabase.co/rest/v1/rpc/';
const KEY='sb_publishable_j0O_u0t7-lDCtBbmqaIz3A_8vAIGcyJ';
const SLUG='einstein-ia-a06-2026-2';
const TOKEN_KEY='tbl-host:'+SLUG;
const ROSTER_KEY='tbl-host-roster:'+SLUG;
const PUBLIC_URL='https://afonsolelis.github.io/einstein/tbl/aula-06/index.html';
const letters=['A','B','C','D'];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

class RpcError extends Error{constructor(message,status){super(message);this.status=status}}
async function rpc(fn,body){
  let r;
  try{r=await fetch(API+fn,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout?AbortSignal.timeout(8000):undefined})}
  catch{throw new RpcError('Sem conexão com o Supabase. Tentando novamente…',0)}
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new RpcError(data.message||'Falha no painel.',r.status);
  return data;
}
const store={get:(k,s=sessionStorage)=>{try{return s.getItem(k)}catch{return null}},set:(k,v,s=sessionStorage)=>{try{v==null?s.removeItem(k):s.setItem(k,v)}catch{}}};

let token=store.get(TOKEN_KEY)||'',refreshing=false,pending=0,seq=0,shown=-1,renderKey='',deadline=0,timerPhase='lobby',zeroAt=0;
let rosterOpen=store.get(ROSTER_KEY)==='1';

const CONFIRM={
  start:'Iniciar uma nova sequência? Os votos anteriores serão apagados (os participantes continuam na sala).',
  lobby:'Voltar ao lobby? Todos os votos desta sequência serão apagados.',
  clear:'Limpar e reiniciar a sala para uma nova turma? Todos os participantes e votos serão apagados definitivamente.'
};
const DONE={start:'Sequência iniciada: 100 s + 10 min + 100 s.',advance:'Fase avançada.',extend:'Mais 1 minuto na fase atual.',reveal:'Resultados revelados.',lobby:'Sala de volta ao lobby, votos apagados.',clear:'Sala reiniciada para uma nova turma.'};

function clock(n){n=Math.max(0,Number(n)||0);return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function bars(data,title){const total=(data||[]).reduce((s,x)=>s+x.votes,0);return `<h3>${esc(title)}</h3><div class="bars">${(data||[]).map(x=>`<div class="barrow"><span class="letter">${letters[x.choice]}</span><div class="bartrack"><div class="barfill" style="width:${total?100*x.votes/total:0}%"></div></div><span class="barvalue">${x.votes} · ${total?Math.round(100*x.votes/total):0}%</span></div>`).join('')}</div>`}
function caseView(s){return `<p class="eyebrow">Caso em projeção</p><h2>${esc(s.case_title)}</h2><p class="case">${esc(s.case_text)}</p><div class="options">${s.options.map(o=>`<article class="option"><span class="letter">${esc(o.letter)}</span><span><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p><span class="tradeoffs"><span class="gain">Potencial: ${esc(o.gain)}</span><span class="cost">Custo: ${esc(o.cost)}</span></span></span></article>`).join('')}</div>`}
function story(s){const t=[...(s.transitions||[])],total=t.reduce((a,x)=>a+x.people,0),stayed=t.filter(x=>x.from_choice===x.to_choice).reduce((a,x)=>a+x.people,0),moved=total-stayed,lead=t.filter(x=>x.from_choice!==x.to_choice).sort((a,b)=>b.people-a.people)[0];return `${bars(s.round1,'Rodada 1')}${bars(s.round2,'Rodada 2')}<h2>O argumento moveu a sala</h2><div class="story-grid"><div class="story"><span class="number">${total}</span>duas decisões registradas</div><div class="story"><span class="number">${stayed}</span>posições sustentadas</div><div class="story"><span class="number">${moved}</span>posições revistas</div></div><p class="lead">${lead?`A principal corrente foi <strong>${letters[lead.from_choice]} → ${letters[lead.to_choice]}</strong>, com ${lead.people} ${lead.people===1?'pessoa':'pessoas'}. Pergunte o que mudou: a ordem do processo, a confiança nos dados, o prazo ou o papel atribuído à IA?`:'Ainda não há uma corrente de mudança entre alternativas.'}</p><div class="transition-list">${t.sort((a,b)=>b.people-a.people).map(x=>`<div class="transition"><span>${letters[x.from_choice]} → ${letters[x.to_choice]} ${x.from_choice===x.to_choice?'· sustentou':'· reconsiderou'}</span><strong>${x.people}</strong></div>`).join('')}</div>`}

function tick(){
  const left=timerPhase==='lobby'||timerPhase==='reveal'?null:Math.max(0,Math.ceil((deadline-Date.now())/1000));
  $('#timer').textContent=left==null?'--:--':clock(left);
  if(left===0&&!refreshing&&Date.now()-zeroAt>1500){zeroAt=Date.now();refresh()}
}

function renderRoster(roster){
  $('#toggle-roster').textContent=rosterOpen?'Ocultar votos individuais':'Mostrar votos individuais';
  $('#toggle-roster').setAttribute('aria-expanded',rosterOpen);
  $('#roster').classList.toggle('hidden',!rosterOpen);
  $('#roster-note').classList.toggle('hidden',rosterOpen);
  if(!rosterOpen)return;
  $('#roster').innerHTML=roster.length?`<table><thead><tr><th>Participante</th><th>Rodada 1</th><th>Rodada 2</th></tr></thead><tbody>${roster.map(p=>`<tr><td>${p.online?'':'<span class="note" title="Sem sinal há mais de 20 s">○ </span>'}${esc(p.name)}</td><td>${p.r1==null?'—':letters[p.r1]}</td><td>${p.r2==null?'—':letters[p.r2]}</td></tr>`).join('')}</tbody></table>`:'<p class="note">Ninguém entrou na sala ainda.</p>';
}

function render(s){
  $('#participants').textContent=s.participants;
  $('#enrolled').textContent=s.enrolled??s.participants;
  $('#phase').textContent=({lobby:'Lobby',round1:'Rodada 1',discussion:'Discussão',round2:'Rodada 2',reveal:'Revelação'})[s.phase]||s.phase;
  $('#phase-title').textContent=({lobby:'Sala em formação',round1:'Decisão individual',discussion:'Arquitetura em debate',round2:'Reconsideração individual',reveal:'Drift das escolhas'})[s.phase]||'Sala TBL';
  const voted=s['votes_'+s.phase];
  $('#progress').textContent=voted==null?'':`· ${voted} de ${s.enrolled} votaram`;
  deadline=Date.now()+s.remaining*1000;timerPhase=s.phase;tick();
  const running=['round1','discussion','round2'].includes(s.phase);
  $('[data-action="advance"]').textContent=({lobby:'Iniciar rodada 1',round1:'Encerrar rodada 1',discussion:'Abrir rodada 2',round2:'Encerrar e revelar'})[s.phase]||'Avançar fase';
  $('[data-action="advance"]').disabled=s.phase==='reveal';
  $('[data-action="extend"]').disabled=!running;
  $('[data-action="reveal"]').disabled=s.phase==='reveal'||s.phase==='lobby';
  renderRoster(s.roster||[]);
  const key=JSON.stringify([s.phase,s.round1,s.round2,s.transitions]);
  if(key===renderKey)return;
  renderKey=key;
  let html=caseView(s);
  if(s.phase==='discussion'||s.phase==='round2')html=`${bars(s.round1,'Primeira rodada')}${s.phase==='discussion'?'<div class="prompt"><strong>Pergunta para circular pela sala</strong><p>Qual hipótese precisa ser verdadeira para sua alternativa funcionar — e como você a testaria antes da reunião do conselho?</p></div>':''}`;
  if(s.phase==='reveal')html=story(s);
  $('#host-content').innerHTML=html;
}

function showDashboard(){$('#auth').classList.add('hidden');$('#dashboard').classList.remove('hidden')}
function logout(message){token='';store.set(TOKEN_KEY,null);$('#dashboard').classList.add('hidden');$('#auth').classList.remove('hidden');$('#auth-message').textContent=message}

async function refresh(force){
  if(!token||(refreshing&&!force))return;
  refreshing=true;pending++;const mine=++seq;
  try{
    const s=await rpc('tbl_host_state',{p_slug:SLUG,p_token:token});
    if(mine<shown)return;
    shown=mine;showDashboard();render(s);
    if($('#host-message').dataset.offline){delete $('#host-message').dataset.offline;$('#host-message').textContent=''}
  }catch(e){
    if(e.message==='Token do professor inválido.')logout(e.message);
    else if($('#dashboard').classList.contains('hidden'))$('#auth-message').textContent=e.message;
    else{$('#host-message').dataset.offline='1';$('#host-message').textContent=e.message}
  }finally{refreshing=--pending>0}
}

$('#token-form').addEventListener('submit',e=>{e.preventDefault();token=$('#token').value.trim();store.set(TOKEN_KEY,token);$('#auth-message').textContent='Verificando…';refresh(true)});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',async()=>{
  const action=b.dataset.action;
  if(CONFIRM[action]&&!confirm(CONFIRM[action]))return;
  // A mensagem aparece junto do botão acionado; o reinício fica no fim da página, longe do topo.
  const status=action==='clear'?$('#reset-message'):$('#host-message');
  $('#host-message').textContent='';$('#reset-message').textContent='';
  const buttons=document.querySelectorAll('[data-action]');
  buttons.forEach(x=>x.disabled=true);
  status.textContent='Atualizando a sala…';
  try{
    const s=await rpc('tbl_host',{p_slug:SLUG,p_token:token,p_action:action});
    shown=++seq;render(s);
    status.textContent=action==='clear'?`Sala reiniciada: ${s.enrolled??s.participants} participantes e nenhum voto.`:DONE[action];
  }catch(e){
    if(e.message==='Token do professor inválido.')logout(e.message);else{status.textContent=e.message;refresh(true)}
  }finally{
    // Avançar, estender e revelar dependem da fase e são reabilitados pelo render.
    ['start','lobby','clear'].forEach(a=>{const x=document.querySelector(`[data-action="${a}"]`);if(x)x.disabled=false});
  }
}));
$('#toggle-roster').addEventListener('click',()=>{rosterOpen=!rosterOpen;store.set(ROSTER_KEY,rosterOpen?'1':null);refresh(true)});

const studentUrl=location.protocol==='file:'?PUBLIC_URL:new URL('index.html',location.href).href;
// A camada ampliada fica no body: o backdrop-filter dos painéis prenderia um position:fixed interno.
const qr=open=>{$('#qr-overlay').classList.toggle('hidden',!open);$('#qr-toggle').setAttribute('aria-expanded',open);(open?$('#qr-overlay'):$('#qr-toggle')).focus()};
$('#qr-toggle').addEventListener('click',()=>qr(true));
$('#qr-overlay').addEventListener('click',()=>qr(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#qr-overlay').classList.contains('hidden'))qr(false)});
$('#student-url').textContent=studentUrl;
$('#copy-link').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(studentUrl);$('#copy-link').textContent='Link copiado ✓'}
  catch{$('#copy-link').textContent='Copie o link acima'}
  setTimeout(()=>$('#copy-link').textContent='Copiar link',1600);
});

if(token){$('#token').value=token;refresh(true)}
setInterval(refresh,2000);
setInterval(tick,250);
