const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calcularMediana,
  calcularVolumenPorEstado,
  calcularTiempoMedianoCiclo,
  calcularIndicadores,
  consultarIndicadores
} = require('../src/indicadores.js');

const solicitante = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
const coordinador = { id: 'USR-02', name: 'Ana Coordinadora', email: 'coordinador@marz.com', role: 'coordinador' };
const agente = { id: 'USR-03', name: 'Mario Agente', email: 'agente@marz.com', role: 'agente' };
const auditor = { id: 'USR-04', name: 'Elena Auditora', email: 'auditor@marz.com', role: 'auditor' };

test('HU10 — Calculo de mediana matematica (impar y par)', () => {
  assert.strictEqual(calcularMediana([]), 0);
  assert.strictEqual(calcularMediana([10]), 10);
  // Impar: [2, 5, 9] -> mediana 5
  assert.strictEqual(calcularMediana([9, 2, 5]), 5);
  // Par: [1, 3, 5, 7] -> (3 + 5) / 2 = 4
  assert.strictEqual(calcularMediana([7, 1, 5, 3]), 4);
  // Valores decimales
  assert.strictEqual(calcularMediana([1.5, 2.5, 3.5]), 2.5);
});

test('HU10 — Calcular volumen por estado', () => {
  const lista = [
    { id: '1', estado: 'Nuevo' },
    { id: '2', estado: 'Nuevo' },
    { id: '3', estado: 'En Proceso' },
    { id: '4', estado: 'Resuelto' },
    { id: '5', estado: 'Cerrado' }
  ];

  const volumen = calcularVolumenPorEstado(lista);
  assert.strictEqual(volumen.total, 5);
  assert.strictEqual(volumen['Nuevo'], 2);
  assert.strictEqual(volumen['En Proceso'], 1);
  assert.strictEqual(volumen['Resuelto'], 1);
  assert.strictEqual(volumen['Cerrado'], 1);
});

test('HU10 — Calcular tiempo mediano de ciclo de resolucion/cierre', () => {
  const t0 = new Date('2026-01-01T10:00:00Z').toISOString();
  const t2h = new Date('2026-01-01T12:00:00Z').toISOString(); // 2 horas
  const t4h = new Date('2026-01-01T14:00:00Z').toISOString(); // 4 horas
  const t6h = new Date('2026-01-01T16:00:00Z').toISOString(); // 6 horas

  const solicitudes = [
    { id: '1', fecha: t0, ultima_actualizacion: t2h, estado: 'Resuelto' },
    { id: '2', fecha: t0, ultima_actualizacion: t4h, estado: 'Cerrado' },
    { id: '3', fecha: t0, ultima_actualizacion: t6h, estado: 'Resuelto' },
    { id: '4', fecha: t0, ultima_actualizacion: t2h, estado: 'En Proceso' } // No resuelta, no se incluye
  ];

  const ciclo = calcularTiempoMedianoCiclo(solicitudes, 'horas');
  assert.strictEqual(ciclo.solicitudesComputadas, 3);
  assert.strictEqual(ciclo.unidad, 'horas');
  // Duraciones: [2, 4, 6] -> mediana = 4 horas
  assert.strictEqual(ciclo.valor, 4);

  // Cuando no hay resueltas ni cerradas
  const sinCompletadas = calcularTiempoMedianoCiclo([{ id: '5', fecha: t0, estado: 'Nuevo' }]);
  assert.strictEqual(sinCompletadas.valor, 0);
  assert.strictEqual(sinCompletadas.solicitudesComputadas, 0);
});

test('HU10 — Filtros por estado, prioridad y categoria en indicadores', () => {
  const solicitudes = [
    { id: '1', estado: 'Nuevo', prioridad: 'Alta', categoria: 'Hardware' },
    { id: '2', estado: 'Nuevo', prioridad: 'Baja', categoria: 'Software' },
    { id: '3', estado: 'Resuelto', prioridad: 'Alta', categoria: 'Hardware' },
    { id: '4', estado: 'Cerrado', prioridad: 'Media', categoria: 'Software' }
  ];

  // Filtro por prioridad Alta
  const indAlta = calcularIndicadores(solicitudes, { prioridad: 'Alta' });
  assert.strictEqual(indAlta.totalSolicitudes, 2);
  assert.strictEqual(indAlta.volumenPorEstado['Nuevo'], 1);
  assert.strictEqual(indAlta.volumenPorEstado['Resuelto'], 1);

  // Filtro por categoria Software
  const indSoft = calcularIndicadores(solicitudes, { categoria: 'Software' });
  assert.strictEqual(indSoft.totalSolicitudes, 2);

  // Filtro por estado Nuevo
  const indNuevo = calcularIndicadores(solicitudes, { estado: 'Nuevo' });
  assert.strictEqual(indNuevo.totalSolicitudes, 2);
});

test('HU10 — Criterio estricto: Evitar rankings o comparaciones individuales', () => {
  const solicitudes = [
    { id: '1', asignado_a: 'USR-03', estado: 'Resuelto', fecha: '2026-01-01', ultima_actualizacion: '2026-01-02' },
    { id: '2', asignado_a: 'USR-04', estado: 'Resuelto', fecha: '2026-01-01', ultima_actualizacion: '2026-01-03' }
  ];

  const res = calcularIndicadores(solicitudes);

  // Verificar que NO existan campos de rankings o rendimiento por agente
  assert.strictEqual(res.rankingAgentes, undefined);
  assert.strictEqual(res.rankingIndividual, undefined);
  assert.strictEqual(res.rendimientoPorAgente, undefined);
  assert.strictEqual(res.agentes, undefined);

  // Las metricas son exclusivamente agregadas
  assert.ok(res.volumenPorEstado);
  assert.ok(res.tiempoMedianoCiclo);
  assert.ok(res.desglosePorCategoria);
  assert.ok(res.desglosePorPrioridad);
});

test('HU10 — Control de acceso: solo el coordinador puede consultar indicadores', async () => {
  // Solicitante rechazado
  const resSol = await consultarIndicadores({}, solicitante);
  assert.strictEqual(resSol.success, false);
  assert.strictEqual(resSol.error, 'Solo el coordinador puede consultar indicadores agregados.');

  // Agente rechazado
  const resAgente = await consultarIndicadores({}, agente);
  assert.strictEqual(resAgente.success, false);

  // Auditor rechazado
  const resAuditor = await consultarIndicadores({}, auditor);
  assert.strictEqual(resAuditor.success, false);

  // Usuario nulo rechazado
  const resNulo = await consultarIndicadores({}, null);
  assert.strictEqual(resNulo.success, false);

  // Coordinador autorizado
  const resCoord = await consultarIndicadores({}, coordinador);
  assert.strictEqual(resCoord.success, true);
  assert.ok(resCoord.indicadores);
  assert.ok(typeof resCoord.indicadores.totalSolicitudes === 'number');
});
