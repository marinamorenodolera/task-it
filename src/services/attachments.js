import { supabase } from '@/lib/supabase'

export const attachmentService = {
  // Subir archivo a Supabase Storage
  async uploadFile(file, userId, taskId) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${userId}/${taskId}/${fileName}`

      const { data, error } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file)

      if (error) throw error

      return { filePath: data.path, fileName: file.name, error: null }
    } catch (error) {
      console.error('Error uploading file:', error)
      return { filePath: null, fileName: null, error: error.message }
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
      return { error: error.message }
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
      // Primero obtener el attachment para saber si tiene archivo
      const { data: attachment, error: fetchError } = await supabase
        .from('task_attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single()

      if (fetchError) throw fetchError

      // Si tiene archivo, eliminarlo del storage
      if (attachment.file_path) {
        await this.deleteFile(attachment.file_path)
      }

      // Eliminar el registro de la base de datos
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachmentId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      return { error: error.message }
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

  // Procesar y crear attachment según el tipo
  async processAndCreateAttachment(attachmentData, userId, taskId) {
    try {
      const baseData = {
        task_id: taskId,
        user_id: userId,
        type: attachmentData.type,
        title: attachmentData.title,
        metadata: {}
      }

      switch (attachmentData.type) {
        case 'image':
        case 'document':
          // Para archivos, subir a Storage
          if (attachmentData.file) {
            const uploadResult = await this.uploadFile(attachmentData.file, userId, taskId)
            if (uploadResult.error) {
              return { data: null, error: uploadResult.error }
            }

            const attachmentRecord = {
              ...baseData,
              file_path: uploadResult.filePath,
              file_name: uploadResult.fileName,
              file_size: attachmentData.file.size,
              file_type: attachmentData.file.type
            }

            return await this.createAttachment(attachmentRecord)
          }
          break

        case 'note':
        case 'link':
        case 'location':
          const textAttachment = {
            ...baseData,
            content: attachmentData.content
          }
          return await this.createAttachment(textAttachment)

        case 'contact':
          const contactAttachment = {
            ...baseData,
            content: attachmentData.content,
            metadata: {
              phone: attachmentData.phone || null
            }
          }
          return await this.createAttachment(contactAttachment)

        case 'amount':
          const amountAttachment = {
            ...baseData,
            content: attachmentData.content,
            metadata: {
              amount: attachmentData.amount,
              currency: attachmentData.currency || 'EUR'
            }
          }
          return await this.createAttachment(amountAttachment)

        default:
          return { data: null, error: 'Tipo de attachment no soportado' }
      }
    } catch (error) {
      console.error('Error processing attachment:', error)
      return { data: null, error: error.message }
    }
  }
}