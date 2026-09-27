/**
 * Modulo de Gestion de Solicitudes - MAR-Z
 * HU02 — Crear solicitudes
 * HU03 — Consultar mis solicitudes
 */

const CATEGORIAS_VALIDAS = [
  'Software',
  'Hardware',
  'Redes y Comunicaciones',
  'Accesos y Cuentas',
  'Soporte General'
];

const ESTADOS = {
  NUEVO: 'Nuevo',
  EN_PROCESO: 'En Proceso',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado'
};

// Almacenamiento en memoria para el servidor o pruebas
let solicitudesStore = [];
let contadorId = 1;

/**
 * Valida los datos requeridos para la creacion de una solicitud.
 */
function validarDatosSolicitud(datos) {
  if (!datos) {
    return { valido: false, error: 'No se recibieron datos de la solicitud.' };
  }

  const { titulo, descripcion, categoria } = datos;

  if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
    return { valido: false, error: 'El titulo es obligatorio.' };
  }

  if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
    return { valido: false, error: 'La descripcion es obligatoria.' };
  }

  if (!categoria || typeof categoria !== 'string' || categoria.trim() === '') {
    return { valido: false, error: 'La categoria es obligatoria.' };
  }

  if (!CATEGORIAS_VALIDAS.includes(categoria.trim())) {
    return { valido: false, error: 'La categoria seleccionada no es valida.' };
  }

  return { valido: true };
}

/**
 * HU02: Crea una nueva solicitud asignando ID, fecha, estado Nuevo, ultima actualizacion y propietario.
 */
function crearSolicitud(datos, propietario) {
  if (!propietario || !propietario.id || !propietario.email) {
    return {
      success: false,
      error: 'Se requiere un usuario autenticado como propietario.'
    };
  }

  const validacion = validarDatosSolicitud(datos);
  if (!validacion.valido) {
    return {
      success: false,
      error: validacion.error
    };
  }

  const idGenerado = `SOL-${String(contadorId++).padStart(4, '0')}`;
  const fechaGenerada = new Date().toISOString();

  const nuevaSolicitud = {
    id: idGenerado,
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    categoria: datos.categoria.trim(),
    estado: ESTADOS.NUEVO,
    fecha: fechaGenerada,
    ultimaActualizacion: fechaGenerada,
    propietario: {
      id: propietario.id,
      nombre: propietario.name,
      email: propietario.email,
      role: propietario.role
    }
  };

  solicitudesStore.push(nuevaSolicitud);

  return {
    success: true,
    solicitud: nuevaSolicitud
  };
}

/**
 * HU03: Consulta exclusivamente las solicitudes pertenecientes al usuario autenticado.
 */
function consultarMisSolicitudes(usuario, fuenteSolicitudes = null) {
  if (!usuario || !usuario.id) {
    return {
      success: false,
      error: 'Usuario no autenticado.',
      solicitudes: []
    };
  }

  const fuente = Array.isArray(fuenteSolicitudes) ? fuenteSolicitudes : solicitudesStore;
  const misSolicitudes = fuente.filter(s => s.propietario && s.propietario.id === usuario.id);

  return {
    success: true,
    solicitudes: misSolicitudes
  };
}

/**
 * HU03: Obtiene el detalle de una solicitud garantizando que el solicitante solo acceda a la suya.
 */
function obtenerDetalleSolicitud(solicitudId, usuario, fuenteSolicitudes = null) {
  if (!usuario || !usuario.id) {
    return {
      success: false,
      error: 'Usuario no autenticado.'
    };
  }

  const fuente = Array.isArray(fuenteSolicitudes) ? fuenteSolicitudes : solicitudesStore;
  const solicitud = fuente.find(s => s.id === solicitudId);

  if (!solicitud) {
    return {
      success: false,
      error: 'Solicitud no encontrada.'
    };
  }

  // Si es un solicitante, solo puede consultar el detalle de sus propias solicitudes
  if (usuario.role === 'solicitante' && solicitud.propietario.id !== usuario.id) {
    return {
      success: false,
      error: 'Acceso no autorizado a esta solicitud.'
    };
  }

  return {
    success: true,
    solicitud
  };
}

/**
 * Retorna las solicitudes almacenadas (o filtradas por propietario si se especifica).
 */
function obtenerSolicitudes(propietarioId = null) {
  if (propietarioId) {
    return solicitudesStore.filter(s => s.propietario && s.propietario.id === propietarioId);
  }
  return solicitudesStore;
}

/**
 * Reinicia el almacen (utilidad para tests).
 */
function limpiarSolicitudes() {
  solicitudesStore = [];
  contadorId = 1;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CATEGORIAS_VALIDAS,
    ESTADOS,
    validarDatosSolicitud,
    crearSolicitud,
    consultarMisSolicitudes,
    obtenerDetalleSolicitud,
    obtenerSolicitudes,
    limpiarSolicitudes
  };
}
