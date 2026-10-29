// Hojas imprimibles / PDF: plan de entrenamiento, plan nutricional y plan completo con marca C-Lab.
import * as N from './nutrition.js?v=17';
import { logoMark } from './brand.js?v=17';

const SWAPS = [
  ['Proteína · 30 g', 'p', 30, ['pollo', 'res', 'pescado', 'atun', 'huevo', 'claras', 'yogur', 'requeson', 'panela', 'tofu', 'whey']],
  ['Carbohidratos · 40 g', 'c', 40, ['arroz', 'papa', 'camote', 'pasta', 'tortilla', 'avena', 'pan', 'platano', 'frijol']],
  ['Grasa · 10 g', 'f', 10, ['aguacate', 'aceite', 'almendra', 'nuez', 'cacahuate', 'chia']],
];

export function make(x) {
  const { esc, ic, $ } = x;
  const brand = () => esc(x.S.settings?.brand || 'C-Lab');
  const M = (t) => `P ${Math.round(t.p)} · C ${Math.round(t.c)} · G ${Math.round(t.f)}`;

  const header = (title, sub) => `<header class="sh-h"><div class="sh-b">${logoMark(46)}<div><b>${brand()}</b><small>Coaching Lab</small></div></div><div class="sh-t"><h1>${title}</h1><p>${sub}</p></div></header>`;
  const clientCard = (c) => c ? `<section class="sh-c"><div><small>Cliente</small><b>${esc(c.name)}</b></div><div><small>Objetivo</small><b>${esc(c.goal || '—')}</b></div><div><small>Perfil</small><b>${x.TRACK_NAME[c.track || 'general']} · ${c.level}</b></div><div><small>Cuidar</small><b>${esc((c.injuries || []).join(', ') || 'Sin restricciones')}</b></div></section>` : '';
  const foot = () => `<footer class="sh-f"><span>${brand()} · generado con C-Lab</span><span>Orientación de entrenamiento y alimentación. No sustituye valoración médica.</span></footer>`;

  function training(r, c) {
    const p = r.program;
    return `<section class="sh-s"><h2><span>1</span>Entrenamiento · ${esc(r.name)}</h2>
      ${r.goal ? `<p class="sh-lead">${esc(r.goal)}</p>` : ''}
      ${p ? `<div class="sh-weeks">${p.weeks.map((w) => `<div><b>${esc(w.label)}</b><i>RIR ${esc(w.rir)}</i><small>${esc(w.note)}</small></div>`).join('')}</div>` : ''}
      ${r.days.map((d) => `<div class="sh-day"><h3>${esc(d.name)}</h3><table class="sh-t1"><thead><tr><th>Ejercicio</th><th>Series × reps</th><th>Descanso</th><th>Indicación</th></tr></thead><tbody>
        ${d.items.map((it) => { const e = x.ex(it.exId); return `<tr><td><div class="sh-ex">${e?.images?.[0] ? `<img src="${e.images[0]}" alt="" onerror="this.remove()">` : '<span class="sh-ph"></span>'}<div><b>${it.sup ? `<span class="sh-sup">${esc(it.sup)}</span> ` : ''}${esc(e?.name || '—')}</b><small>${esc(e?.muscle || '')}${e?.cues ? ' · ' + esc(e.cues.split(' · ').slice(0, 2).join(' · ')) : ''}</small></div></div></td><td class="c"><b>${it.sets} × ${esc(it.reps)}</b></td><td class="c">${esc(it.rest)}</td><td>${esc(it.note)}</td></tr>`; }).join('')}</tbody></table></div>`).join('')}
      <div class="sh-box"><h4>Cómo leer tu rutina</h4><ul><li><b>Series × reps:</b> cuántas veces repites el ejercicio y cuántas series haces.</li><li><b>RIR:</b> repeticiones que te quedan "en reserva". RIR 2 = podrías hacer 2 más con buena técnica.</li><li><b>Descanso:</b> tiempo entre series. Respétalo, sobre todo en ejercicios de fuerza y potencia.</li><li>Si algo duele (no molesta), detente y avisa a tu coach.</li></ul></div>
      ${p?.notes?.length ? `<div class="sh-box"><h4>Notas del programa</h4><ul>${p.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}</section>`;
  }

  function swapsTable() {
    return `<div class="sh-box"><h4>Intercambios rápidos</h4><p class="sh-small">Porciones con aporte parecido para variar tu menú.</p><table class="sh-t1 sw"><tbody>${SWAPS.map(([label, k, g, ids]) => `<tr><th>${label}</th><td>${ids.map((id) => N.food(id)).filter((f) => f && f[k] >= 2).map((f) => `<span>${esc(f.name)} <b>${N.snapG(f, g / f[k] * 100)} g</b></span>`).join('')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function nutrition(d, c, n) {
    const ex = d.extra;
    const dayHtml = (day) => { const t = N.dayTotals(day); return `<div class="sh-day"><h3>${esc(day.name)} <small>${Math.round(t.kcal)} kcal · ${M(t)}</small></h3>
      <table class="sh-t1"><thead><tr><th style="width:17%">Comida</th><th>Porciones</th><th style="width:19%">Macros</th></tr></thead><tbody>${day.meals.map((m) => { if (!m.items) return `<tr><td><b>${esc(m.name)}</b><small>${esc(m.time)}</small></td><td>${esc(m.food)}</td><td></td></tr>`; const mt = N.mealTotals(m.items); return `<tr><td><b>${esc(m.name)}</b><small>${esc(m.time)}</small></td><td>${m.items.map((it) => `<div>• ${esc(N.itemText(it))}</div>`).join('')}</td><td class="c"><b>${Math.round(mt.kcal)} kcal</b><small>${M(mt)}</small></td></tr>`; }).join('')}</tbody></table></div>`; };
    const sh = N.shopping(d.days, d.counts);
    const tot = d.protein * 4 + d.carbs * 4 + d.fat * 9 || 1;
    return `<section class="sh-s"><h2><span>${n}</span>Plan de alimentación · ${esc(d.name)}</h2>
      <div class="sh-macros"><div class="m k"><b>${d.kcal}</b><small>kcal / día</small></div><div class="m p"><b>${d.protein} g</b><small>Proteína</small></div><div class="m c"><b>${d.carbs} g</b><small>Carbohidratos</small></div><div class="m f"><b>${d.fat} g</b><small>Grasa</small></div></div>
      <div class="sh-bar"><i class="p" style="width:${d.protein * 4 / tot * 100}%"></i><i class="c" style="width:${d.carbs * 4 / tot * 100}%"></i><i class="f" style="width:${d.fat * 9 / tot * 100}%"></i></div>
      ${ex?.dayTargets?.length > 1 ? `<table class="sh-t1 sm"><thead><tr><th>Tipo de día</th><th>kcal</th><th>Prot</th><th>Carb</th><th>Grasa</th><th>Días/sem</th></tr></thead><tbody>${ex.dayTargets.map((t) => `<tr><td><b>${esc(t.label)}</b></td><td class="c">${t.kcal}</td><td class="c">${t.p}</td><td class="c">${t.c}</td><td class="c">${t.f}</td><td class="c">${t.count}</td></tr>`).join('')}</tbody></table>` : ''}
      ${ex ? `<div class="sh-chips"><span>Fibra ≥ <b>${ex.fiber} g</b></span><span>Agua <b>${(ex.water.daily[0] / 1000).toFixed(1)}–${(ex.water.daily[1] / 1000).toFixed(1)} L</b> al día</span><span>Antes de entrenar <b>${ex.water.pre[0]}–${ex.water.pre[1]} ml</b></span></div>` : ''}
      ${d.days.map(dayHtml).join('')}${swapsTable()}
      ${Object.keys(sh).length ? `<div class="sh-box"><h4>Lista del súper · semana</h4><div class="sh-shop">${Object.entries(sh).map(([cat, list]) => `<div><b>${cat}</b>${list.map((i) => `<div>${esc(i.f.name)} <span>${i.g >= 1000 ? (i.g / 1000).toFixed(1) + ' kg' : i.g + ' g'}</span></div>`).join('')}</div>`).join('')}</div></div>` : ''}
      ${ex?.supplements?.length ? `<div class="sh-box"><h4>Suplementos con respaldo (opcionales)</h4><ul>${ex.supplements.map((s) => `<li><b>${esc(s.n)}.</b> ${esc(s.d)}</li>`).join('')}</ul></div>` : ''}
      ${ex?.tips?.length ? `<div class="sh-box"><h4>Recomendaciones</h4><ul>${ex.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` : (d.notes ? `<div class="sh-box"><h4>Indicaciones</h4><ul>${d.notes.split('\n').filter(Boolean).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` : '')}</section>`;
  }

  const bar = (back, tabs) => `<div class="bar noprint"><a href="${back}">${ic('back', 16)} Volver</a>${tabs ? `<div class="seg">${[['todo', 'Plan completo'], ['entreno', 'Solo entrenamiento'], ['nutricion', 'Solo nutrición']].map(([k, l]) => `<button class="${(x.ui.sheet || 'todo') === k ? 'on' : ''}" data-act="sheet-type" data-v="${k}">${l}</button>`).join('')}</div>` : ''}<span class="grow"></span><button class="pri" onclick="print()">${ic('print', 16)}Imprimir / Guardar PDF</button></div><p class="noprint mini">En la ventana de impresión elige "Guardar como PDF". Activa "Gráficos de fondo" para ver los colores.</p>`;
  const stamp = () => new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  const V = {
    hoja(id) {
      const c = x.cl(id); if (!c) return '<p>No encontrado</p>';
      const r = x.S.routines.find((q) => q.id === c.routineId), d = x.S.diets.find((q) => q.id === c.dietId), t = x.ui.sheet || 'todo';
      const showT = r && t !== 'nutricion', showN = d && t !== 'entreno';
      return `${bar('#/cliente/' + c.id, true)}<article class="sheet">${header(t === 'entreno' ? 'Plan de entrenamiento' : t === 'nutricion' ? 'Plan de alimentación' : 'Plan personalizado', `Preparado para ${esc(c.name)} · ${stamp()}`)}${clientCard(c)}
        ${showT ? training(r, c) : ''}${showN ? `<div class="${showT ? 'pb' : ''}">${nutrition(d, c, showT ? 2 : 1)}</div>` : ''}${!showT && !showN ? '<p class="mute">Este cliente aún no tiene programa ni dieta asignados.</p>' : ''}${foot()}</article>`;
    },
    hojar(id) {
      const r = x.S.routines.find((q) => q.id === id); if (!r) return '<p>No encontrada</p>';
      const c = x.S.clients.find((q) => q.routineId === r.id);
      return `${bar('#/rutina/' + r.id)}<article class="sheet">${header('Plan de entrenamiento', `${c ? 'Preparado para ' + esc(c.name) + ' · ' : ''}${stamp()}`)}${clientCard(c)}${training(r, c)}${foot()}</article>`;
    },
    hojad(id) {
      const d = x.S.diets.find((q) => q.id === id); if (!d) return '<p>No encontrada</p>';
      const c = x.S.clients.find((q) => q.dietId === d.id);
      return `${bar('#/dieta/' + d.id)}<article class="sheet">${header('Plan de alimentación', `${c ? 'Preparado para ' + esc(c.name) + ' · ' : ''}${stamp()}`)}${clientCard(c)}${nutrition(d, c, 1)}${foot()}</article>`;
    },
  };
  function report(c) {
    const act = x.mods.activity, t = x.today(), since30 = Date.now() - 30 * 864e5;
    const wk = act.clogs(c, 'workout').filter((w) => new Date(w.created_at) >= since30);
    const plannedWeek = (x.S.routines.find((r) => r.id === c.routineId)?.days.length) || c.daysPerWeek || 3;
    const sessions = x.S.appointments.filter((a) => a.status === 'realizada' && a.date >= new Date(since30).toISOString().slice(0, 10) && x.apptIds(a).includes(c.id)).length;
    const cks = [...(c.checkins || []), ...act.clogs(c, 'checkin').map((l) => ({ adherence: +l.data.adherence, energy: +l.data.energy, date: l.created_at.slice(0, 10) }))].filter((q) => new Date(q.date + 'T12:00') >= since30);
    const avg = (k) => (cks.length ? (cks.reduce((a, q) => a + (+q[k] || 0), 0) / cks.length).toFixed(1) : '—');
    const m = [...c.measures].sort((a, b) => a.date.localeCompare(b.date)).filter((q) => new Date(q.date + 'T12:00') >= Date.now() - 90 * 864e5);
    const delta = (k, u) => { const v = m.filter((q) => q[k] !== '' && q[k] != null).map((q) => +q[k]); if (v.length < 2) return ''; const d = Math.round((v.at(-1) - v[0]) * 10) / 10; return `<tr><td>${{ weight: 'Peso', fat: '% de grasa', waist: 'Cintura', chest: 'Pecho', hip: 'Cadera', arm: 'Brazo', thigh: 'Muslo' }[k]}</td><td class="c">${v[0]} ${u}</td><td class="c">${v.at(-1)} ${u}</td><td class="c"><b>${d > 0 ? '+' : ''}${d} ${u}</b></td></tr>`; };
    const lifts = act.strength(c).filter((q) => q.pts.length > 1);
    const ph = act.photos(c);
    const wvals = m.filter((q) => q.weight !== '' && q.weight != null).map((q) => +q.weight);
    const spark = wvals.length > 1 ? (() => { const W = 560, H = 90, mn = Math.min(...wvals), mx = Math.max(...wvals), r = mx - mn || 1; const pts = wvals.map((v, i) => `${(i / (wvals.length - 1)) * (W - 20) + 10},${H - 12 - ((v - mn) / r) * (H - 24)}`); return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:90px"><polyline fill="none" stroke="#2350ee" stroke-width="3" stroke-linejoin="round" points="${pts.join(' ')}"/></svg>`; })() : '';
    const month = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    return `<div class="bar noprint"><a href="#/cliente/${c.id}">${ic('back', 16)} Volver</a><span class="grow"></span><button class="pri" onclick="print()">${ic('print', 16)}Imprimir / Guardar PDF</button></div><p class="noprint mini">Escribe tus comentarios en el recuadro antes de imprimir.</p>
    <article class="sheet">${header('Reporte de progreso', `${esc(c.name)} · ${month}`)}${clientCard(c)}
      <section class="sh-s"><h2><span>1</span>Resumen del mes</h2><div class="sh-macros" style="grid-template-columns:repeat(4,1fr)"><div class="m k"><b>${wk.length}</b><small>Entrenos registrados</small></div><div class="m p"><b>${plannedWeek * 4}</b><small>Meta (≈ 4 semanas)</small></div><div class="m c"><b>${sessions}</b><small>Sesiones con tu coach</small></div><div class="m f"><b>${avg('adherence')}/5</b><small>Adherencia · energía ${avg('energy')}/5</small></div></div>
      ${wk.length ? `<p class="sh-lead" style="margin-top:6px">Cumplimiento del plan: <b>${Math.min(100, Math.round(wk.length / (plannedWeek * 4) * 100))}%</b></p>` : ''}</section>
      ${m.length > 1 ? `<section class="sh-s"><h2><span>2</span>Cambios corporales (90 días)</h2>${spark}<table class="sh-t1 sm"><thead><tr><th>Medida</th><th>Inicio</th><th>Actual</th><th>Cambio</th></tr></thead><tbody>${[['weight', 'kg'], ['fat', '%'], ['waist', 'cm'], ['chest', 'cm'], ['hip', 'cm'], ['arm', 'cm'], ['thigh', 'cm']].map(([k, u]) => delta(k, u)).join('')}</tbody></table></section>` : ''}
      ${lifts.length ? `<section class="sh-s"><h2><span>3</span>Fuerza</h2><table class="sh-t1 sm"><thead><tr><th>Ejercicio</th><th>1RM estimado inicial</th><th>Actual</th><th>Cambio</th></tr></thead><tbody>${lifts.map((q) => { const a = q.pts[0].v, b = q.pts.at(-1).v; return `<tr><td>${esc(q.name)}</td><td class="c">${a} kg</td><td class="c">${b} kg</td><td class="c"><b>${b - a >= 0 ? '+' : ''}${Math.round((b - a) * 10) / 10} kg</b></td></tr>`; }).join('')}</tbody></table></section>` : ''}
      ${ph.length > 1 ? `<section class="sh-s"><h2><span>4</span>Antes y después</h2><div class="two"><figure style="margin:0"><img data-path="${esc(ph[0].path)}" data-pending="1" alt="" style="width:100%;border-radius:10px"><figcaption class="sh-small">${x.fdate(ph[0].date)} · ${esc(ph[0].pose)}</figcaption></figure><figure style="margin:0"><img data-path="${esc(ph.at(-1).path)}" data-pending="1" alt="" style="width:100%;border-radius:10px"><figcaption class="sh-small">${x.fdate(ph.at(-1).date)} · ${esc(ph.at(-1).pose)}</figcaption></figure></div></section>` : ''}
      <section class="sh-s"><div class="sh-box"><h4>Comentarios de tu entrenador</h4><div contenteditable="true" class="sh-edit" data-ph="Escribe aquí tus observaciones y objetivos para el siguiente mes…"></div></div></section>${foot()}</article>`;
  }
  V.reporte = (id) => { const c = x.cl(id); return c ? report(c) : '<p>No encontrado</p>'; };
  const ACT = { 'sheet-type': (el) => { x.ui.sheet = el.dataset.v; x.render(); } };
  return { V, ACT };
}
