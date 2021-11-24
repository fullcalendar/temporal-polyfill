import { CalendarImpl } from './calendarImpl'
import { GregoryCalendarImpl } from './gregoryCalendarImpl'
import { HebrewCalendarImpl } from './hebrewCalendarImpl'
import { IntlCalendarImpl } from './intlCalendarImpl'
import { isoCalendarID, isoCalendarImpl } from './isoCalendarImpl'
import { JapaneseCalendarImpl } from './japaneseCalendarImpl'

const implClasses: { [calendarID: string]: { new(id: string): CalendarImpl } } = {
  gregory: GregoryCalendarImpl,
  hebrew: HebrewCalendarImpl,
  japanese: JapaneseCalendarImpl,
}

const implCache: { [calendarID: string]: CalendarImpl } = {
  [isoCalendarID]: isoCalendarImpl,
}

export function getCalendarImpl(id: string): CalendarImpl {
  const key = String(id).toLocaleLowerCase() // lowercase matches isoCalendarID

  return implCache[key] ||
    (implCache[key] = new (implClasses[key] || IntlCalendarImpl)(id))
}
