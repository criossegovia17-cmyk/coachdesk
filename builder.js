// Constructor de rutinas conectado a la biblioteca: se elige el ejercicio con imagen, filtros y compatibilidad con el cliente.
import { load as loadCat, search as searchCat, loaded as catLoaded, getEx } from './catalog.js?v=16';
export function make(x) {
  const { esc, ic, btn, $ } = x;
  const pick = (x.ui.pick ||= { routineId: null, day: 0, replace: null, q: '', grp: '', pattern: '', type: '', level: '', compat: true, added: 0 });
  const clientsOf = (r) => x.S.clients.filter((c) => c.routineId === r.id);
  const issues = (e, c) => {
    if (!c) return [];
    const out = [];
    e.avoid.filter((a) => (c.injuries || []).includes(a)).forEach((a) => out.push(`⚠ ${a}`));
    if (!e.equip.some((q) => q === 'peso corporal' || (c.equipment || []).includes(q))) out.push('sin equipo');
    return out;
  };
  const pickClient = () => { const r = x.find('routines', pick.routineId); return r ? clientsOf(r)[0] : null; };

  // ----- Selector de ejercicios (modal) -----
  function results() {
    const c = pickClient(), q = pick.q.toLowerCase();
    let list = x.S.exercises.filter((e) => (!q || e.name.toLowerCase().includes(q) || e.muscle.includes(q)) && (!pick.grp || e.muscle === pick.grp) && (!pick.pattern || e.pattern === pick.pattern) && (!pick.type || e.type === pick.type) && (!pick.level || e.level === pick.level));
    if (pick.compat && c) list = list.filter((e) => !issues(e, c).length);
    let extra = '';
  if (pick.catalog) {
    if (!catLoaded()) { loadCat().then(refreshResults).catch(() => {}); extra = '<p class="mute">Cargando catálogo ampliado…</p>'; }
    else {
      let more = searchCat({ q: pick.q, grp: pick.grp, pattern: pick.pattern, type: pick.type, level: pick.level }, x.S.exercises);
      if (pick.compat && c) more = more.filter((e) => !issues(e, c).length);
      extra = `<h4 style="margin-top:18px">Catálogo ampliado (en inglés)</h4><div class="pkgrid">${more.slice(0, 40).map((e) => `<button class="pk" data-act="pk-add" data-cat="${esc(e.id)}"><span class="pki">${e.images?.[0] ? `<img loading="lazy" src="${e.images[0]}" alt="" onerror="this.remove()">` : ''}</span><span class="pkb"><b>${esc(e.name)}</b><small>${esc(e.muscle)} · ${esc(e.type)} · ${e.level}</small></span><span class="pkp">${ic('plus', 16)}</span></button>`).join('') || '<p class="mute">Sin resultados en el catálogo.</p>'}</div>`;
    }
  }
  return `<p class="mini">${list.length} ejercicios${pick.compat && c ? ` compatibles con ${esc(c.name.split(' ')[0])}` : ''}</p><div class="pkgrid">${list.map((e) => {
      const bad = issues(e, c);
      return `<button class="pk ${bad.length ? 'warn' : ''}" data-act="pk-add" data-id="${e.id}"><span class="pki">${e.images?.[0] ? `<img loading="lazy" src="${e.images[0]}" alt="" onerror="this.remove()">` : `<span class="noimg">${ic('zap', 22)}</span>`}</span>
        <span class="pkb"><b>${esc(e.name)}</b><small>${esc(e.muscle)} · ${esc(e.type || '')} · ${e.level}</small>${bad.length ? `<small class="bad">${bad.join(' · ')}</small>` : ''}</span><span class="pkp">${ic('plus', 16)}</span></button>`;
    }).join('') || '<p class="mute">Sin resultados con esos filtros.</p>'}</div>${extra}`;
  }
  function openPicker() {
    const r = x.find('routines', pick.routineId), c = pickClient();
    const m = $('#modal'); m.hidden = false;
    const d = r.days[pick.day];
    m.innerHTML = `<div class="dlg wide picker"><div class="row sp"><div><h2>${pick.replace != null ? 'Cambiar ejercicio' : 'Agregar a la rutina'}</h2><p class="mute" style="margin:0">${esc(d?.name || '')}${c ? ` · para ${esc(c.name)}` : ''}</p></div><button data-act="pk-close" class="pri">Listo${pick.added ? ` (${pick.added})` : ''}</button></div>
      <div class="pkf"><div class="search">${x.ic('search', 16)}<input data-pk="q" placeholder="Buscar ejercicio o músculo…" value="${esc(pick.q)}" autocomplete="off"></div>
        <select data-pk="pattern"><option value="">Patrón</option>${x.PATTERNS.map((v) => `<option ${v === pick.pattern ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <select data-pk="type"><option value="">Tipo</option>${x.TYPES.map((v) => `<option ${v === pick.type ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <select data-pk="level"><option value="">Nivel</option>${['principiante', 'intermedio', 'avanzado'].map((v) => `<option ${v === pick.level ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="chipbar"><button class="${pick.grp ? '' : 'on'}" data-act="pk-grp" data-v="">Todos</button>${x.GROUPS.map((g) => `<button class="${pick.grp === g ? 'on' : ''}" data-act="pk-grp" data-v="${g}">${g}</button>`).join('')}</div>
      <label class="chk"><input type="checkbox" data-pk="catalog" ${pick.catalog ? 'checked' : ''}> Incluir el catálogo ampliado (800+ ejercicios, en inglés)</label>
      ${c ? `<label class="chk"><input type="checkbox" data-pk="compat" ${pick.compat ? 'checked' : ''}> Mostrar solo ejercicios compatibles con ${esc(c.name.split(' ')[0])} (lesiones y equipo)</label>` : ''}
      <div id="pk-res" class="pkres">${results()}</div></div>`;
  }
  const refreshResults = () => { const el = $('#pk-res'); if (el) el.innerHTML = results(); };
  const refreshHead = () => { const b = document.querySelector('[data-act=pk-close]'); if (b) b.textContent = `Listo${pick.added ? ` (${pick.added})` : ''}`; };

  document.addEventListener('input', (e) => { if (e.target.dataset?.pk === 'q') { pick.q = e.target.value; refreshResults(); } });
  document.addEventListener('change', (e) => {
    const k = e.target.dataset?.pk; if (!k || k === 'q') return;
    pick[k] = k === 'compat' ? e.target.checked : e.target.value; refreshResults();
  });

  // ----- Vista de la rutina -----
  const stats = (r) => { const items = r.days.flatMap((d) => d.items); return { days: r.days.length, ex: items.length, sets: items.reduce((a, i) => a + (+i.sets || 0), 0) }; };
  const row = (r, di, d, it, ii) => {
    const e = x.ex(it.exId), c = clientsOf(r)[0], bad = issues(e || { avoid: [], equip: ['peso corporal'] }, c);
    return `<div class="rb ${bad.length ? 'warn' : ''}"><div class="rb-main">${x.thumb(e)}<div class="rb-name" data-act="rb-swap" data-id="${r.id}" data-d="${di}" data-i="${ii}" title="Cambiar ejercicio"><b>${e ? esc(e.name) : '<span class="mute">Elegir ejercicio…</span>'}</b>
        <small>${e ? `${esc(e.muscle)} · ${esc(e.type || '')}` : 'Toca para elegir de la biblioteca'}${bad.length ? ` · <span class="bad">${bad.join(' ')}</span>` : ''}</small></div></div>
      <label class="rb-f"><small>Súper</small><input data-path="days.${di}.items.${ii}.sup" value="${esc(it.sup || '')}" placeholder="A1"></label>
      <label class="rb-f"><small>Series</small><input type="number" min="1" data-path="days.${di}.items.${ii}.sets" value="${it.sets}"></label>
      <label class="rb-f"><small>Reps</small><input data-path="days.${di}.items.${ii}.reps" value="${esc(it.reps)}"></label>
      <label class="rb-f"><small>Descanso</small><input data-path="days.${di}.items.${ii}.rest" value="${esc(it.rest)}"></label>
      <label class="rb-f wide"><small>Nota / RIR</small><input data-path="days.${di}.items.${ii}.note" value="${esc(it.note)}" placeholder="Opcional"></label>
      <span class="acts"><button class="sm" data-act="rb-move" data-id="${r.id}" data-d="${di}" data-i="${ii}" data-n="-1" title="Subir">↑</button><button class="sm" data-act="rb-move" data-id="${r.id}" data-d="${di}" data-i="${ii}" data-n="1" title="Bajar">↓</button>${e ? `<button class="sm" data-act="ex-view" data-id="${e.id}" title="Ver ejemplo">${ic('eye', 14)}</button>` : ''}<button class="sm del" data-act="ritem-del" data-id="${r.id}" data-d="${di}" data-i="${ii}">${ic('trash', 14)}</button></span></div>`;
  };

  const V = {
    rutina(id) {
      const r = x.S.routines.find((q) => q.id === id); if (!r) return '<p>No encontrada.</p>';
      const st = stats(r), cs = clientsOf(r);
      const free = x.S.clients.filter((c) => c.routineId !== r.id);
      return `<div class="crumb"><a href="#/entrenamientos">${ic('back', 16)} Entrenamientos</a></div><div data-root="routines:${r.id}">
      <section class="card rhead"><div class="rh-main"><label class="fl" style="margin-top:0">Rutina</label><input class="title-in big" data-path="name" value="${esc(r.name)}">
        <div class="two"><div><label class="fl">Objetivo</label><input data-path="goal" value="${esc(r.goal)}" placeholder="Ej. Ganar fuerza, bajar grasa…"></div>
        <div><label class="fl">Persona</label><div class="people">${cs.map((c) => `<span class="pchip">${x.avatar(c.name)}<span>${esc(c.name)}</span><button data-act="rb-unassign" data-id="${r.id}" data-c="${c.id}" title="Quitar">×</button></span>`).join('') || '<span class="mute">Sin asignar</span>'}</div>
          <select data-act-change="rb-assign" id="rb-assign" data-id="${r.id}"><option value="">+ Asignar a un cliente…</option>${free.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div></div></div>
        <div class="rh-stats"><div><b>${st.days}</b><small>días</small></div><div><b>${st.ex}</b><small>ejercicios</small></div><div><b>${st.sets}</b><small>series</small></div></div></section>
      ${r.program ? `<div class="card prog"><h3>Progresión</h3><div class="weeks">${r.program.weeks.map((w) => `<div class="wk"><b>${esc(w.label)}</b><span class="tag">RIR ${esc(w.rir)}</span><small>${esc(w.note)}</small></div>`).join('')}</div><ul class="plain">${r.program.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
      ${r.days.map((d, di) => `<section class="card day"><div class="row sp"><input data-path="days.${di}.name" value="${esc(d.name)}" class="title-in"><div class="acts">${btn('Duplicar', 'rb-dup-day', `data-id="${r.id}" data-d="${di}"`, 'copy', 'sm')}${btn('', 'rday-del', `data-id="${r.id}" data-d="${di}"`, 'trash', 'sm del')}</div></div>
        ${d.items.map((it, ii) => row(r, di, d, it, ii)).join('') || '<p class="mute empty">Aún no hay ejercicios en este día.</p>'}
        <button class="addex" data-act="rb-add" data-id="${r.id}" data-d="${di}">${ic('plus', 18)} Agregar ejercicio de la biblioteca</button></section>`).join('')}
      <div class="bar">${btn('Agregar día', 'rday-add', `data-id="${r.id}"`, 'plus')}${btn('Copiar para WhatsApp', 'copy-routine', `data-id="${r.id}"`, 'copy')}<a class="btn" href="#/hojar/${r.id}">${ic('print', 16)}Hoja PDF</a></div></div>`;
    },
  };

  const ACT = {
    async 'routine-new'(el) {
      const cid = el?.dataset?.c || '';
      const c = x.cl(cid);
      const v = await x.form('Nueva rutina', [
        { k: 'clientId', l: 'Persona', t: 'select', o: [['', '— sin asignar (plantilla) —'], ...x.S.clients.map((q) => [q.id, q.name])] },
        { k: 'goal', l: 'Objetivo', ph: 'Ej. Ganar fuerza, bajar grasa, velocidad de lanzamiento…' },
        { k: 'name', l: 'Nombre de la rutina (opcional)' }, { k: 'days', l: 'Cuántos días por semana', t: 'number' },
      ], { clientId: cid, goal: c?.goal || '', name: '', days: c?.daysPerWeek || 3 });
      if (!v) return;
      const cc = x.cl(v.clientId), n = Math.min(7, Math.max(1, Number(v.days) || 3));
      const r = { id: x.uid('r'), name: v.name || (cc ? `${cc.name.split(' ')[0]} · ${v.goal || 'Rutina'}` : v.goal || 'Nueva rutina'), goal: v.goal, days: Array.from({ length: n }, (_, i) => ({ name: `Día ${i + 1}`, items: [] })) };
      x.S.routines.push(r); if (cc) { cc.routineId = r.id; cc.programStart = x.today(); } x.save(); location.hash = '#/rutina/' + r.id;
    },
    'rb-add'(el) { Object.assign(pick, { routineId: el.dataset.id, day: +el.dataset.d, replace: null, added: 0 }); openPicker(); },
    'rb-swap'(el) { Object.assign(pick, { routineId: el.dataset.id, day: +el.dataset.d, replace: +el.dataset.i, added: 0 }); openPicker(); },
    'pk-grp'(el) { pick.grp = el.dataset.v; document.querySelectorAll('.chipbar button').forEach((b) => b.classList.toggle('on', b.dataset.v === pick.grp)); refreshResults(); },
    'pk-add'(el) {
      const r = x.find('routines', pick.routineId), d = r.days[pick.day];
      let e = x.ex(el.dataset.id);
      if (el.dataset.cat) { e = getEx(el.dataset.cat); if (!e) return; x.S.exercises.push(e); }
      if (pick.replace != null) { d.items[pick.replace].exId = e.id; x.save(); x.closeModal(); x.render(); return; }
      const t = e.type === 'potencia' ? { sets: 4, reps: '3-5', rest: '90 s' } : e.type === 'isométrico' ? { sets: 3, reps: '30 s', rest: '60 s' } : e.pattern === 'aislamiento' ? { sets: 3, reps: '10-15', rest: '60 s' } : e.type === 'cuidado del brazo' || e.type === 'movilidad' ? { sets: 2, reps: '12', rest: '30 s' } : { sets: 3, reps: '8-10', rest: '90 s' };
      d.items.push({ exId: e.id, ...t, note: '' }); pick.added++; x.save(); refreshHead(); x.toast(`+ ${e.name}`);
      // refleja el cambio detrás del modal sin cerrarlo
      const main = $('#main'); if (main) { const y = window.scrollY; x.renderMain(); window.scrollTo(0, y); }
    },
    'pk-close'() { x.closeModal(); x.render(); },
    'rb-move'(el) {
      const items = x.find('routines', el.dataset.id).days[+el.dataset.d].items, i = +el.dataset.i, j = i + +el.dataset.n;
      if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; x.save(); x.render();
    },
    'rb-dup-day'(el) { const r = x.find('routines', el.dataset.id), d = r.days[+el.dataset.d]; r.days.splice(+el.dataset.d + 1, 0, { name: d.name + ' (copia)', items: d.items.map((i) => ({ ...i })) }); x.save(); x.render(); },
    'rb-unassign'(el) { const c = x.cl(el.dataset.c); if (c) c.routineId = ''; x.save(); x.render(); },
  };
  document.addEventListener('change', (e) => {
    if (e.target.id === 'rb-assign' && e.target.value) { const c = x.cl(e.target.value); c.routineId = e.target.dataset.id; c.programStart = x.today(); x.save(); x.render(); }
  });
  return { V, ACT };
}
