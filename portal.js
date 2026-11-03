// Portal del cliente C-Lab: rutina, registro de series con récords, hábitos, comidas, fotos, logros y check-ins.
// Sin cuentas: el cliente entra con su enlace. Funciona sin conexión (caché + cola de envíos).
const SB_URL = 'https://qqgdbdbdfecppehwyezm.supabase.co';
const SB_KEY = 'sb_publishable_ljrk5vR6YAvpHs68RehEYw_mLclqIcu';
const API = SB_URL + '/functions/v1/portal';
const token = new URLSearchParams(location.search).get('t') || '';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const iso = (d) => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const fdate = (s) => new Date(s + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
const IC = { hoy: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10', rutina: 'M6.5 6.5v11 M17.5 6.5v11 M3 9v6 M21 9v6 M6.5 12h11', comida: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12', progreso: 'M3 3v18h18 M7 14l4-4 3 3 5-6' };
const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[n]}"/></svg>`;
const PARQ = ['¿Algún médico te dijo que tienes un problema del corazón o presión alta?', '¿Sientes dolor en el pecho al hacer actividad física?', '¿Has sentido dolor en el pecho en reposo en el último mes?', '¿Pierdes el equilibrio por mareo o has perdido el conocimiento?', '¿Tienes un problema de huesos o articulaciones que empeora con el ejercicio?', '¿Tomas medicamentos para la presión o el corazón?', '¿Sabes de otra razón por la que no deberías hacer ejercicio?'];
const HABITS = { agua: ['💧', 'Tomar suficiente agua'], sueno: ['😴', 'Dormir 7+ horas'], pasos: ['🚶', 'Caminar 8,000 pasos'], proteina: ['🥩', 'Proteína en cada comida'], creatina: ['⚡', 'Tomar creatina'], movilidad: ['🧘', 'Movilidad 10 min'], azucar: ['🚫', 'Sin refrescos ni azúcar añadida'] };

let D = null, tab = 'hoy', dietDay = 0, run = null, timer = null, clock = null, offline = false, habT = null;
const K = (n) => `clab-${n}-${token.slice(0, 12)}`;
const lget = (n, d) => { try { return JSON.parse(localStorage.getItem(K(n))) ?? d; } catch { return d; } };
const lset = (n, v) => { try { localStorage.setItem(K(n), JSON.stringify(v)); } catch { /* sin espacio */ } };
const ldel = (n) => { try { localStorage.removeItem(K(n)); } catch { /* ok */ } };
const toast = (m) => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 2600); };
const buzz = (p) => { try { navigator.vibrate?.(p); } catch { /* sin vibración */ } };
const api = async (action, kind, data) => {
  let r;
  try { r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, action, kind, data }) }); } catch { const e = new Error('Sin conexión'); e.net = true; throw e; }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'No se pudo conectar');
  return j;
};
const ex = (id) => D.exercises.find((e) => e.id === id);
const food = (id) => D.foods.find((f) => f.id === id);
const workouts = () => D.logs.filter((l) => l.kind === 'workout');
const checkins = () => D.logs.filter((l) => l.kind === 'checkin');
const wDate = (w) => w.data.date || w.created_at.slice(0, 10);
const thumb = (e) => (e?.images?.[0] ? `<img class="th" loading="lazy" src="${e.images[0]}" alt="" onerror="this.remove()">` : `<span class="th ph">${esc((e?.name || '?')[0])}</span>`);
const first = (n) => String(n || '').split(' ')[0];
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '')) ? u : '');
const e1rm = (kg, reps) => kg * (1 + reps / 30);

// ---------- marca del entrenador ----------
const hexOk = (s) => (/^#[0-9a-f]{6}$/i.test(s || '') ? s : null);
function applyBrand() {
  const h = hexOk(D.brandColor), root = document.documentElement.style;
  if (!h) { ['--accent', '--accent2', '--ink-a'].forEach((k) => root.removeProperty(k)); return; }
  const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const dark = (f) => '#' + [r, g, b].map((v) => Math.round(v * f).toString(16).padStart(2, '0')).join('');
  root.setProperty('--accent', h); root.setProperty('--accent2', dark(0.82));
  root.setProperty('--ink-a', (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#0b1220' : '#ffffff');
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', '#0a1020');
}

function itemText(it) {
  const f = food(it.id); if (!f) return '?';
  if (f.unit) { const n = Math.round(it.g / f.unit.g * 2) / 2 || 0.5; return `${n} ${n === 1 ? f.unit.n : f.unit.p}${f.unit.of ? ' de ' + f.name.toLowerCase() : ''} (${Math.round(it.g)} g)`; }
  return `${Math.round(it.g)} g de ${f.name.toLowerCase()}`;
}
const itemKcal = (it) => { const f = food(it.id); return f ? f.kcal * it.g / 100 : 0; };
const parseRest = (s) => { const m = String(s || '').match(/(\d+)/); if (!m) return 60; const n = +m[1]; return /min/i.test(s) ? n * 60 : n; };
const lastSets = (exId) => { for (const w of workouts()) { const e = (w.data.entries || []).find((x) => x.exId === exId); if (e && e.sets?.length) return e.sets; } return null; };
// Progresión doble: si en todas las series llegó al tope de repeticiones con peso, sugiere subir carga
const repTop = (r) => { const t = String(r || ''); if (/(^|[^a-z])s([^a-z]|$)|seg|min/i.test(t)) return null; const n = (t.match(/\d+/g) || []).map(Number); return n.length ? Math.max(...n) : null; };
const suggest = (it) => {
  const last = lastSets(it.exId), top = repTop(it.reps); if (!last || !top) return null;
  const kgs = last.map((s) => +s.kg || 0), reps = last.map((s) => +s.reps || 0), max = Math.max(...kgs);
  if (!max || last.length < Math.min(+it.sets || 3, 3) || !reps.every((r) => r >= top)) return null;
  const inc = Math.min(5, Math.max(1.25, Math.round(max * 0.05 / 1.25) * 1.25));
  return { kg: Math.round((max + inc) * 100) / 100, from: max, top };
};
const nextDayIdx = () => {
  const days = D.routine?.days || []; if (!days.length) return 0;
  const w = workouts()[0]; if (!w) return 0;
  const i = days.findIndex((d) => d.name === w.data.dayName);
  return i < 0 ? 0 : (i + 1) % days.length;
};
const monday = (d) => { const m = new Date(d); m.setHours(12, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return iso(m); };
const weekWorkouts = () => { const mon = monday(new Date()); return workouts().filter((w) => wDate(w) >= mon).length; };
const weights = () => {
  const a = (D.client.measures || []).filter((m) => m.weight !== '' && m.weight != null).map((m) => ({ d: m.date, w: +m.weight }));
  checkins().forEach((c) => { if (c.data.weight) a.push({ d: c.created_at.slice(0, 10), w: +c.data.weight }); });
  return a.sort((x, y) => x.d.localeCompare(y.d));
};
function spark(vals) {
  if (vals.length < 2) return '<p class="mute small">Cuando registres 2 pesos o más verás tu gráfica aquí.</p>';
  const W = 400, H = 96, mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * (W - 20) + 10, H - 12 - ((v - mn) / r) * (H - 24)]);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}"><polyline fill="none" style="stroke:var(--accent)" stroke-width="3" stroke-linejoin="round" points="${pts.map((p) => p.join(',')).join(' ')}"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" style="fill:var(--accent)"/>`).join('')}</svg>`;
}
const prs = () => {
  const best = {};
  workouts().forEach((w) => (w.data.entries || []).forEach((e) => (e.sets || []).forEach((s) => { const kg = +s.kg, reps = +s.reps; if (!kg || !reps) return; const e1 = e1rm(kg, reps); if (!best[e.exId] || e1 > best[e.exId].e1) best[e.exId] = { e1, kg, reps, name: e.name }; })));
  return Object.values(best).sort((a, b) => b.e1 - a.e1).slice(0, 6);
};
// Récords a lo largo del historial (el primer registro de un ejercicio es la base, no un récord)
function prEvents() {
  const best = {}, out = [];
  [...workouts()].reverse().forEach((w) => (w.data.entries || []).forEach((e) => {
    const m = Math.max(0, ...(e.sets || []).map((s) => (+s.kg > 0 && +s.reps > 0 ? e1rm(+s.kg, +s.reps) : 0)));
    if (!m) return;
    if (best[e.exId] && m > best[e.exId] + 0.01) out.push({ exId: e.exId, name: e.name, date: wDate(w) });
    best[e.exId] = Math.max(best[e.exId] || 0, m);
  }));
  return out;
}
const histBest = () => { const b = {}; workouts().forEach((w) => (w.data.entries || []).forEach((e) => (e.sets || []).forEach((s) => { if (+s.kg > 0 && +s.reps > 0) b[e.exId] = Math.max(b[e.exId] || 0, e1rm(+s.kg, +s.reps)); }))); return b; };

// ---------- rachas, hábitos y logros ----------
function streakWeeks() {
  const goal = D.routine?.days?.length || 3, need = Math.max(1, Math.round(goal * 0.7)), map = {};
  workouts().forEach((w) => { const k = monday(new Date(wDate(w) + 'T12:00')); map[k] = (map[k] || 0) + 1; });
  const cur = new Date(); let streak = 0, frozen = 0;
  for (let i = 0; i < 52; i++) {
    const d = new Date(cur); d.setDate(d.getDate() - 7 * i); const c = map[monday(d)] || 0;
    if (c >= need) streak++; else { if (i === 0) continue; frozen++; if (frozen > 1) { frozen = 1; break; } }
  }
  return { streak, need };
}
const habitIds = () => (D.client.habits || []).filter((h) => HABITS[h]).slice(0, 5);
const habitState = (date) => {
  const loc = lget('hab', null); if (loc && loc.date === date) return loc;
  const s = (D.habitLogs || []).find((l) => l.data?.date === date);
  return { date, done: s?.data.done || [], meals: s?.data.meals || [] };
};
const habitRatio = (date) => { const ids = habitIds(); if (!ids.length) return 0; const st = habitState(date); return ids.filter((h) => st.done.includes(h)).length / ids.length; };
function habitStreak() {
  if (!habitIds().length) return 0;
  let s = 0, miss = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i); const r = habitRatio(iso(d));
    if (r >= 0.6) s++; else if (i === 0) continue; else { miss++; if (miss > 1) break; }
  }
  return s;
}
const BADGES = [
  ['first', '🏁', 'Primer entreno', 'Registra tu primer entrenamiento', (c) => c.nw >= 1], ['w10', '💪', '10 entrenos', 'Completa 10 entrenamientos', (c) => c.nw >= 10],
  ['w25', '🔥', '25 entrenos', 'Completa 25 entrenamientos', (c) => c.nw >= 25], ['w50', '🏅', '50 entrenos', 'Completa 50 entrenamientos', (c) => c.nw >= 50], ['w100', '👑', '100 entrenos', 'Completa 100 entrenamientos', (c) => c.nw >= 100],
  ['s2', '📅', 'Racha de 2 semanas', '2 semanas seguidas cumpliendo', (c) => c.streak >= 2], ['s4', '🗓️', 'Racha de 4 semanas', '4 semanas seguidas cumpliendo', (c) => c.streak >= 4], ['s8', '🚀', 'Racha de 8 semanas', '8 semanas seguidas cumpliendo', (c) => c.streak >= 8],
  ['pr1', '🏆', 'Primer récord', 'Supera tu mejor marca', (c) => c.pr >= 1], ['pr10', '🥇', '10 récords', 'Supera 10 marcas', (c) => c.pr >= 10],
  ['vol', '🏋️', '10,000 kg movidos', 'Suma 10,000 kg de volumen', (c) => c.vol >= 10000], ['ci', '📋', 'Primer check-in', 'Cuéntale a tu coach cómo vas', (c) => c.ck >= 1],
  ['ph', '📸', 'Primera foto', 'Sube una foto de progreso', (c) => c.ph >= 1], ['hb', '✅', '7 días de hábitos', '7 días cumpliendo tus hábitos', (c) => c.hb >= 7],
];
function badgeCtx() {
  const ws = workouts(); const vol = ws.reduce((a, w) => a + (w.data.entries || []).reduce((b, e) => b + (e.sets || []).reduce((c, s) => c + (+s.kg || 0) * (+s.reps || 0), 0), 0), 0);
  const hb = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return habitRatio(iso(d)) >= 0.6 ? 1 : 0; }).reduce((a, b) => a + b, 0);
  return { nw: ws.length, streak: streakWeeks().streak, pr: prEvents().length, vol, ck: checkins().length, ph: (D.photos || []).length, hb };
}

// ---------- vistas ----------
function header() {
  const logo = D.brandLogo && /^data:image\//.test(D.brandLogo)
    ? `<img class="blogo" src="${D.brandLogo}" alt="">`
    : '<svg width="34" height="34" viewBox="0 0 64 64"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#101a33"/><stop offset="1" stop-color="#070c18"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#b)"/><path d="M43.6 20.6A17.5 17.5 0 1 0 43.6 43.4" fill="none" style="stroke:var(--accent)" stroke-width="7" stroke-linecap="round"/><path d="M21 33.5h7l3-9.5 4.2 17.5 3.3-8H55" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return `<div class="top"><div class="brandrow">${logo}<div><b>${esc(D.brand || 'C-Lab')}</b><small>Mi plan</small></div></div></div>${offline ? '<div class="offline">Sin conexión · estás viendo tu último plan guardado. Tus registros se enviarán solos al volver internet.</div>' : ''}`;
}
const ring = (v, t, label) => { const pct = t ? Math.min(1, v / t) : 0, c = 2 * Math.PI * 34; return `<div class="ringw"><svg width="86" height="86" viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" fill="none" stroke="var(--line)" stroke-width="8"/><circle cx="42" cy="42" r="34" fill="none" style="stroke:var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 42 42)"/><text x="42" y="48" text-anchor="middle" class="rt">${v}/${t}</text></svg><small>${label}</small></div>`; };
function habitsCard() {
  const ids = habitIds(); if (!ids.length) return '';
  const st = habitState(today()), n = ids.filter((h) => st.done.includes(h)).length, hs = habitStreak();
  const dots = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const r = habitRatio(iso(d)); return `<i class="dot ${r >= 0.6 ? 'on' : r > 0 ? 'half' : ''}" title="${iso(d)}"></i>`; }).join('');
  return `<div class="card"><div class="row sp"><h3>Hábitos de hoy</h3>${hs ? `<span class="tag ok">🔥 ${hs} día${hs === 1 ? '' : 's'}</span>` : ''}</div>
    ${ids.map((h) => `<button class="hab ${st.done.includes(h) ? 'on' : ''}" data-act="hab" data-h="${h}"><span class="hi">${HABITS[h][0]}</span><span class="hl">${esc(HABITS[h][1])}</span><span class="hc">${st.done.includes(h) ? '✓' : ''}</span></button>`).join('')}
    <div class="row sp" style="margin-top:10px"><div class="dots">${dots}</div><small class="mute">${n}/${ids.length} hoy</small></div></div>`;
}
function viewHoy() {
  const r = D.routine, days = r?.days || [], idx = nextDayIdx(), day = days[idx];
  const next = D.appointments[0];
  const needIntake = !D.client.age || !D.client.height || !D.client.sex;
  const lastC = checkins()[0], needCheck = !lastC || (Date.now() - new Date(lastC.created_at)) / 864e5 > 6;
  const planned = days.length || 0, done = weekWorkouts();
  const wk = (() => { const p = r?.program?.weeks, s = D.client.programStart; if (!p?.length || !s) return null; const n = Math.max(0, Math.floor((Date.now() - new Date(s + 'T12:00').getTime()) / (7 * 864e5))); return { n: n + 1, w: p[n % p.length] }; })();
  const lastCoach = D.logs.find((l) => l.kind === 'message' && l.data.from !== 'client');
  const saved = lget('run', null), canResume = saved && Date.now() - saved.start < 14 * 36e5 && days[saved.di];
  const showTip = !lget('tip', false) && !matchMedia('(display-mode: standalone)').matches;
  const st = streakWeeks(), ids = habitIds(), hst = habitState(today());
  const meals = D.diet?.days?.[Math.min(dietDay, D.diet.days.length - 1)]?.meals || [], mDone = (hst.meals || []).filter((k) => k.startsWith(dietDay + '-')).length;
  const hour = new Date().getHours();
  return `${header()}<div class="hero"><h1>${hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'}, ${esc(first(D.client.name))}</h1><p>${esc(D.client.goal || 'Vamos por tu objetivo')}</p></div>
  ${planned ? `<div class="card rings"><div class="row sp" style="margin-bottom:6px"><h3>Tu semana</h3>${st.streak ? `<span class="tag ok">🔥 Racha ${st.streak} sem</span>` : '<span class="tag">Empieza tu racha</span>'}</div>
    <div class="ringrow">${ring(done, planned, 'Entrenos')}${ids.length ? ring(ids.filter((h) => hst.done.includes(h)).length, ids.length, 'Hábitos hoy') : ''}${meals.length ? ring(mDone, meals.length, 'Comidas hoy') : ''}</div></div>` : ''}
  ${canResume ? `<div class="card accent"><h3>Tienes un entrenamiento sin terminar</h3><p class="mute small">${esc(days[saved.di].name)} · empezado ${new Date(saved.start).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p><div class="row"><button class="pri grow" data-act="resume">Continuar</button><button class="grow" data-act="discard">Descartar</button></div></div>` : ''}
  ${lastCoach ? `<div class="card accent"><div class="small mute">MENSAJE DE TU ENTRENADOR</div><p style="margin:6px 0 0">${esc(lastCoach.data.text)}</p></div>` : ''}
  ${wk ? `<div class="card"><div class="small mute">TU SEMANA ${wk.n} DEL PROGRAMA</div><h3 style="margin-top:2px">${esc(wk.w.label)} · RIR ${esc(wk.w.rir)}</h3><p class="mute small" style="margin:4px 0 0">${esc(wk.w.note)}</p></div>` : ''}
  ${next ? `<div class="card accent"><div class="small mute">PRÓXIMA SESIÓN</div><h2 style="margin-top:4px">${fdate(next.date)} · ${esc(next.time)}</h2><div class="mute">${next.duration || 60} min${next.notes ? ' · ' + esc(next.notes) : ''}</div></div>` : ''}
  ${needIntake ? `<div class="card"><h3>Completa tu ficha</h3><p class="mute small">Ayuda a tu entrenador a ajustar tu plan (datos, lesiones y salud). Toma 2 minutos.</p><button class="pri block" data-act="intake">Llenar ficha</button></div>` : ''}
  ${day ? `<div class="card"><div class="row sp"><div><div class="small mute">TOCA HOY</div><h2>${esc(day.name)}</h2></div><span class="tag">${day.items.length} ejercicios</span></div>
     <div style="margin:8px 0 14px">${day.items.slice(0, 4).map((it) => { const e = ex(it.exId); return `<div class="ex">${thumb(e)}<div class="b"><b>${esc(e?.name || '—')}</b><small>${esc(e?.muscle || '')}</small></div><div class="r">${it.sets}×${esc(it.reps)}</div></div>`; }).join('')}${day.items.length > 4 ? `<div class="small mute" style="padding-top:8px">+ ${day.items.length - 4} más</div>` : ''}</div>
     <button class="pri block" data-act="start" data-d="${idx}">Empezar entrenamiento</button></div>`
  : `<div class="card"><h3>Aún no tienes rutina</h3><p class="mute">Tu entrenador te asignará una pronto. Mientras tanto, completa tu ficha y tu check-in.</p></div>`}
  ${habitsCard()}
  ${showTip ? `<div class="card"><div class="row sp"><h3>Ten tu plan en el celular</h3><button class="sm ghost" data-act="hidetip">✕</button></div><p class="mute small">Abre esta página en el navegador y toca <b>Compartir → Añadir a pantalla de inicio</b> (iPhone) o <b>⋮ → Instalar app</b> (Android). Así abre como una app y funciona aunque no haya señal en el gimnasio.</p></div>` : ''}
  <div class="card"><div class="row sp"><div><h3>¿Dudas o molestias?</h3><p class="mute small" style="margin:2px 0 0">Escríbele a tu entrenador.</p></div><button data-act="msg">Escribir</button></div></div>
  ${needCheck ? `<div class="card"><h3>Check-in semanal</h3><p class="mute small">Cuéntale a tu entrenador cómo vas: ánimo, energía, sueño y molestias.</p><button class="block" data-act="checkin">Hacer check-in</button></div>` : ''}`;
}
function viewRutina() {
  const r = D.routine;
  if (!r) return `${header()}<div class="hero"><h1>Mi rutina</h1></div><div class="card"><p class="mute">Todavía no tienes una rutina asignada.</p></div>`;
  return `${header()}<div class="hero"><h1>${esc(r.name)}</h1><p>${esc(r.goal || '')}</p></div>
  ${r.program?.weeks?.length ? `<div class="card"><h3>Cómo avanza</h3>${r.program.weeks.map((w) => `<div class="meal"><b>${esc(w.label)} <span class="tag">RIR ${esc(w.rir)}</span></b><small>${esc(w.note)}</small></div>`).join('')}<p class="small mute">RIR = repeticiones que te quedan "en reserva". RIR 2 es que podrías hacer 2 más con buena técnica.</p></div>` : ''}
  ${r.days.map((d, i) => `<div class="card"><div class="row sp"><h2>${esc(d.name)}</h2><button class="sm pri" data-act="start" data-d="${i}">Empezar</button></div>${d.items.map((it) => { const e = ex(it.exId); return `<div class="ex" data-act="exinfo" data-id="${it.exId}">${thumb(e)}<div class="b"><b>${it.sup ? `<span class="tag">${esc(it.sup)}</span> ` : ''}${esc(e?.name || '—')}</b><small>${esc(e?.muscle || '')}${it.note ? ' · ' + esc(it.note) : ''}</small></div><div class="r">${it.sets}×${esc(it.reps)}<small style="display:block">${esc(it.rest)}</small></div></div>`; }).join('')}</div>`).join('')}`;
}
function viewComida() {
  const d = D.diet;
  if (!d) return `${header()}<div class="hero"><h1>Mi nutrición</h1></div><div class="card"><p class="mute">Todavía no tienes un plan de alimentación asignado.</p></div>`;
  const di = Math.min(dietDay, d.days.length - 1), day = d.days[di], hst = habitState(today());
  const tot = (day.meals || []).reduce((a, m) => a + (m.items || []).reduce((b, it) => b + itemKcal(it), 0), 0);
  const eaten = (day.meals || []).reduce((a, m, mi) => a + ((hst.meals || []).includes(`${di}-${mi}`) ? (m.items || []).reduce((b, it) => b + itemKcal(it), 0) : 0), 0);
  const tg = day.target?.kcal || d.kcal;
  return `${header()}<div class="hero"><h1>Mi nutrición</h1><p>${d.kcal} kcal · P ${d.protein} g · C ${d.carbs} g · G ${d.fat} g</p></div>
  <div class="seg" style="margin-top:14px">${d.days.map((x, i) => `<button class="${i === dietDay ? 'on' : ''}" data-act="dday" data-i="${i}">${esc(x.name)}</button>`).join('')}</div>
  <div class="card"><div class="row sp"><b>${Math.round(eaten)} de ${Math.round(tot)} kcal comidas</b><span class="mute small">meta ${tg}</span></div><div class="bar"><i style="width:${Math.min(100, tot ? eaten / tot * 100 : 0)}%"></i></div><p class="mini mute" style="margin:2px 0 6px">Toca una comida cuando la hayas hecho.</p>
    ${day.meals.map((m, mi) => { const key = `${di}-${mi}`, ok = (hst.meals || []).includes(key); return `<div class="meal mealb ${ok ? 'on' : ''}" data-act="meal" data-k="${key}"><span class="mc">${ok ? '✓' : ''}</span><div class="mt"><b><span>${esc(m.name)}</span><small>${esc(m.time)}</small></b>${m.items ? `<ul>${m.items.map((it) => `<li>${esc(itemText(it))}</li>`).join('')}</ul>` : `<div class="mute">${esc(m.food || '')}</div>`}</div></div>`; }).join('')}</div>
  ${d.notes ? `<div class="card"><h3>Indicaciones</h3><p class="mute small" style="white-space:pre-line">${esc(d.notes)}</p></div>` : ''}`;
}
function viewProgreso() {
  const w = weights(), ws = workouts(), p = prs(), bc = badgeCtx(), un = BADGES.filter((b) => b[4](bc));
  return `${header()}<div class="hero"><h1>Mi progreso</h1></div>
  <div class="card"><div class="row sp"><h3>Logros</h3><span class="tag ok">${un.length}/${BADGES.length}</span></div><div class="badges">${BADGES.map((b) => { const ok = b[4](bc); return `<div class="bd ${ok ? 'on' : ''}" title="${esc(b[3])}"><span>${b[1]}</span><b>${esc(b[2])}</b><small>${ok ? '¡Logrado!' : esc(b[3])}</small></div>`; }).join('')}</div></div>
  <div class="card"><div class="row sp"><h3>Peso</h3><button class="sm" data-act="checkin">+ Registrar</button></div>${spark(w.map((x) => x.w))}${w.length ? `<p class="mute small">${w[0].w} → <b style="color:var(--ink)">${w.at(-1).w} kg</b> (${(w.at(-1).w - w[0].w).toFixed(1)} kg)</p>` : ''}</div>
  <div class="card"><div class="row sp"><h3>Mis fotos</h3><button class="sm" data-act="photo">+ Subir foto</button></div>${(D.photos || []).length ? `<div class="photos">${D.photos.map((f) => `<figure><img src="${esc(f.url)}" alt="" loading="lazy"><figcaption>${fdate(f.date)} · ${esc(f.pose || '')}</figcaption></figure>`).join('')}</div>` : '<p class="mute small">Sube una foto de frente, perfil y espalda cada 2 a 4 semanas. Solo la ve tu entrenador.</p>'}</div>
  <div class="card"><h3 style="margin-bottom:8px">Mis mejores levantamientos</h3>${p.length ? p.map((x) => `<div class="ex"><div class="b"><b>${esc(x.name)}</b><small>mejor serie</small></div><div class="r">${x.kg} kg × ${x.reps}</div></div>`).join('') : '<p class="mute small">Registra tus series al entrenar y aquí verás tus récords.</p>'}</div>
  <div class="card"><h3 style="margin-bottom:8px">Entrenamientos recientes</h3>${ws.slice(0, 8).map((x) => `<div class="ex"><div class="b"><b>${esc(x.data.dayName || 'Entrenamiento')}</b><small>${fdate(wDate(x))} · ${x.data.durationMin || '?'} min${x.data.rpe ? ' · esfuerzo ' + x.data.rpe + '/10' : ''}</small></div><div class="r"><span class="tag ok">${(x.data.entries || []).length} ejercicios</span></div></div>`).join('') || '<p class="mute small">Aún no has registrado entrenamientos.</p>'}</div>
  ${D.logs.filter((l) => l.kind === 'message').length ? `<div class="card"><h3 style="margin-bottom:8px">Mensajes</h3>${D.logs.filter((l) => l.kind === 'message').slice(0, 6).map((m) => `<div class="meal"><b><span>${m.data.from === 'client' ? 'Tú' : 'Tu entrenador'}</span><small>${fdate(m.created_at.slice(0, 10))}</small></b><div class="mute" style="color:#c3cde2">${esc(m.data.text)}</div></div>`).join('')}</div>` : ''}`;
}
function render() {
  const v = { hoy: viewHoy, rutina: viewRutina, comida: viewComida, progreso: viewProgreso }[tab]();
  $('#app').innerHTML = v + `<footer class="legal">Orientación de entrenamiento y alimentación. No sustituye valoración médica.<br><a href="privacidad.html">Privacidad</a> · <a href="terminos.html">Términos</a></footer><nav class="tabs"><div>${[['hoy', 'Hoy'], ['rutina', 'Rutina'], ['comida', 'Comida'], ['progreso', 'Progreso']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="tab" data-k="${k}">${svg(k)}${l}</button>`).join('')}</div></nav>`;
}

// ---------- sesión de entrenamiento ----------
function openRun(di, saved) {
  const d = D.routine.days[di], hb = histBest();
  run = { day: d, start: Date.now(), hb, prs: [], entries: d.items.map((it) => {
    const last = lastSets(it.exId), sug = suggest(it);
    return { it, sug, orig: it.exId, sets: Array.from({ length: Math.max(1, +it.sets || 3) }, (_, i) => ({ kg: sug ? sug.kg : (last?.[i]?.kg ?? last?.at(-1)?.kg ?? ''), reps: sug ? '' : (last?.[i]?.reps ?? ''), done: false })) };
  }) };
  run.di = di;
  if (saved && saved.sets?.length === run.entries.length) { run.start = saved.start; run.entries.forEach((en, i) => { en.sets = saved.sets[i]; if (saved.swaps?.[i]) { en.it = { ...en.it, exId: saved.swaps[i] }; } }); }
  drawRun(); clearInterval(clock); clock = setInterval(tickClock, 1000);
}
const saveRun = () => { if (run) lset('run', { di: run.di, start: run.start, sets: run.entries.map((e) => e.sets), swaps: run.entries.map((e) => (e.it.exId !== e.orig ? e.it.exId : null)) }); };
const tickClock = () => { const el = $('#clk'); if (el && run) { const s = Math.floor((Date.now() - run.start) / 1000); el.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; } };
function drawRun() {
  const sh = $('#sheet'); sh.hidden = false; document.body.style.overflow = 'hidden';
  sh.innerHTML = `<div class="shead"><button class="sm ghost" data-act="runclose">✕</button><h2>${esc(run.day.name)}</h2><span class="clock" id="clk">00:00</span></div>
  ${run.entries.map((en, ei) => { const e = ex(en.it.exId), last = lastSets(en.it.exId), all = en.sets.every((s) => s.done), swapped = en.it.exId !== en.orig, hasAlts = (D.alts?.[en.orig] || []).length > 0; return `<div class="wex ${all ? 'done' : ''}"><div class="im" data-act="exinfo" data-id="${en.it.exId}">${e?.images?.[0] ? `<img src="${e.images[0]}" alt="" onerror="this.remove()">` : `<span class="th ph">${esc((e?.name || '?')[0])}</span>`}<div class="t"><b>${en.it.sup ? `<span class="tag">${esc(en.it.sup)}</span> ` : ''}${esc(e?.name || '—')}</b><small>${en.it.sets} × ${esc(en.it.reps)} · descanso ${esc(en.it.rest)}${en.it.note ? ' · ' + esc(en.it.note) : ''}</small>${swapped ? '<small class="up">↻ Ejercicio cambiado</small>' : ''}${en.sug && !swapped ? `<small class="up">↑ Sube a ${en.sug.kg} kg: completaste ${en.sug.top} reps con ${en.sug.from} kg</small>` : ''}${en.pr ? '<small class="up">🏆 ¡Récord personal!</small>' : ''}</div><span class="mute">ⓘ</span></div>
    <div class="sets"><div class="shd"><span>Serie</span><span>Kg</span><span>Reps</span><span></span></div>${en.sets.map((s, si) => `<div class="srow ${s.done ? 'done' : ''}"><span class="n">${si + 1}</span><input inputmode="decimal" placeholder="kg" value="${esc(s.kg)}" data-e="${ei}" data-s="${si}" data-f="kg"><input inputmode="numeric" placeholder="${esc(String(en.it.reps).split('-')[0].replace(/\D/g, '') || 'reps')}" value="${esc(s.reps)}" data-e="${ei}" data-s="${si}" data-f="reps"><button class="ok" data-act="setdone" data-e="${ei}" data-s="${si}">${s.done ? '✓' : ''}</button></div>`).join('')}
    ${last ? `<div class="prev">Última vez: ${last.map((s) => `${s.kg || '–'}×${s.reps || '–'}`).join(' · ')}</div>` : ''}
    ${hasAlts ? `<button class="swapb" data-act="swap" data-e="${ei}">↻ No puedo hacer este ejercicio</button>` : ''}</div></div>`; }).join('')}
  <div class="fin"><div><button class="pri block" data-act="finish">Terminar entrenamiento</button></div></div><div id="restbox"></div>`;
  tickClock(); saveRun();
}
function startRest(sec) {
  clearInterval(timer); let left = sec;
  const draw = () => { const b = $('#restbox'); if (!b) return clearInterval(timer); b.innerHTML = `<div class="rest"><b>${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</b><span>Descanso</span><button data-act="skiprest">Saltar</button></div>`; };
  draw();
  timer = setInterval(() => { left--; if (left <= 0) { clearInterval(timer); const b = $('#restbox'); if (b) b.innerHTML = ''; buzz([200, 100, 200]); toast('¡Listo! Siguiente serie 💪'); } else draw(); }, 1000);
}
function closeRun() { ldel('run'); clearInterval(timer); clearInterval(clock); run = null; $('#sheet').hidden = true; $('#sheet').innerHTML = ''; document.body.style.overflow = ''; }
function checkPR(en, s) {
  const kg = +s.kg, reps = +s.reps; if (!(kg > 0 && reps > 0)) return;
  const e1 = e1rm(kg, reps), prev = run.hb[en.it.exId];
  if (prev && e1 > prev + 0.01) { run.hb[en.it.exId] = e1; en.pr = true; if (!run.prs.find((p) => p.exId === en.it.exId)) run.prs.push({ exId: en.it.exId, name: ex(en.it.exId)?.name || '', kg, reps }); else Object.assign(run.prs.find((p) => p.exId === en.it.exId), { kg, reps }); buzz([60, 40, 60]); toast(`🏆 ¡Récord personal en ${ex(en.it.exId)?.name || 'este ejercicio'}!`); }
  else if (!prev) run.hb[en.it.exId] = e1; // primera marca: base
}

// ---------- celebración, compartir ----------
function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = [getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c6f432', '#ffffff', '#7ea2ff', '#ff6b6b', '#ffd166'];
  for (let i = 0; i < 46; i++) { const p = document.createElement('i'); p.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % cols.length]};animation-delay:${Math.random() * 0.6}s;animation-duration:${1.8 + Math.random() * 1.6}s;transform:rotate(${Math.random() * 360}deg)`; box.appendChild(p); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4200);
}
function summaryOf(data) {
  const sets = data.entries.reduce((a, e) => a + e.sets.length, 0), vol = Math.round(data.entries.reduce((a, e) => a + e.sets.reduce((b, s) => b + (+s.kg || 0) * (+s.reps || 0), 0), 0));
  return { sets, vol, min: data.durationMin, ex: data.entries.length };
}
function celebrate(data, prsList) {
  const sm = summaryOf(data), st = streakWeeks(), planned = D.routine?.days?.length || 0;
  window.__last = { data, sm, prsList, streak: st.streak };
  modal(`<div class="cele"><div class="big">🎉</div><h2>¡Entrenamiento completo!</h2><p class="mute">${esc(data.dayName)} · ${fdate(data.date)}</p>
    <div class="kpis"><div class="kpi"><b>${sm.min}</b><small>minutos</small></div><div class="kpi"><b>${sm.vol.toLocaleString('es-MX')}</b><small>kg de volumen</small></div><div class="kpi"><b>${sm.sets}</b><small>series</small></div></div>
    ${prsList.length ? `<div class="prbox"><b>🏆 ${prsList.length === 1 ? 'Nuevo récord' : prsList.length + ' récords nuevos'}</b>${prsList.map((p) => `<div>${esc(p.name)} · <b>${p.kg} kg × ${p.reps}</b></div>`).join('')}</div>` : ''}
    <p class="mute small" style="margin:12px 0">${planned ? `Llevas <b>${weekWorkouts()}</b> de <b>${planned}</b> entrenos esta semana${st.streak ? ` · racha de <b>${st.streak}</b> semana${st.streak === 1 ? '' : 's'} 🔥` : ''}.` : ''}</p>
    <button class="pri block" data-act="share">Compartir mi entreno</button><button class="block ghost" style="margin-top:8px" data-act="closemodal">Listo</button></div>`);
  confetti();
}
async function shareCard() {
  const L = window.__last; if (!L) return;
  try { await document.fonts?.ready; } catch { /* ok */ }
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c6f432';
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#101a33'); bg.addColorStop(1, '#070c18'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, 700); glow.addColorStop(0, accent + '55'); glow.addColorStop(1, 'transparent'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  const font = (w, s) => `${w} ${s}px 'Barlow Condensed','Arial Narrow',Impact,sans-serif`;
  g.fillStyle = '#fff'; g.font = font(800, 54); g.fillText((D.brand || 'C-LAB').toUpperCase(), 80, 120);
  g.fillStyle = accent; g.font = font(800, 110); g.fillText('ENTRENO', 80, 330); g.fillText('COMPLETO', 80, 440);
  g.fillStyle = '#9fb0cf'; g.font = `500 40px Inter, Arial, sans-serif`; g.fillText(`${first(D.client.name)} · ${L.data.dayName} · ${fdate(L.data.date)}`, 80, 510);
  const stats = [[L.sm.min, 'MINUTOS'], [L.sm.vol.toLocaleString('es-MX'), 'KG DE VOLUMEN'], [L.sm.sets, 'SERIES']];
  stats.forEach(([v, l], i) => { const x = 80 + i * 320; g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.roundRect(x, 580, 290, 210, 28); g.fill(); g.fillStyle = '#fff'; g.font = font(800, 92); g.fillText(String(v), x + 26, 690); g.fillStyle = '#9fb0cf'; g.font = `600 26px Inter, Arial, sans-serif`; g.fillText(l, x + 26, 750); });
  let y = 880;
  if (L.prsList.length) { g.fillStyle = accent; g.font = font(800, 64); g.fillText(L.prsList.length === 1 ? '🏆 NUEVO RÉCORD' : `🏆 ${L.prsList.length} RÉCORDS NUEVOS`, 80, y); y += 70; g.fillStyle = '#fff'; g.font = `600 40px Inter, Arial, sans-serif`; L.prsList.slice(0, 3).forEach((p) => { g.fillText(`${p.name} · ${p.kg} kg × ${p.reps}`, 80, y); y += 58; }); }
  else if (L.streak) { g.fillStyle = accent; g.font = font(800, 64); g.fillText(`🔥 RACHA DE ${L.streak} SEMANA${L.streak === 1 ? '' : 'S'}`, 80, y); }
  g.fillStyle = '#5d6b88'; g.font = `600 30px Inter, Arial, sans-serif`; g.fillText('Hecho con C-Lab', 80, H - 70);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const file = new File([blob], 'mi-entreno.png', { type: 'image/png' });
  try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Mi entreno' }); return; } } catch { /* cancelado */ }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mi-entreno.png'; a.click(); toast('Imagen descargada');
}

// ---------- modales ----------
function modal(html) { closeModal(); const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal'; m.innerHTML = `<div class="box">${html}</div>`; m.addEventListener('click', (e) => { if (e.target === m) m.remove(); }); document.body.appendChild(m); return m; }
const closeModal = () => $('#modal')?.remove();
function exInfo(id) {
  const e = ex(id); if (!e) return;
  modal(`<h2>${esc(e.name)}</h2><p class="mute small">${esc(e.muscle)}</p>${e.images?.length ? `<div class="imgs">${e.images.map((u) => `<img src="${u}" alt="" onerror="this.remove()">`).join('')}</div>` : ''}<h3>Cómo se hace</h3><p>${esc(e.desc)}</p><h3>Puntos clave</h3><p class="mute">${esc(e.cues)}</p><div class="kpis" style="grid-template-columns:1fr 1fr"><div class="kpi"><small>Más fácil</small><br>${esc(e.regress)}</div><div class="kpi"><small>Más difícil</small><br>${esc(e.progress)}</div></div>${safeUrl(e.video) ? `<p><a href="${esc(safeUrl(e.video))}" target="_blank" rel="noopener noreferrer">▶ Ver video</a></p>` : ''}<button class="block" style="margin-top:14px" data-act="closemodal">Cerrar</button>`);
}
const pills = (name, n = 5, sel = 4) => `<div class="pills" data-pills="${name}">${Array.from({ length: n }, (_, i) => `<div class="pill ${i + 1 === sel ? 'on' : ''}" data-v="${i + 1}">${i + 1}</div>`).join('')}</div>`;
function checkinForm() {
  modal(`<h2>Check-in semanal</h2><p class="mute small">Responde con sinceridad: es para ajustar tu plan.</p>
  <label class="fl">¿Qué tanto seguiste tu plan? (1 = nada, 5 = todo)</label>${pills('adherence')}
  <label class="fl">Energía (1 = muy baja, 5 = excelente)</label>${pills('energy')}
  <div class="row"><div class="grow"><label class="fl">Sueño (horas)</label><input id="ci-sleep" inputmode="decimal" placeholder="7.5"></div><div class="grow"><label class="fl">Peso hoy (kg)</label><input id="ci-w" inputmode="decimal" placeholder="Opcional"></div></div>
  <label class="fl">¿Molestias o dolor?</label><input id="ci-pain" placeholder="Ej. rodilla derecha al bajar escaleras">
  <label class="fl">Algo más que quieras contarle a tu entrenador</label><textarea id="ci-note"></textarea>
  <button class="pri block" style="margin-top:16px" data-act="sendcheckin">Enviar check-in</button>`);
}
function intakeForm() {
  const c = D.client;
  modal(`<h2>Mi ficha</h2><p class="mute small">Estos datos son privados y solo los ve tu entrenador.</p>
  <div class="row"><div class="grow"><label class="fl">Edad</label><input id="in-age" inputmode="numeric" value="${esc(c.age || '')}"></div><div class="grow"><label class="fl">Sexo</label><select id="in-sex"><option value="m" ${c.sex === 'm' ? 'selected' : ''}>Hombre</option><option value="f" ${c.sex === 'f' ? 'selected' : ''}>Mujer</option></select></div></div>
  <div class="row"><div class="grow"><label class="fl">Estatura (cm)</label><input id="in-h" inputmode="numeric" value="${esc(c.height || '')}"></div><div class="grow"><label class="fl">Peso (kg)</label><input id="in-w" inputmode="decimal"></div></div>
  <label class="fl">Tu objetivo principal</label><input id="in-goal" value="${esc(c.goal || '')}" placeholder="Ej. bajar grasa, ganar fuerza, mejorar velocidad…">
  <label class="fl">Lesiones o limitaciones</label><div class="chk" id="in-inj">${['rodilla', 'hombro', 'espalda', 'muñeca', 'codo', 'impacto'].map((x) => `<label><input type="checkbox" value="${x}" ${(c.injuries || []).includes(x) ? 'checked' : ''}>${x}</label>`).join('')}</div>
  <label class="fl">Días por semana que puedes entrenar</label><input id="in-days" inputmode="numeric" placeholder="3">
  <label class="fl">Equipo que tienes</label><div class="chk" id="in-eq">${['mancuernas', 'barra', 'kettlebell', 'banda', 'banco', 'polea', 'máquina', 'balón medicinal'].map((x) => `<label><input type="checkbox" value="${x}">${x}</label>`).join('')}</div>
  <label class="fl">Alimentos que evitas (alergias o preferencias)</label><div class="chk" id="in-food">${['lácteos', 'gluten', 'huevo', 'pescado', 'mariscos', 'nueces', 'soya', 'res', 'cerdo', 'carne'].map((x) => `<label><input type="checkbox" value="${x}">${x === 'carne' ? 'toda carne' : x}</label>`).join('')}</div>
  <label class="fl">Salud (marca las que sean SÍ)</label><div class="chk" id="in-parq" style="flex-direction:column;flex-wrap:nowrap">${PARQ.map((q, i) => `<label style="border-radius:12px"><input type="checkbox" value="${i}">${q}</label>`).join('')}</div>
  <label class="fl">Notas (cirugías, medicamentos, deporte que practicas…)</label><textarea id="in-notes"></textarea>
  <button class="pri block" style="margin-top:16px" data-act="sendintake">Enviar ficha</button>`);
}
function swapModal(ei) {
  const en = run.entries[ei], alts = (D.alts?.[en.orig] || []).map(ex).filter(Boolean);
  modal(`<h2>Cambiar ejercicio</h2><p class="mute small">Opciones parecidas, compatibles con tus lesiones y tu equipo. Tu entrenador verá el cambio.</p>
    ${en.it.exId !== en.orig ? `<button class="block ghost" data-act="swapto" data-e="${ei}" data-id="${esc(en.orig)}">↩ Volver al ejercicio original (${esc(ex(en.orig)?.name || '')})</button>` : ''}
    ${alts.map((a) => `<button class="altb" data-act="swapto" data-e="${ei}" data-id="${esc(a.id)}">${thumb(a)}<span><b>${esc(a.name)}</b><small>${esc(a.muscle)}</small></span></button>`).join('')}
    <button class="block" style="margin-top:12px" data-act="closemodal">Cancelar</button>`);
}
const photoPoseModal = () => modal(`<h2>Foto de progreso</h2><label class="fl">¿Qué pose es?</label><div class="pills" data-pills="pose">${['Frente', 'Perfil', 'Espalda', 'Otra'].map((p, i) => `<div class="pill ${i === 0 ? 'on' : ''}" data-v="${p}">${p}</div>`).join('')}</div><label class="drop">📷 Elegir o tomar foto<input type="file" id="ph-file" accept="image/*" hidden></label><p class="mini mute">Solo la verá tu entrenador. Se sube comprimida.</p>`);
const checked = (sel) => [...document.querySelectorAll(`${sel} input:checked`)].map((i) => i.value);
const pillVal = (n) => +(document.querySelector(`[data-pills=${n}] .pill.on`)?.dataset.v || 0);

async function compress(file, max = 1280, q = 0.82) {
  const bmp = await createImageBitmap(file); const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob(r, 'image/jpeg', q));
}
async function uploadPhoto(file, pose) {
  toast('Subiendo foto…');
  const blob = await compress(file); const { path, token: upTok } = await api('photo-url');
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
  const { error } = await createClient(SB_URL, SB_KEY).storage.from('client-files').uploadToSignedUrl(path, upTok, blob, { contentType: 'image/jpeg' });
  if (error) throw new Error('No se pudo subir la foto');
  await api('log', 'photo', { path, pose, date: today() });
}

const queue = (kind, data) => { const q = lget('q', []).filter((it) => !(kind === 'habits' && it.kind === 'habits' && it.data.date === data.date)); q.push({ kind, data }); lset('q', q); };
async function flushQueue() {
  const q = lget('q', []); if (!q.length) return;
  const rest = []; let sent = 0;
  for (const it of q) { try { await api('log', it.kind, it.data); sent++; } catch (e) { if (e.net) rest.push(it); } }
  lset('q', rest);
  if (sent) { toast(`Se enviaron ${sent} registro(s) pendientes ✓`); await load(false); }
}
window.addEventListener('online', async () => { await flushQueue(); await load(false); });
async function send(kind, data, ok) {
  try { await api('log', kind, data); closeModal(); toast(ok); await load(false); }
  catch (e) { if (e.net) { queue(kind, data); closeModal(); toast('Sin internet: se enviará cuando tengas señal'); } else toast(e.message); }
}
function pushHabits() {
  clearTimeout(habT);
  habT = setTimeout(async () => { const st = lget('hab', null); if (!st) return; try { await api('log', 'habits', st); } catch (e) { if (e.net) queue('habits', st); } }, 900);
}
function toggleHabit(kind, key) {
  const st = habitState(today()); const arr = st[kind]; const i = arr.indexOf(key);
  if (i >= 0) arr.splice(i, 1); else { arr.push(key); buzz(20); }
  lset('hab', st); render(); pushHabits();
}

// ---------- tour de bienvenida ----------
function tour() {
  const slides = [['🏋️', 'Hoy: tu entrenamiento', 'Abre tu rutina del día, con imágenes de cada ejercicio y cómo hacerlo.'], ['🏆', 'Registra y celebra', 'Anota peso y repeticiones. El descanso corre solo y te avisamos cuando rompes un récord.'], ['📈', 'Mira tu progreso', 'Rachas, logros, peso y fotos. Tu entrenador ve tu avance y te ajusta el plan.']];
  let i = 0;
  const draw = () => modal(`<div class="cele"><div class="big">${slides[i][0]}</div><h2>${slides[i][1]}</h2><p class="mute">${slides[i][2]}</p><div class="dots" style="justify-content:center;margin:14px 0">${slides.map((_, k) => `<i class="dot ${k === i ? 'on' : ''}"></i>`).join('')}</div><button class="pri block" data-act="tournext">${i < slides.length - 1 ? 'Siguiente' : '¡Empezar!'}</button></div>`);
  window.__tour = () => { if (i < slides.length - 1) { i++; draw(); } else { closeModal(); lset('tour', true); } };
  draw();
}

// ---------- eventos ----------
document.addEventListener('click', async (e) => {
  const p = e.target.closest('.pill'); if (p) { p.parentElement.querySelectorAll('.pill').forEach((x) => x.classList.toggle('on', x === p)); return; }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act;
  if (a === 'tab') { tab = el.dataset.k; render(); window.scrollTo(0, 0); }
  else if (a === 'dday') { dietDay = +el.dataset.i; render(); }
  else if (a === 'start') openRun(+el.dataset.d);
  else if (a === 'runclose') { if (confirm('¿Salir sin guardar este entrenamiento?')) closeRun(); }
  else if (a === 'exinfo') exInfo(el.dataset.id);
  else if (a === 'closemodal') closeModal();
  else if (a === 'tournext') window.__tour();
  else if (a === 'resume') { const sv = lget('run', null); if (sv) openRun(sv.di, sv); }
  else if (a === 'discard') { ldel('run'); render(); }
  else if (a === 'hidetip') { lset('tip', true); render(); }
  else if (a === 'hab') toggleHabit('done', el.dataset.h);
  else if (a === 'meal') toggleHabit('meals', el.dataset.k);
  else if (a === 'msg') modal(`<h2>Mensaje a tu entrenador</h2><textarea id="m-text" placeholder="Escribe tu duda, molestia o cambio de horario…"></textarea><button class="pri block" style="margin-top:14px" data-act="sendmsg">Enviar</button>`);
  else if (a === 'sendmsg') { const t = $('#m-text').value.trim(); if (!t) return toast('Escribe un mensaje'); send('message', { text: t }, 'Mensaje enviado ✓'); }
  else if (a === 'checkin') checkinForm();
  else if (a === 'intake') intakeForm();
  else if (a === 'photo') photoPoseModal();
  else if (a === 'share') shareCard();
  else if (a === 'swap') swapModal(+el.dataset.e);
  else if (a === 'swapto') {
    const en = run.entries[+el.dataset.e], id = el.dataset.id, was = en.it.exId; run.prs = run.prs.filter((p) => p.exId !== was); en.it = { ...en.it, exId: id }; delete en.sug; en.pr = false;
    const last = lastSets(id); if (last) en.sets.forEach((s, i) => { s.kg = last[i]?.kg ?? last.at(-1)?.kg ?? ''; s.reps = ''; s.done = false; }); else en.sets.forEach((s) => { s.kg = ''; s.reps = ''; s.done = false; });
    closeModal(); const y = $('#sheet').scrollTop; drawRun(); $('#sheet').scrollTop = y; toast('Ejercicio cambiado');
  }
  else if (a === 'skiprest') { clearInterval(timer); $('#restbox').innerHTML = ''; }
  else if (a === 'setdone') {
    const en = run.entries[+el.dataset.e], s = en.sets[+el.dataset.s]; s.done = !s.done;
    if (s.done && !s.reps) { const t = parseInt(String(en.it.reps), 10); if (t) s.reps = String(t); }
    if (s.done) { buzz(25); checkPR(en, s); }
    const y = $('#sheet').scrollTop; drawRun(); $('#sheet').scrollTop = y;
    if (s.done) startRest(parseRest(en.it.rest));
  }
  else if (a === 'finish') {
    const doneSets = run.entries.reduce((n, en) => n + en.sets.filter((s) => s.done || (s.kg && s.reps)).length, 0);
    if (!doneSets) return toast('Marca al menos una serie');
    modal(`<h2>¡Buen trabajo!</h2><label class="fl">¿Qué tan duro estuvo? (1 = muy fácil, 10 = máximo)</label>${pills('rpe', 10, 7)}<label class="fl">Nota para tu entrenador (opcional)</label><textarea id="w-note" placeholder="Cómo te sentiste, molestias, etc."></textarea><button class="pri block" style="margin-top:16px" data-act="sendworkout">Guardar entrenamiento</button>`);
  }
  else if (a === 'sendworkout') {
    const entries = run.entries.map((en) => ({ exId: en.it.exId, name: ex(en.it.exId)?.name || '', ...(en.it.exId !== en.orig ? { swappedFrom: en.orig, swappedFromName: ex(en.orig)?.name || '' } : {}), sets: en.sets.filter((s) => s.done || (s.kg && s.reps)).map((s) => ({ kg: s.kg, reps: s.reps })) })).filter((en) => en.sets.length);
    const data = { dayName: run.day.name, date: today(), durationMin: Math.max(1, Math.round((Date.now() - run.start) / 60000)), rpe: pillVal('rpe'), note: ($('#w-note')?.value || '').trim(), entries };
    const prsList = [...run.prs];
    try { await api('log', 'workout', data); closeModal(); closeRun(); await load(false); tab = 'hoy'; render(); celebrate(data, prsList); }
    catch (err) { if (err.net) { queue('workout', data); closeModal(); closeRun(); toast('Sin internet: se guardó en tu teléfono y se enviará solo'); render(); } else toast(err.message); }
  }
  else if (a === 'sendcheckin') send('checkin', { adherence: pillVal('adherence'), energy: pillVal('energy'), sleep: $('#ci-sleep').value.trim(), weight: $('#ci-w').value.trim(), pain: $('#ci-pain').value.trim(), note: $('#ci-note').value.trim() }, 'Check-in enviado ✓');
  else if (a === 'sendintake') send('intake', { age: $('#in-age').value.trim(), sex: $('#in-sex').value, height: $('#in-h').value.trim(), weight: $('#in-w').value.trim(), goal: $('#in-goal').value.trim(), injuries: checked('#in-inj'), days: $('#in-days').value.trim(), equipment: checked('#in-eq'), foodsAvoid: checked('#in-food'), parq: checked('#in-parq'), notes: $('#in-notes').value.trim() }, 'Ficha enviada ✓');
});
document.addEventListener('input', (e) => {
  const t = e.target; if (t.dataset?.f && run) { run.entries[+t.dataset.e].sets[+t.dataset.s][t.dataset.f] = t.value; saveRun(); }
});
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'ph-file' || !e.target.files[0]) return;
  const pose = document.querySelector('[data-pills=pose] .pill.on')?.dataset.v || 'Otra', file = e.target.files[0];
  closeModal();
  try { await uploadPhoto(file, pose); toast('Foto subida ✓'); await load(false); } catch (err) { toast(err.net ? 'Necesitas internet para subir fotos' : err.message); }
});

async function load(first) {
  if (!token) { $('#app').innerHTML = '<div class="err"><h2>Falta el enlace</h2><p class="mute">Abre el enlace que te envió tu entrenador.</p></div>'; return; }
  try { D = await api('get'); offline = false; lset('d', D); }
  catch (e) {
    const cached = e.net ? lget('d', null) : null;
    if (cached) { D = cached; offline = true; }
    else { if (first) $('#app').innerHTML = `<div class="err"><h2>No pudimos abrir tu plan</h2><p class="mute">${esc(e.message)}</p></div>`; return; }
  }
  D.alts ||= {}; D.habitLogs ||= []; D.photos ||= [];
  document.title = `${D.brand || 'C-Lab'} · Mi plan`; applyBrand();
  if (!run) render();
  if (first && !lget('tour', false) && !workouts().length) tour();
}
load(true).then(flushQueue);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
