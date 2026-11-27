import { NOTE_MAX, withPlace, type NoticeError, type NoticeView, type ReportInput } from "@/lib/notice-link"
import { AlertIcon } from "../../auth-action/[locale]/parts"
import styles from "../../auth-action/[locale]/auth-action.module.css"
import notice from "./notice-link.module.css"

/*
 * RM20616 O1 — the cards of /d/{code}, drawn as boards own-n1 to own-n7 draw them (own-n5 is option A, not built).
 * The frame, the type and the button are the account-email pages' own (one web frame across the site); this file adds
 * only what those pages lack: the reasons, the note and two clips. No hooks: NoticeFlow holds the state.
 */

/** The words the cards use: SharePages.noticeLink in messages/en.json and messages/id.json. */
export const NOTICE_STRING_KEYS = [
  "claimedTitle", "tellUs", "whatsWrong", "looksAtIt", "reasonOwner", "reasonStaff", "reasonOther", "anythingElse",
  "send", "gotIt", "willLook", "doesNotWork", "contactSupport", "nobodyRuns", "ownThisPlace", "networkError", "tooMany",
] as const
export type NoticeStrings = Record<(typeof NOTICE_STRING_KEYS)[number], string>

const REASONS = [["owner", "reasonOwner"], ["staff", "reasonStaff"], ["other", "reasonOther"]] as const

/** The approved clips at the boards' sizes; the still frame under Reduce Motion. The pot is the action pages' file. */
const CLIP_SOURCES = { pot: "/auth-action/pot", places: "/notice-link/places", gone: "/notice-link/gone" } as const

function Clip({ name, size }: { name: keyof typeof CLIP_SOURCES; size: 140 | 150 }) {
  const source = CLIP_SOURCES[name]
  return (
    <div className={styles.clip} aria-hidden="true">
      <video src={`${source}.mp4`} poster={`${source}.png`} width={size} height={size} autoPlay loop muted playsInline preload="auto" />
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size still; next/image adds nothing here */}
      <img src={`${source}.png`} alt="" width={size} height={size} />
    </div>
  )
}

function Frame({ children, busy = false }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <div className={styles.page}>
      <header className={styles.band}>
        <span role="img" aria-label="Makan" className={styles.wordmark} />
      </header>
      <main id="main-content" className={styles.main} aria-busy={busy}>
        <div className={styles.card}>{children}</div>
      </main>
    </div>
  )
}

function ErrorLine({ error, strings: s }: { error: NoticeError; strings: NoticeStrings }) {
  return (
    <p role="alert" className={styles.alert}>
      <AlertIcon />
      <span>{error === "tooMany" ? s.tooMany : s.networkError}</span>
    </p>
  )
}

interface Props {
  view: NoticeView
  strings: NoticeStrings
  supportHref: string
  appHref: string
  onTellUs: () => void
  onSend: (input: ReportInput) => void
  /** A report is on its way: Send shows the spinner and cannot be pressed. */
  busy: boolean
}

export function NoticeCard({ view, strings: s, supportHref, appHref, onTellUs, onSend, busy }: Props) {
  switch (view.view) {
    case "loading":
      return (
        <Frame busy>
          <Clip name="pot" size={140} />
        </Frame>
      )
    case "current":
      return (
        <Frame>
          <Clip name="pot" size={140} />
          <h1 className={styles.title}>{withPlace(s.claimedTitle, view.placeName)}</h1>
          <button type="button" className={styles.button} onClick={onTellUs}>{s.tellUs}</button>
        </Frame>
      )
    case "form":
      return (
        <Frame>
          <h1 id="notice-title" className={`${styles.title} ${notice.formTitle}`}>{s.whatsWrong}</h1>
          <p className={`${styles.line} ${notice.formLine}`}>{withPlace(s.looksAtIt, view.placeName)}</p>
          <form
            noValidate
            className={notice.form}
            onSubmit={(event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              onSend({ reason: String(data.get("reason") ?? ""), note: String(data.get("note") ?? "") })
            }}
          >
            <div role="radiogroup" aria-labelledby="notice-title" className={notice.reasons}>
              {REASONS.map(([value, key], index) => (
                <label key={value} className={notice.reason}>
                  <span className={notice.reasonText}>{s[key]}</span>
                  <input type="radio" name="reason" value={value} defaultChecked={index === 0} className={notice.radioInput} />
                  <span className={notice.radio} aria-hidden="true">
                    <CheckIcon />
                  </span>
                </label>
              ))}
            </div>
            <label htmlFor="notice-note" className={`${styles.label} ${notice.noteLabel}`}>{s.anythingElse}</label>
            <textarea id="notice-note" name="note" maxLength={NOTE_MAX} rows={1} className={notice.note} />
            {view.error ? <ErrorLine error={view.error} strings={s} /> : null}
            <button type="submit" className={styles.button} disabled={busy} aria-busy={busy}>
              {busy ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  <span className={styles.srOnly}>{s.send}</span>
                </>
              ) : (
                s.send
              )}
            </button>
          </form>
        </Frame>
      )
    case "reported":
      return (
        <Frame>
          <Clip name="pot" size={150} />
          <h1 className={styles.title}>{s.gotIt}</h1>
          <p className={styles.line}>{s.willLook}</p>
        </Frame>
      )
    case "invalid":
      return (
        <Frame>
          <Clip name="places" size={140} />
          <h1 className={styles.title}>{s.doesNotWork}</h1>
          <a className={styles.button} href={supportHref}>{s.contactSupport}</a>
        </Frame>
      )
    case "unclaimed":
      return (
        <Frame>
          <Clip name="gone" size={140} />
          <h1 className={styles.title}>{view.placeName}</h1>
          <p className={styles.line}>{s.nobodyRuns}</p>
          <a className={styles.button} href={appHref}>{s.ownThisPlace}</a>
        </Frame>
      )
    case "blocked":
      return (
        <Frame>
          <div className={notice.blocked}>
            <ErrorLine error={view.error} strings={s} />
          </div>
        </Frame>
      )
  }
}

/* Ionicons 5 checkmark (f21d), as board own-n2 draws it, traced from the app's own Ionicons font (512-unit em box). */
function CheckIcon() {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M411 119Q416 117 420 119Q428 121 431 129Q434 137 429.5 143Q425 149 313 276.5Q201 404 199 404Q194 407 188 405Q184 404 133.5 353.5Q83 303 81 301Q77 292 83 285Q91 274 103 280Q105 281 148 324Q148 324 191 367L193 364Q195 362 299.5 242.5Q404 123 406 121.5Q408 120 411 119Z" />
    </svg>
  )
}
