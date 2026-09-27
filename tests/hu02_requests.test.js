const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CATEGORIAS_VALIDAS,
  ESTADOS,
  validarDatosSolicitud,
  crearSolicitud,
  obtenerSolicitudes,
  limpiarSolicitudes
} = require('../src/requests.js');

test('HU02 — Definicion de Categorias y Estados Iniciales', () => {
  assert.ok(CATEGORIAS_VALIDAS.length > 0);
  assert.strictEqual(ESTADOS.NUEVO, 'Nuevo');
});

test('HU02 — Validacion de campos obligatorios (titulo, descripcion, categoria)', () => {
  // Sin datos
  assert.strictEqual(validarDatosSolicitud(null).valido, false);

  // Titulo vacio
  const sinTitulo = validarDatosSolicitud({
    titulo: '',
    descripcion: 'Mi teclado no funciona',
    categoria: 'Hardware'
  });
  assert.strictEqual(sinTitulo.valido, false);
  assert.strictEqual(sinTitulo.error, 'El titulo es obligatorio.');

  // Descripcion vacia
  const sinDesc = validarDatosSolicitud({
    titulo: 'Problema de teclado',
    descripcion: '   ',
    categoria: 'Hardware'
  });
  assert.strictEqual(sinDesc.valido, false);
  assert.strictEqual(sinDesc.error, 'La descripcion es obligatoria.');

  // Categoria vacia o invalida
  const sinCat = validarDatosSolicitud({
    titulo: 'Problema de teclado',
    descripcion: 'Mi teclado no funciona',
    categoria: ''
  });
  assert.strictEqual(sinCat.valido, false);
  assert.strictEqual(sinCat.error, 'La categoria es obligatoria.');

  const catInvalida = validarDatosSolicitud({
    titulo: 'Problema de teclado',
    descripcion: 'Mi teclado no funciona',
    categoria: 'CategoriaInexistente'
  });
  assert.strictEqual(catInvalida.valido, false);
  assert.strictEqual(catInvalida.error, 'La categoria seleccionada no es valida.');

  // Datos validos
  const datosValidos = validarDatosSolicitud({
    titulo: 'Fallo de conexion',
    descripcion: 'No puedo acceder al servidor VPN',
    categoria: 'Redes y Comunicaciones'
  });
  assert.strictEqual(datosValidos.valido, true);
});

test('HU02 — Generar ID, fecha, estado Nuevo y propietario', () => {
  limpiarSolicitudes();

  const mockPropietario = {
    id: 'USR-01',
    name: 'Carlos Solicitante',
    email: 'solicitante@marz.com',
    role: 'solicitante'
  };

  const solicitudData = {
    titulo: 'Actualizacion de software contable',
    descripcion: 'Se requiere actualizar la version del ERP a la ultima version estable.',
    categoria: 'Software'
  };

  const resultado = crearSolicitud(solicitudData, mockPropietario);

  assert.strictEqual(resultado.success, true);
  const sol = resultado.solicitud;

  // Validar generacion de ID
  assert.ok(sol.id);
  assert.strictEqual(sol.id.startsWith('SOL-'), true);

  // Validar fecha generada
  assert.ok(sol.fecha);
  assert.ok(!isNaN(Date.parse(sol.fecha)));

  // Validar estado inicial Nuevo
  assert.strictEqual(sol.estado, 'Nuevo');

  // Validar propietario
  assert.strictEqual(sol.propietario.id, 'USR-01');
  assert.strictEqual(sol.propietario.email, 'solicitante@marz.com');
  assert.strictEqual(sol.propietario.nombre, 'Carlos Solicitante');

  // Validar almacenamiento
  const guardadas = obtenerSolicitudes();
  assert.strictEqual(guardadas.length, 1);
  assert.strictEqual(guardadas[0].id, sol.id);
});

test('HU02 — Rechazar creacion sin propietario autenticado', () => {
  const solicitudData = {
    titulo: 'Problema',
    descripcion: 'Descripcion',
    categoria: 'Hardware'
  };

  const resultado = crearSolicitud(solicitudData, null);
  assert.strictEqual(resultado.success, false);
  assert.strictEqual(resultado.error, 'Se requiere un usuario autenticado como propietario.');
});
