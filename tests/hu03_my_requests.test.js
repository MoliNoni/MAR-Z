const test = require('node:test');
const assert = require('node:assert/strict');
const {
  crearSolicitud,
  consultarMisSolicitudes,
  obtenerDetalleSolicitud
} = require('../src/requests.js');

test('HU03 — Consultar mis solicitudes y aislamiento por usuario en Supabase', async () => {
  const usuario1 = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
  const usuario2 = { id: 'USR-04', name: 'Elena Auditora', email: 'auditor@marz.com', role: 'solicitante' };

  const sol1 = (await crearSolicitud({ titulo: 'Problema Red Carlos', descripcion: 'Desc', categoria: 'Redes y Comunicaciones' }, usuario1)).solicitud;
  const sol2 = (await crearSolicitud({ titulo: 'Problema Hardware Elena', descripcion: 'Desc', categoria: 'Hardware' }, usuario2)).solicitud;

  // Consulta Carlos: debe ver sus solicitudes y nunca las de Elena
  const consultaUser1 = await consultarMisSolicitudes(usuario1);
  assert.strictEqual(consultaUser1.success, true);
  assert.ok(consultaUser1.solicitudes.some(s => s.id === sol1.id));
  assert.ok(!consultaUser1.solicitudes.some(s => s.id === sol2.id));

  // Consulta Elena: debe ver su solicitud y nunca la de Carlos
  const consultaUser2 = await consultarMisSolicitudes(usuario2);
  assert.strictEqual(consultaUser2.success, true);
  assert.ok(consultaUser2.solicitudes.some(s => s.id === sol2.id));
  assert.ok(!consultaUser2.solicitudes.some(s => s.id === sol1.id));
});

test('HU03 — Mostrar estado y ultima actualizacion en solicitudes de Supabase', async () => {
  const usuario = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
  const res = await crearSolicitud({ titulo: 'Fallo monitor', descripcion: 'La pantalla parpadea', categoria: 'Hardware' }, usuario);

  assert.strictEqual(res.success, true);
  const sol = res.solicitud;

  assert.strictEqual(sol.estado, 'Nuevo');
  assert.ok(sol.ultimaActualizacion);
  assert.ok(!isNaN(Date.parse(sol.ultimaActualizacion)));
});

test('HU03 — Consultar detalle de solicitud en Supabase y restricciones de acceso', async () => {
  const usuario1 = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
  const usuario2 = { id: 'USR-04', name: 'Elena Auditora', email: 'auditor@marz.com', role: 'solicitante' };

  const solUser1 = (await crearSolicitud({ titulo: 'Acceso ERP Especial', descripcion: 'Detalle ERP', categoria: 'Accesos y Cuentas' }, usuario1)).solicitud;

  // Usuario 1 puede consultar el detalle de su solicitud
  const detalleValido = await obtenerDetalleSolicitud(solUser1.id, usuario1);
  assert.strictEqual(detalleValido.success, true);
  assert.strictEqual(detalleValido.solicitud.id, solUser1.id);
  assert.strictEqual(detalleValido.solicitud.titulo, 'Acceso ERP Especial');

  // Usuario 2 (como solicitante) NO puede consultar el detalle de la solicitud de Usuario 1
  const detalleInvalido = await obtenerDetalleSolicitud(solUser1.id, usuario2);
  assert.strictEqual(detalleInvalido.success, false);
  assert.strictEqual(detalleInvalido.error, 'Acceso no autorizado a esta solicitud.');

  // Solicitud inexistente
  const noExiste = await obtenerDetalleSolicitud('SOL-INEXISTENTE-999', usuario1);
  assert.strictEqual(noExiste.success, false);
  assert.strictEqual(noExiste.error, 'Solicitud no encontrada.');
});
