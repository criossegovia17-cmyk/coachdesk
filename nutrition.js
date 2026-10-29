// Orientación nutricional C-Lab: metas, días de entreno/descanso, menús por porciones, equivalencias y lista del súper.
// Alimentos: valores aproximados por 100 g (tablas tipo USDA, productos comunes en México). Son una guía; el coach decide y ajusta.
// Fuentes de las metas: ISSN (proteína, creatina, cafeína), Burke 2011 (carbohidratos), Helms 2014 (definición). Ver INVESTIGACION.md.

// id, nombre, categoría, kcal, P, C, G (por 100 g), restricciones, unidad {n, p, g, of?}
const F = (id, name, cat, kcal, p, c, f, tags = [], unit = null) => ({ id, name, cat, kcal, p, c, f, tags, unit });
export const FOOD_CATS = ['proteína', 'lácteo', 'carbohidrato', 'fruta', 'grasa', 'verdura', 'bebida'];
const BASE_FOODS = [
  F('pollo', 'Pechuga de pollo', 'proteína', 165, 31, 0, 3.6, ['carne']),
  F('pollo_muslo', 'Muslo de pollo sin piel', 'proteína', 179, 25, 0, 8, ['carne']),
  F('res', 'Carne de res magra', 'proteína', 206, 29, 0, 9, ['carne', 'res']),
  F('res_molida', 'Carne molida 90/10', 'proteína', 217, 26, 0, 12, ['carne', 'res']),
  F('cerdo', 'Lomo de cerdo magro', 'proteína', 143, 26, 0, 3.5, ['carne', 'cerdo']),
  F('pavo_molido', 'Pavo molido', 'proteína', 190, 27, 0, 9, ['carne']),
  F('pescado', 'Pescado blanco (tilapia)', 'proteína', 128, 26, 0, 2.7, ['pescado']),
  F('salmon', 'Salmón', 'proteína', 206, 22, 0, 12, ['pescado']),
  F('atun', 'Atún en agua', 'proteína', 116, 26, 0, 1, ['pescado']),
  F('sardina', 'Sardina en lata', 'proteína', 208, 25, 0, 11, ['pescado']),
  F('camaron', 'Camarón', 'proteína', 99, 24, 0.2, 0.3, ['mariscos']),
  F('huevo', 'Huevo entero', 'proteína', 155, 13, 1.1, 11, ['huevo'], { n: 'huevo', p: 'huevos', g: 50 }),
  F('claras', 'Claras de huevo', 'proteína', 52, 11, 0.7, 0.2, ['huevo'], { n: 'clara', p: 'claras', g: 33 }),
  F('pavo', 'Jamón de pavo', 'proteína', 109, 18, 3, 2.7, ['carne']),
  F('tofu', 'Tofu', 'proteína', 76, 8, 1.9, 4.8, ['soya']),
  F('tempeh', 'Tempeh', 'proteína', 192, 20, 8, 11, ['soya']),
  F('whey', 'Proteína en polvo (whey)', 'proteína', 400, 80, 8, 6, ['lácteos'], { n: 'scoop', p: 'scoops', g: 30, of: true }),
  F('yogur', 'Yogur griego natural', 'lácteo', 59, 10, 3.6, 0.4, ['lácteos']),
  F('requeson', 'Requesón', 'lácteo', 98, 11, 3.4, 4.3, ['lácteos']),
  F('panela', 'Queso panela', 'lácteo', 264, 18, 3, 20, ['lácteos']),
  F('oaxaca', 'Queso Oaxaca', 'lácteo', 310, 22, 2, 24, ['lácteos']),
  F('leche_desc', 'Leche descremada', 'lácteo', 34, 3.4, 5, 0.1, ['lácteos'], { n: 'vaso', p: 'vasos', g: 240, of: true }),
  F('leche', 'Leche entera', 'lácteo', 61, 3.2, 4.8, 3.3, ['lácteos'], { n: 'vaso', p: 'vasos', g: 240, of: true }),
  F('kefir', 'Kéfir', 'lácteo', 55, 3.4, 4.5, 2, ['lácteos']),
  F('frijol', 'Frijoles cocidos', 'carbohidrato', 127, 8.7, 22, 0.5, []),
  F('frijol_negro', 'Frijol negro cocido', 'carbohidrato', 132, 8.9, 24, 0.5, []),
  F('garbanzo', 'Garbanzo cocido', 'carbohidrato', 164, 8.9, 27, 2.6, []),
  F('lenteja', 'Lentejas cocidas', 'carbohidrato', 116, 9, 20, 0.4, []),
  F('arroz', 'Arroz blanco cocido', 'carbohidrato', 130, 2.7, 28, 0.3, []),
  F('arroz_int', 'Arroz integral cocido', 'carbohidrato', 112, 2.3, 24, 0.8, []),
  F('quinoa', 'Quinoa cocida', 'carbohidrato', 120, 4.4, 21, 1.9, []),
  F('avena', 'Avena en hojuelas (seca)', 'carbohidrato', 389, 17, 66, 7, ['gluten']),
  F('tortilla', 'Tortilla de maíz', 'carbohidrato', 218, 5.7, 45, 2.9, [], { n: 'tortilla', p: 'tortillas', g: 30 }),
  F('tortilla_h', 'Tortilla de harina', 'carbohidrato', 310, 8, 51, 8, ['gluten'], { n: 'tortilla', p: 'tortillas', g: 45 }),
  F('papa', 'Papa cocida', 'carbohidrato', 87, 2, 20, 0.1, []),
  F('camote', 'Camote cocido', 'carbohidrato', 90, 2, 21, 0.2, []),
  F('platano_macho', 'Plátano macho cocido', 'carbohidrato', 122, 1.3, 32, 0.4, []),
  F('pasta', 'Pasta cocida', 'carbohidrato', 158, 5.8, 31, 0.9, ['gluten']),
  F('pan', 'Pan integral', 'carbohidrato', 247, 13, 41, 3.4, ['gluten'], { n: 'rebanada', p: 'rebanadas', g: 30 }),
  F('bolillo', 'Bolillo', 'carbohidrato', 270, 9, 55, 1.5, ['gluten'], { n: 'bolillo', p: 'bolillos', g: 70 }),
  F('galleta_arroz', 'Galletas de arroz', 'carbohidrato', 387, 8, 82, 3, [], { n: 'galleta', p: 'galletas', g: 9 }),
  F('tostada', 'Tostada horneada', 'carbohidrato', 390, 8, 78, 4, [], { n: 'tostada', p: 'tostadas', g: 12 }),
  F('elote', 'Elote cocido', 'carbohidrato', 96, 3.4, 21, 1.5, []),
  F('miel', 'Miel', 'carbohidrato', 304, 0.3, 82, 0, [], { n: 'cucharada', p: 'cucharadas', g: 21, of: true }),
  F('platano', 'Plátano', 'fruta', 89, 1.1, 23, 0.3, [], { n: 'plátano', p: 'plátanos', g: 120 }),
  F('manzana', 'Manzana', 'fruta', 52, 0.3, 14, 0.2, [], { n: 'manzana', p: 'manzanas', g: 180 }),
  F('papaya', 'Papaya', 'fruta', 43, 0.5, 11, 0.3, []),
  F('fresa', 'Fresas', 'fruta', 32, 0.7, 7.7, 0.3, []),
  F('mango', 'Mango', 'fruta', 60, 0.8, 15, 0.4, []),
  F('naranja', 'Naranja', 'fruta', 47, 0.9, 12, 0.1, [], { n: 'naranja', p: 'naranjas', g: 150 }),
  F('mandarina', 'Mandarina', 'fruta', 53, 0.8, 13, 0.3, [], { n: 'mandarina', p: 'mandarinas', g: 80 }),
  F('pina', 'Piña', 'fruta', 50, 0.5, 13, 0.1, []),
  F('uva', 'Uvas', 'fruta', 69, 0.7, 18, 0.2, []),
  F('sandia', 'Sandía', 'fruta', 30, 0.6, 7.6, 0.2, []),
  F('melon', 'Melón', 'fruta', 34, 0.8, 8, 0.2, []),
  F('pera', 'Pera', 'fruta', 57, 0.4, 15, 0.1, [], { n: 'pera', p: 'peras', g: 180 }),
  F('kiwi', 'Kiwi', 'fruta', 61, 1.1, 15, 0.5, [], { n: 'kiwi', p: 'kiwis', g: 75 }),
  F('guayaba', 'Guayaba', 'fruta', 68, 2.6, 14, 1, [], { n: 'guayaba', p: 'guayabas', g: 80 }),
  F('arandano', 'Arándanos', 'fruta', 57, 0.7, 14, 0.3, []),
  F('aguacate', 'Aguacate', 'grasa', 160, 2, 9, 15, []),
  F('aceite', 'Aceite de oliva', 'grasa', 884, 0, 0, 100, [], { n: 'cucharadita', p: 'cucharaditas', g: 5, of: true }),
  F('almendra', 'Almendras', 'grasa', 579, 21, 22, 50, ['nueces']),
  F('nuez', 'Nueces', 'grasa', 654, 15, 14, 65, ['nueces']),
  F('pistache', 'Pistaches', 'grasa', 560, 20, 28, 45, ['nueces']),
  F('cacahuate', 'Crema de cacahuate', 'grasa', 588, 25, 20, 50, ['nueces'], { n: 'cucharada', p: 'cucharadas', g: 16, of: true }),
  F('chia', 'Semillas de chía', 'grasa', 486, 17, 42, 31, [], { n: 'cucharada', p: 'cucharadas', g: 12, of: true }),
  F('linaza', 'Linaza molida', 'grasa', 534, 18, 29, 42, [], { n: 'cucharada', p: 'cucharadas', g: 10, of: true }),
  F('nopal', 'Nopales', 'verdura', 16, 1.3, 3.3, 0.1, []),
  F('brocoli', 'Brócoli', 'verdura', 35, 2.4, 7, 0.4, []),
  F('espinaca', 'Espinaca', 'verdura', 23, 2.9, 3.6, 0.4, []),
  F('jitomate', 'Jitomate', 'verdura', 18, 0.9, 3.9, 0.2, []),
  F('pepino', 'Pepino', 'verdura', 15, 0.7, 3.6, 0.1, []),
  F('zanahoria', 'Zanahoria', 'verdura', 41, 0.9, 10, 0.2, []),
  F('calabacita', 'Calabacita', 'verdura', 17, 1.2, 3.1, 0.3, []),
  F('chayote', 'Chayote', 'verdura', 19, 0.8, 4.5, 0.1, []),
  F('champinon', 'Champiñones', 'verdura', 22, 3.1, 3.3, 0.3, []),
  F('lechuga', 'Lechuga', 'verdura', 15, 1.4, 2.9, 0.2, []),
  F('bebida_dep', 'Bebida deportiva', 'bebida', 26, 0, 6.4, 0, [], { n: 'botella', p: 'botellas', g: 500, of: true }),
  F('jugo_naranja', 'Jugo de naranja', 'bebida', 45, 0.7, 10.4, 0.2, [], { n: 'vaso', p: 'vasos', g: 240, of: true }),
];
export const FOODS = BASE_FOODS;
export const RESTRICTIONS = [['lácteos', 'Lácteos'], ['gluten', 'Gluten'], ['huevo', 'Huevo'], ['pescado', 'Pescado'], ['mariscos', 'Mariscos'], ['nueces', 'Nueces y cacahuate'], ['soya', 'Soya'], ['res', 'Res'], ['cerdo', 'Cerdo'], ['carne', 'Toda carne (vegetariano)']];
export const ACTIVITY = [[1.2, 'Sedentario (sin ejercicio)'], [1.375, 'Ligero (1-3 días/sem)'], [1.55, 'Moderado (3-5 días/sem)'], [1.725, 'Alto (6-7 días/sem)'], [1.9, 'Muy alto (doble sesión / trabajo físico)']];

// Mezcla alimentos oficiales con los propios del coach (los marcados custom no se pisan)
export function mergeFoods(mine) {
  const byId = new Map((mine || []).map((f) => [f.id, f]));
  const out = (mine || []).filter((f) => f.custom || !BASE_FOODS.some((x) => x.id === f.id));
  for (const f of BASE_FOODS) { const c = byId.get(f.id); if (!(c && c.custom)) out.push(f); }
  return out;
}
let REG = Object.fromEntries(BASE_FOODS.map((f) => [f.id, f]));
export const setFoods = (list) => { REG = Object.fromEntries(list.map((f) => [f.id, f])); };
export const food = (id) => REG[id];
const allFoods = () => Object.values(REG);

const round = (n, k = 1) => Math.round(n / k) * k;
const r1 = (n) => Math.round(n * 10) / 10;

export function latestWeight(c) {
  const m = [...(c.measures || [])].filter((x) => x.weight !== '' && x.weight != null).sort((a, b) => a.date.localeCompare(b.date));
  return m.length ? { weight: m.at(-1).weight, fat: m.at(-1).fat === '' || m.at(-1).fat == null ? null : m.at(-1).fat } : { weight: null, fat: null };
}

// Tendencia de peso: % por semana entre el primer y el último registro de las últimas 4 semanas (mínimo 7 días)
export function weightTrend(c) {
  const m = [...(c.measures || [])].filter((x) => x.weight !== '' && x.weight != null).sort((a, b) => a.date.localeCompare(b.date));
  if (m.length < 2) return null;
  const last = m.at(-1), lastT = new Date(last.date + 'T12:00').getTime();
  const win = m.filter((x) => lastT - new Date(x.date + 'T12:00').getTime() <= 28 * 864e5);
  const first = win[0];
  const days = (lastT - new Date(first.date + 'T12:00').getTime()) / 864e5;
  if (days < 7) return null;
  const pct = ((last.weight - first.weight) / first.weight) / (days / 7) * 100;
  return { pct: r1(pct), days: Math.round(days), from: first.weight, to: last.weight };
}

export function adviceFromTrend(c, goal) {
  const t = weightTrend(c);
  if (!t) return { t: null, text: 'Registra al menos 2 pesos con 7 días o más de diferencia (en Progreso) para recibir recomendaciones de ajuste.' };
  const r = t.pct;
  let text, delta = 0;
  if (goal === 'perder') {
    if (r > -0.3) { delta = -150; text = `Baja ${Math.abs(r)}% por semana (meta 0.5–1%): resta ~150 kcal, principalmente de carbohidratos o grasa, y confirma adherencia y pasos diarios.`; }
    else if (r < -1.2) { delta = 150; text = `Baja ${Math.abs(r)}% por semana, más rápido de lo recomendable: suma ~150 kcal para cuidar masa muscular y rendimiento.`; }
    else text = `Baja ${Math.abs(r)}% por semana: dentro del rango (0.5–1%). Mantén el plan.`;
  } else if (goal === 'ganar') {
    if (r < 0.1) { delta = 150; text = `Sube ${r}% por semana (meta 0.25–0.5%): suma ~150 kcal, sobre todo carbohidratos.`; }
    else if (r > 0.7) { delta = -150; text = `Sube ${r}% por semana, más rápido de lo útil: resta ~150 kcal para limitar grasa ganada.`; }
    else text = `Sube ${r}% por semana: buen ritmo (0.25–0.5%). Mantén el plan.`;
  } else {
    if (Math.abs(r) > 0.3) { delta = r > 0 ? -120 : 120; text = `El peso ${r > 0 ? 'sube' : 'baja'} ${Math.abs(r)}% por semana: ajusta ${r > 0 ? '−' : '+'}120 kcal para mantener.`; }
    else text = 'El peso se mantiene estable. Mantén el plan.';
  }
  return { t, delta, text: text + ' Evalúa con 2 semanas de datos y buena adherencia antes de cambiar.' };
}

// cfg: {goal:'perder'|'mantener'|'ganar', rate, eq:'mifflin'|'cunningham', cycle:boolean, trainDays}
export function calcPlan(c, cfg) {
  const { weight, fat } = latestWeight(c);
  const warnings = [], notes = [];
  if (!weight || !c.height || !c.age || !c.sex) return { error: 'Faltan datos: peso (en Progreso), estatura, edad y sexo del cliente.' };
  const goal = cfg.goal;
  const lbm = fat ? weight * (1 - fat / 100) : null;
  let bmr, eq = 'Mifflin-St Jeor';
  if (cfg.eq === 'cunningham' && lbm) { bmr = 500 + 22 * lbm; eq = 'Cunningham (masa libre de grasa)'; }
  else bmr = 10 * weight + 6.25 * c.height - 5 * c.age + (c.sex === 'f' ? -161 : 5);
  const tdee = bmr * (Number(c.activity) || 1.55);
  let kcal = tdee;
  if (goal === 'perder') {
    const wk = cfg.rate || (c.track === 'fisicoculturismo' ? 0.7 : 0.5);
    const deficit = Math.min((weight * wk / 100 * 7700) / 7, tdee * 0.25);
    kcal = tdee - deficit;
    notes.push(`Déficit de ~${Math.round(deficit)} kcal/día (meta de pérdida ≈ ${wk}% del peso por semana; rango recomendado 0.5–1%).`);
  } else if (goal === 'ganar') {
    kcal = tdee * (c.track === 'fisicoculturismo' ? 1.1 : 1.08);
    notes.push('Superávit moderado (~8–10%) para ganar masa con poca grasa.');
  }
  let p;
  if (c.track === 'fisicoculturismo' && goal === 'perder') {
    p = lbm ? lbm * 2.5 : weight * 2.2;
    notes.push(lbm ? 'Proteína ≈ 2.5 g/kg de masa libre de grasa (rango 2.3–3.1 en definición).' : 'Proteína ≈ 2.2 g/kg de peso (registra % de grasa para afinar).');
  } else if (c.track === 'fisicoculturismo') { p = weight * 2.0; notes.push('Proteína ≈ 2.0 g/kg (rango 1.6–2.2).'); }
  else { const k = c.track === 'beisbol' ? 1.8 : 1.6; p = weight * k; notes.push(`Proteína ≈ ${k} g/kg (rango ISSN 1.4–2.0 para quienes entrenan).`); }
  const fatPct = c.track === 'fisicoculturismo' && goal === 'perder' ? 0.22 : 0.27;
  const f = Math.max(kcal * fatPct / 9, weight * 0.6);
  let carbs = (kcal - p * 4 - f * 9) / 4;
  if (carbs < 0) { carbs = 0; warnings.push('Las calorías no alcanzan para proteína y grasa mínima: revisa la meta.'); }
  if (kcal < bmr) warnings.push(`La meta (${round(kcal, 10)} kcal) queda por debajo del metabolismo basal estimado (${round(bmr)} kcal). Evalúa con cuidado y no sostengas esto por mucho tiempo.`);
  if (kcal < (c.sex === 'f' ? 1200 : 1500)) warnings.push('Calorías muy bajas: se recomienda valoración profesional antes de aplicarlo.');
  if (c.track === 'beisbol') {
    const need = { 'fuera de temporada': [4, 6], pretemporada: [5, 7], temporada: [5, 7] }[c.season || 'fuera de temporada'];
    const gkg = carbs / weight;
    notes.push(`Carbohidratos para deportes de equipo: ${need[0]}–${need[1]} g/kg (más en días de juego). Esta meta da ${gkg.toFixed(1)} g/kg.`);
    if (gkg < need[0]) warnings.push(`Carbohidratos bajos para un atleta de béisbol (${gkg.toFixed(1)} g/kg). Considera mantener calorías o quitar el déficit.`);
    if (goal === 'perder' && c.season === 'temporada') warnings.push('Perder peso en temporada puede bajar rendimiento y recuperación; prioriza mantener.');
  }
  if (c.track === 'fisicoculturismo' && goal === 'perder') notes.push('Grasa ≈ 20–25% de las calorías (rango 15–30%). No bajes de 0.6 g/kg.');
  notes.push(`Gasto estimado con ecuación ${eq}. Es una estimación: ajusta con la tendencia de peso de 2 semanas.`);

  if (cfg.adjust) { kcal += cfg.adjust; notes.push(`Ajuste por tendencia de peso: ${cfg.adjust > 0 ? '+' : ''}${cfg.adjust} kcal.`); }
  const avg = { kcal: round(kcal, 10), p: round(p), c: round(carbs), f: round(f) };
  // Días de entreno/descanso (ciclado de carbohidratos): el promedio semanal se mantiene
  let dayTargets = [{ type: 'uniforme', label: 'Todos los días', ...avg, count: 7 }];
  if (cfg.cycle) {
    const n = Math.min(Math.max(cfg.trainDays || c.daysPerWeek || 3, 1), 6);
    const hi = c.track === 'beisbol' && c.season === 'temporada' ? 0.22 : 0.15;
    const cT = carbs * (1 + hi), cR = Math.max(carbs * 0.5, (7 * carbs - n * cT) / (7 - n));
    const mk = (cc) => ({ p: avg.p, f: avg.f, c: round(cc), kcal: round(avg.p * 4 + avg.f * 9 + cc * 4, 10) });
    const tType = c.track === 'beisbol' && c.season === 'temporada' ? ['juego', 'Día de juego / entreno'] : ['entreno', 'Día de entreno'];
    dayTargets = [{ type: tType[0], label: tType[1], ...mk(cT), count: n }, { type: 'descanso', label: 'Día de descanso', ...mk(cR), count: 7 - n }];
    notes.push(`Ciclado de carbohidratos: ${round(cT)} g en días de entreno y ${round(cR)} g en descanso; el promedio semanal se mantiene.`);
  }
  const water = { daily: [Math.round(weight * 30 / 100) * 100, Math.round(weight * 40 / 100) * 100], pre: [Math.round(weight * 5 / 10) * 10, Math.round(weight * 10 / 10) * 10] };
  const fiber = Math.round(avg.kcal / 1000 * 14);
  return { weight, lbm, fat, bmr: round(bmr), tdee: round(tdee), eq, goal, target: avg, dayTargets, perKg: { p: r1(avg.p / weight), c: r1(avg.c / weight), f: r1(avg.f / weight) }, fiber, water, notes, warnings, supplements: supplementsFor(c, weight) };
}

function supplementsFor(c, weight) {
  const s = [
    { n: 'Proteína en polvo', d: 'Es solo una forma práctica de completar la proteína del día; no es obligatoria.' },
    { n: 'Creatina monohidratada', d: '3–5 g al día de forma constante (ISSN 2017: sin evidencia de daño en personas sanas). Efecto sobre fuerza y masa muscular; tarda 3–4 semanas en saturar sin fase de carga.' },
    { n: 'Cafeína (opcional)', d: `ISSN 2021 respalda su efecto en rendimiento; la dosis usual es 3–6 mg/kg (≈ ${Math.round(weight * 3)}–${Math.round(weight * 6)} mg) 30–60 min antes. Verifica la dosis con la fuente antes de indicar; evita si afecta el sueño, ansiedad, presión alta o menores de edad.` },
  ];
  if (c.track === 'beisbol') s.push({ n: 'Competencia', d: 'Si compite bajo control antidopaje, usa solo productos con certificación independiente (p. ej. NSF Certified for Sport o Informed Sport).' });
  return s;
}

// ---------- Menús ----------
const SLOTS = {
  3: [['Desayuno', 8, 0.3, 'des'], ['Comida', 14, 0.4, 'com'], ['Cena', 20, 0.3, 'com']],
  4: [['Desayuno', 8, 0.26, 'des'], ['Comida', 14, 0.32, 'com'], ['Colación', 17, 0.17, 'col'], ['Cena', 20.5, 0.25, 'com']],
  5: [['Desayuno', 8, 0.22, 'des'], ['Colación', 11.5, 0.12, 'col'], ['Comida', 14.5, 0.28, 'com'], ['Colación', 17.5, 0.16, 'col'], ['Cena', 20.5, 0.22, 'com']],
};
const OPT = {
  des: { p: ['huevo', 'claras', 'yogur', 'panela', 'requeson', 'pavo', 'whey'], c: ['avena', 'tortilla', 'pan', 'bolillo', 'papa', 'camote'], f: ['aguacate', 'almendra', 'cacahuate', 'chia'], v: ['manzana', 'fresa', 'papaya', 'mango', 'naranja', 'pina', 'kiwi', 'pera'], veg: ['espinaca', 'jitomate', 'nopal', 'champinon'] },
  com: { p: ['pollo', 'res', 'pescado', 'atun', 'pollo_muslo', 'cerdo', 'salmon', 'camaron', 'huevo'], c: ['arroz', 'papa', 'camote', 'pasta', 'tortilla', 'quinoa', 'arroz_int', 'platano_macho'], f: ['aguacate', 'aceite', 'nuez', 'pistache'], v: [], veg: ['brocoli', 'calabacita', 'nopal', 'chayote', 'zanahoria', 'lechuga', 'jitomate', 'espinaca'] },
  col: { p: ['yogur', 'whey', 'requeson', 'atun', 'pavo', 'panela', 'kefir'], c: ['platano', 'manzana', 'mango', 'tortilla', 'pan', 'papaya', 'uva', 'galleta_arroz'], f: ['almendra', 'cacahuate', 'nuez', 'pistache'], v: [], veg: [] },
  pre: { p: ['yogur', 'claras', 'pavo', 'requeson', 'whey'], c: ['platano', 'pan', 'avena', 'galleta_arroz', 'miel', 'bolillo'], f: [], v: [], veg: [] },
  post: { p: ['whey', 'yogur', 'requeson', 'pollo', 'atun'], c: ['platano', 'arroz', 'papa', 'mango', 'pan', 'bebida_dep'], f: [], v: [], veg: [] },
};

export const itemFood = (it) => food(it.id);
export function itemText(it) {
  const f = food(it.id); if (!f) return '?';
  if (f.unit) { const n = Math.round(it.g / f.unit.g * 2) / 2 || 0.5; return `${n} ${n === 1 ? f.unit.n : f.unit.p}${f.unit.of ? ' de ' + f.name.toLowerCase() : ''} (${Math.round(it.g)} g)`; }
  return `${Math.round(it.g)} g de ${f.name.toLowerCase()}`;
}
export const itemsText = (items) => items.map(itemText).join(' + ');
export function itemMacros(it) { const f = food(it.id); if (!f) return { kcal: 0, p: 0, c: 0, f: 0 }; const k = it.g / 100; return { kcal: f.kcal * k, p: f.p * k, c: f.c * k, f: f.f * k }; }
export function mealTotals(items) { return (items || []).reduce((a, it) => { const m = itemMacros(it); return { kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }; }, { kcal: 0, p: 0, c: 0, f: 0 }); }
export function dayTotals(day) { return (day.meals || []).reduce((a, m) => { const t = m.items ? mealTotals(m.items) : { kcal: 0, p: 0, c: 0, f: 0 }; return { kcal: a.kcal + t.kcal, p: a.p + t.p, c: a.c + t.c, f: a.f + t.f }; }, { kcal: 0, p: 0, c: 0, f: 0 }); }
export const snapG = (f, g) => (f.unit ? Math.max(1, Math.round(g / f.unit.g * 2) / 2) * f.unit.g : Math.max(5, round(g, 5)));

function buildMeal(share, T0, kind, dayIdx, mealIdx, excluded) {
  const ok = (id) => food(id) && !food(id).tags.some((t) => excluded.has(t));
  const pick = (list, off) => { const a = list.filter(ok); return a.length ? food(a[(dayIdx * 2 + mealIdx + off) % a.length]) : null; };
  const o = { ...OPT[kind] };
  if (excluded.has('carne')) {
    if (kind === 'com') { o.p = ['tofu', 'tempeh', 'huevo', 'panela', 'requeson', 'yogur']; o.c = ['arroz', 'papa', 'camote', 'pasta', 'frijol', 'lenteja', 'garbanzo', 'tortilla']; }
    o.p = o.p.filter((id) => !['atun', 'pavo', 'pollo', 'pollo_muslo', 'res', 'pescado', 'cerdo', 'salmon', 'camaron'].includes(id));
  }
  const pro = pick(o.p, 0), carb = pick(o.c, 1), fat = pick(o.f, 2), fruit = kind === 'des' ? pick(o.v, 3) : null, veg = pick(o.veg, 4);
  const vegG = kind === 'com' ? 150 : kind === 'des' && veg ? 60 : 0;
  const T = { p: T0.p * share, c: T0.c * share, f: T0.f * share };
  // si la comida lleva muchos carbohidratos, se reparten en dos fuentes para que las porciones sean razonables
  let carb2 = null;
  if (carb && T.c >= 70 && kind !== 'pre') { const alt = o.c.filter((id) => ok(id) && id !== carb.id); carb2 = alt.length ? food(alt[(dayIdx + mealIdx * 2 + 3) % alt.length]) : null; }
  const slots = { pro, carb, carb2, fat, fruit, veg: vegG ? veg : null };
  const g = { pro: 0, carb: 0, carb2: 0, fat: 0, fruit: 0, veg: vegG };
  if (fruit) g.fruit = Math.max(60, Math.min(150, (T.c * 0.25 / fruit.c) * 100));
  const keys = ['pro', 'carb', 'carb2', 'fat', 'fruit', 'veg'];
  const have = (k) => keys.reduce((a, key) => { const it = slots[key]; return a + (it ? it[k] * g[key] / 100 * (k === 'p' && key !== 'pro' ? 0.85 : 1) : 0); }, 0);
  for (let pass = 0; pass < 3; pass++) {
    if (carb) {
      const miss = T.c - have('c');
      if (carb2) { g.carb = Math.max(0, g.carb + (miss * 0.6 / carb.c) * 100); g.carb2 = Math.max(0, g.carb2 + (miss * 0.4 / carb2.c) * 100); }
      else g.carb = Math.max(0, g.carb + (miss / carb.c) * 100);
    }
    if (pro) g.pro = Math.max(0, g.pro + ((T.p - have('p')) / pro.p) * 100);
    if (fat) g.fat = Math.max(0, g.fat + ((T.f - have('f')) / fat.f) * 100);
  }
  const items = [];
  for (const key of ['pro', 'carb', 'carb2', 'fruit', 'fat', 'veg']) {
    const f = slots[key]; if (!f || g[key] < 8) continue;
    const cap = key === 'pro' ? 280 : key === 'veg' ? 200 : f.cat === 'bebida' ? 500 : 700 / (f.kcal / 100); // tope por porción
    items.push({ id: f.id, g: key === 'veg' ? Math.round(g[key]) : snapG(f, Math.min(g[key], cap)) });
  }
  return items;
}

// Ajusta carbohidratos, fruta y grasa del día para acercar las calorías a la meta (±3%)
export function fitDay(day, targetKcal) {
  for (let pass = 0; pass < 3; pass++) {
    const tot = dayTotals(day).kcal, diff = targetKcal - tot;
    if (Math.abs(diff) / targetKcal < 0.03) return;
    const adj = day.meals.flatMap((m) => m.items || []).filter((it) => ['carbohidrato', 'fruta', 'grasa'].includes(food(it.id)?.cat));
    const base = adj.reduce((a, it) => a + itemMacros(it).kcal, 0);
    if (!base) return;
    const k = Math.min(1.5, Math.max(0.6, 1 + diff / base));
    adj.forEach((it) => { const f = food(it.id); it.g = snapG(f, Math.min(it.g * k, f.cat === 'bebida' ? 500 : 700 / (f.kcal / 100))); });
  }
}

// plan: resultado de calcPlan. Devuelve días con comidas estructuradas (items).
export function buildPlanMenus(c, plan, opts = {}) {
  const meals = opts.meals || 5;
  const excluded = new Set(c.foodsAvoid || []);
  if (excluded.has('carne')) ['res', 'cerdo'].forEach((t) => excluded.add(t));
  const days = [];
  plan.dayTargets.forEach((dt) => {
    const training = dt.type === 'entreno' || dt.type === 'juego';
    const variants = plan.dayTargets.length === 1 ? ['A', 'B', 'C'] : ['A', 'B'];
    variants.forEach((v, vi) => {
      const slots = SLOTS[meals].map((s) => [...s]);
      let shares = slots.map((s) => s[2]);
      if (meals === 5 && training) shares = [0.2, 0.14, 0.27, 0.17, 0.22];
      const colIdx = slots.map((s, i) => (s[3] === 'col' ? i : -1)).filter((i) => i >= 0);
      const kinds = slots.map((s) => s[3]);
      const labels = slots.map((s) => s[0]);
      if (training && colIdx.length) {
        const pre = dt.type === 'juego' ? 'Pre-juego' : 'Pre-entreno', post = dt.type === 'juego' ? 'Post-juego' : 'Post-entreno';
        if (colIdx.length >= 2) { labels[colIdx[0]] = pre; kinds[colIdx[0]] = 'pre'; labels[colIdx.at(-1)] = post; kinds[colIdx.at(-1)] = 'post'; }
        else { labels[colIdx[0]] = post; kinds[colIdx[0]] = 'post'; }
      }
      const ms = slots.map((s, i) => {
        const h = Math.floor(s[1]), m = Math.round((s[1] - h) * 60);
        return { name: labels[i], time: `${h}:${String(m).padStart(2, '0')}`, items: buildMeal(shares[i], dt, kinds[i], vi + (dt.type === 'descanso' ? 1 : 0) + (opts.seed || 0), i, excluded) };
      });
      const day = { name: plan.dayTargets.length === 1 ? `Día ${v}` : `${dt.label} · ${v}`, type: dt.type, target: { kcal: dt.kcal, p: dt.p, c: dt.c, f: dt.f }, meals: ms };
      fitDay(day, dt.kcal); days.push(day);
    });
  });
  const counts = Object.fromEntries(plan.dayTargets.map((d) => [d.type, d.count]));
  return { days, counts };
}

// Equivalencias: misma categoría, misma cantidad del macro principal
export function equivalents(it, excludedTags = []) {
  const f = food(it.id); if (!f) return [];
  const key = { 'proteína': 'p', 'lácteo': 'p', 'carbohidrato': 'c', 'fruta': 'c', 'grasa': 'f', 'bebida': 'c', 'verdura': 'kcal' }[f.cat];
  const own = f[key] * it.g / 100;
  if (!own) return [];
  const ex = new Set(excludedTags);
  return allFoods().filter((a) => a.id !== f.id && (a.cat === f.cat || (f.cat === 'proteína' && a.cat === 'lácteo' && a.p >= 8) || (f.cat === 'carbohidrato' && a.cat === 'fruta')) && a[key] >= (key === 'kcal' ? 10 : 2.5) && !a.tags.some((t) => ex.has(t)))
    .map((a) => ({ id: a.id, g: snapG(a, own / a[key] * 100) })).filter((a) => a.g <= 700).slice(0, 14);
}

// Lista del súper: suma de la semana. counts: {tipoDeDía: días por semana}
export function shopping(days, counts) {
  const byType = {}; days.forEach((d) => (byType[d.type || 'x'] ||= []).push(d));
  const acc = {};
  for (const [type, list] of Object.entries(byType)) {
    const w = (counts?.[type] ?? 7 / days.length * list.length) / list.length;
    list.forEach((d) => d.meals.forEach((m) => (m.items || []).forEach((it) => { acc[it.id] = (acc[it.id] || 0) + it.g * w; })));
  }
  const out = {};
  Object.entries(acc).forEach(([id, g]) => { const f = food(id); if (f) (out[f.cat] ||= []).push({ f, g: Math.round(g / 50) * 50 || 50 }); });
  Object.values(out).forEach((l) => l.sort((a, b) => b.g - a.g));
  return out;
}

export function trackTips(c, goal) {
  const tips = [];
  tips.push('Cada comida con 20–40 g de proteína (≈ 0.25 g/kg).');
  if (c.track === 'beisbol') {
    tips.push('Días de juego: comida con carbohidratos 3–4 h antes, colación ligera (baja en grasa y fibra) 1 h antes y comida de recuperación con proteína + carbohidratos después.');
    tips.push('Viajes: lleva colaciones (fruta, yogur, almendras, sándwich de pavo) para no depender de lo que haya en el camino.');
    tips.push('Sueño: apunta a 8 h o más; más si hay viajes o juegos seguidos.');
  }
  if (c.track === 'fisicoculturismo') {
    tips.push(goal === 'perder' ? 'Definición: usa el promedio semanal del peso y ajusta ±100–150 kcal si baja menos de 0.5% o más de 1% por semana.' : 'Volumen: sube de peso ~0.25–0.5% por semana; si va más rápido, baja 100–150 kcal.');
    tips.push('Reparte la proteína en 4–5 comidas y deja una comida alta en carbohidratos antes de entrenar.');
  }
  tips.push('Orientación alimenticia: no sustituye valoración médica ni de un nutriólogo clínico. Ajusta según evolución, hambre, energía y salud del cliente.');
  return tips;
}
