# Sprint 2 — MAR-Z

## E1 — Encuentro

Revisamos el estado del sistema después del Sprint 1: ya existe el acceso por rol, la creación, la consulta y la priorización de solicitudes.

El objetivo de este segundo sprint es poder asignar, atender y cerrar solicitudes de forma trazable.

Historias:
- HU05
- HU06
- HU07
- HU08

Cambio controlado: las solicitudes con prioridad Alta deben tener justificación y fecha objetivo. Hay que adaptar HU02 y HU04.

Resolución: Se aprobaron HU05-HU08 y el cambio controlado de prioridad Alta.

## V — Vínculo

Antes de comenzar la construcción acordamos:
- Mantener los acuerdos de comunicación del Sprint 1.
- Coordinar el historial de cambios, que comparten HU07 y HU08.
- Avisar antes de modificar archivos o tablas que usan otras historias.
- Aplicar el cambio controlado sin romper lo construido en el Sprint 1.
- Registrar en el repositorio los cambios de base de datos que haya que ejecutar en Supabase.

Resolución: Se cumplieron los acuerdos: el historial compartido se definio en HU08 y lo reutiliza HU07; los cambios de base de datos quedaron en `supabase_setup.sql` (secciones 2.2, 5, 6 y 7).

## C — Construcción

Durante el sprint se desarrollan HU05-HU08 y el cambio controlado de prioridad Alta.

Cada integrante trabaja principalmente en su historia asignada. Las historias de este sprint dependen entre sí (asignación, comentarios, estados y cierre de una misma solicitud), por lo que la integración requiere más coordinación que en el Sprint 1.

La construcción debe cumplir los criterios de aceptación y la Definition of Done definida para el proyecto.

Resolución: HU05-HU08 implementadas con sus pruebas en `/tests`. El cambio de prioridad Alta se aplico en HU04 sin modificar la creacion de HU02.

## R — Reflexión

Al terminar el trabajo revisaremos:
- Qué historias quedaron funcionando.
- Si el cambio controlado se aplicó sin afectar el Sprint 1 (regresión).
- Qué pruebas se realizaron.
- Qué problemas aparecieron.
- Qué trabajo tuvo que repetirse.
- Qué problemas de integración encontramos entre HU05-HU08.
- Qué criterios todavía necesitan ajustes.

Resolución: Las cuatro historias funcionan y la regresion del Sprint 1 paso tras aplicar el cambio controlado. Problemas de integracion: (1) el historial compartido entre HU07 y HU08 obligo a separar las transiciones (HU07: Nuevo → En Proceso → Resuelto; HU08: Resuelto → Cerrado / En Proceso); (2) las secciones 6 y 7 de `supabase_setup.sql` no se habian ejecutado en Supabase, por lo que asignaciones y comentarios no persistian aunque las pruebas pasaban (el codigo usaba memoria local). Se detecto y corrigio el 2026-10-05; verificado contra la base real.

## E2 — Evolución

A partir de la reflexión se definirán acciones concretas para el Sprint 3 (búsqueda, indicadores, auditoría y exportación).

Resolución: Para el Sprint 3: verificar contra Supabase real (no solo con pruebas) que cada seccion de `supabase_setup.sql` este ejecutada antes de cerrar una historia; reutilizar el historial y los filtros existentes; mantener una prueba automatizada por historia.

## Evidencias

Se conservarán en el repositorio:
- Commits relacionados con el sprint.
- Pruebas realizadas (se encuentran en /tests).
- Cambios de base de datos (`supabase_setup.sql`).
- Registro de tareas (`docs/backlog/tareas/SPRINT-2-TAREAS.md`).
- Registro de R y E2.
