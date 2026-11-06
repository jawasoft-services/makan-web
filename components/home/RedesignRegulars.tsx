import { getTranslations } from 'next-intl/server'
import RegularsWidget from './RegularsWidget'

export default async function RedesignRegulars({ locale }: { locale: string }) {
  const w = await getTranslations('Redesign.widget')
  return <div className="art art-usual"><RegularsWidget initialTab={1} locale={locale}
    labels={[w('regularsLabel'), w('usualLabel')]}
    label={w('widgetLabel')} rulesLabel={w('rulesLabel')}
    rules={{ title: w('rulesTitle'), qualify: w('rulesQualify'), holder: w('rulesHolder'), usual: w('rulesUsual') }}
  /></div>
}
