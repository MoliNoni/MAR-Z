-- MAR-Z: Script de configuracion para Supabase
-- Sprint 1: HU01 (Login y roles), HU02 (Crear solicitudes), HU03 (Mis solicitudes), HU04 (Priorizar)
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
