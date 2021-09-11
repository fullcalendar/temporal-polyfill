import { getFirstDay } from './firstDay'
import { getMinimalDays } from './minimalDays'

type LocaleWeekInfo = {
  firstDay: number
  minimalDays: number
}

export function getLocaleWeekInfo(locale: string): LocaleWeekInfo {
  return { firstDay: getFirstDay(locale), minimalDays: getMinimalDays(locale) }
}
