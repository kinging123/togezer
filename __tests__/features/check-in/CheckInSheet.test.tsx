import { render, fireEvent, act } from '@testing-library/react-native'
import { CheckInSheet } from '@/features/check-in/components/CheckInSheet'

const mockMutateAsync = jest.fn().mockResolvedValue({})
jest.mock('@/features/check-in/hooks/useCheckIn', () => ({
  useCheckIn: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }))

const habit = {
  id: 'h1', user_id: 'me', title: 'read 20 min', emoji: '📖', cadence: 'daily',
  reminder_time: null, grace_days_pw: 1, is_archived: false, created_at: '2026-01-01',
}
const status = { streak: 7, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: false }

describe('CheckInSheet', () => {
  beforeEach(() => { mockMutateAsync.mockClear(); mockMutateAsync.mockResolvedValue({}) })

  it('submits with the note and shows the ticked-up streak', async () => {
    const { getByTestId, getByText } = render(<CheckInSheet habit={habit} status={status} />)
    fireEvent.changeText(getByTestId('note-input'), '  did it  ')
    // The confirm handler is async; flush its state update inside act.
    await act(async () => { fireEvent.press(getByTestId('confirm')) })
    expect(getByTestId('checkin-success')).toBeTruthy()
    expect(mockMutateAsync).toHaveBeenCalledWith({ habitId: 'h1', note: 'did it' })
    expect(getByText('8')).toBeTruthy() // 7 -> 8
  })

  it('treats a 23505 unique violation as already-done success', async () => {
    mockMutateAsync.mockRejectedValueOnce({ code: '23505' })
    const { getByTestId } = render(<CheckInSheet habit={habit} status={status} />)
    await act(async () => { fireEvent.press(getByTestId('confirm')) })
    expect(getByTestId('checkin-success')).toBeTruthy()
  })
})
