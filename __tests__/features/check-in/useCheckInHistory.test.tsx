import { renderHookWithQuery } from '../../test-utils'
import { useCheckInHistory } from '@/features/check-in/hooks/useCheckInHistory'
import { waitFor } from '@testing-library/react-native'

jest.mock('@clerk/expo', () => ({ useAuth: () => ({ userId: 'me' }) }))

const rows = [
  { checked_date: '2026-05-30', note: 'done' },
  { checked_date: '2026-05-29', note: null },
]

const order = jest.fn().mockResolvedValue({ data: rows, error: null })
const eq2 = jest.fn().mockReturnValue({ order })
const eq1 = jest.fn().mockReturnValue({ eq: eq2 })
const select = jest.fn().mockReturnValue({ eq: eq1 })
const mockFrom = jest.fn().mockReturnValue({ select })

jest.mock('@/lib/SupabaseProvider', () => ({ useSupabase: () => ({ from: mockFrom }) }))

describe('useCheckInHistory', () => {
  it('fetches the habit check-ins for the current user, newest first', async () => {
    const { result } = renderHookWithQuery(() => useCheckInHistory('h1'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFrom).toHaveBeenCalledWith('check_ins')
    expect(eq1).toHaveBeenCalledWith('habit_id', 'h1')
    expect(eq2).toHaveBeenCalledWith('user_id', 'me')
    expect(result.current.data).toEqual(rows)
  })
})
