import { Fraunces } from 'next/font/google'

// The site's serif (design rules v2): Fraunces as a variable font, so 400/600 and the 9..144 optical
// sizes all come from one file. next/font downloads it at build time and serves it from this site,
// so the page never asks an external font provider (CSP font-src 'self').
export const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], display: 'swap', variable: '--font-fraunces' })
