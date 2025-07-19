import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadUserProfile(session.user.id)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const signUp = async (email, password, username) => {
    try {
      setLoading(true)
      
      // 🔍 DEBUGGING: Verificar configuración
      console.log('🔍 Debugging Supabase:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
      })
      
      // 🔗 Test de conexión básica
      try {
        const { data: healthCheck } = await supabase.from('user_profiles').select('count').limit(1)
        console.log('🏥 Database connection test:', { success: true, result: healthCheck })
      } catch (connectionError) {
        console.error('💀 Database connection failed:', connectionError)
        throw new Error('No se puede conectar a la base de datos. Verifica tu conexión.')
      }
      
      console.log('🚀 Attempting signup for:', { email, username })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      })

      console.log('📧 Auth signup response:', { 
        user: data?.user?.id, 
        error: error?.message,
        session: !!data?.session 
      })

      if (error) {
        console.error('❌ Auth signup error:', error)
        throw error
      }

      // Auto-crear rituales por defecto si signup exitoso (OPCIONAL)
      if (data.user) {
        console.log('👤 User created successfully!')
        // Comentamos la creación de rituales por ahora para que el registro funcione
        // Los rituales se pueden crear después en la primera sesión
        console.log('ℹ️ Skipping default rituals creation for now - user can create them later')
      }

      console.log('🎉 Signup completed successfully')
      return { data, error: null }
    } catch (error) {
      console.error('💥 Signup error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Signin error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Signout error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      console.error('Profile update error:', error)
      return { data: null, error }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}