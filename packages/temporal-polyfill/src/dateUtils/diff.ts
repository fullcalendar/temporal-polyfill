import { getCommonCalendar } from '../argParse/calendar'
import { DiffConfig, parseDiffOptions } from '../argParse/diffOptions'
import { OVERFLOW_CONSTRAIN } from '../argParse/overflowHandling'
import { unitNames } from '../argParse/unitStr'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { Duration } from '../public/duration'
import { Instant } from '../public/instant'
import { PlainDate, createDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import { PlainTime } from '../public/plainTime'
import {
  CompareResult, DateUnit, DiffOptions,
  TimeDiffOptions,
  TimeUnit,
  Unit,
} from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'
import { compareValues } from '../utils/math'
import { addWholeMonths, addWholeYears } from './add'
import { compareDateFields } from './compare'
import { constrainDateFields } from './constrain'
import { addDurations, nanoToDuration } from './duration'
import { diffDaysMilli, timeFieldsToNano, toNano } from './isoMath'
import { roundBalancedDuration, roundNano } from './rounding'
import { DateEssentials } from './types-private'
import {
  DAY,
  HOUR,
  MONTH,
  NANOSECOND,
  SECOND,
  TimeUnitInt,
  UnitInt,
  WEEK,
  YEAR,
  isDateUnit,
} from './units'

export function diffPlainTimes(
  t0: PlainTime,
  t1: PlainTime,
  options: TimeDiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions<TimeUnit, TimeUnitInt>(
    options,
    HOUR, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    HOUR, // maxUnit
  )
  return nanoToDuration(
    roundNano(timeFieldsToNano(t1) - timeFieldsToNano(t0), diffConfig),
    diffConfig.largestUnit,
  )
}

export function diffDateTimes(
  dt0: PlainDateTime,
  dt1: PlainDateTime,
  options: DiffOptions | undefined,
  flip?: boolean,
): Duration {
  const diffConfig = parseDiffOptions<Unit, UnitInt>(
    options,
    DAY, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    YEAR, // maxUnit
  )

  return roundBalancedDuration(
    diffAccurate(dt0, dt1, diffConfig.largestUnit),
    diffConfig,
    dt0,
    dt1,
    flip,
  )
}

export function diffDates(
  d0: PlainDate,
  d1: PlainDate,
  diffConfig: DiffConfig,
  flip?: boolean,
): Duration {
  const calendar = getCommonCalendar(d0, d1)
  const balancedDuration = calendar.dateUntil(d0, d1, {
    largestUnit: unitNames[diffConfig.largestUnit] as DateUnit,
  })
  return roundBalancedDuration(balancedDuration, diffConfig, d0, d1, flip)
}

export function diffDateFields(
  d0: DateEssentials,
  d1: DateEssentials,
  calendarImpl: CalendarImpl,
  largestUnit: UnitInt,
): Duration {
  let years = 0; let months = 0; let weeks = 0; let days = 0

  switch (largestUnit) {
    case YEAR:
      years = wholeYearsUntil(d0, d1, calendarImpl)
      d0 = addWholeYears(d0, years, calendarImpl, OVERFLOW_CONSTRAIN)
      // fallthrough
    case MONTH:
      months = wholeMonthsUntil(d0, d1, calendarImpl)
      d0 = addWholeMonths(d0, months, calendarImpl, OVERFLOW_CONSTRAIN)
  }

  days = diffDaysMilli(
    calendarImpl.epochMilliseconds(d0.year, d0.month, d0.day),
    calendarImpl.epochMilliseconds(d1.year, d1.month, d1.day),
  )

  if (largestUnit === WEEK) {
    weeks = Math.trunc(days / 7)
    days %= 7
  }

  return new Duration(years, months, weeks, days)
}

function wholeYearsUntil(
  d0: DateEssentials,
  d1: DateEssentials,
  calendarImpl: CalendarImpl,
): number {
  // simulate destination year
  const [, newMonth, newDay] = constrainDateFields(
    d1.year,
    d0.month,
    d0.day,
    calendarImpl,
    OVERFLOW_CONSTRAIN,
  )

  const generalSign = compareDateFields(d1, d0)
  const monthSign = compareValues(d1.month, newMonth) || compareValues(d1.day, newDay)

  return d1.year - d0.year - (
    (monthSign && generalSign && monthSign !== generalSign)
      ? generalSign
      : 0
  )
}

function wholeMonthsUntil(
  d0: DateEssentials,
  d1: DateEssentials,
  calendarImpl: CalendarImpl,
): number {
  let monthsToAdd = 0
  const generalSign = compareDateFields(d1, d0)

  if (generalSign) {
    // move ahead by whole years
    let { year } = d0
    while (year !== d1.year) {
      monthsToAdd += calendarImpl.monthsInYear(year) * generalSign
      year += generalSign
    }

    // simulate destination year (same as wholeYearsUntil... optimization opportunity?)
    const [, newMonth, newDay] = constrainDateFields(
      d1.year,
      d0.month,
      d0.day,
      calendarImpl,
      OVERFLOW_CONSTRAIN,
    )

    // add remaining months (or subtract overshot months)
    monthsToAdd += d1.month - newMonth

    // correct when we overshoot the day-of-month
    const daySign = compareValues(d1.day, newDay)
    if (daySign && generalSign && daySign !== generalSign) {
      monthsToAdd -= generalSign
    }
  }

  return monthsToAdd
}

export function diffInstants(a: Instant, b: Instant, options?: TimeDiffOptions): Duration {
  const diffConfig = parseDiffOptions(options, SECOND, NANOSECOND, NANOSECOND, HOUR, true)

  return nanoToDuration(
    roundNano(
      b.epochNanoseconds - a.epochNanoseconds,
      diffConfig,
    ),
    diffConfig.largestUnit,
  )
}

export function diffZonedDateTimes(
  dt0: ZonedDateTime,
  dt1: ZonedDateTime,
  options: DiffOptions | undefined,
  flip?: boolean,
): Duration {
  const diffConfig = parseDiffOptions<Unit, UnitInt>(
    options,
    HOUR, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    YEAR, // maxUnit
  )
  const { largestUnit } = diffConfig

  if (largestUnit >= DAY && dt0.timeZone.id !== dt1.timeZone.id) {
    throw new Error('Must be same timeZone')
  }

  return roundBalancedDuration(
    diffAccurate(dt0, dt1, largestUnit),
    diffConfig,
    dt0,
    dt1,
    flip,
  )
}

export function diffAccurate<T extends (ZonedDateTime | PlainDateTime)>(
  dt0: T,
  dt1: T,
  largestUnit: UnitInt,
): Duration {
  const calendar = getCommonCalendar(dt0, dt1)

  // a time unit
  if (!isDateUnit(largestUnit)) {
    return diffTimeScale(dt0, dt1, largestUnit)
  }

  const dateStart = createDate(dt0.getISOFields()) // TODO: util for this?
  let dateMiddle = createDate(dt1.getISOFields()) // TODO: util for this?
  let dateTimeMiddle: T
  let bigDuration: Duration
  let timeDuration: Duration
  let bigSign: CompareResult
  let timeSign: CompareResult

  do {
    bigDuration = calendar.dateUntil(
      dateStart,
      dateMiddle,
      { largestUnit: unitNames[largestUnit] as DateUnit },
    )
    dateTimeMiddle = dt0.add(bigDuration) as T
    timeDuration = diffTimeScale(dateTimeMiddle, dt1, HOUR)
    bigSign = bigDuration.sign
    timeSign = timeDuration.sign
  } while (
    bigSign && timeSign &&
    bigSign !== timeSign &&
    (dateMiddle = dateMiddle.add({ days: timeSign })) // move dateMiddle closer to dt0
  )

  return addDurations(bigDuration, timeDuration)
}

function diffTimeScale<T extends (ZonedDateTime | PlainDateTime)>(
  dt0: T,
  dt1: T,
  largestUnit: TimeUnitInt,
): Duration {
  return nanoToDuration(toNano(dt1) - toNano(dt0), largestUnit)
}
