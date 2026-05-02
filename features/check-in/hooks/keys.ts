export const checkInKeys = {
  all:          ()                => ['check-ins']                        as const,
  status:       (habitId: string) => ['check-ins', 'status', habitId]    as const,
  friendsToday: ()                => ['check-ins', 'friends-today']       as const,
  history:      (habitId: string) => ['check-ins', 'history', habitId]   as const,
}
