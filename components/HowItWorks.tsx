'use client'

import { useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import StaticPicture from '@/components/StaticPicture'

const steps = [
  {
    number: '01',
    title: 'Take the photo.',
    copy: 'Open the camera and save the meal while it is still in front of you.',
  },
  {
    number: '02',
    title: 'Add what mattered.',
    copy: 'Tag the place and the people at the table. Write as much or as little as you want.',
  },
  {
    number: '03',
    title: 'Keep the record.',
    copy: 'The meal stays in your diary, with the date and details attached.',
  },
] as const

// Each act gets a generous hold. The page keeps moving, but the story only
// advances after enough intent has built up in the scroll.
const SCROLL_STOPS = [0, 0.12, 0.26, 0.42, 0.57, 0.73, 1]
const STORY_STOPS = [0, 0.25, 0.25, 0.56, 0.56, 0.84, 1]

const PHOTO_BASE_PATH =
  '/static-images/v1/blog/kendal-street-kitchen/harissa-prawns'
const DIARY_BASE_PATH = '/static-images/v1/app-screens/diary'
const DETAIL_BASE_PATH = '/static-images/v1/app-screens/detail'
const APP_SCREEN_WIDTHS = [560, 800] as const

type StepMotion = {
  opacity: MotionValue<number>
  y: MotionValue<number>
}

function CloseIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="h-4 w-4"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function CameraSwitchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M8.5 6.5 10 4h4l1.5 2.5H19a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h3.5Z" />
      <path d="M9 11a4 4 0 0 1 6.2-1.3L17 11M15 14a4 4 0 0 1-6.2 1.3L7 14" />
    </svg>
  )
}

function StepCopy({
  step,
  motionStyle,
  mobile = false,
  inverse = false,
}: {
  step: (typeof steps)[number]
  motionStyle: StepMotion
  mobile?: boolean
  inverse?: boolean
}) {
  return (
    <motion.article
      style={{ opacity: motionStyle.opacity, y: motionStyle.y }}
      className={
        mobile
          ? 'absolute inset-0 overflow-hidden'
          : `relative border-t py-6 pl-12 first:border-t-0 first:pt-1 ${
              inverse ? 'border-white/25' : 'border-brand-line'
            }`
      }
    >
      <span
        className={
          mobile
            ? `text-[10px] font-bold tabular-nums ${
                inverse ? 'text-white' : 'text-brand-orange-ink'
              }`
            : `absolute left-0 top-7 w-4 text-right text-xs font-bold tabular-nums ${
                inverse ? 'text-white' : 'text-brand-orange-ink'
              }`
        }
      >
        {step.number}
      </span>
      <h3
        className={
          mobile
            ? `mt-2 text-xl font-bold leading-tight ${
                inverse ? 'text-white' : 'text-brand-ink'
              }`
            : `text-xl font-bold leading-tight xl:text-2xl ${
                inverse ? 'text-white' : 'text-brand-ink'
              }`
        }
      >
        {step.title}
      </h3>
      <p
        className={
          mobile
            ? `mt-1.5 max-w-[25rem] text-[13px] leading-[1.48] ${
                inverse ? 'text-white/72' : 'text-brand-muted'
              }`
            : `mt-2 max-w-[25rem] text-sm leading-relaxed xl:text-base ${
                inverse ? 'text-white/72' : 'text-brand-muted'
              }`
        }
      >
        {step.copy}
      </p>
    </motion.article>
  )
}

function MealPhoto({ sizes }: { sizes: string }) {
  return (
    <StaticPicture
      basePath={PHOTO_BASE_PATH}
      widths={[480, 900, 1400]}
      sizes={sizes}
      alt="Harissa prawns with grilled sourdough at Kendal Street Kitchen"
      className="h-full w-full object-cover"
    />
  )
}

function PinIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1em] w-[1em]"
    >
      <path d="M15 8.2c0 3.9-5 8.3-5 8.3s-5-4.4-5-8.3a5 5 0 0 1 10 0Z" />
      <circle cx="10" cy="8.2" r="1.7" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-[1em] w-[1em]"
    >
      <circle cx="7" cy="7" r="2.4" />
      <circle cx="14" cy="8" r="2" />
      <path d="M2.8 16c.4-3 2-4.5 4.4-4.5s4 1.5 4.4 4.5M11.5 12.7c.7-.9 1.6-1.3 2.8-1.3 1.8 0 3 1.2 3.3 3.6" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1em] w-[1em]"
    >
      <path d="M4 3.5h12v13H4zM7 7h6M7 10h6M7 13h3.5" />
    </svg>
  )
}

function DetailPill({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-2 text-[10px] font-bold text-brand-ink shadow-[0_12px_28px_rgba(72,32,0,0.2)] sm:text-xs ${className}`}
    >
      {children}
    </span>
  )
}

function PhotoCapture({
  opacity,
  scale,
  rotate,
  shutterScale,
  flashOpacity,
}: {
  opacity: MotionValue<number>
  scale: MotionValue<number>
  rotate: MotionValue<number>
  shutterScale: MotionValue<number>
  flashOpacity: MotionValue<number>
}) {
  return (
    <motion.article
      aria-hidden
      style={{ opacity, scale, rotate }}
      className="absolute left-1/2 top-1/2 z-30 aspect-square h-[91%] max-h-[540px] max-w-[90%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border-[5px] border-white bg-black shadow-[0_30px_80px_rgba(82,35,0,0.3)] sm:rounded-[2.5rem]"
    >
      <MealPhoto sizes="(max-width: 1023px) 82vw, 470px" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/38 via-transparent to-black/58" />

      <div className="absolute inset-x-0 top-0 flex h-[15%] items-center justify-between px-[6%] text-white">
        <span className="grid aspect-square w-[11%] place-items-center rounded-full bg-black/35">
          <CloseIcon />
        </span>
        <span className="text-[10px] font-semibold tracking-[-0.01em] sm:text-xs">
          Take a photo
        </span>
        <span className="grid aspect-square w-[11%] place-items-center rounded-full bg-black/35">
          <CameraSwitchIcon />
        </span>
      </div>

      <span className="absolute left-[8%] top-[20%] h-8 w-8 border-l-2 border-t-2 border-white/90" />
      <span className="absolute right-[8%] top-[20%] h-8 w-8 border-r-2 border-t-2 border-white/90" />
      <span className="absolute bottom-[22%] left-[8%] h-8 w-8 border-b-2 border-l-2 border-white/90" />
      <span className="absolute bottom-[22%] right-[8%] h-8 w-8 border-b-2 border-r-2 border-white/90" />

      <motion.span
        style={{ scale: shutterScale }}
        className="absolute bottom-[5.5%] left-1/2 grid aspect-square w-[15%] -translate-x-1/2 place-items-center rounded-full border-[3px] border-white"
      >
        <span className="aspect-square w-[80%] rounded-full bg-white" />
      </motion.span>

      <motion.div
        style={{ opacity: flashOpacity }}
        className="absolute inset-0 bg-white"
      />
    </motion.article>
  )
}

function MealTypeIcon({
  type,
}: {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}) {
  const sharedProps = {
    'aria-hidden': true,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]',
  }

  if (type === 'breakfast') {
    return (
      <svg {...sharedProps}>
        <path d="M4 18h16M6.5 14.5h11M8 14.5a4 4 0 0 1 8 0M12 4v3M5.8 7.8l2.1 2.1M18.2 7.8l-2.1 2.1" />
      </svg>
    )
  }

  if (type === 'lunch') {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="3.25" />
        <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.45 1.45M16.55 16.55 18 18M18 6l-1.45 1.45M7.45 16.55 6 18" />
      </svg>
    )
  }

  if (type === 'dinner') {
    return (
      <svg {...sharedProps}>
        <path d="M19 15.2A7.5 7.5 0 0 1 8.8 5a7.5 7.5 0 1 0 10.2 10.2Z" />
        <path d="m17.4 5.2.35.9.9.35-.9.35-.35.9-.35-.9-.9-.35.9-.35.35-.9Z" />
      </svg>
    )
  }

  return (
    <svg {...sharedProps}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="9.2" cy="9.1" r=".8" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="10.3" r=".8" fill="currentColor" stroke="none" />
      <circle cx="11.8" cy="15.1" r=".8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function MealGlyph({
  active = false,
  children,
}: {
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span
        className={`grid aspect-square w-8 place-items-center rounded-full border sm:w-10 ${
          active
            ? 'border-brand-orange bg-brand-orange text-white'
            : 'border-[#34485D] text-[#9CA6B4]'
        }`}
      >
        {children}
      </span>
    </span>
  )
}

function ComposerCloseup({
  opacity,
  scale,
  y,
  rotate,
  detailOpacity,
  postScale,
}: {
  opacity: MotionValue<number>
  scale: MotionValue<number>
  y: MotionValue<string>
  rotate: MotionValue<number>
  detailOpacity: MotionValue<number>
  postScale: MotionValue<number>
}) {
  return (
    <motion.article
      aria-hidden
      style={{ opacity, scale, y, rotate }}
      className="absolute left-1/2 top-1/2 z-20 aspect-[2/3] w-[95%] max-h-[700px] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-white/10 bg-[#101010] text-white shadow-[0_34px_90px_rgba(67,25,0,0.34)] sm:rounded-[2.5rem]"
    >
      <div className="absolute inset-x-[5%] top-[3.5%] flex h-[7%] items-center justify-between">
        <span className="grid aspect-square h-full place-items-center rounded-full bg-[#2A3D54]">
          <CloseIcon />
        </span>
        <span className="text-[clamp(0.65rem,2.4vw,1rem)] font-semibold">
          Post a Meal
        </span>
        <span className="grid aspect-square h-full place-items-center rounded-full bg-[#2A3D54]">
          <CameraSwitchIcon />
        </span>
      </div>

      <div className="absolute left-[5%] top-[11.5%] h-[39.5%] w-[90%] overflow-hidden rounded-[1.3rem]">
        <MealPhoto sizes="(max-width: 1023px) 78vw, 460px" />
      </div>

      <motion.div
        style={{ opacity: detailOpacity }}
        className="absolute inset-x-[5%] top-[53%]"
      >
        <p className="text-[clamp(0.72rem,2.8vw,1.1rem)] font-bold leading-tight">
          Her first day at the new job.
        </p>
        <p className="mt-[2.5%] text-[clamp(0.38rem,1.3vw,0.62rem)] font-bold uppercase tracking-[0.16em] text-[#9CA6B4]">
          Meal type
        </p>
      </motion.div>

      <motion.div
        style={{ opacity: detailOpacity }}
        className="absolute inset-x-[8%] top-[63%] flex items-start justify-between text-[clamp(0.34rem,1.15vw,0.58rem)] text-[#9CA6B4]"
      >
        <span className="flex flex-col items-center gap-1">
          <MealGlyph>
            <MealTypeIcon type="breakfast" />
          </MealGlyph>
          Breakfast
        </span>
        <span className="flex flex-col items-center gap-1">
          <MealGlyph>
            <MealTypeIcon type="lunch" />
          </MealGlyph>
          Lunch
        </span>
        <span className="flex flex-col items-center gap-1">
          <MealGlyph>
            <MealTypeIcon type="dinner" />
          </MealGlyph>
          Dinner
        </span>
        <span className="flex flex-col items-center gap-1 text-brand-orange">
          <MealGlyph active>
            <MealTypeIcon type="snack" />
          </MealGlyph>
          Snack
        </span>
      </motion.div>

      <motion.div
        style={{ opacity: detailOpacity }}
        className="absolute inset-x-[5%] top-[75.5%] flex h-[6.5%] overflow-hidden rounded-lg border border-[#34485D] text-[clamp(0.46rem,1.7vw,0.78rem)] font-semibold"
      >
        <span className="grid w-1/2 place-items-center bg-[#2A3D54] text-[#C3CAD0]">
          Public
        </span>
        <span className="grid w-1/2 place-items-center bg-brand-orange text-white">
          Friends Only
        </span>
      </motion.div>

      <motion.div
        style={{ opacity: detailOpacity }}
        className="absolute inset-x-[5%] top-[83.1%] text-[clamp(0.32rem,1.05vw,0.55rem)] text-[#9CA6B4]"
      >
        Leaving without posting keeps this private.
      </motion.div>

      <motion.div
        style={{ opacity: detailOpacity }}
        className="absolute inset-x-[5%] top-[86.4%] flex h-[4.5%] gap-[2%] text-[clamp(0.3rem,1.05vw,0.54rem)]"
      >
        <span className="flex min-w-0 items-center gap-1 whitespace-nowrap rounded-full border border-[#536276] px-[3%] text-[#C3CAD0]">
          <PinIcon />
          Kendal Street Kitchen
        </span>
        <span className="flex min-w-0 items-center gap-1 whitespace-nowrap rounded-full border border-[#536276] px-[3%] text-[#C3CAD0]">
          <PeopleIcon />
          Devon + Mia
        </span>
      </motion.div>

      <motion.div
        style={{ scale: postScale }}
        className="absolute bottom-[2.3%] left-[5%] grid h-[6.2%] w-[90%] place-items-center rounded-full bg-brand-orange text-[clamp(0.5rem,1.9vw,0.85rem)] font-semibold text-white"
      >
        Post Meal →
      </motion.div>
    </motion.article>
  )
}

function DiaryCloseup({
  opacity,
  scale,
  y,
  mealScale,
  ringOpacity,
}: {
  opacity: MotionValue<number>
  scale: MotionValue<number>
  y: MotionValue<string>
  mealScale: MotionValue<number>
  ringOpacity: MotionValue<number>
}) {
  return (
    <motion.article
      aria-hidden
      style={{ opacity, scale, y }}
      className="absolute left-1/2 top-1/2 z-10 aspect-[4/5] h-full max-h-[640px] max-w-[94%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-black/10 bg-[#FBFBFA] text-[#1D2C3D] shadow-[0_34px_90px_rgba(67,25,0,0.3)] sm:rounded-[2.5rem]"
    >
      <div className="absolute inset-x-0 top-0 z-20 flex h-[17%] items-center justify-between border-b border-[#ECE9E4] bg-[#FBFBFA] px-[7%]">
        <span className="grid aspect-square w-[10%] place-items-center rounded-full border border-[#F1D5B3] text-brand-orange-ink">
          ‹
        </span>
        <span className="text-[clamp(0.8rem,3vw,1.3rem)] font-semibold">
          May 2026
        </span>
        <span className="grid aspect-square w-[10%] place-items-center rounded-full border border-[#F1D5B3] text-brand-orange-ink">
          ›
        </span>
      </div>

      <div className="absolute inset-x-[4%] bottom-[4%] top-[18%] overflow-hidden rounded-[1.5rem] bg-white">
        <div className="absolute left-0 top-0 aspect-[1206/2622] w-full -translate-y-[39%]">
          <StaticPicture
            basePath={DIARY_BASE_PATH}
            widths={APP_SCREEN_WIDTHS}
            sizes="(max-width: 1023px) 88vw, 460px"
            alt="The real Makan calendar"
            className="absolute inset-0 h-full w-full"
          />

          <motion.div
            style={{ scale: mealScale }}
            className="absolute left-[57.46%] top-[72.39%] aspect-square w-[9.95%] origin-center overflow-hidden rounded-[21%]"
          >
            <MealPhoto sizes="58px" />
            <span className="absolute inset-0 grid place-items-center text-[clamp(0.8rem,3vw,1.25rem)] font-normal leading-none text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.68)]">
              21
            </span>
          </motion.div>

          <motion.div
            style={{ opacity: ringOpacity, scale: mealScale }}
            className="absolute left-[57.06%] top-[72.2%] aspect-square w-[10.75%] rounded-[24%] border-2 border-brand-orange shadow-[0_0_18px_rgba(255,153,50,0.55)]"
          />
        </div>
      </div>
    </motion.article>
  )
}

function MealDetailScreenContent({ sizes }: { sizes: string }) {
  return (
    <>
      <StaticPicture
        basePath={DETAIL_BASE_PATH}
        widths={APP_SCREEN_WIDTHS}
        sizes={sizes}
        alt="The Makan meal detail screen"
        className="absolute inset-0 h-full w-full"
      />

      <div className="absolute inset-x-0 top-[15.45%] h-[54.9%] overflow-hidden">
        <MealPhoto sizes={sizes} />
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[70.3%] bg-[#F2F7F6] px-[5%] pt-[4%] text-[#26374A]">
        <div className="flex items-center gap-[3%]">
          <span className="grid aspect-square w-[10%] place-items-center rounded-full bg-brand-orange text-[clamp(0.55rem,1.8vw,0.78rem)] font-bold text-white">
            D
          </span>
          <span>
            <span className="block text-[clamp(0.58rem,1.9vw,0.82rem)] font-bold leading-none">
              Devon
            </span>
            <span className="mt-1 block text-[clamp(0.42rem,1.3vw,0.6rem)] text-[#71808D]">
              21 May 2026
            </span>
          </span>
        </div>

        <p className="mt-[4%] text-[clamp(0.4rem,1.2vw,0.58rem)] font-bold uppercase tracking-[0.15em] text-[#71808D]">
          Snack · Kendal Street Kitchen
        </p>
        <p className="mt-[1.5%] max-w-[92%] text-[clamp(0.92rem,3.2vw,1.45rem)] font-bold leading-[1.06] tracking-[-0.03em]">
          Her first day at the new job.
        </p>

        <div className="mt-[4%] flex items-center gap-[2.5%] text-[clamp(0.5rem,1.6vw,0.72rem)] font-semibold text-[#71808D]">
          <span className="grid aspect-square w-[7.5%] place-items-center rounded-full bg-[#26374A] text-[0.72em] font-bold text-white">
            M
          </span>
          with Mia
        </div>

        <div className="mt-[5%] flex items-center gap-[8%] border-t border-[#DDE5E3] pt-[4%] text-[clamp(0.48rem,1.45vw,0.68rem)] text-[#71808D]">
          <span>😋 1</span>
          <span>💬 0</span>
          <span>🤤 3</span>
        </div>
      </div>
    </>
  )
}

function MealDetailCloseup({
  opacity,
  scale,
  y,
  screenY,
}: {
  opacity: MotionValue<number>
  scale: MotionValue<number>
  y: MotionValue<string>
  screenY: MotionValue<string>
}) {
  return (
    <motion.article
      aria-hidden
      style={{ opacity, scale, y }}
      className="absolute left-1/2 top-1/2 z-30 aspect-[2/3] w-[95%] max-h-[700px] max-w-[440px] origin-[61%_68%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-black/10 bg-[#F2F7F6] shadow-[0_34px_90px_rgba(67,25,0,0.34)] sm:rounded-[2.5rem]"
    >
      <motion.div
        style={{ y: screenY }}
        className="absolute left-0 top-0 aspect-[1206/2622] w-full"
      >
        <MealDetailScreenContent sizes="(max-width: 1023px) 88vw, 440px" />
      </motion.div>
    </motion.article>
  )
}

function CinematicStage({ progress }: { progress: MotionValue<number> }) {
  const photoOpacity = useTransform(progress, [0, 0.27, 0.37], [1, 1, 0])
  const photoScale = useTransform(
    progress,
    [0, 0.12, 0.2, 0.28, 0.36],
    [0.96, 1, 0.985, 1.04, 0.82],
  )
  const photoRotate = useTransform(progress, [0, 0.2, 0.36], [-1.2, 0, 1.2])
  const shutterScale = useTransform(
    progress,
    [0, 0.14, 0.19, 0.25],
    [1, 1, 0.8, 1],
  )
  const flashOpacity = useTransform(
    progress,
    [0.15, 0.19, 0.22, 0.26],
    [0, 0, 0.88, 0],
  )

  const composerOpacity = useTransform(
    progress,
    [0.25, 0.36, 0.62, 0.73],
    [0, 1, 1, 0],
  )
  const composerScale = useTransform(
    progress,
    [0.25, 0.37, 0.61, 0.7, 0.75],
    [0.88, 1, 1, 0.78, 0.16],
  )
  const composerY = useTransform(
    progress,
    [0.25, 0.38, 0.62, 0.75],
    ['5%', '0%', '0%', '28%'],
  )
  const composerRotate = useTransform(
    progress,
    [0.25, 0.42, 0.64, 0.75],
    [1.5, 0, 0, -2],
  )
  const detailOpacity = useTransform(progress, [0.37, 0.47], [0, 1])
  const postScale = useTransform(
    progress,
    [0.52, 0.56, 0.6],
    [1, 0.95, 1],
  )

  const pillOpacity = useTransform(
    progress,
    [0.36, 0.45, 0.61, 0.73],
    [0, 1, 1, 0],
  )
  const pillScale = useTransform(
    progress,
    [0.36, 0.45, 0.62, 0.73],
    [0.6, 1, 1, 0.18],
  )
  const placeX = useTransform(progress, [0.36, 0.46, 0.62, 0.73], [-28, 0, 0, 90])
  const placeY = useTransform(progress, [0.36, 0.46, 0.62, 0.73], [18, 0, 0, 110])
  const peopleX = useTransform(progress, [0.38, 0.48, 0.62, 0.73], [28, 0, 0, -70])
  const peopleY = useTransform(progress, [0.38, 0.48, 0.62, 0.73], [-16, 0, 0, 110])
  const noteY = useTransform(progress, [0.4, 0.5, 0.62, 0.73], [22, 0, 0, 130])

  const diaryOpacity = useTransform(
    progress,
    [0.6, 0.71, 0.86, 0.92],
    [0, 1, 1, 0],
  )
  const diaryScale = useTransform(
    progress,
    [0.6, 0.72, 0.86, 0.92],
    [0.86, 1, 1, 1.04],
  )
  const diaryY = useTransform(
    progress,
    [0.6, 0.72, 0.86, 0.92],
    ['7%', '0%', '0%', '-3%'],
  )
  const mealScale = useTransform(
    progress,
    [0.66, 0.75, 0.81],
    [0.12, 1.16, 1],
  )
  const ringOpacity = useTransform(
    progress,
    [0.71, 0.79, 0.84, 0.88],
    [0, 1, 1, 0],
  )

  const mealDetailOpacity = useTransform(
    progress,
    [0.84, 0.86, 0.91],
    [0, 1, 1],
  )
  const mealDetailScale = useTransform(
    progress,
    [0.84, 0.92, 0.95],
    [0.12, 1.015, 1],
  )
  const mealDetailY = useTransform(
    progress,
    [0.84, 0.92],
    ['4%', '0%'],
  )
  const mealDetailScreenY = useTransform(
    progress,
    [0.91, 0.97],
    ['0%', '-29%'],
  )

  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-visible">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 aspect-square h-[82%] max-h-[510px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/14 blur-[70px]"
      />

      <DiaryCloseup
        opacity={diaryOpacity}
        scale={diaryScale}
        y={diaryY}
        mealScale={mealScale}
        ringOpacity={ringOpacity}
      />

      <MealDetailCloseup
        opacity={mealDetailOpacity}
        scale={mealDetailScale}
        y={mealDetailY}
        screenY={mealDetailScreenY}
      />

      <ComposerCloseup
        opacity={composerOpacity}
        scale={composerScale}
        y={composerY}
        rotate={composerRotate}
        detailOpacity={detailOpacity}
        postScale={postScale}
      />

      <motion.div
        aria-hidden
        style={{ opacity: pillOpacity, scale: pillScale, x: placeX, y: placeY }}
        className="absolute left-[3%] top-[18%] z-40 hidden md:block"
      >
        <DetailPill>
          <PinIcon />
          Kendal Street Kitchen
        </DetailPill>
      </motion.div>
      <motion.div
        aria-hidden
        style={{ opacity: pillOpacity, scale: pillScale, x: peopleX, y: peopleY }}
        className="absolute right-[2%] top-[30%] z-40 hidden md:block"
      >
        <DetailPill>
          <PeopleIcon />
          Devon + Mia
        </DetailPill>
      </motion.div>
      <motion.div
        aria-hidden
        style={{ opacity: pillOpacity, scale: pillScale, y: noteY }}
        className="absolute bottom-[14%] left-[3%] z-40 hidden md:block"
      >
        <DetailPill>
          <NoteIcon />
          Her first day.
        </DetailPill>
      </motion.div>

      <PhotoCapture
        opacity={photoOpacity}
        scale={photoScale}
        rotate={photoRotate}
        shutterScale={shutterScale}
        flashOpacity={flashOpacity}
      />
    </div>
  )
}

function StaticMealDetailPreview() {
  return (
    <div className="relative mx-auto aspect-[2/3] w-full max-w-[440px] overflow-hidden rounded-[2rem] border border-black/10 bg-[#F2F7F6] shadow-[0_30px_80px_rgba(82,35,0,0.25)]">
      <div className="absolute left-0 top-0 aspect-[1206/2622] w-full -translate-y-[29%]">
        <MealDetailScreenContent sizes="(max-width: 1023px) 90vw, 440px" />
      </div>
    </div>
  )
}

function ReducedMotionHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-brand-orange px-5 py-20 text-white sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              How it works
            </p>
            <h2
              className="mt-4 max-w-xl text-3xl font-bold leading-[1.06] text-white sm:text-5xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              One photo does most of the work.
            </h2>
            <div className="mt-10">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="border-t border-white/25 py-6 first:border-t-0 first:pt-0"
                >
                  <span className="text-xs font-bold tabular-nums text-white">
                    {step.number}
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/72 sm:text-base">
                    {step.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <StaticMealDetailPreview />
        </div>
      </div>
    </section>
  )
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const stagedProgress = useTransform(
    scrollYProgress,
    SCROLL_STOPS,
    STORY_STOPS,
  )
  const progress = useSpring(stagedProgress, {
    stiffness: 105,
    damping: 28,
    mass: 0.9,
  })

  const lineScale = useTransform(progress, [0, 0.84], [0.08, 1])

  const desktopStepMotion: StepMotion[] = [
    {
      opacity: useTransform(progress, [0, 0.25, 0.36], [1, 1, 0.46]),
      y: useTransform(progress, [0, 0.36], [0, -5]),
    },
    {
      opacity: useTransform(
        progress,
        [0, 0.25, 0.37, 0.56, 0.65],
        [0.28, 0.28, 1, 1, 0.48],
      ),
      y: useTransform(progress, [0.25, 0.39, 0.65], [7, 0, -5]),
    },
    {
      opacity: useTransform(progress, [0, 0.56, 0.67], [0.28, 0.28, 1]),
      y: useTransform(progress, [0.56, 0.69], [7, 0]),
    },
  ]

  const mobileStepMotion: StepMotion[] = [
    {
      opacity: useTransform(progress, [0, 0.25, 0.35], [1, 1, 0]),
      y: useTransform(progress, [0, 0.25, 0.35], [0, 0, -10]),
    },
    {
      opacity: useTransform(
        progress,
        [0, 0.26, 0.37, 0.56, 0.65],
        [0, 0, 1, 1, 0],
      ),
      y: useTransform(
        progress,
        [0.26, 0.37, 0.56, 0.65],
        [10, 0, 0, -10],
      ),
    },
    {
      opacity: useTransform(progress, [0, 0.56, 0.67], [0, 0, 1]),
      y: useTransform(progress, [0.56, 0.67], [10, 0]),
    },
  ]

  if (prefersReducedMotion) {
    return <ReducedMotionHowItWorks />
  }

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative h-[430svh] scroll-mt-20 bg-brand-orange sm:h-[450svh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-clip text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            background:
              'radial-gradient(circle at 78% 45%, rgba(255,255,255,0.22), transparent 34%), radial-gradient(circle at 20% 85%, rgba(111,45,0,0.12), transparent 28%)',
          }}
        />
        <div className="relative z-10 mx-auto grid h-full max-w-7xl grid-rows-[auto_minmax(0,1fr)_7.25rem] gap-y-3 px-5 pb-4 pt-[5.25rem] sm:px-8 sm:pb-6 sm:pt-24 lg:grid-cols-[0.86fr_1.14fr] lg:grid-rows-1 lg:items-center lg:gap-16 lg:py-12 xl:gap-24">
          <div className="lg:flex lg:h-full lg:max-h-[760px] lg:flex-col lg:justify-center">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-xs">
                How it works
              </p>
              <h2
                className="mt-1.5 max-w-xl text-[clamp(1.65rem,6.7vw,2.7rem)] font-bold leading-[1.02] text-white sm:mt-4 sm:text-5xl lg:text-[clamp(2.8rem,4vw,4.6rem)]"
                style={{ letterSpacing: '-0.035em' }}
              >
                One photo does most of the work.
              </h2>
            </div>

            <div className="relative mt-10 hidden lg:block">
              <div
                aria-hidden
                className="absolute bottom-6 left-6 top-2 w-px bg-white/25"
              >
                <motion.span
                  style={{ scaleY: lineScale }}
                  className="block h-full w-px origin-top bg-white"
                />
              </div>
              {steps.map((step, index) => (
                <StepCopy
                  key={step.number}
                  step={step}
                  motionStyle={desktopStepMotion[index]}
                  inverse
                />
              ))}
            </div>
          </div>

          <div className="min-h-0 lg:h-full lg:max-h-[760px]">
            <CinematicStage progress={progress} />
          </div>

          <div className="relative lg:hidden">
            <div className="relative h-[7.15rem]">
              {steps.map((step, index) => (
                <StepCopy
                  key={step.number}
                  step={step}
                  motionStyle={mobileStepMotion[index]}
                  mobile
                  inverse
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
