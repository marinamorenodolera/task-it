-- Fix check_section constraint to allow all GTD methodology sections
-- This script updates the constraint to allow all required section values

-- First, drop the existing constraint if it exists
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_section;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_section_check;

-- Create new constraint with all required section values
ALTER TABLE tasks ADD CONSTRAINT check_section 
CHECK (section IN (
    -- Daily sections from useTasks.js
    'big_three',
    'urgent', 
    'en_espera',
    'otras_tareas',
    'completadas',
    
    -- GTD methodology sections mentioned by user
    'inbox',
    'daily',
    'weekly', 
    'monthly',
    'shopping',
    'devoluciones',
    'someday',
    'waiting',
    'reference',
    
    -- Legacy/compatibility sections
    'today',
    'next_actions',
    'projects'
));

-- Verify the constraint was created successfully
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'check_section';