import type { Temporal } from 'temporal-spec'
import { type CalendarImpl } from '../internal/calendarImpl'
import {
  moveToRefinedDayOfMonth,
  moveToRefinedDayOfWeek,
  moveToRefinedDayOfYear,
  moveToRefinedWeekOfYear,
} from '../internal/calendarPosition'
import { toIntegerWithTrunc } from '../internal/cast'
import { CalendarDateFields } from '../internal/fieldTypes'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'

// Keep public option coercion before the position's numeric conversion.
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

// Keep public option coercion before the position's numeric conversion.
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

// Keep public option coercion before the position's numeric conversion.
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

// Keep public option coercion before the position's numeric conversion.
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
