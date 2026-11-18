-- =========================================================================
-- ESQUEMA SQL PARA SUPABASE (Proyecto: rhpjlzqndxzpbodjvgcc)
-- Ejecuta este script en el SQL Editor de tu panel de Supabase:
-- https://supabase.com/dashboard/project/rhpjlzqndxzpbodjvgcc/sql/new
-- =========================================================================

-- 1. TABLA: proyectos (Portafolio de Trabajos Recientes)
CREATE TABLE IF NOT EXISTS public.proyectos (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  categoria TEXT DEFAULT 'Climatización',
  descripcion TEXT DEFAULT '',
  imagen_url TEXT DEFAULT '',
  ubicacion TEXT DEFAULT 'Andalucía',
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas RLS para proyectos
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de proyectos" ON public.proyectos;
CREATE POLICY "Lectura pública de proyectos" ON public.proyectos 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción pública de proyectos" ON public.proyectos;
CREATE POLICY "Inserción pública de proyectos" ON public.proyectos 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualización de proyectos" ON public.proyectos;
CREATE POLICY "Actualización de proyectos" ON public.proyectos 
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Eliminación de proyectos" ON public.proyectos;
CREATE POLICY "Eliminación de proyectos" ON public.proyectos 
  FOR DELETE USING (true);


-- 2. TABLA: resenas (Opiniones y Calificaciones de Clientes)
CREATE TABLE IF NOT EXISTS public.resenas (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  calificacion INT DEFAULT 5,
  comentario TEXT NOT NULL,
  ciudad TEXT DEFAULT '',
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas RLS para resenas
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de reseñas" ON public.resenas;
CREATE POLICY "Lectura pública de reseñas" ON public.resenas 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción pública de reseñas" ON public.resenas;
CREATE POLICY "Inserción pública de reseñas" ON public.resenas 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Eliminación de reseñas" ON public.resenas;
CREATE POLICY "Eliminación de reseñas" ON public.resenas 
  FOR DELETE USING (true);


-- 3. TABLA: leads_clientes (Llamadas Urgentes y Avisos Web)
CREATE TABLE IF NOT EXISTS public.leads_clientes (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT DEFAULT 'Cliente Web',
  telefono TEXT NOT NULL,
  problema TEXT DEFAULT '',
  urgencia TEXT DEFAULT 'Alta',
  origen TEXT DEFAULT 'Web Cliente',
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas RLS para leads_clientes
ALTER TABLE public.leads_clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de leads" ON public.leads_clientes;
CREATE POLICY "Lectura de leads" ON public.leads_clientes 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción de leads" ON public.leads_clientes;
CREATE POLICY "Inserción de leads" ON public.leads_clientes 
  FOR INSERT WITH CHECK (true);

-- Habilitar Realtime para las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.proyectos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resenas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads_clientes;
