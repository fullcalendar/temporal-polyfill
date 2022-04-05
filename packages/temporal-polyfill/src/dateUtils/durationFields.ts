import { durationUnitNames } from '../argParse/unitStr'
import { CompareResult } from '../public/types'
import { numSign } from '../utils/math'
import { mapHashByKeys } from '../utils/obj'
import { DurationFields, UnsignedDurationFields } from './typesPrivate'
import { NANOSECOND, UnitInt, YEAR } from './units'

const durationFieldNames: (keyof DurationFields)[] =
  (durationUnitNames as (keyof DurationFields)[]).concat('sign')

type NumberFields = { [prop: string]: number }

export function negateDuration(fields: DurationFields): DurationFields {
  return mapHashByKeys(
    fields as unknown as NumberFields,
    durationFieldNames,
    (n: number) => -n || 0, // prevent -0 // TODO: make general util
  ) as unknown as DurationFields
}

export function absDuration(fields: DurationFields): DurationFields {
  return mapHashByKeys(
    fields as unknown as NumberFields,
    durationFieldNames,
    (n: number) => Math.abs(n), // TODO: make general util? Just pass-in Math.abs?
  ) as unknown as DurationFields
}

export function mergeDurations(d0: DurationFields, d1: DurationFields): DurationFields {
  return {
    sign: d0.sign || d1.sign,
    years: d0.years + d1.years,
    months: d0.months + d1.months,
    weeks: d0.weeks + d1.weeks,
    days: d0.days + d1.days,
    hours: d0.hours + d1.hours,
    minutes: d0.minutes + d1.minutes,
    seconds: d0.seconds + d1.seconds,
    milliseconds: d0.milliseconds + d1.milliseconds,
    microseconds: d0.microseconds + d1.microseconds,
    nanoseconds: d0.nanoseconds + d1.nanoseconds,
  }
}

export function refineDurationNumbers(unsignedFields: UnsignedDurationFields): DurationFields {
  const fields = signDuration(unsignedFields)
  const { sign } = fields

  for (const fieldName of durationUnitNames) {
    const fieldNum = fields[fieldName as keyof UnsignedDurationFields]
    const fieldSign = numSign(fields[fieldName as keyof UnsignedDurationFields]!)

    if (fieldSign && fieldSign !== sign) {
      throw new RangeError('All fields must be same sign')
    }

    if (!Number.isInteger(fieldNum)) {
      throw new RangeError('Duration fields must be integers')
    }
  }

  return fields
}

export function signDuration(fields: UnsignedDurationFields): DurationFields {
  return { ...fields, sign: computeDurationSign(fields) }
}

function computeDurationSign(fields: UnsignedDurationFields): CompareResult {
  let sign: CompareResult = 0

  for (const fieldName of durationUnitNames) {
    const fieldNum = fields[fieldName as keyof UnsignedDurationFields]

    if (fieldNum) {
      sign = numSign(fields[fieldName])
      break
    }
  }

  return sign
}

export function computeLargestDurationUnit(dur: DurationFields): UnitInt {
  let unit: UnitInt = YEAR

  while (
    unit > NANOSECOND &&
    !dur[durationUnitNames[unit]]
  ) {
    unit--
  }

  return (unit as UnitInt) // wtf
}