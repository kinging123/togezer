import { renderHookWithQuery } from '../../test-utils'
import { useFriendsActivity } from '@/features/friends/hooks/useFriendsActivity'
import { waitFor } from '@testing-library/react-native'

jest.mock('@clerk/expo', () => ({ useAuth: () => ({ userId: 'me' }) }))

const today = new Date().toLocaleDateString('en-CA')

const rows = [
  {
    id: 'h-zoe', user_id: 'zoe', title: 'meditate', emoji: '🧘',
    created_at: '2026-01-01', grace_days_pw: 1,
    profile: { id: 'zoe', display_name: 'zoe', username: 'zoe', avatar_url: null },
    check_ins: [{ checked_date: today }],
  },
  {
    id: 'h-amy', user_id: 'amy', title: 'run', emoji: '🏃',
    created_at: '2026-01-01', grace_days_pw: 1,
    profile: { id: 'amy', display_name: 'amy', username: 'amy', avatar_url: null },
    check_ins: [],
  },
]

const neq = jest.fn().mockResolvedValue({ data: rows, error: null })
const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq,
})

jest.mock('@/lib/SupabaseProvider', () => ({ useSupabase: () => ({ from: mockFrom }) }))

describe('useFriendsActivity', () => {
  it('assembles per-friend status sorted by name and excludes own habit', async () => {
    const { result } = renderHookWithQuery(() => useFriendsActivity())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.map((d) => d.profile.display_name)).toEqual(['amy', 'zoe']) // sorted
    expect(mockFrom).toHaveBeenCalledWith('habits')
    expect(neq).toHaveBeenCalledWith('user_id', 'me')

    const zoe = data.find((d) => d.profile.id === 'zoe')!
    expect(zoe.status.hasCheckedInToday).toBe(true)
    expect(zoe.recentDates).toEqual([today])

    const amy = data.find((d) => d.profile.id === 'amy')!
    expect(amy.status.hasCheckedInToday).toBe(false)
  })
})
