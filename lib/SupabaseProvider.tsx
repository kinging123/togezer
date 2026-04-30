import React, { createContext, useContext, useMemo, useRef } from 'react'
import { useSession } from '@clerk/expo'
import { makeSupabaseClient, type SupabaseClient } from './supabase'

const SupabaseContext = createContext<SupabaseClient | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession()

  const sessionRef = useRef(session)
  sessionRef.current = session

  const client = useMemo(
    () =>
      makeSupabaseClient(
        () => sessionRef.current?.getToken({ template: 'supabase' }) ?? Promise.resolve(null)
      ),
    [] // stable client; ref is always current when getToken is called
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
