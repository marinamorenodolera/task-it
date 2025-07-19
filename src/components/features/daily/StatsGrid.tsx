'use client'

import { CheckCircle, Clock, Zap, Trophy } from 'lucide-react'

interface StatsGridProps {
  todayCompleted: number
  inProgress: number
  urgent: number
  weeklyStreak: number
  className?: string
}

export default function StatsGrid({
  todayCompleted,
  inProgress,
  urgent,
  weeklyStreak,
  className = ''
}: StatsGridProps) {
  const stats = [
    {
      id: 'completed',
      title: 'Completadas',
      value: todayCompleted,
      icon: CheckCircle,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      id: 'inprogress',
      title: 'En progreso',
      value: inProgress,
      icon: Clock,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'urgent',
      title: 'Urgentes',
      value: urgent,
      icon: Zap,
      color: 'bg-red-500',
      lightColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      id: 'streak',
      title: 'Racha semanal',
      value: weeklyStreak,
      icon: Trophy,
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    }
  ]

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {stats.map((stat) => {
        const Icon = stat.icon
        
        return (
          <div
            key={stat.id}
            className={`${stat.lightColor} rounded-2xl p-4 border-2 border-transparent hover:border-gray-200 transition-all duration-200 touch-target`}
          >
            <div className="flex items-center gap-3">
              <div className={`${stat.color} rounded-xl p-2.5 flex items-center justify-center`}>
                <Icon size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {stat.title}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}