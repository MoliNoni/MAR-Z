const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PRIORIDADES,
  crearSolicitud,
  ordenarSolicitudes,
  consultarSolicitudesParaPriorizar,
  validarDetallePrioridad,
  cambiarPrioridad
} = require('../src/requests.js');

const solicitante = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
const coordinador = { id: 'USR-02', name: 'Ana Coordinadora', email: 'coordinador@marz.com', role: 'coordinador' };
const agente = { id: 'USR-03', name: 'Mario Agente', email: 'agente@marz.com', role: 'agente' };

test('HU04 — Definicion de niveles de prioridad', () => {
  assert.deepStrictEqual(PRIORIDADES, ['Alta', 'Media', 'Baja']);
});

test('HU04 — Ordenamiento por prioridad, estado y fecha', () => {
  const lista = [
    { id: 'A', prioridad: null, estado: 'Nuevo', fecha: '2026-01-01' },
    { id: 'B', prioridad: 'Baja', estado: 'Nuevo', fecha: '2026-01-01' },
    { id: 'C', prioridad: 'Alta', estado: 'En Proceso', fecha: '2026-01-01' },
    { id: 'D', prioridad: 'Alta', estado: 'Nuevo', fecha: '2026-01-03' },
    { id: 'E', prioridad: 'Alta', estado: 'Nuevo', fecha: '2026-01-02' }
  ];

  const ordenadas = ordenarSolicitudes(lista).map(s => s.id);
  assert.deepStrictEqual(ordenadas, ['E', 'D', 'C', 'B', 'A']);
});

test('HU04 — Solo el coordinador puede priorizar', async () => {
  for (const usuario of [solicitante, agente, null]) {
    const cambio = await cambiarPrioridad('SOL-X', 'Alta', usuario);
    assert.strictEqual(cambio.success, false);
    assert.strictEqual(cambio.error, 'Solo el coordinador puede priorizar solicitudes.');

    const consulta = await consultarSolicitudesParaPriorizar(usuario);
    assert.strictEqual(consulta.success, false);
  }
});

test('HU04 — Rechazar prioridad invalida', async () => {
  const res = await cambiarPrioridad('SOL-X', 'Urgentisima', coordinador);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'La prioridad seleccionada no es valida.');
});

test('HU04 — Cambiar prioridad en Supabase registrando quien y cuando', async () => {
  const sol = (await crearSolicitud({ titulo: 'Servidor caido', descripcion: 'No responde', categoria: 'Software' }, solicitante)).solicitud;

  const res = await cambiarPrioridad(sol.id, 'Alta', coordinador, { justificacion: 'Afecta a toda el area', fechaObjetivo: '2099-12-31' });
  assert.strictEqual(res.success, true, res.error);
  assert.strictEqual(res.solicitud.prioridad, 'Alta');
  assert.strictEqual(res.solicitud.prioridadActualizadaPor, coordinador.id);
  assert.strictEqual(res.solicitud.prioridadJustificacion, 'Afecta a toda el area');
  assert.strictEqual(res.solicitud.prioridadFechaObjetivo, '2099-12-31');
  assert.ok(!isNaN(Date.parse(res.solicitud.prioridadActualizadaEn)));

  const consulta = await consultarSolicitudesParaPriorizar(coordinador);
  assert.strictEqual(consulta.success, true);
  assert.ok(consulta.solicitudes.some(s => s.id === sol.id && s.prioridad === 'Alta'));

  const noExiste = await cambiarPrioridad('SOL-INEXISTENTE-999', 'Baja', coordinador);
  assert.strictEqual(noExiste.success, false);
  assert.strictEqual(noExiste.error, 'Solicitud no encontrada.');
});

test('HU04 — Cambio Sprint 2: prioridad Alta exige justificacion y fecha objetivo', async () => {
  const futura = '2099-12-31';

  assert.strictEqual(validarDetallePrioridad('Alta', { justificacion: 'Bloquea la operacion', fechaObjetivo: futura }).valido, true);
  assert.strictEqual(validarDetallePrioridad('Media', undefined).valido, true);
  assert.strictEqual(validarDetallePrioridad('Baja', {}).valido, true);

  const casos = [
    [undefined, 'La prioridad Alta requiere una justificacion.'],
    [{ justificacion: '   ', fechaObjetivo: futura }, 'La prioridad Alta requiere una justificacion.'],
    [{ justificacion: 'Urgente' }, 'La prioridad Alta requiere una fecha objetivo valida.'],
    [{ justificacion: 'Urgente', fechaObjetivo: '31/12/2099' }, 'La prioridad Alta requiere una fecha objetivo valida.'],
    [{ justificacion: 'Urgente', fechaObjetivo: '2099-02-31' }, 'La prioridad Alta requiere una fecha objetivo valida.'],
    [{ justificacion: 'Urgente', fechaObjetivo: '2020-01-01' }, 'La fecha objetivo no puede estar en el pasado.']
  ];

  for (const [detalle, error] of casos) {
    assert.strictEqual(validarDetallePrioridad('Alta', detalle).error, error);
    const res = await cambiarPrioridad('SOL-X', 'Alta', coordinador, detalle);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, error);
  }
});

test('HU04 — Cambio Sprint 2: bajar de Alta limpia justificacion y fecha objetivo', async () => {
  const sol = (await crearSolicitud({ titulo: 'Impresora lenta', descripcion: 'Tarda mucho', categoria: 'Hardware' }, solicitante)).solicitud;

  const alta = await cambiarPrioridad(sol.id, 'Alta', coordinador, { justificacion: 'Gerencia', fechaObjetivo: '2099-01-01' });
  assert.strictEqual(alta.success, true, alta.error);

  const media = await cambiarPrioridad(sol.id, 'Media', coordinador);
  assert.strictEqual(media.success, true, media.error);
  assert.strictEqual(media.solicitud.prioridadJustificacion, null);
  assert.strictEqual(media.solicitud.prioridadFechaObjetivo, null);
});
