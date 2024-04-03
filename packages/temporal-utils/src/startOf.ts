import { DateObj, DateTimeObj, YearMonthObj } from './utils'
import { withDayOfWeek } from './with'

const zeroTimeFields = {
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0,
  microsecond: 0,
  nanosecond: 0,
}

export function startOfYear<T extends YearMonthObj>(date: T): T {
  return date.with({
    month: 1,
    day: 1,
    ...zeroTimeFields,
  }) as T
}

export function startOfMonth<T extends DateObj>(date: T): T {
  return date.with({
    day: 1,
    ...zeroTimeFields,
  }) as T
}

export function startOfWeek<T extends DateObj>(date: T): T {
  const movedDate = withDayOfWeek(date, 1)
  return (movedDate as DateTimeObj).withPlainTime
    ? ((movedDate as DateTimeObj).withPlainTime() as T)
    : movedDate
}

export function startOfDay<T extends DateTimeObj>(dateTime: T): T {
  if (dateTime.withPlainTime) {
    return dateTime.withPlainTime() as T
  }
  return dateTime // in case PlainDate passed in, no error
}

export function startOfHour<T extends DateTimeObj>(dateTime: T): T {
  return dateTime.with({
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  }) as T
}

export function startOfMinute<T extends DateTimeObj>(dateTime: T): T {
  return dateTime.with({
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  }) as T
}

export function startOfSecond<T extends DateTimeObj>(dateTime: T): T {
  return dateTime.with({
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  }) as T
}

export function startOfMillisecond<T extends DateTimeObj>(dateTime: T): T {
  return dateTime.with({
    microsecond: 0,
    nanosecond: 0,
  }) as T
}

export function startOfMicrosecond<T extends DateTimeObj>(dateTime: T): T {
  return dateTime.with({
    nanosecond: 0,
  }) as T
}
