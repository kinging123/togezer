import { renderHookWithQuery } from '../../test-utils'
import { useInviteCode } from '@/features/friends/hooks/useInviteCode'
import { waitFor } from '@testing-library/react-native'

const mockCode = { id: 'ic1', code: 'abc9', created_by: 'u1',
  accepted_by: null, expires_at: '2099-01-01', created_at: '2026-01-01' }

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ userId: 'u1', isSignedIn: true }),
}))

const mockFrom = jest.fn().mockReturnValue({
  select:  jest.fn().mockReturnThis(),
  eq:      jest.fn().mockReturnThis(),
  is:      jest.fn().mockReturnThis(),
  single:  jest.fn().mockResolvedValue({ data: mockCode, error: null }),
  insert:  jest.fn().mockReturnThis(),
  order:   jest.fn().mockReturnThis(),
  limit:   jest.fn().mockResolvedValue({ data: [mockCode], error: null }),
})

jest.mock('@/lib/SupabaseProvider', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

describe('useInviteCode', () => {
  it('returns an existing unused invite code for the current user', async () => {
    const { result } = renderHookWithQuery(() => useInviteCode())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.code).toBe('abc9')
  })
})
