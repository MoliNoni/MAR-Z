# Sprint 3 — MAR-Z

## E1 — Encuentro

Revisamos el estado del sistema después del Sprint 2: ya existe la asignación, los comentarios, el cambio de estado y el cierre o reapertura de solicitudes, con historial compartido.

El objetivo de este tercer sprint es facilitar las consultas, los indicadores y la auditoría.

Historias:
- HU09
- HU10
- HU11
- HU12

Cambio controlado: el auditor necesita acceso de solo lectura al historial y el reporte debe excluir texto libre. Hay que revisar HU11 y HU12.

Resolución: se aprobaron HU09-HU12 y el cambio controlado. HU11 y HU12 se apoyan en datos ya existentes (`historial_solicitudes` y `solicitudes`), por lo que no requieren cambios en las historias anteriores.

## V — Vínculo

Antes de comenzar la construcción acordamos:
- Mantener los acuerdos de comunicación de los sprints anteriores.
- No modificar código ni tablas de historias de otros sprints sin avisar.
- Registrar en `supabase_setup.sql` los cambios de base de datos y verificar en Supabase que estén ejecutados.
- Respetar los permisos por rol en cada nueva consulta.

Resolución: se cumplieron los acuerdos. HU09 y HU12 reutilizan el filtro de búsqueda; HU12 agrega solo la tabla `exportaciones` (sección 8 de `supabase_setup.sql`), ejecutada y verificada en Supabase.

## C — Construcción

Durante el sprint se desarrollan HU09-HU12 y el cambio controlado.

La construcción debe cumplir los criterios de aceptación y la Definition of Done definida para el proyecto.

Resolución:
- HU09 (Dev 1): búsqueda y filtros combinables respetando permisos por rol. Completa.
- HU10 (Dev 2): volumen por estado y tiempo mediano de ciclo, sin rankings, solo coordinador. Completa.
- HU11 (Dev 3): pendiente.
- HU12 (Dev 4): exportación CSV solo para el coordinador, con lista blanca de columnas (sin texto libre ni credenciales), protección contra inyección de fórmulas, filtros aplicados y registro inmutable de cada exportación. Si el registro falla, no se entrega el CSV. Completa y verificada contra Supabase.

## R — Reflexión

Al terminar el trabajo revisaremos:
- Qué historias quedaron funcionando.
- Si el cambio controlado se aplicó sin afectar los sprints anteriores (regresión).
- Qué pruebas se realizaron.
- Qué problemas aparecieron.
- Qué trabajo tuvo que repetirse.
- Qué criterios todavía necesitan ajustes.

Resolución (parcial, pendiente HU11): HU09, HU10 y HU12 funcionan. Regresión automatizada 60/60 (`npm test`). Al verificar HU12 contra Supabase se detectó que las secciones 6 y 7 del Sprint 2 no estaban ejecutadas y que la sección 8 se había ejecutado sin sus políticas RLS; ambos casos se corrigieron. La columna `asignado_a` se retiró del reporte porque HU12 no la requiere.

## E2 — Evolución

A partir de la reflexión se definirán las acciones de mejora finales del proyecto.

Resolución (parcial): endurecer las políticas RLS (hoy permiten leer e insertar con la clave anónima) y proteger las contraseñas con hash, como ya se registró en el README.

## Evidencias

Se conservarán en el repositorio:
- Commits relacionados con el sprint.
- Pruebas realizadas (se encuentran en /tests).
- Cambios de base de datos (`supabase_setup.sql`, sección 8).
- Registro de tareas (`docs/backlog/tareas/SPRINT-3-TAREAS.md`).
- Registro de R y E2.
