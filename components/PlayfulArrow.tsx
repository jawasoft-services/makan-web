/** The same soft, uneven silhouette as Makan's bubble lettering. */
export default function PlayfulArrow({ direction = 'up-right' }: { direction?: 'up-right' | 'right' | 'left' | 'down' }) {
  const rotation = { 'up-right': 0, right: 45, left: 225, down: 135 }[direction]
  return <svg className="makan-arrow" viewBox="0 0 32 32" width={24} height={24} aria-hidden="true" focusable="false">
    <g transform={`rotate(${rotation} 16 16)`}>
      <path d="M8.1 28.1C6.2 28.9 3.9 27.9 3.3 26.1C2.9 24.5 3.7 22.9 5.1 21.9L17.3 10.3L11.5 10.6C8.9 10.7 7.5 9.6 7.4 7.6C7.3 5.5 8.9 4.2 11.1 4.1L24.9 3.6C27.3 3.5 28.4 5.1 28.3 7.4L27.9 21C27.8 23.4 26.4 24.7 24.3 24.5C22.2 24.4 21.1 22.8 21.3 20.5L21.6 14.8L10.1 26.8C9.5 27.4 8.8 27.8 8.1 28.1Z" />
    </g>
  </svg>
}
