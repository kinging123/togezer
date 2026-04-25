import React, { createContext, useContext, useMemo } from 'react'
import { useSession } from '@clerk/expo'
import { makeSupabaseClient, type SupabaseClient } from './supabase'

const SupabaseContext = createContext<SupabaseClient | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession()

  const client = useMemo(
    () =>
      makeSupabaseClient(
        () => session?.getToken({ template: 'supabase' }) ?? Promise.resolve(null)
      ),
    [session]
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
