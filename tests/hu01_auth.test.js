const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ROLES,
  ROLE_PERMISSIONS,
  INVALID_CREDENTIALS_MSG,
  authenticate,
  hasPermission,
  getRoleDetails
} = require('../src/auth.js');

test('HU01 — Modelo de Roles y Permisos', () => {
  assert.strictEqual(ROLES.SOLICITANTE, 'solicitante');
  assert.strictEqual(ROLES.COORDINADOR, 'coordinador');
  assert.strictEqual(ROLES.AGENTE, 'agente');
  assert.strictEqual(ROLES.AUDITOR, 'auditor');

  assert.ok(ROLE_PERMISSIONS[ROLES.SOLICITANTE]);
  assert.ok(ROLE_PERMISSIONS[ROLES.COORDINADOR]);
  assert.ok(ROLE_PERMISSIONS[ROLES.AGENTE]);
  assert.ok(ROLE_PERMISSIONS[ROLES.AUDITOR]);
});

test('HU01 — Autenticacion exitosa por rol contra base de datos Supabase', async () => {
  // Solicitante
  const resSol = await authenticate('solicitante@marz.com', 'password123');
  assert.strictEqual(resSol.success, true);
  assert.strictEqual(resSol.user.role, ROLES.SOLICITANTE);
  assert.strictEqual(resSol.user.password, undefined);

  // Coordinador
  const resCoord = await authenticate('coordinador@marz.com', 'password123');
  assert.strictEqual(resCoord.success, true);
  assert.strictEqual(resCoord.user.role, ROLES.COORDINADOR);

  // Agente
  const resAgente = await authenticate('agente@marz.com', 'password123');
  assert.strictEqual(resAgente.success, true);
  assert.strictEqual(resAgente.user.role, ROLES.AGENTE);

  // Auditor
  const resAuditor = await authenticate('auditor@marz.com', 'password123');
  assert.strictEqual(resAuditor.success, true);
  assert.strictEqual(resAuditor.user.role, ROLES.AUDITOR);
});

test('HU01 — No revelar informacion con credenciales incorrectas en Supabase', async () => {
  // Usuario no existente
  const resNoUser = await authenticate('inexistente@marz.com', 'password123');
  assert.strictEqual(resNoUser.success, false);
  assert.strictEqual(resNoUser.error, INVALID_CREDENTIALS_MSG);

  // Usuario existente pero clave incorrecta
  const resWrongPass = await authenticate('solicitante@marz.com', 'wrongpassword');
  assert.strictEqual(resWrongPass.success, false);
  assert.strictEqual(resWrongPass.error, INVALID_CREDENTIALS_MSG);

  // Campos vacios o nulos
  const resEmpty = await authenticate('', '');
  assert.strictEqual(resEmpty.success, false);
  assert.strictEqual(resEmpty.error, INVALID_CREDENTIALS_MSG);

  // Mismo mensaje exacto para evitar enumeracion de usuarios
  assert.strictEqual(resNoUser.error, resWrongPass.error);
});

test('HU01 — Control de permisos y acceso segun el rol', () => {
  // Solicitante solo puede acceder a sus modulos autorizados
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
