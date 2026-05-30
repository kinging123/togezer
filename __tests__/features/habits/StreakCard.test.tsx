import { render, fireEvent } from '@testing-library/react-native'
import { StreakCard } from '@/features/habits/components/StreakCard'

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))
import { router } from 'expo-router'
const mockPush = router.push as jest.Mock

const habit = {
  id: 'h1', user_id: 'me', title: 'read 20 min', emoji: '📖', cadence: 'daily',
  reminder_time: null, grace_days_pw: 1, is_archived: false, created_at: '2026-01-01',
}

const baseStatus = { streak: 7, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: false }

describe('StreakCard', () => {
  beforeEach(() => mockPush.mockClear())

  it('shows streak, habit, and a check-in CTA that navigates to the modal', () => {
    const { getByText, getByTestId } = render(<StreakCard habit={habit} status={baseStatus} />)
    expect(getByText('7')).toBeTruthy()
    expect(getByText('read 20 min')).toBeTruthy()
    fireEvent.press(getByTestId('check-in-cta'))
    expect(mockPush).toHaveBeenCalledWith('/check-in/h1')
  })

  it('shows a done state and no CTA when already checked in', () => {
    const { queryByTestId, getByText } = render(
      <StreakCard habit={habit} status={{ ...baseStatus, hasCheckedInToday: true }} />
    )
    expect(queryByTestId('check-in-cta')).toBeNull()
    expect(getByText('checked in ✓')).toBeTruthy()
  })
})
