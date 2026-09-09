import type { Temporal } from 'temporal-spec'
import { type CalendarImpl } from '../internal/calendarImpl'
import { toStrictInteger } from '../internal/cast'
import { CalendarDateFields } from '../internal/fieldTypes'
import { moveDateByCalendarUnits } from '../internal/move'
import { refineOverflowOptions } from '../options/fieldRefine'

export function reversedMove<S>(
  f: (slots: S, units: number, options?: Temporal.OverflowOptions) => S,
): (slots: S, units: number, options?: Temporal.OverflowOptions) => S {
  return (slots, units, options?: Temporal.OverflowOptions) => {
    return f(slots, -units, options)
  }
}

// Move-by-Unit
// -----------------------------------------------------------------------------
// Public-argument wrappers over calendar-aware year/month movement: coerce the
// count and refine overflow options, then defer to the core. Week/day movement
// needs no calendar or options, so callers use moveDateByDays directly.

export function moveDateByYears(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  years: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return isoDate
  }
  return moveDateByCalendarUnits(
    calendar,
    isoDate,
    toStrictInteger(years),
    0,
    overflow,
  )
}

export function moveDateByMonths(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  months: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  if (!months) {
    return isoDate
  }
  return moveDateByCalendarUnits(
    calendar,
    isoDate,
    0,
    toStrictInteger(months),
    overflow,
  )
}
