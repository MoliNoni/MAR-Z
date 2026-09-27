const test = require('node:test');
const assert = require('node:assert/strict');
const {
  crearSolicitud,
  consultarMisSolicitudes,
  obtenerDetalleSolicitud,
  limpiarSolicitudes
} = require('../src/requests.js');

test('HU03 — Consultar mis solicitudes y aislamiento por usuario', () => {
  limpiarSolicitudes();

  const usuario1 = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
  const usuario2 = { id: 'USR-05', name: 'Laura Solicitante', email: 'laura@marz.com', role: 'solicitante' };

  // Crear 2 solicitudes para usuario 1 y 1 solicitud para usuario 2
  const sol1 = crearSolicitud({ titulo: 'Problema 1', descripcion: 'Desc 1', categoria: 'Software' }, usuario1).solicitud;
  const sol2 = crearSolicitud({ titulo: 'Problema 2', descripcion: 'Desc 2', categoria: 'Hardware' }, usuario1).solicitud;
  const sol3 = crearSolicitud({ titulo: 'Problema 3', descripcion: 'Desc 3', categoria: 'Redes y Comunicaciones' }, usuario2).solicitud;

  // Consulta usuario 1: solo debe ver sus 2 solicitudes
  const consultaUser1 = consultarMisSolicitudes(usuario1);
  assert.strictEqual(consultaUser1.success, true);
  assert.strictEqual(consultaUser1.solicitudes.length, 2);
  assert.ok(consultaUser1.solicitudes.some(s => s.id === sol1.id));
  assert.ok(consultaUser1.solicitudes.some(s => s.id === sol2.id));
  assert.ok(!consultaUser1.solicitudes.some(s => s.id === sol3.id));

  // Consulta usuario 2: solo debe ver su 1 solicitud
  const consultaUser2 = consultarMisSolicitudes(usuario2);
  assert.strictEqual(consultaUser2.success, true);
  assert.strictEqual(consultaUser2.solicitudes.length, 1);
  assert.strictEqual(consultaUser2.solicitudes[0].id, sol3.id);
});

test('HU03 — Mostrar estado y ultima actualizacion', () => {
  limpiarSolicitudes();

  const usuario = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
  const res = crearSolicitud({ titulo: 'Fallo monitor', descripcion: 'La pantalla parpadea', categoria: 'Hardware' }, usuario);

  assert.strictEqual(res.success, true);
  const sol = res.solicitud;

  // Verificar estado
  assert.strictEqual(sol.estado, 'Nuevo');

  // Verificar ultima actualizacion
  assert.ok(sol.ultimaActualizacion);
  assert.ok(!isNaN(Date.parse(sol.ultimaActualizacion)));
  assert.strictEqual(sol.ultimaActualizacion, sol.fecha);
});

test('HU03 — Consultar detalle de solicitud y restricciones de acceso', () => {
  limpiarSolicitudes();

  const usuario1 = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
  const usuario2 = { id: 'USR-05', name: 'Laura Solicitante', email: 'laura@marz.com', role: 'solicitante' };

  const solUser1 = crearSolicitud({ titulo: 'Acceso ERP', descripcion: 'No puedo entrar al ERP', categoria: 'Accesos y Cuentas' }, usuario1).solicitud;

  // Usuario 1 puede consultar el detalle de su solicitud
  const detalleValido = obtenerDetalleSolicitud(solUser1.id, usuario1);
  assert.strictEqual(detalleValido.success, true);
  assert.strictEqual(detalleValido.solicitud.id, solUser1.id);
  assert.strictEqual(detalleValido.solicitud.titulo, 'Acceso ERP');
  assert.strictEqual(detalleValido.solicitud.descripcion, 'No puedo entrar al ERP');

  // Usuario 2 NO puede consultar el detalle de la solicitud de Usuario 1
  const detalleInvalido = obtenerDetalleSolicitud(solUser1.id, usuario2);
  assert.strictEqual(detalleInvalido.success, false);
  assert.strictEqual(detalleInvalido.error, 'Acceso no autorizado a esta solicitud.');

  // Solicitud inexistente
  const noExiste = obtenerDetalleSolicitud('SOL-9999', usuario1);
  assert.strictEqual(noExiste.success, false);
  assert.strictEqual(noExiste.error, 'Solicitud no encontrada.');
});
