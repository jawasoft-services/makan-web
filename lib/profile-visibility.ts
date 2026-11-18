type Profile = Record<string, unknown> | undefined

const HIDDEN = new Set(['deleted', 'disabled', 'held', 'hidden', 'moderated', 'pending', 'suspended', 'spam', 'banned', 'deactivated'])

/** One public identity gate for profile pages and taste-invite previews. */
export function isVisiblePublicProfile(user: Profile): boolean {
  if (!user || user.deletedAt || user.isDeleted === true || user.isSpam === true
    || user.discoverable_by_friends_of_friends === false) return false
  if ([user.accountStatus, user.status, user.visibility_status, user.moderationStatus].some(
    value => typeof value === 'string' && HIDDEN.has(value.trim().toLowerCase()),
  )) return false
  if (user.accountStatus && user.accountStatus !== 'active') return false
  const handle = typeof user.username === 'string' ? user.username.trim() : ''
  if (!handle || /^@?user_[0-9a-z]{8}_[0-9a-z]{6,9}$/i.test(handle)) return false
  const done = typeof user.profileSetupCompletedAt === 'string' && user.profileSetupCompletedAt.trim()
  const named = [user.name, user.display_name].some(value => typeof value === 'string' && value.trim())
  return Boolean(done || (named && handle))
}
