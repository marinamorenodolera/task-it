-- Crear tabla para almacenar attachments de tareas
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'document', 'note', 'link', 'amount', 'location', 'contact', 'deadline')),
  title TEXT NOT NULL,
  content TEXT, -- Para notas, links, locations, contacts
  file_path TEXT, -- Para archivos en Supabase Storage
  file_name TEXT, -- Nombre original del archivo
  file_size BIGINT, -- Tamaño en bytes
  file_type TEXT, -- MIME type
  metadata JSONB, -- Para datos adicionales (amount, currency, phone, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_user_id ON task_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_type ON task_attachments(type);

-- RLS (Row Level Security)
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios attachments
CREATE POLICY "Users can view their own task attachments" ON task_attachments
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan insertar attachments en sus propias tareas
CREATE POLICY "Users can insert their own task attachments" ON task_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan actualizar sus propios attachments
CREATE POLICY "Users can update their own task attachments" ON task_attachments
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan eliminar sus propios attachments
CREATE POLICY "Users can delete their own task attachments" ON task_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_task_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_task_attachments_updated_at
  BEFORE UPDATE ON task_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_attachments_updated_at();