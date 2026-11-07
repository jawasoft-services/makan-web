import { IllustrationPortrait, NativeCrown } from './MaitredIllustration'
import { NATIVE_MAITRED_COPY } from './native-copy'
import { NATIVE_ORDER_COMPOSER_COPY } from './composer-copy'
import styles from './maitred-order-composer.module.css'

export type MaitredOrderComposerProps = {
  locale: string
  openness: number
  typedText: string
  preview: boolean
  previewProgress?: number
  publishProgress: number
}

const unit = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0

// offsetHeight stays in the source's 390×844 units when the whole phone scales.
// React 19 calls this stable callback's cleanup when the content unmounts.
function measurePreview(node: HTMLDivElement | null) {
  if (!node) return
  const sheet = node.parentElement
  const update = () => {
    if (node.offsetHeight > 0) sheet?.style.setProperty('--preview-height', `${node.offsetHeight}px`)
  }
  update()
  const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
  observer?.observe(node)
  return () => observer?.disconnect()
}

function Holder({ role, preview }: { role: string; preview: boolean }) {
  return <div className={`${styles.person} ${preview ? styles.previewPerson : ''}`}>
    <span className={`${styles.avatar} ${preview ? styles.previewAvatar : ''}`}>
      <span className={styles.crown}><NativeCrown size={30} /></span>
      <IllustrationPortrait portrait={0} />
    </span>
    <span className={styles.personCopy}><span className={styles.author}>Alex Chen</span><span className={styles.role}>{role}</span></span>
  </div>
}

/** Native 18d991a75: maitredMenu.tsx:154–181,197–273; MaitredExperience.tsx:107–150;
 * MaitredUi.tsx:31–58,102–153,214–230,455–482; app/_layout.tsx:744–752.
 * Pure 390×844 illustration: OS backdrop/grabber are represented, not capture-verified.
 * All movement comes from props; no real form, keyboard, publication or autonomous motion. */
export default function MaitredOrderComposer({ locale, openness, typedText, preview, previewProgress = preview ? 1 : 0, publishProgress }: MaitredOrderComposerProps) {
  const language = locale === 'id' ? 'id' : 'en'
  const copy = NATIVE_ORDER_COMPOSER_COPY[language]
  const native = NATIVE_MAITRED_COPY[language]
  const open = unit(openness)
  const publishing = unit(publishProgress)
  const blend = unit(previewProgress)
  const press = Math.sin(Math.PI * publishing)
  const hasDish = Boolean(typedText.trim())
  const role = native.maitredAt.replace('{{placeName}}', 'Kendal Street Kitchen')

  return <div className={styles.composer} aria-hidden={open === 0 || undefined} data-native-order-composer={preview ? 'preview' : 'editor'}>
    <div className={styles.backdrop} style={{ opacity: open * .24 }} aria-hidden="true" />
    <div className={styles.sheet} style={{ transform: `translateY(${(1 - open) * 100}%)`, height: blend === 1 ? 'auto' : `calc(75% * ${1 - blend} + var(--preview-height, 633px) * ${blend})` }}>
      <span className={styles.grabber} aria-hidden="true" />
      <div ref={measurePreview} className={`${styles.content} ${styles.previewContent}`} style={{ opacity: blend }} aria-hidden={!preview || undefined}>
          <div className={styles.previewCard}>
            <Holder role={role} preview />
            <div className={styles.previewOrder}><p>{native.yourUsualOrder}</p><strong>Harissa prawns</strong></div>
          </div>
          <p className={styles.privatePreview}>{copy.notPublished}</p>
          <span className={styles.action} data-native-action="publish" style={{ opacity: 1 - .35 * press, transform: `scale(${1 - .015 * press})` }}>
            {publishing > 0 ? copy.saving : copy.publish}
          </span>
          <span className={`${styles.action} ${styles.secondaryAction}`} data-native-action="change-dish">{copy.changeDish}</span>
      </div>
      <div className={`${styles.content} ${styles.editorContent}`} style={{ opacity: 1 - blend }} aria-hidden={preview || undefined}>
          <Holder role={role} preview={false} />
          <div className={styles.question}><p className={styles.title}>{copy.orderQuestion}</p><p className={styles.support}>{copy.oneEnough}</p></div>
          <div className={styles.fieldGroup}>
            <p className={styles.fieldLabel}>{copy.dishName}</p>
            <div className={styles.field} data-native-dish-field>
              {typedText ? <span>{typedText}<span className={styles.caret} aria-hidden="true" /></span>
                : <span className={styles.placeholder}><span className={`${styles.caret} ${styles.emptyCaret}`} aria-hidden="true" />{copy.dishExample}</span>}
            </div>
          </div>
          <span className={styles.action} data-native-action="preview" data-native-disabled={!hasDish}>
            <span style={{ opacity: hasDish ? 1 : .55 }}>{copy.preview}</span>
            <span className={styles.arrow} style={{ opacity: hasDish ? 1 : .55 }} aria-hidden="true">{'\uf133'}</span>
          </span>
      </div>
    </div>
  </div>
}
