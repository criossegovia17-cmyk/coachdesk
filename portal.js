// Portal del cliente C-Lab: ver rutina, registrar series, ver menú, check-ins y ficha inicial. Sin cuentas: entra con su enlace.
const API = 'https://qqgdbdbdfecppehwyezm.supabase.co/functions/v1/portal';
const token = new URLSearchParams(location.search).get('t') || '';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const fdate = (s) => new Date(s + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
const IC = { hoy: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10', rutina: 'M6.5 6.5v11 M17.5 6.5v11 M3 9v6 M21 9v6 M6.5 12h11', comida: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12', progreso: 'M3 3v18h18 M7 14l4-4 3 3 5-6' };
const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[n]}"/></svg>`;
const PARQ = ['¿Algún médico te dijo que tienes un problema del corazón o presión alta?', '¿Sientes dolor en el pecho al hacer actividad física?', '¿Has sentido dolor en el pecho en reposo en el último mes?', '¿Pierdes el equilibrio por mareo o has perdido el conocimiento?', '¿Tienes un problema de huesos o articulaciones que empeora con el ejercicio?', '¿Tomas medicamentos para la presión o el corazón?', '¿Sabes de otra razón por la que no deberías hacer ejercicio?'];

let D = null, tab = 'hoy', dietDay = 0, run = null, timer = null, clock = null, offline = false;
const K = (n) => `clab-${n}-${token.slice(0, 12)}`;
const lget = (n, d) => { try { return JSON.parse(localStorage.getItem(K(n))) ?? d; } catch { return d; } };
const lset = (n, v) => { try { localStorage.setItem(K(n), JSON.stringify(v)); } catch { /* sin espacio */ } };
const ldel = (n) => { try { localStorage.removeItem(K(n)); } catch { /* ok */ } };
const toast = (m) => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 2300); };
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
const thumb = (e) => (e?.images?.[0] ? `<img class="th" loading="lazy" src="${e.images[0]}" alt="" onerror="this.remove()">` : `<span class="th ph">${esc((e?.name || '?')[0])}</span>`);
const first = (n) => String(n || '').split(' ')[0];
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '')) ? u : '');

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
const weekWorkouts = () => { const d = new Date(); const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); mon.setHours(0, 0, 0, 0); return workouts().filter((w) => new Date(w.created_at) >= mon).length; };
const weights = () => {
  const a = (D.client.measures || []).filter((m) => m.weight !== '' && m.weight != null).map((m) => ({ d: m.date, w: +m.weight }));
  checkins().forEach((c) => { if (c.data.weight) a.push({ d: c.created_at.slice(0, 10), w: +c.data.weight }); });
  return a.sort((x, y) => x.d.localeCompare(y.d));
};
function spark(vals) {
  if (vals.length < 2) return '<p class="mute small">Cuando registres 2 pesos o más verás tu gráfica aquí.</p>';
  const W = 400, H = 96, mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * (W - 20) + 10, H - 12 - ((v - mn) / r) * (H - 24)]);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}"><polyline fill="none" stroke="#c6f432" stroke-width="3" stroke-linejoin="round" points="${pts.map((p) => p.join(',')).join(' ')}"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#c6f432"/>`).join('')}</svg>`;
}
const prs = () => {
  const best = {};
  workouts().forEach((w) => (w.data.entries || []).forEach((e) => (e.sets || []).forEach((s) => { const kg = +s.kg, reps = +s.reps; if (!kg || !reps) return; const e1 = kg * (1 + reps / 30); if (!best[e.exId] || e1 > best[e.exId].e1) best[e.exId] = { e1, kg, reps, name: e.name }; })));
  return Object.values(best).sort((a, b) => b.e1 - a.e1).slice(0, 6);
};

// ---------- vistas ----------
function header() {
  return `<div class="top"><div class="brandrow"><svg width="34" height="34" viewBox="0 0 64 64"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#101a33"/><stop offset="1" stop-color="#070c18"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#b)"/><path d="M43.6 20.6A17.5 17.5 0 1 0 43.6 43.4" fill="none" stroke="#c6f432" stroke-width="7" stroke-linecap="round"/><path d="M21 33.5h7l3-9.5 4.2 17.5 3.3-8H55" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg><div><b>${esc(D.brand || 'C-Lab')}</b><small>Mi plan</small></div></div></div>${offline ? '<div class="offline">Sin conexión · estás viendo tu último plan guardado. Tus registros se enviarán solos al volver internet.</div>' : ''}`;
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
  return `${header()}<div class="hero"><h1>Hola, ${esc(first(D.client.name))}</h1><p>${esc(D.client.goal || 'Vamos por tu objetivo')}</p></div>
  ${canResume ? `<div class="card accent"><h3>Tienes un entrenamiento sin terminar</h3><p class="mute small">${esc(days[saved.di].name)} · empezado ${new Date(saved.start).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p><div class="row"><button class="pri grow" data-act="resume">Continuar</button><button class="grow" data-act="discard">Descartar</button></div></div>` : ''}
  ${lastCoach ? `<div class="card accent"><div class="small mute">MENSAJE DE TU ENTRENADOR</div><p style="margin:6px 0 0">${esc(lastCoach.data.text)}</p></div>` : ''}
  ${wk ? `<div class="card"><div class="small mute">TU SEMANA ${wk.n}</div><h3 style="margin-top:2px">${esc(wk.w.label)} · RIR ${esc(wk.w.rir)}</h3><p class="mute small" style="margin:4px 0 0">${esc(wk.w.note)}</p></div>` : ''}
  ${next ? `<div class="card accent"><div class="small mute">PRÓXIMA SESIÓN</div><h2 style="margin-top:4px">${fdate(next.date)} · ${esc(next.time)}</h2><div class="mute">${next.duration || 60} min${next.notes ? ' · ' + esc(next.notes) : ''}</div></div>` : ''}
  ${needIntake ? `<div class="card"><h3>Completa tu ficha</h3><p class="mute small">Ayuda a tu entrenador a ajustar tu plan (datos, lesiones y salud). Toma 2 minutos.</p><button class="pri block" data-act="intake">Llenar ficha</button></div>` : ''}
  ${day ? `<div class="card"><div class="row sp"><div><div class="small mute">TOCA HOY</div><h2>${esc(day.name)}</h2></div><span class="tag">${day.items.length} ejercicios</span></div>
     <div style="margin:8px 0 14px">${day.items.slice(0, 4).map((it) => { const e = ex(it.exId); return `<div class="ex">${thumb(e)}<div class="b"><b>${esc(e?.name || '—')}</b><small>${esc(e?.muscle || '')}</small></div><div class="r">${it.sets}×${esc(it.reps)}</div></div>`; }).join('')}${day.items.length > 4 ? `<div class="small mute" style="padding-top:8px">+ ${day.items.length - 4} más</div>` : ''}</div>
     <button class="pri block" data-act="start" data-d="${idx}">Empezar entrenamiento</button></div>
   <div class="card"><h3 style="margin-bottom:10px">Esta semana</h3><div class="kpis"><div class="kpi"><b>${done}</b><small>entrenos hechos</small></div><div class="kpi"><b>${planned}</b><small>en tu plan</small></div><div class="kpi"><b>${workouts().length}</b><small>en total</small></div></div></div>`
  : `<div class="card"><h3>Aún no tienes rutina</h3><p class="mute">Tu entrenador te asignará una pronto. Mientras tanto, completa tu ficha y tu check-in.</p></div>`}
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
  const day = d.days[Math.min(dietDay, d.days.length - 1)];
  const tot = (day.meals || []).reduce((a, m) => a + (m.items || []).reduce((b, it) => b + itemKcal(it), 0), 0);
  const tg = day.target?.kcal || d.kcal;
  return `${header()}<div class="hero"><h1>Mi nutrición</h1><p>${d.kcal} kcal · P ${d.protein} g · C ${d.carbs} g · G ${d.fat} g</p></div>
  <div class="seg" style="margin-top:14px">${d.days.map((x, i) => `<button class="${i === dietDay ? 'on' : ''}" data-act="dday" data-i="${i}">${esc(x.name)}</button>`).join('')}</div>
  <div class="card"><div class="row sp"><b>${Math.round(tot)} kcal este día</b><span class="mute small">meta ${tg}</span></div><div class="bar"><i style="width:${Math.min(100, tot / tg * 100)}%"></i></div>
    ${day.meals.map((m) => `<div class="meal"><b><span>${esc(m.name)}</span><small>${esc(m.time)}</small></b>${m.items ? `<ul>${m.items.map((it) => `<li>${esc(itemText(it))}</li>`).join('')}</ul>` : `<div class="mute">${esc(m.food || '')}</div>`}</div>`).join('')}</div>
  ${d.notes ? `<div class="card"><h3>Indicaciones</h3><p class="mute small" style="white-space:pre-line">${esc(d.notes)}</p></div>` : ''}`;
}
function viewProgreso() {
  const w = weights(), ws = workouts(), p = prs();
  return `${header()}<div class="hero"><h1>Mi progreso</h1></div>
  <div class="card"><div class="row sp"><h3>Peso</h3><button class="sm" data-act="checkin">+ Registrar</button></div>${spark(w.map((x) => x.w))}${w.length ? `<p class="mute small">${w[0].w} → <b style="color:var(--ink)">${w.at(-1).w} kg</b> (${(w.at(-1).w - w[0].w).toFixed(1)} kg)</p>` : ''}</div>
  <div class="card"><h3 style="margin-bottom:8px">Mis mejores levantamientos</h3>${p.length ? p.map((x) => `<div class="ex"><div class="b"><b>${esc(x.name)}</b><small>mejor serie</small></div><div class="r">${x.kg} kg × ${x.reps}</div></div>`).join('') : '<p class="mute small">Registra tus series al entrenar y aquí verás tus récords.</p>'}</div>
  <div class="card"><h3 style="margin-bottom:8px">Entrenamientos recientes</h3>${ws.slice(0, 8).map((x) => `<div class="ex"><div class="b"><b>${esc(x.data.dayName || 'Entrenamiento')}</b><small>${fdate(x.created_at.slice(0, 10))} · ${x.data.durationMin || '?'} min${x.data.rpe ? ' · esfuerzo ' + x.data.rpe + '/10' : ''}</small></div><div class="r"><span class="tag ok">${(x.data.entries || []).length} ejercicios</span></div></div>`).join('') || '<p class="mute small">Aún no has registrado entrenamientos.</p>'}</div>
  ${D.logs.filter((l) => l.kind === 'message').length ? `<div class="card"><h3 style="margin-bottom:8px">Mensajes</h3>${D.logs.filter((l) => l.kind === 'message').slice(0, 6).map((m) => `<div class="meal"><b><span>${m.data.from === 'client' ? 'Tú' : 'Tu entrenador'}</span><small>${fdate(m.created_at.slice(0, 10))}</small></b><div class="mute" style="color:#c3cde2">${esc(m.data.text)}</div></div>`).join('')}</div>` : ''}`;
}
function render() {
  const v = { hoy: viewHoy, rutina: viewRutina, comida: viewComida, progreso: viewProgreso }[tab]();
  $('#app').innerHTML = v + `<footer class="legal">Orientación de entrenamiento y alimentación. No sustituye valoración médica.<br><a href="privacidad.html">Privacidad</a> · <a href="terminos.html">Términos</a></footer><nav class="tabs"><div>${[['hoy', 'Hoy'], ['rutina', 'Rutina'], ['comida', 'Comida'], ['progreso', 'Progreso']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="tab" data-k="${k}">${svg(k)}${l}</button>`).join('')}</div></nav>`;
}

// ---------- sesión de entrenamiento ----------
function openRun(di, saved) {
  const d = D.routine.days[di];
  run = { day: d, start: Date.now(), entries: d.items.map((it) => {
    const last = lastSets(it.exId), sug = suggest(it);
    return { it, sug, sets: Array.from({ length: Math.max(1, +it.sets || 3) }, (_, i) => ({ kg: sug ? sug.kg : (last?.[i]?.kg ?? last?.at(-1)?.kg ?? ''), reps: sug ? '' : (last?.[i]?.reps ?? ''), done: false })) };
  }) };
  run.di = di;
  if (saved && saved.sets?.length === run.entries.length) { run.start = saved.start; run.entries.forEach((en, i) => { en.sets = saved.sets[i]; }); }
  drawRun(); clearInterval(clock); clock = setInterval(tickClock, 1000);
}
const saveRun = () => { if (run) lset('run', { di: run.di, start: run.start, sets: run.entries.map((e) => e.sets) }); };
const tickClock = () => { const el = $('#clk'); if (el && run) { const s = Math.floor((Date.now() - run.start) / 1000); el.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; } };
function drawRun() {
  const sh = $('#sheet'); sh.hidden = false; document.body.style.overflow = 'hidden';
  sh.innerHTML = `<div class="shead"><button class="sm ghost" data-act="runclose">✕</button><h2>${esc(run.day.name)}</h2><span class="clock" id="clk">00:00</span></div>
  ${run.entries.map((en, ei) => { const e = ex(en.it.exId), last = lastSets(en.it.exId), all = en.sets.every((s) => s.done); return `<div class="wex ${all ? 'done' : ''}"><div class="im" data-act="exinfo" data-id="${en.it.exId}">${e?.images?.[0] ? `<img src="${e.images[0]}" alt="" onerror="this.remove()">` : `<span class="th ph">${esc((e?.name || '?')[0])}</span>`}<div class="t"><b>${en.it.sup ? `<span class="tag">${esc(en.it.sup)}</span> ` : ''}${esc(e?.name || '—')}</b><small>${en.it.sets} × ${esc(en.it.reps)} · descanso ${esc(en.it.rest)}${en.it.note ? ' · ' + esc(en.it.note) : ''}</small>${en.sug ? `<small class="up">↑ Sube a ${en.sug.kg} kg: completaste ${en.sug.top} reps con ${en.sug.from} kg</small>` : ''}</div><span class="mute">ⓘ</span></div>
    <div class="sets"><div class="shd"><span>Serie</span><span>Kg</span><span>Reps</span><span></span></div>${en.sets.map((s, si) => `<div class="srow ${s.done ? 'done' : ''}"><span class="n">${si + 1}</span><input inputmode="decimal" placeholder="kg" value="${esc(s.kg)}" data-e="${ei}" data-s="${si}" data-f="kg"><input inputmode="numeric" placeholder="${esc(String(en.it.reps).split('-')[0].replace(/\D/g, '') || 'reps')}" value="${esc(s.reps)}" data-e="${ei}" data-s="${si}" data-f="reps"><button class="ok" data-act="setdone" data-e="${ei}" data-s="${si}">${s.done ? '✓' : ''}</button></div>`).join('')}
    ${last ? `<div class="prev">Última vez: ${last.map((s) => `${s.kg || '–'}×${s.reps || '–'}`).join(' · ')}</div>` : ''}</div></div>`; }).join('')}
  <div class="fin"><div><button class="pri block" data-act="finish">Terminar entrenamiento</button></div></div><div id="restbox"></div>`;
  tickClock(); saveRun();
}
function startRest(sec) {
  clearInterval(timer); let left = sec;
  const draw = () => { const b = $('#restbox'); if (!b) return clearInterval(timer); b.innerHTML = `<div class="rest"><b>${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</b><span>Descanso</span><button data-act="skiprest">Saltar</button></div>`; };
  draw();
  timer = setInterval(() => { left--; if (left <= 0) { clearInterval(timer); const b = $('#restbox'); if (b) b.innerHTML = ''; if (navigator.vibrate) navigator.vibrate([200, 100, 200]); toast('¡Listo! Siguiente serie 💪'); } else draw(); }, 1000);
}
function closeRun() { ldel('run'); clearInterval(timer); clearInterval(clock); run = null; $('#sheet').hidden = true; $('#sheet').innerHTML = ''; document.body.style.overflow = ''; }

// ---------- modales ----------
function modal(html) { const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal'; m.innerHTML = `<div class="box">${html}</div>`; m.addEventListener('click', (e) => { if (e.target === m) m.remove(); }); document.body.appendChild(m); return m; }
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
const checked = (sel) => [...document.querySelectorAll(`${sel} input:checked`)].map((i) => i.value);
const pillVal = (n) => +(document.querySelector(`[data-pills=${n}] .pill.on`)?.dataset.v || 0);

const queue = (kind, data) => { const q = lget('q', []); q.push({ kind, data }); lset('q', q); };
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
  else if (a === 'resume') { const sv = lget('run', null); if (sv) openRun(sv.di, sv); }
  else if (a === 'discard') { ldel('run'); render(); }
  else if (a === 'hidetip') { lset('tip', true); render(); }
  else if (a === 'msg') modal(`<h2>Mensaje a tu entrenador</h2><textarea id="m-text" placeholder="Escribe tu duda, molestia o cambio de horario…"></textarea><button class="pri block" style="margin-top:14px" data-act="sendmsg">Enviar</button>`);
  else if (a === 'sendmsg') { const t = $('#m-text').value.trim(); if (!t) return toast('Escribe un mensaje'); send('message', { text: t }, 'Mensaje enviado ✓'); }
  else if (a === 'checkin') checkinForm();
  else if (a === 'intake') intakeForm();
  else if (a === 'skiprest') { clearInterval(timer); $('#restbox').innerHTML = ''; }
  else if (a === 'setdone') {
    const s = run.entries[+el.dataset.e].sets[+el.dataset.s]; s.done = !s.done;
    const en = run.entries[+el.dataset.e];
    if (s.done && !s.reps) { const t = parseInt(String(en.it.reps), 10); if (t) s.reps = String(t); }
    const y = $('#sheet').scrollTop; drawRun(); $('#sheet').scrollTop = y;
    if (s.done) startRest(parseRest(en.it.rest));
  }
  else if (a === 'finish') {
    const doneSets = run.entries.reduce((n, en) => n + en.sets.filter((s) => s.done || (s.kg && s.reps)).length, 0);
    if (!doneSets) return toast('Marca al menos una serie');
    modal(`<h2>¡Buen trabajo!</h2><label class="fl">¿Qué tan duro estuvo? (1 = muy fácil, 10 = máximo)</label>${pills('rpe', 10, 7)}<label class="fl">Nota para tu entrenador (opcional)</label><textarea id="w-note" placeholder="Cómo te sentiste, molestias, etc."></textarea><button class="pri block" style="margin-top:16px" data-act="sendworkout">Guardar entrenamiento</button>`);
  }
  else if (a === 'sendworkout') {
    const entries = run.entries.map((en) => ({ exId: en.it.exId, name: ex(en.it.exId)?.name || '', sets: en.sets.filter((s) => s.done || (s.kg && s.reps)).map((s) => ({ kg: s.kg, reps: s.reps })) })).filter((en) => en.sets.length);
    const data = { dayName: run.day.name, date: today(), durationMin: Math.max(1, Math.round((Date.now() - run.start) / 60000)), rpe: pillVal('rpe'), note: ($('#w-note')?.value || '').trim(), entries };
    try { await api('log', 'workout', data); closeModal(); closeRun(); toast('Entrenamiento guardado ✓'); await load(false); tab = 'progreso'; render(); }
    catch (err) { if (err.net) { queue('workout', data); closeModal(); closeRun(); toast('Sin internet: se guardó en tu teléfono y se enviará solo'); render(); } else toast(err.message); }
  }
  else if (a === 'sendcheckin') send('checkin', { adherence: pillVal('adherence'), energy: pillVal('energy'), sleep: $('#ci-sleep').value.trim(), weight: $('#ci-w').value.trim(), pain: $('#ci-pain').value.trim(), note: $('#ci-note').value.trim() }, 'Check-in enviado ✓');
  else if (a === 'sendintake') send('intake', { age: $('#in-age').value.trim(), sex: $('#in-sex').value, height: $('#in-h').value.trim(), weight: $('#in-w').value.trim(), goal: $('#in-goal').value.trim(), injuries: checked('#in-inj'), days: $('#in-days').value.trim(), equipment: checked('#in-eq'), foodsAvoid: checked('#in-food'), parq: checked('#in-parq'), notes: $('#in-notes').value.trim() }, 'Ficha enviada ✓');
});
document.addEventListener('input', (e) => {
  const t = e.target; if (t.dataset?.f && run) { run.entries[+t.dataset.e].sets[+t.dataset.s][t.dataset.f] = t.value; saveRun(); }
});

async function load(first) {
  if (!token) { $('#app').innerHTML = '<div class="err"><h2>Falta el enlace</h2><p class="mute">Abre el enlace que te envió tu entrenador.</p></div>'; return; }
  try { D = await api('get'); offline = false; lset('d', D); }
  catch (e) {
    const cached = e.net ? lget('d', null) : null;
    if (cached) { D = cached; offline = true; }
    else { if (first) $('#app').innerHTML = `<div class="err"><h2>No pudimos abrir tu plan</h2><p class="mute">${esc(e.message)}</p></div>`; return; }
  }
  document.title = `${D.brand || 'C-Lab'} · Mi plan`;
  if (!run) render();
}
load(true).then(flushQueue);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
