import { View, StyleSheet } from 'react-native'
import { Colors, Radii } from '@/constants/theme'

// Columns of 7 'YYYY-MM-DD' dates (Sun..Sat), oldest week first, ending with
// the week containing `today`.
export function buildWeeks(today: Date, weeks: number): string[][] {
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
  const cols: string[][] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const col: string[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() - w * 7 + d)
      col.push(date.toLocaleDateString('en-CA'))
    }
    cols.push(col)
  }
  return cols
}

type Props = { checkedDates: string[]; weeks?: number; today?: Date }

export function ContributionGrid({ checkedDates, weeks = 13, today = new Date() }: Props) {
  const checked = new Set(checkedDates)
  const todayStr = today.toLocaleDateString('en-CA')
  const cols = buildWeeks(today, weeks)

  return (
    <View testID="contribution-grid" style={styles.grid}>
      {cols.map((col, ci) => (
        <View key={ci} style={styles.col}>
          {col.map((date) => {
            const future = date > todayStr
            const on = checked.has(date)
            const testID = on ? 'cell-on' : future ? 'cell-future' : 'cell-off'
            return (
              <View key={date} testID={testID} style={[styles.cell, on && styles.on, future && styles.future]} />
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 3 },
  col: { gap: 3 },
  cell: { width: 13, height: 13, borderRadius: Radii.xs, backgroundColor: Colors.line },
  on: { backgroundColor: Colors.ink },
  future: { backgroundColor: 'transparent' },
})
