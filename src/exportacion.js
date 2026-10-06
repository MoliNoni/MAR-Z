/**
 * Modulo de Exportacion de Reportes - MAR-Z
 * HU12 — Exportar reporte
 * Responsable: Dev 4
 * Genera un CSV con columnas permitidas (sin credenciales ni texto libre),
 * aplica los filtros seleccionados y registra cada exportacion.
 */

let exportDbClient = null;
if (typeof window !== 'undefined' && window.supabaseClient) {
  exportDbClient = window.supabaseClient;
} else if (typeof require !== 'undefined') {
  exportDbClient = require('./supabaseClient.js').supabaseClient;
}

const exportFiltrar = (typeof filtrarSolicitudes !== 'undefined') ? filtrarSolicitudes : require('./busqueda.js').filtrarSolicitudes;
const exportHasPermission = (typeof hasPermission !== 'undefined') ? hasPermission : require('./auth.js').hasPermission;

// Lista blanca: solo campos codificados o cerrados. Se excluyen titulo, descripcion,
// justificacion, nombres, emails y contrasenas (cambio Sprint 3: sin texto libre).
const COLUMNAS_REPORTE = ['id', 'categoria', 'estado', 'prioridad', 'prioridad_fecha_objetivo', 'fecha', 'ultima_actualizacion'];

function getExportClient() {
  if (typeof window !== 'undefined' && window.supabaseClient) {
    return window.supabaseClient;
  }
  return exportDbClient;
}

/**
 * HU12: Escapa un valor para CSV y neutraliza inyeccion de formulas (=, +, -, @).
 */
function valorCsv(valor) {
  let texto = valor === null || valor === undefined ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = "'" + texto;
  return '"' + texto.replace(/"/g, '""') + '"';
}

function generarCSV(solicitudes) {
  const filas = (Array.isArray(solicitudes) ? solicitudes : []).map(s =>
    COLUMNAS_REPORTE.map(col => valorCsv(s[col])).join(',')
  );
  return [COLUMNAS_REPORTE.join(','), ...filas].join('\r\n');
}

/**
 * HU12: Exporta el reporte filtrado. Solo el coordinador; si no se puede
 * registrar la exportacion, no se entrega el CSV.
 */
async function exportarReporte(filtros = {}, usuario, client = getExportClient()) {
  if (!usuario || !usuario.id) {
    return { success: false, error: 'Usuario no autenticado.' };
  }
  if (!exportHasPermission(usuario.role || usuario.rol, 'exportar_reporte')) {
    return { success: false, error: 'No tiene permiso para exportar reportes.' };
  }
  if (!client) {
    return { success: false, error: 'Error de conexion con la base de datos.' };
  }

  const filtrosAplicados = {
    estado: filtros.estado || '',
    prioridad: filtros.prioridad || '',
    categoria: filtros.categoria || ''
  };

  try {
    const { data, error } = await client
      .from('solicitudes')
      .select(COLUMNAS_REPORTE.join(','))
      .order('fecha', { ascending: false });
    if (error || !Array.isArray(data)) {
      return { success: false, error: 'Error al consultar solicitudes para el reporte.' };
    }

    const filtradas = exportFiltrar(data, filtrosAplicados);

    const { error: errorLog } = await client.from('exportaciones').insert([{
      usuario_id: usuario.id,
      filtros: filtrosAplicados,
      cantidad: filtradas.length
    }]);
    if (errorLog) {
      return { success: false, error: 'No se pudo registrar la exportacion.' };
    }

    return { success: true, csv: generarCSV(filtradas), cantidad: filtradas.length };
  } catch (err) {
    return { success: false, error: 'Error al exportar el reporte.' };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COLUMNAS_REPORTE, generarCSV, exportarReporte };
}
