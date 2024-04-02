import {
  DateObj,
  requireNumberInRange,
  toInteger,
  toPositiveInteger,
} from './utils'

export function withDayOfYear<T extends DateObj>(
  date: T,
  dayOfYear: number,
): T {
  const normDayOfYear = requireNumberInRange(
    toInteger(dayOfYear),
    1,
    date.daysInYear,
  )
  return date.add({
    days: normDayOfYear - date.dayOfYear,
  }) as T
}

export function withDayOfWeek<T extends DateObj>(
  date: T,
  dayOfWeek: number,
): T {
  const normDayOfWeek = requireNumberInRange(
    toInteger(dayOfWeek),
    1,
    date.daysInWeek,
  )
  return date.add({
    days: normDayOfWeek - date.dayOfWeek,
  }) as T
}

/*
NOTE: does not check if beyond max number of weeks. allows overflow
*/
export function withWeekOfYear<T extends DateObj>(
  date: T,
  weekOfYear: number,
): T {
  const currentWeekOfYear = date.weekOfYear
  if (currentWeekOfYear === undefined) {
    throw new RangeError('Week numbers not supported')
  }
  return date.add({
    weeks: toPositiveInteger(weekOfYear) - currentWeekOfYear,
  }) as T
}
