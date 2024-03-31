import { DateObj } from './utils'

export function withDayOfYear<T extends DateObj>(
  date: T,
  dayOfYear: number,
): T {
  return date.add({
    days: dayOfYear - date.dayOfYear,
  }) as T
}

export function withDayOfWeek<T extends DateObj>(
  date: T,
  dayOfWeek: number,
): T {
  return date.add({
    days: dayOfWeek - date.dayOfWeek,
  }) as T
}

export function withWeekOfYear<T extends DateObj>(
  date: T,
  weekOfYear: number,
): T {
  const currentWeekOfYear = date.weekOfYear
  if (currentWeekOfYear === undefined) {
    throw new RangeError('Week numbers not supported')
  }
  return date.add({
    weeks: weekOfYear - currentWeekOfYear,
  }) as T
}
