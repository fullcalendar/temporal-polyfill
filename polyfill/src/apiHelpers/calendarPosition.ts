import type { Temporal } from 'temporal-spec'
import { type CalendarImpl } from '../internal/calendarImpl'
import {
  computeDayOfMonthMove,
  computeDayOfWeekMove,
  computeDayOfYearMove,
  computeWeekOfYearMove,
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
  return computeDayOfYearMove(
    calendar,
    isoDate,
    toIntegerWithTrunc(dayOfYear, 'dayOfMonth'),
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
  return computeDayOfMonthMove(
    calendar,
    isoDate,
    toIntegerWithTrunc(day, 'day'),
    overflow,
  )
}

// Keep public option coercion before the position's numeric conversion.
export function moveToDayOfWeek(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  return computeDayOfWeekMove(
    calendar,
    isoDate,
    toIntegerWithTrunc(dayOfWeek, 'dayOfWeek'),
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
  return computeWeekOfYearMove(
    calendar,
    isoDate,
    toIntegerWithTrunc(weekOfYear, 'weekOfYear'),
    overflow,
  )
}
