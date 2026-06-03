import { renderHookWithQuery } from '../../test-utils'
import { useHasHabit } from '@/features/habits/hooks/useHasHabit'
import { waitFor } from '@testing-library/react-native'

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ isSignedIn: true, userId: 'u1' }),
}))

const eqArchived = jest.fn().mockResolvedValue({ count: 2, error: null }) // .eq('is_archived', false) — terminal
const eqUser = jest.fn().mockReturnValue({ eq: eqArchived })              // .eq('user_id', 'u1')
const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnValue({ eq: eqUser }),
})

jest.mock('@/lib/SupabaseProvider', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

describe('useHasHabit', () => {
  it('returns true when the user has at least one of their own active habits', async () => {
    const { result } = renderHookWithQuery(() => useHasHabit())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.hasHabit).toBe(true)
    expect(eqUser).toHaveBeenCalledWith('user_id', 'u1') // scoped to own habits
  })
})
