-- Crear bucket para almacenar archivos de attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Política de storage para que usuarios puedan subir archivos a sus propias carpetas
CREATE POLICY "Users can upload files to their own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para que usuarios puedan ver sus propios archivos
CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para que usuarios puedan eliminar sus propios archivos
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );