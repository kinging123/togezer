import { render, fireEvent } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'h1' }),
}))
jest.mock('@/features/habits/hooks/useHabit', () => ({ useHabit: jest.fn() }))
jest.mock('@/features/check-in/hooks/useHabitStatus', () => ({ useHabitStatus: jest.fn() }))
jest.mock('@/features/check-in/hooks/useCheckInHistory', () => ({ useCheckInHistory: jest.fn() }))

import HabitDetailScreen from '@/app/(app)/habits/[id]'
import { router } from 'expo-router'
import { useHabit } from '@/features/habits/hooks/useHabit'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { useCheckInHistory } from '@/features/check-in/hooks/useCheckInHistory'

const mockHabit = useHabit as jest.Mock
const mockStatus = useHabitStatus as jest.Mock
const mockHistory = useCheckInHistory as jest.Mock

const habit = {
  id: 'h1', user_id: 'me', title: 'read 20 min', emoji: '📖', cadence: 'daily',
  reminder_time: null, grace_days_pw: 1, is_archived: false, created_at: '2026-01-01',
}

beforeEach(() => {
  ;(router.back as jest.Mock).mockClear()
  ;(router.push as jest.Mock).mockClear()
  mockHabit.mockReturnValue({ data: habit })
  mockStatus.mockReturnValue({ data: { streak: 9, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: true } })
  // Dates in Jan 2026 so "this week" is 0 regardless of when the test runs,
  // keeping the three stat numbers (9 / 4 / 0) distinct.
  mockHistory.mockReturnValue({
    data: [
      { checked_date: '2026-01-04', note: null },
      { checked_date: '2026-01-03', note: 'nice' },
      { checked_date: '2026-01-02', note: null },
      { checked_date: '2026-01-01', note: null },
    ],
  })
})

describe('HabitDetailScreen', () => {
  it('renders title, stats and the heatmap', () => {
    const { getByText, getByTestId } = render(<HabitDetailScreen />)
    expect(getByText('read 20 min')).toBeTruthy()
    expect(getByText('9')).toBeTruthy() // streak
    expect(getByText('4')).toBeTruthy() // total check-ins
    expect(getByText('day streak')).toBeTruthy()
    expect(getByText('check-ins')).toBeTruthy()
    expect(getByText('this week')).toBeTruthy()
    expect(getByTestId('contribution-grid')).toBeTruthy()
  })

  it('navigates back and to edit', () => {
    const { getByTestId } = render(<HabitDetailScreen />)
    fireEvent.press(getByTestId('back'))
    expect(router.back).toHaveBeenCalled()
    fireEvent.press(getByTestId('edit'))
    expect(router.push).toHaveBeenCalledWith('/edit-habit/h1')
  })
})
