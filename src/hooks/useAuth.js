import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: () => {},
  signIn: () => {},
  signOut: () => {},
  updateProfile: () => {}
})

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

  console.log('🔐 AuthProvider - RENDER')
  console.log('🔐 Estado actual:', { user: !!user, loading, profile: !!profile })
  console.log('🔐 *** LOADING STATE:', loading, '***')
  
  // 🚨 DIAGNÓSTICO ESPECÍFICO PARA USUARIO AUTENTICADO
  if (user && loading) {
    console.log('🚨 PROBLEMA DETECTADO: Usuario existe pero loading=true')
    console.log('🚨 Usuario:', user.email || user.id)
    console.log('🚨 Este es el problema que causa el spinner infinito')
    
    // AGGRESSIVE FIX: Try to force loading to false immediately when we detect this issue
    console.log('🚨 INTENTANDO FORCE RESET INMEDIATO')
    setTimeout(() => {
      console.log('🚨 EJECUTANDO setLoading(false) INMEDIATO')
      setLoading(false)
    }, 100) // Very short delay to break any potential sync issues
  }

  useEffect(() => {
    console.log('🔐 AuthProvider - useEffect ejecutado')
    console.log('🚀 INITIALIZATION LOGGING')
    console.log('Environment check:')
    console.log('- NODE_ENV:', process.env.NODE_ENV)
    console.log('- Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('- Supabase Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    // Get initial session with better session persistence handling
    const getInitialSession = async () => {
      console.log('🔐 Verificando sesión inicial...')
      console.log('🔐 Estado inicial loading antes de verificar:', loading)
      
      try {
        // First, wait a bit to let Supabase potentially hydrate from localStorage
        // This helps with session persistence on page reload
        console.log('🔐 Esperando hidratación de Supabase...')
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('🔐 Llamando a supabase.auth.getSession()...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('🔐 Resultado getSession:', { 
          session: !!session, 
          user: !!session?.user, 
          error: !!error,
          sessionId: session?.access_token?.substring(0, 20) + '...',
          userEmail: session?.user?.email
        })
        
        if (error) {
          console.error('🔐 Error en getSession:', error)
          console.log('🔐 Estableciendo user a null debido a error')
          setUser(null)
        } else if (session?.user) {
          console.log('🔐 ✅ Sesión PERSISTENTE encontrada, configurando usuario:', session.user.email)
          setUser(session.user)
          
          // Cargar perfil sin bloquear el finally
          try {
            console.log('🔐 Cargando perfil de usuario...')
            await loadUserProfile(session.user.id)
            console.log('🔐 Perfil cargado exitosamente')
          } catch (profileError) {
            console.error('🔐 Error cargando perfil, pero continuando:', profileError)
            // No bloquear la app si falla el perfil
          }
          
          console.log('🔐 Usuario configurado, continuando al finally para resetear loading')
        } else {
          console.log('🔐 ❌ No hay sesión persistente - usuario debe hacer login')
          setUser(null)
        }
      } catch (error) {
        console.error('🔐 Error capturado en getInitialSession:', error)
        console.error('🔐 Stack trace:', error.stack)
        setUser(null)
      } finally {
        console.log('🔐 EJECUTANDO FINALLY - Finalizando verificación inicial')
        console.log('🔐 Estado loading antes de resetear:', loading)
        console.log('🔐 *** CRÍTICO: setLoading(false) ***')
        setLoading(false)
        console.log('🔐 setLoading(false) ejecutado exitosamente')
      }
    }

    getInitialSession()

    // Safety fallback: If loading is still true after 10 seconds, force it to false
    // This prevents infinite loading if something goes wrong with Supabase
    const safetyTimer = setTimeout(() => {
      console.log('🚨 SAFETY FALLBACK: Checking if loading needs to be forced to false after 10 seconds')
      // Use setLoading with a callback to access current state
      setLoading(currentLoading => {
        if (currentLoading) {
          console.log('🚨 Ejecutando setLoading(false) por timeout de seguridad')
          return false
        }
        console.log('🚨 Loading ya está en false, no es necesario cambiar')
        return currentLoading
      })
    }, 10000) // 10 seconds

    // Faster safety check for authenticated users - simplified approach
    const authenticatedUserTimer = setTimeout(() => {
      console.log('🚨 SAFETY CHECK: Verificando estado después de 3 segundos')
      console.log('🚨 Estado actual en timer: loading=', loading, 'user=', !!user)
      
      // Simple force to false after 3 seconds regardless of user state
      // This should break any infinite loading loop
      console.log('🚨 FORZANDO setLoading(false) después de 3 segundos')
      setLoading(false)
    }, 3000) // 3 seconds aggressive timeout

    // Listen for auth changes with extensive logging
    console.log('🔐 Configurando listener de auth state changes...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change detectado:', {
          event,
          session: !!session,
          user: !!session?.user,
          timestamp: new Date().toISOString()
        })
        console.log('🔐 Estado loading al inicio del auth change:', loading)
        
        try {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            console.log('🔐 Nuevo usuario logueado:', session.user.email)
            
            // Cargar perfil sin bloquear el finally
            try {
              await loadUserProfile(session.user.id)
              console.log('🔐 Perfil cargado en auth change')
            } catch (profileError) {
              console.error('🔐 Error cargando perfil en auth change:', profileError)
            }
          } else {
            console.log('🔐 Usuario deslogueado, limpiando profile')
            setProfile(null)
          }
        } catch (error) {
          console.error('🔐 Error en onAuthStateChange:', error)
        } finally {
          console.log('🔐 *** CRÍTICO: Auth state change completado, setLoading(false) ***')
          setLoading(false)
          console.log('🔐 setLoading(false) ejecutado en onAuthStateChange')
        }
      }
    )

    return () => {
      console.log('🔐 Limpiando subscription de auth changes')
      console.log('🔐 Limpiando safety timers')
      clearTimeout(safetyTimer)
      clearTimeout(authenticatedUserTimer)
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId) => {
    console.log('👤 loadUserProfile - INICIO para userId:', userId)
    console.log('👤 Estado loading antes de cargar perfil:', loading)
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('👤 Error loading profile:', error)
        console.log('👤 Error code:', error.code, 'continuando sin perfil...')
        setProfile(null)
        return null
      }

      console.log('👤 Perfil cargado exitosamente:', !!data)
      setProfile(data)
      return data
    } catch (error) {
      console.error('👤 Error capturado en loadUserProfile:', error)
      setProfile(null)
      return null
    }
  }

  const signUp = async (email, password, username) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      })

      if (error) {
        console.error('SignUp error:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('SignUp catch error:', error)
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
        console.error('SignIn error:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('SignIn catch error:', error)
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
        console.error('SignOut error:', error)
        return { error }
      }
      
      setUser(null)
      setProfile(null)
      return { error: null }
    } catch (error) {
      console.error('SignOut catch error:', error)
      return { error }
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