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

- [ ] Preparar consulta del historial.
- [ ] Mostrar actor codificado.
- [ ] Mostrar fecha y campo afectado.
- [ ] Mostrar valor anterior y nuevo.
- [ ] Restringir acceso al auditor.
- [ ] Mantener el historial en modo lectura.
- [ ] Probar permisos y trazabilidad.

## HU12 — Exportar reporte
Responsable: Dev 4

- [ ] Implementar exportación CSV.
- [ ] Aplicar los filtros seleccionados.
- [ ] Excluir credenciales.
- [ ] Excluir texto libre innecesario.
- [ ] Registrar cada exportación.
- [ ] Probar contenido y filtros del CSV.

## Cambio controlado del Sprint 3

- [ ] Ajustar HU11 para el acceso de solo lectura del auditor.
- [ ] Ajustar HU12 para excluir texto libre.
- [ ] Ejecutar regresión de Sprint 1 y Sprint 2.

Notas de avance Sprint 3 (HU09 y HU10):
- HU09: Busqueda flexible por texto en titulo y descripcion (`filtrarSolicitudes` en `src/busqueda.js`). Filtros combinables por estado, prioridad y categoria. Aislamiento segun permisos: solicitante solo busca sus solicitudes, agentes sus asignadas, coordinadores y auditores todas.
- HU10: Indicadores agregados del servicio (`calcularIndicadores`, `consultarIndicadores` en `src/indicadores.js`) calculando volumen por estado y tiempo mediano de ciclo en horas. Filtros por estado, prioridad y categoria. Ausencia estricta de rankings individuales o metricas por agente. Restringido al coordinador.
- Regresion automatizada: 55/55 pruebas OK (`npm test`), incluyendo suites completas para HU09 y HU10.

## Trabajo conjunto

- [ ] Integrar HU09-HU12.
- [ ] Ejecutar regresión completa.
- [ ] Revisar las 12 historias.
- [ ] Revisar criterios de aceptación.
- [ ] Registrar defectos y retrabajo.
- [ ] Preparar evidencias finales de R y E2.
- [ ] Verificar Definition of Done.