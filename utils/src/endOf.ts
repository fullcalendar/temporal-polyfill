import {
  startOfHour,
  startOfMicrosecond,
  startOfMillisecond,
  startOfMinute,
  startOfSecond,
} from './startOf.js'
import {
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
} from './utils.js'

export function endOfYear<
  T extends
    | Temporal.PlainYearMonth
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  if ((date as Temporal.PlainDate).day === undefined) {
    return date.with({ month: date.monthsInYear }) as T
  }
  return endOfDateUnit(date, (d) =>
    moveToLastDayOfMonth(d.with({ month: d.monthsInYear })),
  )
}

export function endOfMonth<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return endOfDateUnit(date, moveToLastDayOfMonth)
}

export function endOfWeek<
  T extends
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return endOfDateUnit(date, (d) => d.add({ days: d.daysInWeek - d.dayOfWeek }))
}

export function endOfDay<
  T extends Temporal.PlainDateTime | Temporal.ZonedDateTime,
>(date: T): T {
  return endOfDateUnit(date, (d) => d)
}

function moveToLastDayOfMonth(date: any): any {
  return date.with({ day: date.daysInMonth })
}

// Moves to the last day of a period, then to the end of that day. This never computes the
// start of the period, which might be out of range when its end isn't.
function endOfDateUnit<T>(date: T, moveToLastDay: (date: any) => any): T {
  const zoned = date as Temporal.ZonedDateTime
  if (zoned.timeZoneId) {
    // A zoned day is measured with plain dates, because it might not start at midnight,
    // or exist at all. Its end is just before the first instant of the next day.
    return moveToLastDay(zoned.toPlainDate())
      .add({ days: 1 })
      .toZonedDateTime(zoned.timeZoneId)
      .subtract({ nanoseconds: 1 })
  }
  const lastDay = moveToLastDay(date)
  return lastDay.withPlainTime // a PlainDate has no time to move
    ? lastDay.with({
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999,
        microsecond: 999,
        nanosecond: 999,
      })
    : lastDay
}

export function endOfHour<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return endOfTimeUnit(date, startOfHour, nanoInHour, {
    minute: 59,
    second: 59,
    millisecond: 999,
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfMinute<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return endOfTimeUnit(date, startOfMinute, nanoInMinute, {
    second: 59,
    millisecond: 999,
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfSecond<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return endOfTimeUnit(date, startOfSecond, nanoInSec, {
    millisecond: 999,
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfMillisecond<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return endOfTimeUnit(date, startOfMillisecond, nanoInMilli, {
    microsecond: 999,
    nanosecond: 999,
  })
}

export function endOfMicrosecond<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(date: T): T {
  return endOfTimeUnit(date, startOfMicrosecond, nanoInMicro, {
    nanosecond: 999,
  })
}

// A zoned unit is exact time from its start, even across an offset change. A plain one
// sets its fields directly, because its start might be before the earliest PlainDateTime.
function endOfTimeUnit<
  T extends
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime,
>(
  date: T,
  startOfUnit: (date: T) => T,
  nanoInUnit: number,
  lastFields: Temporal.PlainTimeLike,
): T {
  return (
    (date as Temporal.ZonedDateTime).timeZoneId
      ? startOfUnit(date).add({ nanoseconds: nanoInUnit - 1 })
      : date.with(lastFields as any)
  ) as T
}
