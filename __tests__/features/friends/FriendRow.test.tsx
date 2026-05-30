import { render } from '@testing-library/react-native'
import { FriendRow } from '@/features/friends/components/FriendRow'
import type { FriendActivity } from '@/features/friends/types'

const activity: FriendActivity = {
  profile: { id: 'zoe', display_name: 'zoe', username: 'zoe', avatar_url: null },
  habit: { id: 'h-zoe', title: 'meditate', emoji: '🧘' },
  status: { streak: 3, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: true },
  recentDates: [],
}

describe('FriendRow', () => {
  it('renders name, habit and a done check when checked in today', () => {
    const { getByText, getByTestId } = render(<FriendRow activity={activity} />)
    expect(getByText('zoe')).toBeTruthy()
    expect(getByText('🧘 meditate')).toBeTruthy()
    expect(getByTestId('today-check').props.children).toBe('✅')
  })

  it('renders an empty box when not checked in today', () => {
    const { getByTestId } = render(
      <FriendRow activity={{ ...activity, status: { ...activity.status, hasCheckedInToday: false } }} />
    )
    expect(getByTestId('today-check').props.children).toBe('⬜')
  })
})
