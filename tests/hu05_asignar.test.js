const test = require('node:test');
const assert = require('node:assert/strict');
const { crearSolicitud } = require('../src/requests.js');
const {
  esCoordinador,
  validarAgenteActivo,
  validarAsignacion,
  consultarAgentesActivos,
  setAgenteActivo,
  asignarSolicitud,
  consultarNotificaciones,
  marcarNotificacionLeida,
  consultarSolicitudesAsignadas
} = require('../src/asignacion.js');

const solicitante = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
const coordinador = { id: 'USR-02', name: 'Ana Coordinadora', email: 'coordinador@marz.com', role: 'coordinador' };
const agente = { id: 'USR-03', name: 'Mario Agente', email: 'agente@marz.com', role: 'agente' };
const auditor = { id: 'USR-04', name: 'Elena Auditora', email: 'auditor@marz.com', role: 'auditor' };

test('HU05 — Validar que solo el coordinador puede asignar', async () => {
  assert.strictEqual(esCoordinador(coordinador), true);
  assert.strictEqual(esCoordinador(solicitante), false);
  assert.strictEqual(esCoordinador(agente), false);
  assert.strictEqual(esCoordinador(auditor), false);
  assert.strictEqual(esCoordinador(null), false);

  for (const usuario of [solicitante, agente, auditor, null]) {
    const res = await asignarSolicitud('SOL-TEST-01', 'USR-03', usuario);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'Solo el coordinador puede asignar solicitudes.');
  }
});

test('HU05 — Validar que el agente este activo', async () => {
  // Mario Agente por defecto esta activo
  const activoCheck = validarAgenteActivo(agente);
  assert.strictEqual(activoCheck.valido, true);

  // Intentar validar un solicitante como agente
  const noEsAgente = validarAgenteActivo(solicitante);
  assert.strictEqual(noEsAgente.valido, false);
  assert.strictEqual(noEsAgente.error, 'Solo se puede asignar a un usuario con rol de agente.');

  // Configurar agente inactivo
  setAgenteActivo('USR-INACTIVO', false);
  const agenteInactivo = { id: 'USR-INACTIVO', name: 'Inactivo', email: 'inactivo@marz.com', role: 'agente', activo: false };
  const inactivoCheck = validarAgenteActivo(agenteInactivo);
  assert.strictEqual(inactivoCheck.valido, false);
  assert.strictEqual(inactivoCheck.error, 'El agente seleccionado no esta activo.');

  // Revertir estado activo
  setAgenteActivo('USR-INACTIVO', true);
});

test('HU05 — Consultar lista de agentes activos', async () => {
  const res = await consultarAgentesActivos();
  assert.strictEqual(res.success, true);
  assert.ok(Array.isArray(res.agentes));
  assert.ok(res.agentes.length > 0);

  const mario = res.agentes.find(a => a.id === 'USR-03');
  assert.ok(mario, 'Mario Agente debe estar en la lista de agentes');
  assert.strictEqual(mario.activo, true);
});

test('HU05 — Validar asignaciones invalidas (solicitud inexistente, cerrada o usuario no agente)', async () => {
  // Solicitud inexistente
  const noExiste = await asignarSolicitud('SOL-INEXISTENTE-999', 'USR-03', coordinador);
  assert.strictEqual(noExiste.success, false);
  assert.strictEqual(noExiste.error, 'Solicitud no encontrada.');

  // Intentar asignar a un usuario que no es agente (ej. solicitante)
  const sol = (await crearSolicitud({ titulo: 'Problema de red', descripcion: 'No hay internet', categoria: 'Redes y Comunicaciones' }, solicitante)).solicitud;

  const asignarASolicitante = await asignarSolicitud(sol.id, 'USR-01', coordinador);
  assert.strictEqual(asignarASolicitante.success, false);
  assert.strictEqual(asignarASolicitante.error, 'Solo se puede asignar a un usuario con rol de agente.');

  // Solicitud cerrada no puede asignarse
  const validacionCerrada = validarAsignacion({ id: sol.id, estado: 'Cerrado' }, agente, coordinador);
  assert.strictEqual(validacionCerrada.valido, false);
  assert.strictEqual(validacionCerrada.error, 'No se puede asignar una solicitud cerrada.');
});

test('HU05 — Asignar solicitud exitosamente registrando quien, cuando y notificacion', async () => {
  const sol = (await crearSolicitud({ titulo: 'Actualizacion de software', descripcion: 'Requiero VS Code', categoria: 'Software' }, solicitante)).solicitud;

  const res = await asignarSolicitud(sol.id, 'USR-03', coordinador);
  assert.strictEqual(res.success, true, res.error);
  assert.strictEqual(res.solicitud.id, sol.id);
  assert.strictEqual(res.solicitud.asignadoA, 'USR-03');
  assert.strictEqual(res.solicitud.asignadoNombre, 'Mario Agente');
  assert.strictEqual(res.solicitud.asignadoPor, coordinador.id);
  assert.ok(!isNaN(Date.parse(res.solicitud.asignadoEn)));

  // Verificar notificacion generada
  assert.ok(res.notificacion);
  assert.strictEqual(res.notificacion.destinatario_id, 'USR-03');
  assert.strictEqual(res.notificacion.remitente_id, coordinador.id);
  assert.ok(res.notificacion.mensaje.includes(sol.id));
  assert.ok(!isNaN(Date.parse(res.notificacion.fecha)));

  // El agente consulta sus notificaciones
  const notifs = await consultarNotificaciones('USR-03');
  assert.strictEqual(notifs.success, true);
  assert.ok(notifs.notificaciones.some(n => n.solicitudId === sol.id));

  // Marcar notificacion como leida
  const notifId = notifs.notificaciones[0].id;
  const leidaRes = await marcarNotificacionLeida(notifId);
  assert.strictEqual(leidaRes.success, true);
});

test('HU05 — Mostrar bandeja de solicitudes asignadas al agente', async () => {
  const sol = (await crearSolicitud({ titulo: 'Fallo de impresora', descripcion: 'Atasco de papel', categoria: 'Hardware' }, solicitante)).solicitud;
  await asignarSolicitud(sol.id, 'USR-03', coordinador);

  // Consulta por el agente
  const resAgente = await consultarSolicitudesAsignadas(agente);
  assert.strictEqual(resAgente.success, true);
  assert.ok(resAgente.solicitudes.some(s => s.id === sol.id && s.asignadoA === 'USR-03'));

  // Otros roles no pueden consultar bandeja de agente
  const resSolicitante = await consultarSolicitudesAsignadas(solicitante);
  assert.strictEqual(resSolicitante.success, false);
  assert.strictEqual(resSolicitante.error, 'Solo los agentes pueden consultar su bandeja de asignaciones.');
});
