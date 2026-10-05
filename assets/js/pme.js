const source = window.PME_SOURCE_DATA;
const pne = source.pne;
const par = source.par;
const config = window.PME_CONFIG || {};

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
const emptyCounts = () => ({total:0,received:0,inAnalysis:0,approved:0,rejected:0,incorporated:0,other:0});

let selectedObjective = 1;
let selectedDetailTab = 'metas';
let dashboardReady = false;
let dashboardData = {totals:emptyCounts(),objectives:{}};

function apiConfigured(){
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(config.apiUrl || '');
}

function countsForObjective(number){
  return dashboardData.objectives?.[number] || dashboardData.objectives?.[String(number)] || emptyCounts();
}

function plural(count,singular,pluralForm){
  return `${count} ${count===1?singular:pluralForm}`;
}

function setView(view){
  document.querySelectorAll('.view-tab').forEach(button=>{
    const active = button.dataset.view === view;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  document.querySelectorAll('.workspace-view').forEach(section=>section.classList.remove('active'));
  el(`view-${view}`)?.classList.add('active');
}

function renderObjectiveList(query=''){
  const term = normalize(query);
  const filtered = pne.filter(item=>normalize(`${item.number} ${shortTitles[item.number]} ${item.title}`).includes(term));
  el('objectiveList').innerHTML = filtered.map(item=>{
    const count = countsForObjective(item.number).total;
    return `<button class="objective-button ${item.number===selectedObjective?'active':''}" data-objective="${item.number}" type="button">
      <span class="objective-number">${String(item.number).padStart(2,'0')}</span>
      <span class="objective-button-copy">${escapeHtml(shortTitles[item.number])}<small>${dashboardReady?plural(count,'proposta','propostas'):'carregando propostas'}</small></span>
    </button>`;
  }).join('') || '<p class="empty-card">Nenhum objetivo encontrado.</p>';
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

function municipalProposalHtml(objectiveNumber,counts){
  if(!dashboardReady){
    return '<div class="empty-card">Carregando as propostas municipais desta central…</div>';
  }
  if(!counts.total){
    return `<div class="empty-card">Nenhuma proposta municipal recebida para este objetivo.<br>
      <a class="inline-action" href="propostas.html?objetivo=${objectiveNumber}">Enviar uma proposta</a></div>`;
  }
  return `<div class="objective-public-proposals">
    <p class="privacy-note">Acompanhamento agregado. Dados pessoais e textos ainda não moderados não são exibidos.</p>
    <div class="objective-status-grid">
      <article><span>Recebidas</span><strong>${counts.received}</strong></article>
      <article><span>Em análise</span><strong>${counts.inAnalysis}</strong></article>
      <article><span>Aprovadas</span><strong>${counts.approved}</strong></article>
      <article><span>Incorporadas</span><strong>${counts.incorporated}</strong></article>
      <article><span>Rejeitadas</span><strong>${counts.rejected}</strong></article>
    </div>
    <a class="inline-action" href="propostas.html?objetivo=${objectiveNumber}">Enviar outra proposta para este objetivo</a>
  </div>`;
}

function renderObjectiveDetail(){
  const objective = pne.find(item=>item.number===selectedObjective);
  const linked = linkedParActions(objective.number);
  const proposalCounts = countsForObjective(objective.number);
  let content = '';
  if(selectedDetailTab==='metas') content = renderLegalItems(objective.metas);
  if(selectedDetailTab==='national') content = renderLegalItems(objective.strategies);
  if(selectedDetailTab==='municipal') content = municipalProposalHtml(objective.number,proposalCounts);
  if(selectedDetailTab==='par') content = linked.length
    ? `<div class="detail-stack">${linked.map(action=>`<article class="par-link-card"><small>${escapeHtml(action['Situação'])} • ${escapeHtml(action['Setor Responsável'])}</small><h4>${escapeHtml(action['Objetivos e Ações'])}</h4><p>${escapeHtml(action['Indicador'])}</p></article>`).join('')}</div>`
    : '<div class="empty-card">Nenhuma ação do PAR foi vinculada a este objetivo na proposta técnica inicial.</div>';

  const proposalLabel = dashboardReady ? plural(proposalCounts.total,'proposta municipal','propostas municipais') : 'propostas carregando';
  el('objectiveDetail').innerHTML = `
    <div class="objective-kicker"><span>Objetivo ${String(objective.number).padStart(2,'0')}</span><b>${objective.metas.length} metas</b><b>${objective.strategies.length} estratégias nacionais</b><b class="municipal-count-badge">${proposalLabel}</b><b>${linked.length} ações do PAR</b></div>
    <h2>${escapeHtml(objective.title)}</h2>
    <div class="detail-tabs" role="tablist">
      <button class="detail-tab ${selectedDetailTab==='metas'?'active':''}" data-detail="metas" type="button">Metas nacionais</button>
      <button class="detail-tab ${selectedDetailTab==='national'?'active':''}" data-detail="national" type="button">Estratégias nacionais</button>
      <button class="detail-tab ${selectedDetailTab==='municipal'?'active':''}" data-detail="municipal" type="button">Propostas municipais (${dashboardReady?proposalCounts.total:'…'})</button>
      <button class="detail-tab ${selectedDetailTab==='par'?'active':''}" data-detail="par" type="button">Ações do PAR (${linked.length})</button>
    </div>${content}`;
  document.querySelectorAll('.detail-tab').forEach(button=>button.addEventListener('click',()=>{
    selectedDetailTab = button.dataset.detail;
    renderObjectiveDetail();
  }));
}

function fillSelect(select,options,placeholder){
  select.innerHTML = placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : '';
  select.insertAdjacentHTML('beforeend',options.map(option=>`<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join(''));
}

function renderPublicDashboard(){
  const totals = dashboardData.totals || emptyCounts();
  const values = {
    publicTotal:totals.total,publicReceived:totals.received,publicInAnalysis:totals.inAnalysis,
    publicApproved:totals.approved,publicIncorporated:totals.incorporated,publicRejected:totals.rejected
  };
  Object.entries(values).forEach(([id,value])=>{if(el(id))el(id).textContent=dashboardReady?value:'—';});

  const maxCount = Math.max(1,...pne.map(item=>countsForObjective(item.number).total));
  el('objectiveProposalBars').innerHTML = pne.map(item=>{
    const count = countsForObjective(item.number).total;
    const width = dashboardReady ? Math.max(count ? 4 : 0,(count/maxCount)*100) : 0;
    return `<button class="objective-proposal-row" type="button" data-dashboard-objective="${item.number}">
      <span class="bar-objective-number">${String(item.number).padStart(2,'0')}</span>
      <span class="bar-objective-title">${escapeHtml(shortTitles[item.number])}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${width}%"></span></span>
      <strong>${dashboardReady?count:'—'}</strong>
    </button>`;
  }).join('');
  document.querySelectorAll('[data-dashboard-objective]').forEach(button=>button.addEventListener('click',()=>{
    selectedObjective = Number(button.dataset.dashboardObjective);
    selectedDetailTab = 'municipal';
    setView('pne');
    renderObjectiveList(el('objectiveSearch').value);
    renderObjectiveDetail();
    el('workspace').scrollIntoView({behavior:'smooth'});
  }));
}

function formatUpdateTime(value){
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(date);
}

function receiveDashboard(data){
  if(!data || data.ok!==true || data.privacy!=='aggregated'){
    showDashboardError('Os dados públicos estão temporariamente indisponíveis. Tente novamente em alguns minutos.');
    return;
  }
  dashboardData = data;
  dashboardReady = true;
  el('proposalDashboardState').textContent = 'Dados públicos atualizados. Nenhuma informação pessoal é exibida.';
  el('proposalDashboardState').className = 'dashboard-state ready';
  el('dashboardUpdatedAt').textContent = `Última atualização: ${formatUpdateTime(data.updatedAt)}.`;
  renderPublicDashboard();
  renderObjectiveList(el('objectiveSearch').value);
  renderObjectiveDetail();
}

function showDashboardError(message){
  const state = el('proposalDashboardState');
  state.textContent = message;
  state.className = 'dashboard-state error';
}

function loadPublicDashboard(){
  if(!apiConfigured()){
    showDashboardError('A integração pública ainda não foi configurada.');
    return;
  }
  document.querySelectorAll('script[data-pme-dashboard]').forEach(script=>script.remove());
  window.__receivePMEDashboardV3 = receiveDashboard;
  const script = document.createElement('script');
  script.dataset.pmeDashboard = 'true';
  script.src = `${config.apiUrl}?action=dashboard&callback=__receivePMEDashboardV3&t=${Date.now()}`;
  script.onerror = ()=>showDashboardError('Não foi possível atualizar o painel agora. Os demais conteúdos continuam disponíveis.');
  document.body.appendChild(script);
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
  el('pneObjectiveTotal').textContent=source.meta.pneObjectives;
  el('pneGoalTotal').textContent=source.meta.pneGoals;
  el('pneStrategyTotal').textContent=source.meta.pneStrategies;
  el('parActionTotal').textContent=source.meta.parActions;
  document.querySelectorAll('.view-tab').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
  document.querySelectorAll('[data-open-view]').forEach(button=>button.addEventListener('click',()=>{
    setView(button.dataset.openView);
    el('workspace').scrollIntoView({behavior:'smooth'});
  }));
  el('objectiveSearch').addEventListener('input',event=>renderObjectiveList(event.target.value));
  ['parObjectiveFilter','parStatusFilter','parSectorFilter'].forEach(id=>el(id).addEventListener('change',renderPar));
  el('parSearch').addEventListener('input',renderPar);
  const menu=document.querySelector('.menu'),nav=document.querySelector('.nav');
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open);});
  nav.addEventListener('click',()=>nav.classList.remove('open'));
  renderObjectiveList();
  renderObjectiveDetail();
  renderPublicDashboard();
  populateParFilters();
  renderPar();
  if(location.hash==='#painel-propostas'){
    setView('municipal');
    el('workspace').scrollIntoView({block:'start'});
  }
  loadPublicDashboard();
  window.setInterval(loadPublicDashboard,300000);
}

initialize();
