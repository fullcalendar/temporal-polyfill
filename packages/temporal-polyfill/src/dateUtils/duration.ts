import { parseDiffOptions } from '../argParse/diffOptions'
import { RoundConfig } from '../argParse/roundOptions'
import { unitNames } from '../argParse/units'
import { CompareResult, DateUnit, DurationLike, DurationRoundOptions, Unit } from '../args'
import { Duration } from '../duration'
import { PlainDateTime } from '../plainDateTime'
import { numSign } from '../utils/math'
import { ZonedDateTime } from '../zonedDateTime'
import { ensureObj } from './abstract'
import { DateLikeInstance } from './calendar'
import { DayTimeFields, nanoToDayTimeFields } from './dayTime'
import { roundBalancedDuration, roundDayTimeFields } from './round'
import { TimeFields } from './time'
import {
  DAY,
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
} from './units'

export interface DurationFields {
  years: number
  months: number
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  microseconds: number
  nanoseconds: number
}

export interface SignedDurationFields extends DurationFields {
  sign: CompareResult
}

const durationFieldMap = {} as { [Key in keyof DurationFields]: (input: unknown) => number }
const durationUnitNames: (keyof DurationFields)[] = unitNames.map((unit) => {
  const key = (unit + 's') as keyof DurationFields // plural
  durationFieldMap[key] = Number
  return key
})
export { durationFieldMap, durationUnitNames }

export function refineDurationFields(fields: DurationLike): SignedDurationFields {
  const res = {} as SignedDurationFields
  let sign: CompareResult = 0

  for (const fieldName in Object.keys(durationFieldMap)) { // will iterate own properties
    const fieldVal = Number(fields[fieldName as keyof DurationFields] || 0)
    const fieldSign = numSign(fields[fieldName as keyof DurationFields]!)

    if (fieldSign) {
      if (sign && sign !== fieldSign) {
        throw new Error('All fields must be same sign')
      }
      sign = fieldSign
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

export function balanceComplexDuration(
  duration: Duration,
  largestUnit: UnitInt,
  relativeTo: DateLikeInstance | undefined,
): [Duration, DateLikeInstance] { // returns the SAME type of DateLikeInstance
  if (!relativeTo) {
    throw new Error('Need relativeTo')
  }
  const translatedDate = relativeTo.add(duration)

  // HACK casting to ZonedDateTime. translatedDate is same type as relativeTo, all that matters
  const balancedDuration = relativeTo.until(translatedDate as ZonedDateTime, {
    largestUnit: unitNames[largestUnit] as DateUnit,
  })

  return [balancedDuration, translatedDate]
}

export function balanceAndRoundDuration(
  duration: Duration,
  options: DurationRoundOptions,
): Duration {
  if (!options) {
    throw new Error('Must specify options')
  } else if (options.largestUnit == null && options.smallestUnit == null) {
    throw new Error('Must specify either largestUnit or smallestUnit')
  }

  const relativeToArg = options?.relativeTo
  const relativeTo = relativeToArg ? ensureObj(PlainDateTime, relativeToArg) : undefined

  const defaultLargestUnit = computeLargestDurationUnit(duration)
  const diffConfig = parseDiffOptions<Unit, UnitInt>(
    options,
    defaultLargestUnit, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    YEAR, // maxUnit
  )
  const { largestUnit, smallestUnit } = diffConfig

  const fields = durationToDayTimeFields(duration)
  if (fields && isDayTimeUnit(largestUnit) && isDayTimeUnit(smallestUnit)) {
    return dayTimeFieldsToDuration(
      roundDayTimeFields(fields, diffConfig as RoundConfig<DayTimeUnitInt>, largestUnit),
    )
  }

  const [balancedDuration, translatedDate] = balanceComplexDuration(
    duration,
    largestUnit,
    relativeTo, // error will be thrown if null
  )
  return roundBalancedDuration(
    balancedDuration,
    diffConfig,
    relativeTo!, // guaranteed non-null (or else error would have been thrown above)
    translatedDate,
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

export function nanoToDuration(nano: number, largestUnit: DayTimeUnitInt): Duration {
  return dayTimeFieldsToDuration(nanoToDayTimeFields(nano, largestUnit))
}

// works for TimeFields too
export function dayTimeFieldsToDuration(fields: DayTimeFields | TimeFields): Duration {
  return new Duration(
    0, 0,
    (fields as DayTimeFields).day || 0,
    fields.hour,
    fields.minute,
    fields.second,
    fields.millisecond,
    fields.microsecond,
    fields.nanosecond,
  )
}

export function durationToDayTimeFields(duration: Duration): DayTimeFields | undefined {
  if (!duration.years && !duration.months) {
    return {
      day: duration.days,
      ...durationToTimeFields(duration),
    }
  }
}

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
