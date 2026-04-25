import React from 'react'
import { renderHook } from '@testing-library/react-native'
import { useSupabase, SupabaseProvider } from '@/lib/SupabaseProvider'

jest.mock('@clerk/expo', () => ({
  useSession: () => ({ session: { getToken: jest.fn().mockResolvedValue('test-token') } }),
}))

describe('SupabaseProvider', () => {
  it('provides a Supabase client via useSupabase', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SupabaseProvider>{children}</SupabaseProvider>
    )
    const { result } = renderHook(() => useSupabase(), { wrapper })
    expect(result.current).toBeDefined()
    expect(typeof result.current.from).toBe('function')
  })

  it('throws when useSupabase is called outside the provider', () => {
    expect(() => renderHook(() => useSupabase())).toThrow(
      'useSupabase must be used within SupabaseProvider'
    )
  })
})
