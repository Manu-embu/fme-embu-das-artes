const source = window.PME_SOURCE_DATA;
const pne = source.pne;
const par = source.par;
const draftStorageKey = 'fme-pme-estrategias-v1';

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
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const escapeHtml = value => String(value ?? '').replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const unique = values => [...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));

let selectedObjective = 1;
let selectedDetailTab = 'metas';

function setView(view){
  document.querySelectorAll('.view-tab').forEach(button=>{
    const active = button.dataset.view === view;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  document.querySelectorAll('.workspace-view').forEach(section=>section.classList.remove('active'));
  el(`view-${view}`).classList.add('active');
}

function renderObjectiveList(query=''){
  const term = normalize(query);
  const filtered = pne.filter(item=>normalize(`${item.number} ${shortTitles[item.number]} ${item.title}`).includes(term));
  el('objectiveList').innerHTML = filtered.map(item=>`
    <button class="objective-button ${item.number===selectedObjective?'active':''}" data-objective="${item.number}" type="button">
      <span class="objective-number">${String(item.number).padStart(2,'0')}</span>
      <span>${escapeHtml(shortTitles[item.number])}</span>
    </button>`).join('') || '<p class="empty-card">Nenhum objetivo encontrado.</p>';
  document.querySelectorAll('.objective-button').forEach(button=>button.addEventListener('click',()=>{
    selectedObjective = Number(button.dataset.objective);
    selectedDetailTab = 'metas';
    renderObjectiveList(el('objectiveSearch').value);
    renderObjectiveDetail();
  }));
}

function renderLegalItems(items){
  return `<div class="detail-stack">${items.map(item=>`
    <article class="legal-item"><b>${escapeHtml(item.label)}</b><p>${escapeHtml(item.text)}</p></article>
  `).join('')}</div>`;
}

function linkedParActions(objectiveNumber){
  return par.filter(action=>action.pneObjectives.includes(objectiveNumber));
}

function renderObjectiveDetail(){
  const objective = pne.find(item=>item.number===selectedObjective);
  const linked = linkedParActions(objective.number);
  const drafts = loadDrafts().filter(item=>Number(item.objective)===objective.number);
  let content = '';
  if(selectedDetailTab==='metas') content = renderLegalItems(objective.metas);
  if(selectedDetailTab==='national') content = renderLegalItems(objective.strategies);
  if(selectedDetailTab==='municipal') content = drafts.length
    ? `<div class="detail-stack">${drafts.map(draft=>draftCardHtml(draft,false)).join('')}</div>`
    : `<div class="empty-card">Nenhuma estratégia municipal registrada para este objetivo.<br><button class="inline-action" id="createForObjective" type="button">Criar proposta</button></div>`;
  if(selectedDetailTab==='par') content = linked.length
    ? `<div class="detail-stack">${linked.map(action=>`<article class="par-link-card"><small>${escapeHtml(action['Situação'])} • ${escapeHtml(action['Setor Responsável'])}</small><h4>${escapeHtml(action['Objetivos e Ações'])}</h4><p>${escapeHtml(action['Indicador'])}</p></article>`).join('')}</div>`
    : '<div class="empty-card">Nenhuma ação do PAR foi vinculada a este objetivo na proposta técnica inicial.</div>';

  el('objectiveDetail').innerHTML = `
    <div class="objective-kicker"><span>Objetivo ${String(objective.number).padStart(2,'0')}</span><b>${objective.metas.length} metas</b><b>${objective.strategies.length} estratégias nacionais</b><b>${linked.length} ações do PAR</b></div>
    <h2>${escapeHtml(objective.title)}</h2>
    <div class="detail-tabs" role="tablist">
      <button class="detail-tab ${selectedDetailTab==='metas'?'active':''}" data-detail="metas" type="button">Metas nacionais</button>
      <button class="detail-tab ${selectedDetailTab==='national'?'active':''}" data-detail="national" type="button">Estratégias nacionais</button>
      <button class="detail-tab ${selectedDetailTab==='municipal'?'active':''}" data-detail="municipal" type="button">Estratégias municipais (${drafts.length})</button>
      <button class="detail-tab ${selectedDetailTab==='par'?'active':''}" data-detail="par" type="button">Ações do PAR (${linked.length})</button>
    </div>${content}`;
  document.querySelectorAll('.detail-tab').forEach(button=>button.addEventListener('click',()=>{
    selectedDetailTab = button.dataset.detail;
    renderObjectiveDetail();
  }));
  const createButton = el('createForObjective');
  if(createButton) createButton.addEventListener('click',()=>openDraftForObjective(objective.number));
}

function fillSelect(select, options, placeholder){
  select.innerHTML = placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : '';
  select.insertAdjacentHTML('beforeend',options.map(option=>`<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join(''));
}

function populateDraftObjective(selected=1){
  fillSelect(el('draftObjective'),pne.map(item=>({value:item.number,label:`Objetivo ${item.number} — ${shortTitles[item.number]}`})));
  el('draftObjective').value=String(selected);
  populateDraftGoals(selected);
  populateDraftPar(selected);
}

function populateDraftGoals(number){
  const objective = pne.find(item=>item.number===Number(number));
  fillSelect(el('draftGoal'),objective.metas.map(item=>({value:item.label,label:`${item.label} ${item.text}`})));
}

function populateDraftPar(number){
  const actions=linkedParActions(Number(number));
  fillSelect(el('draftPar'),actions.map(item=>({value:item.row,label:`${item['Objetivos e Ações']} — ${item['Setor Responsável']}`})),'Nenhuma ação vinculada');
}

function openDraftForObjective(number){
  setView('municipal');
  populateDraftObjective(number);
  el('draftText').focus();
  el('workspace').scrollIntoView({behavior:'smooth'});
}

function loadDrafts(){
  try{return JSON.parse(localStorage.getItem(draftStorageKey)||'[]');}catch{return [];}
}

function saveDrafts(items){
  localStorage.setItem(draftStorageKey,JSON.stringify(items));
}

function draftCardHtml(draft,withDelete=true){
  const objective = Number(draft.objective);
  return `<article class="draft-card">
    <header><span class="draft-objective">Objetivo ${objective} • ${escapeHtml(draft.goal)}</span>${withDelete?`<button class="delete-draft" data-delete="${escapeHtml(draft.id)}" type="button">Excluir</button>`:''}</header>
    <h4>${escapeHtml(draft.text)}</h4>
    ${draft.evidence?`<p><strong>Evidência:</strong> ${escapeHtml(draft.evidence)}</p>`:''}
    ${draft.indicator?`<p><strong>Indicador:</strong> ${escapeHtml(draft.indicator)}</p>`:''}
    <p>${draft.owner?`<strong>Responsável:</strong> ${escapeHtml(draft.owner)} • `:''}${draft.target?`<strong>Meta:</strong> ${escapeHtml(draft.target)} `:''}${draft.deadline?`até ${escapeHtml(draft.deadline)}`:''}</p>
  </article>`;
}

function renderDrafts(){
  const drafts=loadDrafts();
  el('draftList').innerHTML=drafts.length?drafts.map(item=>draftCardHtml(item)).join(''):'<div class="empty-card">As propostas salvas neste dispositivo aparecerão aqui.</div>';
  document.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',()=>{
    saveDrafts(loadDrafts().filter(item=>item.id!==button.dataset.delete));
    renderDrafts();renderObjectiveDetail();
  }));
}

function addDraft(event){
  event.preventDefault();
  const draft={
    id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),
    createdAt:new Date().toISOString(),objective:Number(el('draftObjective').value),goal:el('draftGoal').value,
    text:el('draftText').value.trim(),evidence:el('draftEvidence').value.trim(),indicator:el('draftIndicator').value.trim(),
    owner:el('draftOwner').value.trim(),baseline:el('draftBaseline').value.trim(),target:el('draftTarget').value.trim(),
    deadline:el('draftDeadline').value.trim(),parRow:el('draftPar').value
  };
  const drafts=loadDrafts();drafts.unshift(draft);saveDrafts(drafts);
  const objective=draft.objective;event.target.reset();populateDraftObjective(objective);renderDrafts();renderObjectiveDetail();
}

function csvCell(value){return `"${String(value??'').replace(/"/g,'""')}"`;}
function exportDrafts(){
  const drafts=loadDrafts();
  if(!drafts.length){alert('Ainda não há estratégias municipais salvas para exportar.');return;}
  const headers=['Objetivo PNE','Meta relacionada','Estratégia municipal','Diagnóstico/evidência','Indicador','Linha de base','Meta municipal','Prazo','Responsável','Linha PAR','Criado em'];
  const rows=drafts.map(d=>[d.objective,d.goal,d.text,d.evidence,d.indicator,d.baseline,d.target,d.deadline,d.owner,d.parRow,d.createdAt]);
  const csv='\ufeff'+[headers,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.download='estrategias-municipais-pme.csv';link.click();URL.revokeObjectURL(link.href);
}

function statusClass(status){return normalize(status).replace(/\s+/g,'-');}
function isRate(indicator){return /(taxa|percentual|percentagem|proporcao)/.test(normalize(indicator));}
function formatValue(value,indicator){
  if(value===''||value==null)return '—';
  if(['Sim','Não'].includes(value))return value;
  const number=Number(value);if(Number.isNaN(number))return value;
  if(isRate(indicator)&&number>=0&&number<=1)return new Intl.NumberFormat('pt-BR',{style:'percent',maximumFractionDigits:2}).format(number);
  return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(number);
}

function populateParFilters(){
  fillSelect(el('parObjectiveFilter'),pne.map(item=>({value:item.number,label:`Objetivo ${item.number} — ${shortTitles[item.number]}`})),'Todos os objetivos');
  fillSelect(el('parStatusFilter'),unique(par.map(item=>item['Situação'])).map(value=>({value,label:value})),'Todas as situações');
  fillSelect(el('parSectorFilter'),unique(par.map(item=>item['Setor Responsável'])).map(value=>({value,label:value})),'Todos os setores');
  const counts=par.reduce((acc,item)=>(acc[item['Situação']]=(acc[item['Situação']]||0)+1,acc),{});
  el('parStatusSummary').innerHTML=Object.entries(counts).map(([status,count])=>`<article class="status-card"><strong>${count}</strong><span>${escapeHtml(status)}</span></article>`).join('');
}

function renderPar(){
  const objective=Number(el('parObjectiveFilter').value||0),status=el('parStatusFilter').value,sector=el('parSectorFilter').value,term=normalize(el('parSearch').value);
  const filtered=par.filter(item=>(!objective||item.pneObjectives.includes(objective))&&(!status||item['Situação']===status)&&(!sector||item['Setor Responsável']===sector)&&(!term||normalize(`${item['Objetivos e Ações']} ${item['Indicador']} ${item['Setor Responsável']}`).includes(term)));
  el('parTableBody').innerHTML=filtered.map(item=>`<tr>
    <td><span class="action-title">${escapeHtml(item['Objetivos e Ações'])}</span><span class="objective-tags">${item.pneObjectives.map(number=>`<span class="objective-tag">Objetivo ${number}</span>`).join('')}</span></td>
    <td>${escapeHtml(item['Indicador'])}</td><td>${escapeHtml(formatValue(item['Resultado Atual'],item['Indicador']))}</td><td>${escapeHtml(formatValue(item['2028'],item['Indicador']))}</td>
    <td><span class="status-pill ${statusClass(item['Situação'])}">${escapeHtml(item['Situação'])}</span></td><td>${escapeHtml(item['Setor Responsável'])}</td>
  </tr>`).join('')||'<tr><td colspan="6"><div class="empty-card">Nenhuma ação encontrada com estes filtros.</div></td></tr>';
  el('parCount').textContent=`${filtered.length} de ${par.length} ações exibidas`;
}

function initialize(){
  el('pneObjectiveTotal').textContent=source.meta.pneObjectives;el('pneGoalTotal').textContent=source.meta.pneGoals;
  el('pneStrategyTotal').textContent=source.meta.pneStrategies;el('parActionTotal').textContent=source.meta.parActions;
  document.querySelectorAll('.view-tab').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
  el('objectiveSearch').addEventListener('input',event=>renderObjectiveList(event.target.value));
  el('draftObjective').addEventListener('change',event=>{populateDraftGoals(event.target.value);populateDraftPar(event.target.value);});
  el('strategyForm').addEventListener('submit',addDraft);el('exportDrafts').addEventListener('click',exportDrafts);
  ['parObjectiveFilter','parStatusFilter','parSectorFilter'].forEach(id=>el(id).addEventListener('change',renderPar));el('parSearch').addEventListener('input',renderPar);
  const menu=document.querySelector('.menu'),nav=document.querySelector('.nav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open);});nav.addEventListener('click',()=>nav.classList.remove('open'));
  renderObjectiveList();renderObjectiveDetail();populateDraftObjective();renderDrafts();populateParFilters();renderPar();
}

initialize();
