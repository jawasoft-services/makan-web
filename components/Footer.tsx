import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-brand-mint py-8 px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center text-sm text-brand-cyan">
        <p className="font-bold text-brand-text">Makan</p>
        <div className="flex gap-4">
          <Link href="https://makanofficial.com/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="https://makanofficial.com/tos" className="hover:underline">
            Terms
          </Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Makan</p>
      </div>
    </footer>
  )
}
