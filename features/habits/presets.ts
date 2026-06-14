export type HabitPreset = { emoji: string; title: string }

export const HABIT_PRESETS: HabitPreset[] = [
  { emoji: '🏃', title: 'move body' },
  { emoji: '📖', title: 'read 20 min' },
  { emoji: '📓', title: 'journal' },
  { emoji: '💧', title: 'drink water' },
  { emoji: '🧘', title: 'meditate' },
]

// Curated emoji set offered when picking a habit's icon.
// Kept to a multiple of 7 so the picker grid stays free of orphan rows.
export const HABIT_EMOJIS: string[] = [
  '🏃', '🚶', '🏋️', '🧘', '🚴', '⚽', '🏊',
  '📖', '📓', '✍️', '🎨', '🎸', '🧠', '🎧',
  '💧', '🥗', '🍎', '😴', '🪥', '🧹', '🌿',
  '🧘‍♀️', '🙏', '🌱', '☀️', '🔥', '✨', '🌙',
  '💪', '❤️', '⭐', '✅', '🎯', '⏰', '💰',
]
