const API='https://lwamaovuxcevsjfvtqhf.supabase.co/rest/v1/rpc/';
const KEY='sb_publishable_j0O_u0t7-lDCtBbmqaIz3A_8vAIGcyJ';
const SLUG='einstein-ia-a06-2026-2';
const STORAGE='tbl:'+SLUG;
const letters=['A','B','C','D'];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

class RpcError extends Error{constructor(message,status){super(message);this.status=status}}
async function rpc(fn,body){
  let r;
  try{r=await fetch(API+fn,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)})}
  catch{throw new RpcError('Sem conexão com a sala. Tentando novamente…',0)}
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new RpcError(data.message||'Não foi possível acessar a sala.',r.status);
  return data;
}
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));

let person=null,busy=false,loading=false,pending=0,seq=0,shown=-1,renderKey='',lastPhase='',deadline=0,timerPhase='lobby',zeroAt=0;
try{person=JSON.parse(localStorage.getItem(STORAGE))}catch{}
const save=p=>{try{p?localStorage.setItem(STORAGE,JSON.stringify(p)):localStorage.removeItem(STORAGE)}catch{}};

function clock(n){n=Math.max(0,Number(n)||0);return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function setMessage(text){$('#message').textContent=text||''}
function bars(data,title){const total=(data||[]).reduce((s,x)=>s+x.votes,0);return `<h3>${esc(title)}</h3><div class="bars">${(data||[]).map(x=>`<div class="barrow"><span class="letter">${letters[x.choice]}</span><div class="bartrack"><div class="barfill" style="width:${total?100*x.votes/total:0}%"></div></div><span class="barvalue">${x.votes} · ${total?Math.round(100*x.votes/total):0}%</span></div>`).join('')}</div>`}
function caseBlock(s,round){const chosen=s.mine?.['round'+round];return `<div class="panel"><p class="eyebrow">Caso financeiro</p><h2>${esc(s.case_title)}</h2><p class="case">${esc(s.case_text)}</p></div><div class="options">${s.options.map((o,i)=>`<button type="button" class="option ${chosen===i?'selected':''}" aria-pressed="${chosen===i}" data-choice="${i}"><span class="letter">${esc(o.letter)}</span><span><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p><span class="tradeoffs"><span class="gain">Potencial: ${esc(o.gain)}</span><span class="cost">Custo: ${esc(o.cost)}</span></span></span></button>`).join('')}</div>`}
function story(s){const t=[...(s.transitions||[])],total=t.reduce((a,x)=>a+x.people,0),stayed=t.filter(x=>x.from_choice===x.to_choice).reduce((a,x)=>a+x.people,0),moved=total-stayed;const lead=t.filter(x=>x.from_choice!==x.to_choice).sort((a,b)=>b.people-a.people)[0];return `${bars(s.round1,'Antes da discussão')}${bars(s.round2,'Depois da discussão')}<h3>A história da mudança</h3><div class="story-grid"><div class="story"><span class="number">${total}</span>completaram as duas rodadas</div><div class="story"><span class="number">${stayed}</span>mantiveram sua arquitetura</div><div class="story"><span class="number">${moved}</span>mudaram de posição</div></div><p class="case">${lead?`O deslocamento mais frequente foi de <strong>${letters[lead.from_choice]}</strong> para <strong>${letters[lead.to_choice]}</strong>, com ${lead.people} ${lead.people===1?'pessoa':'pessoas'}. A mudança registra persuasão, dúvida ou nova prioridade; ela não transforma a alternativa escolhida em gabarito.`:'A turma preservou suas escolhas ou ainda não completou as duas rodadas.'}</p><div class="transition-list">${t.sort((a,b)=>b.people-a.people).map(x=>`<div class="transition"><span>${letters[x.from_choice]} → ${letters[x.to_choice]} ${x.from_choice===x.to_choice?'· permaneceu':'· mudou'}</span><strong>${x.people}</strong></div>`).join('')}</div>`}
function discussion(s){const first=s.mine?.round1;return `<div class="discussion"><div><h3>Sua primeira decisão</h3><p class="lead">${first==null?'Você não registrou voto na primeira rodada. Participe do debate e decida na rodada 2.':`Você escolheu <strong>${letters[first]} · ${esc(s.options[first].title)}</strong>. Prepare-se para explicar o custo dessa escolha.`}</p><p class="note">A distribuição da turma fica oculta até a revelação para que o debate seja decidido pelos argumentos, não pela maioria.</p></div><div><h3>Investigação em grupo</h3><div class="prompt"><strong>1. Processo</strong><p>Qual etapa vem antes da próxima e quem responde por ela?</p></div><div class="prompt"><strong>2. Dados</strong><p>Qual é o grão mínimo da base e como os totais serão reconciliados?</p></div><div class="prompt"><strong>3. IA e apresentação</strong><p>Onde a IA agrega velocidade, onde pode inventar segurança e qual evidência acompanha cada cenário?</p></div><div class="prompt"><strong>Regra do debate</strong><p>Explique primeiro o custo da sua própria alternativa; depois questione a prioridade da alternativa vizinha.</p></div></div></div>`}

function showJoin(message){
  $('#room').classList.add('hidden');
  $('#join-panel').classList.remove('hidden');
  $('#join-message').textContent=message||'';
  renderKey='';lastPhase='';
}
function showRoom(){
  $('#join-panel').classList.add('hidden');
  $('#room').classList.remove('hidden');
  $('#welcome').textContent=`${person.name} · sua sessão está ativa`;
}

function tick(){
  const left=timerPhase==='lobby'||timerPhase==='reveal'?null:Math.max(0,Math.ceil((deadline-Date.now())/1000));
  $('#timer').textContent=left==null?'--:--':clock(left);
  if(left===0&&!loading&&Date.now()-zeroAt>1500){zeroAt=Date.now();refresh()}
}

function render(s){
  $('#participants').textContent=s.participants;
  $('#phase').textContent=({lobby:'Lobby',round1:'Rodada 1',discussion:'Discussão',round2:'Rodada 2',reveal:'Deslocamento'})[s.phase]||s.phase;
  const titles={lobby:'Aguardando o professor',round1:'Escolha sua arquitetura inicial',discussion:'Defenda, ataque e reconstrua',round2:'Escolha novamente',reveal:'O que mudou na sala?'};
  $('#phase-title').textContent=titles[s.phase]||'Sala TBL';
  deadline=Date.now()+s.remaining*1000;timerPhase=s.phase;tick();
  if(s.phase!==lastPhase){if(lastPhase)setMessage('');lastPhase=s.phase}
  // O conteúdo só é redesenhado quando muda, para não roubar foco nem cliques a cada consulta.
  const key=JSON.stringify([s.phase,s.mine,s.round1,s.round2,s.transitions]);
  if(key===renderKey)return;
  renderKey=key;
  let html='';
  if(s.phase==='lobby')html='<p class="lead">Você já está na sala. A atividade começa quando o professor liberar a primeira rodada.</p>';
  if(s.phase==='round1')html=caseBlock(s,1);
  if(s.phase==='discussion')html=discussion(s);
  if(s.phase==='round2')html=`<div class="panel"><p class="eyebrow">Reconsideração</p><h2>O que a discussão alterou no seu critério?</h2><p class="case">Vote outra vez. Você pode manter sua escolha ou mudar, e pode alterá-la enquanto o tempo estiver aberto. A distribuição permanece oculta até a revelação.</p></div>${caseBlock(s,2)}`;
  if(s.phase==='reveal')html=story(s);
  const focused=document.activeElement?.dataset?.choice;
  $('#content').innerHTML=html;
  if(focused!=null)document.querySelector(`[data-choice="${focused}"]`)?.focus();
}

async function vote(round,choice){
  if(busy)return;busy=true;setMessage('Registrando sua decisão…');
  try{await rpc('tbl_vote',{p_slug:SLUG,p_id:person.id,p_round:round,p_choice:choice});setMessage(`Escolha ${letters[choice]} registrada. Você pode alterá-la enquanto o tempo estiver aberto.`);await refresh(true)}
  catch(e){setMessage(e.message);refresh(true)}
  finally{busy=false}
}

async function refresh(force){
  if(!person||(loading&&!force))return;
  loading=true;pending++;const mine=++seq;
  try{
    const s=await rpc('tbl_state',{p_slug:SLUG,p_id:person.id});
    if(mine<shown)return;
    shown=mine;
    // Só o SQL atual informa joined; a ausência do campo não é tratada como reinício.
    if(s.mine?.joined===false){
      // A sala foi reiniciada pelo professor (nova turma): a identificação antiga não vale mais.
      const name=person.name;person=null;save(null);$('#name').value=name;
      showJoin('A sala foi reiniciada pelo professor. Entre novamente para participar.');
      return;
    }
    showRoom();render(s);
    if($('#message').dataset.offline){delete $('#message').dataset.offline;setMessage('')}
  }catch(e){
    if(e.status===0){$('#message').dataset.offline='1';setMessage(e.message)}
    else if(e.message==='Sala inexistente.'){person=null;save(null);showJoin(e.message)}
    else setMessage(e.message);
  }finally{loading=--pending>0}
}

$('#join-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=$('#name').value.trim();
  $('#join-message').textContent='Entrando…';
  try{person=await rpc('tbl_enter',{p_slug:SLUG,p_id:person?.id||uuid(),p_name:name});save(person);renderKey='';setMessage('');await refresh(true)}
  catch(err){$('#join-message').textContent=err.message}
});
$('#content').addEventListener('click',e=>{
  const b=e.target.closest('[data-choice]');
  if(!b||(lastPhase!=='round1'&&lastPhase!=='round2'))return;
  vote(lastPhase==='round1'?1:2,+b.dataset.choice);
});

if(person?.id){$('#name').value=person.name;showRoom();refresh(true)}
setInterval(refresh,2000);
setInterval(tick,250);
