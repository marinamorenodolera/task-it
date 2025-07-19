'use client'

import { useState } from 'react'
import { Target, Plus, Check, X, Edit3 } from 'lucide-react'

interface Goal {
  id: string
  title: string
  category: 'work' | 'health' | 'personal' | 'learning' | 'relationships'
  progress: number
  isCompleted: boolean
  deadline?: string
}

interface WeeklyGoalsProps {
  className?: string
}

export default function WeeklyGoals({ className = '' }: WeeklyGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Terminar presentación del proyecto',
      category: 'work',
      progress: 75,
      isCompleted: false,
      deadline: '2024-01-19'
    },
    {
      id: '2',
      title: 'Hacer ejercicio 5 días',
      category: 'health',
      progress: 60,
      isCompleted: false
    },
    {
      id: '3',
      title: 'Leer 2 capítulos del libro',
      category: 'learning',
      progress: 100,
      isCompleted: true
    }
  ])

  const [newGoal, setNewGoal] = useState('')
  const [newGoalCategory, setNewGoalCategory] = useState<Goal['category']>('work')
  const [isAddingGoal, setIsAddingGoal] = useState(false)

  const categories = {
    work: { emoji: '💼', label: 'Trabajo', color: 'blue' },
    health: { emoji: '💪', label: 'Salud', color: 'green' },
    personal: { emoji: '🏠', label: 'Personal', color: 'purple' },
    learning: { emoji: '📚', label: 'Aprendizaje', color: 'orange' },
    relationships: { emoji: '👥', label: 'Relaciones', color: 'pink' }
  }

  const handleAddGoal = () => {
    if (!newGoal.trim()) return

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.trim(),
      category: newGoalCategory,
      progress: 0,
      isCompleted: false
    }

    setGoals(prev => [...prev, goal])
    setNewGoal('')
    setIsAddingGoal(false)
  }

  const handleToggleComplete = (goalId: string) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, isCompleted: !goal.isCompleted, progress: goal.isCompleted ? 0 : 100 }
        : goal
    ))
  }

  const handleUpdateProgress = (goalId: string, progress: number) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, progress, isCompleted: progress >= 100 }
        : goal
    ))
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId))
  }

  const completedGoals = goals.filter(goal => goal.isCompleted).length
  const totalGoals = goals.length
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Goals Overview */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Target className="text-blue-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">
            Objetivos Semanales
          </h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-blue-500 mb-1">
              {completedGoals}
            </div>
            <div className="text-sm text-gray-600">
              Completados
            </div>
          </div>
          
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-gray-700 mb-1">
              {totalGoals}
            </div>
            <div className="text-sm text-gray-600">
              Total
            </div>
          </div>
          
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-green-500 mb-1">
              {completionRate}%
            </div>
            <div className="text-sm text-gray-600">
              Tasa de éxito
            </div>
          </div>
          
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-purple-500 mb-1">
              {7 - new Date().getDay()}
            </div>
            <div className="text-sm text-gray-600">
              Días restantes
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progreso general</span>
            <span>{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add New Goal */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        {!isAddingGoal ? (
          <button
            onClick={() => setIsAddingGoal(true)}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            <Plus size={20} />
            Agregar nuevo objetivo
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué quieres lograr esta semana?
              </label>
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Ejemplo: Terminar el reporte mensual"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(categories).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => setNewGoalCategory(key as Goal['category'])}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newGoalCategory === key
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{category.emoji}</span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddGoal}
                disabled={!newGoal.trim()}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Agregar objetivo
              </button>
              <button
                onClick={() => {
                  setIsAddingGoal(false)
                  setNewGoal('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal) => {
          const categoryInfo = categories[goal.category]
          
          return (
            <div 
              key={goal.id} 
              className={`bg-white rounded-xl p-4 sm:p-6 border shadow-sm transition-all ${
                goal.isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                
                {/* Complete Button */}
                <button
                  onClick={() => handleToggleComplete(goal.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    goal.isCompleted 
                      ? 'text-green-600 bg-green-100' 
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <Check size={20} />
                </button>
                
                {/* Goal Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{categoryInfo.emoji}</span>
                    <h4 className={`font-medium ${
                      goal.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {goal.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      goal.isCompleted 
                        ? 'bg-green-100 text-green-700' 
                        : `bg-${categoryInfo.color}-100 text-${categoryInfo.color}-700`
                    }`}>
                      {categoryInfo.label}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progreso</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          goal.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Progress Slider */}
                  {!goal.isCompleted && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goal.progress}
                      onChange={(e) => handleUpdateProgress(goal.id, Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Weekly Tips */}
      <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
        <h4 className="font-medium text-blue-900 mb-2">
          🧠 Tips para objetivos semanales efectivos
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Específicos:</strong> Define exactamente qué quieres lograr</li>
          <li>• <strong>Medibles:</strong> Usa números o resultados concretos</li>
          <li>• <strong>Alcanzables:</strong> Sé realista con tu tiempo y energía</li>
          <li>• <strong>Relevantes:</strong> Que contribuyan a tus objetivos más grandes</li>
          <li>• <strong>Temporales:</strong> Con fecha límite dentro de la semana</li>
        </ul>
      </div>

    </div>
  )
}