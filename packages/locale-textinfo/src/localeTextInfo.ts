import { getDirection } from './direction'

type LocaleTextInfo = {
  direction: 'ltr' | 'rtl'
}

export const getLocaleTextInfo = (locale: string): LocaleTextInfo => {
  return { direction: getDirection(locale) }
}
