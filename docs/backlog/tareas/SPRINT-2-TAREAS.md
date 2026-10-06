# Sprint 2 — Tareas

## HU05 — Asignar solicitudes
Responsable: Dev 1

- [x] Implementar asignación a agentes.
- [x] Validar que el agente esté activo.
- [x] Registrar quién asignó y cuándo.
- [x] Mostrar la asignación en la aplicación.
- [x] Notificar la asignación.
- [x] Probar asignaciones válidas e inválidas.

## HU06 — Registrar comentarios
Responsable: Dev 2

- [x] Crear modelo de comentarios.
- [x] Implementar creación de comentarios.
- [x] Validar que no estén vacíos.
- [x] Guardar autor y fecha.
- [x] Impedir edición después de crear.
- [x] Probar permisos y persistencia.

## HU07 — Cambiar estado
Responsable: Dev 3

- [x] Definir transiciones de estado permitidas.
- [x] Implementar cambio de estado.
- [x] Rechazar transiciones inválidas.
- [x] Registrar historial de cambios.
- [x] Mostrar estado actual.
- [x] Probar el flujo completo.
- [x] Usar la tabla compartida `historial_solicitudes` (creada en HU08, ver `supabase_setup.sql`) para el historial, con los campos `solicitud_id`, `accion`, `estado_anterior`, `estado_nuevo`, `motivo`, `usuario_id` y `fecha`. Tener en cuenta que HU08 ya hace las transiciones Resuelto → Cerrado (confirmar) y Resuelto → En Proceso (reabrir).

## HU08 — Confirmar o reabrir solución
Responsable: Dev 4

- [x] Implementar confirmación de solución.
- [x] Implementar reapertura.
- [x] Solicitar motivo al reabrir.
- [x] Registrar las acciones en el historial.
- [x] Validar permisos del solicitante.
- [x] Probar cierre y reapertura.

## Cambio controlado del Sprint 2
Heredado por ser responsable de dueño de HU04

- [x] Agregar justificación para prioridad Alta.
- [x] Agregar fecha objetivo para prioridad Alta.
- [x] Adaptar HU02.
- [x] Adaptar HU04.
- [x] Ejecutar regresión de Sprint 1.

Notas del cambio:
- Regla: al asignar prioridad Alta, la justificación es obligatoria y la fecha objetivo debe ser válida (YYYY-MM-DD) y no estar en el pasado (`validarDetallePrioridad` en `src/requests.js`).
- Al pasar a Media o Baja se limpian la justificación y la fecha objetivo.
- Base de datos: columnas `prioridad_justificacion` y `prioridad_fecha_objetivo` en `solicitudes` (sección 2.2 de `supabase_setup.sql`).
- HU02: la creación no cambia, porque el solicitante no asigna prioridad; los campos nuevos quedan vacíos al crear y el coordinador los completa en HU04.
- HU04: la tabla de priorización pide justificación y fecha objetivo y guarda con el botón "Guardar".
- Regresión Sprint 1 (2026-09-29): 18/18 OK tras ejecutar las secciones 2.2 y 5 de `supabase_setup.sql` en Supabase. Suite completa (`npm test`, incluye HU08): 23/23 OK.
- HU05 y HU06 (2026-10-03): Suite completa (`npm test`): 33/33 OK. HU05 valida agentes activos, asignación con trazabilidad de autor/fecha y notificaciones. HU06 asegura comentarios inmutables no vacíos con autor y fecha. Secciones 6 y 7 agregadas a `supabase_setup.sql`.

## Trabajo conjunto

- [x] Integrar HU05-HU08.
- [x] Ejecutar pruebas de regresión.
- [x] Revisar criterios de aceptación.
- [x] Registrar defectos y retrabajo.
- [x] Preparar evidencia de R y E2.
Cierre del Sprint 2 (2026-10-05): HU05-HU08 integradas sobre `historial_solicitudes`. Retrabajo: se ejecutaron en Supabase las secciones 6 y 7 que faltaban; verificado que asignaciones, notificaciones y comentarios persisten y que los comentarios no se pueden editar. Suite completa (`npm test`): OK.
