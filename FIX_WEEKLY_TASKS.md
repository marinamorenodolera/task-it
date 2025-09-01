# FIX: Tareas desaparecen en vista semanal

## PROBLEMA IDENTIFICADO
Las tareas creadas en la vista semanal desaparecían después de cerrar TaskDetailScreen debido a:

1. **Campo `scheduled_date` no mapeado**: En `useTasks.js`, al cargar tareas desde la BD, el campo `scheduled_date` no se estaba mapeando al objeto de tarea local.

2. **Pérdida de campos al editar**: En `TaskDetailScreen`, al guardar cambios se enviaba el objeto `editedTask` completo que podía sobrescribir campos importantes como `scheduled_date`, `page` y `section`.

## SOLUCIONES APLICADAS

### 1. En `/src/hooks/useTasks.js` (línea 67):
```javascript
// ANTES: scheduled_date no se mapeaba
return {
  id: task.id,
  title: task.title,
  // ...otros campos
}

// DESPUÉS: scheduled_date se mapea correctamente
return {
  id: task.id,
  title: task.title,
  scheduled_date: task.scheduled_date, // IMPORTANTE: Mapear scheduled_date
  // ...otros campos
}
```

### 2. En `/src/components/tasks/TaskDetailScreen.jsx` (línea 733-746):
```javascript
// ANTES: Se enviaba todo el objeto editedTask
const result = await onUpdate(task.id, editedTask)

// DESPUÉS: Solo se envían los campos editados preservando los importantes
const updates = {
  title: editedTask.title || editedTask.text,
  description: editedTask.description || editedTask.notes
}

// Preservar campos importantes
if (task.scheduled_date) updates.scheduled_date = task.scheduled_date
if (task.page) updates.page = task.page
if (task.section) updates.section = task.section

const result = await onUpdate(task.id, updates)
```

### 3. Debug logging añadido:
- En `getTasksForDay()`: Logs para ver qué tareas se filtran y por qué
- En `handleAddTask()`: Logs para confirmar los datos de creación
- En `handleCloseTaskDetail()`: Logs para ver el estado al cerrar
- En `useTasks.js`: Logs para ver tareas semanales cargadas
- En `handleSave()`: Logs para ver qué se está actualizando

## CÓMO PROBAR LA SOLUCIÓN

1. Ir a la vista semanal
2. Crear una nueva tarea con el formulario superior
3. Verificar en la consola que aparezcan los logs de creación
4. Abrir la tarea haciendo clic en ella
5. Hacer algún cambio (editar título o descripción)
6. Guardar cambios
7. Volver a la vista semanal
8. **La tarea debe seguir visible en el día correcto**

## LOGS DE DEBUG

Al crear una tarea verás:
```
➕ Creando tarea con: {title: "...", page: "weekly", scheduled_date: "2024-XX-XX"}
✅ Resultado de addTask: {data: {...}, error: null}
🆕 Nueva tarea creada y mapeada: {...}
```

Al filtrar tareas verás:
```
🔍 Filtrando tarea: {taskId: "...", matchPage: true, matchDate: true, ...}
📅 Tareas para 2024-XX-XX: 1 [...]
```

## NOTAS ADICIONALES

- El campo `scheduled_date` es crítico para las tareas semanales
- Siempre debe preservarse al actualizar una tarea
- El formato debe ser YYYY-MM-DD (ISO date string)
- Las tareas semanales siempre deben tener `page: 'weekly'`