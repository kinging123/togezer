// Set up environment variables for testing
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Set up globals needed for React Native
global.__DEV__ = true

// Mock Clerk
jest.mock('@clerk/expo', () => ({
  useSession: () => ({ session: { getToken: jest.fn().mockResolvedValue('test-token') } }),
  ClerkProvider: ({ children }) => children,
}))
