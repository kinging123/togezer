import { render } from '@testing-library/react-native'
import { ContributionGrid, buildWeeks } from '@/features/check-in/components/ContributionGrid'

// May 30 2026 is a Saturday (last day of its week).
const sat = new Date(2026, 4, 30)
const wed = new Date(2026, 4, 27)

describe('buildWeeks', () => {
  it('returns `weeks` columns of 7 days, ending with today', () => {
    const cols = buildWeeks(sat, 13)
    expect(cols).toHaveLength(13)
    expect(cols.every((c) => c.length === 7)).toBe(true)
    expect(cols[12][6]).toBe('2026-05-30') // last cell = Saturday = today
    expect(cols[12][0]).toBe('2026-05-24') // that week's Sunday
  })
})

describe('ContributionGrid', () => {
  it('fills a cell for each checked day in the window', () => {
    const { getAllByTestId } = render(
      <ContributionGrid checkedDates={['2026-05-20', '2026-05-27', '2026-05-30']} weeks={2} today={sat} />
    )
    expect(getAllByTestId('cell-on')).toHaveLength(3)
    // 2 weeks × 7 days = 14 cells total
    const total =
      getAllByTestId('cell-on').length +
      getAllByTestId('cell-off').length
    expect(total).toBe(14)
  })

  it('marks days after today as future (not filled)', () => {
    const { getAllByTestId, queryAllByTestId } = render(
      <ContributionGrid checkedDates={[]} weeks={1} today={wed} />
    )
    // current week Sun May24..Sat May30; days after Wed 27 → Thu/Fri/Sat = 3 future
    expect(getAllByTestId('cell-future')).toHaveLength(3)
    expect(queryAllByTestId('cell-on')).toHaveLength(0)
  })
})
