import type { CalendarImpl } from '../../internal/calendarImpl'
import { isoCalendarImpl } from '../../internal/calendarImpl'
import { requireString } from '../../internal/cast'
import * as errorMessages from '../../internal/errorMessages'
import { parseCalendarId } from '../../internal/isoParse'
import { isObjectLike } from '../../internal/utils'
import { resolveBasicCalendarId } from './calendarResolve'
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
}): CalendarImpl {
  const calendar = extractCalendarFromBag(bag)
  return calendar === undefined ? isoCalendarImpl : calendar
}

export function extractCalendarFromBag(bag: { calendar?: CalendarArg }):
  | CalendarImpl
  | undefined {
  const { calendar: calendarArg } = bag
  if (calendarArg !== undefined) {
    return refineCalendarArg(calendarArg)
  }
}

export function refineCalendarArg(arg: CalendarArg): CalendarImpl {
  if (isObjectLike(arg)) {
    const slots =
      getPlainDateSlotsIfPresent(arg) ||
      getPlainDateTimeSlotsIfPresent(arg) ||
      getZonedDateTimeSlotsIfPresent(arg) ||
      getPlainMonthDaySlotsIfPresent(arg) ||
      getPlainYearMonthSlotsIfPresent(arg)

    if (!slots) {
      // TODO: better message how non-Temporal objects aren't allowed
      throw new TypeError(errorMessages.invalidCalendar(arg as any))
    }
    return slots.calendar
  }
  return refineCalendarString(arg)
}

/*
Like resolveBasicCalendarId, but allows different string formats, like datetime string
*/
function refineCalendarString(arg: string): CalendarImpl {
  return resolveBasicCalendarId(parseCalendarId(requireString(arg)))
}
