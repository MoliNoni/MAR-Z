const test = require('node:test');
const assert = require('node:assert/strict');
const { esAuditor, consultarHistorialAuditoria } = require('../src/auditoria.js');

const auditor = { id: 'USR-04', role: 'auditor' };
const coordinador = { id: 'USR-02', role: 'coordinador' };

function clienteFalso() {
  return {
    from(tabla) {
      assert.equal(tabla, 'historial_solicitudes');
      return {
        select(columnas) {
          assert.ok(!columnas.includes('motivo'));
          return {
            order: async () => ({
              data: [{
                solicitud_id: 'SOL-1',
                accion: 'Cambiar estado',
                campo: 'estado',
                valor_anterior: 'Nuevo',
                valor_nuevo: 'En Proceso',
                usuario_id: 'USR-03',
                fecha: '2026-10-09T12:00:00Z'
              }],
                error: null
            })
          };
        }
      };
    }
  };
}

test('HU11 - Solo el auditor puede consultar el historial', async () => {
  assert.equal(esAuditor(auditor), true);
  assert.equal(esAuditor(coordinador), false);
  const resultado = await consultarHistorialAuditoria(coordinador, clienteFalso());
  assert.equal(resultado.success, false);
  assert.deepEqual(resultado.historial, []);
});

test('HU11 - Devuelve actor codificado, fecha, campo y valores sin texto libre', async () => {
  const resultado = await consultarHistorialAuditoria(auditor, clienteFalso());
  assert.equal(resultado.success, true);
  assert.deepEqual(resultado.historial[0], {
    solicitudId: 'SOL-1',
    accion: 'Cambiar estado',
    actor: 'USR-03',
    fecha: '2026-10-09T12:00:00Z',
    campo: 'estado',
    valorAnterior: 'Nuevo',
    valorNuevo: 'En Proceso'
  });
  assert.equal('motivo' in resultado.historial[0], false);
});