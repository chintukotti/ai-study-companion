import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { Profile } from "@/types"

interface AuthState {
  user: any | null
  profile: Profile | null
  session: any | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false,
  initialize: async () => {
    try {
      set({ loading: true })
      const { data: { session } } = await supabase.auth.getSession()
      
      let profile = null
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
        profile = data
      }

      set({
        session,
        user: session?.user || null,
        profile,
        initialized: true,
        loading: false,
      })

      supabase.auth.onAuthStateChange(async (_event, session) => {
        let profile = null
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()
          profile = data
        }
        set({
          session,
          user: session?.user || null,
          profile,
          loading: false,
        })
      })
    } catch (error) {
      console.error("Error initializing auth:", error)
      set({ initialized: true, loading: false })
    }
  },
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },
}))
