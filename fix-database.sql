-- Script para corregir la base de datos task_attachments
-- Ejecutar este script en el dashboard de Supabase

-- 1. Crear tabla task_attachments si no existe
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'document', 'note', 'link', 'amount', 'location', 'contact', 'deadline')),
  title TEXT NOT NULL,
  content TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_user_id ON task_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_type ON task_attachments(type);

-- 3. Habilitar RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS (eliminar existentes primero)
DROP POLICY IF EXISTS "Users can view their own task attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can insert their own task attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can update their own task attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can delete their own task attachments" ON task_attachments;

-- Política para SELECT
CREATE POLICY "Users can view their own task attachments" ON task_attachments
  FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT
CREATE POLICY "Users can insert their own task attachments" ON task_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE
CREATE POLICY "Users can update their own task attachments" ON task_attachments
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE
CREATE POLICY "Users can delete their own task attachments" ON task_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_task_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_task_attachments_updated_at ON task_attachments;
CREATE TRIGGER update_task_attachments_updated_at
  BEFORE UPDATE ON task_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_attachments_updated_at();

-- 7. Verificar que el bucket existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Políticas de storage
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Política para subir archivos
CREATE POLICY "Users can upload files to their own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para ver archivos
CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para eliminar archivos
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 9. Verificación final
SELECT 'task_attachments table created successfully' as status;