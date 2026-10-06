const test = require('node:test');
const assert = require('node:assert/strict');
const { crearSolicitud } = require('../src/requests.js');
const {
  validarComentario,
  validarPermisoComentario,
  crearComentario,
  consultarComentarios,
  editarComentario,
  eliminarComentario
} = require('../src/comentarios.js');

const solicitante = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
const coordinador = { id: 'USR-02', name: 'Ana Coordinadora', email: 'coordinador@marz.com', role: 'coordinador' };
const agente = { id: 'USR-03', name: 'Mario Agente', email: 'agente@marz.com', role: 'agente' };
const auditor = { id: 'USR-04', name: 'Elena Auditora', email: 'auditor@marz.com', role: 'auditor' };

test('HU06 — Validacion de comentarios no vacios', () => {
  assert.strictEqual(validarComentario('').valido, false);
  assert.strictEqual(validarComentario('   ').valido, false);
  assert.strictEqual(validarComentario(null).valido, false);
  assert.strictEqual(validarComentario(undefined).valido, false);
  assert.strictEqual(validarComentario(123).valido, false);

  const valido = validarComentario('  Se realizo el reinicio del modem  ');
  assert.strictEqual(valido.valido, true);
  assert.strictEqual(valido.contenido, 'Se realizo el reinicio del modem');
});

test('HU06 — Permisos para registrar comentarios de trabajo', () => {
  assert.strictEqual(validarPermisoComentario(agente).valido, true);
  assert.strictEqual(validarPermisoComentario(coordinador).valido, true);

  const solRes = validarPermisoComentario(solicitante);
  assert.strictEqual(solRes.valido, false);
  assert.strictEqual(solRes.error, 'Solo los agentes y coordinadores pueden registrar comentarios de trabajo.');

  const audRes = validarPermisoComentario(auditor);
  assert.strictEqual(audRes.valido, false);
  assert.strictEqual(audRes.error, 'Solo los agentes y coordinadores pueden registrar comentarios de trabajo.');

  assert.strictEqual(validarPermisoComentario(null).valido, false);
  assert.strictEqual(validarPermisoComentario({}).valido, false);
});

test('HU06 — Impedir edicion y eliminacion (inmutabilidad)', () => {
  const resEdicion = editarComentario();
  assert.strictEqual(resEdicion.success, false);
  assert.ok(resEdicion.error.includes('inmutables') || resEdicion.error.includes('no se pueden editar'));

  const resEliminacion = eliminarComentario();
  assert.strictEqual(resEliminacion.success, false);
  assert.ok(resEliminacion.error.includes('inmutables') || resEliminacion.error.includes('no se pueden eliminar'));
});

test('HU06 — Crear comentario registrando autor, fecha y persistencia', async () => {
  const sol = (await crearSolicitud({ titulo: 'Error en base de datos', descripcion: 'Timeouts frecuentes', categoria: 'Software' }, solicitante)).solicitud;

  // Comentario invalido por texto vacio
  const resVacio = await crearComentario(sol.id, '    ', agente);
  assert.strictEqual(resVacio.success, false);
  assert.strictEqual(resVacio.error, 'El comentario no puede estar vacio.');

  // Creacion valida por agente
  const res = await crearComentario(sol.id, 'Iniciando diagnostico en los logs del servidor.', agente);
  assert.strictEqual(res.success, true, res.error);
  assert.strictEqual(res.comentario.solicitudId, sol.id);
  assert.strictEqual(res.comentario.autorId, 'USR-03');
  assert.strictEqual(res.comentario.autorNombre, 'Mario Agente');
  assert.strictEqual(res.comentario.autorRol, 'agente');
  assert.strictEqual(res.comentario.contenido, 'Iniciando diagnostico en los logs del servidor.');
  assert.ok(!isNaN(Date.parse(res.comentario.fecha)));

  // Segundo comentario por coordinador
  const res2 = await crearComentario(sol.id, 'Prioridad confirmada para revision urgente.', coordinador);
  assert.strictEqual(res2.success, true);

  // Consultar comentarios de la solicitud
  const lista = await consultarComentarios(sol.id, agente);
  assert.strictEqual(lista.success, true);
  assert.strictEqual(lista.comentarios.length, 2);
  assert.strictEqual(lista.comentarios[0].contenido, 'Iniciando diagnostico en los logs del servidor.');
  assert.strictEqual(lista.comentarios[1].contenido, 'Prioridad confirmada para revision urgente.');

  // Solicitud inexistente
  const noExiste = await crearComentario('SOL-INEXISTENTE-999', 'Nota', agente);
  assert.strictEqual(noExiste.success, false);
  assert.strictEqual(noExiste.error, 'Solicitud no encontrada.');
});
