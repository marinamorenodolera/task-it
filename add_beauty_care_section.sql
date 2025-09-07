-- SCRIPT: Añadir 'beauty_care' y 'devoluciones' al constraint check_section
-- Ejecutar en Supabase Dashboard → SQL Editor

-- 1. Eliminar constraint actual
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_section;

-- 2. Crear nuevo constraint con TODAS las secciones necesarias
ALTER TABLE tasks ADD CONSTRAINT check_section 
CHECK (section = ANY (ARRAY[
    -- Daily sections
    'big_three'::text,
    'urgent'::text, 
    'otras_tareas'::text,
    'en_espera'::text,
    'completadas'::text,
    
    -- Inbox sections
    'inbox_tasks'::text,
    'shopping'::text,
    'monthly'::text,
    'devoluciones'::text,      -- ✅ FALTABA ESTE
    'beauty_care'::text,       -- ✅ NUEVO: Beauty & Care
    
    -- Weekly/Other sections (por si acaso)
    'weekly'::text,
    'someday'::text,
    'waiting'::text,
    'reference'::text,
    'projects'::text,
    'next_actions'::text
]));

-- 3. Verificar que se creó correctamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'check_section';

-- El resultado debe incluir tanto 'devoluciones' como 'beauty_care'