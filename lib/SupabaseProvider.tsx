import React, { createContext, useContext, useMemo, useRef } from 'react'
import { useClerk } from '@clerk/expo'
import { makeSupabaseClient, type SupabaseClient } from './supabase'

const SupabaseContext = createContext<SupabaseClient | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const clerk = useClerk()
  // useClerk() returns the Clerk singleton. clerk.session is a live property
  // updated synchronously by setActive(), so getToken works immediately after
  // OAuth completes — no waiting for a React re-render.
  const clerkRef = useRef(clerk)
  clerkRef.current = clerk

  const client = useMemo(
    () =>
      makeSupabaseClient(
        () => clerkRef.current.session?.getToken({ template: 'supabase' }) ?? Promise.resolve(null)
      ),
    [] // stable client for app lifetime
  )

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase(): SupabaseClient {
  const client = useContext(SupabaseContext)
  if (!client) throw new Error('useSupabase must be used within SupabaseProvider')
  return client
}
