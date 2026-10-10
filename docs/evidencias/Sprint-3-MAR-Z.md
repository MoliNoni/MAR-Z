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

Resolución: aprobamos las historias HU09 a HU12 y el cambio controlado. Para la auditoría (HU11) acordamos ampliar el historial existente, de modo que registre qué campo cambió y sus valores anterior y nuevo; las historias del Sprint 2 que escriben en el historial se ajustan para guardar esa información sin cambiar su funcionamiento. La exportación (HU12) trabaja sobre las solicitudes ya existentes.

## V — Vínculo

Antes de comenzar la construcción acordamos:
- Mantener los acuerdos de comunicación de los sprints anteriores.
- No modificar código ni tablas de historias de otros sprints sin avisar.
- Registrar en `supabase_setup.sql` los cambios de base de datos y verificar en Supabase que estén ejecutados.
- Respetar los permisos por rol en cada nueva consulta.

Resolución: mantuvimos los acuerdos de los sprints anteriores. La búsqueda (HU09) y la exportación (HU12) comparten los mismos filtros. La ampliación del historial se realizó dentro del cambio controlado aprobado en el Encuentro, y tanto ese cambio como la nueva tabla de exportaciones quedaron registrados en el script y aplicados en Supabase.

## C — Construcción

Durante el sprint se desarrollan HU09-HU12 y el cambio controlado.

La construcción debe cumplir los criterios de aceptación y la Definition of Done definida para el proyecto.

Resolución: cada integrante desarrolló su historia. La búsqueda permite combinar filtros respetando los permisos de cada rol; los indicadores muestran el volumen por estado y el tiempo de atención sin comparar personas; la auditoría ofrece al auditor un historial de solo lectura con quién hizo cada cambio, cuándo y qué valores se modificaron; y la exportación genera un reporte para el coordinador sin texto libre ni credenciales, dejando registro de cada descarga.

## R — Reflexión

Al terminar el trabajo revisaremos:
- Qué historias quedaron funcionando.
- Si el cambio controlado se aplicó sin afectar los sprints anteriores (regresión).
- Qué pruebas se realizaron.
- Qué problemas aparecieron.
- Qué trabajo tuvo que repetirse.
- Qué criterios todavía necesitan ajustes.

Resolución: las cuatro historias quedaron funcionando y el cambio controlado no afectó lo construido en los sprints anteriores: las pruebas automatizadas de las doce historias pasan correctamente. Al revisar la base de datos completamos algunos pasos del script de Supabase que estaban pendientes y retiramos del reporte un dato que HU12 no necesitaba.

## E2 — Evolución

A partir de la reflexión se definirán las acciones de mejora finales del proyecto.

Resolución: como mejoras finales del proyecto planteamos reforzar la seguridad de las tablas en Supabase y guardar las contraseñas cifradas con hash, tal como quedó registrado en el README.

## Evidencias

Se conservarán en el repositorio:
- Commits relacionados con el sprint.
- Pruebas realizadas (se encuentran en /tests).
- Cambios de base de datos (`supabase_setup.sql`, sección 5 para HU11 y sección 8 para HU12).
- Registro de tareas (`docs/backlog/tareas/SPRINT-3-TAREAS.md`).
- Registro de R y E2.
