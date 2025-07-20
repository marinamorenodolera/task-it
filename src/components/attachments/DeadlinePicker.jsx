import React, { useState } from 'react'
import BaseButton from '../ui/BaseButton'

const DeadlinePicker = ({ onSelect }) => {
  const [step, setStep] = useState('main')
  
  const getToday = () => new Date()
  const getTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow
  }
  
  const getWeekDays = (weekOffset = 0) => {
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
    monday.setDate(today.getDate() + daysToMonday + (weekOffset * 7))
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      days.push(day)
    }
    
    return weekOffset === 0 ? days.filter(date => date >= today || date.toDateString() === today.toDateString()) : days
  }
  
  const formatDate = (date) => {
    const today = getToday()
    const tomorrow = getTomorrow()
    
    if (date.toDateString() === today.toDateString()) return 'Hoy'
    if (date.toDateString() === tomorrow.toDateString()) return 'Mañana'
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`
  }
  
  const handleDateSelect = (date) => {
    const dateString = date.toISOString().split('T')[0]
    const displayText = formatDate(date)
    
    onSelect({
      date: dateString,
      display: displayText,
      fullDisplay: date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      })
    })
  }

  if (step === 'main') {
    return (
      <div className="space-y-2">
        <button
          onClick={() => handleDateSelect(getToday())}
          className="w-full px-4 py-3 text-left bg-white text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors min-h-[44px] flex items-center gap-3"
        >
          📅
          <div>
            <div className="font-medium">Hoy</div>
            <div className="text-xs text-orange-600">{getToday().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        </button>
        
        <button
          onClick={() => setStep('thisWeek')}
          className="w-full px-4 py-3 text-left bg-white text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors min-h-[44px] flex items-center gap-3"
        >
          📅
          <div>
            <div className="font-medium">Esta semana</div>
            <div className="text-xs text-orange-600">Elegir día de la semana actual</div>
          </div>
        </button>
        
        <button
          onClick={() => setStep('nextWeek')}
          className="w-full px-4 py-3 text-left bg-white text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors min-h-[44px] flex items-center gap-3"
        >
          📅
          <div>
            <div className="font-medium">Semana que viene</div>
            <div className="text-xs text-orange-600">Elegir día de la próxima semana</div>
          </div>
        </button>
        
        <button
          onClick={() => setStep('custom')}
          className="w-full px-4 py-3 text-left bg-white text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors min-h-[44px] flex items-center gap-3"
        >
          📅
          <div>
            <div className="font-medium">Otra fecha</div>
            <div className="text-xs text-orange-600">Selector de calendario</div>
          </div>
        </button>
      </div>
    )
  }

  if (step === 'thisWeek') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep('main')}
            className="p-1 text-orange-600 hover:text-orange-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ←
          </button>
          <h4 className="font-medium text-orange-800">Esta semana</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {getWeekDays(0).map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateSelect(date)}
              className="px-3 py-2 text-left bg-white text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors min-h-[44px] flex items-center gap-2"
            >
              📅
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{formatDate(date)}</div>
                <div className="text-xs truncate">{date.toLocaleDateString('es-ES', { weekday: 'long' })}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'nextWeek') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep('main')}
            className="p-1 text-orange-600 hover:text-orange-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ←
          </button>
          <h4 className="font-medium text-orange-800">Semana que viene</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {getWeekDays(1).map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateSelect(date)}
              className="px-3 py-2 text-left bg-white text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors min-h-[44px] flex items-center gap-2"
            >
              📅
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{formatDate(date)}</div>
                <div className="text-xs truncate">{date.toLocaleDateString('es-ES', { weekday: 'long' })}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'custom') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep('main')}
            className="p-1 text-orange-600 hover:text-orange-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ←
          </button>
          <h4 className="font-medium text-orange-800">Elegir fecha</h4>
        </div>
        <input
          type="date"
          onChange={(e) => {
            if (e.target.value) {
              const selectedDate = new Date(e.target.value + 'T00:00:00')
              handleDateSelect(selectedDate)
            }
          }}
          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
    )
  }

  return null
}

export default DeadlinePicker