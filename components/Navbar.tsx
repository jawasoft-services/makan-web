import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-brand-bg/80 backdrop-blur-md">
      <Link href="/" className="text-xl font-bold text-brand-text">
        Makan
      </Link>
      <a
        href="#download"
        className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        Get the App
      </a>
    </nav>
  )
}
