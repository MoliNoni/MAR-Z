-- MAR-Z: Script de configuracion para Supabase
-- Sprint 1: HU01 (Login y roles), HU02 (Crear solicitudes), HU03 (Mis solicitudes), HU04 (Priorizar)
-- Sprint 2: cambio controlado de prioridad Alta (HU04) y historial de solicitudes (HU08, compartido con HU07)
--
-- Instrucciones:
-- 1. Ve a tu panel de Supabase: https://supabase.com/dashboard/project/wioavzcdnrecmkqoxwqd
-- 2. Entra a "SQL Editor" en el menu lateral izquierdo.
-- 3. Haz clic en "New query", pega este codigo y presiona "Run".

-- 1. Crear tabla de usuarios (HU01)
create table if not exists public.usuarios (
  id text primary key,
  email text unique not null,
  password text not null,
  nombre text not null,
  rol text not null
);

-- 2. Crear tabla de solicitudes (HU02 y HU03)
create table if not exists public.solicitudes (
  id text primary key,
  titulo text not null,
  descripcion text not null,
  categoria text not null,
  estado text not null default 'Nuevo',
  fecha timestamptz not null default now(),
  ultima_actualizacion timestamptz not null default now(),
  propietario_id text not null,
  propietario_nombre text not null,
  propietario_email text not null
);

-- 2.1 Campos de prioridad y trazabilidad (HU04)
alter table public.solicitudes add column if not exists prioridad text;
alter table public.solicitudes add column if not exists prioridad_actualizada_por text;
alter table public.solicitudes add column if not exists prioridad_actualizada_en timestamptz;

-- 2.2 Cambio controlado Sprint 2: la prioridad Alta exige justificacion y fecha objetivo (HU04)
alter table public.solicitudes add column if not exists prioridad_justificacion text;
alter table public.solicitudes add column if not exists prioridad_fecha_objetivo date;

-- 3. Habilitar politicas de seguridad (RLS)
alter table public.usuarios enable row level security;
alter table public.solicitudes enable row level security;

-- Politica para usuarios: lectura permitida
drop policy if exists "Permitir lectura de usuarios" on public.usuarios;
create policy "Permitir lectura de usuarios"
  on public.usuarios for select
  using (true);

-- Politica para solicitudes: permitir lectura e insercion con la clave anonima
drop policy if exists "Permitir todo en solicitudes" on public.solicitudes;
create policy "Permitir todo en solicitudes"
  on public.solicitudes for all
  using (true)
  with check (true);

-- 4. Insertar los usuarios predefinidos del proyecto
insert into public.usuarios (id, email, password, nombre, rol) values
  ('USR-01', 'solicitante@marz.com', 'password123', 'Carlos Solicitante', 'solicitante'),
  ('USR-02', 'coordinador@marz.com', 'password123', 'Ana Coordinadora', 'coordinador'),
  ('USR-03', 'agente@marz.com', 'password123', 'Mario Agente', 'agente'),
  ('USR-04', 'auditor@marz.com', 'password123', 'Elena Auditora', 'auditor')
on conflict (id) do update set
  email = excluded.email,
  password = excluded.password,
  nombre = excluded.nombre,
  rol = excluded.rol;

-- 5. Historial de acciones sobre solicitudes (Sprint 2 - HU08: confirmar o reabrir solucion)
create table if not exists public.historial_solicitudes (
  id bigint generated always as identity primary key,
  solicitud_id text not null references public.solicitudes(id) on delete cascade,
  accion text not null,
  estado_anterior text,
  estado_nuevo text,
  motivo text,
  usuario_id text not null,
  fecha timestamptz not null default now()
);

alter table public.historial_solicitudes enable row level security;

-- El historial solo admite lectura e insercion (no se edita ni se borra)
drop policy if exists "Leer historial de solicitudes" on public.historial_solicitudes;
create policy "Leer historial de solicitudes"
  on public.historial_solicitudes for select
  using (true);

drop policy if exists "Insertar historial de solicitudes" on public.historial_solicitudes;
create policy "Insertar historial de solicitudes"
  on public.historial_solicitudes for insert
  with check (true);

-- 6. Asignacion de solicitudes y notificaciones (Sprint 2 - HU05: Asignar solicitudes)
-- 6.1 Estado activo para usuarios (validar agente activo)
alter table public.usuarios add column if not exists activo boolean not null default true;

-- 6.2 Campos de asignacion en solicitudes
alter table public.solicitudes add column if not exists asignado_a text;
alter table public.solicitudes add column if not exists asignado_nombre text;
alter table public.solicitudes add column if not exists asignado_por text;
alter table public.solicitudes add column if not exists asignado_en timestamptz;

-- 6.3 Tabla de notificaciones para agentes
create table if not exists public.notificaciones (
  id bigint generated always as identity primary key,
  solicitud_id text not null references public.solicitudes(id) on delete cascade,
  destinatario_id text not null,
  remitente_id text not null,
  mensaje text not null,
  leido boolean not null default false,
  fecha timestamptz not null default now()
);

alter table public.notificaciones enable row level security;

drop policy if exists "Permitir todo en notificaciones" on public.notificaciones;
create policy "Permitir todo en notificaciones"
  on public.notificaciones for all
  using (true)
  with check (true);

-- 7. Comentarios de trabajo sobre solicitudes (Sprint 2 - HU06: Registrar comentarios)
create table if not exists public.comentarios (
  id bigint generated always as identity primary key,
  solicitud_id text not null references public.solicitudes(id) on delete cascade,
  autor_id text not null,
  autor_nombre text not null,
  autor_rol text not null,
  contenido text not null,
  fecha timestamptz not null default now()
);

alter table public.comentarios enable row level security;

-- Los comentarios solo permiten lectura e insercion (inmutables: no se editan ni se eliminan)
drop policy if exists "Leer comentarios" on public.comentarios;
create policy "Leer comentarios"
  on public.comentarios for select
  using (true);

drop policy if exists "Insertar comentarios" on public.comentarios;
create policy "Insertar comentarios"
  on public.comentarios for insert
  with check (true);

