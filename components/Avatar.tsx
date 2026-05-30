import { View, Text, StyleSheet } from 'react-native'
import { Colors, Fonts } from '@/constants/theme'

export function avatarColorForId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return Colors.avatarColors[h % Colors.avatarColors.length]
}

type Props = { id: string; name: string; size?: number }

export function Avatar({ id, name, size = 34 }: Props) {
  const initial = (name.trim()[0] ?? '?').toUpperCase()
  return (
    <View
      testID="avatar"
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColorForId(id) },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  initial: { fontFamily: Fonts.display, color: Colors.ink },
})
