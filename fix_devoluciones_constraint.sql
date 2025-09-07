-- SCRIPT URGENTE: Añadir 'devoluciones' al constraint check_section
-- Ejecutar en Supabase Dashboard → SQL Editor

-- 1. Eliminar constraint actual
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_section;

-- 2. Crear nuevo constraint QUE INCLUYA 'devoluciones'
ALTER TABLE tasks ADD CONSTRAINT check_section 
CHECK (section = ANY (ARRAY[
    'big_three'::text, 
    'urgent'::text, 
    'otras_tareas'::text, 
    'en_espera'::text, 
    'completadas'::text, 
    'inbox_tasks'::text, 
    'shopping'::text, 
    'monthly'::text,
    'devoluciones'::text  -- ✅ AÑADIR ESTA LÍNEA
]));

-- 3. Verificar que se creó correctamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'check_section';