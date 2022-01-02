import { parseDiffOptions } from '../argParse/diffOptions'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { Calendar } from '../public/calendar'
import { Duration } from '../public/duration'
import { PlainDateTime } from '../public/plainDateTime'
import {
  CompareResult,
  DateTimeISOFields,
  DateTimeLikeFields,
  DateTimeOverrides,
  DateTimeRoundingOptions,
  DayTimeUnit,
  DiffOptions,
  OverflowOptions,
  Unit,
} from '../public/types'
import { RoundingFunc, compareValues } from '../utils/math'
import {
  DateFields,
  DateISOEssentials,
  constrainDateISO,
  createDate,
  overrideDateFields,
} from './date'
import {
  durationToTimeFields,
  extractBigDuration,
} from './duration'
import { epochNanoToISOFields, isoFieldsToEpochNano } from './isoMath'
import {
  combineISOWithDayTimeFields,
  computeRoundingNanoIncrement,
  roundBalancedDuration,
  roundTime,
} from './rounding'
import {
  TimeFields,
  TimeISOEssentials,
  TimeISOMilli,
  constrainTimeISO,
  overrideTimeFields,
  timeFieldsToConstrainedISO,
  timeFieldsToNano,
} from './time'
import { DAY, DayTimeUnitInt, NANOSECOND, UnitInt, YEAR } from './units'
import { diffAccurate } from './zonedDateTime'

export type DateTimeISOMilli = DateISOEssentials & TimeISOMilli
export type DateTimeISOEssentials = DateISOEssentials & TimeISOEssentials
export type DateTimeFields = DateFields & TimeFields

export function createDateTime(isoFields: DateTimeISOFields): PlainDateTime {
  return new PlainDateTime(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoFields.isoHour,
    isoFields.isoMinute,
    isoFields.isoSecond,
    isoFields.isoMillisecond,
    isoFields.isoMicrosecond,
    isoFields.isoNanosecond,
    isoFields.calendar,
  )
}

export function dateTimeFieldsToISO(
  fields: DateTimeLikeFields,
  options: OverflowOptions | undefined,
  overflowHandling: OverflowHandlingInt,
  calendar: Calendar,
): DateTimeISOFields {
  return {
    ...calendar.dateFromFields(fields, options).getISOFields(),
    ...timeFieldsToConstrainedISO(fields, overflowHandling),
  }
}

export function overrideDateTimeFields(
  overrides: DateTimeOverrides,
  base: DateTimeFields,
): DateTimeLikeFields {
  return {
    ...overrideDateFields(overrides, base),
    ...overrideTimeFields(overrides, base),
  }
}

export function constrainDateTimeISO( // also ensures numbers
  isoFields: DateTimeISOEssentials,
  overflow: OverflowHandlingInt,
): DateTimeISOEssentials {
  return {
    ...constrainDateISO(isoFields, overflow),
    ...constrainTimeISO(isoFields, overflow),
  }
}

export function compareDateTimes(a: PlainDateTime, b: PlainDateTime): CompareResult {
  return compareValues(
    isoFieldsToEpochNano(a.getISOFields()),
    isoFieldsToEpochNano(b.getISOFields()),
  ) || compareValues(a.calendar.id, b.calendar.id)
}

export function addToDateTime( // why not in add.ts?
  dateTime: PlainDateTime,
  duration: Duration,
  options: OverflowOptions | undefined, // Calendar needs raw options
): PlainDateTime {
  const { calendar } = dateTime
  const bigDuration = extractBigDuration(duration)
  const durationTimeFields = durationToTimeFields(duration)

  // add large fields first
  const date = calendar.dateAdd(
    createDate(dateTime.getISOFields()),
    bigDuration,
    options,
  )

  return createDateTime({
    ...epochNanoToISOFields(
      isoFieldsToEpochNano(date.getISOFields()) +
      timeFieldsToNano(dateTime) + // restore time-of-day
      timeFieldsToNano(durationTimeFields),
    ),
    calendar,
  })
}

export function diffDateTimes( // why not in diff.ts?
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

export function roundDateTimeWithOptions(
  dateTime: PlainDateTime,
  options: DateTimeRoundingOptions,
): PlainDateTime {
  const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
    options,
    undefined, // no default. required
    NANOSECOND, // minUnit
    DAY, // maxUnit
  )
  return roundDateTime(
    dateTime,
    computeRoundingNanoIncrement(roundingConfig),
    roundingConfig.roundingMode,
  )
}

export function roundDateTime(
  dateTime: PlainDateTime,
  nanoIncrement: number,
  roundingFunc: RoundingFunc,
): PlainDateTime {
  const dayTimeFields = roundTime(dateTime, nanoIncrement, roundingFunc)
  return createDateTime(
    combineISOWithDayTimeFields(dateTime.getISOFields(), dayTimeFields),
  )
}
