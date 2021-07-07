import { getFirstDay } from './firstDay'
import { getMinimalDays } from './minimalDays'

type LocaleWeekInfo = {
  firstDay: number
  minimalDays: number
}

export const getLocaleWeekInfo = (locale: string): LocaleWeekInfo => {
  return { firstDay: getFirstDay(locale), minimalDays: getMinimalDays(locale) }
}
