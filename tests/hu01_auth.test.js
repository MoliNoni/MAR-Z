const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ROLES,
  ROLE_PERMISSIONS,
  USERS_DB,
  INVALID_CREDENTIALS_MSG,
  authenticate,
  hasPermission,
  getRoleDetails
} = require('../src/auth.js');

test('HU01 — Modelo de Usuarios y Roles', () => {
  assert.strictEqual(ROLES.SOLICITANTE, 'solicitante');
  assert.strictEqual(ROLES.COORDINADOR, 'coordinador');
  assert.strictEqual(ROLES.AGENTE, 'agente');
  assert.strictEqual(ROLES.AUDITOR, 'auditor');

  assert.strictEqual(USERS_DB.length >= 4, true);
  assert.ok(ROLE_PERMISSIONS[ROLES.SOLICITANTE]);
  assert.ok(ROLE_PERMISSIONS[ROLES.COORDINADOR]);
  assert.ok(ROLE_PERMISSIONS[ROLES.AGENTE]);
  assert.ok(ROLE_PERMISSIONS[ROLES.AUDITOR]);
});

test('HU01 — Autenticación exitosa por rol', () => {
  // Solicitante
  const resSol = authenticate('solicitante@marz.com', 'password123');
  assert.strictEqual(resSol.success, true);
  assert.strictEqual(resSol.user.role, ROLES.SOLICITANTE);
  assert.strictEqual(resSol.user.password, undefined); // No exponer contraseña

  // Coordinador
  const resCoord = authenticate('coordinador@marz.com', 'password123');
  assert.strictEqual(resCoord.success, true);
  assert.strictEqual(resCoord.user.role, ROLES.COORDINADOR);

  // Agente
  const resAgente = authenticate('agente@marz.com', 'password123');
  assert.strictEqual(resAgente.success, true);
  assert.strictEqual(resAgente.user.role, ROLES.AGENTE);

  // Auditor
  const resAuditor = authenticate('auditor@marz.com', 'password123');
  assert.strictEqual(resAuditor.success, true);
  assert.strictEqual(resAuditor.user.role, ROLES.AUDITOR);
});

test('HU01 — No revelar información con credenciales incorrectas (Mismo mensaje de error genérico)', () => {
  // Usuario no existente
  const resNoUser = authenticate('inexistente@marz.com', 'password123');
  assert.strictEqual(resNoUser.success, false);
  assert.strictEqual(resNoUser.error, INVALID_CREDENTIALS_MSG);

  // Usuario existente pero clave incorrecta
  const resWrongPass = authenticate('solicitante@marz.com', 'wrongpassword');
  assert.strictEqual(resWrongPass.success, false);
  assert.strictEqual(resWrongPass.error, INVALID_CREDENTIALS_MSG);

  // Campos vacíos o nulos
  const resEmpty = authenticate('', '');
  assert.strictEqual(resEmpty.success, false);
  assert.strictEqual(resEmpty.error, INVALID_CREDENTIALS_MSG);

  // Mismo mensaje exacto para evitar enumeración de usuarios
  assert.strictEqual(resNoUser.error, resWrongPass.error);
});

test('HU01 — Control de permisos y acceso según el rol', () => {
  // Solicitante solo puede acceder a sus módulos autorizados
  assert.strictEqual(hasPermission(ROLES.SOLICITANTE, 'crear_solicitud'), true);
  assert.strictEqual(hasPermission(ROLES.SOLICITANTE, 'mis_solicitudes'), true);
  assert.strictEqual(hasPermission(ROLES.SOLICITANTE, 'priorizar_solicitudes'), false);
  assert.strictEqual(hasPermission(ROLES.SOLICITANTE, 'historial_auditoria'), false);

  // Coordinador
  assert.strictEqual(hasPermission(ROLES.COORDINADOR, 'priorizar_solicitudes'), true);
  assert.strictEqual(hasPermission(ROLES.COORDINADOR, 'asignar_solicitudes'), true);
  assert.strictEqual(hasPermission(ROLES.COORDINADOR, 'crear_solicitud'), false);

  // Agente
  assert.strictEqual(hasPermission(ROLES.AGENTE, 'registrar_comentarios'), true);
  assert.strictEqual(hasPermission(ROLES.AGENTE, 'cambiar_estado'), true);
  assert.strictEqual(hasPermission(ROLES.AGENTE, 'historial_auditoria'), false);

  // Auditor
  assert.strictEqual(hasPermission(ROLES.AUDITOR, 'historial_auditoria'), true);
  assert.strictEqual(hasPermission(ROLES.AUDITOR, 'priorizar_solicitudes'), false);
  assert.strictEqual(hasPermission(ROLES.AUDITOR, 'crear_solicitud'), false);
});
