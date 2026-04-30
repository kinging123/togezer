import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

jest.mock('@/components/Button', () => ({
  Button: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => {
    // require instead of import: jest.mock is hoisted above imports, so dynamic require avoids the TDZ
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native')
    return (
      <Pressable onPress={disabled ? undefined : onPress} disabled={disabled}>
        <Text>{label}</Text>
      </Pressable>
    )
  },
}))

import PickHabitScreen from '@/app/(onboarding)/pick-habit'

const mockMutateAsync = jest.fn()
jest.mock('@/features/habits/hooks/useCreateHabit', () => ({
  useCreateHabit: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))

const mockPush = jest.fn()
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }))

describe('PickHabitScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutateAsync.mockResolvedValue({ id: 'h1', title: 'journal' })
  })

  it('does not submit when title is empty', async () => {
    const { getByText } = render(<PickHabitScreen />)
    fireEvent.press(getByText('next →'))
    await waitFor(() => expect(mockMutateAsync).not.toHaveBeenCalled())
  })

  it('tapping a preset fills the text input', () => {
    const { getByText, getByDisplayValue } = render(<PickHabitScreen />)
    fireEvent.press(getByText('journal'))
    expect(getByDisplayValue('journal')).toBeTruthy()
  })

  it('tapping a second preset replaces the first', () => {
    const { getByText, getByDisplayValue } = render(<PickHabitScreen />)
    fireEvent.press(getByText('move body'))
    fireEvent.press(getByText('journal'))
    expect(getByDisplayValue('journal')).toBeTruthy()
  })

  it('submits with correct args and navigates to invite', async () => {
    const { getByText } = render(<PickHabitScreen />)
    fireEvent.press(getByText('journal'))
    fireEvent.press(getByText('next →'))
    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({
        title: 'journal',
        emoji: '📓',
        cadence: 'daily',
      })
    )
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/invite')
  })

  it('shows error message when mutation fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('db error'))
    const { getByText, findByText } = render(<PickHabitScreen />)
    fireEvent.press(getByText('journal'))
    fireEvent.press(getByText('next →'))
    expect(await findByText('something went wrong')).toBeTruthy()
  })
})
