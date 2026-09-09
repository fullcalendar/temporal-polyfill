import type { Temporal } from 'temporal-spec'
import { type CalendarImpl } from '../internal/calendarImpl'
import { toIntegerWithTrunc } from '../internal/cast'
import { CalendarDateFields } from '../internal/fieldTypes'
import {
  moveToRefinedDayOfMonth,
  moveToRefinedDayOfWeek,
  moveToRefinedDayOfYear,
  moveToRefinedWeekOfYear,
} from '../internal/moveOrdinal'
import { refineOverflowOptions } from '../options/fieldRefine'

// Public-argument wrappers over internal/moveOrdinal.ts. Public option
// coercion must happen before the ordinal's numeric conversion.
export function moveToDayOfYear(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  return moveToRefinedDayOfYear(
    calendar,
    isoDate,
    toIntegerWithTrunc(dayOfYear),
    overflow,
  )
}

export function moveToDayOfMonth(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  day: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  return moveToRefinedDayOfMonth(
    calendar,
    isoDate,
    toIntegerWithTrunc(day),
    overflow,
  )
}

// The calendar is unused (day-of-week is ISO) but kept so all four position
// movers share one signature for the func API's zoned transform adapter.
export function moveToDayOfWeek(
  _calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  return moveToRefinedDayOfWeek(
    isoDate,
    toIntegerWithTrunc(dayOfWeek),
    overflow,
  )
}

export function moveToWeekOfYear(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  return moveToRefinedWeekOfYear(
    calendar,
    isoDate,
    toIntegerWithTrunc(weekOfYear),
    overflow,
  )
}
