import { getDirection } from './direction.js'

type LocaleTextInfo = {
  direction: 'ltr' | 'rtl'
}

export function getLocaleTextInfo(locale: string): LocaleTextInfo {
  return { direction: getDirection(locale) }
}
