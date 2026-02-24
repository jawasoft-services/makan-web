import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Makan — Share What You Eat'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#F1F6F4',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* M icon */}
        <svg viewBox="0 0 512 512" width="140" height="140" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#FCA445"
            d="M0 0h512v512H0V0Zm88 105-5 2-8 12v280l3 8q4 6 12 8h60l7-3 7-11 1-171 66 123q5 6 16 8 20 3 31-5l9-13 60-113 1 2v167l5 11 10 5h60l7-3q6-4 7-12V195h-13l-13-7-7-9-2 1q-14 0-20-6-9-7-12-18l1-13h-3l-8-5-10-15q-2-12 2-16v-2l-8 4-10 14-75 141-3 1-82-151q-4-8-14-9H88Z"
          />
          <path
            fill="#FBF3DC"
            d="M87.5 105h72q10.12 1.37 14.5 8.5L255.5 265l3.5-1.5 75-141 9.5-13.5 8-4 .5 1.5q-4 5-2 16l9.5 15.5 8 5h3.5l-1 12.5q3 12 11.5 18.5 6.85 6.15 20 6l2-1 7 9 13 7H437v204.5q-1.48 8.52-7.5 12.5l-7 3h-60l-9.5-5-5-11.5v-167l-1.5-1.5L287 342.5l-9.5 13.5q-10.21 7.79-31 5-10.25-1.75-15.5-8.5L164.5 230l-.5 170.5-7.5 11.5-7 3h-60q-7.89-2.11-11.5-8.5l-3-8v-280l7.5-11.5 5-2Z"
          />
        </svg>

        {/* Brand name */}
        <div
          style={{
            marginTop: 32,
            fontSize: 100,
            fontWeight: 700,
            color: '#11181C',
            letterSpacing: '-3px',
            lineHeight: 1,
            display: 'flex',
          }}
        >
          Makan
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 20,
            fontSize: 34,
            color: '#477681',
            display: 'flex',
          }}
        >
          Share what you eat.
        </div>

        {/* Orange accent bar */}
        <div
          style={{
            marginTop: 40,
            width: 48,
            height: 4,
            background: '#FF9932',
            borderRadius: 2,
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
