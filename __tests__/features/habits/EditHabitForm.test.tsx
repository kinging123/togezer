import { render, fireEvent, act } from '@testing-library/react-native'

const mockMutateAsync = jest.fn().mockResolvedValue(undefined)
jest.mock('@/features/habits/hooks/useUpdateHabit', () => ({
  useUpdateHabit: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }))
jest.mock('@/components/Button', () => {
  const { Pressable, Text } = require('react-native')
  return {
    Button: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
      <Pressable testID="save" onPress={disabled ? undefined : onPress} disabled={disabled}>
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
    const { getByTestId } = render(<EditHabitForm habit={habit} />)
    expect(getByTestId('title-input').props.value).toBe('read 20 min')
  })

  it('saves the edited title and emoji, then dismisses', async () => {
    const { getByTestId, getByText } = render(<EditHabitForm habit={habit} />)
    fireEvent.changeText(getByTestId('title-input'), 'read more')
    fireEvent.press(getByText('meditate')) // preset sets title+emoji
    await act(async () => { fireEvent.press(getByTestId('save')) })
    expect(mockMutateAsync).toHaveBeenCalledWith({ id: 'h1', title: 'meditate', emoji: '🧘' })
    expect(router.back).toHaveBeenCalled()
  })
})
