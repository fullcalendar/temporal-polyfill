import { Calendar } from '../calendar'
import { UNIT_INCREMENT } from './convert'
import { PlainDate } from '../plainDate'

const firstWeekOffset = (
  year: number,
  calendar: Calendar,
  firstDay: number,
  minimalDays: number
): number => {
  // Which january is always in the first week (4 for iso, 1 for other)
  const firstWeekDay = UNIT_INCREMENT.WEEK + firstDay - minimalDays

  // Which local weekday is first week day
  const localWeek =
    (UNIT_INCREMENT.WEEK +
      calendar.dayOfWeek(new PlainDate(year, 1, firstWeekDay)) -
      firstDay) %
    UNIT_INCREMENT.WEEK

  return -localWeek + firstWeekDay - 1
}

export const weeksInYear = (
  year: number,
  calendar: Calendar,
  firstDay: number,
  minimalDays: number
): number => {
  const weekOffset = firstWeekOffset(year, calendar, firstDay, minimalDays)
  const weekOffsetNext = firstWeekOffset(
    year + 1,
    calendar,
    firstDay,
    minimalDays
  )
  return (
    (calendar.daysInYear(new PlainDate(year, 1, 1)) -
      weekOffset +
      weekOffsetNext) /
    UNIT_INCREMENT.WEEK
  )
}

export const weekOfYear = (
  dt: PlainDate,
  calendar: Calendar,
  firstDay: number,
  minimalDays: number
): number => {
  // Days to ignore till first week
  const weekOffset = firstWeekOffset(
    dt.isoYear,
    calendar,
    firstDay,
    minimalDays
  )
  // Current week #
  const week =
    Math.floor(
      (calendar.dayOfYear(dt) - weekOffset - 1) / UNIT_INCREMENT.WEEK
    ) + 1

  // Go to previous year if 0 weeks
  if (week < 1) {
    return week + weeksInYear(dt.isoYear - 1, calendar, firstDay, minimalDays)
  }

  const weeksYear = weeksInYear(dt.isoYear, calendar, firstDay, minimalDays)

  // Go to next year if greater than weeks in current year
  if (week > weeksYear) {
    return week - weeksYear
  }

  return week
}
