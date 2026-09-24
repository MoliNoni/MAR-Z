## Sprint 1

Objetivo: tener funcionando el acceso y el flujo básico de solicitudes.

- HU01 — Login y acceso según el rol — 5 pts — Dev 1
  - El usuario debe poder iniciar/cerrar sesión.
  - Cada rol solo puede entrar a lo que le corresponde.
  - No revelar si un usuario existe cuando las credenciales son incorrectas.

- HU02 — Crear solicitudes — 5 pts — Dev 2
  - Título, descripción y categoría obligatorios.
  - Generar ID, fecha, estado Nuevo y propietario.
  - Ojo: en Sprint 2 se agrega la regla de prioridad Alta.

- HU03 — Consultar mis solicitudes — 3 pts — Dev 3
  - El solicitante solo ve sus propias solicitudes.
  - Poder abrir el detalle.
  - Mostrar estado y última actualización.

- HU04 — Priorizar solicitudes — 3 pts — Dev 4
  - El coordinador puede cambiar la prioridad.
  - Registrar el cambio.
  - Poder ordenar por prioridad, estado y fecha.
  - Ojo: en Sprint 2 las prioridades Altas necesitan justificación y fecha objetivo.



## Sprint 2

Objetivo: poder asignar, atender y cerrar solicitudes de forma trazable.

- HU05 — Asignar solicitudes — 5 pts — Dev 1
  - Solo asignar a agentes activos.
  - Registrar quién asignó y cuándo.
  - Mostrar la asignación dentro de la aplicación.

- HU06 — Comentarios de trabajo — 3 pts — Dev 2
  - El comentario no puede estar vacío.
  - Guardar autor y fecha.
  - Una vez creado no se puede editar.

- HU07 — Cambiar estado — 5 pts — Dev 3
  - Solo permitir transiciones válidas.
  - Guardar todo el historial.
  - Rechazar cambios de estado inválidos.

- HU08 — Confirmar o reabrir solución — 5 pts — Dev 4
  - El solicitante puede aceptar una solicitud Resuelta.
  - También puede reabrirla indicando el motivo.
  - Todo queda registrado.

Cambio del Sprint 2:
Las solicitudes con prioridad Alta deben tener justificación y fecha objetivo. Hay que adaptar HU02 y HU04.


## Sprint 3

Objetivo: facilitar las consultas, los indicadores y la auditoría.

- HU09 — Buscar y filtrar solicitudes — 5 pts — Dev 1
  - Buscar por título y descripción.
  - Filtrar por estado, prioridad y categoría.
  - Respetar los permisos del usuario.

- HU10 — Indicadores — 8 pts — Dev 2
  - Volumen por estado.
  - Tiempo mediano de ciclo.
  - Filtros por estado, prioridad y categoría.
  - Nada de rankings individuales.
  - Registrar eventos necesarios para los indicadores.

- HU11 — Historial para auditoría — 5 pts — Dev 3
  - Solo lectura.
  - Mostrar actor codificado, fecha, campo y valores anterior/nuevo.
  - Solo accesible para el auditor.

- HU12 — Exportar reporte — 5 pts — Dev 4
  - Exportar CSV.
  - Aplicar los filtros seleccionados.
  - No incluir credenciales ni texto innecesario.
  - Registrar que se hizo la exportación.

Cambio del Sprint 3:
El auditor necesita acceso de solo lectura al historial y el reporte debe excluir texto libre. Revisar HU11 y HU12.