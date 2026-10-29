// Herramientas del entrenador: 1RM y porcentajes, discos, % de grasa (método de la Marina de EE. UU.), conversores e intervalos.
export function make(x) {
  const { esc, ic, btn, $ } = x;
  const num = (id) => parseFloat($('#' + id)?.value);
  const r1 = (n) => Math.round(n * 10) / 10;
  let iv = null, ac = null;

  const card = (title, sub, body) => `<section class="card tool"><h3>${title}</h3><p class="mute small" style="margin:-4px 0 10px">${sub}</p>${body}</section>`;
  const field = (id, label, val, extra = '') => `<div><label class="fl">${label}</label><input id="${id}" data-tool="1" type="number" step="any" inputmode="decimal" value="${val}" ${extra}></div>`;

  // ---- cálculos ----
  const PCT = [[100, 1], [95, 2], [90, 4], [85, 6], [80, 8], [75, 10], [70, 12], [65, 16], [60, 20], [50, 30]];
  function calcRM() {
    const kg = num('rm-kg'), reps = num('rm-reps'), out = $('#rm-out'); if (!out) return;
    if (!(kg > 0) || !(reps >= 1) || reps > 20) { out.innerHTML = '<p class="mute">Escribe el peso y las repeticiones (1–20).</p>'; return; }
    const ep = kg * (1 + reps / 30), br = reps < 37 ? kg * 36 / (37 - reps) : ep, avg = reps === 1 ? kg : (ep + br) / 2;
    const unit = $('#rm-u').value;
    out.innerHTML = `<div class="kpis small"><div class="kpi"><b>${r1(avg)} ${unit}</b><small>1RM estimado (promedio)</small></div><div class="kpi"><b>${r1(ep)} / ${r1(br)}</b><small>Epley / Brzycki</small></div></div>
      <div class="tw"><table><tr><th>% del 1RM</th><th>Peso</th><th>Reps aprox.</th></tr>${PCT.map(([p, rp]) => `<tr><td>${p}%</td><td><b>${r1(avg * p / 100)} ${unit}</b></td><td>${rp}</td></tr>`).join('')}</table></div><p class="mini">Las repeticiones por porcentaje son una guía: varían por persona y ejercicio. Con más de 10 repeticiones el cálculo pierde precisión.</p>`;
  }
  function calcPlates() {
    const out = $('#pl-out'); if (!out) return;
    const target = num('pl-t'), bar = num('pl-b'), u = $('#pl-u').value;
    const plates = u === 'kg' ? [25, 20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5];
    if (!(target > bar)) { out.innerHTML = '<p class="mute">El peso total debe ser mayor que la barra.</p>'; return; }
    let side = (target - bar) / 2; const used = [];
    plates.forEach((p) => { const n = Math.floor(side / p + 1e-9); if (n) { used.push([p, n]); side -= n * p; } });
    out.innerHTML = `<p>Por lado: ${used.map(([p, n]) => `<span class="chip"><b>${n}×</b> ${p} ${u}</span>`).join('') || '—'}</p>${side > 0.01 ? `<p class="mini">Faltan ${r1(side * 2)} ${u} para llegar exacto con estos discos (total real: ${r1(target - side * 2)} ${u}).</p>` : ''}`;
  }
  function calcBF() {
    const out = $('#bf-out'); if (!out) return;
    const sex = $('#bf-sex').value, h = num('bf-h'), n = num('bf-n'), w = num('bf-w'), hip = num('bf-hip'), kg = num('bf-kg');
    if (!(h > 0 && n > 0 && w > 0) || (sex === 'f' && !(hip > 0)) || (sex === 'm' && w <= n)) { out.innerHTML = '<p class="mute">Completa estatura, cuello y cintura (y cadera en mujeres), en cm.</p>'; return; }
    const bf = sex === 'm' ? 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450 : 495 / (1.29579 - 0.35004 * Math.log10(w + hip - n) + 0.221 * Math.log10(h)) - 450;
    const cats = sex === 'm' ? [[6, 'Grasa esencial'], [14, 'Atleta'], [18, 'Fitness'], [25, 'Promedio'], [99, 'Alto']] : [[14, 'Grasa esencial'], [21, 'Atleta'], [25, 'Fitness'], [32, 'Promedio'], [99, 'Alto']];
    const cat = cats.find(([lim]) => bf < lim)[1];
    out.innerHTML = `<div class="kpis small"><div class="kpi"><b>${r1(bf)}%</b><small>Grasa estimada · ${cat}</small></div>${kg > 0 ? `<div class="kpi"><b>${r1(kg * (1 - bf / 100))} kg</b><small>Masa libre de grasa</small></div>` : ''}</div>
      <div class="bar">${btn('Guardar en un cliente', 'bf-save', `data-bf="${r1(bf)}"`, 'check', 'sm')}</div><p class="mini">Método de la Marina de EE. UU.: es una estimación (error típico de unos puntos). Úsala para ver tendencia, midiendo siempre igual.</p>`;
  }
  function calcConv() {
    const out = $('#cv-out'); if (!out) return;
    const kg = num('cv-kg'), cm = num('cv-cm');
    out.innerHTML = `<div class="two"><div class="kpi"><b>${isNaN(kg) ? '—' : r1(kg * 2.20462) + ' lb'}</b><small>${isNaN(kg) ? '' : kg + ' kg'}</small></div><div class="kpi"><b>${isNaN(kg) ? '—' : r1(kg / 2.20462) + ' kg'}</b><small>${isNaN(kg) ? '' : kg + ' lb → kg'}</small></div></div><div class="two" style="margin-top:10px"><div class="kpi"><b>${isNaN(cm) ? '—' : r1(cm / 2.54) + ' in'}</b><small>${isNaN(cm) ? '' : cm + ' cm'}</small></div><div class="kpi"><b>${isNaN(cm) ? '—' : `${Math.floor(cm / 30.48)}′ ${r1((cm / 2.54) % 12)}″`}</b><small>pies y pulgadas</small></div></div>`;
  }

  // ---- temporizador de intervalos ----
  function beep(f, ms) { try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = 0.18; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + ms / 1000); o.stop(ac.currentTime + ms / 1000 + 0.02); } catch { /* sin audio */ } }
  function runTimer() {
    const work = num('iv-w') || 30, rest = num('iv-r') || 15, rounds = Math.max(1, num('iv-n') || 8);
    const out = $('#iv-out'); clearInterval(iv); let phase = 'w', left = work, round = 1; beep(880, 300);
    const draw = () => { out.innerHTML = `<div class="ivbox ${phase}"><small>${phase === 'w' ? 'TRABAJO' : 'DESCANSO'} · ronda ${round} de ${rounds}</small><b>${left}</b></div><div class="bar" style="justify-content:center">${btn('Detener', 'iv-stop', '', '', 'sm')}</div>`; };
    draw();
    iv = setInterval(() => {
      left--; if (left <= 3 && left > 0) beep(740, 100);
      if (left <= 0) {
        if (phase === 'w') { if (round >= rounds) { clearInterval(iv); out.innerHTML = '<div class="ivbox w"><small>LISTO</small><b>✓</b></div>'; beep(990, 700); return; } phase = 'r'; left = rest; beep(520, 250); }
        else { phase = 'w'; left = work; round++; beep(880, 300); }
      }
      draw();
    }, 1000);
  }

  const V = {
    herramientas() {
      return x.page('Herramientas', 'Cálculos rápidos para usar durante la sesión', '',
        `<div class="cols">${card('1RM y porcentajes', 'Estima el máximo de una repetición y calcula los pesos de trabajo.',
          `<div class="three">${field('rm-kg', 'Peso levantado', 80)}${field('rm-reps', 'Repeticiones', 5)}<div><label class="fl">Unidad</label><select id="rm-u" data-tool="1"><option>kg</option><option>lb</option></select></div></div><div id="rm-out"></div>`)}
        ${card('Calculadora de discos', 'Qué discos poner a cada lado de la barra.',
          `<div class="three">${field('pl-t', 'Peso total', 100)}${field('pl-b', 'Peso de la barra', 20)}<div><label class="fl">Unidad</label><select id="pl-u" data-tool="1"><option>kg</option><option>lb</option></select></div></div><div id="pl-out"></div>`)}</div>
        <div class="cols">${card('% de grasa corporal', 'Método de la Marina de EE. UU. con cinta métrica (cm).',
          `<div class="three"><div><label class="fl">Sexo</label><select id="bf-sex" data-tool="1"><option value="m">Hombre</option><option value="f">Mujer</option></select></div>${field('bf-h', 'Estatura (cm)', 178)}${field('bf-kg', 'Peso (kg, opcional)', 80)}</div>
           <div class="three">${field('bf-n', 'Cuello (cm)', 38)}${field('bf-w', 'Cintura (cm)', 86)}${field('bf-hip', 'Cadera (cm, mujeres)', 98)}</div><div id="bf-out"></div>`)}
        ${card('Conversores', 'Kilos ↔ libras y centímetros ↔ pulgadas.', `<div class="two">${field('cv-kg', 'Kilos o libras', 80)}${field('cv-cm', 'Centímetros', 178)}</div><div id="cv-out" style="margin-top:10px"></div>`)}</div>
        ${card('Temporizador de intervalos', 'Trabajo y descanso con avisos de sonido (HIIT, Tabata, EMOM).',
          `<div class="three">${field('iv-w', 'Trabajo (s)', 40)}${field('iv-r', 'Descanso (s)', 20)}${field('iv-n', 'Rondas', 8)}</div><div class="bar">${btn('Iniciar', 'iv-start', '', 'zap', 'pri')}${btn('Tabata (20/10 × 8)', 'iv-tabata', '', '', 'sm')}</div><div id="iv-out"></div>`)}`);
    },
  };
  const ACT = {
    'iv-start': runTimer,
    'iv-tabata'() { $('#iv-w').value = 20; $('#iv-r').value = 10; $('#iv-n').value = 8; runTimer(); },
    'iv-stop'() { clearInterval(iv); $('#iv-out').innerHTML = ''; },
    async 'bf-save'(el) {
      const v = await x.form('Guardar % de grasa', [{ k: 'clientId', l: 'Cliente', t: 'select', o: x.S.clients.map((c) => [c.id, c.name]) }], { clientId: x.S.clients[0]?.id }); if (!v?.clientId) return;
      const c = x.cl(v.clientId), kg = num('bf-kg');
      c.measures.push({ date: x.today(), weight: kg > 0 ? kg : '', fat: +el.dataset.bf, waist: num('bf-w') || '', note: 'Estimado (Marina de EE. UU.)' }); x.save(); x.toast(`Guardado en ${c.name.split(' ')[0]}`);
    },
  };
  const all = () => { calcRM(); calcPlates(); calcBF(); calcConv(); };
  document.addEventListener('input', (e) => { if (e.target.dataset?.tool) all(); });
  document.addEventListener('change', (e) => { if (e.target.dataset?.tool) all(); });
  return { V, ACT, init: all };
}
