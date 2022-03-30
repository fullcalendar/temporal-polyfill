import { unitNames } from '../argParse/unitStr'
import { epochNanoToISOFields, isoToEpochNano, timeFieldsToNano, timeISOToNano } from './isoMath'
import { TimeFields } from './types-private'
import { DayTimeUnitInt, NANOSECOND, nanoIn, nanoInDayBI } from './units'

export type DayTimeFields = TimeFields & { day: number }

export function dayTimeFieldsToNano(fields: DayTimeFields): bigint {
  return BigInt(fields.day) * nanoInDayBI + timeFieldsToNano(fields)
}

export function nanoToDayTimeFields(
  nano: bigint,
  largestUnit: DayTimeUnitInt,
): Partial<DayTimeFields> {
  const fields: Partial<DayTimeFields> = {}

  for (let unit = largestUnit; unit >= NANOSECOND; unit--) {
    const unitNano = BigInt(nanoIn[unit])
    const whole = nano / unitNano
    nano -= whole * unitNano
    fields[unitNames[unit] as keyof DayTimeFields] = Number(whole)
  }

  return fields
}

// returns [dayNano, timeNano]
// dayNano is guaranteed to be evenly divisible by nanoInDayBI
// TODO: should timeNano be a normal number?
export function splitEpochNano(epochNano: bigint): [bigint, bigint] {
  const isoFields = epochNanoToISOFields(epochNano)
  return [
    isoToEpochNano(isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay),
    timeISOToNano(isoFields),
  ]
}
