import Image from "next/image"

interface MealDisplayProps {
  imageUrl: string
  title: string
}

export default function MealDisplay({ imageUrl, title }: MealDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8">
      <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
        <Image
          src={imageUrl}
          alt={title}
          width={1080}
          height={1920}
          className="w-full"
          priority
        />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-brand-text">
          See more on the Makan app
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#"
            className="rounded-full bg-brand-orange px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition-transform hover:scale-105"
          >
            App Store
          </a>
          <a
            href="#"
            className="rounded-full border-2 border-brand-orange px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-brand-orange transition-transform hover:scale-105"
          >
            Google Play
          </a>
        </div>
      </div>
    </div>
  )
}
