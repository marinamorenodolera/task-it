import React, { useState } from 'react'
import { Eye, EyeOff, User, Mail, Lock, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const AuthScreen = () => {
  const { signIn, signUp, loading } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  })
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos')
      return
    }

    if (!isLogin && !formData.username) {
      setError('El nombre de usuario es obligatorio')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    console.log('🎯 Starting auth process:', { 
      isLogin, 
      email: formData.email, 
      username: formData.username 
    })

    try {
      let result
      
      if (isLogin) {
        console.log('🔐 Attempting login...')
        result = await signIn(formData.email, formData.password)
      } else {
        console.log('📝 Attempting signup...')
        result = await signUp(formData.email, formData.password, formData.username)
      }

      console.log('📋 Auth result:', {
        hasData: !!result.data,
        hasUser: !!result.data?.user,
        hasError: !!result.error,
        errorMessage: result.error?.message,
        errorCode: result.error?.code
      })

      if (result.error) {
        console.error('❌ Auth failed:', result.error)
        
        // Mejorado manejo de errores específicos
        if (result.error.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos')
        } else if (result.error.message.includes('User already registered')) {
          setError('Este email ya está registrado')
        } else if (result.error.message.includes('Email rate limit exceeded')) {
          setError('Demasiados intentos. Espera unos minutos antes de intentar de nuevo.')
        } else if (result.error.message.includes('Database error')) {
          setError('Error en la base de datos. Intenta de nuevo en unos minutos.')
        } else if (result.error.message.includes('Invalid email')) {
          setError('El formato del email no es válido')
        } else if (result.error.message.includes('No se puede conectar')) {
          setError('Problema de conexión con la base de datos. Verifica tu internet.')
        } else if (result.error.message.includes('Missing Supabase')) {
          setError('Error de configuración. Contacta al administrador.')
        } else if (result.error.code === 'signup_disabled') {
          setError('El registro está temporalmente deshabilitado')
        } else if (result.error.code === 'email_address_invalid') {
          setError('La dirección de email no es válida')
        } else if (result.error.code === 'password_too_short') {
          setError('La contraseña es demasiado corta')
        } else {
          setError(`Error: ${result.error.message}`)
        }
      } else if (!isLogin && result.data?.user) {
        setError('')
        console.log('🎉 Signup successful!')
        alert('¡Cuenta creada exitosamente! Ya puedes usar Task-It')
      } else if (isLogin && result.data?.user) {
        console.log('🎉 Login successful!')
      }
    } catch (err) {
      console.error('💥 Unexpected auth error:', err)
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setFormData({
      email: '',
      password: '',
      username: ''
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Task-It</h1>
          <p className="text-gray-600">
            {isLogin 
              ? 'Inicia sesión para continuar' 
              : 'Crea tu cuenta y organiza tu día'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (only for signup) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de usuario
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Ej: juan_productivo"
                    className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 pl-11 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                </div>
              ) : (
                isLogin ? 'Iniciar sesión' : 'Crear cuenta'
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isLogin 
                ? '¿No tienes cuenta? Crear una nueva' 
                : '¿Ya tienes cuenta? Iniciar sesión'
              }
            </button>
          </div>
        </div>

        {/* Features Preview (only for signup) */}
        {!isLogin && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">¿Por qué Task-It?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Organiza tareas con sistema Big 3</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Rituales diarios personalizables</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Tracking de actividades y productividad</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Captura por voz y organización automática</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthScreen