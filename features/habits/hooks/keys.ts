export const habitKeys = {
  all:      ()           => ['habits']                  as const,
  list:     ()           => ['habits', 'list']          as const,
  hasHabit: ()           => ['habits', 'has-habit']     as const,
  detail:   (id: string) => ['habits', 'detail', id]    as const,
}
