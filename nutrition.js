// Orientación nutricional: cálculo de metas y generador de menús con alimentos comunes en México.
// Valores aproximados por 100 g (tablas tipo USDA). Son una guía; el coach decide y ajusta.
// Fuentes de las metas: ISSN (proteína), Burke 2011 (carbohidratos), Helms 2014 (definición). Ver INVESTIGACION.md.

// id, nombre, grupo, kcal, P, C, G (por 100 g), etiquetas de restricción, unidad {n: nombre singular, p: plural, g: gramos por pieza}
const F = (id, name, cat, kcal, p, c, f, tags = [], unit = null) => ({ id, name, cat, kcal, p, c, f, tags, unit });
export const FOODS = [
  F('pollo', 'Pechuga de pollo', 'proteína', 165, 31, 0, 3.6, ['carne']),
  F('res', 'Carne de res magra', 'proteína', 206, 29, 0, 9, ['carne', 'res']),
  F('pescado', 'Pescado blanco (tilapia)', 'proteína', 128, 26, 0, 2.7, ['pescado']),
  F('atun', 'Atún en agua', 'proteína', 116, 26, 0, 1, ['pescado']),
  F('huevo', 'Huevo entero', 'proteína', 155, 13, 1.1, 11, ['huevo'], { n: 'huevo', p: 'huevos', g: 50 }),
  F('claras', 'Claras de huevo', 'proteína', 52, 11, 0.7, 0.2, ['huevo'], { n: 'clara', p: 'claras', g: 33 }),
  F('pavo', 'Jamón de pavo', 'proteína', 109, 18, 3, 2.7, ['carne']),
  F('panela', 'Queso panela', 'proteína', 264, 18, 3, 20, ['lácteos']),
  F('yogur', 'Yogur griego natural', 'proteína', 59, 10, 3.6, 0.4, ['lácteos']),
  F('requeson', 'Requesón', 'proteína', 98, 11, 3.4, 4.3, ['lácteos']),
  F('tofu', 'Tofu', 'proteína', 76, 8, 1.9, 4.8, ['soya']),
  F('whey', 'Proteína en polvo', 'proteína', 400, 80, 8, 6, ['lácteos'], { n: 'scoop', p: 'scoops', g: 30, of: true }),
  F('frijol', 'Frijoles cocidos', 'carbohidrato', 127, 8.7, 22, 0.5, []),
  F('lenteja', 'Lentejas cocidas', 'carbohidrato', 116, 9, 20, 0.4, []),
  F('arroz', 'Arroz cocido', 'carbohidrato', 130, 2.7, 28, 0.3, []),
  F('avena', 'Avena en hojuelas (seca)', 'carbohidrato', 389, 17, 66, 7, ['gluten']),
  F('tortilla', 'Tortilla de maíz', 'carbohidrato', 218, 5.7, 45, 2.9, [], { n: 'tortilla', p: 'tortillas', g: 30 }),
  F('papa', 'Papa cocida', 'carbohidrato', 87, 2, 20, 0.1, []),
  F('camote', 'Camote cocido', 'carbohidrato', 90, 2, 21, 0.2, []),
  F('pasta', 'Pasta cocida', 'carbohidrato', 158, 5.8, 31, 0.9, ['gluten']),
  F('pan', 'Pan integral', 'carbohidrato', 247, 13, 41, 3.4, ['gluten'], { n: 'rebanada', p: 'rebanadas', g: 30 }),
  F('elote', 'Elote cocido', 'carbohidrato', 96, 3.4, 21, 1.5, []),
  F('platano', 'Plátano', 'fruta', 89, 1.1, 23, 0.3, [], { n: 'plátano', p: 'plátanos', g: 120 }),
  F('manzana', 'Manzana', 'fruta', 52, 0.3, 14, 0.2, [], { n: 'manzana', p: 'manzanas', g: 180 }),
  F('papaya', 'Papaya', 'fruta', 43, 0.5, 11, 0.3, []),
  F('fresa', 'Fresas', 'fruta', 32, 0.7, 7.7, 0.3, []),
  F('mango', 'Mango', 'fruta', 60, 0.8, 15, 0.4, []),
  F('naranja', 'Naranja', 'fruta', 47, 0.9, 12, 0.1, [], { n: 'naranja', p: 'naranjas', g: 150 }),
  F('aguacate', 'Aguacate', 'grasa', 160, 2, 9, 15, []),
  F('aceite', 'Aceite de oliva', 'grasa', 884, 0, 0, 100, [], { n: 'cucharadita', p: 'cucharaditas', g: 5, of: true }),
  F('almendra', 'Almendras', 'grasa', 579, 21, 22, 50, ['nueces']),
  F('cacahuate', 'Crema de cacahuate', 'grasa', 588, 25, 20, 50, ['nueces'], { n: 'cucharada', p: 'cucharadas', g: 16, of: true }),
  F('nuez', 'Nueces', 'grasa', 654, 15, 14, 65, ['nueces']),
];
const byId = Object.fromEntries(FOODS.map((f) => [f.id, f]));
export const RESTRICTIONS = [['lácteos', 'Lácteos'], ['gluten', 'Gluten'], ['huevo', 'Huevo'], ['pescado', 'Pescado / mariscos'], ['nueces', 'Nueces y cacahuate'], ['soya', 'Soya'], ['res', 'Res'], ['carne', 'Toda carne (vegetariano)']];
export const ACTIVITY = [[1.2, 'Sedentario (sin ejercicio)'], [1.375, 'Ligero (1-3 días/sem)'], [1.55, 'Moderado (3-5 días/sem)'], [1.725, 'Alto (6-7 días/sem)'], [1.9, 'Muy alto (doble sesión / trabajo físico)']];

const round = (n, k = 1) => Math.round(n / k) * k;

export function latestWeight(c) {
  const m = [...(c.measures || [])].filter((x) => x.weight !== '' && x.weight != null).sort((a, b) => a.date.localeCompare(b.date));
  return m.length ? { weight: m.at(-1).weight, fat: m.at(-1).fat === '' ? null : m.at(-1).fat } : { weight: null, fat: null };
}

// goal: 'perder' | 'mantener' | 'ganar'
export function calcTargets(c, goal, rate) {
  const { weight, fat } = latestWeight(c);
  const warnings = [], notes = [];
  if (!weight || !c.height || !c.age || !c.sex) return { error: 'Faltan datos: peso (en Progreso), estatura, edad y sexo del cliente.' };
  const bmr = 10 * weight + 6.25 * c.height - 5 * c.age + (c.sex === 'f' ? -161 : 5);
  const tdee = bmr * (Number(c.activity) || 1.55);
  const lbm = fat ? weight * (1 - fat / 100) : null;
  let kcal = tdee;
  if (goal === 'perder') {
    const wk = rate || (c.track === 'fisicoculturismo' ? 0.7 : 0.5); // % del peso por semana
    const deficit = (weight * wk / 100 * 7700) / 7;
    kcal = tdee - Math.min(deficit, tdee * 0.25);
    notes.push(`Déficit de ~${Math.round(Math.min(deficit, tdee * 0.25))} kcal/día (meta de pérdida ≈ ${wk}% del peso por semana; rango recomendado 0.5–1%).`);
  } else if (goal === 'ganar') {
    kcal = tdee * (c.track === 'fisicoculturismo' ? 1.1 : 1.08);
    notes.push('Superávit moderado (~8-10%) para ganar masa con poca grasa.');
  }
  // proteína
  let p;
  if (c.track === 'fisicoculturismo' && goal === 'perder') {
    p = lbm ? lbm * 2.5 : weight * 2.2;
    notes.push(lbm ? 'Proteína ≈ 2.5 g/kg de masa libre de grasa (rango 2.3–3.1 en definición).' : 'Proteína ≈ 2.2 g/kg de peso (sin % de grasa registrado).');
  } else if (c.track === 'fisicoculturismo') {
    p = weight * 2.0; notes.push('Proteína ≈ 2.0 g/kg (rango 1.6–2.2).');
  } else {
    p = weight * (c.track === 'beisbol' ? 1.8 : 1.6); notes.push(`Proteína ≈ ${c.track === 'beisbol' ? '1.8' : '1.6'} g/kg (rango ISSN 1.4–2.0 para quienes entrenan).`);
  }
  // grasa
  const fatPct = c.track === 'fisicoculturismo' && goal === 'perder' ? 0.22 : 0.27;
  let f = Math.max(kcal * fatPct / 9, weight * 0.6);
  let carbs = (kcal - p * 4 - f * 9) / 4;
  if (carbs < 0) { carbs = 0; warnings.push('Las calorías no alcanzan para cubrir proteína y grasa mínima: revisa la meta.'); }
  // chequeo de carbohidratos para béisbol
  if (c.track === 'beisbol') {
    const need = { 'fuera de temporada': [4, 6], pretemporada: [5, 7], temporada: [5, 7] }[c.season || 'fuera de temporada'];
    const gkg = carbs / weight;
    notes.push(`Carbohidratos para deportes de equipo: ${need[0]}–${need[1]} g/kg (más en días de juego). Esta meta da ${gkg.toFixed(1)} g/kg.`);
    if (gkg < need[0]) warnings.push(`Carbohidratos bajos para un atleta de béisbol (${gkg.toFixed(1)} g/kg). Considera mantener calorías o quitar déficit en temporada.`);
    if (goal === 'perder' && c.season === 'temporada') warnings.push('Perder peso en temporada puede bajar rendimiento y recuperación; prioriza mantener.');
  }
  if (c.track === 'fisicoculturismo' && goal === 'perder') notes.push('Grasa ≈ 20-25% de las calorías (rango 15–30%). Evita bajar de 0.6 g/kg.');
  return { weight, lbm, bmr: round(bmr), tdee: round(tdee), kcal: round(kcal, 10), p: round(p), c: round(carbs), f: round(f), notes, warnings };
}

const SLOTS = {
  3: [['Desayuno', 8, 0.3, 'des'], ['Comida', 14, 0.4, 'com'], ['Cena', 20, 0.3, 'com']],
  4: [['Desayuno', 8, 0.27, 'des'], ['Comida', 14, 0.33, 'com'], ['Colación', 17, 0.15, 'col'], ['Cena', 20.5, 0.25, 'com']],
  5: [['Desayuno', 8, 0.25, 'des'], ['Colación', 11, 0.1, 'col'], ['Comida', 14.5, 0.3, 'com'], ['Colación', 17.5, 0.1, 'col'], ['Cena', 20.5, 0.25, 'com']],
};
const OPT = {
  des: { p: ['huevo', 'claras', 'yogur', 'panela', 'requeson', 'pavo', 'whey'], c: ['avena', 'tortilla', 'pan', 'platano', 'papa'], f: ['aguacate', 'almendra', 'cacahuate'], v: ['manzana', 'fresa', 'papaya', 'mango', 'naranja'] },
  com: { p: ['pollo', 'res', 'pescado', 'atun', 'pollo', 'huevo'], c: ['arroz', 'papa', 'camote', 'pasta', 'tortilla', 'elote'], f: ['aguacate', 'aceite', 'nuez'], v: [] },
  post: { p: ['yogur', 'whey', 'requeson', 'atun'], c: ['platano', 'mango', 'pan', 'manzana'], f: [], v: [] },
  col: { p: ['yogur', 'whey', 'requeson', 'atun', 'pavo', 'panela'], c: ['platano', 'manzana', 'mango', 'tortilla', 'pan', 'papaya'], f: ['almendra', 'cacahuate', 'nuez'], v: [] },
};

function pieceText(food, g) {
  if (food.unit) {
    const n = Math.round(g / food.unit.g * 2) / 2 || 0.5;
    return `${n} ${n === 1 ? food.unit.n : food.unit.p}${food.unit.of ? ' de ' + food.name.toLowerCase() : ''}`;
  }
  return `${g} g de ${food.name.toLowerCase()}`;
}

function buildMeal(share, targets, kind, dayIdx, mealIdx, excluded) {
  const ok = (id) => byId[id] && !byId[id].tags.some((t) => excluded.has(t));
  const pick = (list, off) => { const a = list.filter(ok); return a.length ? byId[a[(dayIdx * 2 + mealIdx + off) % a.length]] : null; };
  const o = { ...OPT[kind] };
  if (excluded.has('carne')) { // vegetariano: la proteína de comidas fuertes sale de huevo, lácteos, tofu y leguminosas
    if (kind === 'com') { o.p = ['tofu', 'huevo', 'panela', 'requeson', 'yogur']; o.c = ['arroz', 'papa', 'camote', 'pasta', 'frijol', 'lenteja', 'tortilla']; }
    o.p = o.p.filter((id) => !['atun', 'pavo', 'pollo', 'res', 'pescado'].includes(id));
  }
  const pro = pick(o.p, 0), carb = pick(o.c, 1), fat = pick(o.f, 2), fruit = kind === 'des' ? pick(o.v, 3) : null;
  const T = { p: targets.p * share, c: targets.c * share, f: targets.f * share };
  const g = { pro: 0, carb: 0, fat: 0, fruit: 0 };
  const items = [pro, carb, fat, fruit];
  const keys = ['pro', 'carb', 'fat', 'fruit'];
  if (fruit) g.fruit = Math.max(60, Math.min(150, (T.c * 0.25 / fruit.c) * 100));
  for (let pass = 0; pass < 3; pass++) {
    // la proteína de los carbohidratos (frijol, pasta…) cuenta solo 40% para que el alimento proteico siga siendo el protagonista
    const have = (k) => items.reduce((a, it, i) => a + (it ? it[k] * g[keys[i]] / 100 * (k === 'p' && keys[i] !== 'pro' ? 0.4 : 1) : 0), 0);
    if (carb) g.carb = Math.max(0, g.carb + ((T.c - have('c')) / carb.c) * 100);
    if (pro) g.pro = Math.max(0, g.pro + ((T.p - have('p')) / pro.p) * 100);
    if (fat) g.fat = Math.max(0, g.fat + ((T.f - have('f')) / fat.f) * 100);
  }
  const lines = [], tot = { kcal: 0, p: 0, c: 0, f: 0 };
  items.forEach((it, i) => {
    if (!it) return;
    let gr = g[keys[i]];
    if (gr < 8) return;
    gr = it.unit ? Math.max(1, Math.round(gr / it.unit.g * 2) / 2) * it.unit.g : round(gr, it.cat === 'grasa' && it.id === 'aceite' ? 5 : 5);
    tot.kcal += it.kcal * gr / 100; tot.p += it.p * gr / 100; tot.c += it.c * gr / 100; tot.f += it.f * gr / 100;
    lines.push(pieceText(it, gr) + (it.unit ? ` (${gr} g)` : ''));
  });
  if (kind === 'des' || kind === 'com') lines.push('verduras al gusto');
  return { text: lines.join(' + '), tot };
}

export function buildMenu(c, targets, opts = {}) {
  const meals = opts.meals || 5;
  const excluded = new Set(c.foodsAvoid || []);
  if (excluded.has('carne')) ['res', 'carne'].forEach((t) => excluded.add(t));
  const slots = SLOTS[meals].map((s) => [...s]);
  if (c.track && c.track !== 'general' && meals >= 4) {
    const colIdx = slots.map((s, i) => (s[3] === 'col' ? i : -1)).filter((i) => i >= 0);
    if (colIdx.length) slots[colIdx[colIdx.length - 1]][0] = c.track === 'beisbol' && c.season === 'temporada' ? 'Post-juego / recuperación' : 'Post-entreno';
  }
  const days = ['Día A', 'Día B', 'Día C'].map((name, d) => {
    const ms = slots.map((s, i) => {
      const r = buildMeal(s[2], targets, s[0].startsWith('Post') ? 'post' : s[3], d, i, excluded);
      const h = Math.floor(s[1]), m = Math.round((s[1] - h) * 60);
      return { name: s[0], time: `${h}:${String(m).padStart(2, '0')}`, food: `${r.text}  —  P ${Math.round(r.tot.p)} · C ${Math.round(r.tot.c)} · G ${Math.round(r.tot.f)} · ${Math.round(r.tot.kcal)} kcal` };
    });
    return { name, meals: ms };
  });
  return days;
}

export function trackTips(c, goal) {
  const tips = [];
  tips.push('Hidratación: toma agua durante todo el día; perder 1–2% del peso corporal en sudor ya afecta el rendimiento.');
  tips.push('Cada comida con 20–40 g de proteína (≈ 0.25 g/kg).');
  if (c.track === 'beisbol') {
    tips.push('Días de juego: comida con carbohidratos 3–4 h antes, colación ligera 1 h antes, y comida de recuperación (proteína + carbohidratos) después.');
    tips.push('Viajes: lleva colaciones (fruta, yogur, almendras, sándwich de pavo) para no depender de lo que haya en el camino.');
    tips.push('Sueño: apunta a 8 h o más; más si hay viajes o juegos seguidos.');
  }
  if (c.track === 'fisicoculturismo') {
    tips.push(goal === 'perder' ? 'Definición: revisa el peso semanal (promedio de 7 días) y ajusta ±100–150 kcal si baja menos de 0.5% o más de 1% por semana.' : 'Volumen: sube de peso ~0.25–0.5% por semana; si va más rápido, baja 100–150 kcal.');
    tips.push('Reparte la proteína en 4–5 comidas y deja una comida alta en carbohidratos antes de entrenar.');
  }
  tips.push('Orientación alimenticia: no sustituye valoración médica ni de un nutriólogo clínico. Ajusta según evolución, hambre, energía y salud del cliente.');
  return tips;
}
