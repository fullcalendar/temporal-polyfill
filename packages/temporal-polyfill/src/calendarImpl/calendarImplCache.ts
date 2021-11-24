import { CalendarImpl } from './calendarImpl'
import { isoCalendarID, isoCalendarImpl } from './isoCalendarImpl'

export const calendarImplCache: { [calendarID: string]: CalendarImpl } = {
  [isoCalendarID]: isoCalendarImpl,
}
