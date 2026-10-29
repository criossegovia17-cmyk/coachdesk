import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { demo } from './seed.js?v=16';
import { exercises as LIB, mergeLibrary, LIB_VERSION } from './library.js?v=16';
import { plan as rulesPlan } from './planner.js?v=16';
import { generateProgram } from './program.js?v=16';
import { latestWeight, RESTRICTIONS, ACTIVITY, mergeFoods, setFoods, FOODS, itemsText, mealTotals } from './nutrition.js?v=16';
import { logoMark, logoFull } from './brand.js?v=16';
import * as calendarMod from './calendar.js?v=16';
import * as builderMod from './builder.js?v=16';
import * as dietMod from './diet.js?v=16';
import * as sheetsMod from './sheets.js?v=16';
import * as activityMod from './activity.js?v=16';
import * as liveMod from './live.js?v=16';
import * as toolsMod from './tools.js?v=16';
import * as catalogMod from './catalog.js?v=16';
import { CLAB } from './config.js?v=16';

const SB_URL = 'https://qqgdbdbdfecppehwyezm.supabase.co';
const SB_KEY = 'sb_publishable_ljrk5vR6YAvpHs68RehEYw_mLclqIcu';
const sb = createClient(SB_URL, SB_KEY);
let USER = null, SUB = null;

// ---------- Utilidades ----------
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p) => p + Math.random().toString(36).slice(2, 8);
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const money = (n) => new Intl.NumberFormat(S?.settings?.currency === 'USD' ? 'en-US' : 'es-MX', { style: 'currency', currency: S?.settings?.currency || 'MXN', maximumFractionDigits: 0 }).format(n || 0);
const fdate = (s) => (s ? new Date(s + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) : '—');
const daysAgo = (s) => Math.floor((Date.now() - new Date(s + 'T12:00').getTime()) / 864e5);
const initials = (n) => n.split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
const hue = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

const LEVELS = [['principiante', 'Principiante'], ['intermedio', 'Intermedio'], ['avanzado', 'Avanzado']];
const TRACKS = [['general', 'General / salud'], ['beisbol', 'Béisbol'], ['fisicoculturismo', 'Fisicoculturismo / hipertrofia']];
const TRACK_NAME = { general: 'General', beisbol: 'Béisbol', fisicoculturismo: 'Fisicoculturismo' };
const PATTERNS = ['sentadilla', 'bisagra', 'empuje', 'tirón', 'core', 'rotacional', 'pliometría', 'isométrico', 'cuidado del brazo', 'cardio', 'aislamiento', 'movilidad'];
const GROUPS = ['pecho', 'espalda', 'hombro', 'bíceps', 'tríceps', 'cuádriceps', 'isquios', 'glúteo', 'pantorrilla', 'abdomen', 'lumbar', 'trapecio', 'antebrazo', 'cuerpo completo'];
const TYPES = ['fuerza', 'potencia', 'isométrico', 'core', 'cardio', 'cuidado del brazo', 'movilidad'];
const EQUIP = ['mancuernas', 'barra', 'kettlebell', 'banda', 'banco', 'polea', 'máquina', 'balón medicinal', 'caja', 'barra de dominadas', 'cuerda', 'rueda', 'trineo', 'cuerda pesada'];
const INJURIES = ['rodilla', 'hombro', 'espalda', 'muñeca', 'codo', 'impacto'];
const PARQ = ['¿Algún médico te dijo que tienes un problema del corazón o presión alta?', '¿Sientes dolor en el pecho al hacer actividad física?', '¿Has sentido dolor en el pecho en reposo en el último mes?', '¿Pierdes el equilibrio por mareo o has perdido el conocimiento?', '¿Tienes un problema de huesos o articulaciones que empeora con el ejercicio?', '¿Tomas medicamentos para la presión o el corazón?', '¿Sabes de otra razón por la que no deberías hacer ejercicio?'];

let S, tab = {}, tmr, ui = {
  plan: { clientIds: [], minutes: 45, focus: 'completo', equipment: ['mancuernas', 'banda', 'banco'], useAI: true }, result: null, busy: false,
  lib: { q: '', pattern: '', grp: '', type: '', level: '', tag: '' }, draft: null, nut: null,
};
const cl = (id) => S.clients.find((c) => c.id === id);
const ex = (id) => S.exercises.find((e) => e.id === id);
const find = (col, id) => S[col].find((x) => x.id === id);
const del = (col, id) => { S[col] = S[col].filter((x) => x.id !== id); };

const proActive = () => SUB && SUB.plan === 'pro' && SUB.status === 'active';
const trialLeft = () => (SUB ? Math.ceil((new Date(SUB.trial_ends_at) - Date.now()) / 864e5) : 99);
const locked = () => CLAB.enforce && SUB && !proActive() && trialLeft() <= 0;
let SERVER_TS = null, CONFLICT = false;
const flush = async (force) => {
  tmr = null; if (CONFLICT && !force) return;
  if (locked()) { if (!window.__lockedShown) { window.__lockedShown = true; toast('Tu prueba terminó: la cuenta está en solo lectura'); } return; }
  if (!force && SERVER_TS) {
    const { data: cur } = await sb.from('coach_data').select('updated_at').eq('user_id', USER.id).maybeSingle();
    if (cur && cur.updated_at !== SERVER_TS) { CONFLICT = true; showConflict(); return; }
  }
  const { data, error } = await sb.from('coach_data').upsert({ user_id: USER.id, data: S, updated_at: new Date().toISOString() }).select('updated_at').single();
  if (error) return toast('Error al guardar: ' + error.message);
  SERVER_TS = data.updated_at; CONFLICT = false;
};
function showConflict() {
  const m = $('#modal'); m.hidden = false;
  m.innerHTML = `<div class="dlg"><h2>Cambios en otro dispositivo</h2><p>Se guardaron cambios desde otra pestaña o dispositivo. Para no perder información, <b>recarga</b> y vuelve a hacer tu último cambio.</p><div class="bar end"><button data-act="force-save">Sobrescribir con lo que tengo aquí</button><button class="pri" data-act="reload">Recargar ahora</button></div></div>`;
}
const save = () => { clearTimeout(tmr); tmr = setTimeout(() => flush(), 400); };
window.addEventListener('beforeunload', () => { if (tmr) flush(); });
const toast = (m) => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 2600); };
const closeModal = () => { $('#modal').hidden = true; $('#modal').innerHTML = ''; };
const copy = async (txt) => { try { await navigator.clipboard.writeText(txt); toast('Copiado ✓'); } catch { prompt('Copia el texto:', txt); } };
const opts = (list, sel) => list.map(([a, b]) => `<option value="${esc(a)}" ${String(a) === String(sel) ? 'selected' : ''}>${esc(b)}</option>`).join('');
const plain = (arr) => arr.map((x) => [x, x]);
function setPath(o, path, v) { const k = path.split('.'); const last = k.pop(); for (const p of k) o = o[p]; o[last] = v; }

// ---------- Iconos ----------
const IC = {
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  cal: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M16 2v4 M8 2v4 M3 10h18',
  clip: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6v4H9z M9 12h6 M9 16h6',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  team: 'M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M4 21v-1a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1 M3 9a2 2 0 1 0 0 4 M21 9a2 2 0 1 1 0 4',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  dollar: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  cog: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
  plus: 'M12 5v14 M5 12h14', search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35', check: 'M20 6L9 17l-5-5',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
  out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  print: 'M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z',
  copy: 'M9 9h13v13H9z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  trash: 'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6', edit: 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', back: 'M15 18l-6-6 6-6',
  chat: 'M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2-5.4A8.5 8.5 0 1 1 21 11.5z', menu: 'M3 6h18 M3 12h18 M3 18h18',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  auto: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 2v20 M12 2a10 10 0 0 1 0 20',
  calc: 'M5 2h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M8 6h8 M8 11h.01 M12 11h.01 M16 11h.01 M8 15h.01 M12 15h.01 M16 15h.01 M8 19h.01 M12 19h.01 M16 19h.01',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
};
const ic = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[n]}"/></svg>`;
const btn = (label, act, attrs = '', icon = '', cls = '') => `<button class="${cls}" data-act="${act}" ${attrs}>${icon ? ic(icon, 16) : ''}${label}</button>`;
const page = (title, sub, actions, body) => `<header class="ph"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div><div class="pa">${actions || ''}</div></header>${body}`;
const avatar = (n, big) => `<span class="av ${big ? 'big' : ''}" style="--h:${hue(n)}">${esc(initials(n))}</span>`;
const trackTag = (t) => `<span class="tag t-${t || 'general'}">${TRACK_NAME[t || 'general']}</span>`;

// ---------- Formularios ----------
function form(title, fields, v = {}) {
  return new Promise((res) => {
    const m = $('#modal'); m.hidden = false;
    const f = fields.map((x) => {
      if (x.h) return `<h3 class="fh">${x.h}</h3>`;
      const val = v[x.k]; let inp;
      if (x.t === 'select') inp = `<select name="${x.k}">${opts(x.o, val)}</select>`;
      else if (x.t === 'checks') inp = `<div class="checks">${x.o.map(([a, b]) => `<label><input type="checkbox" name="${x.k}" value="${esc(a)}" ${(val || []).includes(a) ? 'checked' : ''}>${esc(b)}</label>`).join('') || '<span class="mute">Sin opciones</span>'}</div>`;
      else if (x.t === 'textarea') inp = `<textarea name="${x.k}">${esc(val)}</textarea>`;
      else if (x.t === 'tags') inp = `<input name="${x.k}" value="${esc((val || []).join(', '))}" placeholder="${esc(x.ph || 'separados por coma')}">`;
      else inp = `<input name="${x.k}" type="${x.t || 'text'}" value="${esc(val)}" ${x.step ? `step="${x.step}"` : ''} ${x.req ? 'required' : ''} placeholder="${esc(x.ph || '')}">`;
      return `<label class="fl">${x.l}</label>${inp}`;
    }).join('');
    m.innerHTML = `<form class="dlg"><h2>${title}</h2>${f}<div class="bar end"><button type="button" data-x="cancel">Cancelar</button><button class="pri">Guardar</button></div></form>`;
    const fm = m.firstChild;
    fm.onsubmit = (ev) => {
      ev.preventDefault(); const out = {};
      for (const x of fields) {
        if (x.h) continue;
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
function dialog(html, wide) {
  const m = $('#modal'); m.hidden = false;
  m.innerHTML = `<div class="dlg ${wide ? 'wide' : ''}">${html}<div class="bar end"><button data-act="close">Cerrar</button></div></div>`;
}

// ---------- Vistas ----------
const V = {};
const apptIds = (a) => (a.groupId ? S.groups.find((g) => g.id === a.groupId)?.clientIds || [] : a.clientIds || []);
const apptWho = (a) => (a.groupId ? S.groups.find((g) => g.id === a.groupId)?.name || 'Grupo' : (a.clientIds || []).map((i) => cl(i)?.name).filter(Boolean).join(', ') || '—');
const apptSort = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);
const payTag = (p) => (p.status === 'pagado' ? `<span class="tag ok">Pagado ${fdate(p.paidOn)}</span>` : p.due < today() ? '<span class="tag bad">Vencido</span>' : '<span class="tag warn">Pendiente</span>');
const lastCheckin = (c) => [...(c.checkins || [])].sort((a, b) => b.date.localeCompare(a.date))[0];

V.home = () => {
  const t = today(), month = t.slice(0, 7);
  const active = S.clients.filter((c) => c.active);
  const income = S.payments.filter((p) => p.status === 'pagado' && (p.paidOn || '').startsWith(month)).reduce((a, p) => a + p.amount, 0);
  const pend = S.payments.filter((p) => p.status !== 'pagado'), late = pend.filter((p) => p.due < t);
  const todays = S.appointments.filter((a) => a.date === t).sort(apptSort);
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const inc = months.map((m) => S.payments.filter((p) => p.status === 'pagado' && (p.paidOn || '').startsWith(m)).reduce((a, p) => a + p.amount, 0));
  const mx = Math.max(...inc, 1000), step = Math.pow(10, Math.floor(Math.log10(mx))), top = Math.ceil(mx / step) * step;
  const short = (n) => (n >= 1000 ? '$' + (Math.round(n / 100) / 10) + 'k' : '$' + n);
  // semana actual
  const d0 = new Date(); const mon = new Date(d0); mon.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
  const wk = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; return { s, n: d.getDate(), w: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i], c: S.appointments.filter((a) => a.date === s && a.status !== 'cancelada').length }; });
  const alerts = [];
  late.forEach((p) => alerts.push(['bad', `${esc(cl(p.clientId)?.name || '?')} debe ${money(p.amount)} (vencía ${fdate(p.due)})`, '#/pagos']));
  active.forEach((c) => {
    const lc = lastCheckin(c);
    if (c.parq?.a?.length && !c.parq.cleared) alerts.push(['bad', `${esc(c.name)}: screening con respuestas "Sí" sin autorización médica registrada`, '#/cliente/' + c.id]);
    if (!c.routineId) alerts.push(['info', `${esc(c.name)} no tiene programa asignado`, '#/cliente/' + c.id]);
    if (!lc || daysAgo(lc.date) > 14) alerts.push(['warn', `${esc(c.name)} no tiene check-in en ${lc ? daysAgo(lc.date) + ' días' : 'el sistema'}`, '#/cliente/' + c.id]);
  });
  active.forEach((c) => { if (typeof c.credits === 'number' && c.credits <= 1) alerts.push(['warn', `${esc(c.name)} tiene ${c.credits} sesión(es) restante(s): ofrece renovar el paquete`, '#/cliente/' + c.id]); });
  mods.activity.logs.filter((l) => !l.handled).forEach((l) => {
    if (l.kind === 'checkin' && l.data.pain) alerts.unshift(['bad', `${esc(cl(l.client_id)?.name || 'Cliente')} reportó molestia: ${esc(l.data.pain)}`, '#/cliente/' + l.client_id]);
    if (l.kind === 'message' && l.data.from === 'client') alerts.unshift(['info', `${esc(cl(l.client_id)?.name || 'Cliente')} te escribió: “${esc(String(l.data.text).slice(0, 70))}”`, '#/cliente/' + l.client_id]);
    if (l.kind === 'intake') alerts.unshift(['info', `${esc(cl(l.client_id)?.name || 'Cliente')} llenó su ficha inicial: revísala y aplícala`, '#/cliente/' + l.client_id]);
  });
  const brand = S.settings?.brand;
  const hr = new Date().getHours();
  return page(`${hr < 12 ? 'Buenos días' : hr < 19 ? 'Buenas tardes' : 'Buenas noches'}${brand ? ', ' + esc(brand) : ''}`, new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }), `${btn('Nueva cita', 'cal-new', `data-d="${t}"`, 'cal')}${btn('Nuevo cliente', 'client-new', '', 'plus', 'pri')}`,
    `${trialBanner()}${onboarding()}<div class="kpis five">
      <div class="kpi"><span class="k-ic">${ic('users')}</span><small>Clientes activos</small><b>${active.length}</b></div>
      <div class="kpi"><span class="k-ic g">${ic('dollar')}</span><small>Cobrado este mes</small><b>${money(income)}</b></div>
      <div class="kpi"><span class="k-ic w">${ic('clip')}</span><small>Por cobrar</small><b>${money(pend.reduce((a, p) => a + p.amount, 0))}</b><em>${pend.length} pago(s)</em></div>
      <div class="kpi ${late.length ? 'alert' : ''}"><span class="k-ic r">${ic('alert')}</span><small>Pagos vencidos</small><b>${late.length}</b>${late.length ? `<em class="bad">${money(late.reduce((a, p) => a + p.amount, 0))}</em>` : ''}</div>
      <div class="kpi"><span class="k-ic b">${ic('cal')}</span><small>Citas de hoy</small><b>${todays.filter((a) => a.status !== 'cancelada').length}</b></div></div>
    <div class="cols wide2"><section class="card"><div class="row sp"><h3>Hoy</h3><a href="#/agenda" class="mute">Ver agenda →</a></div>
        <div class="wkstrip">${wk.map((d) => `<a href="#/agenda" class="wd ${d.s === t ? 'now' : ''}" data-act="cal-goto" data-d="${d.s}"><small>${d.w}</small><b>${d.n}</b><i>${d.c ? d.c : ''}</i></a>`).join('')}</div>
        ${todays.length ? todays.map((a) => `<div class="tl t-${a.type}"><b>${a.time}</b><div><span>${esc(apptWho(a))}</span><small>${a.duration || 60} min · ${a.type}${a.notes ? ' · ' + esc(a.notes) : ''}</small></div><span class="tag ${a.status === 'realizada' ? 'ok' : a.status === 'programada' ? '' : 'bad'}">${a.status}</span></div>`).join('') : '<p class="mute empty">No hay citas para hoy.</p>'}</section>
      <section class="card"><h3>Ingresos · últimos 6 meses</h3><div class="chart2"><div class="grid-l">${[1, 0.75, 0.5, 0.25, 0].map((f) => `<div style="bottom:${f * 100}%"><span>${short(Math.round(top * f))}</span></div>`).join('')}</div>
        <div class="bars">${inc.map((v, i) => `<div class="cb"><i style="height:${(v / top) * 100}%" title="${money(v)}"><em>${v ? short(v) : ''}</em></i><small>${new Date(months[i] + '-15').toLocaleDateString('es-MX', { month: 'short' })}</small></div>`).join('')}</div></div></section></div>
    ${activityCard()}<div class="cols wide2"><section class="card"><h3>Atención requerida</h3>${alerts.length ? alerts.slice(0, 7).map((a) => `<a class="al ${a[0]}" href="${a[2]}">${ic(a[0] === 'info' ? 'clip' : 'alert', 16)}<span>${a[1]}</span></a>`).join('') : '<p class="mute empty">Todo en orden 🎉</p>'}</section>
      <section class="card hero"><div><h3>✨ Entrenamiento grupal con IA</h3><p>Elige a los clientes de una sesión y genera un circuito donde todos participan, adaptado a nivel y lesiones de cada uno, con el tiempo de atención que merece cada cliente.</p></div>${btn('Crear sesión grupal', 'go', 'data-to="#/entrenar"', 'zap', 'pri')}</section></div>`);
};

V.clientes = () => {
  const q = (ui.q || '').toLowerCase(), tf = ui.tf || '';
  const list = S.clients.filter((c) => (c.name.toLowerCase().includes(q) || (c.goal || '').toLowerCase().includes(q)) && (!tf || (c.track || 'general') === tf));
  return page('Clientes', `${S.clients.length} registrados`, btn('Nuevo cliente', 'client-new', '', 'plus', 'pri'),
    `<div class="bar"><div class="search">${ic('search', 16)}<input id="q" placeholder="Buscar cliente u objetivo…" value="${esc(ui.q || '')}"></div>
      <div class="seg">${[['', 'Todos'], ...TRACKS.map(([k]) => [k, TRACK_NAME[k]])].map(([k, l]) => `<button class="${tf === k ? 'on' : ''}" data-act="tf" data-v="${k}">${l}</button>`).join('')}</div></div>
    <div class="grid">${list.map((c) => {
      const lc = lastCheckin(c), w = latestWeight(c).weight;
      return `<a class="card cc" href="#/cliente/${c.id}">${avatar(c.name)}<div class="cc-b"><div class="row sp"><h3>${esc(c.name)}</h3>${c.active ? '' : '<span class="tag warn">Inactivo</span>'}</div>
        <div class="mute">${esc(c.goal || 'Sin objetivo')}</div>
        <div class="tags">${trackTag(c.track)}<span class="tag">${c.level}</span>${c.injuries.map((i) => `<span class="tag bad">⚠ ${esc(i)}</span>`).join('')}</div>
        <div class="mini">${w ? `${w} kg · ` : ''}${esc(S.plans.find((p) => p.id === c.planId)?.name || 'Sin plan')}${lc ? ` · check-in hace ${daysAgo(lc.date)} d` : ''}</div></div></a>`;
    }).join('') || '<p class="mute">Sin resultados.</p>'}</div>`);
};

const clientFields = () => [
  { h: 'Datos básicos' }, { k: 'name', l: 'Nombre', req: 1 }, { k: 'phone', l: 'WhatsApp (con lada, ej. 5215512345678)' }, { k: 'email', l: 'Correo', t: 'email' },
  { k: 'goal', l: 'Objetivo principal' }, { k: 'notes', l: 'Notas (historial, preferencias)', t: 'textarea' },
  { h: 'Perfil deportivo' }, { k: 'track', l: 'Tipo de entrenamiento', t: 'select', o: TRACKS }, { k: 'level', l: 'Nivel', t: 'select', o: LEVELS },
  { k: 'injuries', l: 'Lesiones / limitaciones (rodilla, hombro, espalda, muñeca, codo, impacto)', t: 'tags' },
  { k: 'daysPerWeek', l: 'Días de entrenamiento por semana', t: 'number' },
  { k: 'equipment', l: 'Equipo disponible (peso corporal siempre)', t: 'checks', o: plain(EQUIP) },
  { k: 'position', l: 'Solo béisbol · posición', t: 'select', o: [['lanzador', 'Lanzador'], ['jugador de campo', 'Jugador de campo'], ['receptor', 'Receptor']] },
  { k: 'season', l: 'Solo béisbol · fase de temporada', t: 'select', o: [['fuera de temporada', 'Fuera de temporada'], ['pretemporada', 'Pretemporada'], ['temporada', 'En temporada']] },
  { k: 'phase', l: 'Solo fisicoculturismo · fase', t: 'select', o: [['volumen', 'Volumen'], ['definición', 'Definición'], ['mantenimiento', 'Mantenimiento']] },
  { h: 'Datos para nutrición' }, { k: 'sex', l: 'Sexo', t: 'select', o: [['m', 'Hombre'], ['f', 'Mujer']] }, { k: 'age', l: 'Edad', t: 'number' }, { k: 'height', l: 'Estatura (cm)', t: 'number' },
  { k: 'activity', l: 'Nivel de actividad diaria', t: 'select', o: ACTIVITY }, { k: 'foodsAvoid', l: 'Evitar (alergias / preferencias)', t: 'checks', o: RESTRICTIONS },
  { h: 'Plan y asignaciones' }, { k: 'planId', l: 'Plan de pago', t: 'select', o: [['', 'Sin plan'], ...S.plans.map((p) => [p.id, `${p.name} · ${money(p.price)}`])] },
  { k: 'routineId', l: 'Programa asignado', t: 'select', o: [['', 'Ninguno'], ...S.routines.map((r) => [r.id, r.name])] },
  { k: 'dietId', l: 'Dieta asignada', t: 'select', o: [['', 'Ninguna'], ...S.diets.map((r) => [r.id, r.name])] },
  { k: 'active', l: 'Estado', t: 'select', o: [['1', 'Activo'], ['0', 'Inactivo']] },
];
const newClientDefaults = () => ({ level: 'principiante', track: 'general', active: '1', injuries: [], daysPerWeek: 3, equipment: ['mancuernas', 'banda', 'banco'], sex: 'm', activity: 1.55, foodsAvoid: [], season: 'fuera de temporada', phase: 'volumen', position: 'lanzador' });

V.cliente = (id) => {
  const c = cl(id); if (!c) return '<p>Cliente no encontrado.</p>';
  const t = tab.cliente || 'resumen';
  const nl = (mods.activity.logs || []).filter((l) => l.client_id === c.id && !l.handled).length;
  const tabs = [['resumen', 'Resumen'], ['actividad', `Actividad${nl ? ` <span class="badge">${nl}</span>` : ''}`], ['programa', 'Programa'], ['nutricion', 'Nutrición'], ['progreso', 'Progreso'], ['carpeta', 'Carpeta'], ['pagos', 'Pagos'], ['ficha', 'Ficha de salud']];
  const r = S.routines.find((x) => x.id === c.routineId), d = S.diets.find((x) => x.id === c.dietId);
  let body = '';
  if (t === 'resumen') {
    const p = S.plans.find((x) => x.id === c.planId);
    const gs = S.groups.filter((g) => g.clientIds.includes(c.id));
    const ap = S.appointments.filter((a) => a.date >= today() && apptIds(a).includes(c.id)).sort(apptSort).slice(0, 4);
    const m = new Date().toISOString().slice(0, 7);
    const used = S.appointments.filter((a) => a.status === 'realizada' && a.date.startsWith(m) && apptIds(a).includes(c.id)).length;
    const lc = lastCheckin(c), w = latestWeight(c);
    body = `<div class="cols"><section class="card"><div class="row sp"><h3>Perfil</h3>${btn('Editar', 'client-edit', `data-id="${c.id}"`, 'edit', 'sm')}</div>
      <dl class="dl"><dt>Objetivo</dt><dd>${esc(c.goal) || '—'}</dd><dt>Tipo</dt><dd>${trackTag(c.track)} ${c.track === 'beisbol' ? `<span class="mute">${esc(c.position || '')} · ${esc(c.season || '')}</span>` : c.track === 'fisicoculturismo' ? `<span class="mute">${esc(c.phase || '')}</span>` : ''}</dd>
      <dt>Nivel</dt><dd>${c.level}</dd><dt>Días/sem</dt><dd>${c.daysPerWeek || '—'}</dd><dt>Plan</dt><dd>${esc(p?.name || '—')}${p ? ` · <span class="mute">${used}/${p.sessions} sesiones este mes</span>` : ''}</dd><dt>Paquete</dt><dd>${typeof c.credits === 'number' ? `<b>${c.credits}</b> sesión(es) restante(s)` : '<span class="mute">sin paquete</span>'} ${btn('+ sesiones', 'credits-add', `data-id="${c.id}"`, '', 'sm')}</dd><dt>Peso</dt><dd>${w.weight ? w.weight + ' kg' : '—'}</dd><dt>WhatsApp</dt><dd>${esc(c.phone) || '—'}</dd></dl>
      <div class="tags">${c.injuries.map((i) => `<span class="tag bad">⚠ ${esc(i)}</span>`).join('') || '<span class="mute">Sin lesiones registradas</span>'}</div><p class="mute">${esc(c.notes)}</p></section>
      <section class="card"><h3>Asignado</h3>
      <p><b>Programa:</b> ${r ? `<a href="#/rutina/${r.id}">${esc(r.name)}</a>` : '<span class="mute">—</span> ' + btn('Crear', 'tab', 'data-k="cliente" data-v="programa"', '', 'sm')}</p>
      <p><b>Dieta:</b> ${d ? `<a href="#/dieta/${d.id}">${esc(d.name)}</a>` : '<span class="mute">—</span> ' + btn('Crear', 'tab', 'data-k="cliente" data-v="nutricion"', '', 'sm')}</p>
      <p><b>Grupos:</b> ${gs.map((g) => `<span class="tag">${esc(g.name)}</span>`).join('') || '—'}</p>
      <p><b>Último check-in:</b> ${lc ? `${fdate(lc.date)} · adherencia ${lc.adherence}/5 · energía ${lc.energy}/5` : '—'}</p>
      <h3 style="margin-top:12px">Próximas citas</h3>${ap.map((a) => `<div class="li"><b>${fdate(a.date)} ${a.time}</b><span class="tag">${a.type}</span></div>`).join('') || '<span class="mute">Ninguna</span>'}</section></div>
      <div class="bar">${c.phone ? `<a class="btn" target="_blank" href="https://wa.me/${c.phone.replace(/\D/g, '')}">${ic('chat', 16)}WhatsApp</a>` : ''}<a class="btn" href="#/hoja/${c.id}">${ic('print', 16)}Plan PDF</a>${btn('Portal del cliente', 'tab', 'data-k="cliente" data-v="actividad"', 'zap')}<span class="grow"></span>${btn('Eliminar cliente', 'client-del', `data-id="${c.id}"`, 'trash', 'del')}</div>`;
  } else if (t === 'actividad') {
    body = mods.activity.activityTab(c);
  } else if (t === 'programa') {
    body = programTab(c, r);
  } else if (t === 'nutricion') {
    body = mods.diet.nutritionTab(c, d);
  } else if (t === 'progreso') {
    const m = [...c.measures].sort((a, b) => a.date.localeCompare(b.date));
    const w = m.filter((x) => x.weight !== '' && x.weight != null);
    const ck = [...(c.checkins || [])].sort((a, b) => b.date.localeCompare(a.date));
    body = `<div class="bar">${btn('Registrar medidas', 'measure-add', `data-id="${c.id}"`, 'plus', 'pri')}${btn('Check-in semanal', 'checkin-add', `data-id="${c.id}"`, 'heart')}</div>
      <div class="cols"><section class="card"><h3>Peso</h3>${w.length > 1 ? spark(w.map((x) => x.weight)) + `<p class="mute">${w[0].weight} → ${w.at(-1).weight} kg (${(w.at(-1).weight - w[0].weight).toFixed(1)} kg)</p>` : '<p class="mute">Registra al menos 2 pesos para ver la gráfica.</p>'}</section>
      <section class="card"><h3>Check-ins</h3>${ck.length ? `<div class="chips">${['adherence:Adherencia', 'energy:Energía'].map((kv) => { const [k, l] = kv.split(':'); const avg = ck.slice(0, 4).reduce((a, x) => a + (x[k] || 0), 0) / Math.min(4, ck.length); return `<span class="chip">${l} <b>${avg.toFixed(1)}/5</b></span>`; }).join('')}</div>` : ''}
      ${ck.slice(0, 6).map((x) => `<div class="li"><b>${fdate(x.date)}</b><span>Adh ${x.adherence}/5 · Energía ${x.energy}/5 · Sueño ${x.sleep || '—'} h${x.pain ? ` · ⚠ ${esc(x.pain)}` : ''}${x.note ? `<br><span class="mute">${esc(x.note)}</span>` : ''}</span><button class="sm del" data-act="checkin-del" data-id="${c.id}" data-i="${c.checkins.indexOf(x)}">${ic('trash', 14)}</button></div>`).join('') || '<p class="mute">Aún sin check-ins. Pídele cada semana cómo va y regístralo aquí.</p>'}</section></div>
      <section class="card"><h3>Medidas</h3>${deltas(m)}<div class="tw"><table><tr><th>Fecha</th><th>Peso kg</th><th>% grasa</th><th>Cintura</th><th>Pecho</th><th>Cadera</th><th>Brazo</th><th>Muslo</th><th>Nota</th><th></th></tr>${m.map((x) => `<tr><td>${fdate(x.date)}</td><td>${x.weight ?? ''}</td><td>${x.fat ?? ''}</td><td>${x.waist ?? ''}</td><td>${x.chest ?? ''}</td><td>${x.hip ?? ''}</td><td>${x.arm ?? ''}</td><td>${x.thigh ?? ''}</td><td>${esc(x.note)}</td><td><button class="sm del" data-act="measure-del" data-id="${c.id}" data-i="${c.measures.indexOf(x)}">${ic('trash', 14)}</button></td></tr>`).join('') || '<tr><td colspan=10 class="mute">Aún sin registros.</td></tr>'}</table></div></section>${mods.activity.photosSection(c)}`;
  } else if (t === 'carpeta') {
    body = `<section class="card"><h3>Carpeta de ${esc(c.name)}</h3><p class="mute">Fotos de progreso, análisis, PDFs de laboratorio, consentimientos, etc. (hasta 25 MB cada uno)</p>
      <label class="drop">${ic('plus', 18)} Agregar archivos<input type="file" id="up" multiple data-client="${c.id}" hidden></label>
      ${c.files.map((f, i) => `<div class="file"><a href="#" data-act="file-open" data-id="${c.id}" data-i="${i}">${esc(f.name)}</a><span class="mute">${fdate(f.date)} <button class="sm del" data-act="file-del" data-id="${c.id}" data-i="${i}">${ic('trash', 14)}</button></span></div>`).join('') || '<p class="mute">Carpeta vacía.</p>'}</section>
      <section class="card"><h3>Notas del entrenador</h3><textarea data-notes="${c.id}">${esc(c.notes)}</textarea></section>`;
  } else if (t === 'pagos') {
    const ps = S.payments.filter((p) => p.clientId === c.id).sort((a, b) => b.due.localeCompare(a.due));
    body = `<section class="card"><div class="tw"><table><tr><th>Concepto</th><th>Monto</th><th>Vence</th><th>Estado</th></tr>${ps.map((p) => `<tr><td>${esc(p.concept)}</td><td>${money(p.amount)}</td><td>${fdate(p.due)}</td><td>${payTag(p)}</td></tr>`).join('') || '<tr><td colspan=4 class="mute">Sin pagos.</td></tr>'}</table></div></section>`;
  } else {
    const pq = c.parq || { a: [], consent: false };
    body = `<section class="card"><div class="row sp"><h3>Screening resumido de salud (tipo PAR-Q)</h3>${btn('Editar ficha', 'parq-edit', `data-id="${c.id}"`, 'edit', 'sm')}</div>
      <p class="mute">Versión resumida para orientar; no sustituye el PAR-Q+ oficial ni la valoración médica.</p>
      ${pq.date ? `<ul class="plain">${PARQ.map((q, i) => `<li>${(pq.a || []).includes(String(i)) ? '<span class="tag bad">Sí</span>' : '<span class="tag ok">No</span>'} ${q}</li>`).join('')}</ul>
      ${(pq.a || []).length ? `<p class="al bad">${ic('alert', 16)}<span>Hay respuestas "Sí": ${pq.cleared ? 'autorización médica registrada ✓' : 'recomienda autorización médica antes de empezar.'}</span></p>` : '<p class="al info">Sin banderas rojas en el screening.</p>'}
      <p>Consentimiento informado: ${pq.consent ? `<span class="tag ok">Firmado ${fdate(pq.date)}</span>` : '<span class="tag warn">Pendiente</span>'}</p>` : '<p class="mute">Aún no se ha llenado. Toca "Editar ficha" durante la primera sesión.</p>'}</section>`;
  }
  return `<div class="crumb"><a href="#/clientes">${ic('back', 16)} Clientes</a></div>
  <section class="chead">${avatar(c.name, 1)}<div><h1>${esc(c.name)}</h1><div class="tags">${trackTag(c.track)}<span class="tag">${c.level}</span>${c.injuries.map((i) => `<span class="tag bad">⚠ ${esc(i)}</span>`).join('')}</div><p class="sub">${esc(c.goal)}</p></div></section>
  <nav class="tabs">${tabs.map(([k, l]) => `<button class="${t === k ? 'on' : ''}" data-act="tab" data-k="cliente" data-v="${k}">${l}</button>`).join('')}</nav>${body}`;
};

function deltas(m) {
  const defs = [['weight', 'Peso', 'kg', -1], ['fat', '% grasa', '%', -1], ['waist', 'Cintura', 'cm', -1], ['chest', 'Pecho', 'cm', 1], ['hip', 'Cadera', 'cm', 0], ['arm', 'Brazo', 'cm', 1], ['thigh', 'Muslo', 'cm', 1]];
  const chips = defs.map(([k, l, u, good]) => {
    const v = m.filter((x) => x[k] !== '' && x[k] != null).map((x) => +x[k]); if (v.length < 2) return '';
    const d = Math.round((v.at(-1) - v[0]) * 10) / 10; const cls = d === 0 || good === 0 ? '' : (d < 0) === (good < 0) ? 'ok' : 'bad';
    return `<span class="chip ${cls}">${l} <b>${v.at(-1)} ${u}</b> (${d > 0 ? '+' : ''}${d})</span>`;
  }).join('');
  return chips ? `<div class="chips">${chips}</div>` : '';
}
function spark(vals) {
  const W = 500, H = 100, mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * (W - 24) + 12, H - 14 - ((v - mn) / r) * (H - 28)]);
  return `<svg viewBox="0 0 ${W} ${H}" class="spark"><polyline fill="none" stroke="var(--pri)" stroke-width="3" stroke-linejoin="round" points="${pts.map((p) => p.join(',')).join(' ')}"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--pri)"/>`).join('')}</svg>`;
}

// ---------- Programa del cliente ----------
const thumb = (e) => (e?.images?.[0] ? `<img class="th" loading="lazy" src="${e.images[0]}" alt="" onerror="this.remove()">` : `<span class="th ph">${esc((e?.name || '?')[0])}</span>`);
function routineBlock(r) {
  const prog = r.program;
  return `${prog ? `<div class="card prog"><h3>Cómo avanza el programa</h3><div class="weeks">${prog.weeks.map((w) => `<div class="wk"><b>${esc(w.label)}</b><span class="tag">RIR ${esc(w.rir)}</span><small>${esc(w.note)}</small></div>`).join('')}</div>
      <ul class="plain">${prog.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      ${prog.track === 'fisicoculturismo' ? `<h3>Series por músculo / semana</h3><div class="chips">${Object.entries(prog.volume).map(([k, v]) => `<span class="chip ${v >= 10 && v <= 20 ? 'ok' : ''}">${k} <b>${v}</b></span>`).join('')}</div><small class="mute">Rango práctico: 10–20 series semanales por grupo.</small>` : ''}</div>` : ''}
    ${r.days.map((d) => `<div class="card"><h3>${esc(d.name)}</h3>${d.items.map((it) => { const e = ex(it.exId); return `<div class="ri" data-act="ex-view" data-id="${it.exId}">${thumb(e)}<div class="ri-b"><b>${esc(e?.name || '?')}</b><small>${esc(e?.muscle || '')} · ${esc(e?.type || '')}</small>${it.note ? `<small class="mute">${esc(it.note)}</small>` : ''}</div><div class="ri-p"><b>${it.sets} × ${esc(it.reps)}</b><small>${esc(it.rest)}</small></div></div>`; }).join('')}</div>`).join('')}`;
}
function programTab(c, r) {
  const dr = ui.draft && ui.draft.clientId === c.id ? ui.draft : null;
  const dflt = c.track === 'beisbol' ? (c.season === 'temporada' ? 2 : 3) : c.track === 'fisicoculturismo' ? (c.daysPerWeek || 4) : (c.daysPerWeek || 3);
  const intro = c.track === 'beisbol' ? `Béisbol (${esc(c.position || 'lanzador')} · ${esc(c.season || 'fuera de temporada')}): potencia, pliometría, balón medicinal, fuerza unilateral, isométricos y cuidado del brazo.`
    : c.track === 'fisicoculturismo' ? `Fisicoculturismo (${esc(c.phase || 'volumen')}): series por músculo en rango 10–20 por semana, RIR 1–3 y semana de descarga.` : 'General: cuerpo completo o torso/pierna con progresión doble y descarga.';
  return `<section class="card"><h3>Generar programa</h3><p class="mute">${intro} Respeta lesiones, nivel y equipo del cliente. Lo puedes editar después.</p>
    <div class="gen"><div><label class="fl">Días por semana</label><select id="g-days">${opts([2, 3, 4, 5, 6].map((n) => [n, n + ' días']), dr?.days || dflt)}</select></div>
    <div><label class="fl">Cardio final</label><select id="g-fin">${opts([['0', 'No'], ['1', 'Sí, al terminar']], dr?.finisher ? '1' : '0')}</select></div></div>
    <label class="fl">Equipo disponible</label><div class="checks" id="g-equip">${EQUIP.map((e) => `<label><input type="checkbox" value="${e}" ${(dr?.equipment || c.equipment || []).includes(e) ? 'checked' : ''}>${e}</label>`).join('')}</div>
    <div class="bar">${btn('Generar programa', 'prog-gen', `data-id="${c.id}"`, 'zap', 'pri')}</div></section>
    <section class="card"><div class="row sp"><div><h3>Armar la rutina a mano</h3><p class="mute" style="margin:0">Elige los ejercicios directamente de la biblioteca, con imágenes y compatibilidad con las lesiones del cliente.</p></div>${btn('Nueva rutina', 'routine-new', `data-c="${c.id}"`, 'plus')}</div>${S.routines.length ? `<div class="row" style="margin-top:12px"><select id="tpl-sel" style="max-width:340px"><option value="">Usar una rutina existente como plantilla…</option>${S.routines.map((q) => `<option value="${q.id}">${esc(q.name)}</option>`).join('')}</select>${btn('Copiar al cliente', 'prog-tpl', `data-id="${c.id}"`, 'copy', 'sm')}</div>` : ''}</section>
    ${dr ? `<section class="card draft"><div class="row sp"><h3>Vista previa · ${esc(dr.routine.name)}</h3><div class="bar" style="margin:0">${btn('Guardar y asignar', 'prog-save', `data-id="${c.id}"`, 'check', 'pri')}${btn('Descartar', 'prog-drop')}</div></div></section>${routineBlock(dr.routine)}`
    : r ? `<div class="row sp"><h2>Programa actual: ${esc(r.name)}</h2><div class="bar" style="margin:0"><a class="btn sm" href="#/rutina/${r.id}">${ic('edit', 14)}Editar</a><a class="btn sm" href="#/hojar/${r.id}">${ic('print', 14)}PDF</a>${btn('Copiar', 'copy-routine', `data-id="${r.id}"`, 'copy', 'sm')}</div></div>${routineBlock(r)}` : '<p class="mute">Este cliente aún no tiene programa. Genera uno arriba.</p>'}`;
}

V.grupos = () => page('Grupos', 'Arma grupos para clases y sesiones compartidas', btn('Nuevo grupo', 'group-new', '', 'plus', 'pri'),
  `<div class="grid">${S.groups.map((g) => `<div class="card"><h3>${esc(g.name)}</h3><p class="mute">${esc(g.notes)}</p>
    <div class="tags">${g.clientIds.map((i) => `<span class="tag">${esc(cl(i)?.name || '?')}</span>`).join('')}</div>
    <div class="bar">${btn('Entrenar', 'plan-group', `data-id="${g.id}"`, 'zap', 'pri sm')}${btn('Editar', 'group-edit', `data-id="${g.id}"`, 'edit', 'sm')}${btn('', 'group-del', `data-id="${g.id}"`, 'trash', 'sm del')}</div></div>`).join('') || '<p class="mute">Aún no hay grupos.</p>'}</div>`);

const apptFields = () => [
  { k: 'date', l: 'Fecha', t: 'date', req: 1 }, { k: 'time', l: 'Hora', t: 'time', req: 1 }, { k: 'duration', l: 'Duración (min)', t: 'number' },
  { k: 'type', l: 'Tipo', t: 'select', o: [['individual', 'Individual'], ['grupal', 'Grupal']] },
  { k: 'groupId', l: 'Grupo (solo si es grupal)', t: 'select', o: [['', '— ninguno —'], ...S.groups.map((g) => [g.id, g.name])] },
  { k: 'clientIds', l: 'Clientes (si no usas grupo)', t: 'checks', o: S.clients.map((c) => [c.id, c.name]) },
  { k: 'status', l: 'Estado', t: 'select', o: [['programada', 'Programada'], ['realizada', 'Realizada'], ['cancelada', 'Cancelada'], ['no vino', 'No asistió']] },
  { k: 'repeat', l: 'Repetir (solo al crear)', t: 'select', o: [['', 'No se repite'], ['7', 'Cada semana'], ['14', 'Cada 2 semanas']] }, { k: 'repeatCount', l: 'Cuántas citas en total (si se repite)', t: 'number' },
  { k: 'notes', l: 'Notas', t: 'textarea' },
];
// ---------- Entrenamientos (rutinas) ----------
V.entrenamientos = () => page('Entrenamientos', 'Plantillas y programas para tus clientes', btn('Nueva rutina', 'routine-new', '', 'plus', 'pri'),
  `<p class="mute">Para generar un programa completo por tipo de persona (béisbol, fisicoculturismo, general) entra al cliente → pestaña <b>Programa</b>.</p>
  <div class="grid">${S.routines.map((r) => `<div class="card"><div class="row sp"><h3>${esc(r.name)}</h3>${r.program ? trackTag(r.program.track) : ''}</div><p class="mute">${esc(r.goal)} · ${r.days.length} días · ${r.days.reduce((a, d) => a + d.items.length, 0)} ejercicios</p>
    <div class="thumbs">${r.days.flatMap((d) => d.items).slice(0, 5).map((i) => thumb(ex(i.exId))).join('')}</div>
    <p class="mini">Asignada a: ${S.clients.filter((c) => c.routineId === r.id).map((c) => esc(c.name)).join(', ') || 'nadie'}</p>
    <div class="bar"><a class="btn sm pri" href="#/rutina/${r.id}">Abrir / editar</a><a class="btn sm" href="#/hojar/${r.id}">${ic('print', 14)}PDF</a>${btn('Duplicar', 'routine-dup', `data-id="${r.id}"`, 'copy', 'sm')}${btn('Copiar', 'copy-routine', `data-id="${r.id}"`, 'copy', 'sm')}${btn('', 'routine-del', `data-id="${r.id}"`, 'trash', 'sm del')}</div></div>`).join('') || '<p class="mute">Aún no hay rutinas.</p>'}</div>`);

// ---------- Biblioteca ----------
V.biblioteca = () => {
  const f = ui.lib;
  const q = f.q.toLowerCase();
  const list = S.exercises.filter((e) => (!q || e.name.toLowerCase().includes(q) || e.muscle.includes(q)) && (!f.pattern || e.pattern === f.pattern) && (!f.grp || e.muscle === f.grp) && (!f.type || e.type === f.type) && (!f.level || e.level === f.level) && (!f.tag || (e.tags || []).includes(f.tag)));
  const sel = (id, label, arr, v) => `<select id="${id}"><option value="">${label}</option>${arr.map((x) => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('')}</select>`;
  return page('Biblioteca de ejercicios', `${S.exercises.length} ejercicios con ejemplo y variantes`, `${btn('Catálogo ampliado (800+)', 'cat-open', '', 'grid')}${btn('Nuevo ejercicio', 'ex-new', '', 'plus', 'pri')}`,
    `<div class="bar filters"><div class="search">${ic('search', 16)}<input id="lq" placeholder="Buscar ejercicio o músculo…" value="${esc(f.q)}"></div>
      ${sel('lpat', 'Patrón', PATTERNS, f.pattern)}${sel('lgrp', 'Músculo', GROUPS, f.grp)}${sel('ltype', 'Tipo', TYPES, f.type)}${sel('llvl', 'Nivel', LEVELS.map((x) => x[0]), f.level)}
      <select id="ltag"><option value="">Todos los perfiles</option>${opts([['beisbol', 'Béisbol'], ['hipertrofia', 'Hipertrofia'], ['general', 'General']], f.tag)}</select></div>
    <p class="mini">${list.length} resultados</p>
    <div class="exgrid">${list.map((e) => `<div class="ex" data-act="ex-view" data-id="${e.id}"><div class="eximg">${e.images?.[0] ? `<img loading="lazy" src="${e.images[0]}" alt="" onerror="this.remove()">${e.images[1] ? `<img class="alt" loading="lazy" src="${e.images[1]}" alt="" onerror="this.remove()">` : ''}` : `<span class="noimg">${ic('zap', 28)}</span>`}</div>
      <div class="exb"><b>${esc(e.name)}</b><div class="tags"><span class="tag">${esc(e.muscle)}</span><span class="tag">${esc(e.type)}</span><span class="tag lv-${e.level}">${e.level}</span></div></div></div>`).join('')}</div>`);
};

// ---------- Pagos ----------
V.pagos = () => {
  const t = today(), month = t.slice(0, 7);
  const paid = S.payments.filter((p) => p.status === 'pagado' && (p.paidOn || '').startsWith(month)).reduce((a, p) => a + p.amount, 0);
  const pend = S.payments.filter((p) => p.status !== 'pagado');
  const ps = [...S.payments].sort((a, b) => (a.status === b.status ? b.due.localeCompare(a.due) : a.status === 'pagado' ? 1 : -1));
  return page('Pagos', 'Cobros, vencimientos y recordatorios', `${btn('Exportar CSV', 'csv-payments', '', 'copy')}${btn('Generar cobros del mes', 'pay-month')}${btn('Planes y precios', 'plan-edit')}${btn('Registrar cobro', 'pay-new', '', 'plus', 'pri')}`,
    `<div class="kpis"><div class="kpi"><span class="k-ic g">${ic('dollar')}</span><b>${money(paid)}</b><small>Cobrado este mes</small></div><div class="kpi"><span class="k-ic w">${ic('clip')}</span><b>${money(pend.reduce((a, p) => a + p.amount, 0))}</b><small>Por cobrar</small></div><div class="kpi"><span class="k-ic r">${ic('alert')}</span><b>${money(pend.filter((p) => p.due < t).reduce((a, p) => a + p.amount, 0))}</b><small>Vencido</small></div><div class="kpi"><span class="k-ic">${ic('users')}</span><b>${money(S.clients.filter((c) => c.active).reduce((a, c) => a + planPrice(c), 0))}</b><small>Ingreso mensual recurrente</small></div></div>
    <section class="card"><div class="tw"><table><tr><th>Cliente</th><th>Concepto</th><th>Monto</th><th>Vence</th><th>Estado</th><th></th></tr>${ps.map((p) => {
      const c = cl(p.clientId);
      return `<tr><td>${esc(c?.name || '?')}</td><td>${esc(p.concept)}</td><td>${money(p.amount)}</td><td>${fdate(p.due)}</td><td>${payTag(p)}</td><td class="nw">${p.status !== 'pagado' ? `${btn('Pagado', 'pay-done', `data-id="${p.id}"`, 'check', 'sm pri')}${c?.phone ? btn('', 'pay-remind', `data-id="${p.id}"`, 'chat', 'sm') : ''}` : ''}${p.status === 'pagado' ? `<a class="btn sm" href="#/recibo/${p.id}">Recibo</a>` : ''}${btn('', 'pay-del', `data-id="${p.id}"`, 'trash', 'sm del')}</td></tr>`;
    }).join('') || '<tr><td colspan=6 class="mute">Sin pagos registrados.</td></tr>'}</table></div></section>`);
};

// ---------- Entrenar en grupo ----------
V.entrenar = () => {
  const p = ui.plan;
  return page('✨ Entrenar en grupo', 'Un circuito donde todos participan al mismo tiempo, adaptado a nivel, lesiones y perfil de cada cliente.', '',
    `<section class="card"><div class="row sp"><h3>1. ¿Quiénes entrenan?</h3><span class="tags">${S.groups.map((g) => `<button class="sm" data-act="plan-group" data-id="${g.id}">${esc(g.name)}</button>`).join(' ')}</span></div>
    <div class="checks big" id="pl-clients">${S.clients.filter((c) => c.active).map((c) => `<label><input type="checkbox" value="${c.id}" ${p.clientIds.includes(c.id) ? 'checked' : ''}>${esc(c.name)} <span class="mute">· ${c.level}${c.injuries.length ? ' · ⚠ ' + esc(c.injuries.join('/')) : ''}</span></label>`).join('')}</div></section>
    <section class="card"><h3>2. Sesión</h3><div class="three">
      <div><label class="fl">Duración (min)</label><input type="number" id="pl-min" value="${p.minutes}" min="20" max="120"></div>
      <div><label class="fl">Enfoque</label><select id="pl-focus">${opts([['completo', 'Cuerpo completo'], ['superior', 'Tren superior'], ['inferior', 'Tren inferior'], ['cardio', 'Cardio / metabólico'], ['beisbol', 'Béisbol: explosividad y rotación']], p.focus)}</select></div>
      <div><label class="fl">Usar IA (Claude)</label><select id="pl-ai">${opts([['1', 'Sí, con IA'], ['0', 'Solo reglas del sistema']], p.useAI ? '1' : '0')}</select></div></div>
      <label class="fl">Equipo disponible (peso corporal siempre)</label><div class="checks" id="pl-equip">${EQUIP.map((e) => `<label><input type="checkbox" value="${e}" ${p.equipment.includes(e) ? 'checked' : ''}>${e}</label>`).join('')}</div></section>
    <div class="bar">${btn(ui.busy ? 'Generando…' : 'Generar sesión grupal', 'gen', ui.busy ? 'disabled' : '', 'zap', 'pri lg')}</div>
    ${ui.result ? renderPlan(ui.result) : ''}`);
};
function renderPlan(r) {
  const maxA = Math.max(...r.perClient.map((c) => c.attentionMin));
  const rot = {}; (r.rotation || []).forEach((x) => ((rot[x.round] ||= {})[x.station] = x.clientId));
  const nm = (id) => (r.perClient.find((c) => c.clientId === id)?.name || '').split(' ')[0];
  return `<section class="card ai-out"><div class="row sp"><h2>${esc(r.title)}</h2><span class="tag">${r.source === 'ia' ? '🤖 Generado con IA' : '⚙ Reglas del sistema'}</span></div>
  ${r.aiError ? `<p class="mute">La IA no respondió (${esc(r.aiError)}); se usó el sistema de reglas.</p>` : ''}
  <p class="mute">${r.totalMinutes} min · ${r.rounds} rondas · ${r.stations.length} estaciones · ${r.slotSeconds} s por estación (todos rotan juntos)</p>
  <h3>Calentamiento</h3><ul>${r.warmup.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
  <h3>Circuito personalizado</h3><div class="tw"><table><tr><th>Cliente</th><th>Trabajo / descanso</th>${r.stations.map((s) => `<th>Est. ${s.n}<br><span class="nc">${esc(s.name)}</span></th>`).join('')}</tr>
  ${r.perClient.map((c) => `<tr><td><b>${esc(c.name)}</b><br><span class="tag">${c.level}</span>${(c.injuries || []).map((i) => `<span class="tag bad">⚠ ${esc(i)}</span>`).join('')}</td><td>${c.workSec}s / ${c.restSec}s</td>${r.stations.map((s) => { const e = c.exercises.find((x) => x.station === s.n) || {}; return `<td>${esc(e.exercise)}<br><span class="mute">${esc(e.variant)}</span></td>`; }).join('')}</tr>`).join('')}</table></div>
  <h3>⏱ Tiempo de atención del coach</h3>
  ${r.perClient.map((c) => `<div class="att"><div class="row sp"><span>${esc(c.name)} <span class="mute">· ${esc(c.notes)}</span></span><b>${c.attentionMin} min</b></div><div class="meter"><i style="width:${(c.attentionMin / maxA) * 100}%"></i></div></div>`).join('')}
  ${r.rotation?.length ? `<h3>Dónde enfocarte en cada estación</h3><div class="tw"><table><tr><th>Ronda</th>${r.stations.map((s) => `<th>Est. ${s.n}</th>`).join('')}</tr>${Array.from({ length: r.rounds }, (_, i) => `<tr><td>${i + 1}</td>${r.stations.map((s) => `<td>${esc(nm(rot[i + 1]?.[s.n]))}</td>`).join('')}</tr>`).join('')}</table></div>` : ''}
  <h3>Enfriamiento</h3><ul>${r.cooldown.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><h3>Tips</h3><ul>${r.coachTips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
  <div class="bar">${btn('Iniciar modo sesión (pantalla completa)', 'live-start', '', 'zap', 'pri')}${btn('Agendar como cita grupal', 'plan-sched', '', 'cal')}<button onclick="print()">${ic('print', 16)}Imprimir</button></div></section>`;
}

V.ajustes = () => page('Ajustes', 'Tu marca, IA, cuenta y respaldos', '',
  `${planCard()}<div class="cols"><section class="card"><h3>Tu marca</h3><label class="fl">Tu nombre o el de tu negocio (aparece en los PDF y en el saludo)</label><input id="brand" value="${esc(S.settings?.brand || '')}" placeholder="Ej. CR Athletic Lab"><label class="fl">Moneda</label><div class="seg">${[['MXN', 'Pesos (MXN)'], ['USD', 'Dólares (USD)']].map(([k, l]) => `<button class="${(S.settings?.currency || 'MXN') === k ? 'on' : ''}" data-act="currency-set" data-v="${k}">${l}</button>`).join('')}</div><div class="bar">${btn('Guardar', 'brand-save', '', 'check', 'pri')}</div></section>
  <section class="card"><h3>Cuenta</h3><p>${esc(USER.email)}</p><div class="bar">${btn('Cerrar sesión', 'logout', '', 'out')}</div></section></div>
  <section class="card"><h3>IA (Claude)</h3><p class="mute">Con tu API key de Anthropic, "Entrenar en grupo" usa IA para razonar sobre cada cliente. Sin key funciona igual con el sistema de reglas. La key se guarda solo en tu cuenta.</p>
  <p>Estado: ${S.settings?.apiKey ? '<span class="tag ok">API key configurada</span>' : '<span class="tag warn">Sin API key (usa reglas)</span>'}</p><div class="row"><input id="key" type="password" placeholder="sk-ant-…" autocomplete="off"><button class="pri" data-act="key-save">Guardar</button></div></section>
  <section class="card"><h3>Datos</h3><div class="bar">${btn('Clientes (CSV)', 'csv-clients', '', 'copy')}${btn('Pagos (CSV)', 'csv-payments', '', 'copy')}${btn('Descargar respaldo (.json)', 'export')}<label class="btn">Restaurar respaldo<input type="file" id="imp" accept=".json" hidden></label>${btn('Agregar datos de ejemplo', 'demo')}${btn('Vaciar mi cuenta', 'reset', '', 'trash', 'del')}</div></section>
  <p class="mini">Imágenes de ejercicios: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank">free-exercise-db</a> (dominio público).</p>`);

// ---------- Texto para compartir ----------
const routineText = (r) => `*${r.name}* — ${r.goal}\n\n` + r.days.map((d) => `*${d.name}*\n` + d.items.map((i) => { const e = ex(i.exId); return `• ${e?.name || '?'}: ${i.sets}x${i.reps} (desc. ${i.rest})${i.note ? ' — ' + i.note : ''}`; }).join('\n')).join('\n\n');
const dietText = (d) => `*${d.name}*\n${d.kcal} kcal · P ${d.protein}g · C ${d.carbs}g · G ${d.fat}g\n\n` + d.days.map((x) => `*${x.name}*\n` + x.meals.map((m) => { if (!m.items) return `• ${m.name} (${m.time}): ${m.food || ''}`; const t = mealTotals(m.items); return `• ${m.name} (${m.time}): ${itemsText(m.items)} — ${Math.round(t.kcal)} kcal`; }).join('\n')).join('\n\n') + (d.notes ? `\n\n${d.notes}` : '');

// ---------- Acciones ----------
const groupForm = (g) => form(g.id ? 'Editar grupo' : 'Nuevo grupo', [{ k: 'name', l: 'Nombre', req: 1 }, { k: 'notes', l: 'Horario / notas' }, { k: 'clientIds', l: 'Integrantes', t: 'checks', o: S.clients.map((c) => [c.id, c.name]) }], g);
const exFields = () => [{ k: 'name', l: 'Nombre', req: 1 }, { k: 'pattern', l: 'Patrón', t: 'select', o: plain(PATTERNS) }, { k: 'muscle', l: 'Músculo principal', t: 'select', o: plain(GROUPS) }, { k: 'level', l: 'Nivel', t: 'select', o: LEVELS }, { k: 'type', l: 'Tipo', t: 'select', o: plain(TYPES) }, { k: 'equip', l: 'Equipo', t: 'checks', o: [['peso corporal', 'peso corporal'], ...plain(EQUIP)] }, { k: 'avoid', l: 'Precaución con (lesiones)', t: 'tags', ph: 'rodilla, hombro…' }, { k: 'tags', l: 'Perfiles', t: 'checks', o: [['general', 'General'], ['beisbol', 'Béisbol'], ['hipertrofia', 'Hipertrofia']] }, { k: 'desc', l: 'Cómo se hace', t: 'textarea' }, { k: 'cues', l: 'Puntos clave (separa con " · ")' }, { k: 'regress', l: 'Versión más fácil' }, { k: 'progress', l: 'Versión más difícil' }, { k: 'video', l: 'Link de video (opcional)' }];
const planPrice = (c) => S.plans.find((p) => p.id === c?.planId)?.price || 0;
const payFields = () => [{ k: 'clientId', l: 'Cliente', t: 'select', o: S.clients.map((c) => [c.id, c.name]) }, { k: 'concept', l: 'Concepto' }, { k: 'amount', l: 'Monto', t: 'number' }, { k: 'due', l: 'Fecha de vencimiento', t: 'date' }, { k: 'status', l: 'Estado', t: 'select', o: [['pendiente', 'Pendiente'], ['pagado', 'Ya pagado']] }, { k: 'method', l: 'Método (si ya pagó)' }];
function addAppt(v) {
  const { repeat, repeatCount, ...base } = v;
  const clash = S.appointments.find((a) => a.date === base.date && a.time === base.time && a.status === 'programada');
  if (clash && !confirm(`Ya hay una cita a las ${base.time} (${apptWho(clash)}). ¿Agendar de todos modos?`)) return;
  const n = repeat ? Math.min(52, Math.max(2, +repeatCount || 8)) : 1, sid = n > 1 ? uid('s') : '';
  for (let i = 0; i < n; i++) { const d = new Date(base.date + 'T12:00'); d.setDate(d.getDate() + i * (+repeat || 0)); S.appointments.push({ id: uid('a'), ...base, date: d.toISOString().slice(0, 10), seriesId: sid }); }
  save(); toast(n > 1 ? `${n} citas agendadas` : 'Cita agendada'); if (location.hash !== '#/agenda') location.hash = '#/agenda'; else render();
}
function onDone(a) {
  if (a.status !== 'realizada' || a.counted) return;
  a.counted = true;
  apptIds(a).forEach((id) => { const c = cl(id); if (c && typeof c.credits === 'number' && c.credits > 0) c.credits -= 1; });
}
function readPlanForm() {
  const p = ui.plan;
  p.clientIds = [...document.querySelectorAll('#pl-clients input:checked')].map((i) => i.value);
  p.equipment = [...document.querySelectorAll('#pl-equip input:checked')].map((i) => i.value);
  p.minutes = Math.max(20, Math.min(120, +$('#pl-min').value || 45)); p.focus = $('#pl-focus').value; p.useAI = $('#pl-ai').value === '1';
}
function normalizeClient(v) { return { ...v, active: v.active === '1' || v.active === true, activity: Number(v.activity) || 1.55 }; }

const ACT = {
  close: closeModal,
  go: (el) => { location.hash = el.dataset.to; },
  tab: (el) => { tab[el.dataset.k] = el.dataset.v; render(); },
  tf: (el) => { ui.tf = el.dataset.v; render(); },
  async 'credits-add'(el) { const c = cl(el.dataset.id); const v = await form('Paquete de sesiones', [{ k: 'n', l: 'Sesiones a agregar (cada sesión realizada descuenta 1)', t: 'number' }], { n: 10 }); if (!v || !v.n) return; c.credits = (c.credits || 0) + Number(v.n); save(); render(); toast(`${c.name.split(' ')[0]} tiene ${c.credits} sesiones`); },
  async 'client-new'() {
    const v = await form('Nuevo cliente', clientFields(), newClientDefaults()); if (!v) return;
    const c = { id: uid('c'), ...normalizeClient(v), measures: [], files: [], checkins: [] }; S.clients.push(c); save(); location.hash = '#/cliente/' + c.id; render();
  },
  async 'client-edit'(el) {
    const c = cl(el.dataset.id); const v = await form('Editar cliente', clientFields(), { ...c, active: c.active ? '1' : '0' }); if (!v) return;
    Object.assign(c, normalizeClient(v)); save(); render();
  },
  'client-del'(el) { if (!confirm('¿Eliminar cliente y todo su historial?')) return; const id = el.dataset.id; del('clients', id); S.groups.forEach((g) => (g.clientIds = g.clientIds.filter((i) => i !== id))); S.payments = S.payments.filter((p) => p.clientId !== id); save(); location.hash = '#/clientes'; },
  async 'measure-add'(el) {
    const v = await form('Registrar medidas', [{ k: 'date', l: 'Fecha', t: 'date', req: 1 }, { k: 'weight', l: 'Peso (kg)', t: 'number', step: '0.1' }, { k: 'fat', l: '% grasa', t: 'number', step: '0.1' }, { k: 'waist', l: 'Cintura (cm)', t: 'number', step: '0.1' }, { k: 'chest', l: 'Pecho (cm)', t: 'number', step: '0.1' }, { k: 'hip', l: 'Cadera (cm)', t: 'number', step: '0.1' }, { k: 'arm', l: 'Brazo (cm)', t: 'number', step: '0.1' }, { k: 'thigh', l: 'Muslo (cm)', t: 'number', step: '0.1' }, { k: 'note', l: 'Nota' }], { date: today() }); if (!v) return;
    cl(el.dataset.id).measures.push(v); save(); render();
  },
  'measure-del'(el) { cl(el.dataset.id).measures.splice(+el.dataset.i, 1); save(); render(); },
  async 'checkin-add'(el) {
    const sc = [[5, '5 · Excelente'], [4, '4'], [3, '3'], [2, '2'], [1, '1 · Muy mal']];
    const v = await form('Check-in semanal', [{ k: 'date', l: 'Fecha', t: 'date', req: 1 }, { k: 'adherence', l: 'Adherencia al plan', t: 'select', o: sc }, { k: 'energy', l: 'Energía', t: 'select', o: sc }, { k: 'sleep', l: 'Sueño (horas por noche)', t: 'number', step: '0.5' }, { k: 'pain', l: 'Molestias o dolor (si hay)' }, { k: 'note', l: 'Nota', t: 'textarea' }], { date: today(), adherence: 4, energy: 4 }); if (!v) return;
    const c = cl(el.dataset.id); (c.checkins ||= []).push({ ...v, adherence: +v.adherence, energy: +v.energy }); save(); render();
  },
  'checkin-del'(el) { cl(el.dataset.id).checkins.splice(+el.dataset.i, 1); save(); render(); },
  async 'parq-edit'(el) {
    const c = cl(el.dataset.id); const pq = c.parq || { a: [], consent: false };
    const v = await form('Ficha de salud', [{ k: 'a', l: 'Marca las preguntas con respuesta SÍ', t: 'checks', o: PARQ.map((q, i) => [String(i), q]) }, { k: 'cleared', l: 'Si hay respuestas Sí: ¿autorización médica?', t: 'select', o: [['0', 'No registrada'], ['1', 'Sí, autorizado por médico']] }, { k: 'consent', l: 'Consentimiento informado', t: 'select', o: [['0', 'Pendiente'], ['1', 'Firmado / aceptado por el cliente']] }], { a: pq.a || [], cleared: pq.cleared ? '1' : '0', consent: pq.consent ? '1' : '0' }); if (!v) return;
    c.parq = { a: v.a, cleared: v.cleared === '1', consent: v.consent === '1', date: today() }; save(); render();
  },
  async 'file-open'(el) { const f = cl(el.dataset.id).files[+el.dataset.i]; const { data, error } = await sb.storage.from('client-files').createSignedUrl(f.path, 3600); if (error) return toast(error.message); window.open(data.signedUrl, '_blank'); },
  async 'file-del'(el) { const c = cl(el.dataset.id); const f = c.files[+el.dataset.i]; if (!confirm('¿Borrar ' + f.name + '?')) return; await sb.storage.from('client-files').remove([f.path]); c.files.splice(+el.dataset.i, 1); save(); render(); },

  async 'prog-gen'(el) {
    const c = cl(el.dataset.id);
    const equipment = [...document.querySelectorAll('#g-equip input:checked')].map((i) => i.value);
    const days = +$('#g-days').value, finisher = $('#g-fin').value === '1';
    const routine = generateProgram(c, S.exercises, { days, equipment, finisher });
    ui.draft = { clientId: c.id, routine, days, finisher, equipment }; render();
    if (!routine.days.some((d) => d.items.length)) toast('No hubo ejercicios compatibles; revisa equipo y lesiones');
  },
  'prog-save'(el) {
    const c = cl(el.dataset.id), r = ui.draft.routine; const rt = { id: uid('r'), name: r.name, goal: r.goal, days: r.days, program: r.program };
    S.routines.push(rt); c.routineId = rt.id; c.programStart = today(); ui.draft = null; save(); render(); toast('Programa guardado y asignado');
  },
  'prog-drop'() { ui.draft = null; render(); },
  async 'group-new'() { const v = await groupForm({ clientIds: [] }); if (v) { S.groups.push({ id: uid('g'), ...v }); save(); render(); } },
  async 'group-edit'(el) { const g = find('groups', el.dataset.id); const v = await groupForm(g); if (v) { Object.assign(g, v); save(); render(); } },
  'group-del'(el) { if (confirm('¿Eliminar grupo?')) { del('groups', el.dataset.id); save(); render(); } },
  'plan-group'(el) { const g = find('groups', el.dataset.id); ui.plan.clientIds = g.clientIds.filter((i) => cl(i)?.active); ui.result = null; if (location.hash !== '#/entrenar') location.hash = '#/entrenar'; else render(); },

  async 'appt-new'() { const v = await form('Nueva cita', apptFields(), { date: today(), time: '07:00', duration: 60, type: 'individual', status: 'programada', clientIds: [], groupId: '' }); if (v) addAppt(v); },
  'cal-goto'(el) { ui.cal = ui.cal || {}; ui.cal.sel = el.dataset.d; ui.cal.date = el.dataset.d; ui.cal.mode = 'week'; location.hash = '#/agenda'; },
  async 'appt-edit'(el) { const a = find('appointments', el.dataset.id); const v = await form('Editar cita', apptFields(), a); if (v) { const { repeat, repeatCount, ...rest } = v; Object.assign(a, rest); onDone(a); save(); render(); } },
  'appt-del'(el) {
    const a = find('appointments', el.dataset.id); if (!confirm('¿Eliminar cita?')) return;
    del('appointments', el.dataset.id);
    if (a.seriesId && S.appointments.some((q) => q.seriesId === a.seriesId && q.date > a.date) && confirm('Esta cita es parte de una serie. ¿Eliminar también las siguientes?')) S.appointments = S.appointments.filter((q) => !(q.seriesId === a.seriesId && q.date > a.date));
    save(); render();
  },

  'routine-dup'(el) { const r = find('routines', el.dataset.id); S.routines.push({ ...JSON.parse(JSON.stringify(r)), id: uid('r'), name: r.name + ' (copia)' }); save(); render(); toast('Rutina duplicada'); },
  'prog-tpl'(el) {
    const id = $('#tpl-sel').value; if (!id) return toast('Elige una rutina');
    const r = find('routines', id), c = cl(el.dataset.id), n = { ...JSON.parse(JSON.stringify(r)), id: uid('r'), name: `${c.name.split(' ')[0]} · ${r.name}` };
    S.routines.push(n); c.routineId = n.id; c.programStart = today(); save(); render(); toast('Rutina copiada y asignada');
  },
  'routine-del'(el) { if (confirm('¿Eliminar rutina?')) { del('routines', el.dataset.id); S.clients.forEach((c) => c.routineId === el.dataset.id && (c.routineId = '')); save(); render(); } },
  'rday-add'(el) { const r = find('routines', el.dataset.id); r.days.push({ name: 'Día ' + (r.days.length + 1), items: [] }); save(); render(); },
  'rday-del'(el) { find('routines', el.dataset.id).days.splice(+el.dataset.d, 1); save(); render(); },
  'ritem-del'(el) { find('routines', el.dataset.id).days[+el.dataset.d].items.splice(+el.dataset.i, 1); save(); render(); },
  'copy-routine'(el) { copy(routineText(find('routines', el.dataset.id))); },
  'ex-view'(el) {
    const e = ex(el.dataset.id); if (!e) return toast('Elige primero un ejercicio');
    const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent('cómo hacer ' + e.name + ' técnica correcta');
    dialog(`<h2>${esc(e.name)}</h2><p class="tags"><span class="tag">${e.pattern}</span><span class="tag">${esc(e.muscle)}</span><span class="tag">${esc(e.type || '')}</span><span class="tag lv-${e.level}">${e.level}</span>${(e.tags || []).map((t) => `<span class="tag t-${t}">${t}</span>`).join('')}</p>
      ${e.images?.length ? `<div class="exshow">${e.images.map((u) => `<img src="${u}" alt="" onerror="this.remove()">`).join('')}</div>` : ''}
      <h3>Cómo se hace</h3><p>${esc(e.desc)}</p><h3>Puntos clave</h3><p class="tags">${esc(e.cues).split(' · ').map((x) => `<span class="tag">${x}</span>`).join('')}</p>
      <div class="two"><div class="card"><b>Más fácil</b><br>${esc(e.regress)}</div><div class="card"><b>Más difícil</b><br>${esc(e.progress)}</div></div>
      ${e.avoid.length ? `<p>Precaución si hay: ${e.avoid.map((a) => `<span class="tag bad">${esc(a)}</span>`).join('')}</p>` : ''}
      <p class="bar"><a class="btn" target="_blank" href="${esc(e.video || yt)}">▶ ${e.video ? 'Ver video' : 'Buscar video de ejemplo'}</a>${btn('Editar', 'ex-edit', `data-id="${e.id}"`, 'edit')}</p>`, true);
  },
  async 'ex-new'() { const v = await form('Nuevo ejercicio', exFields(), { pattern: 'sentadilla', muscle: 'cuádriceps', level: 'intermedio', type: 'fuerza', equip: ['peso corporal'], avoid: [], tags: ['general'] }); if (v) { S.exercises.push({ id: uid('x'), ...v, images: [], custom: true }); save(); render(); } },
  async 'ex-edit'(el) { closeModal(); const e = ex(el.dataset.id); const v = await form('Editar ejercicio', exFields(), e); if (v) { Object.assign(e, v, { custom: true }); save(); render(); } },

  'copy-diet'(el) { copy(dietText(find('diets', el.dataset.id))); },

  async 'pay-new'() {
    const v = await form('Registrar cobro', payFields(), { clientId: S.clients[0]?.id, due: today(), status: 'pendiente', amount: planPrice(S.clients[0]), concept: S.plans.find((p) => p.id === S.clients[0]?.planId)?.name || '' }); if (!v) return;
    S.payments.push({ id: uid('p'), ...v, paidOn: v.status === 'pagado' ? today() : '' }); save(); render();
  },
  async 'pay-done'(el) { const p = find('payments', el.dataset.id); const v = await form('Marcar como pagado', [{ k: 'paidOn', l: 'Fecha de pago', t: 'date' }, { k: 'method', l: 'Método', t: 'select', o: plain(['Efectivo', 'Transferencia', 'Tarjeta', 'Otro']) }], { paidOn: today(), method: 'Transferencia' }); if (!v) return; Object.assign(p, v, { status: 'pagado' }); save(); render(); },
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
        const clients = S.clients.filter((c) => p.clientIds.includes(c.id)).map((c) => ({ id: c.id, nombre: c.name, nivel: c.level, tipo: c.track, lesiones: c.injuries, objetivo: c.goal, notas: c.notes, ultimoPeso: (c.measures.at(-1) || {}).weight }));
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
  subscribe() {
    if (!CLAB.checkoutUrl) return toast('Los pagos se activarán pronto. Tu cuenta sigue funcionando sin cargo.');
    const u = new URL(CLAB.checkoutUrl); u.searchParams.set('client_reference_id', USER.id); u.searchParams.set('prefilled_email', USER.email); window.open(u.href, '_blank');
  },
  'currency-set'(el) { (S.settings ||= {}).currency = el.dataset.v; save(); render(); },
  'csv-payments'() { download(`pagos-${today()}.csv`, csv([['Cliente', 'Concepto', 'Monto', 'Vence', 'Estado', 'Fecha de pago', 'Método'], ...S.payments.map((p) => [cl(p.clientId)?.name || '', p.concept, p.amount, p.due, p.status, p.paidOn || '', p.method || ''])])); },
  'csv-clients'() { download(`clientes-${today()}.csv`, csv([['Nombre', 'Teléfono', 'Correo', 'Objetivo', 'Tipo', 'Nivel', 'Plan', 'Activo', 'Sesiones restantes'], ...S.clients.map((c) => [c.name, c.phone, c.email, c.goal, TRACK_NAME[c.track || 'general'], c.level, S.plans.find((p) => p.id === c.planId)?.name || '', c.active ? 'Sí' : 'No', c.credits ?? ''])])); },
  'onb-hide'() { (S.settings ||= {}).hideOnboarding = true; save(); render(); },
  search() { openSearch(); },
  's-go'(el) { closeModal(); if (el.dataset.ex) ACT['ex-view']({ dataset: { id: el.dataset.ex } }); else location.hash = el.dataset.go; },
  'brand-save'() { (S.settings ||= {}).brand = $('#brand').value.trim(); save(); toast('Guardado'); },
  'key-save'() { (S.settings ||= {}).apiKey = $('#key').value.trim(); save(); toast(S.settings.apiKey ? 'API key guardada' : 'API key eliminada'); render(); },
  async logout() { await flush(); await sb.auth.signOut(); location.reload(); },
  reload() { location.reload(); },
  async 'force-save'() { closeModal(); await flush(true); toast('Datos guardados'); },
  theme() { const n = THEMES[(THEMES.indexOf(getTheme()) + 1) % 3]; try { localStorage.setItem('clab-theme', n); } catch {} applyTheme(); render(); toast('Tema: ' + { auto: 'automático', light: 'claro', dark: 'oscuro' }[n]); },
  menu() { document.body.classList.toggle('navopen'); },
  demo() { if (S.clients.length && !confirm('Se agregarán los datos de ejemplo a los tuyos.')) return; const d = demo(); for (const k of Object.keys(d)) S[k] = [...S[k], ...d[k]]; migrate(); save(); render(); toast('Datos de ejemplo agregados'); },
  export() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = `coachdesk-respaldo-${today()}.json`; a.click(); },
  reset() { if (!confirm('Esto BORRA todos tus clientes, rutinas, pagos y citas. ¿Seguro?')) return; S = blank(); save(); render(); toast('Cuenta vaciada'); },
};

// ---------- Eventos ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && ACT[el.dataset.act]) { if (el.tagName === 'A' || el.tagName === 'LABEL') e.preventDefault(); ACT[el.dataset.act](el); }
  if (e.target.id === 'modal') closeModal();
  if (e.target.closest('#nav a')) document.body.classList.remove('navopen');
  if (e.target.closest('#burger')) document.body.classList.toggle('navopen');
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.path) {
    const [col, id] = t.closest('[data-root]').dataset.root.split(':');
    setPath(find(col, id), t.dataset.path, t.type === 'number' ? Number(t.value) : t.value); save();
    if (t.tagName === 'SELECT' || t.dataset.re) render();
  } else if (['pl-min', 'pl-focus', 'pl-ai'].includes(t.id) || t.closest('#pl-clients, #pl-equip')) readPlanForm();
  else if (['lpat', 'lgrp', 'ltype', 'llvl', 'ltag'].includes(t.id)) { Object.assign(ui.lib, { lpat: { pattern: t.value }, lgrp: { grp: t.value }, ltype: { type: t.value }, llvl: { level: t.value }, ltag: { tag: t.value } }[t.id]); render(); }
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
    try { const d = JSON.parse(await t.files[0].text()); if (!d.clients || !d.exercises) throw 0; if (!confirm('Se reemplazarán tus datos actuales.')) return; S = d; migrate(); save(); render(); toast('Respaldo restaurado'); } catch { toast('Archivo de respaldo inválido'); }
  }
});
document.addEventListener('input', (e) => {
  const id = e.target.id;
  if (id === 'q' || id === 'lq') {
    if (id === 'q') ui.q = e.target.value; else ui.lib.q = e.target.value;
    const p = e.target.selectionStart; render(); const q = $('#' + id); q.focus(); q.setSelectionRange(p, p);
  }
});

// ---------- Plan y suscripción ----------
function planCard() {
  if (!SUB) return '';
  const left = trialLeft(), cur = S.settings?.currency === 'USD' ? 'USD' : 'MXN';
  if (proActive()) return `<section class="card plan pro"><div class="row sp"><div><h3>Tu plan</h3><p class="mute" style="margin:2px 0 0">${SUB.provider === 'owner' ? 'Cuenta del propietario: acceso completo.' : 'Gracias por apoyar a C-Lab.'}</p></div><span class="tag ok">Pro activo</span></div></section>`;
  return `<section class="card plan"><div class="row sp"><div><h3>Tu plan</h3><p class="mute" style="margin:2px 0 0">${left > 0 ? `Prueba gratuita: te quedan <b>${left}</b> día(s).` : 'Tu prueba gratuita terminó.'}</p></div><span class="tag ${left > 0 ? 'warn' : 'bad'}">${left > 0 ? 'Prueba' : 'Vencida'}</span></div>
    <div class="meter" style="margin:10px 0"><i style="width:${Math.max(0, Math.min(100, (CLAB.trialDays - left) / CLAB.trialDays * 100))}%"></i></div>
    <ul class="plain">${CLAB.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    <div class="bar">${btn(`Plan Pro · ${CLAB.price[cur]} ${cur}/mes`, 'subscribe', '', 'zap', 'pri')}<span class="mini">${CLAB.checkoutUrl ? 'Pago seguro en una página externa.' : 'Los pagos se activarán pronto: por ahora tu cuenta funciona sin cargo.'}</span></div></section>`;
}
function trialBanner() {
  if (!SUB || proActive()) return '';
  const left = trialLeft(); if (left > 7) return '';
  return `<a class="al ${left > 0 ? 'warn' : 'bad'}" href="#/ajustes">${ic('alert', 16)}<span>${left > 0 ? `Tu prueba gratuita termina en ${left} día(s).` : 'Tu prueba gratuita terminó.'} Revisa tu plan.</span></a>`;
}

// ---------- Onboarding, actividad, búsqueda, recibos ----------
function onboarding() {
  if (S.settings?.hideOnboarding) return '';
  const c0 = S.clients[0] ? '#/cliente/' + S.clients[0].id : '#/clientes';
  const steps = [['Pon el nombre de tu negocio', !!S.settings?.brand, '#/ajustes'], ['Agrega tu primer cliente', S.clients.length > 0, '#/clientes'], ['Asígnale un programa de entrenamiento', S.clients.some((c) => c.routineId), c0], ['Crea su plan de nutrición', S.clients.some((c) => c.dietId), c0], ['Agenda una cita', S.appointments.length > 0, '#/agenda'], ['Activa el portal y mándaselo por WhatsApp', Object.keys(mods.activity.links).length > 0, c0]];
  const done = steps.filter((q) => q[1]).length; if (done === steps.length) return '';
  return `<section class="card onb"><div class="row sp"><div class="grow"><h3>Primeros pasos · ${done}/${steps.length}</h3><div class="meter"><i style="width:${done / steps.length * 100}%"></i></div></div>${btn('Ocultar', 'onb-hide', '', '', 'sm')}</div><div class="onbg">${steps.map(([l, ok, h]) => `<a class="onbs ${ok ? 'ok' : ''}" href="${h}"><span>${ok ? '✓' : ''}</span>${l}</a>`).join('')}</div></section>`;
}
function activityCard() {
  const L = mods.activity.logs.filter((l) => l.kind !== 'message' || l.data.from === 'client').slice(0, 6), nu = mods.activity.logs.filter((l) => !l.handled).length;
  const txt = (l) => ({ workout: `completó ${esc(l.data.dayName || 'un entrenamiento')}`, checkin: `envió su check-in (adh ${l.data.adherence}/5)`, intake: 'llenó su ficha inicial', message: `te escribió: “${esc(String(l.data.text || '').slice(0, 50))}”` }[l.kind]);
  return `<section class="card"><div class="row sp"><h3>Actividad de tus clientes ${nu ? `<span class="badge">${nu}</span>` : ''}</h3><span class="mute small">Desde el portal</span></div>${L.length ? L.map((l) => `<a class="li act" href="#/cliente/${l.client_id}" data-act="open-act" data-id="${l.client_id}"><b>${fdate(l.created_at.slice(0, 10))}</b><span><b style="min-width:0">${esc(cl(l.client_id)?.name || 'Cliente')}</b> ${txt(l)}</span>${l.handled ? '' : '<span class="tag warn">nuevo</span>'}</a>`).join('') : '<p class="mute empty">Cuando tus clientes usen el portal verás aquí sus entrenamientos y check-ins. Activa el portal desde la pestaña Actividad de cada cliente.</p>'}</section>`;
}
const csv = (rows) => rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
const download = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click(); };
V.recibo = (id) => {
  const p = find('payments', id); if (!p) return '<p>No encontrado</p>'; const c = cl(p.clientId);
  const folio = 'R-' + p.id.slice(-6).toUpperCase();
  return `<div class="bar noprint"><a href="#/pagos">${ic('back', 16)} Volver</a><span class="grow"></span><button class="pri" onclick="print()">${ic('print', 16)}Imprimir / Guardar PDF</button></div>
  <article class="sheet receipt"><header class="sh-h"><div class="sh-b">${logoMark(46)}<div><b>${esc(S.settings?.brand || 'C-Lab')}</b><small>Coaching Lab</small></div></div><div class="sh-t"><h1>Recibo de pago</h1><p>Folio ${folio}</p></div></header>
  <div class="rc-body"><div class="rc-amount"><small>Monto recibido</small><b>${money(p.amount)}</b></div>
  <table class="sh-t1"><tbody><tr><th>Cliente</th><td>${esc(c?.name || '—')}</td></tr><tr><th>Concepto</th><td>${esc(p.concept)}</td></tr><tr><th>Vencimiento</th><td>${fdate(p.due)}</td></tr><tr><th>Fecha de pago</th><td>${p.paidOn ? fdate(p.paidOn) : '—'}</td></tr><tr><th>Método</th><td>${esc(p.method || '—')}</td></tr><tr><th>Estado</th><td><b>${p.status === 'pagado' ? 'PAGADO' : 'PENDIENTE'}</b></td></tr></tbody></table>
  <p class="mute small" style="margin-top:24px">Comprobante de pago por servicios de entrenamiento. Este recibo no es una factura fiscal.</p></div>
  <footer class="sh-f"><span>${esc(S.settings?.brand || 'C-Lab')} · generado con C-Lab</span><span>${folio}</span></footer></article>`;
};
function openSearch() {
  const m = $('#modal'); m.hidden = false; ui.sIdx = 0;
  m.innerHTML = `<div class="dlg srch"><div class="search" style="max-width:none">${ic('search', 16)}<input id="sq" placeholder="Buscar cliente, ejercicio, rutina, dieta o página…" autocomplete="off"></div><div id="sres"></div><div class="mini">↑↓ para moverte · Enter para abrir · Esc para cerrar</div></div>`;
  $('#sq').focus(); drawSearch('');
}
function searchItems(q) {
  q = q.toLowerCase().trim(); const out = [];
  const add = (t, l, sub, go, ex) => { if (!q || l.toLowerCase().includes(q) || (sub || '').toLowerCase().includes(q)) out.push({ t, l, sub, go, ex }); };
  NAV.forEach(([, items]) => items.forEach(([h, l]) => add('Página', l, '', h)));
  S.clients.forEach((c) => add('Cliente', c.name, c.goal, '#/cliente/' + c.id));
  S.routines.forEach((r) => add('Rutina', r.name, r.goal, '#/rutina/' + r.id));
  S.diets.forEach((d) => add('Dieta', d.name, `${d.kcal} kcal`, '#/dieta/' + d.id));
  if (q) S.exercises.forEach((e) => add('Ejercicio', e.name, e.muscle, '', e.id));
  return out.slice(0, 12);
}
function drawSearch(q) {
  const items = searchItems(q); ui.sItems = items; ui.sIdx = Math.min(ui.sIdx || 0, Math.max(0, items.length - 1));
  $('#sres').innerHTML = items.map((it, i) => `<button class="sr ${i === ui.sIdx ? 'on' : ''}" data-act="s-go" ${it.ex ? `data-ex="${it.ex}"` : `data-go="${it.go}"`}><span class="tag">${it.t}</span><b>${esc(it.l)}</b><small>${esc(it.sub || '')}</small></button>`).join('') || '<p class="mute">Sin resultados.</p>';
}
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (S) openSearch(); return; }
  if (e.key === 'Escape' && !$('#modal').hidden) { closeModal(); return; }
  if (e.target.id === 'sq') {
    const n = (ui.sItems || []).length;
    if (e.key === 'ArrowDown') { e.preventDefault(); ui.sIdx = (ui.sIdx + 1) % Math.max(1, n); drawSearch($('#sq').value); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); ui.sIdx = (ui.sIdx - 1 + n) % Math.max(1, n); drawSearch($('#sq').value); }
    else if (e.key === 'Enter') { e.preventDefault(); document.querySelector('#sres .sr.on')?.click(); }
  }
});
document.addEventListener('input', (e) => { if (e.target.id === 'sq') { ui.sIdx = 0; drawSearch(e.target.value); } });

// ---------- Módulos ----------
const ctx = { sb, user: () => USER, onDone, ui, esc, ic, btn, page, thumb, avatar, form, dialog, closeModal, save, render, renderMain, toast, today, fdate, money, uid, cl, ex, find, del, plain, opts, copy, $, PATTERNS, GROUPS, TYPES, LEVELS, EQUIP, TRACK_NAME, apptFields, addAppt, apptWho, apptIds, apptSort };
Object.defineProperty(ctx, 'S', { get: () => S });
const mods = { calendar: calendarMod.make(ctx), builder: builderMod.make(ctx), diet: dietMod.make(ctx), sheets: sheetsMod.make(ctx), activity: activityMod.make(ctx), live: liveMod.make(ctx), tools: toolsMod.make(ctx), catalog: catalogMod.make(ctx) };
Object.values(mods).forEach((m) => { Object.assign(V, m.V); Object.assign(ACT, m.ACT); });

// ---------- Tema ----------
const THEMES = ['auto', 'light', 'dark'];
const getTheme = () => { try { return localStorage.getItem('clab-theme') || 'auto'; } catch { return 'auto'; } };
const applyTheme = () => { const t = getTheme(); if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; };
applyTheme();

// ---------- Router ----------
const NAV = [
  ['Principal', [['#/', 'Inicio', 'home'], ['#/clientes', 'Clientes', 'users'], ['#/agenda', 'Agenda', 'cal']]],
  ['Entrenamiento', [['#/entrenamientos', 'Rutinas', 'clip'], ['#/biblioteca', 'Biblioteca', 'grid'], ['#/entrenar', 'Entreno grupal IA', 'zap'], ['#/grupos', 'Grupos', 'team'], ['#/herramientas', 'Herramientas', 'calc']]],
  ['Nutrición', [['#/nutricion', 'Dietas y alimentos', 'leaf']]],
  ['Negocio', [['#/pagos', 'Pagos', 'dollar'], ['#/ajustes', 'Ajustes', 'cog']]],
];
function renderMain() {
  setTimeout(() => mods.activity?.hydrate(), 0);
  let [seg, id] = (location.hash.slice(2) || '').split('/');
  if (seg === 'rutinas') seg = 'entrenamientos'; if (seg === 'dietas') seg = 'nutricion';
  $('#main').innerHTML = (V[seg || 'home'] || (() => '<p>No encontrado</p>'))(id);
  if (seg === 'herramientas') mods.tools.init();
}
function render() {
  if (!S) return;
  let [seg, id] = (location.hash.slice(2) || '').split('/');
  if (seg === 'rutinas') seg = 'entrenamientos'; if (seg === 'dietas') seg = 'nutricion';
  const name = seg || 'home';
  renderMain();
  const base = { cliente: 'clientes', rutina: 'entrenamientos', dieta: 'nutricion', hoja: 'clientes', hojar: 'entrenamientos', hojad: 'nutricion', recibo: 'pagos' }[name] || name;
  $('#nav').innerHTML = `<div class="brand">${logoFull(38)}</div><button class="navsearch" data-act="search">${ic('search', 15)}<span>Buscar…</span><kbd>Ctrl K</kbd></button>` + NAV.map(([sec, items]) => `<div class="ns">${sec}</div>` + items.map(([h, l, i]) => `<a href="${h}" class="${h === '#/' + (base === 'home' ? '' : base) ? 'on' : ''}">${ic(i)}<span>${l}</span></a>`).join('')).join('') + `<div class="who"><span class="av sm" style="--h:${hue(USER.email)}">${esc(initials(S.settings?.brand || USER.email))}</span><div><b>${esc(S.settings?.brand || 'Mi cuenta')}</b><small>${esc(USER.email)}</small></div><button data-act="theme" title="Tema: ${getTheme()}">${ic({ auto: 'auto', light: 'sun', dark: 'moon' }[getTheme()], 16)}</button><button data-act="logout" title="Cerrar sesión">${ic('out', 16)}</button></div>`;
  $('#tabbar').innerHTML = [['#/', 'Inicio', 'home'], ['#/clientes', 'Clientes', 'users'], ['#/agenda', 'Agenda', 'cal'], ['#/entrenamientos', 'Rutinas', 'clip']].map(([h, l, i]) => `<a href="${h}" class="${h === '#/' + (base === 'home' ? '' : base) ? 'on' : ''}">${ic(i, 22)}<span>${l}</span></a>`).join('') + `<button data-act="menu">${ic('menu', 22)}<span>Más</span></button>`;
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { closeModal(); render(); });

// ---------- Datos ----------
const blank = () => ({ exercises: structuredClone(LIB), foods: structuredClone(FOODS), libVersion: LIB_VERSION, clients: [], groups: [], appointments: [], routines: [], diets: [], payments: [], plans: [], settings: {} });
function migrate() {
  for (const k of ['clients', 'groups', 'appointments', 'routines', 'diets', 'payments', 'plans', 'exercises']) S[k] ||= [];
  S.settings ||= {};
  S.exercises = mergeLibrary(S.exercises); S.libVersion = LIB_VERSION;
  S.foods = mergeFoods(S.foods); setFoods(S.foods);
  S.clients.forEach((c) => { if (c.routineId && !c.programStart) c.programStart = today(); Object.assign(c, { track: c.track || 'general', injuries: c.injuries || [], measures: c.measures || [], files: c.files || [], checkins: c.checkins || [], equipment: c.equipment || ['mancuernas', 'banda', 'banco'], foodsAvoid: c.foodsAvoid || [], daysPerWeek: c.daysPerWeek || 3, sex: c.sex || 'm', activity: c.activity || 1.55 }); });
  // rutinas viejas que apuntan a ejercicios que ya no existen
  S.routines.forEach((r) => r.days.forEach((d) => d.items.forEach((it) => { if (it.exId && !S.exercises.some((e) => e.id === it.exId)) it.exId = ''; })));
}
async function start() {
  const { data, error } = await sb.from('coach_data').select('data, updated_at').eq('user_id', USER.id).maybeSingle();
  if (!error) SERVER_TS = data?.updated_at || null;
  { const { data: sub } = await sb.from('subscriptions').select('*').maybeSingle(); SUB = sub || null; }
  if (error) { $('#main').innerHTML = `<p>Error al cargar tus datos: ${esc(error.message)}</p>`; return; }
  S = data?.data && Object.keys(data.data).length ? data.data : blank();
  const before = S.libVersion;
  migrate();
  if (!data || before !== LIB_VERSION) await flush();
  document.body.classList.add('in'); $('#login').hidden = true;
  render();
  mods.activity.refresh(false);
}

// ---------- Login ----------
$('#lbrand').innerHTML = logoFull(46); $('#burgerlogo').innerHTML = logoFull(30);
let mode = /registro/.test(location.search) ? 'up' : 'in';
if (mode === 'up') { $('#ltitle').textContent = 'Crear cuenta de entrenador'; $('#lsubmit').textContent = 'Crear cuenta'; $('#lswitch').textContent = 'Ya tengo cuenta'; }
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
