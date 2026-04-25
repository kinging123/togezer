export const checkInKeys = {
  all:          ()               => ['check-ins']                          as const,
  todayStatus:  ()               => ['check-ins', 'today-status']          as const,
  friendsToday: ()               => ['check-ins', 'friends-today']         as const,
  history:      (habitId: string) => ['check-ins', 'history', habitId]     as const,
}
