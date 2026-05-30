import { render, fireEvent } from '@testing-library/react-native'

const mockSignOut = jest.fn()
jest.mock('@clerk/expo', () => ({ useAuth: () => ({ signOut: mockSignOut }) }))

jest.mock('@/components/Button', () => {
  const { Pressable, Text } = require('react-native')
  return {
    Button: ({ label, onPress }: { label: string; onPress: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
  }
})

import { SignOutButton } from '@/features/auth/components/SignOutButton'

describe('SignOutButton', () => {
  beforeEach(() => mockSignOut.mockClear())

  it('requires a second confirming tap before signing out', () => {
    const { getByText, queryByText } = render(<SignOutButton />)

    // First tap arms the confirm; does not sign out.
    fireEvent.press(getByText('sign out'))
    expect(mockSignOut).not.toHaveBeenCalled()
    expect(getByText('yes, sign out')).toBeTruthy()

    // Confirming tap signs out.
    fireEvent.press(getByText('yes, sign out'))
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('can be cancelled before confirming', () => {
    const { getByText, queryByText } = render(<SignOutButton />)
    fireEvent.press(getByText('sign out'))
    fireEvent.press(getByText('cancel'))
    expect(queryByText('yes, sign out')).toBeNull()
    expect(getByText('sign out')).toBeTruthy()
    expect(mockSignOut).not.toHaveBeenCalled()
  })
})
