import { StyleSheet, Text } from 'react-native'
import { Colors, Fonts } from '@/constants/theme'

type Props = {
  size?: number
}

export function Logo({ size = 28 }: Props) {
  const ls = -(size * 0.04)
  return (
    <Text style={[styles.root, { fontSize: size, lineHeight: size * 1.15, letterSpacing: ls }]}>
      toge<Text style={[styles.accent, { fontSize: size }]}>z</Text>er
    </Text>
  )
}

const styles = StyleSheet.create({
  root: {
    fontFamily: Fonts.display,
    color: Colors.ink,
  },
  accent: {
    color: Colors.red,
    fontStyle: 'italic',
  },
})
