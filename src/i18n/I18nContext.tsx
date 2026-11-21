import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, TranslationKey, Language } from './translations'

interface I18nContextType {
  language: Language
  direction: 'ltr' | 'rtl'
  isRtl: boolean
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey, fallback?: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const STORAGE_KEY = 'blood_bank_language'

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return (saved === 'ar' || saved === 'en') ? saved : 'en'
  })

  const direction = language === 'ar' ? 'rtl' : 'ltr'
  const isRtl = language === 'ar'

  useEffect(() => {
    document.documentElement.dir = direction
    document.documentElement.lang = language
    localStorage.setItem(STORAGE_KEY, language)
  }, [language, direction])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = (key: TranslationKey, fallback?: string): string => {
    const currentDict = translations[language] || translations.en
    return currentDict[key] || fallback || key
  }

  return (
    <I18nContext.Provider value={{ language, direction, isRtl, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return ctx
}
