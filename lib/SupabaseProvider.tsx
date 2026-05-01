import React, { createContext, useContext, useMemo, useRef } from 'react'
import { useAuth } from '@clerk/expo'
import { makeSupabaseClient, type SupabaseClient } from './supabase'

const SupabaseContext = createContext<SupabaseClient | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth()
  // getToken reads clerk.session at call time (updated synchronously by setActive),
  // so this works correctly even when called immediately after setActive() before re-render.
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  const client = useMemo(
    () =>
      makeSupabaseClient(
        () => getTokenRef.current({ template: 'supabase' })
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
