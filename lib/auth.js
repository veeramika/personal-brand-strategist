import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext({ user: null, loading: true, signIn: () => {}, signOut: () => {} })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user || null); setLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user || null))
    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = () => supabase?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/meditate' } })
  const signOut = () => supabase?.auth.signOut().then(() => setUser(null))

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
