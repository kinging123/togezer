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
const freshStatus = { streak: 0, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: false }

describe('CheckInSheet', () => {
  beforeEach(() => { mockMutateAsync.mockClear(); mockMutateAsync.mockResolvedValue({}) })

  it('submits with the note and shows the ticked-up streak (0 -> 1)', async () => {
    const { getByTestId, getByText } = render(<CheckInSheet habit={habit} status={freshStatus} />)
    fireEvent.changeText(getByTestId('note-input'), '  did it  ')
    await act(async () => { fireEvent.press(getByTestId('confirm')) })
    expect(getByTestId('checkin-success')).toBeTruthy()
    expect(mockMutateAsync).toHaveBeenCalledWith({ habitId: 'h1', note: 'did it' })
    expect(getByText('0')).toBeTruthy() // old (struck through)
    expect(getByText('1')).toBeTruthy() // new
  })

  it('keeps the snapshot even if the live status advances after check-in', async () => {
    // useCheckIn invalidates the status query; the parent re-renders CheckInSheet
    // with an updated status (now counting today). The success view must keep
    // showing the snapshot (0 -> 1), not re-derive from the new status (1 -> 2).
    const { getByTestId, getByText, queryByText, rerender } = render(
      <CheckInSheet habit={habit} status={freshStatus} />
    )
    await act(async () => { fireEvent.press(getByTestId('confirm')) })
    rerender(
      <CheckInSheet habit={habit} status={{ ...freshStatus, streak: 1, hasCheckedInToday: true }} />
    )
    expect(getByText('1')).toBeTruthy()
    expect(queryByText('2')).toBeNull()
  })

  it('ticks up correctly from a non-zero streak (7 -> 8)', async () => {
    const { getByTestId, getByText } = render(
      <CheckInSheet habit={habit} status={{ ...freshStatus, streak: 7 }} />
    )
    await act(async () => { fireEvent.press(getByTestId('confirm')) })
    expect(getByText('7')).toBeTruthy()
    expect(getByText('8')).toBeTruthy()
  })

  it('treats a 23505 unique violation as already-done success', async () => {
    mockMutateAsync.mockRejectedValueOnce({ code: '23505' })
    const { getByTestId } = render(<CheckInSheet habit={habit} status={freshStatus} />)
    await act(async () => { fireEvent.press(getByTestId('confirm')) })
    expect(getByTestId('checkin-success')).toBeTruthy()
  })

  it('does not show a +1 increment on the 23505 already-done path', async () => {
    // Nothing was inserted (today was already checked in), so the success view
    // must NOT animate a struck-through "old -> new" tick. It just confirms the
    // current streak (1, which already includes today).
    mockMutateAsync.mockRejectedValueOnce({ code: '23505' })
    const { getByTestId, getByText, queryByTestId } = render(
      <CheckInSheet habit={habit} status={freshStatus} />
    )
    await act(async () => { fireEvent.press(getByTestId('confirm')) })
    expect(getByText('1')).toBeTruthy()                  // current streak (today counted)
    expect(queryByTestId('streak-tick-old')).toBeNull()  // no struck-through old number
  })

  it('shows the struck-through old number only when the check-in increments', async () => {
    const { getByTestId } = render(<CheckInSheet habit={habit} status={{ ...freshStatus, streak: 7 }} />)
    await act(async () => { fireEvent.press(getByTestId('confirm')) })
    expect(getByTestId('streak-tick-old')).toBeTruthy()
  })
})
