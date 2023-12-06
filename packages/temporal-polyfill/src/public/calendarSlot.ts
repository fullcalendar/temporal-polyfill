import { isoCalendarId } from '../internal/calendarConfig'
import { calendarProtocolMethodNames } from '../internal/calendarFields'
import { isObjectlike } from '../internal/utils'
import { refineCalendarSlotString } from '../internal/calendarSlotString'

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


// bag ... OLD!!!
// --------------

export function getBagCalendarSlot(bag: any): CalendarSlot { // defaults to ISO
  return extractBagCalendarSlot(bag) || isoCalendarId
}

export function extractBagCalendarSlot(bag: any): CalendarSlot | undefined {
  const slots = getSlots(bag)
  const { calendar } = (slots || {}) as { calendar?: CalendarSlot }

  if (calendar) {
    return calendar
  }

  const bagCalendar = bag.calendar
  if (bagCalendar !== undefined) {
    return refineCalendarSlot(bagCalendar)
  }
}
