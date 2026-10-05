const source = window.PME_SOURCE_DATA;
const pne = source.pne;
const par = source.par;
const config = window.PME_CONFIG || {};
const localStorageKey = 'fme-pme-propostas-v3';

const shortTitles = {
  1:'Creche e pré-escola',2:'Qualidade na educação infantil',3:'Alfabetização e matemática',
  4:'Conclusão na idade regular',5:'Aprendizagem e equidade',6:'Educação integral',
  7:'Educação digital',8:'Educação ambiental e clima',9:'Educação indígena, do campo e quilombola',
  10:'Educação especial e bilíngue',11:'Educação de jovens, adultos e idosos',12:'Educação profissional e tecnológica',
  13:'Qualidade da educação profissional',14:'Acesso e conclusão na graduação',15:'Qualidade da graduação',
  16:'Mestres e doutores',17:'Profissionais da educação',18:'Gestão democrática e controle social',
  19:'Qualidade e equidade da oferta'
};

const el = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));

function apiConfigured(){
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(config.apiUrl || '');
}

function fillSelect(select,options,placeholder){
  select.innerHTML = placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : '';
  select.insertAdjacentHTML('beforeend',options.map(option=>`<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join(''));
}

function linkedParActions(objectiveNumber){
  return par.filter(action=>action.pneObjectives.includes(Number(objectiveNumber)));
}

function populateGoals(number){
  const objective = pne.find(item=>item.number===Number(number));
  fillSelect(el('draftGoal'),objective.metas.map(item=>({value:item.label,label:`${item.label} ${item.text}`})));
}

function populatePar(number){
  const actions = linkedParActions(number);
  fillSelect(el('draftPar'),actions.map(item=>({value:item.row,label:`${item['Objetivos e Ações']} — ${item['Setor Responsável']}`})),'Nenhuma ação vinculada');
}

function initialObjective(){
  const value = Number(new URLSearchParams(location.search).get('objetivo'));
  return value>=1 && value<=19 ? value : 1;
}

function populateObjective(selected=1){
  fillSelect(el('draftObjective'),pne.map(item=>({value:item.number,label:`Objetivo ${item.number} — ${shortTitles[item.number]}`})));
  el('draftObjective').value = String(selected);
  populateGoals(selected);
  populatePar(selected);
}

function createSubmissionProtocol(){
  const parts = new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const datePart = type => parts.find(part=>part.type===type)?.value || '';
  const date = `${datePart('year')}${datePart('month')}${datePart('day')}`;
  const random = window.crypto?.getRandomValues
    ? [...window.crypto.getRandomValues(new Uint8Array(4))].map(value=>value.toString(16).padStart(2,'0')).join('').toUpperCase()
    : Math.random().toString(36).slice(2,10).toUpperCase();
  return `PME-${date}-${random}`;
}

function setFormStatus(message,type='success'){
  const status = el('submitStatus');
  status.textContent = message;
  status.className = `form-status visible ${type}`;
  status.scrollIntoView({behavior:'smooth',block:'center'});
}

function loadLocalCopies(){
  try{return JSON.parse(localStorage.getItem(localStorageKey)||'[]');}catch{return [];}
}

function saveLocalCopy(proposal){
  const copies = loadLocalCopies();
  copies.unshift(proposal);
  localStorage.setItem(localStorageKey,JSON.stringify(copies.slice(0,25)));
}

async function sendToCentralSheet(proposal){
  const body = new URLSearchParams({
    submissionId:proposal.id,website:proposal.website||'',participantName:proposal.participantName,
    participantEmail:proposal.participantEmail,participantSegment:proposal.participantSegment,
    objective:proposal.objectiveText,goal:proposal.goalText,strategy:proposal.text,evidence:proposal.evidence,
    indicator:proposal.indicator,baseline:proposal.baseline,target:proposal.target,deadline:proposal.deadline,
    owner:proposal.owner,parAction:proposal.parAction,consent:proposal.consent
  });
  await fetch(config.apiUrl,{
    method:'POST',mode:'no-cors',
    headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body
  });
}

async function submitProposal(event){
  event.preventDefault();
  if(el('draftWebsite').value){setFormStatus('Proposta recebida.','success');return;}

  const objectiveOption = el('draftObjective').selectedOptions[0];
  const goalOption = el('draftGoal').selectedOptions[0];
  const parOption = el('draftPar').selectedOptions[0];
  const proposal = {
    id:createSubmissionProtocol(),createdAt:new Date().toISOString(),
    participantName:el('draftParticipantName').value.trim(),
    participantEmail:el('draftParticipantEmail').value.trim(),
    participantSegment:el('draftParticipantSegment').value,
    website:el('draftWebsite').value,
    objective:Number(el('draftObjective').value),
    objectiveText:objectiveOption?.textContent.trim()||'',
    goal:el('draftGoal').value,goalText:goalOption?.textContent.trim()||'',
    text:el('draftText').value.trim(),evidence:el('draftEvidence').value.trim(),
    indicator:el('draftIndicator').value.trim(),owner:el('draftOwner').value.trim(),
    baseline:el('draftBaseline').value.trim(),target:el('draftTarget').value.trim(),
    deadline:el('draftDeadline').value.trim(),parRow:el('draftPar').value,
    parAction:parOption?.textContent.trim()||'Nenhuma ação vinculada',
    consent:el('draftConsent').checked?'Sim':'Não'
  };

  saveLocalCopy(proposal);
  const button = el('submitProposal');
  button.disabled = true;
  button.textContent = 'Enviando proposta…';
  try{
    if(!apiConfigured()){
      setFormStatus('A proposta foi preservada neste navegador, mas a conexão central ainda não está disponível.','warning');
      return;
    }
    await sendToCentralSheet(proposal);
    setFormStatus(`Proposta enviada para moderação. Protocolo: ${proposal.id}. Guarde este número para referência.`,'success');
    const objective = proposal.objective;
    event.target.reset();
    populateObjective(objective);
  }catch(error){
    console.error(error);
    setFormStatus('Não foi possível alcançar a central. Sua cópia local foi preservada; tente novamente mais tarde.','error');
  }finally{
    button.disabled = false;
    button.textContent = 'Enviar proposta para moderação';
  }
}

function initialize(){
  populateObjective(initialObjective());
  el('draftObjective').addEventListener('change',event=>{
    populateGoals(event.target.value);
    populatePar(event.target.value);
  });
  el('strategyForm').addEventListener('submit',submitProposal);
  el('storageBadge').textContent = apiConfigured()?'Arquivamento central ativo':'Configuração pendente';
  const menu=document.querySelector('.menu'),nav=document.querySelector('.nav');
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open);});
  nav.addEventListener('click',()=>nav.classList.remove('open'));
}

initialize();
