import { render, fireEvent, act } from '@testing-library/react-native'

const mockMutateAsync = jest.fn().mockResolvedValue(undefined)
jest.mock('@/features/habits/hooks/useReplaceHabit', () => ({
  useReplaceHabit: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }))
jest.mock('@/components/Button', () => {
  const { Pressable, Text } = require('react-native')
  return {
    Button: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
      <Pressable testID={`btn-${label}`} onPress={disabled ? undefined : onPress} disabled={disabled}>
        <Text>{label}</Text>
      </Pressable>
    ),
  }
})

import { EditHabitForm } from '@/features/habits/components/EditHabitForm'
import { router } from 'expo-router'

const habit = {
  id: 'h1', user_id: 'me', title: 'read 20 min', emoji: '📖', cadence: 'daily',
  reminder_time: null, grace_days_pw: 1, is_archived: false, created_at: '2026-01-01',
}

describe('EditHabitForm', () => {
  beforeEach(() => { mockMutateAsync.mockClear(); (router.back as jest.Mock).mockClear() })

  it('prefills with the current habit title', () => {
    const { getByTestId } = render(<EditHabitForm habit={habit} currentStreak={0} />)
    expect(getByTestId('title-input').props.value).toBe('read 20 min')
  })

  it('saves immediately when streak is 0', async () => {
    const { getByText, getByTestId } = render(<EditHabitForm habit={habit} currentStreak={0} />)
    fireEvent.press(getByText('meditate')) // preset sets title+emoji
    await act(async () => { fireEvent.press(getByTestId('btn-save')) })
    expect(mockMutateAsync).toHaveBeenCalledWith({ oldHabit: habit, title: 'meditate', emoji: '🧘' })
    expect(router.back).toHaveBeenCalled()
  })

  it('does nothing but dismiss when nothing changed', () => {
    const { getByTestId } = render(<EditHabitForm habit={habit} currentStreak={5} />)
    fireEvent.press(getByTestId('btn-save'))
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(router.back).toHaveBeenCalled()
  })

  it('warns before resetting a non-zero streak, then commits on confirm', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<EditHabitForm habit={habit} currentStreak={7} />)
    fireEvent.press(getByText('meditate')) // make a change

    // First save tap warns, does not commit.
    fireEvent.press(getByTestId('btn-save'))
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(getByTestId('reset-warning').props.children).toEqual(
      ['changing your habit starts fresh — your ', 7, '-day streak will reset.']
    )

    // Confirming commits.
    await act(async () => { fireEvent.press(getByTestId('btn-reset & save')) })
    expect(mockMutateAsync).toHaveBeenCalledWith({ oldHabit: habit, title: 'meditate', emoji: '🧘' })
    expect(router.back).toHaveBeenCalled()
  })

  it('can back out of the reset warning with keep my streak', () => {
    const { getByText, getByTestId, queryByTestId } = render(<EditHabitForm habit={habit} currentStreak={7} />)
    fireEvent.press(getByText('meditate'))
    fireEvent.press(getByTestId('btn-save'))
    fireEvent.press(getByTestId('keep-editing'))
    expect(queryByTestId('reset-warning')).toBeNull()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })
})
