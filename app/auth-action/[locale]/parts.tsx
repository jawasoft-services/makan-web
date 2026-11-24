import { OpenInMakanButton } from "@/components/share/ShareActions"
import styles from "./auth-action.module.css"

/*
 * RM20616 A10 unit 10 (R1) — the pieces every action card shares, drawn as the boards draw them. No hooks,
 * so the server page and the client flow both use them.
 */

/** The words the cards use: SharePages.authAction in messages/en.json and messages/id.json. */
export const STRING_KEYS = [
  "doesNotWork", "contactSupport", "chooseTitle", "forEmail", "newPasswordLabel", "showPassword", "passwordRule",
  "savePassword", "networkError", "expired", "sendNewLink", "forgotTitle", "forgotBody", "emailLabel", "invalidEmail",
  "sendResetLink", "emailSentTitle", "emailSentBody", "passwordChanged", "signInWithNewPassword", "openMakan",
  "emailVerified", "emailChanged", "signInWithEmail", "emailChangeUndone", "emailIsAgain", "changeEmailAgain",
] as const
export type StringKey = (typeof STRING_KEYS)[number]
export type Strings = Record<StringKey, string>

/** Fills `{email}` in a line. The address is text, never markup. */
export const withEmail = (line: string, email: string) => line.replace("{email}", email)

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.band}>
        <span role="img" aria-label="Makan" className={styles.wordmark} />
      </header>
      <main id="main-content" className={styles.main}>
        <div className={styles.card}>{children}</div>
      </main>
    </div>
  )
}

/** The approved clips, played as the boards play them; the still frame under Reduce Motion. */
const CLIPS = { saved: 140, friends: 210, pot: 150 } as const

export function Clip({ name }: { name: keyof typeof CLIPS }) {
  const size = CLIPS[name]
  return (
    <div className={styles.clip} aria-hidden="true">
      <video src={`/auth-action/${name}.mp4`} poster={`/auth-action/${name}.png`} width={size} height={size} autoPlay loop muted playsInline preload="auto" />
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size still; next/image adds nothing here */}
      <img src={`/auth-action/${name}.png`} alt="" width={size} height={size} />
    </div>
  )
}

/** The app's universal link back into Makan, hidden on a computer (Devon, 24 Nov 2026, answer 3). */
export function OpenMakan({ label, appPath, appPage }: { label: string; appPath: string; appPage: string }) {
  return (
    <div className={styles.phoneOnly}>
      <OpenInMakanButton link={APP_RETURN_LINK} appPath={appPath} appPage={appPage} label={label} className={styles.button} />
    </div>
  )
}

/**
 * The address both apps already claim for coming back from an account email (RM20356, /verified in
 * apple-app-site-association and the Android app links). Android opens the app through it; iPhone uses the
 * app's scheme with `appPath`, then the App Store if the page is still in front.
 */
const APP_RETURN_LINK = "https://www.makanofficial.com/verified"

/* Ionicons 5 glyphs, as the boards use them (eye-off f2e7, eye f2e6, alert-circle f113), traced from the
   app's own Ionicons font; viewBox is the font's 512-unit em box. */
export function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={open ? EYE : EYE_OFF} />
    </svg>
  )
}

export function AlertIcon() {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={ALERT} />
    </svg>
  )
}

const EYE_OFF =
  "M77 71Q80 70 81 70.5Q82 71 85 71.5Q88 72 266.5 250Q445 428 446 431Q451 442 442 450Q439 453 435 454Q434 454 433 454Q429 455 410 437Q391 419 281 310Q258 286 245 273Q66 94 65 91Q63 84 66.5 78Q70 72 77 71ZM235 103Q240 102 261.5 103Q283 104 289 105Q358 115 418 163Q445 185 466 211Q486 235 492 247Q498 260 494 271Q490 285 465 315Q454 328 439 343Q424 358 421 358Q419 358 384 322.5Q349 287 349 286.5Q349 286 350.5 279.5Q352 273 352 262Q352 251 350 244Q345 215 323.5 194Q302 173 273 168Q254 164 234 169Q231 169 206.5 144.5Q182 120 181.5 118.5Q181 117 182 115Q188 109 226 104Q233 103 235 103ZM88 170Q92 167 92.5 167Q93 167 127 201Q161 235 162 236Q163 238 162 245Q159 262 162 279Q166 304 183.5 324.5Q201 345 225 353Q250 361 273 356Q280 355 281.5 356Q283 357 307 381Q331 405 331 407Q331 410 314 414Q198 444 94 362Q85 355 68 338Q51 321 44 312Q25 287 19 277Q17 271 17 262.5Q17 254 19 249Q24 239 46 213Q53 204 68.5 188.5Q84 173 88 170ZM290 228Q264 202 264 200.5Q264 199 268 199Q282 201 295.5 212Q309 223 315 237Q322 254 318 254Q316 254 290 228ZM193 271Q193 271 193 271Q194 270 195 270Q196 270 222 296Q230 303 234 308Q251 325 246 325Q237 325 223 317Q205 306 197 286Q192 274 193 271Z"
const EYE =
  "M234 103Q241 102 257.5 102.5Q274 103 282 104Q340 110 393 144.5Q446 179 485 236Q495 251 495 262Q495 270 492 277Q485 291 464 316Q443 341 425 356Q353 416 269 422Q183 427 108 372Q63 340 29 291Q17 275 16 264Q16 256 18.5 250.5Q21 245 31 231Q60 192 93 165Q145 123 200 109Q218 105 234 103ZM273 168Q267 167 256 167Q245 167 238 168Q193 176 171 218Q160 238 160 262Q160 285 170 305Q188 339 222.5 352Q257 365 292 351Q336 333 349 285Q354 268 351 247Q346 218 324.5 195.5Q303 173 273 168ZM245 199Q245 199 245 199Q259 196 272 200Q291 205 304 220Q321 239 320 264Q319 289 301 307Q271 337 231 321Q207 311 197 287Q182 250 207 221Q222 203 245 199Z"
const ALERT =
  "M242 55Q312 50 370 88Q387 100 403 116Q453 165 463 238Q464 245 464 262Q464 279 463 286Q453 359 403 409Q353 459 280 469Q273 470 256 470Q239 470 232 469Q159 459 109 409Q59 359 50 287Q40 212 82 148Q110 107 151.5 82.5Q193 58 242 55ZM266 153Q258 148 250 151Q240 154 236 164Q234 168 237 235Q240 299 242 302Q246 311 256 311Q262 311 267 307Q270 303 271 296.5Q272 290 274 250Q278 168 276 163Q273 157 266 153ZM262 335Q262 335 262 335Q256 333 250 335Q236 339 236 354Q236 363 243 369Q256 381 269 369Q276 363 276 354Q276 339 262 335Z"
