# Task-It Style Guide

## Componentes de Tareas y Rituales

### Estilo de Marcación Completada (PATRÓN OFICIAL)

**Estructura HTML/JSX para tareas y rituales completados:**

```jsx
<div class="flex items-center gap-3 p-3 bg-white rounded-lg border transition-all cursor-pointer border-green-200 bg-green-50">
  <button class="transition-colors text-green-500">
    <CircleCheck size={18} /> {/* Usar CircleCheck de lucide-react */}
  </button>
  <div class="flex-1 min-w-0">
    <span class="text-sm font-medium text-green-700 line-through">
      [Título de la tarea/ritual]
    </span>
  </div>
  {/* Botón de expansión opcional */}
  <ChevronDown size={16} />
</div>
```

### Estados de Componentes

#### **Estado Completado:**
- **Container**: `border-green-200 bg-green-50`
- **Botón**: `text-green-500`
- **Icono**: `CircleCheck` (no CheckCircle2)
- **Texto**: `text-green-700 line-through`

#### **Estado Pendiente:**
- **Container**: `border-gray-200 bg-white hover:border-purple-200`
- **Botón**: `text-gray-400 hover:text-purple-500`
- **Icono**: `Circle`
- **Texto**: `text-gray-900`

### Iconos Consistentes

- ✅ **Completado**: `CircleCheck` (lucide-react)
- ⭕ **Pendiente**: `Circle` (lucide-react)
- 🔽 **Expandir**: `ChevronDown` (lucide-react)

### Tamaños de Iconos

- **Principales (checkbox)**: `size={18}`
- **Secundarios (expand)**: `size={16}`

### Touch/Click Optimization

```jsx
// Asegurar que iconos no intercepten clicks
style={{ pointerEvents: 'none' }}

// Para botones touch-optimized sin afectar altura visual:
className="p-3 -m-3 touch-manipulation"
```

### Colores de Estado

```css
/* Completado */
--completed-bg: bg-green-50
--completed-border: border-green-200  
--completed-icon: text-green-500
--completed-text: text-green-700 line-through

/* Pendiente */
--pending-bg: bg-white
--pending-border: border-gray-200
--pending-icon: text-gray-400
--pending-text: text-gray-900
```

## Notas Importantes

1. **NUNCA usar CheckCircle2** - Usar siempre `CircleCheck` para consistencia
2. **Altura visual** debe coincidir entre tareas y rituales
3. **Touch targets** deben ser mínimo 44px pero sin afectar altura visual
4. **Icons pointer-events: none** para evitar interceptar clicks
