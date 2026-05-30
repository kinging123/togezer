import { render } from '@testing-library/react-native'
import { StreakDots } from '@/components/StreakDots'

const today = new Date(2026, 4, 30) // May 30 2026, local

describe('StreakDots', () => {
  it('renders one dot per day, on when checked', () => {
    // last 5 days ending May 30: 26,27,28,29,30
    const { getAllByTestId } = render(
      <StreakDots checkedDates={['2026-05-30', '2026-05-28', '2026-05-26']} days={5} today={today} />
    )
    expect(getAllByTestId('dot-on')).toHaveLength(3)
    expect(getAllByTestId('dot-off')).toHaveLength(2)
  })

  it('defaults to 5 days', () => {
    const { queryAllByTestId } = render(<StreakDots checkedDates={[]} today={today} />)
    expect(queryAllByTestId('dot-off')).toHaveLength(5)
  })
})
