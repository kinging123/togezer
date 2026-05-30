import { renderHookWithQuery } from '../../test-utils'
import { useReplaceHabit } from '@/features/habits/hooks/useReplaceHabit'
import { act, waitFor } from '@testing-library/react-native'

jest.mock('@clerk/expo', () => ({ useAuth: () => ({ userId: 'me' }) }))

const insert = jest.fn().mockResolvedValue({ error: null })
const eq = jest.fn().mockResolvedValue({ error: null })
const update = jest.fn().mockReturnValue({ eq })
const mockFrom = jest.fn().mockReturnValue({ insert, update })

jest.mock('@/lib/SupabaseProvider', () => ({ useSupabase: () => ({ from: mockFrom }) }))

const oldHabit = {
  id: 'old', user_id: 'me', title: 'read', emoji: '📖', cadence: 'daily',
  reminder_time: null, grace_days_pw: 2, is_archived: false, created_at: '2026-01-01',
}

describe('useReplaceHabit', () => {
  it('creates a fresh habit then archives the old one', async () => {
    const { result } = renderHookWithQuery(() => useReplaceHabit())

    await act(async () => {
      await result.current.mutateAsync({ oldHabit, title: 'meditate', emoji: '🧘' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // New habit created with the new identity, inheriting cadence/grace/reminder.
    expect(insert).toHaveBeenCalledWith({
      user_id: 'me',
      title: 'meditate',
      emoji: '🧘',
      cadence: 'daily',
      grace_days_pw: 2,
      reminder_time: null,
    })
    // Old habit archived.
    expect(update).toHaveBeenCalledWith({ is_archived: true })
    expect(eq).toHaveBeenCalledWith('id', 'old')
  })
})
