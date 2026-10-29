// Actividad de clientes: portal (enlaces), registros de entrenos/check-ins/fichas, fuerza y fotos de progreso.
export function make(x) {
  const { esc, ic, btn, sb, $ } = x;
  const PORTAL = new URL('portal.html', location.href.split('#')[0].split('?')[0]).href;
  const links = (x.ui.links ||= {});   // clientId -> token activo
  const logs = (x.ui.logs ||= []);
  const urlCache = (x.ui.urlCache ||= {});
  const fdate = (s) => x.fdate(s.slice(0, 10));
  const cname = (id) => x.cl(id)?.name || 'Cliente';
  const e1rm = (kg, reps) => kg * (1 + reps / 30);

  async function loadLinks() {
    const { data } = await sb.from('portal_links').select('token, client_id, revoked, created_at').eq('revoked', false).order('created_at', { ascending: false });
    Object.keys(links).forEach((k) => delete links[k]);
    (data || []).forEach((l) => { if (!links[l.client_id]) links[l.client_id] = l.token; });
  }
  async function loadLogs() {
    const { data } = await sb.from('client_logs').select('*').order('created_at', { ascending: false }).limit(400);
    logs.splice(0, logs.length, ...(data || []));
  }
  async function refresh(quiet) {
    const before = logs.filter((l) => !l.handled).length;
    await Promise.all([loadLinks(), loadLogs()]);
    const after = logs.filter((l) => !l.handled).length;
    if (quiet && after > before && document.visibilityState === 'visible') x.toast(`Tienes ${after - before} novedad(es) de tus clientes`);
    if (quiet) { if (['', '#/'].includes(location.hash) || /#\/cliente\//.test(location.hash)) x.renderMain(); } else x.render();
  }
  const link = (c) => (links[c.id] ? `${PORTAL}?t=${links[c.id]}` : '');
  const newToken = () => { const a = new Uint8Array(24); crypto.getRandomValues(a); return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };

  // ---------- helpers de análisis ----------
  const repTop = (r) => { const t = String(r || ''); if (/(^|[^a-z])s([^a-z]|$)|seg|min/i.test(t)) return null; const n = (t.match(/[0-9]+/g) || []).map(Number); return n.length ? Math.max(...n) : null; };
  function readyToProgress(c) {
    const r = x.S.routines.find((q) => q.id === c.routineId); if (!r) return [];
    const seen = new Set(), out = [], wl = clogs(c, 'workout');
    r.days.forEach((d) => d.items.forEach((it) => {
      if (seen.has(it.exId)) return; seen.add(it.exId);
      const top = repTop(it.reps); if (!top) return;
      for (const w of wl) {
        const en = (w.data.entries || []).find((e) => e.exId === it.exId);
        if (en && en.sets?.length) {
          const kgs = en.sets.map((s) => +s.kg || 0), reps = en.sets.map((s) => +s.reps || 0), max = Math.max(...kgs);
          if (max && en.sets.length >= Math.min(+it.sets || 3, 3) && reps.every((v) => v >= top)) { const inc = Math.min(5, Math.max(1.25, Math.round(max * 0.05 / 1.25) * 1.25)); out.push({ name: en.name || x.ex(it.exId)?.name || '', from: max, to: Math.round((max + inc) * 100) / 100, top }); }
          break;
        }
      }
    }));
    return out;
  }
  function muscleVolume(c) {
    const since = Date.now() - 7 * 864e5, m = {};
    clogs(c, 'workout').filter((w) => new Date(w.created_at) >= since).forEach((w) => (w.data.entries || []).forEach((en) => { const mu = x.ex(en.exId)?.muscle; if (!mu) return; const n = (en.sets || []).filter((s) => +s.reps > 0).length; if (n) m[mu] = (m[mu] || 0) + n; }));
    return m;
  }
  // Señales de que un cliente se puede perder
  function riskInfo(c) {
    const reasons = [], hasPortal = !!links[c.id], w = clogs(c, 'workout')[0], t = x.today();
    if (hasPortal) {
      if (!w) reasons.push('aún no registra entrenamientos');
      else { const d = Math.floor((Date.now() - new Date(w.created_at)) / 864e5); if (d >= 7) reasons.push(`${d} días sin entrenar`); }
    }
    if (x.S.payments.some((p) => p.clientId === c.id && p.status !== 'pagado' && p.due < t)) reasons.push('pago vencido');
    if (x.S.appointments.filter((a) => a.status === 'no vino' && x.apptIds(a).includes(c.id) && Math.floor((Date.now() - new Date(a.date + 'T12:00')) / 864e5) <= 30).length >= 2) reasons.push('faltó 2 o más veces este mes');
    if (typeof c.credits === 'number' && c.credits <= 1) reasons.push(c.credits === 0 ? 'sin sesiones en su paquete' : '1 sesión restante');
    const lastDone = x.S.appointments.filter((a) => a.status === 'realizada' && x.apptIds(a).includes(c.id)).map((a) => a.date).sort().at(-1);
    if (!hasPortal && lastDone && Math.floor((Date.now() - new Date(lastDone + 'T12:00')) / 864e5) >= 21) reasons.push('3 semanas sin sesión');
    return reasons;
  }
  const clogs = (c, kind) => logs.filter((l) => l.client_id === c.id && (!kind || l.kind === kind));
  function strength(c) {
    const by = {};
    [...clogs(c, 'workout')].reverse().forEach((w) => (w.data.entries || []).forEach((en) => {
      const best = Math.max(0, ...(en.sets || []).map((s) => (+s.kg > 0 && +s.reps > 0 ? e1rm(+s.kg, +s.reps) : 0)));
      if (best > 0) (by[en.exId] ||= { name: en.name, pts: [] }).pts.push({ d: w.created_at.slice(0, 10), v: Math.round(best * 10) / 10 });
    }));
    return Object.values(by).filter((q) => q.pts.length >= 1).sort((a, b) => b.pts.length - a.pts.length).slice(0, 6);
  }
  function weekBars(c) {
    const out = [], now = new Date();
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0, 0, 0, 0);
    for (let i = 3; i >= 0; i--) {
      const s = new Date(mon); s.setDate(mon.getDate() - 7 * i); const e = new Date(s); e.setDate(s.getDate() + 7);
      out.push({ label: s.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }), n: clogs(c, 'workout').filter((w) => { const t = new Date(w.created_at); return t >= s && t < e; }).length });
    }
    return out;
  }
  const spark = (vals) => {
    if (vals.length < 2) return '<span class="mute small">1 registro</span>';
    const W = 160, H = 38, mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * (W - 8) + 4},${H - 5 - ((v - mn) / r) * (H - 10)}`);
    return `<svg viewBox="0 0 ${W} ${H}" class="mspark"><polyline fill="none" stroke="var(--pri)" stroke-width="2.5" stroke-linejoin="round" points="${pts.join(' ')}"/></svg>`;
  };

  // ---------- fotos de progreso ----------
  const photos = (c) => [...(c.photos || [])].sort((a, b) => a.date.localeCompare(b.date));
  async function hydrate() {
    const need = [...document.querySelectorAll('img[data-path]')].filter((i) => !i.src || i.dataset.pending);
    const paths = [...new Set(need.map((i) => i.dataset.path))].filter((p) => !urlCache[p]);
    if (paths.length) { const { data } = await sb.storage.from('client-files').createSignedUrls(paths, 3600); (data || []).forEach((d) => { if (d.signedUrl) urlCache[d.path] = d.signedUrl; }); }
    need.forEach((i) => { const u = urlCache[i.dataset.path]; if (u) { i.src = u; delete i.dataset.pending; } });
  }
  function photosSection(c) {
    const ps = photos(c), cmp = x.ui.cmp?.id === c.id ? x.ui.cmp : { a: ps[0]?.path, b: ps.at(-1)?.path };
    const opt = (sel) => ps.map((p) => `<option value="${esc(p.path)}" ${p.path === sel ? 'selected' : ''}>${x.fdate(p.date)} · ${esc(p.pose)}</option>`).join('');
    return `<section class="card"><div class="row sp"><h3>Fotos de progreso</h3><label class="btn sm">${ic('plus', 14)}Subir foto<input type="file" id="photo-up" data-client="${c.id}" accept="image/*" hidden></label></div>
      ${ps.length ? `<div class="photos">${ps.map((p, i) => `<figure><img data-path="${esc(p.path)}" data-pending="1" alt="" loading="lazy"><figcaption>${x.fdate(p.date)} · ${esc(p.pose)} <button class="sm del" data-act="photo-del" data-id="${c.id}" data-i="${c.photos.indexOf(p)}">${ic('trash', 12)}</button></figcaption></figure>`).join('')}</div>
        ${ps.length > 1 ? `<h4>Comparar antes y después</h4><div class="two"><select data-cmp="a">${opt(cmp.a)}</select><select data-cmp="b">${opt(cmp.b)}</select></div><div class="two cmp"><img data-path="${esc(cmp.a)}" data-pending="1" alt=""><img data-path="${esc(cmp.b)}" data-pending="1" alt=""></div>` : ''}`
      : '<p class="mute">Sube fotos de frente, perfil y espalda cada 2-4 semanas. Luego compáralas lado a lado.</p>'}</section>`;
  }

  // ---------- pestaña Actividad ----------
  function feedItem(l) {
    const d = l.data || {};
    const handled = l.handled ? '<span class="tag ok">visto</span>' : '<span class="tag warn">nuevo</span>';
    const act = (label, a) => `<button class="sm" data-act="${a}" data-id="${l.id}">${label}</button>`;
    if (l.kind === 'workout') return `<div class="fd"><div class="row sp"><b>🏋️ ${esc(d.dayName || 'Entrenamiento')}</b>${handled}</div><div class="mute small">${fdate(l.created_at)} · ${d.durationMin || '?'} min${d.rpe ? ` · esfuerzo ${d.rpe}/10` : ''}</div>${d.note ? `<p class="fn">“${esc(d.note)}”</p>` : ''}
      <details><summary>${(d.entries || []).length} ejercicios</summary>${(d.entries || []).map((en) => `<div class="fe"><b>${esc(en.name)}</b> ${(en.sets || []).map((s) => `${esc(s.kg || '–')}×${esc(s.reps || '–')}`).join(' · ')}</div>`).join('')}</details>${l.handled ? '' : act('Marcar visto', 'log-seen')}</div>`;
    if (l.kind === 'checkin') return `<div class="fd"><div class="row sp"><b>📋 Check-in</b>${handled}</div><div class="mute small">${fdate(l.created_at)}</div><div class="chips"><span class="chip">Adherencia <b>${d.adherence}/5</b></span><span class="chip">Energía <b>${d.energy}/5</b></span>${d.sleep ? `<span class="chip">Sueño <b>${esc(d.sleep)} h</b></span>` : ''}${d.weight ? `<span class="chip">Peso <b>${esc(d.weight)} kg</b></span>` : ''}</div>${d.pain ? `<p class="al warn">${ic('alert', 14)}<span>${esc(d.pain)}</span></p>` : ''}${d.note ? `<p class="fn">“${esc(d.note)}”</p>` : ''}
      <div class="bar" style="margin:6px 0 0">${d.weight && !l.handled ? act('Guardar peso en Progreso', 'log-weight') : ''}${l.handled ? '' : act('Marcar visto', 'log-seen')}</div></div>`;
    if (l.kind === 'intake') return `<div class="fd"><div class="row sp"><b>🧾 Ficha inicial</b>${handled}</div><div class="mute small">${fdate(l.created_at)}</div><div class="chips"><span class="chip">${esc(d.age || '?')} años</span><span class="chip">${d.sex === 'f' ? 'Mujer' : 'Hombre'}</span><span class="chip">${esc(d.height || '?')} cm</span>${d.weight ? `<span class="chip">${esc(d.weight)} kg</span>` : ''}<span class="chip">${esc(d.days || '?')} días/sem</span></div>
      ${d.goal ? `<p><b>Objetivo:</b> ${esc(d.goal)}</p>` : ''}${(d.injuries || []).length ? `<p><b>Lesiones:</b> ${d.injuries.map((i) => `<span class="tag bad">⚠ ${esc(i)}</span>`).join('')}</p>` : ''}${(d.parq || []).length ? `<p class="al bad">${ic('alert', 14)}<span>Respondió SÍ en ${d.parq.length} pregunta(s) de salud. Revisa antes de empezar.</span></p>` : ''}${d.notes ? `<p class="fn">“${esc(d.notes)}”</p>` : ''}
      <div class="bar" style="margin:6px 0 0">${l.handled ? '' : act('Aplicar a la ficha del cliente', 'log-apply')}</div></div>`;
    if (d.from === 'client') return `<div class="fd"><div class="row sp"><b>💬 ${esc(cname(l.client_id).split(' ')[0])} te escribió</b>${handled}</div><div class="mute small">${fdate(l.created_at)}</div><p class="fn" style="font-style:normal;color:var(--ink)">${esc(d.text)}</p><div class="bar" style="margin:6px 0 0">${btn('Responder', 'log-msg', `data-id="${l.client_id}"`, 'chat', 'sm pri')}${l.handled ? '' : act('Marcar visto', 'log-seen')}</div></div>`;
    return `<div class="fd"><div class="row sp"><b>💬 Mensaje enviado</b></div><div class="mute small">${fdate(l.created_at)}</div><p class="fn">${esc(d.text)}</p></div>`;
  }
  function activityTab(c) {
    const lk = link(c), wb = weekBars(c), st = strength(c), feed = clogs(c);
    const mx = Math.max(1, ...wb.map((b) => b.n), (x.S.routines.find((r) => r.id === c.routineId)?.days.length) || 0);
    const msg = encodeURIComponent(`Hola ${c.name.split(' ')[0]}, aquí está tu plan de entrenamiento y nutrición. Ábrelo desde tu celular, registra tus series y haz tu check-in cada semana:\n${lk}`);
    return `<section class="card portalcard"><div class="row sp"><div><h3>Portal del cliente</h3><p class="mute" style="margin:2px 0 0">Tu cliente ve su rutina con imágenes, registra series y pesos, ve su menú y te manda check-ins desde el celular. Sin descargar nada.</p></div>${lk ? '<span class="tag ok">Activo</span>' : '<span class="tag">Apagado</span>'}</div>
      ${lk ? `<div class="linkbox"><input readonly value="${esc(lk)}" onclick="this.select()"></div><div class="bar">${btn('Copiar enlace', 'portal-copy', `data-id="${c.id}"`, 'copy', 'pri')}<a class="btn" target="_blank" href="${esc(lk)}">${ic('eye', 16)}Ver como cliente</a>${c.phone ? `<a class="btn" target="_blank" href="https://wa.me/${c.phone.replace(/\D/g, '')}?text=${msg}">${ic('chat', 16)}Enviar por WhatsApp</a>` : ''}${btn('Nuevo enlace', 'portal-regen', `data-id="${c.id}"`, '', 'sm')}${btn('Desactivar', 'portal-off', `data-id="${c.id}"`, '', 'sm del')}</div><p class="mini">Cualquiera con este enlace ve el plan de ${esc(c.name.split(' ')[0])} (no ve su teléfono, correo ni notas). Si lo comparte por error, genera uno nuevo.</p>`
      : `<div class="bar">${btn('Activar portal', 'portal-on', `data-id="${c.id}"`, 'zap', 'pri')}</div>`}</section>
    <div class="cols"><section class="card"><h3>Constancia (últimas 4 semanas)</h3><div class="wbars">${wb.map((b) => `<div><i style="height:${Math.max(6, b.n / mx * 100)}%"><em>${b.n}</em></i><small>${esc(b.label)}</small></div>`).join('')}</div></section>
      <section class="card"><h3>Fuerza (1RM estimado)</h3>${st.length ? st.map((q) => { const v = q.pts.map((p) => p.v), diff = v.at(-1) - v[0]; return `<div class="str"><div class="sn"><b>${esc(q.name)}</b><small>${v.at(-1)} kg${v.length > 1 ? ` · ${diff >= 0 ? '+' : ''}${Math.round(diff * 10) / 10} kg` : ''}</small></div>${spark(v)}</div>`; }).join('') : '<p class="mute">Cuando tu cliente registre series con peso, verás su progreso de fuerza aquí.</p>'}</section></div>
    ${(() => { const rp = readyToProgress(c), mv = muscleVolume(c); return `<div class="cols"><section class="card"><h3>Listos para subir carga</h3>${rp.length ? rp.map((q) => `<div class="li"><span><b style="min-width:0">${esc(q.name)}</b><br><span class="mute small">completó ${q.top} reps en todas las series con ${q.from} kg</span></span><span class="tag ok">→ ${q.to} kg</span></div>`).join('') : '<p class="mute">Cuando tu cliente complete todas las repeticiones objetivo con el mismo peso, te sugerimos subirlo (progresión doble).</p>'}</section>
      <section class="card"><h3>Series por músculo · últimos 7 días</h3>${Object.keys(mv).length ? `<div class="chips">${Object.entries(mv).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span class="chip ${v >= 10 && v <= 20 ? 'ok' : ''}">${esc(k)} <b>${v}</b></span>`).join('')}</div><small class="mute">Rango práctico para hipertrofia: 10–20 series por músculo por semana.</small>` : '<p class="mute">Sin series registradas esta semana.</p>'}</section></div>`; })()}
    <section class="card"><div class="row sp"><h3>Actividad reciente</h3>${btn('Enviar mensaje', 'log-msg', `data-id="${c.id}"`, 'chat', 'sm')}</div>${feed.slice(0, 15).map(feedItem).join('') || '<p class="mute">Aún no hay actividad. Activa el portal y comparte el enlace.</p>'}</section>`;
  }

  const V = {};
  const ACT = {
    async 'portal-on'(el) {
      const c = x.cl(el.dataset.id), token = newToken();
      const { error } = await sb.from('portal_links').insert({ token, user_id: x.user().id, client_id: c.id });
      if (error) return x.toast('No se pudo activar: ' + error.message);
      links[c.id] = token; x.render(); x.toast('Portal activado');
    },
    async 'portal-regen'(el) {
      const c = x.cl(el.dataset.id); if (!confirm('El enlace anterior dejará de funcionar. ¿Generar uno nuevo?')) return;
      await sb.from('portal_links').update({ revoked: true }).eq('client_id', c.id).eq('revoked', false);
      const token = newToken(); const { error } = await sb.from('portal_links').insert({ token, user_id: x.user().id, client_id: c.id });
      if (error) return x.toast(error.message); links[c.id] = token; x.render(); x.toast('Enlace nuevo generado');
    },
    async 'portal-off'(el) { const c = x.cl(el.dataset.id); if (!confirm('El cliente dejará de poder abrir su plan. ¿Desactivar?')) return; await sb.from('portal_links').update({ revoked: true }).eq('client_id', c.id).eq('revoked', false); delete links[c.id]; x.render(); },
    'portal-copy'(el) { x.copy(link(x.cl(el.dataset.id))); },
    async 'log-seen'(el) { await sb.from('client_logs').update({ handled: true }).eq('id', el.dataset.id); const l = logs.find((q) => q.id === el.dataset.id); if (l) l.handled = true; x.render(); },
    async 'log-weight'(el) {
      const l = logs.find((q) => q.id === el.dataset.id), c = x.cl(l.client_id);
      c.measures.push({ date: l.created_at.slice(0, 10), weight: +l.data.weight, fat: '', waist: '', note: 'Check-in del cliente' }); x.save();
      await sb.from('client_logs').update({ handled: true }).eq('id', l.id); l.handled = true; x.render(); x.toast('Peso guardado en Progreso');
    },
    async 'log-apply'(el) {
      const l = logs.find((q) => q.id === el.dataset.id), c = x.cl(l.client_id), d = l.data;
      if (d.age) c.age = +d.age; if (d.sex) c.sex = d.sex; if (d.height) c.height = +d.height; if (d.goal) c.goal = d.goal;
      if (d.days) c.daysPerWeek = +d.days || c.daysPerWeek;
      if ((d.injuries || []).length) c.injuries = [...new Set([...(c.injuries || []), ...d.injuries])];
      if ((d.equipment || []).length) c.equipment = d.equipment; if ((d.foodsAvoid || []).length) c.foodsAvoid = d.foodsAvoid;
      c.parq = { a: d.parq || [], cleared: false, consent: true, date: l.created_at.slice(0, 10) };
      if (d.notes) c.notes = [c.notes, d.notes].filter(Boolean).join('\n');
      if (d.weight) c.measures.push({ date: l.created_at.slice(0, 10), weight: +d.weight, fat: '', waist: '', note: 'Ficha inicial' });
      x.save(); await sb.from('client_logs').update({ handled: true }).eq('id', l.id); l.handled = true; x.render(); x.toast('Ficha actualizada');
    },
    async 'log-msg'(el) {
      const c = x.cl(el.dataset.id), v = await x.form(`Mensaje para ${c.name.split(' ')[0]}`, [{ k: 'text', l: 'Mensaje (lo verá en su portal, pestaña Progreso)', t: 'textarea' }], { text: '' }); if (!v?.text.trim()) return;
      const { data } = await sb.from('client_logs').insert({ user_id: x.user().id, client_id: c.id, kind: 'message', data: { text: v.text.trim(), from: 'coach' }, handled: true }).select().single();
      if (data) logs.unshift(data); x.render(); x.toast('Mensaje enviado al portal');
    },
    async 'photo-del'(el) { const c = x.cl(el.dataset.id), p = c.photos[+el.dataset.i]; if (!confirm('¿Borrar esta foto?')) return; await sb.storage.from('client-files').remove([p.path]); c.photos.splice(+el.dataset.i, 1); x.save(); x.render(); },
  };

  document.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.id === 'photo-up' && t.files[0]) {
      const c = x.cl(t.dataset.client), f = t.files[0];
      const v = await x.form('Foto de progreso', [{ k: 'date', l: 'Fecha', t: 'date' }, { k: 'pose', l: 'Pose', t: 'select', o: x.plain(['Frente', 'Perfil', 'Espalda', 'Otra']) }], { date: x.today(), pose: 'Frente' }); if (!v) return;
      if (f.size > 12e6) return x.toast('La foto pasa de 12 MB');
      const path = `${x.user().id}/${c.id}/photos/${Date.now()}_${f.name.replace(/[^\w.\-]/g, '_')}`;
      const { error } = await sb.storage.from('client-files').upload(path, f); if (error) return x.toast(error.message);
      (c.photos ||= []).push({ path, date: v.date, pose: v.pose }); x.save(); x.render(); x.toast('Foto subida');
    }
    if (t.dataset?.cmp) { const c = x.cl(location.hash.split('/')[2]); const cur = x.ui.cmp?.id === c.id ? x.ui.cmp : { id: c.id, a: photos(c)[0]?.path, b: photos(c).at(-1)?.path }; cur[t.dataset.cmp] = t.value; cur.id = c.id; x.ui.cmp = cur; x.render(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && x.user()) refresh(true); });
  setInterval(() => { if (document.visibilityState === 'visible' && x.user()) refresh(true); }, 90000);

  return { V, ACT, activityTab, photosSection, hydrate, refresh, logs, links, link, clogs, strength, weekBars, riskInfo, photos };
}
