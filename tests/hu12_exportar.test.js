const test = require('node:test');
const assert = require('node:assert/strict');
const { generarCSV, exportarReporte } = require('../src/exportacion.js');

const coordinador = { id: 'USR-02', role: 'coordinador' };
const auditor = { id: 'USR-04', role: 'auditor' };

const datos = [
  { id: 'SOL-1', titulo: 'secreto', descripcion: 'texto libre', propietario_email: 'a@b.com', password: 'x', categoria: 'Software', estado: 'Nuevo', prioridad: 'Alta', fecha: '2026-10-01' },
  { id: 'SOL-2', categoria: 'Hardware', estado: 'Cerrado', prioridad: 'Baja', fecha: '2026-10-02' }
];

// Cliente falso: devuelve `datos` y guarda lo insertado en `log`
function clienteFalso({ falloLog = false } = {}) {
  const log = [];
  return {
    log,
    from(tabla) {
      if (tabla === 'exportaciones') {
        return { insert: async filas => { log.push(...filas); return { error: falloLog ? { message: 'x' } : null }; } };
      }
      return { select: () => ({ order: async () => ({ data: datos, error: null }) }) };
    }
  };
}

test('HU12 — CSV solo incluye columnas permitidas (sin credenciales ni texto libre)', () => {
  const csv = generarCSV(datos);
  assert.ok(csv.startsWith('id,categoria,estado,prioridad'));
  for (const prohibido of ['secreto', 'texto libre', 'a@b.com', 'password']) {
    assert.ok(!csv.includes(prohibido), prohibido);
  }
});

test('HU12 — CSV escapa comillas y neutraliza formulas', () => {
  const csv = generarCSV([{ id: '=HYPERLINK("x")', categoria: 'a"b' }]);
  assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));
  assert.ok(csv.includes('"a""b"'));
});

test('HU12 — Aplica filtros y registra la exportacion', async () => {
  const client = clienteFalso();
  const r = await exportarReporte({ estado: 'Cerrado' }, coordinador, client);
  assert.equal(r.success, true);
  assert.equal(r.cantidad, 1);
  assert.ok(r.csv.includes('SOL-2') && !r.csv.includes('SOL-1'));
  assert.deepEqual(client.log, [{ usuario_id: 'USR-02', filtros: { estado: 'Cerrado', prioridad: '', categoria: '' }, cantidad: 1 }]);
});

test('HU12 — Sin registro no hay exportacion', async () => {
  const r = await exportarReporte({}, coordinador, clienteFalso({ falloLog: true }));
  assert.equal(r.success, false);
  assert.equal(r.csv, undefined);
});

test('HU12 — Solo el coordinador puede exportar', async () => {
  const client = clienteFalso();
  assert.equal((await exportarReporte({}, auditor, client)).success, false);
  assert.equal((await exportarReporte({}, null, client)).success, false);
  assert.equal(client.log.length, 0);
});
