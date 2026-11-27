import type { AgrDish } from './types'

/**
 * RM20773: the 20 hero plates, the approved face-cropped photos from the 26 Nov 2026 prototype
 * (decoded from its embedded DISHES list). Each `src` is the 768 px WebP; the same folder holds
 * `-384.webp` (phones, the 3D plates) and `-256.webp` (small thumbnails in the page) beside it.
 * Order matters: the runtime refers to plates by index (0 = the regular's usual, 6/7 = the
 * Eat or Yeet pair, 8-19 = the diary days).
 */
export const PLATES: AgrDish[] = [
  { name: 'Harissa prawns', venue: 'Kendal Street Kitchen', handle: '@ridorichard', src: '/agr/plates/01.webp' },
  { name: 'Sushi', venue: 'NOBU Singapore', handle: '@Valesca', src: '/agr/plates/02.webp' },
  { name: 'Fish Sando', venue: 'Fire Street Food', handle: '@Roo Baby Donovan', src: '/agr/plates/03.webp' },
  { name: 'ROS BEEEEF', venue: 'Heaney & Mill', handle: '@Ridorichard', src: '/agr/plates/04.webp' },
  { name: 'Carbonara & mushroom risotto', venue: 'Kendal Street Kitchen', handle: '@ridorichard', src: '/agr/plates/05.webp' },
  { name: 'Biang biang', venue: 'Murger Han', handle: '', src: '/agr/plates/06.webp' },
  { name: 'Cannon of lamb', venue: 'Brasserie Quartier', handle: '', src: '/agr/plates/07.webp' },
  { name: 'Truffle Wagyu donburi', venue: 'Fat Cow', handle: '', src: '/agr/plates/08.webp' },
  { name: 'White asparagus', venue: 'Restaurante Albacara', handle: '', src: '/agr/plates/09.webp' },
  { name: 'Beef bourguignon', venue: 'Au Bourguignon du Marais', handle: '', src: '/agr/plates/10.webp' },
  { name: 'Tom yum', venue: 'Fusha Asian Fusion, Durham', handle: '', src: '/agr/plates/11.webp' },
  { name: 'Dim sum', venue: 'HAKA Dimsum Shop Tebet', handle: '', src: '/agr/plates/12.webp' },
  { name: 'Oysters', venue: 'AKI', handle: '', src: '/agr/plates/13.webp' },
  { name: 'Proper pie', venue: 'The White Hart', handle: '', src: '/agr/plates/14.webp' },
  { name: 'Tiramisu', venue: 'Kendal Street Kitchen', handle: '', src: '/agr/plates/15.webp' },
  { name: 'Chicken', venue: 'Honest Greens Pedralbes Centre', handle: '', src: '/agr/plates/16.webp' },
  { name: 'Steak', venue: 'Flat Iron Covent Garden', handle: '', src: '/agr/plates/17.webp' },
  { name: 'Macarons', venue: 'Ladurée', handle: '', src: '/agr/plates/18.webp' },
  { name: 'Salmon nigiri', venue: 'Eel Sushi Bar', handle: '', src: '/agr/plates/19.webp' },
  { name: 'Sushi', venue: 'Sushi TONARI', handle: '', src: '/agr/plates/20.webp' },
]

/** A smaller copy of a plate photo: 384 or 256 px wide. */
export function plateVariant(src: string, width: 384 | 256): string {
  return src.replace(/\.webp$/, `-${width}.webp`)
}
