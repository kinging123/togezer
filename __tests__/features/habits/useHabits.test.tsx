import { renderHookWithQuery } from '../../test-utils'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { waitFor } from '@testing-library/react-native'

jest.mock('@clerk/expo', () => ({ useAuth: () => ({ userId: 'u1' }) }))

const mockHabits = [
  { id: 'h1', title: 'journal', is_archived: false, user_id: 'u1', cadence: 'daily',
    emoji: null, reminder_time: null, grace_days_pw: 1, created_at: '2026-01-01' },
]

const eq = jest.fn().mockReturnThis()
const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  eq,
  order:  jest.fn().mockResolvedValue({ data: mockHabits, error: null }),
})

jest.mock('@/lib/SupabaseProvider', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

describe('useHabits', () => {
  it('fetches the current user\'s non-archived habits', async () => {
    const { result } = renderHookWithQuery(() => useHabits())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockHabits)
    expect(mockFrom).toHaveBeenCalledWith('habits')
    expect(eq).toHaveBeenCalledWith('user_id', 'u1') // scoped to own habits
  })
})
