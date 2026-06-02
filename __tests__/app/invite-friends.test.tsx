import { render, fireEvent } from '@testing-library/react-native'

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
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/features/friends/hooks/useInviteCode', () => ({ useInviteCode: jest.fn() }))
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }))

import InviteFriendsScreen from '@/app/(app)/invite-friends'
import { useInviteCode } from '@/features/friends/hooks/useInviteCode'
import { router } from 'expo-router'

const mockUseInviteCode = useInviteCode as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockUseInviteCode.mockReturnValue({ data: { code: 'abc1' }, isLoading: false, isError: false, refetch: jest.fn() })
})

describe('InviteFriendsScreen (in-app)', () => {
  it('shows the invite link but no onboarding step label', () => {
    const { getByText, queryByText } = render(<InviteFriendsScreen />)
    expect(getByText('togezer.vercel.app/j/abc1')).toBeTruthy()
    expect(queryByText('step 2 of 2')).toBeNull()
    expect(queryByText('skip — go solo')).toBeNull()
  })

  it('returns to the previous screen via back and done', () => {
    const { getByTestId, getByText } = render(<InviteFriendsScreen />)
    fireEvent.press(getByTestId('back'))
    expect(router.back).toHaveBeenCalledTimes(1)
    fireEvent.press(getByText('done'))
    expect(router.back).toHaveBeenCalledTimes(2)
  })
})
