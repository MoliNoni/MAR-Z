/**
 * Modulo de Indicadores de Gestion - MAR-Z
 * HU10 — Indicadores
 * Responsable: Dev 2
 * Calcula metricas agregadas: volumen por estado y tiempo mediano de ciclo.
 * Permite filtros por estado, prioridad y categoria.
 * Excluye estrictamente cualquier tipo de ranking o comparacion individual.
 */

let indicadoresDbClient = null;
if (typeof window !== 'undefined' && window.supabaseClient) {
  indicadoresDbClient = window.supabaseClient;
} else if (typeof require !== 'undefined') {
  const clientModule = require('./supabaseClient.js');
  indicadoresDbClient = clientModule.supabaseClient;
}

function getIndicadoresClient() {
  if (typeof window !== 'undefined' && window.supabaseClient) {
    return window.supabaseClient;
  }
  return indicadoresDbClient;
}

/**
 * HU10: Calcula la mediana de un conjunto de valores numericos.
 */
function calcularMediana(valores) {
  if (!Array.isArray(valores) || valores.length === 0) {
    return 0;
  }

  const validos = valores.map(v => Number(v)).filter(v => !isNaN(v) && v >= 0);
  if (validos.length === 0) return 0;

  validos.sort((a, b) => a - b);
  const mitad = Math.floor(validos.length / 2);

  let mediana = 0;
  if (validos.length % 2 !== 0) {
    mediana = validos[mitad];
  } else {
    mediana = (validos[mitad - 1] + validos[mitad]) / 2;
  }

  return Math.round(mediana * 100) / 100;
}

/**
 * HU10: Agrupa y calcula el volumen de solicitudes por estado.
 */
function calcularVolumenPorEstado(solicitudes) {
  const conteo = {
    'Nuevo': 0,
    'En Proceso': 0,
    'Resuelto': 0,
    'Cerrado': 0,
    total: 0
  };

  if (!Array.isArray(solicitudes)) return conteo;

  solicitudes.forEach(s => {
    conteo.total++;
    const estado = s.estado || 'Nuevo';
    if (Object.prototype.hasOwnProperty.call(conteo, estado)) {
      conteo[estado]++;
    } else {
      conteo[estado] = 1;
    }
  });

  return conteo;
}

/**
 * HU10: Calcula el tiempo mediano de ciclo (en horas) para solicitudes resueltas o cerradas.
 * El tiempo de ciclo se mide desde la creacion (fecha) hasta el cierre/resolucion (ultima_actualizacion).
 */
function calcularTiempoMedianoCiclo(solicitudes, unidad = 'horas') {
  if (!Array.isArray(solicitudes) || solicitudes.length === 0) {
    return { valor: 0, unidad, solicitudesComputadas: 0 };
  }

  // Se consideran solicitudes completadas (Resuelto o Cerrado)
  const resueltasOCerradas = solicitudes.filter(s =>
    s.estado === 'Resuelto' || s.estado === 'Cerrado'
  );

  if (resueltasOCerradas.length === 0) {
    return { valor: 0, unidad, solicitudesComputadas: 0 };
  }

  const duraciones = resueltasOCerradas.map(s => {
    const inicio = new Date(s.fecha).getTime();
    const fin = new Date(s.ultima_actualizacion || s.ultimaActualizacion || s.fecha).getTime();
    const duracionMs = Math.max(0, fin - inicio);

    if (unidad === 'dias') {
      return duracionMs / (1000 * 60 * 60 * 24);
    } else if (unidad === 'minutos') {
      return duracionMs / (1000 * 60);
    }
    // Por defecto en horas
    return duracionMs / (1000 * 60 * 60);
  });

  const mediana = calcularMediana(duraciones);

  return {
    valor: mediana,
    unidad,
    solicitudesComputadas: resueltasOCerradas.length
  };
}

/**
 * HU10: Aplica filtros por estado, prioridad y categoria a un conjunto de solicitudes.
 */
function filtrarParaIndicadores(solicitudes, filtros = {}) {
  if (!Array.isArray(solicitudes)) return [];
  const { estado, prioridad, categoria } = filtros;

  return solicitudes.filter(s => {
    if (estado && estado.trim() !== '' && s.estado !== estado) {
      return false;
    }
    if (prioridad && prioridad.trim() !== '') {
      if (prioridad === 'Sin prioridad') {
        if (s.prioridad) return false;
      } else if (s.prioridad !== prioridad) {
        return false;
      }
    }
    if (categoria && categoria.trim() !== '' && s.categoria !== categoria) {
      return false;
    }
    return true;
  });
}

/**
 * HU10: Genera el conjunto completo de indicadores agregados del servicio.
 * IMPORTANTE: No incluye rankings ni comparaciones individuales por agente (criterio de no rankings).
 */
function calcularIndicadores(solicitudes, filtros = {}) {
  const filtradas = filtrarParaIndicadores(solicitudes, filtros);

  const volumen = calcularVolumenPorEstado(filtradas);
  const tiempoCiclo = calcularTiempoMedianoCiclo(filtradas, 'horas');

  // Desglose agregado por categoria
  const porCategoria = {};
  filtradas.forEach(s => {
    const cat = s.categoria || 'Sin categoria';
    porCategoria[cat] = (porCategoria[cat] || 0) + 1;
  });

  // Desglose agregado por prioridad
  const porPrioridad = {
    'Alta': 0,
    'Media': 0,
    'Baja': 0,
    'Sin prioridad': 0
  };
  filtradas.forEach(s => {
    const pri = s.prioridad || 'Sin prioridad';
    if (Object.prototype.hasOwnProperty.call(porPrioridad, pri)) {
      porPrioridad[pri]++;
    } else {
      porPrioridad[pri] = 1;
    }
  });

  return {
    filtrosAplicados: { ...filtros },
    totalSolicitudes: filtradas.length,
    volumenPorEstado: volumen,
    tiempoMedianoCiclo: tiempoCiclo,
    desglosePorCategoria: porCategoria,
    desglosePorPrioridad: porPrioridad
  };
}

/**
 * HU10: Consulta indicadores agregados desde la base de datos validando rol coordinador.
 */
async function consultarIndicadores(filtros = {}, usuario) {
  if (!usuario || !usuario.id) {
    return {
      success: false,
      error: 'Usuario no autenticado.',
      indicadores: null
    };
  }

  const rol = usuario.role || usuario.rol;
  if (rol !== 'coordinador') {
    return {
      success: false,
      error: 'Solo el coordinador puede consultar indicadores agregados.',
      indicadores: null
    };
  }

  const client = getIndicadoresClient();
  if (!client) {
    return {
      success: false,
      error: 'Error de conexion con la base de datos.',
      indicadores: null
    };
  }

  try {
    const { data, error } = await client
      .from('solicitudes')
      .select('*')
      .order('fecha', { ascending: false });

    if (error || !Array.isArray(data)) {
      return {
        success: false,
        error: error ? error.message : 'Error al consultar solicitudes para indicadores.',
        indicadores: null
      };
    }

    const indicadores = calcularIndicadores(data, filtros);

    return {
      success: true,
      indicadores
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      indicadores: null
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcularMediana,
    calcularVolumenPorEstado,
    calcularTiempoMedianoCiclo,
    filtrarParaIndicadores,
    calcularIndicadores,
    consultarIndicadores
  };
}
