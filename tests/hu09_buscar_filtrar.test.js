const test = require('node:test');
const assert = require('node:assert/strict');
const {
  filtrarSolicitudes,
  buscarYFiltrarSolicitudes
} = require('../src/busqueda.js');
const { crearSolicitud } = require('../src/requests.js');

const solicitante1 = { id: 'USR-01', name: 'Carlos Solicitante', email: 'solicitante@marz.com', role: 'solicitante' };
const solicitante2 = { id: 'USR-99', name: 'Otro Solicitante', email: 'otro@marz.com', role: 'solicitante' };
const coordinador = { id: 'USR-02', name: 'Ana Coordinadora', email: 'coordinador@marz.com', role: 'coordinador' };
const agente = { id: 'USR-03', name: 'Mario Agente', email: 'agente@marz.com', role: 'agente' };

const solicitudesMuestra = [
  {
    id: 'SOL-101',
    titulo: 'Fallo con impresora multifuncion',
    descripcion: 'No imprime desde la red del segundo piso',
    categoria: 'Hardware',
    estado: 'Nuevo',
    prioridad: 'Alta',
    propietario_id: 'USR-01'
  },
  {
    id: 'SOL-102',
    titulo: 'Problema en base de datos',
    descripcion: 'Timeout al generar reporte de ventas',
    categoria: 'Software',
    estado: 'En Proceso',
    prioridad: 'Media',
    propietario_id: 'USR-01'
  },
  {
    id: 'SOL-103',
    titulo: 'Solicitud de acceso a VPN',
    descripcion: 'Trabajo remoto programado para el viernes',
    categoria: 'Accesos y Cuentas',
    estado: 'Resuelto',
    prioridad: 'Baja',
    propietario_id: 'USR-01'
  },
  {
    id: 'SOL-104',
    titulo: 'Mantenimiento de switch principal',
    descripcion: 'Cortes intermitentes en la red general',
    categoria: 'Redes y Comunicaciones',
    estado: 'Nuevo',
    prioridad: null,
    propietario_id: 'USR-99'
  }
];

test('HU09 — Busqueda por titulo y por descripcion', () => {
  // Busqueda que coincide con titulo
  const porTitulo = filtrarSolicitudes(solicitudesMuestra, { texto: 'impresora' });
  assert.strictEqual(porTitulo.length, 1);
  assert.strictEqual(porTitulo[0].id, 'SOL-101');

  // Busqueda que coincide con descripcion
  const porDescripcion = filtrarSolicitudes(solicitudesMuestra, { texto: 'remoto' });
  assert.strictEqual(porDescripcion.length, 1);
  assert.strictEqual(porDescripcion[0].id, 'SOL-103');

  // Busqueda insensible a mayusculas/minusculas
  const mayusculas = filtrarSolicitudes(solicitudesMuestra, { texto: 'VPN' });
  assert.strictEqual(mayusculas.length, 1);
  assert.strictEqual(mayusculas[0].id, 'SOL-103');

  // Sin texto devuelve todas
  const sinTexto = filtrarSolicitudes(solicitudesMuestra, {});
  assert.strictEqual(sinTexto.length, 4);
});

test('HU09 — Filtro por estado', () => {
  const nuevos = filtrarSolicitudes(solicitudesMuestra, { estado: 'Nuevo' });
  assert.strictEqual(nuevos.length, 2);
  assert.ok(nuevos.every(s => s.estado === 'Nuevo'));

  const enProceso = filtrarSolicitudes(solicitudesMuestra, { estado: 'En Proceso' });
  assert.strictEqual(enProceso.length, 1);
  assert.strictEqual(enProceso[0].id, 'SOL-102');

  const cerrados = filtrarSolicitudes(solicitudesMuestra, { estado: 'Cerrado' });
  assert.strictEqual(cerrados.length, 0);
});

test('HU09 — Filtro por prioridad', () => {
  const alta = filtrarSolicitudes(solicitudesMuestra, { prioridad: 'Alta' });
  assert.strictEqual(alta.length, 1);
  assert.strictEqual(alta[0].id, 'SOL-101');

  const sinPrioridad = filtrarSolicitudes(solicitudesMuestra, { prioridad: 'Sin prioridad' });
  assert.strictEqual(sinPrioridad.length, 1);
  assert.strictEqual(sinPrioridad[0].id, 'SOL-104');
});

test('HU09 — Filtro por categoria', () => {
  const hardware = filtrarSolicitudes(solicitudesMuestra, { categoria: 'Hardware' });
  assert.strictEqual(hardware.length, 1);
  assert.strictEqual(hardware[0].id, 'SOL-101');

  const software = filtrarSolicitudes(solicitudesMuestra, { categoria: 'Software' });
  assert.strictEqual(software.length, 1);
  assert.strictEqual(software[0].id, 'SOL-102');
});

test('HU09 — Combinar multiples filtros (texto + estado + prioridad + categoria)', () => {
  // Coincide todo
  const combinado = filtrarSolicitudes(solicitudesMuestra, {
    texto: 'red',
    estado: 'Nuevo',
    categoria: 'Hardware',
    prioridad: 'Alta'
  });
  assert.strictEqual(combinado.length, 1);
  assert.strictEqual(combinado[0].id, 'SOL-101');

  // Ninguna coincide con combinacion excluyente
  const ninguno = filtrarSolicitudes(solicitudesMuestra, {
    texto: 'red',
    estado: 'Cerrado',
    categoria: 'Hardware'
  });
  assert.strictEqual(ninguno.length, 0);
});

test('HU09 — Respetar los permisos del usuario al consultar y filtrar', async () => {
  // 1. Usuario no autenticado rechazado
  const sinUsuario = await buscarYFiltrarSolicitudes({}, null);
  assert.strictEqual(sinUsuario.success, false);
  assert.strictEqual(sinUsuario.error, 'Usuario no autenticado.');

  // 2. Coordinador puede buscar y filtrar
  const resCoord = await buscarYFiltrarSolicitudes({}, coordinador);
  assert.strictEqual(resCoord.success, true);
  assert.ok(Array.isArray(resCoord.solicitudes));

  // 3. Solicitante solo obtiene solicitudes propias
  const resSol = await buscarYFiltrarSolicitudes({}, solicitante1);
  assert.strictEqual(resSol.success, true);
  if (resSol.solicitudes.length > 0) {
    assert.ok(resSol.solicitudes.every(s => s.propietarioId === solicitante1.id));
  }
});

test('HU09 — Integracion con Supabase en tiempo de ejecucion', async () => {
  // Crear una solicitud de prueba
  const creada = await crearSolicitud({
    titulo: 'Prueba HU09 Filtros Busqueda',
    descripcion: 'Texto identificable para busqueda automatizada',
    categoria: 'Soporte General'
  }, solicitante1);

  assert.strictEqual(creada.success, true);

  // Buscar por texto único
  const resBusqueda = await buscarYFiltrarSolicitudes({
    texto: 'identificable'
  }, coordinador);

  assert.strictEqual(resBusqueda.success, true);
  assert.ok(resBusqueda.solicitudes.some(s => s.id === creada.solicitud.id));
});
