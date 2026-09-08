import type { Temporal } from 'temporal-spec'
import { type CalendarImpl } from '../internal/calendarImpl'
import { toStrictInteger } from '../internal/cast'
import { CalendarDateFields } from '../internal/fieldTypes'
import { addDateMonths, moveByDays } from '../internal/move'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'

export function reversedMove<S>(
  f: (slots: S, units: number, options?: Temporal.OverflowOptions) => S,
): (slots: S, units: number, options?: Temporal.OverflowOptions) => S {
  return (slots, units, options?: Temporal.OverflowOptions) => {
    return f(slots, -units, options)
  }
}

// Move-by-Unit
// -----------------------------------------------------------------------------
// These functions validate input
// Month/year movement is calendar-aware. ISO day/week movement is not, so those
// helpers deliberately return plain ISO date fields and let callers reattach
// their calendar only when building record/slot outputs.

export function moveByYears(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  years: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return isoDate
  }
  return addDateMonths(calendar, isoDate, toStrictInteger(years), 0, overflow)
}

export function moveByMonths(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  months: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  if (!months) {
    return isoDate
  }
  return addDateMonths(calendar, isoDate, 0, toStrictInteger(months), overflow)
}

export function moveByIsoWeeks(
  _calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  weeks: number,
): CalendarDateFields {
  return moveByDays(isoDate, toStrictInteger(weeks) * 7)
}

export function moveByDaysStrict(
  _calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  days: number,
): CalendarDateFields {
  return moveByDays(isoDate, toStrictInteger(days))
}
