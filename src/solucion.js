/**
 * Modulo de Confirmacion y Reapertura de Solucion - MAR-Z
 * HU08 — Confirmar o reabrir solucion
 * Persistencia directa en base de datos Supabase
 */

let solucionDbClient = null;
if (typeof window !== 'undefined' && window.supabaseClient) {
  solucionDbClient = window.supabaseClient;
} else if (typeof require !== 'undefined') {
  const clientModule = require('./supabaseClient.js');
  solucionDbClient = clientModule.supabaseClient;
}

// En el navegador ESTADOS es global (requests.js); en Node se importa
const ESTADOS_SOLUCION = (typeof ESTADOS !== 'undefined') ? ESTADOS : require('./requests.js').ESTADOS;

const ACCIONES_SOLUCION = {
  CONFIRMAR: 'Confirmar solucion',
  REABRIR: 'Reabrir solicitud'
};

function getSolucionClient() {
  if (typeof window !== 'undefined' && window.supabaseClient) {
    return window.supabaseClient;
  }
  return solucionDbClient;
}

/**
 * HU08: Valida que el usuario sea el solicitante propietario y que la solicitud este Resuelta.
 */
function validarAccionSolucion(solicitud, usuario) {
  if (!usuario || !usuario.id || usuario.role !== 'solicitante') {
    return { valido: false, error: 'Solo el solicitante puede confirmar o reabrir la solucion.' };
  }

  if (!solicitud) {
    return { valido: false, error: 'Solicitud no encontrada.' };
  }

  if (solicitud.propietario_id !== usuario.id) {
    return { valido: false, error: 'Acceso no autorizado a esta solicitud.' };
  }

  if (solicitud.estado !== ESTADOS_SOLUCION.RESUELTO) {
    return { valido: false, error: 'Solo se puede confirmar o reabrir una solicitud Resuelta.' };
  }

  return { valido: true };
}

/**
 * HU08: Cambia el estado de una solicitud Resuelta y registra la accion en el historial.
 */
async function aplicarAccionSolucion(solicitudId, usuario, estadoNuevo, accion, motivo) {
  if (!usuario || !usuario.id || usuario.role !== 'solicitante') {
    return { success: false, error: 'Solo el solicitante puede confirmar o reabrir la solucion.' };
  }

  const client = getSolucionClient();
  if (!client) {
    return { success: false, error: 'Error de conexion con la base de datos.' };
  }

  try {
    const { data: actual, error: errorConsulta } = await client
      .from('solicitudes')
      .select('id, estado, propietario_id')
      .eq('id', solicitudId)
      .maybeSingle();

    if (errorConsulta) {
      return { success: false, error: errorConsulta.message };
    }

    const validacion = validarAccionSolucion(actual, usuario);
    if (!validacion.valido) {
      return { success: false, error: validacion.error };
    }

    const ahora = new Date().toISOString();

    // El filtro por estado evita aplicar la accion si otro usuario cambio la solicitud antes
    const { data, error } = await client
      .from('solicitudes')
      .update({ estado: estadoNuevo, ultima_actualizacion: ahora })
      .eq('id', solicitudId)
      .eq('estado', ESTADOS_SOLUCION.RESUELTO)
      .select('id, estado, ultima_actualizacion')
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Solo se puede confirmar o reabrir una solicitud Resuelta.' };
    }

    const { error: errorHistorial } = await client
      .from('historial_solicitudes')
      .insert([{
        solicitud_id: solicitudId,
        accion,
        campo: 'estado',
        estado_anterior: ESTADOS_SOLUCION.RESUELTO,
        estado_nuevo: estadoNuevo,
        valor_anterior: ESTADOS_SOLUCION.RESUELTO,
        valor_nuevo: estadoNuevo,
        motivo: motivo || null,
        usuario_id: usuario.id,
        fecha: ahora
      }]);

    if (errorHistorial) {
      // Sin historial la accion no es trazable: se revierte el cambio de estado
      await client
        .from('solicitudes')
        .update({ estado: ESTADOS_SOLUCION.RESUELTO })
        .eq('id', solicitudId)
        .eq('estado', estadoNuevo);
      return { success: false, error: 'No se pudo registrar la accion en el historial.' };
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
 * HU08: El solicitante confirma la solucion y la solicitud pasa a Cerrado.
 */
async function confirmarSolucion(solicitudId, usuario) {
  return aplicarAccionSolucion(solicitudId, usuario, ESTADOS_SOLUCION.CERRADO, ACCIONES_SOLUCION.CONFIRMAR, null);
}

/**
 * HU08: El solicitante reabre la solicitud indicando el motivo; vuelve a En Proceso.
 */
async function reabrirSolicitud(solicitudId, motivo, usuario) {
  if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
    return { success: false, error: 'El motivo de reapertura es obligatorio.' };
  }

  return aplicarAccionSolucion(solicitudId, usuario, ESTADOS_SOLUCION.EN_PROCESO, ACCIONES_SOLUCION.REABRIR, motivo.trim());
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ACCIONES_SOLUCION,
    validarAccionSolucion,
    confirmarSolucion,
    reabrirSolicitud
  };
}
