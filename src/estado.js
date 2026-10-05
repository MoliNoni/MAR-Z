/**
 * Modulo de Cambio de Estado - MAR-Z
 * HU07 — Cambiar estado
 * Persistencia directa en base de datos Supabase
 */

let estadoDbClient = null;
if (typeof window !== 'undefined' && window.supabaseClient) {
  estadoDbClient = window.supabaseClient;
} else if (typeof require !== 'undefined') {
  const clientModule = require('./supabaseClient.js');
  estadoDbClient = clientModule.supabaseClient;
}

const ESTADOS_ESTADO = (typeof ESTADOS !== 'undefined') ? ESTADOS : require('./requests.js').ESTADOS;

const TRANSICIONES_PERMITIDAS = {
  [ESTADOS_ESTADO.NUEVO]: [ESTADOS_ESTADO.EN_PROCESO],
  [ESTADOS_ESTADO.EN_PROCESO]: [ESTADOS_ESTADO.RESUELTO]
};

function getEstadoClient() {
  if (typeof window !== 'undefined' && window.supabaseClient) {
    return window.supabaseClient;
  }
  return estadoDbClient;
}

function esAgente(usuario) {
  return Boolean(usuario && usuario.id && usuario.role === 'agente');
}

function validarTransicion(estadoAnterior, estadoNuevo, usuario) {
  if (!esAgente(usuario)) {
    return { valido: false, error: 'Solo el agente puede cambiar el estado de una solicitud.' };
  }

  const siguientes = TRANSICIONES_PERMITIDAS[estadoAnterior] || [];
  if (!siguientes.includes(estadoNuevo)) {
    return { valido: false, error: `Transicion no permitida: ${estadoAnterior} -> ${estadoNuevo}.` };
  }

  return { valido: true };
}

function obtenerAsignado(solicitudId, actual) {
  if (actual && actual.asignado_a) {
    return actual.asignado_a;
  }
  if (typeof window !== 'undefined' && typeof window.obtenerAsignacionMemoria === 'function') {
    const mem = window.obtenerAsignacionMemoria(solicitudId);
    if (mem && mem.asignado_a) return mem.asignado_a;
  } else if (typeof require !== 'undefined') {
    try {
      const { obtenerAsignacionMemoria } = require('./asignacion.js');
      const mem = obtenerAsignacionMemoria(solicitudId);
      if (mem && mem.asignado_a) return mem.asignado_a;
    } catch {}
  }
  return null;
}

async function cambiarEstado(solicitudId, estadoNuevo, usuario, motivo) {
  if (!solicitudId) {
    return { success: false, error: 'Solicitud no especificada.' };
  }

  if (!esAgente(usuario)) {
    return { success: false, error: 'Solo el agente puede cambiar el estado de una solicitud.' };
  }

  const client = getEstadoClient();
  if (!client) {
    return { success: false, error: 'Error de conexion con la base de datos.' };
  }

  try {
    let actual = null;
    let tieneColumnaAsignadoA = true;

    const { data: datosConAsignacion, error: errorConsulta } = await client
      .from('solicitudes')
      .select('id, estado, asignado_a')
      .eq('id', solicitudId)
      .maybeSingle();

    if (errorConsulta) {
      if (errorConsulta.message && errorConsulta.message.includes('asignado_a')) {
        tieneColumnaAsignadoA = false;
        const { data: datosBasicos, error: errorReintento } = await client
          .from('solicitudes')
          .select('id, estado')
          .eq('id', solicitudId)
          .maybeSingle();

        if (errorReintento) {
          return { success: false, error: errorReintento.message };
        }
        actual = datosBasicos;
      } else {
        return { success: false, error: errorConsulta.message };
      }
    } else {
      actual = datosConAsignacion;
    }

    if (!actual) {
      return { success: false, error: 'Solicitud no encontrada.' };
    }

    const asignadoA = obtenerAsignado(solicitudId, actual);
    if (asignadoA !== usuario.id) {
      return { success: false, error: 'El agente no tiene asignada esta solicitud.' };
    }

    const validacion = validarTransicion(actual.estado, estadoNuevo, usuario);
    if (!validacion.valido) {
      return { success: false, error: validacion.error };
    }

    const ahora = new Date().toISOString();
    let queryUpdate = client
      .from('solicitudes')
      .update({ estado: estadoNuevo, ultima_actualizacion: ahora })
      .eq('id', solicitudId)
      .eq('estado', actual.estado);

    if (tieneColumnaAsignadoA) {
      queryUpdate = queryUpdate.eq('asignado_a', usuario.id);
    }

    const { data, error } = await queryUpdate
      .select('id, estado, ultima_actualizacion')
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'La solicitud cambio antes de actualizarse. Intente nuevamente.' };
    }

    // Actualizar también en memoria si existe
    if (typeof window !== 'undefined' && typeof window.obtenerAsignacionMemoria === 'function') {
      const mem = window.obtenerAsignacionMemoria(solicitudId);
      if (mem) mem.estado = estadoNuevo;
    }

    const { error: errorHistorial } = await client
      .from('historial_solicitudes')
      .insert([{
        solicitud_id: solicitudId,
        accion: 'Cambiar estado',
        estado_anterior: actual.estado,
        estado_nuevo: estadoNuevo,
        motivo: motivo || null,
        usuario_id: usuario.id,
        fecha: ahora
      }]);

    if (errorHistorial) {
      let queryRevert = client
        .from('solicitudes')
        .update({ estado: actual.estado, ultima_actualizacion: ahora })
        .eq('id', solicitudId)
        .eq('estado', estadoNuevo);

      if (tieneColumnaAsignadoA) {
        queryRevert = queryRevert.eq('asignado_a', usuario.id);
      }
      await queryRevert;
      return { success: false, error: 'No se pudo registrar el cambio en el historial.' };
    }

    return {
      success: true,
      solicitud: {
        id: data.id,
        estado: data.estado,
        ultimaActualizacion: data.ultima_actualizacion
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * HU07: Consulta el historial de cambios de estado de una solicitud.
 */
async function consultarHistorialEstado(solicitudId) {
  if (!solicitudId) {
    return { success: false, error: 'Solicitud no especificada.', historial: [] };
  }

  const client = getEstadoClient();
  if (!client) {
    return { success: false, error: 'Error de conexion con la base de datos.', historial: [] };
  }

  try {
    const { data, error } = await client
      .from('historial_solicitudes')
      .select('accion, estado_anterior, estado_nuevo, motivo, usuario_id, fecha')
      .eq('solicitud_id', solicitudId)
      .order('fecha', { ascending: true });

    if (error) {
      return { success: false, error: error.message, historial: [] };
    }

    const historial = (data || []).map(h => ({
      accion: h.accion,
      estadoAnterior: h.estado_anterior,
      estadoNuevo: h.estado_nuevo,
      motivo: h.motivo,
      usuarioId: h.usuario_id,
      fecha: h.fecha
    }));

    return { success: true, historial };
  } catch (err) {
    return { success: false, error: err.message, historial: [] };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TRANSICIONES_PERMITIDAS,
    esAgente,
    validarTransicion,
    cambiarEstado,
    consultarHistorialEstado
  };
}
