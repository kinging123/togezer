import { renderHookWithQuery } from '../../test-utils'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { waitFor } from '@testing-library/react-native'
import type { Habit } from '@/features/habits/types'

const mockHabit: Habit = {
  id: 'h1',
  title: 'meditate',
  user_id: 'u1',
  cadence: 'daily',
  emoji: null,
  reminder_time: null,
  grace_days_pw: 1,
  is_archived: false,
  created_at: '2026-04-28T00:00:00.000Z',
}

const mockCheckIns = [
  { checked_date: '2026-05-01' },
  { checked_date: '2026-04-30' },
  { checked_date: '2026-04-29' },
]

const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  eq:     jest.fn().mockReturnThis(),
  gte:    jest.fn().mockReturnThis(),
  order:  jest.fn().mockResolvedValue({ data: mockCheckIns, error: null }),
})

jest.mock('@/lib/SupabaseProvider', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ userId: 'u1' }),
}))

describe('useHabitStatus', () => {
  it('fetches check_ins and returns a StreakStatus', async () => {
    const { result } = renderHookWithQuery(() => useHabitStatus(mockHabit))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toMatchObject({
      streak: expect.any(Number),
      hasCheckedInToday: expect.any(Boolean),
      graceUsedThisWeek: expect.any(Number),
      graceTotalPW: 1,
    })
    expect(mockFrom).toHaveBeenCalledWith('check_ins')
  })

  it('returns streak 0 and hasCheckedInToday false when no check-ins', async () => {
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      gte:    jest.fn().mockReturnThis(),
      order:  jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    const { result } = renderHookWithQuery(() => useHabitStatus(mockHabit))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.streak).toBe(0)
    expect(result.current.data?.hasCheckedInToday).toBe(false)
  })
})
