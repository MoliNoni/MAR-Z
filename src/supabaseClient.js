/**
 * Cliente de conexion con Supabase - MAR-Z
 */

const SUPABASE_URL = 'https://wioavzcdnrecmkqoxwqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpb2F2emNkbnJlY21rcW94d3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MzU0MTUsImV4cCI6MjEwNjExMTQxNX0.e_6XaqCpkfCfwp7uGqcAjzXRijT685VuLfv4Zn9g0Vk';

let client = null;

if (typeof window !== 'undefined' && window.supabase) {
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabaseClient = client;
} else if (typeof require !== 'undefined') {
  try {
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error('Error cargando @supabase/supabase-js:', err.message);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    supabaseClient: client
  };
}
