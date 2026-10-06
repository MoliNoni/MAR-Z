const test = require('node:test');
const assert = require('node:assert/strict');
const { supabaseClient } = require('../src/supabaseClient.js');
const { crearSolicitud } = require('../src/requests.js');
const {
  ACCIONES_SOLUCION,
  validarAccionSolucion,
  confirmarSolucion,
  reabrirSolicitud
} = require('../src/solucion.js');

const solicitante = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
const otroSolicitante = { id: 'USR-04', name: 'Elena Auditora', email: 'auditor@marz.com', role: 'solicitante' };
const coordinador = { id: 'USR-02', name: 'Ana Coordinadora', email: 'coordinador@marz.com', role: 'coordinador' };
const agente = { id: 'USR-03', name: 'Mario Agente', email: 'agente@marz.com', role: 'agente' };

// Crea una solicitud y la deja en estado Resuelto (el cambio de estado es de HU07)
async function crearSolicitudResuelta(titulo) {
  const res = await crearSolicitud({ titulo, descripcion: 'Prueba HU08', categoria: 'Software' }, solicitante);
  assert.strictEqual(res.success, true, res.error);
  const { error } = await supabaseClient.from('solicitudes').update({ estado: 'Resuelto' }).eq('id', res.solicitud.id);
  assert.ifError(error);
  return res.solicitud.id;
}

async function consultarHistorial(solicitudId) {
  const { data, error } = await supabaseClient
    .from('historial_solicitudes')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .order('fecha', { ascending: true });
  assert.ifError(error);
  return data;
}

test('HU08 — Validar permisos y estado del solicitante', () => {
  const resuelta = { id: 'SOL-1', estado: 'Resuelto', propietario_id: solicitante.id };

  assert.strictEqual(validarAccionSolucion(resuelta, solicitante).valido, true);

  for (const usuario of [coordinador, agente, null]) {
    const res = validarAccionSolucion(resuelta, usuario);
    assert.strictEqual(res.valido, false);
    assert.strictEqual(res.error, 'Solo el solicitante puede confirmar o reabrir la solucion.');
  }

  assert.strictEqual(validarAccionSolucion(resuelta, otroSolicitante).error, 'Acceso no autorizado a esta solicitud.');
  assert.strictEqual(validarAccionSolucion(null, solicitante).error, 'Solicitud no encontrada.');

  const enProceso = { ...resuelta, estado: 'En Proceso' };
  assert.strictEqual(validarAccionSolucion(enProceso, solicitante).error, 'Solo se puede confirmar o reabrir una solicitud Resuelta.');
});

test('HU08 — Reabrir exige motivo', async () => {
  for (const motivo of ['', '   ', null]) {
    const res = await reabrirSolicitud('SOL-X', motivo, solicitante);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'El motivo de reapertura es obligatorio.');
  }
});

test('HU08 — Otros roles no pueden confirmar ni reabrir', async () => {
  for (const usuario of [coordinador, agente, null]) {
    assert.strictEqual((await confirmarSolucion('SOL-X', usuario)).success, false);
    assert.strictEqual((await reabrirSolicitud('SOL-X', 'No funciona', usuario)).success, false);
  }
});

test('HU08 — Confirmar solucion cierra la solicitud y queda en el historial', async () => {
  const id = await crearSolicitudResuelta('Confirmar HU08');

  const ajena = await confirmarSolucion(id, otroSolicitante);
  assert.strictEqual(ajena.success, false);
  assert.strictEqual(ajena.error, 'Acceso no autorizado a esta solicitud.');

  const res = await confirmarSolucion(id, solicitante);
  assert.strictEqual(res.success, true, res.error);
  assert.strictEqual(res.solicitud.estado, 'Cerrado');

  // Una solicitud cerrada no se puede volver a confirmar ni reabrir
  const repetida = await confirmarSolucion(id, solicitante);
  assert.strictEqual(repetida.success, false);
  assert.strictEqual((await reabrirSolicitud(id, 'Sigue fallando', solicitante)).success, false);

  const historial = await consultarHistorial(id);
  assert.strictEqual(historial.length, 1);
  assert.strictEqual(historial[0].accion, ACCIONES_SOLUCION.CONFIRMAR);
  assert.strictEqual(historial[0].estado_anterior, 'Resuelto');
  assert.strictEqual(historial[0].estado_nuevo, 'Cerrado');
  assert.strictEqual(historial[0].usuario_id, solicitante.id);
});

test('HU08 — Reabrir solicitud la devuelve a En Proceso y guarda el motivo', async () => {
  const id = await crearSolicitudResuelta('Reabrir HU08');

  const res = await reabrirSolicitud(id, '  El equipo sigue sin encender  ', solicitante);
  assert.strictEqual(res.success, true, res.error);
  assert.strictEqual(res.solicitud.estado, 'En Proceso');

  const historial = await consultarHistorial(id);
  assert.strictEqual(historial.length, 1);
  assert.strictEqual(historial[0].accion, ACCIONES_SOLUCION.REABRIR);
  assert.strictEqual(historial[0].motivo, 'El equipo sigue sin encender');
  assert.strictEqual(historial[0].estado_nuevo, 'En Proceso');
  assert.ok(!isNaN(Date.parse(historial[0].fecha)));

  const noExiste = await confirmarSolucion('SOL-INEXISTENTE-999', solicitante);
  assert.strictEqual(noExiste.success, false);
  assert.strictEqual(noExiste.error, 'Solicitud no encontrada.');
});
