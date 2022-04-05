import { isoCalendarImpl } from '../calendarImpl/isoCalendarImpl'
import { positiveModulo } from '../utils/math'
import { computeDayOfYear, computeDaysInYear } from './calendar'
import { computeISODayOfWeek } from './epoch'

// TODO: fix lots of 1-index problems!!!

export function computeWeekOfISOYear(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  firstDay: number,
  minimalDays: number,
): number {
  // Days to ignore till first week
  const weekOffset = computeFirstWeekOffset(
    isoYear,
    firstDay,
    minimalDays,
  )
  // Current week #
  const week =
    Math.floor(
      (computeDayOfYear(isoCalendarImpl, isoYear, isoMonth, isoDay) - weekOffset - 1) / 7,
    ) + 1

  // Go to previous year if 0 weeks
  if (week < 1) {
    return week + computeWeeksInISOYear(isoYear - 1, firstDay, minimalDays)
  }

  const weeksYear = computeWeeksInISOYear(isoYear, firstDay, minimalDays)

  // Go to next year if greater than weeks in current year
  if (week > weeksYear) {
    return week - weeksYear
  }

  return week
}

function computeFirstWeekOffset(
  isoYear: number,
  firstDay: number,
  minimalDays: number,
): number {
  // Which january is always in the first week (4 for iso, 1 for other)
  const firstWeekDay = 7 + firstDay - minimalDays

  // Which local weekday is first week day
  const localWeek = positiveModulo(
    computeISODayOfWeek(isoYear, 1, firstWeekDay) - firstDay,
    7,
  )

  return -localWeek + firstWeekDay - 1
}

function computeWeeksInISOYear(
  isoYear: number,
  firstDay: number,
  minimalDays: number,
): number {
  const weekOffset = computeFirstWeekOffset(isoYear, firstDay, minimalDays)
  const weekOffsetNext = computeFirstWeekOffset(
    isoYear + 1,
    firstDay,
    minimalDays,
  )
  return (
    (computeDaysInYear(isoCalendarImpl, isoYear) -
      weekOffset +
      weekOffsetNext) /
    7
  )
}
