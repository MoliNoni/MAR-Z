/**
 * Controlador de Aplicacion para Frontend - MAR-Z
 * Soporta HU01 (Login/Roles), HU02 (Crear solicitudes), HU03 (Consultar mis solicitudes y detalle), HU04 (Priorizar) y HU08 (Confirmar o reabrir solucion)
 * Integrado con Supabase
 */

const MODULE_CATALOG = {
  crear_solicitud: {
    title: 'Crear solicitud',
    desc: 'Crear nuevas solicitudes de soporte con categoria, titulo y descripcion.'
  },
  mis_solicitudes: {
    title: 'Mis solicitudes',
    desc: 'Consultar unicamente las solicitudes propias, ver su estado y detalle.'
  },
  confirmar_solucion: {
    title: 'Confirmar o reabrir solucion',
    desc: 'Confirmar solicitudes resueltas o solicitar su reapertura con justificacion.'
  },
  priorizar_solicitudes: {
    title: 'Priorizar solicitudes',
    desc: 'Asignar nivel de prioridad a las solicitudes entrantes y ordenar la atencion.'
  },
  asignar_solicitudes: {
    title: 'Asignar solicitudes',
    desc: 'Asignar solicitudes de atencion a agentes activos del equipo.'
  },
  indicadores: {
    title: 'Indicadores de gestion',
    desc: 'Consultar metricas agregadas, tiempos de ciclo y volumen por estado.'
  },
  exportar_reporte: {
    title: 'Exportar reportes',
    desc: 'Generar y exportar reportes filtrados en formato CSV autorizado.'
  },
  atender_solicitudes: {
    title: 'Bandeja de atencion',
    desc: 'Consultar solicitudes asignadas para iniciar trabajo de soporte.'
  },
  registrar_comentarios: {
    title: 'Registrar comentarios',
    desc: 'Documentar avances y notas tecnicas inmutables de trabajo.'
  },
  cambiar_estado: {
    title: 'Cambiar estado',
    desc: 'Actualizar el flujo y estado de atencion de la solicitud.'
  },
  historial_auditoria: {
    title: 'Historial de auditoria',
    desc: 'Consulta de solo lectura de todas las acciones, cambios y decisiones.'
  }
};

const SESSION_STORAGE_KEY = 'marz_current_user';

// Elementos DOM Autenticacion
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logout-btn');

// Elementos DOM Dashboard
const welcomeName = document.getElementById('welcome-name');
const userDisplayName = document.getElementById('user-display-name');
const userDisplayRole = document.getElementById('user-display-role');
const roleDescription = document.getElementById('role-description');
const modulesContainer = document.getElementById('modules-container');

// Elementos DOM Solicitud Creacion (HU02)
const solicitudCrearSection = document.getElementById('solicitud-crear-section');
const solicitudForm = document.getElementById('solicitud-form');
const solicitudError = document.getElementById('solicitud-error');
const solicitudSuccess = document.getElementById('solicitud-success');
const solicitudCategoria = document.getElementById('solicitud-categoria');
const solicitudTitulo = document.getElementById('solicitud-titulo');
const solicitudDescripcion = document.getElementById('solicitud-descripcion');

// Elementos DOM Solicitud Listado y Detalle (HU03)
const solicitudListarSection = document.getElementById('solicitud-listar-section');
const solicitudesTbody = document.getElementById('solicitudes-tbody');
const solicitudDetalleSection = document.getElementById('solicitud-detalle-section');
const cerrarDetalleBtn = document.getElementById('cerrar-detalle-btn');
const detId = document.getElementById('det-id');
const detEstado = document.getElementById('det-estado');
const detCategoria = document.getElementById('det-categoria');
const detTitulo = document.getElementById('det-titulo');
const detDescripcion = document.getElementById('det-descripcion');
const detFecha = document.getElementById('det-fecha');
const detActualizacion = document.getElementById('det-actualizacion');
const detPropietario = document.getElementById('det-propietario');

// Elementos DOM Priorizacion (HU04)
const priorizarSection = document.getElementById('priorizar-section');
const priorizarTbody = document.getElementById('priorizar-tbody');
const priorizarError = document.getElementById('priorizar-error');

let currentUser = null;

// Inicializacion de sesion
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showDashboard(currentUser);
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      showLogin();
    }
  } else {
    showLogin();
  }
});

// Manejo de Login (HU01)
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const result = await authenticate(email, password);

  if (result.success) {
    currentUser = result.user;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));
    loginForm.reset();
    showDashboard(currentUser);
  } else {
    loginError.textContent = result.error;
    loginError.style.display = 'block';
  }
});

// Manejo de Logout (HU01)
logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  currentUser = null;
  if (solicitudDetalleSection) solicitudDetalleSection.style.display = 'none';
  showLogin();
});

// Mostrar vista de Login
function showLogin() {
  loginView.style.display = 'flex';
  dashboardView.style.display = 'none';
  loginError.style.display = 'none';
}

// Mostrar vista de Dashboard
function showDashboard(user) {
  loginView.style.display = 'none';
  dashboardView.style.display = 'block';

  welcomeName.textContent = user.name;
  userDisplayName.textContent = user.name;
  userDisplayRole.textContent = user.role;

  const roleDetails = getRoleDetails(user.role);
  if (roleDetails) {
    roleDescription.textContent = roleDetails.description;
  }

  // Renderizar modulos permitidos
  modulesContainer.innerHTML = '';
  if (roleDetails && Array.isArray(roleDetails.modules)) {
    roleDetails.modules.forEach(moduleKey => {
      const info = MODULE_CATALOG[moduleKey] || { title: moduleKey, desc: '' };
      const card = document.createElement('div');
      card.className = 'module-item';
      card.innerHTML = `
        <h3>${info.title}</h3>
        <p>${info.desc}</p>
      `;
      modulesContainer.appendChild(card);
    });
  }

  // Mostrar seccion HU02 (Crear solicitudes) si tiene permiso
  if (hasPermission(user.role, 'crear_solicitud')) {
    solicitudCrearSection.style.display = 'block';
  } else {
    solicitudCrearSection.style.display = 'none';
  }

  // Mostrar seccion HU03 (Consultar mis solicitudes) si tiene permiso
  if (hasPermission(user.role, 'mis_solicitudes')) {
    solicitudListarSection.style.display = 'block';
    renderMisSolicitudesTabla();
  } else {
    solicitudListarSection.style.display = 'none';
  }

  // Mostrar seccion HU04 (Priorizar solicitudes) si tiene permiso
  if (hasPermission(user.role, 'priorizar_solicitudes')) {
    priorizarSection.style.display = 'block';
    renderPriorizarTabla();
  } else {
    priorizarSection.style.display = 'none';
  }

  if (solicitudDetalleSection) {
    solicitudDetalleSection.style.display = 'none';
  }
}

// Manejo de Creacion de Solicitud (HU02)
solicitudForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  solicitudError.style.display = 'none';
  solicitudSuccess.style.display = 'none';

  if (!currentUser) {
    solicitudError.textContent = 'Debe iniciar sesion para crear una solicitud.';
    solicitudError.style.display = 'block';
    return;
  }

  const datos = {
    categoria: solicitudCategoria.value,
    titulo: solicitudTitulo.value,
    descripcion: solicitudDescripcion.value
  };

  const resultado = await crearSolicitud(datos, currentUser);

  if (resultado.success) {
    solicitudForm.reset();
    solicitudSuccess.textContent = `Solicitud ${resultado.solicitud.id} creada exitosamente con estado "${resultado.solicitud.estado}".`;
    solicitudSuccess.style.display = 'block';
    await renderMisSolicitudesTabla();
  } else {
    solicitudError.textContent = resultado.error;
    solicitudError.style.display = 'block';
  }
});

// Boton cerrar detalle (HU03)
cerrarDetalleBtn.addEventListener('click', () => {
  solicitudDetalleSection.style.display = 'none';
});

// HU03: Renderizar tabla de solicitudes propias del usuario
async function renderMisSolicitudesTabla() {
  if (!currentUser) return;

  const resultado = await consultarMisSolicitudes(currentUser);
  const misSolicitudes = resultado.solicitudes || [];

  if (misSolicitudes.length === 0) {
    solicitudesTbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--color-fg-muted);">No hay solicitudes registradas aun.</td>
      </tr>
    `;
    return;
  }

  solicitudesTbody.innerHTML = misSolicitudes.map(s => {
    const fechaActualizacion = new Date(s.ultimaActualizacion || s.fecha).toLocaleString();
    return `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>${s.categoria}</td>
        <td>${s.titulo}</td>
        <td><span class="tag-nuevo">${s.estado}</span></td>
        <td>${fechaActualizacion}</td>
        <td style="text-align: right;">
          <button class="btn btn-default btn-sm" onclick="verDetalle('${s.id}')">Ver detalle</button>
        </td>
      </tr>
    `;
  }).join('');
}

// HU03: Mostrar detalle de solicitud seleccionada
window.verDetalle = async function(solicitudId) {
  if (!currentUser) return;

  const resultado = await obtenerDetalleSolicitud(solicitudId, currentUser);

  if (!resultado.success) {
    alert(resultado.error);
    return;
  }

  const s = resultado.solicitud;
  detId.textContent = s.id;
  detEstado.innerHTML = `<span class="tag-nuevo">${s.estado}</span>`;
  detCategoria.textContent = s.categoria;
  detTitulo.textContent = s.titulo;
  detDescripcion.textContent = s.descripcion;
  detFecha.textContent = new Date(s.fecha).toLocaleString();
  detActualizacion.textContent = new Date(s.ultimaActualizacion || s.fecha).toLocaleString();
  detPropietario.textContent = `${s.propietario.nombre} (${s.propietario.email})`;
  mostrarAccionesSolucion(s);

  solicitudDetalleSection.style.display = 'block';
  solicitudDetalleSection.scrollIntoView({ behavior: 'smooth' });
};

// HU04: Renderizar tabla de solicitudes ordenadas para priorizar
async function renderPriorizarTabla() {
  if (!currentUser) return;
  priorizarError.style.display = 'none';

  const resultado = await consultarSolicitudesParaPriorizar(currentUser);

  if (!resultado.success) {
    priorizarError.textContent = resultado.error;
    priorizarError.style.display = 'block';
    return;
  }

  if (resultado.solicitudes.length === 0) {
    priorizarTbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--color-fg-muted);">No hay solicitudes registradas aun.</td>
      </tr>
    `;
    return;
  }

  priorizarTbody.innerHTML = resultado.solicitudes.map(s => {
    const opciones = ['<option value="">Sin prioridad</option>']
      .concat(PRIORIDADES.map(p => `<option value="${p}" ${p === s.prioridad ? 'selected' : ''}>${p}</option>`))
      .join('');
    const ultimoCambio = s.prioridadActualizadaEn
      ? `${s.prioridadActualizadaPor} - ${new Date(s.prioridadActualizadaEn).toLocaleString()}`
      : '-';
    // Cambio Sprint 2: justificacion y fecha objetivo, obligatorias solo para Alta
    return `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>${escaparHtml(s.titulo)}</td>
        <td><span class="tag-nuevo">${s.estado}</span></td>
        <td>${new Date(s.fecha).toLocaleString()}</td>
        <td>${ultimoCambio}</td>
        <td style="text-align: right;">
          <select id="prioridad-${s.id}">${opciones}</select>
          <input type="text" id="justificacion-${s.id}" placeholder="Justificacion (Alta)" value="${escaparHtml(s.prioridadJustificacion || '')}">
          <input type="date" id="fecha-objetivo-${s.id}" value="${s.prioridadFechaObjetivo || ''}">
          <button class="btn btn-default btn-sm" onclick="actualizarPrioridad('${s.id}')">Guardar</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Evita inyectar HTML con texto libre escrito por usuarios
function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML.replace(/"/g, '&quot;');
}

// HU04: Cambiar prioridad desde la tabla (con justificacion y fecha objetivo si es Alta)
window.actualizarPrioridad = async function(solicitudId) {
  if (!currentUser) return;
  priorizarError.style.display = 'none';

  const prioridad = document.getElementById(`prioridad-${solicitudId}`).value;
  const detalle = {
    justificacion: document.getElementById(`justificacion-${solicitudId}`).value,
    fechaObjetivo: document.getElementById(`fecha-objetivo-${solicitudId}`).value
  };

  const resultado = await cambiarPrioridad(solicitudId, prioridad, currentUser, detalle);

  if (!resultado.success) {
    priorizarError.textContent = resultado.error;
    priorizarError.style.display = 'block';
    return;
  }

  await renderPriorizarTabla();
};

// Elementos DOM Confirmar o reabrir solucion (HU08)
const solucionAcciones = document.getElementById('solucion-acciones');
const solucionError = document.getElementById('solucion-error');
const solucionSuccess = document.getElementById('solucion-success');
const solucionMotivo = document.getElementById('solucion-motivo');
const confirmarSolucionBtn = document.getElementById('confirmar-solucion-btn');
const reabrirSolicitudBtn = document.getElementById('reabrir-solicitud-btn');

let solicitudEnDetalleId = null;

// HU08: Mostrar acciones solo para solicitudes Resueltas del solicitante
function mostrarAccionesSolucion(solicitud) {
  solicitudEnDetalleId = solicitud.id;
  solucionError.style.display = 'none';
  solucionSuccess.style.display = 'none';
  solucionMotivo.value = '';

  const puedeActuar = hasPermission(currentUser.role, 'confirmar_solucion') && solicitud.estado === ESTADOS.RESUELTO;
  solucionAcciones.style.display = puedeActuar ? 'block' : 'none';
}

// HU08: Ejecuta la accion y refresca detalle y listado
async function ejecutarAccionSolucion(accion) {
  if (!currentUser || !solicitudEnDetalleId) return;
  solucionError.style.display = 'none';
  solucionSuccess.style.display = 'none';
  confirmarSolucionBtn.disabled = true;
  reabrirSolicitudBtn.disabled = true;

  const solicitudId = solicitudEnDetalleId;
  const resultado = await accion(solicitudId);

  confirmarSolucionBtn.disabled = false;
  reabrirSolicitudBtn.disabled = false;

  if (!resultado.success) {
    solucionError.textContent = resultado.error;
    solucionError.style.display = 'block';
    return;
  }

  await renderMisSolicitudesTabla();
  await window.verDetalle(solicitudId);
  solucionSuccess.textContent = `Solicitud ${solicitudId} actualizada a "${resultado.solicitud.estado}".`;
  solucionSuccess.style.display = 'block';
}

confirmarSolucionBtn.addEventListener('click', () => {
  ejecutarAccionSolucion(id => confirmarSolucion(id, currentUser));
});

reabrirSolicitudBtn.addEventListener('click', () => {
  ejecutarAccionSolucion(id => reabrirSolicitud(id, solucionMotivo.value, currentUser));
});
