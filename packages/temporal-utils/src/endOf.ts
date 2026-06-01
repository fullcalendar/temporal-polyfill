import {
  startOfHour,
  startOfMicrosecond,
  startOfMillisecond,
  startOfMinute,
  startOfMonth,
  startOfSecond,
  startOfWeek,
  startOfYear,
} from './startOf.js'
import {
  nanosecondsInHour,
  nanosecondsInMicrosecond,
  nanosecondsInMillisecond,
  nanosecondsInMinute,
  nanosecondsInSecond,
} from './utils.js'

export function endOfYear<
  T extends
    | Temporal.PlainYearMonth
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return startOfYear(date)
    .add({ years: 1 })
    .subtract(
      (
        date as
          | Temporal.PlainDate
          | Temporal.PlainDateTime
          | Temporal.ZonedDateTime
      ).day === undefined
        ? { months: 1 }
        : (date as Temporal.PlainDateTime | Temporal.ZonedDateTime)
              .nanosecond !== undefined
          ? { nanoseconds: 1 }
          : { days: 1 },
    ) as T
}

export function endOfMonth<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return startOfMonth(date)
    .add({ months: 1 })
    .subtract(
      (date as Temporal.PlainDateTime | Temporal.ZonedDateTime).nanosecond !==
        undefined
        ? { nanoseconds: 1 }
        : { days: 1 },
    ) as T
}

export function endOfWeek<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return startOfWeek(date)
    .add({ weeks: 1 })
    .subtract(
      (date as Temporal.PlainDateTime | Temporal.ZonedDateTime).nanosecond !==
        undefined
        ? { nanoseconds: 1 }
        : { days: 1 },
    ) as T
}

export function endOfDay<
  T extends Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T {
  if (date.withPlainTime) {
    return date
      .withPlainTime()
      .add({ days: 1 })
      .subtract({ nanoseconds: 1 }) as T
  }
  return date // in case PlainDate passed in, not moved to next day
}

export function endOfHour<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return startOfHour(date).add({ nanoseconds: nanosecondsInHour - 1 }) as T
}

export function endOfMinute<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return startOfMinute(date).add({ nanoseconds: nanosecondsInMinute - 1 }) as T
}

export function endOfSecond<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return startOfSecond(date).add({ nanoseconds: nanosecondsInSecond - 1 }) as T
}

export function endOfMillisecond<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return startOfMillisecond(date).add({
    nanoseconds: nanosecondsInMillisecond - 1,
  }) as T
}

export function endOfMicrosecond<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return startOfMicrosecond(date).add({
    nanoseconds: nanosecondsInMicrosecond - 1,
  }) as T
}
