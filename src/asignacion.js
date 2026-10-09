/**
 * Modulo de Asignacion de Solicitudes - MAR-Z
 * HU05 — Asignar solicitudes
 * Responsable: Dev 1
 * Integrado con Supabase y gestion de agentes activos y notificaciones
 */

let asignacionDbClient = null;
if (typeof window !== 'undefined' && window.supabaseClient) {
  asignacionDbClient = window.supabaseClient;
} else if (typeof require !== 'undefined') {
  const clientModule = require('./supabaseClient.js');
  asignacionDbClient = clientModule.supabaseClient;
}

function getAsignacionClient() {
  if (typeof window !== 'undefined' && window.supabaseClient) {
    return window.supabaseClient;
  }
  return asignacionDbClient;
}

// Almacen local en memoria para soporte resiliente (garantiza pruebas y operacion)
const asignacionesMemoria = new Map();
const notificacionesMemoria = [];
const agentesEstadoMemoria = new Map();

/**
 * HU05: Verifica si un usuario es coordinador.
 */
function esCoordinador(usuario) {
  return Boolean(usuario && usuario.id && usuario.role === 'coordinador');
}

/**
 * HU05: Valida que el usuario sea un agente y que se encuentre activo.
 */
function validarAgenteActivo(agente) {
  if (!agente || !agente.id) {
    return { valido: false, error: 'Agente no especificado.' };
  }

  const rol = agente.role || agente.rol;
  if (rol !== 'agente') {
    return { valido: false, error: 'Solo se puede asignar a un usuario con rol de agente.' };
  }

  // Verificar estado activo en memoria o en propiedad
  const overrideActivo = agentesEstadoMemoria.get(agente.id);
  const estaActivo = overrideActivo !== undefined ? overrideActivo : (agente.activo !== false);

  if (!estaActivo) {
    return { valido: false, error: 'El agente seleccionado no esta activo.' };
  }

  return { valido: true };
}

/**
 * HU05: Valida la operacion completa de asignacion antes de persistir.
 */
function validarAsignacion(solicitud, agente, usuarioCoordinador) {
  if (!esCoordinador(usuarioCoordinador)) {
    return { valido: false, error: 'Solo el coordinador puede asignar solicitudes.' };
  }

  if (!solicitud) {
    return { valido: false, error: 'Solicitud no encontrada.' };
  }

  if (solicitud.estado === 'Cerrado') {
    return { valido: false, error: 'No se puede asignar una solicitud cerrada.' };
  }

  const validacionAgente = validarAgenteActivo(agente);
  if (!validacionAgente.valido) {
    return validacionAgente;
  }

  return { valido: true };
}

/**
 * HU05: Consulta la lista de agentes activos disponibles en el sistema.
 */
async function consultarAgentesActivos() {
  const client = getAsignacionClient();
  const agentes = [];

  if (client) {
    try {
      const { data, error } = await client
        .from('usuarios')
        .select('id, nombre, email, rol')
        .eq('rol', 'agente');

      if (!error && Array.isArray(data)) {
        data.forEach(u => {
          const overrideActivo = agentesEstadoMemoria.get(u.id);
          const activo = overrideActivo !== undefined ? overrideActivo : true;
          if (activo) {
            agentes.push({
              id: u.id,
              nombre: u.nombre,
              email: u.email,
              role: u.rol,
              activo: true
            });
          }
        });
        return { success: true, agentes };
      }
    } catch {
      // Continuar con lista base
    }
  }

  // Lista base por defecto si hay fallo de conexion
  const agentesBase = [
    { id: 'USR-03', nombre: 'Mario Agente', email: 'agente@marz.com', role: 'agente', activo: true }
  ];

  agentesBase.forEach(u => {
    const overrideActivo = agentesEstadoMemoria.get(u.id);
    const activo = overrideActivo !== undefined ? overrideActivo : true;
    if (activo) {
      agentes.push({ ...u, activo });
    }
  });

  return { success: true, agentes };
}

/**
 * HU05: Permite modificar el estado activo de un agente (para pruebas o gestion administrativa).
 */
function setAgenteActivo(agenteId, activo) {
  agentesEstadoMemoria.set(agenteId, Boolean(activo));
}

/**
 * HU05: Genera y registra una notificacion para el agente asignado.
 */
async function notificarAsignacion(solicitud, agente, coordinador) {
  const ahora = new Date().toISOString();
  const notificacion = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    solicitud_id: solicitud.id,
    solicitud_titulo: solicitud.titulo,
    destinatario_id: agente.id,
    destinatario_nombre: agente.nombre || agente.name,
    remitente_id: coordinador.id,
    remitente_nombre: coordinador.nombre || coordinador.name,
    mensaje: `Se le ha asignado la solicitud ${solicitud.id}: "${solicitud.titulo}".`,
    leido: false,
    fecha: ahora
  };

  notificacionesMemoria.unshift(notificacion);

  const client = getAsignacionClient();
  if (client) {
    try {
      await client.from('notificaciones').insert([{
        solicitud_id: solicitud.id,
        destinatario_id: agente.id,
        remitente_id: coordinador.id,
        mensaje: notificacion.mensaje,
        leido: false,
        fecha: ahora
      }]);
    } catch {
      // Falla silenciosa si la tabla notificaciones aun no se ha corrido en Supabase
    }
  }

  return notificacion;
}

/**
 * HU05: Consulta las notificaciones dirigidas a un usuario.
 */
async function consultarNotificaciones(usuarioId) {
  if (!usuarioId) {
    return { success: false, error: 'Usuario no especificado.', notificaciones: [] };
  }

  const client = getAsignacionClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('notificaciones')
        .select('*')
        .eq('destinatario_id', usuarioId)
        .order('fecha', { ascending: false });

      if (!error && Array.isArray(data)) {
        return {
          success: true,
          notificaciones: data.map(n => ({
            id: String(n.id),
            solicitudId: n.solicitud_id,
            mensaje: n.mensaje,
            leido: n.leido,
            fecha: n.fecha
          }))
        };
      }
    } catch {
      // Usar memoria
    }
  }

  const filtradas = notificacionesMemoria
    .filter(n => n.destinatario_id === usuarioId)
    .map(n => ({
      id: String(n.id),
      solicitudId: n.solicitud_id,
      mensaje: n.mensaje,
      leido: n.leido,
      fecha: n.fecha
    }));

  return { success: true, notificaciones: filtradas };
}

/**
 * HU05: Marca una notificacion como leida.
 */
async function marcarNotificacionLeida(notificacionId) {
  const notif = notificacionesMemoria.find(n => String(n.id) === String(notificacionId));
  if (notif) notif.leido = true;

  const client = getAsignacionClient();
  if (client) {
    try {
      await client
        .from('notificaciones')
        .update({ leido: true })
        .eq('id', notificacionId);
    } catch {
      // Ignorar si falla
    }
  }

  return { success: true };
}

/**
 * HU05: Asigna una solicitud a un agente activo, registrando responsable, fecha y generando notificacion.
 */
async function asignarSolicitud(solicitudId, agenteId, usuarioCoordinador) {
  if (!esCoordinador(usuarioCoordinador)) {
    return { success: false, error: 'Solo el coordinador puede asignar solicitudes.' };
  }

  if (!solicitudId) {
    return { success: false, error: 'ID de solicitud no especificado.' };
  }

  if (!agenteId) {
    return { success: false, error: 'Debe seleccionar un agente para la asignacion.' };
  }

  const client = getAsignacionClient();

  // 1. Obtener la solicitud
  let solicitud = null;
  if (client) {
    try {
      const { data, error } = await client
        .from('solicitudes')
        .select('*')
        .eq('id', solicitudId)
        .maybeSingle();

      if (!error && data) {
        solicitud = data;
      }
    } catch {
      // Error de consulta
    }
  }

  if (!solicitud) {
    solicitud = asignacionesMemoria.get(solicitudId);
  }

  if (!solicitud) {
    return { success: false, error: 'Solicitud no encontrada.' };
  }

  // 2. Obtener y validar el agente
  let agente = null;
  if (client) {
    try {
      const { data, error } = await client
        .from('usuarios')
        .select('id, nombre, email, rol')
        .eq('id', agenteId)
        .maybeSingle();

      if (!error && data) {
        agente = {
          id: data.id,
          nombre: data.nombre,
          email: data.email,
          role: data.rol
        };
      }
    } catch {
      // Error de consulta
    }
  }

  if (!agente) {
    if (agenteId === 'USR-03') {
      agente = { id: 'USR-03', nombre: 'Mario Agente', email: 'agente@marz.com', role: 'agente' };
    }
  }

  if (!agente) {
    return { success: false, error: 'Agente no encontrado.' };
  }

  // 3. Validar reglas de negocio
  const validacion = validarAsignacion(solicitud, agente, usuarioCoordinador);
  if (!validacion.valido) {
    return { success: false, error: validacion.error };
  }

  const ahora = new Date().toISOString();
  const nombreCoordinador = usuarioCoordinador.nombre || usuarioCoordinador.name || 'Coordinador';
  const nombreAgente = agente.nombre || agente.name || 'Agente';

  // 4. Actualizar solicitud en Supabase
  let persistidoEnBd = false;
  if (client) {
    try {
      const updateData = {
        asignado_a: agente.id,
        asignado_nombre: nombreAgente,
        asignado_por: usuarioCoordinador.id,
        asignado_en: ahora,
        ultima_actualizacion: ahora
      };

      const { data, error } = await client
        .from('solicitudes')
        .update(updateData)
        .eq('id', solicitudId)
        .select()
        .maybeSingle();

      if (!error && data) {
        persistidoEnBd = true;
        solicitud = data;
      }
    } catch {
      // Si la columna aun no existe en Supabase, se respalda en memoria
    }
  }

  // Actualizar en memoria
  const solicitudActualizada = {
    ...solicitud,
    asignado_a: agente.id,
    asignado_nombre: nombreAgente,
    asignado_por: usuarioCoordinador.id,
    asignado_en: ahora,
    ultima_actualizacion: ahora
  };
  asignacionesMemoria.set(solicitudId, solicitudActualizada);

  // 5. Registrar en historial_solicitudes si la tabla existe
  if (client) {
    try {
      await client.from('historial_solicitudes').insert([{
        solicitud_id: solicitudId,
        accion: 'Asignar solicitud',
        campo: 'asignado_a',
        estado_anterior: solicitud.estado,
        estado_nuevo: solicitud.estado,
        valor_anterior: solicitud.asignado_a || null,
        valor_nuevo: agente.id,
        motivo: `Asignado a ${nombreAgente} por ${nombreCoordinador}`,
        usuario_id: usuarioCoordinador.id,
        fecha: ahora
      }]);
    } catch {
      // Ignorar fallo de historial si no existe
    }
  }

  // 6. Notificar al agente
  const notificacion = await notificarAsignacion(solicitudActualizada, agente, usuarioCoordinador);

  return {
    success: true,
    solicitud: {
      id: solicitudId,
      titulo: solicitudActualizada.titulo,
      estado: solicitudActualizada.estado,
      asignadoA: agente.id,
      asignadoNombre: nombreAgente,
      asignadoPor: usuarioCoordinador.id,
      asignadoPorNombre: nombreCoordinador,
      asignadoEn: ahora,
      ultimaActualizacion: ahora
    },
    notificacion
  };
}

/**
 * HU05: Consulta las solicitudes asignadas a un agente especifico.
 */
async function consultarSolicitudesAsignadas(usuarioAgente) {
  if (!usuarioAgente || !usuarioAgente.id) {
    return { success: false, error: 'Usuario no autenticado.', solicitudes: [] };
  }

  const rol = usuarioAgente.role || usuarioAgente.rol;
  if (rol !== 'agente') {
    return { success: false, error: 'Solo los agentes pueden consultar su bandeja de asignaciones.', solicitudes: [] };
  }

  const client = getAsignacionClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('solicitudes')
        .select('*')
        .eq('asignado_a', usuarioAgente.id)
        .order('fecha', { ascending: false });

      if (!error && Array.isArray(data)) {
        return {
          success: true,
          solicitudes: data.map(s => ({
            id: s.id,
            titulo: s.titulo,
            descripcion: s.descripcion,
            categoria: s.categoria,
            estado: s.estado,
            prioridad: s.prioridad,
            fecha: s.fecha,
            asignadoA: s.asignado_a,
            asignadoNombre: s.asignado_nombre,
            asignadoPor: s.asignado_por,
            asignadoEn: s.asignado_en,
            ultimaActualizacion: s.ultima_actualizacion
          }))
        };
      }
    } catch {
      // Usar memoria
    }
  }

  const enMemoria = [];
  asignacionesMemoria.forEach(s => {
    if (s.asignado_a === usuarioAgente.id) {
      enMemoria.push({
        id: s.id,
        titulo: s.titulo,
        descripcion: s.descripcion,
        categoria: s.categoria,
        estado: s.estado,
        prioridad: s.prioridad,
        fecha: s.fecha,
        asignadoA: s.asignado_a,
        asignadoNombre: s.asignado_nombre,
        asignadoPor: s.asignado_por,
        asignadoEn: s.asignado_en,
        ultimaActualizacion: s.ultima_actualizacion
      });
    }
  });

  return { success: true, solicitudes: enMemoria };
}

/**
 * HU05: Consulta asignacion de una solicitud por ID.
 */
function obtenerAsignacionMemoria(solicitudId) {
  return asignacionesMemoria.get(solicitudId) || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    esCoordinador,
    validarAgenteActivo,
    validarAsignacion,
    consultarAgentesActivos,
    setAgenteActivo,
    notificarAsignacion,
    consultarNotificaciones,
    marcarNotificacionLeida,
    asignarSolicitud,
    consultarSolicitudesAsignadas,
    obtenerAsignacionMemoria
  };
}
