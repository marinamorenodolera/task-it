import { supabase } from '@/lib/supabase'

export const attachmentService = {
  // Subir archivo a Supabase Storage
  async uploadFile(file, userId, taskId) {
    try {
      console.log('🔧 Upload params:', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        userId, 
        taskId 
      })

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${userId}/${taskId}/${fileName}`

      console.log('📁 Upload path:', filePath)

      // Verificar si el bucket existe antes de subir
      console.log('🪣 Verificando bucket...')
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      console.log('🪣 Buckets disponibles:', buckets?.map(b => b.name))
      if (bucketError) console.error('🪣 Error listando buckets:', bucketError)

      console.log('✅ Bucket verificado, iniciando upload...')
      console.log('📤 Subiendo archivo:', filePath)
      console.log('📤 Tamaño del archivo:', file.size, 'bytes')
      
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file)

      console.log('🏁 Upload completado:', { data, error })

      if (error) {
        console.error('❌ Supabase upload error:')
        console.error('   Message:', error.message)
        console.error('   StatusCode:', error.statusCode)
        console.error('   Error:', error.error)
        console.error('   Hint:', error.hint)
        console.error('   Full error object:', JSON.stringify(error, null, 2))
        throw error
      }

      return { filePath: data.path, fileName: file.name, error: null }
    } catch (error) {
      console.error('❌ Error uploading file:', error)
      console.error('❌ Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
        hint: error.hint
      })
      return { filePath: null, fileName: null, error: error.message || 'Error desconocido en la subida' }
    }
  },

  // Obtener URL pública del archivo
  async getFileUrl(filePath) {
    try {
      const { data } = await supabase.storage
        .from('task-attachments')
        .createSignedUrl(filePath, 3600) // URL válida por 1 hora

      return data?.signedUrl || null
    } catch (error) {
      console.error('Error getting file URL:', error)
      return null
    }
  },

  // Eliminar archivo de Storage
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('task-attachments')
        .remove([filePath])

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error // Lanzar el error en lugar de retornarlo
    }
  },

  // Crear attachment en la base de datos
  async createAttachment(attachmentData) {
    try {
      const { data, error } = await supabase
        .from('task_attachments')
        .insert(attachmentData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating attachment:', error)
      return { data: null, error: error.message }
    }
  },

  // Obtener attachments de una tarea
  async getTaskAttachments(taskId) {
    try {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Para cada attachment que es archivo, obtener URL firmada
      const attachmentsWithUrls = await Promise.all(
        data.map(async (attachment) => {
          if (attachment.file_path) {
            const url = await this.getFileUrl(attachment.file_path)
            return { ...attachment, fileUrl: url }
          }
          return attachment
        })
      )

      return { data: attachmentsWithUrls, error: null }
    } catch (error) {
      console.error('Error getting task attachments:', error)
      return { data: [], error: error.message }
    }
  },

  // Eliminar attachment
  async deleteAttachment(attachmentId) {
    try {
      console.log('🗑️ Attempting to delete attachment:', attachmentId)
      
      // Primero obtener el attachment para saber si tiene archivo
      const { data: attachment, error: fetchError } = await supabase
        .from('task_attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching attachment:', fetchError)
        throw fetchError
      }

      console.log('📄 Attachment found:', attachment)

      // Si tiene archivo, eliminarlo del storage
      if (attachment.file_path) {
        console.log('🗂️ Deleting file from storage:', attachment.file_path)
        await this.deleteFile(attachment.file_path)
      }

      // Eliminar el registro de la base de datos
      console.log('🗑️ Deleting attachment from database')
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachmentId)

      if (error) {
        console.error('❌ Database deletion error:', error)
        throw error
      }
      
      console.log('✅ Attachment deleted successfully')
      return { error: null }
    } catch (error) {
      console.error('❌ Error deleting attachment:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      return { error: error.message || 'Error desconocido al eliminar attachment' }
    }
  },

  // Eliminar todos los attachments de una tarea
  async deleteTaskAttachments(taskId) {
    try {
      // Obtener todos los attachments de la tarea
      const { data: attachments, error: fetchError } = await supabase
        .from('task_attachments')
        .select('id, file_path')
        .eq('task_id', taskId)

      if (fetchError) throw fetchError

      // Eliminar archivos del storage
      const filePaths = attachments
        .filter(att => att.file_path)
        .map(att => att.file_path)

      if (filePaths.length > 0) {
        await supabase.storage
          .from('task-attachments')
          .remove(filePaths)
      }

      // Eliminar registros de la base de datos
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('task_id', taskId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting task attachments:', error)
      return { error: error.message }
    }
  },

  // Procesar y crear attachment (archivos y datos)
  async processAndCreateAttachment(attachmentData, userId, taskId) {
    try {
      // Validar que attachmentData existe
      if (!attachmentData) {
        return { data: null, error: 'No se proporcionaron datos de attachment' }
      }

      // Procesamos archivos con la estructura existente
      if (attachmentData?.file) {
        const uploadResult = await this.uploadFile(attachmentData.file, userId, taskId)
        if (uploadResult.error) {
          return { data: null, error: uploadResult.error }
        }

        const attachmentRecord = {
          task_id: taskId,
          user_id: userId,
          file_path: uploadResult.filePath,
          file_name: uploadResult.fileName,
          file_size: attachmentData.file.size,
          file_type: attachmentData.file.type
        }

        return await this.createAttachment(attachmentRecord)
      } else if (attachmentData.type && attachmentData.content) {
        // Manejar attachments que no son archivos (URL, nota, contacto, etc.)
        const { data, error } = await supabase
          .from('task_attachments')
          .insert({
            task_id: taskId,
            user_id: userId,
            type: attachmentData.type,
            title: attachmentData.title || `${attachmentData.type} attachment`,
            content: attachmentData.content,
            metadata: attachmentData.metadata || {}
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating text attachment:', error)
          return { data: null, error: error.message }
        }

        return { data, error: null }
      } else {
        return { data: null, error: 'No se proporcionó archivo ni datos válidos para subir' }
      }
    } catch (error) {
      console.error('Error processing attachment:', error)
      return { data: null, error: error.message }
    }
  }
}