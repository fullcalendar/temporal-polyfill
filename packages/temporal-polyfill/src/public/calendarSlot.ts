import { isoCalendarId } from '../internal/calendarConfig'
import { isObjectlike } from '../internal/utils'
import { refineCalendarSlotString } from '../genericApi/calendarSlot'
import { calendarProtocolMethodNames } from '../genericApi/refineConfig'

// public
import { getSlots } from './slots'
import { CalendarArg, CalendarProtocol } from './calendar'
import { createProtocolChecker } from './publicUtils'

export type CalendarSlot = CalendarProtocol | string

const checkCalendarProtocol = createProtocolChecker(calendarProtocolMethodNames)

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
