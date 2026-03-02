'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function BrandStory() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-120px' })

  return (
    <section ref={ref} className="relative overflow-hidden bg-white py-16 sm:py-28 px-5 sm:px-8 lg:py-36">
      {/* Decorative oversized quote mark */}
      <div className="pointer-events-none absolute -top-20 left-4 sm:left-8 select-none text-[10rem] sm:text-[20rem] leading-none text-brand-orange/[0.04] lg:left-16">
        &ldquo;
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Manifesto block — centered */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="mx-auto max-w-3xl text-2xl sm:text-4xl font-bold leading-[1.15] text-brand-text lg:text-6xl">
            Food is not <span className="uppercase">purely</span> content.
            <br />
            <span className="italic">It is a daily habit.</span>
          </h2>
        </motion.div>

        <motion.p
          className="mx-auto mt-6 sm:mt-8 max-w-2xl text-center text-base sm:text-lg leading-relaxed text-brand-cyan"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Most food apps want you to perform — plate it nicely, write a
          caption, chase likes. We built Makan because we wanted the
          opposite: a place where Tuesday&apos;s leftover curry belongs just
          as much as Saturday&apos;s tasting menu.
        </motion.p>

        {/* Three pillars — equal columns */}
        <div className="mt-10 sm:mt-16 grid gap-8 md:grid-cols-3 md:gap-10 lg:gap-12">
          {[
            {
              title: 'No audience required',
              body: 'You don\u2019t need followers to make posting worthwhile. Even a private log for yourself has value — a record of what you ate and when.',
            },
            {
              title: 'Ordinary is the point',
              body: 'Monday morning porridge counts just as much as Friday night out. The meals nobody photographs are the ones that tell the real story.',
            },
            {
              title: 'Built to stay small',
              body: 'Makan isn\u2019t trying to be the next big platform. It\u2019s a small space for people who eat together, even when they\u2019re apart.',
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
            >
              <div className="mb-3 h-px w-8 bg-brand-orange/50" />
              <h3 className="text-base font-semibold text-brand-text">
                {item.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-brand-cyan">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
