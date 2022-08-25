import { Temporal } from 'temporal-spec'
import { DiffConfig } from '../argParse/diffOptions'
import { OVERFLOW_CONSTRAIN } from '../argParse/overflowHandling'
import { unitNames } from '../argParse/unitStr'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { createDate } from '../public/plainDate'
import { LargeInt, createLargeInt } from '../utils/largeInt'
import { compareValues, roundToIncrement, roundToIncrementBI } from '../utils/math'
import { compareLocalDateFields } from './compare'
import { constrainDateFields } from './constrain'
import { isoTimeToNano, nanoToDuration } from './dayAndTime'
import { DurationFields, mergeDurations, signDuration } from './durationFields'
import { EpochableObj, diffDaysMilli, toEpochNano } from './epoch'
import { ISOTimeFields } from './isoFields'
import { LocalDateFields } from './localFields'
import { roundDurationSpan } from './roundingDuration'
import { addMonths, addYears } from './translate'
import {
  HOUR,
  MONTH,
  TimeUnitInt,
  UnitInt,
  WEEK,
  YEAR,
  isDateUnit,
  nanoIn,
} from './units'

export type DiffableObj = LocalDateFields & EpochableObj & {
  add(durationFields: Partial<DurationFields>): DiffableObj
}

// used for zoned date times as well
export function diffDateTimes(
  dt0: DiffableObj,
  dt1: DiffableObj,
  calendar: Temporal.CalendarProtocol,
  flip: boolean,
  diffConfig: DiffConfig,
): DurationFields {
  return roundDurationSpan(
    diffAccurate(dt0, dt1, calendar, diffConfig.largestUnit),
    dt0,
    dt1,
    calendar,
    flip,
    diffConfig,
  )
}

export function diffDates(
  d0: DiffableObj,
  d1: DiffableObj,
  calendar: Temporal.CalendarProtocol,
  flip: boolean,
  diffConfig: DiffConfig,
): DurationFields {
  const balancedDuration = calendar.dateUntil(d0, d1, {
    largestUnit: unitNames[diffConfig.largestUnit] as Temporal.DateUnit,
  })
  return roundDurationSpan(balancedDuration, d0, d1, calendar, flip, diffConfig)
}

export function diffTimes(
  t0: ISOTimeFields,
  t1: ISOTimeFields,
  diffConfig: DiffConfig<TimeUnitInt>,
): DurationFields {
  const roundedDiff = roundToIncrement(
    isoTimeToNano(t1) - isoTimeToNano(t0),
    nanoIn[diffConfig.smallestUnit] * diffConfig.roundingIncrement,
    diffConfig.roundingFunc,
  )
  return nanoToDuration(createLargeInt(roundedDiff), diffConfig.largestUnit)
}

export function diffEpochNanos(
  epochNano0: LargeInt,
  epochNano1: LargeInt,
  diffConfig: DiffConfig<TimeUnitInt>,
): DurationFields {
  const roundedDiff = roundToIncrementBI(
    epochNano1.sub(epochNano0),
    nanoIn[diffConfig.smallestUnit] * diffConfig.roundingIncrement,
    diffConfig.roundingFunc,
  )
  return nanoToDuration(roundedDiff, diffConfig.largestUnit)
}

// Utils
// -------------------------------------------------------------------------------------------------

export function diffDateFields(
  d0: LocalDateFields,
  d1: LocalDateFields,
  calendarImpl: CalendarImpl,
  largestUnit: UnitInt,
): DurationFields {
  let years = 0; let months = 0; let weeks = 0; let days = 0

  switch (largestUnit) {
    case YEAR:
      years = wholeYearsUntil(d0, d1, calendarImpl)
      d0 = addYears(d0, years, calendarImpl, OVERFLOW_CONSTRAIN)
      // fallthrough
    case MONTH:
      months = wholeMonthsUntil(d0, d1, calendarImpl)
      d0 = addMonths(d0, months, calendarImpl, OVERFLOW_CONSTRAIN)
  }

  days = diffDaysMilli(
    calendarImpl.epochMilliseconds(d0.year, d0.month, d0.day),
    calendarImpl.epochMilliseconds(d1.year, d1.month, d1.day),
  )

  if (largestUnit === WEEK) {
    weeks = Math.trunc(days / 7)
    days %= 7
  }

  return signDuration({
    years,
    months,
    weeks,
    days,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    microseconds: 0,
    nanoseconds: 0,
  })
}

function wholeYearsUntil(
  d0: LocalDateFields,
  d1: LocalDateFields,
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

  const generalSign = compareLocalDateFields(d1, d0)
  const monthSign = compareValues(d1.month, newMonth) || compareValues(d1.day, newDay)

  return d1.year - d0.year - (
    (monthSign && generalSign && monthSign !== generalSign)
      ? generalSign
      : 0
  )
}

function wholeMonthsUntil(
  d0: LocalDateFields,
  d1: LocalDateFields,
  calendarImpl: CalendarImpl,
): number {
  let monthsToAdd = 0
  const generalSign = compareLocalDateFields(d1, d0)

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

export function diffAccurate(
  dt0: DiffableObj,
  dt1: DiffableObj,
  calendar: Temporal.CalendarProtocol,
  largestUnit: UnitInt,
): DurationFields {
  // a time unit
  if (!isDateUnit(largestUnit)) {
    return diffTimeScale(dt0, dt1, largestUnit)
  }

  const dateStart = createDate({ ...dt0.getISOFields(), calendar })
  let dateMiddle = createDate({ ...dt1.getISOFields(), calendar })
  let dateTimeMiddle: DiffableObj
  let bigDuration: DurationFields
  let timeDuration: DurationFields
  let bigSign: Temporal.ComparisonResult
  let timeSign: Temporal.ComparisonResult

  do {
    bigDuration = calendar.dateUntil(
      dateStart,
      dateMiddle,
      { largestUnit: unitNames[largestUnit] as Temporal.DateUnit },
    )
    dateTimeMiddle = dt0.add(bigDuration)
    timeDuration = diffTimeScale(dateTimeMiddle, dt1, HOUR)
    bigSign = bigDuration.sign
    timeSign = timeDuration.sign
  } while (
    // did we overshoot? keep backing up a day
    bigSign && timeSign &&
    bigSign !== timeSign &&
    (dateMiddle = dateMiddle.add({ days: timeSign })) // move dateMiddle closer to dt0
  )

  return mergeDurations(bigDuration, timeDuration)
}

function diffTimeScale(
  dt0: EpochableObj,
  dt1: EpochableObj,
  largestUnit: TimeUnitInt,
): DurationFields {
  return nanoToDuration(toEpochNano(dt1).sub(toEpochNano(dt0)), largestUnit)
}
