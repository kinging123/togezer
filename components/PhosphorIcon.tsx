import Svg, { Path } from 'react-native-svg'
import { Colors } from '@/constants/theme'

// Phosphor Icons (https://phosphoricons.com), "fill" weight — MIT licensed.
// 256×256 viewBox, single path each. Add more here as the app needs them.
const PATHS = {
  house:
    'M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164a4,4,0,0,0-4-4H108a4,4,0,0,0-4,4v52a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V120a16,16,0,0,1,4.69-11.31l80-80a16,16,0,0,1,22.62,0l80,80A16,16,0,0,1,224,120Z',
  user:
    'M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z',
} as const

export type PhosphorIconName = keyof typeof PATHS

type Props = { name: PhosphorIconName; color?: string; size?: number }

export function PhosphorIcon({ name, color = Colors.ink, size = 26 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill={color}>
      <Path d={PATHS[name]} />
    </Svg>
  )
}
