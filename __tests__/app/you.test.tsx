import { render, fireEvent } from '@testing-library/react-native'

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))
jest.mock('@/features/auth/hooks/useCurrentUser', () => ({ useCurrentUser: jest.fn() }))
jest.mock('@/features/habits/hooks/useHabits', () => ({ useHabits: jest.fn() }))
jest.mock('@/features/check-in/hooks/useHabitStatus', () => ({ useHabitStatus: jest.fn() }))
jest.mock('@/features/friends/hooks/useFriends', () => ({ useFriends: jest.fn() }))
jest.mock('@/features/auth/components/SignOutButton', () => {
  const { Text } = require('react-native')
  return { SignOutButton: () => <Text>sign out</Text> }
})

import YouScreen from '@/app/(app)/(tabs)/you'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { useFriends } from '@/features/friends/hooks/useFriends'

const mockUser = useCurrentUser as jest.Mock
const mockHabits = useHabits as jest.Mock
const mockStatus = useHabitStatus as jest.Mock
const mockFriends = useFriends as jest.Mock

const profile = {
  id: 'me', username: 'reuven', display_name: 'reuven', avatar_url: null,
  push_token: null, timezone: 'UTC', created_at: '2026-05-01T00:00:00Z',
}
const habit = {
  id: 'h1', user_id: 'me', title: 'read 20 min', emoji: '📖', cadence: 'daily',
  reminder_time: null, grace_days_pw: 1, is_archived: false, created_at: '2026-01-01',
}

beforeEach(() => {
  mockUser.mockReturnValue({ data: profile, isLoading: false })
  mockHabits.mockReturnValue({ data: [habit], isLoading: false })
  mockStatus.mockReturnValue({ data: { streak: 7, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: false } })
  mockFriends.mockReturnValue({ data: [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }] })
})

describe('YouScreen', () => {
  it('renders profile identity', () => {
    const { getByText } = render(<YouScreen />)
    expect(getByText('reuven')).toBeTruthy()
    expect(getByText('@reuven')).toBeTruthy()
    expect(getByText('member since may 2026')).toBeTruthy()
  })

  it('renders stat tiles: streak, friends count, grace left', () => {
    const { getByText } = render(<YouScreen />)
    expect(getByText('7')).toBeTruthy() // streak
    expect(getByText('3')).toBeTruthy() // friends count
    expect(getByText('1')).toBeTruthy() // grace left (1 - 0)
    expect(getByText('day streak')).toBeTruthy()
    expect(getByText('friends')).toBeTruthy()
    expect(getByText('grace left')).toBeTruthy()
  })

  it('renders the habit summary and sign-out', () => {
    const { getByText } = render(<YouScreen />)
    expect(getByText('read 20 min')).toBeTruthy()
    expect(getByText('sign out')).toBeTruthy()
  })

  it('opens the edit-habit modal when the habit card is tapped', () => {
    const { router } = require('expo-router')
    const { getByTestId } = render(<YouScreen />)
    fireEvent.press(getByTestId('edit-habit'))
    expect(router.push).toHaveBeenCalledWith('/edit-habit/h1')
  })

  it('shows a loader until profile and habit are ready', () => {
    mockUser.mockReturnValue({ data: undefined, isLoading: true })
    const { queryByText } = render(<YouScreen />)
    expect(queryByText('reuven')).toBeNull()
  })
})
