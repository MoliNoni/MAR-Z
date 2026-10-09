/**
 * Modulo de Historial de Auditoria - MAR-Z
 * HU11 - Consulta de trazabilidad para auditoria.
 */

let auditoriaDbClient = null;
if (typeof window !== 'undefined' && window.supabaseClient) {
  auditoriaDbClient = window.supabaseClient;
} else if (typeof require !== 'undefined') {
  auditoriaDbClient = require('./supabaseClient.js').supabaseClient;
}

function getAuditoriaClient() {
  if (typeof window !== 'undefined' && window.supabaseClient) {
    return window.supabaseClient;
  }
  return auditoriaDbClient;
}

function esAuditor(usuario) {
  return Boolean(usuario && usuario.id && (usuario.role || usuario.rol) === 'auditor');
}

function campoLegado(registro) {
  if (registro.campo) return registro.campo;
  if (registro.accion === 'Asignar solicitud') return 'asignado_a';
  return 'estado';
}

/**
 * Consulta solo datos estructurados. No incluye motivo ni ningun otro texto libre.
 */
async function consultarHistorialAuditoria(usuario, client = getAuditoriaClient()) {
  if (!esAuditor(usuario)) {
    return { success: false, error: 'Solo el auditor puede consultar el historial.', historial: [] };
  }
  if (!client) {
    return { success: false, error: 'Error de conexion con la base de datos.', historial: [] };
  }

  try {
    const { data, error } = await client
      .from('historial_solicitudes')
      .select('solicitud_id, accion, campo, valor_anterior, valor_nuevo, estado_anterior, estado_nuevo, usuario_id, fecha')
      .order('fecha', { ascending: false });

    if (error) {
      return { success: false, error: error.message, historial: [] };
    }

    return {
      success: true,
      historial: (data || []).map(registro => ({
        solicitudId: registro.solicitud_id,
        accion: registro.accion,
        actor: registro.usuario_id,
        fecha: registro.fecha,
        campo: campoLegado(registro),
        valorAnterior: registro.valor_anterior ?? registro.estado_anterior ?? null,
        valorNuevo: registro.valor_nuevo ?? registro.estado_nuevo ?? null
      }))
    };
  } catch (err) {
    return { success: false, error: err.message, historial: [] };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { esAuditor, consultarHistorialAuditoria };
}