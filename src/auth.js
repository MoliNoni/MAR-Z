/**
 * Modulo de Autenticacion y Control de Roles - MAR-Z
 * HU01 — Login y acceso segun rol
 * Consulta directa a la base de datos de Supabase
 */

let authDbClient = null;
if (typeof window !== 'undefined' && window.supabaseClient) {
  authDbClient = window.supabaseClient;
} else if (typeof require !== 'undefined') {
  const clientModule = require('./supabaseClient.js');
  authDbClient = clientModule.supabaseClient;
}

// Definicion de Roles del Sistema MAR-Z
const ROLES = {
  SOLICITANTE: 'solicitante',
  COORDINADOR: 'coordinador',
  AGENTE: 'agente',
  AUDITOR: 'auditor'
};

// Permisos y secciones asignadas a cada rol
const ROLE_PERMISSIONS = {
  [ROLES.SOLICITANTE]: {
    name: 'Solicitante',
    modules: ['crear_solicitud', 'mis_solicitudes', 'confirmar_solucion'],
    description: 'Creacion y seguimiento de solicitudes de soporte.'
  },
  [ROLES.COORDINADOR]: {
    name: 'Coordinador',
    modules: ['priorizar_solicitudes', 'asignar_solicitudes', 'indicadores', 'exportar_reporte'],
    description: 'Gestion, priorizacion, asignacion y reportes de solicitudes.'
  },
  [ROLES.AGENTE]: {
    name: 'Agente',
    modules: ['atender_solicitudes', 'registrar_comentarios', 'cambiar_estado'],
    description: 'Atencion tecnica, comentarios y avance de estados.'
  },
  [ROLES.AUDITOR]: {
    name: 'Auditor',
    modules: ['historial_auditoria'],
    description: 'Acceso de solo lectura al historial de auditoria.'
  }
};

const INVALID_CREDENTIALS_MSG = 'Credenciales incorrectas. Verifique su correo o contrasena.';

/**
 * Autentica un usuario verificando credenciales directamente en la tabla 'usuarios' de Supabase.
 * No revela si el usuario existe o si la contrasena es incorrecta.
 */
async function authenticate(email, password) {
  if (!email || !password) {
    return {
      success: false,
      error: INVALID_CREDENTIALS_MSG
    };
  }

  const client = (typeof window !== 'undefined' && window.supabaseClient) ? window.supabaseClient : authDbClient;

  if (!client) {
    return {
      success: false,
      error: 'Error de conexion con la base de datos.'
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await client
      .from('usuarios')
      .select('id, email, password, nombre, rol')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error || !data || data.password !== password) {
      return {
        success: false,
        error: INVALID_CREDENTIALS_MSG
      };
    }

    return {
      success: true,
      user: {
        id: data.id,
        email: data.email,
        name: data.nombre,
        role: data.rol
      }
    };
  } catch {
    return {
      success: false,
      error: INVALID_CREDENTIALS_MSG
    };
  }
}

/**
 * Valida si un rol tiene permiso para acceder a un modulo especifico.
 */
function hasPermission(role, moduleName) {
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) return false;
  return roleConfig.modules.includes(moduleName);
}

/**
 * Obtiene la configuracion y modulos permitidos para un rol.
 */
function getRoleDetails(role) {
  return ROLE_PERMISSIONS[role] || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ROLES,
    ROLE_PERMISSIONS,
    INVALID_CREDENTIALS_MSG,
    authenticate,
    hasPermission,
    getRoleDetails
  };
}
