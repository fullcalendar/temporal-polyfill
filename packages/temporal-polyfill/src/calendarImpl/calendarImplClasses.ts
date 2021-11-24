import { CalendarImpl } from './calendarImpl'
import { GregoryCalendarImpl } from './gregoryCalendarImpl'
import { HebrewCalendarImpl } from './hebrewCalendarImpl'
import { JapaneseCalendarImpl } from './japaneseCalendarImpl'

// NOTE: iso8601 is already inserted into calendarImplCache
export const calendarImplClasses: { [calendarID: string]: { new(id: string): CalendarImpl } } = {
  gregory: GregoryCalendarImpl,
  hebrew: HebrewCalendarImpl,
  japanese: JapaneseCalendarImpl,
}
