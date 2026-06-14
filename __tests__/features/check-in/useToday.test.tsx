import { render, act } from '@testing-library/react-native'
import { Text } from 'react-native'
import { useToday } from '@/features/check-in/hooks/useToday'
import { refreshIfDayChanged } from '@/features/check-in/lib/today'

function Probe() {
  const today = useToday()
  return <Text testID="day">{today}</Text>
}

describe('useToday', () => {
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('re-renders with the new day when the local date rolls over', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2026, 5, 15, 10, 0, 0))
    const { getByTestId } = render(<Probe />)
    act(() => { refreshIfDayChanged() })
    expect(getByTestId('day').props.children).toBe('2026-06-15')

    jest.setSystemTime(new Date(2026, 5, 16, 0, 5, 0))
    act(() => { refreshIfDayChanged() })
    expect(getByTestId('day').props.children).toBe('2026-06-16')
  })
})
