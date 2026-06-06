import type { CalendarSlot } from '../../internal/calendarSlot'
import { isoCalendar } from '../../internal/calendarSlot'
import { requireString } from '../../internal/cast'
import * as errorMessages from '../../internal/errorMessages'
import { parseCalendarId } from '../../internal/isoParse'
import { isObjectLike } from '../../internal/utils'
import { resolveBasicCalendar } from './calendarResolver'
import { PlainDate, getPlainDateSlotsIfPresent } from './plainDate'
import { PlainDateTime, getPlainDateTimeSlotsIfPresent } from './plainDateTime'
import { PlainMonthDay, getPlainMonthDaySlotsIfPresent } from './plainMonthDay'
import {
  PlainYearMonth,
  getPlainYearMonthSlotsIfPresent,
} from './plainYearMonth'
import { ZonedDateTime, getZonedDateTimeSlotsIfPresent } from './zonedDateTime'

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
    const slots =
      getPlainDateSlotsIfPresent(arg) ||
      getPlainDateTimeSlotsIfPresent(arg) ||
      getZonedDateTimeSlotsIfPresent(arg) ||
      getPlainMonthDaySlotsIfPresent(arg) ||
      getPlainYearMonthSlotsIfPresent(arg)

    if (!slots || !('calendar' in slots)) {
      // TODO: better message how non-Temporal objects aren't allowed
      throw new TypeError(errorMessages.invalidCalendar(arg as any))
    }
    return slots.calendar
  }
  return refineCalendarString(arg)
}

/*
Like resolveBasicCalendar, but allows different string formats, like datetime string
*/
function refineCalendarString(arg: string): CalendarSlot {
  return resolveBasicCalendar(parseCalendarId(requireString(arg)))
}
