import { render } from '@testing-library/react-native'
import { Avatar, avatarColorForId } from '@/components/Avatar'
import { Colors } from '@/constants/theme'

describe('avatarColorForId', () => {
  it('is stable for the same id', () => {
    expect(avatarColorForId('user_abc')).toBe(avatarColorForId('user_abc'))
  })
  it('returns a palette color', () => {
    expect(Colors.avatarColors).toContain(avatarColorForId('user_xyz'))
  })
})

describe('Avatar', () => {
  it('renders the uppercased first initial', () => {
    const { getByText } = render(<Avatar id="u1" name="maya" />)
    expect(getByText('M')).toBeTruthy()
  })
})
