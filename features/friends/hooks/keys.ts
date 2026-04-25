export const friendKeys = {
  all:        () => ['friends']                as const,
  list:       () => ['friends', 'list']        as const,
  inviteCode: () => ['friends', 'invite-code'] as const,
}
