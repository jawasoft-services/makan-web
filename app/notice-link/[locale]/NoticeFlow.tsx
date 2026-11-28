"use client"

import { useEffect, useRef, useState } from "react"
import { reportSender, resolveNotice, sendReport, type FunctionUrls, type NoticeView, type ReportInput } from "@/lib/notice-link"
import { NoticeCard, type NoticeStrings } from "./NoticeCard"

/*
 * RM20616 O1 — the state of /d/{code}. The browser asks resolveNoticeLink about the code once, at the function's own
 * URL, and shows the card for the answer. "Not right? Tell us" opens What's wrong? on the same page; Send files one
 * report (reportSender) and shows We've got it. A code that is not a code never reaches the network.
 */

interface Props {
  /** The code in its stored form, or null when the address cannot hold one (the page then shows own-n6). */
  code: string | null
  urls: FunctionUrls
  strings: NoticeStrings
  supportHref: string
  appHref: string
}

const browserFetch: typeof fetch = (input, init) => fetch(input, init)

export default function NoticeFlow({ code, urls, strings, supportHref, appHref }: Props) {
  const [view, setView] = useState<NoticeView>(code ? { view: "loading" } : { view: "invalid" })
  const [busy, setBusy] = useState(false)
  // One lookup per page, even when React runs the effect twice.
  const asked = useRef(false)
  const send = useRef<ReturnType<typeof reportSender> | null>(null)

  useEffect(() => {
    if (!code || asked.current) return
    asked.current = true
    void resolveNotice(browserFetch, urls.resolve, code).then(setView)
  }, [code, urls.resolve])

  const onTellUs = () => {
    if (view.view === "current") setView({ view: "form", placeName: view.placeName })
  }

  const onSend = (input: ReportInput) => {
    if (view.view !== "form") return
    const { placeName } = view
    send.current ??= reportSender((typed) => sendReport(browserFetch, urls.report, code, typed, placeName))
    const pending = send.current(input)
    if (!pending) return
    setBusy(true)
    void pending.then((next) => {
      setBusy(false)
      setView(next)
    })
  }

  return <NoticeCard view={view} strings={strings} supportHref={supportHref} appHref={appHref} onTellUs={onTellUs} onSend={onSend} busy={busy} />
}
