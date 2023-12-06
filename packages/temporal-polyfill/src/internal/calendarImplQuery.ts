import {
  gregoryCalendarId,
  isoCalendarId,
  japaneseCalendarId
} from './calendarConfig'
import { createLazyGenerator } from './utils'
import { ensureString } from './cast'
import { CalendarImpl, GregoryCalendarImpl, JapaneseCalendarImpl, getCalendarIdBase, IntlCalendarImpl } from './calendarImpl'

const calendarImplClasses: {
  [calendarId: string]: { new(calendarId: string): CalendarImpl }
} = {
  [isoCalendarId]: CalendarImpl,
  [gregoryCalendarId]: GregoryCalendarImpl,
  [japaneseCalendarId]: JapaneseCalendarImpl,
}

const queryCacheableCalendarImpl = createLazyGenerator((calendarId, CalendarImplClass) => {
  return new CalendarImplClass(calendarId)
})

export function queryCalendarImpl(calendarId: string): CalendarImpl {
  // TODO: fix double-call of ensureString
  calendarId = ensureString(calendarId).toLowerCase()

  // explicitly deprecated calendars
  // TODO: use faster map?
  if (calendarId === 'islamicc') {
    calendarId = 'islamic-civil'
  }

  const calendarIdBase = getCalendarIdBase(calendarId)
  const CalendarImplClass = calendarImplClasses[calendarIdBase]

  if (CalendarImplClass) {
    calendarId = calendarIdBase
  }

  return queryCacheableCalendarImpl(calendarId, CalendarImplClass || IntlCalendarImpl)
}
