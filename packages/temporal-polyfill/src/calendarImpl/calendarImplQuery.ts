import { tryParseDateTime } from '../dateUtils/parse'
import { CalendarImpl, getCalendarIDBase } from './calendarImpl'
import { GregoryCalendarImpl } from './gregoryCalendarImpl'
import { IntlCalendarImpl } from './intlCalendarImpl'
import { IslamicCalendarImpl } from './islamicCalendarImpl'
import { isoCalendarID, isoCalendarImpl } from './isoCalendarImpl'
import { JapaneseCalendarImpl } from './japaneseCalendarImpl'

const implClasses: { [calendarID: string]: { new(id: string): CalendarImpl } } = {
  gregory: GregoryCalendarImpl,
  japanese: JapaneseCalendarImpl,
  islamic: IslamicCalendarImpl,
}

const implCache: { [calendarID: string]: CalendarImpl } = {
  [isoCalendarID]: isoCalendarImpl,
}

export function queryCalendarImpl(id: string): CalendarImpl {
  id = String(id)

  // TODO: more DRY with Calendar::from
  const parsedDateTime = tryParseDateTime(id, false, true) // allowZ=true
  if (parsedDateTime !== undefined) {
    id = parsedDateTime.calendar || 'iso8601'
  }

  const key = id.toLocaleLowerCase() // lowercase matches isoCalendarID

  return implCache[key] ||
    (implCache[key] = new (
      implClasses[getCalendarIDBase(key)] ||
      IntlCalendarImpl
    )(id))
}
