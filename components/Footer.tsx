import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-brand-cyan/10 bg-brand-bg py-12 px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: logo + address */}
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/makan-icon.svg"
                alt=""
                width={28}
                height={28}
                className="rounded-md"
              />
              <Image
                src="/makan-wordmark.svg"
                alt="Makan"
                width={81}
                height={20}
                className="h-5 w-auto"
              />
            </div>
            <a
              href="https://www.google.com/maps/place/The+Hoxton+Mix/@51.5256479,-0.0885239"
              className="mt-3 block max-w-xs text-xs leading-relaxed text-brand-cyan/50 transition-colors hover:text-brand-cyan"
              target="_blank"
              rel="noopener noreferrer"
            >
              86-90 Paul Street, London,
              <br />
              United Kingdom, EC2A 4NE
            </a>
          </div>

          {/* Middle: links */}
          <div className="flex gap-8 text-sm text-brand-cyan">
            <Link
              href="https://makanofficial.com/privacy-policy"
              className="transition-colors hover:text-brand-text"
            >
              Privacy Policy
            </Link>
            <Link
              href="https://makanofficial.com/tos"
              className="transition-colors hover:text-brand-text"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-brand-text"
            >
              Contact
            </Link>
          </div>

          {/* Right: social */}
          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com/makanappofficial/"
              className="text-sm text-brand-cyan transition-colors hover:text-brand-text"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href="https://x.com/app_makan"
              className="text-sm text-brand-cyan transition-colors hover:text-brand-text"
              target="_blank"
              rel="noopener noreferrer"
            >
              X
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-brand-cyan/10 pt-6">
          <p className="text-xs text-brand-cyan/40">
            &copy; {new Date().getFullYear()} Makan App Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
