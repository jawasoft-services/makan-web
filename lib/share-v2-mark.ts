import { randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * RM20616 A12 U3 — the mark proxy.ts puts on its own rewrite to a Share v2 page, and the only
 * thing that makes a v2 page answer. It is a random value made when this server starts, kept in
 * the process and nowhere else: it is in no file, no log and no response, and a visitor cannot
 * know it, so a request that did not come through the proxy (an address the proxy's matcher
 * skips, or one spelled so that it slips past) cannot carry it. A request that arrives already
 * carrying the header is answered as an unknown page by the proxy.
 *
 * The proxy and the pages run in one server process and share this through `globalThis`. If a
 * host ever ran them apart, the pages would see no valid mark and answer 404: closed, not open.
 */
export const SHARE_V2_PROXY_HEADER = 'x-makan-share-v2'

const SLOT = Symbol.for('makan.share-v2.proxy-mark')

export function shareV2ProxyMark(): string {
  const store = globalThis as unknown as Record<symbol, unknown>
  if (typeof store[SLOT] !== 'string') store[SLOT] = randomBytes(32).toString('hex')
  return store[SLOT] as string
}

export function isShareV2ProxyMark(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return false
  const given = Buffer.from(value), mark = Buffer.from(shareV2ProxyMark())
  return given.length === mark.length && timingSafeEqual(given, mark)
}
