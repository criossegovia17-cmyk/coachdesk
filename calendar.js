// Agenda con calendario: vista mensual, semanal y lista. Módulo conectado a la app mediante el contexto x.
const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const monday = (d) => addDays(d, -((d.getDay() + 6) % 7));
const HOUR0 = 6, HOUR1 = 22, HH = 52; // alto por hora (px)
const mins = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };

export function make(x) {
  const { esc, ic, btn, today } = x;
  const cal = (x.ui.cal ||= { mode: 'month', date: today(), sel: today() });
  const who = (a) => x.apptWho(a);
  const ev = (a, compact) => `<span class="ev t-${a.type} s-${a.status.replace(' ', '-')}" data-act="appt-edit" data-id="${a.id}" title="${esc(who(a))}"><b>${a.time}</b> ${esc(who(a))}</span>`;
  const byDate = (d) => x.S.appointments.filter((a) => a.date === d).sort(x.apptSort);
  const dueOn = (d) => x.S.payments.filter((p) => p.status !== 'pagado' && p.due === d);
  const title = () => {
    const d = parse(cal.date);
    if (cal.mode === 'month') return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    if (cal.mode === 'week') { const m = monday(d), e = addDays(m, 6); return `${m.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`; }
    return 'Próximas citas';
  };

  function monthGrid() {
    const d = parse(cal.date), first = new Date(d.getFullYear(), d.getMonth(), 1), start = monday(first), t = today();
    let h = `<div class="mg">${DOW.map((n) => `<div class="mh">${n}</div>`).join('')}`;
    for (let i = 0; i < 42; i++) {
      const c = addDays(start, i), s = iso(c), list = byDate(s), dues = dueOn(s);
      h += `<div class="cd ${c.getMonth() !== d.getMonth() ? 'dim' : ''} ${s === t ? 'today' : ''} ${s === cal.sel ? 'sel' : ''}" data-act="cal-sel" data-d="${s}">
        <div class="cn"><span>${c.getDate()}</span>${dues.length ? `<i class="due" title="${dues.length} cobro(s) vencen"></i>` : ''}</div>
        ${list.slice(0, 3).map((a) => ev(a)).join('')}${list.length > 3 ? `<small class="more">+${list.length - 3} más</small>` : ''}</div>`;
    }
    return h + '</div>';
  }

  function weekGrid() {
    const m = monday(parse(cal.date)), t = today();
    const hours = Array.from({ length: HOUR1 - HOUR0 }, (_, i) => HOUR0 + i);
    let h = `<div class="wg"><div class="wh"></div>${Array.from({ length: 7 }, (_, i) => { const c = addDays(m, i); return `<div class="wh ${iso(c) === t ? 'today' : ''}"><small>${DOW[i]}</small><b>${c.getDate()}</b></div>`; }).join('')}
      <div class="wt">${hours.map((hr) => `<div style="height:${HH}px">${pad(hr)}:00</div>`).join('')}</div>`;
    for (let i = 0; i < 7; i++) {
      const c = addDays(m, i), s = iso(c);
      h += `<div class="wc ${s === t ? 'today' : ''}" style="height:${hours.length * HH}px">${hours.map((hr) => `<div class="slot" style="height:${HH}px" data-act="cal-new" data-d="${s}" data-t="${pad(hr)}:00"></div>`).join('')}
        ${byDate(s).map((a) => { const top = Math.max(0, (mins(a.time) - HOUR0 * 60) / 60 * HH), ht = Math.max(26, (a.duration || 60) / 60 * HH - 3); return `<div class="we t-${a.type} s-${a.status.replace(' ', '-')}" style="top:${top}px;height:${ht}px" data-act="appt-edit" data-id="${a.id}"><b>${a.time}</b><span>${esc(who(a))}</span></div>`; }).join('')}</div>`;
    }
    return h + '</div>';
  }

  function dayPanel() {
    const list = byDate(cal.sel), dues = dueOn(cal.sel);
    const d = parse(cal.sel);
    return `<aside class="card dp"><div class="row sp"><div><h3>${d.toLocaleDateString('es-MX', { weekday: 'long' })}</h3><div class="mute">${d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</div></div>${btn('Cita', 'cal-new', `data-d="${cal.sel}"`, 'plus', 'pri sm')}</div>
      ${list.length ? list.map((a) => apptCard(a)).join('') : '<p class="mute empty">Sin citas este día.</p>'}
      ${dues.length ? `<h4>Cobros que vencen</h4>${dues.map((p) => `<div class="li"><span>${esc(x.cl(p.clientId)?.name || '?')}</span><b>${x.money(p.amount)}</b></div>`).join('')}` : ''}</aside>`;
  }

  function apptCard(a) {
    const people = x.apptIds(a).map((i) => x.cl(i)).filter(Boolean);
    const wa = people.length === 1 && people[0].phone ? `<a class="btn sm" target="_blank" href="https://wa.me/${people[0].phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${people[0].name.split(' ')[0]}, te recuerdo tu sesión ${x.fdate(a.date)} a las ${a.time}. ¡Nos vemos! 💪`)}">${ic('chat', 14)}Recordar</a>` : '';
    return `<div class="ac t-${a.type}"><div class="row sp"><b>${a.time} · ${a.duration || 60} min</b><span class="tag ${a.status === 'realizada' ? 'ok' : a.status === 'programada' ? '' : 'bad'}">${a.status}</span></div>
      <div>${esc(who(a))} <span class="tag">${a.type}</span></div>${a.notes ? `<div class="mute">${esc(a.notes)}</div>` : ''}
      <div class="bar" style="margin:8px 0 0">${a.status === 'programada' ? `${btn('Realizada', 'appt-status', `data-id="${a.id}" data-s="realizada"`, 'check', 'sm')}${btn('No vino', 'appt-status', `data-id="${a.id}" data-s="no vino"`, '', 'sm')}${wa}` : ''}${btn('', 'appt-edit', `data-id="${a.id}"`, 'edit', 'sm')}${btn('', 'appt-del', `data-id="${a.id}"`, 'trash', 'sm del')}</div></div>`;
  }

  function listView() {
    const t = today();
    const list = x.S.appointments.filter((a) => a.date >= t).sort(x.apptSort);
    const byDay = {}; list.forEach((a) => (byDay[a.date] ||= []).push(a));
    return Object.entries(byDay).map(([d, as]) => `<section class="card"><h3>${x.fdate(d)}${d === t ? ' · Hoy' : ''}</h3>${as.map(apptCard).join('')}</section>`).join('') || '<p class="mute">No hay citas próximas.</p>';
  }

  const V = {
    agenda() {
      const t = today(), wk = monday(parse(t));
      const wkList = x.S.appointments.filter((a) => a.date >= iso(wk) && a.date <= iso(addDays(wk, 6)));
      const nh = byDate(t).filter((a) => a.status === 'programada').length, nw = wkList.filter((a) => a.status === 'programada').length;
      const body = cal.mode === 'month' ? `<div class="calwrap"><div class="card calc">${monthGrid()}</div>${dayPanel()}</div>`
        : cal.mode === 'week' ? `<div class="card calc wk">${weekGrid()}</div>` : listView();
      return x.page('Agenda', `${nh} cita${nh === 1 ? '' : 's'} hoy · ${nw} esta semana`, btn('Nueva cita', 'cal-new', `data-d="${cal.sel}"`, 'plus', 'pri'),
        `<div class="bar calbar"><div class="row"><button class="sm" data-act="cal-nav" data-n="-1">${ic('back', 16)}</button><button class="sm" data-act="cal-today">Hoy</button><button class="sm" data-act="cal-nav" data-n="1" style="transform:scaleX(-1)">${ic('back', 16)}</button><h2 class="caltitle">${title()}</h2></div>
        <span class="grow"></span><div class="seg">${[['month', 'Mes'], ['week', 'Semana'], ['list', 'Lista']].map(([k, l]) => `<button class="${cal.mode === k ? 'on' : ''}" data-act="cal-mode" data-v="${k}">${l}</button>`).join('')}</div></div>
        <div class="legend"><span><i class="lg t-individual"></i>Individual</span><span><i class="lg t-grupal"></i>Grupal</span><span><i class="lg due"></i>Vence un cobro</span></div>${body}`);
    },
  };

  const ACT = {
    'cal-mode': (el) => { cal.mode = el.dataset.v; x.render(); },
    'cal-today': () => { cal.date = cal.sel = today(); x.render(); },
    'cal-nav': (el) => {
      const n = +el.dataset.n, d = parse(cal.date);
      if (cal.mode === 'month') { d.setDate(1); d.setMonth(d.getMonth() + n); } else if (cal.mode === 'week') d.setDate(d.getDate() + 7 * n);
      cal.date = iso(d); if (cal.mode === 'month') cal.sel = iso(d); x.render();
    },
    'cal-sel': (el) => { cal.sel = el.dataset.d; x.render(); },
    async 'cal-new'(el) {
      const v = await x.form('Nueva cita', x.apptFields(), { date: el.dataset.d || today(), time: el.dataset.t || '07:00', duration: 60, type: 'individual', status: 'programada', clientIds: [], groupId: '' });
      if (v) { cal.sel = v.date; x.addAppt(v); }
    },
    'appt-status'(el) { const a = x.S.appointments.find((q) => q.id === el.dataset.id); a.status = el.dataset.s; x.onDone?.(a); x.save(); x.render(); },
  };
  return { V, ACT };
}
