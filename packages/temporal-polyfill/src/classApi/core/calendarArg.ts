import { getBrandingAndSlots } from '../../apiHelpers/slotClass'
import { resolveCoreCalendar } from '../../internal/calendarResolver'
import type { CalendarSlot } from '../../internal/calendarSlot'
import { isoCalendar } from '../../internal/calendarSlot'
import { requireString } from '../../internal/cast'
import * as errorMessages from '../../internal/errorMessages'
import { parseCalendarId } from '../../internal/isoParse'
import { isObjectLike } from '../../internal/utils'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { ZonedDateTime } from './zonedDateTime'

export type CalendarArg =
  | string
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainMonthDay
  | PlainYearMonth

export function getCalendarFromBag(bag: {
  calendar?: CalendarArg
}): CalendarSlot {
  const calendar = extractCalendarFromBag(bag)
  return calendar === undefined ? isoCalendar : calendar
}

export function extractCalendarFromBag(bag: { calendar?: CalendarArg }):
  | CalendarSlot
  | undefined {
  const { calendar: calendarArg } = bag
  if (calendarArg !== undefined) {
    return refineCalendarArg(calendarArg)
  }
}

/*
Returns an CalendarSlot
*/
export function refineCalendarArg(arg: CalendarArg): CalendarSlot {
  if (isObjectLike(arg)) {
    const slots = getBrandingAndSlots(arg)?.[1]
    if (!slots || !('calendar' in slots)) {
      // TODO: better message how non-Temporal objects aren't allowed
      throw new TypeError(errorMessages.invalidCalendar(arg as any))
    }
    return (slots as { calendar: CalendarSlot }).calendar
  }
  return refineCalendarString(arg)
}

/*
Like resolveCoreCalendar, but allows different string formats, like datetime string
*/
function refineCalendarString(arg: string): CalendarSlot {
  return resolveCoreCalendar(parseCalendarId(requireString(arg)))
}
