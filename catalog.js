// Catálogo ampliado: 800+ ejercicios de free-exercise-db (dominio público) que se consultan bajo demanda y se agregan a tu biblioteca.
// Nombres e instrucciones vienen en inglés; el resto (músculo, tipo, nivel, equipo) se traduce al mapearlos.
const SRC = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const EQ = { 'body only': 'peso corporal', dumbbell: 'mancuernas', barbell: 'barra', cable: 'polea', machine: 'máquina', kettlebells: 'kettlebell', bands: 'banda', 'medicine ball': 'balón medicinal', 'exercise ball': 'peso corporal', 'e-z curl bar': 'barra', 'foam roll': 'peso corporal', other: 'peso corporal' };
const MU = { abdominals: 'abdomen', hamstrings: 'isquios', adductors: 'glúteo', abductors: 'glúteo', quadriceps: 'cuádriceps', biceps: 'bíceps', shoulders: 'hombro', chest: 'pecho', 'middle back': 'espalda', calves: 'pantorrilla', glutes: 'glúteo', 'lower back': 'lumbar', lats: 'espalda', triceps: 'tríceps', traps: 'trapecio', forearms: 'antebrazo', neck: 'trapecio' };
const LV = { beginner: 'principiante', intermediate: 'intermedio', expert: 'avanzado' };
const CAT = { strength: 'fuerza', stretching: 'movilidad', plyometrics: 'potencia', strongman: 'fuerza', powerlifting: 'fuerza', cardio: 'cardio', 'olympic weightlifting': 'potencia' };
let DB = null, loading = null;

function pattern(e, muscle) {
  if (e.category === 'plyometrics') return 'pliometría';
  if (e.category === 'stretching') return 'movilidad';
  if (e.category === 'cardio') return 'cardio';
  if (muscle === 'abdomen') return 'core';
  if (e.mechanic === 'isolation') return 'aislamiento';
  if (muscle === 'cuádriceps') return 'sentadilla';
  if (['isquios', 'glúteo', 'lumbar'].includes(muscle)) return 'bisagra';
  if (['pecho', 'hombro', 'tríceps'].includes(muscle)) return e.force === 'pull' ? 'tirón' : 'empuje';
  if (['espalda', 'bíceps', 'trapecio', 'antebrazo'].includes(muscle)) return 'tirón';
  return 'aislamiento';
}
function avoid(e, muscle) {
  const n = e.name.toLowerCase(), a = new Set();
  if (/squat|lunge|leg press|step|jump|bound|hop|sissy|pistol/.test(n)) a.add('rodilla');
  if (/jump|hop|bound|plyo|burpee|sprint|skip|box/.test(n) || e.category === 'plyometrics') a.add('impacto');
  if (/deadlift|good morning|bent|row|clean|snatch|hyperext|jerk|zercher|squat/.test(n) && !/machine|seated|cable|chest-supported|supported/.test(n)) a.add('espalda');
  if (/press|dip|fly|flye|raise|overhead|snatch|jerk|handstand|pull-up|chin|upright/.test(n) && ['hombro', 'pecho', 'tríceps'].includes(muscle)) a.add('hombro');
  if (/curl|extension|skull|tricep|dip|close-grip|preacher/.test(n)) a.add('codo');
  if (/push-up|pushup|plank|wrist|handstand|dip|front squat|clean/.test(n)) a.add('muñeca');
  return [...a];
}
export function toEx(e) {
  const muscle = MU[e.primaryMuscles?.[0]] || 'cuerpo completo';
  const type = CAT[e.category] || 'fuerza';
  return {
    id: 'fed_' + e.id, name: e.name, pattern: pattern(e, muscle), muscle, level: LV[e.level] || 'intermedio',
    equip: [...new Set([EQ[e.equipment] || 'peso corporal'])], avoid: avoid(e, muscle), type,
    tags: e.category === 'strength' || e.category === 'powerlifting' || e.category === 'strongman' ? ['general', 'hipertrofia'] : e.category === 'plyometrics' ? ['general', 'beisbol'] : ['general'],
    desc: (e.instructions || []).join(' '), cues: '', regress: 'Menos carga o rango más corto', progress: 'Más carga o tempo más lento', video: '',
    images: (e.images || []).slice(0, 2).map((i) => IMG + i), custom: true, imported: true,
  };
}
export async function load() {
  if (DB) return DB;
  loading ||= fetch(SRC).then((r) => r.json()).then((j) => { DB = j; return j; });
  return loading;
}
export const loaded = () => !!DB;
export const getEx = (id) => { const e = DB?.find((q) => 'fed_' + q.id === id); return e ? toEx(e) : null; };
export function search(f, have) {
  if (!DB) return [];
  const q = (f.q || '').toLowerCase(), haveIds = new Set(have.map((e) => e.id)), folder = (u) => String(u || '').split('/').slice(-2)[0], haveImg = new Set(have.flatMap((e) => (e.images || []).slice(0, 1).map(folder)));
  const out = [];
  for (const e of DB) {
    const x = toEx(e);
    if (haveIds.has(x.id) || haveImg.has(folder(x.images[0]))) continue;
    if (q && !x.name.toLowerCase().includes(q) && !x.muscle.includes(q)) continue;
    if (f.grp && x.muscle !== f.grp) continue; if (f.pattern && x.pattern !== f.pattern) continue; if (f.type && x.type !== f.type) continue; if (f.level && x.level !== f.level) continue;
    out.push(x); if (out.length >= 80) break;
  }
  return out;
}

export function make(x) {
  const { esc, ic, btn, $ } = x;
  const st = (x.ui.catf ||= { q: '', grp: '', pattern: '', type: '', level: '' });
  const grid = () => {
    if (!DB) return '<p class="mute">Cargando catálogo…</p>';
    const list = search(st, x.S.exercises);
    return `<p class="mini">${list.length}${list.length >= 80 ? '+' : ''} resultados · el nombre y las instrucciones están en inglés; las restricciones por lesión son estimadas, revísalas.</p><div class="pkgrid">${list.map((e) => `<button class="pk" data-act="cat-add" data-id="${esc(e.id)}"><span class="pki">${e.images[0] ? `<img loading="lazy" src="${e.images[0]}" alt="" onerror="this.remove()">` : ''}</span><span class="pkb"><b>${esc(e.name)}</b><small>${esc(e.muscle)} · ${esc(e.type)} · ${e.level}</small>${e.avoid.length ? `<small class="bad">posible: ${e.avoid.join(', ')}</small>` : ''}</span><span class="pkp">${ic('plus', 16)}</span></button>`).join('') || '<p class="mute">Sin resultados.</p>'}</div>`;
  };
  const sel = (k, label, arr) => `<select data-cq="${k}"><option value="">${label}</option>${arr.map((v) => `<option ${v === st[k] ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
  function open() {
    const m = $('#modal'); m.hidden = false;
    m.innerHTML = `<div class="dlg wide picker"><div class="row sp"><div><h2>Catálogo ampliado</h2><p class="mute" style="margin:0">800+ ejercicios. Toca uno para agregarlo a tu biblioteca.</p></div><button class="pri" data-act="close">Listo</button></div>
      <div class="pkf"><div class="search">${ic('search', 16)}<input data-cq="q" placeholder="Busca en inglés: cable crossover, lunge, deadlift…" value="${esc(st.q)}" autocomplete="off"></div>${sel('grp', 'Músculo', x.GROUPS)}${sel('pattern', 'Patrón', x.PATTERNS)}${sel('type', 'Tipo', x.TYPES)}${sel('level', 'Nivel', ['principiante', 'intermedio', 'avanzado'])}</div>
      <div id="cat-res" class="pkres">${grid()}</div></div>`;
    if (!DB) load().then(() => { const r = $('#cat-res'); if (r) r.innerHTML = grid(); }).catch(() => { const r = $('#cat-res'); if (r) r.innerHTML = '<p class="al bad">No se pudo cargar el catálogo. Revisa tu conexión.</p>'; });
  }
  const refresh = () => { const r = $('#cat-res'); if (r) r.innerHTML = grid(); };
  document.addEventListener('input', (e) => { if (e.target.dataset?.cq === 'q') { st.q = e.target.value; refresh(); } });
  document.addEventListener('change', (e) => { const k = e.target.dataset?.cq; if (k && k !== 'q') { st[k] = e.target.value; refresh(); } });
  const V = {};
  const ACT = {
    'cat-open': open,
    'cat-add'(el) {
      const e = DB.find((q) => 'fed_' + q.id === el.dataset.id); if (!e) return;
      x.S.exercises.push(toEx(e)); x.save(); x.toast(`+ ${e.name} en tu biblioteca`); refresh();
    },
  };
  return { V, ACT };
}
