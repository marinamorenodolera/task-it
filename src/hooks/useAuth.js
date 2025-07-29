import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({
  user: null,
  profile: null,
  authLoading: false,
  authState: 'initializing',
  isAuthenticated: false,
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
  const [profile, setProfile] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [authState, setAuthState] = useState('initializing') // initializing, authenticated, unauthenticated, error

  console.log('🔐 AuthProvider - Estado:', { authState, user: !!user, profile: !!profile, mounted })

  // Wait for client hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize auth ONLY after hydration
  useEffect(() => {
    if (!mounted) return

    console.log('🔐 Inicializando autenticación después de hydratación...')

    const initializeAuth = async () => {
      try {
        setAuthState('initializing')
        
        // Get existing session AFTER hydration
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('🔐 Sesión obtenida:', { 
          session: !!session, 
          user: !!session?.user,
          email: session?.user?.email,
          error: !!error 
        })
        
        if (session && !error) {
          console.log('🔐 ✅ Sesión válida encontrada, cargando perfil...')
          
          // Load user profile
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          
          if (profileData) {
            console.log('🔐 ✅ Perfil cargado exitosamente')
            setUser(session.user)
            setProfile(profileData)
            setAuthState('authenticated')
          } else {
            console.log('🔐 ⚠️ No se encontró perfil, pero usuario autenticado')
            setUser(session.user)
            setProfile(null)
            setAuthState('authenticated')
          }
        } else {
          console.log('🔐 ❌ No hay sesión válida')
          setUser(null)
          setProfile(null)
          setAuthState('unauthenticated')
        }
      } catch (err) {
        console.error('🔐 ❌ Error en inicialización:', err)
        setUser(null)
        setProfile(null)
        setAuthState('error')
      }
    }
    
    initializeAuth()
    
    // Setup auth listener ONLY after initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', { event, session: !!session })
        
        if (event === 'SIGNED_IN' && session) {
          console.log('🔐 ✅ Usuario logueado, cargando perfil...')
          
          // Load profile for signed in user
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          
          setUser(session.user)
          setProfile(profileData)
          setAuthState('authenticated')
          
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 ❌ Usuario deslogueado')
          setUser(null)
          setProfile(null)
          setAuthState('unauthenticated')
        }
      }
    )
    
    return () => {
      console.log('🔐 Limpiando subscription')
      subscription?.unsubscribe()
    }
  }, [mounted])

  const signUp = async (email, password, username) => {
    try {
      setAuthState('initializing')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      })

      if (error) {
        console.error('🔐 SignUp error:', error)
        setAuthState('unauthenticated')
        return { data: null, error }
      }

      console.log('🔐 ✅ SignUp exitoso')
      return { data, error: null }
    } catch (error) {
      console.error('🔐 SignUp catch error:', error)
      setAuthState('error')
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      setAuthState('initializing')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('🔐 SignIn error:', error)
        setAuthState('unauthenticated')
        return { data: null, error }
      }

      console.log('🔐 ✅ SignIn exitoso')
      // El estado se actualizará automáticamente via onAuthStateChange
      return { data, error: null }
    } catch (error) {
      console.error('🔐 SignIn catch error:', error)
      setAuthState('error')
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      setAuthState('initializing')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('🔐 SignOut error:', error)
        return { error }
      }
      
      console.log('🔐 ✅ SignOut exitoso')
      // El estado se actualizará automáticamente via onAuthStateChange
      return { error: null }
    } catch (error) {
      console.error('🔐 SignOut catch error:', error)
      setAuthState('error')
      return { error }
    }
  }

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      console.error('🔐 Profile update error:', error)
      return { data: null, error }
    }
  }

  // Derived state
  const authLoading = authState === 'initializing'
  const isAuthenticated = authState === 'authenticated'

  const value = {
    user,
    profile,
    authLoading,
    authState,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    updateProfile,
    // Legacy compatibility
    loading: authLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}