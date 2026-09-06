// A caption fit for the front of the site: real words, no auto handles, no
// swearing. Pure, so both the render path and the aggregate cron can use it.
const GENERIC_CAPTION = /^(breakfast|lunch|dinner|snack|brunch|supper|food|meal|yum|yummy)[.!]*$/i
const MIN_CAPTION_WORDS = 2
const AUTO_HANDLE_MENTION = /@user_/i
const ROUGH_CAPTION = /\b(fuck\w*|shit\w*|asf|af|wtf|bitch|cunt|dick)\b/i

export function isCleanCaption(caption: string): boolean {
  if (!caption || GENERIC_CAPTION.test(caption)) return false
  if (caption.split(/\s+/).filter((w) => /\p{L}|\p{N}/u.test(w)).length < MIN_CAPTION_WORDS) return false
  if (AUTO_HANDLE_MENTION.test(caption) || ROUGH_CAPTION.test(caption)) return false
  return true
}
