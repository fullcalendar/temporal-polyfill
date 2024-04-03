import {
  startOfHour,
  startOfMicrosecond,
  startOfMillisecond,
  startOfMinute,
  startOfMonth,
  startOfSecond,
  startOfWeek,
  startOfYear,
} from './startOf'
import { DateObj, DateTimeObj, YearMonthObj } from './utils'

const nanoInMicro = 1000
const nanoInMilli = 1000000
const nanoInSec = 1000000000
const nanoInMinute = 60000000000
const nanoInHour = 3600000000000

export function endOfYear<T extends YearMonthObj>(date: T): T {
  return startOfYear(date)
    .add({ years: 1 })
    .subtract(
      (date as DateTimeObj).nanosecond !== undefined
        ? { nanoseconds: 1 }
        : { days: 1 },
    ) as T
}

export function endOfMonth<T extends DateObj>(date: T): T {
  return startOfMonth(date)
    .add({ months: 1 })
    .subtract(
      (date as DateTimeObj).nanosecond !== undefined
        ? { nanoseconds: 1 }
        : { days: 1 },
    ) as T
}

export function endOfWeek<T extends DateObj>(date: T): T {
  return startOfWeek(date)
    .add({ weeks: 1 })
    .subtract(
      (date as DateTimeObj).nanosecond !== undefined
        ? { nanoseconds: 1 }
        : { days: 1 },
    ) as T
}

export function endOfDay<T extends DateTimeObj>(date: T): T {
  if (date.withPlainTime) {
    return date
      .withPlainTime()
      .add({ days: 1 })
      .subtract({ nanoseconds: 1 }) as T
  }
  return date // in case PlainDate passed in, not moved to next day
}

export function endOfHour<T extends DateTimeObj>(date: T): T {
  return startOfHour(date).add({ nanoseconds: nanoInHour - 1 }) as T
}

export function endOfMinute<T extends DateTimeObj>(date: T): T {
  return startOfMinute(date).add({ nanoseconds: nanoInMinute - 1 }) as T
}

export function endOfSecond<T extends DateTimeObj>(date: T): T {
  return startOfSecond(date).add({ nanoseconds: nanoInSec - 1 }) as T
}

export function endOfMillisecond<T extends DateTimeObj>(date: T): T {
  return startOfMillisecond(date).add({ nanoseconds: nanoInMilli - 1 }) as T
}

export function endOfMicrosecond<T extends DateTimeObj>(date: T): T {
  return startOfMicrosecond(date).add({ nanoseconds: nanoInMicro - 1 }) as T
}
