import { renderHookWithQuery } from '../../test-utils'
import { useHasHabit } from '@/features/habits/hooks/useHasHabit'
import { waitFor } from '@testing-library/react-native'

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ isSignedIn: true }),
}))

const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  eq:     jest.fn().mockResolvedValue({ count: 2, error: null }),
})

jest.mock('@/lib/SupabaseProvider', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

describe('useHasHabit', () => {
  it('returns true when the user has at least one active habit', async () => {
    const { result } = renderHookWithQuery(() => useHasHabit())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.hasHabit).toBe(true)
  })
})
