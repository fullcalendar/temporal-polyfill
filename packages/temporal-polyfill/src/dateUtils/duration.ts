import { parseDiffOptions } from '../argParse/diffOptions'
import { OFFSET_PREFER, OFFSET_REJECT } from '../argParse/offsetHandling'
import { isObjectLike } from '../argParse/refine'
import { RoundingConfig } from '../argParse/roundingOptions'
import { durationUnitNames, unitNames } from '../argParse/unitStr'
import { Duration } from '../public/duration'
import { PlainDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import {
  CompareResult,
  DateTimeArg,
  DateUnit,
  DurationArg,
  DurationLike,
  DurationRoundingOptions,
  Unit,
  ZonedDateTimeArg,
  ZonedDateTimeLike,
  DateTimeLike,
} from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'
import { compareValues, numSign } from '../utils/math'
import { mapHash } from '../utils/obj'
import { ensureObj } from './abstract'
import { DateLikeInstance } from './calendar'
import { createDateTime } from './dateTime'
import { DayTimeFields, dayTimeFieldsToNano, nanoToDayTimeFields } from './dayTime'
import {
  parseDateTimeISO,
  refineDateTimeParse,
  refineZonedDateTimeParse,
  tryParseDateTimeISO,
} from './parse'
import { roundBalancedDuration, roundNano } from './rounding'
import { TimeFields, timeFieldsToNano } from './time'
import {
  DAY,
  DateUnitInt,
  DayTimeUnitInt,
  HOUR,
  MICROSECOND,
  MILLISECOND,
  MINUTE,
  MONTH,
  NANOSECOND,
  SECOND,
  UnitInt,
  WEEK,
  YEAR,
  isDayTimeUnit,
  nanoInDayBI,
} from './units'
import { createZonedDateTime, diffAccurate } from './zonedDateTime'

export interface DurationTimeFields {
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  microseconds: number
  nanoseconds: number
}

export interface DurationFields extends DurationTimeFields {
  years: number
  months: number
  weeks: number
  days: number
}

export interface SignedDurationFields extends DurationFields {
  sign: CompareResult
}

export function refineDurationFields(fields: DurationLike): SignedDurationFields {
  const res = {} as SignedDurationFields
  let sign: CompareResult = 0

  for (const fieldName of durationUnitNames) { // will iterate own properties
    const fieldVal = Number(fields[fieldName as keyof DurationFields] || 0)
    const fieldSign = numSign(fields[fieldName as keyof DurationFields]!)

    if (fieldSign) {
      if (sign && sign !== fieldSign) {
        throw new RangeError('All fields must be same sign')
      }
      sign = fieldSign
    }

    if (!Number.isInteger(fieldVal)) {
      throw new RangeError('Duration fields must be integers')
    }

    res[fieldName as keyof DurationFields] = fieldVal
  }

  res.sign = sign
  return res
}

export function createDuration(fields: DurationLike): Duration {
  return new Duration(
    fields.years,
    fields.months,
    fields.weeks,
    fields.days,
    fields.hours,
    fields.minutes,
    fields.seconds,
    fields.milliseconds,
    fields.microseconds,
    fields.nanoseconds,
  )
}

export function addAndBalanceDurations(
  d0: Duration, // should be added to relativeToArg FIRST
  d1: Duration, // should be added to relativeToArg SECOND
  relativeToArg: ZonedDateTimeArg | DateTimeArg | undefined,
): Duration {
  const dayTimeFields0 = durationToDayTimeFields(d0)
  const dayTimeFields1 = durationToDayTimeFields(d1)
  const largestUnit = Math.max(
    computeLargestDurationUnit(d0),
    computeLargestDurationUnit(d1),
  ) as DayTimeUnitInt

  if (relativeToArg === undefined && dayTimeFields0 && dayTimeFields1) {
    return nanoToDuration(
      dayTimeFieldsToNano(dayTimeFields0) +
      dayTimeFieldsToNano(dayTimeFields1),
      largestUnit,
    )
  }

  let relativeTo = getMaybeZonedRelativeTo(relativeToArg)
  let translated = relativeTo.add(d0).add(d1)
  return diffAccurate(relativeTo, translated, largestUnit)
}

// no balancing
// TODO: rename to combineDurations or mergeDurations?
export function addDurations(d0: Duration, d1: Duration): Duration {
  return new Duration(
    d0.years + d1.years,
    d0.months + d1.months,
    d0.weeks + d1.weeks,
    d0.days + d1.days,
    d0.hours + d1.hours,
    d0.minutes + d1.minutes,
    d0.seconds + d1.seconds,
    d0.milliseconds + d1.milliseconds,
    d0.microseconds + d1.microseconds,
    d0.nanoseconds + d1.nanoseconds,
  )
}

export function addDaysToDuration(d: Duration, days: number): Duration {
  if (days) {
    d = addDurations(d, new Duration(0, 0, 0, days))
  }
  return d
}

export function balanceDuration(
  duration: Duration,
  largestUnit: UnitInt,
  relativeTo: DateLikeInstance,
): Duration {
  if (relativeTo instanceof PlainDate) {
    return balanceSimpleDuration(
      duration,
      Math.max(DAY, largestUnit) as DateUnitInt,
      relativeTo,
    )[0]
  } else {
    return balanceComplexDuration(duration, largestUnit, relativeTo)
  }
}

export function balanceSimpleDuration(
  duration: Duration,
  largestUnit: DateUnitInt,
  relativeTo: PlainDate,
): [Duration, PlainDate] {
  const translated = relativeTo.add(duration)
  const balanced = relativeTo.calendar.dateUntil(relativeTo, translated, {
    largestUnit: unitNames[largestUnit] as DateUnit,
  })
  return [balanced, translated]
}

export function balanceComplexDuration<T extends (ZonedDateTime | PlainDateTime)>(
  duration: Duration,
  largestUnit: UnitInt,
  relativeTo: T,
): Duration {
  // balancing does not care about weeks
  const forcedWeeks = largestUnit > WEEK && duration.weeks
  if (forcedWeeks) {
    duration = duration.with({ weeks: 0 })
  }

  const translated = relativeTo.add(duration) as T
  let balancedDuration = diffAccurate(relativeTo, translated, largestUnit)

  // add weeks back in
  if (forcedWeeks) {
    balancedDuration = addDurations(balancedDuration, new Duration(0, 0, forcedWeeks))
  }

  return balancedDuration
}

export function roundAndBalanceDuration(
  duration: Duration,
  options: DurationRoundingOptions,
): Duration {
  if (!isObjectLike(options)) {
    throw new TypeError('Must specify options') // best place for this?
  } else if (options.largestUnit === undefined && options.smallestUnit === undefined) {
    throw new RangeError('Must specify either largestUnit or smallestUnit')
  }

  const defaultLargestUnit = computeLargestDurationUnit(duration)
  const diffConfig = parseDiffOptions<Unit, UnitInt>(
    options,
    defaultLargestUnit, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    YEAR, // maxUnit
    false, // forInstant
    true, // forRounding
  )
  const { largestUnit, smallestUnit } = diffConfig
  const dayTimeFields = durationToDayTimeFields(duration)

  if (
    options.relativeTo === undefined && // skip this block if relativeTo defined
    dayTimeFields &&
    isDayTimeUnit(largestUnit) &&
    isDayTimeUnit(smallestUnit)
  ) {
    const nano = roundNano(
      dayTimeFieldsToNano(dayTimeFields),
      diffConfig as RoundingConfig<DayTimeUnitInt>,
    )
    const roundedFields = nanoToDayTimeFields(nano, largestUnit)
    return dayTimeFieldsToDuration(roundedFields)
  }

  // moral of story:
  // don't rely on Calendar::dateUntil to do balancing. Have no control over weeks

  const relativeTo = extractRelativeTo(options.relativeTo)
  const balancedDuration = balanceComplexDuration(
    duration,
    largestUnit,
    relativeTo,
  )

  return roundBalancedDuration(
    balancedDuration,
    diffConfig,
    relativeTo,
    relativeTo.add(balancedDuration),
  )
}

export function computeLargestDurationUnit(dur: Duration): UnitInt {
  /* eslint-disable */
  return dur.years ? YEAR :
    dur.months ? MONTH :
    dur.weeks ? WEEK :
    dur.days ? DAY :
    dur.hours ? HOUR :
    dur.minutes ? MINUTE :
    dur.seconds ? SECOND :
    dur.milliseconds ? MILLISECOND :
    dur.microseconds ? MICROSECOND : NANOSECOND
  /* eslint-enable */
}

export function compareDurations(
  arg0: DurationArg,
  arg1: DurationArg,
  relativeToArg: ZonedDateTimeArg | DateTimeArg | undefined,
): CompareResult {
  const duration0 = ensureObj(Duration, arg0) // TODO: do this in the caller?
  const duration1 = ensureObj(Duration, arg1)
  const dayTimeFields0 = durationToDayTimeFields(duration0)
  const dayTimeFields1 = durationToDayTimeFields(duration1)

  if (dayTimeFields0 && dayTimeFields1) {
    return compareValues(
      dayTimeFieldsToNano(dayTimeFields0),
      dayTimeFieldsToNano(dayTimeFields1),
    )
  }

  const relativeTo = getMaybeZonedRelativeTo(relativeToArg)
  const date0 = relativeTo.add(duration0)
  const date1 = relativeTo.add(duration1)

  if (relativeTo instanceof ZonedDateTime) {
    return ZonedDateTime.compare(date0 as ZonedDateTime, date1 as ZonedDateTime)
  }
  return PlainDateTime.compare(date0, date1)
}

export function nanoToDuration(nano: bigint, largestUnit: DayTimeUnitInt): Duration {
  return dayTimeFieldsToDuration(nanoToDayTimeFields(nano, largestUnit))
}

// works for TimeFields too
export function dayTimeFieldsToDuration(fields: Partial<DayTimeFields>): Duration {
  return new Duration(
    0, 0, 0,
    fields.day,
    fields.hour,
    fields.minute,
    fields.second,
    fields.millisecond,
    fields.microsecond,
    fields.nanosecond,
  )
}

// HACK
export function timeFieldsToDuration(fields: TimeFields): Duration {
  return new Duration(
    0, 0, 0, 0,
    fields.hour,
    fields.minute,
    fields.second,
    fields.millisecond,
    fields.microsecond,
    fields.nanosecond,
  )
}

export function durationToDayTimeFields(duration: Duration): DayTimeFields | undefined {
  if (!duration.years && !duration.months && !duration.weeks) {
    return {
      day: duration.days,
      ...durationToTimeFields(duration),
    }
  }
}

/*
Separates TimeFields from the duration, but first ensures that an excess of 24h of time overflows
into the days fields of the resulting Duration
*/
export function extractDurationTimeFields(duration: Duration): [TimeFields, Duration] {
  const timeNano = timeFieldsToNano(durationToTimeFields(duration))
  const days = timeNano / nanoInDayBI
  const leftoverTimeNano = timeNano - (days * nanoInDayBI)

  return [ // TODO: switch arg order?
    nanoToDayTimeFields(leftoverTimeNano, HOUR) as TimeFields, // TODO: easier to return nano?
    new Duration(
      duration.years,
      duration.months,
      duration.weeks,
      duration.days + Number(days),
    ),
  ]
}

export function extractBigDuration(duration: Duration): Duration {
  return new Duration(
    duration.years,
    duration.months,
    duration.weeks,
    duration.days,
  )
}

// internal util for converting between formats
export function durationToTimeFields(duration: Duration): TimeFields {
  return {
    hour: duration.hours,
    minute: duration.minutes,
    second: duration.seconds,
    millisecond: duration.milliseconds,
    microsecond: duration.microseconds,
    nanosecond: duration.nanoseconds,
  }
}

function getMaybeZonedRelativeTo(
  arg: ZonedDateTimeArg | DateTimeArg | undefined,
): ZonedDateTime | PlainDateTime {
  if (arg === undefined) {
    throw new RangeError('Need relativeTo') // TODO: reusable (how to mark function as "throwing"?)
  } else if (typeof arg === 'object') {
    if ((arg as ZonedDateTimeLike).timeZone !== undefined) {
      return ZonedDateTime.from(arg as ZonedDateTimeLike)
    } else {
      return PlainDateTime.from(arg)
    }
  } else {
    const isoFields = parseDateTimeISO(String(arg))
    if (isoFields.timeZone !== undefined) {
      return createZonedDateTime(
        refineZonedDateTimeParse(isoFields),
        undefined,
        OFFSET_PREFER,
      )
    } else {
      return createDateTime(refineDateTimeParse(isoFields))
    }
  }
}

export function extractRelativeTo(
  arg: ZonedDateTimeArg | DateTimeArg | undefined
): ZonedDateTime | PlainDateTime {
  if (arg === undefined) {
    // throws a RangeError as opposed to a TypeError because relativeTo is part of a larger obj
    throw new RangeError('Must specify relativeTo')
  }

  if (isObjectLike(arg)) {
    if (arg instanceof ZonedDateTime || arg instanceof PlainDateTime) {
      return arg
    }
    return ensureObj<ZonedDateTime | PlainDateTime, ZonedDateTimeLike, []>(
      (arg as ZonedDateTimeLike).timeZone !== undefined
        ? ZonedDateTime
        : PlainDateTime,
      arg as ZonedDateTimeLike
    )
  }

  // assume a string...

  // TODO: general toString util for ALL parsing that prevents parsing symbols
  // https://github.com/ljharb/es-abstract/blob/main/2020/ToString.js
  if (typeof arg === 'symbol') {
    throw new TypeError('Incorrect relativeTo type')
  }

  let parsed = tryParseDateTimeISO(String(arg))
  if (parsed) {
    if (parsed.timeZone !== undefined) {
      return createZonedDateTime(refineZonedDateTimeParse(parsed), undefined, OFFSET_REJECT)
    } else {
      return createDateTime(refineDateTimeParse(parsed))
    }
  }

  throw new RangeError('Invalid value of relativeTo')
}

type NumberHash = { [fieldName: string]: number }

export function negateFields(fields: NumberHash): NumberHash {
  return mapHash(
    fields,
    (num: number) => -num || 0, // avoids -0 (negative zeros)
  )
}
