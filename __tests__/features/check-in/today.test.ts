import { queryClient } from '@/lib/queryClient'
import { localDateStr, refreshIfDayChanged, getToday } from '@/features/check-in/lib/today'

describe('today rollover store', () => {
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('formats a Date as a local YYYY-MM-DD string', () => {
    expect(localDateStr(new Date(2026, 5, 16, 23, 59))).toBe('2026-06-16')
  })

  it('invalidates date-dependent queries only when the local day rolls over', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2026, 5, 15, 10, 0, 0))
    refreshIfDayChanged() // sync the store to 2026-06-15

    const spy = jest
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined as never)

    // Same day → no-op
    expect(refreshIfDayChanged()).toBe(false)
    expect(spy).not.toHaveBeenCalled()

    // Cross midnight → invalidate check-ins (all) and the habit list
    jest.setSystemTime(new Date(2026, 5, 16, 0, 30, 0))
    expect(refreshIfDayChanged()).toBe(true)
    expect(getToday()).toBe('2026-06-16')
    expect(spy).toHaveBeenCalledWith({ queryKey: ['check-ins'] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['habits', 'list'] })
  })
})
