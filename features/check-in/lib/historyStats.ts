// Number of check-ins in the current week (Sunday..today), from a list of
// 'YYYY-MM-DD' local date strings.
export function thisWeekCount(dates: string[], today: Date = new Date()): number {
  const checked = new Set(dates)
  const dow = today.getDay() // 0 = Sunday
  let count = 0
  for (let i = 0; i <= dow; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (dow - i))
    if (checked.has(d.toLocaleDateString('en-CA'))) count++
  }
  return count
}
