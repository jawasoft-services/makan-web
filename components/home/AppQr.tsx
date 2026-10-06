import Image from "next/image"
import Link from "next/link"

/**
 * "Scan with your phone" beside the store buttons, for desktop visitors who
 * cannot install from the screen they are on. Hidden on narrow and touch
 * screens, where the store buttons already work. The QR opens /app, which
 * offers both stores.
 */
export default function AppQr({ href, label, alt }: { href: string; label: string; alt: string }) {
  return (
    <Link
      href={href}
      className="hidden items-center gap-2 rounded-xl bg-white p-1 pr-3 text-left text-brand-ink ring-1 ring-brand-line focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current lg:flex pointer-coarse:hidden"
    >
      <Image src="/app-download-qr.svg" alt={alt} width={48} height={48} className="h-12 w-12 rounded-md" />
      <span className="max-w-[8ch] text-[0.72rem] font-bold leading-tight">{label}</span>
    </Link>
  )
}
