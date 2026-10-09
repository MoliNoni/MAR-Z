# Sprint 3 — Tareas

## HU09 — Buscar y filtrar solicitudes
Responsable: Dev 1

- [x] Implementar búsqueda por título y descripción.
- [x] Implementar filtro por estado.
- [x] Implementar filtro por prioridad.
- [x] Implementar filtro por categoría.
- [x] Permitir combinar filtros.
- [x] Respetar los permisos del usuario.
- [x] Probar búsquedas y combinaciones de filtros.

## HU10 — Indicadores
Responsable: Dev 2

- [x] Preparar consultas para los indicadores.
- [x] Calcular volumen por estado.
- [x] Calcular tiempo mediano de ciclo.
- [x] Implementar filtros por estado, prioridad y categoría.
- [x] Mostrar los indicadores en la interfaz.
- [x] Evitar rankings individuales.
- [x] Verificar los eventos necesarios para los cálculos.
- [x] Probar resultados con datos de prueba.

## HU11 — Historial de auditoría
Responsable: Dev 3

- [x] Preparar consulta del historial.
- [x] Mostrar actor codificado.
- [x] Mostrar fecha y campo afectado.
- [x] Mostrar valor anterior y nuevo.
- [x] Restringir acceso al auditor.
- [x] Mantener el historial en modo lectura.
- [x] Probar permisos y trazabilidad.

## HU12 — Exportar reporte
Responsable: Dev 4

- [x] Implementar exportación CSV.
- [x] Aplicar los filtros seleccionados.
- [x] Excluir credenciales.
- [x] Excluir texto libre innecesario.
- [x] Registrar cada exportación.
- [x] Probar contenido y filtros del CSV.

## Cambio controlado del Sprint 3

- [x] Ajustar HU11 para el acceso de solo lectura del auditor.
- [x] Ajustar HU12 para excluir texto libre.
- [ ] Ejecutar regresión de Sprint 1 y Sprint 2.

Notas de avance Sprint 3 (HU09 y HU10):
- HU09: Busqueda flexible por texto en titulo y descripcion (`filtrarSolicitudes` en `src/busqueda.js`). Filtros combinables por estado, prioridad y categoria. Aislamiento segun permisos: solicitante solo busca sus solicitudes, agentes sus asignadas, coordinadores y auditores todas.
- HU10: Indicadores agregados del servicio (`calcularIndicadores`, `consultarIndicadores` en `src/indicadores.js`) calculando volumen por estado y tiempo mediano de ciclo en horas. Filtros por estado, prioridad y categoria. Ausencia estricta de rankings individuales o metricas por agente. Restringido al coordinador.
- Regresion automatizada: 55/55 pruebas OK (`npm test`), incluyendo suites completas para HU09 y HU10.
- HU12: `exportarReporte` en `src/exportacion.js`. Solo coordinador. CSV con lista blanca de columnas (id, categoria, estado, prioridad, fecha objetivo, fechas); sin titulo, descripcion, justificacion, nombres, emails ni contrasenas. Valores escapados y protegidos contra inyeccion de formulas. Usa los filtros de estado, prioridad y categoria. Cada exportacion se registra en `exportaciones` (seccion 8 de `supabase_setup.sql`); si el registro falla, no se entrega el CSV.
- Regresion automatizada (2026-10-05): 60/60 pruebas OK (`npm test`). Seccion 8 ejecutada en Supabase y verificada: la exportacion se registra y el registro no se puede editar ni borrar. Se retiro `asignado_a` del CSV (no requerido por HU12).

## Trabajo conjunto

- [ ] Integrar HU09-HU12.
- [ ] Ejecutar regresión completa.
- [ ] Revisar las 12 historias.
- [ ] Revisar criterios de aceptación.
- [ ] Registrar defectos y retrabajo.
- [ ] Preparar evidencias finales de R y E2.
- [ ] Verificar Definition of Done.