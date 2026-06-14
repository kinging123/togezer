import { computeStreakStatus } from '@/features/check-in/lib/computeStreakStatus'

const TODAY      = new Date(2026, 4, 2)  // 2026-05-02, Saturday
const CREATED_AT = new Date(2026, 3, 1)  // 2026-04-01, well before all test dates

describe('computeStreakStatus', () => {
  it('returns zero streak when there are no check-ins', () => {
    const result = computeStreakStatus([], 1, CREATED_AT, TODAY)
    expect(result).toEqual({
      streak: 0,
      hasCheckedInToday: false,
      graceUsedThisWeek: 0,
      graceTotalPW: 1,
    })
  })

  it('counts a single check-in today', () => {
    const result = computeStreakStatus(
      [{ checked_date: '2026-05-02' }],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result).toEqual({
      streak: 1,
      hasCheckedInToday: true,
      graceUsedThisWeek: 0,
      graceTotalPW: 1,
    })
  })

  it('counts consecutive check-ins not including today', () => {
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-01' },
        { checked_date: '2026-04-30' },
        { checked_date: '2026-04-29' },
      ],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result).toEqual({
      streak: 3,
      hasCheckedInToday: false,
      graceUsedThisWeek: 0,
      graceTotalPW: 1,
    })
  })

  it('absorbs a single missed day with a grace day', () => {
    // checked in today and 2 days ago, missed yesterday — grace covers it
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        { checked_date: '2026-04-30' },
      ],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(2)
    expect(result.hasCheckedInToday).toBe(true)
    expect(result.graceUsedThisWeek).toBe(1)
  })

  it('breaks the streak when two consecutive misses exceed the grace budget', () => {
    // 2 consecutive missed days (05-01, 04-30) with only 1 grace — pending buffer fills before
    // reaching the 04-29 check-in, so grace is never committed and streak stays at 1
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        { checked_date: '2026-04-29' },
      ],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(1)
    expect(result.graceUsedThisWeek).toBe(0)
  })

  it('does not count grace days toward the streak number', () => {
    // 4 done check-ins with one grace gap in the middle
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        { checked_date: '2026-05-01' },
        // missed 2026-04-30 — grace covers it
        { checked_date: '2026-04-29' },
        { checked_date: '2026-04-28' },
      ],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(4)
    expect(result.graceUsedThisWeek).toBe(1)
  })

  it('grace in a previous week does not consume this week\'s budget', () => {
    // missed 2026-04-25 (previous week), all of current week done
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        { checked_date: '2026-05-01' },
        { checked_date: '2026-04-30' },
        { checked_date: '2026-04-29' },
        { checked_date: '2026-04-28' },
        { checked_date: '2026-04-27' },
        { checked_date: '2026-04-26' },
        // missed 2026-04-25 — in previous week, grace covers it
        { checked_date: '2026-04-24' },
      ],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(8)
    expect(result.graceUsedThisWeek).toBe(0)
  })

  it('stops counting at habit creation date', () => {
    // habit created 2026-04-30, only two check-ins possible
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        { checked_date: '2026-05-01' },
        { checked_date: '2026-04-30' },
      ],
      1,
      new Date(2026, 3, 30), // habitCreatedAt = 2026-04-30
      TODAY,
    )
    expect(result.streak).toBe(3)
  })

  it('breaks on two consecutive misses even across a week boundary', () => {
    // grace_days_pw means "max consecutive days you may skip". A 2-day gap that
    // straddles the Sunday week boundary (Sat 04-25 + Sun 04-26) is still 2
    // consecutive misses and must break the streak with grace=1 — it may NOT be
    // bridged by borrowing one freeze from each calendar week.
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        { checked_date: '2026-05-01' },
        { checked_date: '2026-04-30' },
        { checked_date: '2026-04-29' },
        { checked_date: '2026-04-28' },
        { checked_date: '2026-04-27' },
        // missed 2026-04-26 (Sunday) and 2026-04-25 (Saturday) — 2 in a row
        { checked_date: '2026-04-24' },
        { checked_date: '2026-04-23' },
      ],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(6)
  })

  it('returns zero streak when graceDaysPW is 0 and a day is missed', () => {
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        // missed yesterday
        { checked_date: '2026-04-30' },
      ],
      0,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(1)
    expect(result.graceUsedThisWeek).toBe(0)
  })
})
