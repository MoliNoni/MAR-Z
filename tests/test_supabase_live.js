/**
 * Script de verificacion de conexion con Supabase
 * Ejecuta: node tests/test_supabase_live.js
 */

const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../src/supabaseClient.js');

async function testConnection() {
  console.log('Verificando conexion con Supabase...');
  console.log('URL:', SUPABASE_URL);

  try {
    // 1. Verificar tabla usuarios
    const resUsuarios = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?select=*`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (resUsuarios.status === 200) {
      const usuarios = await resUsuarios.json();
      console.log(`[OK] Tabla 'usuarios' encontrada con ${usuarios.length} registros.`);
    } else {
      console.log(`[PENDIENTE] La tabla 'usuarios' aun no esta creada o no tiene permisos (status: ${resUsuarios.status}).`);
      console.log('Recuerda ejecutar el script "supabase_setup.sql" en el SQL Editor de tu panel de Supabase.');
      return;
    }

    // 2. Verificar tabla solicitudes
    const resSolicitudes = await fetch(`${SUPABASE_URL}/rest/v1/solicitudes?select=*`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (resSolicitudes.status === 200) {
      const solicitudes = await resSolicitudes.json();
      console.log(`[OK] Tabla 'solicitudes' encontrada con ${solicitudes.length} registros.`);
      console.log('[EXITO] Supabase esta 100% configurado y listo para usar en MAR-Z.');
    } else {
      console.log(`[PENDIENTE] La tabla 'solicitudes' aun no esta lista (status: ${resSolicitudes.status}).`);
    }
  } catch (err) {
    console.error('Error de red al conectar con Supabase:', err.message);
  }
}

testConnection();
