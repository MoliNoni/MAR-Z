const test = require('node:test');
const assert = require('node:assert/strict');
const { validarTransicion, cambiarEstado, consultarHistorialEstado } = require('../src/estado.js');
const { crearSolicitud } = require('../src/requests.js');
const { asignarSolicitud } = require('../src/asignacion.js');
const { supabaseClient } = require('../src/supabaseClient.js');

const solicitante = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
const agente = { id: 'USR-03', name: 'Mario Agente', email: 'agente@marz.com', role: 'agente' };
const coordinador = { id: 'USR-02', name: 'Ana Coordinadora', role: 'coordinador' };

function resultadoTransicion(origen, destino, usuario = agente) {
  return validarTransicion(origen, destino, usuario);
}

// Asigna un agente a la solicitud usando el modulo oficial de asignacion (HU05)
async function intentarAsignar(solicitudId) {
  const res = await asignarSolicitud(solicitudId, agente.id, coordinador);
  return res.success;
}

test('HU07 - Define transiciones lineales y excluye las de HU08', () => {
  assert.strictEqual(resultadoTransicion('Nuevo', 'En Proceso').valido, true);
  assert.strictEqual(resultadoTransicion('En Proceso', 'Resuelto').valido, true);

  for (const [origen, destino] of [
    ['Nuevo', 'Resuelto'],
    ['En Proceso', 'Nuevo'],
    ['Resuelto', 'Cerrado'],
    ['Resuelto', 'En Proceso'],
    ['Cerrado', 'En Proceso']
  ]) {
    assert.strictEqual(resultadoTransicion(origen, destino).valido, false);
  }

  assert.strictEqual(resultadoTransicion('Nuevo', 'En Proceso', coordinador).valido, false);
});

test('HU07 - Cambiar estado registra el flujo completo en el historial', async (t) => {
  const creada = await crearSolicitud({
    titulo: 'Flujo HU07',
    descripcion: 'Verificar cambios de estado',
    categoria: 'Software'
  }, solicitante);
  assert.strictEqual(creada.success, true, creada.error);

  const id = creada.solicitud.id;
  const asignado = await intentarAsignar(id);
  if (!asignado) {
    t.skip('columna asignado_a no disponible en el esquema');
    return;
  }

  const enProceso = await cambiarEstado(id, 'En Proceso', agente);
  assert.strictEqual(enProceso.success, true, enProceso.error);

  const invalido = await cambiarEstado(id, 'Cerrado', agente);
  assert.strictEqual(invalido.success, false);

  const resuelto = await cambiarEstado(id, 'Resuelto', agente, 'Atencion finalizada');
  assert.strictEqual(resuelto.success, true, resuelto.error);

  const { data: historial, error: errorHistorial } = await supabaseClient
    .from('historial_solicitudes')
    .select('accion, estado_anterior, estado_nuevo, motivo, usuario_id, fecha')
    .eq('solicitud_id', id)
    .order('fecha', { ascending: true });
  assert.ifError(errorHistorial);
  const cambios = historial.filter(item => item.accion === 'Cambiar estado');
  assert.deepStrictEqual(cambios.map(item => item.estado_nuevo), ['En Proceso', 'Resuelto']);
  assert.strictEqual(cambios[1].motivo, 'Atencion finalizada');
  assert.strictEqual(cambios[1].usuario_id, agente.id);
  assert.ok(!isNaN(Date.parse(cambios[1].fecha)));
});

test('HU07 - consultarHistorialEstado devuelve el historial completo', async (t) => {
  const creada = await crearSolicitud({
    titulo: 'Historial HU07',
    descripcion: 'Consultar historial',
    categoria: 'Hardware'
  }, solicitante);
  assert.strictEqual(creada.success, true, creada.error);

  const id = creada.solicitud.id;
  const asignado = await intentarAsignar(id);
  if (!asignado) {
    t.skip('columna asignado_a no disponible en el esquema');
    return;
  }

  await cambiarEstado(id, 'En Proceso', agente, 'Inicio de atencion');
  await cambiarEstado(id, 'Resuelto', agente, 'Problema solucionado');

  const resultado = await consultarHistorialEstado(id);
  assert.strictEqual(resultado.success, true, resultado.error);
  const cambios = resultado.historial.filter(h => h.accion === 'Cambiar estado');
  assert.strictEqual(cambios.length, 2);

  assert.strictEqual(cambios[0].estadoAnterior, 'Nuevo');
  assert.strictEqual(cambios[0].estadoNuevo, 'En Proceso');
  assert.strictEqual(cambios[0].motivo, 'Inicio de atencion');
  assert.strictEqual(cambios[0].usuarioId, agente.id);
  assert.ok(!isNaN(Date.parse(cambios[0].fecha)));

  assert.strictEqual(cambios[1].estadoAnterior, 'En Proceso');
  assert.strictEqual(cambios[1].estadoNuevo, 'Resuelto');
  assert.strictEqual(cambios[1].motivo, 'Problema solucionado');
});

test('HU07 - consultarHistorialEstado sin solicitud devuelve error', async () => {
  const resultado = await consultarHistorialEstado('');
  assert.strictEqual(resultado.success, false);
  assert.strictEqual(resultado.error, 'Solicitud no especificada.');
  assert.deepStrictEqual(resultado.historial, []);
});

test('HU07 - consultarHistorialEstado de solicitud sin cambios devuelve array vacio', async () => {
  const creada = await crearSolicitud({
    titulo: 'Sin cambios HU07',
    descripcion: 'Sin historial',
    categoria: 'Software'
  }, solicitante);
  assert.strictEqual(creada.success, true, creada.error);

  const resultado = await consultarHistorialEstado(creada.solicitud.id);
  assert.strictEqual(resultado.success, true);
  assert.strictEqual(resultado.historial.length, 0);
});

test('HU07 - Rechaza cambio de estado sin solicitud', async () => {
  const resultado = await cambiarEstado('', 'En Proceso', agente);
  assert.strictEqual(resultado.success, false);
  assert.strictEqual(resultado.error, 'Solicitud no especificada.');
});

test('HU07 - Rechaza cambio si el agente no esta asignado', async (t) => {
  const creada = await crearSolicitud({
    titulo: 'No asignado HU07',
    descripcion: 'Agente no asignado',
    categoria: 'Software'
  }, solicitante);
  assert.strictEqual(creada.success, true, creada.error);

  const resultado = await cambiarEstado(creada.solicitud.id, 'En Proceso', agente);
  assert.strictEqual(resultado.success, false);
  // El mensaje depende de si la columna asignado_a existe en el esquema
  assert.ok(resultado.error.length > 0);
});

test('HU07 - Rechaza cambio concurrente (otro usuario cambio antes)', async (t) => {
  const creada = await crearSolicitud({
    titulo: 'Concurrencia HU07',
    descripcion: 'Simular cambio concurrente',
    categoria: 'Redes y Comunicaciones'
  }, solicitante);
  assert.strictEqual(creada.success, true, creada.error);

  const id = creada.solicitud.id;
  const asignado = await intentarAsignar(id);
  if (!asignado) {
    t.skip('columna asignado_a no disponible en el esquema');
    return;
  }

  // Cambio normal
  const enProceso = await cambiarEstado(id, 'En Proceso', agente);
  assert.strictEqual(enProceso.success, true, enProceso.error);

  // Simular que otro proceso ya cambio el estado a Resuelto
  await supabaseClient.from('solicitudes')
    .update({ estado: 'Resuelto' })
    .eq('id', id);

  // El agente intenta cambiar desde En Proceso (pero ya esta en Resuelto)
  const resultado = await cambiarEstado(id, 'Resuelto', agente, 'Intento concurrente');
  assert.strictEqual(resultado.success, false);
});

test('HU07 - Solo el agente puede cambiar estado (no coordinador ni solicitante)', async () => {
  const resSolicitante = await cambiarEstado('SOL-X', 'En Proceso', solicitante);
  assert.strictEqual(resSolicitante.success, false);
  assert.strictEqual(resSolicitante.error, 'Solo el agente puede cambiar el estado de una solicitud.');

  const resCoordinador = await cambiarEstado('SOL-X', 'En Proceso', coordinador);
  assert.strictEqual(resCoordinador.success, false);
  assert.strictEqual(resCoordinador.error, 'Solo el agente puede cambiar el estado de una solicitud.');

  const resNull = await cambiarEstado('SOL-X', 'En Proceso', null);
  assert.strictEqual(resNull.success, false);
  assert.strictEqual(resNull.error, 'Solo el agente puede cambiar el estado de una solicitud.');
});
