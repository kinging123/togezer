import { thisWeekCount } from '@/features/check-in/lib/historyStats'

// May 30 2026 is a Saturday; its week runs Sun May 24 .. Sat May 30.
const today = new Date(2026, 4, 30)

describe('thisWeekCount', () => {
  it('counts only check-ins within the current week', () => {
    const dates = ['2026-05-24', '2026-05-27', '2026-05-30', '2026-05-23']
    expect(thisWeekCount(dates, today)).toBe(3) // excludes 05-23 (previous week)
  })

  it('is 0 when nothing this week', () => {
    expect(thisWeekCount(['2026-05-23', '2026-05-20'], today)).toBe(0)
  })
})
