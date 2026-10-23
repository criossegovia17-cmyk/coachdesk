// Planificador de entrenamiento grupal: con reglas (siempre disponible) o con Claude (si hay API key).
const RANK = { principiante: 0, intermedio: 1, avanzado: 2 };
const SLOT = 70; // segundos por estación (60 de reloj + 10 de cambio)
const WORKREST = [[30, 30], [40, 20], [45, 15]];
const FOCUS = {
  completo: ['sentadilla', 'empuje', 'bisagra', 'tirón', 'core', 'cardio'],
  superior: ['empuje', 'tirón', 'empuje', 'tirón', 'core', 'cardio'],
  inferior: ['sentadilla', 'bisagra', 'sentadilla', 'bisagra', 'core', 'cardio'],
  cardio: ['cardio', 'core', 'cardio', 'sentadilla', 'empuje', 'cardio'],
};

export function plan(db, { clientIds, minutes = 45, focus = 'completo', equipment = [] }) {
  const clients = clientIds.map((id) => db.clients.find((c) => c.id === id)).filter(Boolean);
  if (!clients.length) throw new Error('Selecciona al menos un cliente');
  const equip = new Set(['peso corporal', ...equipment]);
  const usable = db.exercises.filter((e) => e.equip.some((q) => equip.has(q)));
  const pattern = FOCUS[focus] || FOCUS.completo;
  const warm = Math.max(5, Math.round(minutes * 0.15)), cool = Math.max(4, Math.round(minutes * 0.1));
  const circuitSec = Math.max(SLOT * 3, (minutes - warm - cool) * 60);
  const nStations = Math.min(pattern.length, Math.max(3, Math.floor(circuitSec / SLOT / 2)));
  const rounds = Math.max(1, Math.floor(circuitSec / (nStations * SLOT)));

  const used = new Set();
  const stations = [];
  for (let i = 0; i < nStations; i++) {
    const pool = usable.filter((e) => e.pattern === pattern[i] && !used.has(e.id));
    // ejercicio base: preferimos nivel intermedio, el que menos choca con lesiones del grupo
    const clash = (e) => clients.filter((c) => c.injuries.some((t) => e.avoid.includes(t))).length;
    pool.sort((a, b) => Math.abs(RANK[a.level] - 1) - Math.abs(RANK[b.level] - 1) || clash(a) - clash(b));
    const base = pool[0] || usable.find((e) => e.pattern === pattern[i]) || usable[0];
    used.add(base.id);
    stations.push({ n: i + 1, pattern: pattern[i], name: base.name, exId: base.id });
  }

  const perClient = clients.map((c) => {
    const [work, rest] = WORKREST[RANK[c.level] ?? 1];
    const exercises = stations.map((s) => {
      const base = db.exercises.find((e) => e.id === s.exId);
      const conflict = c.injuries.some((t) => base.avoid.includes(t));
      if (conflict) {
        const alt = usable.find((e) => e.pattern === base.pattern && e.id !== base.id && !c.injuries.some((t) => e.avoid.includes(t)) && RANK[e.level] <= (RANK[c.level] ?? 1));
        return { station: s.n, exercise: alt ? alt.name : 'Movilidad / descanso activo', variant: alt ? `Sustituye a ${base.name} por tu ${c.injuries.join('/')}` : 'Sin ejercicio seguro disponible: movilidad guiada', adapted: true };
      }
      const d = (RANK[c.level] ?? 1) - RANK[base.level];
      if (d < 0) return { station: s.n, exercise: base.name, variant: `Versión fácil: ${base.regress}`, adapted: true };
      if (d > 0) return { station: s.n, exercise: base.name, variant: `Versión difícil: ${base.progress}`, adapted: false };
      return { station: s.n, exercise: base.name, variant: 'Versión estándar', adapted: false };
    });
    const weight = [1.5, 1, 0.7][RANK[c.level] ?? 1] + (c.injuries.length ? 0.8 : 0);
    return { clientId: c.id, name: c.name, level: c.level, injuries: c.injuries, workSec: work, restSec: rest, weight, exercises };
  });
  const totalW = perClient.reduce((a, c) => a + c.weight, 0);
  const circuitMin = (rounds * nStations * SLOT) / 60;
  perClient.forEach((c) => {
    c.attentionMin = Math.round((circuitMin * c.weight / totalW) * 10) / 10;
    const reasons = [];
    if (c.level === 'principiante') reasons.push('revisa técnica');
    if (c.injuries.length) reasons.push(`cuida ${c.injuries.join(', ')}`);
    c.notes = reasons.join(' · ') || 'Empújalo a subir carga';
    delete c.weight;
  });
  // rotación del coach: cada ronda se enfoca en quien más necesita, repartido por tiempo asignado
  const owed = Object.fromEntries(perClient.map((c) => [c.clientId, c.attentionMin]));
  const rotation = [];
  for (let r = 1; r <= rounds * nStations; r++) {
    const id = Object.keys(owed).sort((a, b) => owed[b] - owed[a])[0];
    owed[id] -= SLOT / 60;
    rotation.push({ round: Math.ceil(r / nStations), station: ((r - 1) % nStations) + 1, clientId: id });
  }
  return {
    source: 'reglas', title: `Circuito grupal · ${focus} · ${minutes} min`, totalMinutes: minutes, rounds, slotSeconds: SLOT,
    warmup: ['3 min trote suave / marcha en el lugar', 'Movilidad de cadera, hombros y columna (círculos, gato-camello)', 'Activación: 10 puentes de glúteo + 10 sentadillas al aire', `Explica las ${nStations} estaciones con una demostración corta`].slice(0, warm >= 7 ? 4 : 3),
    stations, perClient, rotation,
    cooldown: ['Caminata suave 1 min para bajar pulsaciones', 'Estiramiento de cuádriceps, isquios, pecho y espalda (20-30 s c/u)', 'Respiración profunda 1 min y cierre del grupo'],
    coachTips: [
      'Todos rotan juntos cada 70 s: el reloj es el mismo, la intensidad es personal.',
      'Trabajo/descanso por nivel: principiante 30/30 · intermedio 40/20 · avanzado 45/15.',
      'La tabla "atención" indica en qué cliente enfocarte en cada estación.',
    ],
  };
}
