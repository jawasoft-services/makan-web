import Image from "next/image"
import Footer from "@/components/Footer"
import { GetMakanButton } from "./ShareActions"
import styles from "./share-pages.module.css"

/**
 * RM20616 A12 U3 — the page for a shared link whose meal or profile is gone (board web-gone): the
 * waving plate, "Unavailable", the gone line when the board has one for this kind, and Get Makan.
 * It never shows anything of what the link named: no name, no photo, no reason.
 */
export default function GonePage({ title, body, getLabel, appPage }: { title: string; body?: string; getLabel: string; appPage: string }) {
  return (
    <div className={styles.shell}>
      <main id="main-content" className={styles.gone}>
        <Image src="/redesign/unavailable-gone.png" alt="" width={160} height={160} className={styles.goneArt} priority />
        <h1>{title}</h1>
        {body ? <p>{body}</p> : null}
      </main>
      <div className={styles.bar}>
        <GetMakanButton appPage={appPage} label={getLabel} className={styles.cta} />
      </div>
      <Footer />
    </div>
  )
}
