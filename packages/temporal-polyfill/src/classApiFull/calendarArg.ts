import { getBrandingAndSlots } from '../apiHelpers/slotClass'
import { intlCalendarProvider } from '../externalCalendars/intlCalendarProvider'
import { requireString } from '../internal/cast'
import * as errorMessages from '../internal/errorMessages'
import type { InternalCalendar } from '../internal/externalCalendar'
import {
  getInternalCalendarId,
  gregoryCalendar,
  isoCalendar,
} from '../internal/externalCalendar'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../internal/intlCalendarConfig'
import { parseCalendarId } from '../internal/isoParse'
import { isObjectLike } from '../internal/utils'
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
}): InternalCalendar {
  const calendar = extractCalendarFromBag(bag)
  return calendar === undefined ? isoCalendar : calendar
}

export function extractCalendarFromBag(bag: { calendar?: CalendarArg }):
  | InternalCalendar
  | undefined {
  const { calendar: calendarArg } = bag
  if (calendarArg !== undefined) {
    return refineCalendarArg(calendarArg)
  }
}

export function refineCalendarArg(arg: CalendarArg): InternalCalendar {
  if (isObjectLike(arg)) {
    const slots = getBrandingAndSlots(arg)?.[1]
    if (!slots || !('calendar' in slots)) {
      throw new TypeError(errorMessages.invalidCalendar(arg as any))
    }
    return (slots as { calendar: InternalCalendar }).calendar
  }
  return refineCalendarString(arg)
}

function refineCalendarString(arg: string): InternalCalendar {
  return resolveFullCalendar(parseCalendarId(requireString(arg)))
}

export function resolveFullCalendar(rawCalendarId: string): InternalCalendar {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendar
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendar
  }

  return intlCalendarProvider(lowerRawCalendarId)
}

export function resolveFullCalendarId(rawCalendarId: string): string {
  return getInternalCalendarId(resolveFullCalendar(rawCalendarId))
}
