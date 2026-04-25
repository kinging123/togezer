import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ code: 'test99' }),
  Redirect: ({ href }: { href: string }) => null,
  router: { replace: jest.fn() },
}))

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
}))

jest.mock('@/features/friends/hooks/useAcceptInvite', () => ({
  useAcceptInvite: () => ({ mutateAsync: jest.fn() }),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}))

jest.mock('react-native', () => ({
  View: 'View',
  ActivityIndicator: 'ActivityIndicator',
}))

const { default: InvitePage } = require('@/app/j/[code]')

describe('app/j/[code]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('stores the invite code in AsyncStorage when user is not signed in', async () => {
    const { setItem } = require('@react-native-async-storage/async-storage')
    render(<InvitePage />)
    await waitFor(() => {
      expect(setItem).toHaveBeenCalledWith('pendingInvite', 'test99')
    })
  })
})
