/**
 * Controlador de Aplicacion para Frontend - MAR-Z
 * Soporta HU01 (Login/Roles), HU02 (Crear solicitudes), HU03 (Consultar mis solicitudes y detalle), HU04 (Priorizar), HU07 (Cambiar estado) y HU08 (Confirmar o reabrir solucion)
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

// Elementos DOM Asignacion (HU05)
const asignarSection = document.getElementById('asignar-section');
const asignarTbody = document.getElementById('asignar-tbody');
const asignarError = document.getElementById('asignar-error');
const asignarSuccess = document.getElementById('asignar-success');

// Elementos DOM Bandeja de Atencion y Notificaciones (HU05 - Agente)
const bandejaAtencionSection = document.getElementById('bandeja-atencion-section');
const bandejaTbody = document.getElementById('bandeja-tbody');
const notificacionesAgenteBox = document.getElementById('notificaciones-agente-box');

// Elementos DOM Detalle Asignacion (HU05)
const detAsignado = document.getElementById('det-asignado');
const detAsignadoPor = document.getElementById('det-asignado-por');
const detAsignadoFecha = document.getElementById('det-asignado-fecha');

// Elementos DOM Comentarios de Trabajo (HU06)
const comentariosLista = document.getElementById('comentarios-lista');
const comentarioNuevoFormContainer = document.getElementById('comentario-nuevo-form-container');
const comentarioNuevoTexto = document.getElementById('comentario-nuevo-texto');
const guardarComentarioBtn = document.getElementById('guardar-comentario-btn');
const comentarioError = document.getElementById('comentario-error');
const comentarioSuccess = document.getElementById('comentario-success');

// Elementos DOM Cambio de Estado (HU07)
const estadoAcciones = document.getElementById('estado-acciones');
const estadoError = document.getElementById('estado-error');
const estadoSuccess = document.getElementById('estado-success');
const estadoNuevo = document.getElementById('estado-nuevo');
const estadoMotivo = document.getElementById('estado-motivo');
const cambiarEstadoBtn = document.getElementById('cambiar-estado-btn');
const historialCambiosLista = document.getElementById('historial-cambios-lista');

// Elementos DOM Busqueda y Filtros (HU09)
const busquedaSection = document.getElementById('busqueda-section');
const busquedaTexto = document.getElementById('busqueda-texto');
const filtroEstado = document.getElementById('filtro-estado');
const filtroPrioridad = document.getElementById('filtro-prioridad');
const filtroCategoria = document.getElementById('filtro-categoria');
const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
const busquedaConteo = document.getElementById('busqueda-conteo');
const busquedaTbody = document.getElementById('busqueda-tbody');

// Elementos DOM Exportar reporte (HU12)
const exportarSection = document.getElementById('exportar-section');
const exportarError = document.getElementById('exportar-error');
const exportarSuccess = document.getElementById('exportar-success');
const btnExportarCsv = document.getElementById('btn-exportar-csv');

// Elementos DOM Historial de auditoria (HU11)
const auditoriaSection = document.getElementById('auditoria-section');
const auditoriaError = document.getElementById('auditoria-error');
const auditoriaTbody = document.getElementById('auditoria-tbody');

// Elementos DOM Indicadores (HU10)
const indicadoresSection = document.getElementById('indicadores-section');
const indFiltroEstado = document.getElementById('ind-filtro-estado');
const indFiltroPrioridad = document.getElementById('ind-filtro-prioridad');
const indFiltroCategoria = document.getElementById('ind-filtro-categoria');
const btnCalcularIndicadores = document.getElementById('btn-calcular-indicadores');
const indVolumenTotal = document.getElementById('ind-volumen-total');
const indTiempoMediano = document.getElementById('ind-tiempo-mediano');
const indDesgloseEstado = document.getElementById('ind-desglose-estado');
const indDesgloseCategoria = document.getElementById('ind-desglose-categoria');

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
  if (asignarSection) asignarSection.style.display = 'none';
  if (bandejaAtencionSection) bandejaAtencionSection.style.display = 'none';
  if (busquedaSection) busquedaSection.style.display = 'none';
  if (indicadoresSection) indicadoresSection.style.display = 'none';
  if (exportarSection) exportarSection.style.display = 'none';
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

  // Mostrar seccion HU05 (Asignar solicitudes) si tiene permiso
  if (asignarSection) {
    if (hasPermission(user.role, 'asignar_solicitudes')) {
      asignarSection.style.display = 'block';
      renderAsignarTabla();
    } else {
      asignarSection.style.display = 'none';
    }
  }

  // Mostrar seccion HU05 (Bandeja de atencion para agentes) si tiene permiso
  if (bandejaAtencionSection) {
    if (hasPermission(user.role, 'atender_solicitudes')) {
      bandejaAtencionSection.style.display = 'block';
      renderBandejaAtencion();
      renderNotificacionesAgente();
    } else {
      bandejaAtencionSection.style.display = 'none';
    }
  }

  // Mostrar seccion HU09 (Buscar y filtrar solicitudes) para todo usuario autenticado
  if (busquedaSection) {
    busquedaSection.style.display = 'block';
    ejecutarBusquedaYFiltro();
  }

  // Mostrar seccion HU10 (Indicadores de gestion) para el Coordinador
  if (indicadoresSection) {
    if (hasPermission(user.role, 'indicadores')) {
      indicadoresSection.style.display = 'block';
      cargarIndicadores();
    } else {
      indicadoresSection.style.display = 'none';
    }
  }

  // Mostrar seccion HU12 (Exportar reporte) para el Coordinador
  if (exportarSection) {
    exportarSection.style.display = hasPermission(user.role, 'exportar_reporte') ? 'block' : 'none';
  }

  // Mostrar seccion HU11 (Historial de auditoria) solo para el auditor
  if (auditoriaSection) {
    if (hasPermission(user.role, 'historial_auditoria')) {
      auditoriaSection.style.display = 'block';
      renderHistorialAuditoria(user);
    } else {
      auditoriaSection.style.display = 'none';
    }
  }

  if (solicitudDetalleSection) {
    solicitudDetalleSection.style.display = 'none';
  }
}

// HU11: Renderizar historial estructurado, sin motivos ni texto libre.
async function renderHistorialAuditoria(user) {
  if (!auditoriaTbody) return;

  auditoriaError.style.display = 'none';
  auditoriaTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-fg-muted);">Cargando historial...</td></tr>';
  const resultado = await consultarHistorialAuditoria(user);

  if (!resultado.success) {
    auditoriaTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-fg-muted);">No hay cambios registrados.</td></tr>';
    auditoriaError.textContent = resultado.error;
    auditoriaError.style.display = 'block';
    return;
  }

  if (resultado.historial.length === 0) {
    auditoriaTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-fg-muted);">No hay cambios registrados.</td></tr>';
    return;
  }

  auditoriaTbody.innerHTML = resultado.historial.map(registro => `
    <tr>
      <td>${escaparHtml(registro.solicitudId)}</td>
      <td>${escaparHtml(registro.actor)}</td>
      <td>${escaparHtml(new Date(registro.fecha).toLocaleString())}</td>
      <td>${escaparHtml(registro.campo)}</td>
      <td>${escaparHtml(registro.valorAnterior ?? '-')}</td>
      <td>${escaparHtml(registro.valorNuevo ?? '-')}</td>
    </tr>
  `).join('');
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
  mostrarAccionesEstado(s);
  await renderHistorialCambios(s.id);

  // HU05: Mostrar asignacion
  const asignacion = s.asignadoNombre
    ? `${s.asignadoNombre}`
    : (typeof obtenerAsignacionMemoria === 'function' && obtenerAsignacionMemoria(s.id)
        ? obtenerAsignacionMemoria(s.id).asignado_nombre
        : 'Sin asignar');

  const asignador = s.asignadoPor || (typeof obtenerAsignacionMemoria === 'function' && obtenerAsignacionMemoria(s.id)?.asignado_por) || '-';
  const fechaAsig = (s.asignadoEn || (typeof obtenerAsignacionMemoria === 'function' && obtenerAsignacionMemoria(s.id)?.asignado_en))
    ? new Date(s.asignadoEn || obtenerAsignacionMemoria(s.id).asignado_en).toLocaleString()
    : '-';

  if (detAsignado) detAsignado.textContent = asignacion;
  if (detAsignadoPor) detAsignadoPor.textContent = asignador;
  if (detAsignadoFecha) detAsignadoFecha.textContent = fechaAsig;

  // HU06: Renderizar comentarios de trabajo
  await renderComentariosDetalle(s.id);

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

// HU07: Mostrar solo el siguiente estado permitido al agente asignado.
function mostrarAccionesEstado(solicitud) {
  if (!estadoAcciones || !estadoNuevo) return;

  const siguientes = TRANSICIONES_PERMITIDAS[solicitud.estado] || [];

  estadoAcciones.style.display = currentUser && currentUser.role === 'agente' ? 'block' : 'none';
  estadoError.style.display = 'none';
  if (estadoSuccess) estadoSuccess.style.display = 'none';
  estadoMotivo.value = '';
  estadoNuevo.innerHTML = siguientes.length > 0
    ? siguientes.map(estado => `<option value="${estado}">${estado}</option>`).join('')
    : '<option value="">No hay transiciones permitidas</option>';
  cambiarEstadoBtn.disabled = siguientes.length === 0;
}

// HU07: Renderizar historial de cambios de estado en el detalle de la solicitud.
async function renderHistorialCambios(solicitudId) {
  if (!historialCambiosLista) return;

  const resultado = await consultarHistorialEstado(solicitudId);
  const historial = (resultado.success && Array.isArray(resultado.historial)) ? resultado.historial : [];

  if (historial.length === 0) {
    historialCambiosLista.innerHTML = '<p style="color: var(--color-fg-muted);">No hay cambios registrados aun.</p>';
    return;
  }

  historialCambiosLista.innerHTML = historial.map(h => {
    const motivoHtml = h.motivo
      ? `<div style="margin-top: 4px; font-style: italic; color: var(--color-fg-muted);">Motivo: ${escaparHtml(h.motivo)}</div>`
      : '';
    return `
      <div class="comment-card">
        <div class="comment-header">
          <div>
            <span class="comment-author">${escaparHtml(h.accion)}</span>
            <span class="role-badge" style="background-color: #24292f20; color: var(--color-fg-default);">${escaparHtml(h.usuarioId)}</span>
          </div>
          <span class="comment-date">${new Date(h.fecha).toLocaleString()}</span>
        </div>
        <div class="comment-body">
          <span class="tag-nuevo">${escaparHtml(h.estadoAnterior || '-')}</span>
          → <span class="tag-nuevo">${escaparHtml(h.estadoNuevo || '-')}</span>
          ${motivoHtml}
        </div>
      </div>
    `;
  }).join('');
}

// HU07: Persistir el cambio y refrescar estado actual y bandeja del agente.
if (cambiarEstadoBtn) {
  cambiarEstadoBtn.addEventListener('click', async () => {
    if (!currentUser || !solicitudEnDetalleId) return;

    estadoError.style.display = 'none';
    if (estadoSuccess) estadoSuccess.style.display = 'none';
    cambiarEstadoBtn.disabled = true;
    const nuevoEstado = estadoNuevo.value;
    const resultado = await cambiarEstado(solicitudEnDetalleId, nuevoEstado, currentUser, estadoMotivo.value);
    cambiarEstadoBtn.disabled = false;

    if (!resultado.success) {
      estadoError.textContent = resultado.error;
      estadoError.style.display = 'block';
      return;
    }

    if (estadoSuccess) {
      estadoSuccess.textContent = `Estado actualizado a "${nuevoEstado}" exitosamente.`;
      estadoSuccess.style.display = 'block';
    }

    await renderBandejaAtencion();
    await window.verDetalle(solicitudEnDetalleId);
  });
}

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

// ==========================================================
// HU05 — ASIGNAR SOLICITUDES & BANDEJA DE ATENCION (Dev 1)
// ==========================================================

// HU05: Renderizar tabla de asignacion de solicitudes para el Coordinador
async function renderAsignarTabla() {
  if (!currentUser || !asignarTbody) return;
  if (asignarError) asignarError.style.display = 'none';

  // 1. Obtener lista de agentes activos
  const agentesRes = await consultarAgentesActivos();
  const agentesActivos = (agentesRes.success && Array.isArray(agentesRes.agentes)) ? agentesRes.agentes : [];

  // 2. Obtener lista de solicitudes
  const solicitudesRes = await consultarSolicitudesParaPriorizar(currentUser);
  const solicitudes = (solicitudesRes.success && Array.isArray(solicitudesRes.solicitudes)) ? solicitudesRes.solicitudes : [];

  if (solicitudes.length === 0) {
    asignarTbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--color-fg-muted);">No hay solicitudes disponibles para asignacion.</td>
      </tr>
    `;
    return;
  }

  asignarTbody.innerHTML = solicitudes.map(s => {
    const asignacionActual = s.asignadoNombre
      ? `<strong>${escaparHtml(s.asignadoNombre)}</strong>`
      : (typeof obtenerAsignacionMemoria === 'function' && obtenerAsignacionMemoria(s.id)
          ? `<strong>${escaparHtml(obtenerAsignacionMemoria(s.id).asignado_nombre)}</strong>`
          : '<span style="color: var(--color-fg-muted);">Sin asignar</span>');

    const asignadoPor = s.asignadoPor || (typeof obtenerAsignacionMemoria === 'function' && obtenerAsignacionMemoria(s.id)?.asignado_por) || '-';

    const opcionesAgentes = [
      '<option value="">-- Seleccionar agente activo --</option>'
    ].concat(
      agentesActivos.map(a => `<option value="${a.id}">${escaparHtml(a.nombre)} (${a.role})</option>`)
    ).join('');

    const estaCerrada = s.estado === 'Cerrado';

    return `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>${escaparHtml(s.titulo)}</td>
        <td><span class="tag-nuevo">${s.estado}</span></td>
        <td>${asignacionActual}</td>
        <td>${asignadoPor}</td>
        <td style="text-align: right;">
          ${estaCerrada
            ? '<span style="color: var(--color-fg-muted);">Solicitud cerrada</span>'
            : `
              <select id="asignar-agente-${s.id}">${opcionesAgentes}</select>
              <button class="btn btn-default btn-sm" onclick="ejecutarAsignacion('${s.id}')">Asignar</button>
            `
          }
        </td>
      </tr>
    `;
  }).join('');
}

// HU05: Ejecutar la asignacion a un agente
window.ejecutarAsignacion = async function(solicitudId) {
  if (!currentUser) return;
  if (asignarError) asignarError.style.display = 'none';
  if (asignarSuccess) asignarSuccess.style.display = 'none';

  const selectAgente = document.getElementById(`asignar-agente-${solicitudId}`);
  if (!selectAgente || !selectAgente.value) {
    if (asignarError) {
      asignarError.textContent = 'Debe seleccionar un agente activo de la lista.';
      asignarError.style.display = 'block';
    }
    return;
  }

  const agenteId = selectAgente.value;
  const resultado = await asignarSolicitud(solicitudId, agenteId, currentUser);

  if (!resultado.success) {
    if (asignarError) {
      asignarError.textContent = resultado.error;
      asignarError.style.display = 'block';
    }
    return;
  }

  if (asignarSuccess) {
    asignarSuccess.textContent = `Solicitud ${solicitudId} asignada con exito a ${resultado.solicitud.asignadoNombre}. Notificacion enviada al agente.`;
    asignarSuccess.style.display = 'block';
  }

  await renderAsignarTabla();
};

// HU05: Renderizar bandeja de atencion con solicitudes asignadas al agente
async function renderBandejaAtencion() {
  if (!currentUser || !bandejaTbody) return;

  const resultado = await consultarSolicitudesAsignadas(currentUser);
  const solicitudes = (resultado.success && Array.isArray(resultado.solicitudes)) ? resultado.solicitudes : [];

  if (solicitudes.length === 0) {
    bandejaTbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--color-fg-muted);">No tiene solicitudes asignadas actualmente.</td>
      </tr>
    `;
    return;
  }

  bandejaTbody.innerHTML = solicitudes.map(s => {
    const fechaAsig = s.asignadoEn ? new Date(s.asignadoEn).toLocaleString() : new Date(s.fecha).toLocaleString();
    return `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>${escaparHtml(s.categoria)}</td>
        <td>${escaparHtml(s.titulo)}</td>
        <td><span class="tag-nuevo">${s.estado}</span></td>
        <td>${fechaAsig}</td>
        <td style="text-align: right;">
          <button class="btn btn-default btn-sm" onclick="verDetalle('${s.id}')">Atender / Detalle</button>
        </td>
      </tr>
    `;
  }).join('');
}

// HU05: Mostrar alertas de notificaciones recientes para el agente
async function renderNotificacionesAgente() {
  if (!currentUser || !notificacionesAgenteBox) return;

  const resultado = await consultarNotificaciones(currentUser.id);
  const notificaciones = (resultado.success && Array.isArray(resultado.notificaciones)) ? resultado.notificaciones : [];
  const noLeidas = notificaciones.filter(n => !n.leido);

  if (noLeidas.length > 0) {
    notificacionesAgenteBox.innerHTML = `
      🔔 <strong>Notificaciones de asignacion:</strong> Tiene ${noLeidas.length} nueva(s) solicitud(es) asignada(s).
      <ul style="margin-top: 6px; padding-left: 20px;">
        ${noLeidas.slice(0, 3).map(n => `<li>${escaparHtml(n.mensaje)} <small>(${new Date(n.fecha).toLocaleTimeString()})</small></li>`).join('')}
      </ul>
    `;
    notificacionesAgenteBox.style.display = 'block';
  } else {
    notificacionesAgenteBox.style.display = 'none';
  }
}

// ==========================================================
// HU06 — REGISTRAR COMENTARIOS DE TRABAJO (Dev 2)
// ==========================================================

// HU06: Renderizar lista de comentarios en el detalle de la solicitud
async function renderComentariosDetalle(solicitudId) {
  if (!comentariosLista) return;
  if (comentarioError) comentarioError.style.display = 'none';
  if (comentarioSuccess) comentarioSuccess.style.display = 'none';
  if (comentarioNuevoTexto) comentarioNuevoTexto.value = '';

  const resultado = await consultarComentarios(solicitudId, currentUser);
  const comentarios = (resultado.success && Array.isArray(resultado.comentarios)) ? resultado.comentarios : [];

  if (comentarios.length === 0) {
    comentariosLista.innerHTML = '<p style="color: var(--color-fg-muted);">No hay comentarios registrados aun.</p>';
  } else {
    comentariosLista.innerHTML = comentarios.map(c => `
      <div class="comment-card">
        <div class="comment-header">
          <div>
            <span class="comment-author">${escaparHtml(c.autorNombre)}</span>
            <span class="role-badge" style="background-color: #24292f20; color: var(--color-fg-default);">${escaparHtml(c.autorRol)}</span>
          </div>
          <span class="comment-date">${new Date(c.fecha).toLocaleString()}</span>
        </div>
        <div class="comment-body">${escaparHtml(c.contenido)}</div>
      </div>
    `).join('');
  }

  // Permitir agregar comentarios solo a agentes y coordinadores
  const puedeComentar = currentUser && (currentUser.role === 'agente' || currentUser.role === 'coordinador');
  if (comentarioNuevoFormContainer) {
    comentarioNuevoFormContainer.style.display = puedeComentar ? 'block' : 'none';
  }
}

// HU06: Evento para registrar nuevo comentario de trabajo
if (guardarComentarioBtn) {
  guardarComentarioBtn.addEventListener('click', async () => {
    if (!currentUser || !solicitudEnDetalleId) return;
    if (comentarioError) comentarioError.style.display = 'none';
    if (comentarioSuccess) comentarioSuccess.style.display = 'none';

    const texto = comentarioNuevoTexto ? comentarioNuevoTexto.value : '';
    guardarComentarioBtn.disabled = true;

    const resultado = await crearComentario(solicitudEnDetalleId, texto, currentUser);
    guardarComentarioBtn.disabled = false;

    if (!resultado.success) {
      if (comentarioError) {
        comentarioError.textContent = resultado.error;
        comentarioError.style.display = 'block';
      }
      return;
    }

    if (comentarioSuccess) {
      comentarioSuccess.textContent = 'Comentario registrado con exito. El registro es permanente e inmutable.';
      comentarioSuccess.style.display = 'block';
    }

    if (comentarioNuevoTexto) comentarioNuevoTexto.value = '';
    await renderComentariosDetalle(solicitudEnDetalleId);
  });
}

// ==========================================================
// HU09 — BUSCAR Y FILTRAR SOLICITUDES (Dev 1)
// ==========================================================

async function ejecutarBusquedaYFiltro() {
  if (!currentUser || !busquedaTbody) return;

  const filtros = {
    texto: busquedaTexto ? busquedaTexto.value.trim() : '',
    estado: filtroEstado ? filtroEstado.value : '',
    prioridad: filtroPrioridad ? filtroPrioridad.value : '',
    categoria: filtroCategoria ? filtroCategoria.value : ''
  };

  const resultado = await buscarYFiltrarSolicitudes(filtros, currentUser);
  const solicitudes = (resultado.success && Array.isArray(resultado.solicitudes)) ? resultado.solicitudes : [];

  if (busquedaConteo) {
    busquedaConteo.textContent = `${solicitudes.length} solicitud(es) encontrada(s)`;
  }

  if (solicitudes.length === 0) {
    busquedaTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--color-fg-muted);">No se encontraron solicitudes con los filtros aplicados.</td>
      </tr>
    `;
    return;
  }

  busquedaTbody.innerHTML = solicitudes.map(s => {
    const prio = s.prioridad || 'Sin prioridad';
    const fechaFormateada = new Date(s.fecha).toLocaleDateString();
    return `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>${escaparHtml(s.categoria)}</td>
        <td>${escaparHtml(s.titulo)}</td>
        <td><span class="tag-nuevo">${s.estado}</span></td>
        <td>${escaparHtml(prio)}</td>
        <td>${fechaFormateada}</td>
        <td style="text-align: right;">
          <button class="btn btn-default btn-sm" onclick="verDetalle('${s.id}')">Ver detalle</button>
        </td>
      </tr>
    `;
  }).join('');
}

if (btnAplicarFiltros) {
  btnAplicarFiltros.addEventListener('click', () => {
    ejecutarBusquedaYFiltro();
  });
}

if (btnLimpiarFiltros) {
  btnLimpiarFiltros.addEventListener('click', () => {
    if (busquedaTexto) busquedaTexto.value = '';
    if (filtroEstado) filtroEstado.value = '';
    if (filtroPrioridad) filtroPrioridad.value = '';
    if (filtroCategoria) filtroCategoria.value = '';
    ejecutarBusquedaYFiltro();
  });
}

// ==========================================================
// HU10 — INDICADORES DE GESTION (Dev 2)
// ==========================================================

async function cargarIndicadores() {
  if (!currentUser || !indicadoresSection) return;

  const filtros = {
    estado: indFiltroEstado ? indFiltroEstado.value : '',
    prioridad: indFiltroPrioridad ? indFiltroPrioridad.value : '',
    categoria: indFiltroCategoria ? indFiltroCategoria.value : ''
  };

  const resultado = await consultarIndicadores(filtros, currentUser);
  if (!resultado.success || !resultado.indicadores) {
    return;
  }

  const ind = resultado.indicadores;

  if (indVolumenTotal) {
    indVolumenTotal.textContent = ind.totalSolicitudes;
  }

  if (indTiempoMediano) {
    const cant = ind.tiempoMedianoCiclo.solicitudesComputadas;
    indTiempoMediano.textContent = `${ind.tiempoMedianoCiclo.valor} h (${cant} resueltas)`;
  }

  if (indDesgloseEstado) {
    const vol = ind.volumenPorEstado;
    indDesgloseEstado.innerHTML = `
      <div><strong>Nuevo:</strong> ${vol['Nuevo'] || 0}</div>
      <div><strong>En Proceso:</strong> ${vol['En Proceso'] || 0}</div>
      <div><strong>Resuelto:</strong> ${vol['Resuelto'] || 0}</div>
      <div><strong>Cerrado:</strong> ${vol['Cerrado'] || 0}</div>
    `;
  }

  if (indDesgloseCategoria) {
    const cats = ind.desglosePorCategoria;
    const lineas = Object.entries(cats).map(([cat, cant]) =>
      `<div><strong>${escaparHtml(cat)}:</strong> ${cant}</div>`
    );
    indDesgloseCategoria.innerHTML = lineas.length > 0 ? lineas.join('') : '<div>Sin datos</div>';
  }
}

if (btnCalcularIndicadores) {
  btnCalcularIndicadores.addEventListener('click', () => {
    cargarIndicadores();
  });
}



// ==========================================================
// HU12 — EXPORTAR REPORTE (Dev 4)
// ==========================================================

if (btnExportarCsv) {
  btnExportarCsv.addEventListener('click', async () => {
    exportarError.style.display = 'none';
    exportarSuccess.style.display = 'none';

    const filtros = {
      estado: indFiltroEstado ? indFiltroEstado.value : '',
      prioridad: indFiltroPrioridad ? indFiltroPrioridad.value : '',
      categoria: indFiltroCategoria ? indFiltroCategoria.value : ''
    };

    const resultado = await exportarReporte(filtros, currentUser);
    if (!resultado.success) {
      exportarError.textContent = resultado.error;
      exportarError.style.display = 'block';
      return;
    }

    const url = URL.createObjectURL(new Blob([resultado.csv], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte-marz-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);

    exportarSuccess.textContent = `Reporte exportado (${resultado.cantidad} solicitudes).`;
    exportarSuccess.style.display = 'block';
  });
}
