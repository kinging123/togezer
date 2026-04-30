import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

jest.mock('@/components/Button', () => {
  // require instead of import: jest.mock is hoisted above imports, so dynamic require avoids the TDZ
  const { Pressable, Text } = require('react-native')
  return {
    Button: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
      <Pressable onPress={disabled ? undefined : onPress} disabled={disabled}>
        <Text>{label}</Text>
      </Pressable>
    ),
  }
})

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(undefined) }))

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Share: { share: jest.fn().mockResolvedValue({ action: 'sharedAction' }) },
}))

jest.mock('@/features/friends/hooks/useInviteCode', () => ({
  useInviteCode: jest.fn(),
}))

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }))

import InviteScreen from '@/app/(onboarding)/invite'
import { useInviteCode } from '@/features/friends/hooks/useInviteCode'
import * as Clipboard from 'expo-clipboard'
import { Share } from 'react-native'
import { router } from 'expo-router'

const mockUseInviteCode = useInviteCode as jest.MockedFunction<typeof useInviteCode>
const mockSetStringAsync = Clipboard.setStringAsync as jest.MockedFunction<typeof Clipboard.setStringAsync>
const mockShare = Share.share as jest.MockedFunction<typeof Share.share>
const mockReplace = router.replace as jest.MockedFunction<typeof router.replace>

const mockRefetch = jest.fn()

describe('InviteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseInviteCode.mockReturnValue({
      data: { code: 'abc1' } as any,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any)
  })

  it('displays the invite URL', () => {
    const { getByText } = render(<InviteScreen />)
    expect(getByText('togezer.vercel.app/j/abc1')).toBeTruthy()
  })

  it('copy writes full URL to clipboard', async () => {
    const { getByText } = render(<InviteScreen />)
    fireEvent.press(getByText('copy'))
    await waitFor(() =>
      expect(mockSetStringAsync).toHaveBeenCalledWith('https://togezer.vercel.app/j/abc1')
    )
  })

  it('share opens native share sheet with full URL', async () => {
    const { getByText } = render(<InviteScreen />)
    fireEvent.press(getByText('share →'))
    await waitFor(() =>
      expect(mockShare).toHaveBeenCalledWith({ message: 'https://togezer.vercel.app/j/abc1' })
    )
  })

  it('continue navigates to /(app)', () => {
    const { getByText } = render(<InviteScreen />)
    fireEvent.press(getByText('continue →'))
    expect(mockReplace).toHaveBeenCalledWith('/(app)')
  })

  it('skip navigates to /(app)', () => {
    const { getByText } = render(<InviteScreen />)
    fireEvent.press(getByText('skip — go solo'))
    expect(mockReplace).toHaveBeenCalledWith('/(app)')
  })

  it('shows error and retry when useInviteCode fails', () => {
    mockUseInviteCode.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    } as any)
    const { getByText } = render(<InviteScreen />)
    expect(getByText('failed to load — tap to retry')).toBeTruthy()
    fireEvent.press(getByText('failed to load — tap to retry'))
    expect(mockRefetch).toHaveBeenCalled()
  })
})
