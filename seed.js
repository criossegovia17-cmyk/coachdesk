// Datos iniciales: biblioteca de ejercicios + demo. Todo editable desde la app.
const E = (id, name, pattern, level, equip, avoid, muscle, desc, cues, regress, progress) =>
  ({ id, name, pattern, level, equip, avoid, muscle, desc, cues, regress, progress, video: '' });

export const exercises = [
  E('sq1', 'Sentadilla goblet', 'sentadilla', 'intermedio', ['mancuernas'], ['rodilla'], 'Cuádriceps, glúteo',
    'Sostén una mancuerna contra el pecho. Pies al ancho de hombros, baja con la espalda recta hasta que los muslos queden paralelos al piso y sube empujando el piso.',
    'Pecho arriba · Rodillas siguen la línea de los pies · Talones pegados al piso', 'Sentadilla a caja con peso corporal', 'Goblet con pausa de 3 s abajo'),
  E('sq2', 'Sentadilla a caja', 'sentadilla', 'principiante', ['peso corporal'], [], 'Cuádriceps, glúteo',
    'Siéntate hacia atrás en un banco o caja, toca con los glúteos y vuelve a ponerte de pie sin balancear el cuerpo.',
    'Cadera atrás · Espalda neutra · Sube empujando con los talones', 'Sentadilla asistida sujetándote de algo', 'Sentadilla goblet'),
  E('sq3', 'Zancada alterna', 'sentadilla', 'intermedio', ['peso corporal'], ['rodilla'], 'Cuádriceps, glúteo',
    'Da un paso largo al frente y baja la rodilla trasera hacia el piso. Empuja con el pie delantero para regresar y alterna piernas.',
    'Torso erguido · Rodilla delantera sobre el tobillo · Paso largo', 'Zancada estática sujeto de apoyo', 'Zancada con mancuernas'),
  E('sq4', 'Sentadilla búlgara', 'sentadilla', 'avanzado', ['banco', 'mancuernas'], ['rodilla'], 'Cuádriceps, glúteo',
    'Pie trasero apoyado en un banco, baja controlado con la pierna delantera y sube sin impulsarte con la trasera.',
    'Peso en el pie delantero · Baja en 3 s · Cadera cuadrada', 'Zancada estática', 'Búlgara con mancuernas pesadas'),

  E('pu1', 'Flexión de brazos', 'empuje', 'intermedio', ['peso corporal'], ['hombro', 'muñeca'], 'Pecho, tríceps, hombro',
    'En posición de plancha, baja el pecho hacia el piso con codos a 45° y empuja de vuelta manteniendo el cuerpo en línea.',
    'Cuerpo en una línea · Codos a 45° · Pecho toca casi el piso', 'Flexión inclinada con manos en banco', 'Flexión con pies elevados'),
  E('pu2', 'Flexión inclinada', 'empuje', 'principiante', ['banco'], ['muñeca'], 'Pecho, tríceps',
    'Manos sobre un banco o pared, cuerpo recto. Baja el pecho hacia el apoyo y empuja.',
    'Abdomen apretado · Codos cerca del cuerpo', 'Flexión en pared', 'Flexión de brazos en piso'),
  E('pu3', 'Press de hombro con mancuernas', 'empuje', 'intermedio', ['mancuernas'], ['hombro'], 'Hombro, tríceps',
    'De pie o sentado, lleva las mancuernas desde los hombros hasta arriba sin arquear la espalda baja.',
    'Abdomen firme · No arquear · Codos al frente', 'Press con banda elástica', 'Push press'),
  E('pu4', 'Press de pecho con mancuernas', 'empuje', 'intermedio', ['mancuernas', 'banco'], ['hombro'], 'Pecho, tríceps',
    'Acostado en banco o piso, empuja las mancuernas hacia arriba sobre el pecho y baja controlado.',
    'Escápulas juntas · Codos a 45° · Baja en 2 s', 'Press con banda', 'Press inclinado con pausa'),

  E('hi1', 'Puente de glúteo', 'bisagra', 'principiante', ['peso corporal'], [], 'Glúteo, isquios',
    'Acostado boca arriba con rodillas dobladas, eleva la cadera apretando glúteos hasta formar una línea hombros-rodillas.',
    'Aprieta glúteos arriba · Costillas abajo · Pausa de 1 s', 'Puente corto con rango reducido', 'Puente a una pierna'),
  E('hi2', 'Peso muerto rumano con mancuernas', 'bisagra', 'intermedio', ['mancuernas'], ['espalda'], 'Isquios, glúteo',
    'De pie con mancuernas frente a los muslos, lleva la cadera atrás con la espalda neutra hasta sentir el estiramiento y regresa.',
    'Cadera atrás · Espalda plana · Mancuernas pegadas a las piernas', 'Bisagra de cadera con peso corporal', 'Peso muerto a una pierna'),
  E('hi3', 'Hip thrust en banco', 'bisagra', 'intermedio', ['banco'], [], 'Glúteo',
    'Espalda alta apoyada en un banco, pies firmes. Eleva la cadera hasta alinear tronco y muslos, aprieta y baja.',
    'Mentón al pecho · Empuja con talones · Pausa arriba', 'Puente de glúteo en piso', 'Hip thrust con mancuerna'),
  E('hi4', 'Peso muerto a una pierna', 'bisagra', 'avanzado', ['mancuernas'], ['espalda', 'rodilla'], 'Isquios, glúteo, equilibrio',
    'Apoyado en una pierna, inclina el torso llevando la otra pierna atrás como una palanca. Regresa apretando glúteo.',
    'Cadera cuadrada · Mirada al piso · Lento', 'Apoyando los dedos del pie libre', 'Con mancuerna en mano contraria'),

  E('pl1', 'Remo con mancuerna a una mano', 'tirón', 'intermedio', ['mancuernas', 'banco'], ['espalda'], 'Dorsal, bíceps',
    'Una mano y rodilla en el banco, jala la mancuerna hacia la cadera llevando el codo atrás.',
    'Espalda plana · Codo cerca del cuerpo · Sin rotar el torso', 'Remo con banda elástica', 'Remo con pausa de 2 s'),
  E('pl2', 'Remo con banda', 'tirón', 'principiante', ['banda'], [], 'Dorsal, bíceps',
    'Sentado con la banda en los pies o de pie anclada, jala los codos hacia atrás juntando escápulas.',
    'Hombros abajo · Junta escápulas · Regresa lento', 'Banda más suave', 'Banda más fuerte o más lento'),
  E('pl3', 'Remo invertido', 'tirón', 'avanzado', ['barra'], [], 'Dorsal, bíceps',
    'Bajo una barra baja, cuerpo recto, jala el pecho hacia la barra y baja controlado.',
    'Cuerpo en línea · Pecho a la barra · Codos atrás', 'Con rodillas dobladas', 'Con pies elevados'),
  E('pl4', 'Superman', 'tirón', 'principiante', ['peso corporal'], ['espalda'], 'Espalda baja, glúteo',
    'Boca abajo, eleva brazos y piernas a la vez, sostén 2 s y baja.',
    'Mirada al piso · Alarga el cuerpo · Sin forzar el cuello', 'Solo brazos o solo piernas', 'Con pausa de 5 s'),

  E('co1', 'Plancha', 'core', 'intermedio', ['peso corporal'], ['hombro', 'muñeca'], 'Abdomen',
    'Apoyado en antebrazos y puntas de los pies, mantén el cuerpo recto sin dejar caer la cadera.',
    'Glúteos apretados · Costillas abajo · Respira', 'Plancha con rodillas apoyadas', 'Plancha con toque de hombro'),
  E('co2', 'Dead bug', 'core', 'principiante', ['peso corporal'], [], 'Abdomen',
    'Boca arriba, brazos y rodillas al techo. Extiende brazo y pierna opuestos sin despegar la espalda baja del piso.',
    'Espalda baja pegada · Lento · Exhala al extender', 'Solo las piernas', 'Con banda o mancuerna ligera'),
  E('co3', 'Pallof press con banda', 'core', 'intermedio', ['banda'], [], 'Core, oblicuos',
    'De lado a un anclaje, empuja la banda al frente resistiendo que te gire. Mantén 2 s y regresa.',
    'Cadera firme · No rotar · Exhala al empujar', 'Banda más suave', 'Banda más fuerte o en media rodilla'),
  E('co4', 'Rueda abdominal', 'core', 'avanzado', ['rueda'], ['espalda', 'hombro'], 'Abdomen',
    'De rodillas, rueda hacia adelante con el abdomen contraído y regresa sin hundir la espalda.',
    'Pelvis hacia atrás · Rango corto · Controlado', 'Rodar sobre una toalla en piso', 'Desde los pies'),

  E('ca1', 'Jumping jacks', 'cardio', 'principiante', ['peso corporal'], ['impacto'], 'Cuerpo completo',
    'Salta abriendo piernas y brazos a la vez y regresa a la posición inicial a ritmo constante.',
    'Aterriza suave · Ritmo constante', 'Jack sin salto (paso lateral)', 'Jack con sentadilla'),
  E('ca2', 'Skipping alto / cuerda', 'cardio', 'intermedio', ['peso corporal', 'cuerda'], ['rodilla', 'impacto'], 'Cuerpo completo',
    'Trotando en el lugar elevando rodillas a la cadera, o saltando cuerda con saltos pequeños.',
    'Salta sobre la punta · Codos a 90°', 'Marcha elevando rodillas', 'Doble salto'),
  E('ca3', 'Burpees', 'cardio', 'avanzado', ['peso corporal'], ['impacto', 'hombro', 'espalda'], 'Cuerpo completo',
    'Baja a plancha, pecho al piso, regresa y salta con brazos arriba.',
    'Cuerpo en línea al bajar · Aterriza suave', 'Burpee sin salto ni flexión', 'Burpee con salto de longitud'),
  E('ca4', 'Mountain climbers', 'cardio', 'intermedio', ['peso corporal'], ['muñeca', 'hombro'], 'Core, cardio',
    'En posición de plancha alta, lleva las rodillas al pecho alternando a buen ritmo.',
    'Cadera baja · Hombros sobre manos', 'Con manos en banco', 'Más rápido o con deslizadores'),
  E('ca5', 'Remo en máquina / bici', 'cardio', 'intermedio', ['máquina'], [], 'Cuerpo completo',
    'Ritmo sostenido en remo ergómetro o bicicleta. Cuida la técnica antes que la velocidad.',
    'Piernas-tronco-brazos en remo · Ritmo constante', 'Resistencia baja', 'Intervalos al 90%'),
  E('ca6', 'Battle ropes', 'cardio', 'avanzado', ['cuerda pesada'], ['hombro'], 'Hombros, cardio',
    'Ondas alternas con las cuerdas, caderas ligeramente flexionadas.',
    'Core firme · Ondas desde los hombros', 'Ondas lentas', 'Ondas dobles'),
];

export function demo() {
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const plans = [
    { id: 'pl_a', name: 'Mensual 3x semana', price: 1800, sessions: 12 },
    { id: 'pl_b', name: 'Mensual 5x semana', price: 2800, sessions: 20 },
    { id: 'pl_c', name: 'Clase grupal (mes)', price: 900, sessions: 8 },
  ];
  const clients = [
    { id: 'c1', name: 'Ana Torres', phone: '5215512345678', email: '', goal: 'Bajar grasa', level: 'principiante', injuries: ['rodilla'], notes: 'Molestia leve en rodilla derecha. Prefiere entrenar por la mañana.', planId: 'pl_a', routineId: 'r1', dietId: 'di1', active: true, measures: [{ date: d(-28), weight: 72, fat: 33, waist: 84, note: 'Inicio' }, { date: d(-14), weight: 70.8, fat: 32, waist: 82, note: '' }, { date: d(-1), weight: 69.9, fat: 31, waist: 80.5, note: '' }], files: [] },
    { id: 'c2', name: 'Luis Ramírez', phone: '5215598765432', email: '', goal: 'Ganar músculo', level: 'avanzado', injuries: [], notes: 'Entrena 5 días. Quiere aumentar fuerza en tren superior.', planId: 'pl_b', routineId: 'r2', dietId: 'di2', active: true, measures: [{ date: d(-30), weight: 78, fat: 15, waist: 80, note: 'Inicio' }, { date: d(-2), weight: 80.2, fat: 14.5, waist: 80.5, note: '' }], files: [] },
    { id: 'c3', name: 'María Gómez', phone: '', email: '', goal: 'Tonificar y movilidad', level: 'intermedio', injuries: ['hombro'], notes: 'Cirugía de hombro hace 1 año, ya dada de alta. Evitar sobrecarga overhead.', planId: 'pl_c', routineId: 'r1', dietId: '', active: true, measures: [], files: [] },
    { id: 'c4', name: 'Carlos Peña', phone: '', email: '', goal: 'Condición física', level: 'intermedio', injuries: ['espalda'], notes: 'Dolor lumbar ocasional.', planId: 'pl_c', routineId: '', dietId: '', active: true, measures: [], files: [] },
  ];
  const routines = [
    { id: 'r1', name: 'Cuerpo completo principiante', goal: 'Base general', days: [
      { name: 'Día A', items: [{ exId: 'sq2', sets: 3, reps: '10', rest: '60 s', note: '' }, { exId: 'pu2', sets: 3, reps: '8-10', rest: '60 s', note: '' }, { exId: 'hi1', sets: 3, reps: '12', rest: '45 s', note: '' }, { exId: 'pl2', sets: 3, reps: '12', rest: '45 s', note: '' }, { exId: 'co2', sets: 3, reps: '8 por lado', rest: '30 s', note: '' }] },
      { name: 'Día B', items: [{ exId: 'sq1', sets: 3, reps: '10', rest: '60 s', note: '' }, { exId: 'pu4', sets: 3, reps: '10', rest: '60 s', note: '' }, { exId: 'hi2', sets: 3, reps: '10', rest: '60 s', note: '' }, { exId: 'pl1', sets: 3, reps: '10 por lado', rest: '60 s', note: '' }, { exId: 'co1', sets: 3, reps: '30 s', rest: '30 s', note: '' }] },
    ] },
    { id: 'r2', name: 'Torso / pierna avanzado', goal: 'Hipertrofia', days: [
      { name: 'Torso', items: [{ exId: 'pu4', sets: 4, reps: '8', rest: '90 s', note: 'Carga alta' }, { exId: 'pl3', sets: 4, reps: '8-10', rest: '90 s', note: '' }, { exId: 'pu3', sets: 3, reps: '10', rest: '75 s', note: '' }] },
      { name: 'Pierna', items: [{ exId: 'sq4', sets: 4, reps: '8 por lado', rest: '90 s', note: '' }, { exId: 'hi4', sets: 3, reps: '8 por lado', rest: '75 s', note: '' }, { exId: 'co4', sets: 3, reps: '10', rest: '60 s', note: '' }] },
    ] },
  ];
  const meal = (name, time, food) => ({ name, time, food });
  const diets = [
    { id: 'di1', name: 'Déficit moderado ~1,700 kcal', kcal: 1700, protein: 130, carbs: 160, fat: 55, notes: 'Hidratación: 2.5 L de agua al día.', days: [
      { name: 'Menú base (se repite)', meals: [meal('Desayuno', '8:00', '3 claras + 1 huevo, 2 tortillas de maíz, nopales, café sin azúcar'), meal('Colación', '11:00', 'Yogur griego natural + 1 manzana'), meal('Comida', '14:30', '150 g pechuga a la plancha, 1/2 taza arroz, ensalada grande'), meal('Colación', '17:30', 'Puñado de almendras (20 g) + pepino'), meal('Cena', '20:30', 'Ensalada de atún con aguacate 1/4, 2 tostadas horneadas')] },
    ] },
    { id: 'di2', name: 'Volumen limpio ~3,000 kcal', kcal: 3000, protein: 200, carbs: 380, fat: 80, notes: '', days: [
      { name: 'Día de entreno', meals: [meal('Desayuno', '7:30', '4 huevos, 80 g avena, plátano, leche'), meal('Pre-entreno', '11:00', 'Sándwich de pavo + fruta'), meal('Post-entreno', '14:00', '200 g res magra, 1.5 tazas arroz, verduras'), meal('Colación', '17:00', 'Batido de proteína + avena'), meal('Cena', '21:00', '200 g pollo, papa, ensalada, aceite de oliva')] },
      { name: 'Día de descanso', meals: [meal('Desayuno', '8:30', 'Omelette de 4 huevos con espinaca, pan integral'), meal('Comida', '14:30', '200 g pescado, arroz, verduras'), meal('Cena', '21:00', 'Pollo desmenuzado, frijoles, aguacate')] },
    ] },
  ];
  const groups = [
    { id: 'g1', name: 'Grupo mañanas 7 am', clientIds: ['c1', 'c2', 'c3'], notes: 'Lun / Mié / Vie' },
    { id: 'g2', name: 'Funcional sábado', clientIds: ['c1', 'c3', 'c4'], notes: '' },
  ];
  const payments = [
    { id: 'p1', clientId: 'c1', concept: 'Mensual 3x semana', amount: 1800, due: d(-12), paidOn: d(-10), status: 'pagado', method: 'Transferencia' },
    { id: 'p2', clientId: 'c2', concept: 'Mensual 5x semana', amount: 2800, due: d(-3), paidOn: d(-3), status: 'pagado', method: 'Efectivo' },
    { id: 'p3', clientId: 'c3', concept: 'Clase grupal (mes)', amount: 900, due: d(-4), paidOn: '', status: 'pendiente', method: '' },
    { id: 'p4', clientId: 'c4', concept: 'Clase grupal (mes)', amount: 900, due: d(3), paidOn: '', status: 'pendiente', method: '' },
  ];
  const appointments = [
    { id: 'a1', date: d(0), time: '07:00', duration: 60, type: 'grupal', groupId: 'g1', clientIds: [], status: 'programada', notes: 'Circuito funcional' },
    { id: 'a2', date: d(1), time: '18:00', duration: 60, type: 'individual', groupId: '', clientIds: ['c2'], status: 'programada', notes: 'Torso' },
    { id: 'a3', date: d(2), time: '09:00', duration: 45, type: 'individual', groupId: '', clientIds: ['c1'], status: 'programada', notes: 'Revisión de medidas' },
  ];
  return { plans, clients, routines, diets, groups, payments, appointments };
}

