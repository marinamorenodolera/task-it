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
    // 🚀 INITIALIZATION LOGGING
    console.log('🚀 AuthContext initialized')
    console.log('Environment check:')
    console.log('- NODE_ENV:', process.env.NODE_ENV)
    console.log('- Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('- Supabase Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
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