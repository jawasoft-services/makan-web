import Link from 'next/link'

const links = [
  { label: 'Privacy', href: '/privacy-policy', external: false },
  { label: 'Terms', href: '/tos', external: false },
  { label: 'Instagram', href: 'https://www.instagram.com/makanappofficial/', external: true },
  { label: 'TikTok', href: 'https://www.tiktok.com/@makanapp', external: true },
]

export default function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-bg px-5 sm:px-8 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-brand-dim">
          &copy; {new Date().getFullYear()} Makan &middot; London, UK
        </p>
        <div className="flex gap-6">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-dim transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-brand-dim transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      </div>
    </footer>
  )
}
