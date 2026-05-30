import { renderHookWithQuery } from '../../test-utils'
import { useUpdateHabit } from '@/features/habits/hooks/useUpdateHabit'
import { act, waitFor } from '@testing-library/react-native'

const eq = jest.fn().mockResolvedValue({ error: null })
const update = jest.fn().mockReturnValue({ eq })
const mockFrom = jest.fn().mockReturnValue({ update })

jest.mock('@/lib/SupabaseProvider', () => ({ useSupabase: () => ({ from: mockFrom }) }))

describe('useUpdateHabit', () => {
  it('updates title and emoji for the given habit id', async () => {
    const { result } = renderHookWithQuery(() => useUpdateHabit())

    await act(async () => {
      await result.current.mutateAsync({ id: 'h1', title: 'read more', emoji: '📚' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFrom).toHaveBeenCalledWith('habits')
    expect(update).toHaveBeenCalledWith({ title: 'read more', emoji: '📚' })
    expect(eq).toHaveBeenCalledWith('id', 'h1')
  })
})
