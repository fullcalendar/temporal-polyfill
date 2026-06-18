import { getFirstDay } from './firstDay.js'
import { getMinimalDays } from './minimalDays.js'

type LocaleWeekInfo = {
  firstDay: number
  minimalDays: number
}

export function getLocaleWeekInfo(locale: string): LocaleWeekInfo {
  return { firstDay: getFirstDay(locale), minimalDays: getMinimalDays(locale) }
}
