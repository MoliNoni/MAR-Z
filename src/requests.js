/**
 * Modulo de Gestion de Solicitudes - MAR-Z
 * HU02 — Crear solicitudes
 * HU03 — Consultar mis solicitudes
 * Persistencia directa en base de datos Supabase
 */

let supabase = null;
if (typeof window !== 'undefined' && window.supabaseClient) {
  supabase = window.supabaseClient;
} else if (typeof require !== 'undefined') {
  const clientModule = require('./supabaseClient.js');
  supabase = clientModule.supabaseClient;
}

function getClient() {
  if (typeof window !== 'undefined' && window.supabaseClient) {
    return window.supabaseClient;
  }
  return supabase;
}

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
 * Genera el siguiente ID correlativo para la solicitud consultando la base de datos.
 */
async function generarSiguienteId(client) {
  const aleatorio = Math.floor(100 + Math.random() * 900);
  const timestamp = Date.now().toString().slice(-5);
  return `SOL-${timestamp}${aleatorio}`;
}

/**
 * HU02: Crea una nueva solicitud directamente en la base de datos Supabase.
 */
async function crearSolicitud(datos, propietario) {
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

  const client = getClient();
  if (!client) {
    return {
      success: false,
      error: 'Error de conexion con la base de datos.'
    };
  }

  const idGenerado = await generarSiguienteId(client);
  const fechaGenerada = new Date().toISOString();

  const nuevaSolicitud = {
    id: idGenerado,
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    categoria: datos.categoria.trim(),
    estado: ESTADOS.NUEVO,
    fecha: fechaGenerada,
    ultima_actualizacion: fechaGenerada,
    propietario_id: propietario.id,
    propietario_nombre: propietario.name,
    propietario_email: propietario.email
  };

  try {
    const { data, error } = await client
      .from('solicitudes')
      .insert([nuevaSolicitud])
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: error ? error.message : 'Error al guardar la solicitud en la base de datos.'
      };
    }

    return {
      success: true,
      solicitud: {
        id: data.id,
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria,
        estado: data.estado,
        fecha: data.fecha,
        ultimaActualizacion: data.ultima_actualizacion,
        propietario: {
          id: data.propietario_id,
          nombre: data.propietario_nombre,
          email: data.propietario_email,
          role: propietario.role
        }
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * HU03: Consulta exclusivamente las solicitudes del usuario autenticado en Supabase.
 */
async function consultarMisSolicitudes(usuario) {
  if (!usuario || !usuario.id) {
    return {
      success: false,
      error: 'Usuario no autenticado.',
      solicitudes: []
    };
  }

  const client = getClient();
  if (!client) {
    return {
      success: false,
      error: 'Error de conexion con la base de datos.',
      solicitudes: []
    };
  }

  try {
    const { data, error } = await client
      .from('solicitudes')
      .select('*')
      .eq('propietario_id', usuario.id)
      .order('fecha', { ascending: false });

    if (error || !Array.isArray(data)) {
      return {
        success: false,
        error: error ? error.message : 'Error al consultar solicitudes.',
        solicitudes: []
      };
    }

    const mapeadas = data.map(s => ({
      id: s.id,
      titulo: s.titulo,
      descripcion: s.descripcion,
      categoria: s.categoria,
      estado: s.estado,
      fecha: s.fecha,
      ultimaActualizacion: s.ultima_actualizacion,
      propietario: {
        id: s.propietario_id,
        nombre: s.propietario_nombre,
        email: s.propietario_email,
        role: usuario.role
      }
    }));

    return {
      success: true,
      solicitudes: mapeadas
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      solicitudes: []
    };
  }
}

/**
 * HU03: Obtiene el detalle de una solicitud desde Supabase validando permisos.
 */
async function obtenerDetalleSolicitud(solicitudId, usuario) {
  if (!usuario || !usuario.id) {
    return {
      success: false,
      error: 'Usuario no autenticado.'
    };
  }

  const client = getClient();
  if (!client) {
    return {
      success: false,
      error: 'Error de conexion con la base de datos.'
    };
  }

  try {
    const { data, error } = await client
      .from('solicitudes')
      .select('*')
      .eq('id', solicitudId)
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        error: 'Solicitud no encontrada.'
      };
    }

    if (usuario.role === 'solicitante' && data.propietario_id !== usuario.id) {
      return {
        success: false,
        error: 'Acceso no autorizado a esta solicitud.'
      };
    }

    return {
      success: true,
      solicitud: {
        id: data.id,
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria,
        estado: data.estado,
        fecha: data.fecha,
        ultimaActualizacion: data.ultima_actualizacion,
        propietario: {
          id: data.propietario_id,
          nombre: data.propietario_nombre,
          email: data.propietario_email,
          role: usuario.role
        }
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CATEGORIAS_VALIDAS,
    ESTADOS,
    validarDatosSolicitud,
    crearSolicitud,
    consultarMisSolicitudes,
    obtenerDetalleSolicitud
  };
}
