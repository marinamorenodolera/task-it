'use client'

import { useEffect, useState } from 'react'
import QuickCapture from '@/components/daily/QuickCapture'
import TaskCard from '@/components/ui/TaskCard'
import { Task, TaskPriority } from '@/types/task.types'
import { supabase } from '@/lib/supabase'

const USER_ID = '00000000-0000-0000-0000-000000000000' // TODO: reemplazar por auth real

export default function DailyPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', USER_ID)
        .order('priority_order', { ascending: true })
      if (!error && data) setTasks(data as Task[])
      setLoading(false)
    }
    fetchTasks()
  }, [])

  const handleAddTask = async (title: string, priority: TaskPriority) => {
    const now = new Date().toISOString()
    const section = priority === 'big3' ? 'big3_daily' : 
      priority === 'sport' ? 'sport' : 'daily_tasks'
    const newTask = {
      user_id: USER_ID,
      title,
      status: 'pending',
      section,
      daily_priority: priority,
      priority_order: tasks.length + 1,
      weekly_priority: 0,
      is_calendar_event: false,
      is_recurring: false,
      show_energy: false,
      show_duration: false,
      show_project: true,
      show_deadline: true,
      show_notes_preview: false,
      created_at: now,
      updated_at: now,
    }
    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single()
    if (!error && data) setTasks(prev => [...prev, data as Task])
  }

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single()
    if (!error && data) setTasks(prev => prev.map(t => t.id === taskId ? data as Task : t))
  }

  const handleEditTask = (taskId: string) => {
    // Implementar modal de edición si es necesario
  }

  const big3Tasks = tasks.filter(task => task.daily_priority === 'big3')
  const urgentTasks = tasks.filter(task => task.daily_priority === 'urgent' && task.status !== 'completed')
  const importantTasks = tasks.filter(task => task.daily_priority === 'important' && task.status !== 'completed')
  const niceTasks = tasks.filter(task => task.daily_priority === 'nice' && task.status !== 'completed')
  const sportTasks = tasks.filter(task => task.daily_priority === 'sport' && task.status !== 'completed')
  const completedTasks = tasks.filter(task => task.status === 'completed')

  // Daily Tasks: solo tareas que no sean Big 3, Sport ni completadas
  const dailyTasks = tasks.filter(
    task =>
      task.section === 'daily_tasks' &&
      task.daily_priority !== 'big3' &&
      task.daily_priority !== 'sport' &&
      task.status !== 'completed'
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-4xl">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            ✨ Task-it
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Free to Focus - Productividad inteligente
          </p>
        </header>

        {/* Quick Capture */}
        <QuickCapture onAddTask={handleAddTask} />

        {/* Stats Grid - Mobile First */}
        <section className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="p-4">
                <div className="text-2xl sm:text-3xl font-bold text-blue-500 mb-1">
                  {big3Tasks.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Big 3</div>
              </div>
              <div className="p-4">
                <div className="text-2xl sm:text-3xl font-bold text-red-500 mb-1">
                  {urgentTasks.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Urgentes</div>
              </div>
              <div className="p-4">
                <div className="text-2xl sm:text-3xl font-bold text-green-500 mb-1">
                  {completedTasks.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Completadas</div>
              </div>
              <div className="p-4">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                  {sportTasks.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Deporte</div>
              </div>
            </div>
          </div>
        </section>

        {/* Task Sections */}
        <div className="space-y-6 sm:space-y-8">
        {/* Big 3 Daily */}
        {big3Tasks.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-blue-500 mb-4 flex items-center gap-2">
              ⭐ Big 3 Daily
            </h2>
            <div className="space-y-3">
              {big3Tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showPriority
                  onComplete={handleCompleteTask}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          </section>
        )}

        {/* Urgent Tasks */}
        {urgentTasks.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-red-500 mb-4 flex items-center gap-2">
              🔥 Urgent & Important
            </h2>
            <div className="space-y-3">
              {urgentTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showPriority
                  onComplete={handleCompleteTask}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          </section>
        )}

        {/* Important Tasks */}
        {importantTasks.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-orange-500 mb-4 flex items-center gap-2">
              ⚡ Important, Not Urgent
            </h2>
            <div className="space-y-3">
              {importantTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showPriority
                  onComplete={handleCompleteTask}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          </section>
        )}

        {/* Nice to Have */}
        {niceTasks.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-600 mb-4 flex items-center gap-2">
              📝 Nice to Have
            </h2>
            <div className="space-y-3">
              {niceTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showPriority
                  onComplete={handleCompleteTask}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sport Tasks */}
        {sportTasks.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-green-600 mb-4 flex items-center gap-2">
              💪 Sport & Health
            </h2>
            <div className="space-y-3">
              {sportTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showPriority
                  onComplete={handleCompleteTask}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-green-500 mb-4 flex items-center gap-2">
              ✅ Completadas Hoy
            </h2>
            <div className="space-y-3">
              {completedTasks.slice(0, 5).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
            {completedTasks.length > 5 && (
              <p className="text-sm text-gray-500 text-center mt-4">
                Y {completedTasks.length - 5} tareas más completadas...
              </p>
            )}
          </section>
        )}

        {/* Daily Tasks */}
        {dailyTasks.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📅 Daily Tasks
            </h2>
            <div className="space-y-3">
              {dailyTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showPriority
                  onComplete={handleCompleteTask}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          </section>
        )}
        </div>
      </div>
    </div>
  )
}