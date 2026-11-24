"use client"

import { useActionState, useState } from "react"
import type { ActionView } from "@/lib/auth-action"
import { resetFlowAction } from "./actions"
import { AlertIcon, Clip, EyeIcon, Frame, OpenMakan, withEmail, type Strings } from "./parts"
import styles from "./auth-action.module.css"

/*
 * RM20616 A10 unit 10 (R1) — the password-reset card: si-fp-5 (with si-fp-8's line), si-fp-6 / si-fp-13,
 * si-fp-expired / si-fp-9, si-fp-10 / si-fp-12, si-fp-11 and si-fp-7. Each button is a plain form post to a
 * server action, so every step also works with JavaScript off.
 */

interface Props {
  initial: ActionView
  strings: Strings
  locale: "en" | "id"
  supportHref: string
  appPage: string
}

export default function ResetFlow({ initial, strings: s, locale, supportHref, appPage }: Props) {
  const [state, formAction, pending] = useActionState(resetFlowAction, initial)
  const [shown, setShown] = useState(false)
  const [typed, setTyped] = useState(() => keepOf(initial))
  // Typing clears a red line (board note n-si-fp-8) until the next answer arrives.
  const [answered, setAnswered] = useState(state)
  const [cleared, setCleared] = useState(false)
  if (answered !== state) {
    setAnswered(state)
    setCleared(false)
    // The same card keeps what was typed; a different card (the email form after a password, or the password
    // card drawn again for another account's link) starts empty.
    setTyped(keepOf(state) || (sameCard(state, answered) ? typed : ""))
  }
  const error = cleared ? undefined : "error" in state ? state.error : undefined

  // The seal the server drew with this card (lib/auth-action-seal.ts); it goes back with the form post.
  const seal = "seal" in state && state.seal ? state.seal : null
  const hidden = (intent: string) => (
    <>
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="locale" value={locale} />
      {seal ? <input type="hidden" name="seal" value={seal} /> : null}
    </>
  )
  const submit = (label: string, wide = false) => (
    <button type="submit" className={`${styles.button}${wide ? ` ${styles.wide}` : ""}`} aria-busy={pending} disabled={pending}>
      {pending ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          <span className={styles.srOnly}>{label}</span>
        </>
      ) : (
        label
      )}
    </button>
  )
  const networkLine = (
    <p role="alert" className={styles.alert}>
      <AlertIcon />
      <span>{s.networkError}</span>
    </p>
  )

  switch (state.view) {
    case "choose":
      return (
        <Frame>
          <Clip name="saved" />
          <h1 className={styles.title}>{s.chooseTitle}</h1>
          {state.email ? <p className={`${styles.line} ${styles.forEmail}`}>{withEmail(s.forEmail, state.email)}</p> : null}
          <form action={formAction} noValidate className={`${styles.form} ${styles.afterLine}`}>
            {hidden("save")}
            {/* For password managers: the account the new password belongs to. */}
            <input type="text" name="email" autoComplete="username" value={state.email ?? ""} readOnly hidden />
            <label htmlFor="new-password" className={styles.label}>{s.newPasswordLabel}</label>
            <div className={`${styles.field} ${styles.passwordField}`}>
              <input
                id="new-password"
                name="password"
                type={shown ? "text" : "password"}
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={styles.input}
                value={typed}
                onChange={(event) => { setTyped(event.target.value); setCleared(true) }}
                aria-describedby="password-rule"
                aria-invalid={error === "weak" || undefined}
              />
              <button type="button" className={styles.eye} aria-label={s.showPassword} aria-pressed={shown} onClick={() => setShown((value) => !value)}>
                <EyeIcon open={shown} />
              </button>
            </div>
            <p id="password-rule" role={error === "weak" ? "alert" : undefined} className={`${styles.rule}${error === "weak" ? ` ${styles.wrong}` : ""}`}>
              {s.passwordRule}
            </p>
            {error === "network" ? networkLine : null}
            {submit(s.savePassword)}
          </form>
        </Frame>
      )
    case "changed":
      return (
        <Frame>
          <Clip name="friends" />
          <h1 className={styles.title}>{s.passwordChanged}</h1>
          <p className={styles.line}>{s.signInWithNewPassword}</p>
          <OpenMakan label={s.openMakan} appPath="signin" appPage={appPage} />
        </Frame>
      )
    case "expired":
      return (
        <Frame>
          <Clip name="saved" />
          <h1 className={styles.title}>{s.expired}</h1>
          <form action={formAction} className={styles.formless}>
            {hidden("forgot")}
            {submit(s.sendNewLink)}
          </form>
        </Frame>
      )
    case "forgot":
      return (
        <Frame>
          <Clip name="saved" />
          <h1 className={styles.title}>{s.forgotTitle}</h1>
          <p className={styles.line}>{s.forgotBody}</p>
          <form action={formAction} noValidate className={`${styles.form} ${styles.afterLine}`}>
            {hidden("send")}
            <label htmlFor="email" className={styles.label}>{s.emailLabel}</label>
            <div className={styles.field}>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={styles.input}
                value={typed}
                onChange={(event) => { setTyped(event.target.value); setCleared(true) }}
                aria-invalid={error === "email" || undefined}
                aria-describedby={error === "email" ? "email-error" : undefined}
              />
            </div>
            {error === "email" ? (
              <p id="email-error" role="alert" className={`${styles.alert} ${styles.underField}`}>
                <AlertIcon />
                <span>{s.invalidEmail}</span>
              </p>
            ) : null}
            {error === "network" ? networkLine : null}
            {submit(s.sendResetLink, !error)}
          </form>
        </Frame>
      )
    case "sent":
      return (
        <Frame>
          <Clip name="pot" />
          <h1 className={styles.title}>{s.emailSentTitle}</h1>
          <p className={styles.line}>{s.emailSentBody}</p>
        </Frame>
      )
    case "broken":
      return (
        <Frame>
          <Clip name="saved" />
          <h1 className={styles.title}>{s.doesNotWork}</h1>
          <a href={supportHref} className={styles.button}>{s.contactSupport}</a>
        </Frame>
      )
    default:
      // The opening card is always one of the above; a later answer can only be one of them too.
      return null
  }
}

function sameCard(next: ActionView, previous: ActionView): boolean {
  if (next.view !== previous.view) return false
  return next.view !== "choose" || previous.view !== "choose" || next.email === previous.email
}

function keepOf(view: ActionView): string {
  return "keep" in view && typeof view.keep === "string" ? view.keep : ""
}
