import { isoCalendarId } from '../internal/calendarConfig'
import { resolveCalendarId } from '../internal/calendarId'
import { requireString } from '../internal/cast'
import { parseCalendarId } from '../internal/isoParse'
import { isObjectLike } from '../internal/utils'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { getSlots } from './slotClass'
import { ZonedDateTime } from './zonedDateTime'

export type CalendarArg =
  | string
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainMonthDay
  | PlainYearMonth

/*
Falls back to ISO
*/
export function getCalendarIdFromBag(bag: {
  calendar?: CalendarArg
}): string {
  return extractCalendarIdFromBag(bag) || isoCalendarId
}

/*
Can return undefined
*/
export function extractCalendarIdFromBag(bag: { calendar?: CalendarArg }):
  | string
  | undefined {
  const { calendar: calendarArg } = bag
  if (calendarArg !== undefined) {
    return refineCalendarArg(calendarArg)
  }
}

/*
Returns a calendarId
*/
export function refineCalendarArg(arg: CalendarArg): string {
  if (isObjectLike(arg)) {
    const { calendar } = (getSlots(arg) || {}) as { calendar?: string }
    if (!calendar) {
      throw new TypeError('BAD!') // TODO: improve!
    }
    return calendar // other object already refined it
  }
  return refineCalendarString(arg)
}

/*
Like refineCalendarId, but allows different string formats, like datetime string
*/
function refineCalendarString(arg: string): string {
  return resolveCalendarId(parseCalendarId(requireString(arg)))
}
