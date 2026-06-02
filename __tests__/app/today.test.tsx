import { render, fireEvent } from '@testing-library/react-native'

jest.mock('@/features/habits/hooks/useHabits', () => ({ useHabits: jest.fn() }))
jest.mock('@/features/check-in/hooks/useHabitStatus', () => ({ useHabitStatus: jest.fn() }))
jest.mock('@/features/friends/hooks/useFriendsActivity', () => ({ useFriendsActivity: jest.fn() }))
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))

import TodayScreen from '@/app/(app)/(tabs)/index'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { useFriendsActivity } from '@/features/friends/hooks/useFriendsActivity'

const mockUseHabits = useHabits as jest.Mock
const mockUseHabitStatus = useHabitStatus as jest.Mock
const mockUseFriends = useFriendsActivity as jest.Mock

const habit = {
  id: 'h1', user_id: 'me', title: 'read 20 min', emoji: '📖', cadence: 'daily',
  reminder_time: null, grace_days_pw: 1, is_archived: false, created_at: '2026-01-01',
}
const status = { streak: 7, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: false }

beforeEach(() => {
  mockUseHabits.mockReturnValue({ data: [habit], isLoading: false })
  mockUseHabitStatus.mockReturnValue({ data: status })
  mockUseFriends.mockReturnValue({ data: [], refetch: jest.fn(), isRefetching: false })
})

describe('TodayScreen', () => {
  it('renders my streak card', () => {
    const { getByText } = render(<TodayScreen />)
    expect(getByText('7')).toBeTruthy()
    expect(getByText('read 20 min')).toBeTruthy()
  })

  it('shows the invite prompt when there are no friends, linking to the in-app invite', () => {
    const { getByText, getByTestId } = render(<TodayScreen />)
    expect(getByText('bring the gang →')).toBeTruthy()
    const { router } = require('expo-router')
    fireEvent.press(getByTestId('invite-prompt'))
    expect(router.push).toHaveBeenCalledWith('/invite-friends')
  })

  it('shows the gang with a checked-in counter', () => {
    mockUseFriends.mockReturnValue({
      data: [
        { profile: { id: 'zoe', display_name: 'zoe', username: 'zoe', avatar_url: null },
          habit: { id: 'hz', title: 'meditate', emoji: '🧘' },
          status: { streak: 3, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: true },
          recentDates: [] },
        { profile: { id: 'amy', display_name: 'amy', username: 'amy', avatar_url: null },
          habit: { id: 'ha', title: 'run', emoji: '🏃' },
          status: { streak: 0, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: false },
          recentDates: [] },
      ],
      refetch: jest.fn(), isRefetching: false,
    })
    const { getByText } = render(<TodayScreen />)
    expect(getByText('zoe')).toBeTruthy()
    expect(getByText('1 of 2 in')).toBeTruthy()
  })
})
