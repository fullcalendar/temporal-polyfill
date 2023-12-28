import { isoCalendarId } from '../internal/calendarConfig'
import { isObjectlike } from '../internal/utils'
import { getSlots } from './slotsForClasses'
import { CalendarArg } from './calendar'
import { CalendarProtocol, checkCalendarProtocol } from './calendarProtocol'
import { refineCalendarSlotString } from '../internal/slots'

export type CalendarSlot = CalendarProtocol | string

export function refineCalendarSlot(calendarArg: CalendarArg): CalendarSlot {
  if (isObjectlike(calendarArg)) {
    // look at other date-like objects
    const { calendar } = (getSlots(calendarArg) || {}) as { calendar?: CalendarSlot }
    if (calendar) {
      return calendar
    }

    checkCalendarProtocol(calendarArg as CalendarProtocol)
    return calendarArg as CalendarProtocol
  }

  return refineCalendarSlotString(calendarArg)
}

// bag
// ---

export function getCalendarSlotFromBag(bag: { calendar?: CalendarArg }): CalendarSlot {
  return extractCalendarSlotFromBag(bag) || isoCalendarId
}

export function extractCalendarSlotFromBag(bag: { calendar?: CalendarArg }): CalendarSlot | undefined {
  const { calendar } = bag
  if (calendar !== undefined) {
    return refineCalendarSlot(calendar)
  }
}
