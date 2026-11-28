import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { localizePath } from "@/i18n/paths"
import { routing } from "@/i18n/routing"
import { functionUrls, noticeCode, noticeLinkPageOn } from "@/lib/notice-link"
import { NOTICE_MARK_HEADER } from "@/lib/notice-link-proxy"
import { isShareV2ProxyMark } from "@/lib/share-v2-mark"
import { NOTICE_STRING_KEYS, type NoticeStrings } from "../NoticeCard"
import NoticeFlow from "../NoticeFlow"

/*
 * RM20616 O1 — makanofficial.com/d/{code} and /id/d/{code} (see lib/notice-link.ts). Off unless NOTICE_LINK_PAGE=1:
 * then the site's not-found page. The page draws a shell with no restaurant name and no place id; the visitor's
 * browser asks the backend about the code (NoticeFlow), never this server.
 */

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ locale: string; code: string }>
}

export default async function NoticeLinkPage({ params }: Props) {
  const { locale, code } = await params
  if (!noticeLinkPageOn() || !hasLocale(routing.locales, locale)) notFound()
  // Only the proxy's own rewrite carries its mark: an address the proxy's matcher skips (one with a dot) never does.
  if (!isShareV2ProxyMark((await headers()).get(NOTICE_MARK_HEADER))) notFound()
  const t = await getTranslations({ locale, namespace: "SharePages.noticeLink" })
  const strings = Object.fromEntries(NOTICE_STRING_KEYS.map((key) => [key, t.raw(key) as string])) as NoticeStrings
  return (
    <NoticeFlow
      code={noticeCode(code)}
      urls={functionUrls()}
      strings={strings}
      supportHref={localizePath(locale, "/support")}
      appHref={localizePath(locale, "/app")}
    />
  )
}
