/**
 * Módulo de Autenticación y Control de Roles - MAR-Z
 * HU01 — Login y acceso según rol
 */

// Definición de Roles del Sistema MAR-Z
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
    description: 'Creación y seguimiento de solicitudes de soporte.'
  },
  [ROLES.COORDINADOR]: {
    name: 'Coordinador',
    modules: ['priorizar_solicitudes', 'asignar_solicitudes', 'indicadores', 'exportar_reporte'],
    description: 'Gestión, priorización, asignación y reportes de solicitudes.'
  },
  [ROLES.AGENTE]: {
    name: 'Agente',
    modules: ['atender_solicitudes', 'registrar_comentarios', 'cambiar_estado'],
    description: 'Atención técnica, comentarios y avance de estados.'
  },
  [ROLES.AUDITOR]: {
    name: 'Auditor',
    modules: ['historial_auditoria'],
    description: 'Acceso de solo lectura al historial de auditoría.'
  }
};

// Base de usuarios predefinidos para autenticación
const USERS_DB = [
  {
    id: 'USR-01',
    email: 'solicitante@marz.com',
    password: 'password123',
    name: 'Carlos Solicitante',
    role: ROLES.SOLICITANTE
  },
  {
    id: 'USR-02',
    email: 'coordinador@marz.com',
    password: 'password123',
    name: 'Ana Coordinadora',
    role: ROLES.COORDINADOR
  },
  {
    id: 'USR-03',
    email: 'agente@marz.com',
    password: 'password123',
    name: 'Mario Agente',
    role: ROLES.AGENTE
  },
  {
    id: 'USR-04',
    email: 'auditor@marz.com',
    password: 'password123',
    name: 'Elena Auditora',
    role: ROLES.AUDITOR
  }
];

// Mensaje de error genérico para no revelar si el usuario existe o no
const INVALID_CREDENTIALS_MSG = 'Credenciales incorrectas. Verifique su correo o contraseña.';

/**
 * Autentica un usuario verificando credenciales.
 * No revela si el usuario existe o si la contraseña es incorrecta.
 */
function authenticate(email, password) {
  if (!email || !password) {
    return {
      success: false,
      error: INVALID_CREDENTIALS_MSG
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = USERS_DB.find(u => u.email.toLowerCase() === normalizedEmail);

  // Verificación constante / sin revelar existencia
  if (!user || user.password !== password) {
    return {
      success: false,
      error: INVALID_CREDENTIALS_MSG
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
}

/**
 * Valida si un rol tiene permiso para acceder a un módulo específico.
 */
function hasPermission(role, moduleName) {
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) return false;
  return roleConfig.modules.includes(moduleName);
}

/**
 * Obtiene la configuración y módulos permitidos para un rol.
 */
function getRoleDetails(role) {
  return ROLE_PERMISSIONS[role] || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ROLES,
    ROLE_PERMISSIONS,
    USERS_DB,
    INVALID_CREDENTIALS_MSG,
    authenticate,
    hasPermission,
    getRoleDetails
  };
}
