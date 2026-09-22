'use client'

import { useRouter } from 'next/navigation'
import { languageNames, languages, type Language } from '@/lib/languages'

export function LanguageSwitcher({ current, label }: { current: Language; label: string }) {
  const router = useRouter()
  return (
    <label className="language-switcher">
      <span className="sr-only">{label}</span>
      <select aria-label={label} value={current} onChange={(event) => {
        document.cookie = `site-language=${event.target.value};path=/;max-age=31536000;samesite=lax`
        router.refresh()
      }}>
        {languages.map((language) => <option key={language} value={language}>{languageNames[language]}</option>)}
      </select>
    </label>
  )
}
