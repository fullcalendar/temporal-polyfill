import { createOptionParser } from './refine'

export const CALENDAR_DISPLAY_AUTO = 0
export const CALENDAR_DISPLAY_NEVER = 1
export const CALENDAR_DISPLAY_ALWAYS = 2
export type CalendarDisplayInt = 0 | 1 | 2

export interface CalendarDisplayMap {
  auto: 0
  never: 1
  always: 2
}
export const calendarDisplayMap: CalendarDisplayMap = {
  auto: 0,
  never: 1,
  always: 2,
}

export const parseCalendarDisplayOption = createOptionParser(
  'calendarName',
  calendarDisplayMap,
  CALENDAR_DISPLAY_AUTO,
)
