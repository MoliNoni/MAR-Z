/**
 * Modulo de Busqueda y Filtro de Solicitudes - MAR-Z
 * HU09 — Buscar y filtrar solicitudes
 * Responsable: Dev 1
 * Soporta busqueda por texto (titulo/descripcion), filtros combinados
 * y restriccion de visibilidad segun permisos del usuario.
 */

let busquedaDbClient = null;
if (typeof window !== 'undefined' && window.supabaseClient) {
  busquedaDbClient = window.supabaseClient;
} else if (typeof require !== 'undefined') {
  const clientModule = require('./supabaseClient.js');
  busquedaDbClient = clientModule.supabaseClient;
}

function getBusquedaClient() {
  if (typeof window !== 'undefined' && window.supabaseClient) {
    return window.supabaseClient;
  }
  return busquedaDbClient;
}

/**
 * HU09: Filtra un arreglo de solicitudes en memoria segun los criterios provistos.
 * Permite busqueda en titulo o descripcion, y filtrado por estado, prioridad y categoria.
 */
function filtrarSolicitudes(solicitudes, filtros = {}) {
  if (!Array.isArray(solicitudes)) {
    return [];
  }

  const { texto, query, estado, prioridad, categoria } = filtros;
  const textoABuscar = (texto || query || '').toString().trim().toLowerCase();

  return solicitudes.filter(s => {
    // 1. Busqueda por titulo y descripcion
    if (textoABuscar.length > 0) {
      const titulo = (s.titulo || '').toLowerCase();
      const descripcion = (s.descripcion || '').toLowerCase();
      const coincideTexto = titulo.includes(textoABuscar) || descripcion.includes(textoABuscar);
      if (!coincideTexto) return false;
    }

    // 2. Filtro por estado
    if (estado && estado.toString().trim() !== '') {
      const estadoFiltro = estado.toString().trim().toLowerCase();
      const estadoSolicitud = (s.estado || '').toString().trim().toLowerCase();
      if (estadoSolicitud !== estadoFiltro) return false;
    }

    // 3. Filtro por prioridad
    if (prioridad && prioridad.toString().trim() !== '') {
      const prioridadFiltro = prioridad.toString().trim().toLowerCase();
      const prioridadSolicitud = (s.prioridad || '').toString().trim().toLowerCase();
      if (prioridadFiltro === 'sin prioridad' || prioridadFiltro === 'sin_prioridad') {
        if (s.prioridad) return false;
      } else {
        if (prioridadSolicitud !== prioridadFiltro) return false;
      }
    }

    // 4. Filtro por categoria
    if (categoria && categoria.toString().trim() !== '') {
      const categoriaFiltro = categoria.toString().trim().toLowerCase();
      const categoriaSolicitud = (s.categoria || '').toString().trim().toLowerCase();
      if (categoriaSolicitud !== categoriaFiltro) return false;
    }

    return true;
  });
}

/**
 * HU09: Obtiene las solicitudes a las que el usuario tiene acceso segun su rol,
 * y aplica la busqueda y combinacion de filtros requerida.
 */
async function buscarYFiltrarSolicitudes(filtros = {}, usuario) {
  if (!usuario || !usuario.id) {
    return {
      success: false,
      error: 'Usuario no autenticado.',
      solicitudes: []
    };
  }

  const client = getBusquedaClient();
  if (!client) {
    return {
      success: false,
      error: 'Error de conexion con la base de datos.',
      solicitudes: []
    };
  }

  try {
    let query = client.from('solicitudes').select('*');

    // Respetar los permisos del usuario segun su rol
    const rol = usuario.role || usuario.rol;

    if (rol === 'solicitante') {
      // Solicitante solo puede consultar y filtrar sus propias solicitudes
      query = query.eq('propietario_id', usuario.id);
    } else if (rol === 'agente') {
      // Agente consulta solicitudes asignadas a el
      query = query.eq('asignado_a', usuario.id);
    } else if (rol === 'coordinador' || rol === 'auditor') {
      // Coordinador y Auditor tienen acceso a todas las solicitudes
    } else {
      return {
        success: false,
        error: 'Rol de usuario no autorizado para realizar busquedas.',
        solicitudes: []
      };
    }

    const { data, error } = await query.order('fecha', { ascending: false });

    if (error || !Array.isArray(data)) {
      return {
        success: false,
        error: error ? error.message : 'Error al consultar solicitudes.',
        solicitudes: []
      };
    }

    // Mapear campos normalizados
    const mapeadas = data.map(s => ({
      id: s.id,
      titulo: s.titulo,
      descripcion: s.descripcion,
      categoria: s.categoria,
      estado: s.estado,
      prioridad: s.prioridad || null,
      prioridadJustificacion: s.prioridad_justificacion || null,
      prioridadFechaObjetivo: s.prioridad_fecha_objetivo || null,
      fecha: s.fecha,
      ultimaActualizacion: s.ultima_actualizacion,
      asignadoA: s.asignado_a || null,
      asignadoNombre: s.asignado_nombre || null,
      propietarioId: s.propietario_id,
      propietarioNombre: s.propietario_nombre,
      propietarioEmail: s.propietario_email
    }));

    // Aplicar filtros en memoria
    const filtradas = filtrarSolicitudes(mapeadas, filtros);

    return {
      success: true,
      totalOriginal: mapeadas.length,
      totalFiltradas: filtradas.length,
      solicitudes: filtradas
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      solicitudes: []
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    filtrarSolicitudes,
    buscarYFiltrarSolicitudes
  };
}
