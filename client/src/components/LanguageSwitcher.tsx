import { useTranslation } from 'react-i18next'
import { changeLanguage, SUPPORTED_LANGUAGES, type Language } from '../i18n'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <select
      aria-label={t('lang.label')}
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value as Language)}
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {t(`lang.${lang}`)}
        </option>
      ))}
    </select>
  )
}
