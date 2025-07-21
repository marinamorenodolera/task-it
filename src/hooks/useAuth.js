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
      
      // 🔍 SUPABASE VERIFICATION
      console.log('🔍 Supabase verification:')
      console.log('- URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('- Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      console.log('- Key prefix:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
      console.log('- Project host:', new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname)
      
      // 🏥 CONNECTION TEST
      console.log('🏥 Testing Supabase connection...')
      const connectionTest = await supabase.auth.getSession()
      console.log('Connection test result:', connectionTest.error ? 'FAILED' : 'SUCCESS')
      if (connectionTest.error) {
        console.error('Connection error:', connectionTest.error)
      }
      
      // 📝 TEST 1: SIGNUP CON USERNAME
      console.log('📝 Test 1: Attempting signup with username metadata...')
      console.log('Email:', email)
      console.log('Username for metadata:', username)
      
      const signUpData = {
        email,
        password,
        options: {
          data: {
            username: username,
            display_name: username
          }
        }
      }
      
      console.log('📤 Signup request payload:', signUpData)
      
      const { data, error } = await supabase.auth.signUp(signUpData)
      
      // 📧 DETAILED RESPONSE LOGGING
      console.log('📧 Detailed signup response:')
      console.log('- Data exists:', !!data)
      console.log('- User created:', !!data?.user)
      console.log('- User ID:', data?.user?.id)
      console.log('- User email:', data?.user?.email)
      console.log('- User metadata:', data?.user?.user_metadata)
      console.log('- Session exists:', !!data?.session)
      console.log('- Error exists:', !!error)
      
      if (error) {
        // ❌ DETAILED ERROR ANALYSIS
        console.error('❌ DETAILED SUPABASE ERROR:')
        console.error('- Error message:', error.message)
        console.error('- Error code:', error.status)
        console.error('- Error details:', error.details)
        console.error('- Error hint:', error.hint)
        console.error('- Full error object:', error)
        
        // 🔄 TEST 2: FALLBACK SIN USERNAME
        console.log('🔄 Test 2: Attempting signup without username metadata...')
        
        const fallbackData = {
          email: email.includes('.test') ? email : email + '.test', // Avoid email conflicts
          password
        }
        
        const { data: data2, error: error2 } = await supabase.auth.signUp(fallbackData)
        
        if (error2) {
          console.error('❌ Fallback signup also failed:', error2)
        } else {
          console.log('✅ Fallback signup succeeded!')
          console.log('User created without metadata:', data2?.user?.id)
        }
        
        // 💡 AUTOMATIC DIAGNOSIS
        console.log('💡 DIAGNOSIS:')
        if (error.message?.includes('permission denied')) {
          console.log('- LIKELY CAUSE: RLS (Row Level Security) blocking user creation')
          console.log('- SOLUTION: Check RLS policies on auth.users or related tables')
        } else if (error.message?.includes('duplicate')) {
          console.log('- LIKELY CAUSE: User already exists with this email')
          console.log('- SOLUTION: Use different email or implement login flow')
        } else if (error.message?.includes('invalid')) {
          console.log('- LIKELY CAUSE: Invalid email format or weak password')
          console.log('- SOLUTION: Validate inputs before sending to Supabase')
        } else if (error.message?.includes('metadata')) {
          console.log('- LIKELY CAUSE: Issue with user_metadata field')
          console.log('- SOLUTION: Remove username from metadata or fix trigger')
        } else if (error.message?.includes('Database error saving new user')) {
          console.log('- CONFIRMED CAUSE: Database trigger or RLS policy failure')
          console.log('- SOLUTION: This is a Supabase configuration issue, not a code issue')
          console.log('- ACTION: Check Supabase Dashboard > Authentication > Settings')
          console.log('- ACTION: Verify no blocking triggers or RLS policies on auth.users')
        } else {
          console.log('- UNKNOWN ERROR: Check Supabase dashboard logs for more details')
        }
        
        throw error
      }
      
      // ✅ SUCCESS CASE
      console.log('✅ Signup successful!')
      console.log('User ID:', data.user.id)
      
      if (data.user && data.session) {
        console.log('✅ User logged in automatically')
      } else {
        console.log('⚠️ User created but not logged in (email confirmation required?)')
      }

      return { data, error: null }
      
    } catch (error) {
      console.error('💥 UNEXPECTED ERROR in signup function:')
      console.error('- Error type:', typeof error)
      console.error('- Error message:', error.message)
      console.error('- Error stack:', error.stack)
      console.error('- Full error:', error)
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