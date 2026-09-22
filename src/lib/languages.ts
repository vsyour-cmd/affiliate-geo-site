export const languages = ['en', 'zh', 'ja', 'de', 'fr'] as const
export type Language = (typeof languages)[number]

export const languageNames: Record<Language, string> = {
  en: 'English', zh: '中文', ja: '日本語', de: 'Deutsch', fr: 'Français',
}
