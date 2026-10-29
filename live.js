// Modo sesión grupal: pantalla completa para tablet/TV con temporizador, estaciones y qué hace cada cliente.
export function make(x) {
  const { esc, ic, $ } = x;
  let L = null, tick = null, ac = null;
  const fmt = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, Math.ceil(s)) % 60).padStart(2, '0')}`;

  function segments(r) {
    const warm = Math.max(5, Math.round(r.totalMinutes * 0.15)) * 60, cool = Math.max(4, Math.round(r.totalMinutes * 0.1)) * 60;
    const segs = [{ type: 'warm', sec: warm, label: 'Calentamiento' }];
    for (let ro = 1; ro <= r.rounds; ro++) r.stations.forEach((s) => segs.push({ type: 'slot', sec: r.slotSeconds, round: ro, station: s.n }));
    segs.push({ type: 'cool', sec: cool, label: 'Enfriamiento' });
    return segs;
  }
  function beep(freq, ms, vol = 0.18) {
    if (!L?.sound) return;
    try {
      ac ||= new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = freq; o.type = 'sine'; g.gain.value = vol; o.connect(g); g.connect(ac.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + ms / 1000); o.stop(ac.currentTime + ms / 1000 + 0.02);
    } catch { /* sin audio */ }
  }
  const elapsed = () => (L.paused ? L.acc : L.acc + (Date.now() - L.t0) / 1000);
  const goto = (i) => { L.i = Math.max(0, Math.min(L.segs.length - 1, i)); L.acc = 0; L.t0 = Date.now(); L.last = -1; L.marks = {}; draw(); beep(880, 320); };

  function draw() {
    const r = L.plan, seg = L.segs[L.i], e = elapsed(), left = seg.sec - e;
    const total = L.segs.reduce((a, q) => a + q.sec, 0), done = L.segs.slice(0, L.i).reduce((a, q) => a + q.sec, 0) + e;
    const el = $('#live'); if (!el) return;
    let center = '', clients = '';
    if (seg.type === 'slot') {
      const st = r.stations.find((q) => q.n === seg.station), nx = r.stations[seg.station % r.stations.length];
      const slot = r.slotSeconds, phaseSec = e;
      center = `<div class="lv-k">Ronda ${seg.round} de ${r.rounds} · Estación ${seg.station} de ${r.stations.length}</div><div class="lv-n">${esc(st.name)}</div><div class="lv-t ${left <= 5 ? 'hot' : ''}">${Math.ceil(left)}</div><div class="lv-nx">Sigue: <b>${esc(nx.name)}</b></div>`;
      clients = `<div class="lv-cl">${r.perClient.map((c) => {
        const ex = c.exercises.find((q) => q.station === seg.station) || {}, nex = c.exercises.find((q) => q.station === nx.n) || {};
        const st2 = phaseSec < c.workSec ? ['work', 'TRABAJA', c.workSec - phaseSec] : phaseSec < slot - 10 ? ['rest', 'DESCANSA', slot - 10 - phaseSec] : ['move', 'CAMBIO', slot - phaseSec];
        return `<div class="lv-c ${st2[0]}"><div class="lv-ch"><b>${esc(c.name)}</b><span>${st2[1]} · ${Math.ceil(st2[2])}s</span></div><div class="lv-ex">${esc(ex.exercise || '—')}</div><small>${esc(ex.variant || '')}</small><div class="lv-nxc">Luego: ${esc(nex.exercise || '—')}</div></div>`;
      }).join('')}</div>`;
    } else {
      const items = seg.type === 'warm' ? r.warmup : r.cooldown;
      center = `<div class="lv-k">${seg.label}</div><div class="lv-t">${fmt(left)}</div><ul class="lv-list">${items.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>`;
    }
    el.innerHTML = `<div class="lv-top"><div><b>${esc(r.title)}</b><small>Quedan ${fmt(total - done)} en total</small></div><div class="lv-acts"><button data-act="live-sound" title="Sonido">${L.sound ? '🔊' : '🔇'}</button><button data-act="live-exit">Salir ✕</button></div></div>
      <div class="lv-bar"><i style="width:${Math.min(100, done / total * 100)}%"></i></div><div class="lv-main">${center}</div>${clients}
      <div class="lv-ctl"><button data-act="live-prev">⏮ Anterior</button><button class="pri lg" data-act="live-toggle">${L.paused ? '▶ Continuar' : '⏸ Pausar'}</button><button data-act="live-next">Siguiente ⏭</button></div>`;
  }
  function loop() {
    if (!L || L.paused) return;
    const seg = L.segs[L.i], e = elapsed(), left = seg.sec - e;
    if (left <= 0) { if (L.i < L.segs.length - 1) { goto(L.i + 1); } else { L.paused = true; L.acc = seg.sec; beep(660, 500); beep(990, 700); } return; }
    if (seg.type === 'slot') {
      const s = Math.floor(e);
      if (s !== L.last) {
        L.last = s;
        if (s === seg.sec - 10) beep(520, 200);
        if (left <= 3.2 && left > 0) beep(740, 120);
        const maxWork = Math.max(...L.plan.perClient.map((c) => c.workSec));
        if (s === maxWork) beep(600, 160);
      }
    }
    draw();
  }

  const V = {};
  const ACT = {
    'live-start'() {
      const r = x.ui.result; if (!r) return;
      L = { plan: r, segs: segments(r), i: 0, acc: 0, t0: Date.now(), paused: false, sound: true, last: -1 };
      const el = document.createElement('div'); el.id = 'live'; document.body.appendChild(el); document.body.classList.add('live-on');
      try { el.requestFullscreen?.()?.catch?.(() => {}); } catch { /* sin pantalla completa */ }
      ac ||= new (window.AudioContext || window.webkitAudioContext)(); beep(880, 300);
      draw(); clearInterval(tick); tick = setInterval(loop, 250);
    },
    'live-toggle'() { if (L.paused) { L.t0 = Date.now(); L.paused = false; } else { L.acc = elapsed(); L.paused = true; } draw(); },
    'live-next'() { goto(L.i + 1); },
    'live-prev'() { if (elapsed() > 4) goto(L.i); else goto(L.i - 1); },
    'live-sound'() { L.sound = !L.sound; draw(); },
    'live-exit'() { clearInterval(tick); L = null; $('#live')?.remove(); document.body.classList.remove('live-on'); try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* ok */ } },
  };
  return { V, ACT };
}
