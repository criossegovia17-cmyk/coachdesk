import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { exercises as SEED_EX, demo } from './seed.js';
import { plan as rulesPlan } from './planner.js';

const SB_URL = 'https://qqgdbdbdfecppehwyezm.supabase.co';
const SB_KEY = 'sb_publishable_ljrk5vR6YAvpHs68RehEYw_mLclqIcu';
const sb = createClient(SB_URL, SB_KEY);
let USER = null;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p) => p + Math.random().toString(36).slice(2, 8);
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const money = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0);
const fdate = (s) => (s ? new Date(s + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) : '—');
const LEVELS = [['principiante', 'Principiante'], ['intermedio', 'Intermedio'], ['avanzado', 'Avanzado']];
const PATTERNS = ['sentadilla', 'empuje', 'bisagra', 'tirón', 'core', 'cardio'];
const EQUIP = ['mancuernas', 'banda', 'banco', 'barra', 'máquina', 'cuerda', 'rueda', 'cuerda pesada'];

let S, tab = {}, ui = { plan: { clientIds: [], minutes: 45, focus: 'completo', equipment: ['mancuernas', 'banda', 'banco'], useAI: true }, result: null, busy: false }, tmr;
const cl = (id) => S.clients.find((c) => c.id === id);
const ex = (id) => S.exercises.find((e) => e.id === id);
const flush = async () => { tmr = null; const { error } = await sb.from('coach_data').upsert({ user_id: USER.id, data: S, updated_at: new Date().toISOString() }); if (error) toast('Error al guardar: ' + error.message); };
const save = () => { clearTimeout(tmr); tmr = setTimeout(flush, 400); };
window.addEventListener('beforeunload', () => { if (tmr) flush(); });
const toast = (m) => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 2400); };
const closeModal = () => { $('#modal').hidden = true; $('#modal').innerHTML = ''; };
const copy = async (txt) => { try { await navigator.clipboard.writeText(txt); toast('Copiado ✓'); } catch { prompt('Copia el texto:', txt); } };
const opts = (list, sel) => list.map(([a, b]) => `<option value="${esc(a)}" ${a === sel ? 'selected' : ''}>${esc(b)}</option>`).join('');
const clientOpts = (sel, blank) => (blank ? `<option value="">${blank}</option>` : '') + opts(S.clients.map((c) => [c.id, c.name]), sel);

function setPath(o, path, v) {
  const k = path.split('.'); const last = k.pop();
  for (const p of k) o = o[p];
  o[last] = v;
}

function form(title, fields, v = {}) {
  return new Promise((res) => {
    const m = $('#modal'); m.hidden = false;
    const f = fields.map((x) => {
      const val = v[x.k]; let inp;
      if (x.t === 'select') inp = `<select name="${x.k}">${opts(x.o, val)}</select>`;
      else if (x.t === 'checks') inp = `<div class="checks">${x.o.map(([a, b]) => `<label><input type="checkbox" name="${x.k}" value="${esc(a)}" ${(val || []).includes(a) ? 'checked' : ''}>${esc(b)}</label>`).join('') || '<span class="mute">Sin opciones</span>'}</div>`;
      else if (x.t === 'textarea') inp = `<textarea name="${x.k}">${esc(val)}</textarea>`;
      else if (x.t === 'tags') inp = `<input name="${x.k}" value="${esc((val || []).join(', '))}" placeholder="${esc(x.ph || 'separados por coma')}">`;
      else inp = `<input name="${x.k}" type="${x.t || 'text'}" value="${esc(val)}" ${x.step ? `step="${x.step}"` : ''} ${x.req ? 'required' : ''} placeholder="${esc(x.ph || '')}">`;
      return `<label>${x.l}</label>${inp}`;
    }).join('');
    m.innerHTML = `<form class="dlg"><h2 style="margin-top:0">${title}</h2>${f}<div class="bar"><span class="grow"></span><button type="button" data-x="cancel">Cancelar</button><button class="pri">Guardar</button></div></form>`;
    const fm = m.firstChild;
    fm.onsubmit = (ev) => {
      ev.preventDefault(); const out = {};
      for (const x of fields) {
        if (x.t === 'checks') out[x.k] = [...fm.querySelectorAll(`[name="${x.k}"]:checked`)].map((i) => i.value);
        else {
          let val = fm.elements[x.k].value;
          if (x.t === 'tags') val = val.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
          else if (x.t === 'number') val = val === '' ? '' : Number(val);
          out[x.k] = val;
        }
      }
      closeModal(); res(out);
    };
    fm.querySelector('[data-x=cancel]').onclick = () => { closeModal(); res(null); };
  });
}
function dialog(html) {
  const m = $('#modal'); m.hidden = false;
  m.innerHTML = `<div class="dlg">${html}<div class="bar"><span class="grow"></span><button data-act="close">Cerrar</button></div></div>`;
}

// ---------- Vistas ----------
const V = {};

V.home = () => {
  const t = today(), month = t.slice(0, 7);
  const active = S.clients.filter((c) => c.active);
  const income = S.payments.filter((p) => p.status === 'pagado' && p.paidOn.startsWith(month)).reduce((a, p) => a + p.amount, 0);
  const pend = S.payments.filter((p) => p.status !== 'pagado');
  const late = pend.filter((p) => p.due < t);
  const next = S.appointments.filter((a) => a.date >= t && a.status === 'programada').sort(apptSort).slice(0, 6);
  return `<h1>Hola, coach 👋</h1><p class="sub">Resumen de hoy, ${fdate(t)}</p>
  <div class="grid">
    <div class="card stat">${active.length}<small>Clientes activos</small></div>
    <div class="card stat">${money(income)}<small>Cobrado este mes</small></div>
    <div class="card stat">${money(pend.reduce((a, p) => a + p.amount, 0))}<small>Por cobrar (${pend.length})</small></div>
    <div class="card stat" style="color:${late.length ? 'var(--bad)' : 'inherit'}">${late.length}<small>Pagos vencidos</small></div>
  </div>
  <div class="two"><div class="card"><h3>Próximas citas</h3>${next.length ? next.map((a) => `<div class="row sp"><span><b>${fdate(a.date)}</b> ${a.time} · ${esc(apptWho(a))}</span><span class="tag">${a.type}</span></div>`).join('') : '<p class="mute">Sin citas próximas.</p>'}<div class="bar"><a class="btn" href="#/agenda">Ver agenda</a></div></div>
  <div class="card"><h3>Pagos vencidos</h3>${late.length ? late.map((p) => `<div class="row sp"><span>${esc(cl(p.clientId)?.name || '?')} · ${money(p.amount)}</span><span class="tag bad">${fdate(p.due)}</span></div>`).join('') : '<p class="mute">Todo al corriente 🎉</p>'}<div class="bar"><a class="btn" href="#/pagos">Ir a pagos</a></div></div></div>
  <div class="card"><h3>✨ Entrenamiento grupal con IA</h3><p class="mute">Elige a los clientes de una sesión y genera un circuito donde todos participan, adaptado a nivel y lesiones de cada uno, con el tiempo de atención que merece cada cliente.</p><a class="btn pri" href="#/entrenar">Crear sesión grupal</a></div>`;
};

V.clientes = () => {
  const q = (ui.q || '').toLowerCase();
  const list = S.clients.filter((c) => c.name.toLowerCase().includes(q) || (c.goal || '').toLowerCase().includes(q));
  return `<h1>Clientes</h1><p class="sub">${S.clients.length} registrados</p>
  <div class="bar"><input id="q" placeholder="Buscar…" value="${esc(ui.q || '')}" style="max-width:260px"><span class="grow"></span><button class="pri" data-act="client-new">+ Nuevo cliente</button></div>
  <div class="grid">${list.map((c) => `<a class="card" href="#/cliente/${c.id}" style="text-decoration:none;color:inherit"><div class="row sp"><h3>${esc(c.name)}</h3>${c.active ? '' : '<span class="tag warn">Inactivo</span>'}</div>
    <div class="mute">${esc(c.goal || 'Sin objetivo')}</div>
    <div><span class="tag">${c.level}</span>${c.injuries.map((i) => `<span class="tag bad">⚠ ${esc(i)}</span>`).join('')}</div>
    <div class="mute" style="margin-top:6px">${esc(S.plans.find((p) => p.id === c.planId)?.name || 'Sin plan')}</div></a>`).join('') || '<p class="mute">Sin resultados.</p>'}</div>`;
};

const clientFields = () => [
  { k: 'name', l: 'Nombre', req: 1 }, { k: 'phone', l: 'WhatsApp (con lada, ej. 5215512345678)' }, { k: 'email', l: 'Correo', t: 'email' },
  { k: 'goal', l: 'Objetivo' }, { k: 'level', l: 'Nivel', t: 'select', o: LEVELS },
  { k: 'injuries', l: 'Lesiones / limitaciones (rodilla, hombro, espalda, muñeca, impacto…)', t: 'tags' },
  { k: 'planId', l: 'Plan', t: 'select', o: [['', 'Sin plan'], ...S.plans.map((p) => [p.id, `${p.name} · ${money(p.price)}`])] },
  { k: 'routineId', l: 'Rutina asignada', t: 'select', o: [['', 'Ninguna'], ...S.routines.map((r) => [r.id, r.name])] },
  { k: 'dietId', l: 'Dieta asignada', t: 'select', o: [['', 'Ninguna'], ...S.diets.map((r) => [r.id, r.name])] },
  { k: 'notes', l: 'Notas', t: 'textarea' },
  { k: 'active', l: 'Estado', t: 'select', o: [['1', 'Activo'], ['0', 'Inactivo']] },
];

V.cliente = (id) => {
  const c = cl(id); if (!c) return '<p>Cliente no encontrado.</p>';
  const t = tab.cliente || 'resumen';
  const tabs = [['resumen', 'Resumen'], ['progreso', 'Progreso'], ['carpeta', 'Carpeta'], ['pagos', 'Pagos']];
  let body = '';
  if (t === 'resumen') {
    const r = S.routines.find((x) => x.id === c.routineId), d = S.diets.find((x) => x.id === c.dietId), p = S.plans.find((x) => x.id === c.planId);
    const gs = S.groups.filter((g) => g.clientIds.includes(c.id));
    const ap = S.appointments.filter((a) => a.date >= today() && apptIds(a).includes(c.id)).sort(apptSort).slice(0, 4);
    body = `<div class="two"><div class="card"><div class="row sp"><h3>Perfil</h3><button class="sm" data-act="client-edit" data-id="${c.id}">Editar</button></div>
      <p><b>Objetivo:</b> ${esc(c.goal) || '—'}<br><b>Nivel:</b> ${c.level}<br><b>Plan:</b> ${esc(p?.name || '—')}<br><b>WhatsApp:</b> ${esc(c.phone) || '—'}</p>
      <div>${c.injuries.map((i) => `<span class="tag bad">⚠ ${esc(i)}</span>`).join('') || '<span class="mute">Sin lesiones registradas</span>'}</div>
      <p class="mute">${esc(c.notes)}</p></div>
      <div class="card"><h3>Asignado</h3>
      <p><b>Rutina:</b> ${r ? `<a href="#/rutina/${r.id}">${esc(r.name)}</a> <button class="sm" data-act="copy-routine" data-id="${r.id}">Copiar para WhatsApp</button>` : '—'}</p>
      <p><b>Dieta:</b> ${d ? `<a href="#/dieta/${d.id}">${esc(d.name)}</a> <button class="sm" data-act="copy-diet" data-id="${d.id}">Copiar para WhatsApp</button>` : '—'}</p>
      <p><b>Grupos:</b> ${gs.map((g) => `<span class="tag">${esc(g.name)}</span>`).join('') || '—'}</p>
      <h3>Próximas citas</h3>${ap.map((a) => `<div>${fdate(a.date)} ${a.time} <span class="tag">${a.type}</span></div>`).join('') || '<span class="mute">Ninguna</span>'}</div></div>
      <div class="bar"><button class="del" data-act="client-del" data-id="${c.id}">Eliminar cliente</button></div>`;
  } else if (t === 'progreso') {
    const m = [...c.measures].sort((a, b) => a.date.localeCompare(b.date));
    const w = m.filter((x) => x.weight !== '' && x.weight != null);
    body = `<div class="bar"><button class="pri" data-act="measure-add" data-id="${c.id}">+ Registrar medidas</button></div>
      ${w.length > 1 ? `<div class="card">${spark(w.map((x) => x.weight))}<p class="mute">Peso: ${w[0].weight} → ${w.at(-1).weight} kg (${(w.at(-1).weight - w[0].weight).toFixed(1)} kg)</p></div>` : ''}
      <div class="card"><table><tr><th>Fecha</th><th>Peso kg</th><th>% grasa</th><th>Cintura cm</th><th>Nota</th><th></th></tr>
      ${m.map((x) => `<tr><td>${fdate(x.date)}</td><td>${x.weight ?? ''}</td><td>${x.fat ?? ''}</td><td>${x.waist ?? ''}</td><td>${esc(x.note)}</td><td><button class="sm del" data-act="measure-del" data-id="${c.id}" data-i="${c.measures.indexOf(x)}">✕</button></td></tr>`).join('') || '<tr><td colspan=6 class="mute">Aún sin registros.</td></tr>'}</table></div>`;
  } else if (t === 'carpeta') {
    body = `<div class="card"><h3>Carpeta de ${esc(c.name)}</h3><p class="mute">Fotos de progreso, análisis, PDFs de laboratorio, consentimientos, etc.</p>
      <input type="file" id="up" multiple data-client="${c.id}">
      ${c.files.map((f, i) => `<div class="file"><a href="#" data-act="file-open" data-id="${c.id}" data-i="${i}">${esc(f.name)}</a><span class="mute">${fdate(f.date)} <button class="sm del" data-act="file-del" data-id="${c.id}" data-i="${i}">✕</button></span></div>`).join('') || '<p class="mute">Carpeta vacía.</p>'}</div>
      <div class="card"><h3>Notas del entrenador</h3><textarea data-notes="${c.id}">${esc(c.notes)}</textarea></div>`;
  } else {
    const ps = S.payments.filter((p) => p.clientId === c.id).sort((a, b) => b.due.localeCompare(a.due));
    body = `<div class="card"><table><tr><th>Concepto</th><th>Monto</th><th>Vence</th><th>Estado</th></tr>${ps.map((p) => `<tr><td>${esc(p.concept)}</td><td>${money(p.amount)}</td><td>${fdate(p.due)}</td><td>${payTag(p)}</td></tr>`).join('') || '<tr><td colspan=4 class="mute">Sin pagos.</td></tr>'}</table></div>`;
  }
  return `<div class="bar"><a href="#/clientes">← Clientes</a></div><h1>${esc(c.name)}</h1><p class="sub">${esc(c.goal)}</p>
  <div class="tabs">${tabs.map(([k, l]) => `<button class="${t === k ? 'on' : ''}" data-act="tab" data-k="cliente" data-v="${k}">${l}</button>`).join('')}</div>${body}`;
};

function spark(vals) {
  const W = 500, H = 90, mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * (W - 20) + 10},${H - 12 - ((v - mn) / r) * (H - 24)}`);
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:110px"><polyline fill="none" stroke="var(--pri)" stroke-width="3" points="${pts.join(' ')}"/>${pts.map((p) => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="4" fill="var(--pri)"/>`).join('')}</svg>`;
}

V.grupos = () => `<h1>Grupos</h1><p class="sub">Arma grupos para clases y sesiones compartidas</p>
  <div class="bar"><button class="pri" data-act="group-new">+ Nuevo grupo</button></div>
  <div class="grid">${S.groups.map((g) => `<div class="card"><h3>${esc(g.name)}</h3><p class="mute">${esc(g.notes)}</p>
    <div>${g.clientIds.map((i) => `<span class="tag">${esc(cl(i)?.name || '?')}</span>`).join('')}</div>
    <div class="bar"><a class="btn pri sm" href="#/entrenar" data-act="plan-group" data-id="${g.id}">✨ Entrenar</a><button class="sm" data-act="group-edit" data-id="${g.id}">Editar</button><button class="sm del" data-act="group-del" data-id="${g.id}">Eliminar</button></div></div>`).join('') || '<p class="mute">Aún no hay grupos.</p>'}</div>`;

const apptIds = (a) => (a.groupId ? S.groups.find((g) => g.id === a.groupId)?.clientIds || [] : a.clientIds || []);
const apptWho = (a) => (a.groupId ? S.groups.find((g) => g.id === a.groupId)?.name || 'Grupo' : (a.clientIds || []).map((i) => cl(i)?.name).filter(Boolean).join(', ') || '—');
const apptSort = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);
const apptFields = () => [
  { k: 'date', l: 'Fecha', t: 'date', req: 1 }, { k: 'time', l: 'Hora', t: 'time', req: 1 }, { k: 'duration', l: 'Duración (min)', t: 'number' },
  { k: 'type', l: 'Tipo', t: 'select', o: [['individual', 'Individual'], ['grupal', 'Grupal']] },
  { k: 'groupId', l: 'Grupo (solo si es grupal)', t: 'select', o: [['', '— ninguno —'], ...S.groups.map((g) => [g.id, g.name])] },
  { k: 'clientIds', l: 'Clientes (si no usas grupo)', t: 'checks', o: S.clients.map((c) => [c.id, c.name]) },
  { k: 'status', l: 'Estado', t: 'select', o: [['programada', 'Programada'], ['realizada', 'Realizada'], ['cancelada', 'Cancelada'], ['no vino', 'No asistió']] },
  { k: 'notes', l: 'Notas', t: 'textarea' },
];

V.agenda = () => {
  const f = tab.agenda || 'proximas', t = today();
  let list = [...S.appointments].sort(apptSort);
  if (f === 'proximas') list = list.filter((a) => a.date >= t);
  else if (f === 'pasadas') list = list.filter((a) => a.date < t).reverse();
  const byDay = {}; list.forEach((a) => (byDay[a.date] ||= []).push(a));
  const tag = (s) => `<span class="tag ${s === 'realizada' ? 'ok' : s === 'programada' ? '' : 'bad'}">${s}</span>`;
  return `<h1>Agenda</h1><p class="sub">Citas de entrenamiento individuales y grupales</p>
  <div class="bar"><button class="pri" data-act="appt-new">+ Nueva cita</button><span class="grow"></span>${[['proximas', 'Próximas'], ['pasadas', 'Pasadas'], ['todas', 'Todas']].map(([k, l]) => `<button class="sm ${f === k ? 'pri' : ''}" data-act="tab" data-k="agenda" data-v="${k}">${l}</button>`).join('')}</div>
  ${Object.entries(byDay).map(([d, as]) => `<div class="card"><h3>${fdate(d)}${d === t ? ' · Hoy' : ''}</h3>${as.map((a) => `<div class="row sp" style="padding:6px 0;border-top:1px solid var(--line)"><span><b>${a.time}</b> · ${a.duration || 60} min · ${esc(apptWho(a))} <span class="tag">${a.type}</span> ${tag(a.status)}<br><span class="mute">${esc(a.notes)}</span></span><span><button class="sm" data-act="appt-edit" data-id="${a.id}">Editar</button> <button class="sm del" data-act="appt-del" data-id="${a.id}">✕</button></span></div>`).join('')}</div>`).join('') || '<p class="mute">Sin citas en esta vista.</p>'}`;
};

V.rutinas = () => {
  const t = tab.rutinas || 'plantillas';
  let body;
  if (t === 'plantillas') {
    body = `<div class="bar"><button class="pri" data-act="routine-new">+ Nueva rutina</button></div><div class="grid">${S.routines.map((r) => `<div class="card"><h3>${esc(r.name)}</h3><p class="mute">${esc(r.goal)} · ${r.days.length} días · ${r.days.reduce((a, d) => a + d.items.length, 0)} ejercicios</p>
      <p class="mute">Asignada a: ${S.clients.filter((c) => c.routineId === r.id).map((c) => esc(c.name)).join(', ') || 'nadie'}</p>
      <div class="bar"><a class="btn sm pri" href="#/rutina/${r.id}">Abrir / editar</a><button class="sm" data-act="copy-routine" data-id="${r.id}">Copiar</button><button class="sm del" data-act="routine-del" data-id="${r.id}">✕</button></div></div>`).join('')}</div>`;
  } else {
    const p = ui.pat || '';
    const list = S.exercises.filter((e) => !p || e.pattern === p);
    body = `<div class="bar"><button class="pri" data-act="ex-new">+ Nuevo ejercicio</button><select id="pat" style="max-width:200px"><option value="">Todos los patrones</option>${PATTERNS.map((x) => `<option ${x === p ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="card"><table><tr><th>Ejercicio</th><th>Patrón</th><th>Nivel</th><th>Cuidado con</th><th></th></tr>${list.map((e) => `<tr><td><b>${esc(e.name)}</b><br><span class="mute">${esc(e.muscle)}</span></td><td>${e.pattern}</td><td>${e.level}</td><td>${e.avoid.map((a) => `<span class="tag bad">${esc(a)}</span>`).join('')}</td><td style="white-space:nowrap"><button class="sm" data-act="ex-view" data-id="${e.id}">Ver ejemplo</button> <button class="sm" data-act="ex-edit" data-id="${e.id}">✎</button></td></tr>`).join('')}</table></div>`;
  }
  return `<h1>Rutinas y ejercicios</h1><p class="sub">Biblioteca con ejemplos y plantillas para asignar a clientes</p>
  <div class="tabs">${[['plantillas', 'Plantillas de rutina'], ['biblioteca', 'Biblioteca de ejercicios']].map(([k, l]) => `<button class="${t === k ? 'on' : ''}" data-act="tab" data-k="rutinas" data-v="${k}">${l}</button>`).join('')}</div>${body}`;
};

V.rutina = (id) => {
  const r = S.routines.find((x) => x.id === id); if (!r) return '<p>No encontrada.</p>';
  const exo = (sel) => `<option value="">— elegir —</option>` + PATTERNS.map((p) => `<optgroup label="${p}">${S.exercises.filter((e) => e.pattern === p).map((e) => `<option value="${e.id}" ${e.id === sel ? 'selected' : ''}>${esc(e.name)} (${e.level})</option>`).join('')}</optgroup>`).join('');
  return `<div class="bar"><a href="#/rutinas">← Rutinas</a></div><div data-root="routines:${r.id}">
  <div class="two"><div><label>Nombre</label><input data-path="name" value="${esc(r.name)}"></div><div><label>Objetivo</label><input data-path="goal" value="${esc(r.goal)}"></div></div>
  ${r.days.map((d, di) => `<div class="card"><div class="row sp"><input data-path="days.${di}.name" value="${esc(d.name)}" style="max-width:240px;font-weight:600"><button class="sm del" data-act="rday-del" data-id="${r.id}" data-d="${di}">Quitar día</button></div>
    <div class="edit-row mute" style="margin-top:8px"><span>Ejercicio</span><span>Series</span><span>Reps</span><span>Descanso</span><span>Nota</span><span></span></div>
    ${d.items.map((it, ii) => `<div class="edit-row"><select data-path="days.${di}.items.${ii}.exId">${exo(it.exId)}</select><input type="number" data-path="days.${di}.items.${ii}.sets" value="${it.sets}"><input data-path="days.${di}.items.${ii}.reps" value="${esc(it.reps)}"><input data-path="days.${di}.items.${ii}.rest" value="${esc(it.rest)}"><input data-path="days.${di}.items.${ii}.note" value="${esc(it.note)}"><span style="white-space:nowrap"><button class="sm" title="Ver ejemplo" data-act="ex-view" data-id="${it.exId}">👁</button><button class="sm del" data-act="ritem-del" data-id="${r.id}" data-d="${di}" data-i="${ii}">✕</button></span></div>`).join('')}
    <button class="sm" data-act="ritem-add" data-id="${r.id}" data-d="${di}">+ Ejercicio</button></div>`).join('')}
  <div class="bar"><button data-act="rday-add" data-id="${r.id}">+ Agregar día</button><button data-act="copy-routine" data-id="${r.id}">Copiar para WhatsApp</button><button onclick="print()">Imprimir</button></div></div>`;
};

V.dietas = () => `<h1>Dietas</h1><p class="sub">Menús con macros que puedes asignar a tus clientes</p>
  <div class="bar"><button class="pri" data-act="diet-new">+ Nueva dieta</button></div>
  <div class="grid">${S.diets.map((d) => `<div class="card"><h3>${esc(d.name)}</h3><p>${d.kcal} kcal · P ${d.protein}g · C ${d.carbs}g · G ${d.fat}g</p>
    <p class="mute">Asignada a: ${S.clients.filter((c) => c.dietId === d.id).map((c) => esc(c.name)).join(', ') || 'nadie'}</p>
    <div class="bar"><a class="btn sm pri" href="#/dieta/${d.id}">Abrir / editar</a><button class="sm" data-act="copy-diet" data-id="${d.id}">Copiar</button><button class="sm del" data-act="diet-del" data-id="${d.id}">✕</button></div></div>`).join('')}</div>`;

V.dieta = (id) => {
  const d = S.diets.find((x) => x.id === id); if (!d) return '<p>No encontrada.</p>';
  const kc = d.protein * 4 + d.carbs * 4 + d.fat * 9;
  return `<div class="bar"><a href="#/dietas">← Dietas</a></div><div data-root="diets:${d.id}">
  <label>Nombre</label><input data-path="name" value="${esc(d.name)}">
  <div class="three" style="grid-template-columns:repeat(4,1fr)">${[['kcal', 'Kcal'], ['protein', 'Proteína g'], ['carbs', 'Carbs g'], ['fat', 'Grasa g']].map(([k, l]) => `<div><label>${l}</label><input type="number" data-path="${k}" value="${d[k]}"></div>`).join('')}</div>
  <p class="mute">Los macros suman ≈ ${kc} kcal (meta ${d.kcal}).</p>
  <label>Notas / indicaciones</label><textarea data-path="notes">${esc(d.notes)}</textarea>
  ${d.days.map((day, di) => `<div class="card"><div class="row sp"><input data-path="days.${di}.name" value="${esc(day.name)}" style="max-width:260px;font-weight:600"><button class="sm del" data-act="dday-del" data-id="${d.id}" data-d="${di}">Quitar día</button></div>
    ${day.meals.map((m, mi) => `<div class="meal-row" style="margin-top:6px"><input data-path="days.${di}.meals.${mi}.name" value="${esc(m.name)}"><input data-path="days.${di}.meals.${mi}.time" value="${esc(m.time)}"><input data-path="days.${di}.meals.${mi}.food" value="${esc(m.food)}"><button class="sm del" data-act="meal-del" data-id="${d.id}" data-d="${di}" data-i="${mi}">✕</button></div>`).join('')}
    <button class="sm" data-act="meal-add" data-id="${d.id}" data-d="${di}">+ Comida</button></div>`).join('')}
  <div class="bar"><button data-act="dday-add" data-id="${d.id}">+ Agregar día de menú</button><button data-act="copy-diet" data-id="${d.id}">Copiar para WhatsApp</button><button onclick="print()">Imprimir</button></div></div>`;
};

const payTag = (p) => (p.status === 'pagado' ? `<span class="tag ok">Pagado ${fdate(p.paidOn)}</span>` : p.due < today() ? '<span class="tag bad">Vencido</span>' : '<span class="tag warn">Pendiente</span>');

V.pagos = () => {
  const t = today(), month = t.slice(0, 7);
  const paid = S.payments.filter((p) => p.status === 'pagado' && p.paidOn.startsWith(month)).reduce((a, p) => a + p.amount, 0);
  const pend = S.payments.filter((p) => p.status !== 'pagado');
  const ps = [...S.payments].sort((a, b) => (a.status === b.status ? b.due.localeCompare(a.due) : a.status === 'pagado' ? 1 : -1));
  return `<h1>Pagos</h1><p class="sub">Cobros, vencimientos y recordatorios</p>
  <div class="grid"><div class="card stat">${money(paid)}<small>Cobrado este mes</small></div><div class="card stat">${money(pend.reduce((a, p) => a + p.amount, 0))}<small>Por cobrar</small></div><div class="card stat" style="color:var(--bad)">${money(pend.filter((p) => p.due < t).reduce((a, p) => a + p.amount, 0))}<small>Vencido</small></div></div>
  <div class="bar"><button class="pri" data-act="pay-new">+ Registrar cobro</button><button data-act="pay-month">Generar cobros del mes</button><button data-act="plan-edit">Planes y precios</button></div>
  <div class="card"><table><tr><th>Cliente</th><th>Concepto</th><th>Monto</th><th>Vence</th><th>Estado</th><th></th></tr>${ps.map((p) => {
    const c = cl(p.clientId);
    return `<tr><td>${esc(c?.name || '?')}</td><td>${esc(p.concept)}</td><td>${money(p.amount)}</td><td>${fdate(p.due)}</td><td>${payTag(p)}</td><td style="white-space:nowrap">${p.status !== 'pagado' ? `<button class="sm pri" data-act="pay-done" data-id="${p.id}">Marcar pagado</button> ${c?.phone ? `<button class="sm" data-act="pay-remind" data-id="${p.id}">Recordar</button>` : ''}` : ''} <button class="sm del" data-act="pay-del" data-id="${p.id}">✕</button></td></tr>`;
  }).join('') || '<tr><td colspan=6 class="mute">Sin pagos registrados.</td></tr>'}</table></div>`;
};

V.entrenar = () => {
  const p = ui.plan;
  return `<h1>✨ Entrenar en grupo</h1><p class="sub">La IA revisa el perfil, nivel y lesiones de cada cliente y arma un circuito donde todos participan al mismo tiempo, con ejercicios y tiempos personalizados.</p>
  <div class="card"><div class="row sp"><h3>1. ¿Quiénes entrenan?</h3><span>${S.groups.map((g) => `<button class="sm" data-act="plan-group" data-id="${g.id}">${esc(g.name)}</button>`).join(' ')}</span></div>
    <div class="checks" id="pl-clients">${S.clients.filter((c) => c.active).map((c) => `<label><input type="checkbox" value="${c.id}" ${p.clientIds.includes(c.id) ? 'checked' : ''}>${esc(c.name)} <span class="mute">· ${c.level}${c.injuries.length ? ' · ⚠ ' + esc(c.injuries.join('/')) : ''}</span></label>`).join('')}</div></div>
  <div class="card"><h3>2. Sesión</h3><div class="three">
    <div><label>Duración (min)</label><input type="number" id="pl-min" value="${p.minutes}" min="20" max="120"></div>
    <div><label>Enfoque</label><select id="pl-focus">${opts([['completo', 'Cuerpo completo'], ['superior', 'Tren superior'], ['inferior', 'Tren inferior'], ['cardio', 'Cardio / metabólico']], p.focus)}</select></div>
    <div><label>Usar IA (Claude)</label><select id="pl-ai">${opts([['1', 'Sí, con IA'], ['0', 'Solo reglas del sistema']], p.useAI ? '1' : '0')}</select></div></div>
    <label>Equipo disponible (peso corporal siempre)</label><div class="checks" id="pl-equip">${EQUIP.map((e) => `<label><input type="checkbox" value="${e}" ${p.equipment.includes(e) ? 'checked' : ''}>${e}</label>`).join('')}</div></div>
  <div class="bar"><button class="pri" data-act="gen" ${ui.busy ? 'disabled' : ''}>${ui.busy ? 'Generando…' : '✨ Generar sesión grupal'}</button></div>
  ${ui.result ? renderPlan(ui.result) : ''}`;
};

function renderPlan(r) {
  const maxA = Math.max(...r.perClient.map((c) => c.attentionMin));
  const rot = {}; (r.rotation || []).forEach((x) => ((rot[x.round] ||= {})[x.station] = x.clientId));
  const nm = (id) => (r.perClient.find((c) => c.clientId === id)?.name || '').split(' ')[0];
  return `<div class="card ai-out"><div class="row sp"><h2 style="margin:0">${esc(r.title)}</h2><span class="tag">${r.source === 'ia' ? '🤖 Generado con IA' : '⚙ Reglas del sistema'}</span></div>
  ${r.aiError ? `<p class="mute">La IA no respondió (${esc(r.aiError)}); se usó el sistema de reglas.</p>` : ''}
  <p class="mute">${r.totalMinutes} min · ${r.rounds} rondas · ${r.stations.length} estaciones · ${r.slotSeconds} s por estación (todos rotan juntos)</p>
  <h3>Calentamiento</h3><ul>${r.warmup.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
  <h3>Circuito personalizado</h3>
  <table><tr><th>Cliente</th><th>Trabajo / descanso</th>${r.stations.map((s) => `<th>Est. ${s.n}<br><span style="text-transform:none">${esc(s.name)}</span></th>`).join('')}</tr>
  ${r.perClient.map((c) => `<tr><td><b>${esc(c.name)}</b><br><span class="tag">${c.level}</span>${(c.injuries || []).map((i) => `<span class="tag bad">⚠ ${esc(i)}</span>`).join('')}</td><td>${c.workSec}s / ${c.restSec}s</td>${r.stations.map((s) => { const e = c.exercises.find((x) => x.station === s.n) || {}; return `<td>${esc(e.exercise)}<br><span class="mute">${esc(e.variant)}</span></td>`; }).join('')}</tr>`).join('')}</table>
  <h3>⏱ Tiempo de atención del coach</h3>
  ${r.perClient.map((c) => `<div style="margin:6px 0"><div class="row sp"><span>${esc(c.name)} <span class="mute">· ${esc(c.notes)}</span></span><b>${c.attentionMin} min</b></div><div class="meter"><i style="width:${(c.attentionMin / maxA) * 100}%"></i></div></div>`).join('')}
  ${r.rotation?.length ? `<h3>Dónde enfocarte en cada estación</h3><table><tr><th>Ronda</th>${r.stations.map((s) => `<th>Est. ${s.n}</th>`).join('')}</tr>${Array.from({ length: r.rounds }, (_, i) => `<tr><td>${i + 1}</td>${r.stations.map((s) => `<td>${esc(nm(rot[i + 1]?.[s.n]))}</td>`).join('')}</tr>`).join('')}</table>` : ''}
  <h3>Enfriamiento</h3><ul>${r.cooldown.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
  <h3>Tips</h3><ul>${r.coachTips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
  <div class="bar"><button class="pri" data-act="plan-sched">📅 Agendar como cita grupal</button><button onclick="print()">Imprimir</button></div></div>`;
}

V.ajustes = () => `<h1>Ajustes</h1><p class="sub">Configuración y respaldos</p>
  <div class="card"><h3>Cuenta</h3><p>${esc(USER.email)}</p><div class="bar"><button data-act="logout">Cerrar sesión</button></div></div>
  <div class="card"><h3>IA (Claude)</h3><p class="mute">Con tu API key de Anthropic, "Entrenar en grupo" usa IA para razonar sobre cada cliente. Sin key funciona igual con el sistema de reglas. La key se guarda solo en tu cuenta.</p>
  <p>Estado: ${S.settings?.apiKey ? '<span class="tag ok">API key configurada</span>' : '<span class="tag warn">Sin API key (usa reglas)</span>'}</p>
  <div class="row"><input id="key" type="password" placeholder="sk-ant-…" autocomplete="off"><button class="pri" data-act="key-save">Guardar</button></div></div>
  <div class="card"><h3>Respaldo de datos</h3><div class="bar"><button data-act="export">Descargar respaldo (.json)</button><label class="btn" style="margin:0;cursor:pointer">Restaurar respaldo<input type="file" id="imp" accept=".json" hidden></label><button data-act="demo">Agregar datos de ejemplo</button><button class="del" data-act="reset">Vaciar mi cuenta</button></div></div>`;

// ---------- Texto para compartir ----------
const routineText = (r) => `*${r.name}* — ${r.goal}\n\n` + r.days.map((d) => `*${d.name}*\n` + d.items.map((i) => { const e = ex(i.exId); return `• ${e?.name || '?'}: ${i.sets}x${i.reps} (desc. ${i.rest})${i.note ? ' — ' + i.note : ''}`; }).join('\n')).join('\n\n');
const dietText = (d) => `*${d.name}*\n${d.kcal} kcal · P ${d.protein}g · C ${d.carbs}g · G ${d.fat}g\n\n` + d.days.map((x) => `*${x.name}*\n` + x.meals.map((m) => `• ${m.name} (${m.time}): ${m.food}`).join('\n')).join('\n\n') + (d.notes ? `\n\n${d.notes}` : '');

// ---------- Acciones ----------
const find = (col, id) => S[col].find((x) => x.id === id);
const del = (col, id) => { S[col] = S[col].filter((x) => x.id !== id); };
const ACT = {
  close: closeModal,
  tab: (el) => { tab[el.dataset.k] = el.dataset.v; render(); },
  async 'client-new'() {
    const v = await form('Nuevo cliente', clientFields(), { level: 'principiante', active: '1', injuries: [] }); if (!v) return;
    S.clients.push({ id: uid('c'), ...v, active: v.active === '1', measures: [], files: [] }); save(); location.hash = '#/cliente/' + S.clients.at(-1).id; render();
  },
  async 'client-edit'(el) {
    const c = cl(el.dataset.id); const v = await form('Editar cliente', clientFields(), { ...c, active: c.active ? '1' : '0' }); if (!v) return;
    Object.assign(c, v, { active: v.active === '1' }); save(); render();
  },
  'client-del'(el) { if (!confirm('¿Eliminar cliente y todo su historial?')) return; const id = el.dataset.id; del('clients', id); S.groups.forEach((g) => (g.clientIds = g.clientIds.filter((i) => i !== id))); S.payments = S.payments.filter((p) => p.clientId !== id); save(); location.hash = '#/clientes'; },
  async 'measure-add'(el) {
    const v = await form('Registrar medidas', [{ k: 'date', l: 'Fecha', t: 'date', req: 1 }, { k: 'weight', l: 'Peso (kg)', t: 'number', step: '0.1' }, { k: 'fat', l: '% grasa', t: 'number', step: '0.1' }, { k: 'waist', l: 'Cintura (cm)', t: 'number', step: '0.1' }, { k: 'note', l: 'Nota' }], { date: today() }); if (!v) return;
    cl(el.dataset.id).measures.push(v); save(); render();
  },
  'measure-del'(el) { cl(el.dataset.id).measures.splice(+el.dataset.i, 1); save(); render(); },
  async 'file-open'(el) { const f = cl(el.dataset.id).files[+el.dataset.i]; const { data, error } = await sb.storage.from('client-files').createSignedUrl(f.path, 3600); if (error) return toast(error.message); window.open(data.signedUrl, '_blank'); },
  async 'file-del'(el) { const c = cl(el.dataset.id); const f = c.files[+el.dataset.i]; if (!confirm('¿Borrar ' + f.name + '?')) return; await sb.storage.from('client-files').remove([f.path]); c.files.splice(+el.dataset.i, 1); save(); render(); },

  async 'group-new'() { const v = await groupForm({ clientIds: [] }); if (v) { S.groups.push({ id: uid('g'), ...v }); save(); render(); } },
  async 'group-edit'(el) { const g = find('groups', el.dataset.id); const v = await groupForm(g); if (v) { Object.assign(g, v); save(); render(); } },
  'group-del'(el) { if (confirm('¿Eliminar grupo?')) { del('groups', el.dataset.id); save(); render(); } },
  'plan-group'(el) { const g = find('groups', el.dataset.id); ui.plan.clientIds = g.clientIds.filter((i) => cl(i)?.active); ui.result = null; location.hash = '#/entrenar'; render(); },

  async 'appt-new'() { const v = await form('Nueva cita', apptFields(), { date: today(), time: '07:00', duration: 60, type: 'individual', status: 'programada', clientIds: [], groupId: '' }); if (v) addAppt(v); },
  async 'appt-edit'(el) { const a = find('appointments', el.dataset.id); const v = await form('Editar cita', apptFields(), a); if (v) { Object.assign(a, v); save(); render(); } },
  'appt-del'(el) { if (confirm('¿Eliminar cita?')) { del('appointments', el.dataset.id); save(); render(); } },

  async 'routine-new'() { const v = await form('Nueva rutina', [{ k: 'name', l: 'Nombre', req: 1 }, { k: 'goal', l: 'Objetivo' }]); if (!v) return; const r = { id: uid('r'), ...v, days: [{ name: 'Día 1', items: [] }] }; S.routines.push(r); save(); location.hash = '#/rutina/' + r.id; },
  'routine-del'(el) { if (confirm('¿Eliminar rutina?')) { del('routines', el.dataset.id); S.clients.forEach((c) => c.routineId === el.dataset.id && (c.routineId = '')); save(); render(); } },
  'rday-add'(el) { const r = find('routines', el.dataset.id); r.days.push({ name: 'Día ' + (r.days.length + 1), items: [] }); save(); render(); },
  'rday-del'(el) { find('routines', el.dataset.id).days.splice(+el.dataset.d, 1); save(); render(); },
  'ritem-add'(el) { find('routines', el.dataset.id).days[+el.dataset.d].items.push({ exId: '', sets: 3, reps: '10', rest: '60 s', note: '' }); save(); render(); },
  'ritem-del'(el) { find('routines', el.dataset.id).days[+el.dataset.d].items.splice(+el.dataset.i, 1); save(); render(); },
  'copy-routine'(el) { copy(routineText(find('routines', el.dataset.id))); },
  'ex-view'(el) {
    const e = ex(el.dataset.id); if (!e) return toast('Elige primero un ejercicio');
    const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent('cómo hacer ' + e.name + ' técnica correcta');
    dialog(`<h2 style="margin-top:0">${esc(e.name)}</h2><p><span class="tag">${e.pattern}</span><span class="tag">${e.level}</span> <span class="mute">${esc(e.muscle)}</span></p>
      <h3>Cómo se hace</h3><p>${esc(e.desc)}</p><h3>Puntos clave</h3><p>${esc(e.cues).split(' · ').map((x) => `<span class="tag">${x}</span>`).join('')}</p>
      <div class="two"><div class="card"><b>Más fácil</b><br>${esc(e.regress)}</div><div class="card"><b>Más difícil</b><br>${esc(e.progress)}</div></div>
      ${e.avoid.length ? `<p>Precaución si hay: ${e.avoid.map((a) => `<span class="tag bad">${esc(a)}</span>`).join('')}</p>` : ''}
      <a class="btn" target="_blank" href="${esc(e.video || yt)}">▶ ${e.video ? 'Ver video' : 'Buscar video de ejemplo'}</a>`);
  },
  async 'ex-new'() { const v = await form('Nuevo ejercicio', exFields(), { pattern: 'sentadilla', level: 'intermedio', equip: ['peso corporal'], avoid: [] }); if (v) { S.exercises.push({ id: uid('x'), ...v }); save(); render(); } },
  async 'ex-edit'(el) { const e = ex(el.dataset.id); const v = await form('Editar ejercicio', exFields(), e); if (v) { Object.assign(e, v); save(); render(); } },

  async 'diet-new'() { const v = await form('Nueva dieta', [{ k: 'name', l: 'Nombre', req: 1 }, { k: 'kcal', l: 'Kcal', t: 'number' }, { k: 'protein', l: 'Proteína g', t: 'number' }, { k: 'carbs', l: 'Carbs g', t: 'number' }, { k: 'fat', l: 'Grasa g', t: 'number' }], { kcal: 2000, protein: 140, carbs: 220, fat: 60 }); if (!v) return; const d = { id: uid('di'), ...v, notes: '', days: [{ name: 'Menú base', meals: [{ name: 'Desayuno', time: '8:00', food: '' }] }] }; S.diets.push(d); save(); location.hash = '#/dieta/' + d.id; },
  'diet-del'(el) { if (confirm('¿Eliminar dieta?')) { del('diets', el.dataset.id); S.clients.forEach((c) => c.dietId === el.dataset.id && (c.dietId = '')); save(); render(); } },
  'dday-add'(el) { const d = find('diets', el.dataset.id); d.days.push({ name: 'Día ' + (d.days.length + 1), meals: [{ name: 'Desayuno', time: '8:00', food: '' }] }); save(); render(); },
  'dday-del'(el) { find('diets', el.dataset.id).days.splice(+el.dataset.d, 1); save(); render(); },
  'meal-add'(el) { find('diets', el.dataset.id).days[+el.dataset.d].meals.push({ name: 'Comida', time: '', food: '' }); save(); render(); },
  'meal-del'(el) { find('diets', el.dataset.id).days[+el.dataset.d].meals.splice(+el.dataset.i, 1); save(); render(); },
  'copy-diet'(el) { copy(dietText(find('diets', el.dataset.id))); },

  async 'pay-new'() {
    const v = await form('Registrar cobro', payFields(), { clientId: S.clients[0]?.id, due: today(), status: 'pendiente', amount: planPrice(S.clients[0]), concept: S.plans.find((p) => p.id === S.clients[0]?.planId)?.name || '' }); if (!v) return;
    S.payments.push({ id: uid('p'), ...v, paidOn: v.status === 'pagado' ? today() : '' }); save(); render();
  },
  async 'pay-done'(el) { const p = find('payments', el.dataset.id); const v = await form('Marcar como pagado', [{ k: 'paidOn', l: 'Fecha de pago', t: 'date' }, { k: 'method', l: 'Método', t: 'select', o: [['Efectivo', 'Efectivo'], ['Transferencia', 'Transferencia'], ['Tarjeta', 'Tarjeta'], ['Otro', 'Otro']] }], { paidOn: today(), method: 'Transferencia' }); if (!v) return; Object.assign(p, v, { status: 'pagado' }); save(); render(); },
  'pay-del'(el) { if (confirm('¿Eliminar registro de pago?')) { del('payments', el.dataset.id); save(); render(); } },
  'pay-remind'(el) {
    const p = find('payments', el.dataset.id), c = cl(p.clientId);
    const msg = `Hola ${c.name.split(' ')[0]}, te recuerdo tu pago de ${p.concept} por ${money(p.amount)} con fecha ${fdate(p.due)}. ¡Gracias! 💪`;
    window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  },
  'pay-month'() {
    const m = today().slice(0, 7); let n = 0;
    S.clients.filter((c) => c.active && c.planId).forEach((c) => {
      if (S.payments.some((p) => p.clientId === c.id && p.due.startsWith(m))) return;
      const pl = S.plans.find((p) => p.id === c.planId); S.payments.push({ id: uid('p'), clientId: c.id, concept: pl.name, amount: pl.price, due: today(), paidOn: '', status: 'pendiente', method: '' }); n++;
    });
    save(); render(); toast(n ? `${n} cobros generados` : 'Ya estaban generados');
  },
  async 'plan-edit'() {
    const v = await form('Planes y precios', [{ k: 'text', l: 'Un plan por línea: nombre | precio | sesiones', t: 'textarea' }], { text: S.plans.map((p) => `${p.name} | ${p.price} | ${p.sessions}`).join('\n') }); if (!v) return;
    const old = S.plans;
    S.plans = v.text.split('\n').map((l) => l.split('|').map((s) => s.trim())).filter((a) => a[0]).map((a) => { const o = old.find((p) => p.name === a[0]); return { id: o?.id || uid('pl'), name: a[0], price: Number(a[1]) || 0, sessions: Number(a[2]) || 0 }; });
    S.clients.forEach((c) => !S.plans.some((p) => p.id === c.planId) && (c.planId = '')); save(); render();
  },

  async gen() {
    readPlanForm(); const p = ui.plan;
    if (!p.clientIds.length) return toast('Selecciona al menos un cliente');
    ui.busy = true; render();
    try {
      let res = null;
      if (p.useAI) {
        const skeleton = rulesPlan(S, p);
        const clients = S.clients.filter((c) => p.clientIds.includes(c.id)).map((c) => ({ id: c.id, nombre: c.name, nivel: c.level, lesiones: c.injuries, objetivo: c.goal, notas: c.notes, ultimoPeso: (c.measures.at(-1) || {}).weight }));
        const lib = S.exercises.map((e) => ({ id: e.id, nombre: e.name, patron: e.pattern, nivel: e.level, equipo: e.equip, evitar: e.avoid, facil: e.regress, dificil: e.progress }));
        const { data, error } = await sb.functions.invoke('group-plan', { body: { clients, lib, params: p, skeleton, apiKey: S.settings?.apiKey || '' } });
        let detail = data?.error;
        if (error?.context?.json) detail = (await error.context.json().catch(() => null))?.error;
        if (!error && data && !data.error) res = data;
        else { res = skeleton; res.aiError = detail || error?.message || 'sin respuesta'; }
      } else res = rulesPlan(S, p);
      ui.result = res;
    } catch (e) { toast('Error: ' + e.message); }
    ui.busy = false; render();
  },
  async 'plan-sched'() {
    const v = await form('Agendar sesión grupal', [{ k: 'date', l: 'Fecha', t: 'date', req: 1 }, { k: 'time', l: 'Hora', t: 'time', req: 1 }], { date: today(), time: '07:00' }); if (!v) return;
    addAppt({ ...v, duration: ui.result.totalMinutes, type: 'grupal', groupId: '', clientIds: ui.plan.clientIds, status: 'programada', notes: ui.result.title });
  },
  'key-save'() { (S.settings ||= {}).apiKey = $('#key').value.trim(); save(); toast(S.settings.apiKey ? 'API key guardada' : 'API key eliminada'); render(); },
  async logout() { await flush(); await sb.auth.signOut(); location.reload(); },
  demo() { if (S.clients.length && !confirm('Se agregarán los datos de ejemplo a los tuyos.')) return; const d = demo(); for (const k of Object.keys(d)) S[k] = [...S[k], ...d[k]]; save(); render(); toast('Datos de ejemplo agregados'); },
  export() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = `coachdesk-respaldo-${today()}.json`; a.click(); },
  reset() { if (!confirm('Esto BORRA todos tus clientes, rutinas, pagos y citas. ¿Seguro?')) return; S = blank(); save(); render(); toast('Cuenta vaciada'); },
};

const groupForm = (g) => form(g.id ? 'Editar grupo' : 'Nuevo grupo', [{ k: 'name', l: 'Nombre', req: 1 }, { k: 'notes', l: 'Horario / notas' }, { k: 'clientIds', l: 'Integrantes', t: 'checks', o: S.clients.map((c) => [c.id, c.name]) }], g);
const exFields = () => [{ k: 'name', l: 'Nombre', req: 1 }, { k: 'pattern', l: 'Patrón', t: 'select', o: PATTERNS.map((p) => [p, p]) }, { k: 'level', l: 'Nivel', t: 'select', o: LEVELS }, { k: 'muscle', l: 'Músculos' }, { k: 'equip', l: 'Equipo', t: 'checks', o: [['peso corporal', 'peso corporal'], ...EQUIP.map((e) => [e, e])] }, { k: 'avoid', l: 'Precaución con (lesiones)', t: 'tags', ph: 'rodilla, hombro…' }, { k: 'desc', l: 'Cómo se hace', t: 'textarea' }, { k: 'cues', l: 'Puntos clave (separa con " · ")' }, { k: 'regress', l: 'Versión más fácil' }, { k: 'progress', l: 'Versión más difícil' }, { k: 'video', l: 'Link de video (opcional)' }];
const planPrice = (c) => S.plans.find((p) => p.id === c?.planId)?.price || 0;
const payFields = () => [{ k: 'clientId', l: 'Cliente', t: 'select', o: S.clients.map((c) => [c.id, c.name]) }, { k: 'concept', l: 'Concepto' }, { k: 'amount', l: 'Monto (MXN)', t: 'number' }, { k: 'due', l: 'Fecha de vencimiento', t: 'date' }, { k: 'status', l: 'Estado', t: 'select', o: [['pendiente', 'Pendiente'], ['pagado', 'Ya pagado']] }, { k: 'method', l: 'Método (si ya pagó)' }];
function addAppt(v) {
  const clash = S.appointments.find((a) => a.date === v.date && a.time === v.time && a.status === 'programada');
  if (clash && !confirm(`Ya hay una cita a las ${v.time} (${apptWho(clash)}). ¿Agendar de todos modos?`)) return;
  S.appointments.push({ id: uid('a'), ...v }); save(); toast('Cita agendada'); if (location.hash !== '#/agenda') location.hash = '#/agenda'; else render();
}
function readPlanForm() {
  const p = ui.plan;
  p.clientIds = [...document.querySelectorAll('#pl-clients input:checked')].map((i) => i.value);
  p.equipment = [...document.querySelectorAll('#pl-equip input:checked')].map((i) => i.value);
  p.minutes = Math.max(20, Math.min(120, +$('#pl-min').value || 45)); p.focus = $('#pl-focus').value; p.useAI = $('#pl-ai').value === '1';
}

// ---------- Eventos globales ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && ACT[el.dataset.act]) { if (el.tagName === 'A' && el.dataset.act !== 'plan-group') e.preventDefault(); ACT[el.dataset.act](el); }
  if (e.target.id === 'modal') closeModal();
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.path) {
    const [col, id] = t.closest('[data-root]').dataset.root.split(':');
    setPath(find(col, id), t.dataset.path, t.type === 'number' ? Number(t.value) : t.value); save();
    if (t.tagName === 'SELECT' || /\.(sets|reps)$/.test(t.dataset.path) === false && ['kcal', 'protein', 'carbs', 'fat'].includes(t.dataset.path)) render();
  } else if (['pl-min', 'pl-focus', 'pl-ai'].includes(t.id) || t.closest('#pl-clients, #pl-equip')) readPlanForm();
  else if (t.id === 'pat') { ui.pat = t.value; render(); }
  else if (t.dataset.notes) { cl(t.dataset.notes).notes = t.value; save(); toast('Nota guardada'); }
  else if (t.id === 'up') {
    const c = cl(t.dataset.client);
    for (const f of t.files) {
      if (f.size > 25e6) { toast(f.name + ' pasa de 25 MB'); continue; }
      const path = `${USER.id}/${c.id}/${Date.now()}_${f.name.replace(/[^\w.\-]/g, '_')}`;
      const { error } = await sb.storage.from('client-files').upload(path, f);
      if (error) { toast(error.message); continue; }
      c.files.push({ name: f.name, path, date: today() });
    }
    save(); render(); toast('Archivo(s) subido(s)');
  } else if (t.id === 'imp') {
    try { const d = JSON.parse(await t.files[0].text()); if (!d.clients || !d.exercises) throw 0; if (!confirm('Se reemplazarán tus datos actuales.')) return; S = d; save(); render(); toast('Respaldo restaurado'); } catch { toast('Archivo de respaldo inválido'); }
  }
});
document.addEventListener('input', (e) => { if (e.target.id === 'q') { ui.q = e.target.value; const p = e.target.selectionStart; render(); const q = $('#q'); q.focus(); q.setSelectionRange(p, p); } });

// ---------- Router ----------
function render() {
  const [seg, id] = (location.hash.slice(2) || '').split('/');
  const name = seg || 'home';
  if (!S) return;
  $('#main').innerHTML = (V[name] || (() => '<p>No encontrado</p>'))(id);
  const base = { cliente: 'clientes', rutina: 'rutinas', dieta: 'dietas' }[name] || name;
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#/' + (base === 'home' ? '' : base)));
}
window.addEventListener('hashchange', () => { closeModal(); render(); });
const blank = () => ({ exercises: structuredClone(SEED_EX), clients: [], groups: [], appointments: [], routines: [], diets: [], payments: [], plans: [], settings: {} });

async function start() {
  const { data, error } = await sb.from('coach_data').select('data').eq('user_id', USER.id).maybeSingle();
  if (error) { $('#main').innerHTML = `<p>Error al cargar tus datos: ${esc(error.message)}</p>`; return; }
  S = data?.data && Object.keys(data.data).length ? data.data : blank();
  for (const k of ['clients', 'groups', 'appointments', 'routines', 'diets', 'payments', 'plans', 'exercises']) S[k] ||= [];
  S.settings ||= {};
  if (!data) await flush();
  document.body.classList.add('in'); $('#login').hidden = true;
  render();
}

// ---------- Login ----------
let mode = 'in';
const msg = (t, bad) => { const m = $('#lmsg'); m.textContent = t; m.style.color = bad ? 'var(--bad)' : 'var(--ok)'; };
$('#lswitch').onclick = (e) => {
  e.preventDefault(); mode = mode === 'in' ? 'up' : 'in';
  $('#ltitle').textContent = mode === 'in' ? 'Entrar' : 'Crear cuenta de entrenador';
  $('#lsubmit').textContent = mode === 'in' ? 'Entrar' : 'Crear cuenta';
  $('#lswitch').textContent = mode === 'in' ? 'Crear cuenta' : 'Ya tengo cuenta'; msg('');
};
$('#lreset').onclick = async (e) => {
  e.preventDefault(); const email = $('#lemail').value.trim();
  if (!email) return msg('Escribe tu correo arriba primero', 1);
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  msg(error ? error.message : 'Te enviamos un correo para cambiar la contraseña', !!error);
};
$('#lform').onsubmit = async (e) => {
  e.preventDefault(); const email = $('#lemail').value.trim(), password = $('#lpass').value; msg('Un momento…');
  if (mode === 'up') {
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) return msg(error.message, 1);
    if (!data.session) return msg('Cuenta creada. Revisa tu correo y confirma para poder entrar.');
    USER = data.user; start();
  } else {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return msg(error.message.includes('Invalid login') ? 'Correo o contraseña incorrectos' : error.message, 1);
    USER = data.user; start();
  }
};
(async () => { const { data } = await sb.auth.getSession(); if (data.session) { USER = data.session.user; start(); } })();
