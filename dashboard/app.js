const githubLive = location.hostname === 'xdpromagnun.github.io';
const live = githubLive || document.documentElement.dataset.source === 'mariadb';
const recordsUrl = githubLive ? 'https://unisalud.com.mx/procrast-panel/records.php' : 'records.php';
let accessHeader = '';
let lastResponse = '';
let sessionVersion = 0;
const signOut = document.querySelector('#sign-out');
const menuToggle = document.querySelector('.menu-toggle');
function closeMenu() {
 document.querySelector('.sidebar').classList.remove('menu-open');
 menuToggle.setAttribute('aria-expanded', 'false');
}
menuToggle.onclick = () => {
 const open = menuToggle.getAttribute('aria-expanded') !== 'true';
 document.querySelector('.sidebar').classList.toggle('menu-open', open);
 menuToggle.setAttribute('aria-expanded', String(open));
};
document.addEventListener('keydown', event => {if (event.key === 'Escape') closeMenu();});
signOut.onclick = () => {
 sessionVersion++;
 lastResponse = '';
 accessHeader = '';
 data = undefined;
 pageIndex = 0;
 document.querySelector('#detail').close();
 document.querySelector('#detail-content').replaceChildren();
 clearTimeout(window.toastTimer);
 document.querySelector('#toast').style.display = 'none';
 closeMenu();
 showSignIn();
 main.focus();
};
async function requestRecords() {
  const headers = accessHeader ? {Authorization: accessHeader} : {};
  return fetch(recordsUrl, {headers, credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(15000)});
}
async function loadData() {
  if (!live) return window.DASHBOARD_DATA;
  const response = await requestRecords();
  if (!response.ok) throw new Error('Consulta fallida');
  return response.json();
}
let data, page = 'resumen', pageIndex = 0;
const main = document.querySelector('#main');
const titles = {resumen:'Vista general',estudiantes:'Estudiantes',actividades:'Actividades y respuestas',exportaciones:'Centro de descargas',conexion:'Conexión de datos',ayuda:'Guía y apoyo'};
const labels = {COMPLETADA:'Completada',PENDIENTE:'Pendiente',PARCIAL:'Parcial',NO_REALIZADA:'No realizada',EN_CURSO:'En curso',ABANDONADA:'Abandonada',EMOCIONAL:'Emocional',CONDUCTUAL:'Conductual',COGNITIVA:'Cognitiva',EMPATE:'Empate'};
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = value => value ? new Date(value.slice(0,10)+'T12:00:00').toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}) : 'Sin respuesta';
const pill = value => `<span class="pill ${esc(value)}">${esc(labels[value] || value)}</span>`;
const title = (subtitle, action='') => `<div class="title-row"><div><p class="eyebrow">SEGUIMIENTO ESTUDIANTIL</p><h1>${titles[page]}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`;
function missingLinks() {
  return data.activities.some(a => a.estudiante_id == null)
    ? '<div class="notice">Las actividades sin estudiante asociado quedan fuera de los filtros por ID.</div>' : '';
}
const toast = text => {const el=document.querySelector('#toast');el.textContent=text;el.style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.style.display='none',4500);};
function idKey(value) {
 return String(value ?? '').trim().replace(/^0+(?=\d)/, '');
}

function prepareRecords(result) {
 for (const key of ['students', 'assessments', 'activities']) {
   if (!Array.isArray(result[key])) throw new Error('Respuesta inválida');
 }
 const byStudent = new Map();
 for (const assessment of [...result.assessments].sort((a,b) => String(b.inicio).localeCompare(String(a.inicio)))) {
   const key = idKey(assessment.estudiante_id);
   if (!byStudent.has(key)) byStudent.set(key, []);
   byStudent.get(key).push(assessment);
 }
 return {...result, byStudent};
}

function currentPage(rows) {
 pageIndex = Math.max(0, Math.min(pageIndex, Math.ceil(rows.length / 10) - 1));
 return rows.slice(pageIndex * 10, (pageIndex + 1) * 10);
}

function overview(){
 const states=['COMPLETADA','PARCIAL','NO_REALIZADA','PENDIENTE'],colors=['#24adb6','#9a7cdb','#efbc68','#e5eaf2'];
 const counts = new Map();
 const weekCounts = Array(7).fill(0);
 let responded = 0, observations = 0;
 for (const activity of data.activities) {
   counts.set(activity.estado, (counts.get(activity.estado) || 0) + 1);
   if (activity.respondido_en) responded++;
   if (activity.observacion || activity.distractor) observations++;
   const week = Number(activity.numero_semana);
   if (activity.estado === 'COMPLETADA' && Number.isInteger(week) && week >= 1 && week <= 7) weekCounts[week-1]++;
 }
 const completed = counts.get('COMPLETADA') || 0;
 const percentage = count => data.activities.length ? count / data.activities.length * 100 : 0;
 let sum=0;const stops=states.map((state,i)=>{const start=sum;sum+=percentage(counts.get(state) || 0);return `${colors[i]} ${start}% ${sum}%`;});
 main.innerHTML=title('Cada avance cuenta. Aquí empieza el seguimiento de tu comunidad.', '<button class="primary" data-go="exportaciones"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg> &nbsp; Exportar datos</button>')+
 `<section class="hero"><div><p class="eyebrow">PEQUEÑOS PASOS. GRANDES CAMBIOS.</p><h2>Acompaña el progreso.<br>Comprende el proceso.</h2><p>Explora las respuestas, identifica patrones y transforma los datos del bot en información para tu investigación.</p><a href="#actividades">Explorar las actividades &nbsp; <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a></div><img src="../WhatsApp Image 2026-10-28 at 7.13.02 PM.jpeg" alt="Mascota del bot Procrastinator"></section>
 <section class="stats" aria-label="Indicadores de la consulta">${[[data.students.length,'Estudiantes registrados','Identificados por ID interno','<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5"/></svg>'],[responded,'Actividades con respuesta',`${data.activities.length} actividades en la consulta`,'<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m3 17 6-6 4 4 8-10M15 5h6v6"/></svg>'],[completed,'Actividades completadas',`${Math.round(percentage(completed))}% del total programado`,'<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/></svg>'],[observations,'Registros cualitativos','Con observación o distractor','<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>']].map(([n,t,s,ic])=>`<article class="stat"><span class="stat-icon">${ic}</span><small>${t}</small><strong>${n}</strong><p>${s}</p></article>`).join('')}</section>
 <div class="grid"><section class="card"><div class="card-head"><div><h2>Avance por semana del plan</h2><p>Actividades completadas · todas las dimensiones</p></div><span class="tag">7 semanas</span></div><div class="bars" role="img" aria-label="Actividades completadas por semana: ${weekCounts.join(', ')}">${weekCounts.map((n,i)=>`<div class="bar-col"><b>${n}</b><div class="bar" style="height:${n/Math.max(...weekCounts,1)*100}px;background:${i===0?'#129eaa':'#88d4d7'}"></div><small>Sem ${i+1}</small></div>`).join('')}</div><p class="chart-note">La semana corresponde al plan, no a una semana del calendario.</p></section><section class="card"><div class="card-head"><div><h2>Estado de las actividades</h2><p>Una mirada al proceso de participación</p></div></div><div class="distribution"><div class="donut" style="background:conic-gradient(${stops.join(',')})"><div><strong>${data.activities.length}</strong><small>actividades</small></div></div><div class="legend">${states.map((s,i)=>`<p><span><i style="background:${colors[i]}"></i>${labels[s]}</span><b>${counts.get(s) || 0}</b></p>`).join('')}</div></div></section></div>
 <section class="card"><div class="card-head"><div><h2>Últimas respuestas</h2><p>Una ventana a la experiencia de los estudiantes</p></div><a class="link" href="#actividades">Ver todas &nbsp; <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a></div>${activityTable([...data.activities].filter(a=>a.respondido_en).sort((a,b)=>b.respondido_en.localeCompare(a.respondido_en)).slice(0,4))}</section><p class="chart-note">Fuente: ${esc(data.source)}. Los indicadores describen la consulta; no representan cambios en tiempo real ni una medida clínica.</p>`;
}
function activityTable(rows){return `<div class="table-wrap"><table class="record-table"><thead><tr><th>REGISTRO / PLAN</th><th>DIMENSIÓN</th><th>RESPUESTA</th><th>ESTADO</th><th>FECHA DE RESPUESTA</th><th></th></tr></thead><tbody>${rows.map(a=>`<tr><td data-label="Registro / plan"><span class="id">#${esc(a.id)}</span><br><small>Plan ${esc(a.plan_id)} · ${a.estudiante_id?'ID '+esc(a.estudiante_id):'Sin vínculo'}</small></td><td data-label="Dimensión">${esc(labels[a.dimension] || a.dimension || 'Sin dimensión')}</td><td class="text" data-label="Respuesta">${esc((a.observacion || a.distractor || 'Sin respuesta cualitativa').slice(0,85))}${(a.observacion || a.distractor || '').length>85?'…':''}</td><td data-label="Estado">${pill(a.estado)}</td><td data-label="Respondido">${fmtDate(a.respondido_en)}</td><td><button class="link" data-detail="${esc(a.id)}" aria-label="Ver registro ${esc(a.id)}">Ver <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No hay registros que coincidan con los criterios.</td></tr>'}</tbody></table></div>`;}
function filters(exportMode=false){return `<div class="filters">${exportMode?'<label>Conjunto de datos<select id="dataset"><option value="assessments">Evaluaciones</option><option value="activities">Actividades y respuestas</option></select></label>':''}<label>ID de estudiante desde<input id="idFrom" type="text" inputmode="numeric" placeholder="Sin mínimo"></label><label>ID de estudiante hasta<input id="idTo" type="text" inputmode="numeric" placeholder="Sin máximo"></label><label>Desde<input id="dateFrom" type="date"></label><label>Hasta<input id="dateTo" type="date"></label></div><div class="filters"><label>Dimensión<select id="dimension"><option value="">Todas las dimensiones</option><option value="EMOCIONAL">Emocional</option><option value="CONDUCTUAL">Conductual</option><option value="COGNITIVA">Cognitiva</option><option value="EMPATE">Empate</option></select></label><label>Estado<select id="state"><option value="">Todos los estados</option>${(exportMode?['COMPLETADA','EN_CURSO','ABANDONADA']:['COMPLETADA','PENDIENTE','PARCIAL','NO_REALIZADA']).map(s=>`<option value="${s}">${labels[s]}</option>`).join('')}</select></label><button id="reset">Restablecer</button></div><p class="chart-note" id="date-help">${exportMode?'Evaluaciones: fecha de inicio.':'Actividades: fecha programada.'} Rangos inclusivos.</p><p id="filter-error" role="alert" style="color:#b64755"></p>`;}
function getRows(kind){
 const value=id=>document.getElementById(id)?.value.trim() || '';
 const lo=value('idFrom'),hi=value('idTo'),from=value('dateFrom'),to=value('dateTo');
 const error=(lo && (!/^[0-9]+$/.test(lo) || BigInt(lo)<1n)) || (hi && (!/^[0-9]+$/.test(hi) || BigInt(hi)<1n)) ? 'Escribe IDs enteros positivos.' : lo && hi && BigInt(lo)>BigInt(hi)?'El ID inicial debe ser menor o igual al final.':from && to && from>to?'La fecha inicial debe ser anterior o igual a la final.':'';
 document.querySelector('#filter-error').textContent=error;
 if(error)return [];
 const lower = lo ? BigInt(lo) : null, upper = hi ? BigInt(hi) : null;
 const dimension = value('dimension'), state = value('state');
 return data[kind].filter(row => {
   if (lower !== null || upper !== null) {
     const id = idKey(row.estudiante_id);
     if (!/^\d+$/.test(id)) return false;
     const number = BigInt(id);
     if ((lower !== null && number < lower) || (upper !== null && number > upper)) return false;
   }
   const date = (kind === 'activities' ? row.fecha_programada : row.inicio)?.slice(0,10);
   return (!from || date >= from) && (!to || date <= to)
     && (!dimension || (row.dimension || row.dimension_predominante) === dimension)
     && (!state || row.estado === state);
 });
}
function bindFilters(update){document.querySelectorAll('.filters input,.filters select').forEach(el=>el.addEventListener('input',()=>{pageIndex=0;update();}));document.querySelector('#reset').onclick=()=>{document.querySelectorAll('.filters input').forEach(el=>el.value='');document.querySelector('#dimension').value='';document.querySelector('#state').value='';pageIndex=0;update();};}
function pagination(total){return `<div class="pagination"><span>${total} registros · Página ${pageIndex+1} de ${Math.max(1,Math.ceil(total/10))}</span><div><button data-paginate="-1" ${pageIndex===0?'disabled':''}><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 12H4m6-6-6 6 6 6"/></svg> Anterior</button><button data-paginate="1" ${(pageIndex+1)*10>=total?'disabled':''}>Siguiente <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button></div></div>`;}
function activities(){main.innerHTML=title('Explora las observaciones y los distractores registrados por el bot.')+missingLinks()+`<section class="card">${filters()}<div id="results"></div></section>`;bindFilters(updateActivities);updateActivities();}
function updateActivities(){const rows=getRows('activities');document.querySelector('#results').innerHTML=activityTable(currentPage(rows))+pagination(rows.length);}
function students(){main.innerHTML=title('Consulta evaluaciones por ID interno, sin mostrar nombres ni datos de Telegram.')+`<section class="card"><div class="filters"><label>Buscar ID de estudiante<input type="search" inputmode="numeric" id="studentSearch" placeholder="Escribe un ID exacto"></label><label>Participación<select id="studentStatus"><option value="">Todos</option><option value="1">Activos</option><option value="0">Inactivos</option></select></label></div><div id="students-results"></div></section>`;document.querySelectorAll('.filters input,.filters select').forEach(el=>el.oninput=()=>{pageIndex=0;updateStudents();});updateStudents();}
function updateStudents(){const id=idKey(document.querySelector('#studentSearch').value),status=document.querySelector('#studentStatus').value;const rows=data.students.filter(s=>(!id || idKey(s.id)===id) && (!status || String(Number(s.activo))===status));document.querySelector('#students-results').innerHTML=`<div class="table-wrap"><table class="record-table"><thead><tr><th>ESTUDIANTE</th><th>REGISTRO</th><th>PARTICIPACIÓN</th><th>EVALUACIONES</th><th>ÚLTIMO PUNTAJE GLOBAL</th><th></th></tr></thead><tbody>${currentPage(rows).map(s=>{const apps=data.byStudent.get(idKey(s.id)) || [];return `<tr><td class="id" data-label="Estudiante">ID ${esc(s.id)}</td><td data-label="Registro">${fmtDate(s.creado_en)}</td><td data-label="Participación">${Number(s.activo)===1?'Activo':'Inactivo'}</td><td data-label="Evaluaciones">${apps.length}</td><td data-label="Último puntaje">${esc(apps[0]?.global_score ?? 'Sin resultado')}</td><td><button class="link" data-student="${esc(s.id)}">Ver seguimiento <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button></td></tr>`;}).join('') || '<tr><td colspan="6" class="empty">No se encontraron estudiantes.</td></tr>'}</tbody></table></div>${pagination(rows.length)}`;}
function exportsPage(){main.innerHTML=title('Define tu muestra y descarga los registros para tu análisis.')+`<div class="export-grid"><section class="card"><h2>Selecciona tu muestra</h2><p class="section-description">Elige los registros que quieres analizar.</p>${filters(true)}<div id="export-notice" class="notice info">Las evaluaciones están vinculadas al ID interno del estudiante.</div><section class="field-section" aria-labelledby="fields-title"><div class="field-heading"><div><h2 id="fields-title">Personaliza tus campos</h2><p class="section-description">Selecciona la información que llevará tu archivo.</p></div><span id="column-count" class="selection-count" role="status"></span></div><div class="field-actions"><button type="button" id="select-columns">Seleccionar todos</button><button type="button" id="clear-columns">Limpiar selección</button></div><div id="columns"></div></section><div class="card-head" style="margin-top:28px"><h2>Vista previa de la muestra</h2><span class="tag">Primeros 5 registros</span></div><div id="export-preview"></div></section><aside class="card export-summary"><p class="eyebrow">TU EXPORTACIÓN</p><h2>Lista para analizar</h2><strong class="export-total" id="export-count">0</strong><p class="subtitle">registros que cumplen tus criterios</p><div class="format-list"><label><input type="radio" name="format" value="csv" checked><div><b>CSV</b><small>R, Python y análisis de datos</small></div></label><label><input type="radio" name="format" value="xlsx"><div><b>Excel · XLSX</b><small>Para trabajar en hojas de cálculo</small></div></label><label><input type="radio" name="format" value="txt"><div><b>Texto · TXT</b><small>Lectura y análisis cualitativo</small></div></label></div><button id="download" class="primary full"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg> &nbsp; Descargar muestra</button><p class="chart-note">La descarga incluye únicamente los campos seleccionados. Los textos abiertos pueden contener información identificable: revísalos antes de compartirlos.</p><p id="export-feedback" role="status" class="chart-note"></p></aside></div>`;
 bindFilters(updateExport);document.querySelector('#dataset').addEventListener('input',()=>{const activity=document.querySelector('#dataset').value==='activities';document.querySelector('#state').innerHTML='<option value="">Todos los estados</option>'+(activity?['COMPLETADA','PENDIENTE','PARCIAL','NO_REALIZADA']:['COMPLETADA','EN_CURSO','ABANDONADA']).map(s=>`<option value="${s}">${labels[s]}</option>`).join('');setColumns();updateExport();});setColumns();updateExport();document.querySelector('#download').onclick=download;
 document.querySelector('#select-columns').onclick=()=>selectColumns(true);
 document.querySelector('#clear-columns').onclick=()=>selectColumns(false);
}
const fieldSets={assessments:['id','estudiante_id','tipo','estado','inicio','fin','emocional','conductual','cognitiva','global_score','dimension_predominante'],activities:['id','estudiante_id','plan_id','numero_semana','fecha_programada','estado','dimension','minutos_realizados','distractor','observacion','respondido_en','instrucciones']};
const fieldLabels={id:'ID del registro',estudiante_id:'ID del estudiante',tipo:'Tipo de evaluación',estado:'Estado',inicio:'Fecha de inicio',fin:'Fecha de finalización',emocional:'Puntaje emocional',conductual:'Puntaje conductual',cognitiva:'Puntaje cognitivo',global_score:'Puntaje global',dimension_predominante:'Dimensión predominante',plan_id:'ID del plan',numero_semana:'Semana del plan',fecha_programada:'Fecha programada',dimension:'Dimensión',minutos_realizados:'Minutos realizados',distractor:'Distractor',observacion:'Observación',respondido_en:'Fecha de respuesta',instrucciones:'Instrucciones'};
const fieldGroups=[['Identificación y seguimiento',['id','estudiante_id','plan_id','tipo','estado','numero_semana']],['Fechas',['inicio','fin','fecha_programada','respondido_en']],['Resultados y respuestas',['emocional','conductual','cognitiva','global_score','dimension_predominante','dimension','minutos_realizados','distractor','observacion','instrucciones']]];
function setColumns(){
 const kind=document.querySelector('#dataset').value;
 document.querySelector('#columns').innerHTML=fieldGroups.map(([label,keys])=>{
  const fields=keys.filter(k=>fieldSets[kind].includes(k));
  return `<fieldset class="field-group"><legend>${label}</legend><div class="field-options">${fields.map(k=>`<label class="field-option"><input type="checkbox" name="column" value="${k}" checked><span>${fieldLabels[k]}</span></label>`).join('')}</div></fieldset>`;
 }).join('');
 document.querySelectorAll('[name=column]').forEach(el=>el.onchange=updateExport);
}
function selectColumns(checked){document.querySelectorAll('[name=column]').forEach(el=>el.checked=checked);updateExport();}
function selectedColumns(){const selected=new Set([...document.querySelectorAll('[name=column]:checked')].map(el=>el.value));return fieldSets[document.querySelector('#dataset').value].filter(k=>selected.has(k));}
function updateExport(){const kind=document.querySelector('#dataset').value,rows=getRows(kind),cols=selectedColumns();document.querySelector('#export-count').textContent=rows.length;document.querySelector('#column-count').textContent=`${cols.length} de ${fieldSets[kind].length} seleccionados`;document.querySelector('#download').disabled=!rows.length || !cols.length;document.querySelector('#export-notice').innerHTML=kind==='activities'?'El filtro por estudiante usa el vínculo de la actividad con su plan.':'Las evaluaciones están vinculadas al ID interno del estudiante.';document.querySelector('#date-help').textContent=(kind==='activities'?'Actividades: fecha programada.':'Evaluaciones: fecha de inicio.')+' Rangos inclusivos.';document.querySelector('#export-preview').innerHTML=cols.length?`<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${fieldLabels[c]}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,5).map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c] ?? '—')}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${cols.length}" class="empty">No hay registros para estos criterios.</td></tr>`}</tbody></table></div>`:'<p class="empty">Selecciona al menos un campo.</p>';}
function download(){const kind=document.querySelector('#dataset').value,rows=getRows(kind),cols=selectedColumns(),format=document.querySelector('[name=format]:checked').value;if(!rows.length || !cols.length)return;const blob=window.makeExport(rows,cols,format);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`procrastinator_${kind}_${new Date().toISOString().slice(0,10)}.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);document.querySelector('#export-feedback').textContent=`Se generó un archivo ${format.toUpperCase()} con ${rows.length} registros y ${cols.length} campos.`;toast('Archivo generado. Revisa las descargas de tu navegador.');}
function connection() {
  main.innerHTML = title('Origen de los registros del panel.') +
    `<section class="card"><h2>${esc(data.source)}</h2><p>${live ? 'El panel consulta cada segundo los últimos registros del bot.' : 'Esta versión pública utiliza ejemplos ficticios para explorar el panel.'}</p></section>`;

  if (!live) {
    const status = document.createElement('p');
    status.textContent = 'Comprobando la conexión con el bot…';
    main.append(status);
    fetch('https://unisalud.com.mx/procrast-panel/records.php?conexion=1', {cache:'no-store'})
      .then(async response => {
        if (!response.ok || !(await response.json()).conectada) throw Error();
        status.textContent = 'Base del bot conectada. Los registros requieren acceso al panel privado.';
      })
      .catch(() => { status.textContent = 'No se pudo comprobar la conexión con el bot.'; });
    const link = document.createElement('a');
    link.href = 'https://unisalud.com.mx/procrast-panel/live.php';
    link.textContent = 'Abrir panel privado';
    main.append(link);
  }
}
function help(){main.innerHTML=title('Herramientas para administrar con claridad y analizar con contexto.')+`<div class="support-grid"><section class="card"><p class="eyebrow">01 · EXPLORA</p><h2>Sigue la participación</h2><p>Busca un ID en Estudiantes para consultar sus evaluaciones PRE, POST y de seguimiento.</p><a class="link" href="#estudiantes">Ver estudiantes <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a></section><section class="card"><p class="eyebrow">02 · COMPRENDE</p><h2>Escucha las respuestas</h2><p>Revisa las observaciones y los distractores por dimensión, estado y fecha programada.</p><a class="link" href="#actividades">Explorar respuestas <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a></section><section class="card"><p class="eyebrow">03 · ANALIZA</p><h2>Construye tu muestra</h2><p>Combina rangos de ID y fechas, selecciona columnas y descarga CSV, XLSX o texto.</p><a class="link" href="#exportaciones">Ir a descargas <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a></section></div><section class="card" style="margin-top:22px"><h2 style="margin-bottom:20px">Preguntas frecuentes</h2><details open><summary>¿Qué significa el ID del estudiante?</summary><p>Es el identificador interno de la tabla estudiantes. No es el ID de actividad, el ID de plan ni el identificador de Telegram. Se conserva para vincular las evaluaciones de una misma persona.</p></details><details><summary>¿Qué fecha se utiliza para filtrar?</summary><p>En evaluaciones se usa inicio; en actividades, fecha_programada. Los dos extremos del rango están incluidos. La fecha de respuesta se muestra por separado.</p></details><details><summary>¿Por qué algunas actividades aparecen sin vínculo?</summary><p>Una actividad puede carecer de un plan asociado. No se infiere una identidad a partir de números similares. Para resolverlo, recupera planes y enlaza actividades_plan.plan_id con planes.id y planes.estudiante_id con estudiantes.id.</p></details><details><summary>¿Los datos son anónimos?</summary><p>Se omiten nombres, alias y Telegram. Los IDs permiten seguimiento y los textos libres pueden contener detalles identificables; por ello son datos seudonimizados, no una garantía de anonimato.</p></details><details><summary>¿Cómo se mide el progreso?</summary><p>Se muestran actividades completadas y evaluaciones registradas. El porcentaje de actividades completadas usa todas las actividades programadas de la consulta, incluidas las futuras; no debe interpretarse como eficacia del bot ni resultado clínico.</p></details></section>`;}
function route(){if(!data)return;closeMenu();page=location.hash.slice(1) || 'resumen';if(!Object.hasOwn(titles,page))page='resumen';pageIndex=0;document.querySelector('#breadcrumb').textContent=titles[page];document.querySelectorAll('[data-page]').forEach(el=>{el.classList.toggle('active',el.dataset.page===page);if(el.dataset.page===page)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});({resumen:overview,estudiantes:students,actividades:activities,exportaciones:exportsPage,conexion:connection,ayuda:help}[page])();}
main.addEventListener('click',e=>{const go=e.target.closest('[data-go]');if(go)location.hash=go.dataset.go;const pg=e.target.closest('[data-paginate]');if(pg){pageIndex+=Number(pg.dataset.paginate);(page==='estudiantes'?updateStudents:updateActivities)();}const detail=e.target.closest('[data-detail]'),student=e.target.closest('[data-student]');if(detail){const a=data.activities.find(a=>idKey(a.id)===idKey(detail.dataset.detail));document.querySelector('#detail-content').innerHTML=`<p class="eyebrow">ACTIVIDAD #${esc(a.id)} · PLAN ${esc(a.plan_id)}</p><h2>Detalle de la respuesta</h2>${Object.entries(a).map(([k,v])=>`<div class="detail-item"><small>${esc(k)}</small>${esc(v ?? 'Sin dato')}</div>`).join('')}`;document.querySelector('#detail').showModal();}if(student){const apps=[...(data.byStudent.get(idKey(student.dataset.student)) || [])].reverse();document.querySelector('#detail-content').innerHTML=`<p class="eyebrow">SEGUIMIENTO INDIVIDUAL</p><h2>Estudiante ID ${esc(student.dataset.student)}</h2>${apps.map(a=>`<div class="detail-item"><h3>${esc(a.tipo)} · ${fmtDate(a.inicio)} ${pill(a.estado)}</h3>Puntaje global: <b>${esc(a.global_score ?? 'Sin resultado')}</b><br>Emocional: ${esc(a.emocional ?? '—')} · Conductual: ${esc(a.conductual ?? '—')} · Cognitiva: ${esc(a.cognitiva ?? '—')}</div>`).join('') || '<p>Sin evaluaciones registradas.</p>'}${missingLinks()}`;document.querySelector('#detail').showModal();}});
document.querySelector('.close').onclick=()=>document.querySelector('#detail').close();
window.addEventListener('hashchange',()=>{if(data) route();main.focus();});
function startDashboard() {
return loadData().then(result => {
  data = prepareRecords(result);
  signOut.hidden = !live;
  route();
  const label = live ? 'MariaDB · lectura en vivo' : 'Demo · datos ficticios';
  document.querySelector('#source-label').textContent = label;
  document.querySelector('.local-badge').textContent = label;
}).catch(() => {
  document.querySelector('#source-label').textContent = 'Sin datos';
  document.querySelector('.local-badge').textContent = 'Error de carga';
  main.innerHTML = '<h1>No se pudieron cargar los datos</h1><p>Recarga la página o consulta al administrador.</p>';
});

}
function showSignIn() {
  signOut.hidden = true;
  document.body.classList.add('signed-out');
  document.querySelector('#breadcrumb').textContent = 'Acceso al panel';
  document.querySelector('#source-label').textContent = 'Sesión cerrada';
  document.querySelector('.local-badge').textContent = 'Sesión cerrada';
  main.innerHTML = '<section class="card login-card"><p class="eyebrow">PROCRASTINATOR</p><h1>Bienvenido de nuevo</h1><p class="subtitle">Inicia sesión para consultar el seguimiento estudiantil.</p><form id="sign-in"><label>Usuario<input name="username" autocomplete="username" required></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label><button class="primary" type="submit">Entrar</button><p id="login-status" role="status"></p></form></section>';
  const form = document.querySelector('#sign-in');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    const fields = new FormData(form);
    try {
      const credentials = new TextEncoder().encode(fields.get('username') + ':' + fields.get('password'));
      accessHeader = 'Basic ' + btoa(Array.from(credentials, byte => String.fromCharCode(byte)).join(''));
      const response = await requestRecords();
      if (!response.ok) throw Error();
      const body = await response.text();
      data = prepareRecords(JSON.parse(body));
      lastResponse = body;
      document.body.classList.remove('signed-out');
      signOut.hidden = false;
      document.querySelector('.local-badge').textContent = 'MariaDB · lectura en vivo';
      form.reset();
      route();
      document.querySelector('#source-label').textContent = 'Actualización cada segundo';
    } catch {
      accessHeader = '';
      document.querySelector('#login-status').textContent = 'No se pudo entrar. Revisa tus datos o intenta de nuevo.';
      button.disabled = false;
    }
  });
}
if (live) showSignIn();
else startDashboard();

// Consultas periódicas sin peticiones superpuestas.
if (live) {
  let refreshing = false;
  setInterval(async () => {
    if (refreshing || !data) return;
    refreshing = true;
    const version = sessionVersion;
    try {
      const response = await requestRecords();
      if (version !== sessionVersion || !data) return;
      if (response.status === 401 || response.status === 403) {
        signOut.click();
        return;
      }
      if (!response.ok) throw new Error('Consulta fallida');
      const body = await response.text();
      if (version !== sessionVersion || !data) return;
      if (body !== lastResponse) {
        data = prepareRecords(JSON.parse(body));
        lastResponse = body;
        if (page === 'resumen') overview();
        if (page === 'estudiantes') updateStudents();
        if (page === 'actividades') updateActivities();
        if (page === 'exportaciones') updateExport();
      }
      document.querySelector('.local-badge').textContent = 'En vivo · ' + new Date().toLocaleTimeString('es-MX');
      document.querySelector('#source-label').textContent = 'Actualización cada segundo';
    } catch (error) {
      if (version !== sessionVersion || !data) return;
      document.querySelector('.local-badge').textContent = 'Sin conexión · reintentando';
    } finally {
      refreshing = false;
    }
  }, 1000);
}
