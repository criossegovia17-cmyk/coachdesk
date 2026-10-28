// Generador de programas: general, béisbol (por temporada) e hipertrofia / fisicoculturismo.
// Reglas basadas en la investigación (ver INVESTIGACION.md). Todo el resultado es editable por el coach.
const RANK = { principiante: 0, intermedio: 1, avanzado: 2 };

function picker(lib, client, equipAvail) {
  const inj = new Set(client.injuries || []);
  const eq = new Set(['peso corporal', ...(equipAvail || [])]);
  const rank = RANK[client.level] ?? 1;
  const ok = (e, max) => e.equip.some((q) => eq.has(q)) && !e.avoid.some((a) => inj.has(a)) && RANK[e.level] <= max;
  const byId = (id) => lib.find((e) => e.id === id);
  return {
    pick(slot, used) {
      const max = rank;
      for (const id of slot.pick || []) { const e = byId(id); if (e && !used.has(id) && ok(e, max)) return e; }
      const fb = slot.fb;
      if (fb) {
        const c = lib.filter((e) => !used.has(e.id) && ok(e, max) && (!fb.pattern || e.pattern === fb.pattern) && (!fb.grp || e.muscle === fb.grp) && (!fb.type || e.type === fb.type) && (!fb.tag || e.tags.includes(fb.tag)));
        c.sort((a, b) => Math.abs(RANK[a.level] - rank) - Math.abs(RANK[b.level] - rank));
        return c[0] || null;
      }
      return null;
    },
  };
}

// slot: [ids preferidos (del más difícil al más fácil), series, reps, descanso, nota, respaldo]
const S = (pick, sets, reps, rest, note = '', fb = null) => ({ pick, sets, reps, rest, note, fb });
const WARM = S(['ar8', 'ar9'], 2, '8', '30 s', 'Calentamiento / movilidad', { type: 'movilidad' });
const ARM1 = S(['ar1', 'ar6', 'ar2'], 3, '12-15', '45 s', 'Cuidado del brazo: control, sin dolor', { type: 'cuidado del brazo' });
const ARM2 = S(['ar4', 'pl12', 'pl11', 'ar5'], 3, '12', '45 s', 'Cuidado del brazo / escápula', { type: 'cuidado del brazo' });

function build(slots, pk) {
  const used = new Set(), items = [];
  for (const s of slots) {
    const e = pk.pick(s, used);
    if (!e) continue;
    used.add(e.id);
    items.push({ exId: e.id, sets: s.sets, reps: s.reps, rest: s.rest, note: s.note });
  }
  return items;
}

// ---------- BÉISBOL ----------
function baseball(c, pk, o) {
  const season = c.season || 'fuera de temporada';
  const pitcher = (c.position || 'lanzador') === 'lanzador';
  const pre = season === 'pretemporada', inn = season === 'temporada';
  const sSets = pre ? 3 : 4, sReps = pre ? '3-5' : '5';
  const A = {
    name: 'Día A · Inferior + potencia',
    slots: [WARM, S(['pm3', 'pm1', 'pm2'], pre ? 5 : 4, '3', '90 s', 'Máxima velocidad; descanso completo', { pattern: 'pliometría' }),
      S(['sq6', 'sq7', 'sq1', 'sq5', 'sq2'], sSets, sReps, '2 min', 'RIR 2; sube la barra rápido'),
      S(['hi7', 'hi8', 'hi2', 'hi3', 'hi1'], 3, '6', '2 min', 'Bisagra de cadera, espalda neutra'),
      S(['sq4', 'sq5', 'sq3', 'sq11'], 3, '8 por lado', '90 s', 'Unilateral: cadera cuadrada'),
      S(['is1', 'is6', 'is4'], 3, '30 s', '60 s', 'Isométrico: tensión constante, respira', { type: 'isométrico' }),
      S(['co12', 'co10', 'co1', 'co2'], 3, '20-30 s por lado', '45 s', 'Core lateral / aductores', { type: 'core' })],
  };
  const B = {
    name: 'Día B · Superior + cuidado del brazo',
    slots: [WARM, S(['ro5', 'ro2', 'ro6'], 4, '5', '90 s', 'Balón medio; explosivo, sin romper técnica', { pattern: 'empuje', type: 'potencia' }),
      S(['pu5', 'pu4', 'pu1', 'pu2'], sSets, pre ? '4-6' : '6', '2 min', 'RIR 2'),
      S(['pl5', 'pl9', 'pl1', 'pl3', 'pl7'], 4, '6-8', '90 s', 'Jala con escápulas estables', { pattern: 'tirón' }),
      S(['pu3', 'pu10'], 3, '8', '75 s', 'Sin dolor en el hombro'),
      ARM1, ARM2, S(['co14'], 3, '30 m', '60 s', 'Antebrazo y core')],
  };
  const C = {
    name: 'Día C · Rotacional + velocidad',
    slots: [WARM, S(['ca7'], 6, '15 m', '60-90 s', 'Aceleración máxima'),
      S(['pm4', 'pm7'], 4, '4 por lado', '60 s', 'Aterriza estable 1 s', { pattern: 'pliometría' }),
      S(['ro8', 'ro1', 'ro4'], 4, '5 por lado', '60 s', 'Cadera primero, hombros después', { pattern: 'rotacional', type: 'potencia' }),
      S(['ro7', 'co8'], 3, '8 por lado', '60 s', 'Gira desde caderas', { pattern: 'rotacional' }),
      S(['co3'], 3, '10 por lado', '45 s', 'Anti-rotación: no te dejes girar', { pattern: 'rotacional' }),
      S(['is5', 'is3'], 3, '20 s', '45 s', 'Isométrico de escápula / empuje', { type: 'isométrico' }), ARM1],
  };
  const D = {
    name: 'Día D · Fuerza total + isométricos',
    slots: [WARM, S(['is2'], 5, '3-5 s al máximo', '90 s', 'Isométrico de tirón; sube fuerza en 1-2 s', { type: 'isométrico' }),
      S(['hi8', 'hi3', 'hi2'], 3, '5', '2 min', 'RIR 2'), S(['pl5', 'pl9', 'pl3'], 3, '6', '90 s', ''),
      S(['pu11', 'pu4', 'pu1'], 3, '6', '90 s', 'Sin dolor en el hombro'), S(['hi15', 'hi5', 'hi9'], 3, '6', '90 s', 'Baja lento (3 s)'),
      S(['co4', 'co5', 'co1'], 3, '10', '60 s', ''), ARM1],
  };
  const IA = {
    name: 'Día A · Inferior (mantenimiento) + brazo',
    slots: [WARM, S(['sq1', 'sq5', 'sq2'], 3, '5', '2 min', '65-75% · deja 3 reps en reserva'),
      S(['hi8', 'hi7', 'hi2', 'hi1'], 3, '5', '2 min', '65-75%'), S(['sq3', 'sq5', 'sq11'], 2, '8 por lado', '90 s', 'Controlado'),
      S(['co12', 'co10', 'co1'], 2, '20-30 s por lado', '45 s', 'Core lateral', { type: 'core' }), ARM1],
  };
  const IB = {
    name: 'Día B · Superior ligero + rotacional',
    slots: [WARM, S(['pu4', 'pu1', 'pu2'], 3, '6', '90 s', '65-75% · sin llegar al fallo'), S(['pl1', 'pl3', 'pl7', 'pl2'], 3, '8', '90 s', ''),
      S(['ro1', 'ro4', 'ro6'], 3, '4 por lado', '60 s', 'Balón ligero; sin esfuerzo máximo', { pattern: 'rotacional', type: 'potencia' }),
      S(['co3'], 2, '10 por lado', '45 s', 'Anti-rotación', { pattern: 'rotacional' }), ARM1, ARM2],
  };
  let templates, weeks, notes;
  if (inn) {
    templates = [IA, IB]; if ((o.days || 2) >= 3 && !pitcher) templates.push({ ...IA, name: 'Día C · Inferior corto + core', slots: [WARM, S(['sq5', 'sq2'], 2, '8', '90 s'), S(['hi1', 'hi5'], 2, '8', '90 s'), S(['co3'], 2, '10 por lado', '45 s', '', { pattern: 'rotacional' }), ARM1] });
    weeks = [{ label: 'Semana tipo (repite)', rir: '3', note: 'Mantén cargas; no busques récords. Sin pliometría máxima.' }, { label: 'Semana tipo (repite)', rir: '3', note: 'Si estás cansado, baja 1 serie por ejercicio.' }];
    notes = ['En temporada el objetivo es MANTENER fuerza y potencia con ~2 sesiones por semana a 65-75% del máximo.'];
    if (pitcher) notes.push('Lanzadores: pon el Día B (superior) al menos 48 h antes de tu próxima apertura y el Día A 2-3 días después de lanzar. Haz el cuidado del brazo a diario (5-10 min).');
  } else {
    const n = Math.min(o.days || 3, pre ? 3 : 4);
    templates = [A, B, C, D].slice(0, Math.max(2, n));
    weeks = pre
      ? [{ label: 'Semana 1 · Potencia', rir: '3', note: 'Cargas moderadas y velocidad máxima.' }, { label: 'Semana 2 · Potencia', rir: '2', note: 'Sube carga solo si la técnica y la velocidad se mantienen.' }, { label: 'Semana 3 · Descarga', rir: '4', note: '−40% de series para llegar fresco a la temporada.' }]
      : [{ label: 'Semana 1 · Base', rir: '3', note: 'Técnica y RPE 6-7.' }, { label: 'Semana 2', rir: '2', note: 'Sube carga 2.5-5% si completas todas las repeticiones.' }, { label: 'Semana 3', rir: '2', note: '+1 serie en los ejercicios de fuerza.' }, { label: 'Semana 4 · Descarga', rir: '4', note: '−40% de series; mantén la calidad del movimiento.' }];
    notes = [pre ? 'Pretemporada: bajamos volumen de fuerza (3×3-5) y subimos calidad de potencia, velocidad y rotación.' : 'Fuera de temporada: se construye fuerza y base física. Puedes usar los días con más carga.'];
    notes.push('Pliometría y lanzamientos de balón: pocas repeticiones, descanso completo, calidad antes que cantidad.');
  }
  notes.push('Isométricos: úsalos para estabilidad, control del dolor y prueba de fuerza; la evidencia de que suban la velocidad por sí solos es débil.');
  return { templates, weeks, notes, goal: `Béisbol · ${season}${pitcher ? ' · lanzador' : ''}` };
}

// ---------- GENERAL ----------
function general(c, pk, o) {
  const n = Math.min(Math.max(o.days || 3, 2), 5);
  const full = {
    A: { name: 'Día A · Cuerpo completo', slots: [S(['sq6', 'sq1', 'sq5', 'sq2'], 3, '8-10', '90 s', 'RIR 2-3'), S(['pu5', 'pu4', 'pu1', 'pu2'], 3, '8-10', '90 s'), S(['hi7', 'hi2', 'hi3', 'hi1'], 3, '8-10', '90 s'), S(['pl9', 'pl7', 'pl1', 'pl2'], 3, '10', '75 s'), S(['co1', 'co2'], 3, '30 s', '45 s', '', { type: 'core' })] },
    B: { name: 'Día B · Cuerpo completo', slots: [S(['hi8', 'hi3', 'hi2', 'hi1'], 3, '8', '90 s'), S(['pu7', 'pu3', 'pu1'], 3, '8-10', '90 s'), S(['pl5', 'pl7', 'pl8', 'pl1', 'pl2'], 3, '8-10', '90 s'), S(['sq4', 'sq5', 'sq3', 'sq11'], 3, '10 por lado', '75 s'), S(['co3', 'co10', 'co2'], 3, '10 por lado', '45 s', '', { type: 'core' })] },
    C: { name: 'Día C · Cuerpo completo', slots: [S(['sq1', 'sq5', 'sq2'], 3, '10-12', '75 s'), S(['pu3', 'pu4', 'pu2'], 3, '10-12', '75 s'), S(['hi3', 'hi5', 'hi1'], 3, '12', '75 s'), S(['pl1', 'pl10', 'pl2'], 3, '10-12', '75 s'), S(['co13', 'co6', 'co11'], 3, '12', '45 s', '', { type: 'core' })] },
  };
  const U = { name: 'Superior', slots: [S(['pu5', 'pu4', 'pu1', 'pu2'], 3, '8-10', '90 s'), S(['pl5', 'pl9', 'pl7', 'pl2'], 3, '8-10', '90 s'), S(['pu3', 'pu10'], 3, '10', '75 s'), S(['pl1', 'pl10'], 3, '10', '75 s'), S(['pu15', 'pl14', 'pl15'], 2, '12', '60 s')] };
  const L = { name: 'Inferior', slots: [S(['sq6', 'sq1', 'sq5', 'sq2'], 3, '8-10', '90 s'), S(['hi7', 'hi2', 'hi3', 'hi1'], 3, '8-10', '90 s'), S(['sq4', 'sq5', 'sq3', 'sq11'], 3, '10 por lado', '75 s'), S(['hi5', 'hi9', 'hi11'], 3, '12', '60 s'), S(['co1', 'co2', 'co3'], 3, '30 s', '45 s', '', { type: 'core' })] };
  let templates;
  if (n <= 3) templates = [full.A, full.B, full.C].slice(0, n);
  else templates = [{ ...U, name: 'Día A · Superior' }, { ...L, name: 'Día B · Inferior' }, { ...U, name: 'Día C · Superior' }, { ...L, name: 'Día D · Inferior' }, { ...full.C, name: 'Día E · Cuerpo completo' }].slice(0, n);
  if (o.finisher) templates.forEach((t) => t.slots.push(S(['ca8', 'ca5', 'ca4', 'ca2'], 5, '30 s trabajo / 30 s descanso', '30 s', 'Cardio final', { type: 'cardio' })));
  return {
    templates, goal: o.finisher ? 'Condición general + cardio' : 'Condición general y fuerza',
    weeks: [{ label: 'Semana 1', rir: '3', note: 'Aprende los movimientos; técnica antes que carga.' }, { label: 'Semana 2', rir: '2-3', note: 'Intenta 1-2 repeticiones más por serie.' }, { label: 'Semana 3', rir: '2', note: 'Sube carga ~5% si llegas al tope de repeticiones; +1 serie en lo principal.' }, { label: 'Semana 4 · Descarga', rir: '4', note: 'Baja 1 serie por ejercicio.' }],
    notes: ['Progresión doble: primero sube repeticiones hasta el tope del rango; luego sube la carga y vuelve al mínimo del rango.'],
  };
}

// ---------- HIPERTROFIA / FISICOCULTURISMO ----------
const MAJOR = ['pecho', 'espalda', 'hombro', 'cuádriceps', 'isquios', 'glúteo'];
const LISTS = {
  upperA: ['pecho', 'espalda', 'hombro', 'espalda', 'pecho', 'hombro', 'bíceps', 'tríceps'],
  upperB: ['espalda', 'pecho', 'hombro', 'pecho', 'espalda', 'hombro', 'tríceps', 'bíceps'],
  lowerA: ['cuádriceps', 'isquios', 'glúteo', 'cuádriceps', 'pantorrilla', 'abdomen'],
  lowerB: ['isquios', 'cuádriceps', 'glúteo', 'isquios', 'pantorrilla', 'abdomen'],
  push: ['pecho', 'hombro', 'pecho', 'tríceps', 'hombro', 'tríceps'],
  pull: ['espalda', 'espalda', 'hombro', 'bíceps', 'trapecio', 'bíceps'],
  legs: ['cuádriceps', 'isquios', 'glúteo', 'cuádriceps', 'pantorrilla', 'abdomen'],
  fullA: ['cuádriceps', 'pecho', 'espalda', 'isquios', 'hombro', 'bíceps', 'tríceps'],
  fullB: ['isquios', 'espalda', 'pecho', 'cuádriceps', 'hombro', 'glúteo', 'abdomen'],
  fullC: ['glúteo', 'pecho', 'espalda', 'cuádriceps', 'hombro', 'pantorrilla', 'tríceps'],
};
const SPLITS = {
  2: [['Día A · Cuerpo completo', 'fullA'], ['Día B · Cuerpo completo', 'fullB']],
  3: [['Día A · Cuerpo completo', 'fullA'], ['Día B · Cuerpo completo', 'fullB'], ['Día C · Cuerpo completo', 'fullC']],
  4: [['Día A · Torso', 'upperA'], ['Día B · Pierna', 'lowerA'], ['Día C · Torso', 'upperB'], ['Día D · Pierna', 'lowerB']],
  5: [['Día A · Empuje', 'push'], ['Día B · Tirón', 'pull'], ['Día C · Pierna', 'legs'], ['Día D · Torso', 'upperB'], ['Día E · Pierna', 'lowerB']],
  6: [['Día A · Empuje', 'push'], ['Día B · Tirón', 'pull'], ['Día C · Pierna', 'legs'], ['Día D · Empuje', 'push'], ['Día E · Tirón', 'pull'], ['Día F · Pierna', 'legs']],
};

function hypertrophy(c, pk, o, lib) {
  const n = Math.min(Math.max(o.days || 4, 2), 6);
  const phase = c.phase || 'volumen';
  const base = { principiante: 10, intermedio: 14, avanzado: 16 }[c.level] ?? 14;
  const budgetMul = phase === 'definición' ? 0.9 : 1;
  const split = SPLITS[n];
  const occ = {};
  split.forEach(([, key]) => LISTS[key].forEach((m) => (occ[m] = (occ[m] || 0) + 1)));
  const budget = (m) => (MAJOR.includes(m) ? base : base * 0.7) * budgetMul;
  const setsFor = (m) => Math.max(2, Math.min(5, Math.round(budget(m) / occ[m])));
  const weekSeen = {}, weekUsed = new Set();
  const templates = split.map(([name, key]) => {
    const used = new Set(), items = [];
    LISTS[key].forEach((m) => {
      weekSeen[m] = (weekSeen[m] || 0) + 1;
      // 1.º y 2.º ejercicio de la semana para un grupo grande: compuesto; después: aislamiento
      const compound = MAJOR.includes(m) && weekSeen[m] <= 2;
      const fbBase = { grp: m, tag: 'hipertrofia' };
      const cands = lib.filter((e) => e.tags.includes('hipertrofia') && e.muscle === m && !used.has(e.id));
      const pref = cands.filter((e) => (e.pattern === 'aislamiento') === !compound);
      const fresh = (e) => !weekUsed.has(e.id);
      const slot = { pick: [...pref.filter(fresh), ...cands.filter(fresh), ...pref, ...cands].map((e) => e.id), fb: fbBase };
      const e = pk.pick(slot, used);
      if (!e) return;
      used.add(e.id); weekUsed.add(e.id);
      const iso = e.pattern === 'aislamiento';
      items.push({ exId: e.id, sets: setsFor(m), reps: iso ? '10-15' : '6-10', rest: iso ? '60-90 s' : '2 min', note: iso ? 'RIR 1-2 · controla la bajada (2-3 s)' : 'RIR 2 · progresión doble' });
    });
    return { name, items };
  });
  const rirWeeks = phase === 'definición'
    ? [['3', 'Retoma el ritmo con déficit; mantén las cargas.'], ['2', 'Mantén cargas; si bajan mucho, revisa calorías y sueño.'], ['2', 'No subas volumen: en déficit recupera peor.'], ['1-2', 'Última semana intensa.'], ['4', 'Descarga: −40% de series y mantén las cargas.']]
    : [['3', 'Semana de adaptación: encuentra tus cargas.'], ['2', 'Sube carga o 1-2 repeticiones por serie.'], ['2', '+1 serie en los ejercicios principales.'], ['1-2', '+1 serie; la mayoría de series cerca del fallo técnico.'], ['4', 'Descarga: −40% de series.']];
  return {
    templates, prebuilt: true, goal: `Hipertrofia · ${phase}`,
    weeks: rirWeeks.map(([rir, note], i) => ({ label: i === 4 ? 'Semana 5 · Descarga' : `Semana ${i + 1}`, rir, note })),
    notes: [
      `Volumen objetivo: ${Math.round(base * budgetMul)} series por grupo grande y ~${Math.round(base * 0.7 * budgetMul)} por grupo pequeño por semana (rango práctico 10-20).`,
      'La mayoría de las series terminan a 1-3 repeticiones en reserva (RIR); no hace falta llegar siempre al fallo.',
      phase === 'definición' ? 'Definición: prioriza mantener cargas y proteína alta; el cardio se agrega aparte si hace falta.' : 'Volumen: sube cargas de forma gradual y vigila el peso semanal junto con nutrición.',
      'Frecuencia por músculo: ~2 veces por semana (convención de coaches; la evidencia no es concluyente).',
    ],
  };
}

export function generateProgram(client, lib, opts = {}) {
  const pk = picker(lib, client, opts.equipment || []);
  const track = client.track || 'general';
  const o = { days: opts.days || client.daysPerWeek || 3, finisher: !!opts.finisher };
  const g = track === 'beisbol' ? baseball(client, pk, o) : track === 'fisicoculturismo' ? hypertrophy(client, pk, o, lib) : general(client, pk, o);
  const days = g.prebuilt ? g.templates.map((t) => ({ name: t.name, items: t.items })) : g.templates.map((t) => ({ name: t.name, items: build(t.slots, pk) }));
  const vol = {};
  const byId = Object.fromEntries(lib.map((e) => [e.id, e]));
  days.forEach((d) => d.items.forEach((it) => { const e = byId[it.exId]; if (e && !['cuerpo completo'].includes(e.muscle)) vol[e.muscle] = (vol[e.muscle] || 0) + it.sets; }));
  const skipped = [];
  if (track === 'fisicoculturismo') {
    const low = MAJOR.filter((m) => (vol[m] || 0) < 10 && !(m === 'glúteo' && (vol[m] || 0) >= 6));
    if (low.length) skipped.push(`Volumen bajo (menos de 10 series/semana) en: ${low.map((m) => `${m} (${vol[m] || 0})`).join(', ')}. Con el equipo o las lesiones actuales hay pocos ejercicios compatibles; agrega equipo o ejercicios propios en la biblioteca.`);
  }
  const injuries = client.injuries || [];
  if (injuries.length) skipped.push(`Se evitaron ejercicios que chocan con: ${injuries.join(', ')}.`);
  return { name: `${client.name.split(' ')[0]} · ${g.goal}`, goal: g.goal, days, program: { track, weeks: g.weeks, notes: [...g.notes, ...skipped], volume: vol, generatedAt: new Date().toISOString().slice(0, 10) } };
}
