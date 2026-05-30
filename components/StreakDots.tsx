import { View, StyleSheet } from 'react-native'
import { Colors, Radii } from '@/constants/theme'

function lastNDates(today: Date, n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    out.push(d.toLocaleDateString('en-CA'))
  }
  return out
}

type Props = { checkedDates: string[]; days?: number; today?: Date }

export function StreakDots({ checkedDates, days = 5, today = new Date() }: Props) {
  const checked = new Set(checkedDates)
  const dates = lastNDates(today, days)
  return (
    <View testID="streak-dots" style={styles.row}>
      {dates.map((d) => {
        const on = checked.has(d)
        return (
          <View
            key={d}
            testID={on ? 'dot-on' : 'dot-off'}
            style={[styles.dot, on ? styles.on : styles.off]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: Radii.pill },
  on: { backgroundColor: Colors.ink },
  off: { backgroundColor: Colors.line },
})
