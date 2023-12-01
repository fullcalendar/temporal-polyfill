import { isoCalendarId } from './calendarConfig'
import { ensureString } from './cast'
import { parseCalendarId } from './isoParse'

export function refineCalendarSlotString(calendarArg: string): string {
  return parseCalendarId(ensureString(calendarArg)) // ensures its real calendar via queryCalendarImpl
}

// bag
// ---
// TODO: consolidate with getCalendarSlotFromBag/extractCalendarSlotFromBag

export function getCalendarIdFromBag(bag: { calendar?: string }): string {
  return extractCalendarIdFromBag(bag) || isoCalendarId
}

export function extractCalendarIdFromBag(bag: { calendar?: string }): string | undefined {
  const { calendar } = bag
  if (calendar !== undefined) {
    return refineCalendarSlotString(calendar)
  }
}
