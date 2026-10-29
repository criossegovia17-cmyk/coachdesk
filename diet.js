// Nutrición C-Lab: dietas por porciones, alimentos, calculadora del cliente, equivalencias y lista del súper.
import * as N from './nutrition.js?v=10';

export function make(x) {
  const { esc, ic, btn, $ } = x;
  const fp = (x.ui.fp ||= { dietId: null, day: 0, meal: 0, q: '', cat: '' });
  const dayOf = (id) => (x.ui.dday ||= {})[id] || 0;
  const M = (t) => `P ${Math.round(t.p)} · C ${Math.round(t.c)} · G ${Math.round(t.f)}`;
  const clientsOfDiet = (d) => x.S.clients.filter((c) => c.dietId === d.id);

  // ---------- gráficos ----------
  const donut = (p, c, f, kcal) => {
    const tot = p * 4 + c * 4 + f * 9 || 1, a = (p * 4 / tot) * 100, b = (c * 4 / tot) * 100, d = (f * 9 / tot) * 100;
    const arc = (v, off, col) => `<circle r="15.9155" cx="21" cy="21" fill="none" stroke="${col}" stroke-width="5.5" stroke-dasharray="${v} ${100 - v}" stroke-dashoffset="${-off}" transform="rotate(-90 21 21)"/>`;
    return `<svg class="donut" viewBox="0 0 42 42">${arc(a, 0, '#4f46e5')}${arc(b, a, '#10b981')}${arc(d, a + b, '#f59e0b')}<text x="21" y="20.5" text-anchor="middle" class="dk">${kcal}</text><text x="21" y="26" text-anchor="middle" class="dl">kcal</text></svg>`;
  };
  const legend = (p, c, f) => `<div class="lgd"><span><i style="background:#4f46e5"></i>Proteína <b>${p} g</b></span><span><i style="background:#10b981"></i>Carbohidratos <b>${c} g</b></span><span><i style="background:#f59e0b"></i>Grasa <b>${f} g</b></span></div>`;
  const prog = (v, t, label) => { const pct = t ? Math.min(140, (v / t) * 100) : 0, diff = v - t, cls = Math.abs(diff / (t || 1)) <= 0.07 ? 'ok' : Math.abs(diff / (t || 1)) <= 0.15 ? 'mid' : 'off'; return `<div class="pg ${cls}"><div class="row sp"><small>${label}</small><b>${Math.round(v)}<span class="mute"> / ${Math.round(t)}</span></b></div><div class="pgb"><i style="width:${Math.min(100, pct)}%"></i></div></div>`; };

  // ---------- Lista de dietas y alimentos ----------
  const dietCard = (d) => {
    const t = d.days?.[0] ? N.dayTotals(d.days[0]) : null;
    return `<div class="card dcard"><div class="row sp"><h3>${esc(d.name)}</h3></div><div class="dsum">${donut(d.protein, d.carbs, d.fat, d.kcal)}<div>${legend(d.protein, d.carbs, d.fat)}</div></div>
      <p class="mini">${d.days.length} día(s) de menú · asignada a: ${clientsOfDiet(d).map((c) => esc(c.name)).join(', ') || 'nadie'}</p>
      <div class="bar"><a class="btn sm pri" href="#/dieta/${d.id}">Abrir / editar</a><a class="btn sm" href="#/hojad/${d.id}">${ic('print', 14)}PDF</a>${btn('', 'copy-diet', `data-id="${d.id}"`, 'copy', 'sm')}${btn('', 'diet-del', `data-id="${d.id}"`, 'trash', 'sm del')}</div></div>`;
  };
  const foodsTable = () => {
    const f = (x.ui.fq ||= { q: '', cat: '' }), q = f.q.toLowerCase();
    const list = x.S.foods.filter((a) => (!q || a.name.toLowerCase().includes(q)) && (!f.cat || a.cat === f.cat));
    return `<div class="bar"><div class="search">${ic('search', 16)}<input data-fq="q" placeholder="Buscar alimento…" value="${esc(f.q)}"></div>
      <select data-fq="cat"><option value="">Todas las categorías</option>${N.FOOD_CATS.map((c) => `<option ${c === f.cat ? 'selected' : ''}>${c}</option>`).join('')}</select><span class="grow"></span>${btn('Nuevo alimento', 'food-new', '', 'plus', 'pri')}</div>
      <p class="mini">${list.length} alimentos · valores por 100 g, aproximados</p><section class="card"><div class="tw"><table><tr><th>Alimento</th><th>Categoría</th><th>kcal</th><th>Prot</th><th>Carb</th><th>Grasa</th><th></th></tr>${list.map((a) => `<tr><td><b>${esc(a.name)}</b> ${a.custom ? '<span class="tag">propio</span>' : ''}<br><span class="mute">${a.tags.map(esc).join(', ')}</span></td><td>${a.cat}</td><td>${a.kcal}</td><td>${a.p}</td><td>${a.c}</td><td>${a.f}</td><td>${btn('', 'food-edit', `data-id="${a.id}"`, 'edit', 'sm')}</td></tr>`).join('')}</table></div></section>`;
  };

  // ---------- Constructor de dieta ----------
  const foodSelect = (path, sel) => `<select data-path="${path}" data-re="1">${N.FOOD_CATS.map((cat) => `<optgroup label="${cat}">${x.S.foods.filter((a) => a.cat === cat).map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</optgroup>`).join('')}</select>`;
  function mealCard(d, di, m, mi) {
    const t = m.items ? N.mealTotals(m.items) : null;
    return `<div class="mc"><div class="mc-h"><input data-path="days.${di}.meals.${mi}.name" value="${esc(m.name)}" class="title-in"><input data-path="days.${di}.meals.${mi}.time" value="${esc(m.time)}" class="time-in" placeholder="Hora">
      ${t ? `<span class="chip">${Math.round(t.kcal)} kcal</span><span class="chip">${M(t)}</span>` : ''}<span class="grow"></span><button class="sm del" data-act="meal-del" data-id="${d.id}" data-d="${di}" data-i="${mi}">${ic('trash', 14)}</button></div>
      ${m.items ? m.items.map((it, ii) => { const f = N.food(it.id), im = N.itemMacros(it); return `<div class="fi"><div class="fi-n">${foodSelect(`days.${di}.meals.${mi}.items.${ii}.id`, it.id)}<small class="mute">${f ? esc(N.itemText(it)) : ''}</small></div>
          <label class="fi-g"><input type="number" min="0" step="${f?.unit ? f.unit.g / 2 : 5}" data-path="days.${di}.meals.${mi}.items.${ii}.g" data-re="1" value="${Math.round(it.g)}"><span>g</span></label>
          <span class="fi-m">${Math.round(im.kcal)} kcal<small>${M(im)}</small></span>
          <span class="acts"><button class="sm" title="Equivalencias" data-act="eq-open" data-id="${d.id}" data-d="${di}" data-m="${mi}" data-i="${ii}">⇄</button><button class="sm del" data-act="fi-del" data-id="${d.id}" data-d="${di}" data-m="${mi}" data-i="${ii}">${ic('trash', 14)}</button></span></div>`; }).join('')
        + `<button class="addex sm" data-act="fp-open" data-id="${d.id}" data-d="${di}" data-m="${mi}">${ic('plus', 16)} Agregar alimento</button>`
        : `<input data-path="days.${di}.meals.${mi}.food" value="${esc(m.food)}" placeholder="Describe la comida"><div class="bar" style="margin:6px 0 0"><button class="sm" data-act="meal-convert" data-id="${d.id}" data-d="${di}" data-m="${mi}">Convertir a porciones (estructurado)</button></div>`}</div>`;
  }
  const V = {
    nutricion() {
      const t = x.ui.ntab || 'dietas';
      return x.page('Nutrición', 'Dietas por porciones, alimentos y menús para tus clientes', t === 'dietas' ? btn('Nueva dieta', 'diet-new', '', 'plus', 'pri') : '',
        `<nav class="tabs"><button class="${t === 'dietas' ? 'on' : ''}" data-act="ntab" data-v="dietas">Dietas</button><button class="${t === 'alimentos' ? 'on' : ''}" data-act="ntab" data-v="alimentos">Alimentos</button></nav>
        ${t === 'dietas' ? `<p class="mute">Para calcular metas y generar un menú automático entra al cliente → pestaña <b>Nutrición</b>.</p><div class="grid">${x.S.diets.map(dietCard).join('') || '<p class="mute">Aún no hay dietas.</p>'}</div>` : foodsTable()}`);
    },
    dieta(id) {
      const d = x.S.diets.find((q) => q.id === id); if (!d) return '<p>No encontrada.</p>';
      const di = Math.min(dayOf(id), d.days.length - 1), day = d.days[di];
      const tg = day.target || { kcal: d.kcal, p: d.protein, c: d.carbs, f: d.fat };
      const tot = N.dayTotals(day), structured = day.meals.some((m) => m.items);
      const cs = clientsOfDiet(d), free = x.S.clients.filter((c) => c.dietId !== d.id);
      return `<div class="crumb"><a href="#/nutricion">${ic('back', 16)} Nutrición</a></div><div data-root="diets:${d.id}">
        <section class="card rhead"><div class="rh-main"><label class="fl" style="margin-top:0">Dieta</label><input class="title-in big" data-path="name" value="${esc(d.name)}">
          <div class="four"><div><label class="fl">Kcal</label><input type="number" data-path="kcal" data-re="1" value="${d.kcal}"></div><div><label class="fl">Proteína g</label><input type="number" data-path="protein" data-re="1" value="${d.protein}"></div><div><label class="fl">Carbs g</label><input type="number" data-path="carbs" data-re="1" value="${d.carbs}"></div><div><label class="fl">Grasa g</label><input type="number" data-path="fat" data-re="1" value="${d.fat}"></div></div>
          <label class="fl">Persona</label><div class="people">${cs.map((c) => `<span class="pchip">${x.avatar(c.name)}<span>${esc(c.name)}</span><button data-act="dt-unassign" data-id="${d.id}" data-c="${c.id}">×</button></span>`).join('') || '<span class="mute">Sin asignar</span>'}</div>
          <select id="dt-assign" data-id="${d.id}"><option value="">+ Asignar a un cliente…</option>${free.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
          <div class="rh-donut">${donut(d.protein, d.carbs, d.fat, d.kcal)}${legend(d.protein, d.carbs, d.fat)}</div></section>
        <nav class="tabs">${d.days.map((q, i) => `<button class="${i === di ? 'on' : ''}" data-act="dday-sel" data-id="${d.id}" data-d="${i}">${esc(q.name)}</button>`).join('')}<button data-act="dday-add" data-id="${d.id}">+ Día</button></nav>
        ${structured ? `<section class="card dsumm"><div class="pgs">${prog(tot.kcal, tg.kcal, 'Calorías')}${prog(tot.p, tg.p, 'Proteína g')}${prog(tot.c, tg.c, 'Carbohidratos g')}${prog(tot.f, tg.f, 'Grasa g')}</div>
          <div class="bar" style="margin-bottom:0">${btn('Ajustar porciones a la meta', 'dday-fit', `data-id="${d.id}" data-d="${di}"`, 'check')}${btn('Duplicar día', 'dday-dup', `data-id="${d.id}" data-d="${di}"`, 'copy')}${btn('Quitar día', 'dday-del', `data-id="${d.id}" data-d="${di}"`, 'trash', 'del')}</div></section>` : `<div class="bar">${btn('Quitar día', 'dday-del', `data-id="${d.id}" data-d="${di}"`, 'trash', 'del')}</div>`}
        <input data-path="days.${di}.name" value="${esc(day.name)}" class="title-in" style="margin:6px 0 10px">
        ${day.meals.map((m, mi) => mealCard(d, di, m, mi)).join('')}
        <div class="bar">${btn('Agregar comida', 'meal-add', `data-id="${d.id}" data-d="${di}"`, 'plus')}${btn('Lista del súper', 'shop-open', `data-id="${d.id}"`, 'clip')}${btn('Copiar para WhatsApp', 'copy-diet', `data-id="${d.id}"`, 'copy')}<a class="btn" href="#/hojad/${d.id}">${ic('print', 16)}Plan PDF</a></div>
        <label class="fl">Notas e indicaciones</label><textarea data-path="notes">${esc(d.notes)}</textarea></div>`;
    },
  };

  // ---------- Pestaña de nutrición del cliente ----------
  function dayCard(day, plan) {
    const t = N.dayTotals(day), tg = day.target;
    return `<section class="card"><div class="row sp"><h3>${esc(day.name)}</h3><span class="mute">${Math.round(t.kcal)} kcal · ${M(t)}</span></div>
      <div class="pgs">${prog(t.kcal, tg.kcal, 'Calorías')}${prog(t.p, tg.p, 'Proteína g')}${prog(t.c, tg.c, 'Carbs g')}${prog(t.f, tg.f, 'Grasa g')}</div>
      ${day.meals.map((m) => { const mt = N.mealTotals(m.items); return `<div class="meal"><div class="mt"><b>${esc(m.name)}</b><small>${esc(m.time)}</small><small class="mute">${Math.round(mt.kcal)} kcal</small></div><div><ul class="itl">${m.items.map((it) => `<li>${esc(N.itemText(it))}</li>`).join('')}</ul><small class="mute">${M(mt)}</small></div></div>`; }).join('')}</section>`;
  }
  function nutritionTab(c, d) {
    const n = x.ui.nut && x.ui.nut.clientId === c.id ? x.ui.nut : null;
    const cfg = n?.cfg || { goal: c.track === 'fisicoculturismo' && c.phase === 'definición' ? 'perder' : c.track === 'fisicoculturismo' && c.phase !== 'mantenimiento' ? 'ganar' : 'mantener', rate: '', meals: 5, eq: 'mifflin', cycle: c.track !== 'general', adjust: 0 };
    const w = N.latestWeight(c);
    const missing = [!w.weight && 'peso (Progreso)', !c.height && 'estatura', !c.age && 'edad', !c.sex && 'sexo'].filter(Boolean);
    const plan = n?.plan, ok = plan && !plan.error;
    const adv = N.adviceFromTrend(c, cfg.goal);
    return `<section class="card"><div class="row sp"><h3>Perfil nutricional</h3>${btn('Editar datos', 'client-edit', `data-id="${c.id}"`, 'edit', 'sm')}</div>
      <div class="chips"><span class="chip">Peso <b>${w.weight ?? '—'}${w.weight ? ' kg' : ''}</b></span><span class="chip">Grasa <b>${w.fat ?? '—'}${w.fat ? ' %' : ''}</b></span><span class="chip">Estatura <b>${c.height || '—'}${c.height ? ' cm' : ''}</b></span><span class="chip">Edad <b>${c.age || '—'}</b></span><span class="chip">Actividad <b>×${c.activity || '—'}</b></span><span class="chip">${esc(N.RESTRICTIONS.filter((r) => (c.foodsAvoid || []).includes(r[0])).map((r) => 'sin ' + r[1].toLowerCase()).join(', ') || 'sin restricciones')}</span></div>
      ${missing.length ? `<p class="al bad">${ic('alert', 16)}<span>Faltan datos: ${missing.join(', ')}.</span></p>` : ''}
      <div class="gen3"><div><label class="fl">Objetivo</label><select id="n-goal">${x.opts([['perder', 'Perder grasa'], ['mantener', 'Mantener'], ['ganar', 'Ganar masa']], cfg.goal)}</select></div>
        <div><label class="fl">Ritmo de pérdida</label><select id="n-rate">${x.opts([['', 'Automático'], ['0.5', '0.5% del peso / semana'], ['0.7', '0.7% / semana'], ['1', '1% / semana']], cfg.rate)}</select></div>
        <div><label class="fl">Comidas al día</label><select id="n-meals">${x.opts([[3, '3 comidas'], [4, '4 comidas'], [5, '5 comidas']], cfg.meals)}</select></div>
        <div><label class="fl">Ecuación de gasto</label><select id="n-eq">${x.opts([['mifflin', 'Mifflin-St Jeor'], ['cunningham', 'Cunningham (usa % de grasa)']], cfg.eq)}</select></div>
        <div><label class="fl">Distribución</label><select id="n-cycle">${x.opts([['1', 'Ciclado: entreno / descanso'], ['0', 'Igual todos los días']], cfg.cycle ? '1' : '0')}</select></div></div>
      <div class="bar">${btn('Calcular y armar menú', 'nut-calc', `data-id="${c.id}"`, 'leaf', 'pri')}${ok ? btn('Otro menú', 'nut-shuffle', `data-id="${c.id}"`, 'zap') : ''}</div></section>
    ${plan?.error ? `<p class="al bad">${ic('alert', 16)}<span>${esc(plan.error)}</span></p>` : ''}
    ${ok ? `<div class="cols"><section class="card"><h3>Metas diarias</h3><div class="dsum">${donut(plan.target.p, plan.target.c, plan.target.f, plan.target.kcal)}<div>${legend(plan.target.p, plan.target.c, plan.target.f)}<p class="mini">${plan.perKg.p} g/kg proteína · ${plan.perKg.c} g/kg carbohidratos · ${plan.perKg.f} g/kg grasa</p></div></div>
        <div class="tw"><table class="mt-t"><tr><th>Día</th><th>kcal</th><th>Prot</th><th>Carb</th><th>Grasa</th><th>Días/sem</th></tr>${plan.dayTargets.map((t) => `<tr><td>${esc(t.label)}</td><td><b>${t.kcal}</b></td><td>${t.p}</td><td>${t.c}</td><td>${t.f}</td><td>${t.count}</td></tr>`).join('')}</table></div></section>
      <section class="card"><h3>Gasto estimado</h3><div class="kpis small"><div class="kpi"><b>${plan.bmr}</b><small>Basal (kcal)</small></div><div class="kpi"><b>${plan.tdee}</b><small>Total (kcal)</small></div></div>
        <div class="chips"><span class="chip">Fibra ≥ <b>${plan.fiber} g</b></span><span class="chip">Agua <b>${(plan.water.daily[0] / 1000).toFixed(1)}–${(plan.water.daily[1] / 1000).toFixed(1)} L</b>/día</span><span class="chip">Antes de entrenar <b>${plan.water.pre[0]}–${plan.water.pre[1]} ml</b></span></div>
        <small class="mute">Fibra y agua diaria son referencias generales; la ingesta previa (5–10 ml/kg, 2–4 h antes) sigue las guías del ACSM.</small></section></div>
      ${plan.warnings.map((m) => `<p class="al bad">${ic('alert', 16)}<span>${esc(m)}</span></p>`).join('')}
      <section class="card"><h3>Seguimiento y ajuste</h3>${adv.t ? `<div class="chips"><span class="chip">Tendencia <b>${adv.t.pct > 0 ? '+' : ''}${adv.t.pct}% / semana</b></span><span class="chip">${adv.t.from} → ${adv.t.to} kg en ${adv.t.days} días</span></div>` : ''}<p>${esc(adv.text)}</p>${adv.delta ? btn(`Aplicar ${adv.delta > 0 ? '+' : ''}${adv.delta} kcal y recalcular`, 'nut-adjust', `data-id="${c.id}" data-n="${adv.delta}"`, 'check', 'sm') : ''}</section>
      <div class="row sp"><h2>Menú sugerido</h2><div class="bar" style="margin:0">${btn('Guardar como dieta y asignar', 'nut-save', `data-id="${c.id}"`, 'check', 'pri')}${btn('Lista del súper', 'shop-plan', `data-id="${c.id}"`, 'clip')}</div></div>
      <nav class="tabs">${n.menus.days.map((q, i) => `<button class="${(n.day || 0) === i ? 'on' : ''}" data-act="nut-day" data-i="${i}">${esc(q.name)}</button>`).join('')}</nav>
      ${dayCard(n.menus.days[n.day || 0], plan)}
      <section class="card"><h3>Notas del cálculo</h3><ul class="plain">${plan.notes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></section>
      <section class="card"><h3>Suplementos con respaldo (opcionales)</h3>${plan.supplements.map((s) => `<p><b>${esc(s.n)}.</b> ${esc(s.d)}</p>`).join('')}<small class="mute">No son obligatorios. En menores de edad o con condiciones médicas, consulta a un médico.</small></section>
      <section class="card"><h3>Recomendaciones</h3><ul class="plain">${n.tips.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></section>` : ''}
    ${d ? `<section class="card"><h3>Dieta asignada: <a href="#/dieta/${d.id}">${esc(d.name)}</a></h3><p>${d.kcal} kcal · ${M({ p: d.protein, c: d.carbs, f: d.fat })}</p><div class="bar"><a class="btn sm" href="#/hojad/${d.id}">${ic('print', 14)}Plan PDF</a>${btn('Copiar para WhatsApp', 'copy-diet', `data-id="${d.id}"`, 'copy', 'sm')}</div></section>` : ''}`;
  }

  // ---------- Selector de alimentos ----------
  function fpResults() {
    const q = fp.q.toLowerCase();
    const list = x.S.foods.filter((a) => (!q || a.name.toLowerCase().includes(q)) && (!fp.cat || a.cat === fp.cat));
    return `<div class="fplist">${list.map((a) => `<button class="fpi" data-act="fp-add" data-f="${a.id}"><span><b>${esc(a.name)}</b><small>${a.cat} · por 100 g</small></span><span class="fpm">${a.kcal} kcal<small>P ${a.p} · C ${a.c} · G ${a.f}</small></span></button>`).join('') || '<p class="mute">Sin resultados.</p>'}</div>`;
  }
  function openFP() {
    const m = $('#modal'); m.hidden = false;
    m.innerHTML = `<div class="dlg wide picker"><div class="row sp"><h2>Agregar alimento</h2><button class="pri" data-act="fp-close">Listo</button></div>
      <div class="pkf"><div class="search">${ic('search', 16)}<input data-fpq="q" placeholder="Buscar alimento…" value="${esc(fp.q)}" autocomplete="off"></div></div>
      <div class="chipbar"><button class="${fp.cat ? '' : 'on'}" data-act="fp-cat" data-v="">Todos</button>${N.FOOD_CATS.map((c) => `<button class="${fp.cat === c ? 'on' : ''}" data-act="fp-cat" data-v="${c}">${c}</button>`).join('')}</div><div id="fp-res" class="pkres">${fpResults()}</div></div>`;
  }
  document.addEventListener('input', (e) => { if (e.target.dataset?.fpq) { fp.q = e.target.value; const r = $('#fp-res'); if (r) r.innerHTML = fpResults(); } if (e.target.dataset?.fq) { x.ui.fq[e.target.dataset.fq] = e.target.value; const p = e.target.selectionStart; x.render(); const q = document.querySelector('[data-fq=q]'); q?.focus(); q?.setSelectionRange(p, p); } });
  document.addEventListener('change', (e) => {
    if (e.target.dataset?.fq === 'cat') { x.ui.fq.cat = e.target.value; x.render(); }
    if (e.target.id === 'dt-assign' && e.target.value) { x.cl(e.target.value).dietId = e.target.dataset.id; x.save(); x.render(); }
  });

  // ---------- Diálogos ----------
  function shopDialog(days, counts, title) {
    const sh = N.shopping(days, counts);
    const lines = [];
    const html = Object.entries(sh).map(([cat, list]) => { lines.push(`*${cat.toUpperCase()}*`); list.forEach((i) => lines.push(`• ${i.f.name}: ${i.g >= 1000 ? (i.g / 1000).toFixed(1) + ' kg' : i.g + ' g'}`)); return `<h4 class="cat">${cat}</h4>${list.map((i) => `<div class="li"><span>${esc(i.f.name)}</span><b>${i.g >= 1000 ? (i.g / 1000).toFixed(1) + ' kg' : i.g + ' g'}</b></div>`).join('')}`; }).join('');
    x.ui.shopText = `Lista del súper (semana)\n` + lines.join('\n');
    x.dialog(`<h2>Lista del súper · semana</h2><p class="mute">${esc(title)}. Cantidades en crudo aproximadas para 7 días; los alimentos cocidos se compran en menor peso.</p>${html || '<p class="mute">Esta dieta no tiene porciones estructuradas.</p>'}<div class="bar"><button data-act="shop-copy">${ic('copy', 16)}Copiar lista</button></div>`);
  }

  const ACT = {
    ntab: (el) => { x.ui.ntab = el.dataset.v; x.render(); },
    'dday-sel': (el) => { (x.ui.dday ||= {})[el.dataset.id] = +el.dataset.d; x.render(); },
    async 'diet-new'() {
      const v = await x.form('Nueva dieta', [{ k: 'name', l: 'Nombre', req: 1 }, { k: 'kcal', l: 'Kcal', t: 'number' }, { k: 'protein', l: 'Proteína g', t: 'number' }, { k: 'carbs', l: 'Carbs g', t: 'number' }, { k: 'fat', l: 'Grasa g', t: 'number' }], { kcal: 2000, protein: 140, carbs: 220, fat: 60 }); if (!v) return;
      const d = { id: x.uid('di'), ...v, notes: '', days: [{ name: 'Día A', target: { kcal: v.kcal, p: v.protein, c: v.carbs, f: v.fat }, meals: [{ name: 'Desayuno', time: '8:00', items: [] }, { name: 'Comida', time: '14:00', items: [] }, { name: 'Cena', time: '20:00', items: [] }] }] };
      x.S.diets.push(d); x.save(); location.hash = '#/dieta/' + d.id;
    },
    'diet-del'(el) { if (confirm('¿Eliminar dieta?')) { x.del('diets', el.dataset.id); x.S.clients.forEach((c) => c.dietId === el.dataset.id && (c.dietId = '')); x.save(); x.render(); } },
    'dday-add'(el) { const d = x.find('diets', el.dataset.id); d.days.push({ name: 'Día ' + (d.days.length + 1), target: { kcal: d.kcal, p: d.protein, c: d.carbs, f: d.fat }, meals: [{ name: 'Desayuno', time: '8:00', items: [] }] }); (x.ui.dday ||= {})[d.id] = d.days.length - 1; x.save(); x.render(); },
    'dday-dup'(el) { const d = x.find('diets', el.dataset.id), s = d.days[+el.dataset.d]; d.days.splice(+el.dataset.d + 1, 0, JSON.parse(JSON.stringify({ ...s, name: s.name + ' (copia)' }))); (x.ui.dday ||= {})[d.id] = +el.dataset.d + 1; x.save(); x.render(); },
    'dday-del'(el) { const d = x.find('diets', el.dataset.id); if (d.days.length < 2) return x.toast('Debe quedar al menos un día'); d.days.splice(+el.dataset.d, 1); (x.ui.dday ||= {})[d.id] = 0; x.save(); x.render(); },
    'dday-fit'(el) { const d = x.find('diets', el.dataset.id), day = d.days[+el.dataset.d]; N.fitDay(day, day.target?.kcal || d.kcal); x.save(); x.render(); x.toast('Porciones ajustadas'); },
    'meal-add'(el) { x.find('diets', el.dataset.id).days[+el.dataset.d].meals.push({ name: 'Comida', time: '', items: [] }); x.save(); x.render(); },
    'meal-del'(el) { x.find('diets', el.dataset.id).days[+el.dataset.d].meals.splice(+el.dataset.i, 1); x.save(); x.render(); },
    'meal-convert'(el) { x.find('diets', el.dataset.id).days[+el.dataset.d].meals[+el.dataset.m].items = []; x.save(); x.render(); },
    'fi-del'(el) { x.find('diets', el.dataset.id).days[+el.dataset.d].meals[+el.dataset.m].items.splice(+el.dataset.i, 1); x.save(); x.render(); },
    'fp-open'(el) { Object.assign(fp, { dietId: el.dataset.id, day: +el.dataset.d, meal: +el.dataset.m }); openFP(); },
    'fp-cat'(el) { fp.cat = el.dataset.v; document.querySelectorAll('.chipbar button').forEach((b) => b.classList.toggle('on', b.dataset.v === fp.cat)); const r = $('#fp-res'); if (r) r.innerHTML = fpResults(); },
    'fp-add'(el) {
      const f = N.food(el.dataset.f), m = x.find('diets', fp.dietId).days[fp.day].meals[fp.meal];
      (m.items ||= []).push({ id: f.id, g: f.unit ? f.unit.g : 100 }); x.save(); x.toast(`+ ${f.name}`); x.renderMain();
    },
    'fp-close'() { x.closeModal(); x.render(); },
    'eq-open'(el) {
      const d = x.find('diets', el.dataset.id), m = d.days[+el.dataset.d].meals[+el.dataset.m], it = m.items[+el.dataset.i];
      const ex = new Set(clientsOfDiet(d).flatMap((c) => c.foodsAvoid || []));
      const list = N.equivalents(it, [...ex]), f = N.food(it.id);
      x.dialog(`<h2>Equivalencias</h2><p class="mute">Cambia <b>${esc(N.itemText(it))}</b> por cualquiera de estas porciones (mismo ${{ proteína: 'aporte de proteína', lácteo: 'aporte de proteína', carbohidrato: 'aporte de carbohidratos', fruta: 'aporte de carbohidratos', grasa: 'aporte de grasa', bebida: 'aporte de carbohidratos', verdura: 'aporte calórico' }[f.cat]}).</p>
        ${list.map((q) => `<div class="li"><span>${esc(N.itemText(q))}</span><button class="sm pri" data-act="eq-use" data-id="${d.id}" data-d="${el.dataset.d}" data-m="${el.dataset.m}" data-i="${el.dataset.i}" data-f="${q.id}" data-g="${q.g}">Usar</button></div>`).join('') || '<p class="mute">Sin equivalencias disponibles.</p>'}`);
    },
    'eq-use'(el) { const it = x.find('diets', el.dataset.id).days[+el.dataset.d].meals[+el.dataset.m].items[+el.dataset.i]; it.id = el.dataset.f; it.g = +el.dataset.g; x.save(); x.closeModal(); x.render(); },
    'dt-unassign'(el) { const c = x.cl(el.dataset.c); if (c) c.dietId = ''; x.save(); x.render(); },
    'shop-open'(el) { const d = x.find('diets', el.dataset.id); shopDialog(d.days, d.counts, d.name); },
    'shop-plan'() { const n = x.ui.nut; shopDialog(n.menus.days, n.menus.counts, 'Menú sugerido'); },
    'shop-copy'() { x.copy(x.ui.shopText); },
    'food-new': async () => { const v = await x.form('Nuevo alimento (por 100 g)', foodFields(), { cat: 'proteína', tags: [] }); if (v) { x.S.foods.push({ id: x.uid('f'), ...v, custom: true }); N.setFoods(x.S.foods); x.save(); x.render(); } },
    async 'food-edit'(el) { const a = x.S.foods.find((q) => q.id === el.dataset.id); const v = await x.form('Editar alimento', foodFields(), a); if (v) { Object.assign(a, v, { custom: true }); N.setFoods(x.S.foods); x.save(); x.render(); } },
    'nut-day': (el) => { x.ui.nut.day = +el.dataset.i; x.render(); },
    'nut-calc'(el) { runNut(x.cl(el.dataset.id), true); },
    'nut-shuffle'(el) { x.ui.nut.seed = (x.ui.nut.seed || 0) + 1; runNut(x.cl(el.dataset.id), false); },
    'nut-adjust'(el) { const c = x.cl(el.dataset.id); x.ui.nut = { ...x.ui.nut, clientId: c.id, cfg: { ...readCfg(), adjust: (x.ui.nut?.cfg?.adjust || 0) + +el.dataset.n } }; runNut(c, false); },
    'nut-save'(el) {
      const c = x.cl(el.dataset.id), n = x.ui.nut, p = n.plan;
      const d = { id: x.uid('di'), name: `${c.name.split(' ')[0]} · ${{ perder: 'definición', mantener: 'mantenimiento', ganar: 'volumen' }[n.cfg.goal]}`, kcal: p.target.kcal, protein: p.target.p, carbs: p.target.c, fat: p.target.f, notes: [...p.notes, ...n.tips].join('\n'),
        days: JSON.parse(JSON.stringify(n.menus.days)), counts: n.menus.counts, extra: { water: p.water, fiber: p.fiber, supplements: p.supplements, tips: n.tips, dayTargets: p.dayTargets, perKg: p.perKg } };
      x.S.diets.push(d); c.dietId = d.id; x.save(); x.render(); x.toast('Dieta guardada y asignada');
    },
  };
  const foodFields = () => [{ k: 'name', l: 'Nombre', req: 1 }, { k: 'cat', l: 'Categoría', t: 'select', o: x.plain(N.FOOD_CATS) }, { k: 'kcal', l: 'Calorías (por 100 g)', t: 'number', step: '0.1' }, { k: 'p', l: 'Proteína g', t: 'number', step: '0.1' }, { k: 'c', l: 'Carbohidratos g', t: 'number', step: '0.1' }, { k: 'f', l: 'Grasa g', t: 'number', step: '0.1' }, { k: 'tags', l: 'Restricciones que contiene', t: 'checks', o: N.RESTRICTIONS.map((r) => [r[0], r[1]]) }];
  function readCfg() {
    const g = (id) => document.getElementById(id);
    if (!g('n-goal')) return x.ui.nut?.cfg;
    return { goal: g('n-goal').value, rate: g('n-rate').value, meals: +g('n-meals').value, eq: g('n-eq').value, cycle: g('n-cycle').value === '1', adjust: x.ui.nut?.cfg?.adjust || 0 };
  }
  function runNut(c, fresh) {
    const cfg = readCfg() || x.ui.nut.cfg;
    if (fresh) cfg.adjust = 0;
    const plan = N.calcPlan(c, { goal: cfg.goal, rate: cfg.rate ? +cfg.rate : null, eq: cfg.eq, cycle: cfg.cycle, trainDays: c.daysPerWeek, adjust: cfg.adjust });
    const prev = !fresh && x.ui.nut?.clientId === c.id ? x.ui.nut : {};
    x.ui.nut = { clientId: c.id, cfg, plan, seed: fresh ? 0 : prev.seed || 0, day: 0 };
    if (!plan.error) { x.ui.nut.menus = N.buildPlanMenus(c, plan, { meals: cfg.meals, seed: x.ui.nut.seed }); x.ui.nut.tips = N.trackTips(c, cfg.goal); }
    x.render();
  }
  return { V, ACT, nutritionTab };
}
